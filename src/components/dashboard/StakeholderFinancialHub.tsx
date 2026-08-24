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
  Search,
  X,
  CreditCard,
} from 'lucide-react';
import type {
  DashboardTopPerformersResponse,
  DashboardDebtSummaryResponse,
} from '../../types/dashboard';
import { formatMoney } from '../../services/api';
import { T } from '../T';
import { useTranslation } from '../../context/LanguageContext';

interface StakeholderFinancialHubProps {
  topPerformers: DashboardTopPerformersResponse | null;
  debtSummary: DashboardDebtSummaryResponse | null;
  loading: boolean;
  currency?: string;
}

export const StakeholderFinancialHub: React.FC<StakeholderFinancialHubProps> = React.memo(
  ({ topPerformers, debtSummary, loading, currency: propCurrency }) => {
    const { t } = useTranslation();
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
        <div className="p-6 rounded-2xl bg-surface/60 dark:bg-night-surface/60 border border-border/40 dark:border-night-border animate-pulse h-[520px]" />
      );
    }

    const managersList = topManagers || [];
    const clientsList = topClients || [];

    const receivable = debtSummary?.accountsReceivable || 0;
    const payable = debtSummary?.accountsPayable || 0;
    const netBalance = debtSummary?.netBalance || 0;
    const totalFlow = receivable + payable;
    const recPct = totalFlow > 0 ? Math.round((receivable / totalFlow) * 100) : 50;
    const payPct = totalFlow > 0 ? 100 - recPct : 50;

    const debtors = debtSummary?.topDebtorClients || [];
    const creditors = debtSummary?.topCreditorCarriers || [];

    const maxManagerSales = Math.max(...managersList.map((m) => m.totalSales), 1);
    const maxClientSales = Math.max(...clientsList.map((c) => c.totalSales), 1);
    const maxDebtorAmount = Math.max(...debtors.map((d) => d.amount), 1);
    const maxCreditorAmount = Math.max(...creditors.map((c) => c.amount), 1);

    return (
      <div className="p-5 sm:p-6 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-xs space-y-6 transition-all duration-300">
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/40 dark:border-night-border/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500 shrink-0 shadow-xs">
              <Trophy className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-foreground dark:text-night-text">
                  <T k="ovStakeholderHubTitle" />
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                  <T k="ovLeaderboardBadge" />
                </span>
              </div>
              <p className="text-xs text-muted dark:text-night-muted mt-0.5">
                <T k="ovStakeholderHubSubtitle" />
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Quick Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('ovSearchManagersOrClients')}
                className="w-full pl-8.5 pr-8 py-1.5 text-xs rounded-xl bg-background dark:bg-night-bg border border-border/60 dark:border-night-border text-foreground dark:text-night-text placeholder:text-muted focus:outline-none focus:border-brand-gold transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-foreground rounded-full"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Net Balance Status Chip */}
            {debtSummary && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border shrink-0 shadow-xs ${
                  netBalance >= 0
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                }`}
              >
                <Scale className="size-3.5" />
                <span>
                  {t('ovNetCashBalance')}: {formatMoney(netBalance, currency)}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* ── WORKING CAPITAL & CASH BALANCE SUMMARY STRIP ───────────────────── */}
        {debtSummary && (
          <div className="p-4 sm:p-5 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 dark:border-night-border/40 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <CreditCard className="size-4 text-brand-gold" />
                <T k="ovBalanceOverview" />
              </span>
              <span className="text-[11px] font-semibold text-muted">
                <T k="ovReceivablesVsPayables" />
              </span>
            </div>

            {/* 3 Metric Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Card 1: Receivables */}
              <div className="p-3.5 rounded-xl bg-surface dark:bg-night-surface border border-emerald-500/20 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-0.5">
                    <ArrowDownToLine className="size-3.5" />
                    <span>
                      <T k="ovReceivablesClientsOwe" />
                    </span>
                  </div>
                  <span className="text-base sm:text-lg font-black text-foreground dark:text-night-text block truncate">
                    {formatMoney(receivable, currency)}
                  </span>
                  <span className="text-[10px] font-semibold text-muted">
                    {t('ovClientsCount', {
                      count: debtSummary.debtorClientCount ?? debtors.length,
                    })}
                  </span>
                </div>
                <span className="text-xs font-black px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {recPct}%
                </span>
              </div>

              {/* Card 2: Net Cash Balance */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  netBalance >= 0
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-rose-500/5 border-rose-500/30'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold mb-0.5 text-muted">
                    <Scale
                      className={`size-3.5 ${
                        netBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    />
                    <span>
                      <T k="ovNetCashFlowBalance" />
                    </span>
                  </div>
                  <span
                    className={`text-base sm:text-lg font-black block truncate ${
                      netBalance >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatMoney(netBalance, currency)}
                  </span>
                  <span className="text-[10px] font-semibold text-muted">
                    {netBalance >= 0
                      ? `+${formatMoney(netBalance, currency)}`
                      : formatMoney(netBalance, currency)}
                  </span>
                </div>
                <span
                  className={`text-xs font-black px-2 py-1 rounded-lg ${
                    netBalance >= 0
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {netBalance >= 0 ? 'Surplus' : 'Deficit'}
                </span>
              </div>

              {/* Card 3: Payables */}
              <div className="p-3.5 rounded-xl bg-surface dark:bg-night-surface border border-rose-500/20 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-xs font-bold mb-0.5">
                    <ArrowUpFromLine className="size-3.5" />
                    <span>
                      <T k="ovPayablesCarrierDebt" />
                    </span>
                  </div>
                  <span className="text-base sm:text-lg font-black text-foreground dark:text-night-text block truncate">
                    {formatMoney(payable, currency)}
                  </span>
                  <span className="text-[10px] font-semibold text-muted">
                    {t('ovCarriersCount', {
                      count: debtSummary.creditorCarrierCount ?? creditors.length,
                    })}
                  </span>
                </div>
                <span className="text-xs font-black px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  {payPct}%
                </span>
              </div>
            </div>

            {/* Split Distribution Bar */}
            <div className="space-y-1.5">
              <div className="h-2.5 w-full rounded-full bg-border/30 dark:bg-night-border/40 overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-700"
                  style={{ width: `${recPct}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all duration-700"
                  style={{ width: `${payPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold text-muted">
                <span className="text-emerald-600 dark:text-emerald-400">
                  {t('ovReceivablesLabel')} {recPct}% ({formatMoney(receivable, currency)})
                </span>
                <span className="text-rose-600 dark:text-rose-400">
                  {t('ovPayablesLabel')} {payPct}% ({formatMoney(payable, currency)})
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION 1: COMMERCIAL PERFORMANCE LEADERS (2-COLUMN GRID) ─────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-500/15 text-amber-500">
                <Trophy className="size-3.5" />
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                <T k="ovTabLeaders" />
              </h4>
            </div>
            <span className="text-[11px] text-muted font-medium">
              <T k="ovLeaderboardManagerSubtitle" />
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Top Sales Managers */}
            <div className="p-4 sm:p-4.5 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 dark:border-night-border/40 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500">
                    <Trophy className="size-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground dark:text-night-text block">
                      <T k="ovLeaderboardTopManagers" />
                    </span>
                    <span className="text-[10px] text-muted">
                      {filteredManagers.length} {t('ovLeaderboardTopManagers').toLowerCase()}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-500 px-2 py-0.5 rounded-full bg-amber-500/10">
                  <T k="ovLeaderboardBadge" />
                </span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredManagers.length === 0 ? (
                  <p className="text-xs text-muted py-8 text-center">
                    <T k="ovNoManagerData" />
                  </p>
                ) : (
                  filteredManagers.map((mgr, idx) => {
                    const salesPct = Math.round((mgr.totalSales / maxManagerSales) * 100);
                    return (
                      <div
                        key={mgr.employeeId}
                        className="p-3 rounded-xl bg-surface dark:bg-night-surface border border-border/30 hover:border-brand-gold/40 transition-all min-w-0 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`size-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
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
                                {mgr.departmentName || t('ovSalesDept')}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-extrabold text-foreground dark:text-night-text block">
                              {formatMoney(mgr.totalSales, currency)}
                            </span>
                            <span className="text-[10px] text-emerald-500 font-bold">
                              {t('ovNetMarginAndOrders', {
                                amount: formatMoney(mgr.totalMargin, currency),
                                count: mgr.orderCount,
                              })}
                            </span>
                          </div>
                        </div>

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

            {/* 2. Top Corporate Clients */}
            <div className="p-4 sm:p-4.5 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 dark:border-night-border/40 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-500">
                    <Building2 className="size-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground dark:text-night-text block">
                      <T k="ovLeaderboardTopClients" />
                    </span>
                    <span className="text-[10px] text-muted">
                      {filteredClients.length} {t('ovLeaderboardTopClients').toLowerCase()}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-blue-500 px-2 py-0.5 rounded-full bg-blue-500/10">
                  <T k="ovLeaderboardBadge" />
                </span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredClients.length === 0 ? (
                  <p className="text-xs text-muted py-8 text-center">
                    <T k="ovNoClientData" />
                  </p>
                ) : (
                  filteredClients.map((cli, idx) => {
                    const salesPct = Math.round((cli.totalSales / maxClientSales) * 100);
                    return (
                      <div
                        key={cli.clientId}
                        className="p-3 rounded-xl bg-surface dark:bg-night-surface border border-border/30 hover:border-blue-500/40 transition-all min-w-0 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`size-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
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
                              {t('ovNetMarginAndOrders', {
                                amount: formatMoney(cli.totalMargin, currency),
                                count: cli.orderCount,
                              })}
                            </span>
                          </div>
                        </div>

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
        </div>

        {/* ── SECTION 2: CREDIT EXPOSURE & CARRIER OBLIGATIONS (DEBT LEDGER) ── */}
        <div className="space-y-3 pt-2 border-t border-border/30 dark:border-night-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-brand-gold/15 text-brand-gold">
                <Wallet className="size-3.5" />
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                <T k="ovTabDebt" />
              </h4>
            </div>
            <span className="text-[11px] text-muted font-medium">
              <T k="ovLargestUnpaidBalances" />
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Top Debtor Clients */}
            <div className="p-4 sm:p-4.5 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 dark:border-night-border/40 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-500">
                    <Users className="size-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground dark:text-night-text block">
                      <T k="ovTopDebtors" />
                    </span>
                    <span className="text-[10px] text-muted">
                      <T k="ovReceivablesClientsOwe" />
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-500 px-2 py-0.5 rounded-full bg-emerald-500/10">
                  {debtors.length}{' '}
                  {t('ovClientsCount', { count: debtors.length }).split(' ')[1] || 'clients'}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {debtors.length === 0 ? (
                  <p className="text-xs text-muted py-8 text-center">
                    <T k="ovNoDebtorClients" />
                  </p>
                ) : (
                  debtors.map((d, idx) => {
                    const debtPct = Math.round((d.amount / maxDebtorAmount) * 100);
                    return (
                      <div
                        key={d.clientId}
                        className="p-3 rounded-xl bg-surface dark:bg-night-surface border border-border/30 hover:border-emerald-500/40 transition-all min-w-0 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`size-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                idx === 0
                                  ? 'bg-emerald-500 text-white shadow-xs'
                                  : 'bg-border/40 text-muted'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-foreground dark:text-night-text truncate">
                                {d.companyName || d.clientName}
                              </span>
                              <span className="text-[10px] text-muted truncate">
                                {d.clientName}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 block">
                              {formatMoney(d.amount, currency)}
                            </span>
                            <span className="text-[10px] text-muted font-semibold">
                              {t('ovOpenOrdersCount', { count: d.orderCount })}
                            </span>
                          </div>
                        </div>

                        <div className="w-full bg-border/20 dark:bg-night-border/40 h-1.5 rounded-full mt-2.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${debtPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 2. Top Creditor Carriers */}
            <div className="p-4 sm:p-4.5 rounded-xl bg-background/50 dark:bg-night-bg/50 border border-border/40 dark:border-night-border/40 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-500">
                    <Truck className="size-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground dark:text-night-text block">
                      <T k="ovTopCreditors" />
                    </span>
                    <span className="text-[10px] text-muted">
                      <T k="ovPayablesCarrierDebt" />
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-rose-500 px-2 py-0.5 rounded-full bg-rose-500/10">
                  {creditors.length}{' '}
                  {t('ovCarriersCount', { count: creditors.length }).split(' ')[1] || 'carriers'}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {creditors.length === 0 ? (
                  <p className="text-xs text-muted py-8 text-center">
                    <T k="ovNoCreditorCarriers" />
                  </p>
                ) : (
                  creditors.map((c, idx) => {
                    const credPct = Math.round((c.amount / maxCreditorAmount) * 100);
                    return (
                      <div
                        key={c.agentName}
                        className="p-3 rounded-xl bg-surface dark:bg-night-surface border border-border/30 hover:border-rose-500/40 transition-all min-w-0 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`size-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                idx === 0
                                  ? 'bg-rose-500 text-white shadow-xs'
                                  : 'bg-border/40 text-muted'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-foreground dark:text-night-text truncate">
                                {c.agentName}
                              </span>
                              <span className="text-[10px] text-muted truncate">
                                <T k="ovOwedToCarriers" />
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 block">
                              {formatMoney(c.amount, currency)}
                            </span>
                            <span className="text-[10px] text-muted font-semibold">
                              {t('ovOpenOrdersCount', { count: c.orderCount })}
                            </span>
                          </div>
                        </div>

                        <div className="w-full bg-border/20 dark:bg-night-border/40 h-1.5 rounded-full mt-2.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-rose-500 to-orange-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${credPct}%` }}
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
      </div>
    );
  }
);
