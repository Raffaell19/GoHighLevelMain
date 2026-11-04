'use client';

import React, { useState } from 'react';
import { CheckCircle2, Building2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function SettingsView() {
  const { subaccounts, currentSubaccount, setCurrentSubaccount, isDbConnected } = useApp();
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [webhookRetry, setWebhookRetry] = useState(true);
  const [strictRls, setStrictRls] = useState(true);

  const handleSave = () => {
    setSavedNotice('Configurações de governança salvas com sucesso.');
    setTimeout(() => setSavedNotice(null), 3500);
  };

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      {/* Row 1 — Screen Title + Supporting Subline + Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-white">
            Configurações SaaS
          </h1>
          <p className="text-[14px] text-[#b4b4b4]">
            Governança multi-tenant, isolamento de credenciais e infraestrutura de mensageria
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="h-9 px-4 rounded-full bg-white hover:bg-[#e6e6e6] text-black text-[13px] font-medium transition-colors cursor-pointer self-start sm:self-auto"
        >
          Salvar alterações
        </button>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-[14px] bg-[#222a10] text-[#c6f24e] text-[13px] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Row 2 — Usage & Architecture Strip */}
      <section className="bg-[#111111] rounded-[20px] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#1a1a1a] overflow-hidden">
        <div className="p-[22px] space-y-1.5">
          <div className="text-[13px] text-[#b4b4b4]">Subcontas provisionadas</div>
          <div className="text-[24px] font-medium text-white tabular-nums">
            {subaccounts.length} {subaccounts.length === 1 ? 'empresa' : 'empresas'}
          </div>
          <div className="text-[12px] text-[#949494]">
            Isolamento lógico por <code className="text-white">subaccount_id</code>
          </div>
        </div>

        <div className="p-[22px] space-y-1.5">
          <div className="text-[13px] text-[#b4b4b4]">Banco de dados e segurança</div>
          <div className="text-[24px] font-medium text-white">
            {isDbConnected ? 'Supabase RLS' : 'Modo local'}
          </div>
          <div className="text-[12px] text-[#c6f24e]">
            Criptografia AES-256 ativa no cofre de chaves
          </div>
        </div>

        <div className="p-[22px] space-y-1.5">
          <div className="text-[13px] text-[#b4b4b4]">Motor de WhatsApp</div>
          <div className="text-[24px] font-medium text-white">Evolution API v2</div>
          <div className="text-[12px] text-[#949494]">
            Webhooks bidirecionais e suporte a áudio PTT
          </div>
        </div>
      </section>

      {/* Row 3 — Two-Column Settings Form (Label + Explanation Left, Control Right) */}
      <section className="bg-[#111111] rounded-[20px] p-[22px] divide-y divide-[#1a1a1a]">
        {/* Setting Row 1: Active Tenant Selection */}
        <div className="py-5 first:pt-0 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
          <div className="space-y-1">
            <h2 className="text-[15px] font-semibold text-white">
              Subcontas gerenciadas
            </h2>
            <p className="text-[13px] text-[#b4b4b4]">
              Selecione qual subconta está ativa no painel ou verifique o status dos canais conectados.
            </p>
          </div>

          <div className="space-y-2.5">
            {subaccounts.map((sub) => {
              const isSelected = currentSubaccount.id === sub.id;
              const isCustomImg =
                sub.logo?.startsWith('data:image') ||
                sub.logo?.startsWith('http') ||
                sub.logo?.startsWith('/');

              return (
                <div
                  key={sub.id}
                  onClick={() => setCurrentSubaccount(sub)}
                  className={`p-4 rounded-[14px] border flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#181818] border-[#444444]'
                      : 'bg-[#141414] border-[#1f1f1f] hover:border-[#2e2e2e]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-[10px] bg-[#222222] flex items-center justify-center overflow-hidden shrink-0">
                      {isCustomImg ? (
                        <img
                          src={sub.logo}
                          alt={sub.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <Building2 className="w-4 h-4 text-[#b4b4b4]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-medium text-white truncate">
                          {sub.name}
                        </span>
                        {isSelected && (
                          <span className="h-5 px-2 rounded-full bg-[#222a10] text-[#c6f24e] text-[12px] font-medium inline-flex items-center">
                            Ativa
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-[#949494] truncate tabular-nums">
                        {sub.segment} · {sub.phone} · {sub.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`h-6 px-2.5 rounded-full text-[12px] font-medium inline-flex items-center ${
                        sub.whatsappConfig.status === 'connected'
                          ? 'bg-[#222a10] text-[#c6f24e]'
                          : 'bg-[#2c1a20] text-[#e5566f]'
                      }`}
                    >
                      WhatsApp {sub.whatsappConfig.status === 'connected' ? 'online' : 'offline'}
                    </span>
                    <span
                      className={`h-6 px-2.5 rounded-full text-[12px] font-medium inline-flex items-center ${
                        sub.gmbConnected
                          ? 'bg-[#222222] text-white'
                          : 'bg-[#1a1a1a] text-[#949494]'
                      }`}
                    >
                      Google Maps
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Setting Row 2: Tenant Isolation Policy */}
        <div className="py-5 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-center">
          <div className="space-y-1">
            <h2 className="text-[15px] font-semibold text-white">
              Isolamento estrito de subconta (RLS)
            </h2>
            <p className="text-[13px] text-[#b4b4b4]">
              Garante que leads, conversas do WhatsApp e chaves de API nunca sejam compartilhados entre clientes.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-[14px] bg-[#161616] border border-[#1f1f1f]">
            <div>
              <div className="text-[14px] font-medium text-white">
                Política Row-Level Security ativa
              </div>
              <div className="text-[12px] text-[#949494]">
                Todas as consultas exigem validação de token e vínculo em subaccount_users
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStrictRls(!strictRls)}
              className={`h-7 w-12 rounded-full p-1 transition-colors cursor-pointer ${
                strictRls ? 'bg-[#c6f24e]' : 'bg-[#2a2a2a]'
              }`}
              aria-label="Alternar isolamento RLS"
            >
              <div
                className={`w-5 h-5 rounded-full bg-black transition-transform ${
                  strictRls ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Setting Row 3: Webhook Retries */}
        <div className="py-5 last:pb-0 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-center">
          <div className="space-y-1">
            <h2 className="text-[15px] font-semibold text-white">
              Retentativa automática de Webhooks
            </h2>
            <p className="text-[13px] text-[#b4b4b4]">
              Reprocessa eventos recebidos da Evolution API e Apify em caso de oscilação de rede.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-[14px] bg-[#161616] border border-[#1f1f1f]">
            <div>
              <div className="text-[14px] font-medium text-white">
                Fila de resiliência habilitada
              </div>
              <div className="text-[12px] text-[#949494]">
                Até 3 tentativas com intervalo exponencial para mensagens de entrada
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWebhookRetry(!webhookRetry)}
              className={`h-7 w-12 rounded-full p-1 transition-colors cursor-pointer ${
                webhookRetry ? 'bg-[#c6f24e]' : 'bg-[#2a2a2a]'
              }`}
              aria-label="Alternar retentativa de webhooks"
            >
              <div
                className={`w-5 h-5 rounded-full bg-black transition-transform ${
                  webhookRetry ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
