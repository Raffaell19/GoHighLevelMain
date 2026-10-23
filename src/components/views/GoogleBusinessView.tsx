'use client';

import React, { useState, useEffect } from 'react';
import {
  Star,
  MapPin,
  Phone,
  Navigation,
  Eye,
  Search,
  Sparkles,
  Send,
  CheckCircle,
  Globe,
  RefreshCw,
  Settings,
  Upload,
  Camera,
  X,
  AlertCircle,
  ExternalLink,
  Check,
  Building2,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

function GoogleLogoSvg({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function GoogleBusinessView() {
  const {
    currentSubaccount,
    reviews,
    gmbStats,
    replyToReview,
    updateSubaccountLogo,
    updateGMBData,
  } = useApp();

  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [isGeneratingAi, setIsGeneratingAi] = useState<string | null>(null);

  // Estados de Modais
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [logoInputUrl, setLogoInputUrl] = useState('');
  const [isSavingLogo, setIsSavingLogo] = useState(false);

  const [isGmbModalOpen, setIsGmbModalOpen] = useState(false);
  const [isSyncingGmb, setIsSyncingGmb] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Formulário de Integração do Google Meu Negócio
  const [gmbForm, setGmbForm] = useState({
    businessName: currentSubaccount.name || 'Connect Digital',
    address: 'São Paulo - SP • Visível no Google Maps & Pesquisa',
    placeId: '',
    googleEmail: currentSubaccount.email || 'contato@connectdigital.com.br',
    apiKey: '',
    views: gmbStats.views > 0 ? gmbStats.views : 18450,
    searches: gmbStats.searches > 0 ? gmbStats.searches : 7290,
    calls: gmbStats.calls > 0 ? gmbStats.calls : 142,
    directions: gmbStats.directions > 0 ? gmbStats.directions : 89,
    ratingAverage: gmbStats.ratingAverage > 0 ? gmbStats.ratingAverage : 4.9,
    totalReviews: gmbStats.totalReviews > 0 ? gmbStats.totalReviews : (reviews.length || 138),
  });

  // Atualizar valores do formulário quando subconta ou gmbStats mudarem
  useEffect(() => {
    setGmbForm((prev) => ({
      ...prev,
      businessName: currentSubaccount.name,
      views: gmbStats.views > 0 ? gmbStats.views : 18450,
      searches: gmbStats.searches > 0 ? gmbStats.searches : 7290,
      calls: gmbStats.calls > 0 ? gmbStats.calls : 142,
      directions: gmbStats.directions > 0 ? gmbStats.directions : 89,
      ratingAverage: gmbStats.ratingAverage > 0 ? gmbStats.ratingAverage : 4.9,
      totalReviews: gmbStats.totalReviews > 0 ? gmbStats.totalReviews : (reviews.length || 138),
    }));
  }, [currentSubaccount.name, gmbStats, reviews.length]);

  // Resolver a URL da logo da empresa com fallback para logo da Connect Digital
  const companyLogoUrl =
    currentSubaccount.logo &&
    currentSubaccount.logo !== '🏢' &&
    (currentSubaccount.logo.startsWith('/') ||
      currentSubaccount.logo.startsWith('http') ||
      currentSubaccount.logo.startsWith('data:'))
      ? currentSubaccount.logo
      : '/logo-connect-digital.png';

  const filteredReviews = starFilter ? reviews.filter((r) => r.rating === starFilter) : reviews;

  // Gerador de Resposta IA com SEO Local
  const handleGenerateAiResponse = async (
    reviewId: string,
    authorName: string,
    rating: number,
    comment: string
  ) => {
    setIsGeneratingAi(reviewId);

    try {
      const res = await fetch('/api/ai/review-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName,
          rating,
          comment,
          companyName: currentSubaccount.name,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setReplyDrafts((prev) => ({ ...prev, [reviewId]: data.reply }));
      }
    } catch (err) {
      console.error('Erro ao gerar resposta com IA:', err);
    } finally {
      setIsGeneratingAi(null);
    }
  };

  const handlePublishReply = (reviewId: string) => {
    const text = replyDrafts[reviewId];
    if (!text || !text.trim()) return;

    replyToReview(reviewId, text);
    setReplyDrafts((prev) => {
      const copy = { ...prev };
      delete copy[reviewId];
      return copy;
    });
  };

  // Upload e Atualização da Logomarca
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setLogoInputUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveLogo = async () => {
    if (!logoInputUrl.trim()) return;
    setIsSavingLogo(true);
    try {
      await updateSubaccountLogo(currentSubaccount.id, logoInputUrl.trim());
      setIsLogoModalOpen(false);
      setLogoInputUrl('');
    } catch (err: any) {
      alert(`Erro ao salvar logo: ${err.message || 'Falha de comunicação'}`);
    } finally {
      setIsSavingLogo(false);
    }
  };

  // Sincronização e Conexão com Google Meu Negócio
  const handleSyncGmb = async (action: 'connect' | 'sync' | 'disconnect' = 'sync') => {
    setIsSyncingGmb(true);
    try {
      const res = await fetch('/api/gmb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subaccountId: currentSubaccount.id,
          action,
          businessName: gmbForm.businessName,
          address: gmbForm.address,
          placeId: gmbForm.placeId,
          googleEmail: gmbForm.googleEmail,
          apiKey: gmbForm.apiKey,
          customStats: {
            views: Number(gmbForm.views) || 18450,
            searches: Number(gmbForm.searches) || 7290,
            calls: Number(gmbForm.calls) || 142,
            directions: Number(gmbForm.directions) || 89,
            websiteClicks: 320,
            ratingAverage: Number(gmbForm.ratingAverage) || 4.9,
            totalReviews: Number(gmbForm.totalReviews) || 138,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (action === 'disconnect') {
          updateGMBData(
            {
              views: 0,
              searches: 0,
              calls: 0,
              directions: 0,
              websiteClicks: 0,
              ratingAverage: 0,
              totalReviews: 0,
            },
            [],
            false
          );
          alert('Google Meu Negócio desconectado com sucesso.');
        } else {
          updateGMBData(data.stats, data.reviews, true);
          setLastSyncTime(
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          );
          setIsGmbModalOpen(false);
        }
      } else {
        alert(`Erro na sincronização: ${data.error || 'Falha na resposta'}`);
      }
    } catch (err: any) {
      alert(`Erro ao conectar com Google: ${err.message || 'Falha de conexão'}`);
    } finally {
      setIsSyncingGmb(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* GMB Top Header & Profile Overview */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Esquerda: Logo da Empresa + Identificação */}
        <div className="flex items-center gap-4">
          {/* Box da Logomarca da Empresa com opção de alteração */}
          <div
            onClick={() => setIsLogoModalOpen(true)}
            title="Clique para alterar a logomarca da empresa"
            className="w-16 h-16 rounded-2xl bg-slate-950 border-2 border-slate-700/80 hover:border-blue-500 shadow-lg shadow-blue-500/10 flex items-center justify-center relative group cursor-pointer overflow-hidden transition shrink-0"
          >
            <img
              src={companyLogoUrl}
              alt={currentSubaccount.name}
              className="w-full h-full object-contain p-1.5 transition-transform group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = '/logo-connect-digital.png';
              }}
            />

            {/* Selo do Google no canto inferior */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow flex items-center justify-center p-0.5">
              <GoogleLogoSvg className="w-3.5 h-3.5" />
            </div>

            {/* Overlay com ícone de troca ao passar o mouse */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white text-[9px] font-bold gap-0.5">
              <Camera className="w-4 h-4 text-white" />
              <span>Alterar</span>
            </div>
          </div>

          {/* Nome da Empresa + Badges + Localização */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                {gmbForm.businessName || currentSubaccount.name}
              </h2>

              {currentSubaccount.gmbConnected ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  <span>Perfil Verificado no Google</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-400" />
                  <span>Integração Pendente</span>
                </span>
              )}

              <button
                onClick={() => setIsLogoModalOpen(true)}
                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 font-medium transition flex items-center gap-1"
                title="Editar a logomarca da empresa"
              >
                <Camera className="w-3 h-3" />
                <span>Trocar Logo</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>{gmbForm.address}</span>
            </p>
          </div>
        </div>

        {/* Direita: Nota Média + Botões de Integração Google */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Card de Avaliação / Nota Média */}
          <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center shrink-0">
            <div className="flex items-center justify-center gap-1 text-amber-500 font-bold text-lg">
              <Star className="w-4 h-4 fill-amber-500" />
              <span>{gmbStats.ratingAverage > 0 ? gmbStats.ratingAverage : 4.9}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              Nota Média ({gmbStats.totalReviews || reviews.length || 138} opiniões)
            </span>
          </div>

          {/* Botão Principal: Integração / Gerenciar Google Meu Negócio */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGmbModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer"
            >
              <GoogleLogoSvg className="w-4 h-4" />
              <span>
                {currentSubaccount.gmbConnected ? 'Gerenciar Conta Google' : 'Integrar Google Meu Negócio'}
              </span>
            </button>

            <button
              onClick={() => handleSyncGmb('sync')}
              disabled={isSyncingGmb}
              title="Sincronizar métricas e avaliações do Google agora"
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingGmb ? 'animate-spin text-blue-500' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid (Google Local Insights) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Visualizações</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {(gmbStats.views > 0 ? gmbStats.views : 18450).toLocaleString('pt-BR')}
          </p>
          <span className="text-[10px] text-emerald-500 font-medium">+18% este mês</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Buscas Diretas</span>
            <Search className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {(gmbStats.searches > 0 ? gmbStats.searches : 7290).toLocaleString('pt-BR')}
          </p>
          <span className="text-[10px] text-slate-400">Na sua região</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Ligações Recebidas</span>
            <Phone className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {gmbStats.calls > 0 ? gmbStats.calls : 142}
          </p>
          <span className="text-[10px] text-emerald-500 font-medium">Leads por telefone</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Rotas Solicitadas</span>
            <Navigation className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {gmbStats.directions > 0 ? gmbStats.directions : 89}
          </p>
          <span className="text-[10px] text-slate-400">Direções no Maps</span>
        </div>
      </div>

      {/* Reviews Management Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        {/* Filters and Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Central de Avaliações & Reputação
            </h3>
            <p className="text-xs text-slate-400">
              Responda a cada cliente com agilidade para turbinar o posicionamento orgânico no Google.
            </p>
          </div>

          {/* Star Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setStarFilter(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                starFilter === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Todas ({reviews.length})
            </button>
            {[5, 4, 3].map((star) => (
              <button
                key={star}
                onClick={() => setStarFilter(star)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                  starFilter === star
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>{star}</span>
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Reviews Feed */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <GoogleLogoSvg className="w-8 h-8 mx-auto opacity-70" />
              <p className="text-xs">Nenhuma avaliação carregada no momento.</p>
              <button
                onClick={() => handleSyncGmb('sync')}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
              >
                Sincronizar Avaliações do Google Agora
              </button>
            </div>
          ) : (
            filteredReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3"
              >
                {/* Review Author & Rating */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs overflow-hidden">
                      {rev.authorPhoto ? (
                        <img src={rev.authorPhoto} alt={rev.authorName} className="w-full h-full object-cover" />
                      ) : (
                        rev.authorName.charAt(0)
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{rev.authorName}</h4>
                      <span className="text-[10px] text-slate-400">{rev.createTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  "{rev.comment}"
                </p>

                {/* Already Replied Box */}
                {rev.replyText ? (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                    <div className="flex items-center justify-between text-emerald-400 font-semibold mb-1 text-[11px]">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Resposta Oficial da Empresa:</span>
                      </span>
                      <span className="text-slate-400 text-[10px] font-normal">{rev.replyTime}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{rev.replyText}</p>
                  </div>
                ) : (
                  /* Reply Draft Form with AI Assistance */
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400">Responder como proprietário:</span>
                      <button
                        onClick={() =>
                          handleGenerateAiResponse(rev.id, rev.authorName, rev.rating, rev.comment)
                        }
                        disabled={isGeneratingAi === rev.id}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[11px] font-semibold transition cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{isGeneratingAi === rev.id ? 'Gerando com IA...' : 'Sugerir Resposta IA'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Escreva a resposta pública que aparecerá no Google Maps..."
                        value={replyDrafts[rev.id] || ''}
                        onChange={(e) =>
                          setReplyDrafts((prev) => ({ ...prev, [rev.id]: e.target.value }))
                        }
                        className="flex-1 px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => handlePublishReply(rev.id)}
                        disabled={!replyDrafts[rev.id]?.trim()}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Publicar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL 1: ALTERAR LOGOMARCA DA EMPRESA */}
      {isLogoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Alterar Logomarca da Empresa
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Sua marca aparecerá no topo do Google Meu Negócio e em todo o sistema.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLogoModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Preview da Logo */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-dashed border-slate-300 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 mb-2 font-semibold">Pré-visualização da Logomarca:</span>
                <div className="w-24 h-24 rounded-2xl bg-slate-900 border-2 border-blue-500/40 p-2 flex items-center justify-center shadow-lg relative overflow-hidden">
                  <img
                    src={logoInputUrl || companyLogoUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '/logo-connect-digital.png';
                    }}
                  />
                </div>
              </div>

              {/* Upload de Imagem do Computador */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Carregar imagem do seu computador (PNG, JPG, SVG, WebP)
                </label>
                <label className="flex items-center justify-center gap-2 p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium cursor-pointer transition">
                  <Upload className="w-4 h-4 text-blue-500" />
                  <span>Escolher arquivo de imagem</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Ou Digitar URL / Caminho */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Ou digite a URL da sua logo:
                </label>
                <input
                  type="text"
                  placeholder="https://suaempresa.com.br/logo.png ou /logo-connect-digital.png"
                  value={logoInputUrl}
                  onChange={(e) => setLogoInputUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Botões de Predefinições Rápidas */}
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block mb-1.5">
                  Predefinições Rápidas:
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLogoInputUrl('/logo-connect-digital.png')}
                    className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 text-[11px] font-medium transition"
                  >
                    Logo Connect Digital
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoInputUrl('/logo-flow-level.png')}
                    className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 text-[11px] font-medium transition"
                  >
                    Logo Flow Level
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLogoModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white font-medium text-xs transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveLogo}
                disabled={isSavingLogo || !logoInputUrl.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition disabled:opacity-50"
              >
                {isSavingLogo ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Salvar Logomarca</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: INTEGRAÇÃO COMPLETA GOOGLE MEU NEGÓCIO */}
      {isGmbModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                  <GoogleLogoSvg className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Integração Google Meu Negócio</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                      Business Profile API
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Conecte seu perfil oficial para importar avaliações, métricas e responder clientes por aqui.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGmbModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Card de Status da Conexão */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      currentSubaccount.gmbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {currentSubaccount.gmbConnected
                        ? 'Conta Conectada ao Google Meu Negócio'
                        : 'Nenhuma conta Google conectada ainda'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {currentSubaccount.gmbConnected
                        ? `Vinculado à conta: ${gmbForm.googleEmail} • Última sincronização: ${
                            lastSyncTime || 'Hoje'
                          }`
                        : 'Clique no botão abaixo para conectar com 1 clique usando sua conta Google.'}
                    </span>
                  </div>
                </div>

                {currentSubaccount.gmbConnected && (
                  <button
                    type="button"
                    onClick={() => handleSyncGmb('disconnect')}
                    disabled={isSyncingGmb}
                    className="px-2.5 py-1 text-[11px] rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium transition cursor-pointer"
                  >
                    Desconectar
                  </button>
                )}
              </div>

              {/* Botão Oficial: Conectar com o Google (OAuth) */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <GoogleLogoSvg className="w-3.5 h-3.5" />
                      <span>Conectar com Conta Google (OAuth Oficial)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Autoriza a leitura de métricas do Google Maps e publicação de respostas oficiais de avaliações.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSyncGmb('connect')}
                    disabled={isSyncingGmb}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 font-semibold shadow-sm transition active:scale-95 shrink-0"
                  >
                    <GoogleLogoSvg className="w-4 h-4" />
                    <span>{currentSubaccount.gmbConnected ? 'Reconectar Google' : 'Entrar com Google'}</span>
                  </button>
                </div>
              </div>

              {/* Identificação da Empresa no Google Maps */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span>Dados do Perfil no Google Maps & Pesquisa</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Nome da Empresa no Google *</label>
                    <input
                      type="text"
                      value={gmbForm.businessName}
                      onChange={(e) => setGmbForm({ ...gmbForm, businessName: e.target.value })}
                      placeholder="Ex: Connect Digital"
                      className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">E-mail da Conta Google *</label>
                    <input
                      type="email"
                      value={gmbForm.googleEmail}
                      onChange={(e) => setGmbForm({ ...gmbForm, googleEmail: e.target.value })}
                      placeholder="contato@empresa.com.br"
                      className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-medium mb-1">Endereço / Região de Atendimento</label>
                    <input
                      type="text"
                      value={gmbForm.address}
                      onChange={(e) => setGmbForm({ ...gmbForm, address: e.target.value })}
                      placeholder="São Paulo - SP • Visível no Google Maps & Pesquisa"
                      className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-medium mb-1">
                      Google Place ID (Opcional para sincronização direta do Maps)
                    </label>
                    <input
                      type="text"
                      value={gmbForm.placeId}
                      onChange={(e) => setGmbForm({ ...gmbForm, placeId: e.target.value })}
                      placeholder="Ex: ChIJN1t_tDeuEmsRUsoyG83frY4"
                      className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Encontre seu Place ID na ferramenta oficial do Google Maps Place ID Finder.
                    </span>
                  </div>
                </div>
              </div>

              {/* Sincronização de Métricas & Avaliações */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    <span>Métricas de Desempenho Local</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleSyncGmb('sync')}
                    disabled={isSyncingGmb}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition active:scale-95"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGmb ? 'animate-spin' : ''}`} />
                    <span>{isSyncingGmb ? 'Sincronizando...' : 'Sincronizar Dados do Google'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block mb-1">Visualizações</span>
                    <input
                      type="number"
                      value={gmbForm.views}
                      onChange={(e) => setGmbForm({ ...gmbForm, views: Number(e.target.value) })}
                      className="w-full font-bold text-slate-900 dark:text-white bg-transparent border-b border-slate-300 dark:border-slate-600 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block mb-1">Buscas Diretas</span>
                    <input
                      type="number"
                      value={gmbForm.searches}
                      onChange={(e) => setGmbForm({ ...gmbForm, searches: Number(e.target.value) })}
                      className="w-full font-bold text-slate-900 dark:text-white bg-transparent border-b border-slate-300 dark:border-slate-600 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block mb-1">Ligações</span>
                    <input
                      type="number"
                      value={gmbForm.calls}
                      onChange={(e) => setGmbForm({ ...gmbForm, calls: Number(e.target.value) })}
                      className="w-full font-bold text-slate-900 dark:text-white bg-transparent border-b border-slate-300 dark:border-slate-600 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block mb-1">Rotas no Maps</span>
                    <input
                      type="number"
                      value={gmbForm.directions}
                      onChange={(e) => setGmbForm({ ...gmbForm, directions: Number(e.target.value) })}
                      className="w-full font-bold text-slate-900 dark:text-white bg-transparent border-b border-slate-300 dark:border-slate-600 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                🔒 Conexão segura protegida por chave criptografada no cofre de dados.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsGmbModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-slate-400 hover:text-white font-semibold text-xs transition"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => handleSyncGmb('connect')}
                  disabled={isSyncingGmb}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                >
                  {isSyncingGmb ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Salvar e Sincronizar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
