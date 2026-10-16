'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function GoogleBusinessView() {
  const { currentSubaccount, reviews, gmbStats, replyToReview } = useApp();
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [isGeneratingAi, setIsGeneratingAi] = useState<string | null>(null);

  const filteredReviews = starFilter ? reviews.filter((r) => r.rating === starFilter) : reviews;

  // Gerador de Resposta IA com SEO Local e Tom Cordial chamando a API
  const handleGenerateAiResponse = async (reviewId: string, authorName: string, rating: number, comment: string) => {
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

  return (
    <div className="space-y-6">
      {/* GMB Top Header & Profile Overview */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-amber-500/20">
            <Star className="w-8 h-8 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{currentSubaccount.name}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                <span>Perfil Verificado no Google</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span>São Paulo - SP • Visível no Google Maps & Pesquisa</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-500 font-bold text-lg">
              <Star className="w-4 h-4 fill-amber-500" />
              <span>{gmbStats.ratingAverage}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Nota Média (138 opiniões)</span>
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
            {gmbStats.views.toLocaleString('pt-BR')}
          </p>
          <span className="text-[10px] text-emerald-500 font-medium">+18% este mês</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Buscas Diretas</span>
            <Search className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {gmbStats.searches.toLocaleString('pt-BR')}
          </p>
          <span className="text-[10px] text-slate-400">Na sua região</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Ligações Recebidas</span>
            <Phone className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{gmbStats.calls}</p>
          <span className="text-[10px] text-emerald-500 font-medium">Leads por telefone</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Rotas Solicitadas</span>
            <Navigation className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{gmbStats.directions}</p>
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
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3"
            >
              {/* Review Author & Rating */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs">
                    {rev.authorName.charAt(0)}
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
          ))}
        </div>
      </div>
    </div>
  );
}
