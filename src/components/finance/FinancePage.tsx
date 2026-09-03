import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, RefreshCw, Plus, Coins, Truck, Warehouse, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { usePermissions } from '../../context/PermissionsContext';
import { FinanceSummaryTab } from './FinanceSummaryTab';
import { ExpenseLedgerTab } from './ExpenseLedgerTab';
import { ExpenseModal } from './ExpenseModal';
import { CbuRatesWidget } from '../currency/CbuRatesWidget';
import { DateRangePicker, getCurrentMonthRange } from '../DateRangePicker';
import { T } from '../T';
import { api } from '../../services/api';
import type {
  FinanceSummaryResponse,
  Expense,
  SupportedCurrency,
  ExpenseCategory,
  ExpenseSection,
} from '../../services/api';

/** "overview" = Summary & Analytics dashboard, "ledger" = Expense Ledger drill-down */
type FinanceView = 'overview' | 'ledger';

export function FinancePage() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canCreate } = usePermissions();

  const [activeView, setActiveView] = useState<FinanceView>('overview');
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [activeSection, setActiveSection] = useState<ExpenseSection>('ftl');

  // Period / Date Range state
  const [startDate, setStartDate] = useState<string>(() => getCurrentMonthRange().startDate);
  const [endDate, setEndDate] = useState<string>(() => getCurrentMonthRange().endDate);

  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>('USD');

  // Deep-linking from Summary to Expense Ledger category
  const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState<string>('');

  // API State
  const [summaryData, setSummaryData] = useState<FinanceSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [defaultModalSection, setDefaultModalSection] = useState<ExpenseSection>('ftl');

  // Reset to default month range
  const handleResetToCurrentMonth = () => {
    const { startDate: s, endDate: e } = getCurrentMonthRange();
    setStartDate(s);
    setEndDate(e);
  };

  // Compute active query parameters for summary API
  const summaryQueryParams = useMemo(() => {
    return {
      currency: selectedCurrency,
      section: activeSection,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    };
  }, [selectedCurrency, activeSection, startDate, endDate]);

  // Fetch Summary
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await api.finance.getSummary(summaryQueryParams);
      setSummaryData(res);
    } catch (err: any) {
      showNotification(err?.message || t('finErrSummary'), 'error');
    } finally {
      setSummaryLoading(false);
    }
  }, [summaryQueryParams, showNotification, t]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleRefreshAll = () => {
    fetchSummary();
  };

  const handleOpenAddExpense = (section?: ExpenseSection) => {
    setExpenseToEdit(null);
    setDefaultModalSection(section || activeSection);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setDefaultModalSection(expense.section || activeSection);
    setIsExpenseModalOpen(true);
  };

  // ── Drill-down Navigation ──────────────────────────────────────

  /** Navigate from a summary category card → Expense Ledger filtered by category */
  const handleDrillDownToCategory = (category: ExpenseCategory, section?: ExpenseSection) => {
    setLedgerCategoryFilter(category);
    if (section) setActiveSection(section);
    setSlideDirection(1); // slide right (drill-in)
    setActiveView('ledger');
  };

  /** Navigate to the full Expense Ledger (no category pre-filter) */
  const handleViewAllExpenses = () => {
    setLedgerCategoryFilter('');
    setSlideDirection(1);
    setActiveView('ledger');
  };

  /** Navigate back from Expense Ledger → Summary Overview */
  const handleBackToOverview = () => {
    setSlideDirection(-1); // slide left (back)
    setActiveView('overview');
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Row 1 — Title on the left, Currency Carousel Indicator on the right */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30 shadow-2xs">
            <DollarSign className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-extrabold text-foreground dark:text-night-text">
              <T k="finTitle" />
            </h1>
            <p className="text-xs text-muted dark:text-night-muted mt-0.5">
              <T k="finSubtitle" />
            </p>
          </div>
        </div>

        {/* Currency Exchange Rate Carousel Indicator (click opens converter modal) */}
        <CbuRatesWidget />
      </div>

      {/* Row 2 — FTL/LTL switcher + Action Controls in one line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Section Switcher Toggle (FTL vs LTL) */}
        <div className="flex items-center p-1 rounded-2xl bg-surface dark:bg-night-surface border border-border/80 dark:border-night-border shadow-2xs shrink-0">
          <button
            onClick={() => setActiveSection('ftl')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeSection === 'ftl'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-muted hover:text-foreground dark:hover:text-night-text'
            }`}
          >
            <Truck className="size-4" />
            <span>FTL</span>
          </button>
          <button
            onClick={() => setActiveSection('ltl')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeSection === 'ltl'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-muted hover:text-foreground dark:hover:text-night-text'
            }`}
          >
            <Warehouse className="size-4" />
            <span>LTL</span>
          </button>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          {/* Currency Selector */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-surface dark:bg-night-surface border border-border/80 dark:border-night-border text-xs shadow-2xs shrink-0">
            <Coins className="size-4 text-brand-gold shrink-0" />
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value as SupportedCurrency)}
              className="bg-transparent font-extrabold text-foreground dark:text-night-text focus:outline-none cursor-pointer"
            >
              <option value="USD">USD ($)</option>
              <option value="UZS">UZS (so'm)</option>
              <option value="RUB">RUB (₽)</option>
              <option value="CNY">CNY / RMB (¥)</option>
            </select>
          </div>

          {/* Unified General Date Range Picker */}
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
            onClear={handleResetToCurrentMonth}
            variant="button"
            align="right"
            className="shrink-0"
          />

          {/* Refresh Button */}
          <button
            onClick={handleRefreshAll}
            className="p-2.5 rounded-2xl bg-surface dark:bg-night-surface border border-border/80 dark:border-night-border text-muted hover:text-foreground dark:hover:text-night-text transition-colors cursor-pointer shadow-2xs shrink-0"
            title={t('finRefreshTooltip')}
          >
            <RefreshCw className={`size-4 ${summaryLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Log Expense CTA */}
          {canCreate('finance') && (
            <button
              onClick={() => handleOpenAddExpense()}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl bg-accent dark:bg-[#5B8FD4] text-accent-foreground dark:text-[#0B1528] font-extrabold text-xs shadow-md hover:opacity-90 transition-all cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Plus className="size-4" />
              <span>
                <T k="finAddExpense" />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Contextual Drill-Down Content */}
      <AnimatePresence mode="wait" custom={slideDirection}>
        <motion.div
          key={activeView}
          custom={slideDirection}
          initial="enter"
          animate="center"
          exit="exit"
          variants={{
            enter: (dir: number) => ({
              x: dir > 0 ? 30 : -30,
              opacity: 0,
            }),
            center: {
              x: 0,
              opacity: 1,
            },
            exit: (dir: number) => ({
              x: dir > 0 ? -30 : 30,
              opacity: 0,
            }),
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ willChange: 'transform, opacity' }}
        >
          {activeView === 'overview' && (
            <FinanceSummaryTab
              summaryData={summaryData}
              loading={summaryLoading}
              activeSection={activeSection}
              onSelectCategoryFilter={handleDrillDownToCategory}
              onViewAllExpenses={handleViewAllExpenses}
            />
          )}

          {activeView === 'ledger' && (
            <div className="flex flex-col gap-5">
              {/* ← Back to Overview breadcrumb */}
              <button
                onClick={handleBackToOverview}
                className="flex items-center gap-2 text-sm font-bold text-muted dark:text-night-muted hover:text-foreground dark:hover:text-night-text transition-colors cursor-pointer self-start group"
              >
                <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
                <T k="finBackToOverview" />
              </button>

              <ExpenseLedgerTab
                onOpenAddModal={handleOpenAddExpense}
                onOpenEditModal={handleOpenEditExpense}
                selectedCurrency={selectedCurrency}
                initialCategoryFilter={ledgerCategoryFilter}
                activeSection={activeSection}
                startDate={startDate}
                endDate={endDate}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={handleRefreshAll}
        expenseToEdit={expenseToEdit}
        defaultSection={defaultModalSection}
        defaultCurrency={selectedCurrency}
      />
    </div>
  );
}
