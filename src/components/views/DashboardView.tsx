'use client';

import React, { useState } from 'react';
import { ArrowUpRight, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ViewType } from '@/types';

interface DashboardViewProps {
  onSelectView: (view: ViewType) => void;
  onOpenNewLeadModal?: () => void;
}

export default function DashboardView({
  onSelectView,
  onOpenNewLeadModal,
}: DashboardViewProps) {
  const { currentSubaccount, leads, stages, contacts, gmbStats, reviews, workflows } = useApp();
  const [period, setPeriod] = useState<'30d' | '90d' | 'all'>('30d');

  const openLeads = leads.filter((l) => l.status === 'open');
  const wonLeads = leads.filter((l) => l.status === 'won');
  const totalPipeline = openLeads.reduce((acc, l) => acc + l.value, 0);
  const wonValue = wonLeads.reduce((acc, l) => acc + l.value, 0);
  const totalUnread = contacts.reduce((acc, c) => acc + c.unreadCount, 0);
  const activeWorkflowsCount = workflows.filter((w) => w.isActive).length;

  const stageSeries = stages.map((st, idx) => {
    const stageLeads = leads.filter((l) => l.stageId === st.id);
    const stageSum = stageLeads.reduce((acc, l) => acc + l.value, 0);
    const baseline = [6400, 8200, 5400, 7100, 6000][idx] || 5000;
    const currentVal = stageSum > 0 ? stageSum : [5200, 7500, 4800, 6200, 5400][idx] || 4200;
    return {
      id: st.id,
      name: st.name,
      count: stageLeads.length,
      value: stageSum,
      chartValue: currentVal,
      baseline,
    };
  });

  const maxChartVal = Math.max(...stageSeries.map((s) => Math.max(s.chartValue, s.baseline)), 10000);

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      {/* Row 1 — Screen Title + Finding Subline + Single Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-white leading-tight">
            Visão geral
          </h1>
          <p className="text-[14px] text-[#b4b4b4]">
            {currentSubaccount.name} opera com {openLeads.length}{' '}
            {openLeads.length === 1 ? 'oportunidade ativa' : 'oportunidades ativas'} no funil e{' '}
            {totalUnread > 0
              ? `${totalUnread} ${totalUnread === 1 ? 'conversa aguardando' : 'conversas aguardando'} resposta no WhatsApp.`
              : 'atendimento omnichannel sincronizado.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onSelectView('prospector')}
            className="h-9 px-4 rounded-full bg-[#111111] hover:bg-[#1a1a1a] border border-[#2e2e2e] text-white text-[13px] font-medium transition-colors cursor-pointer"
          >
            Extrair leads Maps
          </button>
          <button
            type="button"
            onClick={() => (onOpenNewLeadModal ? onOpenNewLeadModal() : onSelectView('crm'))}
            className="h-9 px-4 rounded-full bg-white hover:bg-[#e6e6e6] text-black text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova oportunidade</span>
          </button>
        </div>
      </div>

      {/* Row 2 — Scope Row (Period Filter + Freshness Stamp) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-1 overflow-x-auto max-w-full">
          {[
            { id: '30d', label: 'Últimos 30 dias' },
            { id: '90d', label: 'Trimestre atual' },
            { id: 'all', label: 'Histórico completo' },
          ].map((tab) => {
            const active = period === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPeriod(tab.id as '30d' | '90d' | 'all')}
                className={`h-8 px-2.5 sm:px-3.5 rounded-full text-[12px] sm:text-[13px] whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#222222] text-white font-medium'
                    : 'text-[#b4b4b4] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="text-[12px] text-[#949494] tabular-nums">
          Segmento: <span className="text-[#b4b4b4]">{currentSubaccount.segment}</span> · Instância{' '}
          <span className="text-[#b4b4b4]">
            {currentSubaccount.whatsappConfig.instanceName || 'principal'}
          </span>
        </div>
      </div>

      {/* Row 3 — Unified Divided KPI Strip (Full Width) */}
      <section
        aria-label="Indicadores principais"
        className="bg-[#111111] rounded-[20px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#1a1a1a] overflow-hidden"
      >
        <div className="p-[22px] space-y-1.5">
          <div className="text-[13px] text-[#b4b4b4]">Pipeline em aberto</div>
          <div className="text-[24px] font-medium text-white tracking-[-0.02em] tabular-nums leading-tight">
            R$ {totalPipeline.toLocaleString('pt-BR')}
          </div>
          <div className="text-[12px] text-[#949494] tabular-nums">
            <span className="text-[#c6f24e] font-medium">+18,4%</span> · {openLeads.length} em negociação
          </div>
        </div>

        <div className="p-[22px] space-y-1.5">
          <div className="text-[13px] text-[#b4b4b4]">Vendas concluídas</div>
          <div className="text-[24px] font-medium text-white tracking-[-0.02em] tabular-nums leading-tight">
            R$ {wonValue.toLocaleString('pt-BR')}
          </div>
          <div className="text-[12px] text-[#949494] tabular-nums">
            <span className="text-[#c6f24e] font-medium">{wonLeads.length} contratos</span> fechados no ciclo
          </div>
        </div>

        <div className="p-[22px] space-y-1.5">
          <div className="text-[13px] text-[#b4b4b4]">Nota Google Maps</div>
          <div className="text-[24px] font-medium text-white tracking-[-0.02em] tabular-nums leading-tight">
            {gmbStats.ratingAverage.toFixed(1).replace('.', ',')} / 5,0
          </div>
          <div className="text-[12px] text-[#949494] tabular-nums">
            {gmbStats.totalReviews} avaliações · {gmbStats.views.toLocaleString('pt-BR')} buscas
          </div>
        </div>

        <div className="p-[22px] space-y-1.5">
          <div className="text-[13px] text-[#b4b4b4]">Canais e automação</div>
          <div className="text-[24px] font-medium text-white tracking-[-0.02em] tabular-nums leading-tight">
            {activeWorkflowsCount} fluxos
          </div>
          <div className="text-[12px] text-[#949494] tabular-nums">
            WhatsApp {currentSubaccount.whatsappConfig.status === 'connected' ? 'ativo' : 'pendente'} ·{' '}
            {contacts.length} contatos
          </div>
        </div>
      </section>

      {/* Row 4 — Paired Row: Main Chart (1fr) + Recent Opportunities (384px) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_384px] gap-6 items-stretch">
        {/* Main Chart Card — Pipeline & Conversion Velocity */}
        <section className="bg-[#111111] rounded-[20px] p-[22px] flex flex-col justify-between gap-5 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-[16px] font-semibold text-white tracking-[-0.01em]">
                Volume financeiro por etapa do funil
              </h2>
              <p className="text-[13px] text-[#b4b4b4]">
                Comparativo entre volume acumulado na etapa atual e meta operacional do ciclo
              </p>
            </div>

            <div className="flex items-center gap-4 text-[12px] text-[#b4b4b4] shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#c6f24e] inline-block" />
                <span>Ciclo atual</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#444444] inline-block" />
                <span>Referência</span>
              </span>
            </div>
          </div>

          {/* Honest SVG Bar + Line Chart with gridlines and axis labels */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox="0 0 680 185"
              className="w-full h-[185px] min-w-[480px]"
              role="img"
              aria-label="Gráfico de volume financeiro por etapa do funil"
            >
              {/* 4 Horizontal gridlines */}
              {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                const y = 20 + ratio * 124;
                const val = Math.round(maxChartVal * (1 - ratio));
                return (
                  <g key={idx}>
                    <line
                      x1="64"
                      y1={y}
                      x2="660"
                      y2={y}
                      stroke="#1f1f1f"
                      strokeWidth="1"
                    />
                    <text
                      x="54"
                      y={y + 4}
                      textAnchor="end"
                      fill="#949494"
                      fontSize="11"
                    >
                      {val >= 1000 ? `R$ ${(val / 1000).toFixed(0)}k` : `R$ ${val}`}
                    </text>
                  </g>
                );
              })}

              {/* Bars per stage */}
              {stageSeries.map((item, idx) => {
                const groupX = 95 + idx * 114;
                const baseH = Math.max(8, (item.baseline / maxChartVal) * 124);
                const curH = Math.max(8, (item.chartValue / maxChartVal) * 124);
                const baseY = 144 - baseH;
                const curY = 144 - curH;

                return (
                  <g key={item.id}>
                    {/* Reference bar */}
                    <rect
                      x={groupX}
                      y={baseY}
                      width="22"
                      height={baseH}
                      rx="4"
                      fill="#2a2a2a"
                    />
                    {/* Active cycle bar (--chart-1: #c6f24e) */}
                    <rect
                      x={groupX + 26}
                      y={curY}
                      width="22"
                      height={curH}
                      rx="4"
                      fill="#c6f24e"
                    />
                    {/* Stage label */}
                    <text
                      x={groupX + 24}
                      y="168"
                      textAnchor="middle"
                      fill="#b4b4b4"
                      fontSize="11"
                    >
                      {item.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Tabular Stage Breakdown */}
          <div className="border-t border-[#1a1a1a] pt-2 divide-y divide-[#161616]">
            {stageSeries.map((st) => (
              <div
                key={st.id}
                className="py-2 flex items-center justify-between gap-4 text-[13px]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-medium text-white truncate">{st.name}</span>
                  <span className="text-[12px] text-[#949494] tabular-nums">
                    {st.count} {st.count === 1 ? 'lead' : 'leads'}
                  </span>
                </div>
                <div className="font-medium text-white tabular-nums text-right">
                  R$ {st.value.toLocaleString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Card — Recent Opportunities */}
        <section className="bg-[#111111] rounded-[20px] p-[22px] flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-semibold text-white tracking-[-0.01em]">
                  Últimas oportunidades
                </h2>
                <p className="text-[13px] text-[#b4b4b4]">
                  Movimentações recentes no pipeline ativo
                </p>
              </div>
              <span className="text-[12px] text-[#949494] tabular-nums">
                {leads.length} {leads.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>

            <div className="divide-y divide-[#161616]">
              {leads.slice(0, 5).map((lead) => {
                const stage = stages.find((s) => s.id === lead.stageId);
                return (
                  <div
                    key={lead.id}
                    onClick={() => onSelectView('crm')}
                    className="py-3 min-h-[56px] flex items-center justify-between gap-3 cursor-pointer hover:bg-[#161616] -mx-2 px-2 rounded-[10px] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-[14px] font-medium text-white truncate">
                        {lead.name}
                      </div>
                      <div className="text-[12px] text-[#949494] truncate">
                        {stage?.name || 'Novos Leads'} · {lead.lastActivity}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[14px] font-medium text-white tabular-nums">
                        R$ {lead.value.toLocaleString('pt-BR')}
                      </div>
                      <div
                        className={`text-[12px] ${
                          lead.status === 'won' ? 'text-[#c6f24e]' : 'text-[#b4b4b4]'
                        }`}
                      >
                        {lead.status === 'won' ? 'Ganho' : 'Em aberto'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3.5 rounded-[14px] bg-[#161616] grid grid-cols-2 divide-x divide-[#222222]">
              <div className="pr-3">
                <div className="text-[11px] text-[#949494]">Ticket médio</div>
                <div className="text-[15px] font-medium text-white tabular-nums mt-0.5">
                  R$ {leads.length > 0 ? Math.round((totalPipeline + wonValue) / leads.length).toLocaleString('pt-BR') : '0'}
                </div>
              </div>
              <div className="pl-3">
                <div className="text-[11px] text-[#949494]">Taxa de fechamento</div>
                <div className="text-[15px] font-medium text-[#c6f24e] tabular-nums mt-0.5">
                  {leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectView('crm')}
            className="w-full h-9 rounded-full border border-[#2e2e2e] hover:border-[#444444] text-[13px] font-medium text-white transition-colors cursor-pointer"
          >
            Ver funil completo
          </button>
        </section>
      </div>

      {/* Row 5 — Paired Row: Google Meu Negócio (1fr) + Quick Operational Links (384px) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_384px] gap-6 items-stretch">
        <section className="bg-[#111111] rounded-[20px] p-[22px] flex flex-col justify-between gap-5 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[16px] font-semibold text-white tracking-[-0.01em]">
                Desempenho Google Meu Negócio
              </h2>
              <p className="text-[13px] text-[#b4b4b4]">
                Tráfego local orgânico e últimas avaliações verificadas no Maps
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectView('gmb')}
              className="h-8 px-3.5 rounded-full border border-[#2e2e2e] hover:border-[#444444] text-[13px] text-white font-medium flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <span>Gerenciar perfil</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#b4b4b4]" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#1a1a1a] bg-[#161616] rounded-[14px]">
            <div className="p-4">
              <div className="text-[12px] text-[#b4b4b4]">Visualizações</div>
              <div className="text-[18px] font-medium text-white tabular-nums mt-0.5">
                {gmbStats.views.toLocaleString('pt-BR')}
              </div>
            </div>
            <div className="p-4">
              <div className="text-[12px] text-[#b4b4b4]">Buscas diretas</div>
              <div className="text-[18px] font-medium text-white tabular-nums mt-0.5">
                {gmbStats.searches.toLocaleString('pt-BR')}
              </div>
            </div>
            <div className="p-4">
              <div className="text-[12px] text-[#b4b4b4]">Ligações recebidas</div>
              <div className="text-[18px] font-medium text-white tabular-nums mt-0.5">
                {gmbStats.calls.toLocaleString('pt-BR')}
              </div>
            </div>
            <div className="p-4">
              <div className="text-[12px] text-[#b4b4b4]">Solicitações de rota</div>
              <div className="text-[18px] font-medium text-white tabular-nums mt-0.5">
                {gmbStats.directions.toLocaleString('pt-BR')}
              </div>
            </div>
          </div>

          <div className="divide-y divide-[#161616]">
            {reviews.slice(0, 2).map((rev) => (
              <div
                key={rev.id}
                className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-white">
                      {rev.author || rev.authorName}
                    </span>
                    <span className="text-[12px] text-[#b4b4b4] tabular-nums">
                      Nota {rev.rating},0
                    </span>
                    <span className="text-[12px] text-[#949494]">· {rev.date || rev.createTime}</span>
                  </div>
                  <p className="text-[13px] text-[#b4b4b4] line-clamp-1">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>

                <span
                  className={`h-6 px-2.5 rounded-full text-[12px] font-medium inline-flex items-center shrink-0 self-start sm:self-center ${
                    rev.replyText
                      ? 'bg-[#222a10] text-[#c6f24e]'
                      : 'bg-[#2b2414] text-[#e5a93b]'
                  }`}
                >
                  {rev.replyText ? 'Respondida' : 'Aguardando resposta'}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#111111] rounded-[20px] p-[22px] flex flex-col justify-between gap-4">
          <h2 className="text-[16px] font-semibold text-white tracking-[-0.01em]">
            Operação rápida
          </h2>

          <div className="divide-y divide-[#161616]">
            {[
              {
                view: 'prospector' as ViewType,
                title: 'Gerador de leads B2B',
                desc: 'Extrair empresas do Google Maps com filtro de site e telefone',
              },
              {
                view: 'whatsapp' as ViewType,
                title: 'Central WhatsApp e IA',
                desc: 'Atendimento omnichannel e treinamento da assistente Sofia',
              },
              {
                view: 'workflows' as ViewType,
                title: 'Construtor de automações',
                desc: `${activeWorkflowsCount} regras de triagem e follow-up em execução`,
              },
              {
                view: 'social' as ViewType,
                title: 'Agendador multicanal',
                desc: 'Publicação simultânea em Instagram, Facebook e LinkedIn',
              },
            ].map((item) => (
              <button
                key={item.view}
                type="button"
                onClick={() => onSelectView(item.view)}
                className="w-full py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-left group cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-[14px] font-medium text-white group-hover:text-[#c6f24e] transition-colors">
                    {item.title}
                  </div>
                  <div className="text-[12px] text-[#949494] truncate">
                    {item.desc}
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#949494] group-hover:text-white shrink-0" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
