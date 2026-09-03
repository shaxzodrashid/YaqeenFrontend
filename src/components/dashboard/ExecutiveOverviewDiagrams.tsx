import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  ArrowRight,
  Gauge,
  Clock3,
  PackageCheck,
  Scale,
  CreditCard,
  Trophy,
  Building2,
  Users,
} from 'lucide-react';
import type {
  TransportTypeDistributionItem,
  StatusDistributionItem,
  RouteAnalyticsItem,
  DashboardDeliveryEfficiencyResponse,
  DashboardDebtSummaryResponse,
  TopManagerItem,
  TopClientItem,
  DeliveryStatusBreakdownItem,
} from '../../types/dashboard';
import { formatMoney } from '../../services/api';
import { T } from '../T';
import { useTranslation } from '../../context/LanguageContext';
import { getTransportVisuals } from '../../utils/transportColors';
import { PremiumDonutChart, type PieSliceData } from './PremiumDonutChart';

/** Solid hex colors for status pie slices */
export function statusHex(category: string): string {
  switch (category) {
    case 'Arrived':
      return '#10b981'; // Emerald
    case 'On the way':
      return '#06b6d4'; // Cyan
    case 'Waiting':
      return '#f59e0b'; // Amber
    case 'Station':
      return '#ec4899'; // Pink
    case 'On the border':
      return '#8b5cf6'; // Violet
    case 'Reload':
      return '#3b82f6'; // Blue
    default:
      return '#f97316'; // Orange
  }
}

// ---------------------------------------------------------------------------
// 1. Transport Modality Mix Diagram
// ---------------------------------------------------------------------------
interface TransportModalityMixDiagramProps {
  data: TransportTypeDistributionItem[];
  currency: string;
  onNavigateLogistics?: () => void;
}

export const TransportModalityMixDiagram: React.FC<TransportModalityMixDiagramProps> = ({
  data,
  currency,
  onNavigateLogistics,
}) => {
  const { t } = useTranslation();

  const modalityNameMap: Record<string, string> = {
    AUTO: t('ovTransportAuto'),
    RAILWAY: t('ovTransportRailway'),
    AIR: t('ovTransportAir'),
    SEA: t('ovTransportSea'),
    OTHER: t('ovTransportOther'),
  };
  const getModalityName = (type: string, name?: string) =>
    modalityNameMap[type.toUpperCase()] || name || type;

  const totalOrders = data.reduce((acc, item) => acc + item.count, 0);
  const totalSales = data.reduce((acc, item) => acc + item.totalSales, 0);

  const slices: PieSliceData[] = data.map((item) => {
    const visuals = getTransportVisuals(item.type, item.name);
    return {
      key: item.type,
      label: getModalityName(item.type, item.name),
      value: item.count,
      percentage: item.percentage,
      color: visuals.hexColor,
      totalSales: item.totalSales,
      formattedSales: formatMoney(item.totalSales, currency),
      icon: visuals.icon,
    };
  });

  return (
    <div className="p-5 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-xs flex flex-col justify-between gap-4 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40 dark:border-night-border/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/15 text-blue-500 shrink-0 shadow-2xs">
            <Truck className="size-4.5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-foreground dark:text-night-text flex items-center gap-1.5">
              <T k="ovTransportModalityMix" />
            </h4>
            <p className="text-[10px] text-muted dark:text-night-muted">
              <T k="ovMultimodalShare" />
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-black text-foreground dark:text-night-text block">
            {formatMoney(totalSales, currency)}
          </span>
          <span className="text-[10px] font-bold text-muted">
            {t('ovOrdersCount', { count: totalOrders })}
          </span>
        </div>
      </div>

      {/* Visual Donut Chart */}
      <div className="py-2 flex items-center justify-center min-h-[220px]">
        {slices.length > 0 ? (
          <PremiumDonutChart
            slices={slices}
            size={185}
            centerSubtitle={t('ovOrdersCount', { count: totalOrders }).split(' ')[1] || 'Orders'}
            centerValue={totalOrders.toLocaleString()}
          />
        ) : (
          <p className="text-xs text-muted py-8 text-center">
            <T k="ovNoDataAvailable" />
          </p>
        )}
      </div>

      {/* Footer Navigation Action */}
      <button
        type="button"
        onClick={onNavigateLogistics}
        className="w-full py-2 px-3 text-xs font-bold text-brand-gold hover:text-brand-gold/80 bg-brand-gold/10 hover:bg-brand-gold/15 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
      >
        <span>{t('ovTabLogistics')}</span>
        <ArrowRight className="size-3.5" />
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. Cargo Status Pipeline Diagram
// ---------------------------------------------------------------------------
interface CargoStatusPipelineDiagramProps {
  statusDist: StatusDistributionItem[];
  statusBreakdown?: DeliveryStatusBreakdownItem[];
  onNavigateLogistics?: () => void;
}

export const CargoStatusPipelineDiagram: React.FC<CargoStatusPipelineDiagramProps> = ({
  statusDist,
  statusBreakdown = [],
  onNavigateLogistics,
}) => {
  const { t } = useTranslation();

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

  const totalShipments = statusDist.reduce((acc, item) => acc + item.count, 0);

  const slices: PieSliceData[] = statusDist.map((item) => ({
    key: item.category,
    label: getStatusLabel(item.category),
    value: item.count,
    percentage: item.percentage,
    color: statusHex(item.category),
  }));

  return (
    <div className="p-5 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-xs flex flex-col justify-between gap-4 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40 dark:border-night-border/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500 shrink-0 shadow-2xs">
            <Clock3 className="size-4.5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-foreground dark:text-night-text flex items-center gap-1.5">
              <T k="ovCargoStatusPipeline" />
            </h4>
            <p className="text-[10px] text-muted dark:text-night-muted">
              <T k="ovDistByStatus" />
            </p>
          </div>
        </div>
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          {t('ovTotalShipmentsCount', { count: totalShipments })}
        </span>
      </div>

      {/* Visual Donut Chart */}
      <div className="py-2 flex items-center justify-center min-h-[220px]">
        {slices.length > 0 ? (
          <PremiumDonutChart
            slices={slices}
            size={185}
            centerSubtitle={t('ovActiveEmployees')}
            centerValue={totalShipments.toLocaleString()}
          />
        ) : (
          <p className="text-xs text-muted py-8 text-center">
            <T k="ovNoDataAvailable" />
          </p>
        )}
      </div>

      {/* Status Breakdown Mini Pills */}
      {statusBreakdown.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center pt-1 border-t border-border/30 dark:border-night-border/30">
          {statusBreakdown.slice(0, 4).map((b) => (
            <span
              key={b.status}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background/70 dark:bg-night-bg/70 border border-border/40 text-[9px] font-bold"
            >
              <span className="text-muted">{getStatusLabel(b.label || b.status)}:</span>
              <span className="text-foreground dark:text-night-text font-black">{b.count}</span>
            </span>
          ))}
        </div>
      )}

      {/* Footer Navigation Action */}
      <button
        type="button"
        onClick={onNavigateLogistics}
        className="w-full py-2 px-3 text-xs font-bold text-brand-gold hover:text-brand-gold/80 bg-brand-gold/10 hover:bg-brand-gold/15 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
      >
        <span>{t('ovTabLogistics')}</span>
        <ArrowRight className="size-3.5" />
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3. Delivery Speedometer & Reliability Gauge Diagram
// ---------------------------------------------------------------------------
interface DeliverySpeedometerDiagramProps {
  deliveryData: DashboardDeliveryEfficiencyResponse | null;
  onNavigateLogistics?: () => void;
}

export const DeliverySpeedometerDiagram: React.FC<DeliverySpeedometerDiagramProps> = ({
  deliveryData,
  onNavigateLogistics,
}) => {
  const { t } = useTranslation();

  const onTimeRate = deliveryData?.onTimeRatePercentage ?? 0;
  const clamped = Math.max(0, Math.min(100, onTimeRate));
  const r = 74;
  const cx = 95;
  const cy = 90;
  const circumference = Math.PI * r;
  const filled = (clamped / 100) * circumference;

  const transitRange =
    deliveryData?.maxTransitDays !== undefined && deliveryData?.minTransitDays !== undefined
      ? Math.max(deliveryData.maxTransitDays - deliveryData.minTransitDays, 1)
      : 0;
  const avgSpeedPos =
    deliveryData && transitRange > 0
      ? Math.round(
          ((deliveryData.averageTransitDays - (deliveryData.minTransitDays ?? 0)) / transitRange) *
            100
        )
      : 50;

  return (
    <div className="p-5 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-xs flex flex-col justify-between gap-4 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40 dark:border-night-border/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 shrink-0 shadow-2xs">
            <Gauge className="size-4.5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-foreground dark:text-night-text flex items-center gap-1.5">
              <T k="ovDeliverySpeedScore" />
            </h4>
            <p className="text-[10px] text-muted dark:text-night-muted">
              <T k="ovTransitSpeedScorecard" />
            </p>
          </div>
        </div>
        {deliveryData?.averageTransitDays !== undefined && (
          <span className="text-xs font-black text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-lg border border-brand-gold/20">
            {deliveryData.averageTransitDays.toFixed(1)} {t('ovDaysSuffix')}
          </span>
        )}
      </div>

      {/* Semicircular SVG Speedometer Gauge */}
      <div className="flex flex-col items-center justify-center gap-3 py-1">
        <div className="relative w-[190px] h-[110px] select-none">
          <svg viewBox="0 0 190 105" className="w-full h-full">
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              fill="none"
              strokeWidth="15"
              strokeLinecap="round"
              className="stroke-border/30 dark:stroke-night-border/60"
            />
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              fill="none"
              strokeWidth="15"
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circumference}`}
              className="transition-all duration-700"
              stroke="url(#execGaugeGrad)"
            />
            <defs>
              <linearGradient id="execGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="55%" stopColor="#10b981" />
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

        {/* Speed Spectrum Range */}
        {transitRange > 0 && deliveryData && (
          <div className="w-full px-2">
            <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500">
              <div
                className="absolute -top-1 size-4 rounded-full bg-white dark:bg-night-surface border-[2.5px] border-brand-gold shadow-md transition-all duration-700"
                style={{
                  left: `calc(${Math.min(Math.max(avgSpeedPos, 0), 100)}% - 8px)`,
                }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[9px] font-bold text-muted">
              <span>{t('ovFastestDays', { days: deliveryData.minTransitDays ?? 0 })}</span>
              <span className="text-foreground dark:text-night-text font-black">
                {deliveryData.averageTransitDays.toFixed(1)}d {t('ovAvgTransitTime').toLowerCase()}
              </span>
              <span>{t('ovSlowestDays', { days: deliveryData.maxTransitDays ?? 0 })}</span>
            </div>
          </div>
        )}

        {/* Delivery Counters */}
        <div className="grid grid-cols-3 gap-1.5 w-full pt-1">
          <div className="p-1.5 rounded-xl bg-emerald-500/10 text-center">
            <PackageCheck className="size-3.5 text-emerald-500 mx-auto mb-0.5" />
            <span className="block text-xs font-black text-foreground dark:text-night-text">
              {deliveryData?.totalDeliveredCount ?? 0}
            </span>
            <span className="text-[8px] font-bold uppercase text-muted truncate block">
              <T k="ovStatusDelivered" />
            </span>
          </div>
          <div className="p-1.5 rounded-xl bg-cyan-500/10 text-center">
            <Truck className="size-3.5 text-cyan-500 mx-auto mb-0.5" />
            <span className="block text-xs font-black text-foreground dark:text-night-text">
              {deliveryData?.totalInTransitCount ?? 0}
            </span>
            <span className="text-[8px] font-bold uppercase text-muted truncate block">
              <T k="ovStatusInTransit" />
            </span>
          </div>
          <div className="p-1.5 rounded-xl bg-violet-500/10 text-center">
            <Clock3 className="size-3.5 text-violet-500 mx-auto mb-0.5" />
            <span className="block text-xs font-black text-foreground dark:text-night-text">
              {deliveryData?.totalActiveCount ?? 0}
            </span>
            <span className="text-[8px] font-bold uppercase text-muted truncate block">
              <T k="ovStatusActive" />
            </span>
          </div>
        </div>
      </div>

      {/* Footer Navigation Action */}
      <button
        type="button"
        onClick={onNavigateLogistics}
        className="w-full py-2 px-3 text-xs font-bold text-brand-gold hover:text-brand-gold/80 bg-brand-gold/10 hover:bg-brand-gold/15 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
      >
        <span>{t('ovTabLogistics')}</span>
        <ArrowRight className="size-3.5" />
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 4. Trade Corridors Visual Flow Diagram
// ---------------------------------------------------------------------------
interface TradeCorridorsVisualDiagramProps {
  topRoutes: RouteAnalyticsItem[];
  currency: string;
  onNavigateLogistics?: () => void;
}

export const TradeCorridorsVisualDiagram: React.FC<TradeCorridorsVisualDiagramProps> = ({
  topRoutes,
  currency,
  onNavigateLogistics,
}) => {
  const { t } = useTranslation();
  const maxRouteSales = Math.max(...topRoutes.map((r) => r.totalSales), 1);

  return (
    <div className="p-5 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-xs flex flex-col justify-between gap-4 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40 dark:border-night-border/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 shrink-0 shadow-2xs">
            <MapPin className="size-4.5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-foreground dark:text-night-text flex items-center gap-1.5">
              <T k="ovTopTradeCorridors" />
            </h4>
            <p className="text-[10px] text-muted dark:text-night-muted">
              <T k="ovVolumeRevenueCorridor" />
            </p>
          </div>
        </div>
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
          {t('ovActiveCorridorsCount', { count: topRoutes.length })}
        </span>
      </div>

      {/* Visual Ranked Corridor Bars */}
      <div className="space-y-3">
        {topRoutes.slice(0, 4).map((r, idx) => {
          const widthPct = Math.max(8, Math.round((r.totalSales / maxRouteSales) * 100));
          return (
            <div
              key={r.route}
              className="p-2.5 rounded-xl bg-background/60 dark:bg-night-bg/60 border border-border/40 dark:border-night-border/40 space-y-1.5 shadow-2xs hover:border-brand-gold/40 transition-all"
            >
              <div className="flex items-center justify-between gap-2 text-xs font-bold">
                <span className="flex items-center gap-2 truncate text-foreground dark:text-night-text">
                  <span
                    className={`size-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 shadow-xs ${
                      idx === 0
                        ? 'bg-brand-gold text-neutral-950'
                        : idx === 1
                          ? 'bg-slate-300 text-neutral-900'
                          : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-border/40 text-muted'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="truncate">{r.route}</span>
                </span>
                <span className="shrink-0 text-foreground dark:text-night-text font-black">
                  {formatMoney(r.totalSales, currency)}
                </span>
              </div>

              {/* Gradient Progress Bar */}
              <div className="h-2 w-full rounded-full bg-border/20 dark:bg-night-border/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-gold via-amber-500 to-orange-400 transition-all duration-700"
                  style={{ width: `${widthPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted font-medium">
                <span className="flex items-center gap-1 truncate">
                  {r.originCity || r.originCountry || '?'}
                  <ArrowRight className="size-2.5 text-muted" />
                  {r.destinationCity || r.destinationCountry || '?'}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-emerald-500 font-bold">
                    {r.count} {t('ovOrdersCount', { count: r.count }).split(' ')[1] || 'orders'} (
                    {r.percentage}%)
                  </span>
                  {r.totalMargin !== undefined && (
                    <span className="text-foreground dark:text-night-text font-bold">
                      +{formatMoney(r.totalMargin, currency)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {topRoutes.length === 0 && (
          <p className="text-xs text-muted py-8 text-center">
            <T k="ovNoRouteDataAvailable" />
          </p>
        )}
      </div>

      {/* Footer Navigation Action */}
      <button
        type="button"
        onClick={onNavigateLogistics}
        className="w-full py-2 px-3 text-xs font-bold text-brand-gold hover:text-brand-gold/80 bg-brand-gold/10 hover:bg-brand-gold/15 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
      >
        <span>{t('ovLogisticsViewCorridors')}</span>
        <ArrowRight className="size-3.5" />
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 5. Working Capital & Liquidity Flow Diagram
// ---------------------------------------------------------------------------
interface WorkingCapitalFlowDiagramProps {
  debtData: DashboardDebtSummaryResponse | null;
  currency: string;
  onNavigateCommercial?: () => void;
}

export const WorkingCapitalFlowDiagram: React.FC<WorkingCapitalFlowDiagramProps> = ({
  debtData,
  currency,
  onNavigateCommercial,
}) => {
  const { t } = useTranslation();

  const receivable = debtData?.accountsReceivable || 0;
  const payable = debtData?.accountsPayable || 0;
  const netBalance = debtData?.netBalance || 0;
  const totalFlow = receivable + payable;
  const recPct = totalFlow > 0 ? Math.round((receivable / totalFlow) * 100) : 50;
  const payPct = totalFlow > 0 ? 100 - recPct : 50;

  return (
    <div className="p-5 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-xs flex flex-col justify-between gap-4 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40 dark:border-night-border/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500 shrink-0 shadow-2xs">
            <CreditCard className="size-4.5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-foreground dark:text-night-text flex items-center gap-1.5">
              <T k="ovBalanceOverview" />
            </h4>
            <p className="text-[10px] text-muted dark:text-night-muted">
              <T k="ovReceivablesVsPayables" />
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black border ${
            netBalance >= 0
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          }`}
        >
          <Scale className="size-3" />
          {netBalance >= 0 ? 'Surplus' : 'Deficit'}
        </span>
      </div>

      {/* Visual Flow Dual Bars & Balances */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-background/60 dark:bg-night-bg/60 border border-emerald-500/20 shadow-2xs">
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block truncate">
              {t('ovReceivablesLabel')}
            </span>
            <span className="text-sm font-extrabold text-foreground dark:text-night-text block truncate mt-0.5">
              {formatMoney(receivable, currency)}
            </span>
            <span className="text-[9px] text-muted font-medium mt-0.5 block truncate">
              {debtData?.debtorClientCount || 0}{' '}
              {t('ovClientsCount', { count: debtData?.debtorClientCount || 0 }).split(' ')[1] ||
                'debtors'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-background/60 dark:bg-night-bg/60 border border-rose-500/20 shadow-2xs">
            <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block truncate">
              {t('ovPayablesLabel')}
            </span>
            <span className="text-sm font-extrabold text-foreground dark:text-night-text block truncate mt-0.5">
              {formatMoney(payable, currency)}
            </span>
            <span className="text-[9px] text-muted font-medium mt-0.5 block truncate">
              {debtData?.creditorCarrierCount || 0}{' '}
              {t('ovCarriersCount', { count: debtData?.creditorCarrierCount || 0 }).split(' ')[1] ||
                'creditors'}
            </span>
          </div>
        </div>

        {/* Duel-Tone Liquid Flow Bar */}
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded-full bg-border/30 dark:bg-night-border/40 overflow-hidden flex shadow-2xs">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-700"
              style={{ width: `${recPct}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all duration-700"
              style={{ width: `${payPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="text-emerald-600 dark:text-emerald-400">
              {t('ovReceivablesLabel')} {recPct}%
            </span>
            <span className="text-brand-gold font-extrabold">
              {t('ovNetCashBalance')}: {formatMoney(netBalance, currency)}
            </span>
            <span className="text-rose-600 dark:text-rose-400">
              {t('ovPayablesLabel')} {payPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Footer Navigation Action */}
      <button
        type="button"
        onClick={onNavigateCommercial}
        className="w-full py-2 px-3 text-xs font-bold text-brand-gold hover:text-brand-gold/80 bg-brand-gold/10 hover:bg-brand-gold/15 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
      >
        <span>{t('ovTabDebt')}</span>
        <ArrowRight className="size-3.5" />
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 6. Commercial Leaders Visual Diagram
// ---------------------------------------------------------------------------
interface CommercialLeadersVisualDiagramProps {
  topManagers: TopManagerItem[];
  topClients: TopClientItem[];
  currency: string;
  onNavigateCommercial?: () => void;
}

export const CommercialLeadersVisualDiagram: React.FC<CommercialLeadersVisualDiagramProps> = ({
  topManagers,
  topClients,
  currency,
  onNavigateCommercial,
}) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'managers' | 'clients'>('managers');

  const maxManagerSales = Math.max(...topManagers.map((m) => m.totalSales), 1);
  const maxClientSales = Math.max(...topClients.map((c) => c.totalSales), 1);

  return (
    <div className="p-5 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-xs flex flex-col justify-between gap-4 transition-all duration-300">
      {/* Header & Mode Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40 dark:border-night-border/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 shrink-0 shadow-2xs">
            <Trophy className="size-4.5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-foreground dark:text-night-text flex items-center gap-1.5">
              <T k="ovTabLeaders" />
            </h4>
            <p className="text-[10px] text-muted dark:text-night-muted">
              {viewMode === 'managers'
                ? t('ovLeaderboardManagerSubtitle')
                : t('ovLeaderboardClientSubtitle')}
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center p-0.5 rounded-lg bg-background/80 dark:bg-night-bg/80 border border-border/60 dark:border-night-border">
          <button
            type="button"
            onClick={() => setViewMode('managers')}
            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              viewMode === 'managers'
                ? 'bg-brand-gold text-neutral-950 shadow-2xs'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Users className="size-3 inline mr-1" />
            {t('ovLeaderboardTopManagers').split(' ')[0]}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('clients')}
            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              viewMode === 'clients'
                ? 'bg-brand-gold text-neutral-950 shadow-2xs'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Building2 className="size-3 inline mr-1" />
            {t('ovLeaderboardTopClients').split(' ')[0]}
          </button>
        </div>
      </div>

      {/* Visual Leaderboard Bars */}
      <div className="space-y-3">
        {viewMode === 'managers'
          ? topManagers.slice(0, 4).map((mgr, idx) => {
              const widthPct = Math.max(8, Math.round((mgr.totalSales / maxManagerSales) * 100));
              return (
                <div
                  key={mgr.employeeId}
                  className="p-2.5 rounded-xl bg-background/60 dark:bg-night-bg/60 border border-border/40 dark:border-night-border/40 space-y-1.5 shadow-2xs hover:border-brand-gold/40 transition-all"
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-bold">
                    <span className="flex items-center gap-2 truncate text-foreground dark:text-night-text">
                      <span
                        className={`size-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 shadow-xs ${
                          idx === 0
                            ? 'bg-brand-gold text-neutral-950'
                            : idx === 1
                              ? 'bg-slate-300 text-neutral-900'
                              : idx === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-border/40 text-muted'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="truncate">{mgr.employeeName}</span>
                    </span>
                    <span className="shrink-0 text-foreground dark:text-night-text font-black">
                      {formatMoney(mgr.totalSales, currency)}
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-border/20 dark:bg-night-border/40 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-brand-gold transition-all duration-700"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted font-medium">
                    <span>{mgr.departmentName || t('ovSalesDept')}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span>
                        {mgr.orderCount}{' '}
                        {t('ovOrdersCount', { count: mgr.orderCount }).split(' ')[1] || 'orders'}
                      </span>
                      <span className="text-emerald-500 font-bold">
                        +{formatMoney(mgr.totalMargin, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          : topClients.slice(0, 4).map((cli, idx) => {
              const widthPct = Math.max(8, Math.round((cli.totalSales / maxClientSales) * 100));
              return (
                <div
                  key={cli.clientId}
                  className="p-2.5 rounded-xl bg-background/60 dark:bg-night-bg/60 border border-border/40 dark:border-night-border/40 space-y-1.5 shadow-2xs hover:border-blue-500/40 transition-all"
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-bold">
                    <span className="flex items-center gap-2 truncate text-foreground dark:text-night-text">
                      <span
                        className={`size-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 shadow-xs ${
                          idx === 0
                            ? 'bg-blue-600 text-white'
                            : idx === 1
                              ? 'bg-blue-400 text-white'
                              : 'bg-border/40 text-muted'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="truncate">{cli.companyName || cli.clientName}</span>
                    </span>
                    <span className="shrink-0 text-foreground dark:text-night-text font-black">
                      {formatMoney(cli.totalSales, currency)}
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-border/20 dark:bg-night-border/40 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted font-medium">
                    <span className="truncate">{cli.clientName}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span>
                        {cli.orderCount}{' '}
                        {t('ovOrdersCount', { count: cli.orderCount }).split(' ')[1] || 'orders'}
                      </span>
                      <span className="text-emerald-500 font-bold">
                        +{formatMoney(cli.totalMargin, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

        {((viewMode === 'managers' && topManagers.length === 0) ||
          (viewMode === 'clients' && topClients.length === 0)) && (
          <p className="text-xs text-muted py-8 text-center">
            <T k="ovNoDataAvailable" />
          </p>
        )}
      </div>

      {/* Footer Navigation Action */}
      <button
        type="button"
        onClick={onNavigateCommercial}
        className="w-full py-2 px-3 text-xs font-bold text-brand-gold hover:text-brand-gold/80 bg-brand-gold/10 hover:bg-brand-gold/15 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
      >
        <span>{t('ovTabCommercial')}</span>
        <ArrowRight className="size-3.5" />
      </button>
    </div>
  );
};
