'use client';

import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ProspectItem } from '@/types';

interface MassOutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeads: ProspectItem[];
  onNavigateToWhatsApp?: () => void;
  onNavigateToCrm?: () => void;
}

export function MassOutreachModal({
  isOpen,
  onClose,
  selectedLeads,
  onNavigateToWhatsApp,
  onNavigateToCrm,
}: MassOutreachModalProps) {
  const { currentSubaccount, dispatchWhatsAppLead, handleInboundLeadResponse, stages } = useApp();

  // Filtrar apenas leads que tenham telefone válido
  const validLeads = selectedLeads.filter(
    (l) => l.phone && l.phone.replace(/[^0-9]/g, '').length >= 8
  );

  // Estados de Abas / Configurações
  const [activeStep, setActiveStep] = useState<'config' | 'sending' | 'finished'>('config');

  // Templates de abordagem pré-configurados
  const templates = [
    {
      id: 'decisor_direto',
      title: '🎯 Filtro Direto de Proprietário / Decisor',
      description: 'Ideal para descobrir rápido quem manda na empresa sem intermediários.',
      text: 'Olá time da {{empresa}}, tudo bem? Sou o Rafael da Connect Digital aqui em {{cidade}}. Poderia me confirmar se este é o WhatsApp direto do proprietário ou responsável pelas decisões da empresa?',
    },
    {
      id: 'google_maps_elogio',
      title: '⭐ Elogio Google Maps + Parceria B2B',
      description: 'Gera reciprocidade citando a nota estelar e avaliações do Google.',
      text: 'Oi, pessoal da {{empresa}}! Acompanho o destaque de vocês em {{categoria}} e vi a excelente nota de {{avaliacao}} ⭐ no Google Maps. Sou o Rafael da Connect Digital e temos soluções exclusivas de captação e automação para apresentar à diretoria. Seria você o responsável?',
    },
    {
      id: 'economia_manutencao',
      title: '💼 Oportunidade Comercial & Automação B2B',
      description: 'Apresentação de CRM, prospecção e automações para empresas locais.',
      text: 'Olá {{empresa}}, tudo bem? Aqui é da Connect Digital. Estamos selecionando empresas referência em {{cidade}} para uma parceria especial de captação e automação de vendas. Gostaria de saber quem é a pessoa responsável por avaliar essa proposta?',
    },
    {
      id: 'custom',
      title: '✍️ Mensagem Personalizada',
      description: 'Escreva seu próprio texto livre usando as tags dinâmicas.',
      text: 'Olá {{empresa}}, tudo bem? Gostaria de saber se falo com o decisor ou proprietário da empresa.',
    },
  ];

  const [selectedTemplateId, setSelectedTemplateId] = useState('decisor_direto');
  const [messageText, setMessageText] = useState(templates[0].text);
  const [delaySeconds, setDelaySeconds] = useState(8);

  // Gravação de Áudio
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [selectedDemoAudio, setSelectedDemoAudio] = useState<'custom' | 'demo1' | 'demo2'>('demo1');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Estados de Disparo
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dispatchLogs, setDispatchLogs] = useState<
    { leadName: string; phone: string; status: 'pending' | 'sending' | 'success' | 'error'; message: string; time: string }[]
  >([]);
  const [lastDispatchedContactId, setLastDispatchedContactId] = useState<string | null>(null);

  // Atualizar texto quando o template muda
  useEffect(() => {
    const t = templates.find((item) => item.id === selectedTemplateId);
    if (t && selectedTemplateId !== 'custom') {
      setMessageText(t.text);
    }
  }, [selectedTemplateId]);

  // Lead de exemplo para preview
  const sampleLead = validLeads[0] || {
    name: 'Esquadrias Vale dos Sinos',
    phone: '(51) 3594-1122',
    address: 'Rua Bento Gonçalves, 1420 - Centro, Novo Hamburgo - RS',
    rating: 4.8,
    category: 'Fábrica de Esquadrias',
  };

  // Helper para substituir tags
  const renderPersonalizedText = (template: string, lead: any) => {
    const cityName = lead.address?.split('-')?.[1]?.trim()?.split(',')?.[0]?.trim() || 'sua região';
    return template
      .replace(/{{empresa}}/g, lead.name || 'sua empresa')
      .replace(/{{categoria}}/g, lead.category || 'seu segmento')
      .replace(/{{cidade}}/g, cityName)
      .replace(/{{avaliacao}}/g, lead.rating ? lead.rating.toString() : '5.0');
  };

  // Funções do Gravador de Áudio com Web Audio API
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
        setRecordedAudioUrl(url);
        setSelectedDemoAudio('custom');
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      alert('Não foi possível acessar seu microfone. Verifique a permissão do navegador.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const togglePlayAudio = () => {
    if (!audioPlayerRef.current) return;
    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  // URL do áudio ativo
  const activeAudioUrl =
    selectedDemoAudio === 'custom' && recordedAudioUrl
      ? recordedAudioUrl
      : selectedDemoAudio === 'demo1'
      ? 'https://cdn.freesound.org/previews/608/608645_11861866-lq.mp3' // Áudio leve de teste
      : 'https://cdn.freesound.org/previews/608/608645_11861866-lq.mp3';

  // Executar Disparo em Massa
  const handleStartDispatch = async () => {
    if (validLeads.length === 0) return;

    setActiveStep('sending');
    setCurrentIndex(0);
    setIsPaused(false);

    // Inicializar logs
    const initialLogs = validLeads.map((l) => ({
      leadName: l.name,
      phone: l.phone,
      status: 'pending' as const,
      message: 'Na fila de disparo',
      time: '--:--',
    }));
    setDispatchLogs(initialLogs);

    let dispatchedIds: string[] = [];

    // Loop com cadência anti-bloqueio
    for (let i = 0; i < validLeads.length; i++) {
      setCurrentIndex(i);
      const lead = validLeads[i];

      // Atualizar status para enviando
      setDispatchLogs((prev) =>
        prev.map((log, idx) =>
          idx === i ? { ...log, status: 'sending', message: 'Enviando mensagem & áudio...' } : log
        )
      );

      const personalizedMessage = renderPersonalizedText(messageText, lead);

      // Disparar via AppContext
      try {
        const res = await dispatchWhatsAppLead({
          leadName: lead.name,
          leadPhone: lead.phone,
          companyName: lead.name,
          city: lead.address,
          category: lead.category,
          rating: lead.rating,
          text: personalizedMessage,
          mediaUrl: isAudioEnabled ? activeAudioUrl : undefined,
          mediaType: isAudioEnabled ? 'audio' : undefined,
        });

        if (res.contactId) {
          dispatchedIds.push(res.contactId);
          setLastDispatchedContactId(res.contactId);
        }

        // Marcar log como sucesso
        setDispatchLogs((prev) =>
          prev.map((log, idx) =>
            idx === i
              ? {
                  ...log,
                  status: 'success',
                  message: 'Enviado com sucesso no WhatsApp',
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                }
              : log
          )
        );
      } catch (err) {
        console.error('Erro no disparo:', err);
        setDispatchLogs((prev) =>
          prev.map((log, idx) =>
            idx === i
              ? {
                  ...log,
                  status: 'error',
                  message: 'Falha no envio',
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                }
              : log
          )
        );
      }

      // Delay anti-bloqueio (exceto no último)
      if (i < validLeads.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));
      }
    }

    setActiveStep('finished');
  };

  // Simulação de Resposta do Decisor (Ponto 1 & 2 solicitados pelo usuário)
  const [isSimulatingReply, setIsSimulatingReply] = useState(false);
  const [simulatedReplySuccess, setSimulatedReplySuccess] = useState(false);

  const handleSimulateDecisionMakerReply = async () => {
    if (!lastDispatchedContactId && validLeads.length === 0) return;

    setIsSimulatingReply(true);
    const targetContactId = lastDispatchedContactId || 'contact_outreach_sample';
    const sampleTargetLead = validLeads[0];

    const replyText = `Olá Rafael! Sou o proprietário sim. Como funciona essa proposta de vocês?`;

    await handleInboundLeadResponse({
      contactId: targetContactId,
      responseText: replyText,
      prospectData: {
        company: sampleTargetLead?.name || 'Esquadrias Vale dos Sinos',
        city: sampleTargetLead?.address || 'Novo Hamburgo - RS',
        category: sampleTargetLead?.category || 'Fábrica de Esquadrias',
        phone: sampleTargetLead?.phone,
      },
    });

    setIsSimulatingReply(false);
    setSimulatedReplySuccess(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Disparo em Massa WhatsApp & Filtro de Decisor
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {validLeads.length} Leads c/ WhatsApp
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Envie áudios gravados e mensagens personalizadas para filtrar o dono/decisor e qualificar o lead automaticamente no CRM.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeStep === 'config' && (
            <div className="space-y-6">
              {/* Aviso caso algum lead não tenha telefone */}
              {selectedLeads.length > validLeads.length && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    {selectedLeads.length - validLeads.length} leads foram desmarcados por não possuírem número de telefone válido.
                  </span>
                </div>
              )}

              {/* Grid 2 Colunas: Configurações & Preview ao Vivo */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Coluna Esquerda: Templates e Gravação */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Escolha do Template / Abordagem */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        Selecione o Script de Qualificação
                      </span>
                      <span className="text-[11px] text-slate-500">Tags dinâmicas automáticas</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {templates.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => setSelectedTemplateId(tpl.id)}
                          className={`p-3 rounded-xl text-left border transition text-xs flex flex-col justify-between ${
                            selectedTemplateId === tpl.id
                              ? 'bg-emerald-950/30 border-emerald-500/60 text-white shadow-sm ring-1 ring-emerald-500/40'
                              : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-slate-200">{tpl.title}</div>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{tpl.description}</p>
                          </div>
                          {selectedTemplateId === tpl.id && (
                            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold mt-2">
                              <Check className="w-3 h-3" />
                              <span>Selecionado</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Edição do Texto da Mensagem */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">
                        Mensagem de Texto (Pergunta-Chave ao Decisor)
                      </label>
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{'{{empresa}}'}</span>
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{'{{cidade}}'}</span>
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{'{{categoria}}'}</span>
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{'{{avaliacao}}'}</span>
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      value={messageText}
                      onChange={(e) => {
                        setMessageText(e.target.value);
                        setSelectedTemplateId('custom');
                      }}
                      className="w-full p-3 rounded-xl bg-slate-800/80 text-white border border-slate-700 text-xs focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                      placeholder="Digite a mensagem que será enviada aos estabelecimentos..."
                    />
                  </div>

                  {/* Fluxo de Áudio Humanizado (Solicitado pelo Usuário) */}
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Mic className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">Áudio de Apresentação (PTT Humanizado)</h4>
                          <p className="text-[11px] text-slate-400">
                            Disparado como se tivesse sido gravado na hora no WhatsApp
                          </p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAudioEnabled}
                          onChange={(e) => setIsAudioEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    {isAudioEnabled && (
                      <div className="pt-2 border-t border-slate-700/60 space-y-3">
                        {/* Gravador com Microfone Real */}
                        <div className="flex flex-wrap items-center gap-2">
                          {!isRecording ? (
                            <button
                              type="button"
                              onClick={startRecording}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition"
                            >
                              <Mic className="w-3.5 h-3.5" />
                              <span>Gravar com meu Microfone</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={stopRecording}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-red-500 text-red-400 text-xs font-bold animate-pulse transition"
                            >
                              <Square className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                              <span>Parar Gravação ({recordingSeconds}s)</span>
                            </button>
                          )}

                          {recordedAudioUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDemoAudio('custom');
                                togglePlayAudio();
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-medium transition"
                            >
                              {isPlayingAudio && selectedDemoAudio === 'custom' ? (
                                <Pause className="w-3.5 h-3.5" />
                              ) : (
                                <Play className="w-3.5 h-3.5" />
                              )}
                              <span>Ouvir meu Áudio Gravado</span>
                            </button>
                          )}

                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <span className="text-slate-500">ou usar:</span>
                            <button
                              type="button"
                              onClick={() => setSelectedDemoAudio('demo1')}
                              className={`px-2 py-1 rounded text-[11px] ${
                                selectedDemoAudio === 'demo1'
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              Áudio Padrão (0:14s)
                            </button>
                          </div>
                        </div>

                        {/* Player de áudio invisível */}
                        <audio
                          ref={audioPlayerRef}
                          src={activeAudioUrl}
                          onEnded={() => setIsPlayingAudio(false)}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>

                  {/* Intervalo Anti-Bloqueio */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/30 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="text-xs font-semibold text-slate-200">
                          Proteção Anti-Bloqueio (Cadência de Envio)
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Intervalo inteligente entre mensagens para proteger o chip
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={delaySeconds}
                        onChange={(e) => setDelaySeconds(Number(e.target.value))}
                        className="p-1.5 rounded-lg bg-slate-800 text-white border border-slate-700 text-xs font-semibold focus:outline-none"
                      >
                        <option value={5}>5 seg (Rápido)</option>
                        <option value={8}>8 seg (Recomendado)</option>
                        <option value={12}>12 seg (Seguro)</option>
                        <option value={18}>18 seg (Ultra Seguro)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Coluna Direita: Live Preview do WhatsApp */}
                <div className="lg:col-span-5 space-y-3">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Prévia no WhatsApp do Estabelecimento</span>
                    <span className="text-[11px] text-emerald-400">Tempo Real</span>
                  </label>

                  {/* Simulação de Celular / Chat WhatsApp */}
                  <div className="rounded-2xl border border-slate-700/80 bg-slate-950 overflow-hidden shadow-lg flex flex-col">
                    {/* Header do Chat WhatsApp */}
                    <div className="p-3 bg-emerald-900/60 border-b border-emerald-800/40 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                        FL
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">
                          {currentSubaccount.name} (Rafael)
                        </div>
                        <div className="text-[10px] text-emerald-300">Online no WhatsApp</div>
                      </div>
                    </div>

                    {/* Mensagens do Preview */}
                    <div className="p-4 space-y-3 bg-[#0b141a] min-h-[260px] flex flex-col justify-end">
                      {/* Áudio preview se ativado */}
                      {isAudioEnabled && (
                        <div className="self-end bg-[#005c4b] text-white p-2.5 rounded-2xl rounded-tr-none max-w-[85%] shadow-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={togglePlayAudio}
                              className="w-7 h-7 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center"
                            >
                              {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            </button>
                            <div className="flex-1 space-y-1">
                              <div className="h-1 bg-emerald-700 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-300 w-1/3 animate-pulse" />
                              </div>
                              <div className="flex justify-between text-[9px] text-emerald-200">
                                <span>0:14</span>
                                <span>Áudio de Apresentação</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mensagem de texto com tags renderizadas */}
                      <div className="self-end bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-none max-w-[85%] text-xs shadow-sm leading-relaxed">
                        <p>{renderPersonalizedText(messageText, sampleLead)}</p>
                        <div className="text-[9px] text-emerald-300 text-right mt-1">
                          15:42 ✓✓
                        </div>
                      </div>

                      {/* Informação sobre o contato */}
                      <div className="text-center pt-2">
                        <span className="text-[10px] text-slate-500 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
                          Destinatário exemplo: {sampleLead.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resumo da Automação */}
                  <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-900/50 space-y-2 text-xs">
                    <div className="font-bold text-blue-300 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-blue-400" />
                      <span>Automação do Filtro Inteligente:</span>
                    </div>
                    <ul className="text-slate-400 space-y-1 text-[11px] list-disc list-inside">
                      <li>
                        Cada lead disparado será criado no <strong>WhatsApp & Chatbot</strong> com tag <span className="text-blue-300 font-mono">#ProspeccaoMaps</span>.
                      </li>
                      <li>
                        Assim que o lead responder confirmando ser o dono/decisor, ele é <strong>inserido automaticamente na 1ª coluna do Funil CRM</strong>.
                      </li>
                      <li>
                        O robô pausa para que você assuma o <strong>atendimento humanizado</strong> no chat.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Etapa de Envio em Andamento */}
          {activeStep === 'sending' && (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 animate-pulse mb-1">
                  <Send className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Disparando Mensagens com Filtro de Decisor</h3>
                <p className="text-xs text-slate-400">
                  Enviando {currentIndex + 1} de {validLeads.length} leads com cadência de proteção anti-bloqueio ({delaySeconds}s)...
                </p>

                {/* Barra de Progresso */}
                <div className="max-w-md mx-auto pt-2 space-y-1.5">
                  <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500 rounded-full"
                      style={{ width: `${Math.round(((currentIndex + 1) / validLeads.length) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                    <span>{Math.round(((currentIndex + 1) / validLeads.length) * 100)}% concluído</span>
                    <span>{currentIndex + 1} / {validLeads.length} estabelecimentos</span>
                  </div>
                </div>
              </div>

              {/* Tabela de Logs em Tempo Real */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                <div className="p-3 bg-slate-900 border-b border-slate-800 text-xs font-bold text-slate-300 flex justify-between items-center">
                  <span>Log de Envio em Tempo Real</span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Evolution API Ativa
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-850 text-xs">
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
                        ) : log.status === 'error' ? (
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
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
                              : log.status === 'sending'
                              ? 'text-amber-400'
                              : 'text-slate-500'
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

          {/* Etapa de Conclusão */}
          {activeStep === 'finished' && (
            <div className="space-y-6 py-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Disparo em Massa Concluído com Sucesso!</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {validLeads.length} estabelecimentos foram contatados no WhatsApp com áudio e mensagem de filtro de decisor.
                  Todas as conversas já estão salvas no seu painel.
                </p>
              </div>

              {/* Card de Teste do Fluxo Solicitado */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 max-w-lg mx-auto text-left space-y-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white">
                    Testar Entrada no CRM ao Receber Resposta (Ponto 2)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Para ver imediatamente a automação funcionando: clique no botão abaixo para simular que o proprietário de <strong>{sampleLead.name}</strong> respondeu a mensagem agora.
                </p>

                <button
                  type="button"
                  onClick={handleSimulateDecisionMakerReply}
                  disabled={isSimulatingReply || simulatedReplySuccess}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition disabled:opacity-50"
                >
                  {isSimulatingReply ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processando Resposta...</span>
                    </>
                  ) : simulatedReplySuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Lead Inserido no Funil CRM & Conversa Atualizada!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Simular Resposta: &quot;Sou o dono sim! Como funciona?&quot;</span>
                    </>
                  )}
                </button>
              </div>

              {/* Botões de Ação Final */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onNavigateToWhatsApp) onNavigateToWhatsApp();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Ver Conversas no WhatsApp & Chatbot</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
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

        {/* Modal Footer */}
        {activeStep === 'config' && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleStartDispatch}
              disabled={validLeads.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              <span>Iniciar Disparo em Massa ({validLeads.length} Leads)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
