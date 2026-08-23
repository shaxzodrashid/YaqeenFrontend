import React from 'react';
import { Truck, TrainFront, Plane, Ship, Boxes, Package, Route as RouteIcon } from 'lucide-react';
import type {
  DashboardCargoDistributionResponse,
  TransportTypeDistributionItem,
} from '../../types/dashboard';
import { formatMoney } from '../../services/api';

interface TransportMixPanelProps {
  data: DashboardCargoDistributionResponse | null;
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

function statusColor(category: string): string {
  switch (category) {
    case 'Arrived':
      return 'bg-emerald-500';
    case 'On the way':
      return 'bg-cyan-500';
    case 'Waiting':
      return 'bg-amber-500';
    case 'Station':
      return 'bg-pink-500';
    case 'On the border':
      return 'bg-violet-500';
    default:
      return 'bg-orange-500';
  }
}

export const TransportMixPanel: React.FC<TransportMixPanelProps> = React.memo(
  ({ data, loading, currency: propCurrency }) => {
    if (loading) {
      return (
        <div className="h-96 rounded-2xl bg-surface/60 dark:bg-night-surface/60 border border-border/40 dark:border-night-border animate-pulse p-5" />
      );
    }
    if (!data) return null;

    const currency = data.currency || propCurrency || 'UZS';
    const transportDist: TransportTypeDistributionItem[] = data.transportTypeDistribution || [];
    const statusDist = data.statusDistribution || [];
    const cargoDist = data.cargoTypeDistribution || [];
    const maxTransportSales = Math.max(...transportDist.map((t) => t.totalSales), 1);
    const totalCargoOrders = cargoDist.reduce((acc, c) => acc + c.count, 0) || 1;

    return (
      <div className="p-5 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-xs space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 pb-3 border-b border-border/40 dark:border-night-border/40">
          <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-500">
            <RouteIcon className="size-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground dark:text-night-text">
              Transport & Cargo Mix
            </h4>
            <p className="text-[11px] text-muted">
              Multimodal share · status pipeline · LTL vs FTL
            </p>
          </div>
        </div>

        {/* 1. Transport Type Big Bars */}
        {transportDist.length > 0 && (
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              By transport type
            </span>
            {transportDist.map((t) => {
              const v = TRANSPORT_VISUALS[t.type] || TRANSPORT_VISUALS.OTHER;
              const widthPct = Math.max(6, Math.round((t.totalSales / maxTransportSales) * 100));
              return (
                <div key={t.type} className="group min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg shrink-0 ${v.chip}`}>{v.icon}</div>
                      <span className="text-xs font-bold text-foreground dark:text-night-text truncate">
                        {t.name || t.type}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted shrink-0">
                        {t.count} orders
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
        )}

        {/* 2. Status Pipeline */}
        {statusDist.length > 0 && (
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Status pipeline
            </span>
            <div className="flex w-full h-7 rounded-xl overflow-hidden border border-border/40 dark:border-night-border/40">
              {statusDist.map((s) => (
                <div
                  key={s.category}
                  title={`${s.category}: ${s.count} orders (${s.percentage}%)`}
                  style={{ width: `${Math.max(s.percentage, 2)}%` }}
                  className={`transition-all duration-500 hover:brightness-110 ${statusColor(s.category)}`}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
              {statusDist.map((s) => (
                <div
                  key={s.category}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-muted"
                >
                  <span className={`size-2 rounded-full shrink-0 ${statusColor(s.category)}`} />
                  <span className="truncate">{s.category}</span>
                  <span className="text-foreground dark:text-night-text ml-auto shrink-0">
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. LTL vs FTL Split */}
        {cargoDist.length > 0 && (
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              LTL vs FTL split
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cargoDist.map((c) => (
                <div
                  key={c.category}
                  className={`p-3 rounded-xl border ${
                    c.category === 'FTL'
                      ? 'border-blue-500/30 bg-blue-500/5'
                      : 'border-amber-500/30 bg-amber-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Boxes
                        className={`size-4 ${
                          c.category === 'FTL' ? 'text-blue-500' : 'text-amber-500'
                        }`}
                      />
                      <span className="text-xs font-black text-foreground dark:text-night-text">
                        {c.category}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-muted">
                      {c.count} orders · {c.percentage}%
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
                  <span className="text-[11px] font-extrabold text-foreground dark:text-night-text block mt-1.5">
                    {formatMoney(c.totalSales, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);
