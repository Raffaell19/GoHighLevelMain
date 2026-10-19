import { NextRequest, NextResponse } from 'next/server';
import { WorkflowRule, WorkflowStep } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { workflow, mockData } = await request.json();

    if (!workflow) {
      return NextResponse.json({ error: 'workflow é obrigatório' }, { status: 400 });
    }

    const contactName = mockData?.name || 'Carlos Eduardo Silva';
    const contactPhone = mockData?.phone || '(11) 98765-4321';
    const messageInput = mockData?.message || 'Gostaria de solicitar um orçamento de ar condicionado para meu escritório';
    const leadValue = mockData?.value || 3500;
    const ratingInput = mockData?.rating || 5;

    const executionTrace: Array<{
      stepId: string;
      title: string;
      type: string;
      status: 'success' | 'branch_yes' | 'branch_no' | 'waiting';
      details: string;
      outputPayload?: any;
    }> = [];

    // 1. Tracing Trigger
    executionTrace.push({
      stepId: 'trigger',
      title: `Gatilho Ativado: ${workflow.triggerLabel || workflow.triggerType}`,
      type: 'trigger',
      status: 'success',
      details: `Disparado por contato ${contactName} (${contactPhone}) com entrada: "${messageInput}".`,
    });

    // 2. Traversal of steps
    const steps: WorkflowStep[] = workflow.steps || [];

    for (const step of steps) {
      if (step.stepType === 'condition') {
        const cond = step.config?.condition;
        let isMet = false;

        if (cond) {
          if (cond.field === 'message') {
            if (cond.operator === 'contains') {
              isMet = messageInput.toLowerCase().includes(cond.value.toLowerCase());
            } else if (cond.operator === 'equals') {
              isMet = messageInput.toLowerCase().trim() === cond.value.toLowerCase().trim();
            }
          } else if (cond.field === 'rating') {
            if (cond.operator === 'greater_than') {
              isMet = ratingInput > Number(cond.value);
            } else if (cond.operator === 'equals') {
              isMet = ratingInput === Number(cond.value);
            }
          } else if (cond.field === 'lead_value') {
            if (cond.operator === 'greater_than') {
              isMet = leadValue > Number(cond.value);
            }
          } else {
            isMet = true;
          }
        } else {
          isMet = true;
        }

        executionTrace.push({
          stepId: step.id,
          title: step.label,
          type: 'condition',
          status: isMet ? 'branch_yes' : 'branch_no',
          details: `Condição avaliada (${cond?.field} ${cond?.operator} "${cond?.value}") -> Resultado: ${
            isMet ? 'VERDADEIRO (Branch SIM)' : 'FALSO (Branch NÃO)'
          }.`,
        });

        // Run sub-steps of the matching branch
        const nextBranch = isMet ? step.yesSteps || [] : step.noSteps || [];
        for (const subStep of nextBranch) {
          if (subStep.actionType === 'send_whatsapp') {
            const raw = subStep.config?.messageTemplate || 'Mensagem padrão';
            const interpolated = raw
              .replace(/{{contact\.name}}/g, contactName)
              .replace(/{{nome}}/g, contactName)
              .replace(/{{telefone}}/g, contactPhone);

            executionTrace.push({
              stepId: subStep.id,
              title: subStep.label,
              type: 'action',
              status: 'success',
              details: `Mensagem enviada com sucesso para ${contactPhone}: "${interpolated}"`,
              outputPayload: { sentTo: contactPhone, text: interpolated },
            });
          } else if (subStep.actionType === 'add_tag') {
            executionTrace.push({
              stepId: subStep.id,
              title: subStep.label,
              type: 'action',
              status: 'success',
              details: `Tag "${subStep.config?.tag || 'Tag'}" aplicada ao contato ${contactName}.`,
            });
          } else if (subStep.actionType === 'update_stage') {
            executionTrace.push({
              stepId: subStep.id,
              title: subStep.label,
              type: 'action',
              status: 'success',
              details: `Lead movido com sucesso no funil para a etapa ID: ${subStep.config?.stageId || 'Próxima'}.`,
            });
          } else if (subStep.actionType === 'ai_toggle') {
            executionTrace.push({
              stepId: subStep.id,
              title: subStep.label,
              type: 'action',
              status: 'success',
              details: `Agente de Inteligência Artificial ativado no modo de atendimento contínuo para o contato.`,
            });
          }
        }
      } else if (step.stepType === 'delay') {
        const mins = step.config?.delayMinutes || 60;
        executionTrace.push({
          stepId: step.id,
          title: step.label,
          type: 'delay',
          status: 'waiting',
          details: `Temporizador agendado: aguardando ${mins} minutos (${(mins / 60).toFixed(1)}h) antes do próximo passo.`,
        });
      } else if (step.stepType === 'action') {
        if (step.actionType === 'send_whatsapp') {
          const raw = step.config?.messageTemplate || 'Mensagem padrão';
          const interpolated = raw
            .replace(/{{contact\.name}}/g, contactName)
            .replace(/{{nome}}/g, contactName)
            .replace(/{{telefone}}/g, contactPhone);

          executionTrace.push({
            stepId: step.id,
            title: step.label,
            type: 'action',
            status: 'success',
            details: `Mensagem enviada: "${interpolated}"`,
            outputPayload: { sentTo: contactPhone, text: interpolated },
          });
        } else {
          executionTrace.push({
            stepId: step.id,
            title: step.label,
            type: 'action',
            status: 'success',
            details: `Ação executada com sucesso.`,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      contact: { name: contactName, phone: contactPhone },
      executionTimeMs: 142,
      trace: executionTrace,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
