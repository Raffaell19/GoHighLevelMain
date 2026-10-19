'use client';

import React, { useState } from 'react';
import {
  GitBranch,
  Zap,
  Play,
  Plus,
  CheckCircle2,
  ArrowDown,
  MessageSquare,
  Tag,
  Star,
  Users,
  Settings,
  Clock,
  Trash2,
  Copy,
  ChevronRight,
  Sparkles,
  Filter,
  ArrowRight,
  CornerDownRight,
  Send,
  X,
  Eye,
  Sliders,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { WorkflowRule, WorkflowStep, WorkflowStepType, WorkflowActionType } from '@/types';

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
  const [selectedBranch, setSelectedBranch] = useState<'root' | 'yes' | 'no'>('root');

  // Simulator State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simContactName, setSimContactName] = useState('Carlos Eduardo');
  const [simContactPhone, setSimContactPhone] = useState('(11) 98765-4321');
  const [simMessage, setSimMessage] = useState('Olá! Gostaria de um orçamento para instalação de 2 ar-condicionados');
  const [simRating, setSimRating] = useState(5);
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

  // Helper to add a step to the active workflow
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
  // VIEW: FULL VISUAL BUILDER (CANVAS GHL STYLE)
  // =========================================================================
  if (activeWorkflow) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Top Builder Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveWorkflow(null);
                setSelectedStep(null);
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <span>← Voltar à Lista</span>
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={activeWorkflow.name}
                  onChange={(e) => setActiveWorkflow({ ...activeWorkflow, name: e.target.value })}
                  className="font-bold text-base text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-400 focus:border-blue-500 focus:outline-none transition px-1"
                />
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    activeWorkflow.isActive
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {activeWorkflow.isActive ? 'Publicado / Ativo' : 'Rascunho'}
                </span>
              </div>
              <p className="text-xs text-slate-400 px-1 mt-0.5">{activeWorkflow.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                setIsSimulatorOpen(true);
                setSimulationTrace(null);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-semibold transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Testar Automação</span>
            </button>

            <button
              onClick={() => {
                const nextState = !activeWorkflow.isActive;
                const updated = { ...activeWorkflow, isActive: nextState };
                setActiveWorkflow(updated);
                updateWorkflow(updated);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeWorkflow.isActive
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{activeWorkflow.isActive ? 'Pausar Fluxo' : 'Publicar Fluxo'}</span>
            </button>

            <button
              onClick={handleUpdateActiveWorkflow}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>

        {/* Builder Layout: Canvas Graph + Node Config Drawer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Canvas Flow Graph */}
          <div className="lg:col-span-8 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 min-h-[600px] flex flex-col items-center relative overflow-x-auto shadow-inner">
            <div className="w-full max-w-xl flex flex-col items-center space-y-6">
              {/* 1. TRIGGER NODE */}
              <div
                onClick={() => setSelectedStep(null)}
                className="w-full bg-white dark:bg-slate-900 border-2 border-blue-500/60 hover:border-blue-500 rounded-2xl p-5 shadow-lg shadow-blue-500/5 cursor-pointer transition transform hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
                      <Zap className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                        Gatilho Inicial (Trigger)
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {activeWorkflow.triggerLabel}
                      </h4>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    {activeWorkflow.triggerType}
                  </span>
                </div>

                <div className="pt-3 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-1.5 items-center">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Filtro de ativação:</span>
                  {activeWorkflow.triggerConfig?.keywords && activeWorkflow.triggerConfig.keywords.length > 0 ? (
                    activeWorkflow.triggerConfig.keywords.map((k, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 rounded-md text-[10px] font-medium"
                      >
                        &quot;{k}&quot;
                      </span>
                    ))
                  ) : (
                    <span className="italic text-slate-400">Qualquer mensagem / evento</span>
                  )}
                </div>
              </div>

              {/* Connecting Connector Arrow */}
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-6 bg-blue-500/40" />
                <ArrowDown className="w-4 h-4 text-blue-500" />
              </div>

              {/* 2. SEQUENTIAL & CONDITIONAL STEPS */}
              {activeWorkflow.steps && activeWorkflow.steps.length > 0 ? (
                activeWorkflow.steps.map((step, idx) => (
                  <React.Fragment key={step.id}>
                    {step.stepType === 'condition' ? (
                      /* CONDITIONAL IF/ELSE NODE */
                      <div className="w-full flex flex-col items-center space-y-4">
                        {/* Condition Diamond Card */}
                        <div
                          onClick={() => setSelectedStep(step)}
                          className={`w-full bg-white dark:bg-slate-900 border-2 ${
                            selectedStep?.id === step.id ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-amber-500/50 hover:border-amber-500'
                          } rounded-2xl p-5 shadow-lg shadow-amber-500/5 cursor-pointer transition`}
                        >
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/30">
                                <Filter className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                                  Bifurcação Condicional (IF / ELSE)
                                </span>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                  {step.label}
                                </h4>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              Decisão Lógica
                            </span>
                          </div>

                          <div className="pt-3 text-xs text-slate-500 dark:text-slate-400">
                            Campo: <span className="font-semibold text-slate-800 dark:text-slate-200">{step.config?.condition?.field || 'mensagem'}</span>{' '}
                            {step.config?.condition?.operator === 'contains' ? 'contém' : 'é igual a'}{' '}
                            <span className="font-semibold text-amber-600 dark:text-amber-400">&quot;{step.config?.condition?.value || ''}&quot;</span>
                          </div>
                        </div>

                        {/* Dual Branch Visualizer: YES (SIM) vs NO (NÃO) */}
                        <div className="w-full grid grid-cols-2 gap-4 pt-2">
                          {/* Branch YES (SIM) */}
                          <div className="flex flex-col items-center space-y-3 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Branch SIM (Atende)</span>
                            </div>

                            {step.yesSteps?.map((subStep) => (
                              <div
                                key={subStep.id}
                                onClick={() => setSelectedStep(subStep)}
                                className={`w-full bg-white dark:bg-slate-900 border ${
                                  selectedStep?.id === subStep.id ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-emerald-500/30 hover:border-emerald-500'
                                } p-3.5 rounded-xl shadow-sm cursor-pointer text-xs space-y-2`}
                              >
                                <div className="flex items-center gap-2 text-emerald-500 font-bold">
                                  {subStep.actionType === 'send_whatsapp' && <MessageSquare className="w-3.5 h-3.5" />}
                                  {subStep.actionType === 'add_tag' && <Tag className="w-3.5 h-3.5" />}
                                  {subStep.actionType === 'update_stage' && <Users className="w-3.5 h-3.5" />}
                                  <span>{subStep.label}</span>
                                </div>
                                {subStep.config?.messageTemplate && (
                                  <p className="text-[11px] text-slate-500 line-clamp-2 italic bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded">
                                    &quot;{subStep.config.messageTemplate}&quot;
                                  </p>
                                )}
                              </div>
                            ))}

                            <button
                              onClick={() => handleAddStepToWorkflow('action', 'yes', step.id)}
                              className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1 py-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Adicionar Ação ao SIM</span>
                            </button>
                          </div>

                          {/* Branch NO (NÃO) */}
                          <div className="flex flex-col items-center space-y-3 p-3 rounded-2xl bg-slate-500/5 border border-slate-500/20">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                              <X className="w-3.5 h-3.5" />
                              <span>Branch NÃO (Outro)</span>
                            </div>

                            {step.noSteps?.map((subStep) => (
                              <div
                                key={subStep.id}
                                onClick={() => setSelectedStep(subStep)}
                                className={`w-full bg-white dark:bg-slate-900 border ${
                                  selectedStep?.id === subStep.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-300 dark:border-slate-700 hover:border-blue-500'
                                } p-3.5 rounded-xl shadow-sm cursor-pointer text-xs space-y-2`}
                              >
                                <div className="flex items-center gap-2 text-blue-500 font-bold">
                                  {subStep.actionType === 'ai_toggle' ? <Sparkles className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                                  <span>{subStep.label}</span>
                                </div>
                                <p className="text-[11px] text-slate-500 line-clamp-2 italic bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded">
                                  {subStep.actionType === 'ai_toggle' ? 'Atendente Inteligente ativado' : subStep.label}
                                </p>
                              </div>
                            ))}

                            <button
                              onClick={() => handleAddStepToWorkflow('action', 'no', step.id)}
                              className="text-[10px] font-semibold text-slate-500 hover:text-slate-400 flex items-center gap-1 py-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Adicionar Ação ao NÃO</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* LINEAR STEP (ACTION OR DELAY) */
                      <div
                        onClick={() => setSelectedStep(step)}
                        className={`w-full bg-white dark:bg-slate-900 border-2 ${
                          selectedStep?.id === step.id
                            ? 'border-blue-500 ring-2 ring-blue-500/20'
                            : step.stepType === 'delay'
                            ? 'border-amber-400/40 hover:border-amber-400'
                            : 'border-slate-200 dark:border-slate-800 hover:border-blue-500'
                        } rounded-2xl p-5 shadow-sm cursor-pointer transition`}
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md ${
                                step.stepType === 'delay'
                                  ? 'bg-amber-500 shadow-amber-500/30'
                                  : 'bg-emerald-600 shadow-emerald-600/30'
                              }`}
                            >
                              {step.stepType === 'delay' ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </div>
                            <div>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider ${
                                  step.stepType === 'delay' ? 'text-amber-500' : 'text-emerald-500'
                                }`}
                              >
                                {step.stepType === 'delay' ? 'Temporizador / Espera' : 'Ação Automatizada'}
                              </span>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{step.label}</h4>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">
                            Passo {step.stepOrder || idx + 1}
                          </span>
                        </div>

                        {step.config?.messageTemplate && (
                          <div className="pt-3 text-xs text-slate-500 dark:text-slate-400">
                            <p className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50 italic">
                              &quot;{step.config.messageTemplate}&quot;
                            </p>
                          </div>
                        )}

                        {step.stepType === 'delay' && (
                          <div className="pt-3 text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Espera de {step.config?.delayMinutes || 60} minutos antes de prosseguir.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Connecting Connector Arrow between steps */}
                    {idx < (activeWorkflow.steps?.length || 0) - 1 && (
                      <div className="flex flex-col items-center">
                        <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700" />
                        <ArrowDown className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  Nenhum passo adicionado ainda. Clique abaixo para construir o fluxo.
                </div>
              )}

              {/* Action Toolbar to append nodes */}
              <div className="flex flex-col items-center pt-4">
                <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
                  <button
                    onClick={() => handleAddStepToWorkflow('action')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-semibold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Ação (WhatsApp/CRM)</span>
                  </button>

                  <button
                    onClick={() => handleAddStepToWorkflow('condition')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 text-xs font-semibold transition"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>+ Condição (IF / ELSE)</span>
                  </button>

                  <button
                    onClick={() => handleAddStepToWorkflow('delay')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>+ Delay (Espera)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Node Inspector & Configuration Drawer */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-500" />
                <span>Painel de Configuração do Nó</span>
              </h3>
              {selectedStep && (
                <button
                  onClick={() => setSelectedStep(null)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Fechar
                </button>
              )}
            </div>

            {selectedStep ? (
              <div className="space-y-4 text-xs animate-in fade-in duration-200">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Título do Passo</label>
                  <input
                    type="text"
                    value={selectedStep.label}
                    onChange={(e) => {
                      const updated = { ...selectedStep, label: e.target.value };
                      setSelectedStep(updated);
                      // Update active workflow step list
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
                    className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* If Condition Config */}
                {selectedStep.stepType === 'condition' && (
                  <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                    <span className="font-bold text-amber-500 block">Regra da Condição Lógica:</span>
                    <div>
                      <label className="block text-slate-400 mb-1">Campo para avaliar:</label>
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
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                      >
                        <option value="message">Mensagem do WhatsApp (Texto)</option>
                        <option value="rating">Nota da Avaliação do Google (1 a 5)</option>
                        <option value="lead_value">Valor Estimado do Lead (R$)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Operador:</label>
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
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                      >
                        <option value="contains">Contém o texto</option>
                        <option value="equals">É exatamente igual a</option>
                        <option value="greater_than">É maior que (&gt;)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Valor de Referência:</label>
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
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </div>
                )}

                {/* If WhatsApp Message Config */}
                {selectedStep.actionType === 'send_whatsapp' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-400 font-semibold">Mensagem do WhatsApp</label>
                      <span className="text-[10px] text-blue-500 font-semibold">Variáveis disponíveis</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
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
                          className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 text-[10px] font-mono"
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
                      className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500 leading-relaxed"
                    />
                  </div>
                )}

                {/* If Delay Config */}
                {selectedStep.stepType === 'delay' && (
                  <div className="space-y-3">
                    <label className="block text-slate-400 font-semibold">Tempo de Espera (Minutos)</label>
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
                      className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700"
                    />
                    <p className="text-[11px] text-slate-400">
                      Ex: 60 = 1 hora, 1440 = 24 horas. O sistema aguarda esse tempo antes de executar a próxima etapa.
                    </p>
                  </div>
                )}

                {/* If Move Stage Config */}
                {selectedStep.actionType === 'update_stage' && (
                  <div className="space-y-3">
                    <label className="block text-slate-400 font-semibold">Etapa de Destino no Funil</label>
                    <select
                      value={selectedStep.config?.stageId || stages[0]?.id}
                      onChange={(e) => {
                        const updated = {
                          ...selectedStep,
                          config: { ...selectedStep.config, stageId: e.target.value },
                        };
                        setSelectedStep(updated);
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700"
                    >
                      {stages.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                  <button
                    onClick={() => {
                      // Remove step from tree
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-semibold transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Nó</span>
                  </button>

                  <button
                    onClick={() => {
                      updateWorkflow(activeWorkflow);
                      setSelectedStep(null);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow-md shadow-blue-600/20"
                  >
                    Aplicar Configuração
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-3">
                <Sliders className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-xs">Clique em qualquer nó do fluxo ao lado para editar parâmetros e regras.</p>
              </div>
            )}
          </div>
        </div>

        {/* SIMULATOR MODAL */}
        {isSimulatorOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-amber-500 fill-current" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Simulador & Auditor de Execução em Tempo Real
                  </h3>
                </div>
                <button
                  onClick={() => setIsSimulatorOpen(false)}
                  className="text-slate-400 hover:text-white font-bold px-2 py-1"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Nome do Contato Mock</label>
                    <input
                      type="text"
                      value={simContactName}
                      onChange={(e) => setSimContactName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">WhatsApp de Teste</label>
                    <input
                      type="text"
                      value={simContactPhone}
                      onChange={(e) => setSimContactPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Mensagem Recebida do Contato</label>
                  <input
                    type="text"
                    value={simMessage}
                    onChange={(e) => setSimMessage(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleRunSimulator}
                    disabled={isSimulating}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-500/20 transition disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{isSimulating ? 'Executando Análise...' : 'Executar Teste do Fluxo'}</span>
                  </button>
                </div>

                {/* Simulation Trace Result */}
                {simulationTrace && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Rastro de Execução (Timeline GoHighLevel):</span>
                    </h4>

                    <div className="space-y-2.5">
                      {simulationTrace.map((t, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border ${
                            t.status === 'branch_yes'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                              : t.status === 'branch_no'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                              : t.status === 'waiting'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                          } space-y-1`}
                        >
                          <div className="flex items-center justify-between font-bold text-xs">
                            <span>
                              {idx + 1}. {t.title}
                            </span>
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">
                              {t.type}
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed opacity-90">{t.details}</p>
                          {t.outputPayload && (
                            <div className="mt-1 p-2 rounded bg-black/5 dark:bg-black/30 font-mono text-[10px]">
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-500" />
            <span>Motor de Automações & Workflows (GHL Style)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Crie fluxos condicionais com gatilhos de WhatsApp, ramificações IF / ELSE e sincronização contínua com o CRM.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Nova Automação</span>
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Automações Ativas</span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {activeCount} <span className="text-xs font-normal text-slate-400">de {workflows.length}</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total de Disparos</span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalDisparos}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Taxa de Execução</span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">99.4%</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-xs w-full sm:w-auto">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              categoryFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todos ({workflows.length})
          </button>
          <button
            onClick={() => setCategoryFilter('whatsapp')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              categoryFilter === 'whatsapp'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            WhatsApp
          </button>
          <button
            onClick={() => setCategoryFilter('crm')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              categoryFilter === 'crm'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Funil / CRM
          </button>
          <button
            onClick={() => setCategoryFilter('gmb')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              categoryFilter === 'gmb'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
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
          className="w-full sm:w-64 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {filteredWorkflows.map((wf) => (
          <div
            key={wf.id}
            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-4 group"
          >
            {/* Top row: Name, trigger, toggle switch */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-500 transition">
                    {wf.name}
                  </h3>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                      wf.isActive
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {wf.isActive ? 'Em Execução' : 'Pausado'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">{wf.description}</p>
              </div>

              {/* Status Toggle & Executions */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right text-xs">
                  <span className="text-slate-400">Disparos: </span>
                  <span className="font-bold text-slate-900 dark:text-white">{wf.totalExecutions || 0}</span>
                </div>
                <button
                  onClick={() => toggleWorkflow(wf.id)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                    wf.isActive ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md transform" />
                </button>
              </div>
            </div>

            {/* Visual Node Diagram Summary of the Flow */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-2.5 text-xs">
              {/* Trigger Node */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 border border-blue-500/30 text-blue-500 font-semibold text-xs">
                <Zap className="w-3.5 h-3.5" />
                <span>{wf.triggerLabel}</span>
              </div>

              <span className="text-slate-400 font-bold">➔</span>

              {/* Steps/Conditions summary */}
              {wf.steps && wf.steps.length > 0 ? (
                wf.steps.map((st, idx) => (
                  <React.Fragment key={st.id}>
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        st.stepType === 'condition'
                          ? 'bg-amber-500/10 border border-amber-500/30 text-amber-500'
                          : st.stepType === 'delay'
                          ? 'bg-slate-500/10 border border-slate-500/30 text-slate-400'
                          : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500'
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
                    {idx < (wf.steps?.length || 0) - 1 && <span className="text-slate-400 font-bold">➔</span>}
                  </React.Fragment>
                ))
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-semibold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ações automáticas padrão</span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              <span className="text-slate-400 text-[11px]">
                Subconta: <strong className="text-slate-700 dark:text-slate-300">{currentSubaccount.name}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveWorkflow(wf);
                    setIsSimulatorOpen(true);
                    setSimulationTrace(null);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-semibold transition"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Testar</span>
                </button>

                <button
                  onClick={() => setActiveWorkflow(wf)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow-sm"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Abrir no Visual Canvas</span>
                </button>

                <button
                  onClick={() => deleteWorkflow(wf.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <span>Criar Novo Fluxo de Automação (GHL Style)</span>
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWorkflow} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nome do Fluxo</label>
                <input
                  type="text"
                  placeholder="Ex: Triagem Automática de Climatização & Elétrica"
                  value={wfName}
                  onChange={(e) => setWfName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Explique o objetivo deste fluxo para a equipe..."
                  value={wfDescription}
                  onChange={(e) => setWfDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Evento de Gatilho (Trigger)</label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="whatsapp_received">💬 Mensagem Recebida no WhatsApp</option>
                  <option value="lead_created">👤 Novo Lead Cadastrado no CRM</option>
                  <option value="stage_changed">📊 Oportunidade Mudou de Etapa no Funil</option>
                  <option value="gmb_review_received">⭐ Nova Avaliação Recebida no Google</option>
                  <option value="tag_added">🏷️ Tag Adicionada ao Contato</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow-md shadow-blue-600/30"
                >
                  Salvar e Abrir no Canvas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
