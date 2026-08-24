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
  TrendingUp,
  PieChart,
} from 'lucide-react';
import type {
  DashboardCargoDistributionResponse,
  DashboardRouteAnalyticsResponse,
  DashboardDeliveryEfficiencyResponse,
  TransportTypeDistributionItem,
} from '../../types/dashboard';
import { formatMoney } from '../../services/api';
import { T } from '../T';
import { useTranslation } from '../../context/LanguageContext';

interface LogisticsOperationsHubProps {
  cargoDist: DashboardCargoDistributionResponse | null;
  routeData: DashboardRouteAnalyticsResponse | null;
  deliveryData: DashboardDeliveryEfficiencyResponse | null;
  loading: boolean;
  currency?: string;
}

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
                  <T k="ovTotal" />
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
          <T k="ovOnTimeRate" />
        </span>
      </div>
    </div>
  );
}

export const LogisticsOperationsHub: React.FC<LogisticsOperationsHubProps> = React.memo(
  ({ cargoDist, routeData, deliveryData, loading, currency: propCurrency }) => {
    const { t } = useTranslation();

    if (loading) {
      return (
        <div className="p-6 rounded-2xl bg-surface/60 dark:bg-night-surface/60 border border-border/40 dark:border-night-border animate-pulse h-[520px]" />
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

    const getModalityName = (type: string, fallbackName?: string) => {
      const upper = (type || '').toUpperCase();
      if (upper === 'AUTO') return t('ovTransportAuto');
      if (upper === 'RAILWAY') return t('ovTransportRailway');
      if (upper === 'AIR') return t('ovTransportAir');
      if (upper === 'SEA') return t('ovTransportSea');
      if (upper === 'OTHER') return t('ovTransportOther');
      return fallbackName || type;
    };

    const statusLabelMap: Record<string, string> = {
      Waiting: t('statusWaiting'),
      Station: t('statusStation'),
      'On the way': t('statusOnTheWay'),
      'On the border': t('statusOnTheBorder'),
      Reload: t('statusReload'),
      Arrived: t('statusArrived'),
      Delivered: t('ovStatusDelivered'),
      'In transit': t('ovStatusInTransit'),
      Active: t('ovStatusActive'),
    };
    const getStatusLabel = (st: string) => statusLabelMap[st] || st;

    return (
      <div className="p-5 sm:p-6 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-xs space-y-6 transition-all duration-300">
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/40 dark:border-night-border/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-500 shrink-0 shadow-xs">
              <Truck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-foreground dark:text-night-text">
                  <T k="ovLogisticsHubTitle" />
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  <T k="ovLiveErpBadge" />
                </span>
              </div>
              <p className="text-xs text-muted dark:text-night-muted mt-0.5">
                <T k="ovLogisticsHubSubtitle" />
              </p>
            </div>
          </div>

          {/* Header Summary Chips */}
          <div className="flex flex-wrap items-center gap-2.5">
            {deliveryData?.onTimeRatePercentage !== undefined && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-black">
                <PackageCheck className="size-3.5" />
                <span>
                  {deliveryData.onTimeRatePercentage.toFixed(1)}% {t('ovOnTimeRate')}
                </span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border text-xs font-bold text-muted">
              <MapPin className="size-3.5 text-brand-gold" />
              <span>{t('ovActiveCorridorsCount', { count: routes.length })}</span>
            </span>
          </div>
        </div>

        {/* ── ROW 1: TRADE CORRIDORS & ORIGIN LOADING HUBS ───────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-500/15 text-amber-500">
                <MapPin className="size-3.5" />
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                <T k="ovTopCorridorsFinancials" />
              </h4>
            </div>
            <span className="text-[11px] text-muted font-medium">
              <T k="ovVolumeRevenueCorridor" />
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Top Trade Corridors */}
            <div className="p-4 sm:p-4.5 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 dark:border-night-border/40 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/30">
                <span className="text-xs font-bold text-foreground dark:text-night-text flex items-center gap-2">
                  <MapPin className="size-4 text-brand-gold" />
                  <T k="ovTopTradeCorridors" />
                </span>
                <span className="text-[11px] font-bold text-muted">
                  {t('ovCorridorsCount', { count: routes.length })}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {routes.length === 0 ? (
                  <p className="text-xs text-muted py-8 text-center">
                    <T k="ovNoRouteDataAvailable" />
                  </p>
                ) : (
                  routes.map((r, idx) => (
                    <div
                      key={r.route}
                      className="p-3 rounded-xl bg-surface dark:bg-night-surface border border-border/30 hover:border-brand-gold/40 transition-all min-w-0 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`size-5.5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              idx === 0
                                ? 'bg-brand-gold text-neutral-950 shadow-xs'
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

                      <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted">
                        <span className="flex items-center gap-1 truncate">
                          {r.originCity || r.originCountry || '?'}
                          <ArrowRight className="size-2.5" />
                          {r.destinationCity || r.destinationCountry || '?'}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-emerald-500 font-bold">
                            {t('ovTripsShare', { count: r.count, pct: r.percentage })}
                          </span>
                          {r.totalMargin !== undefined && (
                            <span className="text-foreground dark:text-night-text font-bold">
                              ({formatMoney(r.totalMargin, currency)})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. Origin Countries & Loading Hubs */}
            <div className="p-4 sm:p-4.5 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 dark:border-night-border/40 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/30">
                <span className="text-xs font-bold text-foreground dark:text-night-text flex items-center gap-2">
                  <Globe2 className="size-4 text-blue-500" />
                  <T k="ovOriginCountriesHubs" />
                </span>
                <span className="text-[11px] font-bold text-muted">
                  {t('ovHubCountriesCount', { count: countries.length })}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {countries.length === 0 ? (
                  <p className="text-xs text-muted py-8 text-center">
                    <T k="ovNoCountryDataAvailable" />
                  </p>
                ) : (
                  countries.map((c) => (
                    <div
                      key={c.countryName}
                      className="p-3 rounded-xl bg-surface dark:bg-night-surface border border-border/30 hover:border-blue-500/40 transition-all shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-foreground dark:text-night-text">
                          {c.countryName}
                        </span>
                        <span className="text-[10px] font-bold text-muted">
                          {t('ovOrdersShare', { count: c.count, pct: c.percentage })}
                        </span>
                      </div>

                      <div className="h-6 w-full rounded-lg bg-border/20 dark:bg-night-border/40 overflow-hidden relative">
                        <div
                          className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-700"
                          style={{
                            width: `${Math.max(8, Math.round((c.count / maxCountryCount) * 100))}%`,
                          }}
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-extrabold text-foreground dark:text-night-text flex items-center gap-1">
                          <TrendingUp className="size-3 text-emerald-500" />
                          {formatMoney(c.totalSales, currency)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── ROW 2: TRANSPORT MODALITIES & CARGO MIX ────────────────────────── */}
        <div className="space-y-3 pt-2 border-t border-border/30 dark:border-night-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-cyan-500/15 text-cyan-500">
                <Boxes className="size-3.5" />
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                <T k="ovTransportModalities" />
              </h4>
            </div>
            <span className="text-[11px] text-muted font-medium">
              <T k="ovMultimodalShare" />
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 7 Columns: Modality Bars + LTL/FTL Split */}
            <div className="lg:col-span-7 space-y-4 p-4 sm:p-4.5 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 dark:border-night-border/40">
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                  <T k="ovTransportBreakdown" />
                </span>
                <div className="space-y-2.5">
                  {transportDist.map((tItem) => {
                    const v = TRANSPORT_VISUALS[tItem.type] || TRANSPORT_VISUALS.OTHER;
                    const widthPct = Math.max(
                      6,
                      Math.round((tItem.totalSales / maxTransportSales) * 100)
                    );
                    return (
                      <div
                        key={tItem.type}
                        className="group min-w-0 p-2 rounded-xl bg-surface dark:bg-night-surface border border-border/30 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-3 mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`p-1.5 rounded-lg shrink-0 ${v.chip}`}>{v.icon}</div>
                            <span className="text-xs font-bold text-foreground dark:text-night-text truncate">
                              {getModalityName(tItem.type, tItem.name)}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-border/30 text-muted shrink-0">
                              {t('ovShipmentsCount', { count: tItem.count })}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-extrabold text-foreground dark:text-night-text block leading-tight">
                              {formatMoney(tItem.totalSales, currency)}
                            </span>
                            {tItem.totalMargin !== undefined && (
                              <span className="text-[10px] text-emerald-500 font-bold">
                                {t('ovMarginWithPct', {
                                  amount: formatMoney(tItem.totalMargin, currency),
                                  pct: tItem.percentage,
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-border/20 dark:bg-night-border/40 overflow-hidden">
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
                <div className="space-y-2 pt-3 border-t border-border/30">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    <T k="ovLtlFtlSplit" />
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cargoTypeDist.map((c) => (
                      <div
                        key={c.category}
                        className={`p-3.5 rounded-xl border ${
                          c.category === 'FTL'
                            ? 'border-blue-500/30 bg-blue-500/5'
                            : 'border-amber-500/30 bg-amber-500/5'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <Boxes
                              className={`size-4 ${
                                c.category === 'FTL' ? 'text-blue-500' : 'text-amber-500'
                              }`}
                            />
                            <span className="text-xs font-black text-foreground dark:text-night-text">
                              {c.category === 'FTL' ? t('ovFtlFullName') : t('ovLtlFullName')}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-muted">
                            {t('ovOrdersWithPct', { count: c.count, pct: c.percentage })}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-border/20 dark:bg-night-border/40 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              c.category === 'FTL'
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                                : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                            }`}
                            style={{ width: `${Math.round((c.count / totalCargoOrders) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-foreground dark:text-night-text block mt-1.5">
                          {formatMoney(c.totalSales, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right 5 Columns: Modality Pie Chart */}
            <div className="lg:col-span-5 p-4 sm:p-4.5 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 dark:border-night-border/40 flex flex-col items-center justify-between gap-4">
              <div className="flex items-center justify-between w-full pb-2 border-b border-border/30">
                <span className="text-xs font-bold text-foreground dark:text-night-text flex items-center gap-1.5">
                  <PieChart className="size-4 text-cyan-500" />
                  <T k="ovTransportModalityMix" />
                </span>
                <span className="text-[10px] text-muted font-bold">
                  {t('ovOrdersCount', {
                    count: transportDist.reduce((acc, t) => acc + t.count, 0),
                  })}
                </span>
              </div>

              {transportDist.length > 0 ? (
                <div className="py-2">
                  <PremiumPieChart
                    size={200}
                    slices={transportDist.map((t) => ({
                      key: t.type,
                      label: getModalityName(t.type, t.name),
                      value: t.count,
                      percentage: t.percentage,
                      color: TRANSPORT_PIE_COLORS[t.type] || TRANSPORT_PIE_COLORS.OTHER,
                    }))}
                  />
                </div>
              ) : (
                <p className="text-xs text-muted py-12 text-center">
                  <T k="ovNotAvailable" />
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── ROW 3: DELIVERY SPEED & CARGO STATUS PIPELINE ──────────────────── */}
        <div className="space-y-3 pt-2 border-t border-border/30 dark:border-night-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-emerald-500/15 text-emerald-500">
                <Gauge className="size-3.5" />
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                <T k="ovDeliverySpeedReliability" />
              </h4>
            </div>
            <span className="text-[11px] text-muted font-medium">
              <T k="ovTransitSpeedScorecard" />
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 7 Columns: Delivery Speed Scorecard & Corridor Speeds */}
            <div className="lg:col-span-7 space-y-4 p-4 sm:p-4.5 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 dark:border-night-border/40">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-auto">
                  <OnTimeGauge percentage={deliveryData?.onTimeRatePercentage ?? 0} />
                </div>

                <div className="flex-1 w-full space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                      <T k="ovAvgTransitTime" />
                    </span>
                    {deliveryData?.averageTransitDays !== undefined && (
                      <span className="text-sm font-black text-brand-gold">
                        {deliveryData.averageTransitDays.toFixed(1)} {t('ovDaysSuffix')}
                      </span>
                    )}
                  </div>

                  {/* Spectrum Slider */}
                  {transitRange > 0 && deliveryData && (
                    <div>
                      <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500">
                        <div
                          className="absolute -top-1 size-4 rounded-full bg-white dark:bg-night-surface border-[2.5px] border-brand-gold shadow-md transition-all duration-700"
                          style={{
                            left: `calc(${Math.min(Math.max(avgSpeedPos, 0), 100)}% - 8px)`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-[9px] font-bold text-muted">
                        <span>
                          {t('ovFastestDays', { days: deliveryData.minTransitDays ?? 0 })}
                        </span>
                        <span>
                          {t('ovSlowestDays', { days: deliveryData.maxTransitDays ?? 0 })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Counters */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-center">
                      <PackageCheck className="size-3.5 text-emerald-500 mx-auto mb-0.5" />
                      <span className="block text-xs font-black text-foreground dark:text-night-text">
                        {deliveryData?.totalDeliveredCount ?? 0}
                      </span>
                      <span className="text-[8px] font-bold uppercase text-muted">
                        <T k="ovStatusDelivered" />
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-center">
                      <Truck className="size-3.5 text-cyan-500 mx-auto mb-0.5" />
                      <span className="block text-xs font-black text-foreground dark:text-night-text">
                        {deliveryData?.totalInTransitCount ?? 0}
                      </span>
                      <span className="text-[8px] font-bold uppercase text-muted">
                        <T k="ovStatusInTransit" />
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-violet-500/10 text-center">
                      <Clock3 className="size-3.5 text-violet-500 mx-auto mb-0.5" />
                      <span className="block text-xs font-black text-foreground dark:text-night-text">
                        {deliveryData?.totalActiveCount ?? 0}
                      </span>
                      <span className="text-[8px] font-bold uppercase text-muted">
                        <T k="ovStatusActive" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Corridor Speeds List */}
              {routeTransitTimes.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-border/30">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <Timer className="size-3.5 text-brand-gold" />
                    <T k="ovTransitSpeedByCorridor" />
                  </span>
                  <div className="space-y-2">
                    {routeTransitTimes.map((r) => (
                      <div
                        key={r.route}
                        className="p-2 rounded-xl bg-surface dark:bg-night-surface border border-border/30"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-foreground dark:text-night-text truncate">
                            {r.route}
                          </span>
                          <span className="text-xs font-extrabold text-brand-gold shrink-0">
                            {r.averageTransitDays.toFixed(1)}d
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-border/20 dark:bg-night-border/40 overflow-hidden">
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
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right 5 Columns: Status Pipeline Pie */}
            <div className="lg:col-span-5 p-4 sm:p-4.5 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 dark:border-night-border/40 flex flex-col items-center justify-between gap-4">
              <div className="flex items-center justify-between w-full pb-2 border-b border-border/30">
                <span className="text-xs font-bold text-foreground dark:text-night-text flex items-center gap-1.5">
                  <Clock3 className="size-4 text-emerald-500" />
                  <T k="ovCargoStatusPipeline" />
                </span>
                <span className="text-[10px] text-muted font-bold">
                  {t('ovTotalShipmentsCount', { count: totalCargoOrders })}
                </span>
              </div>

              {statusDist.length > 0 ? (
                <div className="py-2">
                  <PremiumPieChart
                    size={200}
                    slices={statusDist.map((s) => ({
                      key: s.category,
                      label: getStatusLabel(s.category),
                      value: s.count,
                      percentage: s.percentage,
                      color: statusHex(s.category),
                    }))}
                  />
                </div>
              ) : (
                <p className="text-xs text-muted py-12 text-center">
                  <T k="ovNotAvailable" />
                </p>
              )}

              {/* Status Breakdown Chips */}
              {statusBreakdown.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/30 w-full justify-center">
                  {statusBreakdown.map((b) => (
                    <span
                      key={b.status}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface dark:bg-night-surface border border-border/40 text-[10px] font-bold"
                    >
                      <span className="text-muted">{getStatusLabel(b.label || b.status)}:</span>
                      <span className="text-foreground dark:text-night-text">{b.count}</span>
                      <span className="text-brand-gold">({b.percentage}%)</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
