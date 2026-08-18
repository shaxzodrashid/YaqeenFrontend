import { useState, useEffect, useCallback } from 'react';
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
import { cargoRegistrationsApi, formatMoney } from '../../services/api';
import type {
  CargoRegistrationListItem,
  CargoRegistrationPaginatedResponse,
} from '../../services/api';
import { CargoRegistrationModal } from './CargoRegistrationModal';
import { CargoTransactionsTable } from './CargoTransactionsTable';
import { CargoFilterModal, INITIAL_CARGO_FILTERS } from './CargoFilterModal';
import type { CargoFilterState } from './CargoFilterModal';

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
        client_id: filters.client_id || undefined,
        employee_id: filters.employee_id || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
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
          // 2nd click: Invert to ASC
          setSortOrder('ASC');
        } else {
          // 3rd click: Cancel sorting completely!
          setSortBy(undefined);
          setSortOrder(undefined);
        }
      } else {
        if (currentOrder === 'ASC') {
          // 2nd click: Invert to DESC
          setSortOrder('DESC');
        } else {
          // 3rd click: Cancel sorting completely!
          setSortBy(undefined);
          setSortOrder(undefined);
        }
      }
    } else {
      // 1st click on new column: Start with default direction
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
        return t('colContainerNo');
      case 'cargo':
        return t('colCargoAndAgent');
      case 'client_name':
        return t('colClient');
      case 'employee_name':
        return t('colEmployee');
      case 'purchase_price':
        return t('colBuyPrice');
      case 'sell_price':
        return t('colSellPrice');
      case 'net_yield':
        return t('colNetYield');
      case 'confirmed_date':
        return t('colConfirmedDate');
      case 'loaded_date':
        return t('colLoadedDate');
      case 'arrived_date':
        return t('colArrivedDate');
      case 'created_at':
        return t('colCreatedAt');
      case 'status':
        return t('colStatus');
      default:
        return field;
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CargoRegistrationListItem) => {
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        t('confirmDeleteCargoReg') || 'Are you sure you want to delete this cargo registration?'
      )
    )
      return;
    try {
      await cargoRegistrationsApi.delete(id);
      showNotification(
        t('successCargoRegDeleted') || 'Cargo registration deleted successfully',
        'success'
      );
      loadRegistrations();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete registration', 'error');
    }
  };

  // Calculate active filter count
  const activeFilterCount = Object.entries(filters).filter(
    ([key, val]) => val !== '' && key !== 'client_name' && key !== 'employee_name'
  ).length;

  const handleRemoveFilterTag = (key: keyof CargoFilterState) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: '' };
      if (key === 'client_id') next.client_name = '';
      if (key === 'employee_id') next.employee_name = '';
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
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
      />

      {/* SHARED UNIFIED CARGO REGISTRATION MODAL */}
      <CargoRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadRegistrations}
        editingId={editingId}
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
    </div>
  );
}
