import React, { useState } from 'react';
import { TrendingUp, Layers, BarChart3, Info } from 'lucide-react';
import type { DashboardSalesProgressResponse } from '../../types/dashboard';
import { formatMoney } from '../../services/api';
import { T } from '../T';

interface SalesProgressChartProps {
  data: DashboardSalesProgressResponse | null;
  loading: boolean;
}

type ChartMode = 'period' | 'cumulative';

export const SalesProgressChart: React.FC<SalesProgressChartProps> = React.memo(
  ({ data, loading }) => {
    const [mode, setMode] = useState<ChartMode>('period');
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    if (loading) {
      return (
        <div className="p-6 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border h-[400px] flex items-center justify-center animate-pulse">
          <div className="text-xs text-muted">
            <T k="loading" text="Loading Analytics..." />
          </div>
        </div>
      );
    }

    if (!data || !data.dataPoints || data.dataPoints.length === 0) {
      return (
        <div className="p-8 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border h-[400px] flex flex-col items-center justify-center gap-2 text-center">
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
    const svgHeight = 280;
    const paddingX = 40;
    const paddingY = 30;
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

    // Generate SVG path commands for smooth curves
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
      <div className="flex flex-col gap-4 p-6 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-sm transition-all duration-300">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground dark:text-night-text">
                <T k="ovChartSalesProgress" />
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                {meta.period} Preset • {meta.granularity} buckets
              </span>
            </div>
            <p className="text-xs text-muted dark:text-night-muted mt-0.5">
              Continuous zero-filled sales time-series with cumulative yield tracking
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-border/20 dark:bg-night-border/40 rounded-xl">
            <button
              onClick={() => setMode('period')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'period'
                  ? 'bg-brand-gold text-neutral-950 shadow-xs'
                  : 'text-muted dark:text-night-muted hover:text-foreground'
              }`}
            >
              <BarChart3 className="size-3.5" />
              <span>
                <T k="ovChartPeriodSales" />
              </span>
            </button>
            <button
              onClick={() => setMode('cumulative')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'cumulative'
                  ? 'bg-brand-gold text-neutral-950 shadow-xs'
                  : 'text-muted dark:text-night-muted hover:text-foreground'
              }`}
            >
              <Layers className="size-3.5" />
              <span>
                <T k="ovChartCumulative" />
              </span>
            </button>
          </div>
        </div>

        {/* Metric Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-background/60 dark:bg-night-bg/60 border border-border/40 dark:border-night-border/40">
          <div>
            <span className="text-[10px] font-bold uppercase text-muted">Total Sales</span>
            <p className="text-sm font-extrabold text-foreground dark:text-night-text">
              {formatMoney(summary.totalSales, 'USD')}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-muted">Net Margin</span>
            <p className="text-sm font-extrabold text-emerald-500">
              {formatMoney(summary.totalMargin, 'USD')} ({summary.marginPercentage}%)
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-muted">Order Volume</span>
            <p className="text-sm font-extrabold text-foreground dark:text-night-text">
              {summary.totalOrders} Orders ({summary.completedOrders} done)
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-muted">Sales Growth Rate</span>
            <p
              className={`text-sm font-extrabold flex items-center gap-1 ${
                (summary.growthRateSales ?? 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              <TrendingUp className="size-3.5" />
              {summary.growthRateSales !== null ? `${summary.growthRateSales}%` : 'N/A'}
            </p>
          </div>
        </div>

        {/* SVG Responsive Line/Area Chart */}
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible select-none"
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
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
                    ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                  </text>
                </g>
              );
            })}

            {/* Gradient Area under Sales Line */}
            <path d={salesAreaPath} fill="url(#salesGrad)" />

            {/* Margin Line */}
            <path
              d={marginPath}
              fill="none"
              stroke="#10b981"
              strokeWidth={mode === 'cumulative' ? 3 : 2}
              strokeDasharray={mode === 'period' ? '4 3' : 'none'}
            />

            {/* Sales Line */}
            <path
              d={salesPath}
              fill="none"
              stroke="#2563eb"
              strokeWidth={3}
              strokeLinecap="round"
            />

            {/* Interactive Hover Vertical Bar & Points */}
            {points.map((p, idx) => {
              const isHovered = hoverIndex === idx;
              return (
                <g key={idx}>
                  {/* Invisible Hover Hitbox */}
                  <rect
                    x={p.x - usableWidth / pointsCount / 2}
                    y={0}
                    width={usableWidth / pointsCount}
                    height={svgHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoverIndex(idx)}
                  />

                  {/* X Axis Labels (every 2-4 points depending on count) */}
                  {(idx % Math.ceil(pointsCount / 7) === 0 || idx === pointsCount - 1) && (
                    <text
                      x={p.x}
                      y={svgHeight - 8}
                      textAnchor="middle"
                      className="text-[10px] fill-muted dark:fill-night-muted font-medium"
                    >
                      {p.dataPoint.label}
                    </text>
                  )}

                  {/* Hover Indicator Vertical Line */}
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

          {/* Floating Tooltip Card */}
          {hoverPoint && (
            <div className="absolute top-2 right-4 p-3 rounded-xl bg-surface/95 dark:bg-night-surface/95 border border-border/80 dark:border-night-border shadow-lg backdrop-blur-md text-xs pointer-events-none min-w-[200px] animate-fadeIn">
              <div className="flex items-center justify-between font-bold border-b border-border/40 pb-1.5 mb-2">
                <span className="text-foreground dark:text-night-text">
                  {hoverPoint.dataPoint.label}
                </span>
                <span className="text-[10px] text-muted">{hoverPoint.dataPoint.dateKey}</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                  <span>{mode === 'period' ? 'Sales Revenue:' : 'Cumulative Sales:'}</span>
                  <span className="font-bold">
                    {formatMoney(
                      mode === 'period'
                        ? hoverPoint.dataPoint.sales
                        : hoverPoint.dataPoint.cumulativeSales,
                      'USD'
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-purple-500">
                  <span>Carrier Cost:</span>
                  <span className="font-medium">
                    {formatMoney(hoverPoint.dataPoint.purchaseCost, 'USD')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-emerald-500">
                  <span>{mode === 'period' ? 'Net Margin:' : 'Cumulative Margin:'}</span>
                  <span className="font-bold">
                    {formatMoney(
                      mode === 'period'
                        ? hoverPoint.dataPoint.margin
                        : hoverPoint.dataPoint.cumulativeMargin,
                      'USD'
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted text-[11px] pt-1 border-t border-border/30">
                  <span>Orders Count:</span>
                  <span className="font-semibold text-foreground">
                    {hoverPoint.dataPoint.orderCount} orders
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-2 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-blue-600" />
            <span className="text-foreground dark:text-night-text">
              {mode === 'period' ? 'Sales Revenue ($)' : 'Cumulative Revenue ($)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-emerald-500" />
            <span className="text-foreground dark:text-night-text">
              {mode === 'period' ? 'Net Profit Margin ($)' : 'Cumulative Net Margin ($)'}
            </span>
          </div>
        </div>
      </div>
    );
  }
);
