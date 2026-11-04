'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Plus,
  Building2,
  Check,
  Camera,
  LogOut,
  LogIn,
  Search,
  Menu,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ViewType } from '@/types';

interface HeaderProps {
  onOpenNewLeadModal: () => void;
  activeView?: ViewType;
  onSelectView?: (view: ViewType) => void;
  onOpenMobileMenu?: () => void;
}

const VIEW_LABELS: Record<ViewType, string> = {
  dashboard: 'Visão geral',
  crm: 'Funil de vendas',
  prospector: 'Gerador de leads',
  whatsapp: 'WhatsApp e IA',
  gmb: 'Google Meu Negócio',
  social: 'Redes sociais',
  workflows: 'Automações',
  settings: 'Configurações SaaS',
};

export default function Header({
  onOpenNewLeadModal,
  activeView = 'dashboard',
  onSelectView,
  onOpenMobileMenu,
}: HeaderProps) {
  const {
    subaccounts,
    currentSubaccount,
    setCurrentSubaccount,
    updateSubaccountLogo,
    isDbConnected,
    currentUser,
    isSuperAdmin,
    logout,
  } = useApp();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCustomImage =
    currentSubaccount.logo?.startsWith('data:image') ||
    currentSubaccount.logo?.startsWith('http') ||
    currentSubaccount.logo?.startsWith('/');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      updateSubaccountLogo(currentSubaccount.id, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !onSelectView) return;
    const q = searchQuery.toLowerCase();
    if (q.includes('lead') || q.includes('mapa') || q.includes('prospec')) {
      onSelectView('prospector');
    } else if (q.includes('whats') || q.includes('chat') || q.includes('ia')) {
      onSelectView('whatsapp');
    } else if (q.includes('google') || q.includes('avalia')) {
      onSelectView('gmb');
    } else if (q.includes('post') || q.includes('insta') || q.includes('rede')) {
      onSelectView('social');
    } else if (q.includes('fluxo') || q.includes('automa')) {
      onSelectView('workflows');
    } else {
      onSelectView('crm');
    }
  };

  return (
    <header className="h-14 lg:h-16 bg-black border-b border-[#1a1a1a] px-6 lg:px-7 flex items-center justify-between gap-4 sticky top-0 z-30 shrink-0">
      {/* Left: Mobile Menu Trigger + Global Search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden h-9 w-9 rounded-full bg-[#111111] border border-[#2a2a2a] text-white flex items-center justify-center shrink-0"
            aria-label="Abrir navegação"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="lg:hidden flex items-center gap-2 min-w-0">
          <span className="text-[14px] font-semibold text-white truncate">
            {VIEW_LABELS[activeView]}
          </span>
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="hidden sm:flex items-center relative w-full max-w-[320px]"
        >
          <Search className="w-3.5 h-3.5 text-[#949494] absolute left-3.5 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar leads, conversas ou módulos..."
            className="w-full h-9 pl-9 pr-3.5 rounded-full bg-[#111111] border border-[#2a2a2a] text-[13px] text-white placeholder:text-[#949494] focus:outline-none focus:border-[#444444]"
          />
        </form>
      </div>

      {/* Right: Status + Primary Action + Ruled Workspace Switcher */}
      <div className="flex items-center gap-3 shrink-0 h-full">
        {/* Freshness & RLS indicator */}
        <div className="hidden xl:flex items-center gap-2 text-[12px] text-[#b4b4b4]">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isDbConnected ? 'bg-[#c6f24e]' : 'bg-[#e5a93b]'
            }`}
          />
          <span>{isDbConnected ? 'Supabase sincronizado' : ' Base local ativa'}</span>
        </div>

        {/* Quick Add Lead Button */}
        <button
          type="button"
          onClick={onOpenNewLeadModal}
          className="h-9 px-3.5 rounded-full bg-[#111111] hover:bg-[#1a1a1a] border border-[#2a2a2a] text-white text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#c6f24e]" />
          <span className="hidden sm:inline">Novo lead</span>
        </button>

        {/* Full-height vertical divider */}
        <div className="h-6 w-px bg-[#1a1a1a]" />

        {/* Multi-Tenant Workspace Switcher */}
        <div className="relative flex items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="h-9 px-2.5 rounded-full bg-[#111111] hover:bg-[#1a1a1a] border border-[#2a2a2a] flex items-center gap-2 text-left transition-colors cursor-pointer"
          >
            <div className="w-5 h-5 rounded-full bg-[#222222] flex items-center justify-center overflow-hidden shrink-0">
              {isCustomImage ? (
                <img
                  src={currentSubaccount.logo}
                  alt={currentSubaccount.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="w-3 h-3 text-[#b4b4b4]" />
              )}
            </div>
            <span className="text-[13px] font-medium text-white max-w-[130px] truncate hidden md:inline">
              {currentSubaccount.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#949494]" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Alterar logotipo da empresa"
            className="hidden md:flex h-9 w-9 rounded-full bg-[#111111] hover:bg-[#1a1a1a] border border-[#2a2a2a] items-center justify-center text-[#b4b4b4] hover:text-white transition-colors cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div
                data-ui="dropdown-subaccount"
                className="absolute right-0 top-full mt-2 w-72 bg-[#111111] border border-[#2a2a2a] rounded-[16px] z-50 overflow-hidden p-1.5"
              >
                <div className="px-3 py-2 border-b border-[#1a1a1a] flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#b4b4b4]">
                    {isSuperAdmin ? 'Subcontas da agência' : 'Workspace ativo'}
                  </span>
                  <span className="text-[12px] text-[#949494] tabular-nums">
                    {subaccounts.length} {subaccounts.length === 1 ? 'conta' : 'contas'}
                  </span>
                </div>

                <div className="py-1 max-h-64 overflow-y-auto space-y-0.5">
                  {subaccounts.map((sub) => {
                    const isSubCustomImg =
                      sub.logo?.startsWith('data:image') ||
                      sub.logo?.startsWith('http') ||
                      sub.logo?.startsWith('/');
                    const isSelected = currentSubaccount.id === sub.id;

                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setCurrentSubaccount(sub);
                          setDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-[10px] flex items-center justify-between text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#222222] text-white'
                            : 'text-[#b4b4b4] hover:bg-[#1a1a1a] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center overflow-hidden shrink-0">
                            {isSubCustomImg ? (
                              <img
                                src={sub.logo}
                                alt={sub.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Building2 className="w-3.5 h-3.5 text-[#949494]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium text-white truncate">
                              {sub.name}
                            </div>
                            <div className="text-[12px] text-[#949494] truncate">
                              {sub.segment}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#c6f24e] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1 mt-1 border-t border-[#1a1a1a]">
                  {currentUser ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="w-full px-3 py-2 rounded-[10px] text-[13px] text-[#e5566f] hover:bg-[#2c1a20] flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Encerrar sessão ({currentUser.email})</span>
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="w-full px-3 py-2 rounded-[10px] text-[13px] text-[#c6f24e] hover:bg-[#222a10] flex items-center gap-2 transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Autenticar conta</span>
                    </Link>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
