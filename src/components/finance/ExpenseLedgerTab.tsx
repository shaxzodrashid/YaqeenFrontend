import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Receipt,
  AlertTriangle,
  Loader2,
  User,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { T } from '../T';
import { useNotification } from '../../context/NotificationContext';
import { usePermissions } from '../../context/PermissionsContext';
import { CATEGORY_CONFIG } from './ExpenseModal';
import { api, formatMoney } from '../../services/api';
import type { Expense, ExpenseCategory, ExpenseListParams, CategoryBreakdownResponse, SupportedCurrency, ExchangeRatesResponse } from '../../services/api';

interface ExpenseLedgerTabProps {
  onOpenAddModal: () => void;
  onOpenEditModal: (expense: Expense) => void;
  selectedCurrency: SupportedCurrency;
}

export function ExpenseLedgerTab({ onOpenAddModal, onOpenEditModal, selectedCurrency }: ExpenseLedgerTabProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canUpdate, canDelete } = usePermissions();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalSum, setTotalSum] = useState<number>(0);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdownResponse | null>(null);
  const [ratesData, setRatesData] = useState<ExchangeRatesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters state
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [employeeFilter, setEmployeeFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const sortBy = 'expense_date';
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);

  // Employee mapping state for filter & display
  const [employeeMap, setEmployeeMap] = useState<Record<string, string>>({});
  const [employeeOptions, setEmployeeOptions] = useState<{ id: string; name: string }[]>([]);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load employee list for lookup and filtering
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await api.employees.list({ limit: 100 });
        const map: Record<string, string> = {};
        const options: { id: string; name: string }[] = [];
        if (res?.items && res.items.length > 0) {
          res.items.forEach((emp) => {
            const name = `${emp.first_name} ${emp.last_name}`.trim();
            map[emp.id] = name;
            options.push({ id: emp.id, name });
          });
        }
        // Also fetch from fixed salaries to ensure all employees are captured
        const finRes = await api.finance.getFixedSalaries();
        finRes.departments?.forEach((dept) => {
          dept.employees?.forEach((emp) => {
            if (emp.id) {
              const name = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
              if (!map[emp.id]) {
                map[emp.id] = name;
                options.push({ id: emp.id, name });
              }
            }
          });
        });
        setEmployeeMap(map);
        setEmployeeOptions(options);
      } catch {
        // Non-critical
      }
    };
    loadEmployees();
  }, []);

  // Load CBU exchange rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const data = await api.currency.getExchangeRates();
        setRatesData(data);
      } catch {
        // Non-critical
      }
    };
    fetchRates();
  }, []);

  // Helper to convert UZS amount to target currency using CBU exchange rates
  const convertAmount = useCallback((amountInUzs: number, targetCurrency: SupportedCurrency): number => {
    if (targetCurrency === 'UZS') return amountInUzs;
    if (!ratesData || !ratesData.rates) return amountInUzs;

    let lookupCurrency = targetCurrency;
    if (targetCurrency === 'RMB' && !ratesData.rates['RMB'] && ratesData.rates['CNY']) {
      lookupCurrency = 'CNY';
    } else if (targetCurrency === 'CNY' && !ratesData.rates['CNY'] && ratesData.rates['RMB']) {
      lookupCurrency = 'RMB';
    }

    const rateItem = ratesData.rates[lookupCurrency];
    if (!rateItem || !rateItem.rate) return amountInUzs;
    return amountInUzs / rateItem.rate;
  }, [ratesData]);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params: ExpenseListParams = {
        page,
        limit: 15,
        sort_by: sortBy,
        order: sortOrder,
      };
      if (search.trim()) params.search = search.trim();
      if (categoryFilter) params.category = categoryFilter;
      if (employeeFilter) params.employee_id = employeeFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await api.finance.listExpenses(params);
      setExpenses(res.data || []);
      setTotalSum(res.total_sum || 0);
      setPagination(res.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 });
    } catch (err: any) {
      showNotification(err?.message || 'Failed to fetch expenses', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortOrder, search, categoryFilter, employeeFilter, startDate, endDate, showNotification]);

  const fetchCategories = useCallback(async () => {
    try {
      const params: { start_date?: string; end_date?: string } = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await api.finance.getCategoryBreakdown(params);
      setCategoryBreakdown(res);
    } catch {
      // Non-critical
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, [fetchExpenses, fetchCategories]);

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.finance.deleteExpense(deleteTarget.id);
      showNotification('Expense record deleted', 'success');
      setDeleteTarget(null);
      fetchExpenses();
      fetchCategories();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete expense', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Category Breakdown Cards Header */}
      {categoryBreakdown && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(Object.keys(CATEGORY_CONFIG) as ExpenseCategory[]).map((catKey) => {
            const cfg = CATEGORY_CONFIG[catKey];
            const Icon = cfg.icon;
            const item = categoryBreakdown.categories.find((c) => c.category === catKey);
            const isSelected = categoryFilter === catKey;

            return (
              <button
                key={catKey}
                onClick={() => {
                  setCategoryFilter(isSelected ? '' : catKey);
                  setPage(1);
                }}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? `${cfg.bgClass} ${cfg.borderClass} ring-2 ring-brand-gold/40 shadow-sm`
                    : 'bg-surface dark:bg-night-surface border-border/60 dark:border-night-border hover:border-brand-gold/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-1.5 rounded-lg ${cfg.bgClass} ${cfg.colorClass}`}>
                    <Icon className="size-3.5" />
                  </div>
                  <span className="text-[10px] font-semibold text-muted dark:text-night-muted">
                    {item?.expense_count || 0} entries
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-muted dark:text-night-muted block truncate">
                    <T k={cfg.labelKey} />
                  </span>
                  <p className="text-xs font-bold text-foreground dark:text-night-text mt-0.5">
                    {formatMoney(convertAmount(item?.total_amount || 0, selectedCurrency), selectedCurrency)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Filter & Action Toolbar */}
      <div className="p-4 rounded-2xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
              <Search className="size-4" />
            </div>
            <input
              type="text"
              placeholder="Search expenses by description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-field-background dark:bg-night-field border border-border/80 dark:border-night-border rounded-xl text-xs text-foreground dark:text-night-text focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
            />
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Sort Toggle */}
            <button
              onClick={() => {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/80 dark:border-night-border bg-background dark:bg-night-field text-xs text-muted dark:text-night-muted hover:text-foreground dark:hover:text-night-text transition-colors cursor-pointer"
            >
              <ArrowUpDown className="size-3.5" />
              <span>Sort: {sortOrder.toUpperCase()}</span>
            </button>

            {/* Add Expense Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent dark:bg-[#5B8FD4] text-accent-foreground dark:text-[#0B1528] font-semibold text-xs shadow-md hover:opacity-90 transition-all cursor-pointer"
            >
              <Plus className="size-4" />
              <span><T k="finAddExpense" /></span>
            </button>
          </div>
        </div>

        {/* Date & Employee Filter Inputs */}
        <div className="flex items-center gap-3 flex-wrap pt-3 border-t border-border/40 dark:border-night-border text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted dark:text-night-muted">Start Date:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="px-2.5 py-1 bg-field-background dark:bg-night-field border border-border/80 dark:border-night-border rounded-lg text-xs text-foreground dark:text-night-text focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted dark:text-night-muted">End Date:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="px-2.5 py-1 bg-field-background dark:bg-night-field border border-border/80 dark:border-night-border rounded-lg text-xs text-foreground dark:text-night-text focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted dark:text-night-muted">Employee:</span>
            <select
              value={employeeFilter}
              onChange={(e) => { setEmployeeFilter(e.target.value); setPage(1); }}
              className="px-2.5 py-1 bg-field-background dark:bg-night-field border border-border/80 dark:border-night-border rounded-lg text-xs text-foreground dark:text-night-text focus:outline-none cursor-pointer"
            >
              <option value="">All Employees</option>
              {employeeOptions.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
          {(startDate || endDate || categoryFilter || employeeFilter || search) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setCategoryFilter('');
                setEmployeeFilter('');
                setSearch('');
                setPage(1);
              }}
              className="text-[11px] font-semibold text-rose-500 hover:underline ml-auto cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Expense Ledger Table */}
      <div className="rounded-2xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="size-6 text-brand-gold animate-spin" />
            <p className="text-xs text-muted dark:text-night-muted">Loading expense ledger...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Receipt className="size-8 text-muted/50" />
            <p className="text-sm font-semibold text-foreground dark:text-night-text">No expenses found</p>
            <p className="text-xs text-muted dark:text-night-muted">
              Try clearing filters or log a new operational expense.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 dark:border-night-border bg-background/50 dark:bg-night-field/50 text-[11px] font-bold uppercase tracking-wider text-muted dark:text-night-muted">
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                  <th className="px-6 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 dark:divide-night-border text-xs">
                {expenses.map((expense) => {
                  const cfg = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.other;
                  const Icon = cfg.icon;
                  const curr = expense.currency || 'UZS';
                  return (
                    <motion.tr
                      key={expense.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-border/20 dark:hover:bg-night-field/60 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-muted dark:text-night-muted whitespace-nowrap">
                        {expense.expense_date?.split('T')[0]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${cfg.bgClass} ${cfg.borderClass} ${cfg.colorClass}`}>
                          <Icon className="size-3.5" />
                          <span>{t(cfg.labelKey) || cfg.defaultLabel}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground dark:text-night-text max-w-md">
                        <div className="font-medium truncate">{expense.description}</div>
                        {expense.employee_id && (
                          <div className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 mt-1 rounded-md bg-brand-gold/10 text-brand-gold font-semibold border border-brand-gold/20">
                            <User className="size-3" />
                            <span>{employeeMap[expense.employee_id] || expense.employee_id}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-foreground dark:text-night-text whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{formatMoney(expense.amount || 0, curr)}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-gold/10 text-brand-gold font-bold uppercase">
                            {curr}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {canUpdate('finance') && (
                            <button
                              onClick={() => onOpenEditModal(expense)}
                              className="p-1.5 rounded-lg text-muted hover:text-brand-gold hover:bg-brand-gold/10 transition-colors cursor-pointer"
                              title="Edit Expense"
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                          )}
                          {canDelete('finance') && (
                            <button
                              onClick={() => setDeleteTarget(expense)}
                              className="p-1.5 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete Expense"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer & Pagination */}
        <div className="px-6 py-4 border-t border-border/60 dark:border-night-border bg-background/40 dark:bg-night-field/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-muted dark:text-night-muted">
            Filtered Total: <span className="font-bold text-foreground dark:text-night-text">{formatMoney(convertAmount(totalSum, selectedCurrency), selectedCurrency)}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-muted dark:text-night-muted">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-border/80 dark:border-night-border hover:bg-border/30 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-border/80 dark:border-night-border hover:bg-border/30 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-surface dark:bg-night-surface border border-border dark:border-night-border rounded-2xl p-6 shadow-2xl z-10 text-center"
            >
              <div className="size-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                <AlertTriangle className="size-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground dark:text-night-text mb-2">
                {t('finDeleteExpense')}
              </h3>
              <p className="text-xs text-muted dark:text-night-muted mb-6">
                {t('finDeleteExpenseDesc')}
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground dark:hover:text-night-text transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteConfirm}
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs shadow-md hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete Expense'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
