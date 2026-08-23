import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Building2,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Scale,
  Users,
  Truck,
  LayoutGrid,
  Search,
} from 'lucide-react';
import type {
  DashboardTopPerformersResponse,
  DashboardDebtSummaryResponse,
} from '../../types/dashboard';
import { formatMoney } from '../../services/api';
import { T } from '../T';

interface StakeholderFinancialHubProps {
  topPerformers: DashboardTopPerformersResponse | null;
  debtSummary: DashboardDebtSummaryResponse | null;
  loading: boolean;
  currency?: string;
}

type StakeholderTab = 'leaders' | 'debt' | 'combined';

export const StakeholderFinancialHub: React.FC<StakeholderFinancialHubProps> = React.memo(
  ({ topPerformers, debtSummary, loading, currency: propCurrency }) => {
    const [tab, setTab] = useState<StakeholderTab>('leaders');
    const [searchQuery, setSearchQuery] = useState('');

    const currency = topPerformers?.currency || debtSummary?.currency || propCurrency || 'UZS';

    const topManagers = topPerformers?.topManagers;
    const topClients = topPerformers?.topClients;

    // Search filters for managers and clients
    const filteredManagers = useMemo(() => {
      if (!topManagers) return [];
      if (!searchQuery.trim()) return topManagers;
      const q = searchQuery.toLowerCase();
      return topManagers.filter(
        (m) =>
          m.employeeName.toLowerCase().includes(q) ||
          (m.departmentName || '').toLowerCase().includes(q)
      );
    }, [topManagers, searchQuery]);

    const filteredClients = useMemo(() => {
      if (!topClients) return [];
      if (!searchQuery.trim()) return topClients;
      const q = searchQuery.toLowerCase();
      return topClients.filter(
        (c) =>
          c.clientName.toLowerCase().includes(q) || (c.companyName || '').toLowerCase().includes(q)
      );
    }, [topClients, searchQuery]);

    if (loading) {
      return (
        <div className="p-6 rounded-2xl bg-surface/60 dark:bg-night-surface/60 border border-border/40 dark:border-night-border animate-pulse h-[440px]" />
      );
    }

    const managersList = topManagers || [];
    const clientsList = topClients || [];

    const receivable = debtSummary?.accountsReceivable || 0;
    const payable = debtSummary?.accountsPayable || 0;
    const netBalance = debtSummary?.netBalance || 0;
    const maxFlow = Math.max(receivable, payable, 1);
    const debtors = debtSummary?.topDebtorClients || [];
    const creditors = debtSummary?.topCreditorCarriers || [];

    const maxManagerSales = Math.max(...managersList.map((m) => m.totalSales), 1);
    const maxClientSales = Math.max(...clientsList.map((c) => c.totalSales), 1);

    return (
      <div className="p-5 sm:p-6 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-xs space-y-5 transition-all duration-300">
        {/* Header with Title, Net Cash Badge & Segmented View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/40 dark:border-night-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500 shrink-0">
              <Trophy className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground dark:text-night-text">
                <T k="ovStakeholderHubTitle" />
              </h3>
              <p className="text-xs text-muted dark:text-night-muted mt-0.5">
                <T k="ovStakeholderHubSubtitle" />
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Net Balance Status Chip */}
            {debtSummary && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border ${
                  netBalance >= 0
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                }`}
              >
                <Scale className="size-3.5" />
                <span>Net: {formatMoney(netBalance, currency)}</span>
              </span>
            )}

            {/* View Mode Pills */}
            <div className="flex items-center p-1 bg-border/20 dark:bg-night-border/40 rounded-xl border border-border/30 dark:border-night-border/30">
              <button
                type="button"
                onClick={() => setTab('leaders')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  tab === 'leaders'
                    ? 'bg-brand-gold text-neutral-950 shadow-xs'
                    : 'text-muted dark:text-night-muted hover:text-foreground'
                }`}
              >
                <Trophy className="size-3.5" />
                <T k="ovTabLeaders" />
              </button>
              <button
                type="button"
                onClick={() => setTab('debt')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  tab === 'debt'
                    ? 'bg-brand-gold text-neutral-950 shadow-xs'
                    : 'text-muted dark:text-night-muted hover:text-foreground'
                }`}
              >
                <Wallet className="size-3.5" />
                <T k="ovTabDebt" />
              </button>
              <button
                type="button"
                onClick={() => setTab('combined')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  tab === 'combined'
                    ? 'bg-brand-gold text-neutral-950 shadow-xs'
                    : 'text-muted dark:text-night-muted hover:text-foreground'
                }`}
              >
                <LayoutGrid className="size-3.5" />
                <T k="ovTabCombined" />
              </button>
            </div>
          </div>
        </div>

        {/* ── TAB 1: COMMERCIAL LEADERS (MANAGERS & CLIENTS) ────────────────── */}
        {tab === 'leaders' && (
          <div className="space-y-4">
            {/* Search filter row */}
            {(managersList.length > 3 || clientsList.length > 3) && (
              <div className="relative max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter managers or clients..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-background dark:bg-night-bg border border-border/60 dark:border-night-border text-foreground dark:text-night-text focus:outline-none focus:border-brand-gold"
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* 1. Top Sales Managers */}
              <div className="p-4 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 dark:border-night-border/40 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500">
                      <Trophy className="size-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground dark:text-night-text">
                      <T k="ovLeaderboardTopManagers" />
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-500">
                    <T k="ovLeaderboardBadge" />
                  </span>
                </div>

                <div className="space-y-2.5">
                  {filteredManagers.length === 0 ? (
                    <p className="text-xs text-muted py-6 text-center">
                      <T k="ovNoManagerData" />
                    </p>
                  ) : (
                    filteredManagers.map((mgr, idx) => {
                      const salesPct = Math.round((mgr.totalSales / maxManagerSales) * 100);
                      return (
                        <div
                          key={mgr.employeeId}
                          className="p-2.5 rounded-xl bg-surface dark:bg-night-surface border border-border/30 hover:border-brand-gold/40 transition-all min-w-0"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`size-5.5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
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
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-foreground dark:text-night-text truncate">
                                  {mgr.employeeName}
                                </span>
                                <span className="text-[10px] text-muted truncate">
                                  {mgr.departmentName || 'Sales Dept'}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs font-extrabold text-foreground dark:text-night-text block">
                                {formatMoney(mgr.totalSales, currency)}
                              </span>
                              <span className="text-[10px] text-emerald-500 font-bold">
                                +{formatMoney(mgr.totalMargin, currency)} net · {mgr.orderCount}{' '}
                                orders
                              </span>
                            </div>
                          </div>

                          <div className="w-full bg-border/20 dark:bg-night-border/40 h-1.5 rounded-full mt-2 overflow-hidden">
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

              {/* 2. Top Corporate Clients */}
              <div className="p-4 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 dark:border-night-border/40 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-500">
                      <Building2 className="size-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground dark:text-night-text">
                      <T k="ovLeaderboardTopClients" />
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-blue-500">
                    <T k="ovLeaderboardBadge" />
                  </span>
                </div>

                <div className="space-y-2.5">
                  {filteredClients.length === 0 ? (
                    <p className="text-xs text-muted py-6 text-center">
                      <T k="ovNoClientData" />
                    </p>
                  ) : (
                    filteredClients.map((cli, idx) => {
                      const salesPct = Math.round((cli.totalSales / maxClientSales) * 100);
                      return (
                        <div
                          key={cli.clientId}
                          className="p-2.5 rounded-xl bg-surface dark:bg-night-surface border border-border/30 hover:border-blue-500/40 transition-all min-w-0"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`size-5.5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                  idx === 0
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : idx === 1
                                      ? 'bg-blue-400 text-white'
                                      : 'bg-border/40 text-muted'
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-foreground dark:text-night-text truncate">
                                  {cli.companyName || cli.clientName}
                                </span>
                                <span className="text-[10px] text-muted truncate">
                                  {cli.clientName}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs font-extrabold text-foreground dark:text-night-text block">
                                {formatMoney(cli.totalSales, currency)}
                              </span>
                              <span className="text-[10px] text-emerald-500 font-bold">
                                +{formatMoney(cli.totalMargin, currency)} net · {cli.orderCount}{' '}
                                orders
                              </span>
                            </div>
                          </div>

                          <div className="w-full bg-border/20 dark:bg-night-border/40 h-1.5 rounded-full mt-2 overflow-hidden">
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
          </div>
        )}

        {/* ── TAB 2: ACCOUNTS RECEIVABLE & PAYABLE (DEBT) ────────────────────── */}
        {tab === 'debt' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 1. Debt Balance Overview */}
            <div className="p-4 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                <div className="p-1.5 rounded-lg bg-brand-gold/15 text-brand-gold">
                  <Wallet className="size-4" />
                </div>
                <span className="text-xs font-bold text-foreground dark:text-night-text">
                  Balance Overview
                </span>
              </div>

              {/* Receivables Bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-muted flex items-center gap-1.5">
                    <ArrowDownToLine className="size-3.5 text-emerald-500" />
                    Receivables (Clients owe)
                  </span>
                  {debtSummary?.debtorClientCount !== undefined && (
                    <span className="text-[10px] font-bold text-muted">
                      {debtSummary.debtorClientCount} clients
                    </span>
                  )}
                </div>
                <div className="h-7 w-full rounded-lg bg-border/20 dark:bg-night-border/40 overflow-hidden">
                  <div
                    className="h-full rounded-lg bg-gradient-to-r from-emerald-500 to-green-400 flex items-center justify-end pr-2 transition-all duration-700"
                    style={{ width: `${Math.max(12, Math.round((receivable / maxFlow) * 100))}%` }}
                  >
                    <span className="text-[10px] font-black text-white drop-shadow">
                      {formatMoney(receivable, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payables Bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-muted flex items-center gap-1.5">
                    <ArrowUpFromLine className="size-3.5 text-rose-500" />
                    Payables (Carrier debt)
                  </span>
                  {debtSummary?.creditorCarrierCount !== undefined && (
                    <span className="text-[10px] font-bold text-muted">
                      {debtSummary.creditorCarrierCount} carriers
                    </span>
                  )}
                </div>
                <div className="h-7 w-full rounded-lg bg-border/20 dark:bg-night-border/40 overflow-hidden">
                  <div
                    className="h-full rounded-lg bg-gradient-to-r from-rose-500 to-orange-400 flex items-center justify-end pr-2 transition-all duration-700"
                    style={{ width: `${Math.max(12, Math.round((payable / maxFlow) * 100))}%` }}
                  >
                    <span className="text-[10px] font-black text-white drop-shadow">
                      {formatMoney(payable, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Balance Result Card */}
              <div
                className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                  netBalance >= 0
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}
              >
                <Scale
                  className={`size-5 shrink-0 ${netBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
                />
                <div className="min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted block">
                    Net Cash Flow Balance
                  </span>
                  <span
                    className={`text-base font-black tracking-tight ${
                      netBalance >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatMoney(netBalance, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Top Debtor Clients */}
            <div className="p-4 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 flex flex-col justify-between">
              <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-500">
                  <Users className="size-4" />
                </div>
                <span className="text-xs font-bold text-foreground dark:text-night-text">
                  Top Debtor Clients
                </span>
              </div>

              <div className="space-y-2.5 my-2">
                {debtors.length === 0 ? (
                  <p className="text-xs text-muted py-6 text-center">No debtor clients</p>
                ) : (
                  debtors.map((d, idx) => (
                    <div key={d.clientId} className="min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`size-4.5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
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
                      <span className="text-[10px] text-muted">{d.orderCount} open orders</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. Top Creditor Carriers */}
            <div className="p-4 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 flex flex-col justify-between">
              <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-500">
                  <Truck className="size-4" />
                </div>
                <span className="text-xs font-bold text-foreground dark:text-night-text">
                  Top Creditor Carriers
                </span>
              </div>

              <div className="space-y-2.5 my-2">
                {creditors.length === 0 ? (
                  <p className="text-xs text-muted py-6 text-center">No creditor carriers</p>
                ) : (
                  creditors.map((c, idx) => (
                    <div key={c.agentName} className="min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`size-4.5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
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
                      <span className="text-[10px] text-muted">{c.orderCount} open orders</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: 360° PARTNER OVERVIEW (HIGH-DENSITY 3-COLUMN) ───────────── */}
        {tab === 'combined' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: Top Managers */}
            <div className="p-3.5 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 space-y-2.5">
              <div className="flex items-center gap-2 pb-1.5 border-b border-border/30">
                <Trophy className="size-3.5 text-amber-500" />
                <span className="text-xs font-bold text-foreground dark:text-night-text">
                  Top Managers
                </span>
              </div>
              <div className="space-y-2">
                {managersList.slice(0, 4).map((mgr, i) => (
                  <div key={mgr.employeeId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-[10px] font-bold text-muted">{i + 1}.</span>
                      <span className="font-semibold text-foreground dark:text-night-text truncate">
                        {mgr.employeeName}
                      </span>
                    </div>
                    <span className="font-extrabold text-amber-500 shrink-0 ml-1">
                      {formatMoney(mgr.totalSales, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Top Clients */}
            <div className="p-3.5 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 space-y-2.5">
              <div className="flex items-center gap-2 pb-1.5 border-b border-border/30">
                <Building2 className="size-3.5 text-blue-500" />
                <span className="text-xs font-bold text-foreground dark:text-night-text">
                  Top Clients
                </span>
              </div>
              <div className="space-y-2">
                {clientsList.slice(0, 4).map((cli, i) => (
                  <div key={cli.clientId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-[10px] font-bold text-muted">{i + 1}.</span>
                      <span className="font-semibold text-foreground dark:text-night-text truncate">
                        {cli.companyName || cli.clientName}
                      </span>
                    </div>
                    <span className="font-extrabold text-blue-500 shrink-0 ml-1">
                      {formatMoney(cli.totalSales, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Outstanding Balances */}
            <div className="p-3.5 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 space-y-2.5">
              <div className="flex items-center gap-2 pb-1.5 border-b border-border/30">
                <Wallet className="size-3.5 text-brand-gold" />
                <span className="text-xs font-bold text-foreground dark:text-night-text">
                  Cash Flow Balances
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted flex items-center gap-1">
                    <ArrowDownToLine className="size-3 text-emerald-500" />
                    Receivables:
                  </span>
                  <span className="font-bold text-emerald-500">
                    {formatMoney(receivable, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted flex items-center gap-1">
                    <ArrowUpFromLine className="size-3 text-rose-500" />
                    Payables:
                  </span>
                  <span className="font-bold text-rose-500">{formatMoney(payable, currency)}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border/30 font-extrabold">
                  <span>Net Cash Balance:</span>
                  <span className={netBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                    {formatMoney(netBalance, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);
