import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Loader2,
  Receipt,
  Calculator,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { usePermissions } from '../../context/PermissionsContext';
import {
  cargoConsolidationsApi,
  CONSOLIDATION_CONTAINER_TYPES,
} from '../../services/cargoConsolidations.service';
import {
  TRANSPORT_TYPES,
  getTransportTypeLabel,
  convertPriceToUsdAndUzs,
} from '../../services/cargoRegistrations.service';
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

// Shared Select options for the container / body type picker
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

// Helper to format date strings for input[type="date"]
function extractDate(val?: string | null): string {
  if (!val || typeof val !== 'string') return '';
  return val.slice(0, 10);
}

// Helper to extract carrier cost from any payload variation
function extractCarrierCost(item: any): { amount: string; currency: CurrencyType } {
  if (!item) return { amount: '', currency: 'USD' };

  let amt: number | string | undefined = undefined;
  let curr: CurrencyType = 'USD';

  if (item.agent !== undefined && item.agent !== null) {
    amt = item.agent;
    curr = item.agent_currency || curr;
  } else if (item.expenses?.agent) {
    amt = item.expenses.agent.amount ?? item.expenses.agent.amount_usd;
    curr = item.expenses.agent.currency || curr;
  } else if (item.financials?.expenses?.agent) {
    amt = item.financials.expenses.agent.amount ?? item.financials.expenses.agent.amount_usd;
    curr = item.financials.expenses.agent.currency || curr;
  } else if (item.carrier_cost && typeof item.carrier_cost === 'object') {
    amt = item.carrier_cost.amount ?? item.carrier_cost.amount_usd;
    curr = item.carrier_cost.currency || curr;
  } else if (item.financials?.carrier_cost && typeof item.financials.carrier_cost === 'object') {
    amt = item.financials.carrier_cost.amount ?? item.financials.carrier_cost.amount_usd;
    curr = item.financials.carrier_cost.currency || curr;
  } else if (item.total_carrier_cost !== undefined && item.total_carrier_cost !== null) {
    amt = item.total_carrier_cost;
  } else if (typeof item.carrier_cost === 'number') {
    amt = item.carrier_cost;
  }

  if (item.carrier_cost_currency) {
    curr = item.carrier_cost_currency;
  }

  const strAmt =
    amt !== undefined && amt !== null && !isNaN(Number(amt)) && Number(amt) > 0
      ? String(amt)
      : amt !== undefined && amt !== null && String(amt) !== '0'
        ? String(amt)
        : '';

  return { amount: strAmt, currency: curr };
}

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

  // 3 Operational expenses
  const [agentStr, setAgentStr] = useState<string>('');
  const [agentCurrency, setAgentCurrency] = useState<CurrencyType>('USD');

  const [customsClearanceStr, setCustomsClearanceStr] = useState<string>('');
  const [customsClearanceCurrency, setCustomsClearanceCurrency] = useState<CurrencyType>('USD');

  const [cctStr, setCctStr] = useState<string>('');
  const [cctCurrency, setCctCurrency] = useState<CurrencyType>('USD');

  const [status, setStatus] = useState<ConsolidationStatus>('Waiting');
  const [description, setDescription] = useState<string>('');
  const [transportTypes, setTransportTypes] = useState<TransportType[]>(['auto']);

  // Cascade sync checkboxes for editing
  const [syncStatusToCargos, setSyncStatusToCargos] = useState<boolean>(true);
  const [syncDatesToCargos, setSyncDatesToCargos] = useState<boolean>(true);
  const [syncTransportTypesToCargos, setSyncTransportTypesToCargos] = useState<boolean>(true);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loadingEditDetails, setLoadingEditDetails] = useState<boolean>(false);

  // Calculate live USD sum of all 3 expenses
  const calculatedExpensesTotalUsd = useMemo(() => {
    const aAmt = parseFloat(agentStr) || 0;
    const ccAmt = parseFloat(customsClearanceStr) || 0;
    const cctAmt = parseFloat(cctStr) || 0;

    const aConv = convertPriceToUsdAndUzs(aAmt, agentCurrency, departureDate);
    const ccConv = convertPriceToUsdAndUzs(ccAmt, customsClearanceCurrency, departureDate);
    const cctConv = convertPriceToUsdAndUzs(cctAmt, cctCurrency, departureDate);

    return Math.round((aConv.amount_usd + ccConv.amount_usd + cctConv.amount_usd) * 100) / 100;
  }, [
    agentStr,
    agentCurrency,
    customsClearanceStr,
    customsClearanceCurrency,
    cctStr,
    cctCurrency,
    departureDate,
  ]);

  // Populate form from any consolidation object
  const populateForm = useCallback((data: any) => {
    if (!data) return;

    setConsolidationCode(data.consolidation_code || data.code || '');
    setContainerTruckId(data.container_truck_id || data.truck_plate || data.container_no || '');
    setContainerType(data.container_type || '86m3');

    const vol =
      data.capacity?.max_volume_m3 ??
      data.max_volume_capacity ??
      data.max_volume_m3 ??
      data.volume_capacity ??
      CONTAINER_PRESETS[data.container_type]?.vol ??
      86;
    setMaxVolumeStr(String(vol));

    const wt =
      data.capacity?.max_weight_kg ??
      data.max_weight_capacity ??
      data.max_weight_kg ??
      data.weight_capacity ??
      CONTAINER_PRESETS[data.container_type]?.weight ??
      22000;
    setMaxWeightStr(String(wt));

    setCarrierName(data.carrier_name || data.carrier?.name || data.driver_name || '');
    setCarrierPhone(data.carrier_phone || data.carrier?.phone || data.driver_phone || '');
    setOriginPlace(
      data.origin_place || data.origin?.city || data.origin?.name || data.origin_city || 'Istanbul'
    );
    setDestinationPlace(
      data.destination_place ||
        data.destination?.city ||
        data.destination?.name ||
        data.destination_city ||
        'Tashkent'
    );

    setDepartureDate(extractDate(data.departure_date || data.departure_start_date));
    setEstimatedArrivalDate(extractDate(data.estimated_arrival_date || data.eta));
    setLoadedDate(extractDate(data.loaded_date || data.load_date));
    setBorderArrivalDate(extractDate(data.border_arrival_date));
    setTashkentArrivalDate(extractDate(data.tashkent_arrival_date));
    setArrivedDate(extractDate(data.arrived_date));

    // 1. Agent / Carrier Cost
    const costObj = extractCarrierCost(data);
    setAgentStr(costObj.amount);
    setAgentCurrency(costObj.currency);

    // 2. Customs Clearance of Goods
    if (data.customs_clearance_of_goods !== undefined && data.customs_clearance_of_goods !== null) {
      setCustomsClearanceStr(String(data.customs_clearance_of_goods));
      setCustomsClearanceCurrency(data.customs_clearance_of_goods_currency || 'USD');
    } else if (data.financials?.expenses?.customs_clearance_of_goods) {
      const cc = data.financials.expenses.customs_clearance_of_goods;
      setCustomsClearanceStr(
        cc.amount !== undefined ? String(cc.amount) : String(cc.amount_usd || '')
      );
      setCustomsClearanceCurrency(cc.currency || 'USD');
    } else {
      setCustomsClearanceStr('');
      setCustomsClearanceCurrency('USD');
    }

    // 3. CCT
    if (data.cct !== undefined && data.cct !== null) {
      setCctStr(String(data.cct));
      setCctCurrency(data.cct_currency || 'USD');
    } else if (data.financials?.expenses?.cct) {
      const cctExp = data.financials.expenses.cct;
      setCctStr(
        cctExp.amount !== undefined ? String(cctExp.amount) : String(cctExp.amount_usd || '')
      );
      setCctCurrency(cctExp.currency || 'USD');
    } else {
      setCctStr('');
      setCctCurrency('USD');
    }

    setStatus(data.status || 'Waiting');
    setDescription(data.description || data.notes || '');

    if (Array.isArray(data.transport_types) && data.transport_types.length > 0) {
      setTransportTypes(data.transport_types);
    } else if (data.transport_type) {
      setTransportTypes([data.transport_type]);
    } else {
      setTransportTypes(['auto']);
    }

    setSyncStatusToCargos(true);
    setSyncDatesToCargos(true);
    setSyncTransportTypesToCargos(true);
  }, []);

  // Initialize and automatically fetch fresh single consolidation details on edit
  useEffect(() => {
    if (!isOpen) return;

    if (editingItem) {
      // 1. Populate immediately from available editingItem
      populateForm(editingItem);

      // 2. Fetch fresh single details from API to ensure complete data sync
      if (editingItem.id) {
        let isCancelled = false;
        setLoadingEditDetails(true);
        cargoConsolidationsApi
          .get(editingItem.id)
          .then((fresh) => {
            if (!isCancelled && fresh) {
              populateForm(fresh);
            }
          })
          .catch((err) => {
            console.warn('Could not fetch single consolidation details for modal:', err);
          })
          .finally(() => {
            if (!isCancelled) setLoadingEditDetails(false);
          });

        return () => {
          isCancelled = true;
        };
      }
    } else {
      // Reset to create mode defaults
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
      setAgentStr('');
      setAgentCurrency('USD');
      setCustomsClearanceStr('');
      setCustomsClearanceCurrency('USD');
      setCctStr('');
      setCctCurrency('USD');
      setStatus('Waiting');
      setDescription('');
      setTransportTypes(['auto']);
      setSyncStatusToCargos(false);
      setSyncDatesToCargos(false);
      setSyncTransportTypesToCargos(false);
      setLoadingEditDetails(false);
    }
  }, [isOpen, editingItem, populateForm]);

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
    const agentAmt = parseFloat(agentStr) || 0;
    const customsClearanceAmt = parseFloat(customsClearanceStr) || 0;
    const cctAmt = parseFloat(cctStr) || 0;

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
          agent: agentAmt,
          agent_currency: agentCurrency,
          customs_clearance_of_goods: customsClearanceAmt,
          customs_clearance_of_goods_currency: customsClearanceCurrency,
          cct: cctAmt,
          cct_currency: cctCurrency,
          total_carrier_cost: agentAmt,
          carrier_cost_currency: agentCurrency,
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
          agent: agentAmt,
          agent_currency: agentCurrency,
          customs_clearance_of_goods: customsClearanceAmt,
          customs_clearance_of_goods_currency: customsClearanceCurrency,
          cct: cctAmt,
          cct_currency: cctCurrency,
          total_carrier_cost: agentAmt,
          carrier_cost_currency: agentCurrency,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <div className="fixed inset-0" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-3xl rounded-3xl bg-surface border border-border shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border bg-gradient-to-r from-brand-navy/10 via-surface to-brand-royal/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-royal text-brand-gold border border-brand-gold/30 shadow-md">
                <Truck className="size-5 sm:size-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <span>
                    {isEditing
                      ? t('editConsolidation') || 'Edit Consolidation'
                      : t('createConsolidation') || 'Create Consolidation'}
                  </span>
                  {isEditing && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-navy dark:text-brand-gold font-mono font-bold border border-brand-gold/30">
                      {editingItem?.consolidation_code}
                    </span>
                  )}
                  {loadingEditDetails && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-normal">
                      <Loader2 className="size-3 animate-spin text-brand-gold" />
                      <span>{t('syncing') || 'Syncing...'}</span>
                    </span>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isEditing
                    ? t('modalConsolidationEditSubtitle') ||
                      'Update trip details, truck capacity, carrier freight cost and schedule'
                    : t('modalConsolidationCreateSubtitle') ||
                      'Register a new consolidated vehicle trip for multi-client LTL groupage'}
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
          <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1">
            {/* Status Selection Stage Pipeline */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-2">
                {t('colStatus') || 'Trip Status'}
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
                  <span>{t('vehicleSpecs') || 'Vehicle & Capacity Specifications'}</span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {t('presetsAutoFill') || 'Presets auto-fill volume & payload'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Truck Plate */}
                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    {t('truckPlate') || 'Truck Plate / Container ID'}{' '}
                    <span className="text-red-500">*</span>
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
                    {t('containerType') || 'Body / Container Type'}
                  </label>
                  <Select
                    value={containerType}
                    onChange={handleContainerTypeChange}
                    allowClear={false}
                    aria-label={t('containerType')}
                    options={CONTAINER_TYPE_SELECT_OPTIONS}
                  />
                </div>

                {/* Custom Consolidation Code */}
                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    {t('consolidationCode') || 'Consolidation Code'}{' '}
                    <span className="text-muted-foreground font-normal">
                      ({t('optional') || 'Optional'})
                    </span>
                  </label>
                  <input
                    type="text"
                    disabled={isEditing}
                    placeholder={t('autoGeneratedCode') || 'Auto-generated if empty'}
                    value={consolidationCode}
                    onChange={(e) => setConsolidationCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-foreground font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Transport Types */}
              <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 space-y-1.5">
                <label className="block text-[11px] font-bold text-foreground">
                  {t('transportTypesLabel') || 'Transport Types'}
                  <span className="ml-1.5 text-[10px] font-medium text-muted-foreground normal-case">
                    ({t('multiSelect') || 'multi-select'})
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
                        <span>{getTransportTypeLabel(tt, t)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Volume & Weight Capacities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    {t('volumeCapacity') || 'Volume Capacity (m³)'}{' '}
                    <span className="text-red-500">*</span>
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
                    {t('weightCapacity') || 'Payload Weight Capacity (kg)'}
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
                <span>{t('routeLogistics') || 'Route Corridor & Milestones'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <CitySelect
                    label={t('originCity') || 'Origin City'}
                    placeholder={t('searchOriginHub') || 'Search origin logistics hub...'}
                    value={originPlace}
                    onChange={(city, customText) =>
                      setOriginPlace(city ? city.name : customText || '')
                    }
                  />
                </div>

                <div>
                  <CitySelect
                    label={t('destinationCity') || 'Destination City'}
                    placeholder={t('searchDestHub') || 'Search destination logistics hub...'}
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
                    {t('departureDate') || 'Departure Date'}
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
                    {t('loadingCompletionDate') || t('loadedDate') || 'Loaded Date'}
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
                    {t('tashkentArrivalDate') || 'Destination Hub Arrival'}
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
                    {t('estimatedArrival') || 'Est. Arrival Date'}
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
                    {t('actualArrival') || 'Actual Arrival Date'}
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

            {/* Section 3: Carrier & 5 Operational Expenses */}
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/70 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <DollarSign className="size-4 text-emerald-500" />
                  <span>
                    {t('carrierAndOperationalExpenses') || 'Carrier & Operational Expenses'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <Calculator className="size-3.5" />
                  <span>
                    {t('totalExpenses') || 'Total Expenses'}: $
                    {calculatedExpensesTotalUsd.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Carrier Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    {t('carrierName') || 'Carrier / Driver Name'}
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
                    label={t('carrierPhone') || 'Carrier Phone'}
                    placeholder="e.g. +998 90 123 4567"
                    value={carrierPhone}
                    onChange={(val) => setCarrierPhone(val)}
                  />
                </div>
              </div>

              {/* 3 Operational Expense Inputs */}
              <div className="space-y-3 pt-2 border-t border-border/50">
                <p className="text-[11px] font-semibold text-muted-foreground">
                  {t('operationalCostBreakdown') || 'Operational Cost Breakdown (3 categories)'}
                </p>

                {/* 1. Agent / Line-haul */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center p-2.5 rounded-xl bg-surface/60 border border-border/50">
                  <div className="sm:col-span-5 flex items-center gap-2">
                    <Truck className="size-4 text-brand-navy dark:text-brand-gold shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        {t('agentFreightTitle') || 'Agent / Carrier Freight'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {t('agentFreightSubtitle') || 'Line-haul freight cost'}
                      </span>
                    </div>
                  </div>
                  <div className="sm:col-span-4">
                    <NumberInput
                      size="sm"
                      placeholder="0.00"
                      value={agentStr}
                      onValueChange={(_num, raw) => setAgentStr(raw)}
                      allowDecimals={true}
                      decimalScale={2}
                      min={0}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Select
                      value={agentCurrency}
                      onChange={(val) => setAgentCurrency((val as CurrencyType) || 'USD')}
                      allowClear={false}
                      aria-label="Agent Currency"
                      options={CURRENCY_SELECT_OPTIONS}
                    />
                  </div>
                </div>

                {/* 2. Customs Clearance of Goods */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center p-2.5 rounded-xl bg-surface/60 border border-border/50">
                  <div className="sm:col-span-5 flex items-center gap-2">
                    <Shield className="size-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        {t('customsClearanceTitle') || 'Customs Clearance'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {t('customsClearanceSubtitle') || 'Declaration & terminal fees'}
                      </span>
                    </div>
                  </div>
                  <div className="sm:col-span-4">
                    <NumberInput
                      size="sm"
                      placeholder="0.00"
                      value={customsClearanceStr}
                      onValueChange={(_num, raw) => setCustomsClearanceStr(raw)}
                      allowDecimals={true}
                      decimalScale={2}
                      min={0}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Select
                      value={customsClearanceCurrency}
                      onChange={(val) =>
                        setCustomsClearanceCurrency((val as CurrencyType) || 'USD')
                      }
                      allowClear={false}
                      aria-label="Customs Clearance Currency"
                      options={CURRENCY_SELECT_OPTIONS}
                    />
                  </div>
                </div>

                {/* 3. CCT */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center p-2.5 rounded-xl bg-surface/60 border border-border/50">
                  <div className="sm:col-span-5 flex items-center gap-2">
                    <Receipt className="size-4 text-purple-500 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        {t('cctCertTitle') || 'CCT / Certificate'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {t('cctCertSubtitle') || 'Cargo container terminal & cert'}
                      </span>
                    </div>
                  </div>
                  <div className="sm:col-span-4">
                    <NumberInput
                      size="sm"
                      placeholder="0.00"
                      value={cctStr}
                      onValueChange={(_num, raw) => setCctStr(raw)}
                      allowDecimals={true}
                      decimalScale={2}
                      min={0}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Select
                      value={cctCurrency}
                      onChange={(val) => setCctCurrency((val as CurrencyType) || 'USD')}
                      allowClear={false}
                      aria-label="CCT Currency"
                      options={CURRENCY_SELECT_OPTIONS}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Notes / Remarks */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                {t('lblNotes') || 'Notes / Customs Documentation'}
              </label>
              <textarea
                rows={2}
                placeholder={
                  t('notesPlaceholder') ||
                  'Optional trip notes, border clearance instructions or remarks...'
                }
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
                  <span>{t('cascadeSyncTitle') || 'Cascade Sync Options to Attached Cargos'}</span>
                </div>
                <div className="space-y-1.5 text-xs text-foreground">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={syncStatusToCargos}
                      onChange={(e) => setSyncStatusToCargos(e.target.checked)}
                      className="rounded border-border text-brand-navy focus:ring-brand-gold"
                    />
                    <span>{t('syncStatusToCargos') || 'Sync status to attached child cargos'}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={syncDatesToCargos}
                      onChange={(e) => setSyncDatesToCargos(e.target.checked)}
                      className="rounded border-border text-brand-navy focus:ring-brand-gold"
                    />
                    <span>{t('syncDatesToCargos') || 'Sync dates to attached child cargos'}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={syncTransportTypesToCargos}
                      onChange={(e) => setSyncTransportTypesToCargos(e.target.checked)}
                      className="rounded border-border text-brand-navy focus:ring-brand-gold"
                    />
                    <span>
                      {t('syncTransportTypesToCargos') ||
                        'Sync transport types to attached child cargos'}
                    </span>
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
              {t('actionCancel') || 'Cancel'}
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
                  <span>{t('saving') || 'Saving...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 text-brand-gold" />
                  <span>
                    {isEditing
                      ? t('saveChanges') || 'Save Changes'
                      : t('createConsolidationTrip') || 'Create Consolidation Trip'}
                  </span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
