'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DashboardView from '@/components/views/DashboardView';
import CRMView from '@/components/views/CRMView';
import { ProspectorView } from '@/components/views/ProspectorView';
import { WhatsAppView } from '@/components/views/WhatsAppView';
import GoogleBusinessView from '@/components/views/GoogleBusinessView';
import SocialMediaView from '@/components/views/SocialMediaView';
import { WorkflowsView } from '@/components/views/WorkflowsView';
import SettingsView from '@/components/views/SettingsView';
import NewLeadModal from '@/components/NewLeadModal';
import { ViewType } from '@/types';

export default function Home() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-[100svh] bg-black text-white">
      {/* Ruled Left Navigation (216px desktop, full-screen sheet mobile) */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-black">
        <Header
          onOpenNewLeadModal={() => setIsNewLeadModalOpen(true)}
          activeView={activeView}
          onSelectView={setActiveView}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 px-6 py-6 lg:px-7 lg:py-6 overflow-x-hidden">
          {activeView === 'dashboard' && (
            <DashboardView
              onSelectView={setActiveView}
              onOpenNewLeadModal={() => setIsNewLeadModalOpen(true)}
            />
          )}
          {activeView === 'crm' && (
            <CRMView onOpenNewLead={() => setIsNewLeadModalOpen(true)} />
          )}
          {activeView === 'prospector' && (
            <ProspectorView
              onNavigateToCrm={() => setActiveView('crm')}
              onNavigateToWhatsApp={() => setActiveView('whatsapp')}
            />
          )}
          {activeView === 'whatsapp' && <WhatsAppView />}
          {activeView === 'gmb' && <GoogleBusinessView />}
          {activeView === 'social' && <SocialMediaView />}
          {activeView === 'workflows' && <WorkflowsView />}
          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Modal de Novo Lead */}
      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
      />
    </div>
  );
}
