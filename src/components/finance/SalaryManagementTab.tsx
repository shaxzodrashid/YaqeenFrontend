import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  DollarSign,
  Building2,
  Edit3,
  Check,
  Loader2,
  TrendingUp,
  Search,
  Phone,
  X,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { T } from '../T';
import { usePermissions } from '../../context/PermissionsContext';
import { SalaryManagementSkeleton } from './FinanceSkeletons';
import { api, formatMoney } from '../../services/api';
import { NumberInput } from '../NumberInput';
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
  selectedCurrency = 'USD',
}: SalaryManagementTabProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canUpdate } = usePermissions();

  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [searchStaff, setSearchStaff] = useState<string>('');
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [editSalaryValue, setEditSalaryValue] = useState<string>('');
  const [editCurrencyValue, setEditCurrencyValue] = useState<SupportedCurrency>('USD');
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

  if (loading && !salaryData) {
    return <SalaryManagementSkeleton />;
  }

  if (!salaryData) {
    return (
      <div className="p-12 text-center bg-surface dark:bg-night-surface rounded-3xl border border-border dark:border-night-border">
        <p className="text-sm text-muted dark:text-night-muted">
          <T k="finNoSalaryData" />
        </p>
      </div>
    );
  }

  const { total_active_employees, total_monthly_salaries, departments } = salaryData;
  const avgSalary =
    total_active_employees > 0 ? total_monthly_salaries / total_active_employees : 0;

  const handleStartEdit = (emp: EmployeeSalaryInfo) => {
    setEditingEmpId(emp.id);
    setEditSalaryValue(String(emp.fixed_salary || 0));
    setEditCurrencyValue(emp.currency || 'USD');
  };

  const handleCancelEdit = () => {
    setEditingEmpId(null);
    setEditSalaryValue('');
  };

  const handleSaveSingleSalary = async (emp: EmployeeSalaryInfo) => {
    const parsed = parseFloat(editSalaryValue);
    if (isNaN(parsed) || parsed < 0) {
      showNotification(t('finWarnValidSalary'), 'warning');
      return;
    }
    setSavingEmpId(emp.id);
    try {
      await api.finance.updateEmployeeSalary(emp.id, {
        fixed_salary: parsed,
        currency: editCurrencyValue,
      });
      showNotification(t('finInlineSalarySaved', { name: emp.full_name }), 'success');
      setEditingEmpId(null);
      onRefresh();
    } catch (err: any) {
      showNotification(err?.message || t('finNotifSalaryUpdateFailed'), 'error');
    } finally {
      setSavingEmpId(null);
    }
  };

  // Filter departments & employees
  const filteredDepartments = departments
    .filter((dept) => selectedDeptId === 'all' || dept.department_id === selectedDeptId)
    .map((dept) => {
      if (!searchStaff.trim()) return dept;
      const term = searchStaff.toLowerCase().trim();
      const emps = dept.employees.filter(
        (emp) =>
          emp.full_name.toLowerCase().includes(term) ||
          (emp.phone && emp.phone.toLowerCase().includes(term))
      );
      return { ...dept, employees: emps, employee_count: emps.length };
    })
    .filter((dept) => dept.employees.length > 0 || !searchStaff.trim());

  return (
    <div
      className={`flex flex-col gap-6 relative transition-opacity duration-200 ${loading ? 'opacity-80' : 'opacity-100'}`}
    >
      {loading && (
        <div className="absolute -top-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-gold to-transparent animate-pulse z-20 rounded-full" />
      )}
      {/* Top Metrics Banner & Batch CTA */}
      <div className="p-6 rounded-3xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full md:w-auto">
          {/* Active Employees */}
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Users className="size-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted dark:text-night-muted block">
                <T k="finActiveStaff" />
              </span>
              <span className="text-xl font-extrabold text-foreground dark:text-night-text">
                {t('finEmployeesCount', { count: total_active_employees })}
              </span>
            </div>
          </div>

          {/* Total Monthly Salaries */}
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-brand-gold/15 text-brand-gold border border-brand-gold/25">
              <DollarSign className="size-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted dark:text-night-muted block">
                <T k="finMonthlySalaryBurden" />
              </span>
              <span className="text-xl font-extrabold text-brand-gold">
                {formatMoney(
                  convertAmount(total_monthly_salaries, selectedCurrency),
                  selectedCurrency
                )}
              </span>
            </div>
          </div>

          {/* Average Salary */}
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted dark:text-night-muted block">
                <T k="finAvgSalaryPerStaff" />
              </span>
              <span className="text-xl font-extrabold text-foreground dark:text-night-text">
                {formatMoney(convertAmount(avgSalary, selectedCurrency), selectedCurrency)}
              </span>
            </div>
          </div>
        </div>

        {/* Batch Editor Button */}
        {canUpdate('finance') && (
          <button
            onClick={onOpenBatchModal}
            className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl bg-accent dark:bg-[#5B8FD4] text-accent-foreground dark:text-[#0B1528] font-bold text-xs shadow-md hover:opacity-90 transition-all cursor-pointer"
          >
            <Edit3 className="size-4" />
            <span>
              <T k="finBatchUpdateSalaries" />
            </span>
          </button>
        )}
      </div>

      {/* Department Filter Pills & Staff Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Department Pills */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            onClick={() => setSelectedDeptId('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedDeptId === 'all'
                ? 'bg-brand-gold/15 text-brand-gold border border-brand-gold/40 shadow-2xs'
                : 'bg-surface dark:bg-night-surface text-muted border border-border/60 hover:text-foreground dark:hover:text-night-text'
            }`}
          >
            {t('finAllDepartments', { count: departments.length })}
          </button>
          {departments.map((dept) => (
            <button
              key={dept.department_id}
              onClick={() => setSelectedDeptId(dept.department_id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDeptId === dept.department_id
                  ? 'bg-brand-gold/15 text-brand-gold border border-brand-gold/40 shadow-2xs'
                  : 'bg-surface dark:bg-night-surface text-muted border border-border/60 hover:text-foreground dark:hover:text-night-text'
              }`}
            >
              {dept.department_name} ({dept.employee_count})
            </button>
          ))}
        </div>

        {/* Search Staff */}
        <div className="relative w-full sm:w-64">
          <Search className="size-4 absolute left-3 top-2.5 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder={t('finSearchStaff')}
            value={searchStaff}
            onChange={(e) => setSearchStaff(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface dark:bg-night-surface border border-border/80 dark:border-night-border rounded-xl text-xs font-semibold text-foreground dark:text-night-text focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
          />
        </div>
      </div>

      {/* Department Groups List */}
      <div className="flex flex-col gap-6">
        {filteredDepartments.length === 0 ? (
          <div className="p-12 text-center bg-surface dark:bg-night-surface rounded-3xl border border-border dark:border-night-border text-muted text-xs">
            <T k="finNoExpensesFoundForFilter" />
          </div>
        ) : (
          filteredDepartments.map((dept) => (
            <div
              key={dept.department_id}
              className="p-6 rounded-3xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border shadow-sm flex flex-col gap-4"
            >
              {/* Department Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border/50 dark:border-night-border">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-brand-royal/10 dark:bg-night-field text-brand-royal dark:text-[#5B8FD4] border border-brand-royal/20">
                    <Building2 className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground dark:text-night-text">
                      {dept.department_name}
                    </h3>
                    <span className="text-[11px] text-muted dark:text-night-muted">
                      {t('finDeptEmployeesBadge', { count: dept.employee_count })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted dark:text-night-muted block uppercase font-bold">
                    <T k="finDeptFixedSalaryTotal" />
                  </span>
                  <span className="text-sm font-extrabold text-brand-gold">
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
                      className="p-4 rounded-2xl border border-border/60 dark:border-night-border bg-background/40 dark:bg-night-field/40 flex flex-col justify-between gap-3 shadow-2xs hover:border-brand-gold/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div
                          className="size-10 rounded-2xl border border-brand-gold/30 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs"
                          style={{
                            backgroundColor: emp.color ? `${emp.color}20` : '#0F2D5C20',
                            color: emp.color || '#C8A96A',
                          }}
                        >
                          {emp.first_name?.[0] || emp.full_name?.[0] || 'U'}
                          {emp.last_name?.[0] || ''}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground dark:text-night-text truncate">
                            {emp.full_name}
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-muted dark:text-night-muted truncate mt-0.5">
                            <Phone className="size-3 shrink-0" />
                            <span>{emp.phone || t('finNoPhone')}</span>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            emp.is_active
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {emp.is_active ? t('finStatusActive') : t('finStatusInactive')}
                        </span>
                      </div>

                      {/* Salary Field / Inline Editor */}
                      <div className="pt-3 border-t border-border/40 dark:border-night-border flex items-center justify-between gap-2">
                        <span className="text-[11px] text-muted dark:text-night-muted font-semibold">
                          <T k="finLabelFixedSalary" />
                        </span>

                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <NumberInput
                              size="sm"
                              className="w-28"
                              min={0}
                              allowDecimals={true}
                              decimalScale={2}
                              value={editSalaryValue}
                              onValueChange={(_num, raw) => setEditSalaryValue(raw)}
                              placeholder="0"
                              prefix={
                                editCurrencyValue === 'USD'
                                  ? '$'
                                  : editCurrencyValue === 'RUB'
                                    ? '₽'
                                    : editCurrencyValue === 'CNY'
                                      ? '¥'
                                      : undefined
                              }
                              suffix={editCurrencyValue === 'UZS' ? "so'm" : undefined}
                            />
                            <select
                              value={editCurrencyValue}
                              onChange={(e) =>
                                setEditCurrencyValue(e.target.value as SupportedCurrency)
                              }
                              className="h-9 py-1 px-1 bg-surface dark:bg-night-surface border border-field-border dark:border-night-border rounded-lg text-[10px] font-bold text-foreground dark:text-night-text focus:outline-none cursor-pointer"
                            >
                              <option value="USD">USD</option>
                              <option value="UZS">UZS</option>
                              <option value="RUB">RUB</option>
                              <option value="CNY">CNY</option>
                            </select>
                            <button
                              disabled={isSaving}
                              onClick={() => handleSaveSingleSalary(emp)}
                              className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                              title={t('finInlineEditSave')}
                            >
                              {isSaving ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Check className="size-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="p-1.5 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title={t('finInlineEditCancel')}
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-foreground dark:text-night-text">
                              {formatMoney(emp.fixed_salary || 0, emp.currency || 'USD')}
                            </span>
                            {canUpdate('finance') && (
                              <button
                                onClick={() => handleStartEdit(emp)}
                                className="p-1.5 rounded-lg text-muted hover:text-brand-gold hover:bg-brand-gold/10 transition-colors cursor-pointer"
                                title={t('finEditSalaryTooltip')}
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
          ))
        )}
      </div>
    </div>
  );
}
