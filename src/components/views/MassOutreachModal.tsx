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
  Sparkle,
  Search,
  Building2,
  MapPin,
  Star,
  Eye,
  Filter,
  CheckCheck,
  CheckSquare,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ProspectItem, AudioTrackItem, SequenceStepItem } from '@/types';

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

// Áudios Padrão da Plataforma (Alta Qualidade)
const DEFAULT_AUDIOS: AudioTrackItem[] = [
  {
    id: 'audio_default_1',
    name: '🎙️ Áudio 1 - Apresentação Connect Digital',
    duration: 14,
    url: 'https://cdn.freesound.org/previews/608/608645_11861866-lq.mp3',
    createdAt: 'Padrão Connect Digital',
    isCustom: false,
  },
  {
    id: 'audio_default_2',
    name: '🎙️ Áudio 2 - Pergunta Direta ao Proprietário',
    duration: 18,
    url: 'https://cdn.freesound.org/previews/608/608645_11861866-lq.mp3',
    createdAt: 'Padrão Connect Digital',
    isCustom: false,
  },
];

// Modelos de Sequência Pré-configurados
const PRESET_SEQUENCES = [
  {
    id: 'seq_audio_texto',
    name: '🔥 Sequência Campeã: Texto de Abordagem + Áudio PTT Humanizado',
    description: 'Envia primeiro o texto cumprimentando e, em seguida, o áudio filtrando o proprietário.',
    steps: [
      {
        id: 'step_1',
        type: 'text' as const,
        title: 'Passo 1: Mensagem de Quebra de Gelo',
        textContent:
          'Olá time da {{empresa}}, tudo bem? Sou o Rafael da Connect Digital aqui em {{cidade}}.',
      },
      {
        id: 'step_2',
        type: 'audio' as const,
        title: 'Passo 2: Áudio de Apresentação (PTT)',
        audioId: 'audio_default_1',
      },
      {
        id: 'step_3',
        type: 'text' as const,
        title: 'Passo 3: Pergunta-Chave do Decisor',
        textContent:
          'Poderia me confirmar se este é o WhatsApp direto do proprietário ou responsável pelas decisões da empresa?',
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
      },
      {
        id: 'step_2',
        type: 'audio' as const,
        title: 'Passo 2: Áudio de Parceria Estratégica',
        audioId: 'audio_default_2',
      },
      {
        id: 'step_3',
        type: 'text' as const,
        title: 'Passo 3: Solicitação do Contato Direto',
        textContent:
          'Temos soluções de captação e inteligência comercial para empresas referência em {{cidade}}. Seria você o responsável por avaliar novas parcerias comerciais?',
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
      },
      {
        id: 'step_2',
        type: 'audio' as const,
        title: 'Passo 2: Áudio Rápido (0:14s)',
        audioId: 'audio_default_1',
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

  // Filtragem por busca
  const displayedLeads = useMemo(() => {
    if (!contactSearchTerm.trim()) return sourceFilteredLeads;
    const term = contactSearchTerm.toLowerCase();
    return sourceFilteredLeads.filter(
      (l) =>
        l.name.toLowerCase().includes(term) ||
        (l.phone && l.phone.includes(term)) ||
        (l.address && l.address.toLowerCase().includes(term)) ||
        (l.category && l.category.toLowerCase().includes(term))
    );
  }, [sourceFilteredLeads, contactSearchTerm]);

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

  // Atualiza a seleção caso selectedLeads via prop mude
  useEffect(() => {
    if (selectedLeads && selectedLeads.length > 0) {
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
  const [audioTracks, setAudioTracks] = useState<AudioTrackItem[]>(DEFAULT_AUDIOS);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [newAudioTitle, setNewAudioTitle] = useState('');
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Carregar áudios salvos no localStorage
  useEffect(() => {
    try {
      const storageKey = `flowlevel_audio_library_${currentSubaccount.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAudioTracks([...DEFAULT_AUDIOS, ...parsed]);
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar áudios do storage:', e);
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

  // Iniciar Gravação com Microfone
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedBlobUrl(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      setNewAudioTitle(`Áudio ${audioTracks.length + 1} - Gravação`);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
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

  // Salvar Áudio Gravado na Galeria
  const handleSaveRecordedAudio = () => {
    if (!recordedBlobUrl) return;

    const newTrack: AudioTrackItem = {
      id: `audio_custom_${Date.now()}`,
      name: newAudioTitle.trim() || `Áudio ${audioTracks.length + 1}`,
      duration: Math.max(recordingSeconds, 3),
      url: recordedBlobUrl,
      createdAt: 'Gravado por você',
      isCustom: true,
    };

    const updated = [...audioTracks, newTrack];
    setAudioTracks(updated);
    saveCustomAudios(updated.filter((a) => a.isCustom));
    setRecordedBlobUrl(null);
    setRecordingSeconds(0);
  };

  // Excluir Áudio
  const handleDeleteAudio = (id: string) => {
    const updated = audioTracks.filter((t) => t.id !== id);
    setAudioTracks(updated);
    saveCustomAudios(updated.filter((a) => a.isCustom));
  };

  // Reproduzir / Pausar Áudio
  const togglePlayAudio = (track: AudioTrackItem) => {
    if (activePlayingId === track.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setActivePlayingId(null);
    } else {
      setActivePlayingId(track.id);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = track.url;
        audioPlayerRef.current.play();
      }
    }
  };

  // ==========================================
  // 2. ESTADO DA SEQUÊNCIA DE DISPARO (PASSOS)
  // ==========================================
  const [steps, setSteps] = useState<SequenceStepItem[]>(PRESET_SEQUENCES[0].steps);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('seq_audio_texto');
  const [leadDelaySeconds, setLeadDelaySeconds] = useState<number>(8);

  // Aplicar Preset de Sequência
  const handleApplyPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const found = PRESET_SEQUENCES.find((p) => p.id === presetId);
    if (found) {
      setSteps(JSON.parse(JSON.stringify(found.steps)));
    }
  };

  // Adicionar Passo de Texto
  const handleAddTextStep = () => {
    const newStep: SequenceStepItem = {
      id: `step_${Date.now()}`,
      type: 'text',
      title: `Passo ${steps.length + 1}: Mensagem de Texto`,
      textContent: 'Olá {{empresa}}, gostaria de confirmar uma informação com o proprietário.',
    };
    setSteps([...steps, newStep]);
  };

  // Adicionar Passo de Áudio
  const handleAddAudioStep = (audioId?: string) => {
    const selectedAudio = audioTracks.find((a) => a.id === audioId) || audioTracks[0];
    const newStep: SequenceStepItem = {
      id: `step_${Date.now()}`,
      type: 'audio',
      title: `Passo ${steps.length + 1}: Áudio Gravado`,
      audioId: selectedAudio?.id,
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

  const handleStartMassDispatch = async () => {
    if (leadsToDispatch.length === 0 || steps.length === 0) return;

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

    // Executar para cada lead selecionado
    for (let lIdx = 0; lIdx < leadsToDispatch.length; lIdx++) {
      setCurrentLeadIndex(lIdx);
      const lead = leadsToDispatch[lIdx];

      setDispatchLogs((prev) =>
        prev.map((log, idx) =>
          idx === lIdx
            ? { ...log, status: 'sending', message: 'Iniciando sequência personalizada...' }
            : log
        )
      );

      let leadContactId: string | undefined = undefined;

      // Executar cada passo da sequência configurada
      for (let sIdx = 0; sIdx < steps.length; sIdx++) {
        setCurrentStepIndex(sIdx);
        const step = steps[sIdx];

        if (step.type === 'delay') {
          await new Promise((res) => setTimeout(res, (step.delaySeconds || 2) * 1000));
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
          });

          if (res.contactId) {
            leadContactId = res.contactId;
            setLastDispatchedContactId(res.contactId);
          }
        } catch (e) {
          console.error('Erro ao enviar passo da sequência:', e);
        }

        // Breve intervalo entre passos para humanização do envio
        if (sIdx < steps.length - 1) {
          await new Promise((res) => setTimeout(res, 1800));
        }
      }

      // Marcar lead com sucesso
      setDispatchLogs((prev) =>
        prev.map((log, idx) =>
          idx === lIdx
            ? {
                ...log,
                status: 'success',
                message: `Sequência completa enviada (${steps.length} passos)`,
                time: new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }),
              }
            : log
        )
      );

      // Intervalo de segurança anti-bloqueio entre cada lead
      if (lIdx < leadsToDispatch.length - 1) {
        await new Promise((res) => setTimeout(res, leadDelaySeconds * 1000));
      }
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
                <span>{leadsToDispatch.length} de {allAvailableLeads.length} Leads Selecionados</span>
                <span className="text-emerald-300 underline font-normal text-[9px]">Editar</span>
              </button>
              <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-md font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                Connect Digital
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Crie fluxos completos intercalando múltiplos áudios gravados e mensagens inteligentes com IA.
            </p>
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
              <span>1. Destinatários ({leadsToDispatch.length}/{allAvailableLeads.length})</span>
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
        {/* Audio Player escondido para reprodução */}
        <audio
          ref={audioPlayerRef}
          onEnded={() => setActivePlayingId(null)}
          className="hidden"
        />

        {modalStage === 'builder' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Coluna Esquerda: Conteúdo da Aba Ativa */}
            <div className="lg:col-span-7 space-y-5">
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

                    {/* Campo de Busca e Ações Rápidas de Seleção */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
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

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={selectAllDisplayed}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
                          title="Selecionar todos os contatos filtrados"
                        >
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Marcar Todos</span>
                        </button>
                        <button
                          type="button"
                          onClick={deselectAllDisplayed}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
                          title="Desmarcar contatos da lista"
                        >
                          <X className="w-3.5 h-3.5 text-red-400" />
                          <span>Desmarcar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingCustomContact(!isAddingCustomContact)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar Manual</span>
                        </button>
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
                        Dica: Clique em &quot;Testar Tags&quot; para pré-visualizar no simulador
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                      {displayedLeads.map((lead) => {
                        const isSelected = selectedLeadIds.has(lead.id);
                        const isPreviewing = sampleLead.id === lead.id;

                        return (
                          <div
                            key={lead.id}
                            className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
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
                                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition ${
                                  isSelected
                                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                                    : 'bg-slate-800 border border-slate-700 hover:border-slate-500 text-transparent'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </button>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-white truncate max-w-[220px]">
                                    {lead.name}
                                  </span>
                                  <span className="font-mono text-[11px] text-emerald-400 font-semibold">
                                    {lead.phone || 'Sem telefone'}
                                  </span>
                                  {/* Badge da Origem */}
                                  <span
                                    className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
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
                                </div>

                                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 truncate">
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
                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                                  <Eye className="w-3 h-3" />
                                  <span>No Simulador</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setPreviewLeadId(lead.id)}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition border border-slate-700"
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
                            className="text-xs text-emerald-400 underline"
                          >
                            Limpar filtros
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* ABA 2: SEQUÊNCIA LIVRE PERSONALIZADA */}
              {/* ==================================================== */}
              {activeTab === 'sequence' && (
                  <div className="space-y-4">
                    {/* Seletor de Modelo Pré-Configurado */}
                    <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Modelos de Sequência Recomendados</span>
                        </label>
                        <span className="text-[11px] text-slate-400">Clique para carregar</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {PRESET_SEQUENCES.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleApplyPreset(preset.id)}
                            className={`p-2.5 rounded-lg text-left text-xs border transition ${
                              selectedPresetId === preset.id
                                ? 'bg-emerald-950/30 border-emerald-500/60 text-white ring-1 ring-emerald-500/40'
                                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            }`}
                          >
                            <div className="font-semibold truncate">{preset.name.split(':')[0]}</div>
                            <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                              {preset.steps.length} passos
                            </div>
                          </button>
                        ))}
                      </div>
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
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-400">Selecione o áudio que será enviado:</span>
                                  <button
                                    type="button"
                                    onClick={() => setActiveTab('audio_studio')}
                                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                                  >
                                    <Mic className="w-3 h-3" />
                                    <span>Gravar Novo Áudio</span>
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {audioTracks.map((track) => (
                                    <div
                                      key={track.id}
                                      onClick={() => {
                                        setSteps((prev) =>
                                          prev.map((s, idx) =>
                                            idx === index ? { ...s, audioId: track.id } : s
                                          )
                                        );
                                      }}
                                      className={`p-2 rounded-lg border cursor-pointer text-xs flex items-center justify-between transition ${
                                        step.audioId === track.id
                                          ? 'bg-emerald-950/40 border-emerald-500/60 text-white ring-1 ring-emerald-500/40'
                                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            togglePlayAudio(track);
                                          }}
                                          className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0"
                                        >
                                          {activePlayingId === track.id ? (
                                            <Pause className="w-3 h-3" />
                                          ) : (
                                            <Play className="w-3 h-3" />
                                          )}
                                        </button>
                                        <div className="min-w-0">
                                          <div className="font-semibold truncate">{track.name}</div>
                                          <div className="text-[10px] text-slate-500">
                                            0:{track.duration < 10 ? `0${track.duration}` : track.duration}s • {track.createdAt}
                                          </div>
                                        </div>
                                      </div>
                                      {step.audioId === track.id && (
                                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />
                                      )}
                                    </div>
                                  ))}
                                </div>
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
                    {/* Gravador com Microfone Real */}
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
                              Grave quantos áudios desejar (apresentação, quebra de gelo, perguntas).
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

                      {/* Botões do Gravador */}
                      <div className="flex flex-wrap items-center gap-3">
                        {!isRecording ? (
                          <button
                            type="button"
                            onClick={startRecording}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition"
                          >
                            <Mic className="w-4 h-4" />
                            <span>Iniciar Nova Gravação</span>
                          </button>
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

                        {recordedBlobUrl && !isRecording && (
                          <div className="flex-1 flex flex-wrap items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                            <input
                              type="text"
                              value={newAudioTitle}
                              onChange={(e) => setNewAudioTitle(e.target.value)}
                              placeholder="Nome do Áudio (Ex: Apresentação Connect Digital)"
                              className="flex-1 min-w-[180px] px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs border border-slate-700 focus:outline-none focus:border-emerald-500"
                            />
                            <button
                              type="button"
                              onClick={handleSaveRecordedAudio}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Salvar na Galeria</span>
                            </button>
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
                          Prontos para usar na sua sequência
                        </span>
                      </div>

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
                              >
                                {activePlayingId === track.id ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </button>

                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-200 truncate flex items-center gap-2">
                                  <span>{track.name}</span>
                                  {track.isCustom ? (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                                      Gravado por você
                                    </span>
                                  ) : (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                                      Padrão Connect Digital
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span>Duração: 0:{track.duration < 10 ? `0${track.duration}` : track.duration}s</span>
                                  <span>•</span>
                                  <span>{track.createdAt}</span>
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

                              {track.isCustom && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAudio(track.id)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                                  title="Excluir áudio"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
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
                        const track =
                          audioTracks.find((a) => a.id === step.audioId) || audioTracks[0];
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

                {/* Resumo da Automação */}
                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Garantias da Prospecção FlowLevel:</span>
                  </div>
                  <ul className="text-slate-400 space-y-1 text-[11px] list-disc list-inside">
                    <li>
                      Sequência respeita cadência anti-bloqueio entre cada empresa contatada.
                    </li>
                    <li>
                      Respostas são avaliadas pelo Cérebro IA com intenção semântica.
                    </li>
                    <li>
                      Decisores confirmados entram automaticamente no CRM e recebem a proposta.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* ESTÁGIO: DISPARO EM ANDAMENTO */}
          {/* ==================================================== */}
          {modalStage === 'sending' && (
            <div className="space-y-6 py-6 max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 animate-pulse mb-1">
                <Send className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Disparando Sequência em Massa</h3>
                <p className="text-xs text-slate-400">
                  Enviando empresa {currentLeadIndex + 1} de {leadsToDispatch.length} • Passo {currentStepIndex + 1} de {steps.length} • Cadência Anti-bloqueio ({leadDelaySeconds}s)
                </p>
              </div>

              {/* Barra de Progresso */}
              <div className="space-y-2">
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-green-400 transition-all duration-500 rounded-full"
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
                          : 'bg-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {log.status === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
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
                            log.status === 'success' ? 'text-emerald-400' : 'text-amber-400'
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
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Disparo em Massa Concluído!</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {leadsToDispatch.length} estabelecimentos receberam a sequência completa de mensagens e áudios gravados.
                </p>
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
                    className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
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
                    className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition disabled:opacity-50"
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
                    if (onClose) onClose();
                    if (onNavigateToWhatsApp) onNavigateToWhatsApp();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition"
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
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition"
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
          <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Intervalo Anti-bloqueio */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Intervalo entre contatos:</span>
              <select
                value={leadDelaySeconds}
                onChange={(e) => setLeadDelaySeconds(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-white border border-slate-700 text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value={5}>5 seg (Rápido)</option>
                <option value={8}>8 seg (Recomendado)</option>
                <option value={12}>12 seg (Seguro)</option>
                <option value={18}>18 seg (Ultra Seguro)</option>
              </select>
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
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>
                  {leadsToDispatch.length > 0
                    ? `Iniciar Disparo em Massa (${leadsToDispatch.length} Leads)`
                    : 'Nenhum lead selecionado'}
                </span>
              </button>
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
