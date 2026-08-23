import React from 'react';
import { MapPin, ArrowRight, Globe2, TrendingUp } from 'lucide-react';
import type { DashboardRouteAnalyticsResponse } from '../../types/dashboard';
import { formatMoney } from '../../services/api';

interface RouteAnalyticsPanelProps {
  data: DashboardRouteAnalyticsResponse | null;
  loading: boolean;
  currency?: string;
}

export const RouteAnalyticsPanel: React.FC<RouteAnalyticsPanelProps> = React.memo(
  ({ data, loading, currency: propCurrency }) => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-80 rounded-2xl bg-surface/60 dark:bg-night-surface/60 border border-border/40 dark:border-night-border animate-pulse p-4" />
          <div className="h-80 rounded-2xl bg-surface/60 dark:bg-night-surface/60 border border-border/40 dark:border-night-border animate-pulse p-4" />
        </div>
      );
    }
    if (!data) return null;

    const currency = data.currency || propCurrency || 'UZS';
    const routes = data.topRoutes || [];
    const countries = data.originCountries || [];
    const maxRouteSales = Math.max(...routes.map((r) => r.totalSales), 1);
    const maxCountryCount = Math.max(...countries.map((c) => c.count), 1);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Top Routes */}
        <div className="p-5 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-xs flex flex-col">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40 dark:border-night-border/40">
            <div className="p-2 rounded-xl bg-brand-gold/15 text-brand-gold">
              <MapPin className="size-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground dark:text-night-text">
                Top Trade Routes
              </h4>
              <p className="text-[11px] text-muted">Volume & revenue by corridor</p>
            </div>
          </div>

          <div className="flex flex-col gap-3.5 mt-4 flex-1">
            {routes.length === 0 ? (
              <p className="text-xs text-muted py-6 text-center">No route data available</p>
            ) : (
              routes.map((r, idx) => (
                <div key={r.route} className="min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`size-5.5 p-1 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          idx === 0
                            ? 'bg-amber-500 text-neutral-950'
                            : idx === 1
                              ? 'bg-brand-gold/60 text-neutral-950'
                              : 'bg-border/40 text-muted'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-foreground dark:text-night-text truncate">
                        {r.route}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted">
                        {r.count} trips
                      </span>
                      <span className="text-xs font-extrabold text-foreground dark:text-night-text">
                        {formatMoney(r.totalSales, currency)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-border/20 dark:bg-night-border/40 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-gold to-orange-400 transition-all duration-700"
                      style={{
                        width: `${Math.max(6, Math.round((r.totalSales / maxRouteSales) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-muted">
                    <span className="truncate flex items-center gap-1 min-w-0">
                      {r.originCity || r.originCountry || '?'}
                      <ArrowRight className="size-2.5" />
                      {r.destinationCity || r.destinationCountry || '?'}
                    </span>
                    {r.totalMargin !== undefined && (
                      <span className="text-emerald-500 font-bold shrink-0">
                        +{formatMoney(r.totalMargin, currency)} net · {r.percentage}%
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Origin Countries */}
        <div className="p-5 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-xs flex flex-col">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40 dark:border-night-border/40">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-500">
              <Globe2 className="size-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground dark:text-night-text">
                Origin Countries
              </h4>
              <p className="text-[11px] text-muted">Where your cargo comes from</p>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-4 flex-1 justify-center">
            {countries.length === 0 ? (
              <p className="text-xs text-muted py-6 text-center">No country data available</p>
            ) : (
              countries.map((c) => (
                <div key={c.countryName}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-foreground dark:text-night-text truncate">
                      {c.countryName}
                    </span>
                    <span className="text-[10px] font-bold text-muted shrink-0 ml-2">
                      {c.count} orders · {c.percentage}%
                    </span>
                  </div>
                  <div className="h-6 w-full rounded-lg bg-border/20 dark:bg-night-border/40 overflow-hidden relative">
                    <div
                      className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-700"
                      style={{
                        width: `${Math.max(8, Math.round((c.count / maxCountryCount) * 100))}%`,
                      }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-foreground dark:text-night-text flex items-center gap-1">
                      <TrendingUp className="size-3" />
                      {formatMoney(c.totalSales, currency)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }
);
