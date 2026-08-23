import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt,
  X,
  Box,
  Layers,
  RefreshCw,
  Truck,
  Building2,
  Package,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Coins,
  TrendingUp,
  TrendingDown,
  UserCheck,
  Percent,
  Check,
  Sparkles,
  Shield,
  Repeat,
  Copy,
  AlertTriangle,
  TrainFront,
  Plane,
  Ship,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { usePermissions } from '../../context/PermissionsContext';
import {
  cargoRegistrationsApi,
  CONTAINER_TYPES,
  TRANSPORT_TYPES,
  TRANSPORT_TYPE_LABELS,
  employeesApi,
  formatMoney,
  currencyApi,
  convertPriceToUsdAndUzs,
  locationsApi,
} from '../../services/api';
import type {
  CargoType,
  ContainerType,
  TransportType,
  CargoRegistrationStatus,
  CurrencyType,
} from '../../services/api';
import { EmployeeSelect } from './EmployeeSelect';
import { ClientSelect } from './ClientSelect';
import { ConsolidationSelect } from './ConsolidationSelect';
import { ConsolidationModal } from './ConsolidationModal';
import { RouteSelector, type RouteState } from './RouteSelector';
import { NumberInput } from '../NumberInput';

const STATUS_STAGE_CONFIG: {
  key: CargoRegistrationStatus;
  labelKey: string;
  label: string;
  badgeClass: string;
  activeClass: string;
  dotClass: string;
  icon: React.ReactNode;
}[] = [
  {
    key: 'Waiting',
    labelKey: 'statusWaiting',
    label: 'Waiting',
    badgeClass: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
    activeClass:
      'bg-yellow-500/25 border-yellow-500 text-yellow-700 dark:text-yellow-300 ring-2 ring-yellow-500/40 shadow-sm',
    dotClass: 'bg-yellow-500',
    icon: <Clock className="size-3.5" />,
  },
  {
    key: 'Station',
    labelKey: 'statusStation',
    label: 'Station',
    badgeClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    activeClass:
      'bg-indigo-500/25 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/40 shadow-sm',
    dotClass: 'bg-indigo-500',
    icon: <MapPin className="size-3.5" />,
  },
  {
    key: 'On the way',
    labelKey: 'statusOnTheWay',
    label: 'On the way',
    badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    activeClass:
      'bg-blue-500/25 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/40 shadow-sm',
    dotClass: 'bg-blue-500',
    icon: <Truck className="size-3.5" />,
  },
  {
    key: 'On the border',
    labelKey: 'statusOnTheBorder',
    label: 'On the border',
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    activeClass:
      'bg-amber-500/25 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/40 shadow-sm',
    dotClass: 'bg-amber-500',
    icon: <Shield className="size-3.5" />,
  },
  {
    key: 'Reload',
    labelKey: 'statusReload',
    label: 'Reload',
    badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    activeClass:
      'bg-purple-500/25 border-purple-500 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/40 shadow-sm',
    dotClass: 'bg-purple-500',
    icon: <Repeat className="size-3.5" />,
  },
  {
    key: 'Arrived',
    labelKey: 'statusArrived',
    label: 'Arrived',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    activeClass:
      'bg-emerald-500/25 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/40 shadow-sm',
    dotClass: 'bg-emerald-500',
    icon: <CheckCircle2 className="size-3.5" />,
  },
];

const CURRENCIES: CurrencyType[] = ['USD', 'UZS', 'RUB', 'RMB'];

const TRANSPORT_TYPE_ICONS: Record<TransportType, React.ReactNode> = {
  auto: <Truck className="size-3.5" />,
  railway: <TrainFront className="size-3.5" />,
  air: <Plane className="size-3.5" />,
  sea: <Ship className="size-3.5" />,
  other: <Package className="size-3.5" />,
};

export interface CargoRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingId?: string | null;
  duplicateFromId?: string | null;
  initialStatus?: CargoRegistrationStatus;
}

export function CargoRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  editingId,
  duplicateFromId,
  initialStatus = 'Waiting',
}: CargoRegistrationModalProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canRegisterForEveryone, canCreate } = usePermissions();

  const [myEmployeeId, setMyEmployeeId] = useState<string>('');

  // Form Fields
  const [cargoType, setCargoType] = useState<CargoType>('LTL');
  const [consolidationId, setConsolidationId] = useState<string | null>(null);
  const [isConsolidationModalOpen, setIsConsolidationModalOpen] = useState<boolean>(false);
  const [volumeStr, setVolumeStr] = useState<string>('10');
  const [weightStr, setWeightStr] = useState<string>('1200');
  const [containerType, setContainerType] = useState<ContainerType>('40HQ');
  const [transportTypes, setTransportTypes] = useState<TransportType[]>(['auto']);
  const [containerTruckId, setContainerTruckId] = useState<string>('');
  const [agentName, setAgentName] = useState<string>('SilkRoad Express');
  const [cargo, setCargo] = useState<string>('General Cargo');
  const [confirmedDate, setConfirmedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loadedDate, setLoadedDate] = useState<string>('');
  const [arrivedDate, setArrivedDate] = useState<string>('');
  const [purchasePriceStr, setPurchasePriceStr] = useState<string>('4500');
  const [purchaseCurrency, setPurchaseCurrency] = useState<CurrencyType>('USD');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [purchaseCustomRateStr, setPurchaseCustomRateStr] = useState<string>('');

  const [sellPriceStr, setSellPriceStr] = useState<string>('6200');
  const [sellCurrency, setSellCurrency] = useState<CurrencyType>('USD');
  const [sellDate, setSellDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sellCustomRateStr, setSellCustomRateStr] = useState<string>('');

  const [usdRmbRateStr, setUsdRmbRateStr] = useState<string>('7.235');
  const [status, setStatus] = useState<CargoRegistrationStatus>(initialStatus);
  const [description, setDescription] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Route Corridor State
  const [route, setRoute] = useState<RouteState>({
    origin_city: 'Yiwu',
    origin_country: 'China',
    origin_country_code: 'CN',
    origin_geoname_id: 1787687,
    origin_lat: 29.31506,
    origin_lng: 120.07676,
    destination_city: 'Tashkent',
    destination_country: 'Uzbekistan',
    destination_country_code: 'UZ',
    destination_geoname_id: 1512569,
    destination_lat: 41.26465,
    destination_lng: 69.21627,
  });

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const [rates, setRates] = useState<Record<string, number>>({
    USD: 12800,
    RUB: 140,
    RMB: 1780,
    UZS: 1,
  });

  // Pre-flight duplicate checking
  useEffect(() => {
    if (!isOpen || editingId) {
      setDuplicateWarning(null);
      return;
    }
    if (!selectedClientId || !containerTruckId.trim()) {
      setDuplicateWarning(null);
      return;
    }

    const timer = setTimeout(() => {
      locationsApi
        .checkDuplicateCargo({
          client_id: selectedClientId,
          container_truck_id: containerTruckId.trim(),
          cargo: cargo.trim() || undefined,
          purchase_price: parseFloat(purchasePriceStr) || undefined,
          origin_city: route.origin_city || undefined,
          destination_city: route.destination_city || undefined,
        })
        .then((res) => {
          if (res.is_duplicate) {
            setDuplicateWarning(
              res.message || 'An identical cargo entry was detected for this client and truck.'
            );
          } else {
            setDuplicateWarning(null);
          }
        })
        .catch(() => {});
    }, 400);

    return () => clearTimeout(timer);
  }, [isOpen, editingId, selectedClientId, containerTruckId, cargo, purchasePriceStr, route]);

  // Fetch exchange rates on modal open
  useEffect(() => {
    if (!isOpen) return;
    currencyApi
      .getExchangeRates()
      .then((data) => {
        if (data?.rates) {
          const newRates: Record<string, number> = { UZS: 1 };
          Object.entries(data.rates).forEach(([curr, item]) => {
            newRates[curr] = item.rate;
          });
          if (data.rates.CNY && !data.rates.RMB) {
            newRates.RMB = data.rates.CNY.rate;
          }
          setRates((prev) => ({ ...prev, ...newRates }));
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const isRmbRateRequired = useMemo(() => {
    return purchaseCurrency === 'RMB' || sellCurrency === 'RMB';
  }, [purchaseCurrency, sellCurrency]);

  // Load current user profile ID
  useEffect(() => {
    employeesApi
      .me()
      .then((me) => {
        if (me) {
          setMyEmployeeId(me.id);
          setSelectedEmpId((prev) => prev || me.id);
        }
      })
      .catch(() => {});
  }, []);

  // Initialize or fetch details when editingId changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingId) {
      setLoadingDetails(true);
      cargoRegistrationsApi
        .get(editingId)
        .then((detail) => {
          setCargoType(detail.cargo_type || 'LTL');
          setVolumeStr(detail.volume ? String(detail.volume) : '');
          setWeightStr(detail.weight ? String(detail.weight) : '');
          setContainerType((detail.container_type as ContainerType) || '40HQ');
          setTransportTypes(
            detail.transport_types && detail.transport_types.length > 0
              ? detail.transport_types
              : ['auto']
          );
          setContainerTruckId(detail.container_truck_id || '');
          setAgentName(detail.agent_name || '');
          setCargo(detail.cargo || '');
          setConfirmedDate(detail.confirmed_date ? detail.confirmed_date.slice(0, 10) : '');
          setLoadedDate(detail.loaded_date ? detail.loaded_date.slice(0, 10) : '');
          setArrivedDate(detail.arrived_date ? detail.arrived_date.slice(0, 10) : '');
          setPurchasePriceStr(String(detail.purchase_price ?? 0));
          setPurchaseCurrency(detail.purchase_currency || 'USD');
          setPurchaseDate(
            detail.purchase_date
              ? detail.purchase_date.slice(0, 10)
              : detail.confirmed_date
                ? detail.confirmed_date.slice(0, 10)
                : new Date().toISOString().split('T')[0]
          );
          setPurchaseCustomRateStr(
            detail.purchase_custom_rate ? String(detail.purchase_custom_rate) : ''
          );

          setSellPriceStr(String(detail.sell_price ?? 0));
          setSellCurrency(detail.sell_currency || 'USD');
          setSellDate(
            detail.sell_date
              ? detail.sell_date.slice(0, 10)
              : new Date().toISOString().split('T')[0]
          );
          setSellCustomRateStr(detail.sell_custom_rate ? String(detail.sell_custom_rate) : '');

          setUsdRmbRateStr(detail.usd_rmb_rate ? String(detail.usd_rmb_rate) : '7.235');
          setStatus(detail.status || initialStatus);
          setDescription(detail.description || '');
          setSelectedClientId(detail.client_id || '');
          setSelectedEmpId(detail.employee_id || myEmployeeId || '');
          setConsolidationId(detail.consolidation_id || (detail.consolidation?.id ?? null));

          setRoute({
            origin_city: detail.origin_city || '',
            origin_country: detail.origin_country || '',
            origin_country_code: detail.origin_country_code || '',
            origin_geoname_id: detail.origin_geoname_id ?? null,
            origin_lat: detail.origin_lat ?? null,
            origin_lng: detail.origin_lng ?? null,
            destination_city: detail.destination_city || '',
            destination_country: detail.destination_country || '',
            destination_country_code: detail.destination_country_code || '',
            destination_geoname_id: detail.destination_geoname_id ?? null,
            destination_lat: detail.destination_lat ?? null,
            destination_lng: detail.destination_lng ?? null,
          });
        })
        .catch((err) => {
          showNotification(err?.message || 'Failed to load cargo details', 'error');
        })
        .finally(() => {
          setLoadingDetails(false);
        });
    } else if (duplicateFromId) {
      setLoadingDetails(true);
      cargoRegistrationsApi
        .get(duplicateFromId)
        .then((detail) => {
          const todayStr = new Date().toISOString().split('T')[0];
          setCargoType(detail.cargo_type || 'LTL');
          setVolumeStr(detail.volume ? String(detail.volume) : '');
          setWeightStr(detail.weight ? String(detail.weight) : '');
          setContainerType((detail.container_type as ContainerType) || '40HQ');
          setTransportTypes(
            detail.transport_types && detail.transport_types.length > 0
              ? detail.transport_types
              : ['auto']
          );

          let copyTruckId = detail.container_truck_id ? `${detail.container_truck_id}-COPY` : '';
          if (detail.container_truck_id && detail.container_truck_id.endsWith('-COPY')) {
            copyTruckId = `${detail.container_truck_id}-1`;
          } else if (detail.container_truck_id) {
            const match = detail.container_truck_id.match(/-COPY-(\d+)$/);
            if (match) {
              copyTruckId = detail.container_truck_id.replace(
                /-COPY-\d+$/,
                `-COPY-${parseInt(match[1], 10) + 1}`
              );
            }
          }
          setContainerTruckId(copyTruckId);
          setAgentName(detail.agent_name || '');
          setCargo(detail.cargo || '');
          setConfirmedDate(todayStr);
          setLoadedDate('');
          setArrivedDate('');
          setPurchasePriceStr(String(detail.purchase_price ?? 0));
          setPurchaseCurrency(detail.purchase_currency || 'USD');
          setPurchaseDate(todayStr);
          setPurchaseCustomRateStr(
            detail.purchase_custom_rate ? String(detail.purchase_custom_rate) : ''
          );

          setSellPriceStr(String(detail.sell_price ?? 0));
          setSellCurrency(detail.sell_currency || 'USD');
          setSellDate(todayStr);
          setSellCustomRateStr(detail.sell_custom_rate ? String(detail.sell_custom_rate) : '');

          setUsdRmbRateStr(detail.usd_rmb_rate ? String(detail.usd_rmb_rate) : '7.235');
          setStatus('Waiting');
          setDescription(detail.description || '');
          setSelectedClientId(detail.client_id || '');
          setSelectedEmpId(detail.employee_id || myEmployeeId || '');
          setConsolidationId(detail.consolidation_id || null);

          setRoute({
            origin_city: detail.origin_city || '',
            origin_country: detail.origin_country || '',
            origin_country_code: detail.origin_country_code || '',
            origin_geoname_id: detail.origin_geoname_id ?? null,
            origin_lat: detail.origin_lat ?? null,
            origin_lng: detail.origin_lng ?? null,
            destination_city: detail.destination_city || '',
            destination_country: detail.destination_country || '',
            destination_country_code: detail.destination_country_code || '',
            destination_geoname_id: detail.destination_geoname_id ?? null,
            destination_lat: detail.destination_lat ?? null,
            destination_lng: detail.destination_lng ?? null,
          });
        })
        .catch((err) => {
          showNotification(err?.message || 'Failed to load cargo details for duplicate', 'error');
        })
        .finally(() => {
          setLoadingDetails(false);
        });
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      setCargoType('LTL');
      setConsolidationId(null);
      setVolumeStr('10');
      setWeightStr('1200');
      setContainerType('40HQ');
      setTransportTypes(['auto']);
      setContainerTruckId('TRK-' + Math.floor(1000 + Math.random() * 9000));
      setAgentName('SilkRoad Express');
      setCargo('General Cargo');
      setConfirmedDate(todayStr);
      setLoadedDate('');
      setArrivedDate('');
      setPurchasePriceStr('4500');
      setPurchaseCurrency('USD');
      setPurchaseDate(todayStr);
      setPurchaseCustomRateStr('');
      setSellPriceStr('6200');
      setSellCurrency('USD');
      setSellDate(todayStr);
      setSellCustomRateStr('');
      setUsdRmbRateStr('7.235');
      setStatus(initialStatus);
      setDescription('');
      setSelectedClientId('');
      setSelectedEmpId(myEmployeeId || '');

      setRoute({
        origin_city: 'Yiwu',
        origin_country: 'China',
        origin_country_code: 'CN',
        origin_geoname_id: 1787687,
        origin_lat: 29.31506,
        origin_lng: 120.07676,
        destination_city: 'Tashkent',
        destination_country: 'Uzbekistan',
        destination_country_code: 'UZ',
        destination_geoname_id: 1512569,
        destination_lat: 41.26465,
        destination_lng: 69.21627,
      });
    }
  }, [isOpen, editingId, duplicateFromId, initialStatus, myEmployeeId, showNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClientId) {
      showNotification(t('warnSelectClient') || 'Please select a client.', 'warning');
      return;
    }

    if (!containerTruckId.trim() || !/^[a-zA-Z0-9-]+$/.test(containerTruckId.trim())) {
      showNotification(
        'Container / Truck ID is required and must contain only letters, numbers, and hyphens',
        'warning'
      );
      return;
    }

    if (!agentName.trim()) {
      showNotification('Agent name is required.', 'warning');
      return;
    }
    if (!cargo.trim()) {
      showNotification('Cargo description is required.', 'warning');
      return;
    }

    const vol = parseFloat(volumeStr) || 0;
    const wt = parseFloat(weightStr) || 0;

    if (cargoType === 'LTL') {
      if (vol <= 0) {
        showNotification('Volume (> 0) is required for LTL cargo.', 'warning');
        return;
      }
      if (wt <= 0) {
        showNotification('Weight (> 0) is required for LTL cargo.', 'warning');
        return;
      }
    }

    if (cargoType === 'FTL') {
      if (!containerType || !CONTAINER_TYPES.includes(containerType)) {
        showNotification('Please select a valid container type for FTL cargo.', 'warning');
        return;
      }
    }

    const rate = parseFloat(usdRmbRateStr) || 0;
    if (isRmbRateRequired && rate <= 0) {
      showNotification(
        'USD -> RMB rate (> 0) is required when RMB currency is selected.',
        'warning'
      );
      return;
    }

    const bp = parseFloat(purchasePriceStr) || 0;
    const sp = parseFloat(sellPriceStr) || 0;
    if (bp < 0 || sp < 0) {
      showNotification('Prices cannot be negative.', 'warning');
      return;
    }

    const pCustom = parseFloat(purchaseCustomRateStr) || undefined;
    const sCustom = parseFloat(sellCustomRateStr) || undefined;

    const canAssignEveryone = canRegisterForEveryone();
    const finalEmployeeId = canAssignEveryone && selectedEmpId ? selectedEmpId : myEmployeeId;

    if (!finalEmployeeId) {
      showNotification('Employee assignment is required.', 'warning');
      return;
    }

    setSubmitting(true);

    try {
      if (editingId) {
        await cargoRegistrationsApi.update(editingId, {
          cargo_type: cargoType,
          volume: cargoType === 'LTL' ? vol : undefined,
          weight: cargoType === 'LTL' ? wt : undefined,
          container_type: cargoType === 'FTL' ? containerType : undefined,
          container_truck_id: containerTruckId.trim(),
          agent_name: agentName.trim(),
          cargo: cargo.trim(),
          origin_city: route.origin_city || undefined,
          origin_country: route.origin_country || undefined,
          origin_country_code: route.origin_country_code || undefined,
          origin_geoname_id: route.origin_geoname_id ?? undefined,
          origin_lat: route.origin_lat ?? undefined,
          origin_lng: route.origin_lng ?? undefined,
          destination_city: route.destination_city || undefined,
          destination_country: route.destination_country || undefined,
          destination_country_code: route.destination_country_code || undefined,
          destination_geoname_id: route.destination_geoname_id ?? undefined,
          destination_lat: route.destination_lat ?? undefined,
          destination_lng: route.destination_lng ?? undefined,
          confirmed_date: confirmedDate || undefined,
          loaded_date: loadedDate || undefined,
          arrived_date: arrivedDate || undefined,
          purchase_price: bp,
          purchase_currency: purchaseCurrency,
          purchase_date: purchaseDate || undefined,
          purchase_exchange_rate: pCustom,
          purchase_custom_rate: pCustom,
          sell_price: sp,
          sell_currency: sellCurrency,
          sell_date: sellDate || undefined,
          sell_exchange_rate: sCustom,
          sell_custom_rate: sCustom,
          usd_rmb_rate: isRmbRateRequired ? rate : undefined,
          transport_types: transportTypes.length > 0 ? transportTypes : undefined,
          status,
          description: description.trim() || undefined,
          client_id: selectedClientId,
          employee_id: finalEmployeeId,
          consolidation_id: cargoType === 'LTL' ? consolidationId || null : null,
        });
        showNotification('Cargo registration updated successfully', 'success');
      } else {
        await cargoRegistrationsApi.create({
          cargo_type: cargoType,
          volume: cargoType === 'LTL' ? vol : undefined,
          weight: cargoType === 'LTL' ? wt : undefined,
          container_type: cargoType === 'FTL' ? containerType : undefined,
          container_truck_id: containerTruckId.trim(),
          agent_name: agentName.trim(),
          cargo: cargo.trim(),
          origin_city: route.origin_city || undefined,
          origin_country: route.origin_country || undefined,
          origin_country_code: route.origin_country_code || undefined,
          origin_geoname_id: route.origin_geoname_id ?? undefined,
          origin_lat: route.origin_lat ?? undefined,
          origin_lng: route.origin_lng ?? undefined,
          destination_city: route.destination_city || undefined,
          destination_country: route.destination_country || undefined,
          destination_country_code: route.destination_country_code || undefined,
          destination_geoname_id: route.destination_geoname_id ?? undefined,
          destination_lat: route.destination_lat ?? undefined,
          destination_lng: route.destination_lng ?? undefined,
          prevent_duplicate: true,
          transport_types: transportTypes.length > 0 ? transportTypes : undefined,
          idempotency_key: `cr-idem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          confirmed_date: confirmedDate || undefined,
          loaded_date: loadedDate || undefined,
          arrived_date: arrivedDate || undefined,
          purchase_price: bp,
          purchase_currency: purchaseCurrency,
          purchase_date: purchaseDate || undefined,
          purchase_exchange_rate: pCustom,
          purchase_custom_rate: pCustom,
          sell_price: sp,
          sell_currency: sellCurrency,
          sell_date: sellDate || undefined,
          sell_exchange_rate: sCustom,
          sell_custom_rate: sCustom,
          usd_rmb_rate: isRmbRateRequired ? rate : undefined,
          status,
          description: description.trim() || undefined,
          client_id: selectedClientId,
          employee_id: finalEmployeeId,
          consolidation_id: cargoType === 'LTL' ? consolidationId || undefined : undefined,
        });
        showNotification('Cargo registration created successfully', 'success');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to save cargo registration', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const modalNetYieldPreview = useMemo(() => {
    const bp = parseFloat(purchasePriceStr) || 0;
    const sp = parseFloat(sellPriceStr) || 0;
    const rate = parseFloat(usdRmbRateStr) || 7.235;
    const pCustom = parseFloat(purchaseCustomRateStr) || null;
    const sCustom = parseFloat(sellCustomRateStr) || null;

    const cbuRates = {
      USD: rates.USD || 11886.72,
      RUB: rates.RUB || 140,
      RMB: rates.RMB || 1780,
    };

    const purConv = convertPriceToUsdAndUzs(
      bp,
      purchaseCurrency,
      purchaseDate,
      pCustom || undefined,
      rate,
      cbuRates
    );

    const sellConv = convertPriceToUsdAndUzs(
      sp,
      sellCurrency,
      sellDate,
      sCustom || undefined,
      rate,
      cbuRates
    );

    const marginUsd = Math.round((sellConv.amount_usd - purConv.amount_usd) * 100) / 100;
    const marginUzs = Math.round((sellConv.amount_uzs - purConv.amount_uzs) * 100) / 100;
    const margin =
      sellCurrency === 'USD' ? marginUsd : sellCurrency === 'UZS' ? marginUzs : marginUsd;
    const roiPct = purConv.amount_usd > 0 ? (marginUsd / purConv.amount_usd) * 100 : 0;

    let marginUsdStr: string | null = null;
    if (sellCurrency !== 'USD') {
      marginUsdStr = formatMoney(marginUsd, 'USD');
    }

    return {
      margin,
      roiPct,
      marginUsdStr,
      marginUsd,
      marginUzs,
      purConv,
      sellConv,
      purchase_currency: purchaseCurrency,
      sell_currency: sellCurrency,
    };
  }, [
    purchasePriceStr,
    purchaseCurrency,
    purchaseDate,
    purchaseCustomRateStr,
    sellPriceStr,
    sellCurrency,
    sellDate,
    sellCustomRateStr,
    usdRmbRateStr,
    rates,
  ]);

  const canAssignEveryone = canRegisterForEveryone();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl bg-surface border border-border/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-foreground my-auto flex flex-col max-h-[90vh]"
        >
          {/* Top Brand Decorative Border Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-brand-navy via-brand-gold to-brand-royal shrink-0" />

          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/70 shrink-0 bg-muted/20">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30 shadow-xs">
                {duplicateFromId ? <Copy className="size-6" /> : <Receipt className="size-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-lg text-foreground tracking-tight">
                    {editingId
                      ? t('editCargoRegTitle') || 'Edit Cargo Registration'
                      : duplicateFromId
                        ? t('duplicateCargoModalTitle') || 'Duplicate Cargo Registration'
                        : t('registerCargoTitle') || 'Register Cargo / Shipment'}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-gold/10 text-brand-gold border border-brand-gold/25">
                    {duplicateFromId ? t('actionDuplicate') || 'Duplicate' : 'Logistics Spec'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {duplicateFromId
                    ? t('duplicateCargoModalDesc') ||
                      'Create a new cargo registration pre-filled with details from the selected shipment.'
                    : t('registerCargoSubtitle') ||
                      'Submit LTL or FTL cargo details according to unified specification.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all cursor-pointer border border-transparent hover:border-border"
            >
              <X className="size-5" />
            </button>
          </div>

          {loadingDetails ? (
            <div className="py-20 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
              <RefreshCw className="size-8 animate-spin text-brand-gold" />
              <p className="text-xs font-semibold">Loading registration details...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              {/* Form Content - Scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar">
                {/* DUPLICATE DETECTION WARNING BANNER */}
                {duplicateWarning && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-start gap-3 text-xs leading-relaxed animate-in fade-in duration-200">
                    <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-bold">
                        {t('duplicateCargoDetected') || 'Duplicate Cargo Warning'}
                      </div>
                      <div>{duplicateWarning}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDuplicateWarning(null)}
                      className="text-muted-foreground hover:text-foreground text-[11px] underline ml-2 cursor-pointer"
                    >
                      {t('dismiss') || 'Dismiss'}
                    </button>
                  </div>
                )}

                {/* SECTION 1: CARGO TYPE HERO SWITCHER */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    1. Cargo Type & Logistics Method <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCargoType('LTL')}
                      className={`p-4 rounded-2xl border transition-all text-left flex items-start gap-3.5 cursor-pointer ${
                        cargoType === 'LTL'
                          ? 'border-amber-500/60 bg-amber-500/10 text-foreground ring-1 ring-amber-500/40 shadow-sm'
                          : 'border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-muted/30'
                      }`}
                    >
                      <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                        <Box className="size-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-foreground">
                          LTL Cargo (Groupage)
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
                          Partial container load calculated by Volume (m³) & Weight (kg)
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCargoType('FTL')}
                      className={`p-4 rounded-2xl border transition-all text-left flex items-start gap-3.5 cursor-pointer ${
                        cargoType === 'FTL'
                          ? 'border-indigo-500/60 bg-indigo-500/10 text-foreground ring-1 ring-indigo-500/40 shadow-sm'
                          : 'border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-muted/30'
                      }`}
                    >
                      <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                        <Layers className="size-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-foreground">
                          FTL Cargo (Full Truck)
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
                          Full container load with standard whitelisted specifications
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* DYNAMIC CAPACITY FIELDS */}
                {cargoType === 'LTL' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                    <NumberInput
                      label="Volume (m³)"
                      isRequired
                      suffix="m³"
                      placeholder="e.g. 12.5"
                      value={volumeStr}
                      onValueChange={(_num, raw) => setVolumeStr(raw)}
                      allowDecimals={true}
                      decimalScale={3}
                      min={0.1}
                    />

                    <NumberInput
                      label="Weight (kg)"
                      isRequired
                      suffix="kg"
                      placeholder="e.g. 1 450"
                      value={weightStr}
                      onValueChange={(_num, raw) => setWeightStr(raw)}
                      allowDecimals={true}
                      decimalScale={2}
                      min={1}
                    />
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-1.5">
                    <label className="block text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>Container Specification</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <select
                      required
                      value={containerType}
                      onChange={(e) => setContainerType(e.target.value as ContainerType)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-field-border bg-field text-field-foreground text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                    >
                      {CONTAINER_TYPES.map((ct) => (
                        <option key={ct} value={ct}>
                          {ct}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-muted-foreground">
                      Select one of the 22 whitelisted standardized container specifications.
                    </p>
                  </div>
                )}

                {/* TRANSPORT TYPES */}
                <div className="p-3.5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 space-y-2">
                  <label className="block text-xs font-bold text-foreground flex items-center justify-between">
                    <span>Transport Types</span>
                    <span className="text-[10px] font-medium text-muted-foreground normal-case tracking-normal">
                      Multi-select · defaults to Auto
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
                              : 'bg-field border-field-border text-muted-foreground hover:border-cyan-400/50 hover:text-foreground'
                          }`}
                        >
                          {TRANSPORT_TYPE_ICONS[tt]}
                          <span>{TRANSPORT_TYPE_LABELS[tt]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION 2: LOGISTICS IDENTIFIERS */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    2. Shipment Identification & Route Logistics
                  </label>

                  {/* LTL Consolidation Truck Search-or-Create Selector */}
                  {cargoType === 'LTL' && (
                    <div className="p-3.5 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-brand-navy dark:text-brand-gold flex items-center gap-1.5">
                          <Truck className="size-3.5" />
                          <span>Consolidation Truck Trip (LTL Groupage)</span>
                        </label>
                        <span className="text-[11px] text-muted-foreground">
                          Optionally link to active truck or create new
                        </span>
                      </div>
                      <ConsolidationSelect
                        value={consolidationId}
                        requiredVolume={parseFloat(volumeStr) || undefined}
                        onChange={(id, selected) => {
                          setConsolidationId(id);
                          if (selected) {
                            setContainerTruckId(selected.container_truck_id);
                            if (selected.carrier_name && !agentName) {
                              setAgentName(selected.carrier_name);
                            }
                          }
                        }}
                        onRequestCreateNew={
                          canCreate('cargo_consolidations')
                            ? () => setIsConsolidationModalOpen(true)
                            : undefined
                        }
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Container / Truck ID <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Truck className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          pattern="^[a-zA-Z0-9-]+$"
                          value={containerTruckId}
                          onChange={(e) => setContainerTruckId(e.target.value.toUpperCase())}
                          placeholder="TRK-9872"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-field-border bg-field text-field-foreground text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-focus/30 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Agent / Carrier Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={agentName}
                          onChange={(e) => setAgentName(e.target.value)}
                          placeholder="SilkRoad Logistics"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-field-border bg-field text-field-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-focus/30 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Cargo Description <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Package className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={cargo}
                          onChange={(e) => setCargo(e.target.value)}
                          placeholder="Electric Scooters"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-field-border bg-field text-field-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-focus/30 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Origin & Destination Route Intelligence Selector */}
                  <div className="pt-2">
                    <RouteSelector route={route} onChange={setRoute} />
                  </div>
                </div>

                {/* SECTION 3: CLIENT & MANAGER ASSIGNMENT */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    3. Client & Manager Assignment
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <ClientSelect
                        value={selectedClientId}
                        onChange={(cid) => setSelectedClientId(cid)}
                        required
                      />
                    </div>

                    <div>
                      {canAssignEveryone ? (
                        <EmployeeSelect
                          value={selectedEmpId}
                          onChange={(eid) => setSelectedEmpId(eid)}
                          label="Assigned Employee (Register for Everyone)"
                          required
                        />
                      ) : (
                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1.5">
                            Assigned Employee
                          </label>
                          <div className="px-3.5 py-2.5 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground flex items-center justify-between">
                            <span className="font-semibold text-foreground flex items-center gap-2">
                              <UserCheck className="size-4 text-emerald-500" />
                              <span>Auto-assigned to your account</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-bold text-[10px]">
                              Active User
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 4: FINANCIAL SPECIFICATIONS & YIELD PREVIEW */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>4. Commercial Financials & Exchange Rates</span>
                    <Coins className="size-4 text-amber-500" />
                  </label>

                  <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Purchase Price & Rate Section */}
                      <div className="space-y-2.5 p-3 rounded-xl bg-background/50 border border-border/60">
                        <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Coins className="size-3.5 text-amber-500" />
                          <span>Purchase Price (Buy Cost)</span>{' '}
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex gap-2 items-center">
                          <div className="flex-1">
                            <NumberInput
                              size="sm"
                              placeholder="0.00"
                              value={purchasePriceStr}
                              onValueChange={(_num, raw) => setPurchasePriceStr(raw)}
                              allowDecimals={true}
                              decimalScale={2}
                              min={0}
                              prefix={
                                purchaseCurrency === 'USD'
                                  ? '$'
                                  : purchaseCurrency === 'RUB'
                                    ? '₽'
                                    : purchaseCurrency === 'RMB'
                                      ? '¥'
                                      : undefined
                              }
                              suffix={purchaseCurrency === 'UZS' ? "so'm" : undefined}
                            />
                          </div>
                          <select
                            value={purchaseCurrency}
                            onChange={(e) => setPurchaseCurrency(e.target.value as CurrencyType)}
                            className="h-9 px-3 rounded-lg border border-field-border bg-field text-field-foreground text-xs font-bold focus:ring-2 focus:ring-focus/30 shrink-0 cursor-pointer"
                          >
                            {CURRENCIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                              Purchase Date
                            </label>
                            <input
                              type="date"
                              value={purchaseDate}
                              onChange={(e) => setPurchaseDate(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-field text-foreground text-[11px] font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                              Custom Rate (UZS/USD)
                            </label>
                            <NumberInput
                              size="sm"
                              placeholder={`Auto (${(rates.USD || 12800).toLocaleString()})`}
                              value={purchaseCustomRateStr}
                              onValueChange={(_num, raw) => setPurchaseCustomRateStr(raw)}
                              allowDecimals={true}
                              decimalScale={2}
                              min={0}
                              suffix="so'm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sell Price & Rate Section */}
                      <div className="space-y-2.5 p-3 rounded-xl bg-background/50 border border-border/60">
                        <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Coins className="size-3.5 text-emerald-500" />
                          <span>Selling Price</span> <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex gap-2 items-center">
                          <div className="flex-1">
                            <NumberInput
                              size="sm"
                              placeholder="0.00"
                              value={sellPriceStr}
                              onValueChange={(_num, raw) => setSellPriceStr(raw)}
                              allowDecimals={true}
                              decimalScale={2}
                              min={0}
                              prefix={
                                sellCurrency === 'USD'
                                  ? '$'
                                  : sellCurrency === 'RUB'
                                    ? '₽'
                                    : sellCurrency === 'RMB'
                                      ? '¥'
                                      : undefined
                              }
                              suffix={sellCurrency === 'UZS' ? "so'm" : undefined}
                            />
                          </div>
                          <select
                            value={sellCurrency}
                            onChange={(e) => setSellCurrency(e.target.value as CurrencyType)}
                            className="h-9 px-3 rounded-lg border border-field-border bg-field text-field-foreground text-xs font-bold focus:ring-2 focus:ring-focus/30 shrink-0 cursor-pointer"
                          >
                            {CURRENCIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                              Sell Date
                            </label>
                            <input
                              type="date"
                              value={sellDate}
                              onChange={(e) => setSellDate(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-field text-foreground text-[11px] font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                              Custom Rate (UZS/USD)
                            </label>
                            <NumberInput
                              size="sm"
                              placeholder={`Auto (${(rates.USD || 12800).toLocaleString()})`}
                              value={sellCustomRateStr}
                              onValueChange={(_num, raw) => setSellCustomRateStr(raw)}
                              allowDecimals={true}
                              decimalScale={2}
                              min={0}
                              suffix="so'm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Conditional RMB Exchange Rate Box */}
                    {isRmbRateRequired && (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <label className="block text-xs font-bold text-amber-600 dark:text-amber-400">
                            USD -&gt; RMB Exchange Rate <span className="text-rose-500">*</span>
                          </label>
                          <p className="text-[10px] text-muted-foreground">
                            Required when purchase or sell currency is set to RMB.
                          </p>
                        </div>
                        <div className="w-full sm:w-36">
                          <NumberInput
                            size="sm"
                            placeholder="7.235"
                            value={usdRmbRateStr}
                            onValueChange={(_num, raw) => setUsdRmbRateStr(raw)}
                            allowDecimals={true}
                            decimalScale={4}
                            min={0.0001}
                            suffix="¥"
                          />
                        </div>
                      </div>
                    )}

                    {/* LIVE NET YIELD & ROI PREVIEW CARD */}
                    <div className="p-4 rounded-2xl bg-surface border border-brand-gold/30 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2.5 rounded-xl ${
                            modalNetYieldPreview.margin >= 0
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : 'bg-rose-500/15 text-rose-500'
                          }`}
                        >
                          {modalNetYieldPreview.margin >= 0 ? (
                            <TrendingUp className="size-5" />
                          ) : (
                            <TrendingDown className="size-5" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground flex items-center gap-2">
                            <span>Estimated Net Profit</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                                modalNetYieldPreview.roiPct >= 0
                                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                              }`}
                            >
                              <Percent className="size-3" />
                              {modalNetYieldPreview.roiPct.toFixed(1)}% ROI
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Selling price minus purchase cost ({modalNetYieldPreview.sell_currency})
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-border/50">
                        <span
                          className={`text-base sm:text-lg font-black tracking-tight ${
                            modalNetYieldPreview.margin >= 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {formatMoney(
                            modalNetYieldPreview.margin,
                            modalNetYieldPreview.sell_currency
                          )}
                        </span>
                        {modalNetYieldPreview.marginUsdStr && (
                          <span className="text-[11px] font-semibold text-muted-foreground block">
                            ≈ {modalNetYieldPreview.marginUsdStr}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 5: TIMELINE & INTERACTIVE STATUS STAGE */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    5. Shipment Dates & Status Pipeline
                  </label>

                  {/* Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                        <Calendar className="size-3.5 text-amber-500" />
                        <span>Confirmed Date</span>
                      </label>
                      <input
                        type="date"
                        value={confirmedDate}
                        onChange={(e) => setConfirmedDate(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-field-border bg-field text-field-foreground text-xs font-semibold focus:ring-2 focus:ring-focus/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                        <Calendar className="size-3.5 text-blue-500" />
                        <span>Loaded Date</span>
                      </label>
                      <input
                        type="date"
                        value={loadedDate}
                        onChange={(e) => setLoadedDate(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-field-border bg-field text-field-foreground text-xs font-semibold focus:ring-2 focus:ring-focus/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                        <Calendar className="size-3.5 text-emerald-500" />
                        <span>Arrived Date</span>
                      </label>
                      <input
                        type="date"
                        value={arrivedDate}
                        onChange={(e) => setArrivedDate(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-field-border bg-field text-field-foreground text-xs font-semibold focus:ring-2 focus:ring-focus/30"
                      />
                    </div>
                  </div>

                  {/* Status Pipeline Selection Pills */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Select Current Shipment Stage
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                      {STATUS_STAGE_CONFIG.map((st) => {
                        const isActive = status === st.key;
                        return (
                          <button
                            key={st.key}
                            type="button"
                            onClick={() => setStatus(st.key)}
                            className={`px-2.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                              isActive
                                ? st.activeClass
                                : 'border-border bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40'
                            }`}
                          >
                            {isActive ? (
                              <Check className="size-3.5 text-current shrink-0" />
                            ) : (
                              <span className={`size-2 rounded-full ${st.dotClass}`} />
                            )}
                            <span className="truncate">{t(st.labelKey) || st.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* SECTION 6: HANDLING NOTES */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    6. Optional Handling Notes & Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide optional handling instructions, customs details, or notes..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-field-border bg-field text-field-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-focus/30 transition-all resize-none"
                  />
                </div>
              </div>

              {/* STICKY FOOTER ACTION BAR */}
              <div className="px-6 py-4 border-t border-border bg-muted/30 shrink-0 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer border border-transparent hover:border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold/90 text-brand-navy font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      <span>Saving Shipment...</span>
                    </>
                  ) : (
                    <>
                      {duplicateFromId ? (
                        <Copy className="size-4" />
                      ) : (
                        <Sparkles className="size-4" />
                      )}
                      <span>
                        {editingId
                          ? t('btnUpdateRegistration') || 'Update Registration'
                          : duplicateFromId
                            ? t('btnCreateDuplicate') || 'Create Duplicate'
                            : t('btnSubmitRegistration') || 'Submit Registration'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>

      {/* Inline New Consolidation Creation Modal */}
      {canCreate('cargo_consolidations') && (
        <ConsolidationModal
          isOpen={isConsolidationModalOpen}
          onClose={() => setIsConsolidationModalOpen(false)}
          onSuccess={(newConsolidation) => {
            if (newConsolidation) {
              setConsolidationId(newConsolidation.id);
              setContainerTruckId(newConsolidation.container_truck_id);
              if (newConsolidation.carrier_name) {
                setAgentName(newConsolidation.carrier_name);
              }
            }
          }}
        />
      )}
    </AnimatePresence>
  );
}
