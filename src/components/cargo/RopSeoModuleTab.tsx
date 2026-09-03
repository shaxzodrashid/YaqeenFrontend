import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Crown,
  Search,
  DollarSign,
  CheckCircle,
  Calculator,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { cargoKpiApi, calculateSeoKpi } from '../../services/cargoKpi.service';
import type { RopSummaryResponse, SeoCalculateResult } from '../../services/cargoKpi.service';
import { SalesCareerSystemVisual } from './SalesCareerSystemVisual';
import { RopKpiLogicVisual } from './RopKpiLogicVisual';
import { NumberInput } from '../NumberInput';

export function RopSeoModuleTab() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  const [month, setMonth] = useState<string>('2026-07');
  const [ropData, setRopData] = useState<RopSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCareerSystem, setShowCareerSystem] = useState<boolean>(false);

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
                {t('ropSubtitle') || 'Head of Department (ROP) multi-tier KPI aggregation engine'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCareerSystem(!showCareerSystem)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                showCareerSystem
                  ? 'bg-brand-gold text-brand-navy font-extrabold shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              <BookOpen className="size-4" />
              <span>{t('managerCareerPoster') || 'Manager Career System Poster'}</span>
              {showCareerSystem ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Sales Career System Visual */}
        {showCareerSystem && (
          <div className="pt-2">
            <SalesCareerSystemVisual />
          </div>
        )}

        {/* Dedicated ROP KPI Logic Visual Canvas */}
        <RopKpiLogicVisual
          liveData={ropData}
          loading={loading}
          selectedMonth={month}
          onMonthChange={setMonth}
          onRefresh={loadRopData}
        />
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
                {t('seoSubtitle') || '10% Pure Net Profit KPI Calculator for SEO Managers'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SEO Input Controls */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Calculator className="size-4 text-brand-gold" />
              {t('seoNetProfitInput') || 'SEO Net Profit Input'}
            </h3>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {t('seoNetProfit')}
              </label>
              <NumberInput
                size="md"
                allowDecimals={true}
                decimalScale={2}
                min={0}
                value={seoProfitInput}
                onValueChange={(_num, raw) => setSeoProfitInput(raw)}
                placeholder="e.g. 15 000"
                prefix="$"
                suffix="USD"
                inputClassName="text-sm font-semibold"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs space-y-1">
              <span className="text-muted-foreground font-medium block">
                {t('seoCommissionPolicy') || 'SEO Commission Policy:'}
              </span>
              <p className="text-muted-foreground">
                {t('seoPolicyDesc') ||
                  'SEO managers receive a fixed 10% rate on pure net company profit.'}
              </p>
            </div>
          </div>

          {/* SEO Output Result Card */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-royal border border-brand-gold/30 text-white shadow-lg flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-brand-gold font-bold">
                    {t('calculatedSeoKpi') || 'Calculated SEO KPI'}
                  </span>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    {t('fixed10Share') || 'Fixed 10% Share'}
                  </p>
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
