import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Boxes,
  Weight,
  Percent,
  ShoppingCart,
  Receipt,
} from 'lucide-react';
import type { DashboardSummaryResponse } from '../../types/dashboard';
import { formatMoney } from '../../services/api';
import { T } from '../T';
import type { TranslationKey } from '../../context/LanguageContext';

interface DashboardKpiCardsProps {
  summary: DashboardSummaryResponse | null;
  loading: boolean;
}

export const DashboardKpiCards: React.FC<DashboardKpiCardsProps> = React.memo(({ summary, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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

  const salesGrowth = summary.salesGrowthVsPriorPeriod ?? 0;
  const isSalesPositive = salesGrowth >= 0;

  const marginGrowth = summary.marginGrowthVsPriorPeriod ?? 0;
  const isMarginPositive = marginGrowth >= 0;

  const cards: {
    titleKey: TranslationKey;
    value: string;
    subtitleKey: TranslationKey;
    subtitleReplacements?: Record<string, string | number>;
    icon: React.ReactNode;
    iconBg: string;
    badge: React.ReactNode;
  }[] = [
    {
      titleKey: 'ovKpiTotalRevenue',
      value: formatMoney(summary.totalSales, 'USD'),
      subtitleKey: 'ovSubTotalRegisteredOrders',
      subtitleReplacements: { count: summary.totalOrders },
      icon: <DollarSign className="size-5" />,
      iconBg: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15',
      badge:
        summary.salesGrowthVsPriorPeriod !== null ? (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isSalesPositive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}
          >
            {isSalesPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {isSalesPositive ? `+${salesGrowth}%` : `${salesGrowth}%`}
          </span>
        ) : null,
    },
    {
      titleKey: 'ovKpiNetMargin',
      value: formatMoney(summary.totalMargin, 'USD'),
      subtitleKey: 'ovSubMarginYield',
      subtitleReplacements: { pct: summary.marginPercentage },
      icon: <Percent className="size-5" />,
      iconBg: 'bg-brand-gold/15 text-brand-gold',
      badge:
        summary.marginGrowthVsPriorPeriod !== null ? (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isMarginPositive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}
          >
            {isMarginPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {isMarginPositive ? `+${marginGrowth}%` : `${marginGrowth}%`}
          </span>
        ) : (
          <span className="text-[11px] font-bold text-brand-gold px-2 py-0.5 rounded-full bg-brand-gold/10">
            {summary.marginPercentage}% yield
          </span>
        ),
    },
    {
      titleKey: 'ovKpiCarrierCost',
      value: formatMoney(summary.totalPurchaseCost, 'USD'),
      subtitleKey: 'ovSubCogsCost',
      icon: <Receipt className="size-5" />,
      iconBg: 'bg-purple-500/10 text-purple-500 dark:bg-purple-500/15',
      badge: null,
    },
    {
      titleKey: 'ovKpiTotalOrders',
      value: String(summary.totalOrders),
      subtitleKey: 'ovSubCompletedPending',
      subtitleReplacements: { completed: summary.completedOrders, waiting: summary.waitingOrders },
      icon: <ShoppingCart className="size-5" />,
      iconBg: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/15',
      badge: (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
          FTL: {summary.ftlOrderCount} | LTL: {summary.ltlOrderCount}
        </span>
      ),
    },
    {
      titleKey: 'ovKpiAov',
      value: formatMoney(summary.averageOrderValue, 'USD'),
      subtitleKey: 'ovSubMeanRevenue',
      icon: <Package className="size-5" />,
      iconBg: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/15',
      badge: null,
    },
    {
      titleKey: 'ovKpiVolumeWeight',
      value: `${summary.totalVolume} m³`,
      subtitleKey: 'ovSubTotalWeight',
      subtitleReplacements: { weight: summary.totalWeight.toLocaleString() },
      icon: <Boxes className="size-5" />,
      iconBg: 'bg-cyan-500/10 text-cyan-500 dark:bg-cyan-500/15',
      badge: (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
          <Weight className="size-3" />
          {(summary.totalWeight / 1000).toFixed(1)} t
        </span>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div
          key={card.titleKey}
          className="p-4 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border hover:border-brand-gold/40 dark:hover:border-brand-gold/40 shadow-xs hover:shadow-md transition-colors duration-200 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2">
            <div className={`p-2.5 rounded-xl ${card.iconBg} shrink-0`}>{card.icon}</div>
            {card.badge}
          </div>

          <div className="mt-3 flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted dark:text-night-muted">
              <T k={card.titleKey} />
            </span>
            <span className="text-xl font-black text-foreground dark:text-night-text tracking-tight mt-0.5">
              {card.value}
            </span>
            <span className="text-[11px] text-muted dark:text-night-muted mt-1 leading-tight line-clamp-1">
              <T k={card.subtitleKey} replacements={card.subtitleReplacements} />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
});

