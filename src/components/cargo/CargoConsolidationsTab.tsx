import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  Kanban,
  BarChart3,
  X,
  Boxes,
  MapPin,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  ChevronDown,
  Edit2,
  Trash2,
  ArrowUpDown,
  ArrowRight,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { usePermissions } from '../../context/PermissionsContext';
import {
  cargoConsolidationsApi,
  CONSOLIDATION_STATUSES,
  getConsolidatedNetMargin,
  getConsolidatedNetMarginCurrency,
  getCarrierCostAmount,
  getCarrierCostCurrency,
  getCarrierCostUsd,
} from '../../services/cargoConsolidations.service';
import type {
  ConsolidationListItem,
  ConsolidationStatus,
  ConsolidationPaginatedResponse,
  ConsolidationListParams,
} from '../../services/cargoConsolidations.service';
import { formatMoney } from '../../services/api';
import { ConsolidationModal } from './ConsolidationModal';
import { ConsolidationDetailsDrawer } from './ConsolidationDetailsDrawer';
import { AssignCargosModal } from './AssignCargosModal';

export type ConsolidationViewMode = 'grid' | 'table' | 'kanban' | 'analytics';

const STATUS_BADGES: Record<ConsolidationStatus, { bg: string; text: string; border: string }> = {
  Waiting: {
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-500/30',
  },
  Station: {
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/30',
  },
  'On the way': {
    bg: 'bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
  },
  'On the border': {
    bg: 'bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
  },
  Reload: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/30',
  },
  Arrived: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
  },
};

export function CargoConsolidationsTab() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canCreate, canUpdate, canDelete, canAssignCargo } = usePermissions();

  // State
  const [viewMode, setViewMode] = useState<ConsolidationViewMode>('grid');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(12);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [originFilter, setOriginFilter] = useState<string>('');
  const [destinationFilter, setDestinationFilter] = useState<string>('');
  const [departureStartDate, setDepartureStartDate] = useState<string>('');
  const [departureEndDate, setDepartureEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const [data, setData] = useState<ConsolidationPaginatedResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ConsolidationListItem | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<ConsolidationListItem | null>(null);
  const [assigningConsolidation, setAssigningConsolidation] =
    useState<ConsolidationListItem | null>(null);

  // Expandable rows in table view
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Load consolidations
  const loadConsolidations = useCallback(async () => {
    setLoading(true);
    try {
      const params: ConsolidationListParams = {
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        origin_place: originFilter.trim() || undefined,
        destination_place: destinationFilter.trim() || undefined,
        departure_start_date: departureStartDate || undefined,
        departure_end_date: departureEndDate || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      const res = await cargoConsolidationsApi.list(params);
      setData(res);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to load consolidations', 'error');
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    search,
    statusFilter,
    originFilter,
    destinationFilter,
    departureStartDate,
    departureEndDate,
    sortBy,
    sortOrder,
    showNotification,
  ]);

  useEffect(() => {
    loadConsolidations();
  }, [loadConsolidations]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
    setPage(1);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ConsolidationListItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('confirmDeleteConsolidation') || 'Delete this consolidation trip?')) {
      return;
    }
    try {
      await cargoConsolidationsApi.delete(id);
      showNotification('Consolidation trip deleted successfully', 'success');
      if (selectedDetails?.id === id) setSelectedDetails(null);
      loadConsolidations();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete consolidation', 'error');
    }
  };

  const toggleRowExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setOriginFilter('');
    setDestinationFilter('');
    setDepartureStartDate('');
    setDepartureEndDate('');
    setSortBy('created_at');
    setSortOrder('DESC');
    setPage(1);
  };

  const hasActiveFilters =
    search ||
    statusFilter !== 'all' ||
    originFilter ||
    destinationFilter ||
    departureStartDate ||
    departureEndDate;

  // Aggregate stats across current data
  const stats = useMemo(() => {
    const meta = data?.meta;
    const items = data?.data || [];

    let totalVolCap = meta?.total_capacity_volume_m3 ?? 0;
    let totalAssignedVol = meta?.total_assigned_volume_m3 ?? 0;
    let totalNetMargin = 0;
    let netMarginCurrency = 'USD';

    if (meta?.consolidated_net_margin) {
      if (typeof meta.consolidated_net_margin === 'object') {
        if ('USD' in meta.consolidated_net_margin) {
          totalNetMargin = (meta.consolidated_net_margin as any).USD ?? 0;
          netMarginCurrency = 'USD';
        } else if ('amount' in meta.consolidated_net_margin) {
          totalNetMargin = (meta.consolidated_net_margin as any).amount ?? 0;
          netMarginCurrency = (meta.consolidated_net_margin as any).currency || 'USD';
        }
      } else if (typeof meta.consolidated_net_margin === 'number') {
        totalNetMargin = meta.consolidated_net_margin;
      }
    } else if (typeof meta?.total_net_margin_usd === 'number') {
      totalNetMargin = meta.total_net_margin_usd;
    }

    let totalCargosCount = 0;
    items.forEach((c) => {
      totalCargosCount += c.capacity?.total_cargos_count ?? c.cargos?.length ?? 0;
    });

    const volPct = totalVolCap > 0 ? Math.round((totalAssignedVol / totalVolCap) * 100) : 0;

    const multiCurrencies =
      meta?.consolidated_net_margin &&
      typeof meta.consolidated_net_margin === 'object' &&
      'USD' in meta.consolidated_net_margin
        ? (meta.consolidated_net_margin as { USD: number; UZS: number; RUB: number; RMB: number })
        : null;

    return {
      totalConsolidations: meta?.total ?? 0,
      activeCount: meta?.total_active ?? meta?.active_count ?? 0,
      totalCapacityM3: totalVolCap,
      totalAssignedM3: totalAssignedVol,
      volumeUtilPercent: volPct,
      totalNetMarginUsd: totalNetMargin,
      netMarginCurrency,
      multiCurrencies,
      totalAttachedCargos: totalCargosCount,
    };
  }, [data]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Arrived':
        return t('statusArrived') || status;
      case 'On the way':
        return t('statusOnTheWay') || status;
      case 'On the border':
        return t('statusOnTheBorder') || status;
      case 'Station':
        return t('statusStation') || status;
      case 'Reload':
        return t('statusReload') || status;
      case 'Waiting':
        return t('statusWaiting') || status;
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      {/* Top Banner Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-surface border border-border shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-royal text-brand-gold border border-brand-gold/30 shadow-md shrink-0">
            <Truck className="size-6 sm:size-7" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <span>{t('consolidationTitle')}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-gold/20 text-brand-navy dark:text-brand-gold font-mono font-bold border border-brand-gold/30">
                LTL Groupage
              </span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{t('consolidationSubtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={loadConsolidations}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border bg-surface hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canCreate('cargo_consolidations') && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-navy to-brand-royal text-white font-bold text-xs hover:opacity-95 shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="size-4 text-brand-gold" />
              <span>{t('newConsolidationBtn')}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Trips & Active */}
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground">Consolidations & Trips</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-foreground font-mono">
                {stats.totalConsolidations}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ({stats.activeCount} active)
              </span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-brand-navy/10 dark:bg-brand-gold/10 text-brand-navy dark:text-brand-gold border border-brand-navy/20 dark:border-brand-gold/20">
            <Truck className="size-5" />
          </div>
        </div>

        {/* Card 2: Fleet Volume Utilization */}
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Volume Capacity (m³)</span>
            <span className="text-xs font-mono font-extrabold text-foreground">
              {stats.totalAssignedM3} / {stats.totalCapacityM3} m³
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.volumeUtilPercent > 90
                  ? 'bg-red-500'
                  : stats.volumeUtilPercent > 70
                    ? 'bg-amber-500'
                    : 'bg-brand-royal'
              }`}
              style={{ width: `${Math.min(100, stats.volumeUtilPercent)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-bold">
            <span>Overall Fleet Fill</span>
            <span className="font-mono text-foreground font-extrabold">
              {stats.volumeUtilPercent}%
            </span>
          </div>
        </div>

        {/* Card 3: Consolidated Net Margin */}
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-bold text-muted-foreground block">
              Consolidated Net Margin
            </span>
            <div className="flex items-center gap-1.5 font-mono text-2xl font-extrabold text-foreground">
              {stats.totalNetMarginUsd >= 0 ? (
                <TrendingUp className="size-5 text-emerald-500 shrink-0" />
              ) : (
                <TrendingDown className="size-5 text-red-500 shrink-0" />
              )}
              <span
                className={
                  stats.totalNetMarginUsd >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }
              >
                {formatMoney(stats.totalNetMarginUsd, stats.netMarginCurrency)}
              </span>
            </div>
            {stats.multiCurrencies?.UZS !== undefined && stats.netMarginCurrency !== 'UZS' && (
              <span className="text-[11px] font-mono text-muted-foreground block">
                ≈ {formatMoney(stats.multiCurrencies.UZS, 'UZS')}
              </span>
            )}
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <DollarSign className="size-5" />
          </div>
        </div>

        {/* Card 4: Attached LTL Packages */}
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground">Attached Client Cargos</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-foreground font-mono">
                {stats.totalAttachedCargos}
              </span>
              <span className="text-xs text-muted-foreground">packages loaded</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Boxes className="size-5" />
          </div>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search truck plate, consolidation code, carrier, route..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-muted/30 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
            />
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-surface text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid className="size-4" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-surface text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Table View"
            >
              <TableIcon className="size-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-surface text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Kanban Board"
            >
              <Kanban className="size-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('analytics')}
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'analytics'
                  ? 'bg-surface text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Fleet Analytics"
            >
              <BarChart3 className="size-4" />
              <span className="hidden sm:inline">Analytics</span>
            </button>
          </div>
        </div>

        {/* Status Filter Horizontal Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer select-none ${
              statusFilter === 'all'
                ? 'bg-brand-navy dark:bg-brand-gold text-white dark:text-brand-navy border-transparent shadow-sm'
                : 'bg-surface text-muted-foreground hover:text-foreground border-border/70 hover:border-border'
            }`}
          >
            All Statuses
          </button>
          {CONSOLIDATION_STATUSES.map((st) => {
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer select-none ${
                  isSelected
                    ? 'bg-brand-navy dark:bg-brand-gold text-white dark:text-brand-navy border-transparent shadow-sm'
                    : 'bg-surface text-muted-foreground hover:text-foreground border-border/70 hover:border-border'
                }`}
              >
                {getStatusLabel(st)}
              </button>
            );
          })}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1 cursor-pointer shrink-0 ml-auto"
            >
              <X className="size-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area based on View Mode */}
      {loading ? (
        <div className="py-24 text-center p-8 rounded-3xl bg-surface border border-border flex flex-col items-center gap-3">
          <RefreshCw className="size-8 animate-spin text-brand-gold" />
          <span className="text-sm font-bold text-foreground">Loading consolidation trips...</span>
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="py-24 text-center p-8 rounded-3xl bg-surface border border-border flex flex-col items-center gap-3">
          <Truck className="size-12 opacity-30 text-muted-foreground" />
          <span className="text-base font-bold text-foreground">{t('noConsolidationsFound')}</span>
          <span className="text-xs text-muted-foreground max-w-md">
            {t('noConsolidationsDesc')}
          </span>
          {canCreate('cargo_consolidations') && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-2 px-4 py-2 rounded-xl bg-brand-gold/20 text-brand-navy dark:text-brand-gold font-bold text-xs hover:bg-brand-gold/30 transition-all cursor-pointer"
            >
              + Create New Consolidation Trip
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* 1. Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.data.map((c) => {
            const netMargin = getConsolidatedNetMargin(c.financials);
            const netMarginCurrency = getConsolidatedNetMarginCurrency(c.financials);
            const statusStyle = STATUS_BADGES[c.status] || STATUS_BADGES.Waiting;
            const isPositive = netMargin >= 0;

            return (
              <div
                key={c.id}
                onClick={() => setSelectedDetails(c)}
                className="group relative p-5 rounded-3xl bg-surface border border-border/80 hover:border-brand-gold/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
              >
                {/* Top Card Info */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-extrabold text-foreground group-hover:text-brand-gold transition-colors">
                        {c.container_truck_id}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-navy dark:text-brand-gold font-bold border border-brand-gold/30">
                        {c.consolidation_code}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                    >
                      {getStatusLabel(c.status)}
                    </span>
                  </div>

                  {/* Route Badge */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold mb-3">
                    <MapPin className="size-3.5 text-brand-royal shrink-0" />
                    <span className="text-foreground">{c.origin_place || 'Origin'}</span>
                    <ArrowRight className="size-3 text-brand-gold shrink-0" />
                    <span className="text-foreground">{c.destination_place || 'Destination'}</span>
                    {c.departure_date && (
                      <span className="text-[11px] text-muted-foreground ml-auto font-normal">
                        Dep: {c.departure_date}
                      </span>
                    )}
                  </div>

                  {/* Volume Utilization Bar */}
                  <div className="space-y-1.5 p-3 rounded-2xl bg-muted/20 border border-border/60">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-foreground">Capacity (m³)</span>
                      <span className="font-mono font-extrabold text-foreground">
                        {c.capacity.assigned_volume_m3} / {c.capacity.max_volume_m3} m³ (
                        {c.capacity.volume_utilization_percent}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          c.capacity.volume_utilization_percent > 90
                            ? 'bg-red-500'
                            : c.capacity.volume_utilization_percent > 70
                              ? 'bg-amber-500'
                              : 'bg-brand-royal'
                        }`}
                        style={{
                          width: `${Math.min(100, c.capacity.volume_utilization_percent)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                      <span>{c.capacity.remaining_volume_m3} m³ free</span>
                      <span>
                        {c.capacity.assigned_weight_kg.toLocaleString()} /{' '}
                        {c.capacity.max_weight_kg.toLocaleString()} kg
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Card Footer */}
                <div className="pt-2 border-t border-border/70 flex items-center justify-between gap-3 text-xs">
                  {/* Attached packages preview & quick pack */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Boxes className="size-4 text-brand-gold shrink-0" />
                      <span className="font-bold text-foreground font-mono">{c.cargos.length}</span>
                      <span className="text-[11px]">cargos</span>
                    </div>
                    {canAssignCargo() && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAssigningConsolidation(c);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-brand-gold/15 hover:bg-brand-gold/25 text-brand-navy dark:text-brand-gold text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Pack cargos into truck"
                      >
                        <Plus className="size-3" />
                        <span>Pack</span>
                      </button>
                    )}
                  </div>

                  {/* Net margin */}
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block">Net Margin</span>
                    <span
                      className={`font-mono text-xs font-extrabold flex items-center gap-1 ${
                        isPositive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatMoney(netMargin, netMarginCurrency)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'table' ? (
        /* 2. Comprehensive Table View */
        <div className="rounded-3xl bg-surface border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground font-bold">
                  <th className="py-3 px-4 w-10"></th>
                  <th
                    onClick={() => handleSort('container_truck_id')}
                    className="py-3 px-4 cursor-pointer hover:text-foreground"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Vehicle / Code</span>
                      <ArrowUpDown className="size-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Route (Origin → Dest)</th>
                  <th
                    onClick={() => handleSort('departure_date')}
                    className="py-3 px-4 cursor-pointer hover:text-foreground"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Departure</span>
                      <ArrowUpDown className="size-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Volume (m³)</th>
                  <th className="py-3 px-4">Weight (kg)</th>
                  <th
                    onClick={() => handleSort('total_carrier_cost')}
                    className="py-3 px-4 cursor-pointer hover:text-foreground"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Carrier Cost</span>
                      <ArrowUpDown className="size-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Net Margin</th>
                  <th
                    onClick={() => handleSort('status')}
                    className="py-3 px-4 cursor-pointer hover:text-foreground"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      <ArrowUpDown className="size-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.data.map((c) => {
                  const isExpanded = expandedRows.has(c.id);
                  const netMargin = getConsolidatedNetMargin(c.financials);
                  const netMarginCurrency = getConsolidatedNetMarginCurrency(c.financials);
                  const carrierCostUsd = getCarrierCostUsd(c.financials);
                  const carrierCostAmount = getCarrierCostAmount(c.financials);
                  const carrierCostCurrency = getCarrierCostCurrency(c.financials);
                  const statusStyle = STATUS_BADGES[c.status] || STATUS_BADGES.Waiting;
                  const isPositive = netMargin >= 0;

                  return (
                    <>
                      <tr
                        key={c.id}
                        className="hover:bg-muted/20 transition-colors h-14 cursor-pointer"
                        onClick={() => setSelectedDetails(c)}
                      >
                        <td
                          className="py-3 px-3 text-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowExpand(c.id);
                          }}
                        >
                          <button
                            type="button"
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-transform"
                          >
                            <ChevronDown
                              className={`size-4 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-foreground">
                              {c.container_truck_id}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-gold/15 text-brand-navy dark:text-brand-gold font-bold">
                              {c.consolidation_code}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-bold text-foreground">
                          {c.origin_place || '—'} → {c.destination_place || '—'}
                        </td>

                        <td className="py-3 px-4 font-mono text-muted-foreground">
                          {c.departure_date || '—'}
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-1 w-28">
                            <div className="flex justify-between text-[11px] font-mono font-bold">
                              <span>{c.capacity.assigned_volume_m3} m³</span>
                              <span className="text-muted-foreground">
                                {c.capacity.volume_utilization_percent}%
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-brand-royal rounded-full"
                                style={{
                                  width: `${Math.min(100, c.capacity.volume_utilization_percent)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-foreground">
                          {c.capacity.assigned_weight_kg.toLocaleString()} kg
                        </td>

                        <td className="py-3 px-4 font-mono text-foreground font-bold">
                          {formatMoney(carrierCostAmount || carrierCostUsd, carrierCostCurrency)}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold">
                          <span
                            className={
                              isPositive
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }
                          >
                            {formatMoney(netMargin, netMarginCurrency)}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                          >
                            {getStatusLabel(c.status)}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {canAssignCargo() && (
                              <button
                                type="button"
                                onClick={() => setAssigningConsolidation(c)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-brand-gold hover:bg-brand-gold/10 transition-colors"
                                title="Pack cargos"
                              >
                                <Plus className="size-4" />
                              </button>
                            )}
                            {canUpdate('cargo_consolidations') && (
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(c)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                title="Edit trip"
                              >
                                <Edit2 className="size-4" />
                              </button>
                            )}
                            {canDelete('cargo_consolidations') && (
                              <button
                                type="button"
                                onClick={() => handleDelete(c.id)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                title="Delete trip"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Nested Expanded Cargos Row */}
                      {isExpanded && (
                        <tr key={`${c.id}-nested`} className="bg-muted/15">
                          <td colSpan={10} className="p-4">
                            <div className="p-4 rounded-2xl bg-surface border border-border/80 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                  <Package className="size-4 text-brand-gold" />
                                  <span>Attached Client Packages ({c.cargos.length})</span>
                                </span>
                                {canAssignCargo() && (
                                  <button
                                    type="button"
                                    onClick={() => setAssigningConsolidation(c)}
                                    className="px-2.5 py-1 rounded-lg bg-brand-gold/20 text-brand-navy dark:text-brand-gold text-xs font-bold hover:bg-brand-gold/30 transition-all flex items-center gap-1"
                                  >
                                    <Plus className="size-3" />
                                    <span>Pack More</span>
                                  </button>
                                )}
                              </div>

                              {c.cargos.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">
                                  No client cargos packed in this truck yet.
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                  {c.cargos.map((cargo) => (
                                    <div
                                      key={cargo.id}
                                      className="p-2.5 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between"
                                    >
                                      <div className="min-w-0">
                                        <span className="font-bold text-foreground block truncate">
                                          {cargo.cargo}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground block truncate">
                                          {cargo.client?.name || 'Client'}
                                        </span>
                                      </div>
                                      <div className="text-right shrink-0 ml-2">
                                        <span className="font-mono font-bold text-foreground block">
                                          {cargo.volume || 0} m³
                                        </span>
                                        <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                                          +
                                          {formatMoney(
                                            cargo.sell_price?.amount ??
                                              cargo.sell_price?.amount_usd ??
                                              (typeof cargo.sell_price === 'number'
                                                ? cargo.sell_price
                                                : 0),
                                            cargo.sell_price?.currency || 'USD'
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        /* 3. Kanban Status Pipeline View */
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
          {CONSOLIDATION_STATUSES.map((st) => {
            const statusStyle = STATUS_BADGES[st] || STATUS_BADGES.Waiting;
            const columnItems = data.data.filter((c) => c.status === st);

            return (
              <div
                key={st}
                className="w-72 shrink-0 p-3.5 rounded-3xl bg-surface border border-border shadow-sm flex flex-col max-h-[75vh]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-extrabold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                    >
                      {getStatusLabel(st)}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-extrabold text-muted-foreground">
                    {columnItems.length}
                  </span>
                </div>

                {/* Cards in Column */}
                <div className="overflow-y-auto flex-1 space-y-2.5 pr-1">
                  {columnItems.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-2xl">
                      No trips in {getStatusLabel(st)}
                    </div>
                  ) : (
                    columnItems.map((c) => {
                      const colMargin = getConsolidatedNetMargin(c.financials);
                      const colCurrency = getConsolidatedNetMarginCurrency(c.financials);
                      return (
                        <div
                          key={c.id}
                          onClick={() => setSelectedDetails(c)}
                          className="p-3.5 rounded-2xl bg-muted/20 border border-border/80 hover:border-brand-gold/60 shadow-sm hover:shadow transition-all cursor-pointer space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-extrabold text-xs text-foreground">
                              {c.container_truck_id}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-gold/15 text-brand-navy dark:text-brand-gold font-bold">
                              {c.consolidation_code}
                            </span>
                          </div>

                          <div className="text-[11px] text-muted-foreground font-bold truncate">
                            {c.origin_place || 'Origin'} → {c.destination_place || 'Dest'}
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60 font-mono">
                            <span className="text-muted-foreground">
                              {c.capacity.assigned_volume_m3}/{c.capacity.max_volume_m3} m³
                            </span>
                            <span
                              className={`font-bold ${
                                colMargin >= 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {formatMoney(colMargin, colCurrency)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 4. Fleet Analytics View */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Volume vs Weight Utilization Breakdown */}
            <div className="p-5 rounded-3xl bg-surface border border-border shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Boxes className="size-4 text-brand-gold" />
                <span>Volume & Weight Capacity Density</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Compares overall cargo volume (m³) against vehicle structural weight payload (kg).
              </p>

              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Assigned Volume vs Fleet Capacity</span>
                    <span className="font-mono">
                      {stats.totalAssignedM3} / {stats.totalCapacityM3} m³ (
                      {stats.volumeUtilPercent}%)
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-brand-royal rounded-full transition-all"
                      style={{ width: `${Math.min(100, stats.volumeUtilPercent)}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-2">
                  <span className="text-xs font-bold text-foreground block">
                    Fleet Efficiency Tip
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Vehicles currently average <strong>{stats.volumeUtilPercent}%</strong> volume
                    fill. Combining high-density metal cargos with low-density textile loads
                    optimizes trip margins.
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Margin Overview */}
            <div className="p-5 rounded-3xl bg-surface border border-border shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <DollarSign className="size-4 text-emerald-500" />
                <span>Trip Financial Margins</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Aggregate commercial revenue from all client cargos vs total carrier truck freight.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/60">
                  <span className="text-[11px] text-muted-foreground block font-bold">
                    Active Net Margin
                  </span>
                  <span
                    className={`text-xl font-extrabold font-mono ${
                      stats.totalNetMarginUsd >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatMoney(stats.totalNetMarginUsd, stats.netMarginCurrency)}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/60">
                  <span className="text-[11px] text-muted-foreground block font-bold">
                    Loaded LTL Cargos
                  </span>
                  <span className="text-xl font-extrabold font-mono text-foreground">
                    {stats.totalAttachedCargos} packages
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consolidation Create & Edit Modal */}
      <ConsolidationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          loadConsolidations();
        }}
        editingItem={editingItem}
      />

      {/* Consolidation Deep-Dive Drawer */}
      <ConsolidationDetailsDrawer
        isOpen={!!selectedDetails}
        onClose={() => setSelectedDetails(null)}
        consolidation={selectedDetails}
        onEdit={(item) => {
          setSelectedDetails(null);
          handleOpenEdit(item);
        }}
        onDelete={handleDelete}
        onAssignCargos={(item) => {
          setAssigningConsolidation(item);
        }}
        onUpdate={(updated) => {
          setSelectedDetails(updated);
          loadConsolidations();
        }}
      />

      {/* Assign Cargos Modal */}
      <AssignCargosModal
        isOpen={!!assigningConsolidation}
        onClose={() => setAssigningConsolidation(null)}
        consolidation={assigningConsolidation}
        onSuccess={(updated) => {
          if (updated?.id && selectedDetails?.id === updated.id) {
            setSelectedDetails(updated);
          }
          loadConsolidations();
        }}
      />
    </div>
  );
}
