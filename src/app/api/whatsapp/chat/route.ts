import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { fetchWhatsAppProfilePicture, getDefaultAvatarUrl, isRealAvatar } from '@/lib/whatsapp-avatar';

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || 'https://evolution-api-kix9.onrender.com';
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || 'flowlevel_secret_key_2026';

function isUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// GET: Buscar contatos e mensagens da subconta (com resolução automática de tenant)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subaccountId = searchParams.get('subaccountId');

    const supabase = getServiceSupabase();

    let resolvedSubId = isUuid(subaccountId) ? subaccountId : null;

    // Se o subaccountId for 'sub-1' ou nulo, busca a primeira subconta real do banco
    if (!resolvedSubId) {
      const { data: subs } = await supabase.from('subaccounts').select('id').limit(1);
      if (subs && subs.length > 0) {
        resolvedSubId = subs[0].id;
      }
    }

    // 1. Buscar contatos ordenados por última atualização
    let contactQuery = supabase.from('whatsapp_contacts').select('*').order('created_at', { ascending: false });
    if (resolvedSubId) {
      contactQuery = contactQuery.eq('subaccount_id', resolvedSubId);
    }
    const { data: contacts, error: errC } = await contactQuery;

    if (errC) {
      console.error('[Chat API] Erro ao buscar contatos:', errC);
      return NextResponse.json({ error: errC.message }, { status: 500 });
    }

    // 2. Buscar mensagens
    let messageQuery = supabase.from('whatsapp_messages').select('*').order('created_at', { ascending: true });
    if (resolvedSubId) {
      messageQuery = messageQuery.eq('subaccount_id', resolvedSubId);
    }
    const { data: messages, error: errM } = await messageQuery;

    if (errM) {
      console.error('[Chat API] Erro ao buscar mensagens:', errM);
      return NextResponse.json({ error: errM.message }, { status: 500 });
    }

    // Agrupar mensagens por contact_id e mapear último timestamp de atividade
    const groupedMessages: Record<string, any[]> = {};
    const lastMsgTimes: Record<string, number> = {};

    (messages || []).forEach((m) => {
      if (!groupedMessages[m.contact_id]) {
        groupedMessages[m.contact_id] = [];
      }
      const msgDate = new Date(m.created_at).getTime();
      if (!lastMsgTimes[m.contact_id] || msgDate > lastMsgTimes[m.contact_id]) {
        lastMsgTimes[m.contact_id] = msgDate;
      }
      groupedMessages[m.contact_id].push({
        id: m.id,
        contactId: m.contact_id,
        sender: m.sender,
        text: m.text,
        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: m.status,
      });
    });

    // Identificar contatos onde a IA realmente foi ativada (possuem mensagens do bot)
    const botContactIds = new Set(
      (messages || [])
        .filter((m) => m.sender === 'bot')
        .map((m) => m.contact_id)
    );

    // Filtrar para descartar grupos/broadcasts e incluir contatos com mensagens, prospecções ou IA
    const validContacts = (contacts || []).filter((c) => {
      const isGroup =
        c.phone?.startsWith('+120') ||
        c.name?.includes('@lid') ||
        c.name?.toLowerCase().includes('grupo');
      if (isGroup) return false;
      const hasMsgs = !!groupedMessages[c.id] && groupedMessages[c.id].length > 0;
      const isOutreach = Array.isArray(c.tags) && c.tags.some((t: string) => 
        t.toLowerCase().includes('prospec') || 
        t.toLowerCase().includes('disparo') || 
        t.toLowerCase().includes('decisor')
      );
      const activatedAi = botContactIds.has(c.id);
      return hasMsgs || isOutreach || activatedAi || true; // Inclui contatos individuais reais
    });

    const formattedContacts = validContacts.map((c) => ({
      id: c.id,
      subaccountId: c.subaccount_id || resolvedSubId,
      name: c.name || 'Contato WhatsApp',
      phone: c.phone || '',
      avatar: isRealAvatar(c.avatar) ? c.avatar : getDefaultAvatarUrl(c.name),
      lastMessage: c.last_message || '',
      lastMessageTime: c.last_message_time || 'Agora',
      unreadCount: c.unread_count || 0,
      tags: c.tags || ['WhatsApp IA'],
      lastActivityTime: lastMsgTimes[c.id] || new Date(c.created_at).getTime(),
    }));

    // Se algum contato estiver com avatar legado ou sem foto real, busca em background
    validContacts.forEach((c) => {
      if (!isRealAvatar(c.avatar) && c.phone) {
        fetchWhatsAppProfilePicture(c.phone)
          .then((picUrl) => {
            if (picUrl) {
              supabase
                .from('whatsapp_contacts')
                .update({ avatar: picUrl })
                .eq('id', c.id)
                .then(() => {});
            }
          })
          .catch(() => {});
      }
    });

    // Ordenar contatos: quem teve mensagem mais recente fica no topo!
    formattedContacts.sort((a, b) => b.lastActivityTime - a.lastActivityTime);

    return NextResponse.json({
      contacts: formattedContacts,
      messages: groupedMessages,
    });
  } catch (error: any) {
    console.error('[Chat API] Erro geral:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper para formatar telefone brasileiro com DDI 55
function formatWhatsAppPhone(phone: string): string {
  let clean = (phone || '').replace(/[^0-9]/g, '');
  if (!clean) return '';
  if (clean.startsWith('0')) clean = clean.slice(1);
  if (clean.length === 10 || clean.length === 11) {
    clean = `55${clean}`;
  }
  return clean;
}

// Helper para descobrir a instância realmente ativa e conectada na Evolution API
async function resolveActiveInstance(preferred?: string): Promise<string> {
  const primary = preferred || 'alves-climatiza--o---el-trica';
  try {
    // 1. Testa se a instância informada está aberta/conectada
    const checkRes = await fetch(`${EVOLUTION_URL}/instance/connectionState/${encodeURIComponent(primary)}`, {
      headers: { apikey: EVOLUTION_KEY },
      cache: 'no-store',
    });
    const checkData = await checkRes.json().catch(() => ({}));
    if (checkRes.ok && checkData?.instance?.state === 'open') {
      return primary;
    }

    // 2. Se não estiver aberta, busca na Evolution API qual instância está 'open'
    const listRes = await fetch(`${EVOLUTION_URL}/instance/fetchInstances`, {
      headers: { apikey: EVOLUTION_KEY },
      cache: 'no-store',
    });
    const listData = await listRes.json().catch(() => []);
    if (Array.isArray(listData)) {
      const openInst = listData.find(
        (i: any) => i.connectionStatus === 'open' || i.state === 'open'
      );
      if (openInst?.name) {
        console.log(`[Chat API] Roteando envio para instância ativa: ${openInst.name}`);
        return openInst.name;
      }
    }
  } catch (err) {
    console.warn('[Chat API] Erro ao resolver instância ativa:', err);
  }
  return primary;
}

// POST: Enviar mensagem para o cliente via Evolution API e salvar no banco
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      contactId,
      phone,
      text,
      subaccountId,
      instanceName,
      mediaUrl,
      mediaType,
      tags,
      name,
      stepNumber,
    } = body;

    if (!text && !mediaUrl) {
      return NextResponse.json({ error: 'Mensagem ou áudio é obrigatório' }, { status: 400 });
    }

    const cleanPhone = formatWhatsAppPhone(phone);
    if (!cleanPhone && !contactId) {
      return NextResponse.json({ error: 'Telefone do contato é obrigatório' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    let resolvedSubId = isUuid(subaccountId) ? subaccountId : null;
    if (!resolvedSubId) {
      const { data: subs } = await supabase.from('subaccounts').select('id').limit(1);
      if (subs && subs.length > 0) {
        resolvedSubId = subs[0].id;
      }
    }

    // Resolver dinamicamente a instância que está com WhatsApp aberto/conectado
    const activeInstance = await resolveActiveInstance(instanceName);

    let evoSendSuccess = false;
    let evoResponseData: any = null;

    // 1. Enviar mensagem real via Evolution API (Texto ou Áudio PTT)
    if (cleanPhone) {
      try {
        if (mediaType === 'audio' && mediaUrl) {
          // Envio de Áudio PTT Real
          const evoRes = await fetch(
            `${EVOLUTION_URL}/message/sendWhatsAppAudio/${encodeURIComponent(activeInstance)}`,
            {
              method: 'POST',
              headers: {
                apikey: EVOLUTION_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                number: cleanPhone,
                audio: mediaUrl,
                delay: 1200,
                encoding: true,
              }),
            }
          );
          evoResponseData = await evoRes.json().catch(() => ({}));
          evoSendSuccess = evoRes.ok && !evoResponseData?.error;
          console.log('[Chat API] Envio Áudio Evolution API:', evoRes.status, evoResponseData);
        } else {
          // Envio de Mensagem de Texto
          const evoRes = await fetch(
            `${EVOLUTION_URL}/message/sendText/${encodeURIComponent(activeInstance)}`,
            {
              method: 'POST',
              headers: {
                apikey: EVOLUTION_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                number: cleanPhone,
                text: text || '',
              }),
            }
          );
          evoResponseData = await evoRes.json().catch(() => ({}));
          evoSendSuccess = evoRes.ok && !evoResponseData?.error;
          console.log('[Chat API] Envio Texto Evolution API:', evoRes.status, evoResponseData);
        }
      } catch (evoErr: any) {
        console.error('[Chat API] Erro ao enviar pela Evolution API:', evoErr);
        evoResponseData = { error: evoErr?.message || 'Erro de conexão com Evolution API' };
      }
    }

    // 2. Localizar ou Criar Contato em whatsapp_contacts com as Tags de Cadência Atualizadas
    const cleanDigits = cleanPhone.replace(/[^0-9]/g, '');
    const last8 = cleanDigits.slice(-8);

    const { data: existingContacts } = await supabase
      .from('whatsapp_contacts')
      .select('*')
      .eq('subaccount_id', resolvedSubId);

    const targetContact = (existingContacts || []).find((c: any) => {
      if (contactId && isUuid(contactId) && c.id === contactId) return true;
      const cDigits = (c.phone || '').replace(/[^0-9]/g, '');
      return (
        cDigits === cleanDigits ||
        (last8.length === 8 && cDigits.endsWith(last8)) ||
        (cDigits.length >= 8 && cleanDigits.endsWith(cDigits.slice(-8)))
      );
    });

    // Calcular tags consolidadas da cadência
    const stepNum = Number(stepNumber) || 1;
    const existingTags: string[] = Array.isArray(targetContact?.tags) ? targetContact.tags : [];
    const passedTags: string[] = Array.isArray(tags) ? tags : [];

    const baseTags = [...existingTags, ...passedTags].filter(
      (t) =>
        t !== `#Aguardando_Resposta_Msg${stepNum}` &&
        t !== `#Pronto_Msg${stepNum}` &&
        t !== `#Respondeu_Msg${stepNum}` &&
        t !== `#AguardandoDecisor`
    );

    const newTagsSet = new Set([
      ...baseTags,
      `#Msg${stepNum}_Enviada`,
      `#Passo${stepNum}_Enviado`,
      `#Aguardando_Resposta_Msg${stepNum}`,
    ]);
    if (passedTags.includes('#ProspeccaoMaps')) newTagsSet.add('#ProspeccaoMaps');
    const finalTags = Array.from(newTagsSet);

    let savedContact: any = null;
    let resolvedContactId = '';

    if (targetContact) {
      resolvedContactId = targetContact.id;
      let contactAvatar = targetContact.avatar;
      if (!isRealAvatar(contactAvatar) && cleanPhone) {
        const fetchedPic = await fetchWhatsAppProfilePicture(cleanPhone, activeInstance);
        if (fetchedPic) contactAvatar = fetchedPic;
      }

      const { data: updatedContact, error: upErr } = await supabase
        .from('whatsapp_contacts')
        .update({
          last_message: text || (mediaType === 'audio' ? '🎙️ Mensagem de Voz' : 'Mensagem enviada'),
          last_message_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread_count: 0,
          tags: finalTags,
          name: targetContact.name && targetContact.name !== 'Contato WhatsApp' ? targetContact.name : (name || targetContact.name || 'Contato WhatsApp'),
          avatar: isRealAvatar(contactAvatar) ? contactAvatar : getDefaultAvatarUrl(name || targetContact.name),
        })
        .eq('id', targetContact.id)
        .select()
        .maybeSingle();

      if (upErr) console.error('[Chat API] Erro ao atualizar contato:', upErr);
      savedContact = updatedContact || { ...targetContact, tags: finalTags };
    } else {
      const newId = isUuid(contactId) ? contactId : crypto.randomUUID();
      resolvedContactId = newId;

      let contactAvatar: string | null = null;
      if (cleanPhone) {
        contactAvatar = await fetchWhatsAppProfilePicture(cleanPhone, activeInstance);
      }
      if (!contactAvatar) {
        contactAvatar = getDefaultAvatarUrl(name);
      }

      const { data: insertedContact, error: inErr } = await supabase
        .from('whatsapp_contacts')
        .insert({
          id: newId,
          subaccount_id: resolvedSubId,
          name: name || 'Lead Prospecção',
          phone: `+${cleanPhone}`,
          avatar: contactAvatar,
          last_message: text || (mediaType === 'audio' ? '🎙️ Mensagem de Voz' : 'Mensagem enviada'),
          last_message_time: 'Agora',
          unread_count: 0,
          tags: finalTags,
        })
        .select()
        .maybeSingle();

      if (inErr) console.error('[Chat API] Erro ao inserir novo contato:', inErr);
      savedContact = insertedContact || {
        id: newId,
        subaccount_id: resolvedSubId,
        name: name || 'Lead Prospecção',
        phone: `+${cleanPhone}`,
        tags: finalTags,
      };
    }

    // 3. Salvar histórico de mensagem no Supabase
    const { data: savedMsg, error: saveErr } = await supabase
      .from('whatsapp_messages')
      .insert({
        subaccount_id: resolvedSubId,
        contact_id: resolvedContactId,
        sender: 'agent',
        text: text || (mediaType === 'audio' ? '🎙️ Mensagem de Voz (Áudio Gravado)' : 'Mensagem enviada'),
        status: evoSendSuccess ? 'sent' : 'error',
      })
      .select()
      .maybeSingle();

    if (saveErr) {
      console.error('[Chat API] Erro ao salvar mensagem enviada:', saveErr);
    }

    if (!evoSendSuccess && cleanPhone) {
      let errorMsg = 'Não foi possível entregar a mensagem no WhatsApp. Verifique a conexão da instância.';
      const resMsg = evoResponseData?.response?.message;
      if (typeof resMsg === 'string') {
        errorMsg = resMsg;
      } else if (Array.isArray(resMsg) && typeof resMsg[0] === 'string') {
        errorMsg = resMsg[0];
      } else if (typeof evoResponseData?.error === 'string') {
        errorMsg = evoResponseData.error;
      } else if (typeof evoResponseData?.error?.message === 'string') {
        errorMsg = evoResponseData.error.message;
      } else if (typeof evoResponseData?.message === 'string') {
        errorMsg = evoResponseData.message;
      } else if (Array.isArray(evoResponseData?.message) && typeof evoResponseData.message[0] === 'string') {
        errorMsg = evoResponseData.message[0];
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
          evoResponse: evoResponseData,
          instance: activeInstance,
          contact: savedContact,
          contactId: resolvedContactId,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: savedMsg,
      instance: activeInstance,
      contact: savedContact,
      contactId: resolvedContactId,
    });
  } catch (error: any) {
    console.error('[Chat API POST] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

