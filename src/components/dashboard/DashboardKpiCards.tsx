import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Boxes,
  Percent,
  ShoppingCart,
  Receipt,
  Scale,
  CalendarCheck,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import type { DashboardSummaryResponse } from '../../types/dashboard';
import { formatMoney } from '../../services/api';
import { T } from '../T';
import type { TranslationKey } from '../../context/LanguageContext';

interface DashboardKpiCardsProps {
  summary: DashboardSummaryResponse | null;
  loading: boolean;
}

type KpiSpecMode = 'actuals' | 'monthly' | 'yearly';

export const DashboardKpiCards: React.FC<DashboardKpiCardsProps> = React.memo(
  ({ summary, loading }) => {
    const [specMode, setSpecMode] = useState<KpiSpecMode>('actuals');

    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-surface/60 dark:bg-night-surface/60 border border-border/40 dark:border-night-border animate-pulse p-4"
            />
          ))}
        </div>
      );
    }

    if (!summary) return null;

    const currency = summary.currency || 'UZS';

    // Extract values based on selected Spec Mode (Actuals vs Monthly vs Yearly)
    const hasMonthly = Boolean(summary.monthly);
    const hasYearly = Boolean(summary.yearly);

    let activeSales = summary.totalSales;
    let activeCost = summary.totalPurchaseCost;
    let activeMargin = summary.totalMargin;
    let activeMarginPct = summary.marginPercentage;
    let activeOrders = summary.totalOrders;
    let activeAov = summary.averageOrderValue;
    let activeSalesGrowth = summary.salesGrowthVsPriorPeriod;
    let activeMarginGrowth = summary.marginGrowthVsPriorPeriod;

    if (specMode === 'monthly' && summary.monthly) {
      activeSales = summary.monthly.revenue;
      activeCost = summary.monthly.purchaseCost ?? Math.round(activeSales * 0.65);
      activeMargin = summary.monthly.netProfit;
      activeMarginPct =
        summary.monthly.marginPercentage ??
        (activeSales > 0 ? Number(((activeMargin / activeSales) * 100).toFixed(2)) : 0);
      activeOrders = summary.monthly.orderCount;
      activeAov = activeOrders > 0 ? Number((activeSales / activeOrders).toFixed(2)) : 0;
      activeSalesGrowth = summary.monthly.revenueGrowthRate ?? null;
      activeMarginGrowth = summary.monthly.netProfitGrowthRate ?? null;
    } else if (specMode === 'yearly' && summary.yearly) {
      activeSales = summary.yearly.revenue;
      activeCost = summary.yearly.purchaseCost ?? Math.round(activeSales * 0.65);
      activeMargin = summary.yearly.netProfit;
      activeMarginPct =
        summary.yearly.marginPercentage ??
        (activeSales > 0 ? Number(((activeMargin / activeSales) * 100).toFixed(2)) : 0);
      activeOrders = summary.yearly.orderCount;
      activeAov = activeOrders > 0 ? Number((activeSales / activeOrders).toFixed(2)) : 0;
      activeSalesGrowth = summary.yearly.revenueGrowthRate ?? null;
      activeMarginGrowth = summary.yearly.netProfitGrowthRate ?? null;
    }

    const isSalesPositive = (activeSalesGrowth ?? 0) >= 0;
    const isMarginPositive = (activeMarginGrowth ?? 0) >= 0;

    const cards: {
      key: string;
      titleKey: TranslationKey;
      value: string;
      subtitle: React.ReactNode;
      icon: React.ReactNode;
      iconBg: string;
      badge: React.ReactNode;
    }[] = [
      {
        key: 'revenue',
        titleKey: 'ovKpiTotalRevenue',
        value: formatMoney(activeSales, currency),
        subtitle: (
          <span className="truncate">
            <T k="ovSubTotalRegisteredOrders" replacements={{ count: activeOrders }} />
          </span>
        ),
        icon: <DollarSign className="size-4.5" />,
        iconBg: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15',
        badge:
          activeSalesGrowth !== null ? (
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                isSalesPositive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              {isSalesPositive ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {isSalesPositive ? `+${activeSalesGrowth}%` : `${activeSalesGrowth}%`}
            </span>
          ) : null,
      },
      {
        key: 'margin',
        titleKey: 'ovKpiNetMargin',
        value: formatMoney(activeMargin, currency),
        subtitle: (
          <span className="truncate">
            <T k="ovSubMarginYield" replacements={{ pct: activeMarginPct }} />
          </span>
        ),
        icon: <Percent className="size-4.5" />,
        iconBg: 'bg-brand-gold/15 text-brand-gold',
        badge:
          activeMarginGrowth !== null ? (
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                isMarginPositive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              {isMarginPositive ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {isMarginPositive ? `+${activeMarginGrowth}%` : `${activeMarginGrowth}%`}
            </span>
          ) : (
            <span className="text-[10px] font-bold text-brand-gold px-1.5 py-0.5 rounded-full bg-brand-gold/10">
              {activeMarginPct}% yield
            </span>
          ),
      },
      {
        key: 'cogs',
        titleKey: 'ovKpiCarrierCost',
        value: formatMoney(activeCost, currency),
        subtitle: (
          <span className="truncate">
            <T k="ovSubCogsCost" />
          </span>
        ),
        icon: <Receipt className="size-4.5" />,
        iconBg: 'bg-purple-500/10 text-purple-500 dark:bg-purple-500/15',
        badge: (
          <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full">
            {activeSales > 0 ? Math.round((activeCost / activeSales) * 100) : 0}% of rev
          </span>
        ),
      },
      {
        key: 'orders',
        titleKey: 'ovKpiTotalOrders',
        value: String(activeOrders),
        subtitle: (
          <span className="truncate">
            <T
              k="ovSubCompletedPending"
              replacements={{
                completed: summary.completedOrders,
                waiting: summary.waitingOrders,
              }}
            />
          </span>
        ),
        icon: <ShoppingCart className="size-4.5" />,
        iconBg: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/15',
        badge: (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
            F: {summary.ftlOrderCount} | L: {summary.ltlOrderCount}
          </span>
        ),
      },
      {
        key: 'aov',
        titleKey: 'ovKpiAov',
        value: formatMoney(activeAov, currency),
        subtitle: (
          <span className="truncate">
            <T k="ovSubMeanRevenue" />
          </span>
        ),
        icon: <Package className="size-4.5" />,
        iconBg: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/15',
        badge: null,
      },
      {
        key: 'volume',
        titleKey: 'ovKpiVolumeWeight',
        value: `${summary.totalVolume} m³`,
        subtitle: (
          <span className="truncate">
            <T
              k="ovSubTotalWeight"
              replacements={{ weight: summary.totalWeight.toLocaleString() }}
            />
          </span>
        ),
        icon: <Boxes className="size-4.5" />,
        iconBg: 'bg-cyan-500/10 text-cyan-500 dark:bg-cyan-500/15',
        badge: (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            {(summary.totalWeight / 1000).toFixed(1)} t
          </span>
        ),
      },
    ];

    return (
      <div className="space-y-3">
        {/* Sub-Header Toolbar with Multi-Spec Run-Rate Pill Toggle & Cash Flow Status */}
        {(hasMonthly || hasYearly || summary.debtSummary) && (
          <div className="flex flex-wrap items-center justify-between gap-2.5 px-1">
            {/* Multi-Spec Mode Pills */}
            {(hasMonthly || hasYearly) && (
              <div className="flex items-center gap-1 p-0.5 bg-border/20 dark:bg-night-border/40 rounded-xl border border-border/30 dark:border-night-border/30">
                <button
                  type="button"
                  onClick={() => setSpecMode('actuals')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    specMode === 'actuals'
                      ? 'bg-brand-gold text-neutral-950 shadow-xs'
                      : 'text-muted dark:text-night-muted hover:text-foreground'
                  }`}
                >
                  <Sparkles className="size-3" />
                  <T k="ovKpiViewActuals" />
                </button>
                {hasMonthly && (
                  <button
                    type="button"
                    onClick={() => setSpecMode('monthly')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      specMode === 'monthly'
                        ? 'bg-brand-gold text-neutral-950 shadow-xs'
                        : 'text-muted dark:text-night-muted hover:text-foreground'
                    }`}
                  >
                    <CalendarDays className="size-3" />
                    <T k="ovKpiViewMonthly" />
                  </button>
                )}
                {hasYearly && (
                  <button
                    type="button"
                    onClick={() => setSpecMode('yearly')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      specMode === 'yearly'
                        ? 'bg-brand-gold text-neutral-950 shadow-xs'
                        : 'text-muted dark:text-night-muted hover:text-foreground'
                    }`}
                  >
                    <CalendarCheck className="size-3" />
                    <T k="ovKpiViewYearly" />
                  </button>
                )}
              </div>
            )}

            {/* Quick Cash Flow Balance Badge */}
            {summary.debtSummary && (
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-[11px] text-muted hidden sm:inline">
                  <T k="ovNetCashBalance" />:
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black border ${
                    summary.debtSummary.netBalance >= 0
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  }`}
                >
                  <Scale className="size-3.5" />
                  {formatMoney(
                    summary.debtSummary.netBalance,
                    summary.debtSummary.currency || currency
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Dense Responsive 6-Card Executive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {cards.map((card) => (
            <div
              key={card.key}
              className="p-3.5 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border hover:border-brand-gold/40 dark:hover:border-brand-gold/40 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between min-w-0"
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className={`p-2 rounded-xl ${card.iconBg} shrink-0`}>{card.icon}</div>
                {card.badge}
              </div>

              <div className="mt-3 flex flex-col min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted dark:text-night-muted truncate">
                  <T k={card.titleKey} />
                </span>
                <span
                  className="text-base sm:text-lg font-black text-foreground dark:text-night-text tracking-tight mt-0.5 truncate"
                  title={card.value}
                >
                  {card.value}
                </span>
                <div className="text-[10px] text-muted dark:text-night-muted mt-1 leading-tight truncate">
                  {card.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);
