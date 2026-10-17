'use client';

import React from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Star,
  Calendar,
  ArrowUpRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ActiveTab } from '@/components/Sidebar';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewLeadModal: () => void;
}

export function DashboardView({ setActiveTab, onOpenNewLeadModal }: DashboardViewProps) {
  const { currentSubaccount, leads, reviews, gmbStats, contacts } = useApp();

  const totalPipelineValue = leads.reduce((acc, curr) => acc + curr.value, 0);
  const wonLeadsValue = leads.filter((l) => l.status === 'won').reduce((acc, curr) => acc + curr.value, 0);
  const unreadMessagesCount = contacts.reduce((acc, curr) => acc + curr.unreadCount, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Painel de Controle Unificado</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Bem-vindo à gestão de {currentSubaccount.name}
          </h2>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">
            Seu ecossistema de aquisição e vendas está ativo. Centralize leads do WhatsApp, avaliações do Google Meu Negócio e publicações sociais em um único lugar.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('crm')}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition"
            >
              Abrir Funil CRM (Kanban)
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              Atendimento WhatsApp ({unreadMessagesCount} novas)
            </button>
            <button
              onClick={onOpenNewLeadModal}
              className="px-4 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition"
            >
              + Cadastrar Oportunidade
            </button>
          </div>
        </div>

        {/* Decorative Blur */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-blue-600/10 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pipeline Ativo</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPipelineValue)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-500 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{leads.length} oportunidades no funil</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Vendas Concluídas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(wonLeadsValue)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Mês corrente</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Google Meu Negócio</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{gmbStats.ratingAverage}</p>
            <span className="text-xs text-slate-400">({gmbStats.totalReviews} avaliações)</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-400">
            <span>+{gmbStats.calls} ligações este mês</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div
          onClick={() => setActiveTab('whatsapp')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:border-emerald-500/50 transition group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium group-hover:text-emerald-400 transition">WhatsApp Conectado</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-emerald-500 capitalize">
            {currentSubaccount.whatsappConfig.status === 'connected' ? 'Instância Ativa' : 'Desconectado'}
          </p>
          <p className="text-xs text-slate-400 mt-2 truncate">
            Provedor: {currentSubaccount.whatsappConfig.provider === 'evolution' ? 'Evolution API (QR)' : 'Meta Cloud Oficial'} • Abrir Chat &rarr;
          </p>
        </div>
      </div>

      {/* Two Columns: Recent Leads & Recent Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Últimos Leads & Oportunidades</h3>
            </div>
            <button
              onClick={() => setActiveTab('crm')}
              className="text-xs text-blue-500 hover:text-blue-600 font-semibold flex items-center gap-1"
            >
              <span>Ver Kanban</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {leads.slice(0, 4).map((lead) => (
              <div
                key={lead.id}
                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">{lead.name}</p>
                  <p className="text-[11px] text-slate-500">{lead.company || lead.phone}</p>
                  <div className="flex gap-1.5 mt-1">
                    {lead.tags.map((t) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value)}
                  </p>
                  <span className="text-[10px] text-slate-400">{lead.lastActivity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Google Reviews */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Reputação Google Meu Negócio</h3>
            </div>
            <button
              onClick={() => setActiveTab('gmb')}
              className="text-xs text-blue-500 hover:text-blue-600 font-semibold flex items-center gap-1"
            >
              <span>Gerenciar Avaliações</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {reviews.slice(0, 3).map((rev) => (
              <div
                key={rev.id}
                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{rev.authorName}</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">"{rev.comment}"</p>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">{rev.createTime}</span>
                  {rev.replyText ? (
                    <span className="text-emerald-500 font-medium">Respondido</span>
                  ) : (
                    <span className="text-amber-500 font-medium">Pendente de resposta</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
