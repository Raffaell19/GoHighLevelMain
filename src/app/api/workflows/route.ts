import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { WorkflowRule, WorkflowStep } from '@/types';

// Workflows pré-configurados padrão do GoHighLevel adaptados para climatização e serviços
const defaultSeedWorkflows = (subaccountId: string): WorkflowRule[] => [
  {
    id: `wf-seed-1`,
    subaccountId,
    name: 'Atendimento & Triagem Inteligente via WhatsApp',
    description: 'Quando um cliente manda mensagem no WhatsApp, verifica palavras-chave de serviço e dispara fluxo ou IA.',
    triggerType: 'whatsapp_received',
    triggerLabel: 'Quando mensagem recebida no WhatsApp',
    triggerConfig: {
      keywords: ['orçamento', 'preço', 'ar condicionado', 'instalação', 'manutenção', 'limpeza'],
    },
    isActive: true,
    totalExecutions: 42,
    steps: [
      {
        id: 'step-cond-1',
        stepOrder: 1,
        stepType: 'condition',
        label: 'Verificar se mensagem contém interesse em Orçamento',
        config: {
          condition: {
            field: 'message',
            operator: 'contains',
            value: 'orçamento',
          },
        },
        yesSteps: [
          {
            id: 'step-act-yes-1',
            stepOrder: 2,
            stepType: 'action',
            actionType: 'send_whatsapp',
            label: 'Enviar Mensagem com Apresentação & Tabela de Serviços',
            config: {
              messageTemplate:
                'Olá {{contact.name}}! Aqui é da Connect Digital. 🚀 Já recebemos seu contato e em instantes um especialista da nossa equipe falará com você!',
            },
          },
          {
            id: 'step-act-yes-2',
            stepOrder: 3,
            stepType: 'action',
            actionType: 'add_tag',
            label: 'Adicionar Tag "Lead_Qualificado"',
            config: {
              tag: 'Lead_Qualificado',
            },
          },
          {
            id: 'step-act-yes-3',
            stepOrder: 4,
            stepType: 'action',
            actionType: 'update_stage',
            label: 'Mover no CRM para "Contato Feito"',
            config: {
              stageId: 'stage-2',
            },
          },
        ],
        noSteps: [
          {
            id: 'step-act-no-1',
            stepOrder: 2,
            stepType: 'action',
            actionType: 'ai_toggle',
            label: 'Acionar Atendente IA para Dúvidas Gerais',
            config: {
              aiEnabled: true,
            },
          },
        ],
      },
    ],
    actions: [
      {
        id: 'act-1',
        type: 'send_whatsapp',
        label: 'Disparo Inicial WhatsApp',
        config: {},
      },
    ],
  },
  {
    id: `wf-seed-2`,
    subaccountId,
    name: 'Follow-up Automático pós-Proposta (Wait Delay)',
    description: 'Quando o lead é movido para Proposta Enviada, aguarda 24 horas e envia lembrete cordial.',
    triggerType: 'stage_changed',
    triggerLabel: 'Quando lead movido para "Proposta Enviada"',
    triggerConfig: {
      stageId: 'stage-3',
    },
    isActive: true,
    totalExecutions: 19,
    steps: [
      {
        id: 'step-delay-1',
        stepOrder: 1,
        stepType: 'delay',
        actionType: 'wait_delay',
        label: 'Aguardar 24 Horas',
        config: {
          delayMinutes: 1440,
        },
      },
      {
        id: 'step-cond-2',
        stepOrder: 2,
        stepType: 'condition',
        label: 'Verificar se Proposta ainda está Aberta',
        config: {
          condition: {
            field: 'stage',
            operator: 'equals',
            value: 'stage-3',
          },
        },
        yesSteps: [
          {
            id: 'step-act-followup-1',
            stepOrder: 3,
            stepType: 'action',
            actionType: 'send_whatsapp',
            label: 'Enviar Follow-up no WhatsApp',
            config: {
              messageTemplate:
                'Olá {{contact.name}}, tudo bem? Passando para saber se você conseguiu analisar a nossa proposta de climatização ou se ficou com alguma dúvida técnica! Podemos fechar para esta semana?',
            },
          },
        ],
        noSteps: [],
      },
    ],
    actions: [
      {
        id: 'act-2',
        type: 'wait_delay',
        label: 'Delay 24h',
        config: {},
      },
    ],
  },
  {
    id: `wf-seed-3`,
    subaccountId,
    name: 'Alerta e Agradecimento de Avaliação 5★ no Google',
    description: 'Quando um cliente deixa uma avaliação de 4 ou 5 estrelas no Perfil do Google, envia cupom fidelidade.',
    triggerType: 'gmb_review_received',
    triggerLabel: 'Quando avaliação positiva for postada no Google',
    triggerConfig: {
      minRating: 4,
    },
    isActive: true,
    totalExecutions: 31,
    steps: [
      {
        id: 'step-cond-3',
        stepOrder: 1,
        stepType: 'condition',
        label: 'Nota igual ou superior a 4 Estrelas',
        config: {
          condition: {
            field: 'rating',
            operator: 'greater_than',
            value: '3',
          },
        },
        yesSteps: [
          {
            id: 'step-act-gmb-1',
            stepOrder: 2,
            stepType: 'action',
            actionType: 'send_whatsapp',
            label: 'Enviar WhatsApp com Agradecimento e Bônus',
            config: {
              messageTemplate:
                'Muito obrigado pela sua avaliação positiva no Google, {{contact.name}}! Em agradecimento, você acaba de ganhar 10% de desconto na sua próxima higienização de ar-condicionado. Cupom: CLIENTE-VIP.',
            },
          },
          {
            id: 'step-act-gmb-2',
            stepOrder: 3,
            stepType: 'action',
            actionType: 'add_tag',
            label: 'Adicionar Tag "Promotor_Google_5Star"',
            config: {
              tag: 'Promotor_Google_5Star',
            },
          },
        ],
        noSteps: [],
      },
    ],
    actions: [
      {
        id: 'act-3',
        type: 'send_whatsapp',
        label: 'Agradecimento VIP',
        config: {},
      },
    ],
  },
];

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const subaccountId = searchParams.get('subaccountId');

    if (!subaccountId) {
      return NextResponse.json({ error: 'subaccountId é obrigatório' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('subaccount_id', subaccountId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Se ainda não existirem workflows salvos no Supabase para este tenant, grava os modelos padrão
    if (!data || data.length === 0) {
      const seeds = defaultSeedWorkflows(subaccountId);
      const rowsToInsert = seeds.map((s) => ({
        subaccount_id: subaccountId,
        name: s.name,
        description: s.description,
        trigger_type: s.triggerType,
        trigger_label: s.triggerLabel,
        actions: {
          steps: s.steps,
          triggerConfig: s.triggerConfig,
          actions: s.actions,
        },
        is_active: s.isActive,
        total_executions: s.totalExecutions,
      }));

      const { data: inserted, error: insertErr } = await supabase
        .from('workflows')
        .insert(rowsToInsert)
        .select();

      if (!insertErr && inserted) {
        const formatted: WorkflowRule[] = inserted.map((row) => ({
          id: row.id,
          subaccountId: row.subaccount_id,
          name: row.name,
          description: row.description,
          triggerType: row.trigger_type,
          triggerLabel: row.trigger_label,
          triggerConfig: row.actions?.triggerConfig || {},
          steps: row.actions?.steps || [],
          actions: row.actions?.actions || [],
          isActive: row.is_active,
          totalExecutions: row.total_executions || 0,
          createdAt: row.created_at,
        }));
        return NextResponse.json({ workflows: formatted });
      }
    }

    const formatted: WorkflowRule[] = data.map((row) => ({
      id: row.id,
      subaccountId: row.subaccount_id,
      name: row.name,
      description: row.description,
      triggerType: row.trigger_type,
      triggerLabel: row.trigger_label,
      triggerConfig: row.actions?.triggerConfig || {},
      steps: row.actions?.steps || (Array.isArray(row.actions) ? [] : row.actions?.steps || []),
      actions: Array.isArray(row.actions) ? row.actions : row.actions?.actions || [],
      isActive: row.is_active,
      totalExecutions: row.total_executions || 0,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ workflows: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();

    if (!body.subaccountId || !body.name) {
      return NextResponse.json({ error: 'subaccountId e name são obrigatórios' }, { status: 400 });
    }

    const payload = {
      subaccount_id: body.subaccountId,
      name: body.name,
      description: body.description || '',
      trigger_type: body.triggerType || 'whatsapp_received',
      trigger_label: body.triggerLabel || 'Gatilho personalizado',
      actions: {
        steps: body.steps || [],
        triggerConfig: body.triggerConfig || {},
        actions: body.actions || [],
      },
      is_active: body.isActive !== undefined ? body.isActive : true,
      total_executions: 0,
    };

    const { data, error } = await supabase
      .from('workflows')
      .insert([payload])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const created: WorkflowRule = {
      id: data.id,
      subaccountId: data.subaccount_id,
      name: data.name,
      description: data.description,
      triggerType: data.trigger_type,
      triggerLabel: data.trigger_label,
      triggerConfig: data.actions?.triggerConfig || {},
      steps: data.actions?.steps || [],
      actions: data.actions?.actions || [],
      isActive: data.is_active,
      totalExecutions: data.total_executions || 0,
      createdAt: data.created_at,
    };

    return NextResponse.json({ workflow: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;
    if (body.triggerType !== undefined) updateData.trigger_type = body.triggerType;
    if (body.triggerLabel !== undefined) updateData.trigger_label = body.triggerLabel;
    if (body.steps !== undefined || body.triggerConfig !== undefined || body.actions !== undefined) {
      updateData.actions = {
        steps: body.steps || [],
        triggerConfig: body.triggerConfig || {},
        actions: body.actions || [],
      };
    }
    if (body.totalExecutions !== undefined) {
      updateData.total_executions = body.totalExecutions;
    }

    const { data, error } = await supabase
      .from('workflows')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ workflow: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
    }

    const { error } = await supabase.from('workflows').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
