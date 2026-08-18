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
  Check,
  X,
  Search,
  SlidersHorizontal,
  Layers,
  MoreHorizontal,
  Clock,
} from 'lucide-react';
import type { DashboardPeriod, DashboardFilterParams } from '../../types/dashboard';
import type { Employee, Client } from '../../services/api';
import { useTranslation } from '../../context/LanguageContext';

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
  { shortLabel: 'Custom', labelKey: 'ovPeriodCustom', value: 'CUSTOM' },
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

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  onRefresh,
  loading = false,
  employees = [],
  clients = [],
}) => {
  const { t } = useTranslation();
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

  // Popover container ref for click-outside detection
  const filterBarRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(event.target as Node)) {
        setActivePopover(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActivePopover(null);
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
    if (filters.period === 'CUSTOM' && (filters.start_date || filters.end_date)) count++;
    return count;
  }, [filters]);

  const hasAnyCustomFilters =
    activeSecondaryFiltersCount > 0 ||
    filters.period !== '1M' ||
    (filters.currency && filters.currency !== 'USD');

  // Quick date presets for custom range
  const handleApplyDatePreset = (daysBack: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - daysBack);

    const fmt = (d: Date) => d.toISOString().split('T')[0];
    onFilterChange({
      period: 'CUSTOM',
      start_date: fmt(start),
      end_date: fmt(end),
    });
    setActivePopover(null);
  };

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
          <div className="flex items-center p-1 bg-border/20 dark:bg-night-border/50 rounded-xl border border-border/30 dark:border-night-border/30 relative">
            {PRIMARY_PERIODS.map((opt) => {
              const isActive = currentPeriod === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (opt.value === 'CUSTOM') {
                      onFilterChange({ period: 'CUSTOM' });
                      setActivePopover('customDate');
                    } else {
                      onFilterChange({ period: opt.value });
                      setActivePopover(null);
                    }
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
                    {opt.value === 'CUSTOM' ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        <span>{t('ovPeriodCustom')}</span>
                      </span>
                    ) : opt.labelKey ? (
                      t(opt.labelKey)
                    ) : (
                      opt.shortLabel
                    )}
                  </span>
                </button>
              );
            })}

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
                          onFilterChange({ period: ep.value });
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

              {/* 5. Custom Date Range Popover Button (if custom period) */}
              {isCustom && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setActivePopover(activePopover === 'customDate' ? null : 'customDate')
                    }
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-xl border bg-brand-gold/15 border-brand-gold/50 text-foreground dark:text-night-text font-semibold shadow-xs cursor-pointer"
                  >
                    <Calendar className="size-3.5 text-brand-gold shrink-0" />
                    <span>
                      {filters.start_date || filters.end_date
                        ? `${filters.start_date || '...'} → ${filters.end_date || '...'}`
                        : t('ovSelectDateRange')}
                    </span>
                    <ChevronDown className="size-3 opacity-60 ml-0.5" />
                  </button>

                  {activePopover === 'customDate' && (
                    <div className="absolute top-full left-0 sm:right-auto mt-1.5 z-40 w-72 p-3 rounded-2xl bg-surface dark:bg-night-surface border border-border dark:border-night-border shadow-xl backdrop-blur-lg animate-fadeIn flex flex-col gap-3">
                      <div className="flex items-center justify-between text-xs font-bold text-foreground dark:text-night-text">
                        <span>{t('ovSelectDateRange')}</span>
                        <button
                          type="button"
                          onClick={() => setActivePopover(null)}
                          className="p-1 rounded-md text-muted hover:text-foreground cursor-pointer"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>

                      {/* Quick Presets */}
                      <div className="grid grid-cols-3 gap-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleApplyDatePreset(7)}
                          className="px-2 py-1 rounded-lg bg-border/20 dark:bg-night-border/40 hover:bg-brand-gold/20 text-muted hover:text-foreground dark:text-night-muted transition-colors cursor-pointer"
                        >
                          7 Days
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyDatePreset(30)}
                          className="px-2 py-1 rounded-lg bg-border/20 dark:bg-night-border/40 hover:bg-brand-gold/20 text-muted hover:text-foreground dark:text-night-muted transition-colors cursor-pointer"
                        >
                          30 Days
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyDatePreset(90)}
                          className="px-2 py-1 rounded-lg bg-border/20 dark:bg-night-border/40 hover:bg-brand-gold/20 text-muted hover:text-foreground dark:text-night-muted transition-colors cursor-pointer"
                        >
                          90 Days
                        </button>
                      </div>

                      {/* Date Inputs */}
                      <div className="flex flex-col gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-muted uppercase">
                            {t('ovFrom')}
                          </label>
                          <input
                            type="date"
                            value={filters.start_date || ''}
                            onChange={(e) => onFilterChange({ start_date: e.target.value })}
                            className="w-full mt-0.5 px-2.5 py-1.5 text-xs bg-background dark:bg-night-bg text-foreground dark:text-night-text rounded-xl border border-border dark:border-night-border focus:outline-none focus:border-brand-gold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-muted uppercase">
                            {t('ovTo')}
                          </label>
                          <input
                            type="date"
                            value={filters.end_date || ''}
                            onChange={(e) => onFilterChange({ end_date: e.target.value })}
                            className="w-full mt-0.5 px-2.5 py-1.5 text-xs bg-background dark:bg-night-bg text-foreground dark:text-night-text rounded-xl border border-border dark:border-night-border focus:outline-none focus:border-brand-gold"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActivePopover(null)}
                        className="w-full py-1.5 text-xs font-bold bg-brand-gold hover:bg-brand-gold/90 text-neutral-950 rounded-xl transition-colors cursor-pointer"
                      >
                        {t('ovApply')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ACTIVE FILTER CHIPS STRIP ───────────────────────────────────── */}
      <AnimatePresence>
        {activeSecondaryFiltersCount > 0 && (
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

            {/* Custom date range chip */}
            {filters.period === 'CUSTOM' && (filters.start_date || filters.end_date) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-brand-gold/10 text-foreground dark:text-night-text border border-brand-gold/30 text-[11px] font-medium">
                <span>
                  {filters.start_date || '...'} → {filters.end_date || '...'}
                </span>
                <button
                  type="button"
                  onClick={() => onFilterChange({ start_date: undefined, end_date: undefined })}
                  className="hover:text-destructive cursor-pointer p-0.5"
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
