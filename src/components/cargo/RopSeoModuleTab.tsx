import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Search,
  Users,
  Award,
  Truck,
  DollarSign,
  CheckCircle,
  RefreshCw,
  Calculator,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { cargoKpiApi, calculateSeoKpi } from '../../services/cargoKpi.service';
import type { RopSummaryResponse, SeoCalculateResult } from '../../services/cargoKpi.service';

const ROP_TEAM_BONUS_TIERS = [
  { range: '< $25,000', rate: '0%', minVal: 0, maxVal: 25000 },
  { range: '$25,000 – $29,999', rate: '2.0%', minVal: 25000, maxVal: 30000 },
  { range: '$30,000 – $34,999', rate: '2.5%', minVal: 30000, maxVal: 35000 },
  { range: '$35,000 – $39,999', rate: '3.0%', minVal: 35000, maxVal: 40000 },
  { range: '$40,000 – $44,999', rate: '4.5%', minVal: 40000, maxVal: 45000 },
  { range: '$45,000 – $54,999', rate: '6.0%', minVal: 45000, maxVal: 55000 },
  { range: '≥ $55,000', rate: '7.0%', minVal: 55000, maxVal: Infinity },
];

const ROP_TRUCK_RATE_TIERS = [
  { range: '0 trucks', rate: '0%', minT: 0, maxT: 0 },
  { range: '1 – 2 trucks', rate: '1.0%', minT: 1, maxT: 2 },
  { range: '3 – 5 trucks', rate: '1.5%', minT: 3, maxT: 5 },
  { range: '6 – 9 trucks', rate: '2.0%', minT: 6, maxT: 9 },
  { range: '≥ 10 trucks', rate: '2.5%', minT: 10, maxT: Infinity },
];

export function RopSeoModuleTab() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  const [month, setMonth] = useState<string>('2026-07');
  const [ropData, setRopData] = useState<RopSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // SEO calculator state
  const [seoProfitInput, setSeoProfitInput] = useState<string>('15000');

  const loadRopData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cargoKpiApi.getRopSummary(month);
      setRopData(res);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to load ROP summary', 'error');
    } finally {
      setLoading(false);
    }
  }, [month, showNotification]);

  useEffect(() => {
    loadRopData();
  }, [loadRopData]);

  const seoResult: SeoCalculateResult = useMemo(() => {
    const parsed = parseFloat(seoProfitInput);
    const profit = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    return calculateSeoKpi(profit);
  }, [seoProfitInput]);

  return (
    <div className="space-y-8">
      {/* ----------------------------------------------------------------- */}
      {/* SECTION 1: ROP KPI MODULE                                          */}
      {/* ----------------------------------------------------------------- */}
      <div className="space-y-6">
        {/* ROP Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-brand-navy via-brand-royal to-brand-navy border border-brand-gold/30 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
              <Crown className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {t('tabRopKpi')}
              </h2>
              <p className="text-xs text-neutral-300 mt-0.5">
                Head of Department (ROP) multi-tier KPI aggregation engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 text-white text-xs font-semibold focus:outline-none cursor-pointer"
            />
            <button
              onClick={loadRopData}
              disabled={loading}
              className="p-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-white transition-all cursor-pointer"
            >
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ROP Total KPI Grand Summary Banner */}
        {ropData && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                  {t('ropTotalKpi')} Formula
                </span>
                <h3 className="text-base font-extrabold text-foreground mt-0.5">
                  ROP KPI = Worker 1% + Team Bonus + Truck KPI
                </h3>
              </div>
              <div className="flex items-baseline gap-2 bg-brand-gold/15 border border-brand-gold/30 px-5 py-2.5 rounded-2xl">
                <span className="text-xs font-bold text-brand-gold uppercase">Total KPI:</span>
                <span className="text-3xl font-black text-brand-gold">
                  $
                  {(ropData?.rop_total_kpi ?? 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* 3 Pillar Component Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center justify-between text-xs text-blue-500 font-semibold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Users className="size-4" />
                    {t('ropWorker1Pct')}
                  </span>
                  <span>1.0%</span>
                </div>
                <h4 className="text-xl font-bold text-foreground">
                  ${(ropData?.worker_1pct_total ?? 0).toLocaleString()}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-1">
                  From {ropData?.workers_breakdown?.length || 0} LTL sales employees
                </p>
              </div>

              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center justify-between text-xs text-purple-500 font-semibold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Award className="size-4" />
                    {t('ropTeamBonus')}
                  </span>
                  <span>{ropData?.team_bonus_percentage || '0%'}</span>
                </div>
                <h4 className="text-xl font-bold text-foreground">
                  ${(ropData?.team_bonus_amount ?? 0).toLocaleString()}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Based on ${(ropData?.team_bonus_profit ?? 0).toLocaleString()} LTL profit
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center justify-between text-xs text-emerald-500 font-semibold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Truck className="size-4" />
                    {t('ropTruckKpi')}
                  </span>
                  <span>{ropData?.truck_rate_percentage || '0%'}</span>
                </div>
                <h4 className="text-xl font-bold text-foreground">
                  ${(ropData?.truck_kpi_amount ?? 0).toLocaleString()}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Based on {ropData?.truck_count ?? 0} FTL trucks shipped
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Worker 1% Breakdown & Tiers Detail Grid */}
        {ropData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Worker 1% Table */}
            <div className="lg:col-span-6 p-6 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Users className="size-4 text-brand-gold" />
                Component 1: Employee Base KPI 1% Share
              </h3>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5">Employee Name</th>
                      <th className="px-4 py-2.5">Base LTL KPI</th>
                      <th className="px-4 py-2.5 text-right">1% Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {ropData.workers_breakdown?.map((worker, idx) => (
                      <tr key={idx} className="hover:bg-muted/20 text-foreground">
                        <td className="px-4 py-2.5 font-semibold">{worker.employee_name}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">${worker.base_kpi}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-500">
                          ${worker.worker_1pct_kpi}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-muted/40 font-bold text-foreground">
                      <td className="px-4 py-2.5">Total Worker 1% Share</td>
                      <td className="px-4 py-2.5">—</td>
                      <td className="px-4 py-2.5 text-right text-emerald-500">
                        ${ropData.worker_1pct_total}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Team & Truck Bonus Schedules */}
            <div className="lg:col-span-6 space-y-6">
              {/* Team Bonus Schedule */}
              <div className="p-6 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Award className="size-4 text-brand-gold" />
                  Component 2: Team Bonus Tiers
                </h3>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                      <tr>
                        <th className="px-3 py-2">Profit Bracket</th>
                        <th className="px-3 py-2">Bonus Rate</th>
                        <th className="px-3 py-2 text-right">Active Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {ROP_TEAM_BONUS_TIERS.map((tier, idx) => {
                        const isActive =
                          ropData.total_ltl_profit >= tier.minVal &&
                          (tier.maxVal === Infinity
                            ? ropData.total_ltl_profit >= 55000
                            : ropData.total_ltl_profit < tier.maxVal);

                        return (
                          <tr
                            key={idx}
                            className={`${
                              isActive
                                ? 'bg-brand-gold/15 font-bold text-brand-gold'
                                : 'text-foreground'
                            }`}
                          >
                            <td className="px-3 py-2">{tier.range}</td>
                            <td className="px-3 py-2 font-mono">{tier.rate}</td>
                            <td className="px-3 py-2 text-right">
                              {isActive && (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-brand-gold text-brand-navy font-extrabold">
                                  Active
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Truck KPI Schedule */}
              <div className="p-6 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Truck className="size-4 text-brand-gold" />
                  Component 3: Truck Count Tiers
                </h3>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                      <tr>
                        <th className="px-3 py-2">Truck Count</th>
                        <th className="px-3 py-2">Rate</th>
                        <th className="px-3 py-2 text-right">Active Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {ROP_TRUCK_RATE_TIERS.map((tier, idx) => {
                        const count = ropData.truck_count;
                        const isActive =
                          tier.maxT === Infinity
                            ? count >= 10
                            : count >= tier.minT && count <= tier.maxT;

                        return (
                          <tr
                            key={idx}
                            className={`${
                              isActive
                                ? 'bg-emerald-500/15 font-bold text-emerald-500'
                                : 'text-foreground'
                            }`}
                          >
                            <td className="px-3 py-2">{tier.range}</td>
                            <td className="px-3 py-2 font-mono">{tier.rate}</td>
                            <td className="px-3 py-2 text-right">
                              {isActive && (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500 text-white font-extrabold">
                                  Active ({count} trucks)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* SECTION 2: SEO KPI CALCULATOR                                     */}
      {/* ----------------------------------------------------------------- */}
      <div className="pt-6 border-t border-border space-y-6">
        <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-navy via-brand-royal to-brand-navy border border-brand-gold/30 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
              <Search className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {t('tabSeoKpi')}
              </h2>
              <p className="text-xs text-neutral-300 mt-0.5">
                10% Pure Net Profit KPI Calculator for SEO Managers
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SEO Input Controls */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Calculator className="size-4 text-brand-gold" />
              SEO Net Profit Input
            </h3>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {t('seoNetProfit')}
              </label>
              <div className="relative rounded-xl shadow-sm">
                <input
                  type="number"
                  step="100"
                  min="0"
                  value={seoProfitInput}
                  onChange={(e) => setSeoProfitInput(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full pl-4 pr-12 py-3 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-muted-foreground">
                  USD
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs space-y-1">
              <span className="text-muted-foreground font-medium block">
                SEO Commission Policy:
              </span>
              <p className="text-muted-foreground">
                SEO managers receive a fixed <strong>10% rate</strong> on pure net company profit.
              </p>
            </div>
          </div>

          {/* SEO Output Result Card */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-royal border border-brand-gold/30 text-white shadow-lg flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-brand-gold font-bold">
                    Calculated SEO KPI
                  </span>
                  <p className="text-xs text-neutral-300 mt-0.5">Fixed 10% Share</p>
                </div>
                <div className="p-2.5 rounded-xl bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                  <DollarSign className="size-6" />
                </div>
              </div>

              <div className="py-6 my-auto">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl md:text-5xl font-black tracking-tight text-white">
                    $
                    {seoResult.seo_kpi.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-sm font-semibold text-brand-gold">USD</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-neutral-300">
                  <CheckCircle className="size-4 text-emerald-400" />
                  <span>
                    Net Profit: ${seoResult.net_profit.toLocaleString()} ×{' '}
                    {seoResult.seo_rate_percentage}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-neutral-400 block">{t('seoNetProfit')}</span>
                  <span className="text-base font-bold text-white mt-0.5 block">
                    ${seoResult.net_profit.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-neutral-400 block">{t('seoRate')}</span>
                  <span className="text-base font-bold text-brand-gold mt-0.5 block">10.0%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
