import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

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

// POST: Receptor universal de mensagens WhatsApp (Evolution API & Meta Cloud API)
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const payload = await request.json();

    console.log('[Webhook WhatsApp] Recebido evento:', JSON.stringify(payload).slice(0, 300));

    let senderPhone = '';
    let senderName = '';
    let messageText = '';
    let isFromMe = false;
    let targetInstanceOrPhone = '';

    // 1. Detectar payload da Evolution API
    if (payload.event === 'messages.upsert' || payload.data?.key) {
      const msgData = payload.data;
      isFromMe = msgData?.key?.fromMe || false;

      // Ignora mensagens enviadas pelo próprio sistema/atendente
      if (isFromMe) {
        return NextResponse.json({ status: 'ignored_from_me' });
      }

      const remoteJid = msgData?.key?.remoteJid || '';
      senderPhone = remoteJid.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, '');
      senderName = msgData?.pushName || `Contato ${senderPhone.slice(-4)}`;
      messageText =
        msgData?.message?.conversation ||
        msgData?.message?.extendedTextMessage?.text ||
        '[Mídia ou Áudio]';
      targetInstanceOrPhone = payload.instance || '';
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
      targetInstanceOrPhone = payload.subaccountId || '';
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
            s.phone.replace(/[^0-9]/g, '').includes(targetInstanceOrPhone)
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

    return NextResponse.json({
      success: true,
      subaccountId: subaccount.id,
      subaccountName: subaccount.name,
      contactId,
      leadCreated,
      leadId,
      messageText,
    });
  } catch (err: any) {
    console.error('[Webhook WhatsApp Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
