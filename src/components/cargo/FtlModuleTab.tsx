import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import {
  cargoKpiApi,
  getFtlMonthlyRate,
  getFtlTimeMultiplier,
} from '../../services/cargoKpi.service';
import type {
  FtlSummaryResponse,
  FtlManagerSummary,
  FtlTruckItem,
} from '../../services/cargoKpi.service';

import { EmployeeSelect } from './EmployeeSelect';

const MONTHLY_RATE_TIERS = [
  { range: '< $1,500', rate: '0%' },
  { range: '$1,500 – $3,999', rate: '8%' },
  { range: '$4,000 – $4,999', rate: '10%' },
  { range: '$5,000 – $5,999', rate: '12%' },
  { range: '$6,000 – $6,999', rate: '14%' },
  { range: '$7,000 – $7,999', rate: '16%' },
  { range: '$8,000 – $9,999', rate: '18%' },
  { range: '≥ $10,000', rate: '24%' },
];

export function FtlModuleTab() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  const [month, setMonth] = useState<string>('2026-07');
  const [data, setData] = useState<FtlSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form state
  const [selectedManagerId, setSelectedManagerId] = useState<string>(
    'b1a2c3d4-e5f6-7890-abcd-ef1234567890'
  );
  const [agentPriceStr, setAgentPriceStr] = useState<string>('1000');
  const [sellPriceStr, setSellPriceStr] = useState<string>('2000');
  const [plannedDaysStr, setPlannedDaysStr] = useState<string>('20');
  const [actualDaysStr, setActualDaysStr] = useState<string>('25');
  const [kpiReceived, setKpiReceived] = useState<boolean>(false);
  const [qtyStr, setQtyStr] = useState<string>('1');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadFtlData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cargoKpiApi.getFtlSummary(month);
      setData(res);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to load FTL summary', 'error');
    } finally {
      setLoading(false);
    }
  }, [month, showNotification]);

  useEffect(() => {
    loadFtlData();
  }, [loadFtlData]);

  const handleToggleKpi = async (id: string) => {
    try {
      await cargoKpiApi.toggleFtlKpiReceived(id);
      showNotification('FTL KPI received status toggled', 'success');
      loadFtlData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update KPI status', 'error');
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ap = parseFloat(agentPriceStr) || 0;
    const sp = parseFloat(sellPriceStr) || 0;
    const pd = parseInt(plannedDaysStr, 10) || 0;
    const ad = parseInt(actualDaysStr, 10) || 0;
    const qty = Math.max(1, parseInt(qtyStr, 10) || 1);

    if (!selectedManagerId) {
      showNotification('Please select a manager.', 'warning');
      return;
    }

    if (sp <= ap) {
      showNotification('Sell price must be greater than agent price.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await cargoKpiApi.createFtlItem({
        manager_id: selectedManagerId,
        month,
        agent_price: ap,
        sell_price: sp,
        planned_days: pd,
        actual_days: ad,
        kpi_received: kpiReceived,
        qty,
      });
      showNotification(t('successTruckAdded') || 'FTL fura entry added successfully', 'success');
      setIsModalOpen(false);
      loadFtlData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to create FTL entry', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Preview calculations inside modal
  const modalPreview = useMemo(() => {
    const ap = parseFloat(agentPriceStr) || 0;
    const sp = parseFloat(sellPriceStr) || 0;
    const profit = Math.max(0, sp - ap);
    const pd = parseInt(plannedDaysStr, 10) || 0;
    const ad = parseInt(actualDaysStr, 10) || 0;
    const timeMult = getFtlTimeMultiplier(ad, pd);
    const estRate = getFtlMonthlyRate(profit);
    const estKpi = Math.round(profit * estRate * timeMult * 100) / 100;

    return { profit, timeMult, estKpi };
  }, [agentPriceStr, sellPriceStr, plannedDaysStr, actualDaysStr]);

  return (
    <div className="space-y-6">
      {/* Top Header & Month Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
            <Truck className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{t('tabFtlKpi')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Full Truck Load (FTL) fura profit multiplier & KPI tracking
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Input */}
          <div className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="size-4 text-brand-gold" />
            <span className="text-muted-foreground font-medium">Month:</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-transparent text-foreground font-semibold focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={loadFtlData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border hover:bg-muted text-foreground transition-all cursor-pointer"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Read-Only Notice Banner */}
      <div className="p-3 px-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center justify-between gap-3">
        <span>
          <strong>Read-Only View:</strong> FTL cargo registrations are registered exclusively in the{' '}
          <strong>Cargo Transactions</strong> tab.
        </span>
      </div>

      {/* KPI Overview Metrics */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Truck className="size-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium">
                {t('ftlTruckCount')}
              </span>
              <h4 className="text-2xl font-black text-foreground mt-0.5">
                {data.total_trucks} Fura
              </h4>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <DollarSign className="size-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium">
                Total Monthly Profit
              </span>
              <h4 className="text-2xl font-black text-foreground mt-0.5">
                ${(data.total_profit ?? 0).toLocaleString()}
              </h4>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-royal text-white border border-brand-gold/30 shadow-md flex items-center gap-4">
            <div className="p-3 rounded-xl bg-brand-gold/20 text-brand-gold border border-brand-gold/40">
              <Sparkles className="size-6" />
            </div>
            <div>
              <span className="text-xs text-neutral-300 font-medium">Total FTL KPI</span>
              <h4 className="text-2xl font-black text-brand-gold mt-0.5">
                ${(data.total_ftl_kpi ?? 0).toLocaleString()}
              </h4>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Rate Tiers Reference */}
      <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs">
        <span className="font-bold text-foreground mb-2 block">
          Monthly Profit Tiers (Monthly_rate)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {MONTHLY_RATE_TIERS.map((tier, idx) => (
            <div
              key={idx}
              className="p-2 rounded-lg bg-surface border border-border/60 text-center"
            >
              <span className="text-muted-foreground block text-[10px]">{tier.range}</span>
              <span className="text-xs font-bold text-brand-gold mt-0.5 block">{tier.rate}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Managers & Trucks List */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground">
          <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-brand-gold" />
          <p className="text-xs">Loading FTL manager data...</p>
        </div>
      ) : !data || !data.managers || data.managers.length === 0 ? (
        <div className="p-12 rounded-2xl bg-surface border border-border text-center text-muted-foreground">
          <Layers className="size-10 mx-auto mb-3 text-muted-foreground/40" />
          <h4 className="text-sm font-bold text-foreground">No FTL Fura Entries for {month}</h4>
          <p className="text-xs mt-1">Click "Add FTL Truck" to create truck shipment records.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(data.managers || []).map((mgr: FtlManagerSummary, mgrIdx: number) => (
            <motion.div
              key={mgr.manager_name || mgrIdx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: mgrIdx * 0.05 }}
              className="rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm overflow-hidden"
            >
              {/* Manager Header */}
              <div className="p-5 bg-gradient-to-r from-brand-navy/90 to-brand-royal/90 text-white border-b border-brand-gold/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                      Manager
                    </span>
                    <h3 className="text-base font-bold text-white">{mgr.manager_name}</h3>
                  </div>
                  <p className="text-xs text-neutral-300 mt-1">
                    {mgr.truck_count} Truck{mgr.truck_count !== 1 ? 's' : ''} • Agent Total: $
                    {(mgr.total_agent_price ?? 0).toLocaleString()} • Sell Total: $
                    {(mgr.total_sell_price ?? 0).toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10">
                    <span className="text-neutral-400 block text-[10px]">{t('ftlProfit')}</span>
                    <strong className="text-white text-sm">
                      ${(mgr.total_profit ?? 0).toLocaleString()}
                    </strong>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-brand-gold/20 border border-brand-gold/30 text-brand-gold">
                    <span className="text-brand-gold/80 block text-[10px]">
                      {t('ftlMonthlyRate')}
                    </span>
                    <strong className="text-brand-gold text-sm">
                      {mgr.monthly_rate_percentage}
                    </strong>
                  </div>
                  <div className="px-4 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                    <span className="text-emerald-300/80 block text-[10px]">
                      {t('ftlKpiAmount')}
                    </span>
                    <strong className="text-emerald-400 text-base font-black">
                      ${mgr.total_ftl_kpi}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Truck Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">{t('ftlAgentPrice')}</th>
                      <th className="px-4 py-3">{t('ftlSellPrice')}</th>
                      <th className="px-4 py-3">{t('ftlProfit')}</th>
                      <th className="px-4 py-3">Days (Plan / Actual)</th>
                      <th className="px-4 py-3">{t('ftlTimeMultiplier')}</th>
                      <th className="px-4 py-3">{t('ftlKpiAmount')}</th>
                      <th className="px-4 py-3">{t('ftlKpiStatus')}</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mgr.items.map((item: FtlTruckItem) => (
                      <tr
                        key={item.id}
                        className="hover:bg-muted/20 text-foreground transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-muted-foreground">
                          ${item.agent_price}
                        </td>
                        <td className="px-4 py-3 font-semibold">${item.sell_price}</td>
                        <td className="px-4 py-3 font-bold text-emerald-500">${item.profit}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3.5 text-muted-foreground" />
                            <span>
                              {item.planned_days}d / <strong>{item.actual_days}d</strong>
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                item.day_difference <= 0
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : 'bg-amber-500/10 text-amber-500'
                              }`}
                            >
                              (
                              {item.day_difference > 0
                                ? `+${item.day_difference}`
                                : item.day_difference}
                              d)
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              item.time_multiplier >= 1.0
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : item.time_multiplier >= 0.85
                                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {item.time_multiplier_percentage ||
                              `${Math.round(item.time_multiplier * 100)}%`}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-extrabold text-brand-gold">
                          ${item.kpi_amount || 0}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleKpi(item.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                              item.kpi_received
                                ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-amber-500/15 text-amber-500 border border-amber-500/30 hover:bg-amber-500/25'
                            }`}
                          >
                            {item.kpi_received ? (
                              <>
                                <CheckCircle2 className="size-3.5" />
                                Paid
                              </>
                            ) : (
                              <>
                                <XCircle className="size-3.5" />
                                Pending
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-[10px] font-bold text-muted-foreground px-2 py-0.5 rounded bg-muted">
                            Read-Only
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add FTL Fura Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg rounded-2xl bg-surface dark:bg-surface border border-border shadow-2xl overflow-hidden z-10"
            >
              <div className="p-5 bg-gradient-to-r from-brand-navy to-brand-royal text-white border-b border-brand-gold/20 flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Truck className="size-5 text-brand-gold" />
                  {t('btnAddTruck')}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <EmployeeSelect
                      label="Manager"
                      required
                      value={selectedManagerId}
                      onChange={(id) => {
                        setSelectedManagerId(id);
                      }}
                      placeholder="Search manager..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Month
                    </label>
                    <input
                      type="month"
                      required
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      {t('ftlAgentPrice')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={agentPriceStr}
                      onChange={(e) => setAgentPriceStr(e.target.value)}
                      placeholder="1000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      {t('ftlSellPrice')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={sellPriceStr}
                      onChange={(e) => setSellPriceStr(e.target.value)}
                      placeholder="2000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Planned Days
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={plannedDaysStr}
                      onChange={(e) => setPlannedDaysStr(e.target.value)}
                      placeholder="20"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Actual Days
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={actualDaysStr}
                      onChange={(e) => setActualDaysStr(e.target.value)}
                      placeholder="25"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Batch Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={qtyStr}
                      onChange={(e) => setQtyStr(e.target.value)}
                      placeholder="1"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="kpiReceived"
                    checked={kpiReceived}
                    onChange={(e) => setKpiReceived(e.target.checked)}
                    className="size-4 rounded border-border text-brand-gold focus:ring-brand-gold cursor-pointer"
                  />
                  <label
                    htmlFor="kpiReceived"
                    className="text-xs font-medium text-foreground cursor-pointer"
                  >
                    Mark KPI as Paid / Received
                  </label>
                </div>

                {/* Modal Live Preview Card */}
                <div className="p-3.5 rounded-xl bg-muted/50 border border-border text-xs space-y-1.5">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Est. Profit per Truck:</span>
                    <span className="font-bold text-emerald-500">${modalPreview.profit}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Time Multiplier:</span>
                    <span className="font-bold text-brand-gold">
                      {Math.round(modalPreview.timeMult * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border">
                    <span>Estimated KPI per Truck:</span>
                    <span className="text-brand-gold">${modalPreview.estKpi}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border hover:bg-muted text-foreground transition-all"
                  >
                    {t('actionCancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-gold hover:bg-brand-gold/90 text-brand-navy shadow-md transition-all flex items-center gap-2"
                  >
                    {submitting ? (
                      <RefreshCw className="size-4 animate-spin" />
                    ) : (
                      <Truck className="size-4" />
                    )}
                    {t('actionCreate')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
