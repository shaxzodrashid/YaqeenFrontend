import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Save, Loader2, ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { api } from '../../services/api';
import type { FixedSalariesResponse, BatchUpdateSalaryItem } from '../../services/api';

interface BatchSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData: FixedSalariesResponse | null;
}

export function BatchSalaryModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: BatchSalaryModalProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  const [salaryMap, setSalaryMap] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      const map: Record<string, string> = {};
      initialData.departments.forEach((dept) => {
        dept.employees.forEach((emp) => {
          map[emp.id] = String(emp.fixed_salary || 0);
        });
      });
      setSalaryMap(map);
    }
  }, [initialData, isOpen]);

  if (!initialData) return null;

  const originalTotal = initialData.total_monthly_salaries || 0;

  const calculateNewTotal = () => {
    let sum = 0;
    Object.values(salaryMap).forEach((val) => {
      const parsed = parseFloat(val);
      if (!isNaN(parsed) && parsed >= 0) {
        sum += parsed;
      }
    });
    return sum;
  };

  const newTotal = calculateNewTotal();
  const diff = newTotal - originalTotal;

  const handleSalaryChange = (empId: string, value: string) => {
    setSalaryMap((prev) => ({ ...prev, [empId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const salaries: BatchUpdateSalaryItem[] = [];
    for (const [empId, valStr] of Object.entries(salaryMap)) {
      const parsed = parseFloat(valStr);
      if (isNaN(parsed) || parsed < 0) {
        showNotification('All salary values must be non-negative numbers.', 'warning');
        return;
      }
      salaries.push({ employee_id: empId, fixed_salary: parsed });
    }

    setSubmitting(true);
    try {
      await api.finance.batchUpdateSalaries({ salaries });
      showNotification('Employee fixed salaries updated successfully in batch', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update salaries', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-surface dark:bg-night-surface border border-border dark:border-night-border rounded-2xl shadow-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 dark:border-night-border bg-background/50 dark:bg-night-field/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                  <Users className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground dark:text-night-text">
                    {t('finBatchUpdateSalaries')}
                  </h3>
                  <p className="text-xs text-muted dark:text-night-muted">
                    Update fixed monthly salaries across all active employees in a single
                    transaction
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted hover:text-foreground dark:hover:text-night-text hover:bg-border/30 transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Impact Banner */}
            <div className="px-6 py-3 bg-brand-navy/5 dark:bg-night-field border-b border-border/40 dark:border-night-border flex items-center justify-between gap-4 shrink-0 flex-wrap">
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-muted dark:text-night-muted">Current Payroll: </span>
                  <span className="font-semibold text-foreground dark:text-night-text">
                    ${originalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <ArrowRight className="size-4 text-muted" />
                <div>
                  <span className="text-muted dark:text-night-muted">New Payroll: </span>
                  <span className="font-semibold text-brand-gold">
                    ${newTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {diff !== 0 && (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    diff > 0
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {diff > 0 ? (
                    <TrendingUp className="size-3.5" />
                  ) : (
                    <TrendingDown className="size-3.5" />
                  )}
                  <span>
                    {diff > 0
                      ? `+${diff.toFixed(2)} Payroll Expense`
                      : `${diff.toFixed(2)} Payroll Expense`}
                  </span>
                </div>
              )}
            </div>

            {/* Body list of employees grouped by department */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-6 flex flex-col gap-6"
            >
              {initialData.departments.map((dept) => (
                <div key={dept.department_id} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-1 border-b border-border/40 dark:border-night-border">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-royal dark:text-[#5B8FD4]">
                      {dept.department_name} ({dept.employee_count} employees)
                    </h4>
                    <span className="text-xs font-semibold text-muted dark:text-night-muted">
                      Dept Total: $
                      {dept.total_fixed_salary.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {dept.employees.map((emp) => (
                      <div
                        key={emp.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-border/60 dark:border-night-border bg-background/40 dark:bg-night-field/50 gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground dark:text-night-text truncate">
                            {emp.full_name}
                          </p>
                          <p className="text-[11px] text-muted dark:text-night-muted truncate">
                            {emp.phone || 'No phone'}
                          </p>
                        </div>
                        <div className="relative w-32 shrink-0">
                          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-muted text-xs font-bold font-mono">
                            {emp.currency === 'UZS' ? "so'm" : emp.currency === 'RUB' ? '₽' : '$'}
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={salaryMap[emp.id] ?? ''}
                            onChange={(e) => handleSalaryChange(emp.id, e.target.value)}
                            className={`w-full pr-2 py-1.5 bg-surface dark:bg-night-surface border border-border/80 dark:border-night-border rounded-lg text-xs font-semibold text-foreground dark:text-night-text focus:outline-none focus:ring-1 focus:ring-brand-gold ${
                              emp.currency === 'UZS' ? 'pl-10' : 'pl-7'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/40 dark:border-night-border bg-background/50 dark:bg-night-field/50 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground dark:hover:text-night-text transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent dark:bg-[#5B8FD4] text-accent-foreground dark:text-[#0B1528] font-semibold text-xs shadow-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Updating Salaries...</span>
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
      )}
    </AnimatePresence>
  );
}
