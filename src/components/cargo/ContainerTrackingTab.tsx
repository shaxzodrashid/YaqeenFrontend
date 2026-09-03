import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Plus,
  Trash2,
  TrendingUp,
  RefreshCw,
  X,
  CheckCircle2,
  Clock,
  MapPin,
  UserCheck,
  Search,
  Filter,
  LayoutGrid,
  Kanban,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Coins,
  ArrowUpDown,
  Shield,
  Repeat,
  CopyPlus,
  Copy,
  Check,
  Eye,
  Edit2,
  Calendar,
  TrainFront,
  Plane,
  Ship,
  Package,
  ShieldCheck,
  Building2,
  User,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { T } from '../T';
import { useNotification } from '../../context/NotificationContext';
import { usePermissions } from '../../context/PermissionsContext';
import { cargoRegistrationsApi, formatMoney } from '../../services/api';
import type {
  CargoRegistrationPaginatedResponse,
  CargoRegistrationListItem,
  TransportType,
} from '../../services/api';
import type { ShipmentStatus } from '../../services/cargoKpi.service';
import { CargoRegistrationModal } from './CargoRegistrationModal';
import { CargoRegistrationDetailsModal } from './CargoRegistrationDetailsModal';
import { CargoTransactionsTable } from './CargoTransactionsTable';
import { RouteBadge } from './RouteBadge';
import { DeletionApprovalModal } from '../ui/DeletionApprovalModal';
import {
  CargoFilterModal,
  INITIAL_CARGO_FILTERS,
  getActiveCargoFilterCount,
} from './CargoFilterModal';
import type { CargoFilterState } from './CargoFilterModal';
import { getTransportTypeLabel } from '../../services/api';

export type ViewMode = 'grid' | 'kanban';

const TRANSPORT_TYPE_ICONS: Record<TransportType | string, React.ReactNode> = {
  auto: <Truck className="size-3" />,
  railway: <TrainFront className="size-3" />,
  air: <Plane className="size-3" />,
  sea: <Ship className="size-3" />,
  other: <Package className="size-3" />,
};

function formatDateDisplay(dateStr?: string | null, localeCode: string = 'en'): string {
  if (!dateStr || !dateStr.trim()) return '—';
  try {
    const cleanStr = dateStr.slice(0, 10);
    const parts = cleanStr.split('-');
    let dateObj: Date;
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      dateObj = new Date(year, month, day);
    } else {
      dateObj = new Date(dateStr);
    }
    if (isNaN(dateObj.getTime())) return cleanStr;
    const localeMap: Record<string, string> = {
      uz: 'uz-UZ',
      ru: 'ru-RU',
      en: 'en-US',
    };
    const targetLocale = localeMap[localeCode] || 'en-US';
    return dateObj.toLocaleDateString(targetLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr.slice(0, 10);
  }
}

const STATUS_CONFIG: {
  key: ShipmentStatus;
  labelKey: string;
  badgeClass: string;
  dotClass: string;
  bgLight: string;
  icon: React.ReactNode;
  stepIndex: number;
}[] = [
  {
    key: 'Waiting',
    labelKey: 'statusWaiting',
    badgeClass: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
    dotClass: 'bg-yellow-500',
    bgLight: 'border-yellow-500/20 bg-yellow-500/5',
    icon: <Clock className="size-3.5" />,
    stepIndex: 0,
  },
  {
    key: 'Station',
    labelKey: 'statusStation',
    badgeClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    dotClass: 'bg-indigo-500',
    bgLight: 'border-indigo-500/20 bg-indigo-500/5',
    icon: <MapPin className="size-3.5" />,
    stepIndex: 1,
  },
  {
    key: 'On the way',
    labelKey: 'statusOnTheWay',
    badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    dotClass: 'bg-blue-500',
    bgLight: 'border-blue-500/20 bg-blue-500/5',
    icon: <Truck className="size-3.5" />,
    stepIndex: 2,
  },
  {
    key: 'On the border',
    labelKey: 'statusOnTheBorder',
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    dotClass: 'bg-amber-500',
    bgLight: 'border-amber-500/20 bg-amber-500/5',
    icon: <Shield className="size-3.5" />,
    stepIndex: 3,
  },
  {
    key: 'Reload',
    labelKey: 'statusReload',
    badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    dotClass: 'bg-purple-500',
    bgLight: 'border-purple-500/20 bg-purple-500/5',
    icon: <Repeat className="size-3.5" />,
    stepIndex: 4,
  },
  {
    key: 'Arrived',
    labelKey: 'statusArrived',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    dotClass: 'bg-emerald-500',
    bgLight: 'border-emerald-500/20 bg-emerald-500/5',
    icon: <CheckCircle2 className="size-3.5" />,
    stepIndex: 5,
  },
];

const ORDERED_STATUSES: ShipmentStatus[] = [
  'Waiting',
  'Station',
  'On the way',
  'On the border',
  'Reload',
  'Arrived',
];

export function ContainerTrackingTab() {
  const { t, locale } = useTranslation();
  const { showNotification } = useNotification();
  const { canCreate, canUpdate, canDelete } = usePermissions();

  // Primary states - Single clean source of truth
  const [regData, setRegData] = useState<CargoRegistrationPaginatedResponse | null>(null);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC' | undefined>(undefined);

  // Multi-select batch operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingShipmentId, setEditingShipmentId] = useState<string | null>(null);
  const [duplicateFromId, setDuplicateFromId] = useState<string | null>(null);
  const [detailsModalItem, setDetailsModalItem] = useState<CargoRegistrationListItem | null>(null);
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);

  // Filter modal state
  const [filters, setFilters] = useState<CargoFilterState>(INITIAL_CARGO_FILTERS);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);

  // Deletion approval state (single + batch)
  const [pendingSingleDelete, setPendingSingleDelete] = useState<CargoRegistrationListItem | null>(
    null
  );
  const [pendingBatchDelete, setPendingBatchDelete] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Kanban Horizontal Scroll Reference
  const kanbanScrollRef = useRef<HTMLDivElement>(null);

  const getStatusLabel = useCallback(
    (st: ShipmentStatus | string) => {
      switch (st) {
        case 'Arrived':
        case 'Delivered':
          return t('statusArrived') || 'Arrived';
        case 'On the way':
        case 'In Transit':
          return t('statusOnTheWay') || 'On the way';
        case 'On the border':
        case 'Border':
          return t('statusOnTheBorder') || 'On the border';
        case 'Station':
        case 'At Station':
          return t('statusStation') || 'Station';
        case 'Reload':
          return t('statusReload') || 'Reload';
        case 'Waiting':
          return t('statusWaiting') || 'Waiting';
        default:
          return st;
      }
    },
    [t]
  );

  // Single efficient request for all tracking views
  const loadShipments = useCallback(async () => {
    setLoading(true);
    try {
      const activeStatus = filters.status || (statusFilter !== 'all' ? statusFilter : undefined);
      const queryParams = {
        page,
        limit: 12,
        search: searchQuery.trim() || undefined,
        status: activeStatus,
        cargo_type: 'FTL',
        container_type: filters.container_type || undefined,
        transport_types:
          filters.transport_types && filters.transport_types.length > 0
            ? filters.transport_types
            : undefined,
        client_id: filters.client_id || undefined,
        employee_id: filters.employee_id || undefined,
        origin_city: filters.origin_city || undefined,
        origin_country_code: filters.origin_country_code || undefined,
        destination_city: filters.destination_city || undefined,
        destination_country_code: filters.destination_country_code || undefined,
        sort_by: sortBy || undefined,
        sort_order: sortOrder || undefined,
        purchase_start_date: filters.purchase_start_date || undefined,
        purchase_end_date: filters.purchase_end_date || undefined,
        sell_start_date: filters.sell_start_date || undefined,
        sell_end_date: filters.sell_end_date || undefined,
        confirmed_start_date: filters.confirmed_start_date || undefined,
        confirmed_end_date: filters.confirmed_end_date || undefined,
        loaded_start_date: filters.loaded_start_date || undefined,
        loaded_end_date: filters.loaded_end_date || undefined,
        arrived_start_date: filters.arrived_start_date || undefined,
        arrived_end_date: filters.arrived_end_date || undefined,
        created_start_date: filters.created_start_date || undefined,
        created_end_date: filters.created_end_date || undefined,
      };

      const resList = await cargoRegistrationsApi.list(queryParams);
      setRegData(resList);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to load shipments data', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, filters, sortBy, sortOrder, showNotification]);

  // Tri-state column sorting: Primary Order -> Inverted Order -> Cancel sort (undefined)
  const handleSort = (field: string) => {
    const isDescDefault = [
      'created_at',
      'confirmed_date',
      'loaded_date',
      'arrived_date',
      'purchase_date',
      'sell_date',
      'purchase_price',
      'sell_price',
      'net_yield',
    ].includes(field);

    const currentOrder = sortOrder?.toUpperCase();

    if (sortBy === field) {
      if (isDescDefault) {
        if (currentOrder === 'DESC') {
          setSortOrder('ASC');
        } else {
          setSortBy(undefined);
          setSortOrder(undefined);
        }
      } else {
        if (currentOrder === 'ASC') {
          setSortOrder('DESC');
        } else {
          setSortBy(undefined);
          setSortOrder(undefined);
        }
      }
    } else {
      setSortBy(field);
      setSortOrder(isDescDefault ? 'DESC' : 'ASC');
    }
    setPage(1);
  };

  const handleResetSort = () => {
    setSortBy(undefined);
    setSortOrder(undefined);
    setPage(1);
  };

  const getSortFieldLabel = (field?: string) => {
    if (!field) return '';
    switch (field) {
      case 'container_truck_id':
        return t('colContainerNo') || 'Container / Truck';
      case 'cargo':
        return t('colCargoAndAgent') || 'Cargo & Agent';
      case 'client_name':
        return t('colClient') || 'Client';
      case 'employee_name':
        return t('colEmployee') || 'Employee';
      case 'purchase_price':
        return t('colBuyPrice') || 'Buy Price';
      case 'sell_price':
        return t('colSellPrice') || 'Sell Price';
      case 'net_yield':
        return t('colNetYield') || 'Net Yield';
      case 'confirmed_date':
        return t('colConfirmedDate') || 'Confirmed Date';
      case 'loaded_date':
        return t('colLoadedDate') || 'Loaded Date';
      case 'arrived_date':
        return t('colArrivedDate') || 'Arrived Date';
      case 'created_at':
        return t('colCreatedAt') || 'Created At';
      case 'status':
        return t('colStatus') || 'Status';
      default:
        return field;
    }
  };

  // Calculate active filter count (excluding cargo_type since it is fixed to FTL)
  const activeFilterCount = useMemo(() => {
    let count = getActiveCargoFilterCount(filters, true);
    if (statusFilter !== 'all' && !filters.status) count++;
    return count;
  }, [filters, statusFilter]);

  const handleRemoveFilterTag = (key: keyof CargoFilterState) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: '' };
      if (key === 'client_id') next.client_name = '';
      if (key === 'employee_id') next.employee_name = '';
      if (key === 'origin_city') next.origin_country_code = '';
      if (key === 'destination_city') next.destination_country_code = '';
      if (key === 'transport_types') next.transport_types = [];
      return next;
    });
    if (key === 'status') {
      setStatusFilter('all');
    }
    setPage(1);
  };

  const isCustomSortActive = Boolean(sortBy);
  const hasActiveFiltersOrSort =
    activeFilterCount > 0 || isCustomSortActive || Boolean(searchQuery.trim());

  const handleClearAllFilters = () => {
    setFilters(INITIAL_CARGO_FILTERS);
    setStatusFilter('all');
    setSearchQuery('');
    setSortBy(undefined);
    setSortOrder(undefined);
    setPage(1);
  };

  const handleSelectStatusFilter = (st: string) => {
    const nextStatus = st.toLowerCase();
    setStatusFilter(nextStatus);
    setFilters((prev) => ({
      ...prev,
      status: nextStatus === 'all' ? '' : st,
    }));
    setPage(1);
  };

  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  const handleOpenAdd = () => {
    setEditingShipmentId(null);
    setDuplicateFromId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (shipment: { id: string }) => {
    setEditingShipmentId(shipment.id);
    setDuplicateFromId(null);
    setIsModalOpen(true);
  };

  const handleOpenDuplicate = (item: { id: string }) => {
    setEditingShipmentId(null);
    setDuplicateFromId(item.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const match = regData?.data.find((s) => s.id === id);
    if (match) {
      setPendingSingleDelete(match);
    }
  };

  const handleConfirmSingleDelete = async () => {
    if (!pendingSingleDelete) return;
    setIsDeleting(true);
    try {
      await cargoRegistrationsApi.delete(pendingSingleDelete.id);
      showNotification(t('successShipmentDeleted') || 'Shipment deleted successfully', 'success');
      setSelectedIds((prev) => prev.filter((i) => i !== pendingSingleDelete.id));
      setPendingSingleDelete(null);
      loadShipments();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete shipment', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChangeInline = async (id: string, newStatus: ShipmentStatus) => {
    try {
      await cargoRegistrationsApi.update(id, { status: newStatus as any });
      showNotification(t('successShipmentUpdated') || 'Shipment updated successfully', 'success');
      loadShipments();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update status', 'error');
    }
  };

  const handleMoveStage = async (shp: CargoRegistrationListItem, direction: 'next' | 'prev') => {
    const currentStatus = shp.status as ShipmentStatus;
    const currentIndex = ORDERED_STATUSES.indexOf(currentStatus);
    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex < 0 || targetIndex >= ORDERED_STATUSES.length) return;

    const newStatus = ORDERED_STATUSES[targetIndex];
    await handleStatusChangeInline(shp.id, newStatus);
  };

  const handleBatchStatusUpdate = async (newStatus: ShipmentStatus) => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(
        selectedIds.map((id) => cargoRegistrationsApi.update(id, { status: newStatus as any }))
      );
      showNotification(
        t('bulkStatusUpdated', { count: selectedIds.length }) ||
          `Updated ${selectedIds.length} container(s) to ${getStatusLabel(newStatus)}`,
        'success'
      );
      setSelectedIds([]);
      loadShipments();
    } catch (err: any) {
      showNotification(err?.message || 'Batch update failed', 'error');
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    setPendingBatchDelete(true);
  };

  const handleConfirmBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => cargoRegistrationsApi.delete(id)));
      showNotification(
        t('bulkDeletedSuccess', { count: selectedIds.length }) ||
          `Deleted ${selectedIds.length} container(s)`,
        'success'
      );
      setSelectedIds([]);
      setPendingBatchDelete(false);
      loadShipments();
    } catch (err: any) {
      showNotification(err?.message || 'Batch delete failed', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const items = regData?.data || [];

  // Filtered items
  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    return items.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (s.container_truck_id && s.container_truck_id.toLowerCase().includes(q)) ||
        (s.client_full_name && s.client_full_name.toLowerCase().includes(q)) ||
        (s.agent_name && s.agent_name.toLowerCase().includes(q)) ||
        (s.cargo && s.cargo.toLowerCase().includes(q)) ||
        (s.origin_city && s.origin_city.toLowerCase().includes(q)) ||
        (s.destination_city && s.destination_city.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'all' || s.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [items, searchQuery, statusFilter]);

  const handleCopyCard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCardId(id);
    showNotification(`${text} copied to clipboard`, 'success');
    setTimeout(() => setCopiedCardId(null), 2000);
  };

  const meta = regData?.meta;
  const totalPages = meta ? Math.ceil(meta.total / (meta.limit || 12)) : 1;

  return (
    <div className="space-y-4 sm:space-y-6 pb-8 min-w-0 max-w-full">
      {/* Workspace Header Controls Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-surface border border-border shadow-sm min-w-0">
        {/* Unified View Mode Switcher: Grid View | Kanban Pipeline */}
        <div
          role="button"
          tabIndex={0}
          aria-label={
            viewMode === 'grid'
              ? `${t('viewGridView') || 'Grid View'} (Press Enter to switch to ${t('viewKanbanPipeline') || 'Kanban Pipeline'})`
              : `${t('viewKanbanPipeline') || 'Kanban Pipeline'} (Press Enter to switch to ${t('viewGridView') || 'Grid View'})`
          }
          aria-pressed={viewMode === 'kanban'}
          title={
            viewMode === 'grid'
              ? `${t('viewGridView') || 'Grid View'} — Click or press Enter to switch`
              : `${t('viewKanbanPipeline') || 'Kanban Pipeline'} — Click or press Enter to switch`
          }
          onClick={() => setViewMode((prev) => (prev === 'grid' ? 'kanban' : 'grid'))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setViewMode((prev) => (prev === 'grid' ? 'kanban' : 'grid'));
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
              e.preventDefault();
              setViewMode('grid');
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
              e.preventDefault();
              setViewMode('kanban');
            }
          }}
          className="flex items-center p-1 rounded-xl bg-muted/50 border border-border w-full lg:w-auto overflow-x-auto min-w-0 shrink-0 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-1 transition-all"
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              setViewMode('grid');
            }}
            className={`flex-1 lg:flex-none px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              viewMode === 'grid'
                ? 'bg-background text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="size-3.5 text-brand-gold shrink-0" />
            <span>
              <T k="viewGridView" />
            </span>
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setViewMode('kanban');
            }}
            className={`flex-1 lg:flex-none px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              viewMode === 'kanban'
                ? 'bg-background text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Kanban className="size-3.5 text-blue-500 shrink-0" />
            <span>
              <T k="viewKanbanPipeline" />
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-end gap-2 w-full lg:w-auto min-w-0">
          {/* Filter Trigger Button */}
          {activeFilterCount > 0 ? (
            <div className="inline-flex items-center rounded-xl border border-brand-gold text-brand-gold bg-brand-gold/10 font-bold text-xs shadow-xs shrink-0">
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(true)}
                className="px-3 py-2 flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                title={t('cargoFilterModalTitle')}
              >
                <Filter className="size-4" />
                <span>{t('filterBtn')}</span>
                <span className="px-1.5 py-0.2 bg-brand-gold text-brand-navy text-[10px] font-extrabold rounded-full">
                  {activeFilterCount}
                </span>
              </button>
              <div className="w-[1px] h-4 bg-brand-gold/30" />
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="p-2 flex items-center justify-center hover:bg-brand-gold/20 hover:text-rose-500 text-brand-gold transition-colors cursor-pointer"
                title={t('cancelFiltersBtn')}
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              className="px-3 py-2 rounded-xl border border-border hover:bg-muted text-foreground transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
              title={t('cargoFilterModalTitle')}
            >
              <Filter className="size-3.5 text-brand-gold shrink-0" />
              <span>{t('filterBtn')}</span>
            </button>
          )}

          {/* Refresh */}
          <button
            onClick={loadShipments}
            disabled={loading}
            className="p-2 rounded-xl border border-border hover:bg-muted text-foreground transition-all cursor-pointer shrink-0"
            title="Refresh Container Data"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Add Container */}
          {canCreate('cargo_registrations') && (
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-gold hover:bg-brand-gold/90 text-brand-navy shadow-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="size-4 shrink-0" />
              <span>
                <T k="addShipment" />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Summary Bar — 4 Clean Single-USD Metric Cards Directly from backend Meta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 min-w-0">
        {/* Card 1: Total Active Containers */}
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs flex items-center justify-between gap-3 min-w-0">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-medium text-muted-foreground block truncate">
              <T k="lblActiveContainers" />
            </span>
            <h3 className="text-2xl font-black text-foreground tracking-tight truncate">
              {meta?.active_containers ?? 0}
            </h3>
            <span className="text-[11px] text-muted-foreground block truncate">
              {meta?.total ?? items.length} <T k="lblUnits" /> <T k="lblEnRoute" />
            </span>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
            <Truck className="size-5" />
          </div>
        </div>

        {/* Card 2: Action Required */}
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs flex items-center justify-between gap-3 min-w-0">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-medium text-muted-foreground block truncate">
              <T k="lblActionRequired" />
            </span>
            <h3
              className={`text-2xl font-black tracking-tight truncate ${
                (meta?.action_required ?? 0) > 0 ? 'text-amber-500' : 'text-foreground'
              }`}
            >
              {meta?.action_required ?? 0}
            </h3>
            <span className="text-[11px] text-muted-foreground block truncate">
              {(meta?.action_required ?? 0) > 0
                ? t('subActionRequired') || 'Waiting & reload checkpoints'
                : t('subAllClear') || 'All operations on track'}
            </span>
          </div>
          <div
            className={`p-3 rounded-xl border shrink-0 ${
              (meta?.action_required ?? 0) > 0
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            }`}
          >
            <AlertCircle className="size-5" />
          </div>
        </div>

        {/* Card 3: Total Net Profit Yield (Single USD Amount) */}
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs flex items-center justify-between gap-3 min-w-0">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-medium text-muted-foreground block truncate">
              <T k="lblCalculatedNetYield" />
            </span>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
              {formatMoney(
                meta?.calculated_net_yield?.total_usd ?? meta?.calculated_net_yield?.USD ?? 0,
                'USD'
              )}
            </h3>
            <span className="text-[11px] text-muted-foreground block truncate">
              <T k="lblProfitLoss" />
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
            <TrendingUp className="size-5" />
          </div>
        </div>

        {/* Card 4: Gross Sales Revenue (Single USD Amount) */}
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs flex items-center justify-between gap-3 min-w-0">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-medium text-muted-foreground block truncate">
              <T k="lblGrossSalesRevenue" />
            </span>
            <h3 className="text-2xl font-black text-brand-gold tracking-tight truncate">
              {formatMoney(
                meta?.gross_sales_revenue?.total_usd_equivalent ??
                  meta?.gross_sales_revenue?.USD ??
                  0,
                'USD'
              )}
            </h3>
            <span className="text-[11px] text-muted-foreground block truncate">
              <T k="lblTurnover" />
            </span>
          </div>
          <div className="p-3 rounded-xl bg-brand-gold/10 text-brand-gold border border-brand-gold/20 shrink-0">
            <Coins className="size-5" />
          </div>
        </div>
      </div>

      {/* Batch Actions Floating Toolbar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="p-3.5 rounded-2xl bg-brand-navy text-white border border-brand-gold/40 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 min-w-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-brand-gold text-brand-navy shrink-0">
                {selectedIds.length} <T k="lblSelected" />
              </span>
              <span className="text-xs text-neutral-300 hidden md:inline truncate">
                <T k="lblBulkActionsHelp" />
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none min-w-0">
              <span className="text-[11px] font-semibold text-neutral-300 mr-1 shrink-0 hidden sm:inline">
                <T k="lblSetStage" />
              </span>
              {STATUS_CONFIG.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleBatchStatusUpdate(opt.key)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  {opt.icon}
                  <span>{getStatusLabel(opt.key)}</span>
                </button>
              ))}

              {canDelete('cargo_registrations') && (
                <button
                  onClick={handleBatchDelete}
                  className="ml-auto lg:ml-2 px-3 py-1 rounded-lg text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <Trash2 className="size-3.5" />
                  <span>
                    <T k="btnDeleteContainer" /> ({selectedIds.length})
                  </span>
                </button>
              )}

              <button
                onClick={() => setSelectedIds([])}
                className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white shrink-0 ml-1"
              >
                <X className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-surface border border-border shadow-sm min-w-0">
        {/* Search Input */}
        <div className="relative w-full lg:w-72 xl:w-80 shrink-0">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchContainerPlaceholder') || 'Search Container No, Client, Agent...'}
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Status Filters & Density Control */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none min-w-0">
          <Filter className="size-3.5 text-muted-foreground shrink-0 hidden sm:block" />
          <button
            onClick={() => handleSelectStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              statusFilter === 'all'
                ? 'bg-brand-navy dark:bg-brand-gold text-white dark:text-brand-navy shadow-sm'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground'
            }`}
          >
            {t('statusAll')} ({meta?.total ?? items.length})
          </button>
          {STATUS_CONFIG.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleSelectStatusFilter(opt.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                statusFilter === opt.key.toLowerCase()
                  ? 'bg-brand-gold/20 border border-brand-gold text-brand-gold'
                  : 'bg-muted/30 hover:bg-muted text-muted-foreground'
              }`}
            >
              {opt.icon}
              <span>{getStatusLabel(opt.key)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters, Search & Sort Tag Pills Bar */}
      {hasActiveFiltersOrSort && (
        <div className="p-3 rounded-2xl bg-surface dark:bg-surface border border-border/80 shadow-xs flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground font-bold text-[11px] uppercase tracking-wider mr-1">
            {t('activeFiltersLabel', {
              count:
                activeFilterCount + (isCustomSortActive ? 1 : 0) + (searchQuery.trim() ? 1 : 0),
            })}
            :
          </span>

          {searchQuery.trim() && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted text-foreground border border-border font-semibold text-[11px]">
              <Search className="size-3 text-brand-gold shrink-0" />
              <span className="truncate max-w-[140px]">"{searchQuery.trim()}"</span>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="hover:text-rose-500 cursor-pointer"
                title={t('clearSearch') || 'Clear search'}
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {isCustomSortActive && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30 font-semibold text-[11px]">
              <ArrowUpDown className="size-3 shrink-0" />
              <span>
                {getSortFieldLabel(sortBy)} (
                {String(sortOrder).toUpperCase() === 'ASC'
                  ? t('sortOrderAsc') || 'ASC'
                  : t('sortOrderDesc') || 'DESC'}
                )
              </span>
              <button
                onClick={handleResetSort}
                className="hover:text-rose-500 transition-colors cursor-pointer"
                title={t('cancelSort') || 'Reset sorting'}
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {filters.status && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30 font-semibold text-[11px]">
              {t('statusSectionTitle') || 'Status'}: {getStatusLabel(filters.status)}
              <button
                onClick={() => handleRemoveFilterTag('status')}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {filters.container_type && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/15 text-blue-500 border border-blue-500/30 font-semibold text-[11px]">
              {t('containerTypeLabel') || 'Container Type'}: {filters.container_type}
              <button
                onClick={() => handleRemoveFilterTag('container_type')}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {filters.transport_types && filters.transport_types.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-semibold text-[11px]">
              {t('transportTypesLabel') || 'Transport'}:{' '}
              {filters.transport_types.map((tt) => getTransportTypeLabel(tt, t)).join(', ')}
              <button
                onClick={() => handleRemoveFilterTag('transport_types')}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {filters.client_id && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 font-semibold text-[11px]">
              {t('clientLabel') || 'Client'}: {filters.client_name || 'Selected'}
              <button
                onClick={() => handleRemoveFilterTag('client_id')}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {filters.employee_id && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-semibold text-[11px]">
              {t('assignedEmployeeLabel') || 'Employee'}: {filters.employee_name || 'Selected'}
              <button
                onClick={() => handleRemoveFilterTag('employee_id')}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {filters.origin_city && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-semibold text-[11px]">
              {t('originCityLabel') || 'Origin'}: {filters.origin_city}
              <button
                onClick={() => handleRemoveFilterTag('origin_city')}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {filters.destination_city && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-semibold text-[11px]">
              {t('destinationCityLabel') || 'Destination'}: {filters.destination_city}
              <button
                onClick={() => handleRemoveFilterTag('destination_city')}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {(filters.purchase_start_date || filters.purchase_end_date) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted text-foreground border border-border font-semibold text-[11px]">
              {t('purchaseDateRange') || 'Purchase'}: {filters.purchase_start_date || '...'} ~{' '}
              {filters.purchase_end_date || '...'}
              <button
                onClick={() => {
                  handleRemoveFilterTag('purchase_start_date');
                  handleRemoveFilterTag('purchase_end_date');
                }}
                className="hover:text-rose-500 cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {(filters.sell_start_date || filters.sell_end_date) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted text-foreground border border-border font-semibold text-[11px]">
              {t('sellDateRange') || 'Sell'}: {filters.sell_start_date || '...'} ~{' '}
              {filters.sell_end_date || '...'}
              <button
                onClick={() => {
                  handleRemoveFilterTag('sell_start_date');
                  handleRemoveFilterTag('sell_end_date');
                }}
                className="hover:text-rose-500 cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {(filters.created_start_date || filters.created_end_date) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted text-foreground border border-border font-semibold text-[11px]">
              {t('creationDateRange') || 'Created'}: {filters.created_start_date || '...'} ~{' '}
              {filters.created_end_date || '...'}
              <button
                onClick={() => {
                  handleRemoveFilterTag('created_start_date');
                  handleRemoveFilterTag('created_end_date');
                }}
                className="hover:text-rose-500 cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {(filters.confirmed_start_date || filters.confirmed_end_date) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted text-foreground border border-border font-semibold text-[11px]">
              {t('confirmedDateRange') || 'Confirmed'}: {filters.confirmed_start_date || '...'} ~{' '}
              {filters.confirmed_end_date || '...'}
              <button
                onClick={() => {
                  handleRemoveFilterTag('confirmed_start_date');
                  handleRemoveFilterTag('confirmed_end_date');
                }}
                className="hover:text-rose-500 cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {(filters.loaded_start_date || filters.loaded_end_date) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted text-foreground border border-border font-semibold text-[11px]">
              {t('loadedDateRange') || 'Loaded'}: {filters.loaded_start_date || '...'} ~{' '}
              {filters.loaded_end_date || '...'}
              <button
                onClick={() => {
                  handleRemoveFilterTag('loaded_start_date');
                  handleRemoveFilterTag('loaded_end_date');
                }}
                className="hover:text-rose-500 cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {(filters.arrived_start_date || filters.arrived_end_date) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted text-foreground border border-border font-semibold text-[11px]">
              {t('arrivedDateRange') || 'Arrived'}: {filters.arrived_start_date || '...'} ~{' '}
              {filters.arrived_end_date || '...'}
              <button
                onClick={() => {
                  handleRemoveFilterTag('arrived_start_date');
                  handleRemoveFilterTag('arrived_end_date');
                }}
                className="hover:text-rose-500 cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          <button
            onClick={handleClearAllFilters}
            className="ml-auto text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer transition-colors"
          >
            {t('clearAllFiltersBtn') || 'Clear all'}
          </button>
        </div>
      )}

      {/* WORKSPACE VIEW 1: DATA TABLE GRID VIEW */}
      {viewMode === 'grid' && (
        <CargoTransactionsTable
          data={regData}
          loading={loading}
          page={page}
          setPage={setPage}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onDuplicate={handleOpenDuplicate}
          onEdit={(item) => {
            setEditingShipmentId(item.id);
            setDuplicateFromId(null);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
        />
      )}

      {/* WORKSPACE VIEW 2: UNCOMPRESSED, RESPONSIVE KANBAN PIPELINE BOARD */}
      {viewMode === 'kanban' && (
        <div className="space-y-3 min-w-0 max-w-full">
          {/* Top sub-toolbar with count and horizontal scroll buttons */}
          <div className="flex items-center justify-between gap-3 px-1 py-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
              <span className="font-bold text-foreground">
                <T k="viewKanbanPipeline" />
              </span>
              <span>•</span>
              <span>
                {filteredItems.length} <T k="lblContainersCount" />
              </span>
            </div>

            {/* Smooth Scroll Navigation controls for Laptops & Desktops */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  if (kanbanScrollRef.current) {
                    kanbanScrollRef.current.scrollBy({ left: -360, behavior: 'smooth' });
                  }
                }}
                className="p-1.5 rounded-xl border border-border hover:bg-muted text-foreground transition-all cursor-pointer shadow-xs"
                title="Scroll Left"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => {
                  if (kanbanScrollRef.current) {
                    kanbanScrollRef.current.scrollBy({ left: 360, behavior: 'smooth' });
                  }
                }}
                className="p-1.5 rounded-xl border border-border hover:bg-muted text-foreground transition-all cursor-pointer shadow-xs"
                title="Scroll Right"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          {/* Columns Flex Container (Never compressed: columns maintain a robust min-width with smooth scroll) */}
          <div
            ref={kanbanScrollRef}
            className="flex overflow-x-auto pb-4 gap-3.5 sm:gap-4 scrollbar-thin snap-x snap-mandatory min-w-0"
            style={{ scrollBehavior: 'smooth' }}
          >
            {STATUS_CONFIG.map((col) => {
              const colShipments = filteredItems.filter((s) => s.status === col.key);
              const totalColProfit = colShipments.reduce((sum, s) => {
                const p =
                  s.net_yield?.amount_usd ??
                  (typeof s.net_yield === 'number' ? s.net_yield : s.net_yield?.amount) ??
                  0;
                return sum + p;
              }, 0);

              return (
                <div
                  key={col.key}
                  className="w-[310px] sm:w-[335px] md:w-[350px] shrink-0 snap-start p-3.5 sm:p-4 rounded-2xl bg-surface border border-border shadow-sm flex flex-col min-h-[580px] max-h-[calc(100vh-250px)] min-w-0"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-border mb-3 min-w-0 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`p-1.5 rounded-lg border shrink-0 ${col.badgeClass}`}>
                        {col.icon}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-foreground uppercase tracking-wider truncate">
                          {getStatusLabel(col.key)}
                        </h4>
                        <span className="text-[10px] text-muted-foreground font-medium block truncate">
                          {colShipments.length} <T k="lblContainersCount" />
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-full border shrink-0 ${
                        totalColProfit >= 0
                          ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                          : 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                      }`}
                    >
                      {totalColProfit >= 0 ? '+' : ''}${Math.round(totalColProfit).toLocaleString()}
                    </span>
                  </div>

                  {/* Column Card List */}
                  <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-thin">
                    {colShipments.length === 0 ? (
                      <div className="py-14 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                        <Truck className="size-6 mx-auto mb-1.5 opacity-40" />
                        <span className="text-xs font-semibold block">
                          <T k="noContainersInStage" />
                        </span>
                      </div>
                    ) : (
                      colShipments.map((shp) => {
                        const buyAmount = Number(shp.purchase_price?.amount || 0);
                        const buyCurrency = shp.purchase_price?.currency || 'USD';
                        const usdRmbRate = Number(shp.usd_rmb_rate || 7.25);
                        const buyUSD = buyCurrency === 'RMB' ? buyAmount / usdRmbRate : buyAmount;
                        const sellUSD = Number(shp.sell_price?.amount || 0);
                        const netUSD = Number(
                          shp.net_yield?.amount_usd ??
                            (typeof shp.net_yield === 'number'
                              ? shp.net_yield
                              : shp.net_yield?.amount) ??
                            0
                        );
                        const marginPct =
                          sellUSD > 0 ? ((netUSD / sellUSD) * 100).toFixed(1) : '0.0';

                        const clientName =
                          shp.client_full_name ||
                          shp.client?.company_name ||
                          (shp.client?.first_name
                            ? `${shp.client.first_name} ${shp.client.last_name || ''}`
                            : '') ||
                          '—';

                        const employeeName =
                          shp.employee_full_name ||
                          (shp.employee?.first_name
                            ? `${shp.employee.first_name} ${shp.employee.last_name || ''}`
                            : '') ||
                          '—';

                        const hasMilestoneDates = Boolean(
                          shp.confirmed_date || shp.loaded_date || shp.arrived_date
                        );

                        return (
                          <motion.div
                            key={shp.id}
                            layout
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-3 sm:p-3.5 rounded-xl bg-background border border-border shadow-xs hover:border-brand-gold/50 transition-all space-y-2.5 group min-w-0"
                          >
                            {/* Card Header: Container ID, Badges & Profit */}
                            <div className="flex items-start justify-between gap-2 min-w-0">
                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="p-1 rounded bg-brand-gold/15 text-brand-gold shrink-0">
                                    <Truck className="size-3.5" />
                                  </span>
                                  <span
                                    className="font-mono font-black text-xs text-foreground truncate cursor-pointer hover:text-brand-gold"
                                    title={shp.container_truck_id}
                                    onClick={() => handleCopyCard(shp.id, shp.container_truck_id)}
                                  >
                                    {shp.container_truck_id}
                                  </span>
                                  <button
                                    onClick={() => handleCopyCard(shp.id, shp.container_truck_id)}
                                    className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                                    title={t('btnCopyId') || 'Copy ID'}
                                  >
                                    {copiedCardId === shp.id ? (
                                      <Check className="size-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="size-3 opacity-60 group-hover:opacity-100" />
                                    )}
                                  </button>
                                </div>

                                {/* Spec Tags: Container Type, Transport, Turnkey */}
                                <div className="flex items-center gap-1 flex-wrap">
                                  {shp.container_type && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                      {shp.container_type}
                                    </span>
                                  )}
                                  {shp.is_turnkey && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-0.5">
                                      <ShieldCheck className="size-2.5" />
                                      <span>{t('turnkeyBadge') || 'Turnkey'}</span>
                                    </span>
                                  )}
                                  {shp.transport_types && shp.transport_types.length > 0 && (
                                    <div className="flex items-center gap-0.5">
                                      {shp.transport_types.map((tt) => (
                                        <span
                                          key={tt}
                                          className="p-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                                          title={getTransportTypeLabel(tt, t)}
                                        >
                                          {TRANSPORT_TYPE_ICONS[tt] || (
                                            <Truck className="size-2.5" />
                                          )}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Profit Yield Pill */}
                              <div className="text-right shrink-0">
                                <span
                                  className={`inline-flex flex-col items-end px-2 py-0.5 rounded-lg border font-mono font-bold text-[11px] ${
                                    netUSD >= 0
                                      ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                                      : 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                                  }`}
                                >
                                  <span>
                                    {netUSD >= 0 ? '+' : ''}${Math.round(netUSD).toLocaleString()}
                                  </span>
                                  <span className="text-[9px] opacity-80">
                                    {netUSD >= 0 ? '+' : ''}
                                    {marginPct}%
                                  </span>
                                </span>
                              </div>
                            </div>

                            {/* Cargo Description & Dimensions */}
                            <div className="min-w-0 space-y-0.5">
                              <p
                                className="text-xs font-bold text-foreground truncate"
                                title={shp.cargo}
                              >
                                {shp.cargo || t('generalContainer') || 'General Cargo'}
                              </p>
                              {(shp.volume || shp.weight) && (
                                <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1.5 truncate">
                                  <Package className="size-3 text-muted-foreground shrink-0" />
                                  <span>
                                    {shp.volume ? `${shp.volume} m³` : ''}
                                    {shp.volume && shp.weight ? ' • ' : ''}
                                    {shp.weight ? `${shp.weight} kg` : ''}
                                  </span>
                                </p>
                              )}
                            </div>

                            {/* Route Corridor Badge */}
                            {(shp.origin_city || shp.destination_city) && (
                              <div className="pt-0.5">
                                <RouteBadge
                                  originCity={shp.origin_city}
                                  destinationCity={shp.destination_city}
                                  originCountryCode={shp.origin_country_code}
                                  destinationCountryCode={shp.destination_country_code}
                                  originLat={shp.origin_lat}
                                  originLng={shp.origin_lng}
                                  destLat={shp.destination_lat}
                                  destLng={shp.destination_lng}
                                  route={shp.route}
                                  showMapButton={true}
                                />
                              </div>
                            )}

                            {/* Stakeholders: Client, Employee, Agent */}
                            <div className="space-y-1 text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                              <div className="flex items-center justify-between gap-1 truncate">
                                <span className="flex items-center gap-1 truncate min-w-0">
                                  <Building2 className="size-3 text-brand-gold shrink-0" />
                                  <span className="font-semibold text-foreground truncate">
                                    {clientName}
                                  </span>
                                </span>
                                {employeeName !== '—' && (
                                  <span
                                    className="flex items-center gap-1 truncate shrink-0 max-w-[120px]"
                                    title={employeeName}
                                  >
                                    <User className="size-3 text-muted-foreground shrink-0" />
                                    <span className="truncate">{employeeName}</span>
                                  </span>
                                )}
                              </div>
                              {shp.agent_name && (
                                <div className="flex items-center gap-1 text-[10px] truncate">
                                  <UserCheck className="size-3 text-muted-foreground shrink-0" />
                                  <span className="truncate">{shp.agent_name}</span>
                                </div>
                              )}
                            </div>

                            {/* Milestone Lifecycle Dates */}
                            {hasMilestoneDates ? (
                              <div className="grid grid-cols-3 gap-1 pt-1 text-[9px] font-medium border-t border-border/50 text-center">
                                <div className="p-1 rounded bg-muted/40 border border-border/40 truncate">
                                  <span className="text-muted-foreground block text-[8px] uppercase">
                                    <T k="colConfirmed" />
                                  </span>
                                  <span className="text-foreground truncate block">
                                    {formatDateDisplay(shp.confirmed_date, locale)}
                                  </span>
                                </div>
                                <div className="p-1 rounded bg-muted/40 border border-border/40 truncate">
                                  <span className="text-muted-foreground block text-[8px] uppercase">
                                    <T k="colLoaded" />
                                  </span>
                                  <span className="text-foreground truncate block">
                                    {formatDateDisplay(shp.loaded_date, locale)}
                                  </span>
                                </div>
                                <div className="p-1 rounded bg-muted/40 border border-border/40 truncate">
                                  <span className="text-muted-foreground block text-[8px] uppercase">
                                    <T k="colArrived" />
                                  </span>
                                  <span
                                    className={`truncate block ${shp.arrived_date ? 'text-emerald-500 font-bold' : 'text-foreground'}`}
                                  >
                                    {formatDateDisplay(shp.arrived_date, locale)}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                                <span className="flex items-center gap-1">
                                  <Calendar className="size-3 shrink-0" />
                                  <span>{t('colCreatedAt') || 'Created'}</span>
                                </span>
                                <span className="font-medium text-foreground">
                                  {formatDateDisplay(shp.created_at, locale)}
                                </span>
                              </div>
                            )}

                            {/* Financial Breakdown Pill */}
                            <div className="p-2 rounded-lg bg-muted/40 text-[10px] flex items-center justify-between font-mono">
                              <span className="text-muted-foreground">
                                <T k="colBuyPrice" />: ${Math.round(buyUSD).toLocaleString()}
                                {buyCurrency === 'RMB' && (
                                  <span className="text-[9px] text-amber-500 ml-1">
                                    (¥{buyAmount.toLocaleString()})
                                  </span>
                                )}
                              </span>
                              <span className="font-bold text-foreground">
                                <T k="colSellPrice" />: ${sellUSD.toLocaleString()}
                              </span>
                            </div>

                            {/* Stage Transition Quick Buttons & Actions */}
                            <div className="flex items-center justify-between pt-1 border-t border-border/40">
                              <button
                                onClick={() => handleMoveStage(shp, 'prev')}
                                disabled={col.stepIndex === 0}
                                className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-20 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                                title={t('btnPrevStage') || 'Move to Previous Stage'}
                              >
                                <ChevronLeft className="size-3.5" />
                              </button>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setDetailsModalItem(shp)}
                                  className="p-1.5 rounded-lg border border-border hover:bg-brand-gold/15 hover:border-brand-gold/30 text-muted-foreground hover:text-brand-gold transition-colors cursor-pointer"
                                  title={t('btnViewDetails') || 'View Details'}
                                >
                                  <Eye className="size-3.5" />
                                </button>

                                {canUpdate('cargo_registrations') && (
                                  <button
                                    onClick={() => handleOpenEdit(shp)}
                                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                    title={t('btnEditRegistration') || 'Edit Registration'}
                                  >
                                    <Edit2 className="size-3.5" />
                                  </button>
                                )}

                                {canCreate('cargo_registrations') && (
                                  <button
                                    onClick={() => handleOpenDuplicate(shp)}
                                    className="p-1.5 rounded-lg border border-border hover:bg-amber-500/15 hover:border-amber-500/30 text-muted-foreground hover:text-amber-500 transition-colors cursor-pointer"
                                    title={
                                      t('btnDuplicateRegistration') || 'Duplicate Registration'
                                    }
                                  >
                                    <CopyPlus className="size-3.5" />
                                  </button>
                                )}

                                {canDelete('cargo_registrations') && (
                                  <button
                                    onClick={() => handleDelete(shp.id)}
                                    className="p-1.5 rounded-lg border border-border hover:bg-rose-500/15 hover:border-rose-500/30 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                                    title={t('btnDeleteContainer') || 'Delete Container'}
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                )}
                              </div>

                              <button
                                onClick={() => handleMoveStage(shp, 'next')}
                                disabled={col.stepIndex === STATUS_CONFIG.length - 1}
                                className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-20 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                                title={t('btnNextStage') || 'Advance to Next Stage'}
                              >
                                <ChevronRight className="size-3.5" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kanban Bottom Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-surface border border-border shadow-xs text-xs">
              <span className="text-muted-foreground font-medium">
                {t('showingPage', { page, totalPages, total: meta?.total || 0 }) ||
                  `Page ${page} of ${totalPages} (${meta?.total || 0} total)`}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-xl border border-border hover:bg-muted disabled:opacity-30 cursor-pointer flex items-center gap-1 text-foreground"
                >
                  <ChevronLeft className="size-3.5" />
                  <span>{t('pagPrev') || 'Prev'}</span>
                </button>
                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-xl border border-border hover:bg-muted disabled:opacity-30 cursor-pointer flex items-center gap-1 text-foreground"
                >
                  <span>{t('pagNext') || 'Next'}</span>
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SHARED UNIFIED CARGO REGISTRATION MODAL (LOCKED TO FTL FOR CONTAINER TRACKING) */}
      <CargoRegistrationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setDuplicateFromId(null);
        }}
        onSuccess={loadShipments}
        editingId={editingShipmentId}
        duplicateFromId={duplicateFromId}
        initialCargoType="FTL"
        lockCargoType="FTL"
      />

      {/* Cargo Registration Details Modal */}
      <CargoRegistrationDetailsModal
        isOpen={!!detailsModalItem}
        item={detailsModalItem}
        onClose={() => setDetailsModalItem(null)}
        onEdit={(item) => {
          setDetailsModalItem(null);
          handleOpenEdit(item);
        }}
        onDuplicate={(item) => {
          setDetailsModalItem(null);
          handleOpenDuplicate(item);
        }}
      />

      {/* DEDICATED CARGO FILTER MODAL (CARGO TYPE HIDDEN & FIXED TO FTL) */}
      <CargoFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        hideCargoType={true}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          setStatusFilter(newFilters.status ? newFilters.status.toLowerCase() : 'all');
          setPage(1);
        }}
        onResetFilters={handleClearAllFilters}
      />

      {/* Single shipment deletion – general DeletionApprovalModal with custom content */}
      <DeletionApprovalModal
        isOpen={!!pendingSingleDelete}
        onClose={() => !isDeleting && setPendingSingleDelete(null)}
        onConfirm={handleConfirmSingleDelete}
        isBusy={isDeleting}
        title={t('confirmDeleteShipment')}
        description={t('deleteShipmentDetail')}
        confirmLabel={t('actionDelete')}
        cancelLabel={t('actionCancel')}
        entityPreview={
          pendingSingleDelete ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('deleteModalContainer')}
                </span>
                <span
                  className="font-mono text-xs font-bold text-foreground truncate max-w-[190px]"
                  title={pendingSingleDelete.container_truck_id}
                >
                  {pendingSingleDelete.container_truck_id}
                </span>
              </div>
              <div className="h-px bg-border/60" />
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="space-y-0.5">
                  <div className="text-muted-foreground font-semibold">
                    {t('deleteModalClient')}
                  </div>
                  <div className="font-semibold text-foreground truncate">
                    {pendingSingleDelete.client_full_name || '—'}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-muted-foreground font-semibold">{t('deleteModalCargo')}</div>
                  <div className="font-medium text-foreground truncate">
                    {pendingSingleDelete.cargo || '—'}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-muted-foreground font-semibold">{t('deleteModalRoute')}</div>
                  <div className="font-medium text-foreground truncate">
                    {pendingSingleDelete.confirmed_date || pendingSingleDelete.loaded_date || '—'}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-muted-foreground font-semibold">
                    {t('deleteModalStatus')}
                  </div>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border bg-muted/50 border-border/60">
                    {pendingSingleDelete.status ? getStatusLabel(pendingSingleDelete.status) : '—'}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-mono">
                <span className="px-2 py-1 rounded-lg bg-muted/50 border border-border/60">
                  {t('deleteModalBuy')}:{' '}
                  {formatMoney(
                    Number(pendingSingleDelete.purchase_price?.amount || 0),
                    (pendingSingleDelete.purchase_price?.currency as any) || 'USD'
                  )}
                </span>
                <span className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  {t('deleteModalSell')}:{' '}
                  {formatMoney(Number(pendingSingleDelete.sell_price?.amount || 0), 'USD')}
                </span>
                <span
                  className={`px-2 py-1 rounded-lg border font-bold ${
                    Number(
                      pendingSingleDelete.net_yield?.amount_usd ??
                        (typeof pendingSingleDelete.net_yield === 'number'
                          ? pendingSingleDelete.net_yield
                          : pendingSingleDelete.net_yield?.amount) ??
                        0
                    ) >= 0
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {t('deleteModalMargin')}:{' '}
                  {formatMoney(
                    Number(
                      pendingSingleDelete.net_yield?.amount_usd ??
                        (typeof pendingSingleDelete.net_yield === 'number'
                          ? pendingSingleDelete.net_yield
                          : pendingSingleDelete.net_yield?.amount) ??
                        0
                    ),
                    'USD'
                  )}
                </span>
              </div>
            </div>
          ) : undefined
        }
        consequences={[
          t('deleteShipmentConsequencePermanent'),
          t('deleteShipmentConsequenceTotals'),
          t('deleteShipmentConsequenceConsolidation'),
        ]}
      />

      {/* Batch delete – general component, custom bulk content */}
      <DeletionApprovalModal
        isOpen={pendingBatchDelete}
        onClose={() => !isDeleting && setPendingBatchDelete(false)}
        onConfirm={handleConfirmBatchDelete}
        isBusy={isDeleting}
        title={t('confirmDeleteBatchShipment', { count: selectedIds.length })}
        description={t('deleteBatchShipmentDetail', { count: selectedIds.length })}
        confirmLabel={t('actionDelete')}
        cancelLabel={t('actionCancel')}
        entityPreview={
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <div className="size-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600">
                <Trash2 className="size-3.5" />
              </div>
              <span>{t('deleteModalContainersSelected', { count: selectedIds.length })}</span>
            </div>
            <div className="max-h-28 overflow-y-auto rounded-xl bg-muted/30 border border-border/60 p-2 flex flex-wrap gap-1.5">
              {selectedIds.slice(0, 12).map((id) => {
                const s = items.find((x) => x.id === id);
                return (
                  <span
                    key={id}
                    className="px-2 py-1 rounded-full bg-surface border border-border text-[11px] font-mono font-semibold"
                  >
                    {s?.container_truck_id || id.slice(0, 8)}
                  </span>
                );
              })}
              {selectedIds.length > 12 && (
                <span className="px-2 py-1 rounded-full bg-muted border border-border text-[11px] font-bold">
                  {t('deleteModalMore', { count: selectedIds.length - 12 })}
                </span>
              )}
            </div>
          </div>
        }
        consequences={[
          t('deleteBatchConsequenceAllRemoved', { count: selectedIds.length }),
          t('deleteBatchConsequenceRecalc'),
          t('deleteBatchConsequenceUndo'),
        ]}
      />
    </div>
  );
}
