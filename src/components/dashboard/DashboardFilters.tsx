import React from 'react';
import { Calendar, Filter, RefreshCw, RotateCcw, Coins } from 'lucide-react';
import type { DashboardPeriod, DashboardFilterParams } from '../../types/dashboard';
import type { Employee, Client } from '../../services/api';
import { T } from '../T';
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

const PERIOD_OPTIONS: { label: string; value: DashboardPeriod }[] = [
  { label: '1D', value: '1D' },
  { label: '5D', value: '5D' },
  { label: '1M', value: '1M' },
  { label: '6M', value: '6M' },
  { label: 'YTD', value: 'YTD' },
  { label: '1Y', value: '1Y' },
  { label: '5Y', value: '5Y' },
  { label: 'MAX', value: 'MAX' },
  { label: 'Custom', value: 'CUSTOM' },
];

const CURRENCY_OPTIONS = [
  { label: "UZS (So'm)", value: 'UZS' },
  { label: 'USD ($)', value: 'USD' },
  { label: 'RUB (₽)', value: 'RUB' },
  { label: 'RMB (¥)', value: 'RMB' },
  { label: 'CNY (¥)', value: 'CNY' },
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

  const cargoTypes = [
    { label: t('ovAllCargoTypes'), value: '' },
    { label: 'FTL', value: 'FTL' },
    { label: 'LTL', value: 'LTL' },
  ];

  const statuses = [
    { label: t('ovAllStatuses'), value: '' },
    { label: t('statusWaiting'), value: 'Waiting' },
    { label: t('statusStation'), value: 'Station' },
    { label: t('statusOnTheWay'), value: 'On the way' },
    { label: t('statusOnTheBorder'), value: 'On the border' },
    { label: t('statusReload'), value: 'Reload' },
    { label: t('statusArrived'), value: 'Arrived' },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 rounded-2xl bg-surface/90 dark:bg-night-surface/90 border border-border/60 dark:border-night-border backdrop-blur-md shadow-sm transition-all duration-300">
      {/* Top Row: Period Selector Tabs & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Period Preset Pills */}
        <div className="flex items-center gap-1 p-1 bg-border/20 dark:bg-night-border/40 rounded-xl overflow-x-auto max-w-full">
          {PERIOD_OPTIONS.map((opt) => {
            const isActive = currentPeriod === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onFilterChange({ period: opt.value })}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-gold text-neutral-950 shadow-md scale-[1.02]'
                    : 'text-muted dark:text-night-muted hover:text-foreground dark:hover:text-night-text hover:bg-border/30 dark:hover:bg-night-border/60'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Action Controls: Refresh & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            title="Reset Filters"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground dark:text-night-muted dark:hover:text-night-text bg-border/20 dark:bg-night-border/40 hover:bg-border/40 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span>
              <T k="ovReset" />
            </span>
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-neutral-950 bg-brand-gold hover:bg-brand-gold/90 disabled:opacity-50 rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>
              <T k="ovRefresh" />
            </span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker Row (shown if CUSTOM is active) */}
      {isCustom && (
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/40 dark:border-night-border/40 animate-fadeIn">
          <div className="flex items-center gap-2 text-xs text-muted dark:text-night-muted">
            <Calendar className="size-4 text-brand-gold" />
            <span className="font-semibold">
              <T k="ovCustomDateRange" />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => onFilterChange({ start_date: e.target.value })}
              className="px-3 py-1.5 text-xs font-medium bg-background dark:bg-night-bg text-foreground dark:text-night-text rounded-xl border border-border dark:border-night-border focus:outline-none focus:border-brand-gold"
            />
            <span className="text-xs text-muted">to</span>
            <input
              type="date"
              value={filters.end_date || ''}
              onChange={(e) => onFilterChange({ end_date: e.target.value })}
              className="px-3 py-1.5 text-xs font-medium bg-background dark:bg-night-bg text-foreground dark:text-night-text rounded-xl border border-border dark:border-night-border focus:outline-none focus:border-brand-gold"
            />
          </div>
        </div>
      )}

      {/* Dropdown Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-border/30 dark:border-night-border/30">
        {/* Currency Filter */}
        <div className="flex items-center gap-2">
          <Coins className="size-3.5 text-brand-gold shrink-0" />
          <select
            value={filters.currency || 'UZS'}
            onChange={(e) => onFilterChange({ currency: e.target.value })}
            className="w-full px-3 py-1.5 text-xs bg-background dark:bg-night-bg text-foreground dark:text-night-text rounded-xl border border-border/60 dark:border-night-border/60 focus:outline-none focus:border-brand-gold cursor-pointer font-semibold"
          >
            {CURRENCY_OPTIONS.map((cur) => (
              <option key={cur.value} value={cur.value}>
                {cur.label}
              </option>
            ))}
          </select>
        </div>

        {/* Cargo Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="size-3.5 text-brand-gold shrink-0" />
          <select
            value={filters.cargo_type || ''}
            onChange={(e) => onFilterChange({ cargo_type: e.target.value })}
            className="w-full px-3 py-1.5 text-xs bg-background dark:bg-night-bg text-foreground dark:text-night-text rounded-xl border border-border/60 dark:border-night-border/60 focus:outline-none focus:border-brand-gold cursor-pointer"
          >
            {cargoTypes.map((ct) => (
              <option key={ct.value} value={ct.value}>
                {ct.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="w-full px-3 py-1.5 text-xs bg-background dark:bg-night-bg text-foreground dark:text-night-text rounded-xl border border-border/60 dark:border-night-border/60 focus:outline-none focus:border-brand-gold cursor-pointer"
          >
            {statuses.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        </div>

        {/* Manager Filter */}
        <div className="flex items-center gap-2">
          <select
            value={filters.employee_id || ''}
            onChange={(e) => onFilterChange({ employee_id: e.target.value })}
            className="w-full px-3 py-1.5 text-xs bg-background dark:bg-night-bg text-foreground dark:text-night-text rounded-xl border border-border/60 dark:border-night-border/60 focus:outline-none focus:border-brand-gold cursor-pointer"
          >
            <option value="">{t('ovAllManagers')}</option>
            {employees.map((emp) => {
              const empName =
                `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.phone || 'Manager';
              return (
                <option key={emp.id} value={emp.id}>
                  {empName}
                </option>
              );
            })}
          </select>
        </div>

        {/* Client Filter */}
        <div className="flex items-center gap-2">
          <select
            value={filters.client_id || ''}
            onChange={(e) => onFilterChange({ client_id: e.target.value })}
            className="w-full px-3 py-1.5 text-xs bg-background dark:bg-night-bg text-foreground dark:text-night-text rounded-xl border border-border/60 dark:border-night-border/60 focus:outline-none focus:border-brand-gold cursor-pointer"
          >
            <option value="">{t('ovAllClients')}</option>
            {clients.map((cli) => {
              const cliName =
                cli.company_name ||
                `${cli.first_name || ''} ${cli.last_name || ''}`.trim() ||
                cli.phone ||
                'Client';
              return (
                <option key={cli.id} value={cli.id}>
                  {cliName}
                </option>
              );
            })}
          </select>
        </div>
      </div>
    </div>
  );
};
