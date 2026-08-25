import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  TrendingUp,
  RefreshCw,
  Coins,
  Filter,
  X,
  ArrowUpDown,
  Truck,
  AlertCircle,
} from 'lucide-react';
import { T } from '../T';
import { useNotification } from '../../context/NotificationContext';
import { usePermissions } from '../../context/PermissionsContext';
import { useTranslation } from '../../context/LanguageContext';
import { cargoRegistrationsApi, formatMoney, TRANSPORT_TYPE_LABELS } from '../../services/api';
import type {
  CargoRegistrationListItem,
  CargoRegistrationPaginatedResponse,
} from '../../services/api';
import { CargoRegistrationModal } from './CargoRegistrationModal';
import { CargoTransactionsTable } from './CargoTransactionsTable';
import {
  CargoFilterModal,
  INITIAL_CARGO_FILTERS,
  getActiveCargoFilterCount,
} from './CargoFilterModal';
import type { CargoFilterState } from './CargoFilterModal';
import { DeletionApprovalModal } from '../ui/DeletionApprovalModal';

export function CargoTransactionsTab() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canCreate } = usePermissions();

  // List & Filter State
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [filters, setFilters] = useState<CargoFilterState>(INITIAL_CARGO_FILTERS);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC' | undefined>(undefined);

  const [data, setData] = useState<CargoRegistrationPaginatedResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [duplicateFromId, setDuplicateFromId] = useState<string | null>(null);

  // Deletion approval state (professional workflow)
  const [pendingDelete, setPendingDelete] = useState<CargoRegistrationListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch Cargo Registrations
  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cargoRegistrationsApi.list({
        page,
        limit,
        search: search.trim() || undefined,
        status: filters.status || undefined,
        cargo_type: filters.cargo_type || undefined,
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
        sort_by: sortBy,
        sort_order: sortOrder,
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
      });
      setData(res);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to load cargo registrations', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filters, sortBy, sortOrder, showNotification]);

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
      'net_profit',
      'margin_percent',
    ].includes(field);

    if (sortBy !== field) {
      setSortBy(field);
      setSortOrder(isDescDefault ? 'DESC' : 'ASC');
    } else if (sortOrder === (isDescDefault ? 'DESC' : 'ASC')) {
      setSortOrder(isDescDefault ? 'ASC' : 'DESC');
    } else {
      setSortBy(undefined);
      setSortOrder(undefined);
    }
    setPage(1);
  };

  const handleResetSort = () => {
    setSortBy(undefined);
    setSortOrder(undefined);
    setPage(1);
  };

  const getSortFieldLabel = (field?: string): string => {
    if (!field) return '';
    switch (field) {
      case 'created_at':
        return t('colCreatedAt') || 'Created Date';
      case 'confirmed_date':
        return t('colConfirmedDate') || 'Confirmed Date';
      case 'loaded_date':
        return t('colLoadedDate') || 'Loaded Date';
      case 'arrived_date':
        return t('colArrivedDate') || 'Arrived Date';
      case 'purchase_date':
        return t('colPurchaseDate') || 'Purchase Date';
      case 'sell_date':
        return t('colSellDate') || 'Sell Date';
      case 'purchase_price':
        return t('colPurchasePrice') || 'Purchase Cost';
      case 'sell_price':
        return t('colSellPrice') || 'Sale Revenue';
      case 'net_profit':
        return t('colNetProfit') || 'Net Profit';
      case 'margin_percent':
        return t('colMarginPercent') || 'Margin %';
      case 'container_number':
        return t('colContainerTruckId') || 'Container #';
      case 'status':
        return t('colStatus') || 'Status';
      default:
        return field;
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setDuplicateFromId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CargoRegistrationListItem) => {
    setEditingId(item.id);
    setDuplicateFromId(null);
    setIsModalOpen(true);
  };

  const handleOpenDuplicate = (item: CargoRegistrationListItem) => {
    setEditingId(null);
    setDuplicateFromId(item.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    // Open professional deletion approval modal
    // Resolve full item for rich preview; fallback to id-only if not in current page
    const item = data?.data.find((r) => r.id === id) ?? null;
    if (item) setPendingDelete(item);
    else
      setPendingDelete({
        id,
        container_truck_id: id,
        cargo: '—',
        client_full_name: '—',
      } as CargoRegistrationListItem);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await cargoRegistrationsApi.delete(pendingDelete.id);
      showNotification(
        t('successCargoRegDeleted') || 'Cargo registration deleted successfully',
        'success'
      );
      setPendingDelete(null);
      loadRegistrations();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete registration', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate active filter count
  const activeFilterCount = useMemo(() => getActiveCargoFilterCount(filters), [filters]);

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
    setPage(1);
  };

  const handleClearAllFilters = () => {
    setFilters(INITIAL_CARGO_FILTERS);
    setPage(1);
  };

  const isCustomSortActive = Boolean(sortBy);
  const hasActiveFiltersOrSort =
    activeFilterCount > 0 || isCustomSortActive || Boolean(search.trim());

  const handleClearAll = () => {
    setFilters(INITIAL_CARGO_FILTERS);
    setSearch('');
    setSortBy(undefined);
    setSortOrder(undefined);
    setPage(1);
  };

  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
            <Receipt className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">
                <T k="tabTransactions" />
              </h2>
              {meta?.active_containers !== undefined && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1.5 shadow-xs">
                  <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span>
                    {meta.active_containers} {t('activeCountLabel') || 'Active'}
                  </span>
                </span>
              )}
              {meta?.action_required !== undefined && meta.action_required > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5 shadow-xs">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  <span>
                    {meta.action_required} {t('actionRequiredLabel') || 'Action Required'}
                  </span>
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              <T k="cargoTransactionsTabDesc" />
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Search with Clear button */}
          <div className="relative rounded-xl shadow-sm">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t('searchCargoPlaceholder') || 'Search truck ID, cargo...'}
              className="pl-9 pr-8 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50 w-44 sm:w-56"
            />
            <Search className="size-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground absolute right-2 top-2 transition-colors cursor-pointer"
                title={t('clearSearch') || 'Clear search'}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Filter Trigger Button (Filter | x when active, Filter when clear) */}
          {activeFilterCount > 0 ? (
            <div className="inline-flex items-center rounded-xl border border-brand-gold text-brand-gold bg-brand-gold/10 font-bold text-xs shadow-xs">
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
              className="px-3.5 py-2 rounded-xl border border-border text-foreground hover:bg-muted/50 text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
              title={t('cargoFilterModalTitle')}
            >
              <Filter className="size-4" />
              <span>{t('filterBtn')}</span>
            </button>
          )}

          <button
            onClick={loadRegistrations}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border hover:bg-muted text-foreground transition-all cursor-pointer"
            title={t('refreshList') || 'Refresh list'}
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canCreate('cargo_registrations') && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-gold to-amber-500 hover:from-brand-gold/90 hover:to-amber-500/90 text-brand-navy font-bold text-xs shadow-md shadow-brand-gold/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="size-4" />
              <span>
                <T k="btnRegisterCargo" />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filters, Search & Sort Tag Pills Bar */}
      {hasActiveFiltersOrSort && (
        <div className="p-3 rounded-2xl bg-surface dark:bg-surface border border-border/80 shadow-xs flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground font-bold text-[11px] uppercase tracking-wider mr-1">
            {t('activeFiltersLabel', {
              count: activeFilterCount + (isCustomSortActive ? 1 : 0) + (search ? 1 : 0),
            })}
            :
          </span>

          {search.trim() && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted text-foreground border border-border font-semibold text-[11px]">
              <Search className="size-3 text-brand-gold shrink-0" />
              <span className="truncate max-w-[140px]">"{search.trim()}"</span>
              <button
                onClick={() => {
                  setSearch('');
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
                {sortOrder === 'ASC' ? t('sortOrderAsc') || 'ASC' : t('sortOrderDesc') || 'DESC'})
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
              {t('statusSectionTitle')}: {filters.status}
              <button
                onClick={() => handleRemoveFilterTag('status')}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {filters.cargo_type && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/15 text-indigo-500 border border-indigo-500/30 font-semibold text-[11px]">
              {t('cargoTypeLabel')}: {filters.cargo_type}
              <button
                onClick={() => handleRemoveFilterTag('cargo_type')}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {filters.container_type && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/15 text-blue-500 border border-blue-500/30 font-semibold text-[11px]">
              {t('containerTypeLabel')}: {filters.container_type}
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
              {filters.transport_types.map((tt) => TRANSPORT_TYPE_LABELS[tt] || tt).join(', ')}
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
              {t('clientLabel')}: {filters.client_name || 'Selected'}
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
              {t('assignedEmployeeLabel')}: {filters.employee_name || 'Selected'}
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30 font-semibold text-[11px]">
              {t('purchaseDateRange')}: {filters.purchase_start_date || '...'} ~{' '}
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-semibold text-[11px]">
              {t('sellDateRange')}: {filters.sell_start_date || '...'} ~{' '}
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
              {t('creationDateRange')}: {filters.created_start_date || '...'} ~{' '}
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
              {t('confirmedDateRange')}: {filters.confirmed_start_date || '...'} ~{' '}
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
              {t('loadedDateRange')}: {filters.loaded_start_date || '...'} ~{' '}
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
              {t('arrivedDateRange')}: {filters.arrived_start_date || '...'} ~{' '}
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
            onClick={handleClearAll}
            className="ml-auto text-[11px] text-rose-500 hover:underline font-bold cursor-pointer"
          >
            {t('cancelFiltersBtn')}
          </button>
        </div>
      )}

      {/* Operational & Financial 4-Card Summary Metrics (Clean Single USD Layout) */}
      {meta ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 min-w-0">
          {/* Card 1: Active Containers */}
          <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs flex items-center justify-between gap-3 min-w-0">
            <div className="space-y-1 min-w-0">
              <span className="text-xs font-medium text-muted-foreground block truncate">
                <T k="lblActiveContainers" />
              </span>
              <h3 className="text-2xl font-black text-foreground tracking-tight truncate">
                {meta.active_containers ?? 0}
              </h3>
              <span className="text-[11px] text-muted-foreground block truncate">
                {meta.total} <T k="lblUnits" /> <T k="lblEnRoute" />
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
                  (meta.action_required ?? 0) > 0 ? 'text-amber-500' : 'text-foreground'
                }`}
              >
                {meta.action_required ?? 0}
              </h3>
              <span className="text-[11px] text-muted-foreground block truncate">
                {(meta.action_required ?? 0) > 0
                  ? t('subActionRequired') || 'Waiting & reload checkpoints'
                  : t('subAllClear') || 'All operations on track'}
              </span>
            </div>
            <div
              className={`p-3 rounded-xl border shrink-0 ${
                (meta.action_required ?? 0) > 0
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
                  meta.calculated_net_yield.total_usd ?? meta.calculated_net_yield.USD,
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
                  meta.gross_sales_revenue.total_usd_equivalent ?? meta.gross_sales_revenue.USD,
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
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 min-w-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-surface border border-border shadow-xs flex items-center justify-between gap-3 h-[92px]"
            >
              <div className="space-y-2">
                <div className="w-24 h-3.5 rounded skeleton-shimmer" />
                <div className="w-16 h-6 rounded skeleton-shimmer" />
              </div>
              <div className="size-11 rounded-xl skeleton-shimmer shrink-0" />
            </div>
          ))}
        </div>
      ) : null}

      {/* Reusable Cargo Registrations Table Component */}
      <CargoTransactionsTable
        data={data}
        loading={loading}
        page={page}
        setPage={setPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onDuplicate={handleOpenDuplicate}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
      />

      {/* SHARED UNIFIED CARGO REGISTRATION MODAL */}
      <CargoRegistrationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setDuplicateFromId(null);
        }}
        onSuccess={loadRegistrations}
        editingId={editingId}
        duplicateFromId={duplicateFromId}
      />

      {/* DEDICATED PROFESSIONAL FILTER MODAL */}
      <CargoFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          setPage(1);
        }}
        onResetFilters={handleClearAllFilters}
      />

      {/* Dedicated deletion approval modal – general component with custom cargo content */}
      <DeletionApprovalModal
        isOpen={!!pendingDelete}
        onClose={() => !isDeleting && setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        isBusy={isDeleting}
        title={t('confirmDeleteCargoReg')}
        description={t('deleteCargoRegDetail')}
        confirmLabel={t('actionDelete')}
        cancelLabel={t('actionCancel')}
        entityPreview={
          pendingDelete ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('deleteModalTruckContainer')}
                </span>
                <span
                  className="font-mono text-xs font-bold text-foreground truncate max-w-[180px]"
                  title={pendingDelete.container_truck_id}
                >
                  {pendingDelete.container_truck_id}
                </span>
              </div>
              <div className="h-px bg-border/60" />
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="space-y-0.5">
                  <div className="text-muted-foreground font-semibold">{t('deleteModalCargo')}</div>
                  <div className="font-bold text-foreground truncate" title={pendingDelete.cargo}>
                    {pendingDelete.cargo || '—'}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-muted-foreground font-semibold">
                    {t('deleteModalClient')}
                  </div>
                  <div
                    className="font-semibold text-foreground truncate"
                    title={pendingDelete.client_full_name}
                  >
                    {pendingDelete.client_full_name || '—'}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-muted-foreground font-semibold">{t('deleteModalRoute')}</div>
                  <div className="font-medium text-foreground truncate">
                    {[pendingDelete.origin_city, pendingDelete.destination_city]
                      .filter(Boolean)
                      .join(' → ') || '—'}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-muted-foreground font-semibold">
                    {t('deleteModalStatus')}
                  </div>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border bg-muted/50 border-border/60">
                    {pendingDelete.status || '—'}
                  </span>
                </div>
              </div>
              {(pendingDelete.purchase_price || pendingDelete.sell_price) && (
                <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono">
                  {pendingDelete.purchase_price && (
                    <span className="px-2 py-1 rounded-lg bg-muted/50 border border-border/60">
                      {t('deleteModalBuy')}:{' '}
                      {formatMoney(
                        pendingDelete.purchase_price.amount,
                        pendingDelete.purchase_price.currency
                      )}
                    </span>
                  )}
                  {pendingDelete.sell_price && (
                    <span className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      {t('deleteModalSell')}:{' '}
                      {formatMoney(
                        pendingDelete.sell_price.amount,
                        pendingDelete.sell_price.currency
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : undefined
        }
        consequences={[
          t('deleteCargoConsequencePermanent'),
          t('deleteCargoConsequenceRecalc'),
          t('deleteCargoConsequenceVolumeFreed'),
        ]}
      />
    </div>
  );
}
