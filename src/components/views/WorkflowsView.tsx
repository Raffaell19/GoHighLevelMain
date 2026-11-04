'use client';

import React, { useState } from 'react';
import {
  Zap,
  Play,
  Plus,
  CheckCircle2,
  ArrowDown,
  MessageSquare,
  Tag,
  Users,
  Clock,
  Trash2,
  Sparkles,
  Filter,
  ArrowRight,
  X,
  Sliders,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { WorkflowRule, WorkflowStep, WorkflowStepType } from '@/types';

export function WorkflowsView() {
  const { currentSubaccount, workflows, toggleWorkflow, addWorkflow, updateWorkflow, deleteWorkflow, stages } = useApp();

  // Mode: 'list' | 'builder'
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowRule | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Filter in list
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'whatsapp' | 'crm' | 'gmb'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Step for Configuration in Builder
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);

  // Simulator State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simContactName, setSimContactName] = useState('Carlos Eduardo');
  const [simContactPhone, setSimContactPhone] = useState('(11) 98765-4321');
  const [simMessage, setSimMessage] = useState('Olá! Gostaria de um orçamento para instalação de 2 ar-condicionados');
  const [simRating] = useState(5);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationTrace, setSimulationTrace] = useState<any[] | null>(null);

  // New Workflow Quick Form State
  const [wfName, setWfName] = useState('');
  const [wfDescription, setWfDescription] = useState('');
  const [triggerType, setTriggerType] = useState<WorkflowRule['triggerType']>('whatsapp_received');

  // Filtered workflows
  const filteredWorkflows = workflows.filter((wf) => {
    const matchesSearch =
      wf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wf.description.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (categoryFilter === 'whatsapp') return wf.triggerType === 'whatsapp_received';
    if (categoryFilter === 'crm') return wf.triggerType === 'lead_created' || wf.triggerType === 'stage_changed';
    if (categoryFilter === 'gmb') return wf.triggerType === 'gmb_review_received';
    return true;
  });

  const totalDisparos = workflows.reduce((acc, curr) => acc + (curr.totalExecutions || 0), 0);
  const activeCount = workflows.filter((w) => w.isActive).length;

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wfName.trim()) return;

    let triggerLabel = 'Quando uma mensagem chegar no WhatsApp';
    if (triggerType === 'lead_created') triggerLabel = 'Quando um novo Lead for cadastrado';
    if (triggerType === 'stage_changed') triggerLabel = 'Quando o Lead mudar de etapa no Funil';
    if (triggerType === 'gmb_review_received') triggerLabel = 'Quando uma nova avaliação chegar no Google';
    if (triggerType === 'tag_added') triggerLabel = 'Quando uma tag for adicionada ao contato';

    const newWf: Omit<WorkflowRule, 'id' | 'totalExecutions'> = {
      subaccountId: currentSubaccount.id,
      name: wfName,
      description: wfDescription || 'Automação inteligente de alta conversão para o FlowLevel.',
      triggerType,
      triggerLabel,
      triggerConfig: {
        keywords: ['orçamento', 'preço', 'ar condicionado'],
      },
      isActive: true,
      steps: [
        {
          id: `step-${Date.now()}-1`,
          stepOrder: 1,
          stepType: 'action',
          actionType: 'send_whatsapp',
          label: 'Disparar WhatsApp de Boas-Vindas',
          config: {
            messageTemplate: 'Olá {{contact.name}}, obrigado pelo contato com a Connect Digital! Como podemos te ajudar hoje?',
          },
        },
      ],
      actions: [
        {
          id: `act-${Date.now()}`,
          type: 'send_whatsapp',
          label: 'Disparar WhatsApp de Boas-Vindas',
          config: {},
        },
      ],
    };

    await addWorkflow(newWf);
    setIsNewModalOpen(false);
    setWfName('');
    setWfDescription('');
  };

  const handleRunSimulator = async () => {
    if (!activeWorkflow) return;
    setIsSimulating(true);
    setSimulationTrace(null);

    try {
      const res = await fetch('/api/workflows/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: activeWorkflow,
          mockData: {
            name: simContactName,
            phone: simContactPhone,
            message: simMessage,
            rating: simRating,
          },
        }),
      });

      const data = await res.json();
      if (data.trace) {
        setSimulationTrace(data.trace);
      }
    } catch (err) {
      console.error('Erro na simulação do workflow:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleAddStepToWorkflow = (type: WorkflowStepType, branchTarget: 'root' | 'yes' | 'no' = 'root', parentCondId?: string) => {
    if (!activeWorkflow) return;

    const newStepId = `step-${Date.now()}`;
    let newStep: WorkflowStep;

    if (type === 'condition') {
      newStep = {
        id: newStepId,
        stepOrder: (activeWorkflow.steps?.length || 0) + 1,
        stepType: 'condition',
        label: 'Verificar Condição (IF / ELSE)',
        config: {
          condition: {
            field: 'message',
            operator: 'contains',
            value: 'orçamento',
          },
        },
        yesSteps: [
          {
            id: `step-yes-${Date.now()}`,
            stepOrder: 1,
            stepType: 'action',
            actionType: 'send_whatsapp',
            label: 'Ação se Verdadeiro (Branch SIM)',
            config: {
              messageTemplate: 'Perfeito, {{contact.name}}! Aqui está o orçamento.',
            },
          },
        ],
        noSteps: [
          {
            id: `step-no-${Date.now()}`,
            stepOrder: 1,
            stepType: 'action',
            actionType: 'ai_toggle',
            label: 'Ação se Falso (Branch NÃO)',
            config: {
              aiEnabled: true,
            },
          },
        ],
      };
    } else if (type === 'delay') {
      newStep = {
        id: newStepId,
        stepOrder: (activeWorkflow.steps?.length || 0) + 1,
        stepType: 'delay',
        actionType: 'wait_delay',
        label: 'Aguardar Temporizador (Delay)',
        config: {
          delayMinutes: 60,
        },
      };
    } else {
      newStep = {
        id: newStepId,
        stepOrder: (activeWorkflow.steps?.length || 0) + 1,
        stepType: 'action',
        actionType: 'send_whatsapp',
        label: 'Disparo de WhatsApp',
        config: {
          messageTemplate: 'Olá {{contact.name}}, estamos à disposição na Connect Digital!',
        },
      };
    }

    let updatedSteps = [...(activeWorkflow.steps || [])];

    if (branchTarget === 'root') {
      updatedSteps.push(newStep);
    } else if (parentCondId) {
      updatedSteps = updatedSteps.map((s) => {
        if (s.id === parentCondId) {
          if (branchTarget === 'yes') {
            return { ...s, yesSteps: [...(s.yesSteps || []), newStep] };
          } else {
            return { ...s, noSteps: [...(s.noSteps || []), newStep] };
          }
        }
        return s;
      });
    }

    const updatedWf = { ...activeWorkflow, steps: updatedSteps };
    setActiveWorkflow(updatedWf);
    updateWorkflow(updatedWf);
  };

  const handleUpdateActiveWorkflow = () => {
    if (!activeWorkflow) return;
    updateWorkflow(activeWorkflow);
  };

  // =========================================================================
  // VIEW: FULL VISUAL BUILDER (CANVAS)
  // =========================================================================
  if (activeWorkflow) {
    return (
      <div className="space-y-6">
        {/* Top Builder Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#161616]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveWorkflow(null);
                setSelectedStep(null);
              }}
              className="h-8 px-3 rounded-[6px] bg-[#161616] hover:bg-[#1f1f1f] border border-[#2a2a2a] text-[#b4b4b4] hover:text-white text-[13px] font-medium transition-colors"
            >
              Voltar à lista
            </button>
            <div className="h-5 w-px bg-[#1a1a1a] hidden sm:block" />
            <div>
              <div className="flex items-center gap-2.5">
                <input
                  type="text"
                  value={activeWorkflow.name}
                  onChange={(e) => setActiveWorkflow({ ...activeWorkflow, name: e.target.value })}
                  className="font-semibold text-[18px] tracking-[-0.02em] text-white bg-transparent border-b border-transparent hover:border-[#2a2a2a] focus:border-[#444444] focus:outline-none px-1"
                />
                <span
                  className={`text-[12px] px-2 py-0.5 rounded-[4px] font-medium ${
                    activeWorkflow.isActive
                      ? 'bg-[var(--ok)]/15 text-[var(--ok)]'
                      : 'bg-[#1a1a1a] text-[#949494]'
                  }`}
                >
                  {activeWorkflow.isActive ? 'Ativo' : 'Rascunho'}
                </span>
              </div>
              <p className="text-[12px] text-[#949494] px-1 mt-0.5">{activeWorkflow.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                setIsSimulatorOpen(true);
                setSimulationTrace(null);
              }}
              className="h-8 flex items-center gap-1.5 px-3 rounded-[6px] bg-[#161616] hover:bg-[#1f1f1f] text-[var(--warn)] border border-[#2a2a2a] text-[13px] font-medium transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Testar automação</span>
            </button>

            <button
              onClick={() => {
                const nextState = !activeWorkflow.isActive;
                const updated = { ...activeWorkflow, isActive: nextState };
                setActiveWorkflow(updated);
                updateWorkflow(updated);
              }}
              className="h-8 flex items-center gap-1.5 px-3 rounded-[6px] bg-[#161616] hover:bg-[#1f1f1f] border border-[#2a2a2a] text-[#b4b4b4] hover:text-white text-[13px] font-medium transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{activeWorkflow.isActive ? 'Pausar fluxo' : 'Publicar fluxo'}</span>
            </button>

            <button
              onClick={handleUpdateActiveWorkflow}
              className="h-8 flex items-center gap-1.5 px-3.5 rounded-[6px] bg-white hover:bg-[#e5e5e5] text-black text-[13px] font-medium transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Salvar alterações</span>
            </button>
          </div>
        </div>

        {/* Builder Layout: Canvas Graph + Node Config Drawer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Canvas Flow Graph */}
          <div className="lg:col-span-8 bg-[#111111] border border-[#1a1a1a] rounded-[8px] p-6 min-h-[580px] flex flex-col items-center relative overflow-x-auto">
            <div className="w-full max-w-xl flex flex-col items-center space-y-5">
              {/* 1. TRIGGER NODE */}
              <div
                onClick={() => setSelectedStep(null)}
                className="w-full bg-[#161616] border border-[#2a2a2a] hover:border-[#444444] rounded-[8px] p-4 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[6px] bg-[#222222] border border-[#333333] flex items-center justify-center text-[#c6f24e]">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-[#949494]">
                        Gatilho inicial
                      </span>
                      <h4 className="font-semibold text-[14px] text-white">
                        {activeWorkflow.triggerLabel}
                      </h4>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-[#b4b4b4] bg-[#222222] px-2 py-0.5 rounded-[4px]">
                    {activeWorkflow.triggerType}
                  </span>
                </div>

                <div className="pt-3 text-[12px] text-[#949494] flex flex-wrap gap-1.5 items-center">
                  <span className="font-medium text-[#b4b4b4]">Filtro de ativação:</span>
                  {activeWorkflow.triggerConfig?.keywords && activeWorkflow.triggerConfig.keywords.length > 0 ? (
                    activeWorkflow.triggerConfig.keywords.map((k, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-[#111111] text-[#b4b4b4] border border-[#2a2a2a] rounded-[4px] text-[11px]"
                      >
                        &quot;{k}&quot;
                      </span>
                    ))
                  ) : (
                    <span className="text-[#949494]">Qualquer mensagem ou evento</span>
                  )}
                </div>
              </div>

              {/* Connecting Connector Arrow */}
              <div className="flex flex-col items-center">
                <div className="w-px h-5 bg-[#2a2a2a]" />
                <ArrowDown className="w-3.5 h-3.5 text-[#949494]" />
              </div>

              {/* 2. SEQUENTIAL & CONDITIONAL STEPS */}
              {activeWorkflow.steps && activeWorkflow.steps.length > 0 ? (
                activeWorkflow.steps.map((step, idx) => (
                  <React.Fragment key={step.id}>
                    {step.stepType === 'condition' ? (
                      /* CONDITIONAL IF/ELSE NODE */
                      <div className="w-full flex flex-col items-center space-y-4">
                        <div
                          onClick={() => setSelectedStep(step)}
                          className={`w-full bg-[#161616] border ${
                            selectedStep?.id === step.id ? 'border-[var(--warn)]' : 'border-[#2a2a2a] hover:border-[#444444]'
                          } rounded-[8px] p-4 cursor-pointer transition-colors`}
                        >
                          <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-[6px] bg-[var(--warn)]/15 flex items-center justify-center text-[var(--warn)]">
                                <Filter className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span className="text-[11px] font-medium text-[var(--warn)]">
                                  Bifurcação condicional (IF / ELSE)
                                </span>
                                <h4 className="font-semibold text-[14px] text-white">
                                  {step.label}
                                </h4>
                              </div>
                            </div>
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-[4px] bg-[var(--warn)]/15 text-[var(--warn)]">
                              Decisão lógica
                            </span>
                          </div>

                          <div className="pt-3 text-[12px] text-[#949494]">
                            Campo: <span className="font-medium text-white">{step.config?.condition?.field || 'mensagem'}</span>{' '}
                            {step.config?.condition?.operator === 'contains' ? 'contém' : 'é igual a'}{' '}
                            <span className="font-medium text-[var(--warn)]">&quot;{step.config?.condition?.value || ''}&quot;</span>
                          </div>
                        </div>

                        {/* Dual Branch Visualizer: YES (SIM) vs NO (NÃO) */}
                        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          {/* Branch YES (SIM) */}
                          <div className="flex flex-col items-center space-y-3 p-3.5 rounded-[8px] bg-[#0c0c0c] border border-[#1f1f1f]">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[var(--ok)]/15 text-[var(--ok)] text-[11px] font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Ramo SIM (Atende)</span>
                            </div>

                            {step.yesSteps?.map((subStep) => (
                              <div
                                key={subStep.id}
                                onClick={() => setSelectedStep(subStep)}
                                className={`w-full bg-[#161616] border ${
                                  selectedStep?.id === subStep.id ? 'border-[var(--ok)]' : 'border-[#262626] hover:border-[#3a3a3a]'
                                } p-3 rounded-[6px] cursor-pointer text-[12px] space-y-1.5`}
                              >
                                <div className="flex items-center gap-2 text-[var(--ok)] font-medium">
                                  {subStep.actionType === 'send_whatsapp' && <MessageSquare className="w-3.5 h-3.5" />}
                                  {subStep.actionType === 'add_tag' && <Tag className="w-3.5 h-3.5" />}
                                  {subStep.actionType === 'update_stage' && <Users className="w-3.5 h-3.5" />}
                                  <span>{subStep.label}</span>
                                </div>
                                {subStep.config?.messageTemplate && (
                                  <p className="text-[11px] text-[#949494] line-clamp-2 bg-[#111111] p-2 rounded-[4px] border border-[#1f1f1f]">
                                    &quot;{subStep.config.messageTemplate}&quot;
                                  </p>
                                )}
                              </div>
                            ))}

                            <button
                              onClick={() => handleAddStepToWorkflow('action', 'yes', step.id)}
                              className="text-[12px] font-medium text-[var(--ok)] hover:underline flex items-center gap-1 py-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Adicionar ação ao SIM</span>
                            </button>
                          </div>

                          {/* Branch NO (NÃO) */}
                          <div className="flex flex-col items-center space-y-3 p-3.5 rounded-[8px] bg-[#0c0c0c] border border-[#1f1f1f]">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#222222] text-[#b4b4b4] text-[11px] font-medium">
                              <X className="w-3.5 h-3.5" />
                              <span>Ramo NÃO (Outro)</span>
                            </div>

                            {step.noSteps?.map((subStep) => (
                              <div
                                key={subStep.id}
                                onClick={() => setSelectedStep(subStep)}
                                className={`w-full bg-[#161616] border ${
                                  selectedStep?.id === subStep.id ? 'border-white' : 'border-[#262626] hover:border-[#3a3a3a]'
                                } p-3 rounded-[6px] cursor-pointer text-[12px] space-y-1.5`}
                              >
                                <div className="flex items-center gap-2 text-white font-medium">
                                  {subStep.actionType === 'ai_toggle' ? <Sparkles className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                                  <span>{subStep.label}</span>
                                </div>
                                <p className="text-[11px] text-[#949494] line-clamp-2 bg-[#111111] p-2 rounded-[4px] border border-[#1f1f1f]">
                                  {subStep.actionType === 'ai_toggle' ? 'Atendente inteligente ativado' : subStep.label}
                                </p>
                              </div>
                            ))}

                            <button
                              onClick={() => handleAddStepToWorkflow('action', 'no', step.id)}
                              className="text-[12px] font-medium text-[#b4b4b4] hover:text-white flex items-center gap-1 py-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Adicionar ação ao NÃO</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* LINEAR STEP (ACTION OR DELAY) */
                      <div
                        onClick={() => setSelectedStep(step)}
                        className={`w-full bg-[#161616] border ${
                          selectedStep?.id === step.id
                            ? 'border-white'
                            : 'border-[#2a2a2a] hover:border-[#444444]'
                        } rounded-[8px] p-4 cursor-pointer transition-colors`}
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-[6px] flex items-center justify-center ${
                                step.stepType === 'delay'
                                  ? 'bg-[var(--warn)]/15 text-[var(--warn)]'
                                  : 'bg-[var(--ok)]/15 text-[var(--ok)]'
                              }`}
                            >
                              {step.stepType === 'delay' ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                            <div>
                              <span
                                className={`text-[11px] font-medium ${
                                  step.stepType === 'delay' ? 'text-[var(--warn)]' : 'text-[var(--ok)]'
                                }`}
                              >
                                {step.stepType === 'delay' ? 'Temporizador de espera' : 'Ação automatizada'}
                              </span>
                              <h4 className="font-semibold text-[14px] text-white">{step.label}</h4>
                            </div>
                          </div>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-[4px] bg-[#222222] text-[#949494] tabular-nums">
                            Passo {step.stepOrder || idx + 1}
                          </span>
                        </div>

                        {step.config?.messageTemplate && (
                          <div className="pt-3 text-[12px] text-[#b4b4b4]">
                            <p className="bg-[#111111] p-2.5 rounded-[6px] border border-[#222222]">
                              &quot;{step.config.messageTemplate}&quot;
                            </p>
                          </div>
                        )}

                        {step.stepType === 'delay' && (
                          <div className="pt-3 text-[12px] text-[var(--warn)] font-medium flex items-center gap-1.5 tabular-nums">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Espera de {step.config?.delayMinutes || 60} minutos antes de prosseguir.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Connecting Connector Arrow between steps */}
                    {idx < (activeWorkflow.steps?.length || 0) - 1 && (
                      <div className="flex flex-col items-center">
                        <div className="w-px h-5 bg-[#2a2a2a]" />
                        <ArrowDown className="w-3.5 h-3.5 text-[#949494]" />
                      </div>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <div className="text-center py-6 text-[13px] text-[#949494]">
                  Nenhum passo adicionado ainda. Selecione uma opção abaixo para construir o fluxo.
                </div>
              )}

              {/* Action Toolbar to append nodes */}
              <div className="flex flex-col items-center pt-3">
                <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-[8px] bg-[#161616] border border-[#2a2a2a]">
                  <button
                    onClick={() => handleAddStepToWorkflow('action')}
                    className="h-8 flex items-center gap-1.5 px-3 rounded-[6px] bg-[#222222] hover:bg-[#2a2a2a] text-white text-[12px] font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ação (WhatsApp/CRM)</span>
                  </button>

                  <button
                    onClick={() => handleAddStepToWorkflow('condition')}
                    className="h-8 flex items-center gap-1.5 px-3 rounded-[6px] bg-[#222222] hover:bg-[#2a2a2a] text-[var(--warn)] text-[12px] font-medium transition-colors"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Condição (IF / ELSE)</span>
                  </button>

                  <button
                    onClick={() => handleAddStepToWorkflow('delay')}
                    className="h-8 flex items-center gap-1.5 px-3 rounded-[6px] bg-[#222222] hover:bg-[#2a2a2a] text-[#b4b4b4] hover:text-white text-[12px] font-medium transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Espera (Delay)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Node Inspector & Configuration Drawer */}
          <div className="lg:col-span-4 bg-[#111111] border border-[#1a1a1a] rounded-[8px] p-5 space-y-5 h-fit">
            <div className="flex items-center justify-between pb-3 border-b border-[#161616]">
              <h3 className="font-semibold text-[14px] text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#949494]" />
                <span>Configuração do passo</span>
              </h3>
              {selectedStep && (
                <button
                  onClick={() => setSelectedStep(null)}
                  className="text-[12px] text-[#949494] hover:text-white"
                >
                  Fechar
                </button>
              )}
            </div>

            {selectedStep ? (
              <div className="space-y-4 text-[13px]">
                <div>
                  <label className="block text-[12px] text-[#949494] font-medium mb-1.5">Título do passo</label>
                  <input
                    type="text"
                    value={selectedStep.label}
                    onChange={(e) => {
                      const updated = { ...selectedStep, label: e.target.value };
                      setSelectedStep(updated);
                      const updateInTree = (list: WorkflowStep[]): WorkflowStep[] =>
                        list.map((s) => {
                          if (s.id === updated.id) return updated;
                          if (s.yesSteps) s.yesSteps = updateInTree(s.yesSteps);
                          if (s.noSteps) s.noSteps = updateInTree(s.noSteps);
                          return s;
                        });
                      setActiveWorkflow({
                        ...activeWorkflow,
                        steps: updateInTree(activeWorkflow.steps || []),
                      });
                    }}
                    className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] text-white border border-[#222222] focus:outline-none focus:border-[#444444]"
                  />
                </div>

                {/* If Condition Config */}
                {selectedStep.stepType === 'condition' && (
                  <div className="p-3.5 rounded-[6px] bg-[#161616] border border-[#262626] space-y-3">
                    <span className="font-medium text-[var(--warn)] block text-[12px]">Regra da condição lógica</span>
                    <div>
                      <label className="block text-[12px] text-[#949494] mb-1">Campo para avaliar</label>
                      <select
                        value={selectedStep.config?.condition?.field || 'message'}
                        onChange={(e) => {
                          const updated = {
                            ...selectedStep,
                            config: {
                              ...selectedStep.config,
                              condition: {
                                ...(selectedStep.config?.condition || { operator: 'contains', value: '' }),
                                field: e.target.value as any,
                              },
                            },
                          };
                          setSelectedStep(updated);
                        }}
                        className="w-full h-9 px-2.5 rounded-[6px] bg-[#0a0a0a] text-white border border-[#222222] focus:outline-none focus:border-[#444444]"
                      >
                        <option value="message">Mensagem do WhatsApp (Texto)</option>
                        <option value="rating">Nota da avaliação do Google (1 a 5)</option>
                        <option value="lead_value">Valor estimado do lead (R$)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[12px] text-[#949494] mb-1">Operador</label>
                      <select
                        value={selectedStep.config?.condition?.operator || 'contains'}
                        onChange={(e) => {
                          const updated = {
                            ...selectedStep,
                            config: {
                              ...selectedStep.config,
                              condition: {
                                ...(selectedStep.config?.condition || { field: 'message', value: '' }),
                                operator: e.target.value as any,
                              },
                            },
                          };
                          setSelectedStep(updated);
                        }}
                        className="w-full h-9 px-2.5 rounded-[6px] bg-[#0a0a0a] text-white border border-[#222222] focus:outline-none focus:border-[#444444]"
                      >
                        <option value="contains">Contém o texto</option>
                        <option value="equals">É exatamente igual a</option>
                        <option value="greater_than">É maior que (&gt;)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[12px] text-[#949494] mb-1">Valor de referência</label>
                      <input
                        type="text"
                        value={selectedStep.config?.condition?.value || ''}
                        onChange={(e) => {
                          const updated = {
                            ...selectedStep,
                            config: {
                              ...selectedStep.config,
                              condition: {
                                ...(selectedStep.config?.condition || { field: 'message', operator: 'contains' }),
                                value: e.target.value,
                              },
                            },
                          };
                          setSelectedStep(updated);
                        }}
                        placeholder="Ex: orçamento, instalação..."
                        className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] text-white border border-[#222222] focus:outline-none focus:border-[#444444]"
                      />
                    </div>
                  </div>
                )}

                {/* If WhatsApp Message Config */}
                {selectedStep.actionType === 'send_whatsapp' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-[12px] text-[#949494] font-medium">Mensagem do WhatsApp</label>
                      <span className="text-[11px] text-[#b4b4b4]">Variáveis</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {['{{contact.name}}', '{{empresa}}', '{{telefone}}'].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            const current = selectedStep.config?.messageTemplate || '';
                            const updated = {
                              ...selectedStep,
                              config: { ...selectedStep.config, messageTemplate: `${current} ${chip}` },
                            };
                            setSelectedStep(updated);
                          }}
                          className="px-2 py-0.5 rounded-[4px] bg-[#161616] hover:bg-[#222222] text-[#b4b4b4] border border-[#2a2a2a] text-[11px]"
                        >
                          +{chip}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={5}
                      value={selectedStep.config?.messageTemplate || ''}
                      onChange={(e) => {
                        const updated = {
                          ...selectedStep,
                          config: { ...selectedStep.config, messageTemplate: e.target.value },
                        };
                        setSelectedStep(updated);
                      }}
                      className="w-full p-3 rounded-[6px] bg-[#0a0a0a] text-white border border-[#222222] focus:outline-none focus:border-[#444444] leading-relaxed"
                    />
                  </div>
                )}

                {/* If Delay Config */}
                {selectedStep.stepType === 'delay' && (
                  <div className="space-y-2">
                    <label className="block text-[12px] text-[#949494] font-medium">Tempo de espera (minutos)</label>
                    <input
                      type="number"
                      min="1"
                      value={selectedStep.config?.delayMinutes || 60}
                      onChange={(e) => {
                        const updated = {
                          ...selectedStep,
                          config: { ...selectedStep.config, delayMinutes: Number(e.target.value) },
                        };
                        setSelectedStep(updated);
                      }}
                      className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] text-white border border-[#222222] tabular-nums"
                    />
                    <p className="text-[12px] text-[#949494]">
                      Ex: 60 = 1 hora, 1440 = 24 horas. O sistema aguarda esse tempo antes de executar a próxima etapa.
                    </p>
                  </div>
                )}

                {/* If Move Stage Config */}
                {selectedStep.actionType === 'update_stage' && (
                  <div className="space-y-2">
                    <label className="block text-[12px] text-[#949494] font-medium">Etapa de destino no funil</label>
                    <select
                      value={selectedStep.config?.stageId || stages[0]?.id}
                      onChange={(e) => {
                        const updated = {
                          ...selectedStep,
                          config: { ...selectedStep.config, stageId: e.target.value },
                        };
                        setSelectedStep(updated);
                      }}
                      className="w-full h-9 px-2.5 rounded-[6px] bg-[#0a0a0a] text-white border border-[#222222]"
                    >
                      {stages.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="pt-4 border-t border-[#161616] flex justify-between gap-2">
                  <button
                    onClick={() => {
                      const removeFromTree = (list: WorkflowStep[]): WorkflowStep[] =>
                        list
                          .filter((s) => s.id !== selectedStep.id)
                          .map((s) => ({
                            ...s,
                            yesSteps: s.yesSteps ? removeFromTree(s.yesSteps) : [],
                            noSteps: s.noSteps ? removeFromTree(s.noSteps) : [],
                          }));
                      setActiveWorkflow({
                        ...activeWorkflow,
                        steps: removeFromTree(activeWorkflow.steps || []),
                      });
                      setSelectedStep(null);
                    }}
                    className="h-8 flex items-center gap-1.5 px-3 rounded-[6px] bg-[var(--err)]/15 hover:bg-[var(--err)]/25 text-[var(--err)] text-[12px] font-medium transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir nó</span>
                  </button>

                  <button
                    onClick={() => {
                      updateWorkflow(activeWorkflow);
                      setSelectedStep(null);
                    }}
                    className="h-8 px-3.5 rounded-[6px] bg-white hover:bg-[#e5e5e5] text-black text-[12px] font-medium transition-colors"
                  >
                    Aplicar configuração
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-[#949494] space-y-2">
                <Sliders className="w-6 h-6 mx-auto text-[#444444]" />
                <p className="text-[12px]">Selecione qualquer nó do fluxo ao lado para editar parâmetros e regras.</p>
              </div>
            )}
          </div>
        </div>

        {/* SIMULATOR MODAL */}
        {isSimulatorOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-[#111111] border border-[#222222] rounded-[8px] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-[var(--warn)] fill-current" />
                  <h3 className="font-semibold text-[14px] text-white">
                    Simulador de execução em tempo real
                  </h3>
                </div>
                <button
                  onClick={() => setIsSimulatorOpen(false)}
                  className="text-[#949494] hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-[13px] max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] text-[#949494] font-medium mb-1">Nome do contato de teste</label>
                    <input
                      type="text"
                      value={simContactName}
                      onChange={(e) => setSimContactName(e.target.value)}
                      className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] text-white border border-[#222222]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-[#949494] font-medium mb-1">WhatsApp de teste</label>
                    <input
                      type="text"
                      value={simContactPhone}
                      onChange={(e) => setSimContactPhone(e.target.value)}
                      className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] text-white border border-[#222222] tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] text-[#949494] font-medium mb-1">Mensagem recebida do contato</label>
                  <input
                    type="text"
                    value={simMessage}
                    onChange={(e) => setSimMessage(e.target.value)}
                    className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] text-white border border-[#222222]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleRunSimulator}
                    disabled={isSimulating}
                    className="h-9 flex items-center gap-2 px-4 rounded-[6px] bg-white hover:bg-[#e5e5e5] text-black font-medium transition-colors disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isSimulating ? 'Executando análise...' : 'Executar teste do fluxo'}</span>
                  </button>
                </div>

                {/* Simulation Trace Result */}
                {simulationTrace && (
                  <div className="mt-4 pt-4 border-t border-[#1a1a1a] space-y-3">
                    <h4 className="font-medium text-[12px] text-[#b4b4b4] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[var(--ok)]" />
                      <span>Rastro de execução:</span>
                    </h4>

                    <div className="space-y-2">
                      {simulationTrace.map((t, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-[6px] border ${
                            t.status === 'branch_yes'
                              ? 'bg-[var(--ok)]/10 border-[var(--ok)]/30 text-[var(--ok)]'
                              : t.status === 'branch_no'
                              ? 'bg-[var(--warn)]/10 border-[var(--warn)]/30 text-[var(--warn)]'
                              : t.status === 'waiting'
                              ? 'bg-[var(--warn)]/10 border-[var(--warn)]/30 text-[var(--warn)]'
                              : 'bg-[#161616] border-[#262626] text-white'
                          } space-y-1`}
                        >
                          <div className="flex items-center justify-between font-medium text-[12px]">
                            <span>
                              {idx + 1}. {t.title}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-black/40 text-[#b4b4b4]">
                              {t.type}
                            </span>
                          </div>
                          <p className="text-[12px] leading-relaxed text-[#b4b4b4]">{t.details}</p>
                          {t.outputPayload && (
                            <div className="mt-1 p-2 rounded-[4px] bg-[#0a0a0a] border border-[#1f1f1f] text-[11px] text-[#949494]">
                              Saída: {JSON.stringify(t.outputPayload)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW: WORKFLOWS DASHBOARD & LIST MODE
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#161616]">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-white">
            Automações e fluxos
          </h1>
          <p className="text-[13px] text-[#b4b4b4] mt-1">
            Fluxos condicionais com gatilhos de WhatsApp, ramificações lógicas e sincronização direta com o funil.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="h-8 flex items-center gap-1.5 px-3.5 rounded-[6px] bg-white hover:bg-[#e5e5e5] text-black text-[13px] font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova automação</span>
        </button>
      </div>

      {/* Divided KPI Strip */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-[8px] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#161616]">
        <div className="p-5">
          <div className="text-[12px] font-medium text-[#949494]">Automações ativas</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[26px] font-semibold tracking-[-0.03em] text-white tabular-nums">
              {activeCount}
            </span>
            <span className="text-[12px] text-[#949494] tabular-nums">de {workflows.length} fluxos</span>
          </div>
        </div>

        <div className="p-5">
          <div className="text-[12px] font-medium text-[#949494]">Total de disparos</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[26px] font-semibold tracking-[-0.03em] text-white tabular-nums">
              {totalDisparos}
            </span>
            <span className="text-[12px] text-[var(--ok)]">Em tempo real</span>
          </div>
        </div>

        <div className="p-5">
          <div className="text-[12px] font-medium text-[#949494]">Taxa de entrega</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[26px] font-semibold tracking-[-0.03em] text-white tabular-nums">
              99.4%
            </span>
            <span className="text-[12px] text-[#949494]">Webhook ativo</span>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-[6px] bg-[#111111] border border-[#1a1a1a] text-[12px] w-full sm:w-auto">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 rounded-[4px] font-medium transition-colors tabular-nums ${
              categoryFilter === 'all'
                ? 'bg-[#222222] text-white'
                : 'text-[#949494] hover:text-white'
            }`}
          >
            Todos ({workflows.length})
          </button>
          <button
            onClick={() => setCategoryFilter('whatsapp')}
            className={`px-3 py-1 rounded-[4px] font-medium transition-colors ${
              categoryFilter === 'whatsapp'
                ? 'bg-[#222222] text-white'
                : 'text-[#949494] hover:text-white'
            }`}
          >
            WhatsApp
          </button>
          <button
            onClick={() => setCategoryFilter('crm')}
            className={`px-3 py-1 rounded-[4px] font-medium transition-colors ${
              categoryFilter === 'crm'
                ? 'bg-[#222222] text-white'
                : 'text-[#949494] hover:text-white'
            }`}
          >
            Funil / CRM
          </button>
          <button
            onClick={() => setCategoryFilter('gmb')}
            className={`px-3 py-1 rounded-[4px] font-medium transition-colors ${
              categoryFilter === 'gmb'
                ? 'bg-[#222222] text-white'
                : 'text-[#949494] hover:text-white'
            }`}
          >
            Google (GMB)
          </button>
        </div>

        <input
          type="text"
          placeholder="Buscar automação..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64 h-8 px-3 rounded-[6px] bg-[#111111] border border-[#1a1a1a] text-[13px] text-white placeholder-[#949494] focus:outline-none focus:border-[#444444]"
        />
      </div>

      {/* Workflows List */}
      <div className="space-y-3">
        {filteredWorkflows.map((wf) => (
          <div
            key={wf.id}
            className="p-5 bg-[#111111] rounded-[8px] border border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors space-y-4"
          >
            {/* Top row: Name, trigger, toggle switch */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-semibold text-[15px] text-white">
                    {wf.name}
                  </h3>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-[4px] font-medium ${
                      wf.isActive
                        ? 'bg-[var(--ok)]/15 text-[var(--ok)]'
                        : 'bg-[#1a1a1a] text-[#949494]'
                    }`}
                  >
                    {wf.isActive ? 'Em execução' : 'Pausado'}
                  </span>
                </div>
                <p className="text-[13px] text-[#b4b4b4] leading-relaxed max-w-[65ch]">{wf.description}</p>
              </div>

              {/* Status Toggle & Executions */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right text-[12px] tabular-nums">
                  <span className="text-[#949494]">Disparos: </span>
                  <span className="font-semibold text-white">{wf.totalExecutions || 0}</span>
                </div>
                <button
                  onClick={() => toggleWorkflow(wf.id)}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                    wf.isActive ? 'bg-[var(--ok)] justify-end' : 'bg-[#2a2a2a] justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-black" />
                </button>
              </div>
            </div>

            {/* Visual Node Diagram Summary of the Flow */}
            <div className="p-3 rounded-[6px] bg-[#0a0a0a] border border-[#161616] flex flex-wrap items-center gap-2 text-[12px]">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#161616] border border-[#262626] text-white font-medium">
                <Zap className="w-3.5 h-3.5 text-[#c6f24e]" />
                <span>{wf.triggerLabel}</span>
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-[#949494]" />

              {wf.steps && wf.steps.length > 0 ? (
                wf.steps.map((st, idx) => (
                  <React.Fragment key={st.id}>
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] font-medium ${
                        st.stepType === 'condition'
                          ? 'bg-[var(--warn)]/10 border border-[var(--warn)]/30 text-[var(--warn)]'
                          : st.stepType === 'delay'
                          ? 'bg-[#161616] border border-[#262626] text-[#b4b4b4]'
                          : 'bg-[var(--ok)]/10 border border-[var(--ok)]/30 text-[var(--ok)]'
                      }`}
                    >
                      {st.stepType === 'condition' ? (
                        <Filter className="w-3.5 h-3.5" />
                      ) : st.stepType === 'delay' ? (
                        <Clock className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>{st.label}</span>
                    </div>
                    {idx < (wf.steps?.length || 0) - 1 && <ArrowRight className="w-3.5 h-3.5 text-[#949494]" />}
                  </React.Fragment>
                ))
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[var(--ok)]/10 border border-[var(--ok)]/30 text-[var(--ok)] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ações automáticas padrão</span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-[#161616] text-[12px]">
              <span className="text-[#949494]">
                Subconta: <strong className="text-[#b4b4b4] font-medium">{currentSubaccount.name}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveWorkflow(wf);
                    setIsSimulatorOpen(true);
                    setSimulationTrace(null);
                  }}
                  className="h-8 flex items-center gap-1.5 px-3 rounded-[6px] bg-[#161616] hover:bg-[#1f1f1f] border border-[#2a2a2a] text-[#b4b4b4] hover:text-white font-medium transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Testar</span>
                </button>

                <button
                  onClick={() => setActiveWorkflow(wf)}
                  className="h-8 flex items-center gap-1.5 px-3.5 rounded-[6px] bg-white hover:bg-[#e5e5e5] text-black font-medium transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Editar fluxo</span>
                </button>

                <button
                  onClick={() => deleteWorkflow(wf.id)}
                  className="h-8 w-8 flex items-center justify-center rounded-[6px] text-[#949494] hover:text-[var(--err)] hover:bg-[#161616] transition-colors"
                  title="Excluir automação"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Workflow Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111111] border border-[#222222] rounded-[8px] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
              <h3 className="font-semibold text-[15px] text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#c6f24e]" />
                <span>Criar novo fluxo de automação</span>
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-[#949494] hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkflow} className="p-5 space-y-4 text-[13px]">
              <div>
                <label className="block text-[12px] text-[#949494] font-medium mb-1.5">Nome do fluxo</label>
                <input
                  type="text"
                  placeholder="Ex: Triagem Automática de Climatização & Elétrica"
                  value={wfName}
                  onChange={(e) => setWfName(e.target.value)}
                  className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] text-white border border-[#222222] focus:outline-none focus:border-[#444444]"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] text-[#949494] font-medium mb-1.5">Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Explique o objetivo deste fluxo para a equipe..."
                  value={wfDescription}
                  onChange={(e) => setWfDescription(e.target.value)}
                  className="w-full p-3 rounded-[6px] bg-[#0a0a0a] text-white border border-[#222222] focus:outline-none focus:border-[#444444]"
                />
              </div>

              <div>
                <label className="block text-[12px] text-[#949494] font-medium mb-1.5">Evento de gatilho</label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value as any)}
                  className="w-full h-9 px-2.5 rounded-[6px] bg-[#0a0a0a] text-white border border-[#222222] focus:outline-none focus:border-[#444444]"
                >
                  <option value="whatsapp_received">Mensagem recebida no WhatsApp</option>
                  <option value="lead_created">Novo lead cadastrado no CRM</option>
                  <option value="stage_changed">Oportunidade mudou de etapa no funil</option>
                  <option value="gmb_review_received">Nova avaliação recebida no Google</option>
                  <option value="tag_added">Tag adicionada ao contato</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="h-9 px-4 rounded-[6px] bg-[#161616] hover:bg-[#222222] text-[#b4b4b4] hover:text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-[6px] bg-white hover:bg-[#e5e5e5] text-black font-medium transition-colors"
                >
                  Salvar e abrir no editor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
