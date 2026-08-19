import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Receipt,
  Sparkles,
  Calculator,
  ArrowUpRight,
  Smile,
  AlertCircle,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { T } from '../T';
import { CATEGORY_CONFIG } from './ExpenseModal';
import type {
  FinanceSummaryResponse,
  ExpenseCategory,
  SupportedCurrency,
} from '../../services/api';
import { formatMoney } from '../../services/api';

interface FinanceSummaryTabProps {
  summaryData: FinanceSummaryResponse | null;
  loading: boolean;
  onSelectCategoryFilter?: (category: ExpenseCategory) => void;
}

export function FinanceSummaryTab({
  summaryData,
  loading,
  onSelectCategoryFilter,
}: FinanceSummaryTabProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-40 rounded-3xl bg-border/20 dark:bg-night-surface border border-border/40 dark:border-night-border"
          />
        ))}
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="p-16 text-center bg-surface dark:bg-night-surface rounded-3xl border border-border dark:border-night-border">
        <p className="text-sm font-semibold text-muted dark:text-night-muted">
          <T k="finNoSummaryData" />
        </p>
      </div>
    );
  }

  const { summary, comparison, expense_breakdown, flow_diagram, expense_distribution } =
    summaryData;
  const activeCurrency: SupportedCurrency = summaryData.currency || 'USD';

  const netProfit = summary.net_profit || 0;
  const isProfitable = netProfit > 0;
  const isBreakeven = netProfit === 0;

  const netProfitGrowth = comparison?.net_profit_growth_percentage ?? 0;
  const isGrowthPositive = netProfitGrowth >= 0;

  const totalAllInExpenses = summary.total_all_in_expenses || summary.total_expenses || 1;
  const opPercent =
    flow_diagram?.all_in_expense_breakdown?.operational_expenses?.percentage ??
    Math.round(((summary.operational_expenses || 0) / totalAllInExpenses) * 100);
  const salPercent =
    flow_diagram?.all_in_expense_breakdown?.salaries?.percentage ??
    Math.round(((summary.fixed_salaries_expense || 0) / totalAllInExpenses) * 100);
  const kpiPercent =
    flow_diagram?.all_in_expense_breakdown?.kpi_bonuses?.percentage ??
    Math.round(((summary.kpi_bonuses_expense || 0) / totalAllInExpenses) * 100);

  const profitMarginRatio =
    summary.gross_revenue > 0 ? (netProfit / summary.gross_revenue) * 100 : 0;

  // Time of day greeting
  const currentHour = new Date().getHours();
  const greetingKey =
    currentHour < 12
      ? 'finGreetingMorning'
      : currentHour < 18
        ? 'finGreetingAfternoon'
        : 'finGreetingEvening';

  return (
    <div className="flex flex-col gap-8">
      {/* Emotional Hero Financial Health Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`relative overflow-hidden p-6 sm:p-8 rounded-3xl border shadow-lg ${
          isProfitable
            ? 'bg-gradient-to-br from-emerald-500/15 via-brand-gold/10 to-surface dark:from-emerald-950/40 dark:via-night-surface dark:to-night-surface border-emerald-500/30'
            : isBreakeven
              ? 'bg-gradient-to-br from-blue-500/10 via-surface to-surface dark:from-blue-950/30 dark:via-night-surface dark:to-night-surface border-blue-500/30'
              : 'bg-gradient-to-br from-rose-500/10 via-surface to-surface dark:from-rose-950/30 dark:via-night-surface dark:to-night-surface border-rose-500/30'
        }`}
      >
        {/* Glow overlay */}
        <div
          className={`absolute -right-16 -top-16 size-64 rounded-full blur-3xl pointer-events-none ${
            isProfitable
              ? 'bg-emerald-500/20 dark:bg-emerald-500/10'
              : 'bg-rose-500/20 dark:bg-rose-500/10'
          }`}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-muted dark:text-night-muted">
                <T k={greetingKey} />
              </span>
              <span className="text-muted">•</span>
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold shadow-2xs ${
                  isProfitable
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : isBreakeven
                      ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                      : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                }`}
              >
                {isProfitable ? (
                  <Sparkles className="size-3.5" />
                ) : isBreakeven ? (
                  <Smile className="size-3.5" />
                ) : (
                  <AlertCircle className="size-3.5" />
                )}
                <span>
                  {isProfitable
                    ? t('finStatusProfitable')
                    : isBreakeven
                      ? t('finStatusBreakeven')
                      : t('finStatusDeficit')}
                </span>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-foreground dark:text-night-text">
              {isProfitable ? (
                <span>
                  {t('finProfitSurplusBadge')}:{' '}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    +{formatMoney(netProfit, activeCurrency)}
                  </span>
                </span>
              ) : (
                <span>
                  {t('finProfitDeficitBadge')}:{' '}
                  <span className="text-rose-600 dark:text-rose-400">
                    {formatMoney(netProfit, activeCurrency)}
                  </span>
                </span>
              )}
            </h2>

            <p className="text-xs sm:text-sm text-muted dark:text-night-muted leading-relaxed">
              {isProfitable
                ? t('finStatusProfitableDesc')
                : isBreakeven
                  ? t('finStatusBreakevenDesc')
                  : t('finStatusDeficitDesc')}
            </p>
          </div>

          {/* Right Highlights & Margin indicator */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0 flex-wrap">
            <div className="p-4 rounded-2xl bg-surface/80 dark:bg-night-field/80 border border-border/80 dark:border-night-border shadow-2xs backdrop-blur-md">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted dark:text-night-muted block">
                <T k="finProfitMarginRatio" />
              </span>
              <span
                className={`text-xl font-extrabold ${
                  profitMarginRatio >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {profitMarginRatio >= 0 ? '+' : ''}
                {profitMarginRatio.toFixed(1)}%
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-surface/80 dark:bg-night-field/80 border border-border/80 dark:border-night-border shadow-2xs backdrop-blur-md">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted dark:text-night-muted block">
                <T k="finSeoCut" />
              </span>
              <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400">
                {formatMoney(summary.seo_cut_10pc || 0, activeCurrency)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Top 6 Financial Metric KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Gross Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="p-6 rounded-3xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border shadow-sm flex flex-col justify-between hover:border-blue-500/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted dark:text-night-muted">
              <T k="finGrossRevenue" />
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-2xs">
              <DollarSign className="size-4.5" />
            </div>
          </div>
          <div className="mt-5">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground dark:text-night-text">
              {formatMoney(summary.gross_revenue || 0, activeCurrency)}
            </h3>
            <p className="text-[11px] text-muted dark:text-night-muted mt-1.5 font-medium">
              <T k="finGrossRevenueDesc" />
            </p>
          </div>
        </motion.div>

        {/* 2. COGS */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="p-6 rounded-3xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border shadow-sm flex flex-col justify-between hover:border-slate-500/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted dark:text-night-muted">
              <T k="finCogs" />
            </span>
            <div className="p-2.5 rounded-2xl bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 shadow-2xs">
              <Receipt className="size-4.5" />
            </div>
          </div>
          <div className="mt-5">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground dark:text-night-text">
              {formatMoney(summary.cost_of_goods_sold || 0, activeCurrency)}
            </h3>
            <p className="text-[11px] text-muted dark:text-night-muted mt-1.5 font-medium">
              <T k="finCogsDesc" />
            </p>
          </div>
        </motion.div>

        {/* 3. Gross Margin */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="p-6 rounded-3xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border shadow-sm flex flex-col justify-between hover:border-emerald-500/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted dark:text-night-muted">
              <T k="finGrossProfit" />
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
              <TrendingUp className="size-4.5" />
            </div>
          </div>
          <div className="mt-5">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatMoney(summary.gross_profit || 0, activeCurrency)}
            </h3>
            <p className="text-[11px] text-muted dark:text-night-muted mt-1.5 font-medium">
              <T k="finGrossProfitDesc" />
            </p>
          </div>
        </motion.div>

        {/* 4. Total All-In Expenses */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="p-6 rounded-3xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border shadow-sm flex flex-col justify-between hover:border-rose-500/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted dark:text-night-muted">
              <T k="finTotalExpenses" />
            </span>
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-2xs">
              <PieChart className="size-4.5" />
            </div>
          </div>
          <div className="mt-5">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {formatMoney(summary.total_expenses || 0, activeCurrency)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-muted dark:text-night-muted flex-wrap font-bold">
              <span className="bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                <T k="finOpPrefix" />:{' '}
                {formatMoney(summary.operational_expenses || 0, activeCurrency)}
              </span>
              <span className="bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                <T k="finSalPrefix" />:{' '}
                {formatMoney(summary.fixed_salaries_expense || 0, activeCurrency)}
              </span>
              <span className="bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                <T k="finKpiPrefix" />:{' '}
                {formatMoney(summary.kpi_bonuses_expense || 0, activeCurrency)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* 5. Net Profit (Hero Radiant Card) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="p-6 rounded-3xl bg-gradient-to-br from-brand-gold/15 via-surface to-surface dark:from-brand-gold/10 dark:via-night-surface dark:to-night-surface border border-brand-gold/50 shadow-md flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-gold">
              <T k="finNetProfit" />
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-brand-gold/15 text-brand-gold border border-brand-gold/30 shadow-2xs">
              {isGrowthPositive ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <TrendingDown className="size-3.5" />
              )}
              <span>
                {isGrowthPositive
                  ? `+${netProfitGrowth.toFixed(1)}%`
                  : `${netProfitGrowth.toFixed(1)}%`}
              </span>
            </div>
          </div>
          <div className="mt-5">
            <h3 className="text-3xl sm:text-4xl font-serif font-extrabold text-foreground dark:text-night-text">
              {formatMoney(summary.net_profit || 0, activeCurrency)}
            </h3>
            <p className="text-[11px] text-muted dark:text-night-muted mt-1.5 font-medium">
              <T k="finNetProfitDesc" />
            </p>
          </div>
        </motion.div>

        {/* 6. SEO 10% Cut */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="p-6 rounded-3xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border shadow-sm flex flex-col justify-between hover:border-purple-500/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted dark:text-night-muted">
              <T k="finSeoCut" />
            </span>
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-2xs">
              <Sparkles className="size-4.5" />
            </div>
          </div>
          <div className="mt-5">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400">
              {formatMoney(summary.seo_cut_10pc || 0, activeCurrency)}
            </h3>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[11px] text-muted dark:text-night-muted font-medium">
                <T k="finSeoCutDesc" />
              </p>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  isProfitable
                    ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30'
                    : 'bg-muted/15 text-muted'
                }`}
              >
                {isProfitable ? t('finSeoShareActive') : t('finSeoShareZero')}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Financial Equation Flow & MoM Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Financial Engine Flow Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="lg:col-span-2 p-6 sm:p-7 rounded-3xl bg-surface dark:bg-night-surface border border-border dark:border-night-border shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-gold/15 text-brand-gold">
                <Calculator className="size-5" />
              </div>
              <h3 className="text-base font-bold text-foreground dark:text-night-text">
                <T k="finFlowDiagramTitle" />
              </h3>
            </div>
            <span className="text-xs text-muted dark:text-night-muted font-mono font-bold bg-background/50 dark:bg-night-field px-3 py-1 rounded-xl border border-border/50">
              {flow_diagram?.formula || `P_net = G - E_total (${activeCurrency})`}
            </span>
          </div>

          {/* Visual Equation Pipeline */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 my-4 items-center">
            {/* Step 1: Gross Margin */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                <T k="finGrossMarginNode" />
              </span>
              <p className="text-base font-extrabold text-foreground dark:text-night-text mt-1">
                {formatMoney(summary.gross_profit || 0, activeCurrency)}
              </p>
            </div>

            {/* Minus Sign */}
            <div className="hidden sm:flex justify-center text-muted font-extrabold text-2xl">
              -
            </div>

            {/* Step 2: All Expenses */}
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                <T k="finTotalExpensesNode" />
              </span>
              <p className="text-base font-extrabold text-foreground dark:text-night-text mt-1">
                {formatMoney(summary.total_expenses || 0, activeCurrency)}
              </p>
            </div>

            {/* Equals Sign */}
            <div className="hidden sm:flex justify-center text-muted font-extrabold text-2xl">
              =
            </div>

            {/* Step 3: Net Profit */}
            <div className="p-4 rounded-2xl bg-brand-gold/15 border border-brand-gold/30 text-center shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-gold block">
                <T k="finNetProfitNode" />
              </span>
              <p className="text-base font-extrabold text-foreground dark:text-night-text mt-1">
                {formatMoney(summary.net_profit || 0, activeCurrency)}
              </p>
            </div>
          </div>

          {/* Payroll & Operational Expense Breakdown Bar */}
          <div className="mt-4 pt-4 border-t border-border/50 dark:border-night-border">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-foreground dark:text-night-text">
                <T k="finAllInExpenseBreakdown" />
              </span>
              <span className="text-muted dark:text-night-muted font-semibold">
                {formatMoney(summary.total_expenses || 0, activeCurrency)} <T k="finTotalSuffix" />
              </span>
            </div>

            {/* Multi-segmented Progress Bar */}
            <div className="h-3.5 w-full rounded-full bg-border/30 dark:bg-night-field overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${opPercent}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={t('finOpExpensePct', { pct: opPercent })}
              />
              <div
                style={{ width: `${salPercent}%` }}
                className="bg-blue-500 transition-all duration-500"
                title={t('finSalExpensePct', { pct: salPercent })}
              />
              <div
                style={{ width: `${kpiPercent}%` }}
                className="bg-purple-500 transition-all duration-500"
                title={t('finKpiExpensePct', { pct: kpiPercent })}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted dark:text-night-muted mt-3 flex-wrap gap-2 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-amber-500 inline-block shadow-2xs" />
                <span>
                  {t('finOpExpensesLegend', {
                    amount: formatMoney(summary.operational_expenses || 0, activeCurrency),
                  })}{' '}
                  ({opPercent}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-blue-500 inline-block shadow-2xs" />
                <span>
                  {t('finSalariesLegend', {
                    amount: formatMoney(summary.fixed_salaries_expense || 0, activeCurrency),
                  })}{' '}
                  ({salPercent}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-purple-500 inline-block shadow-2xs" />
                <span>
                  {t('finKpiBonusesLegend', {
                    amount: formatMoney(summary.kpi_bonuses_expense || 0, activeCurrency),
                  })}{' '}
                  ({kpiPercent}%)
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Col: MoM Growth Comparison Engine */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="p-6 sm:p-7 rounded-3xl bg-surface dark:bg-night-surface border border-border dark:border-night-border shadow-sm flex flex-col justify-between"
        >
          <div>
            <h3 className="text-base font-bold text-foreground dark:text-night-text mb-1">
              <T k="finMomComparisonTitle" />
            </h3>
            <p className="text-xs text-muted dark:text-night-muted mb-4">
              {t('finComparingAgainstPrev', {
                period: comparison?.previous_period?.start_date || 'N/A',
              })}
            </p>

            <div className="flex flex-col gap-3.5">
              {/* Net Profit Change */}
              <div className="p-3.5 rounded-2xl bg-background/50 dark:bg-night-field border border-border/50 dark:border-night-border flex items-center justify-between shadow-2xs">
                <span className="text-xs font-semibold text-muted dark:text-night-muted">
                  <T k="finNetProfitChange" />
                </span>
                <span
                  className={`text-sm font-extrabold ${
                    comparison?.net_profit_change_amount >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {comparison?.net_profit_change_amount >= 0 ? '+' : ''}
                  {formatMoney(comparison?.net_profit_change_amount || 0, activeCurrency)}
                </span>
              </div>

              {/* Net Profit Growth % */}
              <div className="p-3.5 rounded-2xl bg-background/50 dark:bg-night-field border border-border/50 dark:border-night-border flex items-center justify-between shadow-2xs">
                <span className="text-xs font-semibold text-muted dark:text-night-muted">
                  <T k="finNetProfitGrowthPct" />
                </span>
                <span
                  className={`text-sm font-extrabold ${
                    netProfitGrowth >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {netProfitGrowth >= 0 ? '+' : ''}
                  {netProfitGrowth.toFixed(2)}%
                </span>
              </div>

              {/* Expenses Change */}
              <div className="p-3.5 rounded-2xl bg-background/50 dark:bg-night-field border border-border/50 dark:border-night-border flex items-center justify-between shadow-2xs">
                <span className="text-xs font-semibold text-muted dark:text-night-muted">
                  <T k="finExpensesChange" />
                </span>
                <span className="text-sm font-extrabold text-foreground dark:text-night-text">
                  {comparison?.expenses_change_amount >= 0 ? '+' : ''}
                  {formatMoney(comparison?.expenses_change_amount || 0, activeCurrency)} (
                  {comparison?.expenses_change_percentage?.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Expense Category Distribution Cards (with deep-link explore) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-foreground dark:text-night-text">
            <T k="finDistributionByCategory" />
          </h3>
          <span className="text-xs text-muted dark:text-night-muted font-medium">
            6 Operational Cost Categories
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {(Object.keys(CATEGORY_CONFIG) as ExpenseCategory[]).map((catKey) => {
            const cfg = CATEGORY_CONFIG[catKey];
            const Icon = cfg.icon;

            // Find data in expense_distribution if available, fallback to breakdown
            const distItem = expense_distribution?.find((d) => d.category === catKey);
            const catAmount = distItem?.amount ?? expense_breakdown[catKey] ?? 0;
            const catCount = distItem?.count ?? 0;
            const totalOps = summary.operational_expenses || 1;
            const sharePercent =
              distItem?.percentage ?? (totalOps > 0 ? Math.round((catAmount / totalOps) * 100) : 0);

            return (
              <motion.div
                key={catKey}
                whileHover={{ y: -3 }}
                className="p-4 rounded-3xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border flex flex-col justify-between gap-3 shadow-sm hover:border-brand-gold/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-2xl ${cfg.bgClass} ${cfg.colorClass} shadow-2xs`}>
                    <Icon className="size-4" />
                  </div>
                  <span className="text-xs font-extrabold text-muted dark:text-night-muted bg-border/20 px-2 py-0.5 rounded-lg">
                    {sharePercent}%
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold text-foreground dark:text-night-text block truncate">
                    <T k={cfg.labelKey} />
                  </span>
                  <p className="text-sm font-extrabold text-foreground dark:text-night-text mt-0.5">
                    {formatMoney(catAmount, activeCurrency)}
                  </p>
                  <span className="text-[10px] text-muted dark:text-night-muted block mt-0.5">
                    {t('finEntriesCount', { count: catCount })}
                  </span>
                </div>

                {onSelectCategoryFilter && (
                  <button
                    onClick={() => onSelectCategoryFilter(catKey)}
                    className="flex items-center justify-between text-[11px] font-bold text-brand-gold group-hover:underline pt-2 border-t border-border/40 dark:border-night-border cursor-pointer"
                  >
                    <span>
                      <T k="finExploreInLedger" />
                    </span>
                    <ArrowUpRight className="size-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
