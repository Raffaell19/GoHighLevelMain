'use client';

import React from 'react';
import { Bell } from 'lucide-react';

interface HeaderProps {
  onOpenNewLeadModal?: () => void;
  onOpenNewPostModal?: () => void;
}

export function Header({}: HeaderProps) {
  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-end shrink-0">
      {/* Notifications */}
      <button
        aria-label="Notificações"
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
      </button>
    </header>
  );
}

