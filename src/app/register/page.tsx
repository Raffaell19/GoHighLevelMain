'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Lock,
  Mail,
  Building2,
  Phone,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Layers,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySegment, setCompanySegment] = useState('Serviços & Instalações');
  const [phone, setPhone] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ message: '', email: '' });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          companyName,
          companySegment,
          phone,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao registrar empresa.');
      }

      setIsSuccess(true);
      setSuccessInfo({
        message: data.message,
        email: email,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado ao registrar empresa.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden py-12">
      {/* Background Glows */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-6 text-center z-10">
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">FlowLevel</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Cadastro de Empresa
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Criar Conta para sua Empresa</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Tenha seu CRM Kanban, WhatsApp Oficial com Chatbot e Automações com workspace 100% isolado.
        </p>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-lg bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-7 shadow-2xl shadow-black/60 z-10 relative">
        {isSuccess ? (
          /* Confirmation Success Screen */
          <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Empresa Cadastrada com Sucesso!</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Enviamos um link de validação para o endereço:
              </p>
              <p className="text-xs font-bold text-cyan-400 bg-cyan-950/40 py-1 px-3 rounded-lg border border-cyan-800/50 inline-block mt-1">
                {successInfo.email}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-left space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>O que já foi preparado para sua empresa:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
                <li>Banco de dados isolado com ID único de empresa</li>
                <li>Funil de Vendas padrão com 5 etapas no CRM Kanban</li>
                <li>Fluxo automatizado de captura de leads via WhatsApp</li>
                <li>Cofre seguro com criptografia AES-256 para sua instância</li>
              </ul>
            </div>

            <div className="pt-2">
              <p className="text-[11px] text-slate-400 mb-3">
                Após clicar no link no seu e-mail, seu login estará liberado imediatamente.
              </p>
              <Link
                href="/login"
                id="btn-goto-login"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition"
              >
                <span>Acessar Tela de Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <>
            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-rose-400 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Seção 1: Dados da Empresa */}
              <div className="border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 mb-3">
                  <Building2 className="w-4 h-4" />
                  <span>1. Dados da Sua Empresa</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="company-name">
                      Nome da Empresa / Negócio *
                    </label>
                    <input
                      id="company-name"
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ex: Alves Climatização & Elétrica"
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="company-segment">
                        Segmento de Atuação
                      </label>
                      <select
                        id="company-segment"
                        value={companySegment}
                        onChange={(e) => setCompanySegment(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/70 border border-slate-800 text-white focus:outline-none focus:border-blue-500 transition"
                      >
                        <option value="Serviços & Instalações">Serviços & Instalações</option>
                        <option value="Saúde & Odontologia">Saúde & Odontologia</option>
                        <option value="Imobiliária & Corretagem">Imobiliária & Corretagem</option>
                        <option value="Agência & Marketing">Agência & Marketing</option>
                        <option value="Comércio & Varejo">Comércio & Varejo</option>
                        <option value="Educação & Cursos">Educação & Cursos</option>
                        <option value="Outro Segmento">Outro Segmento</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="company-phone">
                        WhatsApp Comercial
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="company-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(11) 98877-6655"
                          className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 2: Dados do Login do Proprietário */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-2">
                  <User className="w-4 h-4" />
                  <span>2. Login do Proprietário da Empresa</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="full-name">
                    Seu Nome Completo
                  </label>
                  <input
                    id="full-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Rafael Silva"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="register-email">
                    E-mail de Acesso (Receberá a confirmação) *
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="register-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@empresa.com.br"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="register-password">
                    Senha de Acesso (mínimo 6 dígitos) *
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="register-password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Crie uma senha segura"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Botão de Envio */}
              <button
                id="btn-register-submit"
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Provisionando Banco & Workspace...
                  </span>
                ) : (
                  <>
                    <span>Criar Workspace da Empresa</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Link para Login */}
            <div className="mt-5 text-center border-t border-slate-800/80 pt-4">
              <p className="text-xs text-slate-400">
                Já tem um cadastro?{' '}
                <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition">
                  Fazer Login
                </Link>
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer Features */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Dados 100% Isolados por Subconta</span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-blue-500" />
          <span>Instância Própria de WhatsApp</span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-500" />
          <span>Funil Kanban Pré-carregado</span>
        </span>
      </div>
    </div>
  );
}
