import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Calendar,
  Filter,
  Check,
  Truck,
  Sparkles,
  DollarSign,
  TrendingUp,
  Package,
  Navigation,
} from 'lucide-react';
import { CONTAINER_TYPES } from '../../services/api';
import type { CargoRegistrationStatus, CargoType } from '../../services/api';
import { ClientSelect } from './ClientSelect';
import { EmployeeSelect } from './EmployeeSelect';
import { CitySelect } from './CitySelect';
import { DateRangePicker, formatYMD } from './DateRangePicker';
import { useTranslation } from '../../context/LanguageContext';

export interface CargoFilterState {
  status: string;
  cargo_type: string;
  container_type: string;
  client_id: string;
  client_name?: string;
  employee_id: string;
  employee_name?: string;
  origin_city: string;
  origin_country_code: string;
  destination_city: string;
  destination_country_code: string;
  purchase_start_date: string;
  purchase_end_date: string;
  sell_start_date: string;
  sell_end_date: string;
  confirmed_start_date: string;
  confirmed_end_date: string;
  loaded_start_date: string;
  loaded_end_date: string;
  arrived_start_date: string;
  arrived_end_date: string;
  created_start_date: string;
  created_end_date: string;
}

export const INITIAL_CARGO_FILTERS: CargoFilterState = {
  status: '',
  cargo_type: '',
  container_type: '',
  client_id: '',
  client_name: '',
  employee_id: '',
  employee_name: '',
  origin_city: '',
  origin_country_code: '',
  destination_city: '',
  destination_country_code: '',
  purchase_start_date: '',
  purchase_end_date: '',
  sell_start_date: '',
  sell_end_date: '',
  confirmed_start_date: '',
  confirmed_end_date: '',
  loaded_start_date: '',
  loaded_end_date: '',
  arrived_start_date: '',
  arrived_end_date: '',
  created_start_date: '',
  created_end_date: '',
};

const CARGO_STATUS_OPTIONS: { labelKey: string; value: CargoRegistrationStatus | '' }[] = [
  { labelKey: 'allStatuses', value: '' },
  { labelKey: 'statusWaiting', value: 'Waiting' },
  { labelKey: 'statusStation', value: 'Station' },
  { labelKey: 'statusOnTheWay', value: 'On the way' },
  { labelKey: 'statusOnTheBorder', value: 'On the border' },
  { labelKey: 'statusReload', value: 'Reload' },
  { labelKey: 'statusArrived', value: 'Arrived' },
];

const CARGO_TYPE_OPTIONS: { labelKey: string; value: CargoType | '' }[] = [
  { labelKey: 'allTypes', value: '' },
  { labelKey: 'typeLTL', value: 'LTL' },
  { labelKey: 'typeFTL', value: 'FTL' },
];

export interface CargoFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: CargoFilterState;
  onApplyFilters: (newFilters: CargoFilterState) => void;
  onResetFilters: () => void;
}

export function CargoFilterModal({
  isOpen,
  onClose,
  filters: currentFilters,
  onApplyFilters,
  onResetFilters,
}: CargoFilterModalProps) {
  const { t } = useTranslation();
  const [localFilters, setLocalFilters] = useState<CargoFilterState>(currentFilters);

  // Sync local state when modal opens or parent filters change
  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters, isOpen]);

  // Calculate total active filter rules
  const getActiveCount = (state: CargoFilterState) => {
    let count = 0;
    if (state.status) count++;
    if (state.cargo_type) count++;
    if (state.container_type) count++;
    if (state.client_id) count++;
    if (state.employee_id) count++;
    if (state.origin_city) count++;
    if (state.destination_city) count++;
    if (state.purchase_start_date || state.purchase_end_date) count++;
    if (state.sell_start_date || state.sell_end_date) count++;
    if (state.confirmed_start_date || state.confirmed_end_date) count++;
    if (state.loaded_start_date || state.loaded_end_date) count++;
    if (state.arrived_start_date || state.arrived_end_date) count++;
    if (state.created_start_date || state.created_end_date) count++;
    return count;
  };

  const activeCount = getActiveCount(localFilters);

  // Quick Preset Helper for Creation Date
  const applyCreationDatePreset = (preset: 'today' | 'week' | 'month' | 'month30' | 'year') => {
    const today = new Date();
    let start = '';
    const end = formatYMD(today);

    if (preset === 'today') {
      start = end;
    } else if (preset === 'week') {
      const d = new Date(today);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
      d.setDate(diff);
      start = formatYMD(d);
    } else if (preset === 'month') {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      start = formatYMD(d);
    } else if (preset === 'month30') {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      start = formatYMD(d);
    } else if (preset === 'year') {
      const d = new Date(today.getFullYear(), 0, 1);
      start = formatYMD(d);
    }

    setLocalFilters((prev) => ({
      ...prev,
      created_start_date: start,
      created_end_date: end,
    }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters(INITIAL_CARGO_FILTERS);
    onResetFilters();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-3xl bg-surface dark:bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                  <SlidersHorizontal className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">
                      {t('cargoFilterModalTitle')}
                    </h3>
                    {activeCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-gold text-brand-navy shadow-sm">
                        {t('activeFiltersLabel', { count: activeCount })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('cargoFilterModalSubtitle')}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs pb-12">
              {/* SECTION 1: Status & Classification */}
              <div className="space-y-4">
                <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <Filter className="size-3.5 text-brand-gold" />
                  {t('statusSectionTitle')}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Status Pills */}
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5">
                      {t('statusSectionTitle')}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {CARGO_STATUS_OPTIONS.map((opt) => {
                        const isSelected = localFilters.status === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setLocalFilters((p) => ({ ...p, status: opt.value }))}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                              isSelected
                                ? 'bg-brand-gold text-brand-navy border-brand-gold font-bold shadow-sm'
                                : 'bg-background text-foreground border-border hover:bg-muted/50'
                            }`}
                          >
                            {isSelected && <Check className="size-3 stroke-[3]" />}
                            <span>{t(opt.labelKey)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cargo Type Toggle */}
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5">
                      {t('cargoTypeLabel')}
                    </label>
                    <div className="flex gap-1.5 p-1 rounded-xl bg-muted/40 border border-border">
                      {CARGO_TYPE_OPTIONS.map((typeOpt) => {
                        const isSelected = localFilters.cargo_type === typeOpt.value;
                        return (
                          <button
                            key={typeOpt.value}
                            type="button"
                            onClick={() =>
                              setLocalFilters((p) => ({
                                ...p,
                                cargo_type: typeOpt.value as CargoType | '',
                              }))
                            }
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-surface text-brand-gold border border-border shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {t(typeOpt.labelKey)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  {/* Container Type Select */}
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      {t('containerTypeLabel')}
                    </label>
                    <select
                      value={localFilters.container_type}
                      onChange={(e) =>
                        setLocalFilters((p) => ({ ...p, container_type: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
                    >
                      <option value="">{t('allContainerTypes')}</option>
                      {CONTAINER_TYPES.map((ct) => (
                        <option key={ct} value={ct}>
                          {ct}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Client Select */}
                  <div>
                    <ClientSelect
                      value={localFilters.client_id}
                      onChange={(id, name) =>
                        setLocalFilters((p) => ({ ...p, client_id: id, client_name: name }))
                      }
                      label={t('clientLabel')}
                      placeholder={t('filterByClientPlaceholder')}
                    />
                  </div>

                  {/* Employee Select */}
                  <div>
                    <EmployeeSelect
                      value={localFilters.employee_id}
                      onChange={(id, name) =>
                        setLocalFilters((p) => ({ ...p, employee_id: id, employee_name: name }))
                      }
                      label={t('assignedEmployeeLabel')}
                      placeholder={t('filterByEmployeePlaceholder')}
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-border/60" />

              {/* SECTION 2: Logistics Route Corridor */}
              <div className="space-y-3">
                <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <Navigation className="size-3.5 text-brand-gold" />
                  {t('routeCorridorTitle') || 'Logistics Route Corridor'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Origin City */}
                  <div>
                    <CitySelect
                      label={t('originCityLabel') || 'Origin Hub / City'}
                      placeholder={t('originCityPlaceholder') || 'Search origin hub...'}
                      value={localFilters.origin_city}
                      onChange={(city, customText) =>
                        setLocalFilters((p) => ({
                          ...p,
                          origin_city: city ? city.name : customText || '',
                          origin_country_code: city?.country_code || '',
                        }))
                      }
                    />
                  </div>

                  {/* Destination City */}
                  <div>
                    <CitySelect
                      label={t('destinationCityLabel') || 'Destination Hub / City'}
                      placeholder={t('destinationCityPlaceholder') || 'Search destination hub...'}
                      value={localFilters.destination_city}
                      onChange={(city, customText) =>
                        setLocalFilters((p) => ({
                          ...p,
                          destination_city: city ? city.name : customText || '',
                          destination_country_code: city?.country_code || '',
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-border/60" />

              {/* SECTION 3: Date Range Filters */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <Calendar className="size-3.5 text-brand-gold" />
                    {t('dateSectionTitle')}
                  </h4>

                  {/* Quick Presets Bar for Creation Date */}
                  <div className="flex items-center gap-1 overflow-x-auto">
                    <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 mr-1">
                      <Sparkles className="size-3 text-amber-500" /> {t('presetLabel')}:
                    </span>
                    {[
                      { labelKey: 'presetToday', key: 'today' },
                      { labelKey: 'presetThisWeek', key: 'week' },
                      { labelKey: 'presetThisMonth', key: 'month' },
                      { labelKey: 'presetLast30Days', key: 'month30' },
                      { labelKey: 'presetThisYear', key: 'year' },
                    ].map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => applyCreationDatePreset(p.key as any)}
                        className="px-2 py-1 rounded-lg border border-border hover:border-brand-gold/50 bg-background text-[10px] font-bold text-foreground hover:bg-muted transition-colors whitespace-nowrap cursor-pointer"
                      >
                        {t(p.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Purchase Date */}
                  <DateRangePicker
                    label={t('purchaseDateRange')}
                    icon={<DollarSign className="size-3.5 text-brand-gold" />}
                    startDate={localFilters.purchase_start_date}
                    endDate={localFilters.purchase_end_date}
                    onChange={(start, end) =>
                      setLocalFilters((p) => ({
                        ...p,
                        purchase_start_date: start,
                        purchase_end_date: end,
                      }))
                    }
                    onClear={() =>
                      setLocalFilters((p) => ({
                        ...p,
                        purchase_start_date: '',
                        purchase_end_date: '',
                      }))
                    }
                    align="left"
                  />

                  {/* Sell Date */}
                  <DateRangePicker
                    label={t('sellDateRange')}
                    icon={<TrendingUp className="size-3.5 text-emerald-500" />}
                    startDate={localFilters.sell_start_date}
                    endDate={localFilters.sell_end_date}
                    onChange={(start, end) =>
                      setLocalFilters((p) => ({
                        ...p,
                        sell_start_date: start,
                        sell_end_date: end,
                      }))
                    }
                    onClear={() =>
                      setLocalFilters((p) => ({
                        ...p,
                        sell_start_date: '',
                        sell_end_date: '',
                      }))
                    }
                    align="right"
                  />

                  {/* Confirmed Date */}
                  <DateRangePicker
                    label={t('confirmedDateRange')}
                    icon={<Truck className="size-3.5 text-blue-500" />}
                    startDate={localFilters.confirmed_start_date}
                    endDate={localFilters.confirmed_end_date}
                    onChange={(start, end) =>
                      setLocalFilters((p) => ({
                        ...p,
                        confirmed_start_date: start,
                        confirmed_end_date: end,
                      }))
                    }
                    onClear={() =>
                      setLocalFilters((p) => ({
                        ...p,
                        confirmed_start_date: '',
                        confirmed_end_date: '',
                      }))
                    }
                    align="left"
                  />

                  {/* Loaded Date */}
                  <DateRangePicker
                    label={t('loadedDateRange')}
                    icon={<Package className="size-3.5 text-amber-500" />}
                    startDate={localFilters.loaded_start_date}
                    endDate={localFilters.loaded_end_date}
                    onChange={(start, end) =>
                      setLocalFilters((p) => ({
                        ...p,
                        loaded_start_date: start,
                        loaded_end_date: end,
                      }))
                    }
                    onClear={() =>
                      setLocalFilters((p) => ({ ...p, loaded_start_date: '', loaded_end_date: '' }))
                    }
                    align="right"
                  />

                  {/* Arrived Date */}
                  <DateRangePicker
                    label={t('arrivedDateRange')}
                    icon={<Check className="size-3.5 text-emerald-500" />}
                    startDate={localFilters.arrived_start_date}
                    endDate={localFilters.arrived_end_date}
                    onChange={(start, end) =>
                      setLocalFilters((p) => ({
                        ...p,
                        arrived_start_date: start,
                        arrived_end_date: end,
                      }))
                    }
                    onClear={() =>
                      setLocalFilters((p) => ({
                        ...p,
                        arrived_start_date: '',
                        arrived_end_date: '',
                      }))
                    }
                    align="left"
                  />

                  {/* Creation Date */}
                  <DateRangePicker
                    label={t('creationDateRange')}
                    icon={<Calendar className="size-3.5 text-brand-gold" />}
                    startDate={localFilters.created_start_date}
                    endDate={localFilters.created_end_date}
                    onChange={(start, end) =>
                      setLocalFilters((p) => ({
                        ...p,
                        created_start_date: start,
                        created_end_date: end,
                      }))
                    }
                    onClear={() =>
                      setLocalFilters((p) => ({
                        ...p,
                        created_start_date: '',
                        created_end_date: '',
                      }))
                    }
                    align="right"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-rose-500 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
                <span>{t('resetAllFilters')}</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-foreground font-bold text-xs transition-colors cursor-pointer"
                >
                  {t('cancel')}
                </button>

                <button
                  type="button"
                  onClick={handleApply}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-gold to-amber-500 hover:from-brand-gold/90 hover:to-amber-500/90 text-brand-navy font-bold text-xs shadow-md shadow-brand-gold/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Filter className="size-4" />
                  <span>{t('applyFilters')}</span>
                  {activeCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-brand-navy text-brand-gold text-[10px] font-extrabold rounded-full">
                      {activeCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
