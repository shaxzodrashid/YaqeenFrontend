import { request, registerDemoHandler } from './httpClient';
import type { CargoType, CurrencyType } from './cargoRegistrations.service';
import {
  cargoRegistrationsApi,
  convertPriceToUsdAndUzs,
  INITIAL_DEMO_RECORDS,
} from './cargoRegistrations.service';
import { demoClientsDb } from './clients.service';
import { demoEmployeesDb } from './employees.service';
import type { LocationDetail, RouteInfo } from '../types/locations';
import { locationsApi } from './locations.service';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export const CONSOLIDATION_STATUSES = [
  'Planning',
  'Loading',
  'On the way',
  'Station',
  'On the border',
  'Reload',
  'Arrived',
  'Completed',
] as const;

export type ConsolidationStatus = (typeof CONSOLIDATION_STATUSES)[number];

export const CONSOLIDATION_CONTAINER_TYPES = [
  '86m3',
  '96m3',
  '105m3',
  '110m3',
  '120m3',
  '130m3',
  '145m3',
  '40HQ',
  '45HQ',
  '40GP',
  '20GP',
  'Ref Fura',
  'Tent',
  'Avto',
] as const;

export type ConsolidationContainerType = (typeof CONSOLIDATION_CONTAINER_TYPES)[number] | string;

export interface ConsolidationCapacity {
  max_volume_m3: number;
  assigned_volume_m3: number;
  remaining_volume_m3: number;
  volume_utilization_percent: number;
  max_weight_kg: number;
  assigned_weight_kg: number;
  remaining_weight_kg: number;
  weight_utilization_percent: number;
  total_cargos_count: number;
}

export interface ConsolidationFinancials {
  total_purchase_cost_usd: number;
  total_sell_revenue_usd: number;
  gross_margin_usd: number;
  total_carrier_cost_usd: number;
  net_margin_usd: number;
  margin_percent: number;
  consolidated_net_margin_usd: number;
  total_sell_usd: number;
  total_purchase_usd: number;
  carrier_cost: {
    amount_usd: number;
    currency: CurrencyType;
  };
}

export interface ConsolidationCargoItem {
  id: string;
  container_truck_id: string;
  cargo: string;
  cargo_type?: CargoType;
  volume?: number | null;
  weight?: number | null;
  container_type?: string | null;
  agent_name?: string | null;
  client_id?: string;
  client_name?: string;
  client?: {
    id: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
  } | null;
  employee_id?: string;
  employee_name?: string;
  employee?: {
    id: string;
    name?: string;
    first_name?: string;
    last_name?: string;
  } | null;
  purchase_price: {
    amount: number;
    currency: CurrencyType;
    amount_usd: number;
  };
  sell_price: {
    amount: number;
    currency: CurrencyType;
    amount_usd: number;
  };
  net_yield_usd: number;
  status: string;
  loaded_date?: string | null;
  arrived_date?: string | null;
  confirmed_date?: string | null;
  purchase_date?: string | null;
  sell_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ConsolidationListItem {
  id: string;
  consolidation_code: string;
  container_truck_id: string;
  container_type?: string | null;
  status: ConsolidationStatus;
  carrier_name?: string | null;
  carrier_phone?: string | null;
  origin_place?: string | null;
  origin_country?: string | null;
  origin_country_code?: string | null;
  origin_geoname_id?: number | null;
  origin_lat?: number | null;
  origin_lng?: number | null;
  destination_place?: string | null;
  destination_country?: string | null;
  destination_country_code?: string | null;
  destination_geoname_id?: number | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  origin?: LocationDetail | null;
  destination?: LocationDetail | null;
  route?: RouteInfo | null;
  loaded_date?: string | null;
  departure_date?: string | null;
  estimated_arrival_date?: string | null;
  arrived_date?: string | null;
  total_carrier_cost: number;
  carrier_cost_currency: CurrencyType;
  carrier_cost_usd_rate?: number | null;
  capacity: ConsolidationCapacity;
  financials: ConsolidationFinancials;
  description?: string | null;
  cargos: ConsolidationCargoItem[];
  created_at: string;
  updated_at: string;
}

export interface ConsolidationActiveDropdownItem {
  id: string;
  consolidation_code: string;
  container_truck_id: string;
  container_type?: string | null;
  status: ConsolidationStatus;
  carrier_name?: string | null;
  origin_place?: string | null;
  origin_country_code?: string | null;
  destination_place?: string | null;
  destination_country_code?: string | null;
  departure_date?: string | null;
  total_cargos_count: number;
  max_volume_capacity: number;
  assigned_volume: number;
  remaining_volume: number;
  volume_utilization_percent: number;
  max_weight_capacity: number;
  assigned_weight: number;
  remaining_weight: number;
  label: string;
}

export interface CreateConsolidationDto {
  consolidation_code?: string;
  container_truck_id: string;
  container_type?: string;
  max_volume_capacity?: number;
  max_weight_capacity?: number;
  carrier_name?: string;
  carrier_phone?: string;
  origin_place?: string;
  origin_country?: string;
  origin_country_code?: string;
  origin_geoname_id?: number | null;
  origin_lat?: number | null;
  origin_lng?: number | null;
  destination_place?: string;
  destination_country?: string;
  destination_country_code?: string;
  destination_geoname_id?: number | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  loaded_date?: string;
  departure_date?: string;
  estimated_arrival_date?: string;
  arrived_date?: string;
  total_carrier_cost?: number;
  carrier_cost_currency?: CurrencyType;
  carrier_cost_usd_rate?: number;
  status?: ConsolidationStatus;
  description?: string;
  cargo_registration_ids?: string[];
}

export interface UpdateConsolidationDto extends Partial<CreateConsolidationDto> {
  sync_status_to_cargos?: boolean;
  sync_dates_to_cargos?: boolean;
}

export interface ConsolidationListParams {
  page?: number;
  limit?: number;
  offset?: number;
  status?: ConsolidationStatus | string;
  search?: string;
  origin_place?: string;
  destination_place?: string;
  carrier_name?: string;
  departure_start_date?: string;
  departure_end_date?: string;
  arrived_start_date?: string;
  arrived_end_date?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC' | 'asc' | 'desc';
  order?: 'ASC' | 'DESC' | 'asc' | 'desc';
}

export interface ConsolidationMeta {
  total: number;
  page: number;
  limit: number;
  offset: number;
  total_pages: number;
  active_count?: number;
  total_capacity_volume_m3?: number;
  total_assigned_volume_m3?: number;
  total_net_margin_usd?: number;
}

export interface ConsolidationPaginatedResponse {
  meta: ConsolidationMeta;
  data: ConsolidationListItem[];
}

// ---------------------------------------------------------------------------
// Internal Demo Mock Records & Local Storage Engine
// ---------------------------------------------------------------------------

interface InternalConsolidationRecord {
  id: string;
  consolidation_code: string;
  container_truck_id: string;
  container_type: string | null;
  max_volume_capacity: number;
  max_weight_capacity: number;
  carrier_name: string | null;
  carrier_phone: string | null;
  origin_place: string | null;
  origin_country: string | null;
  origin_country_code: string | null;
  origin_geoname_id: number | null;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_place: string | null;
  destination_country: string | null;
  destination_country_code: string | null;
  destination_geoname_id: number | null;
  destination_lat: number | null;
  destination_lng: number | null;
  loaded_date: string | null;
  departure_date: string | null;
  estimated_arrival_date: string | null;
  arrived_date: string | null;
  total_carrier_cost: number;
  carrier_cost_currency: CurrencyType;
  carrier_cost_usd_rate: number | null;
  status: ConsolidationStatus;
  description: string | null;
  cargo_registration_ids: string[];
  created_at: string;
  updated_at: string;
}

const INITIAL_DEMO_CONSOLIDATIONS: InternalConsolidationRecord[] = [
  {
    id: 'cns-demo-001',
    consolidation_code: 'CNS-202608-0001',
    container_truck_id: '01A777AA',
    container_type: '86m3',
    max_volume_capacity: 86.0,
    max_weight_capacity: 22000.0,
    carrier_name: 'Baytur Express Lojistik',
    carrier_phone: '+90 532 111 2233',
    origin_place: 'Istanbul',
    origin_country: 'Turkey',
    origin_country_code: 'TR',
    origin_geoname_id: 745044,
    origin_lat: 41.01384,
    origin_lng: 28.94966,
    destination_place: 'Tashkent',
    destination_country: 'Uzbekistan',
    destination_country_code: 'UZ',
    destination_geoname_id: 1512569,
    destination_lat: 41.26465,
    destination_lng: 69.21627,
    loaded_date: '2026-08-18',
    departure_date: '2026-08-20',
    estimated_arrival_date: '2026-08-29',
    arrived_date: null,
    total_carrier_cost: 3800,
    carrier_cost_currency: 'USD',
    carrier_cost_usd_rate: 1,
    status: 'On the way',
    description: 'Chemicals, spare parts & fabrics consolidated batch',
    cargo_registration_ids: [
      'e4f1a239-20c1-4d33-91ab-b19c670f5e12',
      'd4e5f6a7-8b9c-0d1e-2f3a-4b5c6d7e8f9a',
    ],
    created_at: '2026-08-16T09:00:00.000Z',
    updated_at: '2026-08-20T11:30:00.000Z',
  },
  {
    id: 'cns-demo-002',
    consolidation_code: 'CNS-202608-0002',
    container_truck_id: '01B888BB',
    container_type: '120m3',
    max_volume_capacity: 120.0,
    max_weight_capacity: 25000.0,
    carrier_name: 'Silk Road Trans Cargo',
    carrier_phone: '+86 138 0013 8000',
    origin_place: 'Yiwu',
    origin_country: 'China',
    origin_country_code: 'CN',
    origin_geoname_id: 1787687,
    origin_lat: 29.31506,
    origin_lng: 120.07676,
    destination_place: 'Tashkent',
    destination_country: 'Uzbekistan',
    destination_country_code: 'UZ',
    destination_geoname_id: 1512569,
    destination_lat: 41.26465,
    destination_lng: 69.21627,
    loaded_date: null,
    departure_date: '2026-08-26',
    estimated_arrival_date: '2026-09-05',
    arrived_date: null,
    total_carrier_cost: 5200,
    carrier_cost_currency: 'USD',
    carrier_cost_usd_rate: 1,
    status: 'Loading',
    description: 'Consumer goods and electronic components',
    cargo_registration_ids: [],
    created_at: '2026-08-19T14:20:00.000Z',
    updated_at: '2026-08-21T08:00:00.000Z',
  },
  {
    id: 'cns-demo-003',
    consolidation_code: 'CNS-202608-0003',
    container_truck_id: 'TRK-9021',
    container_type: '40HQ',
    max_volume_capacity: 76.0,
    max_weight_capacity: 26000.0,
    carrier_name: 'Eurasia Overland',
    carrier_phone: '+998 90 987 6543',
    origin_place: 'Beijing',
    origin_country: 'China',
    origin_country_code: 'CN',
    origin_geoname_id: 1816670,
    origin_lat: 39.9075,
    origin_lng: 116.39723,
    destination_place: 'Samarkand',
    destination_country: 'Uzbekistan',
    destination_country_code: 'UZ',
    destination_geoname_id: 1216265,
    destination_lat: 39.65417,
    destination_lng: 66.95972,
    loaded_date: '2026-08-10',
    departure_date: '2026-08-12',
    estimated_arrival_date: '2026-08-22',
    arrived_date: null,
    total_carrier_cost: 4100,
    carrier_cost_currency: 'USD',
    carrier_cost_usd_rate: 1,
    status: 'On the border',
    description: 'Industrial equipment and hardware',
    cargo_registration_ids: [],
    created_at: '2026-08-08T10:00:00.000Z',
    updated_at: '2026-08-18T16:00:00.000Z',
  },
  {
    id: 'cns-demo-004',
    consolidation_code: 'CNS-202607-0012',
    container_truck_id: '01C999CC',
    container_type: '96m3',
    max_volume_capacity: 96.0,
    max_weight_capacity: 21000.0,
    carrier_name: 'Albatros Trans Asia',
    carrier_phone: '+998 91 123 4567',
    origin_place: 'Guangzhou',
    origin_country: 'China',
    origin_country_code: 'CN',
    origin_geoname_id: 1809858,
    origin_lat: 23.12744,
    origin_lng: 113.25052,
    destination_place: 'Tashkent',
    destination_country: 'Uzbekistan',
    destination_country_code: 'UZ',
    destination_geoname_id: 1512569,
    destination_lat: 41.26465,
    destination_lng: 69.21627,
    loaded_date: '2026-07-20',
    departure_date: '2026-07-22',
    estimated_arrival_date: '2026-08-01',
    arrived_date: '2026-08-02',
    total_carrier_cost: 4600,
    carrier_cost_currency: 'USD',
    carrier_cost_usd_rate: 1,
    status: 'Completed',
    description: 'Textiles and ready garment batch - delivered and closed',
    cargo_registration_ids: [],
    created_at: '2026-07-18T08:00:00.000Z',
    updated_at: '2026-08-03T10:00:00.000Z',
  },
];

function getStoredConsolidations(): InternalConsolidationRecord[] {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('yaqeen_cargo_consolidations_db');
      if (raw) return JSON.parse(raw);
    }
  } catch {
    // Ignore storage error
  }
  return [...INITIAL_DEMO_CONSOLIDATIONS];
}

function saveStoredConsolidations(records: InternalConsolidationRecord[]) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('yaqeen_cargo_consolidations_db', JSON.stringify(records));
    }
  } catch {
    // Ignore storage error
  }
}

let demoConsolidations = getStoredConsolidations();

// Helper to retrieve live cargo registrations from localStorage or memory
function getLiveCargoRegistrations(): any[] {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('yaqeen_cargo_registrations_db');
      if (raw) return JSON.parse(raw);
    }
  } catch {
    // Ignore
  }
  return [...INITIAL_DEMO_RECORDS];
}

function saveLiveCargoRegistrations(records: any[]) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('yaqeen_cargo_registrations_db', JSON.stringify(records));
    }
  } catch {
    // Ignore
  }
}

// Convert internal record to full response object with capacity and financials
function buildConsolidationResponse(record: InternalConsolidationRecord): ConsolidationListItem {
  const allCargos = getLiveCargoRegistrations();
  const assignedCargoRecords = allCargos.filter((c) =>
    record.cargo_registration_ids.includes(c.id)
  );

  let assignedVol = 0;
  let assignedWeight = 0;
  let totalSellUsd = 0;
  let totalPurchaseUsd = 0;

  const cargosList: ConsolidationCargoItem[] = assignedCargoRecords.map((c) => {
    const vol = Number(c.volume) || 0;
    const wt = Number(c.weight) || 0;
    assignedVol += vol;
    assignedWeight += wt;

    const purConv = convertPriceToUsdAndUzs(
      c.purchase_price,
      c.purchase_currency,
      c.purchase_date,
      c.purchase_custom_rate || c.purchase_usd_rate,
      c.usd_rmb_rate
    );
    const sellConv = convertPriceToUsdAndUzs(
      c.sell_price,
      c.sell_currency,
      c.sell_date,
      c.sell_custom_rate || c.sell_usd_rate,
      c.usd_rmb_rate
    );

    totalSellUsd += sellConv.amount_usd;
    totalPurchaseUsd += purConv.amount_usd;

    const netYield = Math.max(0, sellConv.amount_usd - purConv.amount_usd);

    const client = demoClientsDb.find((cl) => cl.id === c.client_id);
    const emp = demoEmployeesDb.get(c.employee_id);

    return {
      id: c.id,
      cargo_type: c.cargo_type || 'LTL',
      cargo: c.cargo || 'General Cargo',
      volume: c.volume,
      weight: c.weight,
      container_type: c.container_type,
      container_truck_id: c.container_truck_id || record.container_truck_id,
      agent_name: c.agent_name,
      client: client
        ? {
            id: client.id,
            name: `${client.first_name} ${client.last_name}`.trim(),
            first_name: client.first_name,
            last_name: client.last_name,
            company_name: client.company_name,
          }
        : null,
      employee: emp
        ? {
            id: emp.id,
            name: `${emp.first_name} ${emp.last_name}`.trim(),
            first_name: emp.first_name,
            last_name: emp.last_name,
          }
        : null,
      purchase_price: {
        amount: c.purchase_price,
        currency: c.purchase_currency,
        amount_usd: purConv.amount_usd,
      },
      sell_price: {
        amount: c.sell_price,
        currency: c.sell_currency,
        amount_usd: sellConv.amount_usd,
      },
      net_yield_usd: netYield,
      status: c.status,
      loaded_date: c.loaded_date,
      arrived_date: c.arrived_date,
      confirmed_date: c.confirmed_date,
      purchase_date: c.purchase_date,
      sell_date: c.sell_date,
      created_at: c.created_at,
      updated_at: c.updated_at,
    };
  });

  const maxVol = record.max_volume_capacity || 86.0;
  const maxWt = record.max_weight_capacity || 22000.0;
  const remainingVol = Math.max(0, maxVol - assignedVol);
  const remainingWt = Math.max(0, maxWt - assignedWeight);
  const volUtilPct = maxVol > 0 ? (assignedVol / maxVol) * 100 : 0;
  const wtUtilPct = maxWt > 0 ? (assignedWeight / maxWt) * 100 : 0;

  const carrierCostConv = convertPriceToUsdAndUzs(
    record.total_carrier_cost,
    record.carrier_cost_currency || 'USD',
    record.departure_date,
    record.carrier_cost_usd_rate
  );

  const netMarginUsd = totalSellUsd - totalPurchaseUsd - carrierCostConv.amount_usd;

  const origDetail: LocationDetail | null = record.origin_place
    ? {
        city: record.origin_place,
        country: record.origin_country,
        country_code: record.origin_country_code,
        geoname_id: record.origin_geoname_id,
        latitude: record.origin_lat,
        longitude: record.origin_lng,
        display_name: record.origin_country_code
          ? `${record.origin_place} (${record.origin_country_code})`
          : record.origin_place,
        google_maps_url: locationsApi.buildPointUrl(
          record.origin_lat,
          record.origin_lng,
          record.origin_place
        ),
      }
    : null;

  const destDetail: LocationDetail | null = record.destination_place
    ? {
        city: record.destination_place,
        country: record.destination_country,
        country_code: record.destination_country_code,
        geoname_id: record.destination_geoname_id,
        latitude: record.destination_lat,
        longitude: record.destination_lng,
        display_name: record.destination_country_code
          ? `${record.destination_place} (${record.destination_country_code})`
          : record.destination_place,
        google_maps_url: locationsApi.buildPointUrl(
          record.destination_lat,
          record.destination_lng,
          record.destination_place
        ),
      }
    : null;

  const routeInfo: RouteInfo | null =
    record.origin_place && record.destination_place
      ? {
          origin: record.origin_place,
          destination: record.destination_place,
          origin_display: record.origin_country
            ? `${record.origin_place}, ${record.origin_country}`
            : record.origin_place,
          destination_display: record.destination_country
            ? `${record.destination_place}, ${record.destination_country}`
            : record.destination_place,
          google_maps_dir_url: locationsApi.buildRouteUrl(
            record.origin_lat,
            record.origin_lng,
            record.destination_lat,
            record.destination_lng,
            record.origin_place,
            record.destination_place
          ),
        }
      : null;

  return {
    id: record.id,
    consolidation_code: record.consolidation_code,
    container_truck_id: record.container_truck_id,
    container_type: record.container_type,
    status: record.status,
    carrier_name: record.carrier_name,
    carrier_phone: record.carrier_phone,
    origin_place: record.origin_place,
    origin_country: record.origin_country,
    origin_country_code: record.origin_country_code,
    origin_geoname_id: record.origin_geoname_id,
    origin_lat: record.origin_lat,
    origin_lng: record.origin_lng,
    destination_place: record.destination_place,
    destination_country: record.destination_country,
    destination_country_code: record.destination_country_code,
    destination_geoname_id: record.destination_geoname_id,
    destination_lat: record.destination_lat,
    destination_lng: record.destination_lng,
    origin: origDetail,
    destination: destDetail,
    route: routeInfo,
    loaded_date: record.loaded_date,
    departure_date: record.departure_date,
    estimated_arrival_date: record.estimated_arrival_date,
    arrived_date: record.arrived_date,
    total_carrier_cost: record.total_carrier_cost,
    carrier_cost_currency: record.carrier_cost_currency,
    carrier_cost_usd_rate: record.carrier_cost_usd_rate,
    capacity: {
      max_volume_m3: Math.round(maxVol * 100) / 100,
      assigned_volume_m3: Math.round(assignedVol * 100) / 100,
      remaining_volume_m3: Math.round(remainingVol * 100) / 100,
      volume_utilization_percent: Math.round(volUtilPct * 100) / 100,
      max_weight_kg: Math.round(maxWt * 100) / 100,
      assigned_weight_kg: Math.round(assignedWeight * 100) / 100,
      remaining_weight_kg: Math.round(remainingWt * 100) / 100,
      weight_utilization_percent: Math.round(wtUtilPct * 100) / 100,
      total_cargos_count: cargosList.length,
    },
    financials: {
      total_purchase_cost_usd: Math.round(totalPurchaseUsd * 100) / 100,
      total_sell_revenue_usd: Math.round(totalSellUsd * 100) / 100,
      gross_margin_usd: Math.round((totalSellUsd - totalPurchaseUsd) * 100) / 100,
      total_carrier_cost_usd: Math.round(carrierCostConv.amount_usd * 100) / 100,
      net_margin_usd: Math.round(netMarginUsd * 100) / 100,
      margin_percent:
        totalSellUsd > 0 ? Math.round((netMarginUsd / totalSellUsd) * 10000) / 100 : 0,
      consolidated_net_margin_usd: Math.round(netMarginUsd * 100) / 100,
      total_sell_usd: Math.round(totalSellUsd * 100) / 100,
      total_purchase_usd: Math.round(totalPurchaseUsd * 100) / 100,
      carrier_cost: {
        amount_usd: Math.round(carrierCostConv.amount_usd * 100) / 100,
        currency: record.carrier_cost_currency || 'USD',
      },
    },
    description: record.description,
    cargos: cargosList,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Offline Demo Mock Handlers Registration
// ---------------------------------------------------------------------------

registerDemoHandler((path: string, options: RequestInit, body: any) => {
  const method = (options.method || 'GET').toUpperCase();
  const startsWith = (prefix: string) => path.startsWith(prefix);

  if (!startsWith('/consolidations') && !startsWith('/cargo-consolidations')) return null;

  const urlObj = new URL(path, 'http://localhost');
  const pathname = urlObj.pathname.replace(/^\/cargo-consolidations/, '/consolidations');

  // 1. GET /consolidations/active (Active Search-or-Create Dropdown)
  if (pathname === '/consolidations/active' && method === 'GET') {
    const search = (urlObj.searchParams.get('search') || '').toLowerCase().trim();
    const activeRecords = demoConsolidations.filter((c) => c.status !== 'Completed');

    let filtered = activeRecords;
    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.container_truck_id.toLowerCase().includes(search) ||
          c.consolidation_code.toLowerCase().includes(search) ||
          (c.carrier_name || '').toLowerCase().includes(search) ||
          (c.origin_place || '').toLowerCase().includes(search) ||
          (c.destination_place || '').toLowerCase().includes(search)
      );
    }

    const dropdownList: ConsolidationActiveDropdownItem[] = filtered.map((rec) => {
      const full = buildConsolidationResponse(rec);
      const cap = full.capacity;
      const routeStr =
        rec.origin_place && rec.destination_place
          ? ` (${rec.origin_place} -> ${rec.destination_place})`
          : '';
      const label = `${rec.container_truck_id} [${rec.consolidation_code}] - ${cap.assigned_volume_m3}/${cap.max_volume_m3} m³${routeStr} • ${rec.status}`;

      return {
        id: rec.id,
        consolidation_code: rec.consolidation_code,
        container_truck_id: rec.container_truck_id,
        container_type: rec.container_type,
        status: rec.status,
        carrier_name: rec.carrier_name,
        origin_place: rec.origin_place,
        destination_place: rec.destination_place,
        departure_date: rec.departure_date,
        total_cargos_count: cap.total_cargos_count,
        max_volume_capacity: cap.max_volume_m3,
        assigned_volume: cap.assigned_volume_m3,
        remaining_volume: cap.remaining_volume_m3,
        volume_utilization_percent: cap.volume_utilization_percent,
        max_weight_capacity: cap.max_weight_kg,
        assigned_weight: cap.assigned_weight_kg,
        remaining_weight: cap.remaining_weight_kg,
        label,
      };
    });

    return { handled: true, result: dropdownList };
  }

  // 2. POST /consolidations/:id/assign-cargos
  const assignMatch = pathname.match(/^\/consolidations\/([^/]+)\/assign-cargos$/);
  if (assignMatch && method === 'POST') {
    const id = assignMatch[1];
    const recIndex = demoConsolidations.findIndex(
      (c) => c.id === id || c.consolidation_code === id
    );
    if (recIndex === -1) {
      throw new Error(`Consolidation not found: ${id}`);
    }

    const cargoIds: string[] = body?.cargo_registration_ids || [];
    const currentRec = demoConsolidations[recIndex];
    const set = new Set([...currentRec.cargo_registration_ids, ...cargoIds]);
    currentRec.cargo_registration_ids = Array.from(set);
    currentRec.updated_at = new Date().toISOString();
    demoConsolidations[recIndex] = currentRec;
    saveStoredConsolidations(demoConsolidations);

    // Sync child cargo records
    const allCargos = getLiveCargoRegistrations();
    let updatedCargos = false;
    allCargos.forEach((c) => {
      if (cargoIds.includes(c.id)) {
        c.consolidation_id = currentRec.id;
        c.container_truck_id = currentRec.container_truck_id;
        if (currentRec.container_type) c.container_type = currentRec.container_type;
        updatedCargos = true;
      }
    });
    if (updatedCargos) saveLiveCargoRegistrations(allCargos);

    const full = buildConsolidationResponse(currentRec);
    return {
      handled: true,
      result: {
        message: 'Cargos assigned successfully',
        count: cargoIds.length,
        consolidation: full,
      },
    };
  }

  // 3. POST /consolidations/:id/remove-cargos
  const removeMatch = pathname.match(/^\/consolidations\/([^/]+)\/remove-cargos$/);
  if (removeMatch && method === 'POST') {
    const id = removeMatch[1];
    const recIndex = demoConsolidations.findIndex(
      (c) => c.id === id || c.consolidation_code === id
    );
    if (recIndex === -1) {
      throw new Error(`Consolidation not found: ${id}`);
    }

    const cargoIds: string[] = body?.cargo_registration_ids || [];
    const currentRec = demoConsolidations[recIndex];
    currentRec.cargo_registration_ids = currentRec.cargo_registration_ids.filter(
      (cId) => !cargoIds.includes(cId)
    );
    currentRec.updated_at = new Date().toISOString();
    demoConsolidations[recIndex] = currentRec;
    saveStoredConsolidations(demoConsolidations);

    // Unlink child cargo records
    const allCargos = getLiveCargoRegistrations();
    let updatedCargos = false;
    allCargos.forEach((c) => {
      if (cargoIds.includes(c.id)) {
        c.consolidation_id = null;
        updatedCargos = true;
      }
    });
    if (updatedCargos) saveLiveCargoRegistrations(allCargos);

    const full = buildConsolidationResponse(currentRec);
    return {
      handled: true,
      result: {
        message: 'Cargos removed successfully',
        count: cargoIds.length,
        consolidation: full,
      },
    };
  }

  // 4. GET /consolidations/:id
  const singleMatch = pathname.match(/^\/consolidations\/([^/]+)$/);
  if (singleMatch && method === 'GET') {
    const id = singleMatch[1];
    const rec = demoConsolidations.find((c) => c.id === id || c.consolidation_code === id);
    if (!rec) {
      throw new Error(`Consolidation not found: ${id}`);
    }
    return { handled: true, result: buildConsolidationResponse(rec) };
  }

  // 5. PATCH /consolidations/:id
  if (singleMatch && method === 'PATCH') {
    const id = singleMatch[1];
    const recIndex = demoConsolidations.findIndex(
      (c) => c.id === id || c.consolidation_code === id
    );
    if (recIndex === -1) {
      throw new Error(`Consolidation not found: ${id}`);
    }

    const currentRec = demoConsolidations[recIndex];
    const updated: InternalConsolidationRecord = {
      ...currentRec,
      ...body,
      updated_at: new Date().toISOString(),
    };

    demoConsolidations[recIndex] = updated;
    saveStoredConsolidations(demoConsolidations);

    // Cascade sync status and dates to attached cargos if requested
    if (body?.sync_status_to_cargos || body?.sync_dates_to_cargos) {
      const allCargos = getLiveCargoRegistrations();
      let changed = false;
      allCargos.forEach((c) => {
        if (updated.cargo_registration_ids.includes(c.id)) {
          if (body.sync_status_to_cargos && body.status) {
            c.status = body.status;
            changed = true;
          }
          if (body.sync_dates_to_cargos) {
            if (body.loaded_date !== undefined) c.loaded_date = body.loaded_date;
            if (body.arrived_date !== undefined) c.arrived_date = body.arrived_date;
            changed = true;
          }
        }
      });
      if (changed) saveLiveCargoRegistrations(allCargos);
    }

    return { handled: true, result: buildConsolidationResponse(updated) };
  }

  // 6. DELETE /consolidations/:id
  if (singleMatch && method === 'DELETE') {
    const id = singleMatch[1];
    const target = demoConsolidations.find((c) => c.id === id || c.consolidation_code === id);
    if (!target) {
      throw new Error(`Consolidation not found: ${id}`);
    }

    // Reset attached cargos
    const allCargos = getLiveCargoRegistrations();
    let changed = false;
    allCargos.forEach((c) => {
      if (target.cargo_registration_ids.includes(c.id)) {
        c.consolidation_id = null;
        changed = true;
      }
    });
    if (changed) saveLiveCargoRegistrations(allCargos);

    demoConsolidations = demoConsolidations.filter((c) => c.id !== target.id);
    saveStoredConsolidations(demoConsolidations);

    return {
      handled: true,
      result: { message: 'Consolidation deleted successfully', id: target.id },
    };
  }

  // 7. POST /consolidations (Create)
  if (pathname === '/consolidations' && method === 'POST') {
    const todayStr = new Date().toISOString().slice(0, 10);
    const count = demoConsolidations.length + 1;
    const autoCode =
      body?.consolidation_code ||
      `CNS-${todayStr.slice(0, 7).replace('-', '')}-${String(count).padStart(4, '0')}`;

    const newRecord: InternalConsolidationRecord = {
      id: `cns-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      consolidation_code: autoCode,
      container_truck_id: body.container_truck_id,
      container_type: body.container_type || '86m3',
      max_volume_capacity: Number(body.max_volume_capacity) || 86.0,
      max_weight_capacity: Number(body.max_weight_capacity) || 22000.0,
      carrier_name: body.carrier_name || null,
      carrier_phone: body.carrier_phone || null,
      origin_place: body.origin_place || null,
      origin_country: body.origin_country || null,
      origin_country_code: body.origin_country_code || null,
      origin_geoname_id: body.origin_geoname_id !== undefined ? body.origin_geoname_id : null,
      origin_lat: body.origin_lat !== undefined ? body.origin_lat : null,
      origin_lng: body.origin_lng !== undefined ? body.origin_lng : null,
      destination_place: body.destination_place || null,
      destination_country: body.destination_country || null,
      destination_country_code: body.destination_country_code || null,
      destination_geoname_id:
        body.destination_geoname_id !== undefined ? body.destination_geoname_id : null,
      destination_lat: body.destination_lat !== undefined ? body.destination_lat : null,
      destination_lng: body.destination_lng !== undefined ? body.destination_lng : null,
      loaded_date: body.loaded_date || null,
      departure_date: body.departure_date || null,
      estimated_arrival_date: body.estimated_arrival_date || null,
      arrived_date: body.arrived_date || null,
      total_carrier_cost: Number(body.total_carrier_cost) || 0,
      carrier_cost_currency: body.carrier_cost_currency || 'USD',
      carrier_cost_usd_rate: body.carrier_cost_usd_rate || 1,
      status: body.status || 'Planning',
      description: body.description || null,
      cargo_registration_ids: body.cargo_registration_ids || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    demoConsolidations.unshift(newRecord);
    saveStoredConsolidations(demoConsolidations);

    // If initial cargos attached, sync them
    if (newRecord.cargo_registration_ids.length > 0) {
      const allCargos = getLiveCargoRegistrations();
      let changed = false;
      allCargos.forEach((c) => {
        if (newRecord.cargo_registration_ids.includes(c.id)) {
          c.consolidation_id = newRecord.id;
          c.container_truck_id = newRecord.container_truck_id;
          if (newRecord.container_type) c.container_type = newRecord.container_type;
          changed = true;
        }
      });
      if (changed) saveLiveCargoRegistrations(allCargos);
    }

    return { handled: true, result: buildConsolidationResponse(newRecord) };
  }

  // 8. GET /consolidations (Paginated List)
  if (pathname === '/consolidations' && method === 'GET') {
    const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
    const limit = parseInt(urlObj.searchParams.get('limit') || '10', 10);
    const offsetParam = urlObj.searchParams.get('offset');
    const offset = offsetParam !== null ? parseInt(offsetParam, 10) : (page - 1) * limit;

    const search = (urlObj.searchParams.get('search') || '').toLowerCase().trim();
    const status = urlObj.searchParams.get('status');
    const origin = (urlObj.searchParams.get('origin_place') || '').toLowerCase().trim();
    const destination = (urlObj.searchParams.get('destination_place') || '').toLowerCase().trim();
    const carrier = (urlObj.searchParams.get('carrier_name') || '').toLowerCase().trim();

    const depStart = urlObj.searchParams.get('departure_start_date');
    const depEnd = urlObj.searchParams.get('departure_end_date');
    const arrStart = urlObj.searchParams.get('arrived_start_date');
    const arrEnd = urlObj.searchParams.get('arrived_end_date');

    let filtered = [...demoConsolidations];

    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.container_truck_id.toLowerCase().includes(search) ||
          c.consolidation_code.toLowerCase().includes(search) ||
          (c.carrier_name || '').toLowerCase().includes(search) ||
          (c.origin_place || '').toLowerCase().includes(search) ||
          (c.destination_place || '').toLowerCase().includes(search) ||
          (c.description || '').toLowerCase().includes(search)
      );
    }

    if (status && status !== 'all') {
      filtered = filtered.filter((c) => c.status.toLowerCase() === status.toLowerCase());
    }
    if (origin) {
      filtered = filtered.filter((c) => (c.origin_place || '').toLowerCase().includes(origin));
    }
    if (destination) {
      filtered = filtered.filter((c) =>
        (c.destination_place || '').toLowerCase().includes(destination)
      );
    }
    if (carrier) {
      filtered = filtered.filter((c) => (c.carrier_name || '').toLowerCase().includes(carrier));
    }

    const cleanDate = (d?: string | null) => (d ? d.slice(0, 10) : '');

    if (depStart) {
      filtered = filtered.filter((c) => cleanDate(c.departure_date) >= depStart);
    }
    if (depEnd) {
      filtered = filtered.filter((c) => {
        const cd = cleanDate(c.departure_date);
        return cd !== '' && cd <= depEnd;
      });
    }
    if (arrStart) {
      filtered = filtered.filter((c) => cleanDate(c.arrived_date) >= arrStart);
    }
    if (arrEnd) {
      filtered = filtered.filter((c) => {
        const cd = cleanDate(c.arrived_date);
        return cd !== '' && cd <= arrEnd;
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
      let comp = 0;
      switch (sortBy) {
        case 'consolidation_code':
          comp = a.consolidation_code.localeCompare(b.consolidation_code);
          break;
        case 'container_truck_id':
          comp = a.container_truck_id.localeCompare(b.container_truck_id);
          break;
        case 'status':
          comp = a.status.localeCompare(b.status);
          break;
        case 'departure_date':
          comp = (a.departure_date || '').localeCompare(b.departure_date || '');
          break;
        case 'carrier_name':
          comp = (a.carrier_name || '').localeCompare(b.carrier_name || '');
          break;
        case 'total_carrier_cost':
          comp = (Number(a.total_carrier_cost) || 0) - (Number(b.total_carrier_cost) || 0);
          break;
        case 'created_at':
        default:
          comp = (a.created_at || '').localeCompare(b.created_at || '');
          break;
      }
      return isAsc ? comp : -comp;
    });

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);
    const dataList = paginated.map(buildConsolidationResponse);

    // Compute meta metrics for the banner
    let totalCapVol = 0;
    let totalAssignedVol = 0;
    let totalMargin = 0;
    let activeCount = 0;

    demoConsolidations.forEach((rec) => {
      const full = buildConsolidationResponse(rec);
      totalCapVol += full.capacity.max_volume_m3;
      totalAssignedVol += full.capacity.assigned_volume_m3;
      totalMargin += full.financials.consolidated_net_margin_usd;
      if (rec.status !== 'Completed') activeCount++;
    });

    const meta: ConsolidationMeta = {
      total,
      page,
      limit,
      offset,
      total_pages: Math.ceil(total / limit) || 1,
      active_count: activeCount,
      total_capacity_volume_m3: Math.round(totalCapVol * 100) / 100,
      total_assigned_volume_m3: Math.round(totalAssignedVol * 100) / 100,
      total_net_margin_usd: Math.round(totalMargin * 100) / 100,
    };

    return {
      handled: true,
      result: {
        meta,
        data: dataList,
      },
    };
  }

  return null;
});

// ---------------------------------------------------------------------------
// Cargo Consolidations API Client Object
// ---------------------------------------------------------------------------

export const cargoConsolidationsApi = {
  list: async (params?: ConsolidationListParams): Promise<ConsolidationPaginatedResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset !== undefined) searchParams.set('offset', String(params.offset));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.origin_place) searchParams.set('origin_place', params.origin_place);
    if (params?.destination_place) searchParams.set('destination_place', params.destination_place);
    if (params?.carrier_name) searchParams.set('carrier_name', params.carrier_name);
    if (params?.departure_start_date)
      searchParams.set('departure_start_date', params.departure_start_date);
    if (params?.departure_end_date)
      searchParams.set('departure_end_date', params.departure_end_date);
    if (params?.arrived_start_date)
      searchParams.set('arrived_start_date', params.arrived_start_date);
    if (params?.arrived_end_date) searchParams.set('arrived_end_date', params.arrived_end_date);
    if (params?.sort_by) searchParams.set('sort_by', params.sort_by);
    if (params?.sort_order) searchParams.set('sort_order', params.sort_order);
    if (params?.order) searchParams.set('order', params.order);

    const query = searchParams.toString();
    return request<ConsolidationPaginatedResponse>(`/consolidations${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  getActive: async (search?: string): Promise<ConsolidationActiveDropdownItem[]> => {
    const searchParams = new URLSearchParams();
    if (search) searchParams.set('search', search);
    const query = searchParams.toString();
    return request<ConsolidationActiveDropdownItem[]>(
      `/consolidations/active${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  },

  get: (id: string): Promise<ConsolidationListItem> =>
    request<ConsolidationListItem>(`/consolidations/${id}`, { method: 'GET' }),

  create: (dto: CreateConsolidationDto): Promise<ConsolidationListItem> =>
    request<ConsolidationListItem>('/consolidations', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  update: (id: string, dto: UpdateConsolidationDto): Promise<ConsolidationListItem> =>
    request<ConsolidationListItem>(`/consolidations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  assignCargos: (
    id: string,
    cargoRegistrationIds: string[]
  ): Promise<{ message: string; count: number; consolidation: ConsolidationListItem }> =>
    request<{ message: string; count: number; consolidation: ConsolidationListItem }>(
      `/consolidations/${id}/assign-cargos`,
      {
        method: 'POST',
        body: JSON.stringify({ cargo_registration_ids: cargoRegistrationIds }),
      }
    ),

  removeCargos: (
    id: string,
    cargoRegistrationIds: string[]
  ): Promise<{ message: string; count: number; consolidation: ConsolidationListItem }> =>
    request<{ message: string; count: number; consolidation: ConsolidationListItem }>(
      `/consolidations/${id}/remove-cargos`,
      {
        method: 'POST',
        body: JSON.stringify({ cargo_registration_ids: cargoRegistrationIds }),
      }
    ),

  delete: (id: string): Promise<{ message: string; id: string }> =>
    request<{ message: string; id: string }>(`/consolidations/${id}`, {
      method: 'DELETE',
    }),

  // Helper to query unassigned LTL cargos for fast multi-select modal assignment
  getUnassignedLtlCargos: async (search?: string): Promise<ConsolidationCargoItem[]> => {
    try {
      const res = await cargoRegistrationsApi.list({
        cargo_type: 'LTL',
        has_consolidation: false,
        limit: 200,
        search,
      });

      if (res && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((c: any) => ({
          id: c.id,
          cargo_type: c.cargo_type || 'LTL',
          cargo: c.cargo || 'General Cargo',
          volume: c.volume ?? 0,
          weight: c.weight ?? 0,
          container_type: c.container_type,
          container_truck_id: c.container_truck_id,
          agent_name: c.agent_name,
          client_id: c.client_id || c.client?.id,
          client_name: c.client?.name || c.client_full_name,
          client:
            c.client || (c.client_full_name ? { id: c.client_id, name: c.client_full_name } : null),
          employee_id: c.employee_id || c.employee?.id,
          employee_name: c.employee?.name || c.employee_full_name,
          employee:
            c.employee ||
            (c.employee_full_name ? { id: c.employee_id, name: c.employee_full_name } : null),
          purchase_price: {
            amount:
              c.purchase_price?.amount ??
              (typeof c.purchase_price === 'number' ? c.purchase_price : 0),
            currency: c.purchase_price?.currency || c.purchase_currency || 'USD',
            amount_usd:
              c.purchase_price?.amount_usd ??
              (typeof c.purchase_price === 'number' ? c.purchase_price : 0),
          },
          sell_price: {
            amount: c.sell_price?.amount ?? (typeof c.sell_price === 'number' ? c.sell_price : 0),
            currency: c.sell_price?.currency || c.sell_currency || 'USD',
            amount_usd:
              c.sell_price?.amount_usd ?? (typeof c.sell_price === 'number' ? c.sell_price : 0),
          },
          net_yield_usd: c.net_yield?.amount_usd ?? c.net_yield_usd ?? 0,
          status: c.status,
          loaded_date: c.loaded_date,
          arrived_date: c.arrived_date,
          confirmed_date: c.confirmed_date,
          purchase_date: c.purchase_date,
          sell_date: c.sell_date,
          created_at: c.created_at,
          updated_at: c.updated_at,
        }));
      }
    } catch {
      // Offline fallback
    }

    const allCargos = getLiveCargoRegistrations();
    // Unassigned means LTL and either no consolidation_id or not in any active consolidation record
    const allAssignedIds = new Set(
      demoConsolidations.flatMap((c) => c.cargo_registration_ids || [])
    );

    const unassigned = allCargos.filter((c) => {
      const isLtl = (c.cargo_type || 'LTL').toUpperCase() === 'LTL';
      const isFree = !c.consolidation_id && !allAssignedIds.has(c.id);
      return isLtl && isFree;
    });

    let filtered = unassigned;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          (c.container_truck_id || '').toLowerCase().includes(s) ||
          (c.cargo || '').toLowerCase().includes(s) ||
          (c.agent_name || '').toLowerCase().includes(s)
      );
    }

    return filtered.map((c) => {
      const purConv = convertPriceToUsdAndUzs(
        c.purchase_price,
        c.purchase_currency,
        c.purchase_date,
        c.purchase_custom_rate || c.purchase_usd_rate,
        c.usd_rmb_rate
      );
      const sellConv = convertPriceToUsdAndUzs(
        c.sell_price,
        c.sell_currency,
        c.sell_date,
        c.sell_custom_rate || c.sell_usd_rate,
        c.usd_rmb_rate
      );
      const client = demoClientsDb.find((cl) => cl.id === c.client_id);
      const emp = demoEmployeesDb.get(c.employee_id);

      return {
        id: c.id,
        cargo_type: c.cargo_type || 'LTL',
        cargo: c.cargo || 'General Cargo',
        volume: c.volume,
        weight: c.weight,
        container_type: c.container_type,
        container_truck_id: c.container_truck_id,
        agent_name: c.agent_name,
        client: client
          ? {
              id: client.id,
              name: `${client.first_name} ${client.last_name}`.trim(),
              first_name: client.first_name,
              last_name: client.last_name,
              company_name: client.company_name,
            }
          : null,
        employee: emp
          ? {
              id: emp.id,
              name: `${emp.first_name} ${emp.last_name}`.trim(),
              first_name: emp.first_name,
              last_name: emp.last_name,
            }
          : null,
        purchase_price: {
          amount: c.purchase_price,
          currency: c.purchase_currency,
          amount_usd: purConv.amount_usd,
        },
        sell_price: {
          amount: c.sell_price,
          currency: c.sell_currency,
          amount_usd: sellConv.amount_usd,
        },
        net_yield_usd: Math.max(0, sellConv.amount_usd - purConv.amount_usd),
        status: c.status,
        loaded_date: c.loaded_date,
        arrived_date: c.arrived_date,
        confirmed_date: c.confirmed_date,
        purchase_date: c.purchase_date,
        sell_date: c.sell_date,
        created_at: c.created_at,
        updated_at: c.updated_at,
      };
    });
  },
};
