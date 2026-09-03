import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Receipt,
  AlertTriangle,
  User,
  X,
  TrendingUp,
  Tag,
  Coins,
  Truck,
  Warehouse,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { T } from '../T';
import { useNotification } from '../../context/NotificationContext';
import { usePermissions } from '../../context/PermissionsContext';
import { Select, type SelectOption } from '../Select';
import { CATEGORY_CONFIG } from './ExpenseModal';
import { ExpenseLedgerSkeleton, ExpenseTableRowSkeleton } from './FinanceSkeletons';
import { api, formatMoney } from '../../services/api';
import type {
  Expense,
  ExpenseSection,
  ExpenseListParams,
  CategoryBreakdownResponse,
  SupportedCurrency,
  ExchangeRatesResponse,
} from '../../services/api';
import { FTL_EXPENSE_CATEGORIES, LTL_EXPENSE_CATEGORIES } from '../../services/api';

interface ExpenseLedgerTabProps {
  onOpenAddModal?: (section?: ExpenseSection) => void;
  onOpenEditModal: (expense: Expense) => void;
  selectedCurrency: SupportedCurrency;
  initialCategoryFilter?: string;
  activeSection: ExpenseSection;
  startDate?: string;
  endDate?: string;
}

export function ExpenseLedgerTab({
  onOpenEditModal,
  selectedCurrency,
  initialCategoryFilter = '',
  activeSection,
  startDate = '',
  endDate = '',
}: ExpenseLedgerTabProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canUpdate, canDelete } = usePermissions();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalSum, setTotalSum] = useState<number>(0);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdownResponse | null>(
    null
  );
  const [ratesData, setRatesData] = useState<ExchangeRatesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters state
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategoryFilter);
  const [employeeFilter, setEmployeeFilter] = useState<string>('');
  const sortBy = 'expense_date';
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);

  // Employee mapping state for filter & display
  const [employeeMap, setEmployeeMap] = useState<Record<string, string>>({});
  const [employeeOptions, setEmployeeOptions] = useState<{ id: string; name: string }[]>([]);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Update initial filter prop changes
  useEffect(() => {
    if (initialCategoryFilter) {
      setCategoryFilter(initialCategoryFilter);
      setPage(1);
    }
  }, [initialCategoryFilter]);

  // Reset category filter and page when active section changes from header switcher
  useEffect(() => {
    setCategoryFilter('');
    setPage(1);
  }, [activeSection]);

  // Reset page when date range changes from header
  useEffect(() => {
    setPage(1);
  }, [startDate, endDate]);

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
  const convertAmount = useCallback(
    (amountInUzs: number, targetCurrency: SupportedCurrency): number => {
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
    },
    [ratesData]
  );

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params: ExpenseListParams = {
        section: activeSection,
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
      showNotification(err?.message || t('finNotifFetchFailed'), 'error');
    } finally {
      setLoading(false);
    }
  }, [
    page,
    activeSection,
    sortBy,
    sortOrder,
    search,
    categoryFilter,
    employeeFilter,
    startDate,
    endDate,
    showNotification,
    t,
  ]);

  const fetchCategories = useCallback(async () => {
    try {
      const params: { section: ExpenseSection; start_date?: string; end_date?: string } = {
        section: activeSection,
      };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await api.finance.getCategoryBreakdown(params);
      setCategoryBreakdown(res);
    } catch {
      // Non-critical
    }
  }, [activeSection, startDate, endDate]);

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
      showNotification(t('finNotifDeleted'), 'success');
      setDeleteTarget(null);
      fetchExpenses();
      fetchCategories();
    } catch (err: any) {
      showNotification(err?.message || t('finNotifDeleteFailed'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Compute available category options for current section filter
  const activeCategoryList = useMemo(() => {
    if (activeSection === 'ltl') return LTL_EXPENSE_CATEGORIES;
    return FTL_EXPENSE_CATEGORIES;
  }, [activeSection]);

  // DropDown category options with 'All' option
  const categoryOptions: SelectOption[] = useMemo(() => {
    const allOption: SelectOption = {
      value: '',
      label: t('finAllCategories') || 'All Categories',
      icon: <Tag className="size-3.5 text-muted dark:text-night-muted" />,
    };
    const list = activeCategoryList.map((catKey) => {
      const cfg = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.other;
      const Icon = cfg.icon;
      return {
        value: catKey,
        label: t(cfg.labelKey) || cfg.defaultLabel,
        icon: <Icon className="size-3.5" />,
      };
    });
    return [allOption, ...list];
  }, [activeCategoryList, t]);

  // DropDown employee options with 'All' option
  const employeeSelectOptions: SelectOption[] = useMemo(() => {
    const allOption: SelectOption = {
      value: '',
      label: t('finAllEmployees') || 'All Employees',
      icon: <User className="size-3.5 text-muted dark:text-night-muted" />,
    };
    const list = employeeOptions.map((emp) => ({
      value: emp.id,
      label: emp.name,
      icon: <User className="size-3.5 text-muted dark:text-night-muted" />,
    }));
    return [allOption, ...list];
  }, [employeeOptions, t]);

  // Compute top category in current view
  const topCategoryInfo = useMemo(() => {
    if (
      !categoryBreakdown ||
      !categoryBreakdown.categories ||
      categoryBreakdown.categories.length === 0
    ) {
      return null;
    }
    const sorted = [...categoryBreakdown.categories].sort(
      (a, b) => b.total_amount - a.total_amount
    );
    return sorted[0];
  }, [categoryBreakdown]);

  const hasActiveFilters = Boolean(search || categoryFilter || employeeFilter);

  if (loading && expenses.length === 0 && !categoryBreakdown) {
    return <ExpenseLedgerSkeleton section={activeSection} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Category Breakdown Ribbon Header with Count */}
      <div className="flex items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2">
          {activeSection === 'ftl' ? (
            <Truck className="size-4.5 text-blue-600 dark:text-blue-400" />
          ) : (
            <Warehouse className="size-4.5 text-emerald-600 dark:text-emerald-400" />
          )}
          <h3 className="text-sm font-bold text-foreground dark:text-night-text">
            {activeSection === 'ftl' ? 'FTL' : 'LTL'} <T k="finOperationalExpenses" />
          </h3>
        </div>

        <span className="text-xs font-bold text-muted dark:text-night-muted">
          {activeSection === 'ftl' ? '8 FTL Categories' : '6 LTL Categories'}
        </span>
      </div>

      {/* Category Breakdown Ribbon Header */}
      {categoryBreakdown && (
        <div
          className={`grid grid-cols-2 sm:grid-cols-4 ${
            activeSection === 'ftl' ? 'lg:grid-cols-8' : 'lg:grid-cols-6'
          } gap-3`}
        >
          {activeCategoryList.map((catKey) => {
            const cfg = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.other;
            const Icon = cfg.icon;
            const item = categoryBreakdown.categories?.find((c) => c.category === catKey);
            const isSelected = categoryFilter === catKey;

            return (
              <button
                key={catKey}
                onClick={() => {
                  setCategoryFilter(isSelected ? '' : catKey);
                  setPage(1);
                }}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer shadow-2xs ${
                  isSelected
                    ? `${cfg.bgClass} ${cfg.borderClass} ring-2 ring-brand-gold/40 shadow-sm`
                    : 'bg-surface dark:bg-night-surface border-border/60 dark:border-night-border hover:border-brand-gold/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-1.5 rounded-xl ${cfg.bgClass} ${cfg.colorClass}`}>
                    <Icon className="size-4" />
                  </div>
                  <span className="text-[10px] font-bold text-muted dark:text-night-muted">
                    {t('finEntriesCount', { count: item?.expense_count || 0 })}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-muted dark:text-night-muted block truncate">
                    <T k={cfg.labelKey} />
                  </span>
                  <p className="text-xs font-extrabold text-foreground dark:text-night-text mt-0.5">
                    {formatMoney(
                      convertAmount(item?.total_amount || 0, selectedCurrency),
                      selectedCurrency
                    )}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Mini Executive Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-3xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border shadow-sm">
        <div className="p-2 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-brand-gold/15 text-brand-gold">
            <Coins className="size-4.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted dark:text-night-muted block">
              <T k="finFilteredTotal" />
            </span>
            <span className="text-sm font-extrabold text-brand-gold">
              {formatMoney(convertAmount(totalSum, selectedCurrency), selectedCurrency)}
            </span>
          </div>
        </div>

        <div className="p-2 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Receipt className="size-4.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted dark:text-night-muted block">
              <T k="finTotalLogged" />
            </span>
            <span className="text-sm font-extrabold text-foreground dark:text-night-text">
              {t('finEntriesCount', { count: pagination.total })}
            </span>
          </div>
        </div>

        <div className="p-2 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="size-4.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted dark:text-night-muted block">
              <T k="finTopCategory" />
            </span>
            <span className="text-sm font-extrabold text-foreground dark:text-night-text truncate block max-w-[120px]">
              {topCategoryInfo
                ? t(CATEGORY_CONFIG[topCategoryInfo.category]?.labelKey || 'finCatOther')
                : 'N/A'}
            </span>
          </div>
        </div>

        <div className="p-2 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Tag className="size-4.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted dark:text-night-muted block">
              <T k="finAverageCost" />
            </span>
            <span className="text-sm font-extrabold text-foreground dark:text-night-text">
              {pagination.total > 0
                ? formatMoney(
                    convertAmount(totalSum / pagination.total, selectedCurrency),
                    selectedCurrency
                  )
                : formatMoney(0, selectedCurrency)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Action Toolbar - Single Row */}
      <div className="p-4 sm:p-5 rounded-3xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border shadow-sm flex flex-col sm:flex-row items-center gap-3">
        {/* Search Box */}
        <div className="relative flex-1 min-w-[200px] w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted dark:text-night-muted">
            <Search className="size-4" />
          </div>
          <input
            type="text"
            placeholder={t('finSearchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-9 h-11 bg-field dark:bg-night-field border border-field-border dark:border-night-border rounded-xl text-xs font-semibold text-foreground dark:text-night-text focus:outline-none focus:ring-2 focus:ring-brand-royal/20 dark:focus:ring-night-royal/25 focus:border-brand-royal dark:focus:border-night-royal transition-all placeholder:text-muted dark:placeholder:text-night-muted/60"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground dark:hover:text-night-text cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Category DropDown */}
        <div className="w-full sm:w-56 shrink-0">
          <Select
            options={categoryOptions}
            value={categoryFilter}
            onChange={(val) => {
              setCategoryFilter(val);
              setPage(1);
            }}
            placeholder={t('finExpenseCategory') || 'Category'}
            size="md"
            allowClear={Boolean(categoryFilter)}
          />
        </div>

        {/* Employee DropDown */}
        <div className="w-full sm:w-56 shrink-0">
          <Select
            options={employeeSelectOptions}
            value={employeeFilter}
            onChange={(val) => {
              setEmployeeFilter(val);
              setPage(1);
            }}
            placeholder={t('finAllEmployees') || 'Employee'}
            size="md"
            isSearchable={true}
            allowClear={Boolean(employeeFilter)}
          />
        </div>

        {/* Clear All Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              setCategoryFilter('');
              setEmployeeFilter('');
              setSearch('');
              setPage(1);
            }}
            className="text-[11px] font-bold text-rose-500 hover:underline shrink-0 cursor-pointer whitespace-nowrap px-1"
          >
            <T k="finClearFilters" />
          </button>
        )}
      </div>

      {/* Expense Ledger Table */}
      <div className="rounded-3xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border shadow-sm overflow-hidden relative">
        {loading && expenses.length > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-gold to-transparent animate-pulse z-20" />
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/60 dark:border-night-border bg-background/50 dark:bg-night-field/50 text-[11px] font-bold uppercase tracking-wider text-muted dark:text-night-muted">
                <th className="px-6 py-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                      setPage(1);
                    }}
                    className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted hover:text-foreground dark:text-night-muted dark:hover:text-night-text transition-colors cursor-pointer group"
                    title={t('finSortLabel', {
                      order: sortOrder === 'asc' ? t('finSortAsc') : t('finSortDesc'),
                    })}
                  >
                    <span>
                      <T k="finThDate" />
                    </span>
                    {sortOrder === 'asc' ? (
                      <ArrowUp className="size-3.5 text-brand-gold" />
                    ) : (
                      <ArrowDown className="size-3.5 text-brand-gold" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4">
                  <T k="finThSection" />
                </th>
                <th className="px-6 py-4">
                  <T k="finThCategory" />
                </th>
                <th className="px-6 py-4">
                  <T k="finThDescription" />
                </th>
                <th className="px-6 py-4 text-right">
                  <T k="finThAmount" />
                </th>
                <th className="px-6 py-4 text-center">
                  <T k="finThActions" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 dark:divide-night-border text-xs">
              {loading && expenses.length === 0 ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <ExpenseTableRowSkeleton key={`loading-row-${idx}`} />
                ))
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-3.5 rounded-2xl bg-border/20 dark:bg-night-field text-muted">
                        <Receipt className="size-8" />
                      </div>
                      <p className="text-sm font-bold text-foreground dark:text-night-text">
                        <T k="finNoExpensesFound" />
                      </p>
                      <p className="text-xs text-muted dark:text-night-muted max-w-sm">
                        <T k="finNoExpensesDesc" />
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => {
                  const cfg = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.other;
                  const Icon = cfg.icon;
                  const curr = expense.currency || 'UZS';
                  const sec = expense.section || 'ftl';
                  const isFtl = sec === 'ftl';

                  return (
                    <motion.tr
                      key={expense.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-border/20 dark:hover:bg-night-field/60 transition-colors"
                    >
                      {/* Date */}
                      <td className="px-6 py-4 font-mono font-medium text-muted dark:text-night-muted whitespace-nowrap">
                        {expense.expense_date?.split('T')[0]}
                      </td>

                      {/* Section Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isFtl ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold text-[10px] border border-blue-500/25 shadow-2xs">
                            <Truck className="size-3" />
                            <span>FTL</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] border border-emerald-500/25 shadow-2xs">
                            <Warehouse className="size-3" />
                            <span>LTL</span>
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold shadow-2xs ${cfg.bgClass} ${cfg.borderClass} ${cfg.colorClass}`}
                        >
                          <Icon className="size-3.5" />
                          <span>
                            <T k={cfg.labelKey} />
                          </span>
                        </div>
                      </td>

                      {/* Description & Employee */}
                      <td className="px-6 py-4 text-foreground dark:text-night-text max-w-md">
                        <div className="font-semibold">{expense.description}</div>
                        {expense.employee_id && (
                          <div className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 mt-1.5 rounded-lg bg-brand-gold/10 text-brand-gold font-bold border border-brand-gold/25">
                            <User className="size-3" />
                            <span>{employeeMap[expense.employee_id] || expense.employee_id}</span>
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 text-right font-extrabold text-foreground dark:text-night-text whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm">{formatMoney(expense.amount || 0, curr)}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-brand-gold/10 text-brand-gold font-extrabold uppercase">
                            {curr}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {canUpdate('finance') && (
                            <button
                              onClick={() => onOpenEditModal(expense)}
                              className="p-2 rounded-xl text-muted hover:text-brand-gold hover:bg-brand-gold/10 transition-colors cursor-pointer"
                              title={t('finEditExpense')}
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                          )}
                          {canDelete('finance') && (
                            <button
                              onClick={() => setDeleteTarget(expense)}
                              className="p-2 rounded-xl text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title={t('finDeleteExpense')}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="px-6 py-4 border-t border-border/60 dark:border-night-border bg-background/40 dark:bg-night-field/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-muted dark:text-night-muted">
            <T k="finFilteredTotal" />{' '}
            <span className="font-extrabold text-foreground dark:text-night-text">
              {formatMoney(convertAmount(totalSum, selectedCurrency), selectedCurrency)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-muted dark:text-night-muted font-medium">
              {t('finPageInfo', {
                page: pagination.page,
                totalPages: pagination.totalPages,
                total: pagination.total,
              })}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-2 rounded-xl border border-border/80 dark:border-night-border bg-surface dark:bg-night-surface hover:bg-border/30 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="p-2 rounded-xl border border-border/80 dark:border-night-border bg-surface dark:bg-night-surface hover:bg-border/30 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
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
              className="relative w-full max-w-md bg-surface dark:bg-night-surface border border-border dark:border-night-border rounded-3xl p-6 shadow-2xl z-10 text-center"
            >
              <div className="size-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                <AlertTriangle className="size-6" />
              </div>
              <h3 className="text-base font-bold text-foreground dark:text-night-text mb-2">
                {t('finDeleteExpense')}
              </h3>
              <p className="text-xs text-muted dark:text-night-muted mb-6">
                {t('finDeleteExpenseDesc')}
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-muted hover:text-foreground dark:hover:text-night-text transition-colors cursor-pointer"
                >
                  <T k="finBtnCancel" />
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteConfirm}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 text-white font-extrabold text-xs shadow-md hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {deleting ? t('finBtnDeleting') : t('finBtnDeleteConfirm')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
