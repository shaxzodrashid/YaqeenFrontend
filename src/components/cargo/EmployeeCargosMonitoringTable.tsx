import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  RefreshCw,
  Copy,
  Check,
  Layers,
  FileCheck,
  ShieldCheck,
  TrendingUp,
  Info,
  Edit2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { usePermissions } from '../../context/PermissionsContext';
import { EmployeeSelect } from './EmployeeSelect';
import { salesManagerKpiApi } from '../../services/salesManagerKpi.service';
import type {
  CargoMonitoringItem,
  CargoMonitoringMeta,
  CargoPaymentStatus,
} from '../../types/salesManagerKpi';
import {
  UpdateCargoPaymentModal,
  ConfirmCargoKpiModal,
  BulkPaymentStatusModal,
  BulkConfirmKpiModal,
} from './SalesManagerKpiModals';

interface EmployeeCargosMonitoringTableProps {
  initialEmployeeId?: string;
  initialMonth?: string;
}

export function EmployeeCargosMonitoringTable({
  initialEmployeeId = '',
  initialMonth = '2026-08',
}: EmployeeCargosMonitoringTableProps) {
  const { showNotification } = useNotification();
  const { canUpdate } = usePermissions();

  // Filters State
  const [month, setMonth] = useState<string>(initialMonth);
  const [employeeId, setEmployeeId] = useState<string>(initialEmployeeId);
  const [paymentStatus, setPaymentStatus] = useState<CargoPaymentStatus>('all');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(50);

  // Data State
  const [items, setItems] = useState<CargoMonitoringItem[]>([]);
  const [meta, setMeta] = useState<CargoMonitoringMeta | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Selection State for Bulk Operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedTruckId, setCopiedTruckId] = useState<string | null>(null);

  // Modals State
  const [activePaymentCargo, setActivePaymentCargo] = useState<CargoMonitoringItem | null>(null);
  const [activeConfirmKpiCargo, setActiveConfirmKpiCargo] = useState<CargoMonitoringItem | null>(
    null
  );
  const [isBulkPayModalOpen, setIsBulkPayModalOpen] = useState<boolean>(false);
  const [isBulkConfirmKpiModalOpen, setIsBulkConfirmKpiModalOpen] = useState<boolean>(false);

  // Fetch Cargos Monitoring
  const loadCargos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salesManagerKpiApi.getCargosMonitoring({
        employee_id: employeeId || undefined,
        month: month || undefined,
        payment_status: paymentStatus !== 'all' ? paymentStatus : undefined,
        search: search || undefined,
        page,
        limit,
      });

      setItems(res.data || []);
      setMeta(res.meta || null);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to load assigned cargos monitoring', 'error');
    } finally {
      setLoading(false);
    }
  }, [employeeId, month, paymentStatus, search, page, limit, showNotification]);

  useEffect(() => {
    loadCargos();
  }, [loadCargos]);

  // Handle Copy Truck ID
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTruckId(text);
    setTimeout(() => setCopiedTruckId(null), 2000);
  };

  // Selection Handlers
  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((it) => it.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Modal Confirm Handlers
  const handleUpdatePaymentStatus = async (
    cargoId: string,
    status: 'waiting' | 'unpaid' | 'paid',
    deadlineDays?: number
  ) => {
    try {
      await salesManagerKpiApi.updateCargoPaymentStatus(cargoId, {
        payment_status: status,
        payment_deadline_days: deadlineDays,
      });
      showNotification('Payment status updated successfully', 'success');
      loadCargos();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update payment status', 'error');
    }
  };

  const handleConfirmKpi = async (cargoId: string, isReceived: boolean, notes?: string) => {
    try {
      await salesManagerKpiApi.confirmCargoKpi(cargoId, {
        is_kpi_received: isReceived,
        review_notes: notes,
      });
      showNotification(
        isReceived ? 'KPI bonus confirmed as received' : 'KPI status reset to pending',
        'success'
      );
      loadCargos();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to confirm KPI bonus', 'error');
    }
  };

  const handleBulkPaymentStatus = async (status: 'waiting' | 'unpaid' | 'paid') => {
    if (selectedIds.length === 0) return;
    try {
      const res = await salesManagerKpiApi.bulkUpdatePaymentStatus({
        cargo_ids: selectedIds,
        payment_status: status,
      });
      showNotification(res.message || `Updated ${selectedIds.length} cargos`, 'success');
      setSelectedIds([]);
      loadCargos();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to bulk update payment status', 'error');
    }
  };

  const handleBulkConfirmKpi = async (isReceived: boolean) => {
    try {
      const res = await salesManagerKpiApi.bulkConfirmKpi({
        employee_id: employeeId || '',
        month,
        is_kpi_received: isReceived,
      });
      showNotification(res.message || 'Bulk KPI confirmation recorded', 'success');
      loadCargos();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to bulk confirm KPI bonuses', 'error');
    }
  };

  // Helper Badge Renderers
  const getPaymentStatusBadge = (status: string, days?: number) => {
    switch (status) {
      case 'paid':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="size-3.5" />
            To'landi (Paid)
          </span>
        );
      case 'waiting':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 inline-flex items-center gap-1.5 shadow-2xs">
            <Clock className="size-3.5" />
            Kutilmoqda {days ? `(${days}d)` : ''}
          </span>
        );
      case 'unpaid':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 inline-flex items-center gap-1.5 shadow-2xs">
            <AlertTriangle className="size-3.5" />
            Klient bermadi
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* TOP SUMMARY METRICS & REAL FINANCIAL EXPENSE CARDS                */}
      {/* ----------------------------------------------------------------- */}
      {meta && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Cargos & Deals Volume */}
            <div className="p-5 rounded-2xl bg-surface dark:bg-surface border border-border shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-muted-foreground uppercase tracking-wider">
                  Total Cargos & Status
                </span>
                <span className="p-2 rounded-xl bg-blue-500/15 text-blue-500 border border-blue-500/30">
                  <Truck className="size-4" />
                </span>
              </div>
              <div>
                <div className="text-2xl font-black text-foreground">
                  {meta.total_cargos}{' '}
                  <span className="text-xs font-semibold text-muted-foreground">shipments</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-border text-[11px]">
                  <span className="text-emerald-500 font-bold">
                    ✓ {meta.paid_cargos_count} paid
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-amber-500 font-bold">
                    ⏳ {meta.waiting_cargos_count} waiting
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-rose-500 font-bold">
                    ✕ {meta.unpaid_cargos_count} unpaid
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Financial Yield & Average Check */}
            <div className="p-5 rounded-2xl bg-surface dark:bg-surface border border-border shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-muted-foreground uppercase tracking-wider">
                  Total Net Margin (Profit)
                </span>
                <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  <TrendingUp className="size-4" />
                </span>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  ${meta.total_profit?.toLocaleString()}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border text-[11px] text-muted-foreground">
                  <span>
                    Avg Check: <strong className="text-foreground">${meta.average_check}</strong>
                  </span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      meta.is_sr_check_achieved
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : 'bg-amber-500/15 text-amber-500'
                    }`}
                  >
                    {meta.is_sr_check_achieved ? 'SR Check Met' : 'SR Check Low'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: KPI Rate & Potential Bonus */}
            <div className="p-5 rounded-2xl bg-surface dark:bg-surface border border-border shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-muted-foreground uppercase tracking-wider">
                  Current KPI Rate & Potential
                </span>
                <span className="p-2 rounded-xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                  <DollarSign className="size-4" />
                </span>
              </div>
              <div>
                <div className="text-2xl font-black text-brand-gold">
                  {meta.current_kpi_rate_percentage}{' '}
                  <span className="text-xs font-semibold text-muted-foreground">
                    (${meta.total_potential_kpi_bonus?.toLocaleString()} pot.)
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border text-[11px] text-muted-foreground">
                  <span>Buy: ${meta.total_buy_price?.toLocaleString()}</span>
                  <span>Sell: ${meta.total_sell_price?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Card 4: Real Realized Expense & Realized Earnings */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-navy/15 via-brand-royal/10 to-brand-navy/15 border border-brand-gold/40 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-brand-gold uppercase tracking-wider">
                  Real Company KPI Expense
                </span>
                <span className="p-2 rounded-xl bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                  <ShieldCheck className="size-4" />
                </span>
              </div>
              <div>
                <div className="text-2xl font-black text-brand-gold">
                  ${meta.real_kpi_expense?.toLocaleString()}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-brand-gold/30 text-[11px]">
                  <span className="text-muted-foreground">Realized Total:</span>
                  <strong className="text-foreground font-black text-sm">
                    ${meta.total_earnings_realized?.toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Real Expense Important Rule Callout Banner */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-foreground flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Info className="size-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-600 dark:text-amber-400 block sm:inline">
                  Real Financial Expense Rule:
                </strong>{' '}
                <span className="text-muted-foreground">
                  Unpaid and waiting cargos <strong>are NOT registered to company expense</strong>{' '}
                  for KPI payout. Employees only realize and receive their KPI payout for{' '}
                  <strong>paid cargos</strong> (${meta.real_kpi_expense?.toLocaleString()}).
                </span>
              </div>
            </div>

            {canUpdate('cargo_kpi') && (
              <button
                onClick={() => setIsBulkConfirmKpiModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-navy to-brand-royal text-white text-xs font-bold border border-brand-gold/30 shadow-xs hover:brightness-110 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <FileCheck className="size-3.5 text-brand-gold" />
                <span>Bulk Confirm Month KPI</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* FILTER & SEARCH BAR                                               */}
      {/* ----------------------------------------------------------------- */}
      <div className="p-5 rounded-2xl bg-surface dark:bg-surface border border-border shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Month Picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Month:</span>
              <input
                type="month"
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:border-brand-gold cursor-pointer"
              />
            </div>

            {/* Employee Selector */}
            <div className="w-56">
              <EmployeeSelect
                value={employeeId}
                onChange={(val) => {
                  setEmployeeId(val);
                  setPage(1);
                }}
                placeholder="All Sales Managers"
              />
            </div>

            {/* Payment Status Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-muted border border-border text-xs font-bold">
              {(['all', 'paid', 'waiting', 'unpaid'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setPaymentStatus(st);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer capitalize ${
                    paymentStatus === st
                      ? 'bg-surface text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st === 'all'
                    ? 'All Statuses'
                    : st === 'paid'
                      ? "To'landi"
                      : st === 'waiting'
                        ? 'Kutilmoqda'
                        : 'Klient bermadi'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search truck, client, cargo..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:border-brand-gold"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadCargos}
              disabled={loading}
              className="p-2 rounded-xl border border-border hover:bg-muted/40 text-foreground transition-all cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar (Shown when items are selected) */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-brand-gold/15 text-brand-gold border border-brand-gold/30 text-xs font-black">
                  {selectedIds.length} cargos selected
                </span>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
                >
                  Deselect all
                </button>
              </div>

              {canUpdate('cargo_kpi') && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsBulkPayModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-navy to-brand-royal text-white border border-brand-gold/30 shadow-xs hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Layers className="size-3.5 text-brand-gold" />
                    <span>Change Payment Status</span>
                  </button>

                  <button
                    onClick={() => handleBulkPaymentStatus('paid')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all cursor-pointer"
                  >
                    Mark as Paid
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* DATA TABLE (IMAGE 2 FORMAT)                                       */}
      {/* ----------------------------------------------------------------- */}
      <div className="rounded-2xl bg-surface dark:bg-surface border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted/60 text-muted-foreground font-bold border-b border-border uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selectedIds.length === items.length}
                    onChange={handleSelectAll}
                    className="rounded cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 text-center w-12">#</th>
                <th className="py-3 px-3">Truck / Container</th>
                <th className="py-3 px-3">Client & Contact</th>
                <th className="py-3 px-3">Cargo Details</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Buy Price</th>
                <th className="py-3 px-3 text-right">Sell Price</th>
                <th className="py-3 px-3 text-right">Profit</th>
                <th className="py-3 px-3 text-center">KPI %</th>
                <th className="py-3 px-3 text-right">Cargo Bonus</th>
                <th className="py-3 px-3 text-center">Payment Status</th>
                <th className="py-3 px-3 text-center">KPI Received</th>
                <th className="py-3 px-3 text-center w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="size-6 animate-spin mx-auto text-brand-gold mb-2" />
                    <span>Loading assigned cargos monitoring...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-muted-foreground">
                    <Truck className="size-8 mx-auto opacity-40 mb-2" />
                    <p className="font-semibold text-foreground">No cargos found for this filter</p>
                    <p className="text-[11px] mt-0.5">
                      Try adjusting month, status, or search keywords.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((cargo, idx) => {
                  const isSelected = selectedIds.includes(cargo.id);
                  return (
                    <tr
                      key={cargo.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        isSelected ? 'bg-brand-gold/5' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(cargo.id)}
                          className="rounded cursor-pointer"
                        />
                      </td>

                      {/* Index */}
                      <td className="py-3 px-3 text-center font-bold text-muted-foreground">
                        {cargo.index || idx + 1}
                      </td>

                      {/* Truck / Container ID */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-bold text-foreground">
                          <span>{cargo.container_truck_id}</span>
                          <button
                            onClick={() => handleCopy(cargo.container_truck_id)}
                            className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                            title="Copy ID"
                          >
                            {copiedTruckId === cargo.container_truck_id ? (
                              <Check className="size-3 text-emerald-500" />
                            ) : (
                              <Copy className="size-3 opacity-60 hover:opacity-100" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                          {cargo.source || 'cargo_registration'}
                        </span>
                      </td>

                      {/* Client Info */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-foreground truncate max-w-[150px]">
                          {cargo.client_name || '—'}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                          {cargo.client_company || cargo.client_phone || '—'}
                        </div>
                      </td>

                      {/* Cargo Description & Type */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-foreground truncate max-w-[140px]">
                          {cargo.cargo || 'General Cargo'}
                        </div>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            cargo.cargo_type === 'FTL'
                              ? 'bg-blue-500/15 text-blue-500'
                              : 'bg-purple-500/15 text-purple-500'
                          }`}
                        >
                          {cargo.cargo_type || 'FTL'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                        {cargo.confirmed_date || '—'}
                      </td>

                      {/* Buy Price */}
                      <td className="py-3 px-3 text-right font-medium text-muted-foreground">
                        ${cargo.buy_price?.toLocaleString()}
                      </td>

                      {/* Sell Price */}
                      <td className="py-3 px-3 text-right font-semibold text-foreground">
                        ${cargo.sell_price?.toLocaleString()}
                      </td>

                      {/* Profit */}
                      <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        +${cargo.profit?.toLocaleString()}
                      </td>

                      {/* KPI Rate */}
                      <td className="py-3 px-3 text-center font-black text-brand-gold">
                        {cargo.current_kpi_rate_percentage || `${cargo.current_kpi_rate}%`}
                      </td>

                      {/* Cargo Bonus */}
                      <td className="py-3 px-3 text-right font-black text-foreground">
                        ${cargo.cargo_bonus_rounded || cargo.cargo_bonus}
                      </td>

                      {/* Payment Status Badge (clickable to update) */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => canUpdate('cargo_kpi') && setActivePaymentCargo(cargo)}
                          className={`${canUpdate('cargo_kpi') ? 'cursor-pointer hover:opacity-85' : 'cursor-default'}`}
                          title="Click to change payment status"
                        >
                          {getPaymentStatusBadge(cargo.payment_status, cargo.payment_deadline_days)}
                        </button>
                      </td>

                      {/* KPI Received Badge (clickable to toggle) */}
                      <td className="py-3 px-3 text-center">
                        {cargo.is_kpi_received ? (
                          <button
                            onClick={() =>
                              canUpdate('cargo_kpi') && setActiveConfirmKpiCargo(cargo)
                            }
                            className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="KPI bonus received and confirmed"
                          >
                            <CheckCircle2 className="size-3.5" />
                            Confirmed
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              canUpdate('cargo_kpi') && setActiveConfirmKpiCargo(cargo)
                            }
                            className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-muted text-muted-foreground hover:text-foreground border border-border inline-flex items-center gap-1 cursor-pointer"
                            title="Click to confirm receipt"
                          >
                            <Clock className="size-3.5" />
                            Pending
                          </button>
                        )}
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-3 text-center">
                        {canUpdate('cargo_kpi') && (
                          <button
                            onClick={() => setActivePaymentCargo(cargo)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                            title="Edit Cargo Payment & Deadline"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-t border-border text-xs text-muted-foreground">
          <div>
            Showing <strong className="text-foreground">{items.length}</strong> of{' '}
            <strong className="text-foreground">{totalCount}</strong> cargos
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none cursor-pointer"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-border hover:bg-muted/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="px-2 font-bold text-foreground">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-border hover:bg-muted/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* SUB-MODALS                                                        */}
      {/* ----------------------------------------------------------------- */}
      <UpdateCargoPaymentModal
        isOpen={!!activePaymentCargo}
        cargo={activePaymentCargo}
        onClose={() => setActivePaymentCargo(null)}
        onConfirm={handleUpdatePaymentStatus}
      />

      <ConfirmCargoKpiModal
        isOpen={!!activeConfirmKpiCargo}
        cargo={activeConfirmKpiCargo}
        onClose={() => setActiveConfirmKpiCargo(null)}
        onConfirm={handleConfirmKpi}
      />

      <BulkPaymentStatusModal
        isOpen={isBulkPayModalOpen}
        selectedCount={selectedIds.length}
        onClose={() => setIsBulkPayModalOpen(false)}
        onConfirm={handleBulkPaymentStatus}
      />

      <BulkConfirmKpiModal
        isOpen={isBulkConfirmKpiModalOpen}
        employeeName={meta?.employee_name}
        month={month}
        onClose={() => setIsBulkConfirmKpiModalOpen(false)}
        onConfirm={handleBulkConfirmKpi}
      />
    </div>
  );
}
