import React from 'react';
import { Gauge, Clock3, PackageCheck, Truck, Timer } from 'lucide-react';
import type { DashboardDeliveryEfficiencyResponse } from '../../types/dashboard';
import { formatMoney } from '../../services/api';
import { T } from '../T';
import { useTranslation } from '../../context/LanguageContext';

interface DeliveryEfficiencyPanelProps {
  data: DashboardDeliveryEfficiencyResponse | null;
  loading: boolean;
  currency?: string;
}

/** Large semi-circular SVG gauge for on-time rate */
function OnTimeGauge({ percentage }: { percentage: number }) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const r = 80;
  const cx = 100;
  const cy = 95;
  // Semi-circle from 180deg to 0deg
  const circumference = Math.PI * r;
  const filled = (clamped / 100) * circumference;

  return (
    <div className="relative w-[200px] h-[120px] mx-auto">
      <svg viewBox="0 0 200 110" className="w-full h-full">
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          strokeWidth="16"
          strokeLinecap="round"
          className="stroke-border/30 dark:stroke-night-border/60"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          className="transition-all duration-700"
          stroke="url(#gaugeGradient)"
        />
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="60%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <span className="text-3xl font-black text-foreground dark:text-night-text tracking-tight">
          {clamped.toFixed(1)}
          <span className="text-base">%</span>
        </span>
        <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
          <T k="ovOnTimeRate" />
        </span>
      </div>
    </div>
  );
}

export const DeliveryEfficiencyPanel: React.FC<DeliveryEfficiencyPanelProps> = React.memo(
  ({ data, loading, currency: propCurrency }) => {
    const { t } = useTranslation();

    if (loading) {
      return (
        <div className="h-96 rounded-2xl bg-surface/60 dark:bg-night-surface/60 border border-border/40 dark:border-night-border animate-pulse p-5" />
      );
    }
    if (!data) return null;

    const currency = data.currency || propCurrency || 'UZS';
    const routes = data.routeTransitTimes || [];
    const breakdown = data.statusBreakdown || [];
    const maxRouteDays = Math.max(...routes.map((r) => r.averageTransitDays), 1);
    const transitRange =
      data.maxTransitDays !== undefined && data.minTransitDays !== undefined
        ? Math.max(data.maxTransitDays - data.minTransitDays, 1)
        : 0;
    const avgPos =
      transitRange > 0
        ? Math.round(((data.averageTransitDays - (data.minTransitDays ?? 0)) / transitRange) * 100)
        : 50;

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
      <div className="p-5 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-xs space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 pb-3 border-b border-border/40 dark:border-night-border/40">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500">
            <Gauge className="size-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground dark:text-night-text">
              <T k="ovDeliverySpeedScore" />
            </h4>
            <p className="text-[11px] text-muted">
              <T k="ovTransitSpeedScorecard" />
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. On-time gauge */}
          <div className="flex flex-col items-center justify-center gap-4">
            <OnTimeGauge percentage={data.onTimeRatePercentage ?? 0} />
            <div className="grid grid-cols-3 gap-2 w-full">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-center">
                <PackageCheck className="size-4 text-emerald-500 mx-auto mb-0.5" />
                <span className="block text-sm font-black text-foreground dark:text-night-text">
                  {data.totalDeliveredCount}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wide text-muted">
                  <T k="ovStatusDelivered" />
                </span>
              </div>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-center">
                <Truck className="size-4 text-cyan-500 mx-auto mb-0.5" />
                <span className="block text-sm font-black text-foreground dark:text-night-text">
                  {data.totalInTransitCount ?? 0}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wide text-muted">
                  <T k="ovStatusInTransit" />
                </span>
              </div>
              <div className="p-2 rounded-xl bg-violet-500/10 text-center">
                <Clock3 className="size-4 text-violet-500 mx-auto mb-0.5" />
                <span className="block text-sm font-black text-foreground dark:text-night-text">
                  {data.totalActiveCount ?? 0}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wide text-muted">
                  <T k="ovStatusActive" />
                </span>
              </div>
            </div>
          </div>

          {/* 2. Average transit days + range */}
          <div className="flex flex-col justify-center gap-4 min-w-0">
            <div className="text-center lg:text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                <T k="ovAvgTransitTime" />
              </span>
              <span className="text-4xl font-black text-foreground dark:text-night-text tracking-tight">
                {data.averageTransitDays.toFixed(1)}
                <span className="text-lg font-bold text-muted"> {t('ovDaysSuffix')}</span>
              </span>
            </div>

            {transitRange > 0 && (
              <div>
                <div className="relative h-2.5 w-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500">
                  <div
                    className="absolute -top-1 size-4 rounded-full bg-white dark:bg-night-surface border-[3px] border-brand-gold shadow-md transition-all duration-700"
                    style={{ left: `calc(${Math.min(Math.max(avgPos, 0), 100)}% - 8px)` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] font-bold text-muted">
                  <span>{t('ovFastestDays', { days: data.minTransitDays ?? 0 })}</span>
                  <span>{t('ovSlowestDays', { days: data.maxTransitDays ?? 0 })}</span>
                </div>
              </div>
            )}

            {(data.onTimeDeliveriesCount !== undefined ||
              data.delayedDeliveriesCount !== undefined) && (
              <div className="flex gap-2">
                <span className="flex-1 text-center py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold">
                  {t('ovOnTimeCount', { count: data.onTimeDeliveriesCount ?? 0 })}
                </span>
                <span className="flex-1 text-center py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-extrabold">
                  {t('ovDelayedCount', { count: data.delayedDeliveriesCount ?? 0 })}
                </span>
              </div>
            )}
          </div>

          {/* 3. Route transit times */}
          <div className="flex flex-col justify-center gap-3 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Timer className="size-3.5" />
              <T k="ovTransitSpeedByCorridor" />
            </span>
            {routes.length === 0 ? (
              <p className="text-xs text-muted">
                <T k="ovNoRouteTimingData" />
              </p>
            ) : (
              routes.map((r) => (
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
                  <span className="text-[10px] text-muted">
                    {t('ovShipmentsCount', { count: r.count })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Status breakdown chips */}
        {breakdown.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {breakdown.map((b) => (
              <span
                key={b.status}
                title={b.totalSales !== undefined ? formatMoney(b.totalSales, currency) : undefined}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-[11px] font-bold text-muted-foreground"
              >
                {getStatusLabel(b.label || b.status)}
                <span className="text-foreground dark:text-night-text">{b.count}</span>
                <span className="text-muted">({b.percentage}%)</span>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }
);
