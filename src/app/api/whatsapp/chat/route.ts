import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

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
      avatar: c.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      lastMessage: c.last_message || '',
      lastMessageTime: c.last_message_time || 'Agora',
      unreadCount: c.unread_count || 0,
      tags: c.tags || ['WhatsApp IA'],
      lastActivityTime: lastMsgTimes[c.id] || new Date(c.created_at).getTime(),
    }));

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

// POST: Enviar mensagem para o cliente via Evolution API e salvar no banco
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contactId, phone, text, subaccountId, instanceName } = body;

    if (!text || (!contactId && !phone)) {
      return NextResponse.json({ error: 'Telefone e mensagem são obrigatórios' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const instance = instanceName || 'alves-climatiza--o---el-trica';

    let resolvedSubId = isUuid(subaccountId) ? subaccountId : null;
    if (!resolvedSubId) {
      const { data: subs } = await supabase.from('subaccounts').select('id').limit(1);
      if (subs && subs.length > 0) {
        resolvedSubId = subs[0].id;
      }
    }

    // 1. Enviar mensagem real via Evolution API
    if (cleanPhone) {
      try {
        const evoRes = await fetch(`${EVOLUTION_URL}/message/sendText/${encodeURIComponent(instance)}`, {
          method: 'POST',
          headers: {
            'apikey': EVOLUTION_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            number: cleanPhone,
            text: text,
          }),
        });
        const evoData = await evoRes.json();
        console.log('[Chat API] Envio Evolution API:', evoRes.status, evoData);
      } catch (evoErr) {
        console.error('[Chat API] Erro ao enviar pela Evolution API:', evoErr);
      }
    }

    // 2. Salvar mensagem no Supabase
    const { data: savedMsg, error: saveErr } = await supabase
      .from('whatsapp_messages')
      .insert({
        subaccount_id: resolvedSubId,
        contact_id: contactId,
        sender: 'agent',
        text: text,
        status: 'sent',
      })
      .select()
      .single();

    if (saveErr) {
      console.error('[Chat API] Erro ao salvar mensagem enviada:', saveErr);
    }

    // 3. Atualizar último texto do contato
    if (contactId) {
      await supabase
        .from('whatsapp_contacts')
        .update({
          last_message: text,
          last_message_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread_count: 0,
        })
        .eq('id', contactId);
    }

    return NextResponse.json({ success: true, message: savedMsg });
  } catch (error: any) {
    console.error('[Chat API POST] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
