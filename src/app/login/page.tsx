'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Building2,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setErrorMessage(
            'Seu e-mail ainda não foi confirmado! Por favor, acesse sua caixa de entrada e clique no link de validação enviado.'
          );
        } else if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('E-mail ou senha incorretos. Verifique suas credenciais.');
        } else {
          setErrorMessage(error.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.session) {
        setInfoMessage('Autenticado com sucesso! Redirecionando para seu workspace...');
        setTimeout(() => {
          router.push('/');
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado ao realizar login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-8 text-center z-10">
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl mb-3">
          <img
            src="/logo-flow-level.png"
            alt="FlowLevel Logo"
            className="h-8 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(234,179,8,0.25)]"
          />
          <span className="font-bold text-lg text-white tracking-tight">FlowLevel</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Multi-Tenant SaaS
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Acesso ao Workspace da Empresa</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Faça login para gerenciar o WhatsApp, CRM, agendamentos e automações exclusivas da sua empresa.
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-7 shadow-2xl shadow-black/60 z-10 relative">
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-rose-400 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {infoMessage && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-emerald-400 text-xs animate-in fade-in">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{infoMessage}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="login-email">
              E-mail Corporativo
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@suaempresa.com.br"
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300" htmlFor="login-password">
                Senha de Acesso
              </label>
              <button
                type="button"
                onClick={() => alert('Para redefinir sua senha, solicite um link de recuperação pelo e-mail cadastrado.')}
                className="text-[11px] text-blue-400 hover:text-blue-300 transition"
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Acessando Workspace...
              </span>
            ) : (
              <>
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Novo no FlowLevel?</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Self-service registration button */}
        <Link
          href="/register"
          id="btn-goto-register"
          className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition text-center"
        >
          <Building2 className="w-4 h-4 text-cyan-400" />
          <span>Cadastrar Nova Empresa (Self-Service)</span>
        </Link>
      </div>

      {/* Security & Multi-tenant isolation badge */}
      <div className="mt-8 flex items-center gap-2 text-[11px] text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Isolamento Criptográfico de Dados por Empresa (Row-Level Security)</span>
      </div>
    </div>
  );
}
