'use client';

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Calendar,
  Plus,
  Trash2,
  Clock,
  CheckCircle,
  Key,
  Sparkles,
  Upload,
  Send,
  X,
  Check,
  Loader2,
  Heart,
  MessageCircle,
  ThumbsUp,
  Globe,
  RefreshCw,
  Eye,
  EyeOff,
  Play,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { SocialChannelsCredentials, SocialPlatform, SocialPost } from '@/types';

function InstagramIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function LinkedinIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export default function SocialMediaView() {
  const { currentSubaccount, socialPosts, addSocialPost, deleteSocialPost } = useApp();

  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([
    'instagram',
    'facebook',
    'linkedin',
  ]);
  const [postTopic, setPostTopic] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postMediaUrl, setPostMediaUrl] = useState(
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80'
  );
  const [postDate, setPostDate] = useState('2026-11-05 18:00');
  const [isImmediate, setIsImmediate] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState<SocialPlatform>('instagram');

  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [activeCredentialsTab, setActiveCredentialsTab] = useState<
    'instagram' | 'facebook' | 'linkedin' | 'webhook'
  >('instagram');
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});

  const [credentials, setCredentials] = useState<SocialChannelsCredentials>({
    instagram: {
      accountId: '17841405391823456',
      username: `@${currentSubaccount.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      accessToken: '',
      status: 'connected',
    },
    facebook: {
      pageId: '109283748291024',
      pageName: `${currentSubaccount.name} Oficial`,
      accessToken: '',
      status: 'connected',
    },
    linkedin: {
      organizationUrn: 'urn:li:organization:9847123',
      companyName: currentSubaccount.name,
      accessToken: '',
      status: 'connected',
    },
    webhook: {
      url: '',
      secretToken: '',
      enabled: false,
    },
  });

  useEffect(() => {
    let isMounted = true;
    async function loadCredentials() {
      try {
        const res = await fetch(
          `/api/social/credentials?subaccountId=${currentSubaccount.id}`
        );
        const data = await res.json();
        if (isMounted && data.credentials) {
          setCredentials(data.credentials);
        }
      } catch (e) {
        console.warn('Aviso ao carregar credenciais sociais:', e);
      }
    }
    loadCredentials();
    return () => {
      isMounted = false;
    };
  }, [currentSubaccount.id]);

  const togglePlatform = (plat: SocialPlatform) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(plat)) {
        return prev.length > 1 ? prev.filter((p) => p !== plat) : prev;
      }
      return [...prev, plat];
    });
  };

  const selectAllPlatforms = () => {
    setSelectedPlatforms(['instagram', 'facebook', 'linkedin']);
  };

  const handleGenerateAiCaption = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/social-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic:
            postTopic ||
            'Apresentação dos nossos serviços de alta performance e atendimento rápido',
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
            ? `Publicação transmitida com sucesso para: ${selectedPlatforms
                .map((p) => p.toUpperCase())
                .join(', ')}!`
            : `Publicação agendada com sucesso para ${postDate}!`
        );
        setIsPublishModalOpen(false);
        setPostContent('');
        setPostTopic('');
      } else {
        alert(`Erro ao publicar: ${data.error || 'Falha no servidor'}`);
      }
    } catch (err: any) {
      alert(
        `Falha de conexão com o motor de publicação: ${
          err.message || 'Erro inesperado'
        }`
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const handleTriggerScheduledPostNow = async (post: SocialPost) => {
    if (
      !confirm(
        `Deseja disparar esta publicação agora em todas as redes integradas (${post.platforms.join(
          ', '
        )})?`
      )
    ) {
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
        alert('Post disparado com sucesso em todas as redes simultaneamente!');
      }
    } catch (err: any) {
      alert(`Erro ao disparar post: ${err.message}`);
    }
  };

  const handleTestConnection = async (
    plat: 'instagram' | 'facebook' | 'linkedin'
  ) => {
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
        setTestResult(`Conectado: ${data.message}`);
        setCredentials((prev: SocialChannelsCredentials) => ({
          ...prev,
          [plat]: {
            ...prev[plat],
            status: 'connected',
            lastTested: `Hoje às ${data.testedAt || 'Agora'}`,
          },
        }));
      } else {
        setTestResult(`Falha: ${data.message || 'Falha ao validar chave API'}`);
      }
    } catch (err: any) {
      setTestResult(`Erro de conexão: ${err.message}`);
    } finally {
      setIsTestingConnection(null);
    }
  };

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
        alert(
          'Chaves de API e credenciais das redes sociais salvas com sucesso no cofre seguro!'
        );
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
    currentSubaccount.logo &&
    (currentSubaccount.logo.startsWith('/') ||
      currentSubaccount.logo.startsWith('http') ||
      currentSubaccount.logo.startsWith('data:'))
      ? currentSubaccount.logo
      : '/logo-connect-digital.png';

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      {/* Row 1 — Screen Title + Supporting Subline + Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-white">
            Agendador de redes sociais
          </h1>
          <p className="text-[14px] text-[#b4b4b4]">
            Programe e publique conteúdos simultaneamente no Instagram, Facebook e LinkedIn
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setTestResult(null);
              setIsCredentialsModalOpen(true);
            }}
            className="h-9 px-3.5 rounded-full bg-[#111111] hover:bg-[#1a1a1a] border border-[#2e2e2e] text-[13px] text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-[#c6f24e]" />
            <span>Chaves de API</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPublishModalOpen(true)}
            className="h-9 px-4 rounded-full bg-white hover:bg-[#e6e6e6] text-black text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova publicação</span>
          </button>
        </div>
      </div>

      {/* Row 2 — Connected Channels Strip (Divided Container) */}
      <section className="bg-[#111111] rounded-[20px] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#1a1a1a] overflow-hidden">
        <div
          onClick={() => {
            setActiveCredentialsTab('instagram');
            setIsCredentialsModalOpen(true);
          }}
          className="p-[22px] flex items-center justify-between gap-4 cursor-pointer hover:bg-[#161616] transition-colors"
        >
          <div className="space-y-1 min-w-0">
            <div className="text-[13px] text-[#b4b4b4] flex items-center gap-2">
              <InstagramIcon className="w-4 h-4 text-white shrink-0" />
              <span>Instagram Business</span>
            </div>
            <div className="text-[16px] font-medium text-white truncate">
              {credentials.instagram.username ||
                `@${currentSubaccount.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
            </div>
          </div>
          <span
            className={`h-6 px-2.5 rounded-full text-[12px] font-medium inline-flex items-center shrink-0 ${
              credentials.instagram.status === 'connected'
                ? 'bg-[#222a10] text-[#c6f24e]'
                : 'bg-[#2b2414] text-[#e5a93b]'
            }`}
          >
            {credentials.instagram.status === 'connected' ? 'Conectado' : 'Configurar'}
          </span>
        </div>

        <div
          onClick={() => {
            setActiveCredentialsTab('facebook');
            setIsCredentialsModalOpen(true);
          }}
          className="p-[22px] flex items-center justify-between gap-4 cursor-pointer hover:bg-[#161616] transition-colors"
        >
          <div className="space-y-1 min-w-0">
            <div className="text-[13px] text-[#b4b4b4] flex items-center gap-2">
              <FacebookIcon className="w-4 h-4 text-white shrink-0" />
              <span>Página Facebook</span>
            </div>
            <div className="text-[16px] font-medium text-white truncate">
              {credentials.facebook.pageName || 'Página Oficial'}
            </div>
          </div>
          <span
            className={`h-6 px-2.5 rounded-full text-[12px] font-medium inline-flex items-center shrink-0 ${
              credentials.facebook.status === 'connected'
                ? 'bg-[#222a10] text-[#c6f24e]'
                : 'bg-[#2b2414] text-[#e5a93b]'
            }`}
          >
            {credentials.facebook.status === 'connected' ? 'Conectado' : 'Configurar'}
          </span>
        </div>

        <div
          onClick={() => {
            setActiveCredentialsTab('linkedin');
            setIsCredentialsModalOpen(true);
          }}
          className="p-[22px] flex items-center justify-between gap-4 cursor-pointer hover:bg-[#161616] transition-colors"
        >
          <div className="space-y-1 min-w-0">
            <div className="text-[13px] text-[#b4b4b4] flex items-center gap-2">
              <LinkedinIcon className="w-4 h-4 text-white shrink-0" />
              <span>LinkedIn Company</span>
            </div>
            <div className="text-[16px] font-medium text-white truncate">
              {credentials.linkedin.companyName || 'Perfil Corporativo'}
            </div>
          </div>
          <span
            className={`h-6 px-2.5 rounded-full text-[12px] font-medium inline-flex items-center shrink-0 ${
              credentials.linkedin.status === 'connected'
                ? 'bg-[#222a10] text-[#c6f24e]'
                : 'bg-[#222222] text-[#b4b4b4]'
            }`}
          >
            {credentials.linkedin.status === 'connected' ? 'Conectado' : 'Configurar'}
          </span>
        </div>
      </section>

      {/* Row 3 — Posts Feed & Queue */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#b4b4b4]" />
            <span>Fila de postagens e histórico ({socialPosts.length})</span>
          </h2>

          <button
            type="button"
            onClick={() => setIsPublishModalOpen(true)}
            className="text-[13px] text-white hover:text-[#c6f24e] font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agendar postagem</span>
          </button>
        </div>

        {socialPosts.length === 0 ? (
          <div className="py-14 text-center rounded-[20px] bg-[#111111] border border-dashed border-[#242424] space-y-3">
            <Share2 className="w-8 h-8 text-[#949494] mx-auto" />
            <div>
              <p className="font-medium text-[15px] text-white">
                Nenhuma publicação agendada ou enviada
              </p>
              <p className="text-[13px] text-[#949494] mt-0.5">
                Utilize o motor de publicação para transmitir conteúdos no Instagram, Facebook e LinkedIn.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublishModalOpen(true)}
              className="h-9 px-4 rounded-full bg-white hover:bg-[#e6e6e6] text-black font-medium text-[13px] transition-colors cursor-pointer"
            >
              Criar primeira publicação
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {socialPosts.map((post) => (
              <div
                key={post.id}
                className="bg-[#111111] rounded-[20px] border border-[#1a1a1a] overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {post.mediaUrl && (
                    <div className="h-44 w-full bg-[#181818] relative overflow-hidden">
                      <img
                        src={post.mediaUrl}
                        alt="Criativo da publicação"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 flex gap-1.5">
                        {post.platforms.map((plat) => (
                          <span
                            key={plat}
                            className="p-1.5 rounded-full bg-black/80 text-white border border-[#2a2a2a]"
                          >
                            {plat === 'instagram' && <InstagramIcon className="w-3.5 h-3.5" />}
                            {plat === 'facebook' && <FacebookIcon className="w-3.5 h-3.5" />}
                            {plat === 'linkedin' && <LinkedinIcon className="w-3.5 h-3.5" />}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-[12px]">
                      <span
                        className={`h-6 px-2.5 rounded-full font-medium inline-flex items-center gap-1.5 ${
                          post.status === 'published'
                            ? 'bg-[#222a10] text-[#c6f24e]'
                            : 'bg-[#222222] text-white'
                        }`}
                      >
                        {post.status === 'published' ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>Publicado</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>Agendado</span>
                          </>
                        )}
                      </span>

                      <span className="text-[#949494] flex items-center gap-1 tabular-nums">
                        <Clock className="w-3 h-3" />
                        {post.scheduledDate}
                      </span>
                    </div>

                    <p className="text-[13px] text-[#e6e6e6] line-clamp-3 leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-3.5 bg-[#161616] border-t border-[#1a1a1a] flex items-center justify-between text-[12px] text-[#b4b4b4]">
                  {post.status === 'published' ? (
                    <div className="flex items-center gap-4 tabular-nums">
                      <span className="flex items-center gap-1 text-white font-medium">
                        <Heart className="w-3.5 h-3.5 text-[#e5566f]" />
                        <span>{post.likes || 14}</span>
                      </span>
                      <span className="flex items-center gap-1 text-white font-medium">
                        <MessageCircle className="w-3.5 h-3.5 text-[#b4b4b4]" />
                        <span>{post.comments || 3}</span>
                      </span>
                      <span className="flex items-center gap-1 text-white font-medium">
                        <Share2 className="w-3.5 h-3.5 text-[#b4b4b4]" />
                        <span>{post.shares || 2}</span>
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleTriggerScheduledPostNow(post)}
                      className="h-7 px-3 rounded-full bg-white text-black text-[12px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-black" />
                      <span>Publicar agora</span>
                    </button>
                  )}

                  <button
                    type="button"
                    title="Excluir publicação"
                    onClick={() => {
                      if (confirm('Deseja excluir esta publicação da fila?')) {
                        deleteSocialPost(post.id);
                      }
                    }}
                    className="p-1.5 rounded-full text-[#949494] hover:text-[#e5566f] hover:bg-[#2c1a20] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL 1: CHAVES DE API & INTEGRAÇÕES */}
      {isCredentialsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div
            data-ui="social-credentials-modal"
            className="w-full max-w-2xl bg-[#111111] border border-[#2a2a2a] rounded-[20px] overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-5 border-b border-[#1a1a1a] flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-semibold text-white">
                  Chaves de API das redes sociais
                </h3>
                <p className="text-[12px] text-[#949494]">
                  Configure os tokens oficiais para publicação multicanal automática
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCredentialsModalOpen(false)}
                className="h-8 w-8 rounded-full bg-[#1a1a1a] text-[#b4b4b4] hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex border-b border-[#1a1a1a] bg-[#161616] px-5 pt-2 gap-2 text-[13px] overflow-x-auto">
              {[
                { id: 'instagram', label: 'Instagram Graph', icon: InstagramIcon },
                { id: 'facebook', label: 'Facebook Pages', icon: FacebookIcon },
                { id: 'linkedin', label: 'LinkedIn Company', icon: LinkedinIcon },
                { id: 'webhook', label: 'Webhook Gateway', icon: Globe },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeCredentialsTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveCredentialsTab(tab.id as any);
                      setTestResult(null);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
                      active
                        ? 'border-white text-white font-medium'
                        : 'border-transparent text-[#949494] hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-[13px]">
              {activeCredentialsTab === 'instagram' && (
                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-[12px] bg-[#161616] border border-[#242424]">
                    <p className="font-medium text-white mb-0.5">
                      Meta for Developers (Instagram Graph API)
                    </p>
                    <p className="text-[12px] text-[#949494]">
                      Requer conta Instagram Business vinculada a uma Página do Facebook com permissões de publicação.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[#b4b4b4] font-medium mb-1">
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
                      className="w-full h-9 px-3 rounded-[10px] bg-[#181818] text-white border border-[#2e2e2e] tabular-nums focus:outline-none focus:border-[#444444]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#b4b4b4] font-medium mb-1">
                      Nome de usuário (@perfil)
                    </label>
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
                      className="w-full h-9 px-3 rounded-[10px] bg-[#181818] text-white border border-[#2e2e2e] focus:outline-none focus:border-[#444444]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[#b4b4b4] font-medium">
                        Meta Page Access Token *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowTokens({ ...showTokens, ig: !showTokens.ig })}
                        className="text-[12px] text-[#949494] hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {showTokens.ig ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showTokens.ig ? 'Ocultar' : 'Mostrar'}</span>
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
                      placeholder="EAAG..."
                      className="w-full h-9 px-3 rounded-[10px] bg-[#181818] text-white border border-[#2e2e2e] focus:outline-none focus:border-[#444444]"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleTestConnection('instagram')}
                      disabled={isTestingConnection === 'instagram'}
                      className="h-8 px-3.5 rounded-full bg-[#222222] hover:bg-[#2a2a2a] text-white text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          isTestingConnection === 'instagram' ? 'animate-spin' : ''
                        }`}
                      />
                      <span>
                        {isTestingConnection === 'instagram'
                          ? 'Validando...'
                          : 'Testar conexão Instagram'}
                      </span>
                    </button>
                    {credentials.instagram.lastTested && (
                      <span className="text-[12px] text-[#949494]">
                        Último teste: {credentials.instagram.lastTested}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {activeCredentialsTab === 'facebook' && (
                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-[12px] bg-[#161616] border border-[#242424]">
                    <p className="font-medium text-white mb-0.5">Facebook Graph API (Pages)</p>
                    <p className="text-[12px] text-[#949494]">
                      Publica fotos, vídeos e textos diretamente no feed da Página Oficial do Facebook.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[#b4b4b4] font-medium mb-1">
                      Facebook Page ID *
                    </label>
                    <input
                      type="text"
                      value={credentials.facebook.pageId || ''}
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          facebook: { ...credentials.facebook, pageId: e.target.value },
                        })
                      }
                      className="w-full h-9 px-3 rounded-[10px] bg-[#181818] text-white border border-[#2e2e2e] tabular-nums focus:outline-none focus:border-[#444444]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#b4b4b4] font-medium mb-1">
                      Nome da página
                    </label>
                    <input
                      type="text"
                      value={credentials.facebook.pageName || ''}
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          facebook: { ...credentials.facebook, pageName: e.target.value },
                        })
                      }
                      className="w-full h-9 px-3 rounded-[10px] bg-[#181818] text-white border border-[#2e2e2e] focus:outline-none focus:border-[#444444]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[#b4b4b4] font-medium">Page Access Token *</label>
                      <button
                        type="button"
                        onClick={() => setShowTokens({ ...showTokens, fb: !showTokens.fb })}
                        className="text-[12px] text-[#949494] hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {showTokens.fb ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showTokens.fb ? 'Ocultar' : 'Mostrar'}</span>
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
                      placeholder="EAAG..."
                      className="w-full h-9 px-3 rounded-[10px] bg-[#181818] text-white border border-[#2e2e2e] focus:outline-none focus:border-[#444444]"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleTestConnection('facebook')}
                      disabled={isTestingConnection === 'facebook'}
                      className="h-8 px-3.5 rounded-full bg-[#222222] hover:bg-[#2a2a2a] text-white text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          isTestingConnection === 'facebook' ? 'animate-spin' : ''
                        }`}
                      />
                      <span>
                        {isTestingConnection === 'facebook'
                          ? 'Validando...'
                          : 'Testar conexão Facebook'}
                      </span>
                    </button>
                    {credentials.facebook.lastTested && (
                      <span className="text-[12px] text-[#949494]">
                        Último teste: {credentials.facebook.lastTested}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {activeCredentialsTab === 'linkedin' && (
                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-[12px] bg-[#161616] border border-[#242424]">
                    <p className="font-medium text-white mb-0.5">LinkedIn Company Pages API</p>
                    <p className="text-[12px] text-[#949494]">
                      Dispara publicações corporativas no perfil oficial da organização no LinkedIn.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[#b4b4b4] font-medium mb-1">
                      Organization URN (Company ID) *
                    </label>
                    <input
                      type="text"
                      value={credentials.linkedin.organizationUrn || ''}
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          linkedin: {
                            ...credentials.linkedin,
                            organizationUrn: e.target.value,
                          },
                        })
                      }
                      className="w-full h-9 px-3 rounded-[10px] bg-[#181818] text-white border border-[#2e2e2e] focus:outline-none focus:border-[#444444]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#b4b4b4] font-medium mb-1">
                      Nome da empresa
                    </label>
                    <input
                      type="text"
                      value={credentials.linkedin.companyName || ''}
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          linkedin: { ...credentials.linkedin, companyName: e.target.value },
                        })
                      }
                      className="w-full h-9 px-3 rounded-[10px] bg-[#181818] text-white border border-[#2e2e2e] focus:outline-none focus:border-[#444444]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[#b4b4b4] font-medium">
                        LinkedIn OAuth Access Token *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowTokens({ ...showTokens, li: !showTokens.li })}
                        className="text-[12px] text-[#949494] hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {showTokens.li ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showTokens.li ? 'Ocultar' : 'Mostrar'}</span>
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
                      placeholder="AQV..."
                      className="w-full h-9 px-3 rounded-[10px] bg-[#181818] text-white border border-[#2e2e2e] focus:outline-none focus:border-[#444444]"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleTestConnection('linkedin')}
                      disabled={isTestingConnection === 'linkedin'}
                      className="h-8 px-3.5 rounded-full bg-[#222222] hover:bg-[#2a2a2a] text-white text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          isTestingConnection === 'linkedin' ? 'animate-spin' : ''
                        }`}
                      />
                      <span>
                        {isTestingConnection === 'linkedin'
                          ? 'Validando...'
                          : 'Testar conexão LinkedIn'}
                      </span>
                    </button>
                    {credentials.linkedin.lastTested && (
                      <span className="text-[12px] text-[#949494]">
                        Último teste: {credentials.linkedin.lastTested}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {activeCredentialsTab === 'webhook' && (
                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-[12px] bg-[#161616] border border-[#242424]">
                    <p className="font-medium text-white mb-0.5">
                      Webhook central (n8n, Make ou Zapier)
                    </p>
                    <p className="text-[12px] text-[#949494]">
                      Dispara payloads JSON com mídia e legenda para fluxos externos de automação.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
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
                      className="w-4 h-4 rounded"
                    />
                    <label htmlFor="webhook_enabled" className="text-[13px] text-white cursor-pointer">
                      Ativar transmissão paralela via Webhook
                    </label>
                  </div>

                  <div>
                    <label className="block text-[#b4b4b4] font-medium mb-1">
                      Endpoint URL do Webhook
                    </label>
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
                      className="w-full h-9 px-3 rounded-[10px] bg-[#181818] text-white border border-[#2e2e2e] focus:outline-none focus:border-[#444444]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#b4b4b4] font-medium mb-1">
                      Secret Token (opcional)
                    </label>
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
                      className="w-full h-9 px-3 rounded-[10px] bg-[#181818] text-white border border-[#2e2e2e] focus:outline-none focus:border-[#444444]"
                    />
                  </div>
                </div>
              )}

              {testResult && (
                <div className="p-3 rounded-[10px] bg-[#181818] border border-[#2e2e2e] text-[13px] text-white">
                  {testResult}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#1a1a1a] flex items-center justify-between">
              <span className="text-[12px] text-[#949494] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#c6f24e]" />
                <span>Criptografia AES-256 no banco Supabase</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCredentialsModalOpen(false)}
                  className="h-9 px-4 rounded-full border border-[#2e2e2e] text-[#b4b4b4] hover:text-white text-[13px] font-medium transition-colors cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleSaveAllCredentials}
                  disabled={isSavingCredentials}
                  className="h-9 px-4 rounded-full bg-white hover:bg-[#e6e6e6] text-black text-[13px] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSavingCredentials ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Salvar chaves</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MOTOR DE PUBLICAÇÃO MULTICANAL */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div
            data-ui="social-publish-modal"
            className="w-full max-w-5xl bg-[#111111] border border-[#2a2a2a] rounded-[20px] overflow-hidden flex flex-col max-h-[92vh]"
          >
            <div className="p-5 border-b border-[#1a1a1a] flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-semibold text-white">
                  Nova publicação multicanal
                </h3>
                <p className="text-[12px] text-[#949494]">
                  Transmita fotos e legendas para Instagram, Facebook e LinkedIn simultaneamente
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="h-8 w-8 rounded-full bg-[#1a1a1a] text-[#b4b4b4] hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#1a1a1a] overflow-y-auto flex-1">
              <form
                onSubmit={handleExecutePublish}
                className="lg:col-span-7 p-5 space-y-4 text-[13px] overflow-y-auto"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[#b4b4b4] font-medium">Canais selecionados</label>
                    <button
                      type="button"
                      onClick={selectAllPlatforms}
                      className="text-[12px] text-[#c6f24e] hover:underline cursor-pointer"
                    >
                      Selecionar todas (3)
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'instagram' as SocialPlatform, label: 'Instagram', icon: InstagramIcon },
                      { id: 'facebook' as SocialPlatform, label: 'Facebook', icon: FacebookIcon },
                      { id: 'linkedin' as SocialPlatform, label: 'LinkedIn', icon: LinkedinIcon },
                    ].map((item) => {
                      const Icon = item.icon;
                      const active = selectedPlatforms.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => togglePlatform(item.id)}
                          className={`h-10 rounded-[10px] border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            active
                              ? 'border-white bg-[#222222] text-white font-medium'
                              : 'border-[#242424] bg-[#161616] text-[#949494] hover:text-white'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3.5 rounded-[14px] bg-[#161616] border border-[#242424] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#c6f24e]" />
                      <span>Assistente criativo de IA</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleGenerateAiCaption}
                      disabled={isGeneratingAi}
                      className="h-7 px-3 rounded-full bg-white text-black text-[12px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingAi ? 'Gerando...' : 'Gerar legenda'}
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Tema do post (ex: benefícios da manutenção preventiva)..."
                    value={postTopic}
                    onChange={(e) => setPostTopic(e.target.value)}
                    className="w-full h-9 px-3 rounded-[10px] bg-[#111111] text-white border border-[#2e2e2e] text-[13px] focus:outline-none focus:border-[#444444]"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[#b4b4b4] font-medium">Legenda da publicação *</label>
                    <span className="text-[12px] text-[#949494] tabular-nums">
                      {postContent.length} caracteres
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Escreva o texto completo com chamada para ação..."
                    className="w-full p-3 rounded-[10px] bg-[#181818] text-white border border-[#2e2e2e] focus:outline-none focus:border-[#444444] leading-relaxed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[#b4b4b4] font-medium">
                    Imagem ou fotografia da publicação
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={postMediaUrl}
                      onChange={(e) => setPostMediaUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 h-9 px-3 rounded-[10px] bg-[#181818] text-white border border-[#2e2e2e] focus:outline-none focus:border-[#444444]"
                    />
                    <label className="h-9 px-3.5 rounded-[10px] bg-[#181818] hover:bg-[#222222] text-white border border-[#2e2e2e] font-medium flex items-center gap-1.5 cursor-pointer shrink-0">
                      <Upload className="w-3.5 h-3.5 text-[#c6f24e]" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="p-3.5 rounded-[14px] bg-[#161616] border border-[#242424] space-y-2.5">
                  <span className="text-[12px] font-medium text-[#b4b4b4] block">
                    Modo de envio
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsImmediate(true)}
                      className={`h-9 rounded-[10px] border text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        isImmediate
                          ? 'border-[#c6f24e] bg-[#222a10] text-[#c6f24e]'
                          : 'border-[#242424] text-[#949494]'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publicar agora</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsImmediate(false)}
                      className={`h-9 rounded-[10px] border text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        !isImmediate
                          ? 'border-white bg-[#222222] text-white'
                          : 'border-[#242424] text-[#949494]'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Agendar horário</span>
                    </button>
                  </div>

                  {!isImmediate && (
                    <div>
                      <label className="block text-[12px] text-[#949494] mb-1">
                        Data e hora programada
                      </label>
                      <input
                        type="text"
                        value={postDate}
                        onChange={(e) => setPostDate(e.target.value)}
                        className="w-full h-9 px-3 rounded-[10px] bg-[#111111] text-white border border-[#2e2e2e] tabular-nums focus:outline-none focus:border-[#444444]"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isPublishing || !postContent.trim()}
                  className="w-full h-10 rounded-full bg-white hover:bg-[#e6e6e6] text-black font-medium text-[14px] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transmitindo...</span>
                    </>
                  ) : isImmediate ? (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Publicar imediatamente ({selectedPlatforms.length} redes)</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Confirmar agendamento</span>
                    </>
                  )}
                </button>
              </form>

              {/* Live Preview Column */}
              <div className="lg:col-span-5 p-5 flex flex-col items-center justify-start bg-[#0a0a0a] overflow-y-auto">
                <div className="flex items-center gap-1 p-1 bg-[#161616] rounded-full border border-[#242424] mb-4 text-[12px]">
                  {[
                    { id: 'instagram' as SocialPlatform, label: 'Instagram' },
                    { id: 'facebook' as SocialPlatform, label: 'Facebook' },
                    { id: 'linkedin' as SocialPlatform, label: 'LinkedIn' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPreviewPlatform(p.id)}
                      className={`h-7 px-3 rounded-full transition-colors cursor-pointer ${
                        previewPlatform === p.id
                          ? 'bg-white text-black font-medium'
                          : 'text-[#949494] hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="w-72 bg-[#111111] rounded-[16px] border border-[#242424] overflow-hidden text-[12px]">
                  <div className="p-3 flex items-center gap-2.5 border-b border-[#1a1a1a]">
                    <div className="w-7 h-7 rounded-full bg-[#181818] border border-[#2e2e2e] flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={companyLogoUrl}
                        alt={currentSubaccount.name}
                        className="w-full h-full object-contain p-0.5"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="font-medium text-white block truncate">
                        {currentSubaccount.name}
                      </span>
                      <span className="text-[11px] text-[#949494]">
                        Prévia {previewPlatform}
                      </span>
                    </div>
                  </div>

                  <div className="h-52 bg-black overflow-hidden flex items-center justify-center">
                    {postMediaUrl ? (
                      <img
                        src={postMediaUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[#949494]">Sem imagem selecionada</span>
                    )}
                  </div>

                  <div className="p-3.5 space-y-2">
                    <p className="text-[12px] text-[#e6e6e6] line-clamp-4 leading-relaxed whitespace-pre-wrap">
                      {postContent || 'Escreva a legenda ao lado para visualizar aqui...'}
                    </p>
                    <div className="pt-2 border-t border-[#1a1a1a] flex items-center justify-between text-[#949494]">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5" /> Curtir
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" /> Comentar
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="w-3.5 h-3.5" /> Compartilhar
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
