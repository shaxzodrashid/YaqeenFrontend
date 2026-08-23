import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  TrainFront,
  Plane,
  Ship,
  Boxes,
  Package,
  MapPin,
  ArrowRight,
  Globe2,
  Gauge,
  Clock3,
  PackageCheck,
  Timer,
  LayoutGrid,
  TrendingUp,
} from 'lucide-react';
import type {
  DashboardCargoDistributionResponse,
  DashboardRouteAnalyticsResponse,
  DashboardDeliveryEfficiencyResponse,
  TransportTypeDistributionItem,
} from '../../types/dashboard';
import { formatMoney } from '../../services/api';
import { T } from '../T';

interface LogisticsOperationsHubProps {
  cargoDist: DashboardCargoDistributionResponse | null;
  routeData: DashboardRouteAnalyticsResponse | null;
  deliveryData: DashboardDeliveryEfficiencyResponse | null;
  loading: boolean;
  currency?: string;
}

type LogisticsViewTab = 'overview' | 'corridors' | 'modalities' | 'speed';

const TRANSPORT_VISUALS: Record<string, { icon: React.ReactNode; bar: string; chip: string }> = {
  AUTO: {
    icon: <Truck className="size-4" />,
    bar: 'from-blue-500 to-cyan-400',
    chip: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  },
  RAILWAY: {
    icon: <TrainFront className="size-4" />,
    bar: 'from-amber-500 to-orange-400',
    chip: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },
  AIR: {
    icon: <Plane className="size-4" />,
    bar: 'from-violet-500 to-fuchsia-400',
    chip: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  },
  SEA: {
    icon: <Ship className="size-4" />,
    bar: 'from-teal-500 to-emerald-400',
    chip: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
  },
  OTHER: {
    icon: <Package className="size-4" />,
    bar: 'from-slate-400 to-slate-300',
    chip: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
  },
};

/** Solid hex colors for pie slices — mirrors TRANSPORT_VISUALS gradients */
const TRANSPORT_PIE_COLORS: Record<string, string> = {
  AUTO: '#3b82f6',
  RAILWAY: '#f59e0b',
  AIR: '#8b5cf6',
  SEA: '#14b8a6',
  OTHER: '#94a3b8',
};

/** Solid hex colors for status pie slices — mirrors statusColor() */
function statusHex(category: string): string {
  switch (category) {
    case 'Arrived':
      return '#10b981';
    case 'On the way':
      return '#06b6d4';
    case 'Waiting':
      return '#f59e0b';
    case 'Station':
      return '#ec4899';
    case 'On the border':
      return '#8b5cf6';
    default:
      return '#f97316';
  }
}

interface PieSliceData {
  key: string;
  label: string;
  value: number;
  percentage: number;
  color: string;
}

function polarPoint(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function pieSlicePath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number
): string {
  const [x1, y1] = polarPoint(cx, cy, rOuter, startAngle);
  const [x2, y2] = polarPoint(cx, cy, rOuter, endAngle);
  const [x3, y3] = polarPoint(cx, cy, rInner, endAngle);
  const [x4, y4] = polarPoint(cx, cy, rInner, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `L ${x3.toFixed(2)} ${y3.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
    'Z',
  ].join(' ');
}

/**
 * Big premium pie chart — chunky wedges with subtle angular gaps,
 * hover-expanding slices, a frosted-glass center KPI badge and a
 * minimal dot · label · % legend. Pure SVG, no external chart lib.
 */
function PremiumPieChart({ slices, size = 216 }: { slices: PieSliceData[]; size?: number }) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const total = slices.reduce((acc, s) => acc + s.value, 0) || 1;
  const activeSlice = slices.find((s) => s.key === hoveredKey) ?? null;

  let cursor = 0;
  const gapDeg = slices.length > 1 ? 2 : 0;
  const arcs = slices.map((s) => {
    const sweep = (Math.max(s.value, 0) / total) * 360;
    const start = cursor + gapDeg / 2;
    const end = Math.max(cursor + sweep - gapDeg / 2, start + 0.5);
    cursor += sweep;
    const midRad = (((start + end) / 2 - 90) * Math.PI) / 180;
    return {
      ...s,
      start,
      end,
      dx: Math.cos(midRad) * 5,
      dy: Math.sin(midRad) * 5,
    };
  });

  const isFullCircle = arcs.length === 1;

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <motion.div
        className="relative"
        style={{ width: size, height: size }}
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
          {isFullCircle ? (
            <circle
              cx="100"
              cy="100"
              r={(92 + 36) / 2}
              fill={arcs[0].color}
              stroke="none"
              className="transition-opacity duration-300"
              opacity={hoveredKey && hoveredKey !== arcs[0].key ? 0.4 : 1}
            />
          ) : (
            arcs.map((a) => (
              <path
                key={a.key}
                d={pieSlicePath(100, 100, 92, 36, a.start, a.end)}
                fill={a.color}
                onMouseEnter={() => setHoveredKey(a.key)}
                onMouseLeave={() => setHoveredKey(null)}
                className="cursor-pointer"
                style={{
                  transform:
                    hoveredKey === a.key
                      ? `translate(${a.dx}px, ${a.dy}px)`
                      : 'translate(0px, 0px)',
                  opacity: hoveredKey && hoveredKey !== a.key ? 0.35 : 1,
                  filter:
                    hoveredKey === a.key ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.28))' : 'none',
                  transition:
                    'transform 300ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms ease, filter 300ms ease',
                }}
              />
            ))
          )}
        </svg>

        {/* Frosted-glass center KPI badge */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="rounded-full bg-surface/85 dark:bg-night-surface/85 backdrop-blur-md border border-border/50 dark:border-night-border/50 shadow-xs flex flex-col items-center justify-center text-center px-2"
            style={{ width: 76, height: 76 }}
          >
            {activeSlice ? (
              <>
                <span className="text-lg font-black leading-none text-brand-gold tabular-nums">
                  {activeSlice.percentage}%
                </span>
                <span className="mt-1 max-w-[62px] truncate text-[8px] font-bold uppercase tracking-wider text-muted dark:text-night-muted">
                  {activeSlice.label}
                </span>
              </>
            ) : (
              <>
                <span className="text-xl font-black leading-none text-foreground dark:text-night-text tabular-nums">
                  {total.toLocaleString()}
                </span>
                <span className="mt-1 text-[8px] font-bold uppercase tracking-wider text-muted dark:text-night-muted">
                  Total
                </span>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Minimal legend — dot · label · % only */}
      <div className="flex flex-wrap justify-center gap-x-3.5 gap-y-1.5 max-w-full">
        {arcs.map((a) => (
          <button
            key={a.key}
            type="button"
            onMouseEnter={() => setHoveredKey(a.key)}
            onMouseLeave={() => setHoveredKey(null)}
            title={`${a.label}: ${a.value}`}
            className={`inline-flex items-center gap-1.5 text-[10px] font-bold cursor-pointer transition-opacity duration-200 ${
              hoveredKey && hoveredKey !== a.key ? 'opacity-40' : 'opacity-100'
            }`}
          >
            <span
              className="size-2 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: a.color }}
            />
            <span className="text-muted dark:text-night-muted">{a.label}</span>
            <span className="text-foreground dark:text-night-text tabular-nums">
              {a.percentage}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Semi-circular SVG gauge for on-time delivery rate */
function OnTimeGauge({ percentage }: { percentage: number }) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const r = 70;
  const cx = 90;
  const cy = 85;
  const circumference = Math.PI * r;
  const filled = (clamped / 100) * circumference;

  return (
    <div className="relative w-[180px] h-[105px] mx-auto select-none">
      <svg viewBox="0 0 180 100" className="w-full h-full">
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          strokeWidth="14"
          strokeLinecap="round"
          className="stroke-border/30 dark:stroke-night-border/60"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          className="transition-all duration-700"
          stroke="url(#hubGaugeGrad)"
        />
        <defs>
          <linearGradient id="hubGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <span className="text-2xl sm:text-3xl font-black text-foreground dark:text-night-text tracking-tight">
          {clamped.toFixed(1)}
          <span className="text-sm font-bold text-muted">%</span>
        </span>
        <span className="block text-[9px] font-bold uppercase tracking-wider text-muted">
          On-Time Rate
        </span>
      </div>
    </div>
  );
}

export const LogisticsOperationsHub: React.FC<LogisticsOperationsHubProps> = React.memo(
  ({ cargoDist, routeData, deliveryData, loading, currency: propCurrency }) => {
    const [viewTab, setViewTab] = useState<LogisticsViewTab>('overview');

    if (loading) {
      return (
        <div className="p-6 rounded-2xl bg-surface/60 dark:bg-night-surface/60 border border-border/40 dark:border-night-border animate-pulse h-[460px]" />
      );
    }

    const currency =
      cargoDist?.currency || routeData?.currency || deliveryData?.currency || propCurrency || 'UZS';

    const transportDist: TransportTypeDistributionItem[] =
      cargoDist?.transportTypeDistribution || [];
    const statusDist = cargoDist?.statusDistribution || [];
    const cargoTypeDist = cargoDist?.cargoTypeDistribution || [];
    const routes = routeData?.topRoutes || [];
    const countries = routeData?.originCountries || [];
    const routeTransitTimes = deliveryData?.routeTransitTimes || [];
    const statusBreakdown = deliveryData?.statusBreakdown || [];

    const maxTransportSales = Math.max(...transportDist.map((t) => t.totalSales), 1);
    const maxRouteSales = Math.max(...routes.map((r) => r.totalSales), 1);
    const maxCountryCount = Math.max(...countries.map((c) => c.count), 1);
    const maxRouteDays = Math.max(...routeTransitTimes.map((r) => r.averageTransitDays), 1);
    const totalCargoOrders = cargoTypeDist.reduce((acc, c) => acc + c.count, 0) || 1;

    const transitRange =
      deliveryData?.maxTransitDays !== undefined && deliveryData?.minTransitDays !== undefined
        ? Math.max(deliveryData.maxTransitDays - deliveryData.minTransitDays, 1)
        : 0;
    const avgSpeedPos =
      deliveryData && transitRange > 0
        ? Math.round(
            ((deliveryData.averageTransitDays - (deliveryData.minTransitDays ?? 0)) /
              transitRange) *
              100
          )
        : 50;

    return (
      <div className="p-5 sm:p-6 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-xs space-y-5 transition-all duration-300">
        {/* Header Bar with Title & Multi-Spec View Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/40 dark:border-night-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-500 shrink-0">
              <Truck className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground dark:text-night-text">
                <T k="ovLogisticsHubTitle" />
              </h3>
              <p className="text-xs text-muted dark:text-night-muted mt-0.5">
                <T k="ovLogisticsHubSubtitle" />
              </p>
            </div>
          </div>

          {/* Segmented View Mode Tabs */}
          <div className="flex items-center p-1 bg-border/20 dark:bg-night-border/40 rounded-xl border border-border/30 dark:border-night-border/30">
            <button
              type="button"
              onClick={() => setViewTab('overview')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewTab === 'overview'
                  ? 'bg-brand-gold text-neutral-950 shadow-xs'
                  : 'text-muted dark:text-night-muted hover:text-foreground'
              }`}
            >
              <LayoutGrid className="size-3.5" />
              <T k="ovLogisticsViewOverview" />
            </button>
            <button
              type="button"
              onClick={() => setViewTab('corridors')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewTab === 'corridors'
                  ? 'bg-brand-gold text-neutral-950 shadow-xs'
                  : 'text-muted dark:text-night-muted hover:text-foreground'
              }`}
            >
              <MapPin className="size-3.5" />
              <T k="ovLogisticsViewCorridors" />
            </button>
            <button
              type="button"
              onClick={() => setViewTab('modalities')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewTab === 'modalities'
                  ? 'bg-brand-gold text-neutral-950 shadow-xs'
                  : 'text-muted dark:text-night-muted hover:text-foreground'
              }`}
            >
              <Boxes className="size-3.5" />
              <T k="ovLogisticsViewModalities" />
            </button>
            <button
              type="button"
              onClick={() => setViewTab('speed')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewTab === 'speed'
                  ? 'bg-brand-gold text-neutral-950 shadow-xs'
                  : 'text-muted dark:text-night-muted hover:text-foreground'
              }`}
            >
              <Gauge className="size-3.5" />
              <T k="ovLogisticsViewEfficiency" />
            </button>
          </div>
        </div>

        {/* ── TAB 1: ALL-IN-ONE HIGH-DENSITY OVERVIEW ─────────────────────────── */}
        {viewTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Top Corridors & Modality Bars */}
            <div className="space-y-5 flex flex-col justify-between">
              {/* Top Trade Corridors (Compact) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-brand-gold" />
                    Top Trade Corridors
                  </span>
                  <span className="text-[10px] text-muted font-semibold">
                    {routes.length} Active Corridors
                  </span>
                </div>

                <div className="space-y-2.5">
                  {routes.slice(0, 3).map((r, idx) => (
                    <div
                      key={r.route}
                      className="p-2.5 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/30 dark:border-night-border/30 min-w-0"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`size-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              idx === 0
                                ? 'bg-brand-gold text-neutral-950'
                                : 'bg-border/40 text-muted'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-foreground dark:text-night-text truncate">
                            {r.route}
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-foreground dark:text-night-text shrink-0">
                          {formatMoney(r.totalSales, currency)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-border/20 dark:bg-night-border/40 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-gold to-orange-400 transition-all duration-700"
                          style={{
                            width: `${Math.max(8, Math.round((r.totalSales / maxRouteSales) * 100))}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-muted">
                        <span className="truncate">
                          {r.originCity || r.originCountry} →{' '}
                          {r.destinationCity || r.destinationCountry}
                        </span>
                        <span className="text-emerald-500 font-bold shrink-0">
                          {r.count} trips · {r.percentage}% share
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transport Modality Mix — Big Pie */}
              {transportDist.length > 0 && (
                <div className="pt-3 border-t border-border/30 dark:border-night-border/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <Boxes className="size-3.5 text-cyan-500" />
                      Transport Modality Mix
                    </span>
                    <span className="text-[10px] text-muted font-semibold tabular-nums">
                      {transportDist.reduce((acc, t) => acc + t.count, 0)} orders
                    </span>
                  </div>
                  <PremiumPieChart
                    size={216}
                    slices={transportDist.map((t) => ({
                      key: t.type,
                      label: t.name || t.type,
                      value: t.count,
                      percentage: t.percentage,
                      color: TRANSPORT_PIE_COLORS[t.type] || TRANSPORT_PIE_COLORS.OTHER,
                    }))}
                  />
                </div>
              )}
            </div>

            {/* Right Column: On-Time Speed Gauge, Delivery Benchmark & Status Pipeline */}
            <div className="space-y-5 flex flex-col justify-between">
              {/* Delivery Speed Scorecard */}
              <div className="p-4 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/30 dark:border-night-border/30 flex flex-col items-center justify-center gap-3">
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <Gauge className="size-3.5 text-emerald-500" />
                    Delivery Speed & Reliability
                  </span>
                  {deliveryData?.averageTransitDays !== undefined && (
                    <span className="text-xs font-black text-brand-gold">
                      Avg: {deliveryData.averageTransitDays.toFixed(1)} days
                    </span>
                  )}
                </div>

                <OnTimeGauge percentage={deliveryData?.onTimeRatePercentage ?? 0} />

                {/* Scorecard Mini Counter Chips */}
                <div className="grid grid-cols-3 gap-2 w-full">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-center">
                    <PackageCheck className="size-3.5 text-emerald-500 mx-auto mb-0.5" />
                    <span className="block text-xs font-black text-foreground dark:text-night-text">
                      {deliveryData?.totalDeliveredCount ?? 0}
                    </span>
                    <span className="text-[9px] font-bold uppercase text-muted">Delivered</span>
                  </div>
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-center">
                    <Truck className="size-3.5 text-cyan-500 mx-auto mb-0.5" />
                    <span className="block text-xs font-black text-foreground dark:text-night-text">
                      {deliveryData?.totalInTransitCount ?? 0}
                    </span>
                    <span className="text-[9px] font-bold uppercase text-muted">In Transit</span>
                  </div>
                  <div className="p-2 rounded-lg bg-violet-500/10 text-center">
                    <Clock3 className="size-3.5 text-violet-500 mx-auto mb-0.5" />
                    <span className="block text-xs font-black text-foreground dark:text-night-text">
                      {deliveryData?.totalActiveCount ?? 0}
                    </span>
                    <span className="text-[9px] font-bold uppercase text-muted">Active</span>
                  </div>
                </div>
              </div>

              {/* Status Pipeline — Big Pie */}
              {statusDist.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                      Cargo Status Pipeline
                    </span>
                    <span className="text-[10px] text-muted tabular-nums">
                      {totalCargoOrders} total shipments
                    </span>
                  </div>
                  <PremiumPieChart
                    size={216}
                    slices={statusDist.map((s) => ({
                      key: s.category,
                      label: s.category,
                      value: s.count,
                      percentage: s.percentage,
                      color: statusHex(s.category),
                    }))}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: CORRIDORS & GEOGRAPHY ────────────────────────────────────── */}
        {viewTab === 'corridors' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top Trade Routes Full Breakdown */}
            <div className="space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <MapPin className="size-4 text-brand-gold" />
                  Top Corridors & Financials
                </h4>
                <span className="text-xs font-semibold text-muted">{routes.length} corridors</span>
              </div>

              <div className="space-y-3">
                {routes.map((r, idx) => (
                  <div
                    key={r.route}
                    className="p-3 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/30 dark:border-night-border/30 min-w-0"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`size-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                            idx === 0 ? 'bg-amber-500 text-neutral-950' : 'bg-border/40 text-muted'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-foreground dark:text-night-text truncate">
                          {r.route}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-foreground dark:text-night-text shrink-0">
                        {formatMoney(r.totalSales, currency)}
                      </span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-border/20 dark:bg-night-border/40 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-gold to-orange-400 transition-all duration-700"
                        style={{
                          width: `${Math.max(6, Math.round((r.totalSales / maxRouteSales) * 100))}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-1.5 text-[11px] text-muted">
                      <span className="flex items-center gap-1 truncate">
                        {r.originCity || r.originCountry || '?'}
                        <ArrowRight className="size-3" />
                        {r.destinationCity || r.destinationCountry || '?'}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-foreground dark:text-night-text font-semibold">
                          {r.count} trips ({r.percentage}%)
                        </span>
                        {r.totalMargin !== undefined && (
                          <span className="text-emerald-500 font-bold">
                            +{formatMoney(r.totalMargin, currency)} margin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Origin Countries Loading Hubs */}
            <div className="space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Globe2 className="size-4 text-blue-500" />
                  Origin Countries & Loading Hubs
                </h4>
                <span className="text-xs font-semibold text-muted">
                  {countries.length} Hub Countries
                </span>
              </div>

              <div className="space-y-3">
                {countries.map((c) => (
                  <div
                    key={c.countryName}
                    className="p-3 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/30 dark:border-night-border/30"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-foreground dark:text-night-text">
                        {c.countryName}
                      </span>
                      <span className="text-[11px] font-bold text-muted">
                        {c.count} orders · {c.percentage}% share
                      </span>
                    </div>

                    <div className="h-6 w-full rounded-lg bg-border/20 dark:bg-night-border/40 overflow-hidden relative">
                      <div
                        className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-700"
                        style={{
                          width: `${Math.max(8, Math.round((c.count / maxCountryCount) * 100))}%`,
                        }}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-extrabold text-foreground dark:text-night-text flex items-center gap-1">
                        <TrendingUp className="size-3" />
                        {formatMoney(c.totalSales, currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: MODALITIES & CARGO MIX ───────────────────────────────────── */}
        {viewTab === 'modalities' && (
          <div className="space-y-6">
            {/* Transport Modalities Large Progress Bars */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Multimodal Transport Modality Breakdown
              </span>
              <div className="space-y-3">
                {transportDist.map((t) => {
                  const v = TRANSPORT_VISUALS[t.type] || TRANSPORT_VISUALS.OTHER;
                  const widthPct = Math.max(
                    6,
                    Math.round((t.totalSales / maxTransportSales) * 100)
                  );
                  return (
                    <div key={t.type} className="group min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-lg shrink-0 ${v.chip}`}>{v.icon}</div>
                          <span className="text-xs font-bold text-foreground dark:text-night-text truncate">
                            {t.name || t.type}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-border/30 text-muted shrink-0">
                            {t.count} shipments
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-extrabold text-foreground dark:text-night-text block leading-tight">
                            {formatMoney(t.totalSales, currency)}
                          </span>
                          {t.totalMargin !== undefined && (
                            <span className="text-[10px] text-emerald-500 font-bold">
                              +{formatMoney(t.totalMargin, currency)} margin · {t.percentage}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-3 w-full rounded-full bg-border/20 dark:bg-night-border/40 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${v.bar} transition-all duration-700 group-hover:brightness-110`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LTL vs FTL Split Dual Cards */}
            {cargoTypeDist.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-border/30 dark:border-night-border/30">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  LTL (Groupage) vs FTL (Full Truck) Split
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cargoTypeDist.map((c) => (
                    <div
                      key={c.category}
                      className={`p-4 rounded-xl border ${
                        c.category === 'FTL'
                          ? 'border-blue-500/30 bg-blue-500/5'
                          : 'border-amber-500/30 bg-amber-500/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Boxes
                            className={`size-4.5 ${
                              c.category === 'FTL' ? 'text-blue-500' : 'text-amber-500'
                            }`}
                          />
                          <span className="text-sm font-black text-foreground dark:text-night-text">
                            {c.category === 'FTL'
                              ? 'FTL (Full Truck Load)'
                              : 'LTL (Less than Truck)'}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-muted">
                          {c.count} orders · {c.percentage}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-border/20 dark:bg-night-border/40 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            c.category === 'FTL'
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                              : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                          }`}
                          style={{ width: `${Math.round((c.count / totalCargoOrders) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-black text-foreground dark:text-night-text block mt-2">
                        {formatMoney(c.totalSales, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: SPEED & RELIABILITY ──────────────────────────────────────── */}
        {viewTab === 'speed' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* On-Time Delivery Rate Gauge */}
              <div className="p-4 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/30 flex flex-col items-center justify-center gap-4">
                <OnTimeGauge percentage={deliveryData?.onTimeRatePercentage ?? 0} />
                <div className="grid grid-cols-3 gap-2 w-full">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-center">
                    <PackageCheck className="size-4 text-emerald-500 mx-auto mb-0.5" />
                    <span className="block text-sm font-black text-foreground dark:text-night-text">
                      {deliveryData?.totalDeliveredCount ?? 0}
                    </span>
                    <span className="text-[9px] font-bold uppercase text-muted">Delivered</span>
                  </div>
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-center">
                    <Truck className="size-4 text-cyan-500 mx-auto mb-0.5" />
                    <span className="block text-sm font-black text-foreground dark:text-night-text">
                      {deliveryData?.totalInTransitCount ?? 0}
                    </span>
                    <span className="text-[9px] font-bold uppercase text-muted">In transit</span>
                  </div>
                  <div className="p-2 rounded-xl bg-violet-500/10 text-center">
                    <Clock3 className="size-4 text-violet-500 mx-auto mb-0.5" />
                    <span className="block text-sm font-black text-foreground dark:text-night-text">
                      {deliveryData?.totalActiveCount ?? 0}
                    </span>
                    <span className="text-[9px] font-bold uppercase text-muted">Active</span>
                  </div>
                </div>
              </div>

              {/* Transit Speed Spectrum */}
              {deliveryData && (
                <div className="p-4 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/30 flex flex-col justify-center gap-4">
                  <div className="text-center lg:text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                      Average Freight Transit Time
                    </span>
                    <span className="text-3xl font-black text-foreground dark:text-night-text tracking-tight">
                      {deliveryData.averageTransitDays.toFixed(1)}
                      <span className="text-base font-bold text-muted"> days</span>
                    </span>
                  </div>

                  {transitRange > 0 && (
                    <div>
                      <div className="relative h-2.5 w-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500">
                        <div
                          className="absolute -top-1 size-4.5 rounded-full bg-white dark:bg-night-surface border-[3px] border-brand-gold shadow-md transition-all duration-700"
                          style={{
                            left: `calc(${Math.min(Math.max(avgSpeedPos, 0), 100)}% - 9px)`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1.5 text-[10px] font-bold text-muted">
                        <span>Fastest: {deliveryData.minTransitDays}d</span>
                        <span>Slowest: {deliveryData.maxTransitDays}d</span>
                      </div>
                    </div>
                  )}

                  {(deliveryData.onTimeDeliveriesCount !== undefined ||
                    deliveryData.delayedDeliveriesCount !== undefined) && (
                    <div className="flex gap-2">
                      <span className="flex-1 text-center py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold">
                        ✓ {deliveryData.onTimeDeliveriesCount ?? 0} on-time
                      </span>
                      <span className="flex-1 text-center py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-extrabold">
                        ✕ {deliveryData.delayedDeliveriesCount ?? 0} delayed
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Transit Time By Corridor */}
              <div className="p-4 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/30 flex flex-col justify-center gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Timer className="size-3.5 text-brand-gold" />
                  Transit Speed By Corridor
                </span>
                {routeTransitTimes.length === 0 ? (
                  <p className="text-xs text-muted">No route timing data available</p>
                ) : (
                  routeTransitTimes.map((r) => (
                    <div key={r.route}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-foreground dark:text-night-text truncate">
                          {r.route}
                        </span>
                        <span className="text-xs font-extrabold text-brand-gold shrink-0">
                          {r.averageTransitDays.toFixed(1)}d
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-border/20 dark:bg-night-border/40 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-700"
                          style={{
                            width: `${Math.max(
                              8,
                              Math.round((r.averageTransitDays / maxRouteDays) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted">{r.count} shipments</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Status Breakdown Chips */}
            {statusBreakdown.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
                {statusBreakdown.map((b) => (
                  <span
                    key={b.status}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background dark:bg-night-bg border border-border/40 text-xs font-bold"
                  >
                    <span className="text-muted">{b.label || b.status}:</span>
                    <span className="text-foreground dark:text-night-text">{b.count} orders</span>
                    <span className="text-brand-gold">({b.percentage}%)</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);
