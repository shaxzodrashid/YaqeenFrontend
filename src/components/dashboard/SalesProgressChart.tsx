import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Layers,
  Info,
  CalendarDays,
  CalendarCheck,
  TrendingUpDown,
} from 'lucide-react';
import type {
  DashboardSalesProgressResponse,
  DashboardSummaryResponse,
} from '../../types/dashboard';
import { formatMoney } from '../../services/api';
import { T } from '../T';
import { useTranslation } from '../../context/LanguageContext';

interface SalesProgressChartProps {
  data: DashboardSalesProgressResponse | null;
  summary?: DashboardSummaryResponse | null;
  loading: boolean;
}

type ChartMode = 'period' | 'cumulative';

export const SalesProgressChart: React.FC<SalesProgressChartProps> = React.memo(
  ({ data, summary: summaryProp, loading }) => {
    const [mode, setMode] = useState<ChartMode>('period');
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const { locale, t } = useTranslation();

    if (loading) {
      return (
        <div className="p-6 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border h-[420px] flex items-center justify-center animate-pulse">
          <div className="text-xs text-muted">
            <T k="ovLoadingAnalytics" />
          </div>
        </div>
      );
    }

    if (!data || !data.dataPoints || data.dataPoints.length === 0) {
      return (
        <div className="p-8 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border h-[420px] flex flex-col items-center justify-center gap-2 text-center">
          <Info className="size-8 text-muted" />
          <p className="text-sm font-semibold text-foreground dark:text-night-text">
            <T k="ovChartNoDataTitle" />
          </p>
          <p className="text-xs text-muted">
            <T k="ovChartNoDataDesc" />
          </p>
        </div>
      );
    }

    const { dataPoints, summary, meta } = data;
    const pointsCount = dataPoints.length;
    const currency = meta.currency || summary.currency || summaryProp?.currency || 'UZS';

    const monthlyBlock = summaryProp?.monthly;
    const yearlyBlock = summaryProp?.yearly;
    const hasRunRateData = Boolean(monthlyBlock || yearlyBlock);

    const dateLocaleCode = locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US';

    const formatPointDate = (dateKey?: string, label?: string) => {
      if (dateKey && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        const [y, m, d] = dateKey.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return date.toLocaleDateString(dateLocaleCode, { month: 'short', day: 'numeric' });
      }
      return label || '';
    };

    const formatFullPointDate = (dateKey?: string) => {
      if (dateKey && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        const [y, m, d] = dateKey.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return date.toLocaleDateString(dateLocaleCode, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
      return dateKey || '';
    };

    const granularityKeyMap: Record<string, string> = {
      hour: 'ovGranularityDaily',
      day: 'ovGranularityDaily',
      week: 'ovGranularityWeekly',
      month: 'ovGranularityMonthly',
      quarter: 'ovGranularityQuarterly',
      year: 'ovGranularityYearly',
    };
    const granularityKey = granularityKeyMap[String(meta.granularity).toLowerCase()] || '';
    const granularityLabel = granularityKey
      ? t(granularityKey)
      : meta.granularity || t('ovGranularityDaily');

    // Format compact Y-axis numbers (e.g. 250M, 500k)
    const formatCompactVal = (val: number) => {
      if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
      if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
      if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
      return `${val}`;
    };

    // Determine max values for scaling
    const maxVal = Math.max(
      ...dataPoints.map((d) =>
        mode === 'period'
          ? Math.max(d.sales, d.margin)
          : Math.max(d.cumulativeSales, d.cumulativeMargin)
      ),
      100
    );

    // Canvas bounds
    const svgWidth = 800;
    const svgHeight = 270;
    const paddingX = 52;
    const paddingY = 28;
    const usableWidth = svgWidth - paddingX * 2;
    const usableHeight = svgHeight - paddingY * 2;

    // Compute point coordinates
    const points = dataPoints.map((d, i) => {
      const x = paddingX + (i / Math.max(pointsCount - 1, 1)) * usableWidth;
      const salesVal = mode === 'period' ? d.sales : d.cumulativeSales;
      const marginVal = mode === 'period' ? d.margin : d.cumulativeMargin;

      const ySales = svgHeight - paddingY - (salesVal / maxVal) * usableHeight;
      const yMargin = svgHeight - paddingY - (marginVal / maxVal) * usableHeight;

      return { x, ySales, yMargin, dataPoint: d };
    });

    // Generate SVG path commands for smooth Bezier curves
    function generatePath(coords: { x: number; y: number }[]) {
      if (coords.length === 0) return '';
      if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;

      let path = `M ${coords[0].x} ${coords[0].y}`;
      for (let i = 0; i < coords.length - 1; i++) {
        const curr = coords[i];
        const next = coords[i + 1];
        const cpX = (curr.x + next.x) / 2;
        path += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
      }
      return path;
    }

    const salesPath = generatePath(points.map((p) => ({ x: p.x, y: p.ySales })));
    const marginPath = generatePath(points.map((p) => ({ x: p.x, y: p.yMargin })));
    const salesAreaPath = `${salesPath} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`;

    const hoverPoint = hoverIndex !== null ? points[hoverIndex] : points[points.length - 1];

    return (
      <div className="flex flex-col gap-4 p-5 sm:p-6 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-xs transition-all duration-300">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-foreground dark:text-night-text">
                <T k="ovFinancialHubTitle" />
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                {meta.period} • {granularityLabel}
              </span>
            </div>
            <p className="text-xs text-muted dark:text-night-muted mt-0.5">
              <T k="ovFinancialHubSubtitle" />
            </p>
          </div>

          {/* Timeline Mode Switcher (Period vs Cumulative) */}
          <div className="flex items-center p-1 bg-border/20 dark:bg-night-border/40 rounded-xl border border-border/30 dark:border-night-border/30">
            <button
              type="button"
              onClick={() => setMode('period')}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'period'
                  ? 'bg-brand-gold text-neutral-950 shadow-xs'
                  : 'text-muted dark:text-night-muted hover:text-foreground'
              }`}
            >
              <T k="ovChartPeriodSales" />
            </button>
            <button
              type="button"
              onClick={() => setMode('cumulative')}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'cumulative'
                  ? 'bg-brand-gold text-neutral-950 shadow-xs'
                  : 'text-muted dark:text-night-muted hover:text-foreground'
              }`}
            >
              <Layers className="size-3.5" />
              <T k="ovChartCumulative" />
            </button>
          </div>
        </div>

        {/* Metric Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 p-3.5 rounded-xl bg-background/60 dark:bg-night-bg/60 border border-border/40 dark:border-night-border/40">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase text-muted block truncate">
              <T k="ovSummaryTotalRevenue" />
            </span>
            <p
              className="text-xs sm:text-sm font-extrabold text-foreground dark:text-night-text truncate"
              title={formatMoney(summary.totalSales, currency)}
            >
              {formatMoney(summary.totalSales, currency)}
            </p>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase text-muted block truncate">
              <T k="ovSummaryNetMargin" />
            </span>
            <p
              className="text-xs sm:text-sm font-extrabold text-emerald-500 truncate"
              title={`${formatMoney(summary.totalMargin, currency)} (${summary.marginPercentage}%)`}
            >
              {formatMoney(summary.totalMargin, currency)}{' '}
              <span className="text-[10px] text-muted">({summary.marginPercentage}%)</span>
            </p>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase text-muted block truncate">
              <T k="ovSummaryShipmentVolume" />
            </span>
            <p className="text-xs sm:text-sm font-extrabold text-foreground dark:text-night-text truncate">
              {t('ovSummaryOrdersCount', { count: summary.totalOrders })}{' '}
              <span className="text-[10px] text-muted">
                ({t('ovSummaryDoneCount', { completed: summary.completedOrders })})
              </span>
            </p>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase text-muted block truncate">
              <T k="ovSummarySalesGrowth" />
            </span>
            <p
              className={`text-xs sm:text-sm font-extrabold flex items-center gap-1 ${
                (summary.growthRateSales ?? 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              <TrendingUp className="size-3.5" />
              {summary.growthRateSales !== null
                ? `${summary.growthRateSales}%`
                : t('ovNotAvailable')}
            </p>
          </div>
        </div>

        {/* Financial Trajectory Chart */}
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible select-none"
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = svgHeight - paddingY - ratio * usableHeight;
              const val = Math.round(maxVal * ratio);
              return (
                <g key={ratio}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="currentColor"
                    className="text-border/30 dark:text-night-border/30"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] fill-muted dark:fill-night-muted font-mono"
                  >
                    {formatCompactVal(val)}
                  </text>
                </g>
              );
            })}

            {/* Gradient Area under Sales Line */}
            <path d={salesAreaPath} fill="url(#salesGrad)" />

            {/* Margin Curve */}
            <path
              d={marginPath}
              fill="none"
              stroke="#10b981"
              strokeWidth={mode === 'cumulative' ? 3 : 2}
              strokeDasharray={mode === 'period' ? '4 3' : 'none'}
            />

            {/* Sales Curve */}
            <path
              d={salesPath}
              fill="none"
              stroke="#2563eb"
              strokeWidth={3}
              strokeLinecap="round"
            />

            {/* Interactive Hover Hitboxes & Axis labels */}
            {points.map((p, idx) => {
              const isHovered = hoverIndex === idx;
              return (
                <g key={idx}>
                  {/* Hitbox */}
                  <rect
                    x={p.x - usableWidth / pointsCount / 2}
                    y={0}
                    width={usableWidth / pointsCount}
                    height={svgHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoverIndex(idx)}
                  />

                  {/* X Axis Labels */}
                  {(idx % Math.ceil(pointsCount / 7) === 0 || idx === pointsCount - 1) && (
                    <text
                      x={p.x}
                      y={svgHeight - 6}
                      textAnchor="middle"
                      className="text-[10px] fill-muted dark:fill-night-muted font-medium"
                    >
                      {formatPointDate(p.dataPoint.dateKey, p.dataPoint.label)}
                    </text>
                  )}

                  {/* Hover indicator */}
                  {isHovered && (
                    <>
                      <line
                        x1={p.x}
                        y1={paddingY}
                        x2={p.x}
                        y2={svgHeight - paddingY}
                        stroke="#d97706"
                        strokeWidth={1.5}
                        strokeDasharray="2 2"
                      />
                      <circle
                        cx={p.x}
                        cy={p.ySales}
                        r={5}
                        fill="#2563eb"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                      <circle
                        cx={p.x}
                        cy={p.yMargin}
                        r={4}
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    </>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Tooltip Card */}
          {hoverPoint && (
            <div className="absolute top-2 right-3 p-3 rounded-xl bg-surface/95 dark:bg-night-surface/95 border border-border/80 dark:border-night-border shadow-lg backdrop-blur-md text-xs pointer-events-none min-w-[200px] max-w-[260px] animate-fadeIn z-10">
              <div className="flex items-center justify-between font-bold border-b border-border/40 pb-1.5 mb-2 gap-2">
                <span className="text-foreground dark:text-night-text truncate">
                  {formatPointDate(hoverPoint.dataPoint.dateKey, hoverPoint.dataPoint.label)}
                </span>
                <span className="text-[10px] text-muted shrink-0">
                  {formatFullPointDate(hoverPoint.dataPoint.dateKey)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2 text-blue-600 dark:text-blue-400">
                  <span className="shrink-0">
                    {mode === 'period' ? t('ovChartRevenue') : t('ovChartCumulativeRevenue')}
                  </span>
                  <span className="font-bold truncate text-right">
                    {formatMoney(
                      mode === 'period'
                        ? hoverPoint.dataPoint.sales
                        : hoverPoint.dataPoint.cumulativeSales,
                      currency
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-purple-500">
                  <span className="shrink-0">{t('ovChartFreightCost')}</span>
                  <span className="font-medium truncate text-right">
                    {formatMoney(hoverPoint.dataPoint.purchaseCost, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-emerald-500">
                  <span className="shrink-0">
                    {mode === 'period' ? t('ovChartNetMargin') : t('ovChartCumulativeMargin')}
                  </span>
                  <span className="font-bold truncate text-right">
                    {formatMoney(
                      mode === 'period'
                        ? hoverPoint.dataPoint.margin
                        : hoverPoint.dataPoint.cumulativeMargin,
                      currency
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted text-[11px] pt-1 border-t border-border/30">
                  <span>{t('ovChartOrders')}</span>
                  <span className="font-semibold text-foreground dark:text-night-text">
                    {t('ovShipmentsCount', { count: hoverPoint.dataPoint.orderCount })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-1 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-blue-600 shrink-0" />
            <span className="text-foreground dark:text-night-text">
              {mode === 'period'
                ? t('ovLegendSalesRevenue', { currency })
                : t('ovLegendCumulativeRevenue', { currency })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-foreground dark:text-night-text">
              {mode === 'period'
                ? t('ovLegendNetMargin', { currency })
                : t('ovLegendCumulativeMargin', { currency })}
            </span>
          </div>
        </div>

        {/* Run-Rate Projections Matrix (Integrated when data exists) */}
        {hasRunRateData && (
          <div className="space-y-3 pt-3 border-t border-border/30 dark:border-night-border/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <TrendingUpDown className="size-3.5 text-brand-gold" />
                <T k="ovViewRunRate" />
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Monthly Run-Rate Card */}
              {monthlyBlock && (
                <div className="p-4 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 dark:border-night-border/40 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-brand-gold/15 text-brand-gold">
                        <CalendarDays className="size-4" />
                      </div>
                      <span className="text-xs font-bold text-foreground dark:text-night-text">
                        <T k="ovMonthlyPerformanceMatrix" />
                      </span>
                    </div>
                    {monthlyBlock.revenueGrowthRate !== undefined && (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          (monthlyBlock.revenueGrowthRate ?? 0) >= 0
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {(monthlyBlock.revenueGrowthRate ?? 0) >= 0 ? (
                          <TrendingUp className="size-3" />
                        ) : (
                          <TrendingDown className="size-3" />
                        )}
                        {monthlyBlock.revenueGrowthRate}% {t('ovMoMSuffix')}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-muted font-semibold uppercase">
                        <T k="ovMonthlyRevenue" />
                      </span>
                      <p className="text-sm font-extrabold text-foreground dark:text-night-text">
                        {formatMoney(monthlyBlock.revenue, currency)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted font-semibold uppercase">
                        <T k="ovMonthlyNetProfit" />
                      </span>
                      <p className="text-sm font-extrabold text-emerald-500">
                        {formatMoney(monthlyBlock.netProfit, currency)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted font-semibold uppercase">
                        <T k="ovMarginYield" />
                      </span>
                      <p className="text-xs font-bold text-brand-gold">
                        {monthlyBlock.marginPercentage ??
                          (monthlyBlock.revenue > 0
                            ? ((monthlyBlock.netProfit / monthlyBlock.revenue) * 100).toFixed(1)
                            : 0)}
                        %
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted font-semibold uppercase">
                        <T k="ovShipmentsTitle" />
                      </span>
                      <p className="text-xs font-bold text-foreground dark:text-night-text">
                        {t('ovOrdersCount', { count: monthlyBlock.orderCount })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Yearly Projections Card */}
              {yearlyBlock && (
                <div className="p-4 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 dark:border-night-border/40 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-500">
                        <CalendarCheck className="size-4" />
                      </div>
                      <span className="text-xs font-bold text-foreground dark:text-night-text">
                        <T k="ovYtdTrajectory" />
                      </span>
                    </div>
                    {yearlyBlock.revenueGrowthRate !== undefined && (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          (yearlyBlock.revenueGrowthRate ?? 0) >= 0
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {(yearlyBlock.revenueGrowthRate ?? 0) >= 0 ? (
                          <TrendingUp className="size-3" />
                        ) : (
                          <TrendingDown className="size-3" />
                        )}
                        {yearlyBlock.revenueGrowthRate}% {t('ovYoYSuffix')}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-muted font-semibold uppercase">
                        <T k="ovAnnualizedRevenue" />
                      </span>
                      <p className="text-sm font-extrabold text-foreground dark:text-night-text">
                        {formatMoney(yearlyBlock.revenue, currency)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted font-semibold uppercase">
                        <T k="ovAnnualNetProfit" />
                      </span>
                      <p className="text-sm font-extrabold text-emerald-500">
                        {formatMoney(yearlyBlock.netProfit, currency)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted font-semibold uppercase">
                        <T k="ovMarginYield" />
                      </span>
                      <p className="text-xs font-bold text-brand-gold">
                        {yearlyBlock.marginPercentage ??
                          (yearlyBlock.revenue > 0
                            ? ((yearlyBlock.netProfit / yearlyBlock.revenue) * 100).toFixed(1)
                            : 0)}
                        %
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted font-semibold uppercase">
                        <T k="ovTotalAnnualOrders" />
                      </span>
                      <p className="text-xs font-bold text-foreground dark:text-night-text">
                        {t('ovOrdersCount', { count: yearlyBlock.orderCount })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);
