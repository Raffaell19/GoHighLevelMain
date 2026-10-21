'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Send,
  Mic,
  Square,
  Play,
  Pause,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Users,
  Bot,
  Volume2,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  MessageCircle,
  Kanban,
  Check,
  FileAudio,
  Sliders,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Cpu,
  HelpCircle,
  Edit3,
  Save,
  Phone,
  ChevronRight,
  ChevronDown,
  Menu,
  Sparkle,
  Search,
  Building2,
  MapPin,
  Star,
  Eye,
  Filter,
  CheckCheck,
  CheckSquare,
  Upload,
  Maximize2,
  Minimize2,
  Table,
  Copy,
  RotateCcw,
  Edit2,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ProspectItem, AudioTrackItem, SequenceStepItem, SequenceTemplate } from '@/types';

interface MassOutreachModalProps {
  isOpen: boolean;
  onClose?: () => void;
  selectedLeads?: ProspectItem[];
  variant?: 'modal' | 'embedded';
  onNavigateToWhatsApp?: () => void;
  onNavigateToCrm?: () => void;
}

// 20 estabelecimentos completos minerados para histórico e demonstração rápida
const DEFAULT_SEED_PROSPECTS: ProspectItem[] = [
  {
    id: 'seed_1',
    name: 'Esquadrias Vale dos Sinos',
    phone: '(51) 99594-1122',
    address: 'Av. Nações Unidas, 2340 - Centro, Novo Hamburgo - RS',
    rating: 4.8,
    reviewsCount: 38,
    category: 'Fábrica de Esquadrias',
  },
  {
    id: 'seed_2',
    name: 'Alumasa Alumínios & Vidros',
    phone: '(51) 99823-4455',
    address: 'Rua Bento Gonçalves, 1100 - Pátria Nova, Novo Hamburgo - RS',
    rating: 4.9,
    reviewsCount: 64,
    category: 'Vidraçaria e Esquadrias',
  },
  {
    id: 'seed_3',
    name: 'Metálica Sinos Soluções',
    phone: '(51) 98711-2233',
    address: 'Rua Primeiro de Março, 850 - Industrial, Novo Hamburgo - RS',
    rating: 4.7,
    reviewsCount: 29,
    category: 'Serralheria Industrial',
  },
  {
    id: 'seed_4',
    name: 'Portal Esquadrias de Alto Padrão',
    phone: '(51) 99344-9988',
    address: 'Rua Guia Lopes, 430 - Rondônia, Novo Hamburgo - RS',
    rating: 5.0,
    reviewsCount: 42,
    category: 'Esquadrias em PVC e Alumínio',
  },
  {
    id: 'seed_5',
    name: 'Vanguard Estruturas Metálicas',
    phone: '(51) 99122-3344',
    address: 'Av. Cel. Travassos, 990 - Canudos, Novo Hamburgo - RS',
    rating: 4.6,
    reviewsCount: 19,
    category: 'Fábrica de Portões e Grades',
  },
  {
    id: 'seed_6',
    name: 'Arte em Alumínio & Fachadas',
    phone: '(51) 99455-6677',
    address: 'Rua Sapiranga, 180 - Canudos, Novo Hamburgo - RS',
    rating: 4.9,
    reviewsCount: 51,
    category: 'Fachadas e Esquadrias',
  },
  {
    id: 'seed_7',
    name: 'Sinos Glass Vidros Temperados',
    phone: '(51) 98123-9900',
    address: 'Rua Bartolomeu de Gusmão, 450 - Canudos, Novo Hamburgo - RS',
    rating: 4.8,
    reviewsCount: 33,
    category: 'Vidraçaria e Alumínio',
  },
  {
    id: 'seed_8',
    name: 'Esquadrias & Ferragens Brasil',
    phone: '(51) 99233-1188',
    address: 'Rua Joaquim Nabuco, 710 - Rio Branco, Novo Hamburgo - RS',
    rating: 4.5,
    reviewsCount: 17,
    category: 'Serralheria e Estruturas',
  },
];

// Áudios Padrão da Plataforma (Inicia zerado para gravações reais do usuário)
const DEFAULT_AUDIOS: AudioTrackItem[] = [];

// Modelos de Sequência Pré-configurados
const PRESET_SEQUENCES: SequenceTemplate[] = [
  {
    id: 'seq_audio_texto',
    name: '🔥 Sequência Campeã: Texto de Abordagem + Áudio PTT Humanizado',
    description: 'Envia primeiro o texto cumprimentando e, em seguida, o áudio filtrando o proprietário.',
    isPreset: true,
    steps: [
      {
        id: 'step_1',
        type: 'text' as const,
        title: 'Passo 1: Mensagem de Quebra de Gelo',
        textContent:
          'Olá time da {{empresa}}, tudo bem? Sou o Rafael da Connect Digital aqui em {{cidade}}.',
        requireResponse: true,
      },
      {
        id: 'step_2',
        type: 'audio' as const,
        title: 'Passo 2: Áudio de Apresentação (PTT)',
        audioId: undefined,
        requireResponse: true,
      },
      {
        id: 'step_3',
        type: 'text' as const,
        title: 'Passo 3: Pergunta-Chave do Decisor',
        textContent:
          'Poderia me confirmar se este é o WhatsApp direto do proprietário ou responsável pelas decisões da empresa?',
        requireResponse: false,
      },
    ],
  },
  {
    id: 'seq_google_maps',
    name: '⭐ Sequência Elogio Google Maps + Proposta de Automação',
    description: 'Utiliza a avaliação do Google Maps do lead para alta taxa de abertura.',
    steps: [
      {
        id: 'step_1',
        type: 'text' as const,
        title: 'Passo 1: Elogio de Nota Google Maps',
        textContent:
          'Oi pessoal da {{empresa}}! Acompanho o trabalho de vocês em {{categoria}} e vi a excelente nota de {{avaliacao}} ⭐ no Google Maps.',
        requireResponse: true,
      },
      {
        id: 'step_2',
        type: 'audio' as const,
        title: 'Passo 2: Áudio de Parceria Estratégica (PTT)',
        audioId: undefined,
        requireResponse: true,
      },
      {
        id: 'step_3',
        type: 'text' as const,
        title: 'Passo 3: Solicitação do Contato Direto',
        textContent:
          'Temos soluções de captação e inteligência comercial para empresas referência em {{cidade}}. Seria você o responsável por avaliar novas parcerias comerciais?',
        requireResponse: false,
      },
    ],
  },
  {
    id: 'seq_direta_rapida',
    name: '⚡ Sequência Ultra-Rápida: Pergunta Direta ao Decisor',
    description: 'Sequência enxuta de 2 passos para quem deseja resposta imediata.',
    steps: [
      {
        id: 'step_1',
        type: 'text' as const,
        title: 'Passo 1: Pergunta Direta',
        textContent:
          'Olá {{empresa}}! Tudo bem? Gostaria de saber se este contato é direto do proprietário ou diretor da empresa.',
        requireResponse: true,
      },
      {
        id: 'step_2',
        type: 'audio' as const,
        title: 'Passo 2: Áudio Rápido (PTT)',
        audioId: undefined,
        requireResponse: false,
      },
    ],
  },
  {
    id: 'seq_sem_site_gmn',
    name: '🌐 Proposta de Criação de Site + Google Meu Negócio',
    description: 'Criada especialmente para abordar empresas que não possuem site cadastrado no Google Maps.',
    steps: [
      {
        id: 'step_1',
        type: 'text' as const,
        title: 'Passo 1: Notificação de Oportunidade Digital',
        textContent:
          'Olá pessoal da {{empresa}}, tudo bem? Encontrei o perfil de vocês aqui no Google Maps em {{cidade}} e percebi que vocês ainda não possuem um site profissional cadastrado para receber clientes.',
        requireResponse: true,
      },
      {
        id: 'step_2',
        type: 'audio' as const,
        title: 'Passo 2: Áudio com Solução Google Meu Negócio (PTT)',
        audioId: undefined,
        requireResponse: true,
      },
      {
        id: 'step_3',
        type: 'text' as const,
        title: 'Passo 3: Pergunta Direta ao Proprietário',
        textContent:
          'Ajudamos empresas da sua região a criarem sites modernos e dominarem o topo das buscas do Google. Poderia me confirmar se este é o WhatsApp direto do proprietário ou diretor?',
        requireResponse: false,
      },
    ],
  },
];

export function MassOutreachModal({
  isOpen,
  onClose,
  selectedLeads = [],
  variant = 'modal',
  onNavigateToWhatsApp,
  onNavigateToCrm,
}: MassOutreachModalProps) {
  const {
    currentSubaccount,
    dispatchWhatsAppLead,
    handleInboundLeadResponse,
    stages,
    contacts,
    leads,
  } = useApp();

  const isEmbedded = variant === 'embedded';

  // Estados de Navegação Principal do Modal (Destinatários é a 1ª aba)
  const [activeTab, setActiveTab] = useState<'recipients' | 'sequence' | 'audio_studio' | 'ai_rules'>('recipients');
  const [modalStage, setModalStage] = useState<'builder' | 'sending' | 'finished'>('builder');

  // Estados de Gerenciamento de Destinatários
  const [contactSourceFilter, setContactSourceFilter] = useState<'all' | 'maps' | 'whatsapp' | 'crm'>('all');
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [isAddingCustomContact, setIsAddingCustomContact] = useState(false);
  const [customLeadForm, setCustomLeadForm] = useState({
    name: '',
    phone: '',
    city: '',
    category: '',
  });
  const [customAddedLeads, setCustomAddedLeads] = useState<ProspectItem[]>([]);

  // 1. Leads de Prospecção (Google Maps)
  const mapsLeads: (ProspectItem & { sourceType: string })[] = useMemo(() => {
    const list = selectedLeads && selectedLeads.length > 0 ? selectedLeads : DEFAULT_SEED_PROSPECTS;
    return list.map((l) => ({ ...l, sourceType: 'maps' }));
  }, [selectedLeads]);

  // 2. Contatos da Central de WhatsApp Omnichannel
  const whatsappLeads: (ProspectItem & { sourceType: string })[] = useMemo(() => {
    return (contacts || []).map((c) => ({
      id: `wa_${c.id}`,
      name: c.name || 'Contato WhatsApp',
      phone: c.phone || '',
      address: c.lastMessage ? `Última msg: ${c.lastMessage.slice(0, 32)}...` : 'WhatsApp Omnichannel',
      rating: 5.0,
      reviewsCount: 1,
      category: c.tags?.[0] || 'Cliente WhatsApp',
      sourceType: 'whatsapp',
    }));
  }, [contacts]);

  // 3. Leads do CRM (Pipeline de Vendas)
  const crmLeads: (ProspectItem & { sourceType: string })[] = useMemo(() => {
    return (leads || []).map((l) => ({
      id: `crm_${l.id}`,
      name: l.company || l.name || 'Lead CRM',
      phone: l.phone || '',
      address: l.company ? `${l.company} • CRM` : 'Lead do Funil CRM',
      rating: 5.0,
      reviewsCount: 1,
      category: l.tags?.[0] || 'Oportunidade Funil',
      sourceType: 'crm',
    }));
  }, [leads]);

  // Unificação de todas as fontes disponíveis
  const allAvailableLeads = useMemo(() => {
    const map = new Map<string, ProspectItem & { sourceType: string }>();
    mapsLeads.forEach((l) => map.set(l.id, l));
    whatsappLeads.forEach((l) => { if (!map.has(l.id)) map.set(l.id, l); });
    crmLeads.forEach((l) => { if (!map.has(l.id)) map.set(l.id, l); });
    customAddedLeads.forEach((l) => map.set(l.id, { ...l, sourceType: 'custom' }));
    return Array.from(map.values());
  }, [mapsLeads, whatsappLeads, crmLeads, customAddedLeads]);

  // Filtragem por fonte de origem
  const sourceFilteredLeads = useMemo(() => {
    if (contactSourceFilter === 'maps') return allAvailableLeads.filter((l) => l.sourceType === 'maps');
    if (contactSourceFilter === 'whatsapp') return allAvailableLeads.filter((l) => l.sourceType === 'whatsapp');
    if (contactSourceFilter === 'crm') return allAvailableLeads.filter((l) => l.sourceType === 'crm');
    return allAvailableLeads;
  }, [allAvailableLeads, contactSourceFilter]);

  // Estados de Cadência e Modo de Disparo (Domínio de cada mensagem 1, 2, 3...)
  const [cadenceFilter, setCadenceFilter] = useState<
    'all' | 'waiting_1' | 'waiting_reply_1' | 'ready_for_2' | 'waiting_reply_2' | 'ready_for_3' | 'completed' | 'objection'
  >('all');
  const [dispatchMode, setDispatchMode] = useState<'single_step' | 'full_sequence'>('single_step');
  const [targetStepIndexToDispatch, setTargetStepIndexToDispatch] = useState<number>(0);
  const [cadenceUpdateCounter, setCadenceUpdateCounter] = useState<number>(0);

  // Helper para localizar o contato WhatsApp correspondente a um lead
  const findContactForLead = (lead: ProspectItem) => {
    if (!lead) return null;
    const clean = lead.phone ? lead.phone.replace(/[^0-9]/g, '') : '';
    const last8 = clean.length >= 8 ? clean.slice(-8) : clean;
    const normName = lead.name ? lead.name.trim().toLowerCase() : '';

    return (contacts || []).find((c) => {
      if (!c) return false;
      if (lead.id && (lead.id === c.id || lead.id === `wa_${c.id}` || c.id === `wa_${lead.id}`)) return true;
      const cClean = c.phone ? c.phone.replace(/[^0-9]/g, '') : '';
      if (clean && cClean) {
        if (cClean === clean) return true;
        if (last8 && cClean.endsWith(last8)) return true;
        if (cClean.length >= 8 && clean.endsWith(cClean.slice(-8))) return true;
      }
      if (normName && c.name && c.name.trim().toLowerCase() === normName) {
        return true;
      }
      return false;
    });
  };

  // Helper para identificar o estágio exato da cadência/conversa de cada lead
  const getLeadCadenceStage = (lead: ProspectItem): {
    stage: 'waiting_1' | 'waiting_reply_1' | 'ready_for_2' | 'waiting_reply_2' | 'ready_for_3' | 'completed' | 'objection';
    label: string;
    badgeColor: string;
    stepToDispatch: number;
  } => {
    const c = findContactForLead(lead);
    let tags: string[] = Array.isArray(c?.tags) ? c.tags : [];

    // Fallback para cache local imediato
    if (!tags || tags.length === 0) {
      try {
        const clean = lead.phone ? lead.phone.replace(/[^0-9]/g, '') : '';
        const last8 = clean.slice(-8);
        const cacheKey = `flowlevel_cadence_tags_${currentSubaccount?.id}`;
        const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
        tags = cache[clean] || (last8 ? cache[last8] : null) || (lead.phone ? cache[lead.phone] : null) || [];
      } catch (e) {}
    }

    if (!tags || tags.length === 0) {
      return {
        stage: 'waiting_1',
        label: 'Aguardando Msg 1',
        badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
        stepToDispatch: 0,
      };
    }

    if (tags.includes('#SemInteresse')) {
      return {
        stage: 'objection',
        label: 'Objeção / Sem Interesse',
        badgeColor: 'bg-red-950/60 text-red-300 border-red-500/40',
        stepToDispatch: 0,
      };
    }
    if (tags.includes('#Msg3_Enviada') || tags.includes('#Passo3_Enviado') || tags.includes('#Concluido')) {
      return {
        stage: 'completed',
        label: 'Sequência Concluída (Passo 3)',
        badgeColor: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40',
        stepToDispatch: 2,
      };
    }
    if (tags.includes('#Respondeu_Msg2') || tags.includes('#Pronto_Msg3')) {
      return {
        stage: 'ready_for_3',
        label: 'Respondeu Msg 2 (Pronto p/ Msg 3)',
        badgeColor: 'bg-purple-950/60 text-purple-300 border-purple-500/40',
        stepToDispatch: 2,
      };
    }
    if (tags.includes('#Msg2_Enviada') || tags.includes('#Passo2_Enviado')) {
      return {
        stage: 'waiting_reply_2',
        label: 'Msg 2 Enviada (Aguardando Retorno)',
        badgeColor: 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40',
        stepToDispatch: 1,
      };
    }
    if (
      tags.includes('#Respondeu_Msg1') ||
      tags.includes('#DecisorIdentificado') ||
      tags.includes('#Pronto_Msg2')
    ) {
      return {
        stage: 'ready_for_2',
        label: 'Respondeu Msg 1 (Pronto p/ Msg 2)',
        badgeColor: 'bg-teal-950/60 text-teal-300 border-teal-500/40',
        stepToDispatch: 1,
      };
    }
    if (
      tags.includes('#Msg1_Enviada') ||
      tags.includes('#Passo1_Enviado') ||
      tags.includes('#AguardandoDecisor') ||
      tags.includes('#Aguardando_Resposta_Msg1')
    ) {
      return {
        stage: 'waiting_reply_1',
        label: 'Msg 1 Enviada (Aguardando Resposta)',
        badgeColor: 'bg-amber-950/60 text-amber-300 border-amber-500/40',
        stepToDispatch: 0,
      };
    }
    return {
      stage: 'waiting_1',
      label: 'Aguardando Msg 1',
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
      stepToDispatch: 0,
    };
  };

  // Contadores dinâmicos para cada status de cadência
  const cadenceCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: sourceFilteredLeads.length,
      waiting_1: 0,
      waiting_reply_1: 0,
      ready_for_2: 0,
      waiting_reply_2: 0,
      ready_for_3: 0,
      completed: 0,
      objection: 0,
    };
    sourceFilteredLeads.forEach((lead) => {
      const { stage } = getLeadCadenceStage(lead);
      if (counts[stage] !== undefined) {
        counts[stage]++;
      }
    });
    return counts;
  }, [sourceFilteredLeads, contacts, cadenceUpdateCounter]);

  // Filtragem combinada: Fonte + Cadência
  const cadenceFilteredLeads = useMemo(() => {
    if (cadenceFilter === 'all') return sourceFilteredLeads;
    return sourceFilteredLeads.filter((l) => getLeadCadenceStage(l).stage === cadenceFilter);
  }, [sourceFilteredLeads, cadenceFilter, contacts, cadenceUpdateCounter]);

  // Filtragem por busca
  const displayedLeads = useMemo(() => {
    if (!contactSearchTerm.trim()) return cadenceFilteredLeads;
    const term = contactSearchTerm.toLowerCase();
    return cadenceFilteredLeads.filter(
      (l) =>
        l.name.toLowerCase().includes(term) ||
        (l.phone && l.phone.includes(term)) ||
        (l.address && l.address.toLowerCase().includes(term)) ||
        (l.category && l.category.toLowerCase().includes(term))
    );
  }, [cadenceFilteredLeads, contactSearchTerm]);

  // Seleção de Leads via Checkbox
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    const defaultList = mapsLeads.length > 0 ? mapsLeads : allAvailableLeads;
    defaultList.forEach((l) => {
      if (l.phone && l.phone.replace(/[^0-9]/g, '').length >= 8) {
        initial.add(l.id);
      }
    });
    return initial;
  });

  // Atualiza a seleção e fonte caso selectedLeads via prop mude
  useEffect(() => {
    if (selectedLeads && selectedLeads.length > 0) {
      setContactSourceFilter('maps');
      const validIds = selectedLeads
        .filter((l) => l.phone && l.phone.replace(/[^0-9]/g, '').length >= 8)
        .map((l) => l.id);
      setSelectedLeadIds(new Set(validIds));
    }
  }, [selectedLeads]);

  const toggleLeadSelection = (id: string) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllDisplayed = () => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      displayedLeads.forEach((l) => {
        if (l.phone && l.phone.replace(/[^0-9]/g, '').length >= 8) {
          next.add(l.id);
        }
      });
      return next;
    });
  };

  const deselectAllDisplayed = () => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      displayedLeads.forEach((l) => next.delete(l.id));
      return next;
    });
  };

  // Leads finais que participarão do disparo
  const leadsToDispatch = useMemo(() => {
    return allAvailableLeads.filter(
      (l) => selectedLeadIds.has(l.id) && l.phone && l.phone.replace(/[^0-9]/g, '').length >= 8
    );
  }, [allAvailableLeads, selectedLeadIds]);

  // Lead ativo na prévia do WhatsApp
  const [previewLeadId, setPreviewLeadId] = useState<string | null>(null);

  // Modo de amplitude: 'wide' (tabela ampla tela cheia, máxima amplitude) ou 'split' (com simulador WhatsApp)
  const [recipientsViewMode, setRecipientsViewMode] = useState<'wide' | 'split'>('wide');
  const sampleLead = useMemo(() => {
    return (
      allAvailableLeads.find((l) => l.id === previewLeadId) ||
      leadsToDispatch[0] ||
      allAvailableLeads[0] || {
        id: 'sample_lead',
        name: 'RV Esquadrias Metálicas',
        phone: '(51) 99876-5432',
        address: 'Rua Bento Gonçalves, 1420 - Centro, São Leopoldo - RS',
        rating: 4.9,
        category: 'Fábrica de Esquadrias',
      }
    );
  }, [allAvailableLeads, previewLeadId, leadsToDispatch]);

  const handleAddCustomContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLeadForm.phone.trim()) return;

    const newLead: ProspectItem = {
      id: `custom_${Date.now()}`,
      name: customLeadForm.name.trim() || 'Contato Adicionado',
      phone: customLeadForm.phone.trim(),
      address: customLeadForm.city.trim() || 'Adicionado Manualmente',
      rating: 5.0,
      reviewsCount: 1,
      category: customLeadForm.category.trim() || 'Contato Direto',
    };

    setCustomAddedLeads((prev) => [newLead, ...prev]);
    setSelectedLeadIds((prev) => new Set(prev).add(newLead.id));
    setPreviewLeadId(newLead.id);
    setCustomLeadForm({ name: '', phone: '', city: '', category: '' });
    setIsAddingCustomContact(false);
  };

  // Helper para substituir tags nas mensagens
  const renderPersonalizedText = (template: string, lead: any) => {
    if (!template) return '';
    const cityName =
      lead.address?.split('-')?.[1]?.trim()?.split(',')?.[0]?.trim() ||
      lead.city ||
      'sua região';
    return template
      .replace(/{{empresa}}/g, lead.name || 'sua empresa')
      .replace(/{{categoria}}/g, lead.category || 'seu segmento')
      .replace(/{{cidade}}/g, cityName)
      .replace(/{{avaliacao}}/g, lead.rating ? lead.rating.toString() : '5.0');
  };

  // ==========================================
  // 1. ESTADO DA BIBLIOTECA DE ÁUDIOS
  // ==========================================
  const [audioTracks, setAudioTracks] = useState<AudioTrackItem[]>([]);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [newAudioTitle, setNewAudioTitle] = useState('');
  const [recordingTargetStepIndex, setRecordingTargetStepIndex] = useState<number | null>(null);
  const [recordedAudioPayload, setRecordedAudioPayload] = useState<{
    url: string;
    duration: number;
    targetStepIndex: number | null;
  } | null>(null);

  const [uploadTargetStepIndex, setUploadTargetStepIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const secondsRecordedRef = useRef<number>(0);

  // Carregar áudios salvos no localStorage (higienizando áudios de exemplo e URLs temporárias blob)
  useEffect(() => {
    try {
      const storageKey = `flowlevel_audio_library_${currentSubaccount.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filtrar somente áudios reais salvos em Base64 ou URL permanente
          const validTracks = parsed.filter(
            (track: any) =>
              track &&
              track.id &&
              !track.id.startsWith('audio_default_') &&
              track.url &&
              !track.url.startsWith('blob:') &&
              (track.url.startsWith('data:audio') || track.url.startsWith('http'))
          );
          setAudioTracks(validTracks);
          localStorage.setItem(storageKey, JSON.stringify(validTracks));
          return;
        }
      }
      setAudioTracks([]);
    } catch (e) {
      console.warn('Erro ao carregar áudios do storage:', e);
      setAudioTracks([]);
    }
  }, [currentSubaccount.id]);

  // Salvar custom audios no localStorage
  const saveCustomAudios = (customList: AudioTrackItem[]) => {
    try {
      const storageKey = `flowlevel_audio_library_${currentSubaccount.id}`;
      localStorage.setItem(storageKey, JSON.stringify(customList));
    } catch (e) {
      console.warn('Erro ao salvar áudios no storage:', e);
    }
  };

  // Iniciar Gravação com Microfone (pode ser disparada do Estúdio ou direto do Passo da Sequência)
  const startRecording = async (targetStepIndex: number | null = null) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      let options: MediaRecorderOptions | undefined = undefined;
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          options = { mimeType: 'audio/ogg' };
        }
      }

      const mediaRecorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Url = reader.result as string;
          const durationSec = Math.max(secondsRecordedRef.current, 1);
          setRecordedAudioPayload({
            url: base64Url,
            duration: durationSec,
            targetStepIndex,
          });
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTargetStepIndex(targetStepIndex);
      setRecordingSeconds(0);
      secondsRecordedRef.current = 0;
      setNewAudioTitle(`Áudio ${audioTracks.length + 1} - Gravação`);

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        secondsRecordedRef.current += 1;
        setRecordingSeconds(secondsRecordedRef.current);
      }, 1000);
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      alert('Não foi possível acessar seu microfone. Verifique as permissões de áudio no seu navegador.');
    }
  };

  // Parar Gravação
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  // Salvar Áudio Gravado na Galeria e opcionalmente vincular ao Passo ativo
  const handleSaveRecordedAudio = () => {
    if (!recordedAudioPayload) return;

    const newTrack: AudioTrackItem = {
      id: `audio_custom_${Date.now()}`,
      name: newAudioTitle.trim() || `Áudio ${audioTracks.length + 1}`,
      duration: Math.max(recordedAudioPayload.duration, 1),
      url: recordedAudioPayload.url,
      createdAt: 'Gravado por você',
      isCustom: true,
    };

    const updated = [...audioTracks, newTrack];
    setAudioTracks(updated);
    saveCustomAudios(updated);

    // Se o áudio foi gravado diretamente para um passo da sequência, vincula de imediato
    if (
      recordedAudioPayload.targetStepIndex !== null &&
      recordedAudioPayload.targetStepIndex >= 0 &&
      recordedAudioPayload.targetStepIndex < steps.length
    ) {
      const targetIdx = recordedAudioPayload.targetStepIndex;
      setSteps((prev) =>
        prev.map((s, idx) => (idx === targetIdx ? { ...s, audioId: newTrack.id } : s))
      );
    }

    setRecordedAudioPayload(null);
    setRecordingTargetStepIndex(null);
    setRecordingSeconds(0);
    secondsRecordedRef.current = 0;
  };

  // Descartar gravação em andamento
  const handleDiscardRecordedAudio = () => {
    setRecordedAudioPayload(null);
    setRecordingTargetStepIndex(null);
    setRecordingSeconds(0);
    secondsRecordedRef.current = 0;
  };

  // Acionar Upload de Arquivo de Áudio
  const handleTriggerUpload = (targetStepIndex: number | null = null) => {
    setUploadTargetStepIndex(targetStepIndex);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Processar Upload do Arquivo de Áudio
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64Url = reader.result as string;
      const cleanFileName = file.name.replace(/\.[^/.]+$/, '');

      // Tentar calcular duração real via elemento temporário Audio
      const tempAudio = new Audio(base64Url);
      tempAudio.onloadedmetadata = () => {
        const durationSec = Math.round(tempAudio.duration) || 5;
        const newTrack: AudioTrackItem = {
          id: `audio_custom_${Date.now()}`,
          name: cleanFileName || `Áudio ${audioTracks.length + 1}`,
          duration: durationSec,
          url: base64Url,
          createdAt: 'Arquivo importado',
          isCustom: true,
        };

        const updated = [...audioTracks, newTrack];
        setAudioTracks(updated);
        saveCustomAudios(updated);

        if (
          uploadTargetStepIndex !== null &&
          uploadTargetStepIndex >= 0 &&
          uploadTargetStepIndex < steps.length
        ) {
          const targetIdx = uploadTargetStepIndex;
          setSteps((prev) =>
            prev.map((s, idx) => (idx === targetIdx ? { ...s, audioId: newTrack.id } : s))
          );
        }
      };

      tempAudio.onerror = () => {
        const newTrack: AudioTrackItem = {
          id: `audio_custom_${Date.now()}`,
          name: cleanFileName || `Áudio ${audioTracks.length + 1}`,
          duration: 10,
          url: base64Url,
          createdAt: 'Arquivo importado',
          isCustom: true,
        };
        const updated = [...audioTracks, newTrack];
        setAudioTracks(updated);
        saveCustomAudios(updated);

        if (
          uploadTargetStepIndex !== null &&
          uploadTargetStepIndex >= 0 &&
          uploadTargetStepIndex < steps.length
        ) {
          const targetIdx = uploadTargetStepIndex;
          setSteps((prev) =>
            prev.map((s, idx) => (idx === targetIdx ? { ...s, audioId: newTrack.id } : s))
          );
        }
      };
    };
  };

  // Excluir Áudio
  const handleDeleteAudio = (id: string) => {
    if (activePlayingId === id) {
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      setActivePlayingId(null);
    }
    const updated = audioTracks.filter((t) => t.id !== id);
    setAudioTracks(updated);
    saveCustomAudios(updated);
    // Remove vínculo de qualquer passo que estava usando este áudio
    setSteps((prev) =>
      prev.map((s) => (s.audioId === id ? { ...s, audioId: undefined } : s))
    );
  };

  // Reproduzir / Pausar Áudio
  const togglePlayAudio = (track: AudioTrackItem | { id: string; url: string; name?: string }) => {
    if (!track?.url) return;
    if (activePlayingId === track.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setActivePlayingId(null);
    } else {
      setActivePlayingId(track.id);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = track.url;
        audioPlayerRef.current.play().catch((err) => {
          console.warn('Erro ao reproduzir áudio:', err);
          setActivePlayingId(null);
        });
      }
    }
  };

  // ==========================================
  // 2. ESTADO DA SEQUÊNCIA DE DISPARO (PASSOS E MODELOS)
  // ==========================================
  const [sequenceTemplates, setSequenceTemplates] = useState<SequenceTemplate[]>(PRESET_SEQUENCES);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESET_SEQUENCES[0].id);
  const [steps, setSteps] = useState<SequenceStepItem[]>(PRESET_SEQUENCES[0].steps);
  const [leadDelaySeconds, setLeadDelaySeconds] = useState<number>(8);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);

  const [templateSaveFeedback, setTemplateSaveFeedback] = useState<string | null>(null);
  const feedbackTimerRef = useRef<any>(null);

  const showSaveFeedback = (msg: string) => {
    setTemplateSaveFeedback(msg);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setTemplateSaveFeedback(null);
    }, 4000);
  };

  // Carregar Modelos de Sequência (Pré-configurados e Personalizados) do localStorage
  useEffect(() => {
    try {
      const storageKey = `flowlevel_sequences_${currentSubaccount?.id || 'default'}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Garante que novos presets da plataforma sejam mesclados caso não estejam no storage
          const existingIds = new Set(parsed.map((p: any) => p.id));
          const missingPresets = PRESET_SEQUENCES.filter((p) => !existingIds.has(p.id));
          const merged: SequenceTemplate[] = [...parsed, ...missingPresets];
          setSequenceTemplates(merged);

          const current = merged.find((p) => p.id === selectedPresetId) || merged[0];
          setSelectedPresetId(current.id);
          setSteps(JSON.parse(JSON.stringify(current.steps)));
          return;
        }
      }
      setSequenceTemplates(PRESET_SEQUENCES);
      setSelectedPresetId(PRESET_SEQUENCES[0].id);
      setSteps(JSON.parse(JSON.stringify(PRESET_SEQUENCES[0].steps)));
    } catch (e) {
      console.warn('Erro ao carregar modelos de sequência do localStorage:', e);
      setSequenceTemplates(PRESET_SEQUENCES);
    }
  }, [currentSubaccount?.id]);

  // Salvar lista de modelos no storage
  const saveTemplatesToStorage = (updatedTemplates: SequenceTemplate[]) => {
    setSequenceTemplates(updatedTemplates);
    try {
      const storageKey = `flowlevel_sequences_${currentSubaccount?.id || 'default'}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedTemplates));
    } catch (e) {
      console.warn('Erro ao salvar modelos de sequência:', e);
    }
  };

  // Modelo ativo atual
  const activeTemplate = useMemo(() => {
    return sequenceTemplates.find((t) => t.id === selectedPresetId) || sequenceTemplates[0];
  }, [sequenceTemplates, selectedPresetId]);

  // Verifica se o usuário modificou os passos na tela em relação ao modelo salvo
  const hasUnsavedChanges = useMemo(() => {
    if (!activeTemplate) return false;
    return JSON.stringify(activeTemplate.steps) !== JSON.stringify(steps);
  }, [activeTemplate, steps]);

  // Modal / Dialog para Criar, Renomear ou Salvar como Novo Modelo
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateModalMode, setTemplateModalMode] = useState<'create' | 'edit_meta' | 'save_as_new'>('create');
  const [templateForm, setTemplateForm] = useState({
    id: '',
    name: '',
    description: '',
  });

  // Alternar entre modelos salvos (intercalando)
  const handleApplyPreset = (presetId: string) => {
    if (presetId === selectedPresetId) return;

    // Se havia alterações não salvas no modelo anterior, salva automaticamente para preservar edições ao intercalar
    let currentList = sequenceTemplates;
    const currentActive = sequenceTemplates.find((t) => t.id === selectedPresetId);
    if (currentActive && JSON.stringify(currentActive.steps) !== JSON.stringify(steps)) {
      currentList = sequenceTemplates.map((t) =>
        t.id === selectedPresetId
          ? { ...t, steps: JSON.parse(JSON.stringify(steps)), updatedAt: new Date().toISOString() }
          : t
      );
      saveTemplatesToStorage(currentList);
      showSaveFeedback(`Alterações salvas no modelo anterior!`);
    }

    setSelectedPresetId(presetId);
    const target = currentList.find((p) => p.id === presetId);
    if (target) {
      setSteps(JSON.parse(JSON.stringify(target.steps)));
    }
  };

  // Salvar alterações de passos no modelo ativo
  const handleSaveCurrentTemplate = () => {
    const currentActive = sequenceTemplates.find((t) => t.id === selectedPresetId);
    if (!currentActive) return;

    const updated = sequenceTemplates.map((t) =>
      t.id === selectedPresetId
        ? {
            ...t,
            steps: JSON.parse(JSON.stringify(steps)),
            updatedAt: new Date().toISOString(),
          }
        : t
    );
    saveTemplatesToStorage(updated);
    showSaveFeedback(`Modelo "${currentActive.name.replace(/^🔥 |^⭐ |^⚡ |^🌐 /i, '').split(':')[0]}" salvo com sucesso!`);
  };

  // Reverter alterações na tela para o que está salvo no modelo ativo
  const handleDiscardChanges = () => {
    if (activeTemplate) {
      setSteps(JSON.parse(JSON.stringify(activeTemplate.steps)));
      showSaveFeedback(`Alterações descartadas. Retornado aos passos salvos.`);
    }
  };

  // Abrir modal para Criar Novo Modelo do zero
  const handleOpenCreateNew = () => {
    setTemplateModalMode('create');
    setTemplateForm({
      id: '',
      name: `Nova Sequência ${sequenceTemplates.length + 1}`,
      description: 'Sequência personalizada para prospecção no WhatsApp.',
    });
    setIsTemplateModalOpen(true);
  };

  // Abrir modal para Salvar passos atuais como Novo Modelo
  const handleOpenSaveAsNew = () => {
    setTemplateModalMode('save_as_new');
    setTemplateForm({
      id: '',
      name: `${activeTemplate?.name ? activeTemplate.name.replace(/^🔥 |^⭐ |^⚡ |^🌐 /i, '') : 'Sequência'} (Personalizada)`,
      description: activeTemplate?.description || 'Sequência personalizada com passos customizados.',
    });
    setIsTemplateModalOpen(true);
  };

  // Abrir modal para Renomear ou Editar Descrição
  const handleOpenEditMeta = (template: SequenceTemplate) => {
    setTemplateModalMode('edit_meta');
    setTemplateForm({
      id: template.id,
      name: template.name,
      description: template.description || '',
    });
    setIsTemplateModalOpen(true);
  };

  // Duplicar modelo
  const handleDuplicateTemplate = (template: SequenceTemplate) => {
    const newId = `seq_custom_${Date.now()}`;
    const duplicated: SequenceTemplate = {
      ...template,
      id: newId,
      name: `${template.name} (Cópia)`,
      isCustom: true,
      updatedAt: new Date().toISOString(),
      steps: JSON.parse(JSON.stringify(template.steps)),
    };
    const updated = [...sequenceTemplates, duplicated];
    saveTemplatesToStorage(updated);
    setSelectedPresetId(newId);
    setSteps(JSON.parse(JSON.stringify(duplicated.steps)));
    showSaveFeedback(`Modelo duplicado com sucesso!`);
  };

  // Excluir modelo
  const handleDeleteTemplate = (templateId: string, templateName: string) => {
    if (sequenceTemplates.length <= 1) {
      alert('É necessário manter pelo menos um modelo de sequência cadastrado.');
      return;
    }
    const confirmDelete = window.confirm(`Deseja realmente excluir o modelo "${templateName}"?`);
    if (!confirmDelete) return;

    const filtered = sequenceTemplates.filter((t) => t.id !== templateId);
    saveTemplatesToStorage(filtered);

    if (selectedPresetId === templateId) {
      const fallback = filtered[0];
      setSelectedPresetId(fallback.id);
      setSteps(JSON.parse(JSON.stringify(fallback.steps)));
    }
    showSaveFeedback(`Modelo excluído.`);
  };

  // Restaurar modelos padrão
  const handleResetToDefaults = () => {
    const confirmReset = window.confirm(
      'Deseja restaurar os 4 modelos padrão originais da plataforma? Seus modelos personalizados serão mantidos.'
    );
    if (!confirmReset) return;

    const userCustoms = sequenceTemplates.filter(
      (t) => t.isCustom && !PRESET_SEQUENCES.some((p) => p.id === t.id)
    );
    const restored = [...PRESET_SEQUENCES, ...userCustoms];
    saveTemplatesToStorage(restored);
    setSelectedPresetId(PRESET_SEQUENCES[0].id);
    setSteps(JSON.parse(JSON.stringify(PRESET_SEQUENCES[0].steps)));
    showSaveFeedback('Modelos restaurados com sucesso!');
  };

  // Confirmar criação, renomeação ou cópia
  const handleConfirmTemplateModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.name.trim()) return;

    if (templateModalMode === 'edit_meta') {
      const updated = sequenceTemplates.map((t) =>
        t.id === templateForm.id
          ? {
              ...t,
              name: templateForm.name.trim(),
              description: templateForm.description.trim(),
              updatedAt: new Date().toISOString(),
            }
          : t
      );
      saveTemplatesToStorage(updated);
      showSaveFeedback(`Informações do modelo atualizadas!`);
    } else {
      const newId = `seq_custom_${Date.now()}`;
      const newSteps: SequenceStepItem[] =
        templateModalMode === 'save_as_new'
          ? JSON.parse(JSON.stringify(steps))
          : [
              {
                id: `step_${Date.now()}_1`,
                type: 'text',
                title: 'Passo 1: Mensagem Inicial',
                textContent: 'Olá time da {{empresa}}, tudo bem? Sou o Rafael da Connect Digital aqui em {{cidade}}.',
                requireResponse: true,
              },
              {
                id: `step_${Date.now()}_2`,
                type: 'audio',
                title: 'Passo 2: Áudio de Apresentação (PTT)',
                audioId: undefined,
                requireResponse: true,
              },
            ];

      const newTemplate: SequenceTemplate = {
        id: newId,
        name: templateForm.name.trim(),
        description: templateForm.description.trim() || 'Modelo personalizado de prospecção.',
        steps: newSteps,
        isCustom: true,
        updatedAt: new Date().toISOString(),
      };

      const updated = [...sequenceTemplates, newTemplate];
      saveTemplatesToStorage(updated);
      setSelectedPresetId(newId);
      setSteps(newSteps);
      showSaveFeedback(`Novo modelo "${templateForm.name.trim()}" criado com sucesso!`);
    }

    setIsTemplateModalOpen(false);
  };

  // Adicionar Passo de Texto
  const handleAddTextStep = () => {
    const newStep: SequenceStepItem = {
      id: `step_${Date.now()}`,
      type: 'text',
      title: `Passo ${steps.length + 1}: Mensagem de Texto`,
      textContent: 'Olá {{empresa}}, gostaria de confirmar uma informação com o proprietário.',
      requireResponse: true,
    };
    setSteps([...steps, newStep]);
  };

  // Adicionar Passo de Áudio (inicia zerado para que o usuário grave ou escolha)
  const handleAddAudioStep = (audioId?: string) => {
    const selectedAudio = audioId ? audioTracks.find((a) => a.id === audioId) : undefined;
    const newStep: SequenceStepItem = {
      id: `step_${Date.now()}`,
      type: 'audio',
      title: `Passo ${steps.length + 1}: Áudio Gravado PTT`,
      audioId: selectedAudio?.id,
      requireResponse: true,
    };
    setSteps([...steps, newStep]);
  };

  // Adicionar Intervalo / Pausa entre passos
  const handleAddDelayStep = () => {
    const newStep: SequenceStepItem = {
      id: `step_${Date.now()}`,
      type: 'delay',
      title: `Passo ${steps.length + 1}: Pausa / Intervalo`,
      delaySeconds: 3,
    };
    setSteps([...steps, newStep]);
  };

  // Mover Passo para Cima
  const handleMoveStepUp = (index: number) => {
    if (index === 0) return;
    const next = [...steps];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setSteps(next);
  };

  // Mover Passo para Baixo
  const handleMoveStepDown = (index: number) => {
    if (index === steps.length - 1) return;
    const next = [...steps];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setSteps(next);
  };

  // Remover Passo
  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  // Inserir Tag Dinâmica no Texto do Passo
  const insertTagIntoStep = (stepIndex: number, tag: string) => {
    setSteps((prev) =>
      prev.map((s, idx) => {
        if (idx === stepIndex && s.type === 'text') {
          return {
            ...s,
            textContent: (s.textContent || '') + ` ${tag}`,
          };
        }
        return s;
      })
    );
  };

  // ==========================================
  // 3. ESTADO DO CÉREBRO IA & REGRAS CONDICIONAIS
  // ==========================================
  const [decisorReplyText, setDecisorReplyText] = useState(
    'Excelente! Muito prazer. Preparei uma análise rápida de posicionamento e captação para a {{empresa}} aqui em {{cidade}}. Quando teria 5 minutinhos para eu te apresentar?'
  );

  const [intermediaryReplyText, setIntermediaryReplyText] = useState(
    'Compreendo perfeitamente! Você poderia por gentileza me fornecer o contato direto ou WhatsApp do proprietário ou gerente? Prometo ser breve e objetivo com ele!'
  );

  const [objectionReplyText, setObjectionReplyText] = useState(
    'Sem problemas! Agradeço a atenção e peço desculpas pelo incômodo. Desejo muito sucesso e ótimos negócios para a {{empresa}}!'
  );

  // Testador / Simulador Interativo do Cérebro IA
  const [simulationInput, setSimulationInput] = useState('');
  const [simulationResult, setSimulationResult] = useState<{
    intent: 'decisor' | 'intermediary' | 'objection';
    label: string;
    action: string;
    crmImpact: string;
    botResponse: string;
  } | null>(null);

  const runSimulationTest = (customText?: string) => {
    const textToTest = customText || simulationInput;
    if (!textToTest.trim()) return;

    const lower = textToTest.toLowerCase();
    let detectedIntent: 'decisor' | 'intermediary' | 'objection' = 'decisor';

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
      detectedIntent = 'intermediary';
    } else if (
      lower.includes('não tenho interesse') ||
      lower.includes('nao tenho interesse') ||
      lower.includes('sem interesse') ||
      lower.includes('retire meu') ||
      lower.includes('pare de mandar') ||
      lower.includes('não quero')
    ) {
      detectedIntent = 'objection';
    } else {
      detectedIntent = 'decisor';
    }

    if (detectedIntent === 'decisor') {
      setSimulationResult({
        intent: 'decisor',
        label: '🎯 Decisor / Proprietário Confirmado',
        action: 'Lead qualificado imediatamente. Robô pausa e aciona Atendimento Humano.',
        crmImpact: '✅ Inserido no Funil CRM (1ª Coluna: Oportunidade Qualificada)',
        botResponse: renderPersonalizedText(decisorReplyText, sampleLead),
      });
    } else if (detectedIntent === 'intermediary') {
      setSimulationResult({
        intent: 'intermediary',
        label: '💼 Intermediário / Secretária / Funcionário',
        action: 'Robô solicita educadamente o contato direto do dono da empresa.',
        crmImpact: 'ℹ️ Etiquetado como #IntermediarioSecretaria (não polui o CRM)',
        botResponse: renderPersonalizedText(intermediaryReplyText, sampleLead),
      });
    } else {
      setSimulationResult({
        intent: 'objection',
        label: '🛑 Objeção / Desinteresse',
        action: 'Encerramento cordial e respeito ao contato.',
        crmImpact: '⛔ Etiquetado como #SemInteresse (Opt-out respeitado)',
        botResponse: renderPersonalizedText(objectionReplyText, sampleLead),
      });
    }
  };

  // ==========================================
  // 4. DISPARO EM MASSA & EXECUÇÃO DO FLUXO
  // ==========================================
  const [currentLeadIndex, setCurrentLeadIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [dispatchLogs, setDispatchLogs] = useState<
    {
      leadName: string;
      phone: string;
      status: 'pending' | 'sending' | 'success' | 'error';
      message: string;
      time: string;
    }[]
  >([]);
  const [lastDispatchedContactId, setLastDispatchedContactId] = useState<string | null>(null);

  // Estados de Controle de Disparo em Andamento (Pausa / Play / Cancelamento)
  const [isDispatchPaused, setIsDispatchPaused] = useState(false);
  const isDispatchPausedRef = useRef(false);

  const [isDispatchCancelled, setIsDispatchCancelled] = useState(false);
  const isDispatchCancelledRef = useRef(false);

  const handlePauseDispatch = () => {
    setIsDispatchPaused(true);
    isDispatchPausedRef.current = true;
  };

  const handleResumeDispatch = () => {
    setIsDispatchPaused(false);
    isDispatchPausedRef.current = false;
  };

  const handleCancelDispatch = () => {
    const confirmCancel = window.confirm(
      'Deseja realmente interromper o disparo em massa? Os envios restantes não serão executados.'
    );
    if (!confirmCancel) return;
    setIsDispatchCancelled(true);
    isDispatchCancelledRef.current = true;
    setIsDispatchPaused(false);
    isDispatchPausedRef.current = false;
  };

  // Helper para espera com verificação em tempo real de Pausa e Cancelamento
  const waitWithPauseCheck = async (totalSeconds: number): Promise<boolean> => {
    const stepMs = 200;
    let elapsedMs = 0;
    const targetMs = Math.max(totalSeconds, 0.5) * 1000;

    while (elapsedMs < targetMs) {
      if (isDispatchCancelledRef.current) return false;
      while (isDispatchPausedRef.current && !isDispatchCancelledRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      if (isDispatchCancelledRef.current) return false;
      await new Promise((resolve) => setTimeout(resolve, stepMs));
      elapsedMs += stepMs;
    }
    return !isDispatchCancelledRef.current;
  };

  // Helper para formatar mensagens de erro sem gerar [object Object]
  const formatErrorMessage = (err: any, phone?: string): string => {
    if (phone) {
      const cleanDigits = phone.replace(/[^0-9]/g, '');
      const localNumber = cleanDigits.length >= 10 ? cleanDigits.slice(-8) : cleanDigits;
      if (localNumber.length === 8 && /^[2-5]/.test(localNumber)) {
        return 'Número fixo (não possui WhatsApp)';
      }
    }

    if (!err) return 'Falha no envio via WhatsApp';
    if (typeof err === 'string') {
      if (err.includes('[object Object]')) return 'Falha na conexão com WhatsApp (Evolution API)';
      return err;
    }
    if (typeof err === 'object') {
      if (typeof err.message === 'string') return err.message;
      if (Array.isArray(err.message) && typeof err.message[0] === 'string') return err.message[0];
      if (typeof err.error === 'string') return err.error;
      if (typeof err.response?.message === 'string') return err.response.message;
      if (Array.isArray(err.response?.message)) return String(err.response.message[0]);
      try {
        const json = JSON.stringify(err);
        if (json && json !== '{}') return json.slice(0, 100);
      } catch {}
    }
    return String(err);
  };

  const handleStartMassDispatch = async () => {
    if (leadsToDispatch.length === 0 || steps.length === 0) return;

    setIsDispatchPaused(false);
    isDispatchPausedRef.current = false;
    setIsDispatchCancelled(false);
    isDispatchCancelledRef.current = false;

    setModalStage('sending');
    setCurrentLeadIndex(0);
    setCurrentStepIndex(0);

    // Inicializar logs apenas dos leads selecionados
    const initialLogs = leadsToDispatch.map((l) => ({
      leadName: l.name,
      phone: l.phone,
      status: 'pending' as const,
      message: 'Na fila de disparo',
      time: '--:--',
    }));
    setDispatchLogs(initialLogs);

    const targetStep = steps[targetStepIndexToDispatch] || steps[0];
    const targetStepNum = targetStepIndexToDispatch + 1;

    // Executar para cada lead selecionado
    for (let lIdx = 0; lIdx < leadsToDispatch.length; lIdx++) {
      // Verificar se o usuário interrompeu o disparo
      if (isDispatchCancelledRef.current) {
        break;
      }

      // Aguardar caso o usuário tenha pausado o disparo
      while (isDispatchPausedRef.current && !isDispatchCancelledRef.current) {
        await new Promise((res) => setTimeout(res, 250));
      }

      if (isDispatchCancelledRef.current) {
        break;
      }

      setCurrentLeadIndex(lIdx);
      const lead = leadsToDispatch[lIdx];

      setDispatchLogs((prev) =>
        prev.map((log, idx) =>
          idx === lIdx
            ? {
                ...log,
                status: 'sending',
                message:
                  dispatchMode === 'single_step'
                    ? `Enviando ${targetStep.title || `Passo ${targetStepNum}`}...`
                    : 'Iniciando sequência personalizada...',
              }
            : log
        )
      );

      let leadContactId: string | undefined = undefined;
      let hasLeadError = false;
      let lastErrorMessage = '';

      if (dispatchMode === 'single_step') {
        // ==========================================
        // MODO 1: DISPARO INDIVIDUAL DE PASSO ESPECÍFICO
        // ==========================================
        setCurrentStepIndex(targetStepIndexToDispatch);

        let mediaUrl: string | undefined = undefined;
        let mediaType: 'audio' | undefined = undefined;
        let textToSend = '';

        if (targetStep.type === 'text') {
          textToSend = renderPersonalizedText(targetStep.textContent || '', lead);
        } else if (targetStep.type === 'audio') {
          const track = audioTracks.find((a) => a.id === targetStep.audioId) || audioTracks[0];
          mediaUrl = track?.url;
          mediaType = 'audio';
          textToSend = '🎙️ Mensagem de voz (Áudio gravado)';
        }

        try {
          const res = await dispatchWhatsAppLead({
            leadName: lead.name,
            leadPhone: lead.phone,
            companyName: lead.name,
            city: lead.address,
            category: lead.category,
            rating: lead.rating,
            text: textToSend,
            mediaUrl,
            mediaType,
            stepNumber: targetStepNum,
            requireResponse: targetStep.requireResponse !== false,
          });

          if (!res.success) {
            hasLeadError = true;
            lastErrorMessage = formatErrorMessage(res.error, lead.phone);
          }

          if (res.contactId) {
            leadContactId = res.contactId;
            setLastDispatchedContactId(res.contactId);
          }
        } catch (e: any) {
          console.error('Erro ao enviar passo individual:', e);
          hasLeadError = true;
          lastErrorMessage = formatErrorMessage(e?.message || e, lead.phone);
        }
      } else {
        // ==========================================
        // MODO 2: DISPARO SEQUENCIAL CONTÍNUO
        // ==========================================
        for (let sIdx = 0; sIdx < steps.length; sIdx++) {
          if (isDispatchCancelledRef.current) break;
          while (isDispatchPausedRef.current && !isDispatchCancelledRef.current) {
            await new Promise((res) => setTimeout(res, 250));
          }
          if (isDispatchCancelledRef.current) break;

          setCurrentStepIndex(sIdx);
          const step = steps[sIdx];

          if (step.type === 'delay') {
            const ok = await waitWithPauseCheck(step.delaySeconds || 2);
            if (!ok) break;
            continue;
          }

          let mediaUrl: string | undefined = undefined;
          let mediaType: 'audio' | undefined = undefined;
          let textToSend = '';

          if (step.type === 'text') {
            textToSend = renderPersonalizedText(step.textContent || '', lead);
          } else if (step.type === 'audio') {
            const track = audioTracks.find((a) => a.id === step.audioId) || audioTracks[0];
            mediaUrl = track?.url;
            mediaType = 'audio';
            textToSend = '🎙️ Mensagem de voz (Áudio gravado)';
          }

          try {
            const res = await dispatchWhatsAppLead({
              leadName: lead.name,
              leadPhone: lead.phone,
              companyName: lead.name,
              city: lead.address,
              category: lead.category,
              rating: lead.rating,
              text: textToSend,
              mediaUrl,
              mediaType,
              stepNumber: sIdx + 1,
              requireResponse: step.requireResponse !== false,
            });

            if (!res.success) {
              hasLeadError = true;
              lastErrorMessage = formatErrorMessage(res.error, lead.phone);
            }

            if (res.contactId) {
              leadContactId = res.contactId;
              setLastDispatchedContactId(res.contactId);
            }
          } catch (e: any) {
            console.error('Erro ao enviar passo da sequência:', e);
            hasLeadError = true;
            lastErrorMessage = formatErrorMessage(e?.message || e, lead.phone);
          }

          // Se o passo requer resposta do cliente, pausa a sequência para aguardar retorno
          if (step.requireResponse !== false && sIdx < steps.length - 1) {
            break;
          }

          // Breve intervalo entre passos para humanização do envio com checagem de pausa
          if (sIdx < steps.length - 1) {
            const ok = await waitWithPauseCheck(1.8);
            if (!ok) break;
          }
        }
      }

      // Marcar lead com sucesso ou erro
      setDispatchLogs((prev) =>
        prev.map((log, idx) =>
          idx === lIdx
            ? {
                ...log,
                status: hasLeadError ? 'error' : 'success',
                message: hasLeadError
                  ? `Falha: ${lastErrorMessage}`
                  : dispatchMode === 'single_step'
                  ? `${targetStep.title || `Passo ${targetStepNum}`} enviado com sucesso`
                  : `Passo inicial enviado (Aguardando resposta do lead)`,
                time: new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }),
              }
            : log
        )
      );

      // Notificar e forçar atualização reativa imediata dos filtros da cadência
      setCadenceUpdateCounter((prev) => prev + 1);

      // Intervalo de segurança anti-bloqueio entre cada lead com checagem de pausa e cancelamento
      if (lIdx < leadsToDispatch.length - 1) {
        const ok = await waitWithPauseCheck(leadDelaySeconds);
        if (!ok) break;
      }
    }

    // Se o usuário cancelou o envio, marcar os itens pendentes
    if (isDispatchCancelledRef.current) {
      setDispatchLogs((prev) =>
        prev.map((log) =>
          log.status === 'pending'
            ? { ...log, status: 'error', message: 'Interrompido pelo usuário' }
            : log
        )
      );
    }

    setModalStage('finished');
  };

  // Simular Resposta ao Vivo (Dono vs Secretária vs Objeção)
  const [isSimulatingLiveReply, setIsSimulatingLiveReply] = useState(false);
  const [liveSimulationSuccessMsg, setLiveSimulationSuccessMsg] = useState<string | null>(null);

  const handleSimulateInboundReply = async (intent: 'decisor' | 'intermediary' | 'objection') => {
    setIsSimulatingLiveReply(true);
    const targetContactId = lastDispatchedContactId || 'contact_outreach_sample';

    let simulatedText = '';
    let autoReply = '';

    if (intent === 'decisor') {
      simulatedText = 'Olá Rafael! Sou o proprietário sim. Do que se trata a proposta de vocês?';
      autoReply = renderPersonalizedText(decisorReplyText, sampleLead);
    } else if (intent === 'intermediary') {
      simulatedText = 'Boa tarde! Aqui é a recepcionista. O responsável não está no momento.';
      autoReply = renderPersonalizedText(intermediaryReplyText, sampleLead);
    } else {
      simulatedText = 'Boa tarde! No momento não temos interesse, obrigado.';
      autoReply = renderPersonalizedText(objectionReplyText, sampleLead);
    }

    await handleInboundLeadResponse({
      contactId: targetContactId,
      responseText: simulatedText,
      prospectData: {
        company: sampleLead.name,
        city: sampleLead.address,
        category: sampleLead.category,
        phone: sampleLead.phone,
      },
      intent,
      botReplyText: autoReply,
    });

    setIsSimulatingLiveReply(false);
    setLiveSimulationSuccessMsg(
      intent === 'decisor'
        ? '🎯 Lead Qualificado inserido na 1ª coluna do Funil CRM!'
        : intent === 'intermediary'
        ? '💼 Secretária identificada e solicitação de contato enviada!'
        : '🛑 Objeção registrada e opt-out respeitado.'
    );
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className={`bg-slate-900 border border-slate-800 w-full ${
        isEmbedded
          ? 'h-full flex-1 rounded-xl shadow-lg'
          : 'max-w-6xl rounded-2xl shadow-2xl max-h-[94vh]'
      } overflow-hidden flex flex-col`}
    >
      {/* Header Principal */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 font-bold">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white">
                Disparo em Massa WhatsApp & Filtro de Decisor
              </h3>
              {/* Badge Clicável com Acesso Rápido à Seleção */}
              <button
                type="button"
                onClick={() => setActiveTab('recipients')}
                title="Clique para gerenciar e selecionar os contatos que receberão as mensagens"
                className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-400 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Users className="w-3 h-3" />
                <span>
                  {contactSourceFilter === 'maps'
                    ? `${leadsToDispatch.length} de ${mapsLeads.length} Leads (Google Maps)`
                    : contactSourceFilter === 'whatsapp'
                    ? `${leadsToDispatch.length} de ${whatsappLeads.length} Contatos (WhatsApp)`
                    : contactSourceFilter === 'crm'
                    ? `${leadsToDispatch.length} de ${crmLeads.length} Leads (CRM)`
                    : `${leadsToDispatch.length} de ${allAvailableLeads.length} Leads Selecionados`}
                </span>
                <span className="text-emerald-300 underline font-normal text-[9px]">Editar</span>
              </button>
            </div>
          </div>
        </div>

        {onClose && !isEmbedded && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Barra de Abas (Builder Mode) */}
      {modalStage === 'builder' && (
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('recipients')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition shrink-0 ${
                activeTab === 'recipients'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>
                1. Destinatários ({leadsToDispatch.length}/{contactSourceFilter === 'maps' ? mapsLeads.length : contactSourceFilter === 'whatsapp' ? whatsappLeads.length : contactSourceFilter === 'crm' ? crmLeads.length : allAvailableLeads.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sequence')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition shrink-0 ${
                activeTab === 'sequence'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>2. Sequência de Disparo ({steps.length} passos)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audio_studio')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition shrink-0 ${
                activeTab === 'audio_studio'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>3. Estúdio & Áudios ({audioTracks.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ai_rules')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition shrink-0 ${
                activeTab === 'ai_rules'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>4. Cérebro IA & Respostas</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Proteção Anti-bloqueio Ativa</span>
          </div>
        </div>
      )}

      {/* Corpo do Modal */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Audio Player escondido e input de arquivo de áudio */}
        <audio
          ref={audioPlayerRef}
          onEnded={() => setActivePlayingId(null)}
          onError={() => {
            console.warn('Erro na reprodução do áudio');
            setActivePlayingId(null);
          }}
          className="hidden"
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAudioFileUpload}
          accept="audio/*"
          className="hidden"
        />

        {modalStage === 'builder' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Coluna Esquerda: Conteúdo da Aba Ativa */}
            <div
              className={`${
                activeTab === 'recipients' && recipientsViewMode === 'wide'
                  ? 'lg:col-span-12'
                  : 'lg:col-span-7'
              } space-y-4`}
            >
              {/* ==================================================== */}
              {/* ABA 1: SELEÇÃO E GERENCIAMENTO DE DESTINATÁRIOS */}
              {/* ==================================================== */}
              {activeTab === 'recipients' && (
                <div className="space-y-4">
                  {/* Barra de Filtros por Origem */}
                  <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Origem dos Contatos para Disparo:</span>
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {leadsToDispatch.length} prontos para envio
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setContactSourceFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          contactSourceFilter === 'all'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Todos ({allAvailableLeads.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setContactSourceFilter('maps')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                          contactSourceFilter === 'maps'
                            ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Google Maps ({mapsLeads.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setContactSourceFilter('whatsapp')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                          contactSourceFilter === 'whatsapp'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp Omnichannel ({whatsappLeads.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setContactSourceFilter('crm')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                          contactSourceFilter === 'crm'
                            ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Kanban className="w-3.5 h-3.5" />
                        <span>Funil CRM ({crmLeads.length})</span>
                      </button>
                    </div>

                    {/* Barra de Filtros Inteligentes por Etapa da Cadência (Disparos Individuais) */}
                    <div className="pt-2.5 border-t border-slate-700/60 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Status da Cadência de Disparo:</span>
                        </label>
                        {cadenceFilter !== 'all' && (
                          <button
                            type="button"
                            onClick={() => setCadenceFilter('all')}
                            className="text-[10px] text-amber-400 hover:underline font-semibold"
                          >
                            Mostrar Todos ({allAvailableLeads.length})
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCadenceFilter('all')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                            cadenceFilter === 'all'
                              ? 'bg-slate-700 border-slate-500 text-white shadow-sm'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Todos os Leads ({cadenceCounts.all || 0})
                        </button>

                        <button
                          type="button"
                          onClick={() => setCadenceFilter('waiting_1')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                            cadenceFilter === 'waiting_1'
                              ? 'bg-blue-600/30 border-blue-500 text-blue-200 shadow-sm'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-blue-400" />
                          <span>Aguardando Msg 1 ({cadenceCounts.waiting_1 || 0})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCadenceFilter('waiting_reply_1')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                            cadenceFilter === 'waiting_reply_1'
                              ? 'bg-amber-600/30 border-amber-500 text-amber-200 shadow-sm'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span>Msg 1 Enviada ({cadenceCounts.waiting_reply_1 || 0})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCadenceFilter('ready_for_2')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
                            cadenceFilter === 'ready_for_2'
                              ? 'bg-teal-600/40 border-teal-400 text-teal-200 shadow-md ring-1 ring-teal-400/50'
                              : 'bg-teal-950/30 border-teal-800/60 text-teal-300 hover:bg-teal-900/40'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                          <span>💬 Responderam Msg 1 (Prontos p/ Msg 2) ({cadenceCounts.ready_for_2 || 0})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCadenceFilter('waiting_reply_2')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                            cadenceFilter === 'waiting_reply_2'
                              ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-indigo-400" />
                          <span>Msg 2 Enviada ({cadenceCounts.waiting_reply_2 || 0})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCadenceFilter('ready_for_3')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
                            cadenceFilter === 'ready_for_3'
                              ? 'bg-purple-600/40 border-purple-400 text-purple-200 shadow-md ring-1 ring-purple-400/50'
                              : 'bg-purple-950/30 border-purple-800/60 text-purple-300 hover:bg-purple-900/40'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-purple-400" />
                          <span>🚀 Responderam Msg 2 (Prontos p/ Msg 3) ({cadenceCounts.ready_for_3 || 0})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCadenceFilter('completed')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                            cadenceFilter === 'completed'
                              ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200 shadow-sm'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>Concluídos ({cadenceCounts.completed || 0})</span>
                        </button>
                      </div>
                    </div>

                    {/* Banners de Ação Rápida de Acordo com a Etapa da Cadência */}
                    {cadenceFilter === 'ready_for_2' && (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-teal-950/80 via-emerald-950/50 to-slate-900 border border-teal-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-sm shrink-0">
                            💬
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">
                              {displayedLeads.length} estabelecimento(s) responderam à Mensagem 1
                            </div>
                            <p className="text-[11px] text-teal-200/90">
                              Interagiram com a quebra de gelo e estão prontos para receber o <strong>Passo 2 ({steps[1]?.title || 'Áudio PTT / Apresentação'})</strong>.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const ids = new Set<string>(displayedLeads.map((l) => l.id));
                            setSelectedLeadIds(ids);
                            setDispatchMode('single_step');
                            setTargetStepIndexToDispatch(1);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Selecionar Todos & Disparar Passo 2</span>
                        </button>
                      </div>
                    )}

                    {cadenceFilter === 'ready_for_3' && (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-purple-950/80 via-indigo-950/50 to-slate-900 border border-purple-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-sm shrink-0">
                            🚀
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">
                              {displayedLeads.length} estabelecimento(s) responderam à Mensagem 2
                            </div>
                            <p className="text-[11px] text-purple-200/90">
                              Prontos para o fechamento ou envio do <strong>Passo 3 ({steps[2]?.title || 'Pergunta-Chave do Decisor'})</strong>.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const ids = new Set<string>(displayedLeads.map((l) => l.id));
                            setSelectedLeadIds(ids);
                            setDispatchMode('single_step');
                            setTargetStepIndexToDispatch(2);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Selecionar Todos & Disparar Passo 3</span>
                        </button>
                      </div>
                    )}

                    {cadenceFilter === 'waiting_1' && (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-slate-900 border border-blue-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-sm shrink-0">
                            🎯
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">
                              {displayedLeads.length} novo(s) estabelecimento(s) aguardando abordagem inicial
                            </div>
                            <p className="text-[11px] text-blue-200/90">
                              Nunca foram contatados. Selecione-os para disparar o <strong>Passo 1 ({steps[0]?.title || 'Quebra de Gelo'})</strong>.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const ids = new Set<string>(displayedLeads.map((l) => l.id));
                            setSelectedLeadIds(ids);
                            setDispatchMode('single_step');
                            setTargetStepIndexToDispatch(0);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Selecionar Todos & Disparar Passo 1</span>
                        </button>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={contactSearchTerm}
                          onChange={(e) => setContactSearchTerm(e.target.value)}
                          placeholder="Buscar por nome, telefone, empresa, cidade ou segmento..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-900 text-slate-100 placeholder:text-slate-500 border border-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                        <button
                          type="button"
                          onClick={selectAllDisplayed}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
                          title="Selecionar todos os contatos filtrados"
                        >
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Marcar Todos</span>
                        </button>
                        <button
                          type="button"
                          onClick={deselectAllDisplayed}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
                          title="Desmarcar contatos da lista"
                        >
                          <X className="w-3.5 h-3.5 text-red-400" />
                          <span>Desmarcar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingCustomContact(!isAddingCustomContact)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar Manual</span>
                        </button>

                        {/* Alternador de Amplitude de Visualização */}
                        <div className="flex items-center bg-slate-900 border border-slate-700 p-0.5 rounded-lg ml-1">
                          <button
                            type="button"
                            onClick={() => setRecipientsViewMode('wide')}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                              recipientsViewMode === 'wide'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                            title="Visualização ampla em tela cheia com máxima amplitude e mais contatos"
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>Visão Ampla</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRecipientsViewMode('split')}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                              recipientsViewMode === 'split'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                            title="Dividir tela com o simulador de WhatsApp"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Com Simulador</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Formulário de Contato Manual */}
                    {isAddingCustomContact && (
                      <form
                        onSubmit={handleAddCustomContact}
                        className="p-3 rounded-lg bg-slate-950 border border-emerald-500/40 space-y-2 mt-2 animate-in fade-in"
                      >
                        <div className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                          <span>Adicionar Contato Personalizado para o Disparo</span>
                          <button
                            type="button"
                            onClick={() => setIsAddingCustomContact(false)}
                            className="text-slate-400 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <input
                            type="text"
                            value={customLeadForm.name}
                            onChange={(e) => setCustomLeadForm({ ...customLeadForm, name: e.target.value })}
                            placeholder="Nome da Empresa ou Contato *"
                            required
                            className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                          />
                          <input
                            type="text"
                            value={customLeadForm.phone}
                            onChange={(e) => setCustomLeadForm({ ...customLeadForm, phone: e.target.value })}
                            placeholder="WhatsApp com DDD (Ex: 51998765432) *"
                            required
                            className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                          />
                          <input
                            type="text"
                            value={customLeadForm.city}
                            onChange={(e) => setCustomLeadForm({ ...customLeadForm, city: e.target.value })}
                            placeholder="Cidade / Bairro (Ex: Novo Hamburgo - Centro)"
                            className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                          />
                          <input
                            type="text"
                            value={customLeadForm.category}
                            onChange={(e) => setCustomLeadForm({ ...customLeadForm, category: e.target.value })}
                            placeholder="Categoria / Ramo (Ex: Esquadrias de Alumínio)"
                            className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsAddingCustomContact(false)}
                            className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-3.5 py-1 rounded bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shadow"
                          >
                            Salvar e Marcar p/ Envio
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Lista Interativa de Contatos com Checkboxes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="text-slate-400">
                        Exibindo <strong>{displayedLeads.length}</strong> contatos ({leadsToDispatch.length} selecionados para disparo)
                      </span>
                      <span className="text-[11px] text-emerald-400 font-medium">
                        {recipientsViewMode === 'wide'
                          ? 'Modo Amplo ativado: máxima nitidez e visualização de todos os contatos'
                          : 'Dica: Clique em "Testar Tags" para pré-visualizar no simulador'}
                      </span>
                    </div>

                    {recipientsViewMode === 'wide' ? (
                      /* ==================================================== */
                      /* VISTA AMPLA: TABELA CRM PROFISSIONAL EXPANDIDA */
                      /* ==================================================== */
                      <div className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden shadow-inner">
                        <div className="overflow-x-auto max-h-[560px] custom-scrollbar">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10 border-b border-slate-800 backdrop-blur-sm">
                              <tr>
                                <th className="py-2.5 px-3 w-10 text-center">
                                  <button
                                    type="button"
                                    onClick={selectedLeadIds.size === displayedLeads.length ? deselectAllDisplayed : selectAllDisplayed}
                                    className={`w-4 h-4 rounded flex items-center justify-center transition mx-auto cursor-pointer ${
                                      selectedLeadIds.size > 0 && selectedLeadIds.size === displayedLeads.length
                                        ? 'bg-emerald-500 text-slate-950'
                                        : selectedLeadIds.size > 0
                                        ? 'bg-emerald-500/40 text-emerald-300'
                                        : 'border border-slate-700 bg-slate-800'
                                    }`}
                                    title="Marcar / Desmarcar Todos"
                                  >
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </button>
                                </th>
                                <th className="py-2.5 px-3 min-w-[220px]">Empresa / Estabelecimento</th>
                                <th className="py-2.5 px-3 min-w-[140px]">Telefone (WhatsApp)</th>
                                <th className="py-2.5 px-3 min-w-[200px]">Cidade / Endereço</th>
                                <th className="py-2.5 px-3 min-w-[140px]">Segmento / Categoria</th>
                                <th className="py-2.5 px-3 text-center min-w-[80px]">Origem</th>
                                <th className="py-2.5 px-3 min-w-[190px]">Status da Cadência</th>
                                <th className="py-2.5 px-3 text-center min-w-[90px]">Prévia</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {displayedLeads.map((lead, idx) => {
                                const isSelected = selectedLeadIds.has(lead.id);
                                const isPreviewing = sampleLead.id === lead.id;
                                const cadenceInfo = getLeadCadenceStage(lead);

                                return (
                                  <tr
                                    key={lead.id}
                                    onClick={() => toggleLeadSelection(lead.id)}
                                    className={`transition cursor-pointer ${
                                      isSelected
                                        ? 'bg-slate-850/90 hover:bg-slate-800'
                                        : 'bg-slate-900/30 hover:bg-slate-850/50 opacity-70 hover:opacity-100'
                                    } ${isPreviewing ? 'ring-1 ring-inset ring-emerald-500/50 bg-emerald-950/20' : ''}`}
                                  >
                                    {/* Checkbox */}
                                    <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        type="button"
                                        onClick={() => toggleLeadSelection(lead.id)}
                                        className={`w-4 h-4 rounded flex items-center justify-center transition mx-auto cursor-pointer ${
                                          isSelected
                                            ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                                            : 'bg-slate-800 border border-slate-700 text-transparent'
                                        }`}
                                      >
                                        <Check className="w-3 h-3 stroke-[3]" />
                                      </button>
                                    </td>

                                    {/* Empresa & Rating */}
                                    <td className="py-2 px-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                                          {idx + 1}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="font-bold text-white truncate max-w-[240px]" title={lead.name}>
                                            {lead.name}
                                          </div>
                                          {lead.rating > 0 && (
                                            <div className="text-[10px] text-amber-300 flex items-center gap-1 font-semibold">
                                              <span>⭐ {lead.rating}</span>
                                              {lead.reviewsCount ? <span className="text-slate-400">({lead.reviewsCount})</span> : null}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </td>

                                    {/* WhatsApp */}
                                    <td className="py-2 px-3">
                                      <div className="font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                                        <MessageCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                                        <span>{lead.phone || 'Sem telefone'}</span>
                                      </div>
                                    </td>

                                    {/* Endereço / Cidade */}
                                    <td className="py-2 px-3">
                                      <div className="text-slate-300 text-[11px] truncate max-w-[220px] flex items-center gap-1" title={lead.address}>
                                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span className="truncate">{lead.address || 'Não informado'}</span>
                                      </div>
                                    </td>

                                    {/* Segmento */}
                                    <td className="py-2 px-3">
                                      <span className="text-[11px] text-slate-300 truncate max-w-[150px] block" title={lead.category}>
                                        {lead.category || 'Geral'}
                                      </span>
                                    </td>

                                    {/* Origem */}
                                    <td className="py-2 px-3 text-center">
                                      <span
                                        className={`text-[9px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider inline-block ${
                                          (lead as any).sourceType === 'whatsapp'
                                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                            : (lead as any).sourceType === 'crm'
                                            ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                            : (lead as any).sourceType === 'custom'
                                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                            : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                                        }`}
                                      >
                                        {(lead as any).sourceType === 'whatsapp'
                                          ? 'WhatsApp'
                                          : (lead as any).sourceType === 'crm'
                                          ? 'CRM'
                                          : (lead as any).sourceType === 'custom'
                                          ? 'Manual'
                                          : 'Maps'}
                                      </span>
                                    </td>

                                    {/* Status da Cadência */}
                                    <td className="py-2 px-3">
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border inline-flex items-center gap-1 ${cadenceInfo.badgeColor}`}>
                                        {cadenceInfo.label}
                                      </span>
                                    </td>

                                    {/* Ação Testar Prévia */}
                                    <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPreviewLeadId(lead.id);
                                          setRecipientsViewMode('split');
                                        }}
                                        className={`px-2 py-1 rounded text-[10px] font-semibold transition border flex items-center justify-center gap-1 mx-auto cursor-pointer ${
                                          isPreviewing
                                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                                        }`}
                                        title="Ver personalização no simulador WhatsApp"
                                      >
                                        <Eye className="w-3 h-3" />
                                        <span>{isPreviewing ? 'Ativo' : 'Ver'}</span>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      /* ==================================================== */
                      /* VISTA COM SIMULADOR: CARDS COMPACTOS OTIMIZADOS */
                      /* ==================================================== */
                      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                        {displayedLeads.map((lead) => {
                          const isSelected = selectedLeadIds.has(lead.id);
                          const isPreviewing = sampleLead.id === lead.id;
                          const cadenceInfo = getLeadCadenceStage(lead);

                          return (
                            <div
                              key={lead.id}
                              className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                                isPreviewing
                                  ? 'bg-emerald-950/25 border-emerald-500/60 ring-1 ring-emerald-500/40'
                                  : isSelected
                                  ? 'bg-slate-800/70 border-slate-700 hover:border-slate-600'
                                  : 'bg-slate-900/40 border-slate-800/80 opacity-60 hover:opacity-90'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Checkbox Customizado */}
                                <button
                                  type="button"
                                  onClick={() => toggleLeadSelection(lead.id)}
                                  className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                                      : 'bg-slate-800 border border-slate-700 hover:border-slate-500 text-transparent'
                                  }`}
                                >
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </button>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-white truncate max-w-[180px]">
                                      {lead.name}
                                    </span>
                                    <span className="font-mono text-[11px] text-emerald-400 font-semibold">
                                      {lead.phone || 'Sem telefone'}
                                    </span>
                                    {/* Badge da Origem */}
                                    <span
                                      className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider ${
                                        (lead as any).sourceType === 'whatsapp'
                                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                          : (lead as any).sourceType === 'crm'
                                          ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                          : (lead as any).sourceType === 'custom'
                                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                          : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                                      }`}
                                    >
                                      {(lead as any).sourceType === 'whatsapp'
                                        ? 'WhatsApp'
                                        : (lead as any).sourceType === 'crm'
                                        ? 'CRM'
                                        : (lead as any).sourceType === 'custom'
                                        ? 'Manual'
                                        : 'Maps'}
                                    </span>

                                    {/* Badge do Status da Cadência */}
                                    <span
                                      className={`text-[9px] px-2 py-0.2 rounded-full font-semibold border ${cadenceInfo.badgeColor}`}
                                    >
                                      {cadenceInfo.label}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 truncate">
                                    <span className="truncate">{lead.address || 'Sem endereço'}</span>
                                    {lead.category && (
                                      <>
                                        <span>•</span>
                                        <span className="text-slate-300 truncate">{lead.category}</span>
                                      </>
                                    )}
                                    {lead.rating > 0 && (
                                      <>
                                        <span>•</span>
                                        <span className="text-amber-300 font-semibold flex items-center gap-0.5">
                                          ⭐ {lead.rating}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Ação de Pré-visualizar no Simulador */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isPreviewing ? (
                                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                                    <Eye className="w-3 h-3" />
                                    <span>No Simulador</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewLeadId(lead.id)}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] transition border border-slate-700 cursor-pointer"
                                    title="Visualizar como as mensagens e tags ficarão personalizadas para este contato"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Testar Tags</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {displayedLeads.length === 0 && (
                      <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400 space-y-2">
                        <AlertCircle className="w-6 h-6 mx-auto text-amber-400" />
                        <p className="text-xs">Nenhum contato encontrado com este filtro de busca.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setContactSearchTerm('');
                            setContactSourceFilter('all');
                          }}
                          className="text-xs text-emerald-400 underline cursor-pointer"
                        >
                          Limpar filtros
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* ABA 2: SEQUÊNCIA LIVRE PERSONALIZADA */}
              {/* ==================================================== */}
              {activeTab === 'sequence' && (
                  <div className="space-y-4">
                    {/* Seletor Compacto e Objetivo de Modelos de Sequência (Menu Sanduíche) */}
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                      {/* Linha 1: Menu Sanduíche do Modelo e Ações Principais */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        {/* Seletor Sanduíche e Ações do Modelo Ativo */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {/* Container relativo do Dropdown Sanduíche */}
                          <div className="relative flex-1 sm:flex-none">
                            <button
                              type="button"
                              onClick={() => setIsTemplateMenuOpen((prev) => !prev)}
                              className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-white transition shadow-sm hover:border-emerald-500/50 cursor-pointer"
                              title="Clique para escolher um modelo de sequência"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Menu className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span className="text-slate-400 text-[11px] uppercase tracking-wider font-bold shrink-0">
                                  Modelo:
                                </span>
                                <span className="truncate max-w-[200px] sm:max-w-[320px] text-emerald-200">
                                  {sequenceTemplates.findIndex((t) => t.id === selectedPresetId) + 1}. {activeTemplate?.name.replace(/^[^\w\sÀ-ÿ]+\s*/, '') || 'Selecionar'}
                                </span>
                              </div>
                              <ChevronDown
                                className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ml-1.5 ${
                                  isTemplateMenuOpen ? 'rotate-180 text-emerald-400' : ''
                                }`}
                              />
                            </button>

                            {/* Dropdown Menu com Opções Enxutas: somente número e nome */}
                            {isTemplateMenuOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() => setIsTemplateMenuOpen(false)}
                                />
                                <div className="absolute top-full left-0 mt-1.5 w-full sm:w-96 max-h-72 overflow-y-auto bg-slate-900/98 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 custom-scrollbar">
                                  {sequenceTemplates.map((template, idx) => {
                                    const isSelected = template.id === selectedPresetId;
                                    const cleanName = template.name.replace(/^[^\w\sÀ-ÿ]+\s*/, '');
                                    return (
                                      <button
                                        key={template.id}
                                        type="button"
                                        onClick={() => {
                                          handleApplyPreset(template.id);
                                          setIsTemplateMenuOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition flex items-center justify-between gap-2 cursor-pointer ${
                                          isSelected
                                            ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40'
                                            : 'text-slate-200 hover:bg-slate-800 hover:text-white border border-transparent'
                                        }`}
                                      >
                                        <span className="truncate">
                                          {idx + 1}. {cleanName}
                                        </span>
                                        {isSelected && (
                                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>

                          {/* Ações Rápidas do Modelo Ativo */}
                          {activeTemplate && (
                            <div className="flex items-center gap-1 shrink-0 bg-slate-800/60 p-1 rounded-lg border border-slate-700/50">
                              <button
                                type="button"
                                onClick={() => handleOpenEditMeta(activeTemplate)}
                                className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-700 transition"
                                title="Renomear este modelo"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicateTemplate(activeTemplate)}
                                className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-700 transition"
                                title="Duplicar este modelo"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              {sequenceTemplates.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteTemplate(activeTemplate.id, activeTemplate.name)
                                  }
                                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                                  title="Excluir este modelo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Botões: Novo Modelo e Restaurar Padrões */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={handleOpenCreateNew}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Novo Modelo</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleResetToDefaults}
                            title="Restaurar os modelos padrão originais"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Linha 2: Ações do Modelo Ativo (Somente quando há alterações não salvas) */}
                      {hasUnsavedChanges && (
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 text-xs text-amber-300">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                            <span className="font-medium">
                              Alterações pendentes em <strong className="text-white">{activeTemplate?.name}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={handleDiscardChanges}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                              title="Reverter alterações e voltar aos passos originais deste modelo"
                            >
                              Descartar
                            </button>
                            <button
                              type="button"
                              onClick={handleOpenSaveAsNew}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                              title="Salvar esta configuração como um novo modelo de sequência"
                            >
                              <Copy className="w-3 h-3 text-blue-400" />
                              <span>Salvar como Novo</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveCurrentTemplate}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Salvar Alterações</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Toast de Feedback */}
                      {templateSaveFeedback && (
                        <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{templateSaveFeedback}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTemplateSaveFeedback(null)}
                            className="text-emerald-400 hover:text-white text-xs font-bold ml-2 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Lista dos Passos da Sequência */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-emerald-400" />
                          <span>Passos da Sequência de Disparo</span>
                        </h4>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleAddTextStep}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
                          >
                            <Plus className="w-3 h-3 text-emerald-400" />
                            <span>+ Texto</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddAudioStep()}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
                          >
                            <Plus className="w-3 h-3 text-emerald-400" />
                            <span>+ Áudio</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleAddDelayStep}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
                          >
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>+ Pausa</span>
                          </button>
                        </div>
                      </div>

                      {/* Itens da Sequência */}
                      <div className="space-y-3">
                        {steps.map((step, index) => (
                          <div
                            key={step.id}
                            className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2.5 relative group transition hover:border-slate-600"
                          >
                            {/* Topo do Passo */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-bold">
                                  {index + 1}
                                </span>
                                <span className="text-xs font-bold text-slate-200">
                                  {step.type === 'text' && '💬 Mensagem de Texto'}
                                  {step.type === 'audio' && '🎙️ Áudio Gravado PTT'}
                                  {step.type === 'delay' && '⏳ Intervalo / Pausa'}
                                </span>
                                {step.type !== 'delay' && (
                                  <span
                                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                                      step.requireResponse !== false
                                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                        : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                    }`}
                                  >
                                    {step.requireResponse !== false ? '⏳ Exige Resposta' : '⚡ Sem Resposta'}
                                  </span>
                                )}
                              </div>

                              {/* Ações: Subir, Descer, Excluir */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleMoveStepUp(index)}
                                  disabled={index === 0}
                                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                                  title="Mover para cima"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveStepDown(index)}
                                  disabled={index === steps.length - 1}
                                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                                  title="Mover para baixo"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStep(index)}
                                  className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 ml-1"
                                  title="Excluir passo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Conteúdo específico por tipo de passo */}
                            {step.type === 'text' && (
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400">
                                  <span>Tags dinâmicas para personalizar:</span>
                                  <div className="flex items-center gap-1 font-mono">
                                    {['{{empresa}}', '{{cidade}}', '{{categoria}}', '{{avaliacao}}'].map(
                                      (tag) => (
                                        <button
                                          key={tag}
                                          type="button"
                                          onClick={() => insertTagIntoStep(index, tag)}
                                          className="bg-slate-900 hover:bg-slate-700 text-emerald-400 px-1.5 py-0.5 rounded border border-slate-700 transition"
                                        >
                                          {tag}
                                        </button>
                                      )
                                    )}
                                  </div>
                                </div>
                                <textarea
                                  rows={2}
                                  value={step.textContent || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSteps((prev) =>
                                      prev.map((s, idx) =>
                                        idx === index ? { ...s, textContent: val } : s
                                      )
                                    );
                                  }}
                                  className="w-full p-2.5 rounded-lg bg-slate-900 text-white border border-slate-700 text-xs focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                                  placeholder="Digite a mensagem de texto deste passo..."
                                />
                              </div>
                            )}

                            {step.type === 'audio' && (
                              <div className="space-y-3">
                                {/* Estado 1: Gravando neste passo específico */}
                                {isRecording && recordingTargetStepIndex === index ? (
                                  <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/60 space-y-3 animate-in fade-in">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 text-xs font-bold text-red-300">
                                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                                        <span>Gravando áudio com seu microfone...</span>
                                      </div>
                                      <span className="font-mono text-xs font-bold text-red-300 bg-red-950 px-2 py-0.5 rounded border border-red-500/40">
                                        0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}s
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={stopRecording}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-lg shadow-red-600/30 animate-pulse"
                                      >
                                        <Square className="w-3.5 h-3.5 fill-white" />
                                        <span>Parar e Concluir Gravação ({recordingSeconds}s)</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : recordedAudioPayload && recordedAudioPayload.targetStepIndex === index ? (
                                  /* Estado 2: Gravação concluída aguardando salvar para este passo */
                                  <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/60 space-y-3 animate-in fade-in">
                                    <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                                      <div className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        <span>Áudio gravado com sucesso! (0:{recordedAudioPayload.duration < 10 ? `0${recordedAudioPayload.duration}` : recordedAudioPayload.duration}s)</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          togglePlayAudio({
                                            id: 'temp_preview_step',
                                            url: recordedAudioPayload.url,
                                            name: 'Prévia da Gravação',
                                          })
                                        }
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold transition"
                                      >
                                        {activePlayingId === 'temp_preview_step' ? (
                                          <>
                                            <Pause className="w-3.5 h-3.5" />
                                            <span>Pausar</span>
                                          </>
                                        ) : (
                                          <>
                                            <Play className="w-3.5 h-3.5" />
                                            <span>Ouvir Gravação</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                      <input
                                        type="text"
                                        value={newAudioTitle}
                                        onChange={(e) => setNewAudioTitle(e.target.value)}
                                        placeholder="Nome deste áudio (Ex: Áudio 1 - Apresentação)"
                                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-emerald-500"
                                      />
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={handleSaveRecordedAudio}
                                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition"
                                        >
                                          <Save className="w-3.5 h-3.5" />
                                          <span>Salvar e Usar</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={handleDiscardRecordedAudio}
                                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition"
                                        >
                                          Descartar
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : audioTracks.length === 0 ? (
                                  /* Estado 3: Nenhum áudio gravado ainda no sistema */
                                  <div className="p-4 rounded-xl bg-slate-900/60 border border-dashed border-slate-700 text-center space-y-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
                                      <Mic className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                      <div className="text-xs font-bold text-white">Nenhum áudio cadastrado ainda</div>
                                      <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                                        Grave seu áudio agora usando seu microfone ou envie um arquivo (.mp3, .ogg, .wav). Ele ficará salvo no histórico para você reutilizar.
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => startRecording(index)}
                                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-lg shadow-red-600/20"
                                      >
                                        <Mic className="w-4 h-4" />
                                        <span>Gravar com Microfone</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleTriggerUpload(index)}
                                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
                                      >
                                        <Upload className="w-4 h-4 text-emerald-400" />
                                        <span>Subir Arquivo de Áudio</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Estado 4: Biblioteca possui áudios reais gravados pelo usuário */
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-slate-300 font-medium">
                                        Selecione o áudio deste passo ou grave um novo:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => startRecording(index)}
                                          className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
                                        >
                                          <Mic className="w-3 h-3" />
                                          <span>+ Gravar para Este Passo</span>
                                        </button>
                                        <span className="text-slate-600">•</span>
                                        <button
                                          type="button"
                                          onClick={() => handleTriggerUpload(index)}
                                          className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                                        >
                                          <Upload className="w-3 h-3" />
                                          <span>Subir Arquivo</span>
                                        </button>
                                      </div>
                                    </div>

                                    {/* Grid de Áudios Salvos */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {audioTracks.map((track) => {
                                        const isSelected = step.audioId === track.id;
                                        return (
                                          <div
                                            key={track.id}
                                            onClick={() => {
                                              setSteps((prev) =>
                                                prev.map((s, idx) =>
                                                  idx === index ? { ...s, audioId: track.id } : s
                                                )
                                              );
                                            }}
                                            className={`p-2.5 rounded-xl border cursor-pointer text-xs flex items-center justify-between transition ${
                                              isSelected
                                                ? 'bg-emerald-950/40 border-emerald-500 text-white ring-1 ring-emerald-500/50 shadow-sm'
                                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  togglePlayAudio(track);
                                                }}
                                                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition ${
                                                  activePlayingId === track.id
                                                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                                }`}
                                                title={activePlayingId === track.id ? 'Pausar áudio' : 'Ouvir áudio'}
                                              >
                                                {activePlayingId === track.id ? (
                                                  <Pause className="w-3.5 h-3.5" />
                                                ) : (
                                                  <Play className="w-3.5 h-3.5 ml-0.5" />
                                                )}
                                              </button>
                                              <div className="min-w-0">
                                                <div className="font-semibold text-xs text-white truncate max-w-[160px]">
                                                  {track.name}
                                                </div>
                                                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                                  <span>
                                                    0:{track.duration < 10 ? `0${track.duration}` : track.duration}s
                                                  </span>
                                                  <span>•</span>
                                                  <span>{track.createdAt}</span>
                                                </div>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0 ml-1">
                                              {isSelected && (
                                                <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow">
                                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                </span>
                                              )}
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteAudio(track.id);
                                                }}
                                                className="p-1 text-slate-600 hover:text-rose-400 hover:bg-rose-950/20 rounded transition"
                                                title="Excluir este áudio do histórico"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {step.type === 'delay' && (
                              <div className="flex items-center gap-3 text-xs text-slate-300">
                                <span>Aguardar</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={20}
                                  value={step.delaySeconds || 2}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setSteps((prev) =>
                                      prev.map((s, idx) =>
                                        idx === index ? { ...s, delaySeconds: val } : s
                                      )
                                    );
                                  }}
                                  className="w-16 p-1 rounded bg-slate-900 border border-slate-700 text-center font-bold text-emerald-400 focus:outline-none"
                                />
                                <span>segundos antes de prosseguir para o próximo passo</span>
                              </div>
                            )}

                            {/* Configuração de Dependência de Resposta & Gatilho Individual */}
                            {step.type !== 'delay' && (
                              <div className="pt-2.5 mt-2.5 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-2.5 h-2.5 rounded-full ${
                                      step.requireResponse !== false
                                        ? 'bg-amber-400 animate-pulse'
                                        : 'bg-blue-400'
                                    }`}
                                  />
                                  <div>
                                    <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                                      <span>Requer resposta do lead antes do próximo passo?</span>
                                      <span
                                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                          step.requireResponse !== false
                                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                        }`}
                                      >
                                        {step.requireResponse !== false ? 'Sim (Aguardar Retorno)' : 'Não (Direto / Follow-up)'}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400">
                                      {step.requireResponse !== false
                                        ? 'O próximo passo é pausado até o contato responder no WhatsApp (ou simular resposta).'
                                        : 'Este passo pode ser disparado em massa diretamente, sem depender de retorno do cliente.'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSteps((prev) =>
                                        prev.map((s, idx) =>
                                          idx === index
                                            ? { ...s, requireResponse: s.requireResponse === false ? true : false }
                                            : s
                                        )
                                      );
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                      step.requireResponse !== false
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30'
                                    }`}
                                  >
                                    <span>Mudar para: {step.requireResponse !== false ? 'Não Exigir' : 'Exigir Resposta'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDispatchMode('single_step');
                                      setTargetStepIndexToDispatch(index);
                                      setActiveTab('recipients');
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-emerald-500 flex items-center gap-1.5 transition cursor-pointer"
                                    title="Focar este passo para envio individual aos contatos selecionados"
                                  >
                                    <Send className="w-3 h-3 text-emerald-400" />
                                    <span>Focar Disparo Neste Passo</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ==================================================== */}
                {/* ABA 2: ESTÚDIO & GALERIA DE MÚLTIPLOS ÁUDIOS */}
                {/* ==================================================== */}
                {activeTab === 'audio_studio' && (
                  <div className="space-y-5">
                    {/* Gravador com Microfone Real e Upload */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
                            <Mic className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">
                              Gravação de Áudio com seu Microfone
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Grave quantos áudios desejar (apresentação, quebra de gelo, perguntas diretas).
                            </p>
                          </div>
                        </div>

                        {isRecording && (
                          <div className="flex items-center gap-2 text-xs font-bold text-red-400 animate-pulse">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            <span>Gravando: 0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}s</span>
                          </div>
                        )}
                      </div>

                      {/* Botões do Gravador e Upload */}
                      <div className="flex flex-wrap items-center gap-3">
                        {!isRecording ? (
                          <>
                            <button
                              type="button"
                              onClick={() => startRecording(null)}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition"
                            >
                              <Mic className="w-4 h-4" />
                              <span>Iniciar Nova Gravação</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTriggerUpload(null)}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold transition"
                            >
                              <Upload className="w-4 h-4 text-emerald-400" />
                              <span>Subir Arquivo (.mp3, .ogg, .wav)</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border-2 border-red-500 text-red-400 text-xs font-bold animate-pulse transition"
                          >
                            <Square className="w-4 h-4 fill-red-500 text-red-500" />
                            <span>Parar Gravação ({recordingSeconds}s)</span>
                          </button>
                        )}

                        {recordedAudioPayload && !isRecording && recordedAudioPayload.targetStepIndex === null && (
                          <div className="w-full flex flex-wrap items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 animate-in fade-in">
                            <button
                              type="button"
                              onClick={() =>
                                togglePlayAudio({
                                  id: 'temp_studio_preview',
                                  url: recordedAudioPayload.url,
                                  name: 'Prévia Gravada',
                                })
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold"
                            >
                              {activePlayingId === 'temp_studio_preview' ? (
                                <>
                                  <Pause className="w-3.5 h-3.5" />
                                  <span>Pausar</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5" />
                                  <span>Ouvir ({recordedAudioPayload.duration}s)</span>
                                </>
                              )}
                            </button>
                            <input
                              type="text"
                              value={newAudioTitle}
                              onChange={(e) => setNewAudioTitle(e.target.value)}
                              placeholder="Nome do Áudio (Ex: Apresentação Connect Digital)"
                              className="flex-1 min-w-[200px] px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs border border-slate-700 focus:outline-none focus:border-emerald-500"
                            />
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={handleSaveRecordedAudio}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Salvar na Galeria</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleDiscardRecordedAudio}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs transition"
                              >
                                Descartar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Galeria de Áudios Salvos */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <FileAudio className="w-4 h-4 text-emerald-400" />
                          <span>Galeria de Áudios Disponíveis ({audioTracks.length})</span>
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {audioTracks.length > 0 ? 'Prontos para usar na sua sequência' : 'Histórico limpo'}
                        </span>
                      </div>

                      {audioTracks.length === 0 ? (
                        <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-slate-400 space-y-2">
                          <FileAudio className="w-8 h-8 mx-auto text-slate-600" />
                          <p className="text-xs font-semibold text-slate-300">Nenhum áudio salvo no momento</p>
                          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                            Grave seu primeiro áudio de abordagem com o microfone acima ou envie um arquivo de áudio. Todos os áudios que você gravar serão salvos aqui no seu histórico.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {audioTracks.map((track) => (
                            <div
                              key={track.id}
                              className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between gap-3 transition hover:border-slate-600"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => togglePlayAudio(track)}
                                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition ${
                                    activePlayingId === track.id
                                      ? 'bg-emerald-500 text-slate-950'
                                      : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                  }`}
                                  title={activePlayingId === track.id ? 'Pausar' : 'Ouvir'}
                                >
                                  {activePlayingId === track.id ? (
                                    <Pause className="w-4 h-4" />
                                  ) : (
                                    <Play className="w-4 h-4 ml-0.5" />
                                  )}
                                </button>

                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-200 truncate flex items-center gap-2">
                                    <span>{track.name}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                                      {track.createdAt}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                    <span>Duração: 0:{track.duration < 10 ? `0${track.duration}` : track.duration}s</span>
                                    <span>•</span>
                                    <span className="text-slate-500">Pronto para PTT WhatsApp</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleAddAudioStep(track.id);
                                    setActiveTab('sequence');
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 text-xs font-semibold transition"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Inserir na Sequência</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteAudio(track.id)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                                  title="Excluir áudio da biblioteca"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ==================================================== */}
                {/* ABA 3: CÉREBRO IA & RESPOSTAS INTELIGENTES */}
                {/* ==================================================== */}
                {activeTab === 'ai_rules' && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-900/50 flex items-start gap-3">
                      <Bot className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <div className="font-bold text-blue-200">
                          Roteamento Semântico com Inteligência Artificial
                        </div>
                        <div className="text-slate-400 leading-relaxed">
                          Quando o estabelecimento responde no WhatsApp, o Cérebro IA classifica a intenção em 3 cenários e executa a ação e resposta correspondente.
                        </div>
                      </div>
                    </div>

                    {/* Os 3 Cenários Condicionais */}
                    <div className="space-y-3">
                      {/* Cenário 1: Dono Confirmado */}
                      <div className="p-3.5 rounded-xl bg-slate-800/60 border border-emerald-500/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                            <h5 className="text-xs font-bold text-emerald-300">
                              Cenário 1: Confirmação Decisor / Dono
                            </h5>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                            Entrada no CRM (1ª Coluna)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Exemplos detectados: <em>&quot;Sou o proprietário sim&quot;, &quot;Pode falar comigo&quot;, &quot;Eu mesmo, como funciona?&quot;</em>
                        </p>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-300">
                            Resposta Automática da IA ao Decisor:
                          </label>
                          <textarea
                            rows={2}
                            value={decisorReplyText}
                            onChange={(e) => setDecisorReplyText(e.target.value)}
                            className="w-full p-2.5 rounded-lg bg-slate-900 text-white border border-slate-700 text-xs focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                          />
                        </div>
                      </div>

                      {/* Cenário 2: Secretária / Intermediário */}
                      <div className="p-3.5 rounded-xl bg-slate-800/60 border border-amber-500/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                            <h5 className="text-xs font-bold text-amber-300">
                              Cenário 2: Intermediário / Secretária / Funcionário
                            </h5>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                            Solicita Contato do Dono
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Exemplos detectados: <em>&quot;Sou a secretária&quot;, &quot;Ele não está agora&quot;, &quot;Aqui é recepção&quot;</em>
                        </p>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-300">
                            Resposta Automática solicitando o contato do dono:
                          </label>
                          <textarea
                            rows={2}
                            value={intermediaryReplyText}
                            onChange={(e) => setIntermediaryReplyText(e.target.value)}
                            className="w-full p-2.5 rounded-lg bg-slate-900 text-white border border-slate-700 text-xs focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                          />
                        </div>
                      </div>

                      {/* Cenário 3: Objeção / Desinteresse */}
                      <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                            <h5 className="text-xs font-bold text-slate-300">
                              Cenário 3: Objeção / Desinteresse
                            </h5>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold border border-slate-700">
                            Tag #SemInteresse
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Exemplos detectados: <em>&quot;Não tenho interesse&quot;, &quot;Retire meu número&quot;, &quot;Não quero&quot;</em>
                        </p>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-300">
                            Resposta Educada de Encerramento:
                          </label>
                          <textarea
                            rows={2}
                            value={objectionReplyText}
                            onChange={(e) => setObjectionReplyText(e.target.value)}
                            className="w-full p-2.5 rounded-lg bg-slate-900 text-white border border-slate-700 text-xs focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Simulador Interativo do Cérebro IA */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Simular Resposta de Lead (Teste ao Vivo)</span>
                        </span>
                        <span className="text-[11px] text-slate-500">Testar roteamento da IA</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const text = 'Sou o dono sim! Como funciona essa proposta?';
                            setSimulationInput(text);
                            runSimulationTest(text);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 text-xs hover:bg-emerald-900/60 transition"
                        >
                          🎯 Testar: &quot;Sou o dono sim&quot;
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const text = 'Aqui é a secretária, ele está em reunião';
                            setSimulationInput(text);
                            runSimulationTest(text);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-500/40 text-xs hover:bg-amber-900/60 transition"
                        >
                          💼 Testar: &quot;Aqui é a secretária&quot;
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const text = 'Não tenho interesse, favor retirar';
                            setSimulationInput(text);
                            runSimulationTest(text);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-xs hover:bg-slate-750 transition"
                        >
                          🛑 Testar: &quot;Não tenho interesse&quot;
                        </button>
                      </div>

                      {simulationResult && (
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/80 space-y-2 animate-in fade-in duration-200 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-400">{simulationResult.label}</span>
                            <span className="text-[10px] text-slate-400">{simulationResult.crmImpact}</span>
                          </div>
                          <p className="text-[11px] text-slate-300">{simulationResult.action}</p>
                          <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-200">
                            <strong className="text-emerald-400">Resposta disparada: </strong>
                            &quot;{simulationResult.botResponse}&quot;
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Coluna Direita: Live Preview Realista do WhatsApp */}
              {!(activeTab === 'recipients' && recipientsViewMode === 'wide') && (
                <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Prévia em Tempo Real no WhatsApp</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-emerald-400 font-semibold truncate max-w-[200px]">
                      Simulando: {sampleLead.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('recipients')}
                      className="text-[10px] text-slate-400 hover:text-emerald-300 underline"
                      title="Mudar o contato para simular as variáveis"
                    >
                      (Trocar)
                    </button>
                  </div>
                </div>

                {/* Mockup do Celular com WhatsApp Dark */}
                <div className="rounded-2xl border border-slate-700/80 bg-slate-950 overflow-hidden shadow-2xl flex flex-col">
                  {/* Top bar do WhatsApp */}
                  <div className="p-3 bg-[#1f2c34] border-b border-slate-700/40 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                      {sampleLead.name?.slice(0, 2).toUpperCase() || 'CD'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">
                        {sampleLead.name}
                      </div>
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>{sampleLead.phone || 'Online agora'}</span>
                      </div>
                    </div>
                    <Phone className="w-4 h-4 text-emerald-400" />
                  </div>

                  {/* Área de Mensagens (Renderiza todos os passos) */}
                  <div className="p-4 space-y-3 bg-[#0b141a] min-h-[340px] max-h-[460px] overflow-y-auto flex flex-col justify-end">
                    {/* Timestamp do dia */}
                    <div className="text-center py-1">
                      <span className="text-[10px] text-slate-400 bg-slate-900/90 px-3 py-0.5 rounded-full border border-slate-800">
                        HOJE
                      </span>
                    </div>

                    {steps.map((step, idx) => {
                      if (step.type === 'text') {
                        return (
                          <div
                            key={step.id}
                            className="self-end bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-none max-w-[88%] text-xs shadow-md leading-relaxed space-y-1 animate-in fade-in"
                          >
                            <p>{renderPersonalizedText(step.textContent || '', sampleLead)}</p>
                            <div className="text-[9px] text-emerald-300 text-right flex items-center justify-end gap-1">
                              <span>15:4{idx}</span>
                              <span>✓✓</span>
                            </div>
                          </div>
                        );
                      }

                      if (step.type === 'audio') {
                        const track = audioTracks.find((a) => a.id === step.audioId);

                        if (!track) {
                          return (
                            <div
                              key={step.id}
                              className="self-end bg-[#005c4b]/80 border border-emerald-500/40 text-white p-2.5 rounded-2xl rounded-tr-none max-w-[88%] shadow-md space-y-1 animate-in fade-in"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-emerald-500/30 text-emerald-300 flex items-center justify-center shrink-0">
                                  <Mic className="w-3.5 h-3.5" />
                                </div>
                                <div className="text-[11px] leading-tight">
                                  <div className="font-bold text-white">🎙️ Áudio PTT do Passo {idx + 1}</div>
                                  <div className="text-[10px] text-emerald-200/80">Pendente de gravação ou seleção</div>
                                </div>
                              </div>
                              <div className="text-[9px] text-emerald-300 text-right flex items-center justify-end gap-1 pt-0.5">
                                <span>15:4{idx}</span>
                                <span>✓✓</span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={step.id}
                            className="self-end bg-[#005c4b] text-white p-2.5 rounded-2xl rounded-tr-none max-w-[88%] shadow-md space-y-1 animate-in fade-in"
                          >
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => togglePlayAudio(track)}
                                className="w-8 h-8 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 shadow"
                              >
                                {activePlayingId === track.id ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </button>
                              <div className="flex-1 space-y-1">
                                <div className="h-1.5 bg-emerald-700/80 rounded-full overflow-hidden flex items-center">
                                  <div
                                    className={`h-full bg-emerald-300 rounded-full ${
                                      activePlayingId === track.id ? 'w-2/3 animate-pulse' : 'w-1/3'
                                    }`}
                                  />
                                </div>
                                <div className="flex justify-between text-[10px] text-emerald-200">
                                  <span>0:{track.duration < 10 ? `0${track.duration}` : track.duration}</span>
                                  <span className="truncate max-w-[120px]">{track.name}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-[9px] text-emerald-300 text-right flex items-center justify-end gap-1 pt-0.5">
                              <span>15:4{idx}</span>
                              <span>✓✓</span>
                            </div>
                          </div>
                        );
                      }

                      if (step.type === 'delay') {
                        return (
                          <div key={step.id} className="text-center py-1">
                            <span className="text-[10px] text-slate-500 italic bg-slate-900/60 px-2.5 py-0.5 rounded-full border border-slate-800">
                              ⏳ Pausa de {step.delaySeconds || 2}s antes do próximo envio
                            </span>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                </div>

                {/* Proteção Anti-bloqueio */}
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Proteção Anti-bloqueio Ativa</span>
                  </span>
                  <span className="text-emerald-400 font-semibold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    IA Conectada
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

          {/* ==================================================== */}
          {/* ESTÁGIO: DISPARO EM ANDAMENTO */}
          {/* ==================================================== */}
          {modalStage === 'sending' && (
            <div className="space-y-5 py-6 max-w-2xl mx-auto text-center">
              <div
                className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-1 transition-all shadow-lg ${
                  isDispatchPaused
                    ? 'bg-amber-500/20 text-amber-400 ring-2 ring-amber-500/50 shadow-amber-500/20'
                    : 'bg-emerald-500/20 text-emerald-400 animate-pulse shadow-emerald-500/20'
                }`}
              >
                {isDispatchPaused ? (
                  <Pause className="w-7 h-7 fill-amber-400 text-amber-400" />
                ) : (
                  <Send className="w-7 h-7" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                  <span>
                    {isDispatchPaused ? 'Disparo em Massa Pausado' : 'Disparando Sequência em Massa'}
                  </span>
                  {isDispatchPaused && (
                    <span className="text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      ⏸️ PAUSA ATIVA
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">
                  {isDispatchPaused
                    ? `Fila congelada na empresa ${currentLeadIndex + 1} de ${leadsToDispatch.length}. Clique em Continuar (Play) para retomar.`
                    : `Enviando empresa ${currentLeadIndex + 1} de ${leadsToDispatch.length} • Passo ${currentStepIndex + 1} de ${steps.length} • Cadência Anti-bloqueio (${leadDelaySeconds}s)`}
                </p>
              </div>

              {/* Barra de Progresso */}
              <div className="space-y-2">
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isDispatchPaused
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                        : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-green-400'
                    }`}
                    style={{
                      width: `${Math.round(((currentLeadIndex + 1) / (leadsToDispatch.length || 1)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400 font-semibold">
                  <span>
                    {Math.round(((currentLeadIndex + 1) / (leadsToDispatch.length || 1)) * 100)}% concluído
                  </span>
                  <span>
                    {currentLeadIndex + 1} / {leadsToDispatch.length} estabelecimentos
                  </span>
                </div>
              </div>

              {/* Barra de Controle de Disparo (Play / Pausa / Interromper) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl">
                <div className="flex items-center gap-2.5 text-left">
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      isDispatchPaused ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <span>Status do Envio:</span>
                      {isDispatchPaused ? (
                        <span className="text-amber-300 font-extrabold uppercase tracking-wider text-[10px] bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                          ⏸️ Pausado
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-extrabold uppercase tracking-wider text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40">
                          ⚡ Em Execução Automática
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {isDispatchPaused
                        ? 'O envio foi congelado. Clique em Continuar (Play) para prosseguir com o próximo lead.'
                        : `Aguardando cadência de ${leadDelaySeconds}s entre empresas para proteção do chip.`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isDispatchPaused ? (
                    <button
                      type="button"
                      onClick={handleResumeDispatch}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition cursor-pointer animate-pulse"
                      title="Retomar envios imediatamente de onde parou"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Continuar Disparos (Play)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePauseDispatch}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition cursor-pointer"
                      title="Pausar disparos imediatamente"
                    >
                      <Pause className="w-4 h-4 fill-white" />
                      <span>Pausar Disparos</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCancelDispatch}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold transition cursor-pointer"
                    title="Interromper envio do restante da fila e ir para o resumo"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Interromper</span>
                  </button>
                </div>
              </div>

              {/* Log em Tempo Real */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 text-left overflow-hidden">
                <div className="p-3 bg-slate-900 border-b border-slate-800 text-xs font-bold text-slate-300 flex justify-between items-center">
                  <span>Log de Envio em Tempo Real</span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Evolution API WhatsApp Conectada
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-850 text-xs">
                  {dispatchLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`p-3 flex items-center justify-between transition ${
                        log.status === 'sending'
                          ? 'bg-emerald-950/30'
                          : log.status === 'success'
                          ? 'bg-slate-900/40'
                          : log.status === 'error'
                          ? 'bg-red-950/30 border-l-2 border-red-500'
                          : 'bg-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {log.status === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : log.status === 'error' ? (
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        ) : log.status === 'sending' ? (
                          <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-200 truncate">{log.leadName}</div>
                          <div className="text-[11px] text-slate-500">{log.phone}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-[11px] font-semibold ${
                            log.status === 'success'
                              ? 'text-emerald-400'
                              : log.status === 'error'
                              ? 'text-red-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {log.message}
                        </div>
                        <div className="text-[10px] text-slate-600">{log.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* ESTÁGIO: DISPARO CONCLUÍDO */}
          {/* ==================================================== */}
          {modalStage === 'finished' && (
            <div className="space-y-6 py-8 text-center max-w-xl mx-auto">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-xl ${
                  dispatchLogs.every((l) => l.status === 'error')
                    ? 'bg-red-500/20 text-red-400 shadow-red-500/20'
                    : dispatchLogs.some((l) => l.status === 'error')
                    ? 'bg-amber-500/20 text-amber-400 shadow-amber-500/20'
                    : 'bg-emerald-500/20 text-emerald-400 shadow-emerald-500/20'
                }`}
              >
                {dispatchLogs.every((l) => l.status === 'error') ? (
                  <AlertCircle className="w-9 h-9" />
                ) : (
                  <CheckCircle2 className="w-9 h-9" />
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">
                  {dispatchLogs.every((l) => l.status === 'error')
                    ? 'Atenção: Falha no Disparo'
                    : dispatchMode === 'single_step'
                    ? `${steps[targetStepIndexToDispatch]?.title || `Passo ${targetStepIndexToDispatch + 1}`} Disparado com Sucesso!`
                    : 'Disparo em Massa Concluído!'}
                </h3>
                <div className="text-xs text-slate-400 max-w-md mx-auto space-y-1.5">
                  <p>
                    {dispatchLogs.filter((l) => l.status === 'success').length} de {leadsToDispatch.length} estabelecimentos receberam a mensagem com sucesso.
                  </p>
                  {dispatchLogs.some((l) => l.status === 'error') && (
                    <span className="block text-red-400 font-semibold mt-1">
                      {dispatchLogs.filter((l) => l.status === 'error').length} contato(s) apresentaram erro.
                    </span>
                  )}
                  {steps[targetStepIndexToDispatch]?.requireResponse !== false && dispatchMode === 'single_step' && (
                    <div className="text-teal-200 text-[11px] mt-2 font-medium bg-teal-950/40 p-2.5 rounded-xl border border-teal-500/30 text-left flex items-start gap-2">
                      <span className="text-base shrink-0">⏳</span>
                      <span>
                        Este passo aguarda resposta do contato. Assim que o cliente responder no WhatsApp, ele ficará disponível automaticamente no filtro <strong>&quot;Responderam Msg {targetStepIndexToDispatch + 1} (Prontos p/ Msg {targetStepIndexToDispatch + 2})&quot;</strong> na aba Destinatários.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card de Teste do Cérebro IA (Solicitação do Usuário) */}
              <div className="p-4 rounded-2xl bg-slate-850 border border-slate-700 text-left space-y-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white">
                    Testar Entrada no CRM & Resposta do Cérebro IA ao Vivo
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Para conferir a automação em tempo real, clique abaixo para simular que o proprietário de <strong>{sampleLead.name}</strong> respondeu no WhatsApp agora.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSimulateInboundReply('decisor')}
                    disabled={isSimulatingLiveReply}
                    className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isSimulatingLiveReply ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Simular: &quot;Sou o proprietário sim!&quot;</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimulateInboundReply('intermediary')}
                    disabled={isSimulatingLiveReply}
                    className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                  >
                    <span>Simular: &quot;Aqui é a secretária&quot;</span>
                  </button>
                </div>

                {liveSimulationSuccessMsg && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{liveSimulationSuccessMsg}</span>
                  </div>
                )}
              </div>

              {/* Botões de Ação para Navegação */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalStage('builder');
                    setActiveTab('recipients');
                    setCadenceFilter(targetStepIndexToDispatch === 0 ? 'ready_for_2' : 'ready_for_3');
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/40 text-xs font-bold transition cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Ver Contatos & Avançar Próximo Passo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onClose) onClose();
                    if (onNavigateToWhatsApp) onNavigateToWhatsApp();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Ver Conversas no WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onClose) onClose();
                    if (onNavigateToCrm) onNavigateToCrm();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  <Kanban className="w-4 h-4" />
                  <span>Ver Leads no Funil CRM</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Modal (Builder Mode) */}
        {modalStage === 'builder' && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Controles de Modo e Intervalo */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {/* Seletor de Modo de Disparo */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-semibold">Modo:</span>
                <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setDispatchMode('single_step')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                      dispatchMode === 'single_step'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🎯 Passo Individual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDispatchMode('full_sequence')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                      dispatchMode === 'full_sequence'
                        ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>⚡ Sequência Contínua</span>
                  </button>
                </div>
              </div>

              {/* Seletor de Passo Específico quando no modo single_step */}
              {dispatchMode === 'single_step' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-semibold text-xs">Disparar:</span>
                  <select
                    value={targetStepIndexToDispatch}
                    onChange={(e) => setTargetStepIndexToDispatch(Number(e.target.value))}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-emerald-400 border border-slate-700 text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {steps.map((s, idx) => {
                      const cleanTitle = s.title
                        ? s.title.replace(/^Passo\s*\d+\s*:\s*/i, '').trim()
                        : s.type === 'audio'
                        ? 'Áudio Gravado PTT'
                        : s.type === 'delay'
                        ? 'Pausa / Intervalo'
                        : 'Mensagem de Texto';
                      return (
                        <option key={s.id} value={idx}>
                          Passo {idx + 1}: {cleanTitle}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Intervalo Anti-bloqueio */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Cadência:</span>
                <select
                  value={leadDelaySeconds}
                  onChange={(e) => setLeadDelaySeconds(Number(e.target.value))}
                  className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value={5}>5 seg (Rápido)</option>
                  <option value={8}>8 seg (Recomendado)</option>
                  <option value={12}>12 seg (Seguro)</option>
                  <option value={18}>18 seg (Ultra Seguro)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {onClose && !isEmbedded && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancelar
                </button>
              )}

              <button
                type="button"
                onClick={handleStartMassDispatch}
                disabled={leadsToDispatch.length === 0 || steps.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {leadsToDispatch.length === 0
                    ? 'Nenhum lead selecionado'
                    : dispatchMode === 'single_step'
                    ? `Disparar ${steps[targetStepIndexToDispatch]?.title || `Passo ${targetStepIndexToDispatch + 1}`} (${leadsToDispatch.length} Leads)`
                    : `Disparar Sequência Completa (${leadsToDispatch.length} Leads)`}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Modal / Dialog de Criar / Renomear / Salvar como Novo Modelo */}
        {isTemplateModalOpen && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">
                    {templateModalMode === 'edit_meta'
                      ? 'Editar Nome e Descrição do Modelo'
                      : templateModalMode === 'save_as_new'
                      ? 'Salvar Sequência como Novo Modelo'
                      : 'Criar Novo Modelo de Sequência'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmTemplateModal} className="p-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome do Modelo *
                  </label>
                  <input
                    type="text"
                    required
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: 🔥 Abordagem Especial para Clínicas"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 text-white border border-slate-700 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Descrição ou Objetivo da Sequência (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Ex: 2 mensagens rápidas + áudio PTT direto ao decisor."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 text-white border border-slate-700 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {templateModalMode === 'save_as_new' && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-300">
                    ℹ️ Este novo modelo será salvo exatamente com os <strong>{steps.length} passos</strong> que estão configurados na tela.
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsTemplateModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      {templateModalMode === 'edit_meta' ? 'Salvar Alterações' : 'Criar e Salvar Modelo'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );

  if (isEmbedded) {
    return modalContent;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {modalContent}
    </div>
  );
}
