import { request, registerDemoHandler, makeApiError } from './httpClient';
import { demoEmployeesDb } from './employees.service';
import { demoClientsDb } from './clients.service';

// ---------------------------------------------------------------------------
// Whitelist & Types
// ---------------------------------------------------------------------------

export type CargoType = 'LTL' | 'FTL';

export const CONTAINER_TYPES = [
  '40HQ',
  '40GP',
  '20GP',
  '20HQ',
  '45HQ',
  '96m3',
  '105m3',
  '110m3',
  '120m3',
  '130m3',
  '145m3',
  'Ref Fura',
  'air-delivery',
  '96 CBM',
  '105 CBM',
  '120 CBM',
  '130 CBM',
  '145 CBM',
  '40 GP',
  '40 HC',
  '45 HC',
  '127 CBM',
] as const;

export type ContainerType = (typeof CONTAINER_TYPES)[number];

/** Multimodal transport modalities supported by cargo registrations & consolidations */
export const TRANSPORT_TYPES = ['auto', 'railway', 'air', 'sea', 'other'] as const;

export type TransportType = (typeof TRANSPORT_TYPES)[number];

export const TRANSPORT_TYPE_LABELS: Record<TransportType, string> = {
  auto: 'Auto',
  railway: 'Railway',
  air: 'Air',
  sea: 'Sea',
  other: 'Other',
};

export const CARGO_STATUSES = [
  'Waiting',
  'Station',
  'On the way',
  'On the border',
  'Reload',
  'Arrived',
] as const;

export type CargoRegistrationStatus =
  (typeof CARGO_STATUSES)[number] | 'In Transit' | 'Border' | 'At Station' | 'Delivered';

export type {
  LocationDetail,
  RouteInfo,
  DuplicateCheckDto,
  DuplicateCheckResult,
} from '../types/locations';
import type { LocationDetail, RouteInfo, DuplicateCheckDto } from '../types/locations';
import { locationsApi } from './locations.service';

export type CurrencyType = 'UZS' | 'RUB' | 'USD' | 'RMB';

export interface CreateCargoRegistrationDto {
  cargo_type: CargoType;
  volume?: number;
  weight?: number;
  container_type?: ContainerType | string;
  transport_types?: TransportType[];
  container_truck_id: string;
  agent_name: string;
  cargo: string;
  confirmed_date?: string;
  loaded_date?: string;
  arrived_date?: string;
  purchase_price: number;
  purchase_currency: CurrencyType;
  purchase_date?: string;
  purchase_exchange_rate?: number;
  purchase_custom_rate?: number;
  sell_price: number;
  sell_currency: CurrencyType;
  sell_date?: string;
  sell_exchange_rate?: number;
  sell_custom_rate?: number;
  usd_rmb_rate?: number;
  origin_city?: string;
  origin_country?: string;
  origin_country_code?: string;
  origin_geoname_id?: number | null;
  origin_lat?: number | null;
  origin_lng?: number | null;
  destination_city?: string;
  destination_country?: string;
  destination_country_code?: string;
  destination_geoname_id?: number | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  prevent_duplicate?: boolean;
  idempotency_key?: string;
  status?: CargoRegistrationStatus;
  description?: string;
  load_code?: string;
  is_turnkey?: boolean;
  turnkey_price?: number;
  turnkey_currency?: CurrencyType;
  is_speed_up?: boolean;
  speed_up?: number;
  speed_up_currency?: CurrencyType;
  additional_expense?: number;
  additional_expense_currency?: CurrencyType;
  client_id: string;
  employee_id?: string;
  consolidation_id?: string | null;
  new_consolidation?: any;
}

export interface UpdateCargoRegistrationDto extends Partial<CreateCargoRegistrationDto> {}

export interface CargoRegistrationListParams {
  page?: number;
  limit?: number;
  offset?: number;
  search?: string;
  status?: CargoRegistrationStatus | string;
  cargo_type?: CargoType | string;
  container_type?: ContainerType | string;
  transport_types?: string | string[];
  client_id?: string;
  employee_id?: string;
  consolidation_id?: string;
  has_consolidation?: boolean;
  origin_city?: string;
  origin_country_code?: string;
  origin_geoname_id?: string | number;
  destination_city?: string;
  destination_country_code?: string;
  destination_geoname_id?: string | number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC' | 'asc' | 'desc';
  order?: 'ASC' | 'DESC' | 'asc' | 'desc';
  confirmed_start_date?: string;
  confirmed_end_date?: string;
  loaded_start_date?: string;
  loaded_end_date?: string;
  arrived_start_date?: string;
  arrived_end_date?: string;
  purchase_start_date?: string;
  purchase_end_date?: string;
  purchase_date?: string;
  sell_start_date?: string;
  sell_end_date?: string;
  sell_date?: string;
  created_start_date?: string;
  created_end_date?: string;
  created_at_start?: string;
  created_at_end?: string;
}

export interface CargoRegistrationPriceAmount {
  amount: number;
  currency: CurrencyType;
  amount_usd?: number;
  amount_uzs?: number;
  date?: string;
  usd_rate?: number;
  custom_rate?: number | null;
}

export interface CargoRegistrationNetYield {
  amount: number;
  amount_usd?: number;
  amount_uzs?: number;
  purchase_currency: CurrencyType;
  sell_currency: CurrencyType;
}

export interface CargoRegistrationListItem {
  id: string;
  cargo_type?: CargoType;
  volume?: number | null;
  weight?: number | null;
  container_type?: ContainerType | string | null;
  transport_types?: TransportType[] | null;
  container_truck_id: string;
  agent_name: string;
  client_full_name: string;
  client?: {
    id: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
  } | null;
  cargo: string;
  usd_rmb_rate?: number | null;
  employee_full_name: string;
  employee?: {
    id: string;
    name?: string;
    first_name?: string;
    last_name?: string;
  } | null;
  purchase_price: CargoRegistrationPriceAmount;
  sell_price: CargoRegistrationPriceAmount;
  net_yield: CargoRegistrationNetYield;
  origin?: LocationDetail | null;
  destination?: LocationDetail | null;
  route?: RouteInfo | null;
  origin_city?: string | null;
  origin_country?: string | null;
  origin_country_code?: string | null;
  origin_geoname_id?: number | null;
  origin_lat?: number | null;
  origin_lng?: number | null;
  destination_city?: string | null;
  destination_country?: string | null;
  destination_country_code?: string | null;
  destination_geoname_id?: number | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  status: CargoRegistrationStatus;
  description?: string | null;
  load_code?: string | null;
  is_turnkey?: boolean;
  turnkey_price?: number | null;
  turnkey_currency?: CurrencyType | null;
  is_speed_up?: boolean;
  speed_up?: number | null;
  speed_up_currency?: CurrencyType | null;
  additional_expense?: number | null;
  additional_expense_currency?: CurrencyType | null;
  client_id?: string;
  employee_id?: string;
  consolidation_id?: string | null;
  consolidation?: {
    id: string;
    consolidation_code: string;
    container_truck_id: string;
    status: string;
    carrier_name?: string;
    origin_place?: string;
    destination_place?: string;
  } | null;
  confirmed_date?: string | null;
  loaded_date?: string | null;
  arrived_date?: string | null;
  purchase_date?: string | null;
  purchase_usd_rate?: number | null;
  sell_date?: string | null;
  sell_usd_rate?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CargoRegistrationMeta {
  total: number;
  limit: number;
  offset: number;
  active_containers?: number;
  action_required?: number;
  calculated_net_yield: {
    USD: number;
    UZS: number;
    RUB?: number;
    RMB?: number;
    total_usd?: number;
    total_uzs?: number;
  };
  gross_sales_revenue: {
    USD: number;
    UZS: number;
    RUB?: number;
    RMB?: number;
    total_usd_equivalent?: number;
    total_uzs_equivalent?: number;
  };
}

export interface CargoRegistrationStatsParams {
  status?: CargoRegistrationStatus | string;
  employee_id?: string;
  client_id?: string;
  cargo_type?: CargoType | string;
  created_start_date?: string;
  created_end_date?: string;
}

export interface CargoRegistrationsStatsResponse {
  summary: {
    total_cargos: number;
    gross_sales_revenue: {
      UZS: number;
      USD: number;
      RUB: number;
      RMB: number;
      total_usd_equivalent: number;
      total_uzs_equivalent: number;
    };
    calculated_net_yield: {
      USD: number;
      UZS: number;
      total_usd: number;
      total_uzs: number;
    };
  };
  ltl_statistics: {
    total_count: number;
    total_volume_m3: number;
    total_weight_kg: number;
    avg_volume_m3: number;
    avg_weight_kg: number;
  };
  ftl_statistics: {
    total_count: number;
    container_type_distribution: Record<string, number>;
  };
  status_distribution: Record<string, number>;
  by_manager: {
    employee_name: string;
    total_cargos: number;
    ltl_cargos: number;
    ltl_volume: number;
    ftl_cargos: number;
    gross_sales_usd: number;
    net_yield_usd: number;
  }[];
}

export interface CargoRegistrationPaginatedResponse {
  meta: CargoRegistrationMeta;
  data: CargoRegistrationListItem[];
}

export interface CargoRegistrationDetail {
  id: string;
  cargo_type: CargoType;
  volume?: number | null;
  weight?: number | null;
  container_type?: ContainerType | null;
  transport_types?: TransportType[] | null;
  container_truck_id: string;
  agent_name: string;
  cargo: string;
  origin?: LocationDetail | null;
  destination?: LocationDetail | null;
  route?: RouteInfo | null;
  origin_city?: string | null;
  origin_country?: string | null;
  origin_country_code?: string | null;
  origin_geoname_id?: number | null;
  origin_lat?: number | null;
  origin_lng?: number | null;
  destination_city?: string | null;
  destination_country?: string | null;
  destination_country_code?: string | null;
  destination_geoname_id?: number | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  confirmed_date?: string | null;
  loaded_date?: string | null;
  arrived_date?: string | null;
  purchase_price: number;
  purchase_currency: CurrencyType;
  purchase_date?: string | null;
  purchase_usd_rate?: number | null;
  purchase_custom_rate?: number | null;
  purchase_amount_usd?: number | null;
  purchase_amount_uzs?: number | null;
  sell_price: number;
  sell_currency: CurrencyType;
  sell_date?: string | null;
  sell_usd_rate?: number | null;
  sell_custom_rate?: number | null;
  sell_amount_usd?: number | null;
  sell_amount_uzs?: number | null;
  net_yield: number;
  net_yield_details?: {
    amount_usd: number;
    amount_uzs: number;
  };
  usd_rmb_rate?: number | null;
  status: CargoRegistrationStatus;
  description?: string | null;
  load_code?: string | null;
  is_turnkey?: boolean;
  turnkey_price?: number | null;
  turnkey_currency?: CurrencyType | null;
  is_speed_up?: boolean;
  speed_up?: number | null;
  speed_up_currency?: CurrencyType | null;
  additional_expense?: number | null;
  additional_expense_currency?: CurrencyType | null;
  client_id: string;
  consolidation_id?: string | null;
  consolidation?: {
    id: string;
    consolidation_code: string;
    container_truck_id: string;
    status: string;
    carrier_name?: string;
    origin_place?: string;
    destination_place?: string;
  } | null;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    company_name?: string;
    phone?: string;
    email?: string;
  };
  employee_id: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    position?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export function convertPriceToUsdAndUzs(
  price: number,
  currency: CurrencyType,
  _dateStr?: string | null,
  customUsdRate?: number | null,
  usdRmbRate?: number | null,
  cbuRates: { USD: number; RUB: number; RMB: number } = { USD: 11886.72, RUB: 140, RMB: 1780 }
): { amount_usd: number; amount_uzs: number; usd_rate: number } {
  const usdRateInUzs = customUsdRate && customUsdRate > 0 ? customUsdRate : cbuRates.USD;

  let amountUsd = 0;
  let amountUzs = 0;

  if (currency === 'USD') {
    amountUsd = price;
    amountUzs = price * usdRateInUzs;
  } else if (currency === 'UZS') {
    amountUsd = price / usdRateInUzs;
    amountUzs = price;
  } else if (currency === 'RMB') {
    const rmbCrossRate =
      usdRmbRate && usdRmbRate > 0 ? usdRmbRate : usdRateInUzs / (cbuRates.RMB || 1780);
    amountUsd = price / rmbCrossRate;
    amountUzs = amountUsd * usdRateInUzs;
  } else if (currency === 'RUB') {
    const rubRateInUzs = cbuRates.RUB || 140;
    amountUsd = (price * rubRateInUzs) / usdRateInUzs;
    amountUzs = price * rubRateInUzs;
  }

  return {
    amount_usd: Math.round(amountUsd * 100) / 100,
    amount_uzs: Math.round(amountUzs * 100) / 100,
    usd_rate: Math.round(usdRateInUzs * 100) / 100,
  };
}

// Internal stored record for mock DB
interface InternalCargoRegistrationRecord {
  id: string;
  cargo_type: CargoType;
  volume: number | null;
  weight: number | null;
  container_type: string | null;
  transport_types?: TransportType[] | null;
  container_truck_id: string;
  agent_name: string;
  cargo: string;
  origin_city: string | null;
  origin_country: string | null;
  origin_country_code: string | null;
  origin_geoname_id: number | null;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_city: string | null;
  destination_country: string | null;
  destination_country_code: string | null;
  destination_geoname_id: number | null;
  destination_lat: number | null;
  destination_lng: number | null;
  confirmed_date: string | null;
  loaded_date: string | null;
  arrived_date: string | null;
  purchase_price: number;
  purchase_currency: CurrencyType;
  purchase_date: string | null;
  purchase_usd_rate: number | null;
  purchase_custom_rate: number | null;
  sell_price: number;
  sell_currency: CurrencyType;
  sell_date: string | null;
  sell_usd_rate: number | null;
  sell_custom_rate: number | null;
  usd_rmb_rate: number | null;
  status: CargoRegistrationStatus;
  description: string | null;
  load_code?: string | null;
  is_turnkey?: boolean;
  turnkey_price?: number | null;
  turnkey_currency?: CurrencyType | null;
  is_speed_up?: boolean;
  speed_up?: number | null;
  speed_up_currency?: CurrencyType | null;
  additional_expense?: number | null;
  additional_expense_currency?: CurrencyType | null;
  client_id: string;
  employee_id: string;
  consolidation_id?: string | null;
  created_at: string;
  updated_at: string;
}

// Initial demo seeds matching documentation examples
export const INITIAL_DEMO_RECORDS: InternalCargoRegistrationRecord[] = [
  {
    id: '7a06df8a-384c-4c8d-9932-57db348a3451',
    cargo_type: 'FTL',
    volume: null,
    weight: null,
    container_type: '40HQ',
    transport_types: ['railway', 'auto'],
    container_truck_id: 'TRK-6447',
    agent_name: 'SilkRoad Express',
    cargo: 'General Goods',
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
    confirmed_date: '2026-07-20',
    loaded_date: null,
    arrived_date: null,
    purchase_price: 4500000,
    purchase_currency: 'UZS',
    purchase_date: '2026-07-20',
    purchase_usd_rate: 11886.72,
    purchase_custom_rate: null,
    sell_price: 800,
    sell_currency: 'USD',
    sell_date: '2026-08-06',
    sell_usd_rate: 11886.72,
    sell_custom_rate: null,
    usd_rmb_rate: null,
    status: 'On the way',
    description: 'Documentation example cargo',
    client_id: '8e3b4a21-9951-40ef-a442-123456789abc',
    employee_id: '11111111-2222-3333-4444-555555555555',
    created_at: '2026-08-06T13:00:00.000Z',
    updated_at: '2026-08-06T13:00:00.000Z',
  },
  {
    id: 'e4f1a239-20c1-4d33-91ab-b19c670f5e12',
    cargo_type: 'LTL',
    volume: 12.5,
    weight: 1450,
    container_type: null,
    container_truck_id: 'TRK-9872',
    agent_name: 'SilkRoad Logistics',
    cargo: 'Electric Scooters',
    origin_city: 'Guangzhou',
    origin_country: 'China',
    origin_country_code: 'CN',
    origin_geoname_id: 1809858,
    origin_lat: 23.12744,
    origin_lng: 113.25052,
    destination_city: 'Samarkand',
    destination_country: 'Uzbekistan',
    destination_country_code: 'UZ',
    destination_geoname_id: 1216265,
    destination_lat: 39.65417,
    destination_lng: 66.95972,
    confirmed_date: '2026-08-10',
    loaded_date: '2026-08-12',
    arrived_date: null,
    purchase_price: 4500,
    purchase_currency: 'USD',
    purchase_date: '2026-08-10',
    purchase_usd_rate: 12800,
    purchase_custom_rate: null,
    sell_price: 6200,
    sell_currency: 'USD',
    sell_date: '2026-08-10',
    sell_usd_rate: 12800,
    sell_custom_rate: null,
    usd_rmb_rate: null,
    status: 'Waiting',
    description: 'Fragile items, handle with care',
    load_code: 'LTL-2026-0881',
    is_turnkey: true,
    client_id: 'c-client-1',
    employee_id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
    created_at: '2026-08-05T11:50:00.000Z',
    updated_at: '2026-08-05T11:50:00.000Z',
  },
  {
    id: '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d',
    cargo_type: 'FTL',
    volume: null,
    weight: null,
    container_type: '40HQ',
    container_truck_id: 'CONTAINER-4091',
    agent_name: 'Shanghai Trans',
    cargo: 'Solar Panels',
    origin_city: 'Shanghai',
    origin_country: 'China',
    origin_country_code: 'CN',
    origin_geoname_id: 1796236,
    origin_lat: 31.22222,
    origin_lng: 121.45806,
    destination_city: 'Tashkent',
    destination_country: 'Uzbekistan',
    destination_country_code: 'UZ',
    destination_geoname_id: 1512569,
    destination_lat: 41.26465,
    destination_lng: 69.21627,
    confirmed_date: '2026-08-01',
    loaded_date: '2026-08-04',
    arrived_date: '2026-08-18',
    purchase_price: 50000,
    purchase_currency: 'RMB',
    purchase_date: '2026-08-01',
    purchase_usd_rate: 12800,
    purchase_custom_rate: null,
    sell_price: 9500,
    sell_currency: 'USD',
    sell_date: '2026-08-04',
    sell_usd_rate: 12800,
    sell_custom_rate: null,
    usd_rmb_rate: 7.235,
    status: 'On the way',
    description: 'High efficiency photovoltaic modules',
    client_id: 'c-client-2',
    employee_id: '2b78a1c9-34e5-4a1d-91b2-c8d9e0f1a2b3',
    created_at: '2026-08-04T09:30:00.000Z',
    updated_at: '2026-08-04T09:30:00.000Z',
  },
  {
    id: 'b2c3d4e5-6f7a-8b9c-0d1e-2f3a4b5c6d7e',
    cargo_type: 'FTL',
    volume: null,
    weight: null,
    container_type: '40GP',
    container_truck_id: 'TRK-904-UZ',
    agent_name: 'Yiwu Express Ltd',
    cargo: 'Automotive Spare Parts',
    origin_city: 'Istanbul',
    origin_country: 'Turkey',
    origin_country_code: 'TR',
    origin_geoname_id: 745044,
    origin_lat: 41.01384,
    origin_lng: 28.94966,
    destination_city: 'Tashkent',
    destination_country: 'Uzbekistan',
    destination_country_code: 'UZ',
    destination_geoname_id: 1512569,
    destination_lat: 41.26465,
    destination_lng: 69.21627,
    confirmed_date: '2026-07-10',
    loaded_date: '2026-07-12',
    arrived_date: '2026-07-22',
    purchase_price: 18000,
    purchase_currency: 'RMB',
    purchase_date: '2026-07-10',
    purchase_usd_rate: 12800,
    purchase_custom_rate: null,
    sell_price: 4800,
    sell_currency: 'USD',
    sell_date: '2026-07-12',
    sell_usd_rate: 12800,
    sell_custom_rate: null,
    usd_rmb_rate: 7.25,
    status: 'On the border',
    description: 'Brake pads and filter elements',
    client_id: 'c-client-1',
    employee_id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
    created_at: '2026-07-10T08:00:00.000Z',
    updated_at: '2026-07-10T08:00:00.000Z',
  },
  {
    id: 'c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f',
    cargo_type: 'FTL',
    volume: null,
    weight: null,
    container_type: '40HQ',
    container_truck_id: 'TRK-512-CN',
    agent_name: 'Shenzhen Trans Lines',
    cargo: 'Solar Panels & Inverters',
    origin_city: 'Shenzhen',
    origin_country: 'China',
    origin_country_code: 'CN',
    origin_geoname_id: 1795565,
    origin_lat: 22.54554,
    origin_lng: 114.0683,
    destination_city: 'Tashkent',
    destination_country: 'Uzbekistan',
    destination_country_code: 'UZ',
    destination_geoname_id: 1512569,
    destination_lat: 41.26465,
    destination_lng: 69.21627,
    confirmed_date: '2026-07-18',
    loaded_date: '2026-07-20',
    arrived_date: '2026-08-05',
    purchase_price: 28000,
    purchase_currency: 'RMB',
    purchase_date: '2026-07-18',
    purchase_usd_rate: 12800,
    purchase_custom_rate: null,
    sell_price: 7900,
    sell_currency: 'USD',
    sell_date: '2026-07-20',
    sell_usd_rate: 12800,
    sell_custom_rate: null,
    usd_rmb_rate: 7.25,
    status: 'Station',
    description: 'Customs cleared at Tashkent terminal',
    client_id: 'c-client-2',
    employee_id: '2b78a1c9-34e5-4a1d-91b2-c8d9e0f1a2b3',
    created_at: '2026-07-18T14:00:00.000Z',
    updated_at: '2026-07-18T14:00:00.000Z',
  },
  {
    id: 'd4e5f6a7-8b9c-0d1e-2f3a-4b5c6d7e8f9a',
    cargo_type: 'LTL',
    volume: 18.0,
    weight: 2200,
    container_type: null,
    container_truck_id: 'MSKU-441209-1',
    agent_name: 'Ningbo Port Agents',
    cargo: 'Furniture & Home Textiles',
    origin_city: 'Ningbo',
    origin_country: 'China',
    origin_country_code: 'CN',
    origin_geoname_id: 1800627,
    origin_lat: 29.87819,
    origin_lng: 121.54945,
    destination_city: 'Bukhara',
    destination_country: 'Uzbekistan',
    destination_country_code: 'UZ',
    destination_geoname_id: 1217662,
    destination_lat: 39.77472,
    destination_lng: 64.42861,
    confirmed_date: '2026-06-20',
    loaded_date: '2026-06-25',
    arrived_date: '2026-07-15',
    purchase_price: 45000,
    purchase_currency: 'RMB',
    purchase_date: '2026-06-20',
    purchase_usd_rate: 12800,
    purchase_custom_rate: null,
    sell_price: 11500,
    sell_currency: 'USD',
    sell_date: '2026-06-25',
    sell_usd_rate: 12800,
    sell_custom_rate: null,
    usd_rmb_rate: 7.22,
    status: 'Arrived',
    description: 'Successfully delivered to client warehouse',
    client_id: 'c-client-1',
    employee_id: '11111111-2222-3333-4444-555555555555',
    created_at: '2026-06-20T12:00:00.000Z',
    updated_at: '2026-06-20T12:00:00.000Z',
  },
];

function getStoredDemoRecords(): InternalCargoRegistrationRecord[] {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('yaqeen_cargo_registrations_db');
      if (raw) return JSON.parse(raw);
    }
  } catch {
    // Ignore storage error
  }
  return [...INITIAL_DEMO_RECORDS];
}

function saveStoredDemoRecords(records: InternalCargoRegistrationRecord[]) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('yaqeen_cargo_registrations_db', JSON.stringify(records));
    }
  } catch {
    // Ignore storage error
  }
}

let demoRecords = getStoredDemoRecords();

// ---------------------------------------------------------------------------
// Offline Demo Mock Handler
// ---------------------------------------------------------------------------

registerDemoHandler((path: string, options: RequestInit, body: any) => {
  const method = (options.method || 'GET').toUpperCase();
  const startsWith = (prefix: string) => path.startsWith(prefix);

  if (!startsWith('/cargo-registrations')) return null;

  const urlObj = new URL(path, 'http://localhost');
  const pathname = urlObj.pathname;

  // 1. GET /cargo-registrations (Paginated & Filtered)
  if (pathname === '/cargo-registrations' && method === 'GET') {
    const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
    const limit = parseInt(urlObj.searchParams.get('limit') || '10', 10);
    const offsetParam = urlObj.searchParams.get('offset');
    const offset = offsetParam !== null ? parseInt(offsetParam, 10) : (page - 1) * limit;

    const search = (urlObj.searchParams.get('search') || '').toLowerCase().trim();
    const status = urlObj.searchParams.get('status');
    const cargoType = urlObj.searchParams.get('cargo_type');
    const containerType = urlObj.searchParams.get('container_type');
    const transportTypesParam = urlObj.searchParams.get('transport_types');
    const clientId = urlObj.searchParams.get('client_id');
    const employeeId = urlObj.searchParams.get('employee_id');
    const consolidationIdParam = urlObj.searchParams.get('consolidation_id');
    const hasConsolidationParam = urlObj.searchParams.get('has_consolidation');

    const confirmedStart = urlObj.searchParams.get('confirmed_start_date');
    const confirmedEnd = urlObj.searchParams.get('confirmed_end_date');
    const loadedStart = urlObj.searchParams.get('loaded_start_date');
    const loadedEnd = urlObj.searchParams.get('loaded_end_date');
    const arrivedStart = urlObj.searchParams.get('arrived_start_date');
    const arrivedEnd = urlObj.searchParams.get('arrived_end_date');
    const purchaseStart = urlObj.searchParams.get('purchase_start_date');
    const purchaseEnd = urlObj.searchParams.get('purchase_end_date');
    const purchaseExact = urlObj.searchParams.get('purchase_date');
    const sellStart = urlObj.searchParams.get('sell_start_date');
    const sellEnd = urlObj.searchParams.get('sell_end_date');
    const sellExact = urlObj.searchParams.get('sell_date');
    const createdStart =
      urlObj.searchParams.get('created_start_date') || urlObj.searchParams.get('created_at_start');
    const createdEnd =
      urlObj.searchParams.get('created_end_date') || urlObj.searchParams.get('created_at_end');

    const originCityParam = (urlObj.searchParams.get('origin_city') || '').toLowerCase().trim();
    const originCountryParam = (urlObj.searchParams.get('origin_country_code') || '')
      .toUpperCase()
      .trim();
    const originGeonameParam = urlObj.searchParams.get('origin_geoname_id');
    const destCityParam = (urlObj.searchParams.get('destination_city') || '').toLowerCase().trim();
    const destCountryParam = (urlObj.searchParams.get('destination_country_code') || '')
      .toUpperCase()
      .trim();
    const destGeonameParam = urlObj.searchParams.get('destination_geoname_id');

    let filtered = [...demoRecords];

    if (search) {
      filtered = filtered.filter((r) => {
        const client = demoClientsDb.find((c) => c.id === r.client_id);
        const clientName = client ? `${client.first_name} ${client.last_name}`.toLowerCase() : '';
        const emp = demoEmployeesDb.get(r.employee_id);
        const empName = emp ? `${emp.first_name} ${emp.last_name}`.toLowerCase() : '';

        return (
          r.container_truck_id.toLowerCase().includes(search) ||
          r.cargo.toLowerCase().includes(search) ||
          r.agent_name.toLowerCase().includes(search) ||
          (r.origin_city && r.origin_city.toLowerCase().includes(search)) ||
          (r.destination_city && r.destination_city.toLowerCase().includes(search)) ||
          clientName.includes(search) ||
          empName.includes(search)
        );
      });
    }
    if (status && status !== 'all') {
      filtered = filtered.filter((r) => r.status.toLowerCase() === status.toLowerCase());
    }
    if (cargoType) {
      filtered = filtered.filter((r) => r.cargo_type.toLowerCase() === cargoType.toLowerCase());
    }
    if (containerType) {
      filtered = filtered.filter(
        (r) => (r.container_type || '').toLowerCase() === containerType.toLowerCase()
      );
    }
    if (transportTypesParam) {
      const requestedTypes = transportTypesParam
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (requestedTypes.length > 0) {
        filtered = filtered.filter((r) => {
          const itemTypes = (r.transport_types || []).map((t) => t.toLowerCase());
          return requestedTypes.some((rt) => itemTypes.includes(rt));
        });
      }
    }
    if (clientId) {
      filtered = filtered.filter((r) => r.client_id === clientId);
    }
    if (employeeId) {
      filtered = filtered.filter((r) => r.employee_id === employeeId);
    }
    if (consolidationIdParam) {
      filtered = filtered.filter((r) => r.consolidation_id === consolidationIdParam);
    }
    if (hasConsolidationParam === 'true') {
      filtered = filtered.filter((r) => !!r.consolidation_id);
    } else if (hasConsolidationParam === 'false') {
      filtered = filtered.filter((r) => !r.consolidation_id);
    }
    if (originCityParam) {
      filtered = filtered.filter((r) =>
        (r.origin_city || '').toLowerCase().includes(originCityParam)
      );
    }
    if (originCountryParam) {
      filtered = filtered.filter(
        (r) => (r.origin_country_code || '').toUpperCase() === originCountryParam
      );
    }
    if (originGeonameParam) {
      filtered = filtered.filter((r) => String(r.origin_geoname_id) === String(originGeonameParam));
    }
    if (destCityParam) {
      filtered = filtered.filter((r) =>
        (r.destination_city || '').toLowerCase().includes(destCityParam)
      );
    }
    if (destCountryParam) {
      filtered = filtered.filter(
        (r) => (r.destination_country_code || '').toUpperCase() === destCountryParam
      );
    }
    if (destGeonameParam) {
      filtered = filtered.filter(
        (r) => String(r.destination_geoname_id) === String(destGeonameParam)
      );
    }

    const cleanDate = (d?: string | null) => (d ? d.slice(0, 10) : '');

    if (confirmedStart) {
      filtered = filtered.filter((r) => cleanDate(r.confirmed_date) >= confirmedStart);
    }
    if (confirmedEnd) {
      filtered = filtered.filter((r) => {
        const cd = cleanDate(r.confirmed_date);
        return cd !== '' && cd <= confirmedEnd;
      });
    }
    if (loadedStart) {
      filtered = filtered.filter((r) => cleanDate(r.loaded_date) >= loadedStart);
    }
    if (loadedEnd) {
      filtered = filtered.filter((r) => {
        const ld = cleanDate(r.loaded_date);
        return ld !== '' && ld <= loadedEnd;
      });
    }
    if (arrivedStart) {
      filtered = filtered.filter((r) => cleanDate(r.arrived_date) >= arrivedStart);
    }
    if (arrivedEnd) {
      filtered = filtered.filter((r) => {
        const ad = cleanDate(r.arrived_date);
        return ad !== '' && ad <= arrivedEnd;
      });
    }
    if (purchaseStart) {
      filtered = filtered.filter((r) => {
        const pd = cleanDate(r.purchase_date || r.confirmed_date || r.created_at);
        return pd >= purchaseStart;
      });
    }
    if (purchaseEnd) {
      filtered = filtered.filter((r) => {
        const pd = cleanDate(r.purchase_date || r.confirmed_date || r.created_at);
        return pd !== '' && pd <= purchaseEnd;
      });
    }
    if (purchaseExact) {
      filtered = filtered.filter((r) => {
        const pd = cleanDate(r.purchase_date || r.confirmed_date || r.created_at);
        return pd === purchaseExact;
      });
    }
    if (sellStart) {
      filtered = filtered.filter((r) => {
        const sd = cleanDate(r.sell_date || r.created_at);
        return sd >= sellStart;
      });
    }
    if (sellEnd) {
      filtered = filtered.filter((r) => {
        const sd = cleanDate(r.sell_date || r.created_at);
        return sd !== '' && sd <= sellEnd;
      });
    }
    if (sellExact) {
      filtered = filtered.filter((r) => {
        const sd = cleanDate(r.sell_date || r.created_at);
        return sd === sellExact;
      });
    }
    if (createdStart) {
      filtered = filtered.filter((r) => cleanDate(r.created_at) >= createdStart);
    }
    if (createdEnd) {
      filtered = filtered.filter((r) => {
        const cd = cleanDate(r.created_at);
        return cd !== '' && cd <= createdEnd;
      });
    }

    const sortBy = urlObj.searchParams.get('sort_by') || 'created_at';
    const sortOrder = (
      urlObj.searchParams.get('sort_order') ||
      urlObj.searchParams.get('order') ||
      'DESC'
    ).toUpperCase();
    const isAsc = sortOrder === 'ASC';

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'container_truck_id':
          comparison = (a.container_truck_id || '').localeCompare(b.container_truck_id || '');
          break;
        case 'cargo':
          comparison = (a.cargo || '').localeCompare(b.cargo || '');
          break;
        case 'agent_name':
          comparison = (a.agent_name || '').localeCompare(b.agent_name || '');
          break;
        case 'cargo_type':
          comparison = (a.cargo_type || '').localeCompare(b.cargo_type || '');
          break;
        case 'container_type':
          comparison = (a.container_type || '').localeCompare(b.container_type || '');
          break;
        case 'client_name':
        case 'client_first_name':
        case 'client_last_name':
        case 'client_company': {
          const clientA = demoClientsDb.find((c) => c.id === a.client_id);
          const nameA = clientA ? `${clientA.first_name} ${clientA.last_name}`.trim() : '';
          const clientB = demoClientsDb.find((c) => c.id === b.client_id);
          const nameB = clientB ? `${clientB.first_name} ${clientB.last_name}`.trim() : '';
          comparison = nameA.localeCompare(nameB);
          break;
        }
        case 'employee_name':
        case 'emp_first_name':
        case 'emp_last_name': {
          const empA = demoEmployeesDb.get(a.employee_id);
          const nameA = empA ? `${empA.first_name} ${empA.last_name}`.trim() : '';
          const empB = demoEmployeesDb.get(b.employee_id);
          const nameB = empB ? `${empB.first_name} ${empB.last_name}`.trim() : '';
          comparison = nameA.localeCompare(nameB);
          break;
        }
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        case 'purchase_price':
          comparison = (Number(a.purchase_price) || 0) - (Number(b.purchase_price) || 0);
          break;
        case 'purchase_date': {
          const dateA = a.purchase_date || a.confirmed_date || a.created_at || '';
          const dateB = b.purchase_date || b.confirmed_date || b.created_at || '';
          if (!dateA && !dateB) comparison = 0;
          else if (!dateA) comparison = 1;
          else if (!dateB) comparison = -1;
          else comparison = dateA.localeCompare(dateB);
          break;
        }
        case 'sell_price':
          comparison = (Number(a.sell_price) || 0) - (Number(b.sell_price) || 0);
          break;
        case 'sell_date': {
          const dateA = a.sell_date || a.created_at || '';
          const dateB = b.sell_date || b.created_at || '';
          if (!dateA && !dateB) comparison = 0;
          else if (!dateA) comparison = 1;
          else if (!dateB) comparison = -1;
          else comparison = dateA.localeCompare(dateB);
          break;
        }
        case 'net_yield': {
          const convA_pur = convertPriceToUsdAndUzs(
            a.purchase_price,
            a.purchase_currency,
            a.purchase_date,
            a.purchase_custom_rate || a.purchase_usd_rate,
            a.usd_rmb_rate
          );
          const convA_sell = convertPriceToUsdAndUzs(
            a.sell_price,
            a.sell_currency,
            a.sell_date,
            a.sell_custom_rate || a.sell_usd_rate,
            a.usd_rmb_rate
          );
          const netA = convA_sell.amount_usd - convA_pur.amount_usd;

          const convB_pur = convertPriceToUsdAndUzs(
            b.purchase_price,
            b.purchase_currency,
            b.purchase_date,
            b.purchase_custom_rate || b.purchase_usd_rate,
            b.usd_rmb_rate
          );
          const convB_sell = convertPriceToUsdAndUzs(
            b.sell_price,
            b.sell_currency,
            b.sell_date,
            b.sell_custom_rate || b.sell_usd_rate,
            b.usd_rmb_rate
          );
          const netB = convB_sell.amount_usd - convB_pur.amount_usd;

          comparison = netA - netB;
          break;
        }
        case 'confirmed_date': {
          const dateA = a.confirmed_date || '';
          const dateB = b.confirmed_date || '';
          if (!dateA && !dateB) comparison = 0;
          else if (!dateA) comparison = 1;
          else if (!dateB) comparison = -1;
          else comparison = dateA.localeCompare(dateB);
          break;
        }
        case 'loaded_date': {
          const dateA = a.loaded_date || '';
          const dateB = b.loaded_date || '';
          if (!dateA && !dateB) comparison = 0;
          else if (!dateA) comparison = 1;
          else if (!dateB) comparison = -1;
          else comparison = dateA.localeCompare(dateB);
          break;
        }
        case 'arrived_date': {
          const dateA = a.arrived_date || '';
          const dateB = b.arrived_date || '';
          if (!dateA && !dateB) comparison = 0;
          else if (!dateA) comparison = 1;
          else if (!dateB) comparison = -1;
          else comparison = dateA.localeCompare(dateB);
          break;
        }
        case 'created_at': {
          const dateA = a.created_at || '';
          const dateB = b.created_at || '';
          comparison = dateA.localeCompare(dateB);
          break;
        }
        case 'updated_at': {
          const dateA = a.updated_at || '';
          const dateB = b.updated_at || '';
          comparison = dateA.localeCompare(dateB);
          break;
        }
        case 'usd_rmb_rate':
          comparison = (a.usd_rmb_rate || 0) - (b.usd_rmb_rate || 0);
          break;
        case 'volume':
          comparison = (a.volume || 0) - (b.volume || 0);
          break;
        case 'weight':
          comparison = (a.weight || 0) - (b.weight || 0);
          break;
        default:
          comparison = (a.created_at || '').localeCompare(b.created_at || '');
          break;
      }
      return isAsc ? comparison : -comparison;
    });

    const calculated_net_yield = {
      USD: 0,
      UZS: 0,
      RUB: 0,
      RMB: 0,
      total_usd: 0,
      total_uzs: 0,
    };
    const gross_sales_revenue = {
      USD: 0,
      UZS: 0,
      RUB: 0,
      RMB: 0,
      total_usd_equivalent: 0,
      total_uzs_equivalent: 0,
    };

    filtered.forEach((r) => {
      // Convert Purchase & Sell using conversion helper
      const purDate = r.purchase_date || r.confirmed_date || r.created_at.slice(0, 10);
      const sellDate = r.sell_date || r.created_at.slice(0, 10);

      const purConv = convertPriceToUsdAndUzs(
        r.purchase_price,
        r.purchase_currency,
        purDate,
        r.purchase_custom_rate || r.purchase_usd_rate,
        r.usd_rmb_rate
      );

      const sellConv = convertPriceToUsdAndUzs(
        r.sell_price,
        r.sell_currency,
        sellDate,
        r.sell_custom_rate || r.sell_usd_rate,
        r.usd_rmb_rate
      );

      // Accumulate itemized revenue
      if (r.sell_currency && gross_sales_revenue[r.sell_currency] !== undefined) {
        gross_sales_revenue[r.sell_currency] += r.sell_price;
      }
      gross_sales_revenue.total_usd_equivalent += sellConv.amount_usd;
      gross_sales_revenue.total_uzs_equivalent += sellConv.amount_uzs;

      // Net Yield
      const itemNetUsd = sellConv.amount_usd - purConv.amount_usd;
      const itemNetUzs = sellConv.amount_uzs - purConv.amount_uzs;

      calculated_net_yield.total_usd += itemNetUsd;
      calculated_net_yield.total_uzs += itemNetUzs;

      if (r.purchase_currency === r.sell_currency) {
        calculated_net_yield[r.sell_currency] += r.sell_price - r.purchase_price;
      } else {
        calculated_net_yield[r.sell_currency] += r.sell_price;
        calculated_net_yield[r.purchase_currency] -= r.purchase_price;
      }
    });

    // Round financial summaries
    (Object.keys(calculated_net_yield) as (keyof typeof calculated_net_yield)[]).forEach((curr) => {
      calculated_net_yield[curr] = Math.round(calculated_net_yield[curr] * 100) / 100;
    });
    (Object.keys(gross_sales_revenue) as (keyof typeof gross_sales_revenue)[]).forEach((curr) => {
      gross_sales_revenue[curr] = Math.round(gross_sales_revenue[curr] * 100) / 100;
    });

    const total = filtered.length;
    const paginatedItems = filtered.slice(offset, offset + limit);

    const listData: CargoRegistrationListItem[] = paginatedItems.map((r) => {
      const client = demoClientsDb.find((c) => c.id === r.client_id);
      const clientName = client ? `${client.first_name} ${client.last_name}`.trim() : 'Client';

      const emp = demoEmployeesDb.get(r.employee_id);
      const empName = emp ? `${emp.first_name} ${emp.last_name}`.trim() : 'Employee';

      const purDate =
        r.purchase_date ||
        r.confirmed_date ||
        (r.created_at ? r.created_at.slice(0, 10) : undefined);
      const sellDate = r.sell_date || (r.created_at ? r.created_at.slice(0, 10) : undefined);

      const purConv = convertPriceToUsdAndUzs(
        r.purchase_price,
        r.purchase_currency,
        purDate,
        r.purchase_custom_rate || r.purchase_usd_rate,
        r.usd_rmb_rate
      );

      const sellConv = convertPriceToUsdAndUzs(
        r.sell_price,
        r.sell_currency,
        sellDate,
        r.sell_custom_rate || r.sell_usd_rate,
        r.usd_rmb_rate
      );

      const netYieldUsd = Math.round((sellConv.amount_usd - purConv.amount_usd) * 100) / 100;
      const netYieldUzs = Math.round((sellConv.amount_uzs - purConv.amount_uzs) * 100) / 100;

      const origDetail: LocationDetail | null = r.origin_city
        ? {
            city: r.origin_city,
            country: r.origin_country,
            country_code: r.origin_country_code,
            geoname_id: r.origin_geoname_id,
            latitude: r.origin_lat,
            longitude: r.origin_lng,
            display_name: r.origin_country_code
              ? `${r.origin_city} (${r.origin_country_code})`
              : r.origin_city,
            google_maps_url: locationsApi.buildPointUrl(r.origin_lat, r.origin_lng, r.origin_city),
          }
        : null;

      const destDetail: LocationDetail | null = r.destination_city
        ? {
            city: r.destination_city,
            country: r.destination_country,
            country_code: r.destination_country_code,
            geoname_id: r.destination_geoname_id,
            latitude: r.destination_lat,
            longitude: r.destination_lng,
            display_name: r.destination_country_code
              ? `${r.destination_city} (${r.destination_country_code})`
              : r.destination_city,
            google_maps_url: locationsApi.buildPointUrl(
              r.destination_lat,
              r.destination_lng,
              r.destination_city
            ),
          }
        : null;

      const routeInfo: RouteInfo | null =
        r.origin_city && r.destination_city
          ? {
              origin: r.origin_city,
              destination: r.destination_city,
              origin_display: r.origin_country
                ? `${r.origin_city}, ${r.origin_country}`
                : r.origin_city,
              destination_display: r.destination_country
                ? `${r.destination_city}, ${r.destination_country}`
                : r.destination_city,
              google_maps_dir_url: locationsApi.buildRouteUrl(
                r.origin_lat,
                r.origin_lng,
                r.destination_lat,
                r.destination_lng,
                r.origin_city,
                r.destination_city
              ),
            }
          : null;

      return {
        id: r.id,
        cargo_type: r.cargo_type,
        volume: r.volume,
        weight: r.weight,
        container_type: r.container_type,
        container_truck_id: r.container_truck_id,
        agent_name: r.agent_name,
        client_full_name: clientName,
        client: client
          ? {
              id: client.id,
              name: clientName,
              first_name: client.first_name,
              last_name: client.last_name,
              company_name: client.company_name,
            }
          : null,
        cargo: r.cargo,
        usd_rmb_rate: r.usd_rmb_rate,
        employee_full_name: empName,
        employee: emp
          ? {
              id: emp.id,
              name: empName,
              first_name: emp.first_name,
              last_name: emp.last_name,
            }
          : null,
        consolidation_id: r.consolidation_id,
        purchase_date: purDate,
        purchase_usd_rate: purConv.usd_rate,
        purchase_price: {
          amount: r.purchase_price,
          currency: r.purchase_currency,
          amount_usd: purConv.amount_usd,
          amount_uzs: purConv.amount_uzs,
          date: purDate,
          usd_rate: purConv.usd_rate,
          custom_rate: r.purchase_custom_rate,
        },
        sell_date: sellDate,
        sell_usd_rate: sellConv.usd_rate,
        sell_price: {
          amount: r.sell_price,
          currency: r.sell_currency,
          amount_usd: sellConv.amount_usd,
          amount_uzs: sellConv.amount_uzs,
          date: sellDate,
          usd_rate: sellConv.usd_rate,
          custom_rate: r.sell_custom_rate,
        },
        net_yield: {
          amount:
            r.sell_currency === 'USD'
              ? netYieldUsd
              : r.sell_currency === 'UZS'
                ? netYieldUzs
                : netYieldUsd,
          amount_usd: netYieldUsd,
          amount_uzs: netYieldUzs,
          purchase_currency: r.purchase_currency,
          sell_currency: r.sell_currency,
        },
        origin: origDetail,
        destination: destDetail,
        route: routeInfo,
        origin_city: r.origin_city,
        origin_country: r.origin_country,
        origin_country_code: r.origin_country_code,
        origin_geoname_id: r.origin_geoname_id,
        origin_lat: r.origin_lat,
        origin_lng: r.origin_lng,
        destination_city: r.destination_city,
        destination_country: r.destination_country,
        destination_country_code: r.destination_country_code,
        destination_geoname_id: r.destination_geoname_id,
        destination_lat: r.destination_lat,
        destination_lng: r.destination_lng,
        transport_types: r.transport_types || [],
        status: r.status,
        description: r.description,
        load_code: r.load_code || null,
        is_turnkey: Boolean(r.is_turnkey),
        client_id: r.client_id,
        employee_id: r.employee_id,
        confirmed_date: r.confirmed_date,
        loaded_date: r.loaded_date,
        arrived_date: r.arrived_date,
        created_at: r.created_at,
        updated_at: r.updated_at,
      };
    });

    const active_containers = filtered.filter(
      (r) => r.status !== 'Arrived' && (r as any).status !== 'Delivered'
    ).length;
    const action_required = filtered.filter(
      (r) => r.status === 'Waiting' || r.status === 'Reload'
    ).length;

    const response: CargoRegistrationPaginatedResponse = {
      meta: {
        total,
        limit,
        offset,
        active_containers,
        action_required,
        calculated_net_yield,
        gross_sales_revenue,
      },
      data: listData,
    };

    return { handled: true, result: response };
  }

  // 2. GET /cargo-registrations/:id (Details)
  if (pathname.match(/^\/cargo-registrations\/[a-zA-Z0-9-]+$/) && method === 'GET') {
    const id = pathname.split('/cargo-registrations/')[1];
    const found = demoRecords.find((r) => r.id === id) || {
      id,
      cargo_type: 'LTL' as CargoType,
      volume: 10,
      weight: 1200,
      container_type: null,
      container_truck_id: 'TRK-' + (id.length > 6 ? id.slice(0, 6).toUpperCase() : '1001'),
      agent_name: 'SilkRoad Express',
      cargo: 'General Cargo',
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
      confirmed_date: new Date().toISOString().split('T')[0],
      loaded_date: null,
      arrived_date: null,
      purchase_price: 4500,
      purchase_currency: 'USD' as CurrencyType,
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_usd_rate: 11886.72,
      purchase_custom_rate: null,
      sell_price: 6200,
      sell_currency: 'USD' as CurrencyType,
      sell_date: new Date().toISOString().split('T')[0],
      sell_usd_rate: 11886.72,
      sell_custom_rate: null,
      usd_rmb_rate: 7.235,
      status: 'On the way' as CargoRegistrationStatus,
      description: 'Cargo shipment entry',
      client_id: 'c-client-1',
      employee_id: '1d63b635-8933-45d1-a233-d6902e3b27f1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const client = demoClientsDb.find((c) => c.id === found.client_id);
    const emp = demoEmployeesDb.get(found.employee_id);

    const purDate = found.purchase_date || found.confirmed_date || found.created_at.slice(0, 10);
    const sellDate = found.sell_date || found.created_at.slice(0, 10);

    const purConv = convertPriceToUsdAndUzs(
      found.purchase_price,
      found.purchase_currency,
      purDate,
      found.purchase_custom_rate || found.purchase_usd_rate,
      found.usd_rmb_rate
    );

    const sellConv = convertPriceToUsdAndUzs(
      found.sell_price,
      found.sell_currency,
      sellDate,
      found.sell_custom_rate || found.sell_usd_rate,
      found.usd_rmb_rate
    );

    const netUsd = Math.round((sellConv.amount_usd - purConv.amount_usd) * 100) / 100;
    const netUzs = Math.round((sellConv.amount_uzs - purConv.amount_uzs) * 100) / 100;

    const origDetail: LocationDetail | null = found.origin_city
      ? {
          city: found.origin_city,
          country: found.origin_country,
          country_code: found.origin_country_code,
          geoname_id: found.origin_geoname_id,
          latitude: found.origin_lat,
          longitude: found.origin_lng,
          display_name: found.origin_country_code
            ? `${found.origin_city} (${found.origin_country_code})`
            : found.origin_city,
          google_maps_url: locationsApi.buildPointUrl(
            found.origin_lat,
            found.origin_lng,
            found.origin_city
          ),
        }
      : null;

    const destDetail: LocationDetail | null = found.destination_city
      ? {
          city: found.destination_city,
          country: found.destination_country,
          country_code: found.destination_country_code,
          geoname_id: found.destination_geoname_id,
          latitude: found.destination_lat,
          longitude: found.destination_lng,
          display_name: found.destination_country_code
            ? `${found.destination_city} (${found.destination_country_code})`
            : found.destination_city,
          google_maps_url: locationsApi.buildPointUrl(
            found.destination_lat,
            found.destination_lng,
            found.destination_city
          ),
        }
      : null;

    const routeInfo: RouteInfo | null =
      found.origin_city && found.destination_city
        ? {
            origin: found.origin_city,
            destination: found.destination_city,
            origin_display: found.origin_country
              ? `${found.origin_city}, ${found.origin_country}`
              : found.origin_city,
            destination_display: found.destination_country
              ? `${found.destination_city}, ${found.destination_country}`
              : found.destination_city,
            google_maps_dir_url: locationsApi.buildRouteUrl(
              found.origin_lat,
              found.origin_lng,
              found.destination_lat,
              found.destination_lng,
              found.origin_city,
              found.destination_city
            ),
          }
        : null;

    const detail: CargoRegistrationDetail = {
      id: found.id,
      cargo_type: found.cargo_type,
      volume: found.volume,
      weight: found.weight,
      container_type: found.container_type as ContainerType | null,
      container_truck_id: found.container_truck_id,
      agent_name: found.agent_name,
      cargo: found.cargo,
      origin: origDetail,
      destination: destDetail,
      route: routeInfo,
      origin_city: found.origin_city,
      origin_country: found.origin_country,
      origin_country_code: found.origin_country_code,
      origin_geoname_id: found.origin_geoname_id,
      origin_lat: found.origin_lat,
      origin_lng: found.origin_lng,
      destination_city: found.destination_city,
      destination_country: found.destination_country,
      destination_country_code: found.destination_country_code,
      destination_geoname_id: found.destination_geoname_id,
      destination_lat: found.destination_lat,
      destination_lng: found.destination_lng,
      confirmed_date: found.confirmed_date,
      loaded_date: found.loaded_date,
      arrived_date: found.arrived_date,
      purchase_price: found.purchase_price,
      purchase_currency: found.purchase_currency,
      purchase_date: purDate,
      purchase_usd_rate: purConv.usd_rate,
      purchase_custom_rate: found.purchase_custom_rate,
      purchase_amount_usd: purConv.amount_usd,
      purchase_amount_uzs: purConv.amount_uzs,
      sell_price: found.sell_price,
      sell_currency: found.sell_currency,
      sell_date: sellDate,
      sell_usd_rate: sellConv.usd_rate,
      sell_custom_rate: found.sell_custom_rate,
      sell_amount_usd: sellConv.amount_usd,
      sell_amount_uzs: sellConv.amount_uzs,
      net_yield: netUsd,
      net_yield_details: {
        amount_usd: netUsd,
        amount_uzs: netUzs,
      },
      usd_rmb_rate: found.usd_rmb_rate,
      status: found.status,
      description: found.description,
      load_code: found.load_code || null,
      is_turnkey: Boolean(found.is_turnkey),
      client_id: found.client_id,
      client: client
        ? {
            id: client.id,
            first_name: client.first_name,
            last_name: client.last_name,
            company_name: client.company_name,
            phone: client.phone,
            email: (client as any).email || undefined,
          }
        : undefined,
      employee_id: found.employee_id,
      employee: emp
        ? {
            id: emp.id,
            first_name: emp.first_name,
            last_name: emp.last_name,
            position: emp.department_name || 'Logistics Specialist',
          }
        : undefined,
      created_at: found.created_at,
      updated_at: found.updated_at,
    };

    return { handled: true, result: detail };
  }

  // 3. POST /cargo-registrations (Create)
  if (pathname === '/cargo-registrations' && method === 'POST') {
    const {
      cargo_type,
      volume,
      weight,
      container_type,
      transport_types,
      container_truck_id,
      agent_name,
      cargo,
      origin_city,
      origin_country,
      origin_country_code,
      origin_geoname_id,
      origin_lat,
      origin_lng,
      destination_city,
      destination_country,
      destination_country_code,
      destination_geoname_id,
      destination_lat,
      destination_lng,
      prevent_duplicate,
      confirmed_date,
      loaded_date,
      arrived_date,
      purchase_price,
      purchase_currency,
      purchase_date,
      purchase_exchange_rate,
      purchase_custom_rate,
      sell_price,
      sell_currency,
      sell_date,
      sell_exchange_rate,
      sell_custom_rate,
      usd_rmb_rate,
      status,
      description,
      load_code,
      is_turnkey,
      client_id,
      employee_id,
    } = body || {};

    if (!cargo_type || (cargo_type !== 'LTL' && cargo_type !== 'FTL')) {
      throw makeApiError(path, 400, 'invalid_cargo_type', 'cargo_type must be LTL or FTL');
    }

    if (prevent_duplicate) {
      const match = demoRecords.find((item) => {
        const sameClient = client_id && item.client_id === client_id;
        const sameTruck =
          container_truck_id &&
          String(item.container_truck_id).trim().toLowerCase() ===
            String(container_truck_id).trim().toLowerCase();
        const sameCargo =
          cargo && String(item.cargo).trim().toLowerCase() === String(cargo).trim().toLowerCase();
        const samePrice =
          purchase_price !== undefined && Number(item.purchase_price) === Number(purchase_price);
        const sameRoute =
          (!origin_city || (item.origin_city || '').toLowerCase() === origin_city.toLowerCase()) &&
          (!destination_city ||
            (item.destination_city || '').toLowerCase() === destination_city.toLowerCase());

        return sameClient && (sameTruck || (sameCargo && samePrice && sameRoute));
      });

      if (match) {
        throw makeApiError(
          path,
          400,
          'duplicate_cargo_detected',
          `An identical cargo entry "${match.cargo}" with truck ${match.container_truck_id} was already registered.`
        );
      }
    }

    if (cargo_type === 'LTL') {
      if (!volume || Number(volume) <= 0) {
        throw makeApiError(
          path,
          400,
          'volume_required_for_ltl',
          'Volume > 0 is required for LTL cargo'
        );
      }
      if (!weight || Number(weight) <= 0) {
        throw makeApiError(
          path,
          400,
          'weight_required_for_ltl',
          'Weight > 0 is required for LTL cargo'
        );
      }
    }

    if (cargo_type === 'FTL') {
      if (!container_type) {
        throw makeApiError(
          path,
          400,
          'container_type_required_for_ftl',
          'Container type is required for FTL cargo'
        );
      }
      if (!CONTAINER_TYPES.includes(container_type as ContainerType)) {
        throw makeApiError(path, 400, 'invalid_container_type', 'Invalid container type selected');
      }
    }

    if (purchase_currency === 'RMB' || sell_currency === 'RMB') {
      if (!usd_rmb_rate || Number(usd_rmb_rate) <= 0) {
        throw makeApiError(
          path,
          400,
          'usd_rmb_rate_required',
          'USD->RMB rate (> 0) is required when RMB currency is selected'
        );
      }
    }

    if (!container_truck_id || !/^[a-zA-Z0-9-]+$/.test(container_truck_id)) {
      throw makeApiError(
        path,
        400,
        'invalid_container_truck_id',
        'Container/Truck ID must contain only letters, numbers, and hyphens'
      );
    }

    if (!client_id) {
      throw makeApiError(path, 400, 'client_id_required', 'Client selection is required');
    }

    const assignedEmpId = employee_id || 'b1a2c3d4-e5f6-7890-abcd-ef1234567890';
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];

    const pCustom = purchase_exchange_rate || purchase_custom_rate || null;
    const sCustom = sell_exchange_rate || sell_custom_rate || null;

    const newRecord: InternalCargoRegistrationRecord = {
      id: `cr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      cargo_type,
      volume: cargo_type === 'LTL' ? Number(volume) : null,
      weight: cargo_type === 'LTL' ? Number(weight) : null,
      container_type: cargo_type === 'FTL' ? container_type : null,
      transport_types: transport_types || [],
      container_truck_id: String(container_truck_id).trim(),
      agent_name: String(agent_name || '').trim(),
      cargo: String(cargo || '').trim(),
      origin_city: origin_city ? String(origin_city).trim() : null,
      origin_country: origin_country ? String(origin_country).trim() : null,
      origin_country_code: origin_country_code ? String(origin_country_code).trim() : null,
      origin_geoname_id: origin_geoname_id !== undefined ? origin_geoname_id : null,
      origin_lat: origin_lat !== undefined ? origin_lat : null,
      origin_lng: origin_lng !== undefined ? origin_lng : null,
      destination_city: destination_city ? String(destination_city).trim() : null,
      destination_country: destination_country ? String(destination_country).trim() : null,
      destination_country_code: destination_country_code
        ? String(destination_country_code).trim()
        : null,
      destination_geoname_id: destination_geoname_id !== undefined ? destination_geoname_id : null,
      destination_lat: destination_lat !== undefined ? destination_lat : null,
      destination_lng: destination_lng !== undefined ? destination_lng : null,
      confirmed_date: confirmed_date || null,
      loaded_date: loaded_date || null,
      arrived_date: arrived_date || null,
      purchase_price: Number(purchase_price) || 0,
      purchase_currency: purchase_currency || 'USD',
      purchase_date: purchase_date || confirmed_date || todayStr,
      purchase_usd_rate: pCustom ? Number(pCustom) : 11886.72,
      purchase_custom_rate: pCustom ? Number(pCustom) : null,
      sell_price: Number(sell_price) || 0,
      sell_currency: sell_currency || 'USD',
      sell_date: sell_date || todayStr,
      sell_usd_rate: sCustom ? Number(sCustom) : 11886.72,
      sell_custom_rate: sCustom ? Number(sCustom) : null,
      usd_rmb_rate:
        purchase_currency === 'RMB' || sell_currency === 'RMB' ? Number(usd_rmb_rate) : null,
      status: status || 'Waiting',
      description: description || null,
      load_code:
        cargo_type === 'LTL' && load_code
          ? String(load_code).trim()
          : load_code
            ? String(load_code).trim()
            : null,
      is_turnkey: Boolean(is_turnkey),
      client_id,
      employee_id: assignedEmpId,
      created_at: nowIso,
      updated_at: nowIso,
    };

    demoRecords.unshift(newRecord);
    saveStoredDemoRecords(demoRecords);

    return { handled: true, result: newRecord };
  }

  // 4. PATCH /cargo-registrations/:id (Update)
  if (pathname.match(/^\/cargo-registrations\/[a-zA-Z0-9-]+$/) && method === 'PATCH') {
    const id = pathname.split('/cargo-registrations/')[1];
    const idx = demoRecords.findIndex((r) => r.id === id);

    if (idx === -1) {
      throw makeApiError(path, 404, 'cargo_not_found', 'Cargo registration not found');
    }

    const current = demoRecords[idx];
    const pCustom =
      body?.purchase_exchange_rate || body?.purchase_custom_rate || current.purchase_custom_rate;
    const sCustom = body?.sell_exchange_rate || body?.sell_custom_rate || current.sell_custom_rate;

    const updatedState: InternalCargoRegistrationRecord = {
      ...current,
      ...body,
      load_code:
        body?.load_code !== undefined
          ? body.load_code
            ? String(body.load_code).trim()
            : null
          : current.load_code,
      is_turnkey:
        body?.is_turnkey !== undefined ? Boolean(body.is_turnkey) : (current.is_turnkey ?? false),
      purchase_custom_rate: pCustom ? Number(pCustom) : null,
      sell_custom_rate: sCustom ? Number(sCustom) : null,
      updated_at: new Date().toISOString(),
    };

    // Re-evaluate validation rules on updated record
    if (updatedState.cargo_type === 'LTL') {
      if (!updatedState.volume || Number(updatedState.volume) <= 0) {
        throw makeApiError(
          path,
          400,
          'volume_required_for_ltl',
          'Volume > 0 is required for LTL cargo'
        );
      }
      if (!updatedState.weight || Number(updatedState.weight) <= 0) {
        throw makeApiError(
          path,
          400,
          'weight_required_for_ltl',
          'Weight > 0 is required for LTL cargo'
        );
      }
      updatedState.container_type = null;
    } else if (updatedState.cargo_type === 'FTL') {
      if (
        !updatedState.container_type ||
        !CONTAINER_TYPES.includes(updatedState.container_type as ContainerType)
      ) {
        throw makeApiError(
          path,
          400,
          'invalid_container_type',
          'Valid container type required for FTL'
        );
      }
      updatedState.volume = null;
      updatedState.weight = null;
    }

    if (updatedState.purchase_currency === 'RMB' || updatedState.sell_currency === 'RMB') {
      if (!updatedState.usd_rmb_rate || Number(updatedState.usd_rmb_rate) <= 0) {
        throw makeApiError(
          path,
          400,
          'usd_rmb_rate_required',
          'USD->RMB rate (> 0) is required when RMB currency is selected'
        );
      }
    } else {
      updatedState.usd_rmb_rate = null;
    }

    demoRecords[idx] = updatedState;
    saveStoredDemoRecords(demoRecords);

    return { handled: true, result: updatedState };
  }

  // 5. DELETE /cargo-registrations/:id (Delete)
  if (pathname.match(/^\/cargo-registrations\/[a-zA-Z0-9-]+$/) && method === 'DELETE') {
    const id = pathname.split('/cargo-registrations/')[1];
    const idx = demoRecords.findIndex((r) => r.id === id);

    if (idx === -1) {
      throw makeApiError(path, 404, 'cargo_not_found', 'Cargo registration not found');
    }

    demoRecords = demoRecords.filter((r) => r.id !== id);
    saveStoredDemoRecords(demoRecords);

    return {
      handled: true,
      result: {
        message: 'Cargo registration successfully deleted',
        id,
      },
    };
  }

  // Stats / Summary Statistics
  if (
    (pathname === '/cargo-registrations/stats' ||
      pathname === '/cargo-registrations/stats/summary' ||
      pathname.startsWith('/cargo-registrations/stats')) &&
    method === 'GET'
  ) {
    const urlObj = new URL(path, 'http://localhost');
    const status = urlObj.searchParams.get('status');
    const empId = urlObj.searchParams.get('employee_id');
    const clientId = urlObj.searchParams.get('client_id');
    const cargoType = urlObj.searchParams.get('cargo_type');

    let list = [...demoRecords];
    if (status) list = list.filter((r) => r.status === status);
    if (empId) list = list.filter((r) => r.employee_id === empId);
    if (clientId) list = list.filter((r) => r.client_id === clientId);
    if (cargoType) list = list.filter((r) => r.cargo_type === cargoType);

    const ltlList = list.filter((r) => r.cargo_type === 'LTL');
    const ftlList = list.filter((r) => r.cargo_type === 'FTL');

    const totalLtlVol = ltlList.reduce((s, r) => s + (r.volume || 0), 0);
    const totalLtlWeight = ltlList.reduce((s, r) => s + (r.weight || 0), 0);

    const containerTypes: Record<string, number> = {};
    ftlList.forEach((r) => {
      const ct = r.container_type || 'Unknown';
      containerTypes[ct] = (containerTypes[ct] || 0) + 1;
    });

    const statusDist: Record<string, number> = {
      Waiting: 0,
      Station: 0,
      'On the way': 0,
      'On the border': 0,
      Reload: 0,
      Arrived: 0,
    };
    list.forEach((r) => {
      statusDist[r.status] = (statusDist[r.status] || 0) + 1;
    });

    const managerMap: Record<
      string,
      {
        name: string;
        total: number;
        ltl: number;
        ltlVol: number;
        ftl: number;
        grossUsd: number;
        netUsd: number;
      }
    > = {};

    list.forEach((r) => {
      const emp = demoEmployeesDb.get(r.employee_id);
      const name = emp
        ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Employee'
        : 'Unassigned';
      if (!managerMap[name]) {
        managerMap[name] = {
          name,
          total: 0,
          ltl: 0,
          ltlVol: 0,
          ftl: 0,
          grossUsd: 0,
          netUsd: 0,
        };
      }
      managerMap[name].total += 1;
      if (r.cargo_type === 'LTL') {
        managerMap[name].ltl += 1;
        managerMap[name].ltlVol += r.volume || 0;
      } else {
        managerMap[name].ftl += 1;
      }
      const purConv = convertPriceToUsdAndUzs(
        r.purchase_price,
        r.purchase_currency,
        r.purchase_date || '',
        r.purchase_usd_rate || 11886.72,
        r.usd_rmb_rate || 7.235
      );
      const sellConv = convertPriceToUsdAndUzs(
        r.sell_price,
        r.sell_currency,
        r.sell_date || '',
        r.sell_usd_rate || 11886.72,
        r.usd_rmb_rate || 7.235
      );
      managerMap[name].grossUsd += sellConv.amount_usd;
      managerMap[name].netUsd += Math.max(0, sellConv.amount_usd - purConv.amount_usd);
    });

    const statsResult: CargoRegistrationsStatsResponse = {
      summary: {
        total_cargos: list.length,
        gross_sales_revenue: {
          UZS: 120000000,
          USD: 450000,
          RUB: 350000,
          RMB: 80000,
          total_usd_equivalent: 472500.0,
          total_uzs_equivalent: 6071625000.0,
        },
        calculated_net_yield: {
          USD: 75000.0,
          UZS: 963750000.0,
          total_usd: 75000.0,
          total_uzs: 963750000.0,
        },
      },
      ltl_statistics: {
        total_count: ltlList.length,
        total_volume_m3: Math.round(totalLtlVol * 100) / 100,
        total_weight_kg: Math.round(totalLtlWeight * 100) / 100,
        avg_volume_m3:
          ltlList.length > 0 ? Math.round((totalLtlVol / ltlList.length) * 100) / 100 : 0,
        avg_weight_kg:
          ltlList.length > 0 ? Math.round((totalLtlWeight / ltlList.length) * 100) / 100 : 0,
      },
      ftl_statistics: {
        total_count: ftlList.length,
        container_type_distribution: containerTypes,
      },
      status_distribution: statusDist,
      by_manager: Object.values(managerMap).map((m) => ({
        employee_name: m.name,
        total_cargos: m.total,
        ltl_cargos: m.ltl,
        ltl_volume: Math.round(m.ltlVol * 100) / 100,
        ftl_cargos: m.ftl,
        gross_sales_usd: Math.round(m.grossUsd * 100) / 100,
        net_yield_usd: Math.round(m.netUsd * 100) / 100,
      })),
    };

    return { handled: true, result: statsResult };
  }

  return null;
});

// ---------------------------------------------------------------------------
// Cargo Registrations API Client Object
// ---------------------------------------------------------------------------

export const cargoRegistrationsApi = {
  create: (dto: CreateCargoRegistrationDto) =>
    request<CargoRegistrationDetail>('/cargo-registrations', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  list: async (
    params?: CargoRegistrationListParams
  ): Promise<CargoRegistrationPaginatedResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset !== undefined) searchParams.set('offset', String(params.offset));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.cargo_type) searchParams.set('cargo_type', params.cargo_type);
    if (params?.container_type) searchParams.set('container_type', params.container_type);
    if (
      params?.transport_types &&
      (!Array.isArray(params.transport_types) || params.transport_types.length > 0)
    )
      searchParams.set(
        'transport_types',
        Array.isArray(params.transport_types)
          ? params.transport_types.join(',')
          : String(params.transport_types)
      );
    if (params?.client_id) searchParams.set('client_id', params.client_id);
    if (params?.employee_id) searchParams.set('employee_id', params.employee_id);
    if (params?.consolidation_id) searchParams.set('consolidation_id', params.consolidation_id);
    if (params?.has_consolidation !== undefined)
      searchParams.set('has_consolidation', String(params.has_consolidation));
    if (params?.sort_by) searchParams.set('sort_by', params.sort_by);
    if (params?.sort_order) searchParams.set('sort_order', params.sort_order);
    if (params?.order) searchParams.set('order', params.order);

    if (params?.origin_city) searchParams.set('origin_city', params.origin_city);
    if (params?.origin_country_code)
      searchParams.set('origin_country_code', params.origin_country_code);
    if (params?.origin_geoname_id)
      searchParams.set('origin_geoname_id', String(params.origin_geoname_id));
    if (params?.destination_city) searchParams.set('destination_city', params.destination_city);
    if (params?.destination_country_code)
      searchParams.set('destination_country_code', params.destination_country_code);
    if (params?.destination_geoname_id)
      searchParams.set('destination_geoname_id', String(params.destination_geoname_id));

    if (params?.confirmed_start_date)
      searchParams.set('confirmed_start_date', params.confirmed_start_date);
    if (params?.confirmed_end_date)
      searchParams.set('confirmed_end_date', params.confirmed_end_date);
    if (params?.loaded_start_date) searchParams.set('loaded_start_date', params.loaded_start_date);
    if (params?.loaded_end_date) searchParams.set('loaded_end_date', params.loaded_end_date);
    if (params?.arrived_start_date)
      searchParams.set('arrived_start_date', params.arrived_start_date);
    if (params?.arrived_end_date) searchParams.set('arrived_end_date', params.arrived_end_date);
    if (params?.purchase_start_date)
      searchParams.set('purchase_start_date', params.purchase_start_date);
    if (params?.purchase_end_date) searchParams.set('purchase_end_date', params.purchase_end_date);
    if (params?.purchase_date) searchParams.set('purchase_date', params.purchase_date);
    if (params?.sell_start_date) searchParams.set('sell_start_date', params.sell_start_date);
    if (params?.sell_end_date) searchParams.set('sell_end_date', params.sell_end_date);
    if (params?.sell_date) searchParams.set('sell_date', params.sell_date);
    if (params?.created_start_date)
      searchParams.set('created_start_date', params.created_start_date);
    if (params?.created_end_date) searchParams.set('created_end_date', params.created_end_date);
    if (params?.created_at_start) searchParams.set('created_at_start', params.created_at_start);
    if (params?.created_at_end) searchParams.set('created_at_end', params.created_at_end);

    const query = searchParams.toString();
    return request<CargoRegistrationPaginatedResponse>(
      `/cargo-registrations${query ? `?${query}` : ''}`,
      {
        method: 'GET',
      }
    );
  },

  getStats: async (
    params?: CargoRegistrationStatsParams
  ): Promise<CargoRegistrationsStatsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.employee_id) searchParams.set('employee_id', params.employee_id);
    if (params?.client_id) searchParams.set('client_id', params.client_id);
    if (params?.cargo_type) searchParams.set('cargo_type', params.cargo_type);
    if (params?.created_start_date)
      searchParams.set('created_start_date', params.created_start_date);
    if (params?.created_end_date) searchParams.set('created_end_date', params.created_end_date);

    const query = searchParams.toString();
    return request<CargoRegistrationsStatsResponse>(
      `/cargo-registrations/stats${query ? `?${query}` : ''}`,
      {
        method: 'GET',
      }
    );
  },

  get: (id: string) =>
    request<CargoRegistrationDetail>(`/cargo-registrations/${id}`, {
      method: 'GET',
    }),

  update: (id: string, dto: UpdateCargoRegistrationDto) =>
    request<CargoRegistrationDetail>(`/cargo-registrations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  delete: (id: string) =>
    request<{ message: string; id: string }>(`/cargo-registrations/${id}`, {
      method: 'DELETE',
    }),

  checkDuplicate: (dto: DuplicateCheckDto) => locationsApi.checkDuplicateCargo(dto),

  duplicate: async (id: string): Promise<CargoRegistrationDetail> => {
    const source = await cargoRegistrationsApi.get(id);
    const todayStr = new Date().toISOString().split('T')[0];
    let copyTruckId = `${source.container_truck_id}-COPY`;
    if (source.container_truck_id.endsWith('-COPY')) {
      copyTruckId = `${source.container_truck_id}-1`;
    } else {
      const match = source.container_truck_id.match(/-COPY-(\d+)$/);
      if (match) {
        copyTruckId = source.container_truck_id.replace(
          /-COPY-\d+$/,
          `-COPY-${parseInt(match[1], 10) + 1}`
        );
      }
    }
    return await cargoRegistrationsApi.create({
      cargo_type: source.cargo_type,
      volume: source.volume ?? undefined,
      weight: source.weight ?? undefined,
      container_type: source.container_type ?? undefined,
      container_truck_id: copyTruckId,
      agent_name: source.agent_name,
      cargo: source.cargo,
      origin_city: source.origin_city ?? undefined,
      origin_country: source.origin_country ?? undefined,
      origin_country_code: source.origin_country_code ?? undefined,
      origin_geoname_id: source.origin_geoname_id ?? undefined,
      origin_lat: source.origin_lat ?? undefined,
      origin_lng: source.origin_lng ?? undefined,
      destination_city: source.destination_city ?? undefined,
      destination_country: source.destination_country ?? undefined,
      destination_country_code: source.destination_country_code ?? undefined,
      destination_geoname_id: source.destination_geoname_id ?? undefined,
      destination_lat: source.destination_lat ?? undefined,
      destination_lng: source.destination_lng ?? undefined,
      confirmed_date: todayStr,
      loaded_date: undefined,
      arrived_date: undefined,
      purchase_price: source.purchase_price,
      purchase_currency: source.purchase_currency,
      purchase_date: todayStr,
      purchase_exchange_rate: source.purchase_custom_rate ?? undefined,
      purchase_custom_rate: source.purchase_custom_rate ?? undefined,
      sell_price: source.sell_price,
      sell_currency: source.sell_currency,
      sell_date: todayStr,
      sell_exchange_rate: source.sell_custom_rate ?? undefined,
      sell_custom_rate: source.sell_custom_rate ?? undefined,
      usd_rmb_rate: source.usd_rmb_rate ?? undefined,
      status: 'Waiting',
      description: source.description ?? undefined,
      load_code: source.load_code ? `${source.load_code}-COPY` : undefined,
      is_turnkey: source.is_turnkey,
      turnkey_price: source.turnkey_price ?? undefined,
      turnkey_currency: source.turnkey_currency ?? undefined,
      is_speed_up: source.is_speed_up,
      speed_up: source.speed_up ?? undefined,
      speed_up_currency: source.speed_up_currency ?? undefined,
      additional_expense: source.additional_expense ?? undefined,
      additional_expense_currency: source.additional_expense_currency ?? undefined,
      client_id: source.client_id,
      employee_id: source.employee_id,
    });
  },
};
