import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    // 1. Limpar todos os leads de teste
    const { error: errLeads } = await supabase
      .from('leads')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (errLeads) {
      console.error('[Reset API] Erro ao limpar leads:', errLeads);
    }

    // 2. Limpar mensagens de teste do WhatsApp
    const { error: errMessages } = await supabase
      .from('whatsapp_messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (errMessages) {
      console.error('[Reset API] Erro ao limpar mensagens:', errMessages);
    }

    // 3. Limpar contatos de teste do WhatsApp
    const { error: errContacts } = await supabase
      .from('whatsapp_contacts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (errContacts) {
      console.error('[Reset API] Erro ao limpar contatos:', errContacts);
    }

    return NextResponse.json({
      success: true,
      message: 'Todos os valores e dados fictícios foram zerados com sucesso para início de produção real.',
    });
  } catch (error: any) {
    console.error('[Reset API] Erro geral:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
