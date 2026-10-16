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
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { WorkflowRule } from '@/types';

export function WorkflowsView() {
  const { currentSubaccount, workflows, toggleWorkflow, addWorkflow } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [wfName, setWfName] = useState('');
  const [wfDescription, setWfDescription] = useState('');
  const [triggerType, setTriggerType] = useState<WorkflowRule['triggerType']>('whatsapp_received');
  const [action1, setAction1] = useState<'send_whatsapp' | 'add_tag' | 'update_stage'>('send_whatsapp');

  const handleCreateWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wfName.trim()) return;

    let triggerLabel = 'Quando uma mensagem chegar no WhatsApp';
    if (triggerType === 'lead_created') triggerLabel = 'Quando um novo Lead for cadastrado';
    if (triggerType === 'stage_changed') triggerLabel = 'Quando o Lead mudar de etapa no Kanban';
    if (triggerType === 'gmb_review_received') triggerLabel = 'Quando uma nova avaliação chegar no Google';

    addWorkflow({
      subaccountId: currentSubaccount.id,
      name: wfName,
      description: wfDescription || 'Automação personalizada de alta conversão.',
      triggerType,
      triggerLabel,
      isActive: true,
      actions: [
        {
          id: `act-${Date.now()}-1`,
          type: action1,
          label:
            action1 === 'send_whatsapp'
              ? 'Disparar mensagem no WhatsApp'
              : action1 === 'add_tag'
              ? 'Adicionar tag no contato'
              : 'Mover lead no CRM',
          config: {},
        },
      ],
    });

    setIsModalOpen(false);
    setWfName('');
    setWfDescription('');
  };

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
            Crie fluxos inteligentes que conectam o CRM, disparos de WhatsApp e avaliações do Google em piloto automático.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Nova Automação</span>
        </button>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {workflows.map((wf) => (
          <div
            key={wf.id}
            className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
          >
            {/* Top row: Name, trigger, toggle switch */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{wf.name}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      wf.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
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
                  <span className="font-bold text-slate-900 dark:text-white">{wf.totalExecutions}</span>
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

            {/* Visual Node Diagram of the Flow */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center gap-3 text-xs">
              {/* Trigger Node */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600/10 border border-blue-500/30 text-blue-400 font-semibold">
                <Zap className="w-3.5 h-3.5" />
                <span>Gatilho: {wf.triggerLabel}</span>
              </div>

              <span className="text-slate-500 font-bold">➔</span>

              {/* Action Nodes */}
              {wf.actions.map((act, idx) => (
                <React.Fragment key={act.id}>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{act.label}</span>
                  </div>
                  {idx < wf.actions.length - 1 && <span className="text-slate-500 font-bold">➔</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* New Workflow Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <span>Criar Novo Fluxo de Automação</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWorkflow} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nome do Fluxo</label>
                <input
                  type="text"
                  placeholder="Ex: Resposta Automática a Novos Leads"
                  value={wfName}
                  onChange={(e) => setWfName(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Explique o que essa automação faz..."
                  value={wfDescription}
                  onChange={(e) => setWfDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Trigger */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Evento de Gatilho (Quando acontecer:)</label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="whatsapp_received">Nova Mensagem Recebida no WhatsApp</option>
                  <option value="lead_created">Novo Lead Cadastrado no CRM</option>
                  <option value="stage_changed">Oportunidade Mudou de Etapa no Funil</option>
                  <option value="gmb_review_received">Nova Avaliação Recebida no Google Meu Negócio</option>
                </select>
              </div>

              {/* Action */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Ação Imediata (Fazer o seguinte:)</label>
                <select
                  value={action1}
                  onChange={(e) => setAction1(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="send_whatsapp">Enviar Mensagem Instantânea no WhatsApp</option>
                  <option value="add_tag">Adicionar Tag de Qualificação no Contato</option>
                  <option value="update_stage">Mover Lead para a Próxima Etapa no Kanban</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                >
                  Salvar e Ativar Fluxo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
