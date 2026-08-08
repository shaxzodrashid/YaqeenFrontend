import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt,
  Plus,
  Search,
  TrendingUp,
  RefreshCw,
  X,
  Box,
  Coins,
  Eye,
  Edit2,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { T } from '../T';
import { useNotification } from '../../context/NotificationContext';
import { usePermissions } from '../../context/PermissionsContext';
import {
  cargoRegistrationsApi,
  CONTAINER_TYPES,
  formatMoney,
  currencyApi,
} from '../../services/api';
import type {
  CargoRegistrationStatus,
  CurrencyType,
  CargoRegistrationListItem,
  CargoRegistrationPaginatedResponse,
  CargoRegistrationDetail,
} from '../../services/api';
import { CargoRegistrationModal } from './CargoRegistrationModal';

const CARGO_STATUSES: CargoRegistrationStatus[] = [
  'Waiting',
  'In Transit',
  'Border',
  'At Station',
  'Delivered',
];

const CURRENCIES: CurrencyType[] = ['USD', 'UZS', 'RUB', 'RMB'];

export function CargoTransactionsTab() {
  const { showNotification } = useNotification();
  const { canCreate, canUpdate, canDelete } = usePermissions();

  // List & Filter State
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [cargoTypeFilter, setCargoTypeFilter] = useState<string>('');
  const [containerTypeFilter, setContainerTypeFilter] = useState<string>('');
  const [clientIdFilter, setClientIdFilter] = useState<string>('');
  const [employeeIdFilter, setEmployeeIdFilter] = useState<string>('');
  const [confirmedStartDate, setConfirmedStartDate] = useState<string>('');
  const [confirmedEndDate, setConfirmedEndDate] = useState<string>('');

  const [data, setData] = useState<CargoRegistrationPaginatedResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Details Modal State
  const [detailsItem, setDetailsItem] = useState<CargoRegistrationDetail | null>(null);

  const [rates, setRates] = useState<Record<string, number>>({
    USD: 12800,
    RUB: 140,
    RMB: 1780,
    UZS: 1,
  });

  // Fetch exchange rates from backend
  useEffect(() => {
    currencyApi.getExchangeRates()
      .then((res) => {
        if (res?.rates) {
          const newRates: Record<string, number> = { UZS: 1 };
          Object.entries(res.rates).forEach(([curr, item]) => {
            newRates[curr] = item.rate;
          });
          if (res.rates.CNY && !res.rates.RMB) {
            newRates.RMB = res.rates.CNY.rate;
          }
          setRates((prev) => ({ ...prev, ...newRates }));
        }
      })
      .catch(() => {});
  }, []);

  const getNetYield = useCallback((
    sellAmount: number,
    sellCurr: string,
    purchaseAmount: number,
    purchaseCurr: string,
    usdRmbRate?: number | null
  ) => {
    if (sellCurr === purchaseCurr) {
      return sellAmount - purchaseAmount;
    }

    const currentRates = { ...rates };
    if (usdRmbRate && usdRmbRate > 0) {
      const usdInUzs = currentRates.USD || 12800;
      currentRates.RMB = usdInUzs / usdRmbRate;
    }

    const pRate = currentRates[purchaseCurr] || 1;
    const sRate = currentRates[sellCurr] || 1;

    const purchaseInUzs = purchaseAmount * pRate;
    const purchaseInSellCurrency = purchaseInUzs / sRate;

    return sellAmount - purchaseInSellCurrency;
  }, [rates]);

  // Fetch Cargo Registrations
  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cargoRegistrationsApi.list({
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        cargo_type: cargoTypeFilter || undefined,
        container_type: containerTypeFilter || undefined,
        client_id: clientIdFilter || undefined,
        employee_id: employeeIdFilter || undefined,
        confirmed_start_date: confirmedStartDate || undefined,
        confirmed_end_date: confirmedEndDate || undefined,
      });
      setData(res);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to load cargo registrations', 'error');
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    search,
    statusFilter,
    cargoTypeFilter,
    containerTypeFilter,
    clientIdFilter,
    employeeIdFilter,
    confirmedStartDate,
    confirmedEndDate,
    showNotification,
  ]);

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

  const handleViewDetails = async (id: string) => {
    try {
      const detail = await cargoRegistrationsApi.get(id);
      setDetailsItem(detail);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to load details', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this cargo registration?')) return;
    try {
      await cargoRegistrationsApi.delete(id);
      showNotification('Cargo registration deleted successfully', 'success');
      loadRegistrations();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete registration', 'error');
    }
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
            <h2 className="text-xl font-bold text-foreground">
              <T k="tabTransactions" />
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Unified Cargo Registrations Hub — Register and manage all LTL & FTL shipments.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Search */}
          <div className="relative rounded-xl shadow-sm">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search truck ID, cargo..."
              className="pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50 w-44 sm:w-56"
            />
            <Search className="size-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
          </div>

          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              showFilters || statusFilter || cargoTypeFilter || clientIdFilter
                ? 'border-brand-gold text-brand-gold bg-brand-gold/10'
                : 'border-border text-foreground hover:bg-muted/50'
            }`}
            title="Toggle Filter Toolbar"
          >
            <Filter className="size-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>

          <button
            onClick={loadRegistrations}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border hover:bg-muted text-foreground transition-all cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canCreate('cargo_registrations') && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-gold to-amber-500 hover:from-brand-gold/90 hover:to-amber-500/90 text-brand-navy font-bold text-xs shadow-md shadow-brand-gold/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="size-4" />
              <span>Register Cargo</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-2xl bg-surface dark:bg-surface border border-border space-y-3 overflow-hidden shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <SlidersHorizontal className="size-3.5 text-brand-gold" />
                Filter Cargo Registrations
              </span>
              {(statusFilter || cargoTypeFilter || containerTypeFilter || clientIdFilter || employeeIdFilter || confirmedStartDate) && (
                <button
                  onClick={() => {
                    setStatusFilter('');
                    setCargoTypeFilter('');
                    setContainerTypeFilter('');
                    setClientIdFilter('');
                    setEmployeeIdFilter('');
                    setConfirmedStartDate('');
                    setConfirmedEndDate('');
                    setPage(1);
                  }}
                  className="text-[11px] text-rose-500 hover:underline font-semibold"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Status Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:ring-2 focus:ring-brand-gold/50"
                >
                  <option value="">All Statuses</option>
                  {CARGO_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cargo Type Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Cargo Type</label>
                <select
                  value={cargoTypeFilter}
                  onChange={(e) => {
                    setCargoTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:ring-2 focus:ring-brand-gold/50"
                >
                  <option value="">All Types (LTL & FTL)</option>
                  <option value="LTL">LTL (Groupage)</option>
                  <option value="FTL">FTL (Full Truck)</option>
                </select>
              </div>

              {/* Container Type Filter (FTL) */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Container Type</label>
                <select
                  value={containerTypeFilter}
                  onChange={(e) => {
                    setContainerTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:ring-2 focus:ring-brand-gold/50"
                >
                  <option value="">All Container Types</option>
                  {CONTAINER_TYPES.map((ct) => (
                    <option key={ct} value={ct}>
                      {ct}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Confirmed Date</label>
                <input
                  type="date"
                  value={confirmedStartDate}
                  onChange={(e) => {
                    setConfirmedStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:ring-2 focus:ring-brand-gold/50"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Financial Summary KPI Cards */}
      {meta && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Calculated Net Yield Card */}
          <div className="p-4 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="size-4" />
                <span>Calculated Net Yield</span>
              </div>
              <div className="flex items-center gap-1.5">
                {meta.calculated_net_yield.total_usd !== undefined && (
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Eq: {formatMoney(meta.calculated_net_yield.total_usd, 'USD')}
                  </span>
                )}
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Profit / Loss
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {CURRENCIES.map((curr) => {
                const val = (meta.calculated_net_yield as any)[curr] || 0;
                return (
                  <div key={curr} className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
                    <span className="text-[10px] font-bold text-muted-foreground block">{curr}</span>
                    <span
                      className={`text-xs font-extrabold truncate block ${
                        val > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : val < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-foreground'
                      }`}
                    >
                      {formatMoney(val, curr)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gross Sales Revenue Card */}
          <div className="p-4 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-gold">
                <Coins className="size-4" />
                <span>Gross Sales Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                {meta.gross_sales_revenue.total_usd_equivalent !== undefined && (
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                    Eq: {formatMoney(meta.gross_sales_revenue.total_usd_equivalent, 'USD')}
                  </span>
                )}
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                  Turnover
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {CURRENCIES.map((curr) => {
                const val = (meta.gross_sales_revenue as any)[curr] || 0;
                return (
                  <div key={curr} className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
                    <span className="text-[10px] font-bold text-muted-foreground block">{curr}</span>
                    <span className="text-xs font-extrabold text-foreground truncate block">
                      {formatMoney(val, curr)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Cargo Registrations Main Table */}
      <div className="rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                <th className="py-3 px-4">Container / Truck ID</th>
                <th className="py-3 px-4">Cargo & Agent</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Assigned Employee</th>
                <th className="py-3 px-4">Purchase Price</th>
                <th className="py-3 px-4">Sell Price</th>
                <th className="py-3 px-4">Net Yield</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="size-5 animate-spin text-brand-gold" />
                      <span>Loading cargo registrations...</span>
                    </div>
                  </td>
                </tr>
              ) : !data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <Box className="size-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-sm">No cargo registrations found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click "Register Cargo" above to submit a new LTL or FTL registration.
                    </p>
                  </td>
                </tr>
              ) : (
                data.data.map((item) => {
                  const netYieldVal = getNetYield(
                    item.sell_price?.amount ?? 0,
                    item.sell_price?.currency || 'USD',
                    item.purchase_price?.amount ?? 0,
                    item.purchase_price?.currency || 'USD',
                    item.usd_rmb_rate
                  );
                  const isPositive = netYieldVal > 0;
                  const isNegative = netYieldVal < 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Truck ID & Cargo Type */}
                      <td className="py-3 px-4 font-bold text-foreground whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                              item.cargo_type === 'FTL'
                                ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {item.cargo_type || 'LTL'}
                          </span>
                          <span>{item.container_truck_id}</span>
                        </div>
                      </td>

                      {/* Cargo Description & Agent */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-foreground">{item.cargo}</div>
                        <div className="text-[11px] text-muted-foreground">{item.agent_name}</div>
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4 text-foreground font-semibold">
                        {item.client_full_name || 'Client'}
                      </td>

                      {/* Employee */}
                      <td className="py-3 px-4 text-muted-foreground">
                        {item.employee_full_name || 'Employee'}
                      </td>

                      {/* Purchase Price */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-foreground">
                          {formatMoney(item.purchase_price?.amount || 0, item.purchase_price?.currency || 'USD')}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Date: {item.purchase_price?.date || item.purchase_date || 'N/A'}
                        </div>
                      </td>

                      {/* Sell Price */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-foreground">
                          {formatMoney(item.sell_price?.amount || 0, item.sell_price?.currency || 'USD')}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Date: {item.sell_price?.date || item.sell_date || 'N/A'}
                        </div>
                      </td>

                      {/* Net Yield & Rate */}
                      <td className="py-3 px-4 font-extrabold whitespace-nowrap">
                        <div
                          className={
                            isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isNegative
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-foreground'
                          }
                        >
                          {formatMoney(netYieldVal, item.sell_price?.currency || 'USD')}
                        </div>
                        {item.net_yield?.amount_usd !== undefined && item.sell_price?.currency !== 'USD' && (
                          <div className="text-[10px] text-muted-foreground font-semibold">
                            ≈ {formatMoney(item.net_yield.amount_usd, 'USD')}
                          </div>
                        )}
                        {item.usd_rmb_rate && (
                          <div className="text-[10px] font-semibold text-amber-500">
                            Rate: {item.usd_rmb_rate} RMB/USD
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1 border ${
                            item.status === 'Delivered'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : item.status === 'In Transit'
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                              : item.status === 'Border'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              : item.status === 'At Station'
                              ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                              : 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewDetails(item.id)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="size-4" />
                          </button>
                          {canUpdate('cargo_registrations') && (
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-brand-gold transition-colors cursor-pointer"
                              title="Edit Registration"
                            >
                              <Edit2 className="size-4" />
                            </button>
                          )}
                          {canDelete('cargo_registrations') && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                              title="Delete Registration"
                            >
                              <Trash2 className="size-4" />
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

        {/* Pagination Footer */}
        {data && data.meta.total > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20 text-xs">
            <span className="text-muted-foreground font-semibold">
              Showing {data.meta.offset + 1} to{' '}
              {Math.min(data.meta.offset + data.meta.limit, data.meta.total)} of {data.meta.total} cargos
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="size-3.5" />
                <span>Previous</span>
              </button>
              <span className="font-bold text-foreground px-2">Page {page}</span>
              <button
                disabled={data.meta.offset + data.meta.limit >= data.meta.total}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SHARED UNIFIED CARGO REGISTRATION MODAL */}
      <CargoRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadRegistrations}
        editingId={editingId}
      />

      {/* DETAILS READ-ONLY MODAL */}
      <AnimatePresence>
        {detailsItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-surface dark:bg-surface border border-border rounded-2xl shadow-2xl p-6 overflow-hidden text-foreground space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Receipt className="size-5 text-brand-gold" />
                  Cargo Registration Details
                </h3>
                <button
                  onClick={() => setDetailsItem(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-semibold">Container / Truck ID:</span>
                  <span className="font-extrabold text-foreground">{detailsItem.container_truck_id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-semibold">Cargo Type:</span>
                  <span className="font-bold text-foreground">{detailsItem.cargo_type}</span>
                </div>
                {detailsItem.cargo_type === 'LTL' ? (
                  <>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground font-semibold">Volume:</span>
                      <span className="font-semibold text-foreground">{detailsItem.volume} m³</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground font-semibold">Weight:</span>
                      <span className="font-semibold text-foreground">{detailsItem.weight} kg</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground font-semibold">Container Type:</span>
                    <span className="font-semibold text-foreground">{detailsItem.container_type || 'N/A'}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-semibold">Agent Name:</span>
                  <span className="font-semibold text-foreground">{detailsItem.agent_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-semibold">Cargo Item:</span>
                  <span className="font-semibold text-foreground">{detailsItem.cargo}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-semibold">Client:</span>
                  <span className="font-bold text-foreground">
                    {detailsItem.client
                      ? `${detailsItem.client.first_name} ${detailsItem.client.last_name}`
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-semibold">Assigned Employee:</span>
                  <span className="font-bold text-foreground">
                    {detailsItem.employee
                      ? `${detailsItem.employee.first_name} ${detailsItem.employee.last_name}`
                      : 'N/A'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-semibold">Purchase Price:</span>
                    <span className="font-bold text-foreground">
                      {formatMoney(detailsItem.purchase_price, detailsItem.purchase_currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                    <span>Purchase Reg. Date:</span>
                    <span className="font-semibold text-foreground">{detailsItem.purchase_date || 'N/A'}</span>
                  </div>
                  {detailsItem.purchase_amount_usd !== undefined && detailsItem.purchase_amount_usd !== null && (
                    <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                      <span>Equivalents (USD / UZS):</span>
                      <span className="font-semibold text-foreground">
                        {formatMoney(detailsItem.purchase_amount_usd, 'USD')} ({formatMoney(detailsItem.purchase_amount_uzs || 0, 'UZS')})
                      </span>
                    </div>
                  )}
                  {detailsItem.purchase_usd_rate && (
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                      <span>Snapshot Rate (UZS/USD):</span>
                      <span className="font-semibold">{detailsItem.purchase_usd_rate}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-semibold">Selling Price:</span>
                    <span className="font-bold text-foreground">
                      {formatMoney(detailsItem.sell_price, detailsItem.sell_currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                    <span>Sell Reg. Date:</span>
                    <span className="font-semibold text-foreground">{detailsItem.sell_date || 'N/A'}</span>
                  </div>
                  {detailsItem.sell_amount_usd !== undefined && detailsItem.sell_amount_usd !== null && (
                    <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                      <span>Equivalents (USD / UZS):</span>
                      <span className="font-semibold text-foreground">
                        {formatMoney(detailsItem.sell_amount_usd, 'USD')} ({formatMoney(detailsItem.sell_amount_uzs || 0, 'UZS')})
                      </span>
                    </div>
                  )}
                  {detailsItem.sell_usd_rate && (
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                      <span>Snapshot Rate (UZS/USD):</span>
                      <span className="font-semibold">{detailsItem.sell_usd_rate}</span>
                    </div>
                  )}
                </div>

                {(() => {
                  const netUsd = detailsItem.net_yield_details?.amount_usd ?? detailsItem.net_yield;
                  const netUzs = detailsItem.net_yield_details?.amount_uzs;
                  return (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Standardized Net Yield:</span>
                        <span className={`font-extrabold text-sm ${netUsd >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {formatMoney(netUsd, 'USD')}
                        </span>
                      </div>
                      {netUzs !== undefined && (
                        <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                          <span>UZS Equivalent:</span>
                          <span className={`font-semibold ${netUzs >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {formatMoney(netUzs, 'UZS')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {detailsItem.usd_rmb_rate && (
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground font-semibold">USD -&gt; RMB Cross Rate:</span>
                    <span className="font-bold text-amber-500">{detailsItem.usd_rmb_rate} RMB/USD</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-semibold">Status:</span>
                  <span className="font-bold text-brand-gold">{detailsItem.status}</span>
                </div>
                {detailsItem.description && (
                  <div className="pt-2">
                    <span className="text-muted-foreground font-semibold block mb-1">Notes:</span>
                    <p className="p-2.5 rounded-xl bg-muted/40 text-foreground font-medium">
                      {detailsItem.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 text-right">
                <button
                  onClick={() => setDetailsItem(null)}
                  className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
