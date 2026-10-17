import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

function isUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

const DEFAULT_AGENT_CONFIG = {
  botName: 'Sofia',
  botRole: 'Consultora Especialista em Atendimento & Vendas',
  botTone: 'consultive', // friendly, consultive, commercial, formal
  botEnabled: true,
  businessName: 'Alves Climatização & Elétrica',
  segment: 'Climatização, Refrigeração e Instalações Elétricas',
  servicesAndPricing: `• Instalação de Ar-Condicionado Split (9.000 a 12.000 BTUs): A partir de R$ 380,00
• Instalação de Ar-Condicionado (18.000 a 30.000 BTUs): A partir de R$ 550,00
• Higienização e Limpeza Completa com Laudo: R$ 190,00
• Carga de Gás e Manutenção Preventiva: A partir de R$ 220,00
• Serviços e Instalações Elétricas (Quadro, Tomadas, Fiação): Sob consulta com visita técnica`,
  coverageAreas: 'Porto Alegre, Canoas, Novo Hamburgo, São Leopoldo e Região Metropolitana.',
  paymentTerms: 'Cartão de crédito em até 12x, PIX com 5% de desconto à vista, ou boleto para empresas (PJ).',
  businessHours: 'Segunda a Sexta das 08h às 18h30. Sábados das 08h às 13h.',
  customInstructions: `1. Sempre seja cordial, rápida e atenciosa.
2. Pergunte qual a capacidade/modelo do aparelho e em qual bairro será feito o serviço para estimar o orçamento com precisão.
3. Transmita segurança técnica e convide para agendar uma visita ou enviar fotos.
4. Responda em no máximo 2 a 3 frases concisas para manter a conversa fluida no WhatsApp.`,
  humanHandoffKeywords: 'atendente, falar com atendente, humano, atendente humano, pessoa, reclamacao, urgente',
  geminiApiKey: '',
  openaiApiKey: '',
};

// GET: Buscar treinamento e configurações do Atendente IA da subconta
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subaccountId = searchParams.get('subaccountId');

    const supabase = getServiceSupabase();
    let resolvedSubId = isUuid(subaccountId) ? subaccountId : null;

    if (!resolvedSubId) {
      const { data: subs } = await supabase.from('subaccounts').select('id, name, segment').limit(1);
      if (subs && subs.length > 0) {
        resolvedSubId = subs[0].id;
      }
    }

    if (!resolvedSubId) {
      return NextResponse.json({ config: DEFAULT_AGENT_CONFIG });
    }

    const { data: cred, error } = await supabase
      .from('tenant_credentials')
      .select('encrypted_credentials')
      .eq('subaccount_id', resolvedSubId)
      .eq('service_type', 'ai_agent_config')
      .maybeSingle();

    if (error) {
      console.error('[Agent Config API] Erro ao buscar configuração:', error);
      return NextResponse.json({ config: DEFAULT_AGENT_CONFIG });
    }

    if (cred && cred.encrypted_credentials) {
      try {
        const parsed = JSON.parse(cred.encrypted_credentials);
        return NextResponse.json({ config: { ...DEFAULT_AGENT_CONFIG, ...parsed } });
      } catch (parseErr) {
        console.error('[Agent Config API] Erro ao decodificar JSON:', parseErr);
      }
    }

    return NextResponse.json({ config: DEFAULT_AGENT_CONFIG });
  } catch (error: any) {
    console.error('[Agent Config API] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Salvar treinamento e configurações do Atendente IA da subconta
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subaccountId, config } = body;

    const supabase = getServiceSupabase();
    let resolvedSubId = isUuid(subaccountId) ? subaccountId : null;

    if (!resolvedSubId) {
      const { data: subs } = await supabase.from('subaccounts').select('id').limit(1);
      if (subs && subs.length > 0) {
        resolvedSubId = subs[0].id;
      }
    }

    if (!resolvedSubId) {
      return NextResponse.json({ error: 'Subconta não encontrada' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tenant_credentials')
      .upsert(
        {
          subaccount_id: resolvedSubId,
          service_type: 'ai_agent_config',
          encrypted_credentials: JSON.stringify(config),
          status: 'connected',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'subaccount_id,service_type' }
      )
      .select();

    if (error) {
      console.error('[Agent Config API] Erro ao salvar:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    console.error('[Agent Config API POST] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
