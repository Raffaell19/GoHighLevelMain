'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, ActiveTab } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DashboardView } from '@/components/views/DashboardView';
import { CRMView } from '@/components/views/CRMView';
import { WhatsAppView } from '@/components/views/WhatsAppView';
import { GoogleBusinessView } from '@/components/views/GoogleBusinessView';
import { SocialMediaView } from '@/components/views/SocialMediaView';
import { WorkflowsView } from '@/components/views/WorkflowsView';
import { SettingsView } from '@/components/views/SettingsView';
import { ProspectorView } from '@/components/views/ProspectorView';
import { NewLeadModal } from '@/components/NewLeadModal';
import { useApp } from '@/context/AppContext';
import { Zap } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isAuthLoading } = useApp();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);

  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 mb-4 animate-pulse">
          <Zap className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-white tracking-tight">Carregando Workspace da Empresa...</p>
        <p className="text-xs text-slate-500 mt-1">Sincronizando credenciais e dados isolados</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Multi-Tenant Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Global Header */}
        <Header onOpenNewLeadModal={() => setIsNewLeadModalOpen(true)} />

        {/* View Container */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950/70">
          {activeTab === 'dashboard' && (
            <DashboardView
              setActiveTab={setActiveTab}
              onOpenNewLeadModal={() => setIsNewLeadModalOpen(true)}
            />
          )}

          {activeTab === 'crm' && (
            <CRMView
              onOpenNewLeadModal={() => setIsNewLeadModalOpen(true)}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'prospects' && (
            <ProspectorView onNavigateToCrm={() => setActiveTab('crm')} />
          )}

          {activeTab === 'whatsapp' && <WhatsAppView />}

          {activeTab === 'gmb' && <GoogleBusinessView />}

          {activeTab === 'social' && <SocialMediaView />}

          {activeTab === 'workflows' && <WorkflowsView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Quick Lead Modal */}
      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
      />
    </div>
  );
}
