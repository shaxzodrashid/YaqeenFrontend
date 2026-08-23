import React from 'react';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Scale, Users, Truck } from 'lucide-react';
import type { DashboardDebtSummaryResponse } from '../../types/dashboard';
import { formatMoney } from '../../services/api';

interface DebtSummaryPanelProps {
  data: DashboardDebtSummaryResponse | null;
  loading: boolean;
  currency?: string;
}

export const DebtSummaryPanel: React.FC<DebtSummaryPanelProps> = React.memo(
  ({ data, loading, currency: propCurrency }) => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-80 rounded-2xl bg-surface/60 dark:bg-night-surface/60 border border-border/40 dark:border-night-border animate-pulse p-4" />
          <div className="h-80 rounded-2xl bg-surface/60 dark:bg-night-surface/60 border border-border/40 dark:border-night-border animate-pulse p-4" />
          <div className="h-80 rounded-2xl bg-surface/60 dark:bg-night-surface/60 border border-border/40 dark:border-night-border animate-pulse p-4" />
        </div>
      );
    }
    if (!data) return null;

    const currency = data.currency || propCurrency || 'UZS';
    const receivable = data.accountsReceivable || 0;
    const payable = data.accountsPayable || 0;
    const maxFlow = Math.max(receivable, payable, 1);
    const debtors = data.topDebtorClients || [];
    const creditors = data.topCreditorCarriers || [];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. Balance Overview */}
        <div className="p-5 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40 dark:border-night-border/40">
            <div className="p-2 rounded-xl bg-brand-gold/15 text-brand-gold">
              <Wallet className="size-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground dark:text-night-text">
                Debt Balance
              </h4>
              <p className="text-[11px] text-muted">Receivables vs payables</p>
            </div>
          </div>

          {/* Receivable bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-muted flex items-center gap-1.5">
                <ArrowDownToLine className="size-3.5 text-emerald-500" />
                Receivable (clients owe)
              </span>
              {data.debtorClientCount !== undefined && (
                <span className="text-[10px] font-bold text-muted">
                  {data.debtorClientCount} clients
                </span>
              )}
            </div>
            <div className="h-8 w-full rounded-xl bg-border/20 dark:bg-night-border/40 overflow-hidden">
              <div
                className="h-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 flex items-center justify-end pr-2 transition-all duration-700"
                style={{ width: `${Math.max(12, Math.round((receivable / maxFlow) * 100))}%` }}
              >
                <span className="text-[11px] font-black text-white drop-shadow">
                  {formatMoney(receivable, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Payable bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-muted flex items-center gap-1.5">
                <ArrowUpFromLine className="size-3.5 text-rose-500" />
                Payable (owed to carriers)
              </span>
              {data.creditorCarrierCount !== undefined && (
                <span className="text-[10px] font-bold text-muted">
                  {data.creditorCarrierCount} carriers
                </span>
              )}
            </div>
            <div className="h-8 w-full rounded-xl bg-border/20 dark:bg-night-border/40 overflow-hidden">
              <div
                className="h-full rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 flex items-center justify-end pr-2 transition-all duration-700"
                style={{ width: `${Math.max(12, Math.round((payable / maxFlow) * 100))}%` }}
              >
                <span className="text-[11px] font-black text-white drop-shadow">
                  {formatMoney(payable, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Net balance */}
          <div
            className={`mt-auto p-3.5 rounded-xl border flex items-center gap-3 ${
              data.netBalance >= 0
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-rose-500/10 border-rose-500/30'
            }`}
          >
            <Scale
              className={`size-6 shrink-0 ${
                data.netBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            />
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                Net balance
              </span>
              <span
                className={`text-lg font-black tracking-tight ${
                  data.netBalance >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatMoney(data.netBalance, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Top Debtor Clients */}
        <div className="p-5 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-xs flex flex-col">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40 dark:border-night-border/40">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500">
              <Users className="size-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground dark:text-night-text">
                Top Debtor Clients
              </h4>
              <p className="text-[11px] text-muted">Largest unpaid balances</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4 flex-1">
            {debtors.length === 0 ? (
              <p className="text-xs text-muted py-6 text-center m-auto">No debtor clients</p>
            ) : (
              debtors.map((d, idx) => {
                const pct = Math.max(6, Math.round((d.amount / maxFlow) * 100));
                return (
                  <div key={d.clientId} className="min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`size-5 p-1 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                            idx === 0 ? 'bg-emerald-500 text-white' : 'bg-border/40 text-muted'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-foreground dark:text-night-text truncate">
                          {d.companyName || d.clientName}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                        {formatMoney(d.amount, currency)}
                      </span>
                    </div>
                    <div
                      className="h-1.5 w-full rounded-full bg-border/20 dark:bg-night-border/40 overflow-hidden ml-auto"
                      style={{ maxWidth: '100%' }}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted">{d.orderCount} open orders</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. Top Creditor Carriers */}
        <div className="p-5 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-xs flex flex-col">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40 dark:border-night-border/40">
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-500">
              <Truck className="size-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground dark:text-night-text">
                Top Creditor Carriers
              </h4>
              <p className="text-[11px] text-muted">What we owe carriers & agents</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4 flex-1">
            {creditors.length === 0 ? (
              <p className="text-xs text-muted py-6 text-center m-auto">No creditor carriers</p>
            ) : (
              creditors.map((c, idx) => {
                const pct = Math.max(6, Math.round((c.amount / maxFlow) * 100));
                return (
                  <div key={c.agentName} className="min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`size-5 p-1 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                            idx === 0 ? 'bg-rose-500 text-white' : 'bg-border/40 text-muted'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-foreground dark:text-night-text truncate">
                          {c.agentName}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 shrink-0">
                        {formatMoney(c.amount, currency)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-border/20 dark:bg-night-border/40 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted">{c.orderCount} open orders</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }
);
