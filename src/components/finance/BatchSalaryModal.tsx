import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  Save,
  Loader2,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Search,
  RotateCcw,
  Building2,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { T } from '../T';
import { api, formatMoney } from '../../services/api';
import type {
  FixedSalariesResponse,
  BatchUpdateSalaryItem,
  SupportedCurrency,
} from '../../services/api';

interface BatchSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData: FixedSalariesResponse | null;
}

interface EditableEmployeeSalary {
  employee_id: string;
  full_name: string;
  department_name: string;
  original_salary: number;
  fixed_salary: string;
  currency: SupportedCurrency;
  color?: string;
  phone?: string;
}

export function BatchSalaryModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: BatchSalaryModalProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  const [employeesList, setEmployeesList] = useState<EditableEmployeeSalary[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      const list: EditableEmployeeSalary[] = [];
      initialData.departments.forEach((dept) => {
        dept.employees.forEach((emp) => {
          list.push({
            employee_id: emp.id,
            full_name: emp.full_name,
            department_name: dept.department_name,
            original_salary: emp.fixed_salary || 0,
            fixed_salary: String(emp.fixed_salary || 0),
            currency: emp.currency || 'USD',
            color: emp.color,
            phone: emp.phone,
          });
        });
      });
      setEmployeesList(list);
    }
  }, [initialData, isOpen]);

  const originalTotal = useMemo(() => {
    return employeesList.reduce((acc, emp) => acc + emp.original_salary, 0);
  }, [employeesList]);

  const newTotal = useMemo(() => {
    return employeesList.reduce((acc, emp) => {
      const parsed = parseFloat(emp.fixed_salary);
      return acc + (isNaN(parsed) || parsed < 0 ? 0 : parsed);
    }, 0);
  }, [employeesList]);

  const diff = newTotal - originalTotal;
  const diffPct = originalTotal > 0 ? (diff / originalTotal) * 100 : 0;

  const handleSalaryChange = (empId: string, value: string) => {
    setEmployeesList((prev) =>
      prev.map((emp) => (emp.employee_id === empId ? { ...emp, fixed_salary: value } : emp))
    );
  };

  const handleCurrencyChange = (empId: string, curr: SupportedCurrency) => {
    setEmployeesList((prev) =>
      prev.map((emp) => (emp.employee_id === empId ? { ...emp, currency: curr } : emp))
    );
  };

  const applyPercentRaise = (percent: number) => {
    setEmployeesList((prev) =>
      prev.map((emp) => {
        const cur = parseFloat(emp.fixed_salary) || 0;
        const updated = Math.round(cur * (1 + percent / 100) * 100) / 100;
        return { ...emp, fixed_salary: String(updated) };
      })
    );
    showNotification(`Applied +${percent}% adjustment across all active employees`, 'info');
  };

  const handleResetToOriginal = () => {
    setEmployeesList((prev) =>
      prev.map((emp) => ({
        ...emp,
        fixed_salary: String(emp.original_salary),
      }))
    );
    showNotification(t('finQuickBatchReset'), 'info');
  };

  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employeesList;
    const term = searchTerm.toLowerCase().trim();
    return employeesList.filter(
      (emp) =>
        emp.full_name.toLowerCase().includes(term) ||
        emp.department_name.toLowerCase().includes(term) ||
        (emp.phone && emp.phone.toLowerCase().includes(term))
    );
  }, [employeesList, searchTerm]);

  // Group filtered employees by department
  const groupedByDept = useMemo(() => {
    const map: Record<string, EditableEmployeeSalary[]> = {};
    filteredEmployees.forEach((emp) => {
      if (!map[emp.department_name]) {
        map[emp.department_name] = [];
      }
      map[emp.department_name].push(emp);
    });
    return map;
  }, [filteredEmployees]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const salaries: BatchUpdateSalaryItem[] = [];
    for (const emp of employeesList) {
      const parsed = parseFloat(emp.fixed_salary);
      if (isNaN(parsed) || parsed < 0) {
        showNotification(t('finWarnNonNegative'), 'warning');
        return;
      }
      salaries.push({
        employee_id: emp.employee_id,
        fixed_salary: parsed,
        currency: emp.currency,
      });
    }

    setSubmitting(true);
    try {
      await api.finance.batchUpdateSalaries({ salaries });
      showNotification(t('finNotifBatchSuccess'), 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showNotification(err?.message || t('finNotifBatchFailed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-surface dark:bg-night-surface border border-border dark:border-night-border rounded-3xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 dark:border-night-border bg-background/50 dark:bg-night-field/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-brand-gold/15 text-brand-gold border border-brand-gold/25 shadow-2xs">
                <Users className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground dark:text-night-text">
                  <T k="finBatchUpdateSalaries" />
                </h3>
                <p className="text-xs text-muted dark:text-night-muted">
                  <T k="finBatchModalSubtitle" />
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted hover:text-foreground dark:hover:text-night-text hover:bg-border/30 transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Real-time Payroll Impact Banner & Quick Action Tools */}
          <div className="px-6 py-3.5 bg-gradient-to-r from-brand-navy/5 via-brand-gold/5 to-transparent dark:from-night-field dark:to-night-surface border-b border-border/50 dark:border-night-border flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            {/* Impact Calculation */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted dark:text-night-muted">
                  <T k="finCurrentPayroll" />
                </span>
                <span className="font-bold text-foreground dark:text-night-text text-sm">
                  {formatMoney(originalTotal, 'USD')}
                </span>
              </div>
              <ArrowRight className="size-4 text-muted" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted dark:text-night-muted">
                  <T k="finNewPayroll" />
                </span>
                <span className="font-bold text-brand-gold text-sm">
                  {formatMoney(newTotal, 'USD')}
                </span>
              </div>
              {diff !== 0 && (
                <div
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold ml-2 ${
                    diff > 0
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {diff > 0 ? (
                    <TrendingUp className="size-3.5" />
                  ) : (
                    <TrendingDown className="size-3.5" />
                  )}
                  <span>
                    {diff > 0 ? `+${diffPct.toFixed(1)}%` : `${diffPct.toFixed(1)}%`} (
                    {formatMoney(Math.abs(diff), 'USD')})
                  </span>
                </div>
              )}
            </div>

            {/* Quick Automation Tools */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => applyPercentRaise(5)}
                className="px-2.5 py-1 text-xs rounded-xl bg-surface dark:bg-night-surface border border-border/80 dark:border-night-border hover:border-brand-gold text-foreground font-bold hover:text-brand-gold transition-colors cursor-pointer shadow-2xs"
              >
                <T k="finQuickBatchRaise5" />
              </button>
              <button
                type="button"
                onClick={() => applyPercentRaise(10)}
                className="px-2.5 py-1 text-xs rounded-xl bg-surface dark:bg-night-surface border border-border/80 dark:border-night-border hover:border-brand-gold text-foreground font-bold hover:text-brand-gold transition-colors cursor-pointer shadow-2xs"
              >
                <T k="finQuickBatchRaise10" />
              </button>
              <button
                type="button"
                onClick={handleResetToOriginal}
                className="p-1.5 rounded-xl text-muted hover:text-foreground dark:hover:text-night-text border border-border/60 hover:bg-border/20 transition-colors cursor-pointer"
                title={t('finQuickBatchReset')}
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Search bar inside modal */}
          <div className="px-6 py-2.5 bg-surface dark:bg-night-surface border-b border-border/40 dark:border-night-border shrink-0">
            <div className="relative">
              <Search className="size-4 absolute left-3 top-2.5 text-muted pointer-events-none" />
              <input
                type="text"
                placeholder={t('finBatchSearchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-field-background dark:bg-night-field border border-border/70 dark:border-night-border rounded-xl text-xs text-foreground dark:text-night-text focus:outline-none focus:ring-1 focus:ring-brand-gold/50"
              />
            </div>
          </div>

          {/* Department grouped body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {Object.keys(groupedByDept).length === 0 ? (
              <div className="p-12 text-center text-muted text-xs">
                <T k="finNoExpensesFoundForFilter" />
              </div>
            ) : (
              Object.entries(groupedByDept).map(([deptName, emps]) => {
                const deptCurrentTotal = emps.reduce(
                  (sum, e) => sum + (parseFloat(e.fixed_salary) || 0),
                  0
                );
                return (
                  <div
                    key={deptName}
                    className="p-4 rounded-2xl bg-background/40 dark:bg-night-field/30 border border-border/60 dark:border-night-border flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-border/40 dark:border-night-border">
                      <div className="flex items-center gap-2">
                        <Building2 className="size-4 text-brand-gold" />
                        <h4 className="text-xs font-bold text-foreground dark:text-night-text">
                          {deptName} ({emps.length})
                        </h4>
                      </div>
                      <span className="text-xs font-bold text-brand-gold">
                        Dept Total: {formatMoney(deptCurrentTotal, 'USD')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {emps.map((emp) => (
                        <div
                          key={emp.employee_id}
                          className="flex items-center justify-between p-3 rounded-xl border border-border/60 dark:border-night-border bg-surface dark:bg-night-surface gap-3 shadow-2xs hover:border-brand-gold/40 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div
                              className="size-8 rounded-full border border-brand-gold/25 flex items-center justify-center font-bold text-[11px] shrink-0"
                              style={{
                                backgroundColor: emp.color ? `${emp.color}20` : '#0F2D5C20',
                                color: emp.color || '#C8A96A',
                              }}
                            >
                              {emp.full_name?.[0] || 'U'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-foreground dark:text-night-text truncate">
                                {emp.full_name}
                              </p>
                              <p className="text-[10px] text-muted dark:text-night-muted truncate">
                                {emp.phone || t('finNoPhone')}
                              </p>
                            </div>
                          </div>

                          {/* Salary and Currency Input */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={emp.fixed_salary}
                              onChange={(e) => handleSalaryChange(emp.employee_id, e.target.value)}
                              className="w-24 px-2 py-1.5 bg-field-background dark:bg-night-field border border-border/80 dark:border-night-border rounded-lg text-xs font-bold text-foreground dark:text-night-text focus:outline-none focus:ring-1 focus:ring-brand-gold"
                            />
                            <select
                              value={emp.currency}
                              onChange={(e) =>
                                handleCurrencyChange(
                                  emp.employee_id,
                                  e.target.value as SupportedCurrency
                                )
                              }
                              className="py-1.5 px-1 bg-field-background dark:bg-night-field border border-border/80 dark:border-night-border rounded-lg text-[10px] font-bold text-foreground dark:text-night-text focus:outline-none cursor-pointer"
                            >
                              <option value="USD">USD</option>
                              <option value="UZS">UZS</option>
                              <option value="RUB">RUB</option>
                              <option value="CNY">CNY</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/40 dark:border-night-border bg-background/50 dark:bg-night-field/50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-muted hover:text-foreground dark:hover:text-night-text transition-colors cursor-pointer"
            >
              <T k="finBtnCancel" />
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent dark:bg-[#5B8FD4] text-accent-foreground dark:text-[#0B1528] font-bold text-xs shadow-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t('finBtnUpdatingSalaries')}</span>
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  <span>{t('finSaveSalaries')}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
