import React from 'react';
import { Trophy, Building2 } from 'lucide-react';
import type { DashboardTopPerformersResponse } from '../../types/dashboard';
import { formatMoney } from '../../services/api';
import { T } from '../T';

interface TopPerformersLeaderboardProps {
  data: DashboardTopPerformersResponse | null;
  loading: boolean;
}

export const TopPerformersLeaderboard: React.FC<TopPerformersLeaderboardProps> = React.memo(({ data, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-80 rounded-2xl bg-surface/60 dark:bg-night-surface/60 border border-border/40 dark:border-night-border animate-pulse p-4" />
        <div className="h-80 rounded-2xl bg-surface/60 dark:bg-night-surface/60 border border-border/40 dark:border-night-border animate-pulse p-4" />
      </div>
    );
  }

  if (!data) return null;

  const { topManagers, topClients } = data;

  const maxManagerSales = Math.max(...topManagers.map((m) => m.totalSales), 1);
  const maxClientSales = Math.max(...topClients.map((c) => c.totalSales), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Top Sales Managers */}
      <div className="p-5 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-xs flex flex-col transition-colors duration-300">
        <div className="flex items-center justify-between pb-3 border-b border-border/40 dark:border-night-border/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500">
              <Trophy className="size-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground dark:text-night-text"><T k="ovLeaderboardTopManagers" /></h4>
              <p className="text-[11px] text-muted"><T k="ovLeaderboardManagerSubtitle" /></p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <T k="ovLeaderboardBadge" />
          </span>
        </div>

        <div className="flex flex-col gap-3.5 mt-4">
          {topManagers.length === 0 ? (
            <p className="text-xs text-muted py-6 text-center"><T k="ovNoManagerData" /></p>
          ) : (
            topManagers.map((mgr, idx) => {
              const salesPct = Math.round((mgr.totalSales / maxManagerSales) * 100);
              return (
                <div
                  key={mgr.employeeId}
                  className="p-3 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/30 dark:border-night-border/30 hover:border-brand-gold/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`size-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          idx === 0
                            ? 'bg-amber-500 text-neutral-950 shadow-xs'
                            : idx === 1
                            ? 'bg-slate-300 text-neutral-900'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-border/40 text-muted'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground dark:text-night-text">
                          {mgr.employeeName}
                        </span>
                        <span className="text-[10px] text-muted">{mgr.departmentName || 'Sales Dept'}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-extrabold text-foreground dark:text-night-text">
                        {formatMoney(mgr.totalSales, 'USD')}
                      </span>
                      <div className="flex items-center justify-end gap-1.5 text-[10px]">
                        <span className="text-emerald-500 font-bold">
                          +{formatMoney(mgr.totalMargin, 'USD')} net
                        </span>
                        <span className="text-muted">• {mgr.orderCount} orders</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-border/20 dark:bg-night-border/40 h-1.5 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-brand-gold h-full rounded-full transition-all duration-500"
                      style={{ width: `${salesPct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Top Clients */}
      <div className="p-5 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-xs flex flex-col transition-colors duration-300">
        <div className="flex items-center justify-between pb-3 border-b border-border/40 dark:border-night-border/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-500">
              <Building2 className="size-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground dark:text-night-text"><T k="ovLeaderboardTopClients" /></h4>
              <p className="text-[11px] text-muted"><T k="ovLeaderboardClientSubtitle" /></p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <T k="ovLeaderboardBadge" />
          </span>
        </div>

        <div className="flex flex-col gap-3.5 mt-4">
          {topClients.length === 0 ? (
            <p className="text-xs text-muted py-6 text-center"><T k="ovNoClientData" /></p>
          ) : (
            topClients.map((cli, idx) => {
              const salesPct = Math.round((cli.totalSales / maxClientSales) * 100);
              return (
                <div
                  key={cli.clientId}
                  className="p-3 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/30 dark:border-night-border/30 hover:border-blue-500/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`size-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          idx === 0
                            ? 'bg-blue-600 text-white shadow-xs'
                            : idx === 1
                            ? 'bg-blue-400 text-white'
                            : 'bg-border/40 text-muted'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground dark:text-night-text">
                          {cli.companyName || cli.clientName}
                        </span>
                        <span className="text-[10px] text-muted">{cli.clientName}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-extrabold text-foreground dark:text-night-text">
                        {formatMoney(cli.totalSales, 'USD')}
                      </span>
                      <div className="flex items-center justify-end gap-1.5 text-[10px]">
                        <span className="text-emerald-500 font-bold">
                          +{formatMoney(cli.totalMargin, 'USD')} net
                        </span>
                        <span className="text-muted">• {cli.orderCount} orders</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-border/20 dark:bg-night-border/40 h-1.5 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${salesPct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
});

