import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  PieChart,
  Users,
  RefreshCw,
  Plus,
  Calendar as CalendarIcon,
  TrendingUp,
  Coins,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { usePermissions } from '../../context/PermissionsContext';
import { FinanceSummaryTab } from './FinanceSummaryTab';
import { ExpenseLedgerTab } from './ExpenseLedgerTab';
import { SalaryManagementTab } from './SalaryManagementTab';
import { ExpenseModal } from './ExpenseModal';
import { BatchSalaryModal } from './BatchSalaryModal';
import { CbuRatesWidget } from '../currency/CbuRatesWidget';
import { T } from '../T';
import { api } from '../../services/api';
import type {
  FinanceSummaryResponse,
  FixedSalariesResponse,
  Expense,
  SupportedCurrency,
  ExpenseCategory,
} from '../../services/api';

type FinanceTabId = 'summary' | 'expenses' | 'salaries';

export function FinancePage() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canCreate } = usePermissions();

  const [activeTab, setActiveTab] = useState<FinanceTabId>('summary');

  // Period / Date Range state
  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [activePreset, setActivePreset] = useState<string>('this_month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isCustomDateOpen, setIsCustomDateOpen] = useState<boolean>(false);

  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>('USD');

  // Deep-linking from Summary to Expense Ledger category
  const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState<string>('');

  // API State
  const [summaryData, setSummaryData] = useState<FinanceSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);

  const [salariesData, setSalariesData] = useState<FixedSalariesResponse | null>(null);
  const [salariesLoading, setSalariesLoading] = useState<boolean>(true);

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [isBatchSalaryModalOpen, setIsBatchSalaryModalOpen] = useState(false);

  // Formatted period string for standard month queries
  const periodString = useMemo(() => {
    const m = String(currentMonth).padStart(2, '0');
    return `${currentYear}-${m}`;
  }, [currentYear, currentMonth]);

  // Compute active query parameters for summary API
  const summaryQueryParams = useMemo(() => {
    if (activePreset === 'custom') {
      return {
        start_date: customStartDate || undefined,
        end_date: customEndDate || undefined,
        currency: selectedCurrency,
      };
    }
    if (activePreset === 'prev_month') {
      const d = new Date(currentYear, currentMonth - 2, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return { period: ym, currency: selectedCurrency };
    }
    if (activePreset === 'q1') {
      return {
        start_date: `${currentYear}-01-01`,
        end_date: `${currentYear}-03-31`,
        currency: selectedCurrency,
      };
    }
    if (activePreset === 'q2') {
      return {
        start_date: `${currentYear}-04-01`,
        end_date: `${currentYear}-06-30`,
        currency: selectedCurrency,
      };
    }
    if (activePreset === 'q3') {
      return {
        start_date: `${currentYear}-07-01`,
        end_date: `${currentYear}-09-30`,
        currency: selectedCurrency,
      };
    }
    if (activePreset === 'q4') {
      return {
        start_date: `${currentYear}-10-01`,
        end_date: `${currentYear}-12-31`,
        currency: selectedCurrency,
      };
    }
    if (activePreset === 'ytd') {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      return {
        start_date: `${now.getFullYear()}-01-01`,
        end_date: today,
        currency: selectedCurrency,
      };
    }
    // Default: this_month using period
    return { period: periodString, currency: selectedCurrency };
  }, [
    activePreset,
    periodString,
    currentYear,
    currentMonth,
    customStartDate,
    customEndDate,
    selectedCurrency,
  ]);

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

  // Fetch Salaries
  const fetchSalaries = useCallback(async () => {
    setSalariesLoading(true);
    try {
      const res = await api.finance.getFixedSalaries();
      setSalariesData(res);
    } catch (err: any) {
      showNotification(err?.message || t('finErrSalaries'), 'error');
    } finally {
      setSalariesLoading(false);
    }
  }, [showNotification, t]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchSalaries();
  }, [fetchSalaries]);

  const handleRefreshAll = () => {
    fetchSummary();
    fetchSalaries();
  };

  // Month navigation step
  const handleStepMonth = (direction: 'prev' | 'next') => {
    setActivePreset('this_month');
    if (direction === 'prev') {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear((y) => y - 1);
      } else {
        setCurrentMonth((m) => m - 1);
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear((y) => y + 1);
      } else {
        setCurrentMonth((m) => m + 1);
      }
    }
  };

  const handleOpenAddExpense = () => {
    setExpenseToEdit(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };

  // Deep-link from summary category card
  const handleExploreCategoryInLedger = (category: ExpenseCategory) => {
    setLedgerCategoryFilter(category);
    setActiveTab('expenses');
  };

  const tabItems: { id: FinanceTabId; labelKey: string; defaultLabel: string; icon: any }[] = [
    {
      id: 'summary',
      labelKey: 'finTabSummary',
      defaultLabel: 'Summary & Analytics',
      icon: TrendingUp,
    },
    {
      id: 'expenses',
      labelKey: 'finTabExpenses',
      defaultLabel: 'Operational Expenses',
      icon: PieChart,
    },
    { id: 'salaries', labelKey: 'finTabSalaries', defaultLabel: 'Fixed Salaries', icon: Users },
  ];

  const presets: { id: string; labelKey: string }[] = [
    { id: 'this_month', labelKey: 'finPeriodThisMonth' },
    { id: 'prev_month', labelKey: 'finPeriodPrevMonth' },
    { id: 'q1', labelKey: 'finPeriodQ1' },
    { id: 'q2', labelKey: 'finPeriodQ2' },
    { id: 'q3', labelKey: 'finPeriodQ3' },
    { id: 'q4', labelKey: 'finPeriodQ4' },
    { id: 'ytd', labelKey: 'finPeriodYtd' },
  ];

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30 shadow-2xs">
              <DollarSign className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-serif font-extrabold text-foreground dark:text-night-text">
                  <T k="finTitle" />
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                  ERP Intelligence
                </span>
              </div>
              <p className="text-xs text-muted dark:text-night-muted mt-0.5">
                <T k="finSubtitle" />
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Currency Normalization Selector */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-surface dark:bg-night-surface border border-border/80 dark:border-night-border text-xs shadow-2xs">
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

          {/* Month Step Stepper */}
          <div className="flex items-center rounded-2xl bg-surface dark:bg-night-surface border border-border/80 dark:border-night-border p-1 shadow-2xs">
            <button
              onClick={() => handleStepMonth('prev')}
              className="p-1.5 rounded-xl hover:bg-border/30 text-muted hover:text-foreground transition-colors cursor-pointer"
              title={t('finPeriodStepPrev')}
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="px-2.5 font-bold font-mono text-xs text-foreground dark:text-night-text">
              {periodString}
            </span>
            <button
              onClick={() => handleStepMonth('next')}
              className="p-1.5 rounded-xl hover:bg-border/30 text-muted hover:text-foreground transition-colors cursor-pointer"
              title={t('finPeriodStepNext')}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Custom Date Range Popover Button */}
          <div className="relative">
            <button
              onClick={() => setIsCustomDateOpen(!isCustomDateOpen)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                activePreset === 'custom'
                  ? 'bg-brand-gold/15 text-brand-gold border-brand-gold/40'
                  : 'bg-surface dark:bg-night-surface border-border/80 dark:border-night-border text-muted hover:text-foreground'
              }`}
            >
              <CalendarIcon className="size-4 text-brand-gold" />
              <span>
                {activePreset === 'custom' && customStartDate && customEndDate
                  ? `${customStartDate} – ${customEndDate}`
                  : t('finPeriodCustom')}
              </span>
            </button>

            {/* Custom Date Range Popover Box */}
            <AnimatePresence>
              {isCustomDateOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 p-4 w-72 rounded-3xl bg-surface dark:bg-night-surface border border-border dark:border-night-border shadow-2xl z-30 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="text-xs font-bold text-foreground dark:text-night-text">
                      <T k="finSelectCustomRange" />
                    </span>
                    <button
                      onClick={() => setIsCustomDateOpen(false)}
                      className="text-muted hover:text-foreground p-1 rounded-lg"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase text-muted">
                      <T k="finStartDate" />
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="px-3 py-1.5 bg-field-background dark:bg-night-field border border-border/80 rounded-xl text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase text-muted">
                      <T k="finEndDate" />
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="px-3 py-1.5 bg-field-background dark:bg-night-field border border-border/80 rounded-xl text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                    <button
                      onClick={() => {
                        setActivePreset('this_month');
                        setCustomStartDate('');
                        setCustomEndDate('');
                        setIsCustomDateOpen(false);
                      }}
                      className="px-3 py-1.5 text-xs text-muted hover:text-foreground font-semibold"
                    >
                      <T k="finResetPeriod" />
                    </button>
                    <button
                      onClick={() => {
                        if (customStartDate && customEndDate) {
                          setActivePreset('custom');
                          setIsCustomDateOpen(false);
                        }
                      }}
                      disabled={!customStartDate || !customEndDate}
                      className="px-4 py-1.5 rounded-xl bg-accent text-accent-foreground font-bold text-xs shadow-sm disabled:opacity-40"
                    >
                      <T k="finApplyDateRange" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefreshAll}
            className="p-2.5 rounded-2xl bg-surface dark:bg-night-surface border border-border/80 dark:border-night-border text-muted hover:text-foreground dark:hover:text-night-text transition-colors cursor-pointer shadow-2xs"
            title={t('finRefreshTooltip')}
          >
            <RefreshCw className={`size-4 ${summaryLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Log Expense CTA */}
          {canCreate('finance') && (
            <button
              onClick={handleOpenAddExpense}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent dark:bg-[#5B8FD4] text-accent-foreground dark:text-[#0B1528] font-extrabold text-xs shadow-md hover:opacity-90 transition-all cursor-pointer"
            >
              <Plus className="size-4" />
              <span>
                <T k="finAddExpense" />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Period Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {presets.map((p) => {
          const isSelected = activePreset === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActivePreset(p.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                isSelected
                  ? 'bg-brand-gold/15 text-brand-gold border border-brand-gold/40 shadow-xs'
                  : 'bg-surface dark:bg-night-surface text-muted border border-border/60 hover:text-foreground dark:hover:text-night-text'
              }`}
            >
              <T k={p.labelKey} />
            </button>
          );
        })}
      </div>

      {/* CBU Rates Widget */}
      <CbuRatesWidget />

      {/* Animated Tab Bar Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface/80 dark:bg-night-surface/80 border border-border/60 dark:border-night-border backdrop-blur-md self-start">
        {tabItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-brand-gold dark:text-brand-gold'
                  : 'text-muted dark:text-night-muted hover:text-foreground dark:hover:text-night-text'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-finance-tab-pill"
                  className="absolute inset-0 bg-brand-gold/15 border border-brand-gold/30 rounded-xl shadow-2xs"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="size-4 relative z-10" />
              <span className="relative z-10">
                <T k={item.labelKey} />
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Sub-View Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'summary' && (
            <FinanceSummaryTab
              summaryData={summaryData}
              loading={summaryLoading}
              onSelectCategoryFilter={handleExploreCategoryInLedger}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpenseLedgerTab
              onOpenAddModal={handleOpenAddExpense}
              onOpenEditModal={handleOpenEditExpense}
              selectedCurrency={selectedCurrency}
              initialCategoryFilter={ledgerCategoryFilter}
            />
          )}

          {activeTab === 'salaries' && (
            <SalaryManagementTab
              salaryData={salariesData}
              loading={salariesLoading}
              onRefresh={fetchSalaries}
              onOpenBatchModal={() => setIsBatchSalaryModalOpen(true)}
              selectedCurrency={selectedCurrency}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={handleRefreshAll}
        expenseToEdit={expenseToEdit}
        defaultCurrency={selectedCurrency}
      />

      <BatchSalaryModal
        isOpen={isBatchSalaryModalOpen}
        onClose={() => setIsBatchSalaryModalOpen(false)}
        onSuccess={handleRefreshAll}
        initialData={salariesData}
      />
    </div>
  );
}
