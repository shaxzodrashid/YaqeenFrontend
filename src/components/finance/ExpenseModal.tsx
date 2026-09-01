import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Receipt,
  Zap,
  Building,
  Banknote,
  Sparkles,
  Award,
  Utensils,
  Tag,
  Calendar as CalendarIcon,
  DollarSign,
  AlignLeft,
  Loader2,
  Coins,
  User,
  ChevronDown,
  Check,
  Info,
  Truck,
  Warehouse,
  Briefcase,
  FileCheck,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { T } from '../T';
import { api } from '../../services/api';
import type {
  Expense,
  ExpenseCategory,
  ExpenseSection,
  CreateExpenseDto,
  UpdateExpenseDto,
  SupportedCurrency,
} from '../../services/api';
import { FTL_EXPENSE_CATEGORIES, LTL_EXPENSE_CATEGORIES } from '../../services/api';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expenseToEdit?: Expense | null;
  defaultCurrency?: SupportedCurrency;
  defaultCategory?: ExpenseCategory;
  defaultSection?: ExpenseSection;
}

export const CATEGORY_CONFIG: Record<
  ExpenseCategory,
  {
    labelKey: string;
    defaultLabel: string;
    descriptionKey: string;
    icon: any;
    colorClass: string;
    bgClass: string;
    borderClass: string;
  }
> = {
  tax: {
    labelKey: 'finCatTax',
    defaultLabel: 'Nalog',
    descriptionKey: 'Government taxes, official fees, legal payments',
    icon: Receipt,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-500/10 dark:bg-amber-500/15',
    borderClass: 'border-amber-500/30',
  },
  utility: {
    labelKey: 'finCatUtility',
    defaultLabel: 'Komunalka',
    descriptionKey: 'Electricity, internet, water, office utilities',
    icon: Zap,
    colorClass: 'text-yellow-600 dark:text-yellow-400',
    bgClass: 'bg-yellow-500/10 dark:bg-yellow-500/15',
    borderClass: 'border-yellow-500/30',
  },
  rent: {
    labelKey: 'finCatRent',
    defaultLabel: 'Arenda',
    descriptionKey: 'Office space rent, warehouse space rent',
    icon: Building,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-500/10 dark:bg-blue-500/15',
    borderClass: 'border-blue-500/30',
  },
  salary_payout: {
    labelKey: 'finCatSalaryPayout',
    defaultLabel: 'Oylik',
    descriptionKey: 'Manual cash or card salary payouts',
    icon: Banknote,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    borderClass: 'border-emerald-500/30',
  },
  cleaner: {
    labelKey: 'finCatCleaner',
    defaultLabel: 'Cleaning',
    descriptionKey: 'Office cleaning services, sanitation supplies',
    icon: Sparkles,
    colorClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-500/10 dark:bg-purple-500/15',
    borderClass: 'border-purple-500/30',
  },
  kpi: {
    labelKey: 'finCatKpi',
    defaultLabel: 'KPI bonus',
    descriptionKey: 'Employee KPI payouts, performance bonuses, incentives',
    icon: Award,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    borderClass: 'border-indigo-500/30',
  },
  food: {
    labelKey: 'finCatFood',
    defaultLabel: 'Pitaniya',
    descriptionKey: 'Staff meals, office tea/coffee, snacks, food supplies',
    icon: Utensils,
    colorClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-500/10 dark:bg-orange-500/15',
    borderClass: 'border-orange-500/30',
  },
  other: {
    labelKey: 'finCatOther',
    defaultLabel: 'Prochiy',
    descriptionKey: 'Miscellaneous unclassified operational costs',
    icon: Tag,
    colorClass: 'text-slate-600 dark:text-slate-400',
    bgClass: 'bg-slate-500/10 dark:bg-slate-500/15',
    borderClass: 'border-slate-500/30',
  },
  china_warehouse: {
    labelKey: 'finCatChinaWarehouse',
    defaultLabel: 'Xitoy sklad',
    descriptionKey: 'China consolidation warehouse storage & handling costs',
    icon: Warehouse,
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    bgClass: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    borderClass: 'border-cyan-500/30',
  },
  firm_service: {
    labelKey: 'finCatFirmService',
    defaultLabel: 'Firma usluga',
    descriptionKey: 'Third-party agency fees, brokerage, partner firm fees',
    icon: Briefcase,
    colorClass: 'text-sky-600 dark:text-sky-400',
    bgClass: 'bg-sky-500/10 dark:bg-sky-500/15',
    borderClass: 'border-sky-500/30',
  },
  declarant: {
    labelKey: 'finCatDeclarant',
    defaultLabel: 'Deklarant',
    descriptionKey: 'Customs declaration processing and declarant fees',
    icon: FileCheck,
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-500/10 dark:bg-rose-500/15',
    borderClass: 'border-rose-500/30',
  },
};

const PRESET_MAP: Record<SupportedCurrency, number[]> = {
  USD: [25, 50, 100, 250, 500, 1000],
  UZS: [500000, 1000000, 2500000, 5000000, 10000000],
  RUB: [2500, 5000, 10000, 25000, 50000],
  RMB: [200, 500, 1000, 2500, 5000],
  CNY: [200, 500, 1000, 2500, 5000],
};

function formatPresetLabel(val: number, curr: SupportedCurrency): string {
  if (curr === 'UZS') {
    if (val >= 1000000) return `${val / 1000000}M so'm`;
    if (val >= 1000) return `${val / 1000}k so'm`;
    return `${val} so'm`;
  }
  if (curr === 'USD') return `$${val.toLocaleString()}`;
  if (curr === 'RUB') return `${val.toLocaleString()} ₽`;
  return `¥${val.toLocaleString()}`;
}

export function ExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  expenseToEdit,
  defaultCurrency = 'USD',
  defaultCategory,
  defaultSection = 'ftl',
}: ExpenseModalProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  const [section, setSection] = useState<ExpenseSection>(defaultSection);
  const [category, setCategory] = useState<ExpenseCategory>(defaultCategory || 'other');
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [currency, setCurrency] = useState<SupportedCurrency>(defaultCurrency);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [employeeId, setEmployeeId] = useState<string>('');
  const [employees, setEmployees] = useState<{ id: string; name: string; department?: string }[]>(
    []
  );
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);

  // Available categories for currently selected section
  const availableCategories = useMemo(() => {
    return section === 'ftl' ? FTL_EXPENSE_CATEGORIES : LTL_EXPENSE_CATEGORIES;
  }, [section]);

  // Fetch employees list for dropdown selection
  useEffect(() => {
    if (!isOpen) return;
    const fetchEmployeesList = async () => {
      setLoadingEmployees(true);
      try {
        const empRes = await api.employees.list({ limit: 100 });
        if (empRes?.items && empRes.items.length > 0) {
          setEmployees(
            empRes.items.map((emp) => ({
              id: emp.id,
              name: `${emp.first_name} ${emp.last_name}`.trim(),
              department: emp.department_display_name || emp.department_name || '',
            }))
          );
        } else {
          const finRes = await api.finance.getFixedSalaries();
          const list: { id: string; name: string; department?: string }[] = [];
          finRes.departments?.forEach((dept) => {
            dept.employees?.forEach((emp) => {
              list.push({
                id: emp.id,
                name: emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
                department: dept.department_name,
              });
            });
          });
          setEmployees(list);
        }
      } catch {
        try {
          const finRes = await api.finance.getFixedSalaries();
          const list: { id: string; name: string; department?: string }[] = [];
          finRes.departments?.forEach((dept) => {
            dept.employees?.forEach((emp) => {
              list.push({
                id: emp.id,
                name: emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
                department: dept.department_name,
              });
            });
          });
          setEmployees(list);
        } catch {
          setEmployees([]);
        }
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployeesList();
  }, [isOpen]);

  // Sync state on edit / open
  useEffect(() => {
    if (expenseToEdit) {
      const editSec = expenseToEdit.section || defaultSection || 'ftl';
      setSection(editSec);
      setCategory(expenseToEdit.category);
      setCurrency(expenseToEdit.currency || defaultCurrency);
      setAmount(String(expenseToEdit.amount));
      setDescription(expenseToEdit.description);
      setExpenseDate(expenseToEdit.expense_date.split('T')[0]);
      setEmployeeId(expenseToEdit.employee_id || '');
    } else {
      const initialSec = defaultSection || 'ftl';
      setSection(initialSec);
      const initialCat = defaultCategory || (initialSec === 'ftl' ? 'other' : 'food');
      setCategory(initialCat);
      setCurrency(defaultCurrency);
      setAmount('');
      setDescription('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setEmployeeId('');
    }
  }, [expenseToEdit, isOpen, defaultCurrency, defaultCategory, defaultSection]);

  // Handle section switch - auto-correct category if not available in new section
  const handleSectionChange = (newSec: ExpenseSection) => {
    setSection(newSec);
    const validCats = newSec === 'ftl' ? FTL_EXPENSE_CATEGORIES : LTL_EXPENSE_CATEGORIES;
    if (!validCats.includes(category)) {
      setCategory(newSec === 'ftl' ? 'other' : 'food');
    }
  };

  const isSalaryPayout = category === 'salary_payout';

  const presets = useMemo(() => {
    return PRESET_MAP[currency] || PRESET_MAP.USD;
  }, [currency]);

  const setDateOffset = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setExpenseDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showNotification(t('finWarnValidAmount'), 'warning');
      return;
    }
    if (!description.trim()) {
      showNotification(t('finWarnEnterDesc'), 'warning');
      return;
    }

    if (isSalaryPayout && !employeeId) {
      showNotification(t('finWarnSelectEmployee'), 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (expenseToEdit) {
        const dto: UpdateExpenseDto = {
          section,
          category,
          amount: parsedAmount,
          currency,
          description: description.trim(),
          expense_date: expenseDate,
          ...(category === 'salary_payout' && employeeId ? { employee_id: employeeId } : {}),
        };
        await api.finance.updateExpense(expenseToEdit.id, dto);
        showNotification(t('finNotifUpdated'), 'success');
      } else {
        const dto: CreateExpenseDto = {
          section,
          category,
          amount: parsedAmount,
          currency,
          description: description.trim(),
          expense_date: expenseDate,
          ...(category === 'salary_payout' && employeeId ? { employee_id: employeeId } : {}),
        };
        await api.finance.createExpense(dto);
        showNotification(t('finNotifCreated'), 'success');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const errMsg = err?.message || err?.data?.message || t('finNotifSaveFailed');
      showNotification(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="relative w-full max-w-lg bg-surface dark:bg-night-surface border border-border dark:border-night-border rounded-3xl shadow-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 dark:border-night-border bg-background/50 dark:bg-night-field/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-brand-gold/15 text-brand-gold border border-brand-gold/25 shadow-2xs">
                  <DollarSign className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground dark:text-night-text">
                    {expenseToEdit ? t('finEditExpense') : t('finAddExpense')}
                  </h3>
                  <p className="text-xs text-muted dark:text-night-muted">
                    {expenseToEdit ? t('finEditExpenseSubtitle') : t('finAddExpenseSubtitle')}
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

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto"
            >
              {/* Business Section Selector (FTL vs LTL) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted dark:text-night-muted mb-2">
                  <T k="finSelectSection" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* FTL Segment Button */}
                  <button
                    type="button"
                    onClick={() => handleSectionChange('ftl')}
                    className={`relative flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer text-left shadow-2xs ${
                      section === 'ftl'
                        ? 'bg-blue-500/10 border-blue-500/50 ring-2 ring-blue-500/30'
                        : 'bg-field-background dark:bg-night-field border-border/70 hover:border-blue-500/30'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        section === 'ftl'
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'bg-border/30 text-muted'
                      }`}
                    >
                      <Truck className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className={`text-xs font-extrabold block ${
                          section === 'ftl'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-foreground dark:text-night-text'
                        }`}
                      >
                        FTL
                      </span>
                    </div>
                    {section === 'ftl' && (
                      <Check className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                  </button>

                  {/* LTL Segment Button */}
                  <button
                    type="button"
                    onClick={() => handleSectionChange('ltl')}
                    className={`relative flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer text-left shadow-2xs ${
                      section === 'ltl'
                        ? 'bg-emerald-500/10 border-emerald-500/50 ring-2 ring-emerald-500/30'
                        : 'bg-field-background dark:bg-night-field border-border/70 hover:border-emerald-500/30'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        section === 'ltl'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-border/30 text-muted'
                      }`}
                    >
                      <Warehouse className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className={`text-xs font-extrabold block ${
                          section === 'ltl'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-foreground dark:text-night-text'
                        }`}
                      >
                        LTL
                      </span>
                    </div>
                    {section === 'ltl' && (
                      <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {/* Category Selector Dropdown */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted dark:text-night-muted">
                    <T k="finExpenseCategory" />
                  </label>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                      section === 'ftl'
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25'
                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                    }`}
                  >
                    {section.toUpperCase()} Categories ({availableCategories.length})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-field-background dark:bg-night-field border border-border/80 dark:border-night-border rounded-2xl text-sm font-semibold text-foreground dark:text-night-text focus:outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer transition-all duration-150 shadow-2xs hover:border-brand-gold/40"
                >
                  <div className="flex items-center gap-3">
                    {(() => {
                      const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
                      const Icon = cfg.icon;
                      return (
                        <>
                          <div className={`p-2 rounded-xl ${cfg.bgClass} ${cfg.colorClass}`}>
                            <Icon className="size-4 shrink-0" />
                          </div>
                          <div className="text-left">
                            <span className="block text-sm font-bold text-foreground dark:text-night-text">
                              {t(cfg.labelKey) || cfg.defaultLabel}
                            </span>
                            <span className="block text-[11px] text-muted dark:text-night-muted">
                              {cfg.descriptionKey}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <ChevronDown
                    className={`size-4 text-muted transition-transform duration-200 ${isCatDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Click-away backdrop */}
                {isCatDropdownOpen && (
                  <div className="fixed inset-0 z-10" onClick={() => setIsCatDropdownOpen(false)} />
                )}

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isCatDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute left-0 right-0 mt-2 bg-surface dark:bg-night-surface border border-border dark:border-night-border rounded-2xl shadow-2xl z-20 max-h-64 overflow-y-auto p-1.5 flex flex-col gap-1"
                    >
                      {availableCategories.map((catKey) => {
                        const cfg = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.other;
                        const Icon = cfg.icon;
                        const isSelected = category === catKey;
                        return (
                          <button
                            key={catKey}
                            type="button"
                            onClick={() => {
                              setCategory(catKey);
                              setIsCatDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-border/20 dark:hover:bg-night-field transition-colors text-left text-xs font-semibold text-foreground dark:text-night-text cursor-pointer ${
                              isSelected ? 'bg-brand-gold/10 border border-brand-gold/30' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${cfg.bgClass} ${cfg.colorClass}`}>
                                <Icon className="size-4 shrink-0" />
                              </div>
                              <div>
                                <span className="font-bold block text-foreground dark:text-night-text">
                                  {t(cfg.labelKey) || cfg.defaultLabel}
                                </span>
                                <span className="text-[10px] text-muted dark:text-night-muted block">
                                  {cfg.descriptionKey}
                                </span>
                              </div>
                            </div>
                            {isSelected && <Check className="size-4 text-brand-gold shrink-0" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Select Employee Field (Conditional for salary_payout) */}
              <AnimatePresence initial={false}>
                {isSalaryPayout && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    className="overflow-hidden p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col gap-2.5"
                  >
                    <label className="block text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="size-4 text-emerald-600 dark:text-emerald-400" />
                        <span>
                          <T k="finSelectEmployee" />
                        </span>
                        <span className="text-rose-500 font-bold">*</span>
                      </span>
                      <span className="text-[10px] text-rose-500 font-normal lowercase">
                        <T k="finSalaryPayoutRequired" />
                      </span>
                    </label>

                    <div className="relative">
                      <select
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        required={isSalaryPayout}
                        className={`w-full py-2.5 px-3.5 bg-surface dark:bg-night-surface border rounded-xl text-xs font-semibold text-foreground dark:text-night-text focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors cursor-pointer ${
                          !employeeId
                            ? 'border-rose-500/70 focus:border-rose-500'
                            : 'border-emerald-500/30'
                        }`}
                      >
                        <option value="">{t('finSelectEmployeePlaceholder')}</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} {emp.department ? `(${emp.department})` : ''}
                          </option>
                        ))}
                      </select>
                      {loadingEmployees && (
                        <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none text-muted">
                          <Loader2 className="size-4 animate-spin text-emerald-500" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                      <Info className="size-3.5 shrink-0" />
                      <span>
                        Directly linked to employee payout ledger & deducted from company funds.
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Combined Amount & Currency Selector */}
              <div>
                <div className="flex gap-3">
                  {/* Amount Input */}
                  <div className="flex-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted dark:text-night-muted mb-1.5">
                      <T k="finFieldAmount" />
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted dark:text-night-muted font-bold text-xs">
                        {currency === 'USD'
                          ? '$'
                          : currency === 'RUB'
                            ? '₽'
                            : currency === 'CNY' || currency === 'RMB'
                              ? '¥'
                              : "SO'M"}
                      </div>
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        required
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-14 pr-4 py-2.5 bg-field-background dark:bg-night-field border border-border/80 dark:border-night-border rounded-xl text-sm font-bold text-foreground dark:text-night-text focus:outline-none focus:ring-2 focus:ring-brand-gold/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Currency Dropdown Select */}
                  <div className="w-36 shrink-0">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted dark:text-night-muted mb-1.5 flex items-center gap-1">
                      <Coins className="size-3.5 text-brand-gold" />
                      <span>
                        <T k="finFieldCurrency" />
                      </span>
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
                      className="w-full py-2.5 px-3 bg-field-background dark:bg-night-field border border-border/80 dark:border-night-border rounded-xl text-xs font-bold text-foreground dark:text-night-text focus:outline-none focus:ring-2 focus:ring-brand-gold/50 transition-colors cursor-pointer"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="UZS">UZS (so'm)</option>
                      <option value="RUB">RUB (₽)</option>
                      <option value="CNY">CNY / RMB (¥)</option>
                    </select>
                  </div>
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                  <span className="text-[11px] text-muted dark:text-night-muted mr-1 font-semibold">
                    <T k="finQuickPresets" />
                  </span>
                  {presets.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(String(val))}
                      className="px-2.5 py-1 text-xs rounded-lg border border-border/60 dark:border-night-border bg-surface dark:bg-night-surface hover:bg-brand-gold/15 hover:border-brand-gold/40 hover:text-brand-gold transition-colors cursor-pointer text-muted dark:text-night-muted font-bold shadow-2xs"
                    >
                      +{formatPresetLabel(val, currency)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expense Date & Quick Date Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted dark:text-night-muted">
                    <T k="finFieldExpenseDate" />
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDateOffset(0)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold border border-border/60 bg-surface dark:bg-night-surface hover:bg-brand-gold/10 hover:text-brand-gold transition-colors text-muted cursor-pointer"
                    >
                      <T k="finDateToday" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateOffset(-1)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold border border-border/60 bg-surface dark:bg-night-surface hover:bg-brand-gold/10 hover:text-brand-gold transition-colors text-muted cursor-pointer"
                    >
                      <T k="finDateYesterday" />
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted dark:text-night-muted">
                    <CalendarIcon className="size-4" />
                  </div>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-field-background dark:bg-night-field border border-border/80 dark:border-night-border rounded-xl text-sm font-semibold text-foreground dark:text-night-text focus:outline-none focus:ring-2 focus:ring-brand-gold/50 transition-colors"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted dark:text-night-muted mb-1.5">
                  <T k="finFieldDescription" />
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none text-muted dark:text-night-muted">
                    <AlignLeft className="size-4" />
                  </div>
                  <textarea
                    rows={3}
                    required
                    placeholder={t('finFieldDescPlaceholder')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-field-background dark:bg-night-field border border-border/80 dark:border-night-border rounded-xl text-xs text-foreground dark:text-night-text focus:outline-none focus:ring-2 focus:ring-brand-gold/50 transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/40 dark:border-night-border">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-muted hover:text-foreground dark:hover:text-night-text transition-colors cursor-pointer"
                >
                  <T k="finBtnCancel" />
                </button>
                <button
                  type="submit"
                  disabled={submitting || (isSalaryPayout && !employeeId)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent dark:bg-[#5B8FD4] text-accent-foreground dark:text-[#0B1528] font-bold text-xs shadow-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>{t('finBtnSaving')}</span>
                    </>
                  ) : (
                    <span>{expenseToEdit ? t('finBtnSaveChanges') : t('finBtnCreateExpense')}</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
