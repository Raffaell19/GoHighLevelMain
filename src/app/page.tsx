'use client';

import React, { useState } from 'react';
import { Sidebar, ActiveTab } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DashboardView } from '@/components/views/DashboardView';
import { CRMView } from '@/components/views/CRMView';
import { WhatsAppView } from '@/components/views/WhatsAppView';
import { GoogleBusinessView } from '@/components/views/GoogleBusinessView';
import { SocialMediaView } from '@/components/views/SocialMediaView';
import { WorkflowsView } from '@/components/views/WorkflowsView';
import { SettingsView } from '@/components/views/SettingsView';
import { NewLeadModal } from '@/components/NewLeadModal';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);

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
