import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { generateWithAI } from '@/lib/ai';

// GET: Verificação de Webhook para Meta Cloud API Oficial
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'flowlevel_verify_token';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Webhook Meta] Verificado com sucesso!');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Token de verificação inválido' }, { status: 403 });
}

// POST: Receptor universal de mensagens WhatsApp + Motor de Atendimento IA Autônomo
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const payload = await request.json();

    console.log('[Webhook WhatsApp] Recebido evento:', JSON.stringify(payload).slice(0, 300));

    let senderPhone = '';
    let senderName = '';
    let messageText = '';
    let isFromMe = false;
    let isGroup = false;
    let targetInstanceOrPhone = '';

    // 1. Detectar payload da Evolution API
    if (payload.event === 'messages.upsert' || payload.data?.key) {
      const msgData = payload.data;
      const keyObj = msgData?.key || {};
      isFromMe = keyObj.fromMe || false;

      // Ignora mensagens enviadas pelo próprio sistema/atendente
      if (isFromMe) {
        return NextResponse.json({ status: 'ignored_from_me' });
      }

      const remoteJid = keyObj.remoteJid || '';
      isGroup = remoteJid.endsWith('@g.us') || remoteJid.includes('@broadcast');

      // Em novas versões do WhatsApp com privacidade/LID, o número real vem em remoteJidAlt
      const rawJid = keyObj.remoteJidAlt || remoteJid;
      senderPhone = rawJid.replace('@s.whatsapp.net', '').replace('@lid', '').replace(/[^0-9]/g, '');

      senderName = msgData?.pushName || `Contato ${senderPhone.slice(-4)}`;
      messageText =
        msgData?.message?.conversation ||
        msgData?.message?.extendedTextMessage?.text ||
        '[Mídia ou Áudio]';
      targetInstanceOrPhone = payload.instance || 'alves-climatiza--o---el-trica';
    }
    // 2. Detectar payload da Meta Cloud API Oficial
    else if (payload.object === 'whatsapp_business_account') {
      const entry = payload.entry?.[0];
      const change = entry?.changes?.[0]?.value;
      const message = change?.messages?.[0];

      if (!message || message.from === undefined) {
        return NextResponse.json({ status: 'no_message_in_payload' });
      }

      senderPhone = message.from.replace(/[^0-9]/g, '');
      const contactObj = change.contacts?.[0];
      senderName = contactObj?.profile?.name || `Contato ${senderPhone.slice(-4)}`;
      messageText = message.text?.body || '[Mídia ou Mensagem Oficial]';
      targetInstanceOrPhone = change.metadata?.phone_number_id || '';
    }
    // 3. Payload de teste / genérico
    else if (payload.phone && payload.text) {
      senderPhone = payload.phone.replace(/[^0-9]/g, '');
      senderName = payload.name || `Contato ${senderPhone.slice(-4)}`;
      messageText = payload.text;
      targetInstanceOrPhone = payload.subaccountId || 'alves-climatiza--o---el-trica';
    }

    if (!senderPhone || !messageText) {
      return NextResponse.json({ status: 'unsupported_payload_structure' }, { status: 400 });
    }

    // Identificar a subconta correta no Supabase
    let subaccount: any = null;
    const { data: subs } = await supabase.from('subaccounts').select('*');

    if (subs && subs.length > 0) {
      if (targetInstanceOrPhone) {
        subaccount = subs.find(
          (s) =>
            s.id === targetInstanceOrPhone ||
            s.phone.replace(/[^0-9]/g, '').includes(targetInstanceOrPhone) ||
            s.name.toLowerCase().includes('alves')
        );
      }
      if (!subaccount) {
        subaccount = subs[0]; // Padrão: primeira subconta ativa
      }
    }

    if (!subaccount) {
      return NextResponse.json({ error: 'Nenhuma subconta encontrada para associar a mensagem' }, { status: 404 });
    }

    // 4. Upsert Contato em whatsapp_contacts
    let contactId = '';
    const formattedPhone = senderPhone.length <= 11 ? `+55 ${senderPhone}` : `+${senderPhone}`;

    const { data: existingContact } = await supabase
      .from('whatsapp_contacts')
      .select('id, unread_count')
      .eq('subaccount_id', subaccount.id)
      .eq('phone', formattedPhone)
      .maybeSingle();

    if (existingContact) {
      contactId = existingContact.id;
      await supabase
        .from('whatsapp_contacts')
        .update({
          name: senderName,
          last_message: messageText,
          last_message_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread_count: (existingContact.unread_count || 0) + 1,
        })
        .eq('id', contactId);
    } else {
      const { data: newContact } = await supabase
        .from('whatsapp_contacts')
        .insert([
          {
            subaccount_id: subaccount.id,
            name: senderName,
            phone: formattedPhone,
            avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80`,
            last_message: messageText,
            last_message_time: 'Agora',
            unread_count: 1,
            tags: ['WhatsApp Inbound'],
          },
        ])
        .select()
        .single();
      contactId = newContact?.id;
    }

    // 5. Salvar Mensagem em whatsapp_messages
    if (contactId) {
      await supabase.from('whatsapp_messages').insert([
        {
          subaccount_id: subaccount.id,
          contact_id: contactId,
          sender: 'contact',
          text: messageText,
          status: 'delivered',
        },
      ]);
    }

    // 6. MOTOR DE CAPTURA AUTOMÁTICA DE LEADS NO CRM KANBAN
    let leadCreated = false;
    let leadId = '';

    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('subaccount_id', subaccount.id)
      .eq('phone', formattedPhone)
      .maybeSingle();

    if (!existingLead) {
      // Buscar primeiro estágio do Kanban (Novos Leads)
      const { data: stages } = await supabase
        .from('pipeline_stages')
        .select('id')
        .eq('subaccount_id', subaccount.id)
        .order('sort_order', { ascending: true })
        .limit(1);

      const firstStageId = stages?.[0]?.id || null;

      const { data: createdLead } = await supabase
        .from('leads')
        .insert([
          {
            subaccount_id: subaccount.id,
            stage_id: firstStageId,
            name: senderName,
            phone: formattedPhone,
            value: 0.0,
            tags: ['WhatsApp Inbound', 'Lead Automático'],
            notes: `Origem: Mensagem inicial no WhatsApp:\n"${messageText}"`,
            status: 'open',
            last_activity: 'Mensagem recebida no WhatsApp agora',
          },
        ])
        .select()
        .single();

      leadCreated = true;
      leadId = createdLead?.id;
      console.log(`[Webhook WhatsApp] Novo Lead criado automaticamente no CRM! ID: ${leadId}`);
    }

    // 7. MOTOR DE CHATBOT IA AUTÔNOMO (Responde o cliente de volta no WhatsApp em tempo real)
    let botReplied = false;
    let botReplyText = '';

    const EVOLUTION_URL = process.env.EVOLUTION_API_URL || 'https://evolution-api-kix9.onrender.com';
    const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || 'flowlevel_secret_key_2026';
    const activeInstance = targetInstanceOrPhone || 'alves-climatiza--o---el-trica';

    if (!isGroup && senderPhone && messageText && messageText !== '[Mídia ou Áudio]') {
      try {
        const aiPrompt = `Você é a atendente virtual e especialista comercial da empresa "${subaccount.name}" (segmento: ${subaccount.segment || 'Serviços'}).
O cliente se chama "${senderName}" e enviou a seguinte mensagem no WhatsApp:
"${messageText}"

Gere uma resposta educada, acolhedora, profissional e objetiva (máximo 2 frases) para responder imediatamente ao cliente no WhatsApp, tirando dúvidas ou perguntando como podemos ajudá-lo hoje. Responda de forma humanizada e não use placeholders como [Seu Nome].`;

        botReplyText = await generateWithAI({ prompt: aiPrompt });

        if (botReplyText && botReplyText.trim()) {
          console.log(`[AI Chatbot] Resposta para ${senderPhone}: "${botReplyText.slice(0, 80)}..."`);

          // Disparar resposta no WhatsApp via Evolution API
          const sendRes = await fetch(`${EVOLUTION_URL}/message/sendText/${encodeURIComponent(activeInstance)}`, {
            method: 'POST',
            headers: {
              'apikey': EVOLUTION_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              number: senderPhone,
              text: botReplyText,
            }),
          });

          console.log(`[AI Chatbot Disparo] Status de envio: ${sendRes.status}`);

          if (sendRes.ok) {
            botReplied = true;

            // Salvar resposta do robô no Supabase
            if (contactId) {
              await supabase.from('whatsapp_messages').insert([
                {
                  subaccount_id: subaccount.id,
                  contact_id: contactId,
                  sender: 'agent',
                  text: botReplyText,
                  status: 'sent',
                },
              ]);

              await supabase
                .from('whatsapp_contacts')
                .update({
                  last_message: botReplyText,
                  last_message_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                })
                .eq('id', contactId);
            }
          }
        }
      } catch (aiErr: any) {
        console.error('[AI Chatbot Erro]', aiErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      subaccountId: subaccount.id,
      subaccountName: subaccount.name,
      contactId,
      leadCreated,
      leadId,
      messageText,
      botReplied,
      botReply: botReplyText,
    });
  } catch (err: any) {
    console.error('[Webhook WhatsApp Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
