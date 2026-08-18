import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Filter,
  RefreshCw,
  RotateCcw,
  Package,
  User,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Search,
  SlidersHorizontal,
  Layers,
  MoreHorizontal,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { DashboardPeriod, DashboardFilterParams } from '../../types/dashboard';
import type { Employee, Client } from '../../services/api';
import { useTranslation, type Locale } from '../../context/LanguageContext';

interface DashboardFiltersProps {
  filters: DashboardFilterParams;
  onFilterChange: (newFilters: Partial<DashboardFilterParams>) => void;
  onReset: () => void;
  onRefresh: () => void;
  loading?: boolean;
  employees?: Employee[];
  clients?: Client[];
}

interface PeriodOption {
  labelKey?: string;
  shortLabel: string;
  value: DashboardPeriod;
}

const PRIMARY_PERIODS: PeriodOption[] = [
  { shortLabel: '1M', labelKey: 'ovPeriod1M', value: '1M' },
  { shortLabel: '6M', labelKey: 'ovPeriod6M', value: '6M' },
  { shortLabel: 'YTD', labelKey: 'ovPeriodYTD', value: 'YTD' },
  { shortLabel: '1Y', labelKey: 'ovPeriod1Y', value: '1Y' },
  { shortLabel: 'MAX', labelKey: 'ovPeriodMax', value: 'MAX' },
];

const EXTRA_PERIODS: PeriodOption[] = [
  { shortLabel: '1D', labelKey: 'ovPeriodToday', value: '1D' },
  { shortLabel: '5D', labelKey: 'ovPeriod5D', value: '5D' },
  { shortLabel: '5Y', labelKey: 'ovPeriod5Y', value: '5Y' },
];

const CURRENCIES = [
  { label: 'USD', symbol: '$', value: 'USD' },
  { label: 'UZS', symbol: "So'm", value: 'UZS' },
  { label: 'RUB', symbol: '₽', value: 'RUB' },
  { label: 'CNY', symbol: '¥', value: 'CNY' },
];

const MONTH_NAMES: Record<Locale, string[]> = {
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  ru: [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ],
  uz: [
    'Yanvar',
    'Fevral',
    'Mart',
    'Aprel',
    'May',
    'Iyun',
    'Iyul',
    'Avgust',
    'Sentabr',
    'Oktabr',
    'Noyabr',
    'Dekabr',
  ],
};

const SHORT_MONTH_NAMES: Record<Locale, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
  uz: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
};

const WEEKDAY_NAMES: Record<Locale, string[]> = {
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  uz: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'],
};

// Format Date object to 'YYYY-MM-DD' using local timezone
function formatYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse 'YYYY-MM-DD' string safely to local Date
function parseYMD(dateStr?: string): Date | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Calculate total inclusive days between start and end
function getDaysCount(startStr: string, endStr: string): number {
  const s = parseYMD(startStr);
  const e = parseYMD(endStr);
  if (!s || !e) return 0;
  const diffTime = Math.abs(e.getTime() - s.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// Format custom period button label nicely (e.g. "12 Feb – 19 Feb")
function formatCustomPeriodLabel(
  startDate?: string,
  endDate?: string,
  defaultLabel: string = 'Custom',
  locale: Locale = 'en'
): string {
  if (!startDate && !endDate) return defaultLabel;
  const s = parseYMD(startDate);
  const e = parseYMD(endDate);
  const mNames = SHORT_MONTH_NAMES[locale] || SHORT_MONTH_NAMES.en;

  if (s && e) {
    if (startDate === endDate) {
      return `${s.getDate()} ${mNames[s.getMonth()]}`;
    }
    if (s.getFullYear() !== e.getFullYear()) {
      return `${s.getDate()} ${mNames[s.getMonth()]} '${String(s.getFullYear()).slice(2)} – ${e.getDate()} ${mNames[e.getMonth()]} '${String(e.getFullYear()).slice(2)}`;
    }
    return `${s.getDate()} ${mNames[s.getMonth()]} – ${e.getDate()} ${mNames[e.getMonth()]}`;
  }
  if (s) {
    return `${s.getDate()} ${mNames[s.getMonth()]} → ...`;
  }
  if (e) {
    return `... → ${e.getDate()} ${mNames[e.getMonth()]}`;
  }
  return defaultLabel;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  onRefresh,
  loading = false,
  employees = [],
  clients = [],
}) => {
  const { t, locale } = useTranslation();
  const currentLocale = (locale in MONTH_NAMES ? locale : 'en') as Locale;
  const currentPeriod = filters.period || '1M';
  const isCustom = currentPeriod === 'CUSTOM';

  // Active popover tracker
  const [activePopover, setActivePopover] = useState<
    'cargo' | 'status' | 'manager' | 'client' | 'customDate' | 'morePeriods' | null
  >(null);

  // Search queries for dropdowns
  const [managerSearch, setManagerSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  // Expandable filters drawer/row state (auto-expanded if secondary filters are present)
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  // Custom date picker temporary selection & calendar view state
  const [tempRange, setTempRange] = useState<{ start: string; end: string }>({
    start: filters.start_date || '',
    end: filters.end_date || '',
  });
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const initialDate = parseYMD(filters.start_date) || parseYMD(filters.end_date) || new Date();
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  // Sync tempRange and calendar view month whenever external filter dates change
  useEffect(() => {
    setTempRange({
      start: filters.start_date || '',
      end: filters.end_date || '',
    });
    if (filters.start_date) {
      const parsed = parseYMD(filters.start_date);
      if (parsed) {
        setViewYear(parsed.getFullYear());
        setViewMonth(parsed.getMonth());
      }
    }
  }, [filters.start_date, filters.end_date]);

  // Popover container ref for click-outside detection
  const filterBarRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(event.target as Node)) {
        setActivePopover(null);
        setHoverDate(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActivePopover(null);
        setHoverDate(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filter lists & options
  const cargoTypes = [
    { label: t('ovAllCargoTypes'), value: '', icon: Layers },
    { label: 'FTL (Full Truck)', value: 'FTL', icon: Package },
    { label: 'LTL (Less Truck)', value: 'LTL', icon: Package },
  ];

  const statuses = [
    { label: t('ovAllStatuses'), value: '', color: 'bg-neutral-400' },
    { label: t('statusWaiting'), value: 'Waiting', color: 'bg-amber-500' },
    { label: t('statusStation'), value: 'Station', color: 'bg-blue-500' },
    { label: t('statusOnTheWay'), value: 'On the way', color: 'bg-cyan-500' },
    { label: t('statusOnTheBorder'), value: 'On the border', color: 'bg-violet-500' },
    { label: t('statusReload'), value: 'Reload', color: 'bg-orange-500' },
    { label: t('statusArrived'), value: 'Arrived', color: 'bg-emerald-500' },
  ];

  // Filtered managers & clients with search
  const filteredEmployees = useMemo(() => {
    if (!managerSearch.trim()) return employees;
    const q = managerSearch.toLowerCase();
    return employees.filter((emp) => {
      const name = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
      const phone = (emp.phone || '').toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }, [employees, managerSearch]);

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const q = clientSearch.toLowerCase();
    return clients.filter((cli) => {
      const name = `${cli.first_name || ''} ${cli.last_name || ''}`.toLowerCase();
      const company = (cli.company_name || '').toLowerCase();
      const phone = (cli.phone || '').toLowerCase();
      return name.includes(q) || company.includes(q) || phone.includes(q);
    });
  }, [clients, clientSearch]);

  // Selected names for friendly display
  const selectedEmployeeName = useMemo(() => {
    if (!filters.employee_id) return null;
    const emp = employees.find((e) => e.id === filters.employee_id);
    if (!emp) return null;
    return `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.phone || 'Manager';
  }, [employees, filters.employee_id]);

  const selectedClientName = useMemo(() => {
    if (!filters.client_id) return null;
    const cli = clients.find((c) => c.id === filters.client_id);
    if (!cli) return null;
    return (
      cli.company_name ||
      `${cli.first_name || ''} ${cli.last_name || ''}`.trim() ||
      cli.phone ||
      'Client'
    );
  }, [clients, filters.client_id]);

  // Check if current period is one of the extra periods (1D, 5D, 5Y)
  const isExtraPeriodActive = EXTRA_PERIODS.some((p) => p.value === currentPeriod);

  // Count active non-default filters
  const activeSecondaryFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.cargo_type) count++;
    if (filters.status) count++;
    if (filters.employee_id) count++;
    if (filters.client_id) count++;
    return count;
  }, [filters]);

  const hasAnyCustomFilters =
    activeSecondaryFiltersCount > 0 ||
    filters.period !== '1M' ||
    Boolean(filters.start_date || filters.end_date) ||
    (filters.currency && filters.currency !== 'USD');

  // Month navigation helpers for calendar
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Quick date presets for custom range
  const handleApplyPreset = (
    preset:
      | 'today'
      | 'yesterday'
      | 'thisWeek'
      | 'last7'
      | 'thisMonth'
      | 'lastMonth'
      | 'last30'
      | 'last90'
      | 'thisYear'
  ) => {
    const today = new Date();
    let start = '';
    let end = formatYMD(today);

    if (preset === 'today') {
      start = end;
    } else if (preset === 'yesterday') {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      start = formatYMD(d);
      end = start;
    } else if (preset === 'thisWeek') {
      const d = new Date(today);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
      d.setDate(diff);
      start = formatYMD(d);
    } else if (preset === 'last7') {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      start = formatYMD(d);
    } else if (preset === 'thisMonth') {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      start = formatYMD(d);
    } else if (preset === 'lastMonth') {
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      start = formatYMD(firstDayLastMonth);
      end = formatYMD(lastDayLastMonth);
    } else if (preset === 'last30') {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      start = formatYMD(d);
    } else if (preset === 'last90') {
      const d = new Date(today);
      d.setDate(d.getDate() - 89);
      start = formatYMD(d);
    } else if (preset === 'thisYear') {
      const d = new Date(today.getFullYear(), 0, 1);
      start = formatYMD(d);
    }

    setTempRange({ start, end });
    onFilterChange({
      period: 'CUSTOM',
      start_date: start,
      end_date: end,
    });

    const sDate = parseYMD(start);
    if (sDate) {
      setViewYear(sDate.getFullYear());
      setViewMonth(sDate.getMonth());
    }
    setActivePopover(null);
    setHoverDate(null);
  };

  // Day click logic in the calendar grid
  const handleDayClick = (dateStr: string) => {
    const { start, end } = tempRange;

    // Case 1: No start yet, or range already complete -> pick start fresh
    if (!start || (start && end)) {
      setTempRange({ start: dateStr, end: '' });
      setHoverDate(null);
      return;
    }

    // Case 2: Start is set, waiting for End
    if (start && !end) {
      if (dateStr < start) {
        // User clicked a date earlier than start -> reset start date to this earlier date
        setTempRange({ start: dateStr, end: '' });
      } else {
        // Range completed!
        setTempRange({ start, end: dateStr });
        onFilterChange({
          period: 'CUSTOM',
          start_date: start,
          end_date: dateStr,
        });
        setHoverDate(null);
        setActivePopover(null);
      }
    }
  };

  // Apply button handler for manual inputs
  const handleApplyManualDates = () => {
    if (!tempRange.start && !tempRange.end) {
      setActivePopover(null);
      return;
    }
    let s = tempRange.start;
    let e = tempRange.end;
    if (s && e && s > e) {
      const tmp = s;
      s = e;
      e = tmp;
    }
    onFilterChange({
      period: 'CUSTOM',
      start_date: s || undefined,
      end_date: e || undefined,
    });
    setActivePopover(null);
    setHoverDate(null);
  };

  // Clear custom dates
  const handleClearCustomDates = () => {
    setTempRange({ start: '', end: '' });
    setHoverDate(null);
    onFilterChange({
      period: '1M',
      start_date: undefined,
      end_date: undefined,
    });
    setActivePopover(null);
  };

  // Generate 42 calendar grid cells (current month with padding from prev and next)
  const calendarCells = useMemo(() => {
    const cells: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const firstDayDate = new Date(viewYear, viewMonth, 1);
    // Sunday is 0 in JS Date. Convert so Monday = 0, Sunday = 6
    let firstDayIndex = firstDayDate.getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6;

    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const todayStr = formatYMD(new Date());

    // 1. Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(viewYear, viewMonth - 1, dayNum);
      const dateStr = formatYMD(prevDate);
      cells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // 2. Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const curDate = new Date(viewYear, viewMonth, day);
      const dateStr = formatYMD(curDate);
      cells.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // 3. Next month leading days to complete full grid (multiple of 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextDate = new Date(viewYear, viewMonth + 1, day);
      const dateStr = formatYMD(nextDate);
      cells.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const customButtonLabel = useMemo(() => {
    if (isCustom && (filters.start_date || filters.end_date)) {
      return formatCustomPeriodLabel(
        filters.start_date,
        filters.end_date,
        t('ovPeriodCustom'),
        currentLocale
      );
    }
    return t('ovPeriodCustom');
  }, [isCustom, filters.start_date, filters.end_date, t, currentLocale]);

  return (
    <div
      ref={filterBarRef}
      className="relative flex flex-col gap-3 p-3.5 sm:p-4 rounded-2xl bg-surface/95 dark:bg-night-surface/95 border border-border/60 dark:border-night-border/70 backdrop-blur-xl shadow-xs transition-all duration-300"
    >
      {/* ── TOP COMMAND ROW ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left cluster: Period Pill Switcher & Currency */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe Segmented Control Capsule */}
          <div className="flex flex-wrap items-center p-1 bg-border/20 dark:bg-night-border/50 rounded-xl border border-border/30 dark:border-night-border/30 relative">
            {PRIMARY_PERIODS.map((opt) => {
              const isActive = currentPeriod === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onFilterChange({
                      period: opt.value,
                      start_date: undefined,
                      end_date: undefined,
                    });
                    setActivePopover(null);
                  }}
                  className={`relative px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer select-none flex items-center gap-1.5 ${
                    isActive
                      ? 'text-neutral-950 font-bold'
                      : 'text-muted dark:text-night-muted hover:text-foreground dark:hover:text-night-text hover:bg-surface/50 dark:hover:bg-night-surface/50'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="overviewActivePeriod"
                      className="absolute inset-0 bg-brand-gold rounded-lg shadow-xs"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">
                    {opt.labelKey ? t(opt.labelKey) : opt.shortLabel}
                  </span>
                </button>
              );
            })}

            {/* Custom Period Button with Direct Popover Anchor */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (!isCustom) {
                    onFilterChange({ period: 'CUSTOM' });
                  }
                  setActivePopover(activePopover === 'customDate' ? null : 'customDate');
                }}
                className={`relative px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer select-none flex items-center gap-1.5 ${
                  isCustom
                    ? 'text-neutral-950 font-bold'
                    : 'text-muted dark:text-night-muted hover:text-foreground dark:hover:text-night-text hover:bg-surface/50 dark:hover:bg-night-surface/50'
                }`}
              >
                {isCustom && (
                  <motion.div
                    layoutId="overviewActivePeriod"
                    className="absolute inset-0 bg-brand-gold rounded-lg shadow-xs"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Calendar className="size-3.5 shrink-0" />
                  <span>{customButtonLabel}</span>
                  <ChevronDown
                    className={`size-3 transition-transform duration-200 opacity-70 ${
                      activePopover === 'customDate' ? 'rotate-180' : ''
                    }`}
                  />
                </span>
              </button>

              {/* Custom Date Range Popover */}
              <AnimatePresence>
                {activePopover === 'customDate' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 z-50 w-[310px] sm:w-[350px] p-3.5 rounded-2xl bg-surface dark:bg-night-surface border border-border dark:border-night-border shadow-2xl backdrop-blur-xl space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground dark:text-night-text">
                        <Calendar className="size-3.5 text-brand-gold" />
                        <span>{t('selectDateRange')}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActivePopover(null)}
                        className="p-1 rounded-md text-muted hover:text-foreground dark:hover:text-night-text cursor-pointer transition-colors"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>

                    {/* Quick Presets Grid */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                        <Sparkles className="size-3 text-brand-gold" />
                        <span>{t('presetLabel')}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('today')}
                          className="px-2 py-1 rounded-lg bg-border/20 dark:bg-night-border/40 hover:bg-brand-gold/20 text-muted hover:text-foreground dark:text-night-muted dark:hover:text-night-text transition-colors text-center font-medium cursor-pointer"
                        >
                          {t('presetToday')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('yesterday')}
                          className="px-2 py-1 rounded-lg bg-border/20 dark:bg-night-border/40 hover:bg-brand-gold/20 text-muted hover:text-foreground dark:text-night-muted dark:hover:text-night-text transition-colors text-center font-medium cursor-pointer"
                        >
                          {t('presetYesterday')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('thisWeek')}
                          className="px-2 py-1 rounded-lg bg-border/20 dark:bg-night-border/40 hover:bg-brand-gold/20 text-muted hover:text-foreground dark:text-night-muted dark:hover:text-night-text transition-colors text-center font-medium cursor-pointer"
                        >
                          {t('presetThisWeek')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('last7')}
                          className="px-2 py-1 rounded-lg bg-border/20 dark:bg-night-border/40 hover:bg-brand-gold/20 text-muted hover:text-foreground dark:text-night-muted dark:hover:text-night-text transition-colors text-center font-medium cursor-pointer"
                        >
                          {t('presetLast7Days')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('thisMonth')}
                          className="px-2 py-1 rounded-lg bg-border/20 dark:bg-night-border/40 hover:bg-brand-gold/20 text-muted hover:text-foreground dark:text-night-muted dark:hover:text-night-text transition-colors text-center font-medium cursor-pointer"
                        >
                          {t('presetThisMonth')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('lastMonth')}
                          className="px-2 py-1 rounded-lg bg-border/20 dark:bg-night-border/40 hover:bg-brand-gold/20 text-muted hover:text-foreground dark:text-night-muted dark:hover:text-night-text transition-colors text-center font-medium cursor-pointer"
                        >
                          {t('presetLastMonth')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('last30')}
                          className="px-2 py-1 rounded-lg bg-border/20 dark:bg-night-border/40 hover:bg-brand-gold/20 text-muted hover:text-foreground dark:text-night-muted dark:hover:text-night-text transition-colors text-center font-medium cursor-pointer"
                        >
                          {t('presetLast30Days')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('last90')}
                          className="px-2 py-1 rounded-lg bg-border/20 dark:bg-night-border/40 hover:bg-brand-gold/20 text-muted hover:text-foreground dark:text-night-muted dark:hover:text-night-text transition-colors text-center font-medium cursor-pointer"
                        >
                          {t('presetLast90Days')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('thisYear')}
                          className="px-2 py-1 rounded-lg bg-border/20 dark:bg-night-border/40 hover:bg-brand-gold/20 text-muted hover:text-foreground dark:text-night-muted dark:hover:text-night-text transition-colors text-center font-medium cursor-pointer"
                        >
                          {t('presetThisYear')}
                        </button>
                      </div>
                    </div>

                    {/* Calendar Month & Navigation */}
                    <div className="pt-2 border-t border-border/40 dark:border-night-border/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={handlePrevMonth}
                          className="p-1 rounded-lg hover:bg-border/30 dark:hover:bg-night-border/50 text-muted hover:text-foreground dark:hover:text-night-text transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="size-4" />
                        </button>
                        <span className="text-xs font-bold text-foreground dark:text-night-text">
                          {MONTH_NAMES[currentLocale]?.[viewMonth] || MONTH_NAMES.en[viewMonth]}{' '}
                          {viewYear}
                        </span>
                        <button
                          type="button"
                          onClick={handleNextMonth}
                          className="p-1 rounded-lg hover:bg-border/30 dark:hover:bg-night-border/50 text-muted hover:text-foreground dark:hover:text-night-text transition-colors cursor-pointer"
                        >
                          <ChevronRight className="size-4" />
                        </button>
                      </div>

                      {/* Weekdays Header */}
                      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted">
                        {(WEEKDAY_NAMES[currentLocale] || WEEKDAY_NAMES.en).map((day, idx) => (
                          <div key={idx} className="py-0.5">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Days Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {calendarCells.map((cell) => {
                          const isStart = cell.dateStr === tempRange.start;
                          const isEnd = cell.dateStr === tempRange.end;
                          const isHovering = Boolean(
                            tempRange.start && !tempRange.end && hoverDate
                          );
                          const effectiveEnd = tempRange.end || (isHovering ? hoverDate : null);
                          const inRange = Boolean(
                            tempRange.start &&
                            effectiveEnd &&
                            cell.dateStr > tempRange.start &&
                            cell.dateStr < effectiveEnd
                          );
                          const isHoverPreview = isHovering && cell.dateStr === hoverDate;

                          return (
                            <button
                              key={cell.dateStr}
                              type="button"
                              onClick={() => handleDayClick(cell.dateStr)}
                              onMouseEnter={() => {
                                if (tempRange.start && !tempRange.end) {
                                  setHoverDate(cell.dateStr);
                                }
                              }}
                              className={`h-7 text-xs rounded-lg flex items-center justify-center font-medium transition-all relative cursor-pointer ${
                                !cell.isCurrentMonth
                                  ? 'text-muted/40 hover:text-muted'
                                  : 'text-foreground dark:text-night-text'
                              } ${
                                isStart || isEnd || isHoverPreview
                                  ? 'bg-brand-gold text-neutral-950 font-bold shadow-xs'
                                  : inRange
                                    ? 'bg-brand-gold/20 text-foreground dark:text-night-text rounded-none'
                                    : 'hover:bg-border/30 dark:hover:bg-night-border/50'
                              } ${isStart && effectiveEnd ? 'rounded-r-none' : ''} ${
                                (isEnd || isHoverPreview) && tempRange.start ? 'rounded-l-none' : ''
                              }`}
                            >
                              {cell.dayNumber}
                              {cell.isToday && !isStart && !isEnd && (
                                <span className="absolute bottom-0.5 size-1 rounded-full bg-brand-gold" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Manual Date Inputs */}
                    <div className="pt-2 border-t border-border/40 dark:border-night-border/40 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-muted uppercase tracking-wider block mb-0.5">
                            {t('ovFrom')}
                          </label>
                          <input
                            type="date"
                            value={tempRange.start}
                            onChange={(e) => {
                              setTempRange((prev) => ({ ...prev, start: e.target.value }));
                              const parsed = parseYMD(e.target.value);
                              if (parsed) {
                                setViewYear(parsed.getFullYear());
                                setViewMonth(parsed.getMonth());
                              }
                            }}
                            className="w-full px-2 py-1 text-xs bg-background dark:bg-night-bg text-foreground dark:text-night-text rounded-lg border border-border dark:border-night-border focus:outline-none focus:border-brand-gold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-muted uppercase tracking-wider block mb-0.5">
                            {t('ovTo')}
                          </label>
                          <input
                            type="date"
                            value={tempRange.end}
                            onChange={(e) =>
                              setTempRange((prev) => ({ ...prev, end: e.target.value }))
                            }
                            className="w-full px-2 py-1 text-xs bg-background dark:bg-night-bg text-foreground dark:text-night-text rounded-lg border border-border dark:border-night-border focus:outline-none focus:border-brand-gold"
                          />
                        </div>
                      </div>

                      {/* Footer with Days Count & Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          {tempRange.start &&
                          tempRange.end &&
                          getDaysCount(tempRange.start, tempRange.end) > 0 ? (
                            <span className="text-[11px] font-bold text-brand-gold">
                              {t('daysCount', {
                                count: getDaysCount(tempRange.start, tempRange.end),
                              })}
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted">
                              {!tempRange.start ? t('selectStartDate') : t('selectEndDate')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {(tempRange.start || tempRange.end) && (
                            <button
                              type="button"
                              onClick={handleClearCustomDates}
                              className="px-2.5 py-1 text-xs font-semibold text-muted hover:text-destructive dark:hover:text-red-400 rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer"
                            >
                              {t('clear')}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleApplyManualDates}
                            className="px-3 py-1 text-xs font-bold bg-brand-gold hover:bg-brand-gold/90 text-neutral-950 rounded-lg shadow-xs transition-colors cursor-pointer"
                          >
                            {t('ovApply')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Extra Periods Dropdown Toggle (...) */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setActivePopover(activePopover === 'morePeriods' ? null : 'morePeriods')
                }
                title="More timeframes"
                className={`relative px-2 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer select-none flex items-center gap-1 ${
                  isExtraPeriodActive
                    ? 'text-neutral-950 font-bold'
                    : 'text-muted dark:text-night-muted hover:text-foreground dark:hover:text-night-text hover:bg-surface/50 dark:hover:bg-night-surface/50'
                }`}
              >
                {isExtraPeriodActive && (
                  <motion.div
                    layoutId="overviewActivePeriod"
                    className="absolute inset-0 bg-brand-gold rounded-lg shadow-xs"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-0.5">
                  {isExtraPeriodActive ? currentPeriod : <MoreHorizontal className="size-3.5" />}
                </span>
              </button>

              {/* Extra Periods Popover Menu */}
              {activePopover === 'morePeriods' && (
                <div className="absolute top-full right-0 mt-1.5 z-40 w-36 p-1.5 rounded-xl bg-surface dark:bg-night-surface border border-border dark:border-night-border shadow-xl backdrop-blur-lg animate-fadeIn">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted px-2 py-1 flex items-center gap-1">
                    <Clock className="size-3 text-brand-gold" />
                    <span>Timeframes</span>
                  </div>
                  {EXTRA_PERIODS.map((ep) => {
                    const isSelected = currentPeriod === ep.value;
                    return (
                      <button
                        key={ep.value}
                        type="button"
                        onClick={() => {
                          onFilterChange({
                            period: ep.value,
                            start_date: undefined,
                            end_date: undefined,
                          });
                          setActivePopover(null);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                          isSelected
                            ? 'bg-brand-gold/20 text-foreground dark:text-night-text font-bold'
                            : 'text-muted dark:text-night-muted hover:bg-border/20 dark:hover:bg-night-border/40 hover:text-foreground dark:hover:text-night-text'
                        }`}
                      >
                        <span>{ep.labelKey ? t(ep.labelKey) : ep.shortLabel}</span>
                        {isSelected && <Check className="size-3.5 text-brand-gold" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Currency Segmented Toggle */}
          <div className="flex items-center p-1 bg-border/20 dark:bg-night-border/50 rounded-xl border border-border/30 dark:border-night-border/30">
            {CURRENCIES.map((cur) => {
              const isCurActive = (filters.currency || 'USD') === cur.value;
              return (
                <button
                  key={cur.value}
                  type="button"
                  onClick={() => onFilterChange({ currency: cur.value })}
                  title={`${cur.label} (${cur.symbol})`}
                  className={`relative px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer select-none flex items-center gap-1 ${
                    isCurActive
                      ? 'bg-surface dark:bg-night-surface text-foreground dark:text-night-text shadow-xs font-bold border border-border/40 dark:border-night-border/60'
                      : 'text-muted dark:text-night-muted hover:text-foreground dark:hover:text-night-text'
                  }`}
                >
                  <span className="text-[11px] text-brand-gold font-bold">{cur.symbol}</span>
                  <span>{cur.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right cluster: Filter Toggle, Reset, Refresh */}
        <div className="flex items-center gap-2">
          {/* Quick Filters Pill Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-200 cursor-pointer ${
              isFiltersExpanded || activeSecondaryFiltersCount > 0
                ? 'bg-brand-royal/10 dark:bg-brand-royal/20 border-brand-royal/40 text-brand-royal dark:text-night-royal'
                : 'bg-border/20 dark:bg-night-border/40 border-border/40 dark:border-night-border/40 text-muted dark:text-night-muted hover:text-foreground dark:hover:text-night-text hover:bg-border/30'
            }`}
          >
            <SlidersHorizontal className="size-3.5" />
            <span>{t('ovFilters')}</span>
            {activeSecondaryFiltersCount > 0 && (
              <span className="size-4.5 rounded-full bg-brand-gold text-neutral-950 font-bold text-[10px] flex items-center justify-center shadow-xs ml-0.5">
                {activeSecondaryFiltersCount}
              </span>
            )}
            <ChevronDown
              className={`size-3 transition-transform duration-200 ${
                isFiltersExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Reset Filters (Smoothly appears when filters are active) */}
          <AnimatePresence>
            {hasAnyCustomFilters && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                type="button"
                onClick={onReset}
                title={t('ovClearAll')}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-muted hover:text-destructive dark:text-night-muted dark:hover:text-red-400 bg-border/20 dark:bg-night-border/40 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
              >
                <RotateCcw className="size-3" />
                <span className="hidden sm:inline">{t('ovReset')}</span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Live Refresh Action */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            title={t('ovRefresh')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-950 bg-brand-gold hover:bg-brand-gold/90 disabled:opacity-50 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('ovRefresh')}</span>
          </button>
        </div>
      </div>

      {/* ── EXPANDABLE SECONDARY FILTER CAPSULES ───────────────────────── */}
      <AnimatePresence>
        {(isFiltersExpanded || activeSecondaryFiltersCount > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-visible pt-2.5 border-t border-border/40 dark:border-night-border/40"
          >
            <div className="flex flex-wrap items-center gap-2">
              {/* 1. Cargo Type Popover Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActivePopover(activePopover === 'cargo' ? null : 'cargo')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-xl border transition-all duration-200 cursor-pointer ${
                    filters.cargo_type
                      ? 'bg-brand-gold/15 border-brand-gold/50 text-foreground dark:text-night-text font-semibold shadow-xs'
                      : 'bg-background/80 dark:bg-night-bg/80 border-border/60 dark:border-night-border/60 text-muted dark:text-night-muted hover:text-foreground dark:hover:text-night-text'
                  }`}
                >
                  <Package className="size-3.5 text-brand-gold shrink-0" />
                  <span>
                    {filters.cargo_type ? `Cargo: ${filters.cargo_type}` : t('ovCargoType')}
                  </span>
                  <ChevronDown className="size-3 opacity-60 ml-0.5" />
                </button>

                {/* Cargo Type Popover Menu */}
                {activePopover === 'cargo' && (
                  <div className="absolute top-full left-0 mt-1.5 z-40 w-48 p-1.5 rounded-xl bg-surface dark:bg-night-surface border border-border dark:border-night-border shadow-xl backdrop-blur-lg animate-fadeIn">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted px-2 py-1">
                      {t('ovCargoType')}
                    </div>
                    {cargoTypes.map((ct) => {
                      const isSelected = (filters.cargo_type || '') === ct.value;
                      return (
                        <button
                          key={ct.value}
                          type="button"
                          onClick={() => {
                            onFilterChange({ cargo_type: ct.value });
                            setActivePopover(null);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                            isSelected
                              ? 'bg-brand-gold/20 text-foreground dark:text-night-text font-bold'
                              : 'text-muted dark:text-night-muted hover:bg-border/20 dark:hover:bg-night-border/40 hover:text-foreground dark:hover:text-night-text'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <ct.icon className="size-3.5 text-brand-gold" />
                            <span>{ct.label}</span>
                          </span>
                          {isSelected && <Check className="size-3.5 text-brand-gold" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Status Popover Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActivePopover(activePopover === 'status' ? null : 'status')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-xl border transition-all duration-200 cursor-pointer ${
                    filters.status
                      ? 'bg-brand-gold/15 border-brand-gold/50 text-foreground dark:text-night-text font-semibold shadow-xs'
                      : 'bg-background/80 dark:bg-night-bg/80 border-border/60 dark:border-night-border/60 text-muted dark:text-night-muted hover:text-foreground dark:hover:text-night-text'
                  }`}
                >
                  <Filter className="size-3.5 text-brand-gold shrink-0" />
                  <span>{filters.status ? `Status: ${filters.status}` : t('ovStatus')}</span>
                  <ChevronDown className="size-3 opacity-60 ml-0.5" />
                </button>

                {/* Status Popover Menu */}
                {activePopover === 'status' && (
                  <div className="absolute top-full left-0 mt-1.5 z-40 w-52 p-1.5 rounded-xl bg-surface dark:bg-night-surface border border-border dark:border-night-border shadow-xl backdrop-blur-lg animate-fadeIn max-h-64 overflow-y-auto">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted px-2 py-1">
                      {t('ovStatus')}
                    </div>
                    {statuses.map((st) => {
                      const isSelected = (filters.status || '') === st.value;
                      return (
                        <button
                          key={st.value}
                          type="button"
                          onClick={() => {
                            onFilterChange({ status: st.value });
                            setActivePopover(null);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                            isSelected
                              ? 'bg-brand-gold/20 text-foreground dark:text-night-text font-bold'
                              : 'text-muted dark:text-night-muted hover:bg-border/20 dark:hover:bg-night-border/40 hover:text-foreground dark:hover:text-night-text'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`size-2 rounded-full ${st.color}`} />
                            <span>{st.label}</span>
                          </span>
                          {isSelected && <Check className="size-3.5 text-brand-gold" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Manager Popover Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActivePopover(activePopover === 'manager' ? null : 'manager')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-xl border transition-all duration-200 cursor-pointer max-w-[200px] truncate ${
                    filters.employee_id
                      ? 'bg-brand-gold/15 border-brand-gold/50 text-foreground dark:text-night-text font-semibold shadow-xs'
                      : 'bg-background/80 dark:bg-night-bg/80 border-border/60 dark:border-night-border/60 text-muted dark:text-night-muted hover:text-foreground dark:hover:text-night-text'
                  }`}
                >
                  <User className="size-3.5 text-brand-gold shrink-0" />
                  <span className="truncate">
                    {selectedEmployeeName ? selectedEmployeeName : t('ovManager')}
                  </span>
                  <ChevronDown className="size-3 opacity-60 ml-0.5 shrink-0" />
                </button>

                {/* Manager Popover Menu with Search */}
                {activePopover === 'manager' && (
                  <div className="absolute top-full left-0 mt-1.5 z-40 w-64 p-2 rounded-xl bg-surface dark:bg-night-surface border border-border dark:border-night-border shadow-xl backdrop-blur-lg animate-fadeIn flex flex-col gap-1.5">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted" />
                      <input
                        type="text"
                        autoFocus
                        value={managerSearch}
                        onChange={(e) => setManagerSearch(e.target.value)}
                        placeholder={t('ovSearchManager')}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-background dark:bg-night-bg border border-border/60 dark:border-night-border/60 text-foreground dark:text-night-text focus:outline-none focus:border-brand-gold"
                      />
                    </div>

                    {/* Manager List */}
                    <div className="max-h-52 overflow-y-auto flex flex-col gap-0.5">
                      {/* All option */}
                      <button
                        type="button"
                        onClick={() => {
                          onFilterChange({ employee_id: '' });
                          setActivePopover(null);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                          !filters.employee_id
                            ? 'bg-brand-gold/20 text-foreground dark:text-night-text font-bold'
                            : 'text-muted dark:text-night-muted hover:bg-border/20 dark:hover:bg-night-border/40 hover:text-foreground dark:hover:text-night-text'
                        }`}
                      >
                        <span>{t('ovAllManagers')}</span>
                        {!filters.employee_id && <Check className="size-3.5 text-brand-gold" />}
                      </button>

                      {filteredEmployees.map((emp) => {
                        const isSelected = filters.employee_id === emp.id;
                        const fullName =
                          `${emp.first_name || ''} ${emp.last_name || ''}`.trim() ||
                          emp.phone ||
                          'Manager';
                        const initials =
                          (
                            (emp.first_name?.[0] || '') + (emp.last_name?.[0] || '')
                          ).toUpperCase() || 'M';

                        return (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => {
                              onFilterChange({ employee_id: emp.id });
                              setActivePopover(null);
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                              isSelected
                                ? 'bg-brand-gold/20 text-foreground dark:text-night-text font-bold'
                                : 'text-muted dark:text-night-muted hover:bg-border/20 dark:hover:bg-night-border/40 hover:text-foreground dark:hover:text-night-text'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="size-5 rounded-full bg-brand-gold/20 text-brand-gold text-[10px] font-bold flex items-center justify-center shrink-0">
                                {initials}
                              </span>
                              <span className="truncate">{fullName}</span>
                            </div>
                            {isSelected && (
                              <Check className="size-3.5 text-brand-gold shrink-0 ml-1" />
                            )}
                          </button>
                        );
                      })}

                      {filteredEmployees.length === 0 && (
                        <div className="text-center py-3 text-xs text-muted">
                          {t('ovNoManagersFound')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Client Popover Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActivePopover(activePopover === 'client' ? null : 'client')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-xl border transition-all duration-200 cursor-pointer max-w-[200px] truncate ${
                    filters.client_id
                      ? 'bg-brand-gold/15 border-brand-gold/50 text-foreground dark:text-night-text font-semibold shadow-xs'
                      : 'bg-background/80 dark:bg-night-bg/80 border-border/60 dark:border-night-border/60 text-muted dark:text-night-muted hover:text-foreground dark:hover:text-night-text'
                  }`}
                >
                  <Building2 className="size-3.5 text-brand-gold shrink-0" />
                  <span className="truncate">
                    {selectedClientName ? selectedClientName : t('ovClient')}
                  </span>
                  <ChevronDown className="size-3 opacity-60 ml-0.5 shrink-0" />
                </button>

                {/* Client Popover Menu with Search */}
                {activePopover === 'client' && (
                  <div className="absolute top-full left-0 mt-1.5 z-40 w-64 p-2 rounded-xl bg-surface dark:bg-night-surface border border-border dark:border-night-border shadow-xl backdrop-blur-lg animate-fadeIn flex flex-col gap-1.5">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted" />
                      <input
                        type="text"
                        autoFocus
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder={t('ovSearchClient')}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-background dark:bg-night-bg border border-border/60 dark:border-night-border/60 text-foreground dark:text-night-text focus:outline-none focus:border-brand-gold"
                      />
                    </div>

                    {/* Client List */}
                    <div className="max-h-52 overflow-y-auto flex flex-col gap-0.5">
                      {/* All option */}
                      <button
                        type="button"
                        onClick={() => {
                          onFilterChange({ client_id: '' });
                          setActivePopover(null);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                          !filters.client_id
                            ? 'bg-brand-gold/20 text-foreground dark:text-night-text font-bold'
                            : 'text-muted dark:text-night-muted hover:bg-border/20 dark:hover:bg-night-border/40 hover:text-foreground dark:hover:text-night-text'
                        }`}
                      >
                        <span>{t('ovAllClients')}</span>
                        {!filters.client_id && <Check className="size-3.5 text-brand-gold" />}
                      </button>

                      {filteredClients.map((cli) => {
                        const isSelected = filters.client_id === cli.id;
                        const clientTitle =
                          cli.company_name ||
                          `${cli.first_name || ''} ${cli.last_name || ''}`.trim() ||
                          cli.phone ||
                          'Client';

                        return (
                          <button
                            key={cli.id}
                            type="button"
                            onClick={() => {
                              onFilterChange({ client_id: cli.id });
                              setActivePopover(null);
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                              isSelected
                                ? 'bg-brand-gold/20 text-foreground dark:text-night-text font-bold'
                                : 'text-muted dark:text-night-muted hover:bg-border/20 dark:hover:bg-night-border/40 hover:text-foreground dark:hover:text-night-text'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Building2 className="size-3.5 text-brand-gold shrink-0" />
                              <span className="truncate">{clientTitle}</span>
                            </div>
                            {isSelected && (
                              <Check className="size-3.5 text-brand-gold shrink-0 ml-1" />
                            )}
                          </button>
                        );
                      })}

                      {filteredClients.length === 0 && (
                        <div className="text-center py-3 text-xs text-muted">
                          {t('ovNoClientsFound')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ACTIVE FILTER CHIPS STRIP ───────────────────────────────────── */}
      <AnimatePresence>
        {(activeSecondaryFiltersCount > 0 ||
          (isCustom && Boolean(filters.start_date || filters.end_date))) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-wrap items-center gap-1.5 pt-1 text-xs"
          >
            <span className="text-[11px] font-semibold text-muted dark:text-night-muted mr-1">
              {t('ovActiveFilters')}:
            </span>

            {/* Custom date range chip */}
            {isCustom && (filters.start_date || filters.end_date) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-brand-gold/10 text-foreground dark:text-night-text border border-brand-gold/30 text-[11px] font-medium">
                <Calendar className="size-3 text-brand-gold shrink-0" />
                <span>
                  {filters.start_date || '...'} → {filters.end_date || '...'}
                </span>
                <button
                  type="button"
                  onClick={handleClearCustomDates}
                  className="hover:text-destructive cursor-pointer p-0.5"
                  title={t('clear')}
                >
                  <X className="size-2.5" />
                </button>
              </span>
            )}

            {/* Cargo filter chip */}
            {filters.cargo_type && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-brand-gold/10 text-foreground dark:text-night-text border border-brand-gold/30 text-[11px] font-medium">
                <span>Cargo: {filters.cargo_type}</span>
                <button
                  type="button"
                  onClick={() => onFilterChange({ cargo_type: '' })}
                  className="hover:text-destructive cursor-pointer p-0.5"
                >
                  <X className="size-2.5" />
                </button>
              </span>
            )}

            {/* Status filter chip */}
            {filters.status && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-brand-gold/10 text-foreground dark:text-night-text border border-brand-gold/30 text-[11px] font-medium">
                <span>Status: {filters.status}</span>
                <button
                  type="button"
                  onClick={() => onFilterChange({ status: '' })}
                  className="hover:text-destructive cursor-pointer p-0.5"
                >
                  <X className="size-2.5" />
                </button>
              </span>
            )}

            {/* Manager filter chip */}
            {selectedEmployeeName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-brand-gold/10 text-foreground dark:text-night-text border border-brand-gold/30 text-[11px] font-medium max-w-[180px] truncate">
                <span className="truncate">Manager: {selectedEmployeeName}</span>
                <button
                  type="button"
                  onClick={() => onFilterChange({ employee_id: '' })}
                  className="hover:text-destructive cursor-pointer p-0.5 shrink-0"
                >
                  <X className="size-2.5" />
                </button>
              </span>
            )}

            {/* Client filter chip */}
            {selectedClientName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-brand-gold/10 text-foreground dark:text-night-text border border-brand-gold/30 text-[11px] font-medium max-w-[180px] truncate">
                <span className="truncate">Client: {selectedClientName}</span>
                <button
                  type="button"
                  onClick={() => onFilterChange({ client_id: '' })}
                  className="hover:text-destructive cursor-pointer p-0.5 shrink-0"
                >
                  <X className="size-2.5" />
                </button>
              </span>
            )}

            {/* Clear all secondary filters link */}
            <button
              type="button"
              onClick={() =>
                onFilterChange({
                  cargo_type: '',
                  status: '',
                  employee_id: '',
                  client_id: '',
                  period: '1M',
                  start_date: undefined,
                  end_date: undefined,
                })
              }
              className="text-[11px] text-muted hover:text-foreground dark:text-night-muted dark:hover:text-night-text underline cursor-pointer ml-1"
            >
              {t('ovClearAll')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
