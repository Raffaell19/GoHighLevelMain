'use client';

import React, { useState } from 'react';
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
  } = useApp();

  const [activeTab, setActiveTab] = useState<'chat' | 'connection'>('chat');
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Estados locais para configuração da conexão
  const config = currentSubaccount.whatsappConfig;
  const [selectedProvider, setSelectedProvider] = useState<WhatsAppProvider>(config.provider);
  const [instanceName, setInstanceName] = useState(config.instanceName || 'instancia-principal');
  const [apiUrl, setApiUrl] = useState(config.evolutionApiUrl || 'https://api.evolution.suaempresa.com');
  const [apiKey, setApiKey] = useState(config.evolutionApiKey || 'evo_key_882910398');
  const [metaPhoneId, setMetaPhoneId] = useState(config.metaPhoneNumberId || '102938475610293');
  const [metaToken, setMetaToken] = useState(config.metaAccessToken || 'EAAG...metaTokenExemplo');
  const [isConnecting, setIsConnecting] = useState(false);

  const activeMessages = activeContact ? messages[activeContact.id] || [] : [];

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

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm)
  );

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col space-y-3">
      {/* Top Bar with Mode Switcher */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
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
                {config.status === 'connected' ? 'Conectado' : 'Desconectado'}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Provedor ativo: <strong className="text-slate-700 dark:text-slate-300 capitalize">{config.provider === 'evolution' ? 'Evolution API (QR Code)' : 'Meta Cloud API Oficial'}</strong>
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'chat'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Live Chat & Conversas
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
            <span>Configurar Conexão Híbrida</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'chat' ? (
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex overflow-hidden">
          {/* Contacts Sidebar */}
          <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
            {/* Search */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar conversa ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-transparent focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredContacts.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">Nenhum contato encontrado</div>
              ) : (
                filteredContacts.map((contact) => {
                  const isSelected = activeContact?.id === contact.id;
                  return (
                    <button
                      key={contact.id}
                      onClick={() => setActiveContact(contact)}
                      className={`w-full p-3 flex items-start gap-3 text-left transition ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-slate-800/80 border-l-4 border-emerald-500'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 relative">
                        <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                        {contact.unreadCount > 0 && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-xs text-slate-900 dark:text-slate-200 truncate">{contact.name}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">{contact.lastMessageTime}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{contact.lastMessage}</p>
                        <div className="flex gap-1 mt-1">
                          {contact.tags.map((t) => (
                            <span key={t} className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400">
                              {t}
                            </span>
                          ))}
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
            <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-950/40">
              {/* Chat Header */}
              <div className="p-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={activeContact.avatar} alt={activeContact.name} className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">{activeContact.name}</h3>
                    <p className="text-[11px] text-slate-400">{activeContact.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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
                    <span>IA Ativa</span>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {activeMessages.map((msg) => {
                  const isBot = msg.sender === 'bot';
                  const isContact = msg.sender === 'contact';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isContact ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          isContact
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700/60'
                            : isBot
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-emerald-600 text-white rounded-tr-none'
                        }`}
                      >
                        {isBot && (
                          <div className="flex items-center gap-1 text-[10px] text-blue-200 font-semibold mb-1">
                            <Bot className="w-3 h-3" />
                            <span>Resposta Automática</span>
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
                })}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Digite uma mensagem ou clique em 'Sugerir Resposta IA' acima..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-transparent focus:border-emerald-500 focus:outline-none"
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
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Selecione uma conversa para começar a atender
            </div>
          )}
        </div>
      ) : (
        /* Connection Settings Tab */
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 overflow-y-auto space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Gerenciador de Conexão WhatsApp Híbrido
            </h3>
            <p className="text-xs text-slate-500">
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
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-500" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Evolution API (QR Code)</h4>
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
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Meta Cloud API Oficial</h4>
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
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-4">
              <h4 className="font-bold text-xs uppercase text-slate-400">Credenciais da Evolution API</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">Nome da Instância</label>
                  <input
                    type="text"
                    value={instanceName}
                    onChange={(e) => setInstanceName(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">API URL (Servidor Evolution)</label>
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-500 mb-1">Global API Key / Token</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* QR Code Demo Section */}
              <div className="mt-4 p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-28 h-28 bg-slate-100 dark:bg-slate-800 rounded-lg border-2 border-dashed border-emerald-500 flex flex-col items-center justify-center p-2 text-center">
                  <QrCode className="w-12 h-12 text-emerald-500" />
                  <span className="text-[9px] text-slate-400 mt-1">QR Code Ativo</span>
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Escanear no WhatsApp do Aparelho
                  </p>
                  <p className="text-slate-400">
                    Abra o WhatsApp no celular $\rightarrow$ Configurações $\rightarrow$ Aparelhos Conectados $\rightarrow$ Conectar um Aparelho.
                  </p>
                  <p className="text-emerald-500 font-semibold pt-1">
                    ✓ Status atual: Instância conectada e pronta para disparo
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-4">
              <h4 className="font-bold text-xs uppercase text-slate-400">Credenciais Meta Cloud API Oficial</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">Phone Number ID</label>
                  <input
                    type="text"
                    value={metaPhoneId}
                    onChange={(e) => setMetaPhoneId(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">WhatsApp Business Account ID (WABA)</label>
                  <input
                    type="text"
                    defaultValue="982374619283741"
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-500 mb-1">Permanent Access Token (System User)</label>
                  <input
                    type="password"
                    value={metaToken}
                    onChange={(e) => setMetaToken(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-500 mb-1">Webhook Callback URL</label>
                  <input
                    type="text"
                    readOnly
                    value={`https://flowlevel.app/api/webhooks/whatsapp/${currentSubaccount.id}`}
                    className="w-full p-2.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[11px]"
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
