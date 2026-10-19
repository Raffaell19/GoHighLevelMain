'use client';

import React from 'react';
import {
  Bell,
  Search,
  Plus,
  Building,
  Smartphone,
  Database,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface HeaderProps {
  onOpenNewLeadModal: () => void;
  onOpenNewPostModal?: () => void;
}

export function Header({ onOpenNewLeadModal }: HeaderProps) {
  const { currentSubaccount, isDbConnected, currentUser, isSuperAdmin } = useApp();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0">
      {/* Search & Active Client Info */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <Building className="w-3.5 h-3.5 text-blue-500" />
          <span>{currentSubaccount.name}</span>
        </div>

        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar leads, conversas, agendamentos..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-transparent focus:border-blue-500 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Supabase Status Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Database className="w-3 h-3 text-emerald-400" />
          <span>Supabase Conectado</span>
        </div>

        {/* Quick WhatsApp Status */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">WhatsApp:</span>
          <span
            className={`font-semibold ${
              currentSubaccount.whatsappConfig.status === 'connected' ? 'text-emerald-500' : 'text-amber-500'
            }`}
          >
            {currentSubaccount.whatsappConfig.status === 'connected' ? 'Online' : 'Conectar'}
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={onOpenNewLeadModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo Lead</span>
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
        </button>

        {/* Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-xs">
            {currentUser?.name
              ? currentUser.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'FL'}
          </div>
          <div className="hidden lg:block text-left text-xs">
            <p className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              {currentUser?.name || 'Administrador'}
            </p>
            <p className="text-[10px] text-slate-400">
              {isSuperAdmin ? 'Master Agência' : 'Dono da Empresa'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
