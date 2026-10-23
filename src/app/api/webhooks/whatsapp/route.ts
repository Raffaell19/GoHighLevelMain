import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { generateWithAI } from '@/lib/ai';
import { fetchWhatsAppProfilePicture, getDefaultAvatarUrl, isRealAvatar } from '@/lib/whatsapp-avatar';
import { formatFullPhoneNumber, isUnidentifiedContactName } from '@/lib/phone';

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
      isGroup =
        remoteJid.endsWith('@g.us') ||
        remoteJid.includes('@broadcast') ||
        remoteJid.includes('@newsletter') ||
        remoteJid.includes('@lid');

      // Ignora estritamente grupos e listas de transmissão para não poluir contatos e CRM
      if (isGroup) {
        console.log(`[Webhook WhatsApp] Ignorando mensagem de grupo/transmissão: ${remoteJid}`);
        return NextResponse.json({ status: 'ignored_group' });
      }

      // Em novas versões do WhatsApp com privacidade/LID, o número real vem em remoteJidAlt
      const rawJid = keyObj.remoteJidAlt || remoteJid;
      senderPhone = rawJid.replace('@s.whatsapp.net', '').replace('@lid', '').replace(/[^0-9]/g, '');

      senderName = msgData?.pushName?.trim() || formatFullPhoneNumber(senderPhone);
      messageText =
        msgData?.message?.conversation ||
        msgData?.message?.extendedTextMessage?.text ||
        '[Mídia ou Áudio]';
      targetInstanceOrPhone = payload.instance || 'connect-digital';
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
      senderName = contactObj?.profile?.name?.trim() || formatFullPhoneNumber(senderPhone);
      messageText = message.text?.body || '[Mídia ou Mensagem Oficial]';
      targetInstanceOrPhone = change.metadata?.phone_number_id || '';
    }
    // 3. Payload de teste / genérico
    else if (payload.phone && payload.text) {
      senderPhone = payload.phone.replace(/[^0-9]/g, '');
      senderName = payload.name?.trim() || formatFullPhoneNumber(senderPhone);
      messageText = payload.text;
      targetInstanceOrPhone = payload.subaccountId || 'connect-digital';
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
            s.name.toLowerCase().includes('connect')
        );
      }
      if (!subaccount) {
        subaccount = subs[0]; // Padrão: primeira subconta ativa
      }
    }

    if (!subaccount) {
      return NextResponse.json({ error: 'Nenhuma subconta encontrada para associar a mensagem' }, { status: 404 });
    }

    // 4. Upsert Contato em whatsapp_contacts com Resolução Flexível de Telefone
    let contactId = '';
    const cleanSenderDigits = senderPhone.replace(/[^0-9]/g, '');
    const cleanLast8 = cleanSenderDigits.slice(-8);
    const formattedPhone = cleanSenderDigits.length <= 11 ? `+55 ${cleanSenderDigits}` : `+${cleanSenderDigits}`;

    // Buscar contatos da subconta para match flexível de telefone (DDI, DDD, 9º dígito)
    const { data: subContacts } = await supabase
      .from('whatsapp_contacts')
      .select('id, unread_count, tags, phone, name, avatar')
      .eq('subaccount_id', subaccount.id);

    const existingContact = (subContacts || []).find((c: any) => {
      const cDigits = (c.phone || '').replace(/[^0-9]/g, '');
      return (
        cDigits === cleanSenderDigits ||
        (cleanLast8.length === 8 && cDigits.endsWith(cleanLast8)) ||
        (cDigits.length >= 8 && cleanSenderDigits.endsWith(cDigits.slice(-8)))
      );
    });

    // Detectar objeção explícita na mensagem do lead
    const lowerInboundMsg = messageText.toLowerCase();
    const isObjection =
      lowerInboundMsg.includes('não tenho interesse') ||
      lowerInboundMsg.includes('nao tenho interesse') ||
      lowerInboundMsg.includes('sem interesse') ||
      lowerInboundMsg.includes('retire meu') ||
      lowerInboundMsg.includes('tirar meu') ||
      lowerInboundMsg.includes('pare de enviar') ||
      lowerInboundMsg.includes('não quero') ||
      lowerInboundMsg.includes('nao quero');

    if (existingContact) {
      contactId = existingContact.id;
      const curTags: string[] = Array.isArray(existingContact.tags) ? existingContact.tags : [];
      const updatedTags = new Set(
        curTags.filter(
          (t: string) =>
            t !== '#AguardandoDecisor' &&
            !t.startsWith('#Aguardando_Resposta_Msg')
        )
      );

      if (isObjection) {
        updatedTags.add('#SemInteresse');
        updatedTags.add('#RespondeuWhatsApp');
      } else {
        updatedTags.add('#RespondeuWhatsApp');

        // Se recebeu o Passo 1 e ainda não avançou para o Passo 2 -> Pronto p/ Msg 2!
        if (curTags.includes('#Msg1_Enviada') && !curTags.includes('#Msg2_Enviada')) {
          updatedTags.add('#Respondeu_Msg1');
          updatedTags.add('#Pronto_Msg2');
        }
        // Se recebeu o Passo 2 e ainda não avançou para o Passo 3 -> Pronto p/ Msg 3!
        else if (curTags.includes('#Msg2_Enviada') && !curTags.includes('#Msg3_Enviada')) {
          updatedTags.add('#Respondeu_Msg2');
          updatedTags.add('#Pronto_Msg3');
        }
        // Se recebeu o Passo 3 -> Concluído!
        else if (curTags.includes('#Msg3_Enviada')) {
          updatedTags.add('#Respondeu_Msg3');
          updatedTags.add('#Concluido');
        }
        // Se não tinha tag de envio explícito (ex: disparo feito antes ou lead respondeu de início)
        else {
          updatedTags.add('#Msg1_Enviada');
          updatedTags.add('#Respondeu_Msg1');
          updatedTags.add('#Pronto_Msg2');
        }
      }

      let contactAvatar = existingContact.avatar;
      if (!isRealAvatar(contactAvatar) && cleanSenderDigits) {
        const fetchedPic = await fetchWhatsAppProfilePicture(cleanSenderDigits, targetInstanceOrPhone);
        if (fetchedPic) contactAvatar = fetchedPic;
      }

      const isExistingNameUnidentified = isUnidentifiedContactName(existingContact.name);
      const isSenderNameIdentified = !isUnidentifiedContactName(senderName);
      const resolvedContactName = isSenderNameIdentified
        ? senderName
        : (!isExistingNameUnidentified ? existingContact.name : senderName);

      await supabase
        .from('whatsapp_contacts')
        .update({
          name: resolvedContactName,
          last_message: messageText,
          last_message_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread_count: (existingContact.unread_count || 0) + 1,
          tags: Array.from(updatedTags),
          avatar: isRealAvatar(contactAvatar) ? contactAvatar : getDefaultAvatarUrl(resolvedContactName),
        })
        .eq('id', contactId);
    } else {
      const initialTags = ['WhatsApp Inbound', '#RespondeuWhatsApp'];
      if (isObjection) {
        initialTags.push('#SemInteresse');
      } else {
        initialTags.push('#Msg1_Enviada', '#Respondeu_Msg1', '#Pronto_Msg2');
      }

      let contactAvatar: string | null = null;
      if (cleanSenderDigits) {
        contactAvatar = await fetchWhatsAppProfilePicture(cleanSenderDigits, targetInstanceOrPhone);
      }
      if (!contactAvatar) {
        contactAvatar = getDefaultAvatarUrl(senderName);
      }

      const { data: newContact } = await supabase
        .from('whatsapp_contacts')
        .insert([
          {
            id: crypto.randomUUID(),
            subaccount_id: subaccount.id,
            name: senderName,
            phone: `+${cleanSenderDigits}`,
            avatar: contactAvatar,
            last_message: messageText,
            last_message_time: 'Agora',
            unread_count: 1,
            tags: initialTags,
          },
        ])
        .select()
        .maybeSingle();

      contactId = newContact?.id || '';
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
      .select('id, name')
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
    } else if (existingLead && isUnidentifiedContactName(existingLead.name) && !isUnidentifiedContactName(senderName)) {
      await supabase
        .from('leads')
        .update({ name: senderName })
        .eq('id', existingLead.id);
    }

    // 7. MOTOR DE CHATBOT IA AUTÔNOMO TREINADO (Responde o cliente de volta no WhatsApp em tempo real)
    let botReplied = false;
    let botReplyText = '';

    const EVOLUTION_URL = process.env.EVOLUTION_API_URL || 'https://evolution-api-kix9.onrender.com';
    const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || 'flowlevel_secret_key_2026';
    const activeInstance = targetInstanceOrPhone || 'connect-digital';

    if (!isGroup && senderPhone && messageText && messageText !== '[Mídia ou Áudio]') {
      try {
        // 7.1 Buscar configuração e treinamento personalizado do Atendente IA
        let credQuery = await supabase
          .from('tenant_credentials')
          .select('encrypted_credentials')
          .eq('subaccount_id', subaccount.id)
          .eq('service_type', 'ai_agent_config')
          .maybeSingle();

        let cred = credQuery.data;
        if (!cred) {
          const { data: fallbackCred } = await supabase
            .from('tenant_credentials')
            .select('encrypted_credentials')
            .eq('service_type', 'ai_agent_config')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (fallbackCred) {
            cred = fallbackCred;
          }
        }

        let agentConfig: any = {
          botName: 'Sofia',
          botRole: 'Consultora Especialista em Atendimento & Vendas',
          botTone: 'consultive',
          botEnabled: false, // Padrão: Desativado até confirmação explícita de ativação no botão
          servicesAndPricing: 'Serviços especializados com orçamento sob medida.',
          coverageAreas: 'Consulte disponibilidade da nossa equipe.',
          paymentTerms: 'Cartão de crédito, PIX ou boleto.',
          customInstructions: 'Seja cordial e concisa.',
          humanHandoffKeywords: 'atendente, humano, falar com atendente, pessoa, urgente',
        };

        if (cred && cred.encrypted_credentials) {
          try {
            const parsed = JSON.parse(cred.encrypted_credentials);
            agentConfig = { ...agentConfig, ...parsed };
          } catch (e) {
            console.error('[AI Chatbot] Erro ao decodificar config do agente:', e);
          }
        }

        // Validação estrita: O atendente SÓ responde se botEnabled for explicitamente TRUE
        const isBotActive = agentConfig.botEnabled === true || agentConfig.botEnabled === 'true';

        if (!isBotActive) {
          console.log(`[AI Chatbot] 🛑 Piloto Automático DESATIVADO para ${subaccount.name}. Sofia NÃO responderá ao lead ${senderPhone}.`);
        } else {
          // Verificar gatilho de transbordo humano
          const lowerMsg = messageText.toLowerCase();
          const triggers = (agentConfig.humanHandoffKeywords || 'atendente, humano')
            .split(',')
            .map((k: string) => k.trim().toLowerCase())
            .filter(Boolean);

          const isHandoff = triggers.some((trig: string) => lowerMsg.includes(trig));

          // Buscar histórico recente da conversa para contexto
          let historyText = '';
          if (contactId) {
            const { data: recentMsgs } = await supabase
              .from('whatsapp_messages')
              .select('sender, text')
              .eq('contact_id', contactId)
              .order('created_at', { ascending: false })
              .limit(4);

            if (recentMsgs && recentMsgs.length > 0) {
              historyText = recentMsgs
                .reverse()
                .map((m) => `[${m.sender === 'contact' ? 'Cliente' : 'Atendente'}]: ${m.text}`)
                .join('\n');
            }
          }

          let aiPrompt = '';
          if (isHandoff) {
            botReplyText = `Olá, ${senderName}! Perfeito. Já sinalizei para a nossa equipe e em instantes um de nossos atendentes humanos vai assumir a conversa para lhe atender pessoalmente por aqui.`;
          } else {
            aiPrompt = `Você é "${agentConfig.botName || 'Sofia'}", ${agentConfig.botRole || 'Consultora Especialista'} da empresa "${subaccount.name}" (${subaccount.segment || 'Serviços'}).

Seu tom de atendimento deve ser: ${agentConfig.botTone || 'consultivo, empático e acolhedor'}.

BASE DE CONHECIMENTO DA EMPRESA:
- SERVIÇOS & TABELA DE PREÇOS ESTIMADOS:
${agentConfig.servicesAndPricing || 'Serviços especializados com orçamento sob medida.'}

- REGIÕES ATENDIDAS:
${agentConfig.coverageAreas || 'Consulte disponibilidade da nossa equipe técnica.'}

- CONDIÇÕES DE PAGAMENTO:
${agentConfig.paymentTerms || 'Cartão, Pix e Boleto.'}

- HORÁRIO DE ATENDIMENTO:
${agentConfig.businessHours || 'Horário comercial.'}

- INSTRUÇÕES ESPECIAIS DE ATENDIMENTO:
${agentConfig.customInstructions || 'Seja prestativo e colete informações sobre o serviço necessário.'}

${historyText ? `HISTÓRICO RECENTE DA CONVERSA:\n${historyText}\n` : ''}
DADOS DA MENSAGEM DO CLIENTE:
- Nome do cliente: "${senderName}"
- Mensagem recebida no WhatsApp: "${messageText}"

REGRAS CRÍTICAS DE COERÊNCIA E NATURALIDADE CONVERSACIONAL:
1. Responda DIRETAMENTE E EXCLUSIVAMENTE ao que o cliente falou:
   - Se o cliente apenas enviou uma SAUDAÇÃO (ex: "Boa noite tudo bem?", "Olá", "Oi"): retribua o cumprimento de forma educada, amigável e natural (ex: "Boa noite, ${senderName}! Tudo ótimo por aqui, e com você? Sou a Sofia. Como posso te ajudar hoje?"). NUNCA pergunte sobre aparelhos, fiação ou envie tabela de preços para um simples cumprimento!
   - Se o cliente perguntou sobre SERVIÇOS ELÉTRICOS (ex: troca de fiação, painel/quadro elétrico, disjuntores, tomadas, reparos elétricos): NUNCA pergunte modelo ou capacidade de ar-condicionado ou BTUs! Serviços elétricos residenciais não são aparelhos. Responda com acolhimento e autoridade técnica explicando que para troca de fiação ou painel elétrico realizamos uma visita técnica de avaliação para dimensionar a carga com segurança e passar o orçamento exato, e pergunte em qual cidade/bairro fica o imóvel.
   - Se o cliente perguntou sobre AR-CONDICIONADO / CLIMATIZAÇÃO (ex: instalar ar, higienização, vazamento de gás): aí sim informe os valores de referência da tabela e pergunte qual o modelo/capacidade de BTUs do aparelho e o bairro.
   - Se o cliente AGRADECEU ou CONFIRMOU: finalize de forma cordial e prestativa.
2. Seja natural, humanizado e objetivo (2 a 3 frases concisas, perfeitas para WhatsApp).
3. Nunca invente informações fora do escopo da empresa ou use placeholders como [Seu Nome].`;

            botReplyText = await generateWithAI({
              prompt: aiPrompt,
              apiKey: agentConfig.geminiApiKey || agentConfig.openaiApiKey,
              provider: agentConfig.geminiApiKey ? 'gemini' : agentConfig.openaiApiKey ? 'openai' : undefined,
            });
          }

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
                    sender: 'bot',
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
