import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
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
import type { FinanceSummaryResponse, FixedSalariesResponse, Expense, SupportedCurrency } from '../../services/api';

type FinanceTabId = 'summary' | 'expenses' | 'salaries';

export function FinancePage() {
  const { showNotification } = useNotification();
  const { canCreate } = usePermissions();

  const [activeTab, setActiveTab] = useState<FinanceTabId>('summary');
  const [period, setPeriod] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>('UZS');

  // API State
  const [summaryData, setSummaryData] = useState<FinanceSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);

  const [salariesData, setSalariesData] = useState<FixedSalariesResponse | null>(null);
  const [salariesLoading, setSalariesLoading] = useState<boolean>(true);

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [isBatchSalaryModalOpen, setIsBatchSalaryModalOpen] = useState(false);

  // Fetch Summary
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await api.finance.getSummary({ period, currency: selectedCurrency });
      setSummaryData(res);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to load financial summary', 'error');
    } finally {
      setSummaryLoading(false);
    }
  }, [period, selectedCurrency, showNotification]);

  // Fetch Salaries
  const fetchSalaries = useCallback(async () => {
    setSalariesLoading(true);
    try {
      const res = await api.finance.getFixedSalaries();
      setSalariesData(res);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to load fixed salaries', 'error');
    } finally {
      setSalariesLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchSummary();
    fetchSalaries();
  }, [fetchSummary, fetchSalaries]);

  const handleRefreshAll = () => {
    fetchSummary();
    fetchSalaries();
  };

  const handleOpenAddExpense = () => {
    setExpenseToEdit(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };

  const tabItems: { id: FinanceTabId; labelKey: string; defaultLabel: string; icon: any }[] = [
    { id: 'summary', labelKey: 'finTabSummary', defaultLabel: 'Summary & Analytics', icon: TrendingUp },
    { id: 'expenses', labelKey: 'finTabExpenses', defaultLabel: 'Operational Expenses', icon: PieChart },
    { id: 'salaries', labelKey: 'finTabSalaries', defaultLabel: 'Fixed Salaries', icon: Users },
  ];

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
              <DollarSign className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-foreground dark:text-night-text">
                <T k="finTitle" />
              </h1>
              <p className="text-xs text-muted dark:text-night-muted">
                <T k="finSubtitle" />
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Currency Normalization Selector */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface dark:bg-night-surface border border-border/80 dark:border-night-border text-xs">
            <Coins className="size-4 text-brand-gold shrink-0" />
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value as SupportedCurrency)}
              className="bg-transparent font-bold text-foreground dark:text-night-text focus:outline-none cursor-pointer"
            >
              <option value="UZS">UZS (So'm)</option>
              <option value="USD">USD ($)</option>
              <option value="RUB">RUB (₽)</option>
            </select>
          </div>

          {/* Month Picker */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface dark:bg-night-surface border border-border/80 dark:border-night-border text-xs">
            <CalendarIcon className="size-4 text-brand-gold shrink-0" />
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent font-semibold text-foreground dark:text-night-text focus:outline-none cursor-pointer"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefreshAll}
            className="p-2.5 rounded-xl bg-surface dark:bg-night-surface border border-border/80 dark:border-night-border text-muted hover:text-foreground dark:hover:text-night-text transition-colors cursor-pointer"
            title="Refresh Financial Data"
          >
            <RefreshCw className={`size-4 ${summaryLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Log Expense CTA */}
          {canCreate('finance') && (
            <button
              onClick={handleOpenAddExpense}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent dark:bg-[#5B8FD4] text-accent-foreground dark:text-[#0B1528] font-semibold text-xs shadow-md hover:opacity-90 transition-all cursor-pointer"
            >
              <Plus className="size-4" />
              <span><T k="finAddExpense" /></span>
            </button>
          )}
        </div>
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
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
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
              <span className="relative z-10"><T k={item.labelKey} /></span>
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
            <FinanceSummaryTab summaryData={summaryData} loading={summaryLoading} />
          )}

          {activeTab === 'expenses' && (
            <ExpenseLedgerTab
              onOpenAddModal={handleOpenAddExpense}
              onOpenEditModal={handleOpenEditExpense}
              selectedCurrency={selectedCurrency}
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
