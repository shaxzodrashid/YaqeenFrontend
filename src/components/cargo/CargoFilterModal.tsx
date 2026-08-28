import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  ChevronDown,
  RotateCcw,
  Plus,
  Truck,
  TrainFront,
  Plane,
  Ship,
  Package,
} from 'lucide-react';
import { CONTAINER_TYPES, TRANSPORT_TYPES, TRANSPORT_TYPE_LABELS } from '../../services/api';
import type { CargoRegistrationStatus, CargoType, TransportType } from '../../services/api';
import { ClientSelect } from './ClientSelect';
import { EmployeeSelect } from './EmployeeSelect';
import { CitySelect } from './CitySelect';
import { DateRangePicker } from './DateRangePicker';
import { Select } from '../Select';
import { useTranslation } from '../../context/LanguageContext';

export interface CargoFilterState {
  status: string;
  cargo_type: string;
  container_type: string;
  transport_types: TransportType[];
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
  transport_types: [],
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

const CARGO_TYPE_OPTIONS: { label: string; value: CargoType | '' }[] = [
  { label: 'All', value: '' },
  { label: 'LTL', value: 'LTL' },
  { label: 'FTL', value: 'FTL' },
];

const DATE_CONDITIONS = [
  {
    key: 'purchase',
    labelKey: 'purchaseDateRange',
    startField: 'purchase_start_date',
    endField: 'purchase_end_date',
  },
  {
    key: 'sell',
    labelKey: 'sellDateRange',
    startField: 'sell_start_date',
    endField: 'sell_end_date',
  },
  {
    key: 'confirmed',
    labelKey: 'confirmedDateRange',
    startField: 'confirmed_start_date',
    endField: 'confirmed_end_date',
  },
  {
    key: 'loaded',
    labelKey: 'loadedDateRange',
    startField: 'loaded_start_date',
    endField: 'loaded_end_date',
  },
  {
    key: 'arrived',
    labelKey: 'arrivedDateRange',
    startField: 'arrived_start_date',
    endField: 'arrived_end_date',
  },
  {
    key: 'created',
    labelKey: 'creationDateRange',
    startField: 'created_start_date',
    endField: 'created_end_date',
  },
] as const;

type DateCondition = (typeof DATE_CONDITIONS)[number];
type DateConditionKey = DateCondition['key'];

const TRANSPORT_ICONS: Record<TransportType, ReactNode> = {
  auto: <Truck className="size-3" />,
  railway: <TrainFront className="size-3" />,
  air: <Plane className="size-3" />,
  sea: <Ship className="size-3" />,
  other: <Package className="size-3" />,
};

// Calculate total active filter rules
export function getActiveCargoFilterCount(state: CargoFilterState): number {
  let count = 0;
  if (state.status) count++;
  if (state.cargo_type) count++;
  if (state.container_type) count++;
  if (state.transport_types && state.transport_types.length > 0) count++;
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
}

/** Compact dropdown select for Status — replaces the pill wall. */
function StatusDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: CargoRegistrationStatus | '') => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });
  const btnRef = useRef<HTMLButtonElement>(null);
  const selected = CARGO_STATUS_OPTIONS.find((o) => o.value === value);

  const updatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const PANEL_HEIGHT = 240;
    const spaceBelow = window.innerHeight - rect.bottom;
    let top = rect.bottom + 4;
    if (spaceBelow < PANEL_HEIGHT + 12 && rect.top > PANEL_HEIGHT + 12) {
      top = rect.top - PANEL_HEIGHT - 4;
    }
    setCoords({
      top,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  const toggleOpen = () => {
    if (!open) {
      updatePosition();
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const handleScrollOrResize = () => updatePosition();
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [open, updatePosition]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border bg-background text-xs font-semibold transition-colors cursor-pointer ${
          open
            ? 'border-brand-gold/60 ring-2 ring-brand-gold/30'
            : 'border-border hover:border-border/80'
        }`}
      >
        <span className={`truncate ${value ? 'text-foreground' : 'text-muted-foreground'}`}>
          {selected ? t(selected.labelKey) : t('allStatuses')}
        </span>
        <ChevronDown
          className={`size-3.5 text-muted-foreground shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open &&
        createPortal(
          <>
            {/* Invisible click-catcher to close the dropdown */}
            <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                width: coords.width,
                zIndex: 9999,
              }}
              className="rounded-xl border border-border bg-surface dark:bg-surface shadow-2xl overflow-hidden py-1"
            >
              {CARGO_STATUS_OPTIONS.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'font-bold text-brand-gold bg-brand-gold/10'
                        : 'font-semibold text-foreground hover:bg-muted/70'
                    }`}
                  >
                    <span className="truncate">{t(opt.labelKey)}</span>
                    {isSelected && <Check className="size-3.5 stroke-[3] shrink-0" />}
                  </button>
                );
              })}
            </motion.div>
          </>,
          document.body
        )}
    </div>
  );
}

/** Collapsible filter section with a concise summary when collapsed. */
function FilterSection({
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string;
  summary?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 py-2 group cursor-pointer"
      >
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </span>
        <span className="flex items-center gap-2 min-w-0">
          {summary && (
            <span className="text-[11px] font-semibold text-brand-gold truncate max-w-[240px]">
              {summary}
            </span>
          )}
          <ChevronDown
            className={`size-3.5 text-muted-foreground shrink-0 transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-1 pb-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
  const [openSections, setOpenSections] = useState({
    cargoTransport: false,
    route: false,
    dates: false,
  });
  const [addedDateKinds, setAddedDateKinds] = useState<DateConditionKey[]>([]);
  const [isAddDateMenuOpen, setIsAddDateMenuOpen] = useState(false);
  const addDateBtnRef = useRef<HTMLButtonElement>(null);
  const [addDateMenuStyle, setAddDateMenuStyle] = useState<CSSProperties>({});

  // Sync local state & progressive-disclosure defaults when the modal opens
  useEffect(() => {
    if (!isOpen) return;
    const f = currentFilters;
    setLocalFilters(f);
    setOpenSections({
      cargoTransport: Boolean(
        f.container_type || (f.transport_types && f.transport_types.length > 0)
      ),
      route: Boolean(f.origin_city || f.destination_city),
      dates: DATE_CONDITIONS.some((dc) => f[dc.startField] || f[dc.endField]),
    });
    setAddedDateKinds(
      DATE_CONDITIONS.filter((dc) => f[dc.startField] || f[dc.endField]).map((dc) => dc.key)
    );
    setIsAddDateMenuOpen(false);
  }, [currentFilters, isOpen]);

  const update = (patch: Partial<CargoFilterState>) =>
    setLocalFilters((prev) => ({ ...prev, ...patch }));

  const activeCount = getActiveCargoFilterCount(localFilters);

  // Date conditions currently visible (explicitly added OR already filled)
  const visibleDateConditions = useMemo(
    () =>
      DATE_CONDITIONS.filter(
        (dc) =>
          addedDateKinds.includes(dc.key) ||
          Boolean(localFilters[dc.startField]) ||
          Boolean(localFilters[dc.endField])
      ),
    [addedDateKinds, localFilters]
  );

  const availableDateConditions = useMemo(
    () => DATE_CONDITIONS.filter((dc) => !visibleDateConditions.some((v) => v.key === dc.key)),
    [visibleDateConditions]
  );

  const filledDateConditionsCount = useMemo(
    () =>
      DATE_CONDITIONS.filter((dc) => localFilters[dc.startField] || localFilters[dc.endField])
        .length,
    [localFilters]
  );

  const addDateCondition = (key: DateConditionKey) => {
    setAddedDateKinds((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setIsAddDateMenuOpen(false);
  };

  const toggleAddDateMenu = () => {
    if (!isAddDateMenuOpen && addDateBtnRef.current) {
      const rect = addDateBtnRef.current.getBoundingClientRect();
      const MENU_HEIGHT = availableDateConditions.length * 36 + 8;
      const spaceBelow = window.innerHeight - rect.bottom;
      let top = rect.bottom + 4;
      if (spaceBelow < MENU_HEIGHT + 12 && rect.top > MENU_HEIGHT + 12) {
        top = rect.top - MENU_HEIGHT - 4;
      }
      setAddDateMenuStyle({
        position: 'fixed',
        top,
        left: Math.max(10, Math.min(rect.left, window.innerWidth - 220)),
        width: 208,
        zIndex: 9999,
      });
    }
    setIsAddDateMenuOpen((o) => !o);
  };

  const removeDateCondition = (key: DateConditionKey) => {
    const dc = DATE_CONDITIONS.find((d) => d.key === key);
    if (!dc) return;
    update({ [dc.startField]: '', [dc.endField]: '' } as Partial<CargoFilterState>);
    setAddedDateKinds((prev) => prev.filter((k) => k !== key));
  };

  // Compact active-filter chips shown near the top of the modal
  const activeChips = useMemo(() => {
    const chips: { id: string; label: string; clear: () => void }[] = [];
    const f = localFilters;

    if (f.status) {
      const opt = CARGO_STATUS_OPTIONS.find((o) => o.value === f.status);
      chips.push({
        id: 'status',
        label: t(opt?.labelKey || ''),
        clear: () => update({ status: '' }),
      });
    }
    if (f.cargo_type) {
      chips.push({
        id: 'cargo_type',
        label: f.cargo_type,
        clear: () => update({ cargo_type: '' }),
      });
    }
    if (f.container_type) {
      chips.push({
        id: 'container_type',
        label: f.container_type,
        clear: () => update({ container_type: '' }),
      });
    }
    if (f.transport_types && f.transport_types.length > 0) {
      chips.push({
        id: 'transport_types',
        label: f.transport_types.map((tt) => TRANSPORT_TYPE_LABELS[tt]).join(' · '),
        clear: () => update({ transport_types: [] }),
      });
    }
    if (f.client_id) {
      chips.push({
        id: 'client_id',
        label: f.client_name || t('clientLabel'),
        clear: () => update({ client_id: '', client_name: '' }),
      });
    }
    if (f.employee_id) {
      chips.push({
        id: 'employee_id',
        label: f.employee_name || t('assignedEmployeeLabel'),
        clear: () => update({ employee_id: '', employee_name: '' }),
      });
    }
    if (f.origin_city && f.destination_city) {
      chips.push({
        id: 'route',
        label: `${f.origin_city} → ${f.destination_city}`,
        clear: () =>
          update({
            origin_city: '',
            origin_country_code: '',
            destination_city: '',
            destination_country_code: '',
          }),
      });
    } else {
      if (f.origin_city) {
        chips.push({
          id: 'origin_city',
          label: f.origin_city,
          clear: () => update({ origin_city: '', origin_country_code: '' }),
        });
      }
      if (f.destination_city) {
        chips.push({
          id: 'destination_city',
          label: f.destination_city,
          clear: () => update({ destination_city: '', destination_country_code: '' }),
        });
      }
    }
    DATE_CONDITIONS.forEach((dc) => {
      if (f[dc.startField] || f[dc.endField]) {
        chips.push({
          id: `date_${dc.key}`,
          label: `${t(dc.labelKey)}: ${f[dc.startField] || '…'} – ${f[dc.endField] || '…'}`,
          clear: () => {
            update({ [dc.startField]: '', [dc.endField]: '' } as Partial<CargoFilterState>);
            setAddedDateKinds((prev) => prev.filter((k) => k !== dc.key));
          },
        });
      }
    });

    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localFilters, t]);

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters(INITIAL_CARGO_FILTERS);
    setAddedDateKinds([]);
    setOpenSections({ cargoTransport: false, route: false, dates: false });
    onResetFilters();
    onClose();
  };

  // Concise summaries for collapsed sections
  const cargoSummaryParts: string[] = [];
  if (localFilters.container_type) cargoSummaryParts.push(localFilters.container_type);
  if (localFilters.transport_types && localFilters.transport_types.length > 0) {
    cargoSummaryParts.push(
      localFilters.transport_types.map((tt) => TRANSPORT_TYPE_LABELS[tt]).join(' · ')
    );
  }
  const cargoSummary = cargoSummaryParts.join(' · ');

  const routeSummary =
    localFilters.origin_city && localFilters.destination_city
      ? `${localFilters.origin_city} → ${localFilters.destination_city}`
      : localFilters.origin_city || localFilters.destination_city || '';

  const datesSummary =
    filledDateConditionsCount === 0
      ? ''
      : filledDateConditionsCount === 1
        ? t('dateConditionSingle')
        : t('dateConditionsCount', { count: filledDateConditionsCount });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl bg-surface dark:bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
          >
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-sm font-bold text-foreground">{t('cargoFilterModalTitle')}</h3>
                {activeCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-gold/15 text-brand-gold border border-brand-gold/25">
                    {t('activeFiltersLabel', { count: activeCount })}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('cancel')}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Active filter chips */}
            {activeChips.length > 0 && (
              <div className="px-5 pt-3 flex flex-wrap gap-1.5 shrink-0 max-h-[92px] overflow-y-auto">
                {activeChips.map((chip) => (
                  <span
                    key={chip.id}
                    className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-muted/60 border border-border/70 text-[11px] font-semibold text-foreground max-w-full"
                  >
                    <span className="truncate max-w-[220px]">{chip.label}</span>
                    <button
                      type="button"
                      onClick={chip.clear}
                      aria-label={t('removeFilterChip')}
                      className="p-0.5 rounded-full hover:bg-border/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Body */}
            <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs">
              {/* Primary filters — always visible */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5">
                    {t('filterStatusLabel')}
                  </label>
                  <StatusDropdown
                    value={localFilters.status}
                    onChange={(status) => update({ status })}
                  />
                </div>

                {/* Cargo Type segmented control */}
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5">
                    {t('cargoTypeLabel')}
                  </label>
                  <div className="flex p-0.5 rounded-xl bg-muted/40 border border-border h-[38px]">
                    {CARGO_TYPE_OPTIONS.map((typeOpt) => {
                      const isSelected = localFilters.cargo_type === typeOpt.value;
                      return (
                        <button
                          key={typeOpt.value}
                          type="button"
                          onClick={() => update({ cargo_type: typeOpt.value as CargoType | '' })}
                          className={`flex-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-surface text-brand-gold shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {typeOpt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Client */}
                <ClientSelect
                  value={localFilters.client_id}
                  onChange={(id, name) => update({ client_id: id, client_name: name })}
                  label={t('clientLabel')}
                  placeholder={t('filterByClientPlaceholder')}
                />

                {/* Assigned Employee */}
                <EmployeeSelect
                  value={localFilters.employee_id}
                  onChange={(id, name) => update({ employee_id: id, employee_name: name })}
                  label={t('assignedEmployeeLabel')}
                  placeholder={t('filterByEmployeePlaceholder')}
                />
              </div>

              {/* Collapsible: Cargo & Transport */}
              <div className="border-t border-border/50 pt-1">
                <FilterSection
                  title={t('filterSectionCargoTransport')}
                  summary={cargoSummary}
                  open={openSections.cargoTransport}
                  onToggle={() =>
                    setOpenSections((s) => ({ ...s, cargoTransport: !s.cargoTransport }))
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Container Type */}
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5">
                        {t('containerTypeLabel')}
                      </label>
                      <Select
                        size="sm"
                        value={localFilters.container_type}
                        onChange={(val) => update({ container_type: val })}
                        placeholder={t('allContainerTypes')}
                        allowClear
                        aria-label={t('containerTypeLabel')}
                        options={CONTAINER_TYPES.map((ct) => ({ value: ct, label: ct }))}
                      />
                    </div>

                    {/* Transport Types (multi-select) */}
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5">
                        {t('transportTypesLabel')}
                      </label>
                      <div className="flex flex-wrap gap-1.5 min-h-[38px] content-start">
                        {TRANSPORT_TYPES.map((tt) => {
                          const isSelected = localFilters.transport_types.includes(tt);
                          return (
                            <button
                              key={tt}
                              type="button"
                              onClick={() =>
                                update({
                                  transport_types: isSelected
                                    ? localFilters.transport_types.filter((x) => x !== tt)
                                    : [...localFilters.transport_types, tt],
                                })
                              }
                              aria-pressed={isSelected}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-brand-gold/15 border-brand-gold/50 text-brand-gold'
                                  : 'bg-background border-border text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {TRANSPORT_ICONS[tt]}
                              <span>{TRANSPORT_TYPE_LABELS[tt]}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </FilterSection>
              </div>

              {/* Collapsible: Route Corridor */}
              <div className="border-t border-border/50 pt-1">
                <FilterSection
                  title={t('routeSectionShort')}
                  summary={routeSummary}
                  open={openSections.route}
                  onToggle={() => setOpenSections((s) => ({ ...s, route: !s.route }))}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CitySelect
                      label={t('originCityLabel')}
                      placeholder={t('originCityPlaceholder')}
                      value={localFilters.origin_city}
                      onChange={(city, customText) =>
                        update({
                          origin_city: city ? city.name : customText || '',
                          origin_country_code: city?.country_code || '',
                        })
                      }
                    />
                    <CitySelect
                      label={t('destinationCityLabel')}
                      placeholder={t('destinationCityPlaceholder')}
                      value={localFilters.destination_city}
                      onChange={(city, customText) =>
                        update({
                          destination_city: city ? city.name : customText || '',
                          destination_country_code: city?.country_code || '',
                        })
                      }
                    />
                  </div>
                </FilterSection>
              </div>

              {/* Collapsible: Date Filters ("Add date condition") */}
              <div className="border-t border-border/50 pt-1">
                <FilterSection
                  title={t('dateFiltersShort')}
                  summary={datesSummary}
                  open={openSections.dates}
                  onToggle={() => setOpenSections((s) => ({ ...s, dates: !s.dates }))}
                >
                  <div className="space-y-2.5">
                    {visibleDateConditions.map((dc) => (
                      <div key={dc.key} className="flex items-center gap-2.5">
                        <span className="w-28 sm:w-32 shrink-0 text-[11px] font-semibold text-muted-foreground truncate">
                          {t(dc.labelKey)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <DateRangePicker
                            startDate={localFilters[dc.startField]}
                            endDate={localFilters[dc.endField]}
                            onChange={(start, end) =>
                              update({
                                [dc.startField]: start,
                                [dc.endField]: end,
                              } as Partial<CargoFilterState>)
                            }
                            align="left"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDateCondition(dc.key)}
                          aria-label={t('removeFilterChip')}
                          className="p-1 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-muted transition-colors cursor-pointer shrink-0"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* Add date condition */}
                    {availableDateConditions.length > 0 && (
                      <div className="relative pt-0.5">
                        <button
                          ref={addDateBtnRef}
                          type="button"
                          onClick={toggleAddDateMenu}
                          aria-expanded={isAddDateMenuOpen}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-border hover:border-brand-gold/60 text-[11px] font-bold text-muted-foreground hover:text-brand-gold transition-colors cursor-pointer"
                        >
                          <Plus className="size-3.5" />
                          <span>{t('addDateCondition')}</span>
                        </button>

                        {isAddDateMenuOpen &&
                          createPortal(
                            <>
                              <div
                                className="fixed inset-0 z-[9998]"
                                onClick={() => setIsAddDateMenuOpen(false)}
                              />
                              <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                style={addDateMenuStyle}
                                className="rounded-xl border border-border bg-surface dark:bg-surface shadow-2xl overflow-hidden py-1"
                              >
                                {availableDateConditions.map((dc) => (
                                  <button
                                    key={dc.key}
                                    type="button"
                                    onClick={() => addDateCondition(dc.key)}
                                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors text-left cursor-pointer"
                                  >
                                    <span className="truncate">{t(dc.labelKey)}</span>
                                    <Plus className="size-3.5 text-muted-foreground shrink-0" />
                                  </button>
                                ))}
                              </motion.div>
                            </>,
                            document.body
                          )}
                      </div>
                    )}
                  </div>
                </FilterSection>
              </div>
            </div>

            {/* Footer: Reset (subtle) · Cancel (secondary) · Apply Filters (primary) */}
            <div className="px-5 py-3.5 border-t border-border bg-muted/20 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-muted-foreground hover:text-rose-500 hover:bg-muted/70 transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
                <span>{t('resetAllFilters')}</span>
              </button>

              <div className="flex items-center gap-2">
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-gold to-amber-500 hover:from-brand-gold/90 hover:to-amber-500/90 text-brand-navy font-bold text-xs shadow-md shadow-brand-gold/25 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{t('applyFilters')}</span>
                  {activeCount > 0 && (
                    <span className="px-1.5 min-w-[18px] text-center bg-brand-navy text-brand-gold text-[10px] font-extrabold rounded-full leading-4">
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
