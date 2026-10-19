'use client';

import React, { useState, useEffect } from 'react';
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
  History,
  Clock,
  Calendar,
  FolderOpen,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ProspectItem } from '@/app/api/prospects/status/route';

export interface SearchHistoryItem {
  id: string;
  searchTerm: string;
  location: string;
  limit: number;
  resultsCount: number;
  timestamp: string;
  formattedDate: string;
  results: ProspectItem[];
}

interface ProspectorViewProps {
  onNavigateToCrm?: () => void;
}

export function ProspectorView({ onNavigateToCrm }: ProspectorViewProps) {
  const { currentSubaccount, stages } = useApp();

  // Navigation tab between "Nova Extração" and "Histórico de Listas"
  const [activeTab, setActiveTab] = useState<'search' | 'history'>('search');

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

  // Table filters (padrão false para não esconder nenhum lead gerado)
  const [filterOnlyWithPhone, setFilterOnlyWithPhone] = useState(false);
  const [filterMinRating, setFilterMinRating] = useState(0);

  // History state
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [activeHistoryItem, setActiveHistoryItem] = useState<SearchHistoryItem | null>(null);
  const [historySearchQuery, setHistorySearchQuery] = useState('');

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

  // 20 estabelecimentos completos minerados para o histórico de demonstração/inicial
  const full20SeedResults: ProspectItem[] = [
    {
      id: 'seed_1',
      name: 'Esquadrias Vale dos Sinos',
      phone: '(51) 3594-1122',
      address: 'Rua Bento Gonçalves, 1420 - Centro, Novo Hamburgo - RS',
      website: 'https://esquadriasvaledossinos.com.br',
      rating: 4.8,
      reviewsCount: 34,
      category: 'Fábrica de Esquadrias',
      googleUrl: 'https://maps.google.com/?q=Esquadrias+Vale+dos+Sinos+Novo+Hamburgo',
    },
    {
      id: 'seed_2',
      name: 'Arte em Alumínio & Esquadrias',
      phone: '(51) 99881-2233',
      address: 'Av. Nações Unidas, 2800 - Rio Branco, Novo Hamburgo - RS',
      website: 'https://artealuminio.com.br',
      rating: 4.9,
      reviewsCount: 52,
      category: 'Esquadrias de Alumínio',
      googleUrl: 'https://maps.google.com/?q=Arte+em+Aluminio+Novo+Hamburgo',
    },
    {
      id: 'seed_3',
      name: 'Vidraçaria & Esquadrias Hamburguesa',
      phone: '(51) 3527-9900',
      address: 'Rua Primeiro de Março, 850 - Pátria Nova, Novo Hamburgo - RS',
      website: 'https://vidracarianh.com.br',
      rating: 4.7,
      reviewsCount: 29,
      category: 'Vidraçaria e Esquadrias',
      googleUrl: 'https://maps.google.com/?q=Vidracaria+Novo+Hamburgo',
    },
    {
      id: 'seed_4',
      name: 'Sinosbox & Esquadrias de PVC',
      phone: '(51) 98455-6677',
      address: 'Rua Guia Lopes, 410 - Rondônia, Novo Hamburgo - RS',
      website: 'https://sinosbox.com.br',
      rating: 4.6,
      reviewsCount: 19,
      category: 'Esquadrias de PVC',
      googleUrl: 'https://maps.google.com/?q=Sinosbox+Novo+Hamburgo',
    },
    {
      id: 'seed_5',
      name: 'Esquadrias Gaúcha & Serralheria',
      phone: '(51) 3595-4411',
      address: 'Av. Nicolau Becker, 620 - Operário, Novo Hamburgo - RS',
      website: 'https://esquadriasgaucha.com.br',
      rating: 4.8,
      reviewsCount: 41,
      category: 'Esquadrias & Serralheria',
      googleUrl: 'https://maps.google.com/?q=Esquadrias+Gaucha+Novo+Hamburgo',
    },
    {
      id: 'seed_6',
      name: 'Soluções em Esquadrias & Fachadas',
      phone: '(51) 99120-7788',
      address: 'Rua Marcílio Dias, 915 - Centro, Novo Hamburgo - RS',
      website: 'https://solucoesfachadas.com.br',
      rating: 4.7,
      reviewsCount: 38,
      category: 'Fachadas e Esquadrias',
      googleUrl: 'https://maps.google.com/?q=Solucoes+Esquadrias+Fachadas+Novo+Hamburgo',
    },
    {
      id: 'seed_7',
      name: 'Master Esquadrias Sob Medida',
      phone: '(51) 98555-8899',
      address: 'Rua Sapiranga, 1850 - Canudos, Novo Hamburgo - RS',
      website: 'https://masteresquadrias.com.br',
      rating: 5.0,
      reviewsCount: 68,
      category: 'Esquadrias de Alta Precisão',
      googleUrl: 'https://maps.google.com/?q=Master+Esquadrias+Novo+Hamburgo',
    },
    {
      id: 'seed_8',
      name: 'Metalúrgica & Esquadrias Vale Real',
      phone: '(51) 99222-1144',
      address: 'Av. Cel. Travassos, 440 - Mauá, Novo Hamburgo - RS',
      website: 'https://valerealmetal.com.br',
      rating: 4.5,
      reviewsCount: 22,
      category: 'Estruturas Metálicas & Esquadrias',
      googleUrl: 'https://maps.google.com/?q=Metalurgica+Vale+Real+Novo+Hamburgo',
    },
    {
      id: 'seed_9',
      name: 'Esquadrias & Vidros São Jorge',
      phone: '(51) 3582-3300',
      address: 'Av. Victor Hugo Kunz, 1650 - São Jorge, Novo Hamburgo - RS',
      website: 'https://esquadriassaojorge.com.br',
      rating: 4.9,
      reviewsCount: 47,
      category: 'Vidros e Esquadrias',
      googleUrl: 'https://maps.google.com/?q=Esquadrias+Sao+Jorge+Novo+Hamburgo',
    },
    {
      id: 'seed_10',
      name: 'Elite Esquadrias de Alumínio',
      phone: '(51) 99770-5544',
      address: 'Rua Bartolomeu de Gusmão, 780 - Canudos, Novo Hamburgo - RS',
      website: 'https://eliteesquadrias.com.br',
      rating: 4.8,
      reviewsCount: 31,
      category: 'Alumínio de Alto Padrão',
      googleUrl: 'https://maps.google.com/?q=Elite+Esquadrias+Novo+Hamburgo',
    },
    {
      id: 'seed_11',
      name: 'Alumitec Esquadrias e Portões',
      phone: '(51) 3561-1200',
      address: 'Rua General Osório, 520 - Hamburgo Velho, Novo Hamburgo - RS',
      website: 'https://alumitecesquadrias.com.br',
      rating: 4.7,
      reviewsCount: 25,
      category: 'Portões & Esquadrias',
      googleUrl: 'https://maps.google.com/?q=Alumitec+Portoes+Novo+Hamburgo',
    },
    {
      id: 'seed_12',
      name: 'Central de Esquadrias & Montagens',
      phone: '(51) 98111-9988',
      address: 'Rua Tapes, 310 - Ideal, Novo Hamburgo - RS',
      website: 'https://centralesquadrias.com.br',
      rating: 4.6,
      reviewsCount: 18,
      category: 'Montagens & Instalações',
      googleUrl: 'https://maps.google.com/?q=Central+Esquadrias+Novo+Hamburgo',
    },
    {
      id: 'seed_13',
      name: 'Novo Hamburgo Esquadrias de PVC',
      phone: '(51) 99344-2211',
      address: 'Rua Joaquim Nabuco, 840 - Rio Branco, Novo Hamburgo - RS',
      website: 'https://nhesquadriaspvc.com.br',
      rating: 4.9,
      reviewsCount: 63,
      category: 'Esquadrias Termoacústicas',
      googleUrl: 'https://maps.google.com/?q=Novo+Hamburgo+Esquadrias+PVC',
    },
    {
      id: 'seed_14',
      name: 'Vidrosul & Esquadrias Especiais',
      phone: '(51) 3593-7722',
      address: 'Rua Magalhães Calvet, 310 - Centro, Novo Hamburgo - RS',
      website: 'https://vidrosulesquadrias.com.br',
      rating: 4.8,
      reviewsCount: 40,
      category: 'Vidros Temperados e Esquadrias',
      googleUrl: 'https://maps.google.com/?q=Vidrosul+Esquadrias+Novo+Hamburgo',
    },
    {
      id: 'seed_15',
      name: 'Esquadrias Aliança & Estruturas',
      phone: '(51) 98022-3344',
      address: 'Rua 24 de Maio, 420 - Vila Rosa, Novo Hamburgo - RS',
      website: 'https://aliancaesquadrias.com.br',
      rating: 4.7,
      reviewsCount: 33,
      category: 'Estruturas e Esquadrias',
      googleUrl: 'https://maps.google.com/?q=Alianca+Esquadrias+Novo+Hamburgo',
    },
    {
      id: 'seed_16',
      name: 'Top Esquadrias & Design de Aço',
      phone: '(51) 99550-6677',
      address: 'Rua Almirante Barroso, 610 - Centro, Novo Hamburgo - RS',
      website: 'https://topesquadrias.com.br',
      rating: 4.9,
      reviewsCount: 55,
      category: 'Design e Esquadrias',
      googleUrl: 'https://maps.google.com/?q=Top+Esquadrias+Novo+Hamburgo',
    },
    {
      id: 'seed_17',
      name: 'Esquadrias & Portas Vale Verde',
      phone: '(51) 3591-8899',
      address: 'Rua David Canabarro, 150 - Centro, Novo Hamburgo - RS',
      website: 'https://esquadriasvaleverde.com.br',
      rating: 4.6,
      reviewsCount: 27,
      category: 'Portas e Esquadrias',
      googleUrl: 'https://maps.google.com/?q=Vale+Verde+Portas+Novo+Hamburgo',
    },
    {
      id: 'seed_18',
      name: 'Innovare Esquadrias de Alta Linha',
      phone: '(51) 98900-1122',
      address: 'Av. 7 de Setembro, 980 - Liberdade, Novo Hamburgo - RS',
      website: 'https://innovareesquadrias.com.br',
      rating: 5.0,
      reviewsCount: 74,
      category: 'Linha Premium de Esquadrias',
      googleUrl: 'https://maps.google.com/?q=Innovare+Esquadrias+Novo+Hamburgo',
    },
    {
      id: 'seed_19',
      name: 'Serralheria & Esquadrias Petrópolis',
      phone: '(51) 99633-4455',
      address: 'Rua Presidente Lucena, 530 - Petrópolis, Novo Hamburgo - RS',
      website: 'https://esquadriaspetropolis.com.br',
      rating: 4.5,
      reviewsCount: 16,
      category: 'Serralheria Fina',
      googleUrl: 'https://maps.google.com/?q=Serralheria+Petropolis+Novo+Hamburgo',
    },
    {
      id: 'seed_20',
      name: 'Metropolitana Esquadrias & Vidros',
      phone: '(51) 3594-8800',
      address: 'Rua José do Patrocínio, 290 - Rio Branco, Novo Hamburgo - RS',
      website: 'https://metropolitanaesquadrias.com.br',
      rating: 4.8,
      reviewsCount: 49,
      category: 'Projetos Arquitetônicos & Esquadrias',
      googleUrl: 'https://maps.google.com/?q=Metropolitana+Esquadrias+Novo+Hamburgo',
    },
  ];

  // Load history from localStorage on mount or subaccount switch
  useEffect(() => {
    const storageKey = `flowlevel_prospector_history_${currentSubaccount.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed: SearchHistoryItem[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Atualiza qualquer lista antiga de 4 leads para a lista completa de 20 leads
          const upgraded = parsed.map((item) => {
            if (item.id === 'hist_seed_1' || item.resultsCount === 4) {
              return {
                ...item,
                limit: 20,
                resultsCount: 20,
                results: full20SeedResults,
              };
            }
            return item;
          });
          setHistory(upgraded);
          try {
            localStorage.setItem(storageKey, JSON.stringify(upgraded));
          } catch {}
          return;
        }
      } catch (err) {
        console.error('Error parsing search history', err);
      }
    }

    // Default sample history if empty, with 20 complete leads
    const initialSeed: SearchHistoryItem[] = [
      {
        id: 'hist_seed_1',
        searchTerm: 'esquadrias',
        location: 'Novo Hamburgo, RS, Brasil',
        limit: 20,
        resultsCount: 20,
        timestamp: new Date().toISOString(),
        formattedDate: '19/10/2026 às 15:00',
        results: full20SeedResults,
      },
    ];

    setHistory(initialSeed);
    try {
      localStorage.setItem(storageKey, JSON.stringify(initialSeed));
    } catch {}
  }, [currentSubaccount.id]);

  // Helper to persist history
  const persistHistory = (newHistory: SearchHistoryItem[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem(`flowlevel_prospector_history_${currentSubaccount.id}`, JSON.stringify(newHistory));
    } catch (e) {
      console.error('Error saving history to localStorage', e);
    }
  };

  const handleStartMining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim() || !location.trim()) return;

    setIsRunning(true);
    setStatusMessage('Iniciando Actor na Apify (compass/crawler-google-places)...');
    setResults([]);
    setSelectedIds(new Set());
    setImportSuccessMessage(null);
    setActiveHistoryItem(null);

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
          subaccountId: currentSubaccount.id,
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
          )}&location=${encodeURIComponent(location)}&limit=${limit}&customToken=${encodeURIComponent(apiToken)}&subaccountId=${currentSubaccount.id}`
        );
        const statusJson = await statusRes.json();

        if (statusJson.status === 'SUCCEEDED') {
          const items: ProspectItem[] = statusJson.items || [];
          setResults(items);
          const ids = new Set<string>(items.map((i) => i.id));
          setSelectedIds(ids);
          setIsRunning(false);
          setStatusMessage('');

          // 3. Salvar automaticamente no Histórico
          const now = new Date();
          const newHistoryItem: SearchHistoryItem = {
            id: `hist_${Date.now()}`,
            searchTerm: searchTerm.trim(),
            location: location.trim(),
            limit,
            resultsCount: items.length,
            timestamp: now.toISOString(),
            formattedDate: now.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            results: items,
          };

          const filtered = history.filter(
            (h) => !(h.searchTerm.toLowerCase() === searchTerm.toLowerCase().trim() && h.location.toLowerCase() === location.toLowerCase().trim())
          );
          const nextHistory = [newHistoryItem, ...filtered].slice(0, 50);
          persistHistory(nextHistory);
          setActiveHistoryItem(newHistoryItem);
        } else if (retries < 15) {
          setStatusMessage(`Extraindo contatos e telefones... (${retries + 1}/15)`);
          setTimeout(() => pollResults(retries + 1), 2500);
        } else {
          setIsRunning(false);
          setStatusMessage('A extração está demorando mais que o previsto. Verifique no console da Apify.');
        }
      };

      setTimeout(() => pollResults(0), 1200);
    } catch (err: any) {
      setIsRunning(false);
      setStatusMessage('');
      alert(err.message || 'Erro ao executar extração.');
    }
  };

  // Abrir uma lista salva do histórico
  const handleOpenHistoryItem = (item: SearchHistoryItem) => {
    setResults(item.results);
    setSelectedIds(new Set(item.results.map((p) => p.id)));
    setSearchTerm(item.searchTerm);
    setLocation(item.location);
    setLimit(item.limit);
    setActiveHistoryItem(item);
    setActiveTab('search');
    setImportSuccessMessage(null);

    // Rolar suavemente para a tabela de resultados
    setTimeout(() => {
      const el = document.getElementById('prospects-results-table');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Excluir item do histórico
  const handleDeleteHistoryItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Deseja realmente remover esta lista do seu histórico de pesquisas?')) return;
    const updated = history.filter((h) => h.id !== id);
    persistHistory(updated);
    if (activeHistoryItem?.id === id) {
      setActiveHistoryItem(null);
    }
  };

  // Limpar todo o histórico
  const handleClearAllHistory = () => {
    if (!confirm('Deseja limpar todo o histórico de pesquisas desta empresa?')) return;
    persistHistory([]);
    setActiveHistoryItem(null);
  };

  // Exportar para CSV direto de um item do histórico
  const handleExportHistoryItemCsv = (item: SearchHistoryItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    downloadCsv(item.results, `leads_${item.searchTerm.toLowerCase().replace(/\s+/g, '_')}_${item.location.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`);
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

  const downloadCsv = (items: ProspectItem[], filename: string) => {
    if (!items || items.length === 0) return;
    const headers = ['Nome', 'Telefone', 'Endereco', 'Website', 'Avaliacao', 'Reviews', 'Categoria'];
    const rows = items.map((p) => [
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
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCurrentSelectionToCsv = () => {
    const prospectsToExport = results.filter((r) => selectedIds.has(r.id));
    if (prospectsToExport.length === 0) return;
    downloadCsv(prospectsToExport, `prospectos_${searchTerm.toLowerCase().replace(/\s+/g, '_')}.csv`);
  };

  const displayedResults = results.filter((p) => {
    if (filterOnlyWithPhone && (!p.phone || p.phone.trim().length < 5)) return false;
    if (filterMinRating > 0 && p.rating < filterMinRating) return false;
    return true;
  });

  const filteredHistory = history.filter((h) => {
    if (!historySearchQuery.trim()) return true;
    const q = historySearchQuery.toLowerCase();
    return h.searchTerm.toLowerCase().includes(q) || h.location.toLowerCase().includes(q);
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
              Gerador de Leads B2B (Google Maps)
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">
              compass/crawler-google-places
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Minere empresas e clientes qualificados no Google Maps com telefones, endereços e avaliações diretamente para o seu Funil de Vendas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Aba de Navegação Nova Extração vs Histórico */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'search'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Nova Extração</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Histórico de Listas</span>
              {history.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-800 dark:text-slate-200 font-bold">
                  {history.length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => setIsTokenModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition border border-slate-300 dark:border-slate-700"
          >
            <Key className="w-3.5 h-3.5 text-amber-500" />
            <span>Configurar Token Apify</span>
          </button>
        </div>
      </div>

      {/* VIEW: HISTÓRICO DE LISTAS */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Histórico de Extrações & Listas Salvas
                </h3>
                <span className="text-xs text-slate-400 font-medium">({history.length} listas disponíveis)</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar por nicho ou cidade..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                  {historySearchQuery && (
                    <button
                      onClick={() => setHistorySearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {history.length > 0 && (
                  <button
                    onClick={handleClearAllHistory}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg text-rose-500 hover:bg-rose-500/10 font-medium transition shrink-0"
                    title="Limpar todo o histórico"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Limpar Tudo</span>
                  </button>
                )}
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="text-center py-12 space-y-2 text-slate-400 text-xs">
                <FolderOpen className="w-8 h-8 mx-auto text-slate-500 stroke-1" />
                <p className="font-semibold text-slate-300">Nenhuma lista encontrada no histórico.</p>
                <p className="text-[11px] text-slate-500">
                  {historySearchQuery ? 'Tente outro termo de busca.' : 'Execute uma nova extração para que ela fique salva aqui automaticamente.'}
                </p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Realizar Primeira Extração</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredHistory.map((item) => {
                  const isActive = activeHistoryItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOpenHistoryItem(item)}
                      className={`group p-4 rounded-xl border text-xs flex flex-col justify-between transition cursor-pointer relative overflow-hidden ${
                        isActive
                          ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-500 shadow-md shadow-blue-500/10'
                          : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800/80 shadow-sm'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                          Aberta Agora
                        </div>
                      )}

                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2 pr-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider text-[10px]">
                              {item.searchTerm}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                              {item.resultsCount} leads
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold truncate" title={item.location}>
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{item.formattedDate}</span>
                          </div>
                        </div>

                        {/* Prévia de Empresas */}
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 space-y-1">
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                            Amostra de Estabelecimentos:
                          </p>
                          <div className="space-y-0.5">
                            {item.results.slice(0, 2).map((r, i) => (
                              <p key={i} className="text-[11px] text-slate-600 dark:text-slate-300 truncate flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-cyan-500" />
                                <span className="font-medium truncate">{r.name}</span>
                                {r.rating > 0 && (
                                  <span className="text-[10px] text-amber-500 shrink-0">({r.rating}★)</span>
                                )}
                              </p>
                            ))}
                            {item.results.length > 2 && (
                              <p className="text-[10px] text-slate-400 italic">
                                + {item.results.length - 2} outros estabelecimentos
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenHistoryItem(item);
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 group-hover:underline"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>Abrir Lista</span>
                          <ArrowRight className="w-3 h-3 ml-0.5" />
                        </button>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleExportHistoryItemCsv(item, e)}
                            title="Exportar CSV direto"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10 transition"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                            title="Excluir do histórico"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: NOVA EXTRAÇÃO & RESULTADOS */}
      {activeTab === 'search' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Card de Pesquisa no Google Maps */}
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

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  {history.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('history')}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 transition text-xs"
                    >
                      <History className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Ver Histórico ({history.length})</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isRunning}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/30 transition disabled:opacity-50"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Extraindo no Google Maps...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-current text-cyan-300" />
                        <span>Save & Start Extração</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Quick Access Bar to Recent History */}
            {history.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs py-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold shrink-0">
                  <Clock className="w-3 h-3 text-slate-500" />
                  Listas Recentes:
                </span>
                <div className="flex items-center gap-1.5">
                  {history.slice(0, 4).map((h) => {
                    const isSelected = activeHistoryItem?.id === h.id;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => handleOpenHistoryItem(h)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1.5 transition shrink-0 border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-500 font-semibold shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span className="font-semibold">{h.searchTerm}</span>
                        <span className="text-[10px] opacity-75">({h.resultsCount})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
                    Ver no Funil CRM →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Banner de Lista Salva do Histórico Ativa */}
          {activeHistoryItem && results.length > 0 && (
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs animate-in fade-in">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <FolderOpen className="w-4 h-4 text-blue-500 shrink-0" />
                <span>
                  Exibindo lista salva: <strong>&quot;{activeHistoryItem.searchTerm}&quot;</strong> em <strong>&quot;{activeHistoryItem.location}&quot;</strong> • Gravada em {activeHistoryItem.formattedDate} ({activeHistoryItem.resultsCount} leads encontrados)
                </span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => {
                    setActiveHistoryItem(null);
                    setResults([]);
                  }}
                  className="px-2.5 py-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-[11px] font-semibold"
                >
                  Fechar Lista
                </button>
              </div>
            </div>
          )}

          {/* Results Section */}
          {results.length > 0 && (
            <div id="prospects-results-table" className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              {/* Action and Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-900 dark:text-white select-none">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === displayedResults.length && displayedResults.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
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
                    onClick={exportCurrentSelectionToCsv}
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
              Ele também já está configurado na nuvem da Vercel como <code className="text-cyan-400 font-mono">APIFY_API_TOKEN</code>.
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
