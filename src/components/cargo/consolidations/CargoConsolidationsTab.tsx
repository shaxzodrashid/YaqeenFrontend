import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Truck,
  Plus,
  Search,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  Kanban,
  BarChart3,
  TrendingUp,
  Package,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from '../../../context/LanguageContext';
import { T } from '../../T';
import { useNotification } from '../../../context/NotificationContext';
import { cargoConsolidationsApi, CONSOLIDATION_STATUSES } from '../../../services/api';
import type {
  CargoConsolidation,
  ConsolidationStatus,
  ConsolidationPaginatedResponse,
} from '../../../services/api';
import { formatMoney } from '../../../types/currency';

// Sub-components
import { ConsolidationCard } from './ConsolidationCard';
import { ConsolidationTable } from './ConsolidationTable';
import { ConsolidationKanban } from './ConsolidationKanban';
import { ConsolidationAnalytics } from './ConsolidationAnalytics';
import { ConsolidationFormModal } from './ConsolidationFormModal';
import { ConsolidationCargoManifestModal } from './ConsolidationCargoManifestModal';
import { ConsolidationDetailModal } from './ConsolidationDetailModal';
import { ConsolidationQuickStatusModal } from './ConsolidationQuickStatusModal';

export type ConsolidationViewMode = 'grid' | 'table' | 'kanban' | 'analytics';

export function CargoConsolidationsTab() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  // State management
  const [data, setData] = useState<ConsolidationPaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ConsolidationViewMode>('grid');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [routeFilter, setRouteFilter] = useState<string>('all');
  const [utilizationFilter, setUtilizationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [page, setPage] = useState(1);
  const limit = viewMode === 'table' ? 15 : 12;

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingConsolidation, setEditingConsolidation] = useState<CargoConsolidation | null>(null);

  const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);
  const [manifestConsolidation, setManifestConsolidation] = useState<CargoConsolidation | null>(
    null
  );

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailConsolidation, setDetailConsolidation] = useState<CargoConsolidation | null>(null);

  const [isQuickStatusModalOpen, setIsQuickStatusModalOpen] = useState(false);
  const [statusConsolidation, setStatusConsolidation] = useState<CargoConsolidation | null>(null);

  // Load consolidations from backend / demo store
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams: any = {
        page,
        limit,
        search: searchQuery.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (routeFilter !== 'all') {
        queryParams.origin_place = routeFilter;
      }

      const res = await cargoConsolidationsApi.getAll(queryParams);
      setData(res);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to load consolidations', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, statusFilter, routeFilter, sortBy, sortOrder, showNotification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply client-side utilization filter if selected
  const displayItems = useMemo(() => {
    if (!data?.data) return [];
    let items = [...data.data];

    if (utilizationFilter === 'low') {
      items = items.filter((c) => (c.capacity?.volume_utilization_percent || 0) < 50);
    } else if (utilizationFilter === 'optimal') {
      items = items.filter(
        (c) =>
          (c.capacity?.volume_utilization_percent || 0) >= 50 &&
          (c.capacity?.volume_utilization_percent || 0) <= 90
      );
    } else if (utilizationFilter === 'maxed') {
      items = items.filter((c) => (c.capacity?.volume_utilization_percent || 0) > 90);
    }

    return items;
  }, [data?.data, utilizationFilter]);

  // Handlers for modal actions
  const handleOpenCreate = () => {
    setEditingConsolidation(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: CargoConsolidation) => {
    setEditingConsolidation(item);
    setIsFormModalOpen(true);
  };

  const handleOpenManifest = (item: CargoConsolidation) => {
    setManifestConsolidation(item);
    setIsManifestModalOpen(true);
  };

  const handleOpenDetail = (item: CargoConsolidation) => {
    setDetailConsolidation(item);
    setIsDetailModalOpen(true);
  };

  const handleOpenQuickStatus = (item: CargoConsolidation) => {
    setStatusConsolidation(item);
    setIsQuickStatusModalOpen(true);
  };

  const handleQuickMoveStatus = async (
    item: CargoConsolidation,
    nextStatus: ConsolidationStatus
  ) => {
    try {
      await cargoConsolidationsApi.update(item.id, {
        status: nextStatus,
        sync_status_to_cargos: true,
      });
      showNotification(
        `Consolidation ${item.container_truck_id} moved to ${nextStatus}`,
        'success'
      );
      loadData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update status', 'error');
    }
  };

  const handleDelete = async (item: CargoConsolidation) => {
    if (window.confirm(t('cnsDeleteConfirm') || 'Delete this consolidation trip?')) {
      try {
        await cargoConsolidationsApi.delete(item.id);
        showNotification(`Consolidation ${item.container_truck_id} deleted`, 'success');
        loadData();
      } catch (err: any) {
        showNotification(err?.message || 'Failed to delete consolidation', 'error');
      }
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
  };

  const meta = data?.meta || {
    total: 0,
    limit: 12,
    offset: 0,
    total_margin_usd: 0,
    total_volume_m3: 0,
    total_weight_kg: 0,
    active_trucks: 0,
    avg_volume_utilization: 0,
  };

  const totalPages = Math.ceil((meta.total || 0) / limit) || 1;

  return (
    <div className="space-y-6">
      {/* 1. Executive Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Trips Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              <T k="cnsActiveTrips" />
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Truck className="size-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight font-mono">
            {meta.active_trucks}{' '}
            <span className="text-xs font-normal text-muted-foreground">trips</span>
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {meta.total} total recorded groupage trips
          </p>
        </motion.div>

        {/* Volume Utilization Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              <T k="cnsVolumeCapacity" />
            </span>
            <div className="p-2 rounded-xl bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
              <Layers className="size-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight font-mono">
            {meta.total_volume_m3}{' '}
            <span className="text-xs font-normal text-muted-foreground">m³</span>
          </h3>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-semibold">
            <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-gold rounded-full"
                style={{ width: `${Math.min(100, meta.avg_volume_utilization)}%` }}
              />
            </div>
            <span>{meta.avg_volume_utilization}% fill</span>
          </div>
        </motion.div>

        {/* Weight Capacity Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              <T k="cnsWeightCapacity" />
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <Package className="size-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight font-mono">
            {(meta.total_weight_kg / 1000).toFixed(1)}{' '}
            <span className="text-xs font-normal text-muted-foreground">tons</span>
          </h3>
          <p className="text-[11px] text-muted-foreground font-mono">
            {meta.total_weight_kg.toLocaleString()} kg consolidated
          </p>
        </motion.div>

        {/* Consolidated Net Margin Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              <T k="cnsNetMargin" />
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <h3
            className={`text-xl sm:text-2xl font-black tracking-tight font-mono ${
              meta.total_margin_usd >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {meta.total_margin_usd >= 0 ? '+' : ''}
            {formatMoney(meta.total_margin_usd, 'USD')}
          </h3>
          <p className="text-[11px] text-muted-foreground">Net spread over carrier freight costs</p>
        </motion.div>
      </div>

      {/* 2. Control Toolbar: Search, Filters, View Modes & New Trip Button */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-border shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder={
                t('cnsSearchPlaceholder') || 'Search truck plate, code, carrier, route...'
              }
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all"
            />
            <Search className="size-4 text-muted-foreground absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 p-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Right Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between lg:justify-end">
            {/* View Switcher Tabs */}
            <div className="p-1 rounded-xl bg-muted/50 border border-border flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-surface text-brand-gold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={t('cnsViewGrid') || 'Cards View'}
              >
                <LayoutGrid className="size-3.5" />
                <span className="hidden sm:inline">
                  <T k="cnsViewGrid" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-surface text-brand-gold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={t('cnsViewTable') || 'Table View'}
              >
                <TableIcon className="size-3.5" />
                <span className="hidden sm:inline">
                  <T k="cnsViewTable" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-surface text-brand-gold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={t('cnsViewKanban') || 'Kanban Board'}
              >
                <Kanban className="size-3.5" />
                <span className="hidden sm:inline">
                  <T k="cnsViewKanban" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('analytics')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'analytics'
                    ? 'bg-surface text-brand-gold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={t('cnsViewAnalytics') || 'Route Analytics'}
              >
                <BarChart3 className="size-3.5" />
                <span className="hidden sm:inline">
                  <T k="cnsViewAnalytics" />
                </span>
              </button>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`size-4 ${loading ? 'animate-spin text-brand-gold' : ''}`} />
            </button>

            {/* Primary Action Button: New Consolidation Trip */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-gold to-amber-500 hover:from-brand-gold/90 hover:to-amber-500/90 text-brand-navy font-bold text-xs shadow-md shadow-brand-gold/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="size-4" />
              <span>
                <T k="cnsBtnNew" />
              </span>
            </button>
          </div>
        </div>

        {/* Filter Badges & Dropdowns Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
          {/* Status Filter Badges Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setPage(1);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-brand-gold text-brand-navy shadow-2xs font-extrabold'
                  : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60'
              }`}
            >
              All Trips ({meta.total})
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
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-brand-gold text-brand-navy shadow-2xs font-extrabold'
                      : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>

          {/* Quick Route & Utilization Selectors */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <select
              value={routeFilter}
              onChange={(e) => {
                setRouteFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-gold"
            >
              <option value="all">All Corridors</option>
              <option value="Istanbul">Turkey (Istanbul)</option>
              <option value="Guangzhou">China (Guangzhou)</option>
              <option value="Yiwu">China (Yiwu)</option>
              <option value="Dubai">UAE (Dubai)</option>
            </select>

            <select
              value={utilizationFilter}
              onChange={(e) => {
                setUtilizationFilter(e.target.value);
              }}
              className="px-2.5 py-1 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-gold"
            >
              <option value="all">All Fill Levels</option>
              <option value="low">Underfilled (&lt;50%)</option>
              <option value="optimal">Optimal (50-90%)</option>
              <option value="maxed">Full (&gt;90%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Main Views Container */}
      <AnimatePresence mode="wait">
        {loading && !data ? (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="size-8 animate-spin text-brand-gold mx-auto" />
            <p className="text-xs text-muted-foreground font-semibold">Loading consolidations...</p>
          </div>
        ) : displayItems.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-surface border border-border space-y-3">
            <div className="p-3 rounded-2xl bg-muted inline-block text-muted-foreground">
              <Truck className="size-8 opacity-60" />
            </div>
            <h3 className="text-base font-bold text-foreground">No Consolidations Found</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              No consolidation trips matched your current search or status filters.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-brand-gold text-brand-navy font-bold text-xs shadow-xs hover:bg-brand-gold/90 transition-colors cursor-pointer"
            >
              + Create First Consolidation Trip
            </button>
          </div>
        ) : (
          <div>
            {/* View 1: Card Grid */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {displayItems.map((item) => (
                  <ConsolidationCard
                    key={item.id}
                    consolidation={item}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                    onManageCargos={handleOpenManifest}
                    onViewDetail={handleOpenDetail}
                    onQuickStatus={handleOpenQuickStatus}
                  />
                ))}
              </div>
            )}

            {/* View 2: Table Ledger */}
            {viewMode === 'table' && (
              <ConsolidationTable
                consolidations={displayItems}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                onManageCargos={handleOpenManifest}
                onViewDetail={handleOpenDetail}
                onQuickStatus={handleOpenQuickStatus}
              />
            )}

            {/* View 3: Kanban Board */}
            {viewMode === 'kanban' && (
              <ConsolidationKanban
                consolidations={displayItems}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                onManageCargos={handleOpenManifest}
                onViewDetail={handleOpenDetail}
                onQuickStatus={handleOpenQuickStatus}
                onMoveStatus={handleQuickMoveStatus}
              />
            )}

            {/* View 4: Analytics */}
            {viewMode === 'analytics' && (
              <ConsolidationAnalytics consolidations={data?.data || []} />
            )}

            {/* Pagination for Grid and Table views */}
            {(viewMode === 'grid' || viewMode === 'table') && totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 text-xs">
                <span className="text-muted-foreground">
                  Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> (
                  {meta.total} trips)
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-2 rounded-xl border border-border bg-surface hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="size-4" />
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pNum = i + 1;
                    return (
                      <button
                        key={pNum}
                        type="button"
                        onClick={() => setPage(pNum)}
                        className={`w-8 h-8 rounded-xl font-bold transition-colors cursor-pointer ${
                          page === pNum
                            ? 'bg-brand-gold text-brand-navy shadow-xs font-black'
                            : 'bg-surface hover:bg-muted text-muted-foreground hover:text-foreground border border-border'
                        }`}
                      >
                        {pNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-2 rounded-xl border border-border bg-surface hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <ConsolidationFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={() => {
          showNotification(
            editingConsolidation
              ? 'Consolidation updated successfully'
              : 'Consolidation created successfully',
            'success'
          );
          loadData();
        }}
        consolidationToEdit={editingConsolidation}
      />

      <ConsolidationCargoManifestModal
        isOpen={isManifestModalOpen}
        onClose={() => setIsManifestModalOpen(false)}
        consolidation={manifestConsolidation}
        onUpdated={() => {
          loadData();
        }}
      />

      <ConsolidationDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        consolidation={detailConsolidation}
        onEdit={handleOpenEdit}
        onManageCargos={handleOpenManifest}
      />

      <ConsolidationQuickStatusModal
        isOpen={isQuickStatusModalOpen}
        onClose={() => setIsQuickStatusModalOpen(false)}
        consolidation={statusConsolidation}
        onSuccess={() => {
          showNotification('Trip status updated successfully', 'success');
          loadData();
        }}
      />
    </div>
  );
}
