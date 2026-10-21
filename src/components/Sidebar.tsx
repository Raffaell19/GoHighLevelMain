'use client';

import React from 'react';
import {
  LayoutDashboard,
  KanbanSquare,
  MessageSquare,
  Star,
  Share2,
  GitBranch,
  Settings,
  ChevronDown,
  Building2,
  PlusCircle,
  Zap,
  LogOut,
  ShieldCheck,
  Crown,
  Compass,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export type ActiveTab = 'dashboard' | 'crm' | 'prospects' | 'whatsapp' | 'gmb' | 'social' | 'workflows' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { subaccounts, currentSubaccount, setCurrentSubaccount, isSuperAdmin, currentUser, logout } = useApp();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'crm', label: 'CRM & Funil', icon: KanbanSquare },
    { id: 'prospects', label: 'Gerador de Leads', icon: Compass, badge: 'Novo' },
    { id: 'whatsapp', label: 'WhatsApp & Chatbot', icon: MessageSquare, badge: 'Live' },
    { id: 'gmb', label: 'Google Meu Negócio', icon: Star },
    { id: 'social', label: 'Agendador de Redes', icon: Share2 },
    { id: 'workflows', label: 'Automações & Fluxos', icon: GitBranch },
    { id: 'settings', label: 'Configurações SaaS', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-screen select-none shrink-0">
      {/* Brand & Subaccount Selector */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <h1 className="font-bold text-white text-base tracking-tight leading-none">FlowLevel</h1>
        </div>

        {/* Subaccount Switcher ou Empresa Fixa (baseado no Perfil do Usuário) */}
        {isSuperAdmin || !currentUser ? (
          /* Modo SuperAdmin: Permite alternar entre todas as empresas clientes */
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-all text-left text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-base shrink-0">{currentSubaccount.logo}</span>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-white truncate leading-tight">{currentSubaccount.name}</p>
                    <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{currentSubaccount.segment}</p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden py-1">
                <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-amber-400 border-b border-slate-700/50 flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  <span>Modo Master: Alternar Empresa</span>
                </div>
                {subaccounts.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setCurrentSubaccount(sub);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${
                      sub.id === currentSubaccount.id
                        ? 'bg-blue-600/20 text-blue-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-700/60'
                    }`}
                  >
                    <span className="text-base">{sub.logo}</span>
                    <div className="truncate">
                      <p className="truncate">{sub.name}</p>
                      <span className="text-[10px] text-slate-400">{sub.segment}</span>
                    </div>
                  </button>
                ))}
                <div className="p-1 border-t border-slate-700/50">
                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-cyan-400 hover:bg-cyan-500/10 rounded transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Cadastrar Nova Subconta</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Modo Cliente / Empresa: Isolado 100%, sem opção de alternar */
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-left text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="text-base shrink-0">{currentSubaccount.logo}</span>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-white truncate leading-tight">{currentSubaccount.name}</p>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </div>
                <p className="text-[10px] text-emerald-400 font-medium">Workspace Verificado</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
          Módulos da Plataforma
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Session & Logout Footer */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
            {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'FL'}
          </div>
          <div className="truncate text-left">
            <p className="text-xs font-semibold text-white truncate leading-tight">
              {currentUser?.name || 'Administrador'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {isSuperAdmin ? 'Master Agência' : 'Dono da Empresa'}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          title="Encerrar Sessão"
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
