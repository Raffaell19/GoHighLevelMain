'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  Briefcase,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySegment, setCompanySegment] = useState('Climatização & Engenharia');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    message: string;
    needsEmailConfirmation: boolean;
  } | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          companyName,
          companySegment,
          phone,
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Não foi possível concluir o cadastro.');
        setLoading(false);
        return;
      }

      if (!data.needsEmailConfirmation) {
        const { data: loginData } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (loginData?.session) {
          document.cookie = `sb-access-token=${loginData.session.access_token}; path=/; max-age=${
            60 * 60 * 24 * 7
          }; SameSite=Lax`;
          window.location.href = '/';
          return;
        }
      }

      setSuccessData({
        message: data.message,
        needsEmailConfirmation: data.needsEmailConfirmation,
      });
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] bg-black flex flex-col justify-center items-center p-4 py-8">
      <div className="w-full max-w-lg space-y-6">
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
            Provisionar novo workspace
          </h1>
          <p className="text-[13px] text-[#b4b4b4]">
            Crie o ambiente isolado da sua empresa com CRM, WhatsApp e automações
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-[20px] p-6 sm:p-7 space-y-5">
          {error && (
            <div className="p-3.5 rounded-[12px] bg-[#2c1a20] border border-[#e5484d]/30 flex items-start gap-2.5 text-[13px] text-[#e5566f]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successData ? (
            <div className="py-4 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#222a10] text-[#c6f24e] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-[18px] font-semibold text-white">
                  Ambiente provisionado com sucesso
                </h2>
                <p className="text-[13px] text-[#b4b4b4] leading-relaxed max-w-md mx-auto">
                  {successData.message}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 h-10 px-6 rounded-full bg-white hover:bg-[#e6e6e6] text-black font-medium text-[14px] transition-colors"
                >
                  <span>Ir para a tela de login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-[#b4b4b4]">
                    Seu nome completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#949494] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ex: Rafael Silva"
                      className="w-full h-10 pl-10 pr-3 rounded-[12px] bg-[#181818] border border-[#2e2e2e] text-[13px] text-white placeholder:text-[#949494] focus:outline-none focus:border-[#444444]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-[#b4b4b4]">
                    Nome da empresa *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-[#949494] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ex: Connect Digital"
                      className="w-full h-10 pl-10 pr-3 rounded-[12px] bg-[#181818] border border-[#2e2e2e] text-[13px] text-white placeholder:text-[#949494] focus:outline-none focus:border-[#444444]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-[#b4b4b4]">
                    Segmento de atuação
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-[#949494] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={companySegment}
                      onChange={(e) => setCompanySegment(e.target.value)}
                      className="w-full h-10 pl-10 pr-3 rounded-[12px] bg-[#181818] border border-[#2e2e2e] text-[13px] text-white focus:outline-none focus:border-[#444444]"
                    >
                      <option value="Climatização & Engenharia">Climatização & Engenharia</option>
                      <option value="Marketing & Agência Digital">Marketing & Agência Digital</option>
                      <option value="Saúde & Clínicas">Saúde & Clínicas</option>
                      <option value="Imobiliária & Construção">Imobiliária & Construção</option>
                      <option value="Energia Solar & Elétrica">Energia Solar & Elétrica</option>
                      <option value="Consultoria & B2B">Consultoria & B2B</option>
                      <option value="Comércio & Serviços Locais">Comércio & Serviços Locais</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-[#b4b4b4]">
                    WhatsApp comercial
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#949494] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+55 51 99999-9999"
                      className="w-full h-10 pl-10 pr-3 rounded-[12px] bg-[#181818] border border-[#2e2e2e] text-[13px] text-white placeholder:text-[#949494] tabular-nums focus:outline-none focus:border-[#444444]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-[#b4b4b4]">
                    E-mail de login *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#949494] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contato@empresa.com.br"
                      className="w-full h-10 pl-10 pr-3 rounded-[12px] bg-[#181818] border border-[#2e2e2e] text-[13px] text-white placeholder:text-[#949494] focus:outline-none focus:border-[#444444]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-[#b4b4b4]">
                    Senha (mín. 6 caracteres) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#949494] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-10 pl-10 pr-3 rounded-[12px] bg-[#181818] border border-[#2e2e2e] text-[13px] text-white placeholder:text-[#949494] focus:outline-none focus:border-[#444444]"
                    />
                  </div>
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
                    <span>Provisionando workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Criar conta e acessar plataforma</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-[#1a1a1a] flex items-center justify-between text-[13px]">
            <span className="text-[#949494]">Já possui uma conta cadastrada?</span>
            <Link
              href="/login"
              className="text-white hover:text-[#c6f24e] font-medium transition-colors"
            >
              Fazer login
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[12px] text-[#949494]">
          <ShieldCheck className="w-4 h-4 text-[#c6f24e]" />
          <span>Dados e credenciais isolados por subconta no Supabase</span>
        </div>
      </div>
    </div>
  );
}
