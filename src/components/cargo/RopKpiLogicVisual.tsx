import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  TrendingUp,
  Truck,
  DollarSign,
  FileText,
  Plus,
  Equal,
  ArrowDown,
  Sparkles,
  Sliders,
  CheckCircle2,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import type { RopSummaryResponse, RopWorkerShare } from '../../services/cargoKpi.service';
import { getRopTeamBonusRate, getRopTruckCountRate } from '../../services/cargoKpi.service';

interface RopKpiLogicVisualProps {
  liveData?: RopSummaryResponse | null;
  loading?: boolean;
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  onRefresh?: () => void;
}

// Static Misol Data matching the exact poster image
const STATIC_MISOL_BASE = {
  workers: [
    { nameKey: 'A', sales_amount: 12500, worker_1pct_kpi: 125.0 },
    { nameKey: 'B', sales_amount: 18300, worker_1pct_kpi: 183.0 },
    { nameKey: 'C', sales_amount: 9700, worker_1pct_kpi: 97.0 },
  ],
  worker_1pct_total: 405.0,
  total_team_sales: 42300.0,
  team_bonus_rate: 0.045,
  team_bonus_rate_pct: '4.5%',
  team_bonus_amount: 1903.5,
  truck_count: 4,
  total_truck_profit: 8600.0,
  truck_count_rate: 0.015,
  truck_count_rate_pct: '1.5%',
  truck_kpi_amount: 129.0,
  rop_total_kpi: 2437.5,
};

// Team Bonus Rate Tiers
const TEAM_BONUS_TIERS = [
  { rangeLabel: '< 25,000 $', rateLabel: '0%', min: 0, max: 25000, rate: 0 },
  { rangeLabel: '25,000 $ – 29,999.99 $', rateLabel: '2%', min: 25000, max: 30000, rate: 0.02 },
  { rangeLabel: '30,000 $ – 34,999.99 $', rateLabel: '2.5%', min: 30000, max: 35000, rate: 0.025 },
  { rangeLabel: '35,000 $ – 39,999.99 $', rateLabel: '3%', min: 35000, max: 40000, rate: 0.03 },
  { rangeLabel: '40,000 $ – 44,999.99 $', rateLabel: '4.5%', min: 40000, max: 45000, rate: 0.045 },
  { rangeLabel: '45,000 $ – 54,999.99 $', rateLabel: '6%', min: 45000, max: 55000, rate: 0.06 },
  { rangeLabel: '≥ 55,000 $', rateLabel: '7%', min: 55000, max: Infinity, rate: 0.07 },
];

export function RopKpiLogicVisual({
  liveData,
  loading = false,
  selectedMonth = '2026-07',
  onMonthChange,
  onRefresh,
}: RopKpiLogicVisualProps) {
  const { t, locale } = useTranslation();

  // Mode selection: 'poster' (Exact static example), 'live' (Real Backend Data), 'simulator' (Interactive)
  const [activeMode, setActiveMode] = useState<'poster' | 'live' | 'simulator'>('poster');

  // Localized worker prefix
  const workerPrefix = useMemo(() => {
    if (locale === 'uz') return 'Sotuvchi';
    if (locale === 'ru') return 'Менеджер';
    return 'Sales Rep';
  }, [locale]);

  // Truck Count Rate Tiers Localized
  const truckCountTiers = useMemo(() => {
    const unit = t('ropTruckUnit');
    const unitSingle = t('ropTruckUnitSingle');
    return [
      {
        countLabel: locale === 'uz' ? '0 ta fura' : locale === 'ru' ? '0 фур' : '0 trucks',
        rateLabel: '0%',
        min: 0,
        max: 0,
        rate: 0,
      },
      {
        countLabel:
          locale === 'uz'
            ? '1 – 2 ta fura'
            : locale === 'ru'
              ? `1 – 2 ${unitSingle === 'фура' ? 'фуры' : unit}`
              : '1 – 2 trucks',
        rateLabel: '1%',
        min: 1,
        max: 2,
        rate: 0.01,
      },
      {
        countLabel:
          locale === 'uz' ? '3 – 5 ta fura' : locale === 'ru' ? `3 – 5 ${unit}` : '3 – 5 trucks',
        rateLabel: '1.5%',
        min: 3,
        max: 5,
        rate: 0.015,
      },
      {
        countLabel:
          locale === 'uz' ? '6 – 9 ta fura' : locale === 'ru' ? `6 – 9 ${unit}` : '6 – 9 trucks',
        rateLabel: '2%',
        min: 6,
        max: 9,
        rate: 0.02,
      },
      {
        countLabel:
          locale === 'uz' ? '≥ 10 ta fura' : locale === 'ru' ? `≥ 10 ${unit}` : '≥ 10 trucks',
        rateLabel: '2.5%',
        min: 10,
        max: Infinity,
        rate: 0.025,
      },
    ];
  }, [locale, t]);

  // Simulator state
  const [simWorkers, setSimWorkers] = useState<{ nameKey: string; sales: number }[]>([
    { nameKey: 'A', sales: 12500 },
    { nameKey: 'B', sales: 18300 },
    { nameKey: 'C', sales: 9700 },
  ]);
  const [simTruckCount, setSimTruckCount] = useState<number>(4);
  const [simTruckProfit, setSimTruckProfit] = useState<number>(8600);

  // Computed Simulator Values
  const simData = useMemo(() => {
    const workers = simWorkers.map((w) => ({
      employee_name: `${workerPrefix} ${w.nameKey}`,
      sales_amount: Number(w.sales) || 0,
      worker_1pct_kpi: Math.round((Number(w.sales) || 0) * 0.01 * 100) / 100,
    }));
    const worker_1pct_total = workers.reduce((sum, w) => sum + w.worker_1pct_kpi, 0);
    const total_team_sales = workers.reduce((sum, w) => sum + w.sales_amount, 0);

    const team_bonus_rate = getRopTeamBonusRate(total_team_sales);
    const team_bonus_rate_pct = `${(team_bonus_rate * 100).toFixed(1)}%`;
    const team_bonus_amount = Math.round(total_team_sales * team_bonus_rate * 100) / 100;

    const truck_count = Math.max(0, simTruckCount);
    const total_truck_profit = Math.max(0, simTruckProfit);
    const truck_count_rate = getRopTruckCountRate(truck_count);
    const truck_count_rate_pct = `${(truck_count_rate * 100).toFixed(1)}%`;
    const truck_kpi_amount = Math.round(total_truck_profit * truck_count_rate * 100) / 100;

    const rop_total_kpi =
      Math.round((worker_1pct_total + team_bonus_amount + truck_kpi_amount) * 100) / 100;

    return {
      workers,
      worker_1pct_total,
      total_team_sales,
      team_bonus_rate,
      team_bonus_rate_pct,
      team_bonus_amount,
      truck_count,
      total_truck_profit,
      truck_count_rate,
      truck_count_rate_pct,
      truck_kpi_amount,
      rop_total_kpi,
    };
  }, [simWorkers, simTruckCount, simTruckProfit, workerPrefix]);

  // Static Localized Poster Data
  const staticPosterWorkers = useMemo(() => {
    return STATIC_MISOL_BASE.workers.map((w) => ({
      employee_name: `${workerPrefix} ${w.nameKey}`,
      sales_amount: w.sales_amount,
      worker_1pct_kpi: w.worker_1pct_kpi,
    }));
  }, [workerPrefix]);

  // Determine current active presentation model based on activeMode
  const currentModel = useMemo(() => {
    if (activeMode === 'poster') {
      return {
        isLive: false,
        isSim: false,
        workers: staticPosterWorkers,
        worker1PctTotal: STATIC_MISOL_BASE.worker_1pct_total,
        totalTeamSales: STATIC_MISOL_BASE.total_team_sales,
        teamBonusRate: STATIC_MISOL_BASE.team_bonus_rate,
        teamBonusRatePct: STATIC_MISOL_BASE.team_bonus_rate_pct,
        teamBonusAmount: STATIC_MISOL_BASE.team_bonus_amount,
        truckCount: STATIC_MISOL_BASE.truck_count,
        totalTruckProfit: STATIC_MISOL_BASE.total_truck_profit,
        truckCountRate: STATIC_MISOL_BASE.truck_count_rate,
        truckCountRatePct: STATIC_MISOL_BASE.truck_count_rate_pct,
        truckKpiAmount: STATIC_MISOL_BASE.truck_kpi_amount,
        ropTotalKpi: STATIC_MISOL_BASE.rop_total_kpi,
      };
    }

    if (activeMode === 'simulator') {
      return {
        isLive: false,
        isSim: true,
        workers: simData.workers,
        worker1PctTotal: simData.worker_1pct_total,
        totalTeamSales: simData.total_team_sales,
        teamBonusRate: simData.team_bonus_rate,
        teamBonusRatePct: simData.team_bonus_rate_pct,
        teamBonusAmount: simData.team_bonus_amount,
        truckCount: simData.truck_count,
        totalTruckProfit: simData.total_truck_profit,
        truckCountRate: simData.truck_count_rate,
        truckCountRatePct: simData.truck_count_rate_pct,
        truckKpiAmount: simData.truck_kpi_amount,
        ropTotalKpi: simData.rop_total_kpi,
      };
    }

    // Live backend data
    const liveWorkers = (liveData?.workers_breakdown || []).map((w: RopWorkerShare) => ({
      employee_name: w.employee_name,
      sales_amount: Number(w.sales_amount ?? w.base_kpi ?? 0),
      worker_1pct_kpi: Number(w.worker_1pct_kpi ?? 0),
    }));

    const worker1PctTotal = Number(liveData?.worker_1pct_total ?? 0);
    const totalTeamSales = Number(
      liveData?.total_team_sales ?? liveData?.team_bonus_profit ?? liveData?.total_ltl_profit ?? 0
    );
    const teamBonusRate = Number(liveData?.team_bonus_rate ?? getRopTeamBonusRate(totalTeamSales));
    const teamBonusRatePct =
      liveData?.team_bonus_percentage || `${(teamBonusRate * 100).toFixed(1)}%`;
    const teamBonusAmount = Number(
      liveData?.team_bonus_amount ?? Math.round(totalTeamSales * teamBonusRate * 100) / 100
    );
    const truckCount = Number(liveData?.truck_count ?? 0);
    const totalTruckProfit = Number(liveData?.total_truck_profit ?? 0);
    const truckCountRate = Number(
      liveData?.truck_count_rate ?? liveData?.truck_rate ?? getRopTruckCountRate(truckCount)
    );
    const truckCountRatePct =
      liveData?.truck_count_rate_percentage ||
      liveData?.truck_rate_percentage ||
      `${(truckCountRate * 100).toFixed(1)}%`;
    const truckKpiAmount = Number(
      liveData?.truck_kpi_amount ?? Math.round(totalTruckProfit * truckCountRate * 100) / 100
    );
    const ropTotalKpi = Number(
      liveData?.rop_total_kpi ?? worker1PctTotal + teamBonusAmount + truckKpiAmount
    );

    return {
      isLive: true,
      isSim: false,
      workers: liveWorkers.length > 0 ? liveWorkers : staticPosterWorkers,
      worker1PctTotal,
      totalTeamSales,
      teamBonusRate,
      teamBonusRatePct,
      teamBonusAmount,
      truckCount,
      totalTruckProfit,
      truckCountRate,
      truckCountRatePct,
      truckKpiAmount,
      ropTotalKpi,
    };
  }, [activeMode, liveData, simData, staticPosterWorkers]);

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* TOP CONTROLS & MODE SWITCHER                                      */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm">
        {/* Mode Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 dark:bg-muted/30 rounded-xl border border-border/50">
          <button
            onClick={() => setActiveMode('poster')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'poster'
                ? 'bg-brand-navy text-white dark:bg-brand-gold dark:text-brand-navy shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Sparkles className="size-3.5" />
            <span>{t('ropModePoster')}</span>
          </button>
          <button
            onClick={() => setActiveMode('live')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'live'
                ? 'bg-brand-navy text-white dark:bg-brand-gold dark:text-brand-navy shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Calendar className="size-3.5" />
            <span>{t('ropModeLive')}</span>
          </button>
          <button
            onClick={() => setActiveMode('simulator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'simulator'
                ? 'bg-brand-navy text-white dark:bg-brand-gold dark:text-brand-navy shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Sliders className="size-3.5" />
            <span>{t('ropModeSimulator')}</span>
          </button>
        </div>

        {/* Month Selector for Live Mode */}
        {activeMode === 'live' && onMonthChange && (
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none cursor-pointer"
            />
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-2 rounded-xl border border-border hover:bg-muted/50 text-foreground transition-all cursor-pointer"
                title={locale === 'uz' ? 'Yangilash' : locale === 'ru' ? 'Обновить' : 'Refresh'}
              >
                <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Simulator Inputs Drawer (when in simulator mode) */}
      <AnimatePresence>
        {activeMode === 'simulator' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4"
          >
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
              <Sliders className="size-4" />
              <span>{t('ropSimControlsTitle')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {simWorkers.map((w, idx) => (
                <div key={idx} className="space-y-1 bg-surface p-3 rounded-xl border border-border">
                  <label className="font-semibold text-foreground">
                    {t('ropSimSalesLabel').replace('{name}', `${workerPrefix} ${w.nameKey}`)}
                  </label>
                  <input
                    type="number"
                    step="500"
                    min="0"
                    value={w.sales}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      const next = [...simWorkers];
                      next[idx].sales = val;
                      setSimWorkers(next);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground font-mono"
                  />
                </div>
              ))}

              <div className="space-y-1 bg-surface p-3 rounded-xl border border-border">
                <label className="font-semibold text-foreground">
                  {t('ropSimTruckCountLabel')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={simTruckCount}
                  onChange={(e) => setSimTruckCount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground font-mono"
                />
              </div>

              <div className="space-y-1 bg-surface p-3 rounded-xl border border-border">
                <label className="font-semibold text-foreground">
                  {t('ropSimTruckProfitLabel')}
                </label>
                <input
                  type="number"
                  step="500"
                  min="0"
                  value={simTruckProfit}
                  onChange={(e) => setSimTruckProfit(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground font-mono"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* MAIN INFOGRAPHIC CANVAS CONTAINER                                 */}
      {/* ================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl space-y-8">
        {/* --------------------------------------------------------------- */}
        {/* HEADER TITLE & CORE FORMULA PILL                                */}
        {/* --------------------------------------------------------------- */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            {t('ropLogicTitle')}
          </h1>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            {t('ropLogicSubtitle')}
          </p>

          {/* Core Master Banner Formula */}
          <div className="inline-flex max-w-full overflow-x-auto items-center justify-center px-6 py-3.5 rounded-2xl bg-[#0f172a] border border-slate-700 text-white shadow-2xl">
            <span className="font-extrabold text-sm sm:text-base md:text-lg tracking-wide whitespace-nowrap">
              {t('ropTotalKpiFormula')} ={' '}
              <span className="text-[#22c55e] font-black">{t('ropComponent1Title')}</span>
              {' + '}
              <span className="text-[#38bdf8] font-black">{t('ropComponent2Title')}</span>
              {' + '}
              <span className="text-[#c084fc] font-black">{t('ropComponent3Title')}</span>
            </span>
          </div>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* 3 CORE PILLARS GRID (CARDS 1, 2, 3)                             */}
        {/* --------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* ============================================================= */}
          {/* PILLAR 1: WORKER 1% KPI (GREEN THEME)                         */}
          {/* ============================================================= */}
          <div className="flex flex-col justify-between rounded-3xl p-6 bg-white dark:bg-slate-900 border-2 border-[#22c55e]/60 dark:border-emerald-500/70 shadow-md relative group hover:shadow-emerald-500/10 transition-all">
            <div className="space-y-4">
              {/* Header Badge & Title */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#16a34a] text-white font-black text-sm flex items-center justify-center shadow">
                  1
                </div>
                <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#16a34a] dark:text-emerald-400">
                  <Users className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
                    {t('ropComponent1Title')}
                  </h3>
                  <span className="text-xs font-extrabold text-[#16a34a] dark:text-emerald-400 block">
                    {t('ropComponent1Subtitle')}
                  </span>
                </div>
              </div>

              {/* Explanatory Paragraph */}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {t('ropComponent1Desc')}
              </p>

              {/* Individual Worker Formula Box */}
              <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-700/60 text-center">
                <span className="font-mono text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-300">
                  Worker KPI<sub>i</sub> = sales_amount<sub>i</sub> × 0.01
                </span>
              </div>

              {/* Sum Formula Box (Dashed Green Border) */}
              <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border-2 border-dashed border-emerald-400 dark:border-emerald-600 text-center space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block">
                  {t('ropComponent1SumLabel')}
                </span>
                <div className="font-mono text-sm sm:text-base font-black text-emerald-900 dark:text-emerald-200">
                  Worker 1% KPI = ∑<sub>i=1</sub>
                  <sup>n</sup> (sales_amount<sub>i</sub> × 0.01)
                </div>
              </div>

              {/* Workers Table (Misol / Live Data) */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {currentModel.isLive ? t('ropCurrentMonthCalc') : t('ropExample')}
                </span>
                <div className="overflow-hidden rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 font-bold border-b border-emerald-200 dark:border-emerald-800">
                      <tr>
                        <th className="px-3 py-2">{t('ropColEmployee')}</th>
                        <th className="px-3 py-2 text-right">{t('ropColSalesAmount')}</th>
                        <th className="px-3 py-2 text-right">{t('ropCol1PctKpi')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-100 dark:divide-emerald-900/40 bg-white dark:bg-slate-900">
                      {currentModel.workers.map((worker, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20"
                        >
                          <td className="px-3 py-1.5 font-medium text-slate-800 dark:text-slate-200">
                            {worker.employee_name}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-slate-600 dark:text-slate-300">
                            {worker.sales_amount.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {worker.worker_1pct_kpi.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))}
                      {/* Total Row */}
                      <tr className="bg-emerald-100/60 dark:bg-emerald-950/70 font-black text-emerald-950 dark:text-emerald-100">
                        <td className="px-3 py-2">{t('ropTotal')}</td>
                        <td className="px-3 py-2 text-right font-mono">
                          {currentModel.totalTeamSales.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-emerald-700 dark:text-emerald-300">
                          {currentModel.worker1PctTotal.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================= */}
          {/* PILLAR 2: TEAM BONUS (BLUE THEME)                             */}
          {/* ============================================================= */}
          <div className="flex flex-col justify-between rounded-3xl p-6 bg-white dark:bg-slate-900 border-2 border-[#0284c7]/60 dark:border-sky-500/70 shadow-md relative group hover:shadow-sky-500/10 transition-all">
            <div className="space-y-4">
              {/* Header Badge & Title */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0284c7] text-white font-black text-sm flex items-center justify-center shadow">
                  2
                </div>
                <div className="p-2 rounded-full bg-sky-100 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400">
                  <TrendingUp className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
                    {t('ropComponent2Title')}
                  </h3>
                  <span className="text-xs font-extrabold text-[#0284c7] dark:text-sky-400 block">
                    {t('ropComponent2Subtitle')}
                  </span>
                </div>
              </div>

              {/* Explanatory Paragraph */}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {t('ropComponent2Desc')}
              </p>

              {/* Team Bonus Tier Table */}
              <div className="overflow-hidden rounded-xl border border-sky-200 dark:border-sky-800 shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-sky-100/70 dark:bg-sky-950/60 text-sky-950 dark:text-sky-200 font-bold border-b border-sky-200 dark:border-sky-800">
                    <tr>
                      <th className="px-3 py-2">{t('ropColTeamSales')}</th>
                      <th className="px-3 py-2 text-right">{t('ropColBonusRate')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-100 dark:divide-sky-900/40 bg-white dark:bg-slate-900">
                    {TEAM_BONUS_TIERS.map((tier, idx) => {
                      const isActive =
                        currentModel.totalTeamSales >= tier.min &&
                        (tier.max === Infinity
                          ? currentModel.totalTeamSales >= 55000
                          : currentModel.totalTeamSales < tier.max);

                      return (
                        <tr
                          key={idx}
                          className={`${
                            isActive
                              ? 'bg-sky-500/20 dark:bg-sky-950/80 font-black text-sky-900 dark:text-sky-200 ring-1 ring-sky-500/40'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-sky-50/40'
                          }`}
                        >
                          <td className="px-3 py-1.5 font-medium flex items-center gap-1.5">
                            {isActive && (
                              <CheckCircle2 className="size-3 text-sky-600 dark:text-sky-400 shrink-0" />
                            )}
                            <span>{tier.rangeLabel}</span>
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono font-extrabold">
                            {tier.rateLabel}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Formula Box */}
              <div className="p-3 rounded-xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-300/80 dark:border-sky-700/60 text-center">
                <span className="font-mono text-xs sm:text-sm font-black text-sky-900 dark:text-sky-200">
                  Team Bonus = total_team_sales × team_bonus_rate
                </span>
              </div>

              {/* Example Box (Misol) */}
              <div className="p-3.5 rounded-2xl bg-sky-50/40 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 space-y-1 font-mono text-xs text-slate-700 dark:text-slate-300">
                <div className="font-sans font-bold text-sky-800 dark:text-sky-300">
                  {currentModel.isLive ? t('ropCurrentMonthCalc') : t('ropExample')}
                </div>
                <div>
                  total_team_sales = $
                  {currentModel.totalTeamSales.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div>team_bonus_rate = {currentModel.teamBonusRatePct}</div>
                <div className="font-bold text-sky-700 dark:text-sky-300 pt-1 border-t border-sky-200 dark:border-sky-800/60">
                  Team Bonus ={' '}
                  {currentModel.totalTeamSales.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  × {currentModel.teamBonusRate} ={' '}
                  <span className="text-sm font-black text-sky-600 dark:text-sky-400">
                    $
                    {currentModel.teamBonusAmount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================= */}
          {/* PILLAR 3: TRUCK KPI (PURPLE THEME)                           */}
          {/* ============================================================= */}
          <div className="flex flex-col justify-between rounded-3xl p-6 bg-white dark:bg-slate-900 border-2 border-[#9333ea]/60 dark:border-purple-500/70 shadow-md relative group hover:shadow-purple-500/10 transition-all">
            <div className="space-y-4">
              {/* Header Badge & Title */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#7e22ce] text-white font-black text-sm flex items-center justify-center shadow">
                  3
                </div>
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#7e22ce] dark:text-purple-400">
                  <Truck className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
                    {t('ropComponent3Title')}
                  </h3>
                  <span className="text-xs font-extrabold text-[#9333ea] dark:text-purple-400 block">
                    {t('ropComponent3Subtitle')}
                  </span>
                </div>
              </div>

              {/* Explanatory Paragraph */}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {t('ropComponent3Desc')}
              </p>

              {/* Truck Tier Table */}
              <div className="overflow-hidden rounded-xl border border-purple-200 dark:border-purple-800 shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-purple-100/70 dark:bg-purple-950/60 text-purple-950 dark:text-purple-200 font-bold border-b border-purple-200 dark:border-purple-800">
                    <tr>
                      <th className="px-3 py-2">{t('ropColTruckCount')}</th>
                      <th className="px-3 py-2 text-right">{t('ropColTruckRate')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 dark:divide-purple-900/40 bg-white dark:bg-slate-900">
                    {truckCountTiers.map((tier, idx) => {
                      const isActive =
                        tier.max === Infinity
                          ? currentModel.truckCount >= 10
                          : currentModel.truckCount >= tier.min &&
                            currentModel.truckCount <= tier.max;

                      return (
                        <tr
                          key={idx}
                          className={`${
                            isActive
                              ? 'bg-purple-500/20 dark:bg-purple-950/80 font-black text-purple-900 dark:text-purple-200 ring-1 ring-purple-500/40'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-purple-50/40'
                          }`}
                        >
                          <td className="px-3 py-1.5 font-medium flex items-center gap-1.5">
                            {isActive && (
                              <CheckCircle2 className="size-3 text-purple-600 dark:text-purple-400 shrink-0" />
                            )}
                            <span>{tier.countLabel}</span>
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono font-extrabold">
                            {tier.rateLabel}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Formula Box */}
              <div className="p-3 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-300/80 dark:border-purple-700/60 text-center">
                <span className="font-mono text-xs sm:text-sm font-black text-purple-900 dark:text-purple-200">
                  Truck KPI = total_truck_profit × truck_count_rate
                </span>
              </div>

              {/* Example Box (Misol) */}
              <div className="p-3.5 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-1 font-mono text-xs text-slate-700 dark:text-slate-300">
                <div className="font-sans font-bold text-purple-800 dark:text-purple-300">
                  {currentModel.isLive ? t('ropCurrentMonthCalc') : t('ropExample')}
                </div>
                <div>
                  truck_count = {currentModel.truckCount} {t('ropTruckUnit')}
                </div>
                <div>
                  total_truck_profit = $
                  {currentModel.totalTruckProfit.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div>truck_count_rate = {currentModel.truckCountRatePct}</div>
                <div className="font-bold text-purple-700 dark:text-purple-300 pt-1 border-t border-purple-200 dark:border-purple-800/60">
                  Truck KPI ={' '}
                  {currentModel.totalTruckProfit.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  × {currentModel.truckCountRate} ={' '}
                  <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                    $
                    {currentModel.truckKpiAmount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* DOWNWARD FLOW ARROWS                                            */}
        {/* --------------------------------------------------------------- */}
        <div className="hidden lg:grid grid-cols-3 gap-6 text-center">
          <div className="flex justify-center">
            <ArrowDown className="size-6 text-emerald-500 animate-bounce" />
          </div>
          <div className="flex justify-center">
            <ArrowDown className="size-6 text-sky-500 animate-bounce" />
          </div>
          <div className="flex justify-center">
            <ArrowDown className="size-6 text-purple-500 animate-bounce" />
          </div>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* SECTION 4: YAKUNIY ROP TOTAL KPI (GRAND BOTTOM SUMMARY BANNER)   */}
        {/* --------------------------------------------------------------- */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500/60 dark:border-amber-500/70 shadow-xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left Badge & Header */}
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-black text-base flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
                4
              </div>
              <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                <DollarSign className="size-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
                  {t('ropComponent4Title')}
                </h2>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t('ropComponent4Subtitle')}
                </p>
              </div>
            </div>

            {/* Equation Flow Row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 sm:gap-3">
              {/* Box 1: Worker 1% */}
              <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400/80 dark:border-emerald-600 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                  {t('ropComponent1Title')}
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  $
                  {currentModel.worker1PctTotal.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <Plus className="size-5 text-slate-400 dark:text-slate-500 shrink-0" />

              {/* Box 2: Team Bonus */}
              <div className="px-4 py-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-400/80 dark:border-sky-600 text-center">
                <span className="text-[10px] uppercase font-bold text-sky-800 dark:text-sky-300 block">
                  {t('ropComponent2Title')}
                </span>
                <span className="text-base sm:text-lg font-black text-sky-600 dark:text-sky-400 font-mono">
                  $
                  {currentModel.teamBonusAmount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <Plus className="size-5 text-slate-400 dark:text-slate-500 shrink-0" />

              {/* Box 3: Truck KPI */}
              <div className="px-4 py-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-400/80 dark:border-purple-600 text-center">
                <span className="text-[10px] uppercase font-bold text-purple-800 dark:text-purple-300 block">
                  {t('ropComponent3Title')}
                </span>
                <span className="text-base sm:text-lg font-black text-purple-600 dark:text-purple-400 font-mono">
                  $
                  {currentModel.truckKpiAmount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <Equal className="size-5 text-slate-400 dark:text-slate-500 shrink-0" />

              {/* Final Master Output Badge */}
              <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl shadow-amber-500/25 text-center min-w-[180px]">
                <span className="text-[10px] uppercase font-black tracking-wider block opacity-90">
                  {t('ropTotalKpiFormula')}
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono">
                  $
                  {currentModel.ropTotalKpi.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* FOOTNOTE REFERENCE BOX                                          */}
        {/* --------------------------------------------------------------- */}
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3 text-xs">
          <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
            <FileText className="size-4" />
          </div>
          <div className="space-y-1 text-slate-700 dark:text-slate-300">
            <span className="font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wide block">
              {t('ropFootnoteTitle')}
            </span>
            <ul className="space-y-0.5 list-disc list-inside font-mono text-[11px] text-slate-600 dark:text-slate-400">
              <li>{t('ropFootnoteApi')}</li>
              <li>{t('ropFootnoteBackend')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
