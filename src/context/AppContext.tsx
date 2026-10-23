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
  AppUser,
} from '@/types';
import { supabase } from '@/lib/supabase';

const defaultStages: PipelineStage[] = [
  { id: 'stage-1', name: 'Novos Leads', color: 'border-blue-500 text-blue-500', order: 1 },
  { id: 'stage-2', name: 'Contato Realizado', color: 'border-amber-500 text-amber-500', order: 2 },
  { id: 'stage-3', name: 'Visita / Reunião', color: 'border-cyan-500 text-cyan-500', order: 3 },
  { id: 'stage-4', name: 'Proposta Enviada', color: 'border-indigo-500 text-indigo-400', order: 4 },
  { id: 'stage-5', name: 'Fechado (Ganho)', color: 'border-emerald-500 text-emerald-500', order: 5 },
];

const initialSubaccounts: Subaccount[] = [
  {
    id: '7c1f69b5-ea20-4ecb-9533-7d8dcc832bdf',
    name: 'Connect Digital',
    segment: 'Marketing & Automações',
    logo: '/logo-connect-digital.png',
    phone: '+55 11 98877-6655',
    email: 'contato@connectdigital.com.br',
    whatsappConfig: {
      provider: 'evolution',
      status: 'connected',
      phone: '+55 51 9196-2040',
      instanceName: 'alves-climatiza--o---el-trica',
      evolutionApiUrl: 'https://evolution-api-kix9.onrender.com',
      evolutionApiKey: 'flowlevel_secret_key_2026',
    },
    gmbConnected: true,
    socialConnected: true,
  },
];

const initialGMBStats: GMBStats = {
  views: 0,
  searches: 0,
  calls: 0,
  directions: 0,
  websiteClicks: 0,
  ratingAverage: 0,
  totalReviews: 0,
};

const initialSocialPosts: SocialPost[] = [];

const initialWorkflows: WorkflowRule[] = [
  {
    id: 'wf-1',
    subaccountId: 'sub-1',
    name: 'Captura Automática de Lead no WhatsApp',
    description: 'Cadastra automaticamente no CRM como Novo Lead e dispara a saudação do Chatbot.',
    triggerType: 'whatsapp_received',
    triggerLabel: 'Nova mensagem de contato não cadastrado',
    isActive: true,
    totalExecutions: 0,
    actions: [
      { id: 'a1', type: 'add_tag', label: 'Adicionar Tag #WhatsAppLead', config: { tag: 'WhatsApp Inbound' } },
      { id: 'a2', type: 'update_stage', label: 'Mover para etapa "Novos Leads"', config: { stageId: 'stage-1' } },
    ],
  },
];

interface AppContextType {
  currentUser: AppUser | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isSuperAdmin: boolean;
  logout: () => Promise<void>;
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
  dispatchWhatsAppLead: (params: {
    leadName: string;
    leadPhone: string;
    companyName: string;
    city?: string;
    category?: string;
    rating?: number;
    text: string;
    mediaUrl?: string;
    mediaType?: 'audio' | 'image' | 'video' | 'document';
    stepNumber?: number;
    requireResponse?: boolean;
  }) => Promise<{ success: boolean; contactId: string; error?: string }>;
  handleInboundLeadResponse: (params: {
    contactId: string;
    responseText: string;
    prospectData?: {
      company?: string;
      city?: string;
      category?: string;
      phone?: string;
    };
    intent?: 'decisor' | 'intermediary' | 'objection';
    botReplyText?: string;
  }) => Promise<void>;
  updateWhatsAppConfig: (subaccountId: string, config: Partial<Subaccount['whatsappConfig']>) => void;
  refreshChatData: () => Promise<void>;
  reviews: GMBReview[];
  gmbStats: GMBStats;
  replyToReview: (reviewId: string, replyText: string) => Promise<void>;
  updateSubaccountLogo: (subaccountId: string, logo: string) => Promise<void>;
  updateGMBData: (stats: GMBStats, reviews: GMBReview[], isConnected?: boolean) => void;
  socialPosts: SocialPost[];
  addSocialPost: (post: Omit<SocialPost, 'id'>) => void;
  deleteSocialPost: (id: string) => void;
  workflows: WorkflowRule[];
  toggleWorkflow: (workflowId: string) => void;
  addWorkflow: (wf: Omit<WorkflowRule, 'id' | 'totalExecutions'>) => Promise<void>;
  updateWorkflow: (wf: WorkflowRule) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  isDbConnected: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [subaccounts, setSubaccounts] = useState<Subaccount[]>(initialSubaccounts);
  const [currentSubaccount, setCurrentSubaccount] = useState<Subaccount>(initialSubaccounts[0]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>(defaultStages);
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [activeContact, setActiveContact] = useState<WhatsAppContact | null>(null);
  const [messages, setMessages] = useState<Record<string, WhatsAppMessage[]>>({});
  const [reviews, setReviews] = useState<GMBReview[]>([]);
  const [gmbStats, setGmbStats] = useState<GMBStats>(initialGMBStats);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>(initialSocialPosts);
  const [workflows, setWorkflows] = useState<WorkflowRule[]>(initialWorkflows);
  const [isDbConnected, setIsDbConnected] = useState(false);

  // 1. Sincronização de Sessão e Subconta Isolada
  useEffect(() => {
    let isMounted = true;

    async function checkAuthAndLoadTenant() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          const resMe = await fetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });
          const meData = await resMe.json();

          if (meData.authenticated && meData.user && isMounted) {
            setCurrentUser(meData.user);
            setIsSuperAdmin(!!meData.user.isSuperAdmin);

            if (meData.subaccounts && meData.subaccounts.length > 0) {
              const formattedSubs: Subaccount[] = meData.subaccounts.map((s: any) => ({
                id: s.id,
                name: s.name,
                segment: s.segment || 'Serviços',
                logo: s.logo && s.logo !== '🏢' ? s.logo : (s.name === 'Connect Digital' ? '/logo-connect-digital.png' : (s.logo || '🏢')),
                phone: s.phone || '',
                email: s.email || '',
                whatsappConfig: {
                  provider: 'evolution',
                  status: 'disconnected',
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
          }
        } else {
          // Sem sessão ativa: carregar catálogo público para pré-visualização ou redirecionar
          const resSubs = await fetch('/api/subaccounts');
          const dataSubs = await resSubs.json();
          if (dataSubs.subaccounts && dataSubs.subaccounts.length > 0 && isMounted) {
            const formattedSubs: Subaccount[] = dataSubs.subaccounts.map((s: any) => ({
              id: s.id,
              name: s.name,
              segment: s.segment || 'Serviços',
              logo: s.logo && s.logo !== '🏢' ? s.logo : (s.name === 'Connect Digital' ? '/logo-connect-digital.png' : (s.logo || '🏢')),
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
        }
      } catch (err) {
        console.error('Erro na inicialização de autenticação e subcontas:', err);
      } finally {
        if (isMounted) setIsAuthLoading(false);
      }
    }

    checkAuthAndLoadTenant();

    // Ouvir alterações de login/logout no Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        checkAuthAndLoadTenant();
      } else {
        setCurrentUser(null);
        setIsSuperAdmin(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setIsSuperAdmin(false);
      window.location.href = '/login';
    } catch (e) {
      console.error('Erro ao realizar logout:', e);
    }
  };

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
          setActiveContact((prev) => {
            if (!prev) return dataChat.contacts[0] || null;
            const found = dataChat.contacts.find((c: any) => c.id === prev.id);
            return found || dataChat.contacts[0] || null;
          });
        }

        if (dataChat.messages && isMounted) {
          setMessages(dataChat.messages);
        }

        // 4. Buscar Workflows GoHighLevel Style
        const resWf = await fetch(`/api/workflows?subaccountId=${currentSubaccount.id}`);
        const dataWf = await resWf.json();
        if (dataWf.workflows && isMounted) {
          setWorkflows(dataWf.workflows);
        }

        // 5. Buscar Dados do Google Meu Negócio
        const resGmb = await fetch(`/api/gmb?subaccountId=${currentSubaccount.id}`);
        const dataGmb = await resGmb.json();
        if (dataGmb && isMounted) {
          if (dataGmb.stats) setGmbStats(dataGmb.stats);
          if (dataGmb.reviews && Array.isArray(dataGmb.reviews) && dataGmb.reviews.length > 0) {
            setReviews(dataGmb.reviews);
          }
        }

        // 6. Buscar Postagens Sociais
        const resSocial = await fetch(`/api/social/posts?subaccountId=${currentSubaccount.id}`);
        const dataSocial = await resSocial.json();
        if (dataSocial?.posts && isMounted) {
          setSocialPosts((prev) => (prev.length === 0 ? dataSocial.posts : prev));
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

  const refreshChatData = async () => {
    if (!currentSubaccount?.id) return;
    try {
      const resChat = await fetch(`/api/whatsapp/chat?subaccountId=${currentSubaccount.id}`);
      const dataChat = await resChat.json();
      if (dataChat.contacts) {
        setContacts(dataChat.contacts);
        setActiveContact((prev) => {
          if (!prev) return dataChat.contacts[0] || null;
          const found = dataChat.contacts.find((c: any) => c.id === prev.id);
          return found || dataChat.contacts[0] || null;
        });
      }
      if (dataChat.messages) {
        setMessages(dataChat.messages);
      }
    } catch (e) {
      console.error('Erro ao recarregar chat:', e);
    }
  };

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
    // Remoção otimista imediata na interface
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    try {
      const res = await fetch(`/api/leads?id=${encodeURIComponent(leadId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: leadId }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Erro HTTP ${res.status}`);
      }
    } catch (e) {
      console.error('Erro ao excluir oportunidade no banco:', e);
      throw e;
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

  const dispatchWhatsAppLead = async ({
    leadName,
    leadPhone,
    companyName,
    city,
    category,
    rating,
    text,
    mediaUrl,
    mediaType,
    stepNumber = 1,
    requireResponse = true,
  }: {
    leadName: string;
    leadPhone: string;
    companyName: string;
    city?: string;
    category?: string;
    rating?: number;
    text: string;
    mediaUrl?: string;
    mediaType?: 'audio' | 'image' | 'video' | 'document';
    stepNumber?: number;
    requireResponse?: boolean;
  }): Promise<{ success: boolean; contactId: string; error?: string }> => {
    const cleanPhone = leadPhone.replace(/[^0-9]/g, '');
    const last8 = cleanPhone.slice(-8);

    let existingContact = contacts.find((c) => {
      const cClean = c.phone ? c.phone.replace(/[^0-9]/g, '') : '';
      return (
        cClean === cleanPhone ||
        (last8.length === 8 && cClean.endsWith(last8)) ||
        (cClean.length >= 8 && cleanPhone.endsWith(cClean.slice(-8))) ||
        (leadName && c.name && c.name.toLowerCase() === leadName.toLowerCase())
      );
    });

    let contactId: string = existingContact?.id || '';

    const stepNum = stepNumber || 1;
    const stepSentTag = `#Msg${stepNum}_Enviada`;
    const stepWaitingTag = requireResponse !== false ? `#Aguardando_Resposta_Msg${stepNum}` : null;
    const readyNextTag = requireResponse === false ? `#Pronto_Msg${stepNum + 1}` : null;

    const buildTags = (prevTags: string[] = []) => {
      const filtered = prevTags.filter(
        (t) =>
          t !== `#Aguardando_Resposta_Msg${stepNum}` &&
          t !== `#Pronto_Msg${stepNum}` &&
          t !== `#Respondeu_Msg${stepNum}` &&
          t !== `#RespondeuWhatsApp` &&
          t !== `#AguardandoDecisor`
      );
      const s = new Set([
        ...filtered,
        '#ProspeccaoMaps',
        stepSentTag,
        ...(stepWaitingTag ? [stepWaitingTag] : []),
        ...(readyNextTag ? [readyNextTag] : []),
      ]);
      return Array.from(s);
    };

    const targetTags = buildTags(existingContact?.tags);

    // Salvar no cache local para resposta visual imediata no modal e tabelas
    try {
      const cacheKey = `flowlevel_cadence_tags_${currentSubaccount.id}`;
      const existingCache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
      existingCache[cleanPhone] = targetTags;
      if (last8) existingCache[last8] = targetTags;
      if (leadPhone) existingCache[leadPhone] = targetTags;
      localStorage.setItem(cacheKey, JSON.stringify(existingCache));
    } catch (e) {}

    if (!contactId) {
      contactId = `contact_outreach_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newContact: WhatsAppContact = {
        id: contactId,
        subaccountId: currentSubaccount.id,
        name: leadName || companyName,
        phone: leadPhone,
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80`,
        lastMessage: text,
        lastMessageTime: 'Agora',
        unreadCount: 0,
        tags: targetTags,
        needsHumanAttention: false,
        source: 'Google Maps Prospector',
      };
      setContacts((prev) => [newContact, ...prev]);
    } else {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === contactId
            ? {
                ...c,
                lastMessage: text,
                lastMessageTime: 'Agora',
                tags: targetTags,
              }
            : c
        )
      );
    }

    const newMsg: WhatsAppMessage = {
      id: `msg_out_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      contactId,
      sender: 'agent',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      mediaUrl,
      mediaType,
    };

    setMessages((prev) => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), newMsg],
    }));

    try {
      const res = await fetch('/api/whatsapp/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          phone: leadPhone,
          name: leadName || companyName,
          text,
          mediaUrl,
          mediaType,
          subaccountId: currentSubaccount.id,
          instanceName: currentSubaccount.whatsappConfig?.instanceName || 'alves-climatiza--o---el-trica',
          tags: targetTags,
          stepNumber: stepNum,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        console.error('Erro de entrega WhatsApp:', data?.error);
        return {
          success: false,
          contactId,
          error: data?.error || 'Falha ao entregar mensagem no WhatsApp da Evolution API',
        };
      }

      // Se o backend retornou o contato sincronizado com Supabase, atualiza o estado
      if (data?.contact) {
        const savedContact = data.contact;
        contactId = savedContact.id;
        setContacts((prev) => {
          const exists = prev.some(
            (c) =>
              c.id === savedContact.id ||
              (savedContact.phone && c.phone === savedContact.phone)
          );
          if (exists) {
            return prev.map((c) =>
              c.id === savedContact.id ||
              (savedContact.phone && c.phone === savedContact.phone)
                ? { ...c, ...savedContact }
                : c
            );
          }
          return [savedContact, ...prev];
        });
      }
    } catch (e: any) {
      console.error('Erro ao disparar outreach:', e);
      return { success: false, contactId, error: e?.message || 'Erro de conexão com o servidor' };
    }

    return { success: true, contactId };
  };

  const handleInboundLeadResponse = async ({
    contactId,
    responseText,
    prospectData,
    intent,
    botReplyText,
  }: {
    contactId: string;
    responseText: string;
    prospectData?: {
      company?: string;
      city?: string;
      category?: string;
      phone?: string;
    };
    intent?: 'decisor' | 'intermediary' | 'objection';
    botReplyText?: string;
  }) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;

    // Detectar intenção semântica automaticamente se não especificada
    let resolvedIntent: 'decisor' | 'intermediary' | 'objection' = intent || 'decisor';
    if (!intent) {
      const lower = responseText.toLowerCase();
      if (
        lower.includes('secretár') ||
        lower.includes('secretar') ||
        lower.includes('recepç') ||
        lower.includes('recepc') ||
        lower.includes('funcionár') ||
        lower.includes('atendente') ||
        lower.includes('não sou o dono') ||
        lower.includes('nao sou o dono') ||
        lower.includes('ele não está') ||
        lower.includes('fale no fixo')
      ) {
        resolvedIntent = 'intermediary';
      } else if (
        lower.includes('não tenho interesse') ||
        lower.includes('nao tenho interesse') ||
        lower.includes('sem interesse') ||
        lower.includes('retire meu') ||
        lower.includes('pare de mandar') ||
        lower.includes('não quero')
      ) {
        resolvedIntent = 'objection';
      } else {
        resolvedIntent = 'decisor';
      }
    }

    const incomingMsg: WhatsAppMessage = {
      id: `msg_in_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      contactId,
      sender: 'contact',
      text: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read',
    };

    const isDecisor = resolvedIntent === 'decisor';
    const tagToAdd = isDecisor
      ? '#DecisorIdentificado'
      : resolvedIntent === 'intermediary'
      ? '#IntermediarioSecretaria'
      : '#SemInteresse';

    setMessages((prev) => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), incomingMsg],
    }));

    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId
          ? {
              ...c,
              lastMessage: responseText,
              lastMessageTime: 'Agora',
              unreadCount: (c.unreadCount || 0) + 1,
              isDecisionMaker: isDecisor,
              needsHumanAttention: isDecisor,
              tags: (() => {
                const curTags = c.tags || [];
                const updated = new Set([
                  ...curTags.filter(
                    (t) =>
                      t !== '#AguardandoDecisor' &&
                      t !== '#Aguardando_Resposta_Msg1' &&
                      t !== '#Aguardando_Resposta_Msg2' &&
                      t !== '#Aguardando_Resposta_Msg3'
                  ),
                  tagToAdd,
                  '#RespondeuWhatsApp',
                ]);
                if (curTags.includes('#Msg1_Enviada') && !curTags.includes('#Msg2_Enviada')) {
                  updated.add('#Respondeu_Msg1');
                  updated.add('#Pronto_Msg2');
                } else if (curTags.includes('#Msg2_Enviada') && !curTags.includes('#Msg3_Enviada')) {
                  updated.add('#Respondeu_Msg2');
                  updated.add('#Pronto_Msg3');
                } else if (curTags.includes('#Msg3_Enviada')) {
                  updated.add('#Respondeu_Msg3');
                }
                return Array.from(updated);
              })(),
            }
          : c
      )
    );

    // Se houver resposta automática inteligente do robô/IA
    if (botReplyText) {
      setTimeout(() => {
        const replyMsg: WhatsAppMessage = {
          id: `msg_bot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          contactId,
          sender: 'agent',
          text: botReplyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'sent',
        };

        setMessages((prev) => ({
          ...prev,
          [contactId]: [...(prev[contactId] || []), replyMsg],
        }));

        setContacts((prev) =>
          prev.map((c) =>
            c.id === contactId
              ? {
                  ...c,
                  lastMessage: botReplyText,
                  lastMessageTime: 'Agora',
                }
              : c
          )
        );
      }, 700);
    }

    // Se for Decisor, insere no CRM Funil na 1ª coluna (se ainda não existir)
    if (isDecisor) {
      const cleanContactPhone = contact.phone.replace(/[^0-9]/g, '');
      const leadExists = leads.some(
        (l) =>
          (l.phone && l.phone.replace(/[^0-9]/g, '') === cleanContactPhone) ||
          l.name.toLowerCase() === contact.name.toLowerCase()
      );

      if (!leadExists) {
        await addLead({
          name: contact.name,
          company: prospectData?.company || contact.name,
          phone: contact.phone,
          email: '',
          value: 1800,
          stageId: stages[0]?.id || 'stage_1',
          status: 'open',
          tags: ['#ProspeccaoMaps', '#DecisorRespondeu'],
          notes: `🎯 Decisor respondeu abordagem no WhatsApp: "${responseText}". Lead qualificado automaticamente para atendimento humanizado.`,
          subaccountId: currentSubaccount.id,
        });
      }
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
    const updatedReviews = reviews.map((r) =>
      r.id === reviewId
        ? {
            ...r,
            replyText,
            replyTime: 'Agora mesmo',
          }
        : r
    );
    setReviews(updatedReviews);

    // Persiste no backend do Google Meu Negócio
    try {
      await fetch('/api/gmb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subaccountId: currentSubaccount.id,
          action: 'sync',
          customReviews: updatedReviews,
          customStats: gmbStats,
        }),
      });
    } catch (e) {
      console.warn('Erro ao persistir resposta no GMB:', e);
    }
  };

  const updateSubaccountLogo = async (subaccountId: string, logo: string) => {
    setSubaccounts((prev) =>
      prev.map((s) => (s.id === subaccountId ? { ...s, logo } : s))
    );
    setCurrentSubaccount((prev) => (prev.id === subaccountId ? { ...prev, logo } : prev));
    try {
      await fetch('/api/subaccounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: subaccountId, logo }),
      });
    } catch (err) {
      console.error('Erro ao atualizar logo da subconta:', err);
    }
  };

  const updateGMBData = (stats: GMBStats, newReviews: GMBReview[], isConnected?: boolean) => {
    setGmbStats(stats);
    setReviews(newReviews);
    if (isConnected !== undefined) {
      setSubaccounts((prev) =>
        prev.map((s) => (s.id === currentSubaccount.id ? { ...s, gmbConnected: isConnected } : s))
      );
      setCurrentSubaccount((prev) => ({ ...prev, gmbConnected: isConnected }));
    }
  };

  const addSocialPost = (post: Omit<SocialPost, 'id'>) => {
    const newPost: SocialPost = {
      ...post,
      id: `post-${Date.now()}`,
      likes: post.status === 'published' ? Math.floor(Math.random() * 30) + 10 : 0,
      comments: post.status === 'published' ? Math.floor(Math.random() * 8) + 2 : 0,
      shares: post.status === 'published' ? Math.floor(Math.random() * 5) + 1 : 0,
    };
    setSocialPosts((prev) => [newPost, ...prev]);
  };

  const deleteSocialPost = (id: string) => {
    setSocialPosts((prev) => prev.filter((p) => p.id !== id));
    fetch(`/api/social/posts?id=${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const toggleWorkflow = async (workflowId: string) => {
    let nextState = false;
    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id === workflowId) {
          nextState = !w.isActive;
          return { ...w, isActive: nextState };
        }
        return w;
      })
    );

    try {
      await fetch('/api/workflows', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: workflowId, isActive: nextState }),
      });
    } catch (e) {
      console.error('Erro ao sincronizar toggle do workflow:', e);
    }
  };

  const addWorkflow = async (wf: Omit<WorkflowRule, 'id' | 'totalExecutions'>) => {
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wf),
      });
      const data = await res.json();
      if (data.workflow) {
        setWorkflows((prev) => [data.workflow, ...prev]);
        return;
      }
    } catch (e) {
      console.error('Erro ao persistir workflow:', e);
    }

    const newWf: WorkflowRule = {
      ...wf,
      id: `wf-${Date.now()}`,
      totalExecutions: 0,
    };
    setWorkflows((prev) => [newWf, ...prev]);
  };

  const updateWorkflow = async (wf: WorkflowRule) => {
    setWorkflows((prev) => prev.map((w) => (w.id === wf.id ? wf : w)));
    try {
      await fetch('/api/workflows', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wf),
      });
    } catch (e) {
      console.error('Erro ao atualizar workflow:', e);
    }
  };

  const deleteWorkflow = async (id: string) => {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
    try {
      await fetch(`/api/workflows?id=${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Erro ao deletar workflow:', e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isAuthLoading,
        isSuperAdmin,
        logout,
        subaccounts,
        currentSubaccount,
        setCurrentSubaccount,
        leads: leads.filter((l) => l.subaccountId === currentSubaccount.id),
        stages,
        moveLeadStage,
        addLead,
        updateLead,
        deleteLead,
        contacts: contacts.filter((c) => !c.subaccountId || c.subaccountId === currentSubaccount.id),
        activeContact,
        setActiveContact,
        messages,
        sendMessage,
        dispatchWhatsAppLead,
        handleInboundLeadResponse,
        updateWhatsAppConfig,
        refreshChatData,
        reviews: reviews.filter((r) => !r.subaccountId || r.subaccountId === currentSubaccount.id),
        gmbStats,
        replyToReview,
        updateSubaccountLogo,
        updateGMBData,
        socialPosts: socialPosts.filter((p) => !p.subaccountId || p.subaccountId === currentSubaccount.id),
        addSocialPost,
        deleteSocialPost,
        workflows: workflows.filter((w) => w.subaccountId === currentSubaccount.id),
        toggleWorkflow,
        addWorkflow,
        updateWorkflow,
        deleteWorkflow,
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
