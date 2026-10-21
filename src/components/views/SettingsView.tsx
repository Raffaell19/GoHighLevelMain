'use client';

import React, { useState } from 'react';
import {
  Building2,
  Users,
  Shield,
  Database,
  Plus,
  CheckCircle,
  ExternalLink,
  Smartphone,
  Globe,
  Lock,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function SettingsView() {
  const { subaccounts, currentSubaccount, setCurrentSubaccount } = useApp();

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-500" />
          <span>Configurações SaaS & Multi-Tenancy</span>
        </h2>
        <p className="text-xs text-slate-400">
          Gerencie suas empresas e subcontas no modelo White-Label GoHighLevel. Cada cliente possui seu próprio isolamento de dados.
        </p>
      </div>

      {/* Subaccounts Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Subcontas / Empresas Ativas ({subaccounts.length})</h3>
          <button
            onClick={() => alert('Para cadastrar uma nova subconta em produção, o sistema cria um novo tenant com banco isolado.')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Subconta</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subaccounts.map((sub) => {
            const isCurrent = sub.id === currentSubaccount.id;
            return (
              <div
                key={sub.id}
                className={`p-4 rounded-xl border transition ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-500/5 shadow-md shadow-blue-500/10'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    {sub.name === 'Connect Digital' || (sub.logo && (sub.logo.startsWith('/') || sub.logo.includes('.png'))) ? (
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-950 border border-blue-500/30 flex items-center justify-center shrink-0">
                        <img
                          src={sub.name === 'Connect Digital' ? '/logo-connect-digital.png' : sub.logo}
                          alt={sub.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <span className="text-2xl">{sub.logo}</span>
                    )}
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{sub.name}</h4>
                      <p className="text-[10px] text-slate-400">{sub.segment}</p>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold">
                      Ativa
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <p className="flex items-center gap-1.5 text-[11px]">
                    <Smartphone className="w-3 h-3 text-emerald-500" />
                    <span>{sub.phone}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-[11px]">
                    <Globe className="w-3 h-3 text-blue-400" />
                    <span className="truncate">{sub.email}</span>
                  </p>
                </div>

                <div className="pt-3 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-500">WhatsApp: {sub.whatsappConfig.provider}</span>
                  {!isCurrent && (
                    <button
                      onClick={() => setCurrentSubaccount(sub)}
                      className="text-xs text-blue-500 hover:underline font-semibold"
                    >
                      Acessar Painel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Database & Infrastructure Specs */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-500" />
          <span>Infraestrutura & Banco de Dados Multi-Tenant</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Esta plataforma foi concebida para rodar com esquema relacional no <strong>PostgreSQL / Supabase</strong>, garantindo isolamento total por <code className="text-blue-400 bg-slate-800 px-1 py-0.5 rounded">subaccount_id</code> e suporte a Row-Level Security (RLS).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Motor de Mensageria</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">BullMQ / Redis Cache</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Webhooks Assíncronos</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">Meta & Evolution Event Bus</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Camada de IA</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">OpenAI / Gemini API</span>
          </div>
        </div>
      </div>
    </div>
  );
}
