'use client';

import React from 'react';
import {
  LayoutDashboard,
  Kanban,
  MessageSquare,
  MapPin,
  Share2,
  GitBranch,
  Settings,
  Compass,
  ShieldCheck,
  X,
} from 'lucide-react';
import { ViewType } from '@/types';
import { useApp } from '@/context/AppContext';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  activeView,
  setActiveView,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const { contacts, leads, workflows, currentSubaccount } = useApp();

  const totalUnread = contacts.reduce((acc, c) => acc + c.unreadCount, 0);
  const activeLeadsCount = leads.filter((l) => l.status === 'open').length;
  const activeWorkflowsCount = workflows.filter((w) => w.isActive).length;

  const primaryGroup = [
    {
      id: 'dashboard' as ViewType,
      label: 'Visão geral',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'crm' as ViewType,
      label: 'Funil de vendas',
      icon: Kanban,
      badge: activeLeadsCount > 0 ? activeLeadsCount : null,
    },
    {
      id: 'prospector' as ViewType,
      label: 'Gerador de leads',
      icon: Compass,
      badge: null,
    },
    {
      id: 'whatsapp' as ViewType,
      label: 'WhatsApp e IA',
      icon: MessageSquare,
      badge: totalUnread > 0 ? totalUnread : null,
    },
  ];

  const channelsGroup = [
    {
      id: 'gmb' as ViewType,
      label: 'Google Meu Negócio',
      icon: MapPin,
      badge: null,
    },
    {
      id: 'social' as ViewType,
      label: 'Redes sociais',
      icon: Share2,
      badge: null,
    },
    {
      id: 'workflows' as ViewType,
      label: 'Automações',
      icon: GitBranch,
      badge: activeWorkflowsCount > 0 ? activeWorkflowsCount : null,
    },
  ];

  const handleSelectView = (view: ViewType) => {
    setActiveView(view);
    if (onCloseMobile) onCloseMobile();
  };

  const renderNavButton = (item: {
    id: ViewType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge: number | null;
  }) => {
    const Icon = item.icon;
    const isActive = activeView === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleSelectView(item.id)}
        className={`w-full flex items-center justify-between h-9 px-3 rounded-[10px] text-[13px] transition-colors cursor-pointer ${
          isActive
            ? 'bg-[#111111] text-white font-medium'
            : 'text-[#b4b4b4] hover:text-white hover:bg-[#111111]/60 font-normal'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#949494]'}`} />
          <span className="truncate">{item.label}</span>
        </div>

        {item.badge !== null && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full tabular-nums font-medium ${
              isActive
                ? 'bg-[#222a10] text-[#c6f24e]'
                : 'bg-[#1a1a1a] text-[#b4b4b4]'
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  const navContent = (
    <>
      {/* Product Mark — 64px top bar height alignment */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#1a1a1a] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-[8px] bg-[#111111] border border-[#2a2a2a] flex items-center justify-center overflow-hidden shrink-0">
            <img
              src="/logo-connect-digital.png"
              alt="FlowLevel"
              className="w-5 h-5 object-contain"
            />
          </div>
          <div className="min-w-0">
            <span className="text-[14px] font-semibold text-white tracking-[-0.01em] block truncate">
              FlowLevel
            </span>
            <span className="text-[12px] text-[#949494] block truncate">
              Workspace B2B
            </span>
          </div>
        </div>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden h-8 w-8 rounded-full bg-[#1a1a1a] text-[#b4b4b4] hover:text-white flex items-center justify-center"
            aria-label="Fechar menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Groups separated by 1px rules */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-4">
        <nav className="space-y-1" aria-label="Operação principal">
          {primaryGroup.map(renderNavButton)}
        </nav>

        <div className="border-t border-[#161616]" />

        <nav className="space-y-1" aria-label="Canais e automação">
          {channelsGroup.map(renderNavButton)}
        </nav>
      </div>

      {/* Footer — Settings & Tenant Status */}
      <div className="p-2.5 border-t border-[#1a1a1a] space-y-2 shrink-0">
        <button
          type="button"
          onClick={() => handleSelectView('settings')}
          className={`w-full flex items-center justify-between h-9 px-3 rounded-[10px] text-[13px] transition-colors cursor-pointer ${
            activeView === 'settings'
              ? 'bg-[#111111] text-white font-medium'
              : 'text-[#b4b4b4] hover:text-white hover:bg-[#111111]/60 font-normal'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Settings
              className={`w-4 h-4 shrink-0 ${
                activeView === 'settings' ? 'text-white' : 'text-[#949494]'
              }`}
            />
            <span>Configurações SaaS</span>
          </div>
        </button>

        <div className="px-3 py-2.5 rounded-[12px] bg-[#111111] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[12px] font-medium text-white truncate">
              {currentSubaccount.name}
            </div>
            <div className="text-[12px] text-[#949494] truncate">
              {currentSubaccount.whatsappConfig.status === 'connected'
                ? 'WhatsApp online'
                : 'WhatsApp desconectado'}
            </div>
          </div>
          <ShieldCheck className="w-4 h-4 text-[#c6f24e] shrink-0" />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Ruled Sidebar (216px) */}
      <aside className="hidden lg:flex w-[216px] bg-black border-r border-[#1a1a1a] flex-col h-screen sticky top-0 shrink-0 select-none">
        {navContent}
      </aside>

      {/* Mobile Full-Screen Sheet */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-[#111111] flex flex-col">
          {navContent}
        </div>
      )}
    </>
  );
}
