import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, Building2, Edit3, Check, Loader2, TrendingUp } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { T } from '../T';
import { usePermissions } from '../../context/PermissionsContext';
import { api, formatMoney } from '../../services/api';
import type {
  FixedSalariesResponse,
  EmployeeSalaryInfo,
  SupportedCurrency,
  ExchangeRatesResponse,
} from '../../services/api';

interface SalaryManagementTabProps {
  salaryData: FixedSalariesResponse | null;
  loading: boolean;
  onRefresh: () => void;
  onOpenBatchModal: () => void;
  selectedCurrency?: SupportedCurrency;
}

export function SalaryManagementTab({
  salaryData,
  loading,
  onRefresh,
  onOpenBatchModal,
  selectedCurrency = 'UZS',
}: SalaryManagementTabProps) {
  const { showNotification } = useNotification();
  const { canUpdate } = usePermissions();

  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [editSalaryValue, setEditSalaryValue] = useState<string>('');
  const [savingEmpId, setSavingEmpId] = useState<string | null>(null);
  const [ratesData, setRatesData] = useState<ExchangeRatesResponse | null>(null);

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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-44 rounded-2xl bg-border/20 dark:bg-night-surface border border-border/40 dark:border-night-border"
          />
        ))}
      </div>
    );
  }

  if (!salaryData) {
    return (
      <div className="p-12 text-center bg-surface dark:bg-night-surface rounded-2xl border border-border dark:border-night-border">
        <p className="text-sm text-muted dark:text-night-muted">No salary data available.</p>
      </div>
    );
  }

  const { total_active_employees, total_monthly_salaries, departments } = salaryData;
  const avgSalary =
    total_active_employees > 0 ? total_monthly_salaries / total_active_employees : 0;

  const filteredDepts =
    selectedDeptId === 'all'
      ? departments
      : departments.filter((d) => d.department_id === selectedDeptId);

  const handleStartEdit = (emp: EmployeeSalaryInfo) => {
    setEditingEmpId(emp.id);
    setEditSalaryValue(String(emp.fixed_salary || 0));
  };

  const handleSaveSingleSalary = async (empId: string) => {
    const parsed = parseFloat(editSalaryValue);
    if (isNaN(parsed) || parsed < 0) {
      showNotification('Please enter a valid salary amount.', 'warning');
      return;
    }
    setSavingEmpId(empId);
    try {
      await api.finance.updateEmployeeSalary(empId, parsed);
      showNotification('Employee salary updated successfully', 'success');
      setEditingEmpId(null);
      onRefresh();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update salary', 'error');
    } finally {
      setSavingEmpId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Metrics Banner & Batch CTA */}
      <div className="p-6 rounded-2xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full md:w-auto">
          {/* Active Employees */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="size-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-night-muted block">
                Active Staff
              </span>
              <span className="text-xl font-bold text-foreground dark:text-night-text">
                {total_active_employees} employees
              </span>
            </div>
          </div>

          {/* Total Monthly Salaries */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-brand-gold/15 text-brand-gold">
              <DollarSign className="size-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-night-muted block">
                Monthly Salary Burden ($E_sal$)
              </span>
              <span className="text-xl font-bold text-brand-gold">
                {formatMoney(
                  convertAmount(total_monthly_salaries, selectedCurrency),
                  selectedCurrency
                )}
              </span>
            </div>
          </div>

          {/* Average Salary */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-night-muted block">
                Avg Salary / Staff
              </span>
              <span className="text-xl font-bold text-foreground dark:text-night-text">
                {formatMoney(convertAmount(avgSalary, selectedCurrency), selectedCurrency)}
              </span>
            </div>
          </div>
        </div>

        {/* Batch Editor Button */}
        {canUpdate('finance') && (
          <button
            onClick={onOpenBatchModal}
            className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent dark:bg-[#5B8FD4] text-accent-foreground dark:text-[#0B1528] font-semibold text-xs shadow-md hover:opacity-90 transition-all cursor-pointer"
          >
            <Edit3 className="size-4" />
            <span>
              <T k="finBatchUpdateSalaries" />
            </span>
          </button>
        )}
      </div>

      {/* Department Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setSelectedDeptId('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            selectedDeptId === 'all'
              ? 'bg-brand-gold/15 text-brand-gold border border-brand-gold/30'
              : 'bg-surface dark:bg-night-surface text-muted border border-border/50 hover:text-foreground'
          }`}
        >
          All Departments ({departments.length})
        </button>
        {departments.map((dept) => (
          <button
            key={dept.department_id}
            onClick={() => setSelectedDeptId(dept.department_id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              selectedDeptId === dept.department_id
                ? 'bg-brand-gold/15 text-brand-gold border border-brand-gold/30'
                : 'bg-surface dark:bg-night-surface text-muted border border-border/50 hover:text-foreground'
            }`}
          >
            {dept.department_name} ({dept.employee_count})
          </button>
        ))}
      </div>

      {/* Department Groups List */}
      <div className="flex flex-col gap-6">
        {filteredDepts.map((dept) => (
          <div
            key={dept.department_id}
            className="p-6 rounded-2xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border shadow-sm flex flex-col gap-4"
          >
            {/* Department Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/50 dark:border-night-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-royal/10 dark:bg-night-field text-brand-royal dark:text-[#5B8FD4]">
                  <Building2 className="size-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground dark:text-night-text">
                    {dept.department_name}
                  </h3>
                  <span className="text-[11px] text-muted dark:text-night-muted">
                    {dept.employee_count} registered employee{dept.employee_count === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-muted dark:text-night-muted block uppercase font-semibold">
                  Dept Fixed Salary Total
                </span>
                <span className="text-sm font-bold text-brand-gold">
                  {formatMoney(
                    convertAmount(dept.total_fixed_salary, selectedCurrency),
                    selectedCurrency
                  )}
                </span>
              </div>
            </div>

            {/* Employee Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dept.employees.map((emp) => {
                const isEditing = editingEmpId === emp.id;
                const isSaving = savingEmpId === emp.id;

                return (
                  <motion.div
                    key={emp.id}
                    layout
                    className="p-4 rounded-xl border border-border/60 dark:border-night-border bg-background/50 dark:bg-night-field/50 flex flex-col justify-between gap-3 shadow-2xs hover:border-brand-gold/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        className="size-10 rounded-full border border-brand-gold/30 flex items-center justify-center font-bold text-xs shrink-0"
                        style={{
                          backgroundColor: emp.color ? `${emp.color}20` : '#0F2D5C20',
                          color: emp.color || '#C8A96A',
                        }}
                      >
                        {emp.first_name?.[0]}
                        {emp.last_name?.[0] || 'Y'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground dark:text-night-text truncate">
                          {emp.full_name}
                        </p>
                        <p className="text-[11px] text-muted dark:text-night-muted truncate">
                          {emp.phone || 'No phone'}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          emp.is_active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {emp.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Salary Field / Editor */}
                    <div className="pt-2 border-t border-border/40 dark:border-night-border flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted dark:text-night-muted font-medium">
                        Fixed Salary:
                      </span>

                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <div className="relative w-24">
                            <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-muted text-xs">
                              {emp.currency === 'UZS' ? "so'm" : emp.currency === 'RUB' ? '₽' : '$'}
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editSalaryValue}
                              onChange={(e) => setEditSalaryValue(e.target.value)}
                              className={`w-full pr-1 py-1 bg-surface dark:bg-night-surface border border-brand-gold rounded-lg text-xs font-bold text-foreground dark:text-night-text focus:outline-none ${
                                emp.currency === 'UZS' ? 'pl-10' : 'pl-5'
                              }`}
                            />
                          </div>
                          <button
                            disabled={isSaving}
                            onClick={() => handleSaveSingleSalary(emp.id)}
                            className="p-1 rounded-lg bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                          >
                            {isSaving ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Check className="size-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground dark:text-night-text">
                            {formatMoney(emp.fixed_salary || 0, emp.currency || 'UZS')}
                          </span>
                          {canUpdate('finance') && (
                            <button
                              onClick={() => handleStartEdit(emp)}
                              className="p-1 rounded-lg text-muted hover:text-brand-gold hover:bg-brand-gold/10 transition-colors cursor-pointer"
                              title="Edit Salary"
                            >
                              <Edit3 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
