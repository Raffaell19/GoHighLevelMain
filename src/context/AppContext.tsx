'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Subaccount,
  Lead,
  PipelineStage,
  WhatsAppContact,
  WhatsAppMessage,
  GMBReview,
  GMBStats,
  SocialPost,
  WorkflowRule,
} from '@/types';

const defaultStages: PipelineStage[] = [
  { id: 'stage-1', name: 'Novos Leads', color: 'border-blue-500 text-blue-500', order: 1 },
  { id: 'stage-2', name: 'Contato Realizado', color: 'border-amber-500 text-amber-500', order: 2 },
  { id: 'stage-3', name: 'Visita / Reunião', color: 'border-cyan-500 text-cyan-500', order: 3 },
  { id: 'stage-4', name: 'Proposta Enviada', color: 'border-indigo-500 text-indigo-400', order: 4 },
  { id: 'stage-5', name: 'Fechado (Ganho)', color: 'border-emerald-500 text-emerald-500', order: 5 },
];

const initialSubaccounts: Subaccount[] = [
  {
    id: 'sub-1',
    name: 'Alves Climatização & Elétrica',
    segment: 'Serviços & Instalações',
    logo: '⚡',
    phone: '+55 11 98877-6655',
    email: 'contato@alvesinstaladora.com.br',
    whatsappConfig: {
      provider: 'evolution',
      status: 'connected',
      phone: '+55 11 98877-6655',
      instanceName: 'alves-principal',
      evolutionApiUrl: 'https://api.evolution.local',
      evolutionApiKey: 'evo_sec_993817481',
    },
    gmbConnected: true,
    socialConnected: true,
  },
];

const initialGMBStats: GMBStats = {
  views: 3840,
  searches: 2150,
  calls: 94,
  directions: 340,
  websiteClicks: 520,
  ratingAverage: 4.9,
  totalReviews: 138,
};

const initialSocialPosts: SocialPost[] = [
  {
    id: 'post-1',
    subaccountId: 'sub-1',
    platforms: ['instagram', 'facebook'],
    content: '❄️ Seu ar-condicionado está pingando ou com cheiro estranho? Agende uma revisão preventiva e respire ar puro! Chame no WhatsApp. #Climatizacao #AlvesInstalacoes',
    mediaUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
    scheduledDate: '2026-10-18 11:00',
    status: 'scheduled',
    likes: 0,
    comments: 0,
  },
];

const initialWorkflows: WorkflowRule[] = [
  {
    id: 'wf-1',
    subaccountId: 'sub-1',
    name: 'Captura Automática de Lead no WhatsApp',
    description: 'Cadastra automaticamente no CRM como Novo Lead e dispara a saudação do Chatbot.',
    triggerType: 'whatsapp_received',
    triggerLabel: 'Nova mensagem de contato não cadastrado',
    isActive: true,
    totalExecutions: 342,
    actions: [
      { id: 'a1', type: 'add_tag', label: 'Adicionar Tag #WhatsAppLead', config: { tag: 'WhatsApp Inbound' } },
      { id: 'a2', type: 'update_stage', label: 'Mover para etapa "Novos Leads"', config: { stageId: 'stage-1' } },
    ],
  },
];

interface AppContextType {
  subaccounts: Subaccount[];
  currentSubaccount: Subaccount;
  setCurrentSubaccount: (sub: Subaccount) => void;
  leads: Lead[];
  stages: PipelineStage[];
  moveLeadStage: (leadId: string, newStageId: string) => void;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'lastActivity'>) => Promise<void>;
  updateLead: (lead: Lead) => Promise<void>;
  deleteLead: (leadId: string) => Promise<void>;
  contacts: WhatsAppContact[];
  activeContact: WhatsAppContact | null;
  setActiveContact: (contact: WhatsAppContact) => void;
  messages: Record<string, WhatsAppMessage[]>;
  sendMessage: (contactId: string, text: string) => void;
  updateWhatsAppConfig: (subaccountId: string, config: Partial<Subaccount['whatsappConfig']>) => void;
  reviews: GMBReview[];
  gmbStats: GMBStats;
  replyToReview: (reviewId: string, replyText: string) => Promise<void>;
  socialPosts: SocialPost[];
  addSocialPost: (post: Omit<SocialPost, 'id'>) => void;
  workflows: WorkflowRule[];
  toggleWorkflow: (workflowId: string) => void;
  addWorkflow: (wf: Omit<WorkflowRule, 'id' | 'totalExecutions'>) => void;
  isDbConnected: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [subaccounts, setSubaccounts] = useState<Subaccount[]>(initialSubaccounts);
  const [currentSubaccount, setCurrentSubaccount] = useState<Subaccount>(initialSubaccounts[0]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>(defaultStages);
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [activeContact, setActiveContact] = useState<WhatsAppContact | null>(null);
  const [messages, setMessages] = useState<Record<string, WhatsAppMessage[]>>({});
  const [reviews, setReviews] = useState<GMBReview[]>([]);
  const [gmbStats] = useState<GMBStats>(initialGMBStats);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>(initialSocialPosts);
  const [workflows, setWorkflows] = useState<WorkflowRule[]>(initialWorkflows);
  const [isDbConnected, setIsDbConnected] = useState(false);

  // Carregar subcontas e dados da subconta ativa
  useEffect(() => {
    async function loadInitial() {
      try {
        const resSubs = await fetch('/api/subaccounts');
        const dataSubs = await resSubs.json();

        if (dataSubs.subaccounts && dataSubs.subaccounts.length > 0) {
          const formattedSubs: Subaccount[] = dataSubs.subaccounts.map((s: any) => ({
            id: s.id,
            name: s.name,
            segment: s.segment || 'Serviços',
            logo: s.logo || '⚡',
            phone: s.phone || '',
            email: s.email || '',
            whatsappConfig: {
              provider: 'evolution',
              status: 'connected',
              phone: s.phone || '',
              instanceName: s.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            },
            gmbConnected: s.gmb_connected,
            socialConnected: s.social_connected,
          }));

          setSubaccounts(formattedSubs);
          setCurrentSubaccount(formattedSubs[0]);
          setIsDbConnected(true);
        }
      } catch (err) {
        console.error('Erro ao conectar ao Supabase:', err);
      }
    }

    loadInitial();
  }, []);

  // Carregar dados da subconta ativa e sincronizar em tempo real
  useEffect(() => {
    if (!currentSubaccount?.id) return;

    let isMounted = true;

    async function loadTenantData() {
      try {
        // 1. Buscar Estágios
        const resStages = await fetch(`/api/stages?subaccountId=${currentSubaccount.id}`);
        const dataStages = await resStages.json();
        let loadedStages = defaultStages;

        if (dataStages.stages && dataStages.stages.length > 0) {
          loadedStages = dataStages.stages.map((st: any) => ({
            id: st.id,
            name: st.name,
            color: st.color || 'border-blue-500 text-blue-500',
            order: st.sort_order,
          }));
          if (isMounted) setStages(loadedStages);
        }

        // 2. Buscar Leads do Supabase
        const resLeads = await fetch(`/api/leads?subaccountId=${currentSubaccount.id}`);
        const dataLeads = await resLeads.json();

        if (dataLeads.leads && isMounted) {
          const firstStageId = loadedStages[0]?.id || 'stage-1';
          const stageIds = new Set(loadedStages.map((s) => s.id));

          setLeads(
            dataLeads.leads.map((l: any) => ({
              id: l.id,
              subaccountId: l.subaccount_id,
              name: l.name,
              company: l.company || '',
              phone: l.phone || '',
              email: l.email || '',
              value: Number(l.value) || 0,
              stageId: l.stage_id && stageIds.has(l.stage_id) ? l.stage_id : firstStageId,
              tags: l.tags || [],
              notes: l.notes || '',
              createdAt: l.created_at?.slice(0, 16).replace('T', ' ') || '',
              lastActivity: l.last_activity || 'Ativo',
              status: (l.status as any) || 'open',
            }))
          );
        }

        // 3. Buscar Contatos e Mensagens do WhatsApp
        const resChat = await fetch(`/api/whatsapp/chat?subaccountId=${currentSubaccount.id}`);
        const dataChat = await resChat.json();

        if (dataChat.contacts && isMounted) {
          setContacts(dataChat.contacts);
          setActiveContact((prev) => prev || dataChat.contacts[0] || null);
        }

        if (dataChat.messages && isMounted) {
          setMessages(dataChat.messages);
        }
      } catch (err) {
        console.error('Erro ao sincronizar dados em tempo real:', err);
      }
    }

    loadTenantData();
    // Polling a cada 3.5 segundos para atualizar leads e conversas do WhatsApp em tempo real
    const interval = setInterval(loadTenantData, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentSubaccount?.id]);

  // Mover lead entre estágios (Atualiza State + Banco Supabase)
  const moveLeadStage = async (leadId: string, newStageId: string) => {
    const isWon = stages.find((s) => s.id === newStageId)?.name.includes('Ganho');
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === leadId) {
          return {
            ...lead,
            stageId: newStageId,
            status: isWon ? 'won' : 'open',
            lastActivity: 'Movido de estágio agora',
          };
        }
        return lead;
      })
    );

    try {
      await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: leadId,
          stageId: newStageId,
          status: isWon ? 'won' : 'open',
          lastActivity: 'Movido de estágio agora',
        }),
      });
    } catch (err) {
      console.error('Erro ao sincronizar lead no Supabase:', err);
    }
  };

  // Adicionar lead
  const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'lastActivity'>) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leadData,
          subaccountId: currentSubaccount.id,
        }),
      });

      const json = await res.json();
      if (json.lead) {
        const created: Lead = {
          ...leadData,
          id: json.lead.id,
          createdAt: json.lead.created_at?.slice(0, 16).replace('T', ' ') || 'Agora',
          lastActivity: 'Cadastrado agora',
        };
        setLeads((prev) => [created, ...prev]);
        return;
      }
    } catch (err) {
      console.error('Erro ao salvar lead no Supabase:', err);
    }
  };

  const updateLead = async (updated: Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    try {
      await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updated.id,
          notes: updated.notes,
          value: updated.value,
          lastActivity: 'Anotações atualizadas',
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteLead = async (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    try {
      await fetch(`/api/leads?id=${leadId}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async (contactId: string, text: string) => {
    if (!text.trim()) return;

    const targetContact = contacts.find((c) => c.id === contactId);

    const newMsg: WhatsAppMessage = {
      id: `m-${Date.now()}`,
      contactId,
      sender: 'agent',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };

    setMessages((prev) => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), newMsg],
    }));

    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId
          ? { ...c, lastMessage: text, lastMessageTime: 'Agora', unreadCount: 0 }
          : c
      )
    );

    try {
      await fetch('/api/whatsapp/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          phone: targetContact?.phone || '',
          text,
          subaccountId: currentSubaccount.id,
          instanceName: currentSubaccount.whatsappConfig?.instanceName || 'alves-climatiza--o---el-trica',
        }),
      });
    } catch (err) {
      console.error('Erro ao enviar mensagem para o WhatsApp:', err);
    }
  };

  const updateWhatsAppConfig = (subaccountId: string, config: Partial<Subaccount['whatsappConfig']>) => {
    setSubaccounts((prev) =>
      prev.map((s) => {
        if (s.id === subaccountId) {
          const updated = {
            ...s,
            whatsappConfig: { ...s.whatsappConfig, ...config },
          };
          if (currentSubaccount.id === subaccountId) {
            setCurrentSubaccount(updated);
          }
          return updated;
        }
        return s;
      })
    );
  };

  const replyToReview = async (reviewId: string, replyText: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              replyText,
              replyTime: 'Agora mesmo',
            }
          : r
      )
    );
  };

  const addSocialPost = (post: Omit<SocialPost, 'id'>) => {
    const newPost: SocialPost = {
      ...post,
      id: `post-${Date.now()}`,
      likes: 0,
      comments: 0,
    };
    setSocialPosts((prev) => [newPost, ...prev]);
  };

  const toggleWorkflow = (workflowId: string) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === workflowId ? { ...w, isActive: !w.isActive } : w))
    );
  };

  const addWorkflow = (wf: Omit<WorkflowRule, 'id' | 'totalExecutions'>) => {
    const newWf: WorkflowRule = {
      ...wf,
      id: `wf-${Date.now()}`,
      totalExecutions: 0,
    };
    setWorkflows((prev) => [newWf, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        subaccounts,
        currentSubaccount,
        setCurrentSubaccount,
        leads: leads.filter((l) => l.subaccountId === currentSubaccount.id),
        stages,
        moveLeadStage,
        addLead,
        updateLead,
        deleteLead,
        contacts: contacts.filter((c) => c.subaccountId === currentSubaccount.id),
        activeContact,
        setActiveContact,
        messages,
        sendMessage,
        updateWhatsAppConfig,
        reviews: reviews.filter((r) => r.subaccountId === currentSubaccount.id),
        gmbStats,
        replyToReview,
        socialPosts: socialPosts.filter((p) => p.subaccountId === currentSubaccount.id),
        addSocialPost,
        workflows: workflows.filter((w) => w.subaccountId === currentSubaccount.id),
        toggleWorkflow,
        addWorkflow,
        isDbConnected,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
