'use client';

import React, { useState } from 'react';
import {
  Plus,
  Phone,
  Building,
  ArrowRight,
  Trash2,
  X,
  Check,
  Search,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Lead } from '@/types';

interface CRMViewProps {
  onOpenNewLead: () => void;
}

export default function CRMView({ onOpenNewLead }: CRMViewProps) {
  const { leads, stages, moveLeadStage, updateLead, deleteLead, currentSubaccount } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [valueInput, setValueInput] = useState('');
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPipelineValue = filteredLeads.reduce((acc, l) => acc + l.value, 0);

  const handleOpenLeadDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setNoteInput(lead.notes);
    setValueInput(lead.value.toString());
  };

  const handleSaveLeadChanges = () => {
    if (!selectedLead) return;
    updateLead({
      ...selectedLead,
      notes: noteInput,
      value: Number(valueInput) || 0,
      lastActivity: 'Atualizado agora',
    });
    setSelectedLead(null);
  };

  const handleRequestDelete = (lead: Lead, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setLeadToDelete(lead);
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    setIsDeleting(true);
    try {
      await deleteLead(leadToDelete.id);
      if (selectedLead?.id === leadToDelete.id) {
        setSelectedLead(null);
      }
      setLeadToDelete(null);
    } catch {
      alert('Não foi possível excluir a oportunidade. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-6 h-full flex flex-col">
      {/* Row 1 — Screen Title + Supporting Subline + Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-white">
            Funil de vendas
          </h1>
          <p className="text-[14px] text-[#b4b4b4] tabular-nums">
            {currentSubaccount.name} · {filteredLeads.length} oportunidades ativas somando R${' '}
            {totalPipelineValue.toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#949494] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filtrar por nome, empresa ou tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-9 pr-3.5 rounded-full bg-[#111111] border border-[#2e2e2e] text-[13px] text-white placeholder:text-[#949494] focus:outline-none focus:border-[#444444] w-64"
            />
          </div>

          <button
            type="button"
            onClick={onOpenNewLead}
            className="h-9 px-4 rounded-full bg-white hover:bg-[#e6e6e6] text-black text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova oportunidade</span>
          </button>
        </div>
      </div>

      {/* Kanban Board — 5 Columns on Flat #111111 Surface */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max h-full">
          {stages.map((stage, stageIdx) => {
            const stageLeads = filteredLeads.filter((l) => l.stageId === stage.id);
            const stageTotal = stageLeads.reduce((acc, l) => acc + l.value, 0);
            const nextStage = stages[stageIdx + 1];

            return (
              <div
                key={stage.id}
                className="w-[304px] bg-[#111111] rounded-[20px] border border-[#1a1a1a] flex flex-col max-h-[calc(100vh-210px)]"
              >
                {/* Column Header */}
                <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-[14px] font-semibold text-white truncate">
                        {stage.name}
                      </h2>
                      <span className="h-5 px-2 rounded-full bg-[#222222] text-[12px] text-[#b4b4b4] font-medium tabular-nums inline-flex items-center">
                        {stageLeads.length}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#949494] tabular-nums mt-0.5">
                      R$ {stageTotal.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                  {stageLeads.length === 0 ? (
                    <div className="h-32 rounded-[14px] border border-dashed border-[#222222] flex items-center justify-center text-[12px] text-[#949494]">
                      Nenhuma oportunidade nesta etapa
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => handleOpenLeadDetail(lead)}
                        className="p-4 bg-[#181818] hover:bg-[#202020] rounded-[14px] border border-[#242424] transition-colors cursor-pointer space-y-3 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-[14px] font-medium text-white truncate">
                              {lead.name}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[12px] text-[#949494] mt-0.5">
                              <Building className="w-3 h-3 shrink-0" />
                              <span className="truncate">{lead.company}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[13px] font-medium text-[#c6f24e] bg-[#222a10] px-2.5 py-0.5 rounded-full tabular-nums">
                              R$ {lead.value.toLocaleString('pt-BR')}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleRequestDelete(lead, e)}
                              title="Excluir oportunidade"
                              className="p-1 rounded-full text-[#949494] hover:text-[#e5566f] hover:bg-[#2c1a20] transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {lead.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {lead.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="text-[12px] px-2 py-0.5 rounded-full bg-[#222222] text-[#b4b4b4]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {lead.notes && (
                          <p className="text-[12px] text-[#b4b4b4] line-clamp-2 bg-[#111111] p-2.5 rounded-[10px] border border-[#1f1f1f]">
                            {lead.notes}
                          </p>
                        )}

                        <div className="pt-2 border-t border-[#242424] flex items-center justify-between text-[12px] text-[#949494]">
                          <span className="flex items-center gap-1 truncate tabular-nums">
                            <Phone className="w-3 h-3 shrink-0" />
                            {lead.phone}
                          </span>

                          {nextStage && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveLeadStage(lead.id, nextStage.id);
                              }}
                              className="flex items-center gap-1 text-white hover:text-[#c6f24e] font-medium transition-colors cursor-pointer shrink-0"
                              title={`Avançar para ${nextStage.name}`}
                            >
                              <span>Avançar</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
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

      {/* Lead Edit Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div
            data-ui="lead-modal"
            className="bg-[#111111] border border-[#2a2a2a] rounded-[20px] max-w-lg w-full p-6 space-y-5"
          >
            <div className="flex items-start justify-between pb-4 border-b border-[#1a1a1a]">
              <div>
                <h2 className="text-[18px] font-semibold text-white">{selectedLead.name}</h2>
                <p className="text-[13px] text-[#b4b4b4] mt-0.5">
                  {selectedLead.company} · {selectedLead.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="h-8 w-8 rounded-full bg-[#1a1a1a] text-[#b4b4b4] hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#b4b4b4] mb-1.5">
                  Etapa do funil
                </label>
                <select
                  value={selectedLead.stageId}
                  onChange={(e) => {
                    moveLeadStage(selectedLead.id, e.target.value);
                    setSelectedLead({ ...selectedLead, stageId: e.target.value });
                  }}
                  className="w-full h-10 px-3.5 rounded-[10px] bg-[#181818] border border-[#2e2e2e] text-[14px] text-white focus:outline-none focus:border-[#444444]"
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#b4b4b4] mb-1.5">
                  Valor estimado (R$)
                </label>
                <input
                  type="number"
                  value={valueInput}
                  onChange={(e) => setValueInput(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-[10px] bg-[#181818] border border-[#2e2e2e] text-[14px] text-white tabular-nums focus:outline-none focus:border-[#444444]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#b4b4b4] mb-1.5">
                  Anotações comerciais
                </label>
                <textarea
                  rows={3}
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  className="w-full p-3.5 rounded-[10px] bg-[#181818] border border-[#2e2e2e] text-[14px] text-white focus:outline-none focus:border-[#444444]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#1a1a1a]">
              <button
                type="button"
                onClick={(e) => handleRequestDelete(selectedLead, e)}
                className="h-9 px-3.5 rounded-full bg-[#2c1a20] text-[#e5566f] text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="h-9 px-4 rounded-full border border-[#2e2e2e] text-[#b4b4b4] hover:text-white text-[13px] font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveLeadChanges}
                  className="h-9 px-4 rounded-full bg-white hover:bg-[#e6e6e6] text-black text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar alterações</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {leadToDelete && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div
            data-ui="delete-modal"
            className="bg-[#111111] border border-[#2a2a2a] rounded-[20px] max-w-md w-full p-6 space-y-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#2c1a20] text-[#e5566f] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[16px] font-semibold text-white">
                  Excluir oportunidade
                </h3>
                <p className="text-[13px] text-[#b4b4b4]">
                  Confirma a exclusão permanente de <strong className="text-white">{leadToDelete.name}</strong> ({leadToDelete.company})?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1a1a1a]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setLeadToDelete(null)}
                className="h-9 px-4 rounded-full border border-[#2e2e2e] text-[#b4b4b4] hover:text-white text-[13px] font-medium transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="h-9 px-4 rounded-full bg-[#e5484d] hover:bg-[#d13c41] text-white text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirmar exclusão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
