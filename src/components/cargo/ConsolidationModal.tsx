import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Truck,
  MapPin,
  DollarSign,
  CheckCircle2,
  RefreshCw,
  Clock,
  Shield,
  Repeat,
  Sparkles,
  TrainFront,
  Plane,
  Ship,
  Package,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { usePermissions } from '../../context/PermissionsContext';
import {
  cargoConsolidationsApi,
  CONSOLIDATION_CONTAINER_TYPES,
} from '../../services/cargoConsolidations.service';
import { TRANSPORT_TYPES, TRANSPORT_TYPE_LABELS } from '../../services/cargoRegistrations.service';
import type {
  ConsolidationStatus,
  ConsolidationListItem,
  CreateConsolidationDto,
} from '../../services/cargoConsolidations.service';
import type { CurrencyType, TransportType } from '../../services/cargoRegistrations.service';
import { CitySelect } from './CitySelect';
import { NumberInput } from '../NumberInput';
import { PhoneInput } from '../PhoneInput';
import { Select, type SelectOption } from '../Select';

const TRANSPORT_TYPE_ICONS: Record<TransportType, React.ReactNode> = {
  auto: <Truck className="size-3.5" />,
  railway: <TrainFront className="size-3.5" />,
  air: <Plane className="size-3.5" />,
  sea: <Ship className="size-3.5" />,
  other: <Package className="size-3.5" />,
};

const STATUS_CONFIG: {
  key: ConsolidationStatus;
  labelKey: string;
  label: string;
  badgeClass: string;
  activeClass: string;
  icon: React.ReactNode;
}[] = [
  {
    key: 'Waiting',
    labelKey: 'statusWaiting',
    label: 'Waiting',
    badgeClass: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
    activeClass:
      'bg-yellow-500/25 border-yellow-500 text-yellow-700 dark:text-yellow-300 ring-2 ring-yellow-500/40',
    icon: <Clock className="size-3.5" />,
  },
  {
    key: 'Station',
    labelKey: 'statusStation',
    label: 'Station',
    badgeClass: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    activeClass:
      'bg-cyan-500/25 border-cyan-500 text-cyan-700 dark:text-cyan-300 ring-2 ring-cyan-500/40',
    icon: <MapPin className="size-3.5" />,
  },
  {
    key: 'On the way',
    labelKey: 'statusOnTheWay',
    label: 'On the way',
    badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    activeClass:
      'bg-blue-500/25 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/40',
    icon: <Truck className="size-3.5" />,
  },
  {
    key: 'On the border',
    labelKey: 'statusOnTheBorder',
    label: 'On the border',
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    activeClass:
      'bg-amber-500/25 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/40',
    icon: <Shield className="size-3.5" />,
  },
  {
    key: 'Reload',
    labelKey: 'statusReload',
    label: 'Reload',
    badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    activeClass:
      'bg-purple-500/25 border-purple-500 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/40',
    icon: <Repeat className="size-3.5" />,
  },
  {
    key: 'Arrived',
    labelKey: 'statusArrived',
    label: 'Arrived',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    activeClass:
      'bg-emerald-500/25 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/40',
    icon: <CheckCircle2 className="size-3.5" />,
  },
];

const CURRENCIES: CurrencyType[] = ['USD', 'UZS', 'RUB', 'RMB'];

// Quick presets for common truck capacities
const CONTAINER_PRESETS: Record<string, { vol: number; weight: number }> = {
  '86m3': { vol: 86.0, weight: 22000 },
  '96m3': { vol: 96.0, weight: 22000 },
  '105m3': { vol: 105.0, weight: 24000 },
  '110m3': { vol: 110.0, weight: 24000 },
  '120m3': { vol: 120.0, weight: 25000 },
  '130m3': { vol: 130.0, weight: 25000 },
  '145m3': { vol: 145.0, weight: 26000 },
  '40HQ': { vol: 76.0, weight: 26500 },
  '45HQ': { vol: 86.0, weight: 28000 },
  '40GP': { vol: 67.0, weight: 26500 },
  '20GP': { vol: 33.0, weight: 21500 },
  'Ref Fura': { vol: 86.0, weight: 20000 },
  Tent: { vol: 92.0, weight: 22000 },
  Avto: { vol: 90.0, weight: 22000 },
};

// Shared Select options for the container / body type picker (with capacity presets)
const CONTAINER_TYPE_SELECT_OPTIONS: SelectOption[] = CONSOLIDATION_CONTAINER_TYPES.map((type) => ({
  value: type,
  label: type,
  description: CONTAINER_PRESETS[type]
    ? `${CONTAINER_PRESETS[type].vol} m³ / ${CONTAINER_PRESETS[type].weight} kg`
    : undefined,
}));

// Shared Select options for the currency pickers
const CURRENCY_SELECT_OPTIONS: SelectOption[] = CURRENCIES.map((cur) => ({
  value: cur,
  label: cur,
}));

export interface ConsolidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (item?: ConsolidationListItem) => void;
  editingItem?: ConsolidationListItem | null;
}

export function ConsolidationModal({
  isOpen,
  onClose,
  onSuccess,
  editingItem,
}: ConsolidationModalProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canCreate, canUpdate } = usePermissions();

  const isEditing = !!editingItem;

  // Form states
  const [consolidationCode, setConsolidationCode] = useState<string>('');
  const [containerTruckId, setContainerTruckId] = useState<string>('');
  const [containerType, setContainerType] = useState<string>('86m3');
  const [maxVolumeStr, setMaxVolumeStr] = useState<string>('86');
  const [maxWeightStr, setMaxWeightStr] = useState<string>('22000');
  const [carrierName, setCarrierName] = useState<string>('');
  const [carrierPhone, setCarrierPhone] = useState<string>('');
  const [originPlace, setOriginPlace] = useState<string>('Istanbul');
  const [destinationPlace, setDestinationPlace] = useState<string>('Tashkent');
  const [departureDate, setDepartureDate] = useState<string>('');
  const [estimatedArrivalDate, setEstimatedArrivalDate] = useState<string>('');
  const [loadedDate, setLoadedDate] = useState<string>('');
  const [borderArrivalDate, setBorderArrivalDate] = useState<string>('');
  const [tashkentArrivalDate, setTashkentArrivalDate] = useState<string>('');
  const [arrivedDate, setArrivedDate] = useState<string>('');
  const [carrierCostStr, setCarrierCostStr] = useState<string>('');
  const [carrierCostCurrency, setCarrierCostCurrency] = useState<CurrencyType>('USD');
  const [status, setStatus] = useState<ConsolidationStatus>('Waiting');
  const [description, setDescription] = useState<string>('');
  const [transportTypes, setTransportTypes] = useState<TransportType[]>(['auto']);

  // Cascade sync checkboxes for editing
  const [syncStatusToCargos, setSyncStatusToCargos] = useState<boolean>(true);
  const [syncDatesToCargos, setSyncDatesToCargos] = useState<boolean>(true);
  const [syncTransportTypesToCargos, setSyncTransportTypesToCargos] = useState<boolean>(true);

  const [submitting, setSubmitting] = useState<boolean>(false);

  // Initialize or reset form
  useEffect(() => {
    if (!isOpen) return;

    if (editingItem) {
      setConsolidationCode(editingItem.consolidation_code || '');
      setContainerTruckId(editingItem.container_truck_id || '');
      setContainerType(editingItem.container_type || '86m3');
      setMaxVolumeStr(String(editingItem.capacity?.max_volume_m3 || 86));
      setMaxWeightStr(String(editingItem.capacity?.max_weight_kg || 22000));
      setCarrierName(editingItem.carrier_name || '');
      setCarrierPhone(editingItem.carrier_phone || '');
      setOriginPlace(editingItem.origin_place || '');
      setDestinationPlace(editingItem.destination_place || '');
      setDepartureDate(editingItem.departure_date ? editingItem.departure_date.slice(0, 10) : '');
      setEstimatedArrivalDate(
        editingItem.estimated_arrival_date ? editingItem.estimated_arrival_date.slice(0, 10) : ''
      );
      setLoadedDate(
        editingItem.loaded_date
          ? editingItem.loaded_date.slice(0, 10)
          : editingItem.load_date
            ? editingItem.load_date.slice(0, 10)
            : ''
      );
      setBorderArrivalDate(
        editingItem.border_arrival_date ? editingItem.border_arrival_date.slice(0, 10) : ''
      );
      setTashkentArrivalDate(
        editingItem.tashkent_arrival_date ? editingItem.tashkent_arrival_date.slice(0, 10) : ''
      );
      setArrivedDate(editingItem.arrived_date ? editingItem.arrived_date.slice(0, 10) : '');
      setCarrierCostStr(
        editingItem.total_carrier_cost ? String(editingItem.total_carrier_cost) : ''
      );
      setCarrierCostCurrency(editingItem.carrier_cost_currency || 'USD');
      setStatus(editingItem.status || 'Waiting');
      setDescription(editingItem.description || '');
      setTransportTypes(
        editingItem.transport_types && editingItem.transport_types.length > 0
          ? editingItem.transport_types
          : ['auto']
      );
      setSyncStatusToCargos(true);
      setSyncDatesToCargos(true);
      setSyncTransportTypesToCargos(true);
    } else {
      setConsolidationCode('');
      setContainerTruckId('');
      setContainerType('86m3');
      setMaxVolumeStr('86');
      setMaxWeightStr('22000');
      setCarrierName('');
      setCarrierPhone('');
      setOriginPlace('Istanbul');
      setDestinationPlace('Tashkent');
      setDepartureDate('');
      setEstimatedArrivalDate('');
      setLoadedDate('');
      setBorderArrivalDate('');
      setTashkentArrivalDate('');
      setArrivedDate('');
      setCarrierCostStr('');
      setCarrierCostCurrency('USD');
      setStatus('Waiting');
      setDescription('');
      setTransportTypes(['auto']);
      setSyncStatusToCargos(false);
      setSyncDatesToCargos(false);
      setSyncTransportTypesToCargos(false);
    }
  }, [isOpen, editingItem]);

  // Handle container type preset auto-fill
  const handleContainerTypeChange = (newType: string) => {
    setContainerType(newType);
    if (CONTAINER_PRESETS[newType]) {
      setMaxVolumeStr(String(CONTAINER_PRESETS[newType].vol));
      setMaxWeightStr(String(CONTAINER_PRESETS[newType].weight));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditing && !canCreate('cargo_consolidations')) {
      showNotification(
        t('actionNotAllowed') || 'Permission denied: cannot create consolidation',
        'error'
      );
      return;
    }
    if (isEditing && !canUpdate('cargo_consolidations')) {
      showNotification(
        t('actionNotAllowed') || 'Permission denied: cannot update consolidation',
        'error'
      );
      return;
    }

    if (!containerTruckId.trim()) {
      showNotification(
        t('truckPlateRequired') || 'Truck Plate / Container ID is required',
        'warning'
      );
      return;
    }

    const maxVol = parseFloat(maxVolumeStr) || 0;
    const maxWt = parseFloat(maxWeightStr) || 0;
    const cost = parseFloat(carrierCostStr) || 0;

    if (maxVol <= 0) {
      showNotification('Maximum volume capacity must be greater than 0 m³', 'warning');
      return;
    }

    setSubmitting(true);

    try {
      if (isEditing && editingItem) {
        const updated = await cargoConsolidationsApi.update(editingItem.id, {
          container_truck_id: containerTruckId.trim(),
          container_type: containerType || undefined,
          max_volume_capacity: maxVol,
          max_weight_capacity: maxWt > 0 ? maxWt : undefined,
          carrier_name: carrierName.trim() || undefined,
          carrier_phone: carrierPhone.trim() || undefined,
          origin_place: originPlace.trim() || undefined,
          destination_place: destinationPlace.trim() || undefined,
          departure_date: departureDate || undefined,
          border_arrival_date: borderArrivalDate || undefined,
          tashkent_arrival_date: tashkentArrivalDate || undefined,
          estimated_arrival_date: estimatedArrivalDate || undefined,
          loaded_date: loadedDate || undefined,
          load_date: loadedDate || undefined,
          arrived_date: arrivedDate || undefined,
          total_carrier_cost: cost,
          carrier_cost_currency: carrierCostCurrency,
          status,
          description: description.trim() || undefined,
          sync_status_to_cargos: syncStatusToCargos,
          sync_dates_to_cargos: syncDatesToCargos,
          sync_transport_types_to_cargos: syncTransportTypesToCargos,
          transport_types: transportTypes.length > 0 ? transportTypes : undefined,
        });
        showNotification(
          t('consolidationUpdatedSuccess') || 'Consolidation updated successfully',
          'success'
        );
        onSuccess(updated);
      } else {
        const payload: CreateConsolidationDto = {
          consolidation_code: consolidationCode.trim() || undefined,
          container_truck_id: containerTruckId.trim(),
          container_type: containerType || undefined,
          max_volume_capacity: maxVol,
          max_weight_capacity: maxWt > 0 ? maxWt : undefined,
          carrier_name: carrierName.trim() || undefined,
          carrier_phone: carrierPhone.trim() || undefined,
          origin_place: originPlace.trim() || undefined,
          destination_place: destinationPlace.trim() || undefined,
          departure_date: departureDate || undefined,
          border_arrival_date: borderArrivalDate || undefined,
          tashkent_arrival_date: tashkentArrivalDate || undefined,
          estimated_arrival_date: estimatedArrivalDate || undefined,
          loaded_date: loadedDate || undefined,
          load_date: loadedDate || undefined,
          arrived_date: arrivedDate || undefined,
          total_carrier_cost: cost,
          carrier_cost_currency: carrierCostCurrency,
          status,
          description: description.trim() || undefined,
          transport_types: transportTypes.length > 0 ? transportTypes : undefined,
        };

        const created = await cargoConsolidationsApi.create(payload);
        showNotification(
          t('consolidationCreatedSuccess') || 'Consolidation trip created successfully',
          'success'
        );
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to save consolidation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;
  if (!isEditing && !canCreate('cargo_consolidations')) return null;
  if (isEditing && !canUpdate('cargo_consolidations')) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl rounded-3xl bg-surface border border-border shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border bg-gradient-to-r from-brand-navy/10 via-surface to-brand-royal/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-royal text-brand-gold border border-brand-gold/30 shadow-md">
                <Truck className="size-5 sm:size-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  {isEditing ? t('editConsolidation') : t('createConsolidation')}
                  {isEditing && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-navy dark:text-brand-gold font-mono font-bold border border-brand-gold/30">
                      {editingItem?.consolidation_code}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isEditing
                    ? 'Update trip details, truck capacity, carrier freight cost and route'
                    : 'Register a new consolidated vehicle trip for multi-client LTL groupage'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
            {/* Status Selection Stage Pipeline */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-2">
                {t('colStatus')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {STATUS_CONFIG.map((cfg) => {
                  const isSelected = status === cfg.key;
                  return (
                    <button
                      key={cfg.key}
                      type="button"
                      onClick={() => setStatus(cfg.key)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? cfg.activeClass
                          : 'border-border/60 bg-surface/50 text-muted-foreground hover:border-border hover:text-foreground'
                      }`}
                    >
                      {cfg.icon}
                      <span className="truncate">{t(cfg.labelKey as any) || cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 1: Vehicle & Capacity Specs */}
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/70 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Truck className="size-4 text-brand-gold" />
                  <span>Vehicle & Capacity Specifications</span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Auto-fills capacity metrics based on preset
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Truck Plate */}
                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    {t('truckPlate')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01A777AA or TRK-9021"
                    value={containerTruckId}
                    onChange={(e) => setContainerTruckId(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-foreground font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>

                {/* Container / Body Type */}
                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    {t('containerType')}
                  </label>
                  <Select
                    value={containerType}
                    onChange={handleContainerTypeChange}
                    allowClear={false}
                    aria-label={t('containerType')}
                    options={CONTAINER_TYPE_SELECT_OPTIONS}
                  />
                </div>

                {/* Custom Consolidation Code (optional override) */}
                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    {t('consolidationCode')}{' '}
                    <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    disabled={isEditing}
                    placeholder="Auto-generated if empty"
                    value={consolidationCode}
                    onChange={(e) => setConsolidationCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-foreground font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Transport Types */}
              <div className="p-3.5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 space-y-2">
                <label className="block text-[11px] font-bold text-foreground">
                  Transport Types
                  <span className="ml-1.5 text-[10px] font-medium text-muted-foreground normal-case">
                    (multi-select)
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {TRANSPORT_TYPES.map((tt) => {
                    const selected = transportTypes.includes(tt);
                    return (
                      <button
                        key={tt}
                        type="button"
                        onClick={() =>
                          setTransportTypes((prev) =>
                            prev.includes(tt) ? prev.filter((x) => x !== tt) : [...prev, tt]
                          )
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          selected
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-700 dark:text-cyan-300 ring-2 ring-cyan-500/30'
                            : 'bg-surface border-border text-muted-foreground hover:border-cyan-400/50 hover:text-foreground'
                        }`}
                      >
                        {TRANSPORT_TYPE_ICONS[tt]}
                        <span>{TRANSPORT_TYPE_LABELS[tt]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Volume & Weight Capacities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    {t('volumeCapacity')} <span className="text-red-500">*</span>
                  </label>
                  <NumberInput
                    size="sm"
                    placeholder="86.0"
                    value={maxVolumeStr}
                    onValueChange={(_num, raw) => setMaxVolumeStr(raw)}
                    allowDecimals={true}
                    decimalScale={2}
                    min={0.1}
                    suffix="m³"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    {t('weightCapacity')}
                  </label>
                  <NumberInput
                    size="sm"
                    placeholder="22 000"
                    value={maxWeightStr}
                    onValueChange={(_num, raw) => setMaxWeightStr(raw)}
                    allowDecimals={true}
                    decimalScale={2}
                    min={0}
                    suffix="kg"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Route & Schedule */}
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/70 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <MapPin className="size-4 text-brand-royal" />
                <span>{t('routeLogistics')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <CitySelect
                    label={t('originCity') || 'Origin City'}
                    placeholder="Search origin logistics hub..."
                    value={originPlace}
                    onChange={(city, customText) =>
                      setOriginPlace(city ? city.name : customText || '')
                    }
                  />
                </div>

                <div>
                  <CitySelect
                    label={t('destinationCity') || 'Destination City'}
                    placeholder="Search destination logistics hub..."
                    value={destinationPlace}
                    onChange={(city, customText) =>
                      setDestinationPlace(city ? city.name : customText || '')
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    {t('loadingCompletionDate') || t('loadedDate')}
                  </label>
                  <input
                    type="date"
                    value={loadedDate}
                    onChange={(e) => setLoadedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    {t('departureDate')}
                  </label>
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    {t('borderArrivalDate') || 'Border Arrival Date'}
                  </label>
                  <input
                    type="date"
                    value={borderArrivalDate}
                    onChange={(e) => setBorderArrivalDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    {t('tashkentArrivalDate') || 'Tashkent Arrival Date'}
                  </label>
                  <input
                    type="date"
                    value={tashkentArrivalDate}
                    onChange={(e) => setTashkentArrivalDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    {t('estimatedArrival')}
                  </label>
                  <input
                    type="date"
                    value={estimatedArrivalDate}
                    onChange={(e) => setEstimatedArrivalDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    {t('actualArrival')}
                  </label>
                  <input
                    type="date"
                    value={arrivedDate}
                    onChange={(e) => setArrivedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Carrier & Freight Costs */}
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/70 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <DollarSign className="size-4 text-emerald-500" />
                <span>Carrier Contact & Freight Costs</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    {t('carrierName')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Baytur Lojistik, Silk Road Trans"
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>

                <div>
                  <PhoneInput
                    size="sm"
                    label={t('carrierPhone')}
                    placeholder="e.g. +998 90 123 4567"
                    value={carrierPhone}
                    onChange={(val) => setCarrierPhone(val)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    {t('carrierCost')} (Total Truck Freight)
                  </label>
                  <NumberInput
                    size="sm"
                    placeholder="e.g. 3 800"
                    value={carrierCostStr}
                    onValueChange={(_num, raw) => setCarrierCostStr(raw)}
                    allowDecimals={true}
                    decimalScale={2}
                    min={0}
                    prefix={
                      carrierCostCurrency === 'USD'
                        ? '$'
                        : carrierCostCurrency === 'RUB'
                          ? '₽'
                          : carrierCostCurrency === 'RMB'
                            ? '¥'
                            : undefined
                    }
                    suffix={carrierCostCurrency === 'UZS' ? "so'm" : undefined}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    {t('carrierCostCurrency')}
                  </label>
                  <Select
                    value={carrierCostCurrency}
                    onChange={(val) => setCarrierCostCurrency((val as CurrencyType) || 'USD')}
                    allowClear={false}
                    aria-label={t('carrierCostCurrency')}
                    options={CURRENCY_SELECT_OPTIONS}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Notes / Customs Details */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Notes / Customs Documentation
              </label>
              <textarea
                rows={2}
                placeholder="Optional cargo description, customs border crossing info or remarks..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none"
              />
            </div>

            {/* Cascade Sync Toggles for Editing */}
            {isEditing && (
              <div className="p-3.5 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 space-y-2">
                <div className="text-xs font-bold text-brand-navy dark:text-brand-gold flex items-center gap-1.5">
                  <Sparkles className="size-4 text-brand-gold" />
                  <span>Cascade Sync Options to Attached Cargos</span>
                </div>
                <div className="space-y-1.5 text-xs text-foreground">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={syncStatusToCargos}
                      onChange={(e) => setSyncStatusToCargos(e.target.checked)}
                      className="rounded border-border text-brand-navy focus:ring-brand-gold"
                    />
                    <span>{t('syncStatusToCargos')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={syncDatesToCargos}
                      onChange={(e) => setSyncDatesToCargos(e.target.checked)}
                      className="rounded border-border text-brand-navy focus:ring-brand-gold"
                    />
                    <span>{t('syncDatesToCargos')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={syncTransportTypesToCargos}
                      onChange={(e) => setSyncTransportTypesToCargos(e.target.checked)}
                      className="rounded border-border text-brand-navy focus:ring-brand-gold"
                    />
                    <span>Sync transport types to cargos</span>
                  </label>
                </div>
              </div>
            )}
          </form>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-4 border-t border-border bg-surface/50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-navy to-brand-royal text-white hover:opacity-95 shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 text-brand-gold" />
                  <span>{isEditing ? 'Save Changes' : 'Create Consolidation Trip'}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
