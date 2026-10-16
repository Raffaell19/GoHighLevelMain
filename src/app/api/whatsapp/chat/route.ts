import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || 'https://evolution-api-kix9.onrender.com';
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || 'flowlevel_secret_key_2026';

// GET: Buscar contatos e mensagens da subconta
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subaccountId = searchParams.get('subaccountId');

    const supabase = getServiceSupabase();

    // 1. Buscar contatos
    let contactQuery = supabase.from('whatsapp_contacts').select('*').order('created_at', { ascending: false });
    if (subaccountId) {
      contactQuery = contactQuery.eq('subaccount_id', subaccountId);
    }
    const { data: contacts, error: errC } = await contactQuery;

    if (errC) {
      console.error('[Chat API] Erro ao buscar contatos:', errC);
      return NextResponse.json({ error: errC.message }, { status: 500 });
    }

    // 2. Buscar mensagens
    let messageQuery = supabase.from('whatsapp_messages').select('*').order('created_at', { ascending: true });
    if (subaccountId) {
      messageQuery = messageQuery.eq('subaccount_id', subaccountId);
    }
    const { data: messages, error: errM } = await messageQuery;

    if (errM) {
      console.error('[Chat API] Erro ao buscar mensagens:', errM);
      return NextResponse.json({ error: errM.message }, { status: 500 });
    }

    // Agrupar mensagens por contact_id
    const groupedMessages: Record<string, any[]> = {};
    (messages || []).forEach((m) => {
      if (!groupedMessages[m.contact_id]) {
        groupedMessages[m.contact_id] = [];
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

    const formattedContacts = (contacts || []).map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      avatar: c.avatar,
      lastMessage: c.last_message || '',
      lastMessageTime: c.last_message_time || 'Agora',
      unreadCount: c.unread_count || 0,
      tags: c.tags || ['WhatsApp Inbound'],
    }));

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

    // 1. Tentar enviar via Evolution API no celular real
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
        subaccount_id: subaccountId,
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
