'use client';

import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewLeadModal({ isOpen, onClose }: NewLeadModalProps) {
  const { currentSubaccount, stages, addLead } = useApp();

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [value, setValue] = useState('');
  const [stageId, setStageId] = useState(stages[0]?.id || 'stage-1');
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    addLead({
      subaccountId: currentSubaccount.id,
      name,
      company: company || 'Pessoa Física',
      phone: phone || '+55 11 99999-9999',
      email: email || 'sem-email@cliente.com',
      value: Number(value) || 0,
      stageId,
      tags: tags.length > 0 ? tags : ['Novo Lead'],
      notes,
      status: 'open',
    });

    setName('');
    setCompany('');
    setPhone('');
    setEmail('');
    setValue('');
    setTagsInput('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div
        data-ui="new-lead-modal"
        className="bg-[#111111] border border-[#2a2a2a] rounded-[20px] max-w-md w-full p-6 space-y-5"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#1a1a1a]">
          <div>
            <h2 className="text-[18px] font-semibold text-white">
              Cadastrar oportunidade
            </h2>
            <p className="text-[12px] text-[#949494]">
              Subconta: <span className="text-[#b4b4b4]">{currentSubaccount.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-[#1a1a1a] text-[#b4b4b4] hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-[13px]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#b4b4b4] font-medium mb-1">
                Nome do contato *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: João Mendes"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-9 px-3 rounded-[10px] bg-[#181818] border border-[#2e2e2e] text-white placeholder:text-[#949494] focus:outline-none focus:border-[#444444]"
              />
            </div>

            <div>
              <label className="block text-[#b4b4b4] font-medium mb-1">
                Empresa / Negócio
              </label>
              <input
                type="text"
                placeholder="Ex: Mendes Engenharia"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full h-9 px-3 rounded-[10px] bg-[#181818] border border-[#2e2e2e] text-white placeholder:text-[#949494] focus:outline-none focus:border-[#444444]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#b4b4b4] font-medium mb-1">
                WhatsApp / Telefone
              </label>
              <input
                type="text"
                placeholder="+55 51 98888-7777"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-9 px-3 rounded-[10px] bg-[#181818] border border-[#2e2e2e] text-white placeholder:text-[#949494] tabular-nums focus:outline-none focus:border-[#444444]"
              />
            </div>

            <div>
              <label className="block text-[#b4b4b4] font-medium mb-1">
                Valor estimado (R$)
              </label>
              <input
                type="number"
                placeholder="2500"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full h-9 px-3 rounded-[10px] bg-[#181818] border border-[#2e2e2e] text-white placeholder:text-[#949494] tabular-nums focus:outline-none focus:border-[#444444]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#b4b4b4] font-medium mb-1">
                E-mail comercial
              </label>
              <input
                type="email"
                placeholder="contato@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-9 px-3 rounded-[10px] bg-[#181818] border border-[#2e2e2e] text-white placeholder:text-[#949494] focus:outline-none focus:border-[#444444]"
              />
            </div>

            <div>
              <label className="block text-[#b4b4b4] font-medium mb-1">
                Etapa inicial
              </label>
              <select
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                className="w-full h-9 px-3 rounded-[10px] bg-[#181818] border border-[#2e2e2e] text-white focus:outline-none focus:border-[#444444]"
              >
                {stages.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#b4b4b4] font-medium mb-1">
              Tags (separadas por vírgula)
            </label>
            <input
              type="text"
              placeholder="Google Maps, Orçamento, Urgente"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full h-9 px-3 rounded-[10px] bg-[#181818] border border-[#2e2e2e] text-white placeholder:text-[#949494] focus:outline-none focus:border-[#444444]"
            />
          </div>

          <div>
            <label className="block text-[#b4b4b4] font-medium mb-1">
              Observações do negócio
            </label>
            <textarea
              rows={2}
              placeholder="Detalhes do serviço solicitado ou contexto da abordagem..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-[10px] bg-[#181818] border border-[#2e2e2e] text-white placeholder:text-[#949494] focus:outline-none focus:border-[#444444]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1a1a1a]">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-full border border-[#2e2e2e] text-[#b4b4b4] hover:text-white font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-full bg-white hover:bg-[#e6e6e6] text-black font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar oportunidade</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
