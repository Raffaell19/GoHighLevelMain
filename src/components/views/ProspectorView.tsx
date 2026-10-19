'use client';

import React, { useState } from 'react';
import {
  Compass,
  Search,
  MapPin,
  Sliders,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Phone,
  Globe,
  Star,
  Tag,
  Trash2,
  ExternalLink,
  Filter,
  Key,
  RefreshCw,
  Play,
  ArrowRight,
  FileSpreadsheet,
  Plus,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ProspectItem } from '@/app/api/prospects/status/route';

interface ProspectorViewProps {
  onNavigateToCrm?: () => void;
}

export function ProspectorView({ onNavigateToCrm }: ProspectorViewProps) {
  const { currentSubaccount, stages } = useApp();

  // Form states matching Apify's Google Maps Scraper console
  const [searchTerm, setSearchTerm] = useState('esquadrias');
  const [location, setLocation] = useState('Novo Hamburgo, RS, Brasil');
  const [limit, setLimit] = useState(70);
  const [language, setLanguage] = useState('pt-BR');

  // Token management
  const [apiToken, setApiToken] = useState('');
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [results, setResults] = useState<ProspectItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Table filters
  const [filterOnlyWithPhone, setFilterOnlyWithPhone] = useState(true);
  const [filterMinRating, setFilterMinRating] = useState(0);

  // Quick niches suggestions
  const quickNiches = [
    'Esquadrias',
    'Ar Condicionado',
    'Energia Solar',
    'Vidraçarias',
    'Construtoras',
    'Imobiliárias',
    'Restaurantes',
    'Advocacia',
  ];

  const handleStartMining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim() || !location.trim()) return;

    setIsRunning(true);
    setStatusMessage('Iniciando Actor na Apify (compass/crawler-google-places)...');
    setResults([]);
    setSelectedIds(new Set());
    setImportSuccessMessage(null);

    try {
      // 1. Iniciar execução na Apify
      const runRes = await fetch('/api/prospects/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchQuery: searchTerm,
          location,
          limit,
          language,
          customToken: apiToken || undefined,
        }),
      });

      const runJson = await runRes.json();
      if (!runRes.ok || runJson.error) {
        throw new Error(runJson.error || 'Falha ao iniciar o crawler na Apify');
      }

      setStatusMessage('Varrendo empresas e estabelecimentos no Google Maps...');

      // 2. Polling de status / Obtenção dos resultados
      const pollResults = async (retries = 0): Promise<void> => {
        const statusRes = await fetch(
          `/api/prospects/status?runId=${runJson.runId}&defaultDatasetId=${runJson.defaultDatasetId || ''}&searchQuery=${encodeURIComponent(
            searchTerm
          )}&location=${encodeURIComponent(location)}&limit=${limit}&customToken=${encodeURIComponent(apiToken)}`
        );
        const statusJson = await statusRes.json();

        if (statusJson.status === 'SUCCEEDED') {
          setResults(statusJson.items || []);
          // Selecionar todos os itens por padrão
          const ids = new Set<string>((statusJson.items || []).map((i: ProspectItem) => i.id));
          setSelectedIds(ids);
          setIsRunning(false);
          setStatusMessage('');
        } else if (retries < 15) {
          setStatusMessage(`Extraindo contatos e telefones... (${retries + 1}/15)`);
          setTimeout(() => pollResults(retries + 1), 2500);
        } else {
          setIsRunning(false);
          setStatusMessage('A extração está demorando mais que o previsto. Verifique no console da Apify.');
        }
      };

      // Pequeno delay para a Apify iniciar ou mock retornar
      setTimeout(() => pollResults(0), 1200);
    } catch (err: any) {
      setIsRunning(false);
      setStatusMessage('');
      alert(err.message || 'Erro ao executar extração.');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === displayedResults.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedResults.map((p) => p.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleImportToCrm = async () => {
    if (selectedIds.size === 0) return;
    setIsImporting(true);

    const prospectsToImport = results.filter((r) => selectedIds.has(r.id));

    try {
      const res = await fetch('/api/prospects/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subaccountId: currentSubaccount.id,
          prospects: prospectsToImport,
          stageId: stages[0]?.id,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Erro ao importar leads para o CRM');
      }

      setImportSuccessMessage(
        `${json.importedCount} empresas foram importadas com sucesso para o estágio inicial do seu Funil de Vendas!`
      );
    } catch (err: any) {
      alert(err.message || 'Falha ao importar leads');
    } finally {
      setIsImporting(false);
    }
  };

  const exportToCsv = () => {
    const prospectsToExport = results.filter((r) => selectedIds.has(r.id));
    if (prospectsToExport.length === 0) return;

    const headers = ['Nome', 'Telefone', 'Endereco', 'Website', 'Avaliacao', 'Reviews', 'Categoria'];
    const rows = prospectsToExport.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.phone || ''}"`,
      `"${p.address.replace(/"/g, '""')}"`,
      `"${p.website || ''}"`,
      p.rating,
      p.reviewsCount,
      `"${p.category || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `prospectos_${searchTerm.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayedResults = results.filter((p) => {
    if (filterOnlyWithPhone && (!p.phone || p.phone.trim().length < 5)) return false;
    if (filterMinRating > 0 && p.rating < filterMinRating) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Compass className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Gerador de Prospectos B2B (Google Maps via Apify)
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">
              compass/crawler-google-places
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Minere empresas e clientes qualificados no Google Maps com telefones, endereços e avaliações diretamente para o seu Funil de Vendas.
          </p>
        </div>

        <button
          onClick={() => setIsTokenModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition border border-slate-300 dark:border-slate-700"
        >
          <Key className="w-3.5 h-3.5 text-amber-500" />
          <span>Configurar Token Apify</span>
        </button>
      </div>

      {/* Top Search Card (Modeled after Apify's Google Maps Scraper Form) */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Parâmetros de Busca & Extração de Estabelecimentos
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Empresa Ativa: <strong className="text-slate-700 dark:text-slate-300">{currentSubaccount.name}</strong>
          </span>
        </div>

        <form onSubmit={handleStartMining} className="space-y-4 text-xs">
          {/* Quick Niches Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-semibold mr-1">Sugestões de Nicho:</span>
            {quickNiches.map((niche) => (
              <button
                key={niche}
                type="button"
                onClick={() => setSearchTerm(niche.toLowerCase())}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                  searchTerm.toLowerCase() === niche.toLowerCase()
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {niche}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search Term */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="block text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-blue-500" />
                <span>Search term(s) / Palavra-chave</span>
              </label>
              <input
                type="text"
                placeholder="Ex: esquadrias, climatização, vidraçaria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Location */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="block text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Location / Região & Cidade</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Novo Hamburgo, RS, Brasil"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Limit */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="block text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-500" />
                <span>Qtd. de Lugares (Places)</span>
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value={20}>20 estabelecimentos</option>
                <option value={50}>50 estabelecimentos</option>
                <option value={70}>70 estabelecimentos (Recomendado)</option>
                <option value={100}>100 estabelecimentos</option>
                <option value={150}>150 estabelecimentos</option>
              </select>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Idioma configurado: <strong>Português (Brasil)</strong> com filtros de contatos enriquecidos</span>
            </div>

            <button
              type="submit"
              disabled={isRunning}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/30 transition disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extraindo no Google Maps...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current text-cyan-300" />
                  <span>Save & Start Extração (Apify)</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live Loading Indicator */}
        {isRunning && (
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3 animate-pulse text-xs text-blue-600 dark:text-blue-400">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <div className="space-y-0.5">
              <p className="font-bold">{statusMessage || 'Processando extração na nuvem da Apify...'}</p>
              <p className="text-[11px] text-slate-500">
                O Actor está conectando ao Google Places, extraindo contatos comerciais e geolocalização.
              </p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {importSuccessMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{importSuccessMessage}</span>
            </div>
            {onNavigateToCrm && (
              <button
                onClick={onNavigateToCrm}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition shrink-0"
              >
                Ver no Kanban do CRM →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          {/* Action and Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-900 dark:text-white select-none">
                <input
                  type="checkbox"
                  checked={selectedIds.size === displayedResults.length && displayedResults.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 rounded border-slate-300 dark:border-slate-700"
                />
                <span>
                  Selecionar Todos ({selectedIds.size} de {displayedResults.length})
                </span>
              </label>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <input
                    type="checkbox"
                    checked={filterOnlyWithPhone}
                    onChange={(e) => setFilterOnlyWithPhone(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600"
                  />
                  <span>Apenas c/ Telefone</span>
                </label>
              </div>
            </div>

            {/* Batch Actions */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                onClick={exportToCsv}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition disabled:opacity-40"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>Exportar CSV</span>
              </button>

              <button
                onClick={handleImportToCrm}
                disabled={selectedIds.size === 0 || isImporting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition disabled:opacity-40"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Importando...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Importar {selectedIds.size} para o Funil de Vendas</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Prospects Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 w-8"></th>
                  <th className="p-3">Empresa / Estabelecimento</th>
                  <th className="p-3">Telefone / WhatsApp</th>
                  <th className="p-3">Avaliação Google</th>
                  <th className="p-3">Endereço</th>
                  <th className="p-3">Website</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {displayedResults.map((prospect) => {
                  const isSelected = selectedIds.has(prospect.id);
                  const cleanPhone = prospect.phone?.replace(/[^0-9]/g, '');

                  return (
                    <tr
                      key={prospect.id}
                      onClick={() => toggleSelectOne(prospect.id)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? 'bg-blue-50/50 dark:bg-blue-950/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(prospect.id)}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{prospect.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">{prospect.category}</span>
                      </td>

                      <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                        {prospect.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{prospect.phone}</span>
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/55${cleanPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title="Abrir conversa no WhatsApp"
                                className="p-1 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition"
                              >
                                💬
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Não informado</span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="font-bold text-slate-900 dark:text-white">{prospect.rating}</span>
                          <span className="text-[11px] text-slate-400">({prospect.reviewsCount})</span>
                        </div>
                      </td>

                      <td className="p-3 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={prospect.address}>
                        {prospect.address}
                      </td>

                      <td className="p-3">
                        {prospect.website ? (
                          <a
                            href={prospect.website}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-500 hover:underline flex items-center gap-1 max-w-[140px] truncate"
                          >
                            <Globe className="w-3 h-3 shrink-0" />
                            <span className="truncate">{prospect.website.replace(/^https?:\/\//, '')}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">Sem site</span>
                        )}
                      </td>

                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {prospect.googleUrl && (
                          <a
                            href={prospect.googleUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex transition"
                            title="Ver no Google Maps"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Token Modal */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Configurar Token da Apify</h3>
              </div>
              <button onClick={() => setIsTokenModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-slate-400 leading-relaxed">
              Insira o seu <strong>Personal API Token</strong> da Apify (obtido em <em>Apify Console &gt; Settings &gt; Integrations</em>).
              Ele também pode ser fixado diretamente no seu arquivo <code className="text-cyan-400 font-mono">.env.local</code> como <code className="text-cyan-400 font-mono">APIFY_API_TOKEN</code>.
            </p>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Apify API Token</label>
              <input
                type="password"
                placeholder="apify_api_..."
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsTokenModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTokenModalOpen(false);
                  alert('Token salvo para esta sessão do painel!');
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/30 transition"
              >
                Salvar Token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
