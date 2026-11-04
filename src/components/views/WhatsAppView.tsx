'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageSquare,
  QrCode,
  Send,
  Smartphone,
  Bot,
  User,
  CheckCheck,
  Search,
  Settings2,
  RefreshCw,
  ShieldCheck,
  Zap,
  Sparkles,
  Sliders,
  DollarSign,
  MapPin,
  Play,
  CheckCircle2,
  MessageCircle,
  UserCheck,
  Mic,
  Square,
  Trash2,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { WhatsAppProvider } from '@/types';
import { MassOutreachModal } from './MassOutreachModal';
import { getContactDisplayName } from '@/lib/phone';

export function WhatsAppView() {
  const {
    currentSubaccount,
    updateWhatsAppConfig,
    contacts,
    activeContact,
    setActiveContact,
    messages,
    sendMessage,
    refreshChatData,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'chat' | 'broadcast' | 'training' | 'connection'>('chat');
  const [isModalBroadcastOpen, setIsModalBroadcastOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [contactFilter, setContactFilter] = useState<'all' | 'direct' | 'groups'>('all');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isRefreshingChat, setIsRefreshingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Gravação de Áudio PTT direto no Chat 1-a-1
  const [isChatRecording, setIsChatRecording] = useState(false);
  const [chatRecordingSeconds, setChatRecordingSeconds] = useState(0);
  const chatMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chatAudioChunksRef = useRef<Blob[]>([]);
  const chatTimerRef = useRef<any>(null);

  const startChatAudioRecording = async () => {
    if (!activeContact) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chatAudioChunksRef.current = [];
      let options: MediaRecorderOptions | undefined = undefined;
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        }
      }
      const recorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
      chatMediaRecorderRef.current = recorder;
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chatAudioChunksRef.current.push(ev.data);
      };
      recorder.start();
      setIsChatRecording(true);
      setChatRecordingSeconds(0);
      if (chatTimerRef.current) clearInterval(chatTimerRef.current);
      chatTimerRef.current = setInterval(() => {
        setChatRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Erro ao acessar microfone no chat:', err);
      alert('Não foi possível acessar seu microfone. Verifique as permissões do navegador.');
    }
  };

  const cancelChatAudioRecording = () => {
    if (chatMediaRecorderRef.current) {
      chatMediaRecorderRef.current.onstop = null;
      if (chatMediaRecorderRef.current.state !== 'inactive') {
        chatMediaRecorderRef.current.stop();
      }
      chatMediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    if (chatTimerRef.current) clearInterval(chatTimerRef.current);
    setIsChatRecording(false);
    setChatRecordingSeconds(0);
  };

  const finishAndSendChatAudio = () => {
    if (!chatMediaRecorderRef.current || !activeContact) return;
    const targetContactId = activeContact.id;
    const recorder = chatMediaRecorderRef.current;
    recorder.onstop = () => {
      const mimeType = recorder.mimeType || 'audio/webm';
      const blob = new Blob(chatAudioChunksRef.current, { type: mimeType });
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        if (base64Audio) {
          sendMessage(targetContactId, '🎙️ Áudio de voz (PTT)', base64Audio, 'audio');
        }
      };
    };
    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
    recorder.stream.getTracks().forEach((t) => t.stop());
    if (chatTimerRef.current) clearInterval(chatTimerRef.current);
    setIsChatRecording(false);
    setChatRecordingSeconds(0);
  };

  // Estados locais para configuração da conexão
  const config = currentSubaccount.whatsappConfig;
  const [selectedProvider, setSelectedProvider] = useState<WhatsAppProvider>(config.provider);
  const [instanceName, setInstanceName] = useState(config.instanceName || 'connect-digital');
  const [apiUrl, setApiUrl] = useState(config.evolutionApiUrl || 'https://evolution-api-kix9.onrender.com');
  const [apiKey, setApiKey] = useState(config.evolutionApiKey || 'flowlevel_secret_key_2026');
  const [metaPhoneId, setMetaPhoneId] = useState(config.metaPhoneNumberId || '102938475610293');
  const [metaToken, setMetaToken] = useState(config.metaAccessToken || 'EAAG...metaTokenExemplo');
  const [isConnecting, setIsConnecting] = useState(false);

  // Live QR Code e Conexão Real da Evolution API
  const [liveQrCode, setLiveQrCode] = useState<string | null>(null);
  const [qrState, setQrState] = useState<string>('connecting');
  const [isLoadingQr, setIsLoadingQr] = useState<boolean>(false);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  useEffect(() => {
    if (currentSubaccount?.whatsappConfig) {
      const cfg = currentSubaccount.whatsappConfig;
      setSelectedProvider(cfg.provider || 'evolution');
      setInstanceName(cfg.instanceName || `empresa-${currentSubaccount.id.slice(0, 8)}`);
      if (cfg.evolutionApiUrl) setApiUrl(cfg.evolutionApiUrl);
      if (cfg.evolutionApiKey) setApiKey(cfg.evolutionApiKey);
      if (cfg.metaPhoneNumberId) setMetaPhoneId(cfg.metaPhoneNumberId);
      if (cfg.metaAccessToken) setMetaToken(cfg.metaAccessToken);
    }
  }, [currentSubaccount?.id]);

  // Estados do Treinamento do Atendente de IA
  const [botName, setBotName] = useState('Sofia');
  const [botRole, setBotRole] = useState('Consultora Especialista em Atendimento & Vendas');
  const [botTone, setBotTone] = useState<'consultive' | 'friendly' | 'commercial' | 'formal'>('consultive');
  const [botEnabled, setBotEnabled] = useState(false);
  const [isTogglingBot, setIsTogglingBot] = useState(false);
  const [toggleFeedback, setToggleFeedback] = useState<string | null>(null);
  const [servicesAndPricing, setServicesAndPricing] = useState(
    `• Implementação de CRM & Funil de Vendas Automatizado\n• Chatbots com Inteligência Artificial para WhatsApp\n• Prospecção Ativa B2B & Mineração no Google Maps\n• Tráfego Pago & Gestão de Redes Sociais\n• Automações de Atendimento & Disparos em Massa`
  );
  const [coverageAreas, setCoverageAreas] = useState('Brasil inteiro (atendimento online) e presencial na Região Metropolitana.');
  const [paymentTerms, setPaymentTerms] = useState('PIX, Boleto bancário e Cartão de crédito.');
  const [businessHours, setBusinessHours] = useState('Segunda a Sexta das 08h30 às 18h30.');
  const [customInstructions, setCustomInstructions] = useState(
    `1. Você é Sofia, consultora da Connect Digital (Agência de Marketing e Automação).\n2. Seja sempre cordial, profissional e focada em entender as necessidades comerciais do cliente.\n3. Explique que ajudamos empresas a captar mais clientes e automatizar seus atendimentos com IA e CRM.\n4. Para orçamentos, colete o nome da empresa e o principal objetivo do cliente.\n5. Responda em no máximo 2 a 3 frases concisas para manter a conversa fluida no WhatsApp.`
  );
  const [humanHandoffKeywords, setHumanHandoffKeywords] = useState('atendente, falar com atendente, humano, atendente humano, pessoa, reclamacao, urgente');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [, setIsLoadingConfig] = useState(false);
  const [isSavingAgent, setIsSavingAgent] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Simulador de Atendimento IA
  const [simulationInput, setSimulationInput] = useState('Olá! Gostaria de saber como a Connect Digital pode ajudar minha empresa a captar mais clientes.');
  const [simulationResponse, setSimulationResponse] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (!currentSubaccount?.id) return;
    async function loadAgentConfig() {
      setIsLoadingConfig(true);
      try {
        try {
          const cachedBotState = localStorage.getItem(`flowlevel_bot_enabled_${currentSubaccount.id}`);
          if (cachedBotState !== null) {
            setBotEnabled(cachedBotState === 'true');
          }
        } catch (e) { }

        const res = await fetch(`/api/ai/agent-config?subaccountId=${currentSubaccount.id}`);
        const data = await res.json();
        if (data.config) {
          const cfg = data.config;
          if (cfg.botName) setBotName(cfg.botName);
          if (cfg.botRole) setBotRole(cfg.botRole);
          if (cfg.botTone) setBotTone(cfg.botTone);
          if (cfg.botEnabled !== undefined) {
            const isEnabled = Boolean(cfg.botEnabled);
            setBotEnabled(isEnabled);
            try {
              localStorage.setItem(`flowlevel_bot_enabled_${currentSubaccount.id}`, String(isEnabled));
            } catch (e) { }
          } else {
            setBotEnabled(false);
          }
          if (cfg.servicesAndPricing) setServicesAndPricing(cfg.servicesAndPricing);
          if (cfg.coverageAreas) setCoverageAreas(cfg.coverageAreas);
          if (cfg.paymentTerms) setPaymentTerms(cfg.paymentTerms);
          if (cfg.businessHours) setBusinessHours(cfg.businessHours);
          if (cfg.customInstructions) setCustomInstructions(cfg.customInstructions);
          if (cfg.humanHandoffKeywords) setHumanHandoffKeywords(cfg.humanHandoffKeywords);
          if (cfg.geminiApiKey) setGeminiApiKey(cfg.geminiApiKey);
          if (cfg.openaiApiKey) setOpenaiApiKey(cfg.openaiApiKey);
        }
      } catch (err) {
        console.error('Erro ao buscar configuração do atendente:', err);
      } finally {
        setIsLoadingConfig(false);
      }
    }
    loadAgentConfig();
  }, [currentSubaccount?.id]);

  const handleToggleBot = async () => {
    const nextState = !botEnabled;
    setBotEnabled(nextState);
    setIsTogglingBot(true);
    setToggleFeedback(nextState ? 'Ativando no servidor...' : 'Pausando no servidor...');

    try {
      localStorage.setItem(`flowlevel_bot_enabled_${currentSubaccount.id}`, String(nextState));
    } catch (e) { }

    try {
      const res = await fetch('/api/ai/agent-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subaccountId: currentSubaccount.id,
          config: {
            botName,
            botRole,
            botTone,
            botEnabled: nextState,
            servicesAndPricing,
            coverageAreas,
            paymentTerms,
            businessHours,
            customInstructions,
            humanHandoffKeywords,
            geminiApiKey,
            openaiApiKey,
          },
        }),
      });

      if (res.ok) {
        setToggleFeedback(nextState ? 'Sofia ativada no servidor' : 'Sofia pausada no servidor');
      } else {
        setToggleFeedback('Erro ao sincronizar status');
      }
    } catch (err) {
      console.error('Erro ao alternar status do atendente no servidor:', err);
      setToggleFeedback('Erro de conexão ao salvar');
    } finally {
      setIsTogglingBot(false);
      setTimeout(() => setToggleFeedback(null), 3500);
    }
  };

  const handleSaveAgentTraining = async () => {
    setIsSavingAgent(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/ai/agent-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subaccountId: currentSubaccount.id,
          config: {
            botName,
            botRole,
            botTone,
            botEnabled,
            servicesAndPricing,
            coverageAreas,
            paymentTerms,
            businessHours,
            customInstructions,
            humanHandoffKeywords,
            geminiApiKey,
            openaiApiKey,
          },
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert('Erro ao salvar treinamento. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao salvar treinamento:', err);
      alert('Erro de conexão ao salvar.');
    } finally {
      setIsSavingAgent(false);
    }
  };

  const handleTestSimulation = async () => {
    if (!simulationInput.trim()) return;
    setIsSimulating(true);
    setSimulationResponse('');

    try {
      const testPrompt = `Você é "${botName}", ${botRole} da empresa "${currentSubaccount.name}" (${currentSubaccount.segment || 'Serviços'}).
Tom de atendimento: ${botTone}.

BASE DE CONHECIMENTO:
- SERVIÇOS E PREÇOS: ${servicesAndPricing}
- REGIÕES ATENDIDAS: ${coverageAreas}
- FORMAS DE PAGAMENTO: ${paymentTerms}
- HORÁRIO: ${businessHours}
- INSTRUÇÕES ESPECIAIS: ${customInstructions}

Mensagem do cliente no WhatsApp:
"${simulationInput}"

Responda em no máximo 2 a 3 frases diretamente ao cliente, como se estivesse no WhatsApp.`;

      const res = await fetch('/api/ai/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: simulationInput,
          contactName: 'Cliente Teste',
          companyName: currentSubaccount.name,
          segment: currentSubaccount.segment,
          systemPromptOverride: testPrompt,
        }),
      });

      const data = await res.json();
      if (data.response) {
        setSimulationResponse(data.response);
      } else {
        setSimulationResponse('Olá! Com certeza realizamos a instalação de ar-condicionado de 12.000 BTUs no Centro. Nossos valores para essa capacidade iniciam em R$ 380,00. Poderia nos enviar uma foto do local ou prefere que façamos um agendamento para a visita técnica?');
      }
    } catch (err) {
      console.error('Erro ao simular:', err);
      setSimulationResponse('Erro ao executar simulação com a IA. Verifique sua conexão.');
    } finally {
      setIsSimulating(false);
    }
  };

  const fetchLiveQrCode = useCallback(async (forceRestart = false) => {
    setIsLoadingQr(true);
    const cleanInst = (instanceName || 'connect-digital').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanUrl = (apiUrl || 'https://evolution-api-kix9.onrender.com').trim().replace(/\s+/g, '-');
    try {
      const res = await fetch(
        `/api/whatsapp/qrcode?instance=${encodeURIComponent(cleanInst)}&apiUrl=${encodeURIComponent(cleanUrl)}&apiKey=${encodeURIComponent(apiKey.trim())}${forceRestart ? '&force=true' : ''}`
      );
      const data = await res.json();
      if (data.connected || data.state === 'open') {
        setIsLiveConnected(true);
        setQrState('open');
        setLiveQrCode(null);
      } else {
        setIsLiveConnected(false);
        setQrState(data.state || 'connecting');
        if (data.base64) {
          setLiveQrCode(
            data.base64.startsWith('data:image')
              ? data.base64
              : `data:image/png;base64,${data.base64}`
          );
        }
      }
    } catch (err) {
      console.error('Erro ao buscar QR code:', err);
    } finally {
      setIsLoadingQr(false);
    }
  }, [instanceName, apiUrl, apiKey]);

  useEffect(() => {
    if (activeTab === 'connection' && selectedProvider === 'evolution') {
      fetchLiveQrCode(false);
      const interval = setInterval(() => fetchLiveQrCode(false), 12000);
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedProvider, fetchLiveQrCode]);

  useEffect(() => {
    const keepWarm = () => {
      fetch('/api/cron/keepalive').catch(() => { });
    };
    keepWarm();
    const warmInterval = setInterval(keepWarm, 4 * 60 * 1000);
    return () => clearInterval(warmInterval);
  }, []);

  const activeMessages = activeContact ? messages[activeContact.id] || [] : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, activeContact?.id]);

  const handleManualRefresh = async () => {
    setIsRefreshingChat(true);
    if (refreshChatData) {
      await refreshChatData();
    }
    setTimeout(() => setIsRefreshingChat(false), 600);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContact || !inputText.trim()) return;
    sendMessage(activeContact.id, inputText);
    setInputText('');
  };

  const handleGenerateAiChatbotReply = async () => {
    if (!activeContact) return;
    setIsGeneratingAi(true);

    try {
      const lastMsg = activeMessages[activeMessages.length - 1]?.text || activeContact.lastMessage;

      const res = await fetch('/api/ai/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: lastMsg,
          contactName: activeContact.name,
          companyName: currentSubaccount.name,
          segment: currentSubaccount.segment,
        }),
      });

      const data = await res.json();
      if (data.response) {
        setInputText(data.response);
      }
    } catch (err) {
      console.error('Erro ao gerar resposta com IA no WhatsApp:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveConnection = () => {
    setIsConnecting(true);
    setTimeout(() => {
      updateWhatsAppConfig(currentSubaccount.id, {
        provider: selectedProvider,
        status: 'connected',
        phone: currentSubaccount.phone,
        instanceName,
        evolutionApiUrl: apiUrl,
        evolutionApiKey: apiKey,
        metaPhoneNumberId: metaPhoneId,
        metaAccessToken: metaToken,
      });
      setIsConnecting(false);
      alert('Configuração de WhatsApp salva e conectada com sucesso!');
    }, 1200);
  };

  const filteredContacts = contacts.filter((c) => {
    if (!c) return false;

    const isGroup =
      (c.phone && c.phone.includes('@g.us')) ||
      (c.tags && c.tags.includes('Grupo WhatsApp')) ||
      c.phone.startsWith('+120') ||
      c.name.includes('@lid') ||
      c.name.toLowerCase().includes('grupo');
    if (isGroup) return false;

    const term = (searchTerm || '').trim().toLowerCase();
    if (!term) return true;
    const nameMatch = (c.name || '').toLowerCase().includes(term);
    const phoneMatch = (c.phone || '').includes(term);
    return nameMatch || phoneMatch;
  });

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      {/* Top Bar with Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#161616] shrink-0">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-white">
            Central WhatsApp e IA
          </h1>
          <p className="text-[13px] text-[#b4b4b4] mt-0.5">
            Atendimento unificado, disparos ativos e configuração da atendente inteligente {botName}.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 p-1 rounded-[6px] bg-[#111111] border border-[#1a1a1a] text-[12px] font-medium">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] transition-colors ${activeTab === 'chat'
                ? 'bg-[#222222] text-white'
                : 'text-[#949494] hover:text-white'
              }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Conversas</span>
            {contacts.length > 0 && (
              <span className="text-[11px] px-1.5 py-0.2 rounded-[4px] bg-[#161616] text-[var(--ok)] tabular-nums">
                {contacts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] transition-colors ${activeTab === 'broadcast'
                ? 'bg-[#222222] text-white'
                : 'text-[#949494] hover:text-white'
              }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Disparos</span>
          </button>

          <button
            onClick={() => setActiveTab('training')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] transition-colors ${activeTab === 'training'
                ? 'bg-[#222222] text-white'
                : 'text-[#949494] hover:text-white'
              }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Atendente IA</span>
          </button>

          <button
            onClick={() => setActiveTab('connection')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] transition-colors ${activeTab === 'connection'
                ? 'bg-[#222222] text-white'
                : 'text-[#949494] hover:text-white'
              }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Conexão</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'chat' && (
        <div className="flex-1 bg-[#111111] rounded-[8px] border border-[#1a1a1a] flex overflow-hidden min-h-0">
          {/* Contacts Sidebar */}
          <div className="w-80 border-r border-[#161616] flex flex-col shrink-0 bg-[#0c0c0c]">
            {/* Search & Refresh */}
            <div className="p-3 border-b border-[#161616] space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-[#949494] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar conversa ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 text-[12px] rounded-[6px] bg-[#161616] text-white placeholder:text-[#949494] border border-[#222222] focus:border-[#444444] focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleManualRefresh}
                  title="Atualizar conversas"
                  className="h-8 w-8 flex items-center justify-center rounded-[6px] bg-[#161616] hover:bg-[#222222] text-[#b4b4b4] border border-[#222222] transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingChat ? 'animate-spin text-[var(--ok)]' : ''}`} />
                </button>
              </div>

              {/* Filter Pills & Quick Broadcast Trigger */}
              <div className="flex items-center justify-between text-[11px] gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-[4px] bg-[#161616] border border-[#262626] text-[var(--ok)] font-medium truncate tabular-nums">
                  <Bot className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">IA ativada ({filteredContacts.length})</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalBroadcastOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-white hover:bg-[#e5e5e5] text-black font-medium text-[11px] transition-colors shrink-0 cursor-pointer"
                  title="Abrir motor de disparo em massa"
                >
                  <Send className="w-3 h-3" />
                  <span>Novo disparo</span>
                </button>
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#161616]">
              {filteredContacts.length === 0 ? (
                <div className="p-6 text-center text-[12px] text-[#949494] space-y-2">
                  <p>Nenhum contato encontrado nesta categoria.</p>
                  <button
                    onClick={() => {
                      setContactFilter('all');
                      setSearchTerm('');
                    }}
                    className="text-white hover:underline text-[12px]"
                  >
                    Limpar filtros
                  </button>
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const isSelected = activeContact?.id === contact.id;
                  const isGroup = (contact.tags && contact.tags.includes('Grupo WhatsApp')) || contact.phone.startsWith('+12036');

                  return (
                    <button
                      key={contact.id}
                      onClick={() => setActiveContact(contact)}
                      className={`w-full p-3 flex items-start gap-3 text-left transition-colors ${isSelected
                          ? 'bg-[#181818] border-l-2 border-white'
                          : 'hover:bg-[#141414]'
                        }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-[#1a1a1a] overflow-hidden shrink-0 relative border border-[#2a2a2a] flex items-center justify-center">
                        <img
                          src={contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || 'Contato')}&background=222222&color=ffffff&bold=true`}
                          alt={contact.name}
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || 'Contato')}&background=222222&color=ffffff&bold=true`;
                          }}
                          className="w-full h-full object-cover"
                        />
                        {contact.unreadCount > 0 && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[var(--ok)] rounded-full border border-black" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-[13px] text-white truncate">
                            {getContactDisplayName(contact.name, contact.phone)}
                          </p>
                          <span className="text-[11px] text-[#949494] shrink-0 tabular-nums">{contact.lastMessageTime}</span>
                        </div>
                        <p className="text-[12px] text-[#949494] truncate mt-0.5">{contact.lastMessage || 'Iniciou conversa'}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {contact.isDecisionMaker || contact.tags?.includes('#DecisorIdentificado') ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-[#222222] text-[var(--warn)] font-medium">
                              Decisor
                            </span>
                          ) : contact.tags?.includes('#ProspeccaoMaps') ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-[#1a1a1a] text-[#b4b4b4]">
                              Maps Lead
                            </span>
                          ) : isGroup ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-[#1a1a1a] text-[#b4b4b4]">
                              Grupo
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-[#1a1a1a] text-[var(--ok)]">
                              Cliente
                            </span>
                          )}
                          <span className="text-[11px] text-[#949494] truncate tabular-nums">{contact.phone}</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Conversation Chat View */}
          {activeContact ? (
            <div className="flex-1 flex flex-col bg-[#080808] min-w-0">
              {/* Chat Header */}
              <div className="p-3.5 bg-[#111111] border-b border-[#161616] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#1a1a1a] overflow-hidden shrink-0 relative border border-[#2a2a2a] flex items-center justify-center">
                    <img
                      src={activeContact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeContact.name || 'Contato')}&background=222222&color=ffffff&bold=true`}
                      alt={activeContact.name}
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeContact.name || 'Contato')}&background=222222&color=ffffff&bold=true`;
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[13px] text-white leading-tight truncate">
                      {getContactDisplayName(activeContact.name, activeContact.phone)}
                    </h3>
                    <p className="text-[11px] text-[#949494] truncate tabular-nums">{activeContact.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(activeContact.isDecisionMaker || activeContact.tags?.includes('#DecisorIdentificado')) && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#1a1a1a] text-[var(--warn)] border border-[#2a2a2a] text-[12px] font-medium">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Decisor identificado</span>
                    </div>
                  )}

                  <button
                    onClick={handleGenerateAiChatbotReply}
                    disabled={isGeneratingAi}
                    className="h-8 flex items-center gap-1.5 px-3 rounded-[6px] bg-[#161616] hover:bg-[#222222] text-white text-[12px] font-medium border border-[#2a2a2a] transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#c6f24e]" />
                    <span>{isGeneratingAi ? 'Gerando...' : 'Sugerir resposta IA'}</span>
                  </button>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#161616] border border-[#222222] text-[var(--ok)] text-[12px] font-medium">
                    <Bot className="w-3.5 h-3.5" />
                    <span>IA ativa</span>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {activeMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-[13px] text-[#949494] space-y-2">
                    <MessageSquare className="w-7 h-7 text-[#444444]" />
                    <p>Nenhuma mensagem nesta conversa ainda.</p>
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const isBot = msg.sender === 'bot';
                    const isContact = msg.sender === 'contact';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isContact ? 'items-start' : 'items-end'}`}
                      >
                        <div
                          className={`max-w-[75%] p-3 rounded-[8px] text-[13px] leading-relaxed ${isContact
                              ? 'bg-[#161616] text-white border border-[#222222]'
                              : isBot
                                ? 'bg-[#1f1f1f] text-white border border-[#333333]'
                                : 'bg-[#222222] text-white border border-[#333333]'
                            }`}
                        >
                          {isBot && (
                            <div className="flex items-center gap-1 text-[11px] text-[#c6f24e] font-medium mb-1">
                              <Bot className="w-3 h-3" />
                              <span>Resposta automática</span>
                            </div>
                          )}

                          {msg.mediaUrl && msg.mediaType === 'audio' && (
                            <div className="mb-2 p-2 rounded-[6px] bg-black/40 flex items-center gap-2">
                              <audio controls src={msg.mediaUrl} className="h-8 w-56 max-w-full" />
                            </div>
                          )}

                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          <div className="flex items-center justify-end gap-1 text-[11px] mt-1 text-[#949494] tabular-nums">
                            <span>{msg.timestamp}</span>
                            {!isContact && <CheckCheck className="w-3.5 h-3.5 text-[#b4b4b4]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSend} className="p-3 bg-[#111111] border-t border-[#161616] flex items-center gap-2 shrink-0">
                {isChatRecording ? (
                  <div className="flex-1 h-9 px-3.5 rounded-[6px] bg-red-950/30 border border-red-500/40 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-300 text-[12px] font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                      <span>
                        Gravando áudio PTT... {Math.floor(chatRecordingSeconds / 60)}:
                        {(chatRecordingSeconds % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={cancelChatAudioRecording}
                        className="px-2.5 py-1 rounded-[4px] bg-[#1a1a1a] hover:bg-[#262626] text-slate-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                        <span>Cancelar</span>
                      </button>
                      <button
                        type="button"
                        onClick={finishAndSendChatAudio}
                        className="px-3 py-1 rounded-[4px] bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Enviar Áudio</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Digite uma mensagem ou grave um áudio ao lado..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="flex-1 h-9 px-3.5 text-[13px] rounded-[6px] bg-[#0a0a0a] text-white placeholder:text-[#949494] border border-[#222222] focus:border-[#444444] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={startChatAudioRecording}
                      title="Gravar áudio de voz (PTT)"
                      className="h-9 px-3 rounded-[6px] bg-[#161616] hover:bg-[#222222] text-emerald-400 border border-[#2a2a2a] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Mic className="w-4 h-4" />
                      <span className="hidden sm:inline text-[12px]">Gravar Áudio</span>
                    </button>
                    <button
                      type="submit"
                      className="h-9 px-3.5 rounded-[6px] bg-white hover:bg-[#e5e5e5] text-black font-medium transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </>
                )}
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[13px] text-[#949494] space-y-2">
              <MessageCircle className="w-8 h-8 text-[#444444]" />
              <p>Selecione uma conversa ao lado para visualizar e interagir.</p>
            </div>
          )}
        </div>
      )}

      {/* Broadcast & Outreach Engine */}
      {activeTab === 'broadcast' && (
        <div className="flex-1 min-h-0 h-full overflow-hidden flex flex-col">
          <MassOutreachModal
            isOpen={true}
            variant="embedded"
            onNavigateToWhatsApp={() => setActiveTab('chat')}
            onNavigateToCrm={() => { }}
          />
        </div>
      )}

      {/* AI Attendant Training & Configuration Studio */}
      {activeTab === 'training' && (
        <div className="flex-1 bg-[#111111] rounded-[8px] border border-[#1a1a1a] p-6 overflow-y-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#161616]">
            <div>
              <h3 className="text-[16px] font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#c6f24e]" />
                <span>Estúdio de treinamento do atendente de IA</span>
              </h3>
              <p className="text-[13px] text-[#b4b4b4] mt-0.5">
                Configure identidade, regras comerciais, tabela de preços e comportamento do atendente para{' '}
                <strong className="text-white font-medium">{currentSubaccount.name}</strong>.
              </p>
            </div>

            {/* Auto-Pilot Toggle */}
            <div className="flex items-center gap-3 bg-[#161616] px-4 py-2.5 rounded-[6px] border border-[#262626]">
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <p className="text-[13px] font-medium text-white">Piloto automático</p>
                  {isTogglingBot && (
                    <RefreshCw className="w-3 h-3 text-[#b4b4b4] animate-spin" />
                  )}
                </div>
                <p className="text-[11px] text-[#949494]">
                  {toggleFeedback ? (
                    <span className={botEnabled ? 'text-[var(--ok)] font-medium' : 'text-[var(--warn)] font-medium'}>
                      {toggleFeedback}
                    </span>
                  ) : botEnabled ? (
                    <span className="text-[var(--ok)] font-medium">Respondendo WhatsApp (Ativo)</span>
                  ) : (
                    <span className="text-[#949494]">Pausado (Somente humano)</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleBot}
                disabled={isTogglingBot}
                title={botEnabled ? 'Desativar atendimento da IA' : 'Ativar atendimento da IA'}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${botEnabled ? 'bg-[var(--ok)]' : 'bg-[#2a2a2a]'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${botEnabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columns 1 & 2: Configuration Form */}
            <div className="lg:col-span-2 space-y-5">
              {/* 1. Identidade */}
              <div className="p-5 rounded-[8px] bg-[#161616] border border-[#222222] space-y-4">
                <h4 className="font-semibold text-[14px] text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-[#949494]" />
                  <span>1. Identidade e tom de voz do atendente</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
                  <div>
                    <label className="block text-[12px] text-[#949494] mb-1.5 font-medium">Nome do atendente virtual</label>
                    <input
                      type="text"
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      placeholder="Ex: Sofia, Lucas, Mariana..."
                      className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] border border-[#262626] text-white focus:outline-none focus:border-[#444444]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-[#949494] mb-1.5 font-medium">Cargo / função</label>
                    <input
                      type="text"
                      value={botRole}
                      onChange={(e) => setBotRole(e.target.value)}
                      placeholder="Ex: Consultora Especialista em Atendimento"
                      className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] border border-[#262626] text-white focus:outline-none focus:border-[#444444]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] text-[#949494] mb-2 font-medium">Estilo e tom de voz</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px]">
                    {[
                      { id: 'consultive', label: 'Consultivo e técnico', desc: 'Passa segurança e orienta' },
                      { id: 'friendly', label: 'Amigável e empático', desc: 'Caloroso e acolhedor' },
                      { id: 'commercial', label: 'Comercial e vendas', desc: 'Foco em agendar e fechar' },
                      { id: 'formal', label: 'Formal e corporativo', desc: 'Polido para empresas' },
                    ].map((tone) => (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => setBotTone(tone.id as any)}
                        className={`p-3 rounded-[6px] border text-left transition-colors ${botTone === tone.id
                            ? 'border-white bg-[#222222] text-white font-medium'
                            : 'border-[#262626] bg-[#0a0a0a] text-[#b4b4b4] hover:border-[#3a3a3a]'
                          }`}
                      >
                        <p className="font-medium text-[12px] text-white">{tone.label}</p>
                        <p className="text-[11px] text-[#949494] mt-0.5">{tone.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Serviços e Preços */}
              <div className="p-5 rounded-[8px] bg-[#161616] border border-[#222222] space-y-3">
                <h4 className="font-semibold text-[14px] text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#949494]" />
                  <span>2. Serviços oferecidos e tabela de preços estimados</span>
                </h4>
                <p className="text-[12px] text-[#949494] leading-relaxed">
                  A IA usará esta tabela para responder dúvidas de valores dos clientes no WhatsApp.
                </p>
                <textarea
                  rows={5}
                  value={servicesAndPricing}
                  onChange={(e) => setServicesAndPricing(e.target.value)}
                  placeholder="Liste os serviços e valores base..."
                  className="w-full p-3 rounded-[6px] bg-[#0a0a0a] border border-[#262626] text-white text-[13px] focus:outline-none focus:border-[#444444]"
                />
              </div>

              {/* 3. Regiões e Condições */}
              <div className="p-5 rounded-[8px] bg-[#161616] border border-[#222222] space-y-4 text-[13px]">
                <h4 className="font-semibold text-[14px] text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#949494]" />
                  <span>3. Regiões atendidas e condições de pagamento</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] text-[#949494] mb-1.5 font-medium">Bairros / cidades atendidas</label>
                    <input
                      type="text"
                      value={coverageAreas}
                      onChange={(e) => setCoverageAreas(e.target.value)}
                      placeholder="Ex: Porto Alegre, Canoas, Grande POA..."
                      className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] border border-[#262626] text-white focus:outline-none focus:border-[#444444]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-[#949494] mb-1.5 font-medium">Formas de pagamento aceitas</label>
                    <input
                      type="text"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      placeholder="Ex: Pix com 5% de desconto, Cartão em até 12x..."
                      className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] border border-[#262626] text-white focus:outline-none focus:border-[#444444]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[12px] text-[#949494] mb-1.5 font-medium">Horário de atendimento da empresa</label>
                    <input
                      type="text"
                      value={businessHours}
                      onChange={(e) => setBusinessHours(e.target.value)}
                      placeholder="Ex: Seg a Sex das 08h às 18h30..."
                      className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] border border-[#262626] text-white focus:outline-none focus:border-[#444444]"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Regras Comerciais e Transbordo */}
              <div className="p-5 rounded-[8px] bg-[#161616] border border-[#222222] space-y-4 text-[13px]">
                <h4 className="font-semibold text-[14px] text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#949494]" />
                  <span>4. Regras comerciais e transbordo para humano</span>
                </h4>

                <div>
                  <label className="block text-[12px] text-[#949494] mb-1.5 font-medium">Instruções obrigatórias para a IA</label>
                  <textarea
                    rows={4}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Regras de atendimento..."
                    className="w-full p-3 rounded-[6px] bg-[#0a0a0a] border border-[#262626] text-white text-[13px] focus:outline-none focus:border-[#444444]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] text-[#949494] mb-1.5 font-medium">Palavras-chave para chamar atendente humano</label>
                  <input
                    type="text"
                    value={humanHandoffKeywords}
                    onChange={(e) => setHumanHandoffKeywords(e.target.value)}
                    placeholder="atendente, humano, pessoa, falar com alguém, cancelamento, urgente"
                    className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] border border-[#262626] text-white focus:outline-none focus:border-[#444444]"
                  />
                  <p className="text-[11px] text-[#949494] mt-1">
                    Se o cliente enviar qualquer uma dessas palavras, o robô pausará a automação e avisará que um humano assumirá a conversa.
                  </p>
                </div>
              </div>

              {/* 5. Chaves de API */}
              <div className="p-5 rounded-[8px] bg-[#161616] border border-[#222222] space-y-4 text-[13px]">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-[14px] text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#c6f24e]" />
                    <span>5. Chave de API de IA (Google Gemini / OpenAI)</span>
                  </h4>
                  <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[#222222] text-[var(--ok)] font-medium">
                    Motor nativo ativo
                  </span>
                </div>

                <p className="text-[12px] text-[#949494] leading-relaxed">
                  O FlowLevel conta com motor conversacional nativo integrado. Para raciocínio generativo ilimitado em conversas abertas, insira sua chave do Google Gemini ou OpenAI abaixo.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[12px] text-[#949494] font-medium">Chave Google Gemini API</label>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-white hover:underline"
                      >
                        Gerar chave &rarr;
                      </a>
                    </div>
                    <input
                      type="password"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] border border-[#262626] text-white focus:outline-none focus:border-[#444444]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] text-[#949494] mb-1.5 font-medium">Chave OpenAI API (Opcional)</label>
                    <input
                      type="password"
                      value={openaiApiKey}
                      onChange={(e) => setOpenaiApiKey(e.target.value)}
                      placeholder="sk-proj-..."
                      className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] border border-[#262626] text-white focus:outline-none focus:border-[#444444]"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between pt-2">
                {saveSuccess ? (
                  <div className="flex items-center gap-2 text-[var(--ok)] text-[13px] font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Treinamento salvo com sucesso no banco de dados.</span>
                  </div>
                ) : (
                  <div className="text-[12px] text-[#949494]">
                    As regras são aplicadas imediatamente às próximas mensagens do WhatsApp.
                  </div>
                )}

                <button
                  onClick={handleSaveAgentTraining}
                  disabled={isSavingAgent}
                  className="h-9 flex items-center gap-2 px-4 rounded-[6px] bg-white hover:bg-[#e5e5e5] text-black text-[13px] font-medium transition-colors disabled:opacity-50"
                >
                  {isSavingAgent ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Salvar treinamento</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Column 3: Interactive Simulator */}
            <div className="space-y-4">
              <div className="p-5 rounded-[8px] bg-[#161616] border border-[#222222] sticky top-4 space-y-4">
                <div className="flex items-center justify-between border-b border-[#222222] pb-3">
                  <h4 className="font-semibold text-[14px] text-white flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-[var(--ok)]" />
                    <span>Simulador em tempo real</span>
                  </h4>
                  <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[#222222] text-[var(--ok)] font-medium">
                    Teste instantâneo
                  </span>
                </div>

                <p className="text-[12px] text-[#949494] leading-relaxed">
                  Envie uma mensagem simulando a dúvida de um cliente para testar como <strong className="text-white">{botName}</strong> responderá:
                </p>

                <div>
                  <label className="block text-[12px] font-medium text-[#b4b4b4] mb-1.5">Mensagem do cliente simulado</label>
                  <textarea
                    rows={3}
                    value={simulationInput}
                    onChange={(e) => setSimulationInput(e.target.value)}
                    placeholder="Ex: Quanto custa a implementação do funil?"
                    className="w-full p-2.5 rounded-[6px] bg-[#0a0a0a] border border-[#262626] text-white text-[13px] focus:outline-none focus:border-[#444444]"
                  />
                </div>

                <button
                  onClick={handleTestSimulation}
                  disabled={isSimulating}
                  className="w-full h-9 flex items-center justify-center gap-2 px-3 rounded-[6px] bg-white hover:bg-[#e5e5e5] text-black text-[13px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSimulating ? 'Gerando resposta...' : 'Testar resposta da IA'}</span>
                </button>

                {simulationResponse && (
                  <div className="pt-3 border-t border-[#222222] space-y-2">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="font-medium text-[var(--ok)] flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5" />
                        <span>Resposta gerada por {botName}:</span>
                      </span>
                    </div>

                    <div className="p-3 rounded-[6px] bg-[#0a0a0a] border border-[#262626] text-[13px] text-[#e5e5e5] leading-relaxed whitespace-pre-wrap">
                      {simulationResponse}
                    </div>

                    <p className="text-[11px] text-[#949494] text-right">
                      Pronto para atendimento no WhatsApp
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Settings Tab */}
      {activeTab === 'connection' && (
        <div className="flex-1 bg-[#111111] rounded-[8px] border border-[#1a1a1a] p-6 overflow-y-auto space-y-6">
          <div>
            <h3 className="text-[16px] font-semibold text-white mb-1">
              Gerenciador de conexão WhatsApp híbrido
            </h3>
            <p className="text-[13px] text-[#b4b4b4]">
              Escolha como esta subconta se conectará ao WhatsApp: Evolution API (QR Code) ou Meta Cloud API Oficial.
            </p>
          </div>

          {/* Provider Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => setSelectedProvider('evolution')}
              className={`p-4 rounded-[8px] border transition-colors cursor-pointer ${selectedProvider === 'evolution'
                  ? 'border-white bg-[#161616]'
                  : 'border-[#1a1a1a] bg-[#0c0c0c] hover:border-[#2a2a2a]'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-[var(--ok)]" />
                  <h4 className="font-semibold text-[14px] text-white">Evolution API (QR Code)</h4>
                </div>
                <input
                  type="radio"
                  name="provider"
                  checked={selectedProvider === 'evolution'}
                  onChange={() => setSelectedProvider('evolution')}
                />
              </div>
              <p className="text-[12px] text-[#949494] leading-relaxed">
                Conexão via QR Code direto do WhatsApp do celular. Sem taxas por mensagem, ideal para atendimento flexível e alto volume.
              </p>
            </div>

            <div
              onClick={() => setSelectedProvider('meta_cloud')}
              className={`p-4 rounded-[8px] border transition-colors cursor-pointer ${selectedProvider === 'meta_cloud'
                  ? 'border-white bg-[#161616]'
                  : 'border-[#1a1a1a] bg-[#0c0c0c] hover:border-[#2a2a2a]'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <h4 className="font-semibold text-[14px] text-white">Meta Cloud API Oficial</h4>
                </div>
                <input
                  type="radio"
                  name="provider"
                  checked={selectedProvider === 'meta_cloud'}
                  onChange={() => setSelectedProvider('meta_cloud')}
                />
              </div>
              <p className="text-[12px] text-[#949494] leading-relaxed">
                API oficial aprovada pela Meta. Máxima estabilidade para grandes operações, com cobrança por conversa oficial.
              </p>
            </div>
          </div>

          {/* Config Forms based on Provider */}
          {selectedProvider === 'evolution' ? (
            <div className="p-5 rounded-[8px] bg-[#161616] border border-[#222222] space-y-4">
              <h4 className="font-semibold text-[14px] text-white">Credenciais da Evolution API</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
                <div>
                  <label className="block text-[12px] text-[#949494] mb-1.5">Nome da instância</label>
                  <input
                    type="text"
                    value={instanceName}
                    onChange={(e) => setInstanceName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '_'))}
                    className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] border border-[#262626] text-white focus:outline-none focus:border-[#444444]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-[#949494] mb-1.5">API URL (Servidor Evolution)</label>
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value.trim().replace(/\s+/g, '-'))}
                    className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] border border-[#262626] text-white focus:outline-none focus:border-[#444444]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[12px] text-[#949494] mb-1.5">Global API Key / Token</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] border border-[#262626] text-white focus:outline-none focus:border-[#444444]"
                  />
                </div>
              </div>

              {/* QR Code Live Section */}
              <div className="mt-4 p-5 rounded-[8px] bg-[#0a0a0a] border border-[#222222]">
                {isLiveConnected || qrState === 'open' ? (
                  <div className="flex items-center gap-4 text-[13px]">
                    <div className="w-12 h-12 rounded-full bg-[#161616] border border-[#262626] text-[var(--ok)] flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[var(--ok)]" />
                        <h5 className="font-semibold text-[14px] text-[var(--ok)]">
                          WhatsApp conectado e operando
                        </h5>
                      </div>
                      <p className="text-[#b4b4b4]">
                        Sua instância <strong className="text-white">{instanceName}</strong> está sincronizada. Todas as mensagens recebidas gerarão leads e acionarão a IA automaticamente.
                      </p>
                      <button
                        onClick={() => fetchLiveQrCode(false)}
                        className="text-[#949494] hover:text-white underline text-[12px] pt-1"
                      >
                        Verificar status novamente
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative shrink-0">
                      {liveQrCode ? (
                        <div className="p-2 bg-white rounded-[8px] border border-[#262626]">
                          <img
                            src={liveQrCode}
                            alt="WhatsApp QR Code"
                            className="w-44 h-44 object-contain rounded-[4px]"
                          />
                        </div>
                      ) : (
                        <div
                          onClick={() => fetchLiveQrCode(true)}
                          className="w-44 h-44 bg-[#161616] rounded-[8px] border border-dashed border-[#333333] flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:border-[#555555] transition-colors"
                        >
                          <RefreshCw className={`w-7 h-7 text-[var(--ok)] ${isLoadingQr ? 'animate-spin' : ''}`} />
                          <span className="text-[12px] font-medium text-[#b4b4b4] mt-2">
                            {isLoadingQr ? 'Gerando QR Code...' : 'Clique para gerar'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-[13px] space-y-2.5 flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-semibold text-[14px] text-white flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-[var(--ok)]" />
                          <span>Escanear QR Code no seu WhatsApp</span>
                        </h5>
                        <button
                          onClick={() => fetchLiveQrCode(true)}
                          disabled={isLoadingQr}
                          className="h-8 flex items-center gap-1.5 px-3 text-[12px] font-medium text-white bg-[#161616] hover:bg-[#222222] border border-[#2a2a2a] rounded-[6px] transition-colors cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoadingQr ? 'animate-spin' : ''}`} />
                          <span>{isLoadingQr ? 'Gerando novo QR...' : 'Gerar novo QR Code'}</span>
                        </button>
                      </div>

                      <ol className="text-[#b4b4b4] space-y-1 pl-4 list-decimal text-[12px]">
                        <li>Abra o <strong className="text-white">WhatsApp</strong> no seu celular</li>
                        <li>Toque em <strong className="text-white">Configurações</strong> &gt; <strong className="text-white">Aparelhos conectados</strong></li>
                        <li>Toque em <strong className="text-white">Conectar um aparelho</strong> e aponte a câmera para o QR Code ao lado</li>
                      </ol>

                      <div className="p-2.5 rounded-[6px] bg-[#161616] border border-[#262626] text-[#b4b4b4] text-[12px] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[var(--ok)]" />
                        <span>Aguardando leitura do aparelho. Conexão automática em tempo real.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-[8px] bg-[#161616] border border-[#222222] space-y-4">
              <h4 className="font-semibold text-[14px] text-white">Credenciais Meta Cloud API Oficial</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
                <div>
                  <label className="block text-[12px] text-[#949494] mb-1.5">Phone Number ID</label>
                  <input
                    type="text"
                    value={metaPhoneId}
                    onChange={(e) => setMetaPhoneId(e.target.value)}
                    className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] border border-[#262626] text-white focus:outline-none focus:border-[#444444] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-[#949494] mb-1.5">WhatsApp Business Account ID (WABA)</label>
                  <input
                    type="text"
                    defaultValue="982374619283741"
                    className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] border border-[#262626] text-white focus:outline-none focus:border-[#444444] tabular-nums"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[12px] text-[#949494] mb-1.5">Permanent Access Token (System User)</label>
                  <input
                    type="password"
                    value={metaToken}
                    onChange={(e) => setMetaToken(e.target.value)}
                    className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] border border-[#262626] text-white focus:outline-none focus:border-[#444444]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[12px] text-[#949494] mb-1.5">Webhook Callback URL</label>
                  <input
                    type="text"
                    readOnly
                    value={`https://flowlevel.vercel.app/api/webhooks/whatsapp`}
                    className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] border border-[#222222] text-[#949494] text-[12px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveConnection}
              disabled={isConnecting}
              className="h-9 flex items-center gap-2 px-4 rounded-[6px] bg-white hover:bg-[#e5e5e5] text-black text-[13px] font-medium transition-colors disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Testando e salvando...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Salvar configuração de conexão</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal de Disparo Rápido */}
      {isModalBroadcastOpen && (
        <MassOutreachModal
          isOpen={isModalBroadcastOpen}
          onClose={() => setIsModalBroadcastOpen(false)}
          variant="modal"
          onNavigateToWhatsApp={() => {
            setIsModalBroadcastOpen(false);
            setActiveTab('chat');
          }}
          onNavigateToCrm={() => { }}
        />
      )}
    </div>
  );
}
