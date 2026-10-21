'use client';

import React, { useState } from 'react';
import {
  Plus,
  Phone,
  Building,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  Calendar,
  Tag,
  CheckCircle,
  XCircle,
  FileText,
  MessageSquare,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Lead } from '@/types';
import { ActiveTab } from '@/components/Sidebar';

interface CRMViewProps {
  onOpenNewLeadModal: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export function CRMView({ onOpenNewLeadModal, setActiveTab }: CRMViewProps) {
  const { leads, stages, moveLeadStage, updateLead, deleteLead, setActiveContact, contacts } = useApp();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenLeadModal = (lead: Lead) => {
    setSelectedLead(lead);
    setTempNotes(lead.notes);
    setEditingNotes(false);
  };

  const handleDeleteOpportunity = async () => {
    if (!selectedLead) return;
    if (!confirm(`Tem certeza que deseja excluir a oportunidade "${selectedLead.name}"?`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteLead(selectedLead.id);
      setSelectedLead(null);
    } catch (err: any) {
      alert(`Erro ao excluir oportunidade: ${err.message || 'Falha de comunicação'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveNotes = () => {
    if (selectedLead) {
      const updated = { ...selectedLead, notes: tempNotes, lastActivity: 'Anotações atualizadas' };
      updateLead(updated);
      setSelectedLead(updated);
      setEditingNotes(false);
    }
  };

  const handleOpenWhatsApp = (lead: Lead) => {
    const leadClean = (lead.phone || '').replace(/[^0-9]/g, '');
    const contact = contacts.find((c) => {
      const cClean = (c.phone || '').replace(/[^0-9]/g, '');
      return (
        (cClean && leadClean && (cClean.includes(leadClean.slice(-8)) || leadClean.includes(cClean.slice(-8)))) ||
        (c.name && lead.name && c.name.toLowerCase().trim() === lead.name.toLowerCase().trim())
      );
    });
    if (contact) {
      setActiveContact(contact);
    }
    setActiveTab('whatsapp');
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* CRM Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Funil de Vendas (CRM Kanban)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Arraste ou mova leads entre etapas para atualizar o status e acionar gatilhos de automação.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewLeadModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Oportunidade</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Horizontal Scroll */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1100px] h-full items-start">
          {stages.map((stage, stageIdx) => {
            const stageLeads = leads.filter((l) => l.stageId === stage.id);
            const stageTotal = stageLeads.reduce((acc, curr) => acc + curr.value, 0);

            return (
              <div
                key={stage.id}
                className="w-72 bg-slate-100/80 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[calc(100vh-12rem)] shadow-sm shrink-0"
              >
                {/* Column Header */}
                <div className={`p-3 border-t-4 rounded-t-xl ${stage.color} bg-white dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/60`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{stage.name}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                      {stageLeads.length}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stageTotal)}
                  </p>
                </div>

                {/* Cards Container */}
                <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                  {stageLeads.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg">
                      Nenhum lead nesta etapa
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => handleOpenLeadModal(lead)}
                        className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-md transition cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <h4 className="font-semibold text-xs text-slate-900 dark:text-white group-hover:text-blue-500 transition line-clamp-1">
                            {lead.name}
                          </h4>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value)}
                          </span>
                        </div>

                        {lead.company && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-2 truncate">
                            <Building className="w-3 h-3 shrink-0" />
                            <span className="truncate">{lead.company}</span>
                          </div>
                        )}

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-2.5">
                          {lead.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Footer & Actions */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="truncate text-[10px]">{lead.lastActivity}</span>

                          {/* Quick Stage Mover Buttons */}
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              title="Abrir WhatsApp"
                              onClick={() => handleOpenWhatsApp(lead)}
                              className="p-1 rounded text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </button>

                            {stageIdx > 0 && (
                              <button
                                title="Mover para etapa anterior"
                                onClick={() => moveLeadStage(lead.id, stages[stageIdx - 1].id)}
                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-white"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                            )}

                            {stageIdx < stages.length - 1 && (
                              <button
                                title="Mover para próxima etapa"
                                onClick={() => moveLeadStage(lead.id, stages[stageIdx + 1].id)}
                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-white"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}

                            <button
                              title="Excluir Oportunidade"
                              onClick={async () => {
                                if (confirm(`Deseja excluir a oportunidade "${lead.name}"?`)) {
                                  try {
                                    await deleteLead(lead.id);
                                  } catch (err: any) {
                                    alert(`Erro ao excluir oportunidade: ${err.message || 'Falha de conexão'}`);
                                  }
                                }
                              }}
                              className="p-1 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lead Details Modal 360° */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base">
                  {selectedLead.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{selectedLead.name}</h3>
                  <p className="text-xs text-slate-500">{selectedLead.company || 'Pessoa Física'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Valor da Oportunidade</span>
                  <p className="font-bold text-sm text-emerald-500 mt-0.5">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedLead.value)}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Telefone / WhatsApp</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedLead.phone}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Etapa Atual</span>
                  <p className="font-semibold text-blue-500 mt-0.5">
                    {stages.find((s) => s.id === selectedLead.stageId)?.name}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Status do Negócio</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 capitalize mt-0.5">
                    {selectedLead.status === 'won' ? 'Ganho / Fechado' : 'Em Negociação'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => {
                    handleOpenWhatsApp(selectedLead);
                    setSelectedLead(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Conversar no WhatsApp</span>
                </button>
                <button
                  onClick={() => {
                    moveLeadStage(selectedLead.id, 'stage-5');
                    setSelectedLead({ ...selectedLead, stageId: 'stage-5', status: 'won' });
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Marcar como Ganho</span>
                </button>
              </div>

              {/* Notes & Timeline */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span>Anotações e Histórico Comercial</span>
                  </span>
                  {!editingNotes ? (
                    <button
                      onClick={() => setEditingNotes(true)}
                      className="text-blue-500 hover:underline font-semibold"
                    >
                      Editar
                    </button>
                  ) : (
                    <button onClick={handleSaveNotes} className="text-emerald-500 hover:underline font-semibold">
                      Salvar Anotação
                    </button>
                  )}
                </div>

                {editingNotes ? (
                  <textarea
                    rows={4}
                    value={tempNotes}
                    onChange={(e) => setTempNotes(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {selectedLead.notes || 'Nenhuma anotação registrada ainda.'}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteOpportunity}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-semibold shadow-md shadow-red-600/20 transition disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Oportunidade</span>
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
