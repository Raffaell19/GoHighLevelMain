'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('E-mail ou senha incorretos. Verifique suas credenciais.');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Confirme seu endereço de e-mail antes de acessar o painel.');
        } else {
          setError(signInError.message);
        }
        setLoading(false);
        return;
      }

      if (data.session) {
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${
          60 * 60 * 24 * 7
        }; SameSite=Lax`;
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] bg-black flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Product Mark & Title */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-[14px] bg-[#111111] border border-[#2a2a2a] flex items-center justify-center p-2">
            <img
              src="/logo-connect-digital.png"
              alt="FlowLevel"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-white">
            Entrar no FlowLevel
          </h1>
          <p className="text-[13px] text-[#b4b4b4]">
            Acesse o workspace isolado da sua empresa
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-[20px] p-6 sm:p-7 space-y-5">
          {error && (
            <div className="p-3.5 rounded-[12px] bg-[#2c1a20] border border-[#e5484d]/30 flex items-start gap-2.5 text-[13px] text-[#e5566f]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[#b4b4b4]">
                E-mail corporativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#949494] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@suaempresa.com.br"
                  className="w-full h-10 pl-10 pr-3.5 rounded-[12px] bg-[#181818] border border-[#2e2e2e] text-[14px] text-white placeholder:text-[#949494] focus:outline-none focus:border-[#444444]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[#b4b4b4]">
                Senha de acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#949494] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 pl-10 pr-3.5 rounded-[12px] bg-[#181818] border border-[#2e2e2e] text-[14px] text-white placeholder:text-[#949494] focus:outline-none focus:border-[#444444]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-full bg-white hover:bg-[#e6e6e6] text-black font-medium text-[14px] flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Acessar plataforma</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-[#1a1a1a] flex flex-col sm:flex-row items-center justify-between gap-2 text-[13px]">
            <span className="text-[#949494]">Ainda não possui conta?</span>
            <Link
              href="/register"
              className="text-white hover:text-[#c6f24e] font-medium flex items-center gap-1 transition-colors"
            >
              <span>Criar conta da minha empresa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Security Note */}
        <div className="flex items-center justify-center gap-2 text-[12px] text-[#949494]">
          <ShieldCheck className="w-4 h-4 text-[#c6f24e]" />
          <span>Isolamento Multi-Tenant com criptografia AES-256</span>
        </div>
      </div>
    </div>
  );
}
