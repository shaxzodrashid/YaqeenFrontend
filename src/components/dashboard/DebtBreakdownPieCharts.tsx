import React, { useState, useMemo } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  PieChart as PieChartIcon,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  DollarSign,
  Scale,
  CircleDot,
  Donut,
} from 'lucide-react';
import type {
  DashboardDebtSummaryResponse,
  DebtCargoStatusBreakdownItem,
  DebtPaymentStatusBreakdownItem,
} from '../../types/dashboard';
import { formatMoney } from '../../services/api';
import { T } from '../T';
import { useTranslation } from '../../context/LanguageContext';

export interface DebtBreakdownPieChartsProps {
  debtData: DashboardDebtSummaryResponse | null;
  currency?: string;
  loading?: boolean;
}

type BreakdownMode = 'status' | 'payment';
type MetricMode = 'amount' | 'count';
type ChartStyle = 'pie' | 'donut';

interface UnifiedSlice {
  key: string;
  statusKey: string;
  label: string;
  count: number;
  amount: number;
  percentage: number;
  color: string;
  totalVolume?: number;
  totalWeight?: number;
}

export const DebtBreakdownPieCharts: React.FC<DebtBreakdownPieChartsProps> = React.memo(
  ({ debtData, currency: propCurrency, loading }) => {
    const { t } = useTranslation();
    const [mode, setMode] = useState<BreakdownMode>('status');
    const [metric, setMetric] = useState<MetricMode>('amount');
    const [chartStyle, setChartStyle] = useState<ChartStyle>('pie');

    const currency = debtData?.currency || propCurrency || 'USD';

    // 1. Prepare slices for Receivables (Debitorlik)
    const receivableSlices: UnifiedSlice[] = useMemo(() => {
      if (!debtData) return [];
      if (mode === 'status') {
        const raw = debtData.receivableStatusBreakdown || [];
        return raw.map((item: DebtCargoStatusBreakdownItem) => ({
          key: `rec-status-${item.status}`,
          statusKey: item.status,
          label: item.label || item.status,
          count: item.count,
          amount: item.amount,
          percentage: item.percentage,
          color: item.color || '#3B82F6',
          totalVolume: item.totalVolume,
          totalWeight: item.totalWeight,
        }));
      }
      const raw = debtData.receivablePaymentStatusBreakdown || [];
      return raw.map((item: DebtPaymentStatusBreakdownItem) => ({
        key: `rec-pay-${item.paymentStatus}`,
        statusKey: item.paymentStatus,
        label: item.label || item.paymentStatus,
        count: item.count,
        amount: item.amount,
        percentage: item.percentage,
        color: item.color || '#F59E0B',
      }));
    }, [debtData, mode]);

    // 2. Prepare slices for Payables (Kreditorlik)
    const payableSlices: UnifiedSlice[] = useMemo(() => {
      if (!debtData) return [];
      if (mode === 'status') {
        const raw = debtData.payableStatusBreakdown || [];
        return raw.map((item: DebtCargoStatusBreakdownItem) => ({
          key: `pay-status-${item.status}`,
          statusKey: item.status,
          label: item.label || item.status,
          count: item.count,
          amount: item.amount,
          percentage: item.percentage,
          color: item.color || '#3B82F6',
          totalVolume: item.totalVolume,
          totalWeight: item.totalWeight,
        }));
      }
      const raw = debtData.payablePaymentStatusBreakdown || [];
      return raw.map((item: DebtPaymentStatusBreakdownItem) => ({
        key: `pay-pay-${item.paymentStatus}`,
        statusKey: item.paymentStatus,
        label: item.label || item.paymentStatus,
        count: item.count,
        amount: item.amount,
        percentage: item.percentage,
        color: item.color || '#F59E0B',
      }));
    }, [debtData, mode]);

    if (loading) {
      return (
        <div className="p-6 rounded-2xl bg-surface/60 dark:bg-night-surface/60 border border-border/40 dark:border-night-border animate-pulse h-[400px]" />
      );
    }

    if (!debtData) return null;

    const hasData = receivableSlices.length > 0 || payableSlices.length > 0;
    const totalScoped = debtData.totalScopedCargos ?? (debtData.scopedCargos?.length || 0);
    const recTotalAmount = receivableSlices.reduce((sum, s) => sum + s.amount, 0);
    const payTotalAmount = payableSlices.reduce((sum, s) => sum + s.amount, 0);
    const recTotalCount = receivableSlices.reduce((sum, s) => sum + s.count, 0);
    const payTotalCount = payableSlices.reduce((sum, s) => sum + s.count, 0);

    const overallBreakdown = debtData.overallStatusBreakdown || [];

    // Custom Tooltip for Recharts
    const renderTooltip = (props: {
      active?: boolean;
      payload?: readonly { payload?: UnifiedSlice }[];
      isReceivable?: boolean;
    }) => {
      const { active, payload, isReceivable } = props;
      if (!active || !payload || !payload.length) return null;

      const data = (payload[0] as { payload?: UnifiedSlice }).payload;
      if (!data) return null;

      return (
        <div className="p-3 rounded-xl bg-surface/95 dark:bg-night-surface/95 backdrop-blur-md border border-border/80 dark:border-night-border shadow-xl text-xs space-y-1.5 z-50 min-w-[180px]">
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-border/40 dark:border-night-border/40">
            <div className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-full shrink-0 shadow-2xs"
                style={{ backgroundColor: data.color }}
              />
              <span className="font-bold text-foreground dark:text-night-text truncate max-w-[140px]">
                {data.label}
              </span>
            </div>
            <span className="font-extrabold text-[11px] px-1.5 py-0.2 rounded-md bg-border/20 text-foreground dark:text-night-text">
              {data.percentage}%
            </span>
          </div>

          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted">
                {isReceivable ? t('ovReceivablesLabel') : t('ovPayablesLabel')}
              </span>
              <span className="font-extrabold text-foreground dark:text-night-text tabular-nums">
                {formatMoney(data.amount, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted">{t('ovMetricCount')}</span>
              <span className="font-bold text-foreground dark:text-night-text tabular-nums">
                {data.count}
              </span>
            </div>
            {data.totalVolume !== undefined && data.totalVolume > 0 && (
              <div className="flex items-center justify-between text-[10px] text-muted">
                <span>{t('ovTotalVolume') || 'Volume'}</span>
                <span className="font-semibold text-foreground dark:text-night-text">
                  {data.totalVolume.toLocaleString()} m³
                </span>
              </div>
            )}
            {data.totalWeight !== undefined && data.totalWeight > 0 && (
              <div className="flex items-center justify-between text-[10px] text-muted">
                <span>{t('ovTotalWeight') || 'Weight'}</span>
                <span className="font-semibold text-foreground dark:text-night-text">
                  {data.totalWeight.toLocaleString()} kg
                </span>
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="p-5 sm:p-6 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-xs space-y-6 transition-all duration-300">
        {/* ── HEADER & CONTROLS ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/40 dark:border-night-border/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-500 shrink-0 shadow-xs">
              <PieChartIcon className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-foreground dark:text-night-text">
                  <T k="ovDebtCargoStatusBreakdown" />
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  {mode === 'status' ? t('ovFilterByCargoStatus') : t('ovFilterByPaymentStatus')}
                </span>
              </div>
              <p className="text-xs text-muted dark:text-night-muted mt-0.5">
                <T k="ovDebtPieChartsSubtitle" />
              </p>
            </div>
          </div>

          {/* Scope Badges & Toggle Switchers */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Scoped Cargos Count Badge */}
            {totalScoped > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-background/80 dark:bg-night-bg/80 border border-border/60 dark:border-night-border text-muted shrink-0">
                <Package className="size-3.5 text-brand-gold" />
                <span>{t('ovScopedCargosTotal', { count: totalScoped })}</span>
              </div>
            )}

            {/* Mode Switcher: Cargo Status vs Payment Status */}
            <div className="inline-flex items-center p-1 rounded-xl bg-background dark:bg-night-bg border border-border/60 dark:border-night-border text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode('status')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  mode === 'status'
                    ? 'bg-brand-gold text-neutral-950 font-bold shadow-2xs'
                    : 'text-muted hover:text-foreground dark:hover:text-night-text'
                }`}
              >
                {t('ovFilterByCargoStatus')}
              </button>
              <button
                type="button"
                onClick={() => setMode('payment')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  mode === 'payment'
                    ? 'bg-brand-gold text-neutral-950 font-bold shadow-2xs'
                    : 'text-muted hover:text-foreground dark:hover:text-night-text'
                }`}
              >
                {t('ovFilterByPaymentStatus')}
              </button>
            </div>

            {/* Metric Switcher: Amount vs Count */}
            <div className="inline-flex items-center p-1 rounded-xl bg-background dark:bg-night-bg border border-border/60 dark:border-night-border text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMetric('amount')}
                title={t('ovMetricAmount')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  metric === 'amount'
                    ? 'bg-brand-gold text-neutral-950 font-bold shadow-2xs'
                    : 'text-muted hover:text-foreground dark:hover:text-night-text'
                }`}
              >
                <DollarSign className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setMetric('count')}
                title={t('ovMetricCount')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  metric === 'count'
                    ? 'bg-brand-gold text-neutral-950 font-bold shadow-2xs'
                    : 'text-muted hover:text-foreground dark:hover:text-night-text'
                }`}
              >
                <Package className="size-3.5" />
              </button>
            </div>

            {/* Chart Style Switcher: Pie vs Donut */}
            <div className="inline-flex items-center p-1 rounded-xl bg-background dark:bg-night-bg border border-border/60 dark:border-night-border text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartStyle('pie')}
                title="Pie Chart"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  chartStyle === 'pie'
                    ? 'bg-brand-gold text-neutral-950 font-bold shadow-2xs'
                    : 'text-muted hover:text-foreground dark:hover:text-night-text'
                }`}
              >
                <CircleDot className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setChartStyle('donut')}
                title="Donut Chart"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  chartStyle === 'donut'
                    ? 'bg-brand-gold text-neutral-950 font-bold shadow-2xs'
                    : 'text-muted hover:text-foreground dark:hover:text-night-text'
                }`}
              >
                <Donut className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted">
            <PieChartIcon className="size-10 mb-2 opacity-40" />
            <p className="text-xs font-semibold">
              <T k="ovNoBreakdownData" />
            </p>
          </div>
        ) : (
          <>
            {/* ── 2 PIE CHARTS SIDE BY SIDE ──────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* PIE CHART 1: Debitorlik yuklari (Receivables) */}
              <div className="p-4 sm:p-5 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 dark:border-night-border/40 flex flex-col justify-between gap-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-500">
                      <ArrowDownToLine className="size-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground dark:text-night-text block">
                        {mode === 'status'
                          ? t('ovReceivableStatusPieTitle')
                          : t('ovReceivablePaymentPieTitle')}
                      </span>
                      <span className="text-[10px] text-muted">
                        <T k="ovReceivablesClientsOwe" />
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                      {formatMoney(recTotalAmount, currency)}
                    </span>
                    <span className="text-[10px] text-muted font-bold">
                      {t('ovReceivableCargosCount', {
                        count: debtData.totalReceivableCargos ?? recTotalCount,
                      })}
                    </span>
                  </div>
                </div>

                {/* Recharts Pie Chart 1 */}
                <div className="h-[280px] w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={receivableSlices}
                        dataKey={metric === 'amount' ? 'amount' : 'count'}
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={chartStyle === 'donut' ? 88 : 82}
                        innerRadius={chartStyle === 'donut' ? 48 : 0}
                        paddingAngle={receivableSlices.length > 1 ? 2 : 0}
                        label={({
                          percent,
                          payload,
                        }: {
                          percent?: number;
                          payload?: UnifiedSlice;
                        }) => `${payload?.percentage ?? Math.round((percent || 0) * 100)}%`}
                        labelLine={false}
                      >
                        {receivableSlices.map((entry, idx) => (
                          <Cell
                            key={`cell-rec-${entry.key || idx}`}
                            fill={entry.color}
                            stroke="rgba(0,0,0,0.15)"
                            strokeWidth={1}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={(props) =>
                          renderTooltip({
                            active: props.active,
                            payload: props.payload,
                            isReceivable: true,
                          })
                        }
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(val) => (
                          <span className="text-[11px] font-semibold text-muted dark:text-night-muted">
                            {val}
                          </span>
                        )}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>

                {/* Status Breakdown Detail Rows */}
                <div className="space-y-2 pt-2 border-t border-border/30">
                  {receivableSlices.map((slice) => (
                    <div
                      key={slice.key}
                      className="p-2 rounded-lg bg-surface dark:bg-night-surface border border-border/30 text-xs flex flex-col gap-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="size-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: slice.color }}
                          />
                          <span className="font-bold text-foreground dark:text-night-text truncate">
                            {slice.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-extrabold text-foreground dark:text-night-text">
                            {formatMoney(slice.amount, currency)}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            {slice.percentage}%
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-border/20 dark:bg-night-border/40 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${slice.percentage}%`,
                            backgroundColor: slice.color,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted">
                        <span>{t('ovOpenOrdersCount', { count: slice.count })}</span>
                        {slice.totalVolume !== undefined && slice.totalVolume > 0 && (
                          <span>
                            {slice.totalVolume.toLocaleString()} m³ ·{' '}
                            {slice.totalWeight?.toLocaleString()} kg
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PIE CHART 2: Kreditorlik yuklari (Payables) */}
              <div className="p-4 sm:p-5 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 dark:border-night-border/40 flex flex-col justify-between gap-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-500">
                      <ArrowUpFromLine className="size-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground dark:text-night-text block">
                        {mode === 'status'
                          ? t('ovPayableStatusPieTitle')
                          : t('ovPayablePaymentPieTitle')}
                      </span>
                      <span className="text-[10px] text-muted">
                        <T k="ovPayablesCarrierDebt" />
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400 block">
                      {formatMoney(payTotalAmount, currency)}
                    </span>
                    <span className="text-[10px] text-muted font-bold">
                      {t('ovPayableCargosCount', {
                        count: debtData.totalPayableCargos ?? payTotalCount,
                      })}
                    </span>
                  </div>
                </div>

                {/* Recharts Pie Chart 2 */}
                <div className="h-[280px] w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={payableSlices}
                        dataKey={metric === 'amount' ? 'amount' : 'count'}
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={chartStyle === 'donut' ? 88 : 82}
                        innerRadius={chartStyle === 'donut' ? 48 : 0}
                        paddingAngle={payableSlices.length > 1 ? 2 : 0}
                        label={({
                          percent,
                          payload,
                        }: {
                          percent?: number;
                          payload?: UnifiedSlice;
                        }) => `${payload?.percentage ?? Math.round((percent || 0) * 100)}%`}
                        labelLine={false}
                      >
                        {payableSlices.map((entry, idx) => (
                          <Cell
                            key={`cell-pay-${entry.key || idx}`}
                            fill={entry.color}
                            stroke="rgba(0,0,0,0.15)"
                            strokeWidth={1}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={(props) =>
                          renderTooltip({
                            active: props.active,
                            payload: props.payload,
                            isReceivable: false,
                          })
                        }
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(val) => (
                          <span className="text-[11px] font-semibold text-muted dark:text-night-muted">
                            {val}
                          </span>
                        )}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>

                {/* Status Breakdown Detail Rows */}
                <div className="space-y-2 pt-2 border-t border-border/30">
                  {payableSlices.map((slice) => (
                    <div
                      key={slice.key}
                      className="p-2 rounded-lg bg-surface dark:bg-night-surface border border-border/30 text-xs flex flex-col gap-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="size-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: slice.color }}
                          />
                          <span className="font-bold text-foreground dark:text-night-text truncate">
                            {slice.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-extrabold text-foreground dark:text-night-text">
                            {formatMoney(slice.amount, currency)}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            {slice.percentage}%
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-border/20 dark:bg-night-border/40 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${slice.percentage}%`,
                            backgroundColor: slice.color,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted">
                        <span>{t('ovOpenOrdersCount', { count: slice.count })}</span>
                        {slice.totalVolume !== undefined && slice.totalVolume > 0 && (
                          <span>
                            {slice.totalVolume.toLocaleString()} m³ ·{' '}
                            {slice.totalWeight?.toLocaleString()} kg
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── OVERALL STATUS NET BALANCE COMPARISON ───────────────────────── */}
            {overallBreakdown.length > 0 && (
              <div className="p-4 sm:p-4.5 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 dark:border-night-border/40 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-brand-gold/15 text-brand-gold">
                      <Scale className="size-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground dark:text-night-text block">
                        <T k="ovOverallStatusComparison" />
                      </span>
                      <span className="text-[10px] text-muted">{t('ovReceivablesVsPayables')}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-brand-gold px-2 py-0.5 rounded-full bg-brand-gold/10">
                    {overallBreakdown.length} statuses
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {overallBreakdown.map((item) => (
                    <div
                      key={item.status}
                      className="p-3 rounded-xl bg-surface dark:bg-night-surface border border-border/30 space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs font-bold text-foreground dark:text-night-text truncate">
                            {item.label}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border ${
                            item.netBalance >= 0
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {item.netBalance >= 0 ? t('ovNetSurplus') : t('ovNetDeficit')}:{' '}
                          {formatMoney(item.netBalance, currency)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-border/20">
                        <div>
                          <span className="text-muted block">{t('ovReceivablesLabel')}</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatMoney(item.receivableAmount, currency)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-muted block">{t('ovPayablesLabel')}</span>
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            {formatMoney(item.payableAmount, currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
);
