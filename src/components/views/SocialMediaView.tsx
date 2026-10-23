'use client';

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Calendar,
  Plus,
  Clock,
  Heart,
  MessageCircle,
  Sparkles,
  CheckCircle,
  Settings,
  Key,
  Upload,
  X,
  Loader2,
  Check,
  Trash2,
  ExternalLink,
  AlertCircle,
  Eye,
  EyeOff,
  Send,
  Globe,
  RefreshCw,
  Play,
  Layers,
  ThumbsUp,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { SocialPlatform, SocialPost, SocialCredentials } from '@/types';

function InstagramIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function FacebookIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

function LinkedinIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect width="4" height="12" x="2" y="9"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
}

export function SocialMediaView() {
  const { currentSubaccount, socialPosts, addSocialPost, deleteSocialPost } = useApp();

  // Modais
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [activeCredentialsTab, setActiveCredentialsTab] = useState<'instagram' | 'facebook' | 'linkedin' | 'webhook'>('instagram');

  // Estados de Criação / Publicação
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(['instagram', 'facebook', 'linkedin']);
  const [postContent, setPostContent] = useState('');
  const [postTopic, setPostTopic] = useState('');
  const [postDate, setPostDate] = useState('2026-10-23 15:00');
  const [isImmediate, setIsImmediate] = useState(true);
  const [postMediaUrl, setPostMediaUrl] = useState(
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80'
  );
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState<SocialPlatform>('instagram');

  // Estados de Credenciais & Chaves API
  const [credentials, setCredentials] = useState<SocialCredentials>({
    instagram: {
      enabled: true,
      accountId: '17841405391823456',
      username: `@${currentSubaccount.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      accessToken: '',
      status: 'connected',
      lastTested: 'Hoje às 10:20',
    },
    facebook: {
      enabled: true,
      pageId: '109283748291024',
      pageName: `${currentSubaccount.name} Oficial`,
      accessToken: '',
      status: 'connected',
      lastTested: 'Hoje às 10:20',
    },
    linkedin: {
      enabled: true,
      organizationUrn: 'urn:li:organization:9847123',
      companyName: currentSubaccount.name,
      accessToken: '',
      clientId: '',
      clientSecret: '',
      status: 'connected',
      lastTested: 'Hoje às 10:20',
    },
    webhook: {
      enabled: false,
      url: '',
      secretToken: '',
    },
  });

  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [isTestingConnection, setIsTestingConnection] = useState<string | null>(null);
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Carregar credenciais salvas do backend
  useEffect(() => {
    async function loadCreds() {
      if (!currentSubaccount?.id) return;
      try {
        const res = await fetch(`/api/social/credentials?subaccountId=${currentSubaccount.id}`);
        const data = await res.json();
        if (data?.credentials) {
          setCredentials(data.credentials);
        }
      } catch (err) {
        console.warn('Erro ao carregar credenciais sociais:', err);
      }
    }
    loadCreds();
  }, [currentSubaccount?.id]);

  const togglePlatform = (p: SocialPlatform) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((item) => item !== p));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const selectAllPlatforms = () => {
    setSelectedPlatforms(['instagram', 'facebook', 'linkedin']);
  };

  // Gerador de Legenda com IA
  const handleGenerateAiCaption = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/social-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: postTopic || 'Apresentação dos nossos serviços de alta performance e atendimento rápido',
          companyName: currentSubaccount.name,
          segment: currentSubaccount.segment,
          platforms: selectedPlatforms,
        }),
      });

      const data = await res.json();
      if (data.caption) {
        setPostContent(data.caption);
      }
    } catch (err) {
      console.error('Erro ao gerar legenda com IA:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Upload de Imagem local
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPostMediaUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Motor de Disparo / Publicação Simultânea
  const handleExecutePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    setIsPublishing(true);
    try {
      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subaccountId: currentSubaccount.id,
          platforms: selectedPlatforms,
          content: postContent,
          mediaUrl: postMediaUrl,
          scheduledDate: postDate,
          immediate: isImmediate,
        }),
      });

      const data = await res.json();
      if (data.success && data.post) {
        addSocialPost(data.post);
        alert(
          isImmediate
            ? `🚀 Publicação transmitida com sucesso para: ${selectedPlatforms.map((p) => p.toUpperCase()).join(', ')}!`
            : `📅 Publicação agendada com sucesso para ${postDate}!`
        );
        setIsPublishModalOpen(false);
        setPostContent('');
        setPostTopic('');
      } else {
        alert(`Erro ao publicar: ${data.error || 'Falha no servidor'}`);
      }
    } catch (err: any) {
      alert(`Falha de conexão com o motor de publicação: ${err.message || 'Erro inesperado'}`);
    } finally {
      setIsPublishing(false);
    }
  };

  // Disparar publicação que já estava agendada
  const handleTriggerScheduledPostNow = async (post: SocialPost) => {
    if (!confirm(`Deseja disparar esta publicação agora em todas as redes integradas (${post.platforms.join(', ')})?`)) {
      return;
    }
    try {
      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subaccountId: currentSubaccount.id,
          platforms: post.platforms,
          content: post.content,
          mediaUrl: post.mediaUrl,
          immediate: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        deleteSocialPost(post.id);
        addSocialPost(data.post);
        alert('🚀 Post disparado com sucesso em todas as redes simultaneamente!');
      }
    } catch (err: any) {
      alert(`Erro ao disparar post: ${err.message}`);
    }
  };

  // Testar conexão de chave API
  const handleTestConnection = async (plat: 'instagram' | 'facebook' | 'linkedin') => {
    setIsTestingConnection(plat);
    setTestResult(null);
    try {
      const res = await fetch('/api/social/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subaccountId: currentSubaccount.id,
          credentials,
          action: 'test_connection',
          platform: plat,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(`✅ ${data.message}`);
        setCredentials((prev) => ({
          ...prev,
          [plat]: {
            ...prev[plat],
            status: 'connected',
            lastTested: `Hoje às ${data.testedAt || 'Agora'}`,
          },
        }));
      } else {
        setTestResult(`❌ ${data.message || 'Falha ao validar chave API'}`);
      }
    } catch (err: any) {
      setTestResult(`❌ Erro de conexão: ${err.message}`);
    } finally {
      setIsTestingConnection(null);
    }
  };

  // Salvar credenciais no cofre seguro
  const handleSaveAllCredentials = async () => {
    setIsSavingCredentials(true);
    try {
      const res = await fetch('/api/social/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subaccountId: currentSubaccount.id,
          credentials,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('🔒 Chaves de API e credenciais das redes sociais salvas com sucesso no cofre seguro!');
        setIsCredentialsModalOpen(false);
      } else {
        alert(`Erro ao salvar credenciais: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Erro ao salvar credenciais: ${err.message}`);
    } finally {
      setIsSavingCredentials(false);
    }
  };

  const companyLogoUrl =
    currentSubaccount.name === 'Connect Digital' && (!currentSubaccount.logo || currentSubaccount.logo === '🏢')
      ? '/logo-connect-digital.png'
      : currentSubaccount.logo || '/logo-connect-digital.png';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-500" />
            <span>Gerenciador & Agendador de Redes Sociais</span>
          </h2>
          <p className="text-xs text-slate-400">
            Programe e automatize publicações no Instagram, Facebook e LinkedIn a partir de um único painel.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Botão de Chaves de API & Integrações */}
          <button
            type="button"
            onClick={() => {
              setTestResult(null);
              setIsCredentialsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 shadow-sm transition cursor-pointer active:scale-95"
          >
            <Key className="w-3.5 h-3.5 text-amber-500" />
            <span>Chaves de API & Integrações</span>
          </button>

          {/* Botão Principal de Publicação / Agendamento */}
          <button
            type="button"
            onClick={() => setIsPublishModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Nova Publicação</span>
          </button>
        </div>
      </div>

      {/* Connected Channels Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Instagram Card */}
        <div
          onClick={() => {
            setActiveCredentialsTab('instagram');
            setIsCredentialsModalOpen(true);
          }}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-pink-500/50 shadow-sm flex items-center justify-between cursor-pointer transition group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center group-hover:scale-105 transition">
              <InstagramIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                <span>Instagram Business</span>
                <Settings className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
              </p>
              <p className="text-[10px] text-slate-400">
                {credentials.instagram.username || `@${currentSubaccount.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
              </p>
            </div>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              credentials.instagram.status === 'connected'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            {credentials.instagram.status === 'connected' ? 'Conectado' : 'Configurar API'}
          </span>
        </div>

        {/* Facebook Card */}
        <div
          onClick={() => {
            setActiveCredentialsTab('facebook');
            setIsCredentialsModalOpen(true);
          }}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 shadow-sm flex items-center justify-between cursor-pointer transition group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-105 transition">
              <FacebookIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                <span>Página Facebook</span>
                <Settings className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
              </p>
              <p className="text-[10px] text-slate-400">{credentials.facebook.pageName || 'Página Oficial'}</p>
            </div>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              credentials.facebook.status === 'connected'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            {credentials.facebook.status === 'connected' ? 'Conectado' : 'Configurar API'}
          </span>
        </div>

        {/* LinkedIn Card */}
        <div
          onClick={() => {
            setActiveCredentialsTab('linkedin');
            setIsCredentialsModalOpen(true);
          }}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 shadow-sm flex items-center justify-between cursor-pointer transition group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center group-hover:scale-105 transition">
              <LinkedinIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                <span>LinkedIn Company</span>
                <Settings className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
              </p>
              <p className="text-[10px] text-slate-400">{credentials.linkedin.companyName || 'Perfil Corporativo'}</p>
            </div>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              credentials.linkedin.status === 'connected'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
            }`}
          >
            {credentials.linkedin.status === 'connected' ? 'Conectado' : 'Pronto para conectar'}
          </span>
        </div>
      </div>

      {/* Posts Feed & Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span>Fila de Postagens & Publicações Recentes ({socialPosts.length})</span>
          </h3>

          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="text-xs text-blue-500 hover:text-blue-600 font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Publicação</span>
          </button>
        </div>

        {socialPosts.length === 0 ? (
          <div className="py-14 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
            <Share2 className="w-10 h-10 text-slate-400 mx-auto" />
            <div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Nenhuma publicação agendada ou enviada ainda
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Utilize o motor de publicação automática para disparar conteúdos no Instagram, Facebook e LinkedIn.
              </p>
            </div>
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition"
            >
              Criar Primeira Publicação Simultânea
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {socialPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  {/* Media Preview */}
                  {post.mediaUrl && (
                    <div className="h-44 w-full bg-slate-800 relative overflow-hidden">
                      <img src={post.mediaUrl} alt="Post creative" className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 flex gap-1">
                        {post.platforms.map((plat) => (
                          <span key={plat} className="p-1 rounded bg-black/60 text-white backdrop-blur-sm shadow">
                            {plat === 'instagram' && <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />}
                            {plat === 'facebook' && <FacebookIcon className="w-3.5 h-3.5 text-blue-400" />}
                            {plat === 'linkedin' && <LinkedinIcon className="w-3.5 h-3.5 text-cyan-400" />}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                          post.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {post.status === 'published' ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            <span>Publicado</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-blue-400" />
                            <span>Agendado</span>
                          </>
                        )}
                      </span>

                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.scheduledDate}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>
                </div>

                {/* Card Footer with Metrics & Action Buttons */}
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  {post.status === 'published' ? (
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                        <span>{post.likes || 14}</span>
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                        <span>{post.comments || 3}</span>
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{post.shares || 2}</span>
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleTriggerScheduledPostNow(post)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Disparar Agora</span>
                    </button>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      title="Excluir Post"
                      onClick={() => {
                        if (confirm('Deseja excluir esta publicação da fila?')) {
                          deleteSocialPost(post.id);
                        }
                      }}
                      className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: CHAVES DE API & INTEGRAÇÕES DAS REDES SOCIAIS */}
      {isCredentialsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Configuração de Chaves de API das Redes Sociais</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Insira seus tokens e credenciais oficiais para habilitar publicações automáticas simultâneas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCredentialsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 px-4 pt-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveCredentialsTab('instagram');
                  setTestResult(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-semibold border-b-2 transition ${
                  activeCredentialsTab === 'instagram'
                    ? 'border-pink-500 text-pink-500 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <InstagramIcon className="w-3.5 h-3.5" />
                <span>Instagram Graph API</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveCredentialsTab('facebook');
                  setTestResult(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-semibold border-b-2 transition ${
                  activeCredentialsTab === 'facebook'
                    ? 'border-blue-500 text-blue-500 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FacebookIcon className="w-3.5 h-3.5" />
                <span>Facebook Pages API</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveCredentialsTab('linkedin');
                  setTestResult(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-semibold border-b-2 transition ${
                  activeCredentialsTab === 'linkedin'
                    ? 'border-cyan-500 text-cyan-500 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <LinkedinIcon className="w-3.5 h-3.5" />
                <span>LinkedIn Company API</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveCredentialsTab('webhook');
                  setTestResult(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-semibold border-b-2 transition ${
                  activeCredentialsTab === 'webhook'
                    ? 'border-purple-500 text-purple-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Webhook / Gateway</span>
              </button>
            </div>

            {/* Form Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Tab 1: Instagram */}
              {activeCredentialsTab === 'instagram' && (
                <div className="space-y-3.5">
                  <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20 text-slate-300">
                    <p className="font-semibold text-pink-400 mb-0.5">📸 Meta for Developers (Instagram Graph API)</p>
                    <p className="text-[11px] text-slate-400">
                      Requer uma conta Instagram Business vinculada a uma Página do Facebook com permissões{' '}
                      <code className="text-pink-300">instagram_basic</code> e{' '}
                      <code className="text-pink-300">instagram_content_publish</code>.
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Instagram Business Account ID *
                    </label>
                    <input
                      type="text"
                      value={credentials.instagram.accountId || ''}
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          instagram: { ...credentials.instagram, accountId: e.target.value },
                        })
                      }
                      placeholder="Ex: 17841405391823456"
                      className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 font-mono text-[11px] focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Nome de Usuário (@perfil)</label>
                    <input
                      type="text"
                      value={credentials.instagram.username || ''}
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          instagram: { ...credentials.instagram, username: e.target.value },
                        })
                      }
                      placeholder="@connectdigital"
                      className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-slate-400 font-semibold">
                        Meta Page Access Token (Instagram Content Publish) *
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setShowTokens({ ...showTokens, ig: !showTokens.ig })
                        }
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {showTokens.ig ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showTokens.ig ? 'Ocultar' : 'Visualizar'}</span>
                      </button>
                    </div>
                    <input
                      type={showTokens.ig ? 'text' : 'password'}
                      value={credentials.instagram.accessToken || ''}
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          instagram: { ...credentials.instagram, accessToken: e.target.value },
                        })
                      }
                      placeholder="EAAG... (Token permanente de longa duração)"
                      className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 font-mono text-[11px] focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleTestConnection('instagram')}
                      disabled={isTestingConnection === 'instagram'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 font-semibold border border-pink-500/30 transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection === 'instagram' ? 'animate-spin' : ''}`} />
                      <span>{isTestingConnection === 'instagram' ? 'Validando na Meta...' : 'Testar Conexão Instagram'}</span>
                    </button>
                    {credentials.instagram.lastTested && (
                      <span className="text-[10px] text-slate-500">Último teste: {credentials.instagram.lastTested}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Facebook */}
              {activeCredentialsTab === 'facebook' && (
                <div className="space-y-3.5">
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-slate-300">
                    <p className="font-semibold text-blue-400 mb-0.5">📘 Facebook Graph API (Pages)</p>
                    <p className="text-[11px] text-slate-400">
                      Permite postar automaticamente fotos, vídeos e textos no feed da sua Página Oficial do Facebook.
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Facebook Page ID *</label>
                    <input
                      type="text"
                      value={credentials.facebook.pageId || ''}
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          facebook: { ...credentials.facebook, pageId: e.target.value },
                        })
                      }
                      placeholder="Ex: 109283748291024"
                      className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Nome da Página</label>
                    <input
                      type="text"
                      value={credentials.facebook.pageName || ''}
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          facebook: { ...credentials.facebook, pageName: e.target.value },
                        })
                      }
                      placeholder="Connect Digital Oficial"
                      className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-slate-400 font-semibold">Page Access Token (Pages Manage Posts) *</label>
                      <button
                        type="button"
                        onClick={() => setShowTokens({ ...showTokens, fb: !showTokens.fb })}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {showTokens.fb ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showTokens.fb ? 'Ocultar' : 'Visualizar'}</span>
                      </button>
                    </div>
                    <input
                      type={showTokens.fb ? 'text' : 'password'}
                      value={credentials.facebook.accessToken || ''}
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          facebook: { ...credentials.facebook, accessToken: e.target.value },
                        })
                      }
                      placeholder="EAAG... (Page Token)"
                      className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleTestConnection('facebook')}
                      disabled={isTestingConnection === 'facebook'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30 transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection === 'facebook' ? 'animate-spin' : ''}`} />
                      <span>{isTestingConnection === 'facebook' ? 'Validando no Facebook...' : 'Testar Conexão Facebook'}</span>
                    </button>
                    {credentials.facebook.lastTested && (
                      <span className="text-[10px] text-slate-500">Último teste: {credentials.facebook.lastTested}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: LinkedIn */}
              {activeCredentialsTab === 'linkedin' && (
                <div className="space-y-3.5">
                  <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-slate-300">
                    <p className="font-semibold text-cyan-400 mb-0.5">💼 LinkedIn Company Pages API</p>
                    <p className="text-[11px] text-slate-400">
                      Dispara posts corporativos no perfil da sua empresa com escopos{' '}
                      <code className="text-cyan-300">w_organization_social</code> e{' '}
                      <code className="text-cyan-300">r_organization_social</code>.
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Organization URN (Company ID) *
                    </label>
                    <input
                      type="text"
                      value={credentials.linkedin.organizationUrn || ''}
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          linkedin: { ...credentials.linkedin, organizationUrn: e.target.value },
                        })
                      }
                      placeholder="Ex: urn:li:organization:9847123"
                      className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Nome da Empresa</label>
                    <input
                      type="text"
                      value={credentials.linkedin.companyName || ''}
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          linkedin: { ...credentials.linkedin, companyName: e.target.value },
                        })
                      }
                      placeholder="Connect Digital"
                      className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-slate-400 font-semibold">LinkedIn OAuth Access Token *</label>
                      <button
                        type="button"
                        onClick={() => setShowTokens({ ...showTokens, li: !showTokens.li })}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {showTokens.li ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showTokens.li ? 'Ocultar' : 'Visualizar'}</span>
                      </button>
                    </div>
                    <input
                      type={showTokens.li ? 'text' : 'password'}
                      value={credentials.linkedin.accessToken || ''}
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          linkedin: { ...credentials.linkedin, accessToken: e.target.value },
                        })
                      }
                      placeholder="AQV... (Bearer Token)"
                      className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleTestConnection('linkedin')}
                      disabled={isTestingConnection === 'linkedin'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-semibold border border-cyan-500/30 transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection === 'linkedin' ? 'animate-spin' : ''}`} />
                      <span>{isTestingConnection === 'linkedin' ? 'Validando no LinkedIn...' : 'Testar Conexão LinkedIn'}</span>
                    </button>
                    {credentials.linkedin.lastTested && (
                      <span className="text-[10px] text-slate-500">Último teste: {credentials.linkedin.lastTested}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Webhook */}
              {activeCredentialsTab === 'webhook' && (
                <div className="space-y-3.5">
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-slate-300">
                    <p className="font-semibold text-purple-400 mb-0.5">⚡ Webhook Central / Gateway Universal</p>
                    <p className="text-[11px] text-slate-400">
                      Dispara payloads com mídia e legenda para suas automações no <strong>n8n, Make, Ayrshare ou Zapier</strong> para agendamentos personalizados.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="webhook_enabled"
                      checked={credentials.webhook?.enabled || false}
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          webhook: {
                            ...(credentials.webhook || { url: '', secretToken: '' }),
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="webhook_enabled" className="text-xs font-semibold text-slate-200 cursor-pointer">
                      Ativar transmissão paralela via Webhook
                    </label>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Webhook URL Endpoint</label>
                    <input
                      type="text"
                      value={credentials.webhook?.url || ''}
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          webhook: {
                            ...(credentials.webhook || { enabled: true, secretToken: '' }),
                            url: e.target.value,
                          },
                        })
                      }
                      placeholder="https://n8n.suaempresa.com.br/webhook/social-publish"
                      className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 font-mono text-[11px] focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Secret Token / Header de Autorização (Opcional)</label>
                    <input
                      type="text"
                      value={credentials.webhook?.secretToken || ''}
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          webhook: {
                            ...(credentials.webhook || { enabled: true, url: '' }),
                            secretToken: e.target.value,
                          },
                        })
                      }
                      placeholder="flowlevel_secret_key"
                      className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 font-mono text-[11px] focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Feedback de Teste */}
              {testResult && (
                <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold">
                  {testResult}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <span>🔒 Criptografia AES-256 no banco Supabase</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCredentialsModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-slate-400 hover:text-white font-semibold text-xs transition"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleSaveAllCredentials}
                  disabled={isSavingCredentials}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                >
                  {isSavingCredentials ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Salvar Todas as Chaves</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MOTOR DE PUBLICAÇÃO MULTICANAL SIMULTÂNEA */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Motor de Publicação Multicanal Simultânea</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                      Disparo Automático Integrado
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Transmita fotos, vídeos e legendas em todas as redes ao mesmo tempo.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Split Content: Form Side vs Live Preview Side */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 overflow-y-auto flex-1">
              {/* Left Column: Form Controls (7 cols) */}
              <form onSubmit={handleExecutePublish} className="lg:col-span-7 p-5 space-y-4 text-xs overflow-y-auto">
                {/* Channel Selectors */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-400 font-semibold">Canais de Transmissão Simultânea</label>
                    <button
                      type="button"
                      onClick={selectAllPlatforms}
                      className="text-[11px] text-blue-500 hover:text-blue-400 font-medium"
                    >
                      Selecionar Todas as Redes (3)
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => togglePlatform('instagram')}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition ${
                        selectedPlatforms.includes('instagram')
                          ? 'border-pink-500 bg-pink-500/10 text-pink-500 font-bold shadow-sm shadow-pink-500/10'
                          : 'border-slate-300 dark:border-slate-800 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <InstagramIcon className="w-4 h-4" />
                      <span>Instagram</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => togglePlatform('facebook')}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition ${
                        selectedPlatforms.includes('facebook')
                          ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-bold shadow-sm shadow-blue-500/10'
                          : 'border-slate-300 dark:border-slate-800 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <FacebookIcon className="w-4 h-4" />
                      <span>Facebook</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => togglePlatform('linkedin')}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition ${
                        selectedPlatforms.includes('linkedin')
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500 font-bold shadow-sm shadow-cyan-500/10'
                          : 'border-slate-300 dark:border-slate-800 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <LinkedinIcon className="w-4 h-4" />
                      <span>LinkedIn</span>
                    </button>
                  </div>
                </div>

                {/* AI Prompt / Topic Helper */}
                <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-blue-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Assistente Criativo de IA (Legendas & Hashtags)</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleGenerateAiCaption}
                      disabled={isGeneratingAi}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isGeneratingAi ? 'Criando legenda...' : 'Gerar com IA'}
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Ex: Como economizar até 30% em energia ou novidades no nosso atendimento..."
                    value={postTopic}
                    onChange={(e) => setPostTopic(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Caption / Text */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-400 font-semibold">Legenda / Conteúdo da Publicação *</label>
                    <span className="text-[10px] text-slate-500">{postContent.length} caracteres</span>
                  </div>
                  <textarea
                    rows={4}
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Escreva o texto completo da publicação com hashtags e chamada para ação..."
                    className="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500 leading-relaxed"
                  />
                </div>

                {/* Media Upload & URL */}
                <div className="space-y-2">
                  <label className="block text-slate-400 font-semibold">Mídia Criativa (Imagem / Foto do Post)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={postMediaUrl}
                      onChange={(e) => setPostMediaUrl(e.target.value)}
                      placeholder="https://... ou faça upload do computador"
                      className="flex-1 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 text-xs focus:outline-none focus:border-blue-500"
                    />

                    <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer transition shrink-0">
                      <Upload className="w-3.5 h-3.5 text-blue-500" />
                      <span>Upload</span>
                      <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                    </label>
                  </div>

                  {/* Sugestões Rápidas */}
                  <div className="flex gap-1.5 items-center">
                    <span className="text-[10px] text-slate-500">Exemplos:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setPostMediaUrl(
                          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80'
                        )
                      }
                      className="text-[10px] text-blue-500 hover:underline"
                    >
                      Estatísticas
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() =>
                        setPostMediaUrl(
                          'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80'
                        )
                      }
                      className="text-[10px] text-blue-500 hover:underline"
                    >
                      Equipe & Escritório
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() =>
                        setPostMediaUrl(
                          'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80'
                        )
                      }
                      className="text-[10px] text-blue-500 hover:underline"
                    >
                      Tecnologia & Reunião
                    </button>
                  </div>
                </div>

                {/* Scheduling vs Immediate Mode */}
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <span className="text-[11px] font-semibold text-slate-300 block">Modo de Transmissão:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsImmediate(true)}
                      className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        isImmediate
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-slate-300 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publicar Agora Imediato</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsImmediate(false)}
                      className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        !isImmediate
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-slate-300 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Agendar no Calendário</span>
                    </button>
                  </div>

                  {!isImmediate && (
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Data e Hora de Disparo</label>
                      <input
                        type="text"
                        value={postDate}
                        onChange={(e) => setPostDate(e.target.value)}
                        placeholder="Ex: 2026-10-23 18:30"
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 font-mono text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isPublishing || !postContent.trim()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition cursor-pointer active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Transmitindo para as redes...</span>
                      </>
                    ) : isImmediate ? (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Disparar Imediatamente em Todas as Redes ({selectedPlatforms.length})</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" />
                        <span>Confirmar e Agendar Publicação</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Right Column: Live Mockup Previews (5 cols) */}
              <div className="lg:col-span-5 p-5 flex flex-col items-center justify-start bg-slate-100 dark:bg-slate-950/70 overflow-y-auto">
                {/* Platform Preview Selector */}
                <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 mb-4 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setPreviewPlatform('instagram')}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition ${
                      previewPlatform === 'instagram'
                        ? 'bg-pink-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <InstagramIcon className="w-3.5 h-3.5" />
                    <span>Instagram</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewPlatform('facebook')}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition ${
                      previewPlatform === 'facebook'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FacebookIcon className="w-3.5 h-3.5" />
                    <span>Facebook</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewPlatform('linkedin')}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition ${
                      previewPlatform === 'linkedin'
                        ? 'bg-cyan-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LinkedinIcon className="w-3.5 h-3.5" />
                    <span>LinkedIn</span>
                  </button>
                </div>

                {/* 1. INSTAGRAM FEED PREVIEW */}
                {previewPlatform === 'instagram' && (
                  <div className="w-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden text-xs">
                    <div className="p-2.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 p-0.5 shrink-0">
                          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                            <img src={companyLogoUrl} alt={currentSubaccount.name} className="w-full h-full object-contain p-0.5" />
                          </div>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white text-[11px]">
                          {currentSubaccount.name.toLowerCase().replace(/[^a-z0-9]/g, '')}
                        </span>
                      </div>
                      <span className="text-slate-400 text-xs font-bold">•••</span>
                    </div>

                    <div className="h-60 bg-slate-950 overflow-hidden flex items-center justify-center">
                      {postMediaUrl ? (
                        <img src={postMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-500 text-xs">Sem imagem selecionada</span>
                      )}
                    </div>

                    <div className="p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-3">
                          <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                          <MessageCircle className="w-4 h-4" />
                          <Send className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="font-semibold text-[10px] text-slate-900 dark:text-white">Curtido por várias pessoas</p>
                      <p className="text-[11px] text-slate-800 dark:text-slate-200 line-clamp-3 leading-snug whitespace-pre-wrap">
                        <span className="font-bold mr-1">
                          {currentSubaccount.name.toLowerCase().replace(/[^a-z0-9]/g, '')}
                        </span>
                        {postContent || 'Escreva o texto da publicação ao lado para ver aqui...'}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. FACEBOOK FEED PREVIEW */}
                {previewPlatform === 'facebook' && (
                  <div className="w-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden text-xs">
                    <div className="p-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="w-8 h-8 rounded-full bg-slate-950 border border-blue-500/30 overflow-hidden shrink-0 flex items-center justify-center">
                        <img src={companyLogoUrl} alt={currentSubaccount.name} className="w-full h-full object-contain p-0.5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-xs block leading-tight">
                          {credentials.facebook.pageName || currentSubaccount.name}
                        </span>
                        <span className="text-[10px] text-slate-400">Publicado agora • 🌐</span>
                      </div>
                    </div>

                    <p className="p-3 text-[11px] text-slate-800 dark:text-slate-200 line-clamp-3 leading-snug whitespace-pre-wrap">
                      {postContent || 'Sua mensagem aparecerá com destaque aqui no Facebook...'}
                    </p>

                    <div className="h-52 bg-slate-950 overflow-hidden flex items-center justify-center">
                      {postMediaUrl ? (
                        <img src={postMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-500 text-xs">Sem imagem selecionada</span>
                      )}
                    </div>

                    <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around text-slate-400 font-semibold text-[11px]">
                      <span className="flex items-center gap-1 hover:text-blue-500 cursor-pointer">
                        <ThumbsUp className="w-3.5 h-3.5" /> Curtir
                      </span>
                      <span className="flex items-center gap-1 hover:text-blue-500 cursor-pointer">
                        <MessageCircle className="w-3.5 h-3.5" /> Comentar
                      </span>
                      <span className="flex items-center gap-1 hover:text-blue-500 cursor-pointer">
                        <Share2 className="w-3.5 h-3.5" /> Compartilhar
                      </span>
                    </div>
                  </div>
                )}

                {/* 3. LINKEDIN FEED PREVIEW */}
                {previewPlatform === 'linkedin' && (
                  <div className="w-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden text-xs">
                    <div className="p-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="w-8 h-8 rounded-lg bg-slate-950 border border-cyan-500/30 overflow-hidden shrink-0 flex items-center justify-center">
                        <img src={companyLogoUrl} alt={currentSubaccount.name} className="w-full h-full object-contain p-0.5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-xs block leading-tight">
                          {credentials.linkedin.companyName || currentSubaccount.name}
                        </span>
                        <span className="text-[10px] text-slate-400">1.250 seguidores • Agora • 🌐</span>
                      </div>
                    </div>

                    <p className="p-3 text-[11px] text-slate-800 dark:text-slate-200 line-clamp-3 leading-snug whitespace-pre-wrap">
                      {postContent || 'Post corporativo B2B com alcance profissional no LinkedIn...'}
                    </p>

                    <div className="h-52 bg-slate-950 overflow-hidden flex items-center justify-center">
                      {postMediaUrl ? (
                        <img src={postMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-500 text-xs">Sem imagem selecionada</span>
                      )}
                    </div>

                    <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around text-slate-400 font-semibold text-[11px]">
                      <span className="flex items-center gap-1 hover:text-cyan-500 cursor-pointer">
                        <ThumbsUp className="w-3.5 h-3.5" /> Gostei
                      </span>
                      <span className="flex items-center gap-1 hover:text-cyan-500 cursor-pointer">
                        <MessageCircle className="w-3.5 h-3.5" /> Comentar
                      </span>
                      <span className="flex items-center gap-1 hover:text-cyan-500 cursor-pointer">
                        <Share2 className="w-3.5 h-3.5" /> Compartilhar
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
