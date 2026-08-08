import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Receipt,
  Sparkles,
  Calculator,
  Coins,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { T } from '../T';
import { CATEGORY_CONFIG } from './ExpenseModal';
import type { FinanceSummaryResponse, ExpenseCategory, SupportedCurrency } from '../../services/api';
import { formatMoney } from '../../services/api';

interface FinanceSummaryTabProps {
  summaryData: FinanceSummaryResponse | null;
  loading: boolean;
}

export function FinanceSummaryTab({ summaryData, loading }: FinanceSummaryTabProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-36 rounded-2xl bg-border/20 dark:bg-night-surface border border-border/40 dark:border-night-border" />
        ))}
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="p-12 text-center bg-surface dark:bg-night-surface rounded-2xl border border-border dark:border-night-border">
        <p className="text-sm text-muted dark:text-night-muted">No summary data available for this period.</p>
      </div>
    );
  }

  const { summary, comparison, expense_breakdown } = summaryData;
  const activeCurrency: SupportedCurrency = summaryData.currency || 'UZS';

  const netProfitGrowth = comparison?.net_profit_growth_percentage ?? 0;
  const isGrowthPositive = netProfitGrowth >= 0;

  const totalExpenses = summary.total_expenses || 1;
  const opPercent = Math.round(((summary.operational_expenses || 0) / totalExpenses) * 100);
  const salPercent = Math.round(((summary.fixed_salaries_expense || 0) / totalExpenses) * 100);
  const kpiPercent = Math.round(((summary.kpi_bonuses_expense || 0) / totalExpenses) * 100);

  return (
    <div className="flex flex-col gap-8">
      {/* Active Currency Badge Banner */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface/80 dark:bg-night-surface/80 border border-border/60 dark:border-night-border backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-gold/15 text-brand-gold">
            <Coins className="size-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground dark:text-night-text">
              Financial Summary Normalized Currency:
            </span>
            <span className="ml-2 text-xs font-extrabold text-brand-gold uppercase">
              {activeCurrency} ({activeCurrency === 'UZS' ? "O'zbek so'mi" : activeCurrency === 'USD' ? 'US Dollar' : 'Russian Ruble'})
            </span>
          </div>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-brand-gold/10 text-brand-gold font-bold border border-brand-gold/20">
          CBU Live Converted
        </span>
      </div>

      {/* Top Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Gross Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="p-5 rounded-2xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted dark:text-night-muted">
              <T k="finGrossRevenue" />
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <DollarSign className="size-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-foreground dark:text-night-text">
              {formatMoney(summary.gross_revenue || 0, activeCurrency)}
            </h3>
            <p className="text-[11px] text-muted dark:text-night-muted mt-1">
              Total sales revenue from cargo operations
            </p>
          </div>
        </motion.div>

        {/* 2. COGS */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="p-5 rounded-2xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted dark:text-night-muted">
              <T k="finCogs" />
            </span>
            <div className="p-2 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400">
              <Receipt className="size-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-foreground dark:text-night-text">
              {formatMoney(summary.cost_of_goods_sold || 0, activeCurrency)}
            </h3>
            <p className="text-[11px] text-muted dark:text-night-muted mt-1">
              Direct shipping cost & cargo purchase price
            </p>
          </div>
        </motion.div>

        {/* 3. Gross Margin */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="p-5 rounded-2xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted dark:text-night-muted">
              <T k="finGrossProfit" />
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="size-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatMoney(summary.gross_profit || 0, activeCurrency)}
            </h3>
            <p className="text-[11px] text-muted dark:text-night-muted mt-1">
              Revenue minus shipping cost (Gross Margin)
            </p>
          </div>
        </motion.div>

        {/* 4. Total All-In Expenses */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="p-5 rounded-2xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted dark:text-night-muted">
              <T k="finTotalExpenses" />
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <PieChart className="size-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatMoney(summary.total_expenses || 0, activeCurrency)}
            </h3>
            <div className="flex items-center gap-2 mt-2 text-[10px] text-muted dark:text-night-muted flex-wrap">
              <span className="bg-rose-500/10 px-1.5 py-0.5 rounded">Op: {formatMoney(summary.operational_expenses || 0, activeCurrency)}</span>
              <span className="bg-rose-500/10 px-1.5 py-0.5 rounded">Sal: {formatMoney(summary.fixed_salaries_expense || 0, activeCurrency)}</span>
              <span className="bg-rose-500/10 px-1.5 py-0.5 rounded">KPI: {formatMoney(summary.kpi_bonuses_expense || 0, activeCurrency)}</span>
            </div>
          </div>
        </motion.div>

        {/* 5. Net Profit (Featured Highlight Card) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-brand-gold/15 via-surface to-surface dark:from-brand-gold/10 dark:via-night-surface dark:to-night-surface border border-brand-gold/40 shadow-md flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
              <T k="finNetProfit" />
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
              {isGrowthPositive ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
              <span>{isGrowthPositive ? `+${netProfitGrowth.toFixed(1)}%` : `${netProfitGrowth.toFixed(1)}%`}</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-serif font-bold text-foreground dark:text-night-text">
              {formatMoney(summary.net_profit || 0, activeCurrency)}
            </h3>
            <p className="text-[11px] text-muted dark:text-night-muted mt-1">
              Final profit after all operational, salary & KPI costs
            </p>
          </div>
        </motion.div>

        {/* 6. SEO 10% Cut */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="p-5 rounded-2xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted dark:text-night-muted">
              <T k="finSeoCut" />
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Sparkles className="size-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatMoney(summary.seo_cut_10pc || 0, activeCurrency)}
            </h3>
            <p className="text-[11px] text-muted dark:text-night-muted mt-1">
              Automated 10% cut on positive Net Profit
            </p>
          </div>
        </motion.div>
      </div>

      {/* Financial Equation Flow & Expense Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Financial Equation Flow */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="lg:col-span-2 p-6 rounded-2xl bg-surface dark:bg-night-surface border border-border dark:border-night-border shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calculator className="size-5 text-brand-gold" />
              <h3 className="text-base font-semibold text-foreground dark:text-night-text">
                Financial Engine Flow Diagram
              </h3>
            </div>
            <span className="text-xs text-muted dark:text-night-muted font-mono">
              P_net = G - E_total ({activeCurrency})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 my-4 items-center">
            {/* Step 1: Gross Margin */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Gross Margin
              </span>
              <p className="text-sm font-bold text-foreground dark:text-night-text mt-1">
                {formatMoney(summary.gross_profit || 0, activeCurrency)}
              </p>
            </div>

            {/* Minus Sign */}
            <div className="hidden sm:flex justify-center text-muted font-bold text-xl">-</div>

            {/* Step 2: All Expenses */}
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Total Expenses
              </span>
              <p className="text-sm font-bold text-foreground dark:text-night-text mt-1">
                {formatMoney(summary.total_expenses || 0, activeCurrency)}
              </p>
            </div>

            {/* Equals Sign */}
            <div className="hidden sm:flex justify-center text-muted font-bold text-xl">=</div>

            {/* Step 3: Net Profit */}
            <div className="p-4 rounded-xl bg-brand-gold/15 border border-brand-gold/30 text-center sm:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                Net Profit
              </span>
              <p className="text-sm font-bold text-foreground dark:text-night-text mt-1">
                {formatMoney(summary.net_profit || 0, activeCurrency)}
              </p>
            </div>
          </div>

          {/* Payroll & Operational Expense Breakdown Bar */}
          <div className="mt-4 pt-4 border-t border-border/40 dark:border-night-border">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-foreground dark:text-night-text">All-In Expense Breakdown</span>
              <span className="text-muted dark:text-night-muted">{formatMoney(summary.total_expenses || 0, activeCurrency)} Total</span>
            </div>

            {/* Multi-segmented Progress Bar */}
            <div className="h-3 w-full rounded-full bg-border/30 dark:bg-night-field overflow-hidden flex">
              <div
                style={{ width: `${opPercent}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`Operational: ${opPercent}%`}
              />
              <div
                style={{ width: `${salPercent}%` }}
                className="bg-blue-500 transition-all duration-500"
                title={`Fixed Salaries: ${salPercent}%`}
              />
              <div
                style={{ width: `${kpiPercent}%` }}
                className="bg-purple-500 transition-all duration-500"
                title={`KPI Bonuses: ${kpiPercent}%`}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted dark:text-night-muted mt-2">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-amber-500 inline-block" />
                <span>Op Expenses ({formatMoney(summary.operational_expenses || 0, activeCurrency)})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-blue-500 inline-block" />
                <span>Salaries ({formatMoney(summary.fixed_salaries_expense || 0, activeCurrency)})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-purple-500 inline-block" />
                <span>KPI Bonuses ({formatMoney(summary.kpi_bonuses_expense || 0, activeCurrency)})</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Col: MoM Growth Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="p-6 rounded-2xl bg-surface dark:bg-night-surface border border-border dark:border-night-border shadow-sm flex flex-col justify-between"
        >
          <div>
            <h3 className="text-base font-semibold text-foreground dark:text-night-text mb-1">
              MoM Growth Comparison
            </h3>
            <p className="text-xs text-muted dark:text-night-muted mb-4">
              Comparing against previous period ({comparison?.previous_period?.start_date || 'N/A'})
            </p>

            <div className="flex flex-col gap-4">
              <div className="p-3 rounded-xl bg-background/50 dark:bg-night-field border border-border/50 dark:border-night-border flex items-center justify-between">
                <span className="text-xs text-muted dark:text-night-muted">Net Profit Change:</span>
                <span className={`text-sm font-bold ${comparison?.net_profit_change_amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {comparison?.net_profit_change_amount >= 0 ? '+' : ''}
                  {formatMoney(comparison?.net_profit_change_amount || 0, activeCurrency)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-background/50 dark:bg-night-field border border-border/50 dark:border-night-border flex items-center justify-between">
                <span className="text-xs text-muted dark:text-night-muted">Net Profit Growth %:</span>
                <span className={`text-sm font-bold ${netProfitGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {netProfitGrowth >= 0 ? '+' : ''}{netProfitGrowth.toFixed(2)}%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-background/50 dark:bg-night-field border border-border/50 dark:border-night-border flex items-center justify-between">
                <span className="text-xs text-muted dark:text-night-muted">Expenses Change:</span>
                <span className="text-sm font-bold text-foreground dark:text-night-text">
                  {comparison?.expenses_change_amount >= 0 ? '+' : ''}
                  {formatMoney(comparison?.expenses_change_amount || 0, activeCurrency)} ({comparison?.expenses_change_percentage?.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Expense Category Distribution Cards */}
      <div>
        <h3 className="text-base font-semibold text-foreground dark:text-night-text mb-4">
          Expense Distribution by Category
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {(Object.keys(CATEGORY_CONFIG) as ExpenseCategory[]).map((catKey) => {
            const cfg = CATEGORY_CONFIG[catKey];
            const Icon = cfg.icon;
            const catAmount = expense_breakdown[catKey] || 0;
            const sharePercent = totalExpenses > 0 ? Math.round((catAmount / totalExpenses) * 100) : 0;

            return (
              <div
                key={catKey}
                className="p-4 rounded-xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border flex flex-col justify-between gap-3 shadow-sm hover:border-brand-gold/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${cfg.bgClass} ${cfg.colorClass}`}>
                    <Icon className="size-4" />
                  </div>
                  <span className="text-[10px] font-bold text-muted dark:text-night-muted">
                    {sharePercent}%
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-foreground dark:text-night-text block truncate">
                    {t(cfg.labelKey) || cfg.defaultLabel}
                  </span>
                  <p className="text-sm font-bold text-foreground dark:text-night-text mt-0.5">
                    {formatMoney(catAmount, activeCurrency)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
