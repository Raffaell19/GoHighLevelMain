'use client';

import React, { useState } from 'react';
import {
  Share2,
  Calendar,
  Plus,
  Clock,
  Heart,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { SocialPlatform, SocialPost } from '@/types';

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
  const { currentSubaccount, socialPosts, addSocialPost } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Estados do formulário de criação
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(['instagram', 'facebook']);
  const [postContent, setPostContent] = useState('');
  const [postTopic, setPostTopic] = useState('');
  const [postDate, setPostDate] = useState('2026-10-18 10:00');
  const [postMediaUrl, setPostMediaUrl] = useState(
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80'
  );

  const togglePlatform = (p: SocialPlatform) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((item) => item !== p));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const handleGenerateAiCaption = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/social-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: postTopic || 'Manutenção preventiva e economia de energia com serviços de alto padrão',
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
      console.error('Erro ao gerar legenda:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    addSocialPost({
      subaccountId: currentSubaccount.id,
      platforms: selectedPlatforms,
      content: postContent,
      mediaUrl: postMediaUrl,
      scheduledDate: postDate,
      status: 'scheduled',
    });

    setIsModalOpen(false);
    setPostContent('');
    setPostTopic('');
  };

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

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar Nova Publicação</span>
        </button>
      </div>

      {/* Connected Channels Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center">
              <InstagramIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-xs text-slate-900 dark:text-white">Instagram Business</p>
              <p className="text-[10px] text-slate-400">@{currentSubaccount.name.toLowerCase().replace(/[^a-z0-9]/g, '')}</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">
            Conectado
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <FacebookIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-xs text-slate-900 dark:text-white">Página Facebook</p>
              <p className="text-[10px] text-slate-400">Página Oficial</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">
            Conectado
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <LinkedinIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-xs text-slate-900 dark:text-white">LinkedIn Company</p>
              <p className="text-[10px] text-slate-400">Perfil Corporativo</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-400 font-semibold">
            Pronto para conectar
          </span>
        </div>
      </div>

      {/* Posts Feed & Queue */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span>Fila de Postagens & Publicações Recentes</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {socialPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Media Preview */}
                {post.mediaUrl && (
                  <div className="h-44 w-full bg-slate-800 relative overflow-hidden">
                    <img src={post.mediaUrl} alt="Post creative" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 flex gap-1">
                      {post.platforms.map((plat) => (
                        <span key={plat} className="p-1 rounded bg-black/60 text-white backdrop-blur-sm">
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
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        post.status === 'published'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}
                    >
                      {post.status === 'published' ? 'Publicado' : 'Agendado'}
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

              {/* Card Footer with Metrics or Status */}
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                {post.status === 'published' ? (
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                      <span>{post.likes}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                      <span>{post.comments}</span>
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-blue-400">Disparo automático programado</span>
                )}
                <span className="text-[10px] text-slate-500 font-mono">ID: {post.id}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create / Schedule Post Modal with Live Instagram Preview */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-500" />
                <span>Agendar Nova Publicação Multicanal</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 overflow-y-auto flex-1">
              {/* Form Side */}
              <form onSubmit={handleCreatePost} className="p-5 space-y-4 text-xs">
                {/* Channel Selectors */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Canais de Publicação</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => togglePlatform('instagram')}
                      className={`flex-1 p-2 rounded-lg border flex items-center justify-center gap-1.5 transition ${
                        selectedPlatforms.includes('instagram')
                          ? 'border-pink-500 bg-pink-500/10 text-pink-500 font-semibold'
                          : 'border-slate-300 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      <InstagramIcon className="w-3.5 h-3.5" />
                      <span>Instagram</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePlatform('facebook')}
                      className={`flex-1 p-2 rounded-lg border flex items-center justify-center gap-1.5 transition ${
                        selectedPlatforms.includes('facebook')
                          ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-semibold'
                          : 'border-slate-300 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      <FacebookIcon className="w-3.5 h-3.5" />
                      <span>Facebook</span>
                    </button>
                  </div>
                </div>

                {/* AI Prompt / Topic Helper */}
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-blue-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Assistente Criativo de IA</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleGenerateAiCaption}
                      disabled={isGeneratingAi}
                      className="text-[11px] px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition cursor-pointer"
                    >
                      {isGeneratingAi ? 'Escrevendo...' : 'Gerar Legenda com IA'}
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Ex: Dica de como limpar o filtro do ar ou promoção de verão..."
                    value={postTopic}
                    onChange={(e) => setPostTopic(e.target.value)}
                    className="w-full p-2 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 text-[11px] focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Caption / Text */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-400 font-semibold">Legenda do Post</label>
                    <span className="text-[10px] text-slate-500">{postContent.length} caracteres</span>
                  </div>
                  <textarea
                    rows={5}
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Escreva a legenda ou clique no assistente de IA acima..."
                    className="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Media URL */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">URL da Imagem Criativa</label>
                  <input
                    type="text"
                    value={postMediaUrl}
                    onChange={(e) => setPostMediaUrl(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Schedule Date & Time */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Data e Hora do Disparo</label>
                  <input
                    type="text"
                    value={postDate}
                    onChange={(e) => setPostDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/30 transition cursor-pointer"
                  >
                    Confirmar e Agendar Publicação
                  </button>
                </div>
              </form>

              {/* Live Preview Side (Instagram Mockup) */}
              <div className="p-5 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950/60">
                <span className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  Pré-visualização no Instagram Feed
                </span>
                <div className="w-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden text-xs">
                  {/* Insta Header */}
                  <div className="p-2.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 p-0.5 shrink-0">
                        <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                          {currentSubaccount.name === 'Connect Digital' || (currentSubaccount.logo && (currentSubaccount.logo.startsWith('/') || currentSubaccount.logo.includes('.png'))) ? (
                            <img
                              src={currentSubaccount.name === 'Connect Digital' ? '/logo-connect-digital.png' : currentSubaccount.logo}
                              alt={currentSubaccount.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            currentSubaccount.logo
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white text-[11px]">
                        {currentSubaccount.name.toLowerCase().replace(/[^a-z0-9]/g, '')}
                      </span>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="h-64 bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    {postMediaUrl ? (
                      <img src={postMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">Sem imagem</div>
                    )}
                  </div>

                  {/* Insta Actions */}
                  <div className="p-3 space-y-1.5">
                    <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                      <Heart className="w-4 h-4 text-red-500" />
                      <MessageCircle className="w-4 h-4" />
                      <Share2 className="w-4 h-4" />
                    </div>
                    <p className="font-semibold text-[10px] text-slate-900 dark:text-white">Curtido por várias pessoas</p>
                    <p className="text-[11px] text-slate-800 dark:text-slate-200 line-clamp-3 leading-snug whitespace-pre-wrap">
                      <span className="font-bold mr-1">
                        {currentSubaccount.name.toLowerCase().replace(/[^a-z0-9]/g, '')}
                      </span>
                      {postContent || 'Escreva algo na legenda ao lado para visualizar aqui...'}
                    </p>
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
