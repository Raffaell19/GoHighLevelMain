'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Star,
  Sparkles,
  Send,
  CheckCircle,
  Camera,
  RefreshCw,
  X,
  Upload,
  Check,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

function GoogleLogoSvg({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default function GoogleBusinessView() {
  const {
    currentSubaccount,
    gmbStats,
    reviews,
    replyToReview,
    updateSubaccountLogo,
    updateGMBData,
  } = useApp();

  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [isGeneratingAi, setIsGeneratingAi] = useState<string | null>(null);

  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [logoInputUrl, setLogoInputUrl] = useState(currentSubaccount.logo || '');
  const [isSavingLogo, setIsSavingLogo] = useState(false);

  const [isGmbModalOpen, setIsGmbModalOpen] = useState(false);
  const [isSyncingGmb, setIsSyncingGmb] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [gmbForm, setGmbForm] = useState({
    businessName: currentSubaccount.name,
    address: 'Brasil · Visível no Google Maps e Pesquisa',
    placeId: '',
    googleEmail: currentSubaccount.email || 'contato@connectdigital.com.br',
    views: gmbStats.views || 0,
    searches: gmbStats.searches || 0,
    calls: gmbStats.calls || 0,
    directions: gmbStats.directions || 0,
  });

  useEffect(() => {
    setLogoInputUrl(currentSubaccount.logo || '/logo-connect-digital.png');
    setGmbForm((prev) => ({
      ...prev,
      businessName: currentSubaccount.name,
      googleEmail: currentSubaccount.email || 'contato@connectdigital.com.br',
      views: gmbStats.views || 0,
      searches: gmbStats.searches || 0,
      calls: gmbStats.calls || 0,
      directions: gmbStats.directions || 0,
    }));
  }, [currentSubaccount, gmbStats]);

  useEffect(() => {
    let isMounted = true;
    async function loadGmbFromApi() {
      try {
        const res = await fetch(`/api/gmb?subaccountId=${currentSubaccount.id}`);
        const data = await res.json();
        if (isMounted && data.stats && data.reviews) {
          updateGMBData(data.stats, data.reviews, data.connected);
          if (data.config) {
            setGmbForm((prev) => ({
              ...prev,
              businessName: data.config.businessName || currentSubaccount.name,
              address:
                data.config.address || 'São Paulo - SP · Visível no Google Maps e Pesquisa',
              placeId: data.config.placeId || 'ChIJ0WGkg4FEzpQRrlsz_whLqZs',
              googleEmail: data.config.googleEmail || currentSubaccount.email,
            }));
            if (data.config.lastSync) {
              const dt = new Date(data.config.lastSync);
              setLastSyncTime(
                dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              );
            }
          }
        }
      } catch (err) {
        console.warn('Aviso ao carregar GMB:', err);
      }
    }
    loadGmbFromApi();
    return () => {
      isMounted = false;
    };
  }, [currentSubaccount.id]);

  const companyLogoUrl =
    currentSubaccount.logo &&
    (currentSubaccount.logo.startsWith('/') ||
      currentSubaccount.logo.startsWith('http') ||
      currentSubaccount.logo.startsWith('data:'))
      ? currentSubaccount.logo
      : '/logo-connect-digital.png';

  const filteredReviews = starFilter
    ? reviews.filter((r) => r.rating === starFilter)
    : reviews;

  const handleGenerateAiResponse = (
    reviewId: string,
    authorRaw: string | undefined,
    rating: number,
    comment: string
  ) => {
    setIsGeneratingAi(reviewId);
    const authorName = authorRaw || 'Cliente';

    setTimeout(() => {
      let draft = '';
      const firstName = authorName.split(' ')[0];
      if (rating >= 4) {
        draft = `Olá ${firstName}! Muito obrigado pela avaliação de ${rating} estrelas e pela confiança na ${currentSubaccount.name}. Ficamos à disposição sempre que precisar!`;
      } else {
        draft = `Olá ${firstName}, agradecemos o seu retorno. Na ${currentSubaccount.name} prezamos pela qualidade total. Nossa gerência entrará em contato para solucionar qualquer ponto imediatamente.`;
      }

      setReplyDrafts((prev) => ({ ...prev, [reviewId]: draft }));
      setIsGeneratingAi(null);
    }, 500);
  };

  const handlePublishReply = async (reviewId: string) => {
    const text = replyDrafts[reviewId];
    if (!text || !text.trim()) return;
    await replyToReview(reviewId, text);
    setReplyDrafts((prev) => {
      const copy = { ...prev };
      delete copy[reviewId];
      return copy;
    });
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoInputUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLogo = async () => {
    if (!logoInputUrl.trim()) return;
    setIsSavingLogo(true);
    await updateSubaccountLogo(currentSubaccount.id, logoInputUrl.trim());
    setIsSavingLogo(false);
    setIsLogoModalOpen(false);
  };

  const handleSyncGmb = async (actionType: 'connect' | 'sync' | 'disconnect' = 'sync') => {
    setIsSyncingGmb(true);
    try {
      const customStatsPayload = {
        views: Number(gmbForm.views) || 18450,
        searches: Number(gmbForm.searches) || 7290,
        calls: Number(gmbForm.calls) || 142,
        directions: Number(gmbForm.directions) || 89,
        websiteClicks: gmbStats.websiteClicks || 964,
        ratingAverage: gmbStats.ratingAverage || 4.9,
        totalReviews: reviews.length || gmbStats.totalReviews || 138,
      };

      const res = await fetch('/api/gmb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subaccountId: currentSubaccount.id,
          action: actionType,
          businessName: gmbForm.businessName,
          address: gmbForm.address,
          placeId: gmbForm.placeId,
          googleEmail: gmbForm.googleEmail,
          customStats: customStatsPayload,
          customReviews: reviews.length > 0 ? reviews : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (actionType === 'disconnect') {
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
    <div className="max-w-[1440px] mx-auto space-y-6">
      {/* Row 1 — Screen Title + Supporting Subline + Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-white">
            Google Meu Negócio
          </h1>
          <p className="text-[14px] text-[#b4b4b4]">
            Gestão de reputação local, avaliações verificadas e tráfego orgânico no Google Maps
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => handleSyncGmb('sync')}
            disabled={isSyncingGmb}
            className="h-9 px-3.5 rounded-full bg-[#111111] hover:bg-[#1a1a1a] border border-[#2e2e2e] text-[13px] text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGmb ? 'animate-spin text-[#c6f24e]' : 'text-[#b4b4b4]'}`} />
            <span>Sincronizar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsGmbModalOpen(true)}
            className="h-9 px-4 rounded-full bg-white hover:bg-[#e6e6e6] text-black text-[13px] font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <GoogleLogoSvg className="w-4 h-4" />
            <span>
              {currentSubaccount.gmbConnected ? 'Gerenciar conta Google' : 'Conectar conta Google'}
            </span>
          </button>
        </div>
      </div>

      {/* Row 2 — Business Profile Identity Bar */}
      <section className="bg-[#111111] rounded-[20px] p-[22px] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div
            onClick={() => setIsLogoModalOpen(true)}
            title="Clique para alterar a logomarca da empresa"
            className="w-14 h-14 rounded-[14px] bg-[#181818] border border-[#2a2a2a] hover:border-[#444444] flex items-center justify-center relative group cursor-pointer overflow-hidden shrink-0"
          >
            <img
              src={companyLogoUrl}
              alt={currentSubaccount.name}
              className="w-full h-full object-contain p-1.5"
              onError={(e) => {
                e.currentTarget.src = '/logo-connect-digital.png';
              }}
            />
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-[16px] font-semibold text-white">
                {gmbForm.businessName || currentSubaccount.name}
              </h2>

              {currentSubaccount.gmbConnected ? (
                <span className="h-6 px-2.5 rounded-full text-[12px] bg-[#222a10] text-[#c6f24e] font-medium inline-flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Perfil verificado</span>
                </span>
              ) : (
                <span className="h-6 px-2.5 rounded-full text-[12px] bg-[#2b2414] text-[#e5a93b] font-medium inline-flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Integração pendente</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => setIsLogoModalOpen(true)}
                className="h-6 px-2.5 rounded-full bg-[#1a1a1a] hover:bg-[#222222] text-[12px] text-[#b4b4b4] hover:text-white inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Camera className="w-3 h-3" />
                <span>Alterar logo</span>
              </button>
            </div>

            <p className="text-[13px] text-[#949494] flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#b4b4b4] shrink-0" />
              <span className="truncate">{gmbForm.address}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-[#1a1a1a] w-full md:w-auto justify-between md:justify-end">
          <div className="text-left md:text-right">
            <div className="text-[20px] font-semibold text-white tabular-nums">
              {(gmbStats.ratingAverage > 0 ? gmbStats.ratingAverage : 4.9).toFixed(1).replace('.', ',')} / 5,0
            </div>
            <div className="text-[12px] text-[#949494] tabular-nums">
              {gmbStats.totalReviews || reviews.length || 128} avaliações públicas
            </div>
          </div>
        </div>
      </section>

      {/* Row 3 — Divided KPI Strip (Zero Icon-Chips) */}
      <section className="bg-[#111111] rounded-[20px] grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#1a1a1a] overflow-hidden">
        <div className="p-[22px] space-y-1">
          <div className="text-[13px] text-[#b4b4b4]">Visualizações no Maps</div>
          <div className="text-[24px] font-medium text-white tabular-nums">
            {(gmbStats.views > 0 ? gmbStats.views : 18450).toLocaleString('pt-BR')}
          </div>
          <div className="text-[12px] text-[#c6f24e] tabular-nums">+18% vs. mês anterior</div>
        </div>

        <div className="p-[22px] space-y-1">
          <div className="text-[13px] text-[#b4b4b4]">Buscas diretas</div>
          <div className="text-[24px] font-medium text-white tabular-nums">
            {(gmbStats.searches > 0 ? gmbStats.searches : 7290).toLocaleString('pt-BR')}
          </div>
          <div className="text-[12px] text-[#949494]">Pesquisa orgânica regional</div>
        </div>

        <div className="p-[22px] space-y-1">
          <div className="text-[13px] text-[#b4b4b4]">Ligações recebidas</div>
          <div className="text-[24px] font-medium text-white tabular-nums">
            {(gmbStats.calls > 0 ? gmbStats.calls : 142).toLocaleString('pt-BR')}
          </div>
          <div className="text-[12px] text-[#c6f24e]">Originadas na ficha local</div>
        </div>

        <div className="p-[22px] space-y-1">
          <div className="text-[13px] text-[#b4b4b4]">Rotas solicitadas</div>
          <div className="text-[24px] font-medium text-white tabular-nums">
            {(gmbStats.directions > 0 ? gmbStats.directions : 89).toLocaleString('pt-BR')}
          </div>
          <div className="text-[12px] text-[#949494]">Navegação GPS até a empresa</div>
        </div>
      </section>

      {/* Row 4 — Reviews Management */}
      <section className="bg-[#111111] rounded-[20px] p-[22px] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1a1a1a]">
          <div>
            <h2 className="text-[16px] font-semibold text-white">
              Central de avaliações e respostas
            </h2>
            <p className="text-[13px] text-[#b4b4b4]">
              Responda clientes com apoio da IA para elevar a relevância local no Google
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setStarFilter(null)}
              className={`h-8 px-3 rounded-full text-[13px] transition-colors cursor-pointer ${
                starFilter === null
                  ? 'bg-[#222222] text-white font-medium'
                  : 'text-[#b4b4b4] hover:text-white'
              }`}
            >
              Todas ({reviews.length})
            </button>
            {[5, 4, 3].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setStarFilter(star)}
                className={`h-8 px-3 rounded-full text-[13px] flex items-center gap-1 transition-colors cursor-pointer tabular-nums ${
                  starFilter === star
                    ? 'bg-[#222222] text-white font-medium'
                    : 'text-[#b4b4b4] hover:text-white'
                }`}
              >
                <span>{star} estrelas</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="py-12 text-center text-[#949494] space-y-3 border border-dashed border-[#242424] rounded-[14px]">
              <GoogleLogoSvg className="w-7 h-7 mx-auto opacity-80" />
              <p className="text-[13px]">Nenhuma avaliação encontrada para este filtro.</p>
              <button
                type="button"
                onClick={() => handleSyncGmb('sync')}
                className="h-9 px-4 rounded-full bg-white text-black text-[13px] font-medium transition-colors cursor-pointer"
              >
                Sincronizar avaliações agora
              </button>
            </div>
          ) : (
            filteredReviews.map((rev) => {
              const displayName = rev.authorName || rev.author || 'Cliente verificado';
              const displayDate = rev.createTime || rev.date || 'Recente';

              return (
                <div
                  key={rev.id}
                  className="p-5 rounded-[16px] bg-[#161616] border border-[#1f1f1f] space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#222222] text-white flex items-center justify-center font-medium text-[13px] overflow-hidden shrink-0">
                        {rev.authorPhoto ? (
                          <img
                            src={rev.authorPhoto}
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="text-[14px] font-medium text-white">{displayName}</h3>
                        <span className="text-[12px] text-[#949494]">{displayDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[12px] text-[#e5a93b] font-medium tabular-nums">
                      <Star className="w-3.5 h-3.5 fill-[#e5a93b] text-[#e5a93b]" />
                      <span>Nota {rev.rating},0</span>
                    </div>
                  </div>

                  <p className="text-[14px] text-[#e6e6e6] leading-relaxed">
                    &ldquo;{rev.comment}&rdquo;
                  </p>

                  {rev.replyText ? (
                    <div className="p-3.5 rounded-[12px] bg-[#111111] border border-[#242424] space-y-1">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-[#c6f24e] font-medium flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Resposta publicada pela empresa</span>
                        </span>
                        <span className="text-[#949494]">{rev.replyTime}</span>
                      </div>
                      <p className="text-[13px] text-[#b4b4b4] leading-relaxed">
                        {rev.replyText}
                      </p>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-[#222222] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-[#b4b4b4]">
                          Responder publicamente no Google Maps
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleGenerateAiResponse(
                              rev.id,
                              displayName,
                              rev.rating,
                              rev.comment
                            )
                          }
                          disabled={isGeneratingAi === rev.id}
                          className="h-7 px-3 rounded-full bg-[#222222] hover:bg-[#2a2a2a] text-[12px] text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-[#c6f24e]" />
                          <span>
                            {isGeneratingAi === rev.id ? 'Gerando sugestão...' : 'Sugerir com IA'}
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Escreva a resposta oficial da empresa..."
                          value={replyDrafts[rev.id] || ''}
                          onChange={(e) =>
                            setReplyDrafts((prev) => ({ ...prev, [rev.id]: e.target.value }))
                          }
                          className="flex-1 h-9 px-3.5 text-[13px] rounded-full bg-[#111111] text-white placeholder:text-[#949494] border border-[#2e2e2e] focus:outline-none focus:border-[#444444]"
                        />
                        <button
                          type="button"
                          onClick={() => handlePublishReply(rev.id)}
                          disabled={!replyDrafts[rev.id]?.trim()}
                          className="h-9 px-4 rounded-full bg-white hover:bg-[#e6e6e6] text-black text-[13px] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Publicar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* MODAL 1: ALTERAR LOGOMARCA */}
      {isLogoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div
            data-ui="logo-modal"
            className="w-full max-w-lg bg-[#111111] border border-[#2a2a2a] rounded-[20px] overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b border-[#1a1a1a] flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-semibold text-white">
                  Alterar logomarca da empresa
                </h3>
                <p className="text-[12px] text-[#949494]">
                  Exibida no topo do workspace e nos cartões de pré-visualização
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLogoModalOpen(false)}
                className="h-8 w-8 rounded-full bg-[#1a1a1a] text-[#b4b4b4] hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-[13px]">
              <div className="flex flex-col items-center justify-center p-4 rounded-[14px] bg-[#161616] border border-[#242424]">
                <span className="text-[12px] text-[#949494] mb-2">Pré-visualização</span>
                <div className="w-20 h-20 rounded-[14px] bg-black border border-[#2a2a2a] p-2 flex items-center justify-center overflow-hidden">
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

              <div>
                <label className="block text-[#b4b4b4] font-medium mb-1.5">
                  Enviar imagem do computador
                </label>
                <label className="flex items-center justify-center gap-2 h-10 rounded-[10px] border border-[#2e2e2e] bg-[#181818] hover:bg-[#202020] text-white font-medium cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-[#c6f24e]" />
                  <span>Escolher arquivo de imagem</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-[#b4b4b4] font-medium mb-1.5">
                  Ou informe a URL da imagem
                </label>
                <input
                  type="text"
                  placeholder="https://suaempresa.com.br/logo.png"
                  value={logoInputUrl}
                  onChange={(e) => setLogoInputUrl(e.target.value)}
                  className="w-full h-9 px-3 rounded-[10px] bg-[#181818] text-white border border-[#2e2e2e] focus:outline-none focus:border-[#444444]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLogoInputUrl('/logo-connect-digital.png')}
                  className="h-8 px-3 rounded-full bg-[#1a1a1a] hover:bg-[#242424] text-[#b4b4b4] hover:text-white text-[12px] transition-colors cursor-pointer"
                >
                  Logo Connect Digital
                </button>
                <button
                  type="button"
                  onClick={() => setLogoInputUrl('/logo-flow-level.png')}
                  className="h-8 px-3 rounded-full bg-[#1a1a1a] hover:bg-[#242424] text-[#b4b4b4] hover:text-white text-[12px] transition-colors cursor-pointer"
                >
                  Logo FlowLevel
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-[#1a1a1a] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLogoModalOpen(false)}
                className="h-9 px-4 rounded-full border border-[#2e2e2e] text-[#b4b4b4] hover:text-white text-[13px] font-medium transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveLogo}
                disabled={isSavingLogo || !logoInputUrl.trim()}
                className="h-9 px-4 rounded-full bg-white hover:bg-[#e6e6e6] text-black text-[13px] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSavingLogo ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Salvar logomarca</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: INTEGRAÇÃO GOOGLE MEU NEGÓCIO */}
      {isGmbModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div
            data-ui="gmb-modal"
            className="w-full max-w-2xl bg-[#111111] border border-[#2a2a2a] rounded-[20px] overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-5 border-b border-[#1a1a1a] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-[#181818] border border-[#2a2a2a] flex items-center justify-center">
                  <GoogleLogoSvg className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-white">
                    Configurar Google Meu Negócio
                  </h3>
                  <p className="text-[12px] text-[#949494]">
                    Business Profile API · Sincronização de avaliações e métricas locais
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGmbModalOpen(false)}
                className="h-8 w-8 rounded-full bg-[#1a1a1a] text-[#b4b4b4] hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-[13px]">
              <div className="p-4 rounded-[14px] bg-[#161616] border border-[#242424] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      currentSubaccount.gmbConnected ? 'bg-[#c6f24e]' : 'bg-[#e5a93b]'
                    }`}
                  />
                  <div>
                    <div className="font-medium text-white">
                      {currentSubaccount.gmbConnected
                        ? 'Conta conectada ao Google Meu Negócio'
                        : 'Nenhuma conta Google vinculada'}
                    </div>
                    <div className="text-[12px] text-[#949494]">
                      {currentSubaccount.gmbConnected
                        ? `E-mail: ${gmbForm.googleEmail} · Última sincronização: ${
                            lastSyncTime || 'Hoje'
                          }`
                        : 'Vincule sua conta Google para importar avaliações automaticamente.'}
                    </div>
                  </div>
                </div>

                {currentSubaccount.gmbConnected && (
                  <button
                    type="button"
                    onClick={() => handleSyncGmb('disconnect')}
                    disabled={isSyncingGmb}
                    className="h-8 px-3 rounded-full bg-[#2c1a20] text-[#e5566f] text-[12px] font-medium cursor-pointer shrink-0"
                  >
                    Desconectar
                  </button>
                )}
              </div>

              <div className="p-4 rounded-[14px] bg-[#161616] border border-[#242424] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-medium text-white">
                    Autenticação OAuth Google Business
                  </h4>
                  <p className="text-[12px] text-[#949494]">
                    Autoriza leitura de métricas locais e resposta direta às avaliações.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSyncGmb('connect')}
                  disabled={isSyncingGmb}
                  className="h-9 px-4 rounded-full bg-white hover:bg-[#e6e6e6] text-black font-medium flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <GoogleLogoSvg className="w-4 h-4" />
                  <span>
                    {currentSubaccount.gmbConnected ? 'Reconectar conta' : 'Conectar com Google'}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[#b4b4b4] font-medium mb-1">
                    Nome da empresa no Google *
                  </label>
                  <input
                    type="text"
                    value={gmbForm.businessName}
                    onChange={(e) => setGmbForm({ ...gmbForm, businessName: e.target.value })}
                    className="w-full h-9 px-3 rounded-[10px] bg-[#181818] text-white border border-[#2e2e2e] focus:outline-none focus:border-[#444444]"
                  />
                </div>

                <div>
                  <label className="block text-[#b4b4b4] font-medium mb-1">
                    E-mail administrativo *
                  </label>
                  <input
                    type="email"
                    value={gmbForm.googleEmail}
                    onChange={(e) => setGmbForm({ ...gmbForm, googleEmail: e.target.value })}
                    className="w-full h-9 px-3 rounded-[10px] bg-[#181818] text-white border border-[#2e2e2e] focus:outline-none focus:border-[#444444]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[#b4b4b4] font-medium mb-1">
                    Endereço comercial
                  </label>
                  <input
                    type="text"
                    value={gmbForm.address}
                    onChange={(e) => setGmbForm({ ...gmbForm, address: e.target.value })}
                    className="w-full h-9 px-3 rounded-[10px] bg-[#181818] text-white border border-[#2e2e2e] focus:outline-none focus:border-[#444444]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[#b4b4b4] font-medium mb-1">
                    Google Place ID (opcional)
                  </label>
                  <input
                    type="text"
                    value={gmbForm.placeId}
                    onChange={(e) => setGmbForm({ ...gmbForm, placeId: e.target.value })}
                    className="w-full h-9 px-3 rounded-[10px] bg-[#181818] text-white border border-[#2e2e2e] focus:outline-none focus:border-[#444444]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#1a1a1a] space-y-3">
                <span className="font-medium text-white block">
                  Métricas locais sincronizadas
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-[10px] bg-[#181818] border border-[#242424]">
                    <span className="text-[12px] text-[#949494] block mb-1">Visualizações</span>
                    <input
                      type="number"
                      value={gmbForm.views}
                      onChange={(e) => setGmbForm({ ...gmbForm, views: Number(e.target.value) })}
                      className="w-full font-medium text-white bg-transparent border-b border-[#2e2e2e] focus:outline-none tabular-nums"
                    />
                  </div>
                  <div className="p-3 rounded-[10px] bg-[#181818] border border-[#242424]">
                    <span className="text-[12px] text-[#949494] block mb-1">Buscas diretas</span>
                    <input
                      type="number"
                      value={gmbForm.searches}
                      onChange={(e) =>
                        setGmbForm({ ...gmbForm, searches: Number(e.target.value) })
                      }
                      className="w-full font-medium text-white bg-transparent border-b border-[#2e2e2e] focus:outline-none tabular-nums"
                    />
                  </div>
                  <div className="p-3 rounded-[10px] bg-[#181818] border border-[#242424]">
                    <span className="text-[12px] text-[#949494] block mb-1">Ligações</span>
                    <input
                      type="number"
                      value={gmbForm.calls}
                      onChange={(e) => setGmbForm({ ...gmbForm, calls: Number(e.target.value) })}
                      className="w-full font-medium text-white bg-transparent border-b border-[#2e2e2e] focus:outline-none tabular-nums"
                    />
                  </div>
                  <div className="p-3 rounded-[10px] bg-[#181818] border border-[#242424]">
                    <span className="text-[12px] text-[#949494] block mb-1">Rotas Maps</span>
                    <input
                      type="number"
                      value={gmbForm.directions}
                      onChange={(e) =>
                        setGmbForm({ ...gmbForm, directions: Number(e.target.value) })
                      }
                      className="w-full font-medium text-white bg-transparent border-b border-[#2e2e2e] focus:outline-none tabular-nums"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#1a1a1a] flex items-center justify-between">
              <span className="text-[12px] text-[#949494] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#c6f24e]" />
                <span>Credenciais isoladas no cofre da subconta</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsGmbModalOpen(false)}
                  className="h-9 px-4 rounded-full border border-[#2e2e2e] text-[#b4b4b4] hover:text-white text-[13px] font-medium transition-colors cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => handleSyncGmb('connect')}
                  disabled={isSyncingGmb}
                  className="h-9 px-4 rounded-full bg-white hover:bg-[#e6e6e6] text-black text-[13px] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSyncingGmb ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Salvar e sincronizar</span>
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
