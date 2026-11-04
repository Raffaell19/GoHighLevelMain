'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ProspectItem } from '@/types';
import { MassOutreachModal } from './MassOutreachModal';

// Valida se o estabelecimento possui um site próprio real (não sendo apenas link do Google Maps)
export const isRealWebsite = (url?: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  if (trimmed.length < 5) return false;
  if (
    trimmed.includes('google.com') ||
    trimmed.includes('google.com.br') ||
    trimmed.includes('goo.gl') ||
    trimmed.includes('maps.app.goo.gl')
  ) {
    return false;
  }
  return true;
};

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

const PRESET_LIMITS = [20, 50, 70, 100, 150, 200];

interface ProspectorViewProps {
  onNavigateToCrm?: () => void;
  onNavigateToWhatsApp?: () => void;
}

export function ProspectorView({ onNavigateToCrm, onNavigateToWhatsApp }: ProspectorViewProps) {
  const { currentSubaccount, stages } = useApp();

  // Modal de Disparo em Massa
  const [isOutreachModalOpen, setIsOutreachModalOpen] = useState(false);

  // Navigation tab between "Nova Extração" and "Histórico de Listas"
  const [activeTab, setActiveTab] = useState<'search' | 'history'>('search');

  // Form states matching Apify's Google Maps Scraper console
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [limit, setLimit] = useState(70);
  const [isCustomLimit, setIsCustomLimit] = useState(false);
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
  const [websiteFilter, setWebsiteFilter] = useState<'all' | 'without_website' | 'with_website'>('all');
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
        if (Array.isArray(parsed)) {
          // Filtra e remove qualquer lista demo antiga de teste
          const realHistory = parsed.filter((item) => item.id !== 'hist_seed_1');
          setHistory(realHistory);
          try {
            localStorage.setItem(storageKey, JSON.stringify(realHistory));
          } catch {}
          return;
        }
      } catch (err) {
        console.error('Error parsing search history', err);
      }
    }

    // Inicializa vazio para ambiente de produção real
    setHistory([]);
    try {
      localStorage.removeItem(storageKey);
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

    const effectiveLimit = Math.max(1, limit || 20);
    if (effectiveLimit !== limit) {
      setLimit(effectiveLimit);
    }

    setIsRunning(true);
    setStatusMessage(`Iniciando Actor na Apify para buscar até ${effectiveLimit} estabelecimentos...`);
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
          limit: effectiveLimit,
          language,
          customToken: apiToken || undefined,
          subaccountId: currentSubaccount.id,
        }),
      });

      const runJson = await runRes.json();
      if (!runRes.ok || runJson.error) {
        throw new Error(runJson.error || 'Falha ao iniciar o crawler na Apify');
      }

      setStatusMessage(`Varrendo até ${effectiveLimit} empresas no Google Maps...`);

      // 2. Polling de status / Obtenção dos resultados
      const MAX_RETRIES = 45; // Permite até ~115 segundos para extração segura de lotes de 50 a 150 locais
      const pollResults = async (retries = 0): Promise<void> => {
        const statusRes = await fetch(
          `/api/prospects/status?runId=${runJson.runId}&defaultDatasetId=${runJson.defaultDatasetId || ''}&searchQuery=${encodeURIComponent(
            searchTerm
          )}&location=${encodeURIComponent(location)}&limit=${effectiveLimit}&customToken=${encodeURIComponent(apiToken)}&subaccountId=${currentSubaccount.id}`
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
        } else if (retries < MAX_RETRIES) {
          const count = statusJson.currentCount;
          if (typeof count === 'number' && count > 0) {
            setStatusMessage(`Extraindo contatos e telefones... (${count} de até ${limit} estabelecimentos encontrados)`);
          } else {
            const pct = Math.min(95, Math.max(8, Math.round(((retries + 1) / MAX_RETRIES) * 100)));
            setStatusMessage(`Minerando até ${limit} estabelecimentos no Google Maps... (${pct}%)`);
          }
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
    if (!PRESET_LIMITS.includes(item.limit)) {
      setIsCustomLimit(true);
    } else {
      setIsCustomLimit(false);
    }
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

  // Contagens dinâmicas de leads com e sem website
  const withoutWebsiteCount = useMemo(() => {
    return results.filter((p) => !isRealWebsite(p.website)).length;
  }, [results]);

  const withWebsiteCount = useMemo(() => {
    return results.filter((p) => isRealWebsite(p.website)).length;
  }, [results]);

  // Resultados filtrados segundo a aba ativa (Todos, Sem Site ou Com Site) e filtros adicionais
  const displayedResults = useMemo(() => {
    return results.filter((p) => {
      if (filterOnlyWithPhone && (!p.phone || p.phone.trim().length < 5)) return false;
      if (filterMinRating > 0 && p.rating < filterMinRating) return false;
      if (websiteFilter === 'without_website' && isRealWebsite(p.website)) return false;
      if (websiteFilter === 'with_website' && !isRealWebsite(p.website)) return false;
      return true;
    });
  }, [results, filterOnlyWithPhone, filterMinRating, websiteFilter]);

  // Leads que estão selecionados E pertencem à visualização/filtro ativo atual
  const activeSelectedLeads = useMemo(() => {
    return displayedResults.filter((p) => selectedIds.has(p.id));
  }, [displayedResults, selectedIds]);

  const activeSelectedCount = activeSelectedLeads.length;

  // Alternar filtro de abas e sincronizar a seleção automaticamente
  const handleWebsiteFilterChange = (filter: 'all' | 'without_website' | 'with_website') => {
    setWebsiteFilter(filter);
    if (filter === 'without_website') {
      const withoutSiteIds = new Set(results.filter((p) => !isRealWebsite(p.website)).map((p) => p.id));
      setSelectedIds(withoutSiteIds);
    } else if (filter === 'with_website') {
      const withSiteIds = new Set(results.filter((p) => isRealWebsite(p.website)).map((p) => p.id));
      setSelectedIds(withSiteIds);
    } else {
      setSelectedIds(new Set(results.map((p) => p.id)));
    }
  };

  // Selecionar Todos / Desmarcar Todos exclusivamente na visualização atual
  const toggleSelectAll = () => {
    if (displayedResults.length === 0) return;
    const allDisplayedSelected = displayedResults.every((p) => selectedIds.has(p.id));
    const next = new Set(selectedIds);
    if (allDisplayedSelected) {
      displayedResults.forEach((p) => next.delete(p.id));
    } else {
      displayedResults.forEach((p) => next.add(p.id));
    }
    setSelectedIds(next);
  };

  // Selecionar com 1 clique todas as empresas sem site institucional
  const handleSelectOnlyWithoutWebsite = () => {
    setWebsiteFilter('without_website');
    const noWebsiteLeads = results.filter((p) => !isRealWebsite(p.website));
    setSelectedIds(new Set(noWebsiteLeads.map((p) => p.id)));
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Importar exclusivamente os leads selecionados na visualização ativa
  const handleImportToCrm = async () => {
    if (activeSelectedLeads.length === 0) return;
    setIsImporting(true);

    try {
      const res = await fetch('/api/prospects/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subaccountId: currentSubaccount.id,
          prospects: activeSelectedLeads,
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
    if (activeSelectedLeads.length === 0) return;
    downloadCsv(activeSelectedLeads, `prospectos_${searchTerm.toLowerCase().replace(/\s+/g, '_')}.csv`);
  };

  const filteredHistory = history.filter((h) => {
    if (!historySearchQuery.trim()) return true;
    const q = historySearchQuery.toLowerCase();
    return h.searchTerm.toLowerCase().includes(q) || h.location.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#161616]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-white">
              Gerador de leads B2B
            </h1>
            <span className="text-[11px] px-2 py-0.5 rounded-[4px] font-medium bg-[#161616] text-[#b4b4b4] border border-[#262626]">
              Google Maps Crawler
            </span>
          </div>
          <p className="text-[13px] text-[#b4b4b4] mt-1">
            Minere empresas e clientes qualificados no Google Maps com telefones, endereços e avaliações diretamente para o funil de vendas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Aba de Navegação Nova Extração vs Histórico */}
          <div className="flex items-center bg-[#111111] p-1 rounded-[6px] border border-[#1a1a1a] text-[12px]">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-[4px] font-medium transition-colors ${
                activeTab === 'search'
                  ? 'bg-[#222222] text-white'
                  : 'text-[#949494] hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Nova extração</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-[4px] font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-[#222222] text-white'
                  : 'text-[#949494] hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Histórico</span>
              {history.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-[4px] bg-[#161616] text-[11px] text-[#b4b4b4] tabular-nums">
                  {history.length}
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsOutreachModalOpen(true)}
            className="h-8 flex items-center gap-1.5 px-3.5 rounded-[6px] bg-white hover:bg-[#e5e5e5] text-black text-[12px] font-medium transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Disparo WhatsApp</span>
            {selectedIds.size > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-[4px] bg-black/15 text-black text-[11px] font-semibold tabular-nums">
                {selectedIds.size}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsTokenModalOpen(true)}
            className="h-8 flex items-center gap-1.5 px-3 rounded-[6px] bg-[#161616] hover:bg-[#222222] text-[#b4b4b4] hover:text-white text-[12px] font-medium transition-colors border border-[#2a2a2a]"
          >
            <Key className="w-3.5 h-3.5 text-[var(--warn)]" />
            <span>Token Apify</span>
          </button>
        </div>
      </div>

      {/* VIEW: HISTÓRICO DE LISTAS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="p-5 bg-[#111111] rounded-[8px] border border-[#1a1a1a] space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#161616]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#949494]" />
                <h3 className="font-semibold text-[14px] text-white">
                  Histórico de extrações e listas salvas
                </h3>
                <span className="text-[12px] text-[#949494] tabular-nums">({history.length} listas)</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#949494]" />
                  <input
                    type="text"
                    placeholder="Filtrar por nicho ou cidade..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    className="w-full h-8 pl-8 pr-7 rounded-[6px] bg-[#0a0a0a] text-[12px] text-white border border-[#222222] focus:outline-none focus:border-[#444444]"
                  />
                  {historySearchQuery && (
                    <button
                      onClick={() => setHistorySearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#949494] hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {history.length > 0 && (
                  <button
                    onClick={handleClearAllHistory}
                    className="h-8 flex items-center gap-1 px-3 text-[12px] rounded-[6px] text-[var(--err)] hover:bg-[#1a1a1a] font-medium transition-colors shrink-0"
                    title="Limpar todo o histórico"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Limpar tudo</span>
                  </button>
                )}
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="text-center py-12 space-y-2 text-[#949494] text-[13px]">
                <FolderOpen className="w-7 h-7 mx-auto text-[#444444]" />
                <p className="font-medium text-white">Nenhuma lista encontrada no histórico.</p>
                <p className="text-[12px] text-[#949494]">
                  {historySearchQuery ? 'Tente outro termo de busca.' : 'Execute uma nova extração para que ela fique salva aqui automaticamente.'}
                </p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="mt-3 h-8 inline-flex items-center gap-1.5 px-3.5 rounded-[6px] bg-white hover:bg-[#e5e5e5] text-black text-[12px] font-medium transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Realizar primeira extração</span>
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
                      className={`group p-4 rounded-[8px] border text-[12px] flex flex-col justify-between transition-colors cursor-pointer relative overflow-hidden ${
                        isActive
                          ? 'bg-[#181818] border-white'
                          : 'bg-[#141414] border-[#1f1f1f] hover:border-[#333333]'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute top-0 right-0 bg-white text-black text-[10px] font-medium px-2 py-0.5 rounded-bl-[4px]">
                          Aberta agora
                        </div>
                      )}

                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2 pr-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-[4px] bg-[#222222] text-white font-medium text-[11px]">
                              {item.searchTerm}
                            </span>
                            <span className="px-2 py-0.5 rounded-[4px] bg-[#1a1a1a] text-[var(--ok)] font-medium text-[11px] tabular-nums">
                              {item.resultsCount} leads
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[#e5e5e5] font-medium truncate" title={item.location}>
                            <MapPin className="w-3.5 h-3.5 text-[#949494] shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#949494] tabular-nums">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{item.formattedDate}</span>
                          </div>
                        </div>

                        {/* Prévia de Empresas */}
                        <div className="p-2.5 rounded-[6px] bg-[#0a0a0a] border border-[#1f1f1f] space-y-1">
                          <p className="text-[11px] text-[#949494] font-medium">
                            Amostra de estabelecimentos:
                          </p>
                          <div className="space-y-0.5">
                            {item.results.slice(0, 2).map((r, i) => (
                              <p key={i} className="text-[11px] text-[#b4b4b4] truncate flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-[#949494]" />
                                <span className="font-medium truncate">{r.name}</span>
                                {r.rating > 0 && (
                                  <span className="text-[11px] text-[var(--warn)] shrink-0 tabular-nums">({r.rating})</span>
                                )}
                              </p>
                            ))}
                            {item.results.length > 2 && (
                              <p className="text-[11px] text-[#949494] tabular-nums">
                                + {item.results.length - 2} outros estabelecimentos
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="pt-3 mt-3 border-t border-[#1f1f1f] flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenHistoryItem(item);
                          }}
                          className="flex items-center gap-1 text-[12px] font-medium text-white group-hover:underline"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>Abrir lista</span>
                          <ArrowRight className="w-3 h-3 ml-0.5" />
                        </button>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleExportHistoryItemCsv(item, e)}
                            title="Exportar CSV direto"
                            className="p-1.5 rounded-[4px] text-[#949494] hover:text-white hover:bg-[#222222] transition-colors"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                            title="Excluir do histórico"
                            className="p-1.5 rounded-[4px] text-[#949494] hover:text-[var(--err)] hover:bg-[#222222] transition-colors"
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
        <div className="space-y-5">
          {/* Card de Pesquisa no Google Maps */}
          <div className="p-5 bg-[#111111] rounded-[8px] border border-[#1a1a1a] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#161616]">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#949494]" />
                <h3 className="font-semibold text-[14px] text-white">
                  Parâmetros de busca e extração de estabelecimentos
                </h3>
              </div>
              <span className="text-[12px] text-[#949494]">
                Empresa ativa: <strong className="text-[#b4b4b4] font-medium">{currentSubaccount.name}</strong>
              </span>
            </div>

            <form onSubmit={handleStartMining} className="space-y-4 text-[13px]">
              {/* Quick Niches Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[12px] text-[#949494] font-medium mr-1">Sugestões de nicho:</span>
                {quickNiches.map((niche) => (
                  <button
                    key={niche}
                    type="button"
                    onClick={() => setSearchTerm(niche.toLowerCase())}
                    className={`px-2.5 py-1 rounded-[4px] text-[12px] font-medium transition-colors ${
                      searchTerm.toLowerCase() === niche.toLowerCase()
                        ? 'bg-white text-black'
                        : 'bg-[#161616] text-[#b4b4b4] hover:text-white border border-[#222222]'
                    }`}
                  >
                    {niche}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Search Term */}
                <div className="md:col-span-5 space-y-1.5">
                  <label className="block text-[12px] text-[#b4b4b4] font-medium flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-[#949494]" />
                    <span>Palavra-chave / nicho</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: esquadrias, climatização, vidraçaria..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] text-white border border-[#222222] focus:outline-none focus:border-[#444444]"
                    required
                  />
                </div>

                {/* Location */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="block text-[12px] text-[#b4b4b4] font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#949494]" />
                    <span>Região e cidade</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Novo Hamburgo, RS, Brasil"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] text-white border border-[#222222] focus:outline-none focus:border-[#444444]"
                    required
                  />
                </div>

                {/* Limit */}
                <div className="md:col-span-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] text-[#b4b4b4] font-medium flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#949494]" />
                      <span>Qtd. de lugares</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomLimit((prev) => !prev)}
                      className="text-[11px] text-white hover:underline cursor-pointer"
                    >
                      {isCustomLimit ? 'Lista padrão' : 'Personalizar'}
                    </button>
                  </div>

                  {isCustomLimit ? (
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          value={limit > 0 ? limit : ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            setLimit(isNaN(val) ? 1 : val);
                          }}
                          placeholder="Ex: 35"
                          className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] text-white border border-[#444444] focus:outline-none font-medium tabular-nums"
                          autoFocus
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#949494] pointer-events-none">
                          lugares
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomLimit(false);
                          if (!PRESET_LIMITS.includes(limit)) setLimit(70);
                        }}
                        className="h-9 px-2.5 rounded-[6px] bg-[#161616] hover:bg-[#222222] text-[#b4b4b4] text-[12px] font-medium transition-colors border border-[#2a2a2a] cursor-pointer shrink-0"
                        title="Voltar para opções pré-definidas"
                      >
                        Padrão
                      </button>
                    </div>
                  ) : (
                    <select
                      value={PRESET_LIMITS.includes(limit) ? limit : 'custom'}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setIsCustomLimit(true);
                        } else {
                          setLimit(Number(e.target.value));
                        }
                      }}
                      className="w-full h-9 px-2.5 rounded-[6px] bg-[#0a0a0a] text-white border border-[#222222] focus:outline-none focus:border-[#444444] text-[13px] tabular-nums"
                    >
                      <option value={20}>20 estabelecimentos</option>
                      <option value={50}>50 estabelecimentos</option>
                      <option value={70}>70 estabelecimentos (Recomendado)</option>
                      <option value={100}>100 estabelecimentos</option>
                      <option value={150}>150 estabelecimentos</option>
                      <option value={200}>200 estabelecimentos</option>
                      <option value="custom">Personalizado (Digitar quantidade)...</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Action Row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-[12px] text-[#949494] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--ok)]" />
                  <span>Idioma configurado: <strong className="text-[#b4b4b4] font-medium">Português (Brasil)</strong> com filtros de contatos enriquecidos</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {history.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('history')}
                      className="h-9 px-3.5 rounded-[6px] bg-[#161616] hover:bg-[#222222] border border-[#2a2a2a] text-[#b4b4b4] hover:text-white font-medium flex items-center gap-1.5 transition-colors text-[12px] tabular-nums"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Ver histórico ({history.length})</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isRunning}
                    className="h-9 flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 rounded-[6px] bg-white hover:bg-[#e5e5e5] text-black text-[13px] font-medium transition-colors disabled:opacity-50 tabular-nums"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Extraindo no Google Maps...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Extrair estabelecimentos ({limit})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Quick Access Bar to Recent History */}
            {history.length > 0 && (
              <div className="pt-3 border-t border-[#161616] flex items-center gap-2 overflow-x-auto text-[12px] py-1">
                <span className="text-[12px] text-[#949494] flex items-center gap-1 font-medium shrink-0">
                  <Clock className="w-3 h-3" />
                  Listas recentes:
                </span>
                <div className="flex items-center gap-1.5">
                  {history.slice(0, 4).map((h) => {
                    const isSelected = activeHistoryItem?.id === h.id;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => handleOpenHistoryItem(h)}
                        className={`px-2.5 py-1 rounded-[4px] text-[12px] flex items-center gap-1.5 transition-colors shrink-0 border tabular-nums ${
                          isSelected
                            ? 'bg-white text-black border-white font-medium'
                            : 'bg-[#161616] hover:bg-[#222222] text-[#b4b4b4] border-[#262626]'
                        }`}
                      >
                        <span className="font-medium">{h.searchTerm}</span>
                        <span className="text-[11px] opacity-75">({h.resultsCount})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live Loading Indicator */}
            {isRunning && (
              <div className="p-4 rounded-[6px] bg-[#161616] border border-[#2a2a2a] flex items-center gap-3 text-[13px] text-white">
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[#c6f24e]" />
                <div className="space-y-0.5">
                  <p className="font-medium">{statusMessage || `Processando busca de até ${limit} estabelecimentos...`}</p>
                  <p className="text-[12px] text-[#949494]">
                    Buscando até {limit} estabelecimentos em &quot;{location || 'região selecionada'}&quot;. Extraindo telefones comerciais, endereços e avaliações.
                  </p>
                </div>
              </div>
            )}

            {/* Success Alert */}
            {importSuccessMessage && (
              <div className="p-4 rounded-[6px] bg-[#161616] border border-[var(--ok)]/40 flex items-center justify-between gap-3 text-[13px] text-[var(--ok)]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{importSuccessMessage}</span>
                </div>
                {onNavigateToCrm && (
                  <button
                    onClick={onNavigateToCrm}
                    className="h-8 px-3 rounded-[6px] bg-white hover:bg-[#e5e5e5] text-black text-[12px] font-medium transition-colors shrink-0"
                  >
                    Ver no funil CRM &rarr;
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Banner de Lista Salva do Histórico Ativa */}
          {activeHistoryItem && results.length > 0 && (
            <div className="p-3.5 rounded-[6px] bg-[#161616] border border-[#262626] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-[12px]">
              <div className="flex items-center gap-2 text-[#b4b4b4] tabular-nums">
                <FolderOpen className="w-4 h-4 text-white shrink-0" />
                <span>
                  Exibindo lista salva: <strong className="text-white">&quot;{activeHistoryItem.searchTerm}&quot;</strong> em <strong className="text-white">&quot;{activeHistoryItem.location}&quot;</strong> • Gravada em {activeHistoryItem.formattedDate} ({activeHistoryItem.resultsCount} leads encontrados)
                </span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => {
                    setActiveHistoryItem(null);
                    setResults([]);
                  }}
                  className="px-2.5 py-1 text-[#949494] hover:text-white text-[12px] font-medium"
                >
                  Fechar lista
                </button>
              </div>
            </div>
          )}

          {/* Results Section */}
          {results.length > 0 && (
            <div id="prospects-results-table" className="p-5 bg-[#111111] rounded-[8px] border border-[#1a1a1a] space-y-4">
              {/* Action and Filter Toolbar */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-[#161616]">
                <div className="flex flex-wrap items-center gap-2.5">
                  <label className="flex items-center gap-2 cursor-pointer text-[12px] font-medium text-white select-none tabular-nums">
                    <input
                      type="checkbox"
                      checked={displayedResults.length > 0 && displayedResults.every((p) => selectedIds.has(p.id))}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-[#333333]"
                    />
                    <span>
                      Selecionar todos ({activeSelectedCount} de {displayedResults.length})
                    </span>
                  </label>

                  <div className="h-4 w-px bg-[#222222] hidden sm:block" />

                  {/* Botão Rápido: Selecionar Apenas Sem Site */}
                  <button
                    type="button"
                    onClick={handleSelectOnlyWithoutWebsite}
                    className={`h-8 flex items-center gap-1.5 px-3 rounded-[6px] font-medium text-[12px] transition-colors border cursor-pointer tabular-nums ${
                      websiteFilter === 'without_website' && activeSelectedCount === withoutWebsiteCount
                        ? 'bg-[var(--warn)] text-black border-[var(--warn)]'
                        : 'bg-[#161616] hover:bg-[#222222] text-[var(--warn)] border-[#2a2a2a]'
                    }`}
                    title="Selecionar apenas empresas sem website para oferta de criação de site e Google Meu Negócio"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Selecionar sem site ({withoutWebsiteCount})</span>
                  </button>

                  {/* Filtro de Abas: Todos / Sem Site / Com Site */}
                  <div className="flex items-center bg-[#0a0a0a] p-1 rounded-[6px] border border-[#222222] text-[12px] tabular-nums">
                    <button
                      type="button"
                      onClick={() => handleWebsiteFilterChange('all')}
                      className={`px-2.5 py-1 rounded-[4px] font-medium transition-colors ${
                        websiteFilter === 'all'
                          ? 'bg-[#222222] text-white'
                          : 'text-[#949494] hover:text-white'
                      }`}
                    >
                      Todos ({results.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWebsiteFilterChange('without_website')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] font-medium transition-colors ${
                        websiteFilter === 'without_website'
                          ? 'bg-[#222222] text-[var(--warn)]'
                          : 'text-[#949494] hover:text-white'
                      }`}
                      title="Exibir na tabela somente negócios que não possuem website institucional"
                    >
                      <span>Sem site ({withoutWebsiteCount})</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWebsiteFilterChange('with_website')}
                      className={`px-2.5 py-1 rounded-[4px] font-medium transition-colors ${
                        websiteFilter === 'with_website'
                          ? 'bg-[#222222] text-white'
                          : 'text-[#949494] hover:text-white'
                      }`}
                    >
                      Com site ({withWebsiteCount})
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[12px]">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[#b4b4b4] hover:text-white select-none">
                      <input
                        type="checkbox"
                        checked={filterOnlyWithPhone}
                        onChange={(e) => setFilterOnlyWithPhone(e.target.checked)}
                        className="w-3.5 h-3.5 rounded"
                      />
                      <span>Apenas c/ telefone</span>
                    </label>
                  </div>
                </div>

                {/* Batch Actions */}
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end tabular-nums">
                  <button
                    onClick={exportCurrentSelectionToCsv}
                    disabled={activeSelectedCount === 0}
                    className="h-8 flex items-center gap-1.5 px-3 rounded-[6px] bg-[#161616] hover:bg-[#222222] border border-[#2a2a2a] text-[#b4b4b4] hover:text-white text-[12px] font-medium transition-colors disabled:opacity-40"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[var(--ok)]" />
                    <span>Exportar CSV ({activeSelectedCount})</span>
                  </button>

                  <button
                    onClick={() => setIsOutreachModalOpen(true)}
                    disabled={activeSelectedCount === 0}
                    className="h-8 flex items-center gap-1.5 px-3.5 rounded-[6px] bg-[#161616] hover:bg-[#222222] border border-[#2a2a2a] text-[var(--ok)] text-[12px] font-medium transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Disparar WhatsApp ({activeSelectedCount})</span>
                  </button>

                  <button
                    onClick={handleImportToCrm}
                    disabled={activeSelectedCount === 0 || isImporting}
                    className="h-8 flex items-center gap-1.5 px-3.5 rounded-[6px] bg-white hover:bg-[#e5e5e5] text-black text-[12px] font-medium transition-colors disabled:opacity-40"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Importando...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Importar {activeSelectedCount} para o funil</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Banner Informativo quando o filtro Sem Site estiver ativo */}
              {websiteFilter === 'without_website' && (
                <div className="p-3 rounded-[6px] bg-[#161616] border border-[#2a2a2a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-[12px] text-[#b4b4b4]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 text-[var(--warn)]" />
                    <span>
                      Exibindo <strong className="text-white">{withoutWebsiteCount} empresas sem website institucional</strong>. Leads qualificados para oferta de criação de site e Google Meu Negócio.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectOnlyWithoutWebsite}
                    className="h-7 px-3 rounded-[4px] bg-white hover:bg-[#e5e5e5] text-black font-medium text-[11px] shrink-0 transition-colors cursor-pointer tabular-nums"
                  >
                    Marcar todas as {withoutWebsiteCount} sem site
                  </button>
                </div>
              )}

              {/* Prospects Table */}
              <div className="overflow-x-auto rounded-[6px] border border-[#1a1a1a]">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[#0c0c0c] text-[#949494] font-medium text-[12px] border-b border-[#1a1a1a]">
                    <tr>
                      <th className="p-3 w-8"></th>
                      <th className="p-3">Empresa / estabelecimento</th>
                      <th className="p-3">Telefone / WhatsApp</th>
                      <th className="p-3 text-right">Avaliação Google</th>
                      <th className="p-3">Endereço</th>
                      <th className="p-3">Website</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#161616]">
                    {displayedResults.map((prospect) => {
                      const isSelected = selectedIds.has(prospect.id);
                      const cleanPhone = prospect.phone?.replace(/[^0-9]/g, '');

                      return (
                        <tr
                          key={prospect.id}
                          onClick={() => toggleSelectOne(prospect.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#181818]'
                              : 'hover:bg-[#141414]'
                          }`}
                        >
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(prospect.id)}
                              className="w-4 h-4 rounded"
                            />
                          </td>

                          <td className="p-3">
                            <div className="font-medium text-white flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-[#949494] shrink-0" />
                              <span>{prospect.name}</span>
                            </div>
                            <span className="text-[11px] text-[#949494] block mt-0.5">{prospect.category}</span>
                          </td>

                          <td className="p-3 text-[#b4b4b4] tabular-nums">
                            {prospect.phone ? (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" />
                                <span>{prospect.phone}</span>
                                {cleanPhone && (
                                  <a
                                    href={`https://wa.me/55${cleanPhone}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    title="Abrir conversa no WhatsApp"
                                    className="p-1 text-[var(--ok)] hover:bg-[#222222] rounded-[4px] transition-colors"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-[#949494]">Não informado</span>
                            )}
                          </td>

                          <td className="p-3 text-right tabular-nums">
                            <div className="inline-flex items-center justify-end gap-1">
                              <Star className="w-3.5 h-3.5 text-[var(--warn)] fill-current" />
                              <span className="font-medium text-white">{prospect.rating}</span>
                              <span className="text-[11px] text-[#949494]">({prospect.reviewsCount})</span>
                            </div>
                          </td>

                          <td className="p-3 text-[#949494] max-w-xs truncate" title={prospect.address}>
                            {prospect.address}
                          </td>

                          <td className="p-3">
                            {isRealWebsite(prospect.website) ? (
                              <a
                                href={prospect.website}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-white hover:underline flex items-center gap-1.5 max-w-[150px] truncate text-[12px]"
                                title={prospect.website}
                              >
                                <Globe className="w-3.5 h-3.5 shrink-0 text-[#949494]" />
                                <span className="truncate">{prospect.website?.replace(/^https?:\/\//, '')}</span>
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-[#1a1a1a] text-[var(--warn)] border border-[#2a2a2a]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)]" />
                                Sem site
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            {prospect.googleUrl && (
                              <a
                                href={prospect.googleUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-[4px] text-[#949494] hover:text-white hover:bg-[#222222] inline-flex transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111111] border border-[#222222] rounded-[8px] p-5 space-y-4 text-[13px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1a1a1a]">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[var(--warn)]" />
                <h3 className="font-semibold text-[14px] text-white">Configurar token da Apify</h3>
              </div>
              <button onClick={() => setIsTokenModalOpen(false)} className="text-[#949494] hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[#b4b4b4] text-[12px] leading-relaxed">
              Insira o seu <strong className="text-white">Personal API Token</strong> da Apify (obtido em Apify Console &gt; Settings &gt; Integrations).
              Ele também já está configurado na nuvem da Vercel como <code className="text-white">APIFY_API_TOKEN</code>.
            </p>

            <div>
              <label className="block text-[12px] text-[#949494] font-medium mb-1.5">Apify API Token</label>
              <input
                type="password"
                placeholder="apify_api_..."
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                className="w-full h-9 px-3 rounded-[6px] bg-[#0a0a0a] text-white border border-[#262626] focus:outline-none focus:border-[#444444]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsTokenModalOpen(false)}
                className="h-9 px-4 rounded-[6px] bg-[#161616] hover:bg-[#222222] text-[#b4b4b4] hover:text-white font-medium transition-colors"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTokenModalOpen(false);
                  alert('Token salvo para esta sessão do painel!');
                }}
                className="h-9 px-4 rounded-[6px] bg-white hover:bg-[#e5e5e5] text-black font-medium transition-colors"
              >
                Salvar token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Disparo em Massa & Filtro de Decisor WhatsApp */}
      <MassOutreachModal
        isOpen={isOutreachModalOpen}
        onClose={() => setIsOutreachModalOpen(false)}
        selectedLeads={
          activeSelectedLeads.length > 0
            ? activeSelectedLeads
            : displayedResults.length > 0
            ? displayedResults
            : full20SeedResults
        }
        onNavigateToWhatsApp={onNavigateToWhatsApp}
        onNavigateToCrm={onNavigateToCrm}
      />
    </div>
  );
}
