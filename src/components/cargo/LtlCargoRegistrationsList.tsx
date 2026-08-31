import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Layers,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Copy,
  ArrowUpDown,
  TrendingUp,
  Check,
  X,
  ExternalLink,
  Unlink,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { usePermissions } from '../../context/PermissionsContext';
import { cargoRegistrationsApi } from '../../services/cargoRegistrations.service';
import type {
  CargoRegistrationListItem,
  CargoRegistrationPaginatedResponse,
} from '../../services/cargoRegistrations.service';
import { cargoConsolidationsApi } from '../../services/cargoConsolidations.service';
import type { ConsolidationActiveDropdownItem } from '../../services/cargoConsolidations.service';
import { formatMoney } from '../../services/api';
import { DeletionApprovalModal } from '../ui/DeletionApprovalModal';

const STATUS_CONFIG: {
  key: string;
  bg: string;
  text: string;
  border: string;
}[] = [
  {
    key: 'Waiting',
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-500/30',
  },
  {
    key: 'Station',
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/30',
  },
  {
    key: 'On the way',
    bg: 'bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
  },
  {
    key: 'On the border',
    bg: 'bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
  },
  {
    key: 'Reload',
    bg: 'bg-purple-500/15',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/30',
  },
  {
    key: 'Arrived',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
  },
];

export interface LtlCargoRegistrationsListProps {
  onRegisterNewLtl: () => void;
  onEditLtl: (cargo: CargoRegistrationListItem) => void;
  onDuplicateLtl: (cargo: CargoRegistrationListItem) => void;
  onOpenConsolidationDetails?: (consolidationId: string) => void;
  refreshSignal?: number;
}

export function LtlCargoRegistrationsList({
  onRegisterNewLtl,
  onEditLtl,
  onDuplicateLtl,
  onOpenConsolidationDetails,
  refreshSignal = 0,
}: LtlCargoRegistrationsListProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canCreate, canUpdate, canDelete, canAssignCargo } = usePermissions();

  // Query State
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'assigned' | 'unassigned'>(
    'all'
  );
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const [data, setData] = useState<CargoRegistrationPaginatedResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Quick Pack modal state
  const [packingCargo, setPackingCargo] = useState<CargoRegistrationListItem | null>(null);
  const [activeTrips, setActiveTrips] = useState<ConsolidationActiveDropdownItem[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [loadingTrips, setLoadingTrips] = useState<boolean>(false);
  const [submittingPack, setSubmittingPack] = useState<boolean>(false);

  // Detach modal state
  const [detachingCargo, setDetachingCargo] = useState<CargoRegistrationListItem | null>(null);
  const [submittingDetach, setSubmittingDetach] = useState<boolean>(false);

  // Delete modal state
  const [deletingCargo, setDeletingCargo] = useState<CargoRegistrationListItem | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState<boolean>(false);

  const loadLtlCargos = useCallback(async () => {
    setLoading(true);
    try {
      const hasConsolidation =
        assignmentFilter === 'assigned'
          ? true
          : assignmentFilter === 'unassigned'
            ? false
            : undefined;

      const res = await cargoRegistrationsApi.list({
        cargo_type: 'LTL',
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        has_consolidation: hasConsolidation,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setData(res);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to load LTL cargo registrations', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, assignmentFilter, sortBy, sortOrder, showNotification]);

  useEffect(() => {
    loadLtlCargos();
  }, [loadLtlCargos, refreshSignal]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
    setPage(1);
  };

  // Open Quick Pack Modal
  const handleOpenPack = async (cargo: CargoRegistrationListItem) => {
    setPackingCargo(cargo);
    setSelectedTripId('');
    setLoadingTrips(true);
    try {
      const trips = await cargoConsolidationsApi.getActive();
      setActiveTrips(trips || []);
      if (trips && trips.length > 0) {
        setSelectedTripId(trips[0].id);
      }
    } catch (err: any) {
      showNotification(err?.message || 'Failed to load active consolidation trips', 'error');
    } finally {
      setLoadingTrips(false);
    }
  };

  const handleConfirmPack = async () => {
    if (!packingCargo || !selectedTripId) return;
    if (!canAssignCargo()) {
      showNotification('Permission denied: cannot assign cargos to trips', 'error');
      return;
    }

    setSubmittingPack(true);
    try {
      await cargoConsolidationsApi.assignCargos(selectedTripId, [packingCargo.id]);
      showNotification(
        t('packSuccess') || 'Cargo packed into consolidation truck successfully',
        'success'
      );
      setPackingCargo(null);
      loadLtlCargos();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to assign cargo to consolidation trip', 'error');
    } finally {
      setSubmittingPack(false);
    }
  };

  // Detach Cargo
  const handleConfirmDetach = async () => {
    if (!detachingCargo) return;
    if (!canAssignCargo()) {
      showNotification('Permission denied: cannot remove cargos from trips', 'error');
      return;
    }

    setSubmittingDetach(true);
    try {
      const targetConsolidationId =
        detachingCargo.consolidation_id || (detachingCargo.consolidation as any)?.id;

      if (targetConsolidationId) {
        await cargoConsolidationsApi.removeCargos(targetConsolidationId, [detachingCargo.id]);
      } else {
        await cargoRegistrationsApi.update(detachingCargo.id, {
          consolidation_id: null,
        });
      }

      showNotification(
        t('detachSuccess') || 'Cargo detached from consolidation truck successfully',
        'success'
      );
      setDetachingCargo(null);
      loadLtlCargos();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to detach cargo from trip', 'error');
    } finally {
      setSubmittingDetach(false);
    }
  };

  // Delete Cargo
  const handleConfirmDelete = async () => {
    if (!deletingCargo) return;
    if (!canDelete('cargo_registrations')) {
      showNotification('Permission denied: cannot delete cargo registrations', 'error');
      return;
    }

    setSubmittingDelete(true);
    try {
      await cargoRegistrationsApi.delete(deletingCargo.id);
      showNotification(
        t('deleteLtlSuccess') || 'LTL cargo registration deleted successfully',
        'success'
      );
      setDeletingCargo(null);
      loadLtlCargos();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete cargo registration', 'error');
    } finally {
      setSubmittingDelete(false);
    }
  };

  // Metrics Calculation
  const metrics = useMemo(() => {
    const items = data?.data || [];
    let totalVol = 0;
    let totalWt = 0;
    let assignedVol = 0;
    let unassignedVol = 0;
    let assignedCount = 0;
    let unassignedCount = 0;
    let totalSellUsd = 0;
    let totalNetYieldUsd = 0;

    items.forEach((c) => {
      const v = Number(c.volume) || 0;
      const w = Number(c.weight) || 0;
      totalVol += v;
      totalWt += w;

      const isAssigned = Boolean(c.consolidation_id || c.container_truck_id);
      if (isAssigned) {
        assignedVol += v;
        assignedCount++;
      } else {
        unassignedVol += v;
        unassignedCount++;
      }

      totalSellUsd += Number(c.sell_price?.amount_usd ?? c.sell_price?.amount ?? 0);
      totalNetYieldUsd += Number(c.net_yield?.amount_usd ?? c.net_yield?.amount ?? 0);
    });

    const totalCount = data?.meta?.total ?? items.length;

    return {
      totalCount,
      totalVol: Math.round(totalVol * 100) / 100,
      totalWt: Math.round(totalWt * 100) / 100,
      assignedCount,
      unassignedCount,
      assignedVol: Math.round(assignedVol * 100) / 100,
      unassignedVol: Math.round(unassignedVol * 100) / 100,
      totalSellUsd: Math.round(totalSellUsd * 100) / 100,
      totalNetYieldUsd: Math.round(totalNetYieldUsd * 100) / 100,
    };
  }, [data]);

  const totalPages = Math.ceil((data?.meta?.total || 0) / limit) || 1;

  const getStatusBadge = (st: string) => {
    const found = STATUS_CONFIG.find((s) => s.key.toLowerCase() === (st || '').toLowerCase());
    if (!found) {
      return (
        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
          {st || '—'}
        </span>
      );
    }
    return (
      <span
        className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${found.bg} ${found.text} ${found.border}`}
      >
        {st}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* 3 KPI Cards for LTL Cargos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total LTL Cargos */}
        <div className="p-4 sm:p-5 rounded-3xl bg-surface border border-border/80 shadow-xs flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t('tabLtlCargoRegistrations') || 'LTL Cargo Registrations'}
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Boxes className="size-4 sm:size-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
                {metrics.totalCount}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                Groupage
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="size-3.5" />
                {metrics.assignedCount} in trucks
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                <AlertTriangle className="size-3.5" />
                {metrics.unassignedCount} ready to pack
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Volume & Weight */}
        <div className="p-4 sm:p-5 rounded-3xl bg-surface border border-border/80 shadow-xs flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t('volumeCapacity') || 'Total Volume & Weight'}
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Layers className="size-4 sm:size-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
                {metrics.totalVol} m³
              </span>
              <span className="text-sm font-bold text-muted-foreground font-mono">
                / {metrics.totalWt.toLocaleString()} kg
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>Packed: {metrics.assignedVol} m³</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                Free: {metrics.unassignedVol} m³
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Gross Turnover & Net Yield */}
        <div className="p-4 sm:p-5 rounded-3xl bg-surface border border-border/80 shadow-xs flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t('netMargin') || 'Gross Turnover & Net Yield'}
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="size-4 sm:size-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                +{formatMoney(metrics.totalNetYieldUsd, 'USD')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>Gross Sales: {formatMoney(metrics.totalSellUsd, 'USD')}</span>
              <span className="font-medium text-foreground">
                Margin:{' '}
                {metrics.totalSellUsd > 0
                  ? Math.round((metrics.totalNetYieldUsd / metrics.totalSellUsd) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-surface border border-border shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by cargo, load code, client, manager, truck plate..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-muted/40 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        {/* Assignment & Status Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Assignment Segmented Control */}
          <div className="flex p-0.5 rounded-xl bg-muted/50 border border-border text-xs">
            <button
              type="button"
              onClick={() => {
                setAssignmentFilter('all');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                assignmentFilter === 'all'
                  ? 'bg-surface text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('filterAllLtl') || 'All LTL'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAssignmentFilter('assigned');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                assignmentFilter === 'assigned'
                  ? 'bg-surface text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('filterAssignedLtl') || 'Assigned'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAssignmentFilter('unassigned');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                assignmentFilter === 'unassigned'
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{t('filterUnassignedLtl') || 'Unassigned (Free)'}</span>
            </button>
          </div>

          {/* Status Dropdown/Selector */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-surface border border-border text-xs font-bold text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            {STATUS_CONFIG.map((s) => (
              <option key={s.key} value={s.key}>
                {s.key}
              </option>
            ))}
          </select>

          {/* Refresh */}
          <button
            type="button"
            onClick={loadLtlCargos}
            disabled={loading}
            className="p-2 rounded-xl border border-border bg-surface hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all cursor-pointer shrink-0"
            title="Refresh LTL list"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Register LTL Cargo button */}
          {canCreate('cargo_registrations') && (
            <button
              type="button"
              onClick={onRegisterNewLtl}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="size-4" />
              <span>{t('btnRegisterLtlCargo') || '+ Register LTL Cargo'}</span>
            </button>
          )}
        </div>
      </div>

      {/* LTL Cargos Table */}
      <div className="rounded-3xl bg-surface border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                <th
                  onClick={() => handleSort('cargo')}
                  className="p-3.5 pl-5 cursor-pointer hover:text-foreground select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Cargo & Load Code</span>
                    <ArrowUpDown className="size-3" />
                  </div>
                </th>
                <th className="p-3.5">
                  <span>{t('colConsolidationTruck') || 'Consolidation Truck'}</span>
                </th>
                <th
                  onClick={() => handleSort('client_name')}
                  className="p-3.5 cursor-pointer hover:text-foreground select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t('clientLabel') || 'Client'}</span>
                    <ArrowUpDown className="size-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('employee_name')}
                  className="p-3.5 cursor-pointer hover:text-foreground select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t('assignedEmployeeLabel') || 'Sales Manager'}</span>
                    <ArrowUpDown className="size-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('volume')}
                  className="p-3.5 cursor-pointer hover:text-foreground select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Volume / Weight</span>
                    <ArrowUpDown className="size-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('purchase_price')}
                  className="p-3.5 cursor-pointer hover:text-foreground select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Buy Price</span>
                    <ArrowUpDown className="size-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('sell_price')}
                  className="p-3.5 cursor-pointer hover:text-foreground select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Sell Price</span>
                    <ArrowUpDown className="size-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('net_yield')}
                  className="p-3.5 cursor-pointer hover:text-foreground select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Net Margin</span>
                    <ArrowUpDown className="size-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="p-3.5 cursor-pointer hover:text-foreground select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    <ArrowUpDown className="size-3" />
                  </div>
                </th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="size-6 animate-spin text-amber-500" />
                      <span className="font-bold text-xs">Loading LTL cargo records...</span>
                    </div>
                  </td>
                </tr>
              ) : !data?.data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="size-8 opacity-40" />
                      <span className="font-bold text-sm text-foreground">No LTL Cargos Found</span>
                      <span className="text-xs">
                        Try adjusting search query, assignment filter, or register a new LTL cargo
                        package.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                data.data.map((c) => {
                  const isAssigned = Boolean(c.consolidation_id || c.container_truck_id);
                  const isTurnkey = Boolean((c as any).is_turnkey);
                  const loadCode = (c as any).load_code;

                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors group">
                      {/* Cargo & Load Code */}
                      <td className="p-3.5 pl-5">
                        <div className="flex flex-col gap-1 min-w-[140px] max-w-[200px]">
                          <span className="font-bold text-foreground truncate" title={c.cargo}>
                            {c.cargo}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {loadCode && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                {loadCode}
                              </span>
                            )}
                            {isTurnkey && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                                Turnkey
                              </span>
                            )}
                            {c.agent_name && (
                              <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                                {c.agent_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Consolidation Truck */}
                      <td className="p-3.5">
                        {isAssigned ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const consId = c.consolidation_id || (c.consolidation as any)?.id;
                                if (consId && onOpenConsolidationDetails) {
                                  onOpenConsolidationDetails(consId);
                                }
                              }}
                              className="px-2.5 py-1 rounded-xl bg-brand-navy/10 dark:bg-brand-gold/10 border border-brand-navy/20 dark:border-brand-gold/30 hover:border-brand-gold text-foreground font-mono font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
                              title="Click to view consolidation trip"
                            >
                              <Truck className="size-3 text-brand-gold shrink-0" />
                              <span className="truncate max-w-[110px]">{c.container_truck_id}</span>
                              {c.consolidation_id && <ExternalLink className="size-3 opacity-60" />}
                            </button>

                            {canAssignCargo() && (
                              <button
                                type="button"
                                onClick={() => setDetachingCargo(c)}
                                className="p-1 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title={t('btnDetachFromTruck') || 'Detach from truck'}
                              >
                                <Unlink className="size-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10px] border border-amber-500/30">
                              {t('unassignedBadge') || 'Unassigned'}
                            </span>
                            {canAssignCargo() && (
                              <button
                                type="button"
                                onClick={() => handleOpenPack(c)}
                                className="px-2 py-0.5 rounded-lg bg-brand-navy text-white hover:bg-brand-royal text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                              >
                                <Plus className="size-3" />
                                <span>{t('quickPack') || 'Pack'}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Client */}
                      <td className="p-3.5">
                        <div className="min-w-[110px] max-w-[150px]">
                          <span className="font-semibold text-foreground truncate block">
                            {c.client?.name || (c as any).client_name || c.client_full_name || '—'}
                          </span>
                          {c.client?.company_name && (
                            <span className="text-[10px] text-muted-foreground truncate block">
                              {c.client.company_name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Sales Manager */}
                      <td className="p-3.5">
                        <span className="font-medium text-foreground truncate block max-w-[120px]">
                          {c.employee?.name ||
                            (c as any).employee_name ||
                            c.employee_full_name ||
                            '—'}
                        </span>
                      </td>

                      {/* Volume / Weight */}
                      <td className="p-3.5">
                        <div className="font-mono text-xs">
                          <span className="font-bold text-foreground">
                            {c.volume ? `${c.volume} m³` : '—'}
                          </span>
                          <span className="text-muted-foreground block text-[11px]">
                            {c.weight ? `${c.weight.toLocaleString()} kg` : '—'}
                          </span>
                        </div>
                      </td>

                      {/* Buy Price */}
                      <td className="p-3.5 font-mono text-[11px] text-muted-foreground">
                        {formatMoney(
                          c.purchase_price?.amount ?? 0,
                          c.purchase_price?.currency || 'USD'
                        )}
                      </td>

                      {/* Sell Price */}
                      <td className="p-3.5 font-mono text-[11px] font-semibold text-foreground">
                        {formatMoney(c.sell_price?.amount ?? 0, c.sell_price?.currency || 'USD')}
                      </td>

                      {/* Net Margin */}
                      <td className="p-3.5 font-mono text-xs font-extrabold">
                        {(() => {
                          const val = c.net_yield?.amount_usd ?? c.net_yield?.amount ?? 0;
                          return (
                            <span
                              className={
                                val >= 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-500'
                              }
                            >
                              +{formatMoney(val, 'USD')}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">{getStatusBadge(c.status)}</td>

                      {/* Actions */}
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canUpdate('cargo_registrations') && (
                            <button
                              type="button"
                              onClick={() => onEditLtl(c)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                              title="Edit LTL Cargo"
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                          )}
                          {canCreate('cargo_registrations') && (
                            <button
                              type="button"
                              onClick={() => onDuplicateLtl(c)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-brand-gold hover:bg-brand-gold/10 transition-colors cursor-pointer"
                              title="Duplicate LTL Cargo"
                            >
                              <Copy className="size-3.5" />
                            </button>
                          )}
                          {canDelete('cargo_registrations') && (
                            <button
                              type="button"
                              onClick={() => setDeletingCargo(c)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete LTL Cargo"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/10 text-xs">
            <span className="text-muted-foreground">
              Page <span className="font-bold text-foreground">{page}</span> of{' '}
              <span className="font-bold text-foreground">{totalPages}</span> (
              {data?.meta?.total || 0} items)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-border bg-surface hover:bg-muted disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-border bg-surface hover:bg-muted disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Pack Modal */}
      {packingCargo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-surface border border-border shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-brand-gold/15 text-brand-gold">
                  <Truck className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {t('packModalTitle') || 'Pack Cargo into Consolidation Truck'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t('packModalSubtitle') ||
                      'Select an active consolidation truck trip to assign this LTL cargo to'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPackingCargo(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Cargo Preview */}
            <div className="p-3 rounded-2xl bg-muted/40 border border-border space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">{packingCargo.cargo}</span>
                <span className="font-mono font-bold text-brand-gold">
                  {packingCargo.volume} m³ / {packingCargo.weight} kg
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-3">
                <span>Client: {packingCargo.client?.name || packingCargo.client_full_name}</span>
                <span>
                  Sell:{' '}
                  {formatMoney(
                    packingCargo.sell_price?.amount ?? 0,
                    packingCargo.sell_price?.currency || 'USD'
                  )}
                </span>
              </div>
            </div>

            {/* Consolidation Trip Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-foreground">
                Select Active Consolidation Truck:
              </label>
              {loadingTrips ? (
                <div className="p-6 text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="size-4 animate-spin text-amber-500" />
                  <span>Loading active consolidation trips...</span>
                </div>
              ) : activeTrips.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
                  No active consolidation trips currently available. Please create a new
                  consolidation trip first.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {activeTrips.map((trip) => {
                    const isSelected = selectedTripId === trip.id;
                    return (
                      <div
                        key={trip.id}
                        onClick={() => setSelectedTripId(trip.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500/50 shadow-xs'
                            : 'bg-surface hover:bg-muted/40 border-border'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`size-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-amber-500 border-amber-500 text-white'
                                : 'border-muted-foreground/40'
                            }`}
                          >
                            {isSelected && <Check className="size-3 stroke-[3]" />}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                              <span>{trip.container_truck_id}</span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                [{trip.consolidation_code}]
                              </span>
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {trip.origin_place && trip.destination_place
                                ? `${trip.origin_place} → ${trip.destination_place}`
                                : trip.status}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {trip.assigned_volume} / {trip.max_volume_capacity} m³
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            Free: {trip.remaining_volume} m³
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setPackingCargo(null)}
                disabled={submittingPack}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-border text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPack}
                disabled={submittingPack || !selectedTripId}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {submittingPack ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    <span>Packing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    <span>Confirm Packing</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detach Confirmation Modal */}
      {detachingCargo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-surface border border-border shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-500">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <Unlink className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {t('detachConfirmTitle') || 'Detach Cargo from Truck'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('detachConfirmDesc', {
                    truck: detachingCargo.container_truck_id || 'truck',
                  }) ||
                    `Are you sure you want to remove this LTL cargo from ${detachingCargo.container_truck_id}? It will become an unassigned package.`}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-muted/40 border border-border space-y-1 text-xs">
              <span className="font-bold text-foreground block">{detachingCargo.cargo}</span>
              <span className="text-muted-foreground font-mono">
                {detachingCargo.volume} m³ · {detachingCargo.weight} kg
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setDetachingCargo(null)}
                disabled={submittingDetach}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-border text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDetach}
                disabled={submittingDetach}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {submittingDetach ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    <span>Detaching...</span>
                  </>
                ) : (
                  <span>Yes, Detach</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeletionApprovalModal
        isOpen={!!deletingCargo}
        onClose={() => !submittingDelete && setDeletingCargo(null)}
        onConfirm={handleConfirmDelete}
        isBusy={submittingDelete}
        title={t('deleteLtlCargoTitle') || 'Delete LTL Cargo Registration'}
        description={
          t('deleteLtlCargoDesc') ||
          'Are you sure you want to delete this LTL cargo registration? This action cannot be undone.'
        }
        confirmLabel={t('actionDelete') || 'Delete'}
        cancelLabel={t('actionCancel') || 'Cancel'}
        entityPreview={
          deletingCargo ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">{deletingCargo.cargo}</span>
                <span className="font-mono text-muted-foreground">
                  {deletingCargo.volume} m³ / {deletingCargo.weight} kg
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Client: {deletingCargo.client?.name || deletingCargo.client_full_name}</span>
                <span>
                  Sell:{' '}
                  {formatMoney(
                    deletingCargo.sell_price?.amount ?? 0,
                    deletingCargo.sell_price?.currency || 'USD'
                  )}
                </span>
              </div>
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
