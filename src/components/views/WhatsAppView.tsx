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
  Clock,
  HelpCircle,
  Play,
  CheckCircle2,
  Users,
  MessageCircle,
  UserCheck,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { WhatsAppProvider } from '@/types';

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

  const [activeTab, setActiveTab] = useState<'chat' | 'training' | 'connection'>('chat');
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [contactFilter, setContactFilter] = useState<'all' | 'direct' | 'groups'>('all');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isRefreshingChat, setIsRefreshingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estados locais para configuração da conexão
  const config = currentSubaccount.whatsappConfig;
  const [selectedProvider, setSelectedProvider] = useState<WhatsAppProvider>(config.provider);
  const [instanceName, setInstanceName] = useState(config.instanceName || 'alves-climatiza--o---el-trica');
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

  // Sincronizar dados de conexão exclusivos quando a subconta mudar
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
  const [botEnabled, setBotEnabled] = useState(true);
  const [servicesAndPricing, setServicesAndPricing] = useState(
    `• Instalação de Ar-Condicionado Split (9.000 a 12.000 BTUs): A partir de R$ 380,00\n• Instalação de Ar-Condicionado (18.000 a 30.000 BTUs): A partir de R$ 550,00\n• Higienização e Limpeza Completa com Laudo: R$ 190,00\n• Carga de Gás e Manutenção Preventiva: A partir de R$ 220,00\n• Serviços e Instalações Elétricas (Quadro, Tomadas, Fiação): Sob consulta com visita técnica`
  );
  const [coverageAreas, setCoverageAreas] = useState('Porto Alegre, Canoas, Novo Hamburgo, São Leopoldo e Região Metropolitana.');
  const [paymentTerms, setPaymentTerms] = useState('Cartão de crédito em até 12x, PIX com 5% de desconto à vista, ou boleto para empresas (PJ).');
  const [businessHours, setBusinessHours] = useState('Segunda a Sexta das 08h às 18h30. Sábados das 08h às 13h.');
  const [customInstructions, setCustomInstructions] = useState(
    `1. Sempre seja cordial, acolhedora e atenciosa.\n2. NUNCA envie respostas de ar-condicionado para quem pergunta sobre elétrica (troca de fiação, painel/quadro elétrico, disjuntores, tomadas).\n3. Para serviços elétricos: explique com autoridade que fazemos visita técnica de avaliação para dimensionar a carga com segurança e passar o orçamento exato, e pergunte o bairro/cidade do imóvel.\n4. Para serviços de ar-condicionado: pergunte a capacidade (BTUs) do aparelho e o bairro para estimar o valor.\n5. Responda em no máximo 2 a 3 frases concisas para manter a conversa fluida e natural no WhatsApp.`
  );
  const [humanHandoffKeywords, setHumanHandoffKeywords] = useState('atendente, falar com atendente, humano, atendente humano, pessoa, reclamacao, urgente');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isSavingAgent, setIsSavingAgent] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Simulador de Atendimento IA
  const [simulationInput, setSimulationInput] = useState('Olá! Quanto custa para instalar um ar condicionado 12.000 BTUs no bairro Centro?');
  const [simulationResponse, setSimulationResponse] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  // Carregar dados de treinamento da IA para a subconta atual
  useEffect(() => {
    if (!currentSubaccount?.id) return;
    async function loadAgentConfig() {
      setIsLoadingConfig(true);
      try {
        const res = await fetch(`/api/ai/agent-config?subaccountId=${currentSubaccount.id}`);
        const data = await res.json();
        if (data.config) {
          const cfg = data.config;
          if (cfg.botName) setBotName(cfg.botName);
          if (cfg.botRole) setBotRole(cfg.botRole);
          if (cfg.botTone) setBotTone(cfg.botTone);
          if (cfg.botEnabled !== undefined) setBotEnabled(cfg.botEnabled);
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

  // Salvar treinamento do Atendente IA
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

  // Testar Simulação do Atendente
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

  const fetchLiveQrCode = useCallback(async () => {
    setIsLoadingQr(true);
    const cleanInst = (instanceName || 'alves-climatiza--o---el-trica').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanUrl = (apiUrl || 'https://evolution-api-kix9.onrender.com').trim().replace(/\s+/g, '-');
    try {
      const res = await fetch(
        `/api/whatsapp/qrcode?instance=${encodeURIComponent(cleanInst)}&apiUrl=${encodeURIComponent(cleanUrl)}&apiKey=${encodeURIComponent(apiKey.trim())}`
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
          setLiveQrCode(data.base64);
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
      fetchLiveQrCode();
      const interval = setInterval(fetchLiveQrCode, 8000);
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedProvider, fetchLiveQrCode]);

  // Manter servidor do WhatsApp acordado em segundo plano (evita sleep do Render)
  useEffect(() => {
    const keepWarm = () => {
      fetch('/api/cron/keepalive').catch(() => {});
    };
    keepWarm();
    const warmInterval = setInterval(keepWarm, 4 * 60 * 1000);
    return () => clearInterval(warmInterval);
  }, []);

  const activeMessages = activeContact ? messages[activeContact.id] || [] : [];

  // Rolar automaticamente para o fim da conversa ao receber novas mensagens
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

  // Gerar resposta com IA para a conversa ativa
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

  // Filtragem de contatos: exibe estritamente conversas reais que ativaram a IA
  const filteredContacts = contacts.filter((c) => {
    if (!c) return false;

    // Exclui estritamente grupos e listas de transmissão
    const isGroup =
      (c.phone && c.phone.includes('@g.us')) ||
      (c.tags && c.tags.includes('Grupo WhatsApp')) ||
      c.phone.startsWith('+120') ||
      c.name.includes('@lid') ||
      c.name.toLowerCase().includes('grupo');
    if (isGroup) return false;

    // Filtro de Busca por Texto
    const term = (searchTerm || '').trim().toLowerCase();
    if (!term) return true;
    const nameMatch = (c.name || '').toLowerCase().includes(term);
    const phoneMatch = (c.phone || '').includes(term);
    return nameMatch || phoneMatch;
  });

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col space-y-3">
      {/* Top Bar with Mode Switcher */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Central WhatsApp Omnichannel</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  config.status === 'connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {config.status === 'connected' ? 'Conectado (Evolution API)' : 'Desconectado'}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Instância:{' '}
              <strong className="text-slate-700 dark:text-slate-300">
                {instanceName}
              </strong>{' '}
              • Subconta: <strong className="text-cyan-400">{currentSubaccount.name}</strong>
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                activeTab === 'chat'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Live Chat & Conversas</span>
              {contacts.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400">
                  {contacts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('training')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                activeTab === 'training'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Treinamento do Atendente IA</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold uppercase tracking-wider">
                Cérebro IA
              </span>
            </button>

            <button
              onClick={() => setActiveTab('connection')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                activeTab === 'connection'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Conexão WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'chat' && (
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex overflow-hidden min-h-0">
          {/* Contacts Sidebar */}
          <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 bg-slate-900/50">
            {/* Search & Refresh */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar conversa ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-transparent focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleManualRefresh}
                  title="Atualizar Conversas em Tempo Real"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingChat ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Conversas com IA Ativada ({filteredContacts.length})</span>
                </div>
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredContacts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                  <p>Nenhum contato encontrado nesta categoria.</p>
                  <button
                    onClick={() => {
                      setContactFilter('all');
                      setSearchTerm('');
                    }}
                    className="text-emerald-400 hover:underline text-[11px]"
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
                      className={`w-full p-3 flex items-start gap-3 text-left transition ${
                        isSelected
                          ? 'bg-slate-800/90 border-l-4 border-emerald-500'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden shrink-0 relative">
                        <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                        {contact.unreadCount > 0 && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-xs text-slate-100 truncate">{contact.name}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">{contact.lastMessageTime}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{contact.lastMessage || 'Iniciou conversa'}</p>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {contact.isDecisionMaker || contact.tags?.includes('#DecisorIdentificado') ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                              🎯 Decisor
                            </span>
                          ) : contact.tags?.includes('#ProspeccaoMaps') ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              Maps Lead
                            </span>
                          ) : isGroup ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              Grupo
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Cliente
                            </span>
                          )}
                          <span className="text-[9px] text-slate-500 truncate">{contact.phone}</span>
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
            <div className="flex-1 flex flex-col bg-slate-950/40 min-w-0">
              {/* Chat Header */}
              <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={activeContact.avatar} alt={activeContact.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs text-white leading-tight truncate">{activeContact.name}</h3>
                    <p className="text-[11px] text-slate-400 truncate">{activeContact.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(activeContact.isDecisionMaker || activeContact.tags?.includes('#DecisorIdentificado')) && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold animate-pulse">
                      <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Decisor Identificado • Atendimento Humanizado</span>
                    </div>
                  )}

                  <button
                    onClick={handleGenerateAiChatbotReply}
                    disabled={isGeneratingAi}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-semibold border border-blue-500/20 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingAi ? 'Pensando com IA...' : 'Sugerir Resposta IA'}</span>
                  </button>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                    <Bot className="w-3.5 h-3.5" />
                    <span>IA Ativa no WhatsApp</span>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {activeMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-600 stroke-1" />
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
                          className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                            isContact
                              ? 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/60'
                              : isBot
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : 'bg-emerald-600 text-white rounded-tr-none'
                          }`}
                        >
                          {isBot && (
                            <div className="flex items-center gap-1 text-[10px] text-blue-200 font-semibold mb-1">
                              <Bot className="w-3 h-3" />
                              <span>Resposta Automática Treinada</span>
                            </div>
                          )}

                          {msg.mediaUrl && msg.mediaType === 'audio' && (
                            <div className="mb-2 p-2 rounded-xl bg-black/25 flex items-center gap-2">
                              <audio controls src={msg.mediaUrl} className="h-8 w-56 max-w-full" />
                            </div>
                          )}

                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          <div
                            className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                              isContact ? 'text-slate-400' : 'text-slate-200'
                            }`}
                          >
                            <span>{msg.timestamp}</span>
                            {!isContact && <CheckCheck className="w-3.5 h-3.5 text-cyan-200" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Digite uma mensagem ou clique em 'Sugerir Resposta IA' acima..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-4 py-2 text-xs rounded-xl bg-slate-800 text-slate-100 placeholder:text-slate-400 border border-transparent focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-xs text-slate-400 space-y-2">
              <MessageCircle className="w-10 h-10 text-slate-600" />
              <p>Selecione uma conversa ao lado para visualizar e interagir.</p>
            </div>
          )}
        </div>
      )}

      {/* AI Attendant Training & Configuration Studio */}
      {activeTab === 'training' && (
        <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 p-6 overflow-y-auto space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Estúdio de Treinamento do Atendente de IA</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure a identidade, regras comerciais, tabela de preços e comportamento do seu atendente no WhatsApp para{' '}
                <strong className="text-cyan-400">{currentSubaccount.name}</strong>.
              </p>
            </div>

            {/* Auto-Pilot Toggle */}
            <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
              <div className="text-right">
                <p className="text-xs font-semibold text-white">Piloto Automático</p>
                <p className="text-[10px] text-slate-400">
                  {botEnabled ? 'Respondendo WhatsApp' : 'Pausado (Somente Humano)'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBotEnabled(!botEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  botEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    botEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colunas 1 e 2: Formulário de Configuração & Base de Conhecimento */}
            <div className="lg:col-span-2 space-y-5">
              {/* Identidade do Atendente */}
              <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-800 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>1. Identidade & Tom de Voz do Atendente</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Nome do Atendente Virtual</label>
                    <input
                      type="text"
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      placeholder="Ex: Sofia, Lucas, Mariana..."
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Cargo / Função</label>
                    <input
                      type="text"
                      value={botRole}
                      onChange={(e) => setBotRole(e.target.value)}
                      placeholder="Ex: Consultora Especialista em Atendimento"
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-2 font-medium text-xs">Estilo e Tom de Voz</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { id: 'consultive', label: 'Consultivo & Técnico', desc: 'Passa segurança e orienta' },
                      { id: 'friendly', label: 'Amigável & Empático', desc: 'Caloroso e acolhedor' },
                      { id: 'commercial', label: 'Comercial & Vendas', desc: 'Foco em agendar e fechar' },
                      { id: 'formal', label: 'Formal & Corporativo', desc: 'Polido para grandes empresas' },
                    ].map((tone) => (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => setBotTone(tone.id as any)}
                        className={`p-3 rounded-lg border text-left transition ${
                          botTone === tone.id
                            ? 'border-blue-500 bg-blue-500/10 text-white font-semibold'
                            : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <p className="font-bold text-xs">{tone.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{tone.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Base de Conhecimento: Serviços e Preços */}
              <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-800 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>2. Serviços Oferecidos & Tabela de Preços Estimados</span>
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  A IA usará esta tabela para responder dúvidas de valores dos clientes no WhatsApp, sempre estimando a partir dos valores abaixo.
                </p>
                <textarea
                  rows={5}
                  value={servicesAndPricing}
                  onChange={(e) => setServicesAndPricing(e.target.value)}
                  placeholder="Liste os serviços e valores base..."
                  className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Regiões, Horários e Condições */}
              <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-800 space-y-4 text-xs">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>3. Regiões Atendidas & Condições de Pagamento</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Bairros / Cidades Atendidas</label>
                    <input
                      type="text"
                      value={coverageAreas}
                      onChange={(e) => setCoverageAreas(e.target.value)}
                      placeholder="Ex: Porto Alegre, Canoas, Grande POA..."
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Formas de Pagamento Aceitas</label>
                    <input
                      type="text"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      placeholder="Ex: Pix com 5% de desconto, Cartão em até 12x..."
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1 font-medium">Horário de Atendimento da Empresa</label>
                    <input
                      type="text"
                      value={businessHours}
                      onChange={(e) => setBusinessHours(e.target.value)}
                      placeholder="Ex: Seg a Sex das 08h às 18h30..."
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Instruções Especiais e Transbordo Humano */}
              <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-800 space-y-4 text-xs">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  <span>4. Regras Comerciais & Transbordo para Humano</span>
                </h4>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Instruções Obrigatórias para a IA</label>
                  <textarea
                    rows={4}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Regras de atendimento..."
                    className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Palavras-chave para Chamar Atendente Humano</label>
                  <input
                    type="text"
                    value={humanHandoffKeywords}
                    onChange={(e) => setHumanHandoffKeywords(e.target.value)}
                    placeholder="atendente, humano, pessoa, falar com alguém, cancelamento, urgente"
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Se o cliente enviar qualquer uma dessas palavras, o robô pausará a automação e avisará que um humano assumirá a conversa.
                  </p>
                </div>
              </div>

              {/* 5. Chaves de API de Inteligência Artificial */}
              <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-800 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>5. Chave de API de IA (Google Gemini / OpenAI)</span>
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                    Motor Nativo Inteligente Ativo
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  O FlowLevel já conta com nosso <strong>Motor Conversacional Nativo</strong> que interpreta saudações, dúvidas, preços e regiões com total coerência e naturalidade. Caso deseje raciocínio generativo ilimitado para conversas abertas e complexas, insira sua chave gratuita do <strong>Google Gemini</strong> abaixo:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-400 font-medium">Chave Google Gemini API (Recomendado - Grátis)</label>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-400 hover:underline"
                      >
                        Gerar chave grátis &rarr;
                      </a>
                    </div>
                    <input
                      type="password"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Chave OpenAI API (Opcional)</label>
                    <input
                      type="password"
                      value={openaiApiKey}
                      onChange={(e) => setOpenaiApiKey(e.target.value)}
                      placeholder="sk-proj-..."
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Botão de Salvar Treinamento */}
              <div className="flex items-center justify-between pt-2">
                {saveSuccess ? (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold animate-pulse">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Treinamento salvo com sucesso no banco de dados!</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500">
                    As regras são aplicadas imediatamente a todas as próximas mensagens do WhatsApp.
                  </div>
                )}

                <button
                  onClick={handleSaveAgentTraining}
                  disabled={isSavingAgent}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
                >
                  {isSavingAgent ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Salvando Treinamento...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Salvar Treinamento do Atendente</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Coluna 3: Simulador e Validador Interativo */}
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700 sticky top-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <h4 className="font-bold text-xs uppercase text-white flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Simulador em Tempo Real</span>
                  </h4>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    Teste Instantâneo
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Envie uma mensagem simulando a dúvida de um cliente para testar como sua atendente <strong>{botName}</strong> vai responder com os dados configurados:
                </p>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Mensagem do Cliente Simulado</label>
                  <textarea
                    rows={3}
                    value={simulationInput}
                    onChange={(e) => setSimulationInput(e.target.value)}
                    placeholder="Ex: Quanto custa a limpeza de 2 aparelhos de ar?"
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  onClick={handleTestSimulation}
                  disabled={isSimulating}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSimulating ? 'Gerando resposta treinada...' : 'Testar Resposta da IA'}</span>
                </button>

                {simulationResponse && (
                  <div className="pt-3 border-t border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        <Bot className="w-3 h-3" />
                        <span>Resposta gerada por {botName}:</span>
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 leading-relaxed shadow-inner whitespace-pre-wrap">
                      {simulationResponse}
                    </div>

                    <p className="text-[10px] text-slate-400 text-right">
                      Pronto para atendimento no WhatsApp ✅
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
        <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 p-6 overflow-y-auto space-y-6">
          <div>
            <h3 className="text-base font-bold text-white mb-1">
              Gerenciador de Conexão WhatsApp Híbrido
            </h3>
            <p className="text-xs text-slate-400">
              Escolha como esta subconta se conectará ao WhatsApp. Você pode alternar entre API Open-Source (Evolution API) e Meta Cloud API Oficial a qualquer momento.
            </p>
          </div>

          {/* Provider Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => setSelectedProvider('evolution')}
              className={`p-4 rounded-xl border-2 transition cursor-pointer ${
                selectedProvider === 'evolution'
                  ? 'border-emerald-500 bg-emerald-500/5'
                  : 'border-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-500" />
                  <h4 className="font-bold text-sm text-white">Evolution API (QR Code)</h4>
                </div>
                <input
                  type="radio"
                  name="provider"
                  checked={selectedProvider === 'evolution'}
                  onChange={() => setSelectedProvider('evolution')}
                />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Conexão instantânea via QR Code direto do WhatsApp do celular. Sem taxas por mensagem, ideal para chatbot flexível e alto volume.
              </p>
            </div>

            <div
              onClick={() => setSelectedProvider('meta_cloud')}
              className={`p-4 rounded-xl border-2 transition cursor-pointer ${
                selectedProvider === 'meta_cloud'
                  ? 'border-blue-500 bg-blue-500/5'
                  : 'border-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                  <h4 className="font-bold text-sm text-white">Meta Cloud API Oficial</h4>
                </div>
                <input
                  type="radio"
                  name="provider"
                  checked={selectedProvider === 'meta_cloud'}
                  onChange={() => setSelectedProvider('meta_cloud')}
                />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                API Oficial aprovada pela Meta/Facebook. Máxima estabilidade para grandes empresas, cobrança por conversa oficial.
              </p>
            </div>
          </div>

          {/* Config Forms based on Provider */}
          {selectedProvider === 'evolution' ? (
            <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-4">
              <h4 className="font-bold text-xs uppercase text-slate-400">Credenciais da Evolution API</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Nome da Instância</label>
                  <input
                    type="text"
                    value={instanceName}
                    onChange={(e) => setInstanceName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '_'))}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">API URL (Servidor Evolution)</label>
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value.trim().replace(/\s+/g, '-'))}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1">Global API Key / Token</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* QR Code Live Section */}
              <div className="mt-4 p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
                {isLiveConnected || qrState === 'open' ? (
                  <div className="flex items-center gap-4 text-xs">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <h5 className="font-bold text-sm text-emerald-400">
                          WhatsApp Conectado e Operando!
                        </h5>
                      </div>
                      <p className="text-slate-400">
                        Sua instância <strong>{instanceName}</strong> está sincronizada. Todas as mensagens recebidas gerarão Leads e dispararão IA automaticamente.
                      </p>
                      <button
                        onClick={fetchLiveQrCode}
                        className="text-slate-400 hover:text-slate-200 underline text-[11px] pt-1"
                      >
                        Verificar status novamente
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative group shrink-0">
                      {liveQrCode ? (
                        <div className="p-2 bg-white rounded-xl shadow-lg border-2 border-emerald-500/30">
                          <img
                            src={liveQrCode}
                            alt="WhatsApp QR Code"
                            className="w-44 h-44 object-contain rounded-lg"
                          />
                        </div>
                      ) : (
                        <div
                          onClick={fetchLiveQrCode}
                          className="w-44 h-44 bg-slate-800 rounded-xl border-2 border-dashed border-emerald-500/50 flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:border-emerald-400 transition"
                        >
                          <RefreshCw className={`w-8 h-8 text-emerald-500 ${isLoadingQr ? 'animate-spin' : ''}`} />
                          <span className="text-[11px] font-semibold text-slate-400 mt-2">
                            {isLoadingQr ? 'Gerando QR Code...' : 'Clique para carregar'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs space-y-2 flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-sm text-white flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-emerald-500" />
                          <span>Escanear QR Code no seu WhatsApp</span>
                        </h5>
                        <button
                          onClick={fetchLiveQrCode}
                          disabled={isLoadingQr}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoadingQr ? 'animate-spin' : ''}`} />
                          <span>{isLoadingQr ? 'Atualizando...' : 'Atualizar QR Code'}</span>
                        </button>
                      </div>

                      <ol className="text-slate-300 space-y-1 pl-4 list-decimal text-[11px]">
                        <li>Abra o <strong>WhatsApp</strong> no seu celular</li>
                        <li>Toque em <strong>Configurações</strong> (ou 3 pontinhos) &gt; <strong>Aparelhos Conectados</strong></li>
                        <li>Toque em <strong>Conectar um Aparelho</strong> e aponte a câmera para o QR Code ao lado</li>
                      </ol>

                      <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>Aguardando leitura do aparelho... Conexão automática em tempo real.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-4">
              <h4 className="font-bold text-xs uppercase text-slate-400">Credenciais Meta Cloud API Oficial</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number ID</label>
                  <input
                    type="text"
                    value={metaPhoneId}
                    onChange={(e) => setMetaPhoneId(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">WhatsApp Business Account ID (WABA)</label>
                  <input
                    type="text"
                    defaultValue="982374619283741"
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1">Permanent Access Token (System User)</label>
                  <input
                    type="password"
                    value={metaToken}
                    onChange={(e) => setMetaToken(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1">Webhook Callback URL</label>
                  <input
                    type="text"
                    readOnly
                    value={`https://flowlevel.vercel.app/api/webhooks/whatsapp`}
                    className="w-full p-2.5 rounded-lg bg-slate-800 text-slate-400 font-mono text-[11px]"
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Testando e Salvando...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Salvar Configuração de Conexão</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
