import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt,
  X,
  Box,
  Layers,
  RefreshCw,
  Truck,
  Package,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  UserCheck,
  Check,
  Shield,
  Repeat,
  Copy,
  TrainFront,
  Plane,
  Ship,
  Zap,
  KeyRound,
  PlusCircle,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { T } from '../T';
import { useNotification } from '../../context/NotificationContext';
import { usePermissions } from '../../context/PermissionsContext';
import {
  cargoRegistrationsApi,
  CONTAINER_TYPES,
  TRANSPORT_TYPES,
  getTransportTypeLabel,
  employeesApi,
  formatMoney,
  currencyApi,
  convertPriceToUsdAndUzs,
} from '../../services/api';
import { cargoConsolidationsApi } from '../../services/cargoConsolidations.service';
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
import { Select, type SelectOption } from '../Select';

const STATUS_CONFIG: {
  key: CargoRegistrationStatus;
  labelKey: string;
  label: string;
  activeClass: string;
  icon: React.ReactNode;
}[] = [
  {
    key: 'Waiting',
    labelKey: 'statusWaiting',
    label: 'Waiting',
    activeClass:
      'bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:text-yellow-300 ring-2 ring-yellow-500/30',
    icon: <Clock className="size-3.5" />,
  },
  {
    key: 'Station',
    labelKey: 'statusStation',
    label: 'Station',
    activeClass:
      'bg-cyan-500/20 border-cyan-500 text-cyan-700 dark:text-cyan-300 ring-2 ring-cyan-500/30',
    icon: <MapPin className="size-3.5" />,
  },
  {
    key: 'On the way',
    labelKey: 'statusOnTheWay',
    label: 'On the way',
    activeClass:
      'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/30',
    icon: <Truck className="size-3.5" />,
  },
  {
    key: 'On the border',
    labelKey: 'statusOnTheBorder',
    label: 'On the border',
    activeClass:
      'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30',
    icon: <Shield className="size-3.5" />,
  },
  {
    key: 'Reload',
    labelKey: 'statusReload',
    label: 'Reload',
    activeClass:
      'bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/30',
    icon: <Repeat className="size-3.5" />,
  },
  {
    key: 'Arrived',
    labelKey: 'statusArrived',
    label: 'Arrived',
    activeClass:
      'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30',
    icon: <CheckCircle2 className="size-3.5" />,
  },
];

const CURRENCIES: CurrencyType[] = ['USD', 'UZS', 'RUB', 'RMB'];

const CONTAINER_OPTIONS: SelectOption[] = CONTAINER_TYPES.map((ct) => ({
  value: ct,
  label: ct,
}));

const CURRENCY_OPTIONS: SelectOption[] = CURRENCIES.map((c) => ({
  value: c,
  label: c,
}));

const TRANSPORT_ICONS: Record<TransportType, React.ReactNode> = {
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
  initialCargoType?: CargoType;
  lockCargoType?: CargoType;
  initialConsolidationId?: string | null;
  initialContainerTruckId?: string | null;
  lockConsolidation?: boolean;
}

export function CargoRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  editingId,
  duplicateFromId,
  initialStatus = 'Waiting',
  initialCargoType = 'LTL',
  lockCargoType,
  initialConsolidationId,
  initialContainerTruckId,
  lockConsolidation,
}: CargoRegistrationModalProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canRegisterForEveryone, canCreate } = usePermissions();

  const [myEmployeeId, setMyEmployeeId] = useState<string>('');

  // Core Logistics States
  const [cargoType, setCargoType] = useState<CargoType>(
    initialConsolidationId ? 'LTL' : lockCargoType || initialCargoType || 'LTL'
  );
  const [consolidationId, setConsolidationId] = useState<string | null>(
    initialConsolidationId || null
  );
  const [isConsolidationModalOpen, setIsConsolidationModalOpen] = useState<boolean>(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');

  // Identifiers & Physical Specs
  const [containerTruckId, setContainerTruckId] = useState<string>(initialContainerTruckId || '');
  const [agentName, setAgentName] = useState<string>('SilkRoad Express');
  const [cargo, setCargo] = useState<string>('General Cargo');
  const [volumeStr, setVolumeStr] = useState<string>('10');
  const [weightStr, setWeightStr] = useState<string>('1200');
  const [loadCode, setLoadCode] = useState<string>('');
  const [containerType, setContainerType] = useState<ContainerType>('40HQ');
  const [transportTypes, setTransportTypes] = useState<TransportType[]>(['auto']);

  // Route
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

  // Base Commercials
  const [purchasePriceStr, setPurchasePriceStr] = useState<string>('4500');
  const [purchaseCurrency, setPurchaseCurrency] = useState<CurrencyType>('USD');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [sellPriceStr, setSellPriceStr] = useState<string>('6200');
  const [sellCurrency, setSellCurrency] = useState<CurrencyType>('USD');
  const [sellDate, setSellDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Auxiliary Financials: Additional Expense, Internal Logistics, Turnkey, Speed Up
  const [additionalExpenseStr, setAdditionalExpenseStr] = useState<string>('');
  const [additionalExpenseCurrency, setAdditionalExpenseCurrency] = useState<CurrencyType>('USD');

  const [internalLogisticsCostStr, setInternalLogisticsCostStr] = useState<string>('');
  const [internalLogisticsCurrency, setInternalLogisticsCurrency] = useState<CurrencyType>('USD');

  const [isTurnkey, setIsTurnkey] = useState<boolean>(false);
  const [turnkeyPriceStr, setTurnkeyPriceStr] = useState<string>('');
  const [turnkeyCurrency, setTurnkeyCurrency] = useState<CurrencyType>('USD');

  const [isSpeedUp, setIsSpeedUp] = useState<boolean>(false);
  const [speedUpStr, setSpeedUpStr] = useState<string>('');
  const [speedUpCurrency, setSpeedUpCurrency] = useState<CurrencyType>('USD');

  const [usdRmbRateStr, setUsdRmbRateStr] = useState<string>('7.235');

  // Status & Schedule
  const [status, setStatus] = useState<CargoRegistrationStatus>(initialStatus);
  const [confirmedDate, setConfirmedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loadedDate, setLoadedDate] = useState<string>('');
  const [arrivedDate, setArrivedDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [rates, setRates] = useState<Record<string, number>>({
    USD: 12800,
    RUB: 140,
    RMB: 1780,
    UZS: 1,
  });

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

  const isRmbRateRequired = useMemo(() => {
    return (
      purchaseCurrency === 'RMB' ||
      sellCurrency === 'RMB' ||
      (isTurnkey && turnkeyCurrency === 'RMB') ||
      (isSpeedUp && speedUpCurrency === 'RMB') ||
      additionalExpenseCurrency === 'RMB' ||
      (cargoType === 'LTL' &&
        parseFloat(internalLogisticsCostStr) > 0 &&
        internalLogisticsCurrency === 'RMB')
    );
  }, [
    purchaseCurrency,
    sellCurrency,
    isTurnkey,
    turnkeyCurrency,
    isSpeedUp,
    speedUpCurrency,
    additionalExpenseCurrency,
    cargoType,
    internalLogisticsCostStr,
    internalLogisticsCurrency,
  ]);

  // Initialize or fetch details
  useEffect(() => {
    if (!isOpen) return;

    if (editingId) {
      setLoadingDetails(true);
      cargoRegistrationsApi
        .get(editingId)
        .then((detail) => {
          setCargoType(detail.cargo_type || 'LTL');
          setSelectedClientId(detail.client_id || '');
          setSelectedEmpId(detail.employee_id || myEmployeeId || '');
          setConsolidationId(detail.consolidation_id || (detail.consolidation?.id ?? null));
          setContainerTruckId(detail.container_truck_id || '');
          setAgentName(detail.agent_name || '');
          setCargo(detail.cargo || '');
          setVolumeStr(detail.volume ? String(detail.volume) : '');
          setWeightStr(detail.weight ? String(detail.weight) : '');
          setLoadCode(detail.load_code || '');
          setContainerType((detail.container_type as ContainerType) || '40HQ');
          setTransportTypes(
            detail.transport_types && detail.transport_types.length > 0
              ? detail.transport_types
              : ['auto']
          );

          setPurchasePriceStr(String(detail.purchase_price ?? 0));
          setPurchaseCurrency(detail.purchase_currency || 'USD');
          setPurchaseDate(
            detail.purchase_date
              ? detail.purchase_date.slice(0, 10)
              : new Date().toISOString().split('T')[0]
          );

          setSellPriceStr(String(detail.sell_price ?? 0));
          setSellCurrency(detail.sell_currency || 'USD');
          setSellDate(
            detail.sell_date
              ? detail.sell_date.slice(0, 10)
              : new Date().toISOString().split('T')[0]
          );

          setAdditionalExpenseStr(
            detail.additional_expense && detail.additional_expense > 0
              ? String(detail.additional_expense)
              : ''
          );
          setAdditionalExpenseCurrency(detail.additional_expense_currency || 'USD');

          if (detail.cargo_type === 'LTL') {
            setInternalLogisticsCostStr(
              detail.internal_logistics_cost && detail.internal_logistics_cost > 0
                ? String(detail.internal_logistics_cost)
                : ''
            );
            setInternalLogisticsCurrency(detail.internal_logistics_currency || 'USD');
          } else {
            setInternalLogisticsCostStr('');
            setInternalLogisticsCurrency('USD');
          }

          setIsTurnkey(Boolean(detail.is_turnkey));
          setTurnkeyPriceStr(
            detail.turnkey_price && detail.turnkey_price > 0 ? String(detail.turnkey_price) : ''
          );
          setTurnkeyCurrency(detail.turnkey_currency || detail.sell_currency || 'USD');

          setIsSpeedUp(Boolean(detail.is_speed_up));
          setSpeedUpStr(detail.speed_up && detail.speed_up > 0 ? String(detail.speed_up) : '');
          setSpeedUpCurrency(detail.speed_up_currency || detail.sell_currency || 'USD');

          setUsdRmbRateStr(detail.usd_rmb_rate ? String(detail.usd_rmb_rate) : '7.235');
          setStatus(detail.status || initialStatus);
          setConfirmedDate(detail.confirmed_date ? detail.confirmed_date.slice(0, 10) : '');
          setLoadedDate(detail.loaded_date ? detail.loaded_date.slice(0, 10) : '');
          setArrivedDate(detail.arrived_date ? detail.arrived_date.slice(0, 10) : '');
          setDescription(detail.description || '');

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
          setSelectedClientId(detail.client_id || '');
          setSelectedEmpId(detail.employee_id || myEmployeeId || '');
          setConsolidationId(detail.consolidation_id || null);

          let copyTruckId = detail.container_truck_id ? `${detail.container_truck_id}-COPY` : '';
          if (detail.container_truck_id && detail.container_truck_id.endsWith('-COPY')) {
            copyTruckId = `${detail.container_truck_id}-1`;
          }
          setContainerTruckId(copyTruckId);
          setAgentName(detail.agent_name || '');
          setCargo(detail.cargo || '');
          setVolumeStr(detail.volume ? String(detail.volume) : '');
          setWeightStr(detail.weight ? String(detail.weight) : '');
          setLoadCode(detail.load_code ? `${detail.load_code}-COPY` : '');
          setContainerType((detail.container_type as ContainerType) || '40HQ');
          setTransportTypes(
            detail.transport_types && detail.transport_types.length > 0
              ? detail.transport_types
              : ['auto']
          );

          setPurchasePriceStr(String(detail.purchase_price ?? 0));
          setPurchaseCurrency(detail.purchase_currency || 'USD');
          setPurchaseDate(todayStr);

          setSellPriceStr(String(detail.sell_price ?? 0));
          setSellCurrency(detail.sell_currency || 'USD');
          setSellDate(todayStr);

          setAdditionalExpenseStr(
            detail.additional_expense && detail.additional_expense > 0
              ? String(detail.additional_expense)
              : ''
          );
          setAdditionalExpenseCurrency(detail.additional_expense_currency || 'USD');

          if (detail.cargo_type === 'LTL') {
            setInternalLogisticsCostStr(
              detail.internal_logistics_cost && detail.internal_logistics_cost > 0
                ? String(detail.internal_logistics_cost)
                : ''
            );
            setInternalLogisticsCurrency(detail.internal_logistics_currency || 'USD');
          } else {
            setInternalLogisticsCostStr('');
            setInternalLogisticsCurrency('USD');
          }

          setIsTurnkey(Boolean(detail.is_turnkey));
          setTurnkeyPriceStr(
            detail.turnkey_price && detail.turnkey_price > 0 ? String(detail.turnkey_price) : ''
          );
          setTurnkeyCurrency(detail.turnkey_currency || detail.sell_currency || 'USD');

          setIsSpeedUp(Boolean(detail.is_speed_up));
          setSpeedUpStr(detail.speed_up && detail.speed_up > 0 ? String(detail.speed_up) : '');
          setSpeedUpCurrency(detail.speed_up_currency || detail.sell_currency || 'USD');

          setUsdRmbRateStr(detail.usd_rmb_rate ? String(detail.usd_rmb_rate) : '7.235');
          setStatus('Waiting');
          setConfirmedDate(todayStr);
          setLoadedDate('');
          setArrivedDate('');
          setDescription(detail.description || '');

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
      setCargoType(initialConsolidationId ? 'LTL' : lockCargoType || initialCargoType || 'LTL');
      setConsolidationId(initialConsolidationId || null);
      setSelectedClientId('');
      setSelectedEmpId(myEmployeeId || '');
      setContainerTruckId(
        initialContainerTruckId || 'TRK-' + Math.floor(1000 + Math.random() * 9000)
      );
      setAgentName('SilkRoad Express');
      setCargo('General Cargo');
      setVolumeStr('10');
      setWeightStr('1200');
      setLoadCode('');
      setContainerType('40HQ');
      setTransportTypes(['auto']);

      setPurchasePriceStr('4500');
      setPurchaseCurrency('USD');
      setPurchaseDate(todayStr);

      setSellPriceStr('6200');
      setSellCurrency('USD');
      setSellDate(todayStr);

      setAdditionalExpenseStr('');
      setAdditionalExpenseCurrency('USD');
      setInternalLogisticsCostStr('');
      setInternalLogisticsCurrency('USD');
      setIsTurnkey(false);
      setTurnkeyPriceStr('');
      setTurnkeyCurrency('USD');
      setIsSpeedUp(false);
      setSpeedUpStr('');
      setSpeedUpCurrency('USD');

      setUsdRmbRateStr('7.235');
      setStatus(initialStatus);
      setConfirmedDate(todayStr);
      setLoadedDate('');
      setArrivedDate('');
      setDescription('');

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
  }, [
    isOpen,
    editingId,
    duplicateFromId,
    initialStatus,
    initialCargoType,
    lockCargoType,
    initialConsolidationId,
    initialContainerTruckId,
    myEmployeeId,
    showNotification,
  ]);

  // Live Multi-Currency Calculations
  const calculatedYield = useMemo(() => {
    const bp = parseFloat(purchasePriceStr) || 0;
    const sp = parseFloat(sellPriceStr) || 0;
    const addExp = parseFloat(additionalExpenseStr) || 0;
    const intLog = cargoType === 'LTL' ? parseFloat(internalLogisticsCostStr) || 0 : 0;
    const turnkeyVal = isTurnkey ? parseFloat(turnkeyPriceStr) || 0 : 0;
    const speedUpVal = isSpeedUp ? parseFloat(speedUpStr) || 0 : 0;
    const rate = parseFloat(usdRmbRateStr) || 7.235;

    const cbuRates = {
      USD: rates.USD || 11886.72,
      RUB: rates.RUB || 140,
      RMB: rates.RMB || 1780,
    };

    const purConv = convertPriceToUsdAndUzs(
      bp,
      purchaseCurrency,
      purchaseDate,
      null,
      rate,
      cbuRates
    );
    const addExpConv = convertPriceToUsdAndUzs(
      addExp,
      additionalExpenseCurrency,
      purchaseDate,
      null,
      rate,
      cbuRates
    );
    const intLogConv = convertPriceToUsdAndUzs(
      intLog,
      internalLogisticsCurrency,
      purchaseDate,
      null,
      rate,
      cbuRates
    );
    const sellConv = convertPriceToUsdAndUzs(sp, sellCurrency, sellDate, null, rate, cbuRates);
    const turnkeyConv = convertPriceToUsdAndUzs(
      turnkeyVal,
      turnkeyCurrency,
      sellDate,
      null,
      rate,
      cbuRates
    );
    const speedUpConv = convertPriceToUsdAndUzs(
      speedUpVal,
      speedUpCurrency,
      sellDate,
      null,
      rate,
      cbuRates
    );

    const totalIncomeUsd =
      sellConv.amount_usd +
      (turnkeyVal > 0 ? turnkeyConv.amount_usd : 0) +
      (speedUpVal > 0 ? speedUpConv.amount_usd : 0);

    const totalOutcomeUsd =
      purConv.amount_usd +
      (addExp > 0 ? addExpConv.amount_usd : 0) +
      (cargoType === 'LTL' && intLog > 0 ? intLogConv.amount_usd : 0);

    const netProfitUsd = totalIncomeUsd - totalOutcomeUsd;
    const roiPct = totalOutcomeUsd > 0 ? (netProfitUsd / totalOutcomeUsd) * 100 : 0;

    return {
      netProfitUsd,
      totalIncomeUsd,
      totalOutcomeUsd,
      roiPct,
    };
  }, [
    cargoType,
    purchasePriceStr,
    purchaseCurrency,
    purchaseDate,
    sellPriceStr,
    sellCurrency,
    sellDate,
    additionalExpenseStr,
    additionalExpenseCurrency,
    internalLogisticsCostStr,
    internalLogisticsCurrency,
    isTurnkey,
    turnkeyPriceStr,
    turnkeyCurrency,
    isSpeedUp,
    speedUpStr,
    speedUpCurrency,
    usdRmbRateStr,
    rates,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClientId) {
      showNotification(t('warnSelectClient') || 'Please select a client.', 'warning');
      return;
    }

    if (!containerTruckId.trim()) {
      showNotification(t('truckPlateRequired') || 'Container / Truck ID is required.', 'warning');
      return;
    }

    const vol = parseFloat(volumeStr) || 0;
    const wt = parseFloat(weightStr) || 0;

    if (cargoType === 'LTL') {
      if (vol <= 0 || wt <= 0) {
        showNotification(
          t('warnVolumeWeightRequired') ||
            'Volume and weight must be greater than 0 for LTL cargo.',
          'warning'
        );
        return;
      }
    }

    const bp = parseFloat(purchasePriceStr) || 0;
    const sp = parseFloat(sellPriceStr) || 0;
    const addExp = parseFloat(additionalExpenseStr) || 0;
    const intLog = cargoType === 'LTL' ? parseFloat(internalLogisticsCostStr) || 0 : 0;
    const turnkeyVal = isTurnkey ? parseFloat(turnkeyPriceStr) || 0 : 0;
    const speedUpVal = isSpeedUp ? parseFloat(speedUpStr) || 0 : 0;
    const rate = parseFloat(usdRmbRateStr) || 0;

    if (isRmbRateRequired && rate <= 0) {
      showNotification(
        t('warnRmbRateRequired') || 'USD -> RMB exchange rate is required.',
        'warning'
      );
      return;
    }

    const canAssignEveryone = canRegisterForEveryone();
    const finalEmployeeId = canAssignEveryone && selectedEmpId ? selectedEmpId : myEmployeeId;

    if (!finalEmployeeId) {
      showNotification(t('warnSelectEmployee') || 'Employee assignment is required.', 'warning');
      return;
    }

    setSubmitting(true);

    try {
      const payload: any = {
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
        sell_price: sp,
        sell_currency: sellCurrency,
        sell_date: sellDate || undefined,
        additional_expense: addExp,
        additional_expense_currency: additionalExpenseCurrency,
        internal_logistics_cost: cargoType === 'LTL' && intLog > 0 ? intLog : undefined,
        internal_logistics_currency:
          cargoType === 'LTL' && intLog > 0 ? internalLogisticsCurrency : undefined,
        is_turnkey: isTurnkey,
        turnkey_price: isTurnkey ? turnkeyVal : 0,
        turnkey_currency: isTurnkey ? turnkeyCurrency : undefined,
        is_speed_up: isSpeedUp,
        speed_up: isSpeedUp ? speedUpVal : 0,
        speed_up_currency: isSpeedUp ? speedUpCurrency : undefined,
        usd_rmb_rate: isRmbRateRequired ? rate : undefined,
        transport_types: transportTypes.length > 0 ? transportTypes : undefined,
        status,
        description: description.trim() || undefined,
        load_code: loadCode.trim() || undefined,
        client_id: selectedClientId,
        employee_id: finalEmployeeId,
        consolidation_id: cargoType === 'LTL' ? consolidationId || null : null,
      };

      if (editingId) {
        await cargoRegistrationsApi.update(editingId, payload);
        showNotification(
          t('successCargoUpdated') || 'Cargo registration updated successfully',
          'success'
        );
      } else {
        payload.prevent_duplicate = true;
        payload.idempotency_key = `cr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const created = await cargoRegistrationsApi.create(payload);

        if (cargoType === 'LTL' && consolidationId && created?.id) {
          try {
            await cargoConsolidationsApi.assignCargos(consolidationId, [created.id]);
          } catch {
            // Already linked
          }
        }
        showNotification(
          t('successCargoCreated') || 'Cargo registration created successfully',
          'success'
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to save cargo registration', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const canAssignEveryone = canRegisterForEveryone();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-4xl bg-surface border border-border rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                {duplicateFromId ? <Copy className="size-5" /> : <Receipt className="size-5" />}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  {editingId
                    ? t('editCargoRegTitle') || 'Edit Cargo Registration'
                    : duplicateFromId
                      ? t('duplicateCargoModalTitle') || 'Duplicate Cargo Registration'
                      : t('registerCargoTitle') || 'Register Cargo'}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold font-bold font-mono border border-brand-gold/30">
                    {cargoType}
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  {editingId
                    ? t('modalConsolidationEditSubtitle') ||
                      'Update shipment specifications, route and multi-currency commercial terms'
                    : t('modalConsolidationCreateSubtitle') ||
                      'Fill out shipment details, route corridor, and commercial pricing'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          {loadingDetails ? (
            <div className="py-24 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
              <RefreshCw className="size-8 animate-spin text-brand-gold" />
              <p className="text-xs font-semibold">
                {t('loadingConsolidationDetails') || 'Loading shipment details...'}
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto p-6 space-y-6 flex-1 custom-scrollbar"
            >
              {/* SECTION 1: CARGO TYPE & STAKEHOLDERS */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    1. <T k="routeLogistics" />
                  </span>

                  {/* Mode Pill Switcher */}
                  {lockCargoType ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-brand-gold/10 text-brand-gold border border-brand-gold/30">
                      {lockCargoType === 'LTL' ? (
                        <Box className="size-3.5" />
                      ) : (
                        <Layers className="size-3.5" />
                      )}
                      <span>
                        {lockCargoType === 'LTL'
                          ? t('tabConsolidations') || 'LTL (Groupage)'
                          : t('tabFtl') || 'FTL (Full Truck)'}
                      </span>
                    </span>
                  ) : (
                    <div className="inline-flex p-1 rounded-xl bg-muted/40 border border-border">
                      <button
                        type="button"
                        onClick={() => setCargoType('LTL')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          cargoType === 'LTL'
                            ? 'bg-surface text-amber-600 dark:text-amber-400 shadow-xs border border-border'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Box className="size-3.5" />
                        <span>{t('tabConsolidations') || 'LTL Groupage'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCargoType('FTL')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          cargoType === 'FTL'
                            ? 'bg-surface text-indigo-600 dark:text-indigo-400 shadow-xs border border-border'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Layers className="size-3.5" />
                        <span>{t('tabFtl') || 'FTL Full Truck'}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ClientSelect
                    value={selectedClientId}
                    onChange={(cid) => setSelectedClientId(cid)}
                    required
                  />

                  {canAssignEveryone ? (
                    <EmployeeSelect
                      value={selectedEmpId}
                      onChange={(eid) => setSelectedEmpId(eid)}
                      label={t('assignedEmployeeLabel') || 'Assigned Manager'}
                      required
                    />
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        {t('assignedEmployeeLabel') || 'Assigned Manager'}
                      </label>
                      <div className="px-3 py-2.5 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground flex items-center justify-between">
                        <span className="font-semibold text-foreground flex items-center gap-2">
                          <UserCheck className="size-4 text-emerald-500" />
                          <span>{t('autoAssignedToYou') || 'Auto-assigned to you'}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-bold text-[10px]">
                          {t('statusActive') || 'Active'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 2: PHYSICAL SPECIFICATIONS & ROUTE */}
              <div className="space-y-4">
                <div className="pb-2 border-b border-border/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    2. <T k="routeAndDates" />
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      {t('colContainerNo') || 'Truck / Container ID'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={containerTruckId}
                      onChange={(e) => setContainerTruckId(e.target.value.toUpperCase())}
                      placeholder="e.g. TRK-9872"
                      className="w-full px-3 py-2 rounded-xl border border-field-border bg-field text-field-foreground text-xs font-bold uppercase font-mono focus:ring-2 focus:ring-focus/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      {t('colCarrier') || 'Carrier / Agent Name'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder="e.g. SilkRoad Logistics"
                      className="w-full px-3 py-2 rounded-xl border border-field-border bg-field text-field-foreground text-xs font-semibold focus:ring-2 focus:ring-focus/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      {t('deleteModalCargo') || 'Cargo Description'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value)}
                      placeholder="e.g. Auto Parts, Textiles"
                      className="w-full px-3 py-2 rounded-xl border border-field-border bg-field text-field-foreground text-xs font-semibold focus:ring-2 focus:ring-focus/30"
                    />
                  </div>
                </div>

                {/* Dynamic Specs (LTL vs FTL) */}
                {cargoType === 'LTL' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <NumberInput
                      label={`${t('volumeLabel') || 'Volume'} (m³)`}
                      isRequired
                      suffix="m³"
                      placeholder="12.5"
                      value={volumeStr}
                      onValueChange={(_num, raw) => setVolumeStr(raw)}
                      allowDecimals={true}
                      decimalScale={3}
                      min={0.01}
                    />

                    <NumberInput
                      label={`${t('weightLabel') || 'Weight'} (kg)`}
                      isRequired
                      suffix="kg"
                      placeholder="1 450"
                      value={weightStr}
                      onValueChange={(_num, raw) => setWeightStr(raw)}
                      allowDecimals={true}
                      decimalScale={2}
                      min={1}
                    />

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center justify-between">
                        <span>{t('loadCode') || 'Load Code'}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          ({t('optional') || 'Optional'})
                        </span>
                      </label>
                      <input
                        type="text"
                        placeholder="LTL-2026-0881"
                        value={loadCode}
                        onChange={(e) => setLoadCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-field border border-field-border text-field-foreground text-xs font-mono focus:ring-2 focus:ring-focus/30"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      {t('containerTypeLabel') || 'Container Specification'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      isRequired
                      value={containerType}
                      onChange={(val) => setContainerType((val as ContainerType) || '40HQ')}
                      allowClear={false}
                      aria-label="Container Specification"
                      options={CONTAINER_OPTIONS}
                    />
                  </div>
                )}

                {/* LTL Consolidation Link (if LTL) */}
                {cargoType === 'LTL' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Truck className="size-3.5 text-brand-gold" />
                      <span>
                        {t('selectConsolidationTruckPlaceholder') ||
                          'Consolidation Truck Trip (Optional)'}
                      </span>
                    </label>
                    {lockConsolidation ? (
                      <div className="p-2.5 rounded-xl bg-surface border border-border flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-foreground">
                          {containerTruckId || 'Consolidation Trip'}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {t('lockedToActiveConsolidation') || 'Locked to active consolidation'}
                        </span>
                      </div>
                    ) : (
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
                    )}
                  </div>
                )}

                {/* Multimodal Transport Selector */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-semibold text-foreground mr-1">
                    {t('transportTypesLabel') || 'Transport'}:
                  </span>
                  {TRANSPORT_TYPES.map((tt) => {
                    const selected = transportTypes.includes(tt);
                    return (
                      <button
                        key={tt}
                        type="button"
                        onClick={() =>
                          setTransportTypes((prev) =>
                            prev.includes(tt)
                              ? prev.length > 1
                                ? prev.filter((x) => x !== tt)
                                : prev
                              : [...prev, tt]
                          )
                        }
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          selected
                            ? 'bg-brand-gold/15 border-brand-gold/60 text-brand-navy dark:text-brand-gold'
                            : 'bg-muted/20 border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {TRANSPORT_ICONS[tt]}
                        <span>{getTransportTypeLabel(tt, t)}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Route Corridor */}
                <div className="pt-2">
                  <RouteSelector route={route} onChange={setRoute} />
                </div>
              </div>

              {/* SECTION 3: COMMERCIALS & MULTI-CURRENCY FINANCIALS */}
              <div className="space-y-4">
                <div className="pb-2 border-b border-border/60 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <DollarSign className="size-3.5 text-brand-gold" />
                    <span>
                      3. <T k="financialBreakdownTitle" />
                    </span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">Multi-Currency</span>
                </div>

                {/* Cost vs Selling Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Purchase Cost (Buy side) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-foreground">
                      {t('fieldCarrierCostLabel') || 'Purchase Cost (Buy)'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <NumberInput
                          placeholder="0.00"
                          value={purchasePriceStr}
                          onValueChange={(_num, raw) => setPurchasePriceStr(raw)}
                          allowDecimals={true}
                          decimalScale={2}
                          min={0}
                        />
                      </div>
                      <Select
                        value={purchaseCurrency}
                        onChange={(val) => setPurchaseCurrency((val as CurrencyType) || 'USD')}
                        allowClear={false}
                        fullWidth={false}
                        className="w-24 shrink-0"
                        aria-label="Purchase Currency"
                        options={CURRENCY_OPTIONS}
                      />
                    </div>
                  </div>

                  {/* Selling Charge (Sell side) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-foreground">
                      {t('fieldClientSellPriceLabel') || 'Selling Price (Client)'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <NumberInput
                          placeholder="0.00"
                          value={sellPriceStr}
                          onValueChange={(_num, raw) => setSellPriceStr(raw)}
                          allowDecimals={true}
                          decimalScale={2}
                          min={0}
                        />
                      </div>
                      <Select
                        value={sellCurrency}
                        onChange={(val) => setSellCurrency((val as CurrencyType) || 'USD')}
                        allowClear={false}
                        fullWidth={false}
                        className="w-24 shrink-0"
                        aria-label="Sell Currency"
                        options={CURRENCY_OPTIONS}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Expense & Internal Logistics Cost (Internal Logistics is LTL only) */}
                <div
                  className={
                    cargoType === 'LTL' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-1.5'
                  }
                >
                  {/* Additional Expense */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <PlusCircle className="size-3 text-rose-500" />
                        <span>{t('fieldAuxiliaryFees') || 'Additional Expense (Extra Cost)'}</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ({t('optional') || 'Optional'})
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <NumberInput
                          placeholder="0.00"
                          value={additionalExpenseStr}
                          onValueChange={(_num, raw) => setAdditionalExpenseStr(raw)}
                          allowDecimals={true}
                          decimalScale={2}
                          min={0}
                        />
                      </div>
                      <Select
                        value={additionalExpenseCurrency}
                        onChange={(val) =>
                          setAdditionalExpenseCurrency((val as CurrencyType) || 'USD')
                        }
                        allowClear={false}
                        fullWidth={false}
                        className="w-24 shrink-0"
                        aria-label="Additional Expense Currency"
                        options={CURRENCY_OPTIONS}
                      />
                    </div>
                  </div>

                  {/* Internal Logistics Cost (LTL only) */}
                  {cargoType === 'LTL' && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-foreground flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Truck className="size-3 text-amber-500" />
                          <span>{t('internalLogisticsCost') || 'Internal Logistics Cost'}</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({t('optional') || 'Optional'})
                        </span>
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <NumberInput
                            placeholder="0.00"
                            value={internalLogisticsCostStr}
                            onValueChange={(_num, raw) => setInternalLogisticsCostStr(raw)}
                            allowDecimals={true}
                            decimalScale={2}
                            min={0}
                          />
                        </div>
                        <Select
                          value={internalLogisticsCurrency}
                          onChange={(val) =>
                            setInternalLogisticsCurrency((val as CurrencyType) || 'USD')
                          }
                          allowClear={false}
                          fullWidth={false}
                          className="w-24 shrink-0"
                          aria-label={
                            t('internalLogisticsCurrency') || 'Internal Logistics Currency'
                          }
                          options={CURRENCY_OPTIONS}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* USD -> RMB Cross Rate (if RMB used) */}
                {isRmbRateRequired ? (
                  <div className="space-y-1.5 max-w-xs">
                    <label className="block text-xs font-semibold text-foreground">
                      USD &rarr; RMB Rate <span className="text-rose-500">*</span>
                    </label>
                    <NumberInput
                      placeholder="7.235"
                      value={usdRmbRateStr}
                      onValueChange={(_num, raw) => setUsdRmbRateStr(raw)}
                      allowDecimals={true}
                      decimalScale={4}
                      min={0.0001}
                      suffix="¥"
                    />
                  </div>
                ) : null}

                {/* Auxiliary Services (Turnkey & Speed Up) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Turnkey Service */}
                  <div
                    className={`p-3 rounded-xl border transition-all ${isTurnkey ? 'bg-indigo-500/10 border-indigo-500/40' : 'bg-muted/20 border-border'}`}
                  >
                    <div
                      onClick={() => setIsTurnkey(!isTurnkey)}
                      className="flex items-center justify-between cursor-pointer select-none mb-2"
                    >
                      <div className="flex items-center gap-2">
                        <KeyRound className="size-4 text-indigo-500" />
                        <span className="text-xs font-bold text-foreground">
                          {t('lblTurnkeyService') || 'Turnkey Delivery Service'}
                        </span>
                      </div>
                      <div
                        className={`size-4 rounded border flex items-center justify-center ${isTurnkey ? 'bg-indigo-600 text-white border-indigo-600' : 'border-muted-foreground/40 bg-surface'}`}
                      >
                        {isTurnkey && <Check className="size-2.5 stroke-[3]" />}
                      </div>
                    </div>
                    {isTurnkey && (
                      <div className="flex gap-2 items-center mt-2">
                        <div className="flex-1">
                          <NumberInput
                            placeholder={t('turnkeyBadge') || 'Turnkey Price'}
                            value={turnkeyPriceStr}
                            onValueChange={(_num, raw) => setTurnkeyPriceStr(raw)}
                            allowDecimals={true}
                            decimalScale={2}
                            min={0}
                          />
                        </div>
                        <Select
                          value={turnkeyCurrency}
                          onChange={(val) => setTurnkeyCurrency((val as CurrencyType) || 'USD')}
                          allowClear={false}
                          fullWidth={false}
                          className="w-22 shrink-0"
                          aria-label="Turnkey Currency"
                          options={CURRENCY_OPTIONS}
                        />
                      </div>
                    )}
                  </div>

                  {/* Speed Up Expedited Fee */}
                  <div
                    className={`p-3 rounded-xl border transition-all ${isSpeedUp ? 'bg-amber-500/10 border-amber-500/40' : 'bg-muted/20 border-border'}`}
                  >
                    <div
                      onClick={() => setIsSpeedUp(!isSpeedUp)}
                      className="flex items-center justify-between cursor-pointer select-none mb-2"
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="size-4 text-amber-500" />
                        <span className="text-xs font-bold text-foreground">
                          {t('lblSpeedUpService') || 'Speed Up (Expedited Delivery)'}
                        </span>
                      </div>
                      <div
                        className={`size-4 rounded border flex items-center justify-center ${isSpeedUp ? 'bg-amber-600 text-white border-amber-600' : 'border-muted-foreground/40 bg-surface'}`}
                      >
                        {isSpeedUp && <Check className="size-2.5 stroke-[3]" />}
                      </div>
                    </div>
                    {isSpeedUp && (
                      <div className="flex gap-2 items-center mt-2">
                        <div className="flex-1">
                          <NumberInput
                            placeholder={t('speedUpBadge') || 'Speed Up Fee'}
                            value={speedUpStr}
                            onValueChange={(_num, raw) => setSpeedUpStr(raw)}
                            allowDecimals={true}
                            decimalScale={2}
                            min={0}
                          />
                        </div>
                        <Select
                          value={speedUpCurrency}
                          onChange={(val) => setSpeedUpCurrency((val as CurrencyType) || 'USD')}
                          allowClear={false}
                          fullWidth={false}
                          className="w-22 shrink-0"
                          aria-label="Speed Up Currency"
                          options={CURRENCY_OPTIONS}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Clean Live Net Margin Banner */}
                <div className="p-3 rounded-xl bg-muted/30 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg ${calculatedYield.netProfitUsd >= 0 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'}`}
                    >
                      {calculatedYield.netProfitUsd >= 0 ? (
                        <TrendingUp className="size-4" />
                      ) : (
                        <TrendingDown className="size-4" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">
                        {t('kpiCalculatedNetYield') || 'Estimated Net Profit'}:{' '}
                      </span>
                      <span
                        className={`text-xs font-bold ${calculatedYield.netProfitUsd >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
                      >
                        {formatMoney(calculatedYield.netProfitUsd, 'USD')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold">
                    <span>
                      {t('totalClientSell') || 'Income'}:{' '}
                      {formatMoney(calculatedYield.totalIncomeUsd, 'USD')}
                    </span>
                    <span>•</span>
                    <span>
                      {t('carrierAndOperationalExpenses') || 'Cost'}:{' '}
                      {formatMoney(calculatedYield.totalOutcomeUsd, 'USD')}
                    </span>
                    <span>•</span>
                    <span
                      className={`font-bold ${calculatedYield.roiPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}
                    >
                      {calculatedYield.roiPct.toFixed(1)}% ROI
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: STATUS & SCHEDULE */}
              <div className="space-y-4">
                <div className="pb-2 border-b border-border/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    4. <T k="colSchedule" />
                  </span>
                </div>

                {/* Status Pills */}
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

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                      <Calendar className="size-3 text-amber-500" />
                      <span>{t('colConfirmed') || 'Confirmed Date'}</span>
                    </label>
                    <input
                      type="date"
                      value={confirmedDate}
                      onChange={(e) => setConfirmedDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-field-border bg-field text-field-foreground text-xs font-semibold focus:ring-2 focus:ring-focus/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                      <Calendar className="size-3 text-blue-500" />
                      <span>{t('colLoaded') || 'Loaded Date'}</span>
                    </label>
                    <input
                      type="date"
                      value={loadedDate}
                      onChange={(e) => setLoadedDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-field-border bg-field text-field-foreground text-xs font-semibold focus:ring-2 focus:ring-focus/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                      <Calendar className="size-3 text-emerald-500" />
                      <span>{t('colArrived') || 'Arrived Date'}</span>
                    </label>
                    <input
                      type="date"
                      value={arrivedDate}
                      onChange={(e) => setArrivedDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-field-border bg-field text-field-foreground text-xs font-semibold focus:ring-2 focus:ring-focus/30"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                      t('notesPlaceholder') ||
                      'Optional handling instructions, notes, or customs remarks...'
                    }
                    className="w-full px-3 py-2 rounded-xl border border-field-border bg-field text-field-foreground text-xs font-medium focus:ring-2 focus:ring-focus/30 resize-none"
                  />
                </div>
              </div>

              {/* FOOTER */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  {t('actionCancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold/90 text-brand-navy font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      <span>{t('saving') || 'Saving Shipment...'}</span>
                    </>
                  ) : (
                    <span>
                      {editingId
                        ? t('btnUpdateRegistration') || 'Update Registration'
                        : duplicateFromId
                          ? t('btnCreateDuplicate') || 'Create Duplicate'
                          : t('btnSubmitRegistration') || 'Submit Registration'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>

      {/* Inline Consolidation Trip Modal */}
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
