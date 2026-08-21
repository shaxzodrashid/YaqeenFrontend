import { request, registerDemoHandler, makeApiError } from './httpClient';

// ---------------------------------------------------------------------------
// Types & Enums
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

export type ConsolidationCurrency = 'USD' | 'UZS' | 'RUB' | 'RMB';

export interface CargoConsolidationCapacity {
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

export interface CargoConsolidationFinancials {
  total_sell_usd: number;
  total_purchase_usd: number;
  carrier_cost: {
    amount: number;
    currency: string;
    amount_usd: number;
  };
  consolidated_net_margin_usd: number;
}

export interface CargoConsolidationCargoItem {
  id: string;
  cargo_type: 'LTL' | 'FTL';
  cargo: string;
  volume: number;
  weight: number;
  client?: {
    id: string;
    name: string;
  };
  employee?: {
    id: string;
    name: string;
  };
  purchase_price: {
    amount: number;
    currency: string;
    amount_usd: number;
  };
  sell_price: {
    amount: number;
    currency: string;
    amount_usd: number;
  };
  net_yield_usd: number;
  status: string;
  loaded_date?: string | null;
  arrived_date?: string | null;
  confirmed_date?: string | null;
  created_at: string;
}

export interface CargoConsolidation {
  id: string;
  consolidation_code: string;
  container_truck_id: string;
  container_type?: string | null;
  max_volume_capacity?: number | null;
  max_weight_capacity?: number | null;
  carrier_name?: string | null;
  carrier_phone?: string | null;
  origin_place?: string | null;
  destination_place?: string | null;
  loaded_date?: string | null;
  departure_date?: string | null;
  estimated_arrival_date?: string | null;
  arrived_date?: string | null;
  total_carrier_cost: number;
  carrier_cost_currency: string;
  carrier_cost_usd_rate?: number | null;
  status: ConsolidationStatus;
  description?: string | null;
  created_by_user_id?: string | null;
  capacity?: CargoConsolidationCapacity;
  financials?: CargoConsolidationFinancials;
  cargos?: CargoConsolidationCargoItem[];
  created_at: string;
  updated_at: string;
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
  destination_place?: string;
  loaded_date?: string;
  departure_date?: string;
  estimated_arrival_date?: string;
  arrived_date?: string;
  total_carrier_cost?: number;
  carrier_cost_currency?: string;
  carrier_cost_usd_rate?: number;
  status?: ConsolidationStatus;
  description?: string;
  cargo_registration_ids?: string[];
}

export interface UpdateConsolidationDto extends Partial<CreateConsolidationDto> {
  sync_status_to_cargos?: boolean;
  sync_dates_to_cargos?: boolean;
}

export interface ActiveConsolidationOption {
  id: string;
  consolidation_code: string;
  container_truck_id: string;
  container_type?: string;
  status: ConsolidationStatus;
  carrier_name?: string;
  origin_place?: string;
  destination_place?: string;
  departure_date?: string;
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

export interface ConsolidationListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  origin_place?: string;
  destination_place?: string;
  carrier_name?: string;
  departure_start_date?: string;
  departure_end_date?: string;
  arrived_start_date?: string;
  arrived_end_date?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC' | 'asc' | 'desc';
}

export interface ConsolidationPaginatedResponse {
  meta: {
    total: number;
    limit: number;
    offset: number;
    total_margin_usd: number;
    total_volume_m3: number;
    total_weight_kg: number;
    active_trucks: number;
    avg_volume_utilization: number;
  };
  data: CargoConsolidation[];
}

// ---------------------------------------------------------------------------
// Standard Container Presets
// ---------------------------------------------------------------------------

export const CONSOLIDATION_CONTAINER_PRESETS: {
  type: string;
  label: string;
  defaultVolume: number;
  defaultWeight: number;
}[] = [
  { type: '86m3', label: 'Euro Truck (86 m³)', defaultVolume: 86, defaultWeight: 22000 },
  { type: '96m3', label: 'Mega Trailer (96 m³)', defaultVolume: 96, defaultWeight: 22000 },
  { type: '105m3', label: 'High Cube Truck (105 m³)', defaultVolume: 105, defaultWeight: 24000 },
  { type: '120m3', label: 'Jumbo Fura (120 m³)', defaultVolume: 120, defaultWeight: 24000 },
  { type: '130m3', label: 'Super Jumbo (130 m³)', defaultVolume: 130, defaultWeight: 25000 },
  { type: '40HQ', label: '40ft High Cube Container', defaultVolume: 76, defaultWeight: 26000 },
  { type: '20GP', label: '20ft Standard Container', defaultVolume: 33, defaultWeight: 21000 },
  { type: 'Tent', label: 'Standard Tilt / Tent (90 m³)', defaultVolume: 90, defaultWeight: 22000 },
];

export const POPULAR_ORIGIN_CITIES = [
  'Istanbul, Turkey',
  'Guangzhou, China',
  'Yiwu, China',
  'Beijing, China',
  'Urumqi, China',
  'Dubai, UAE',
  'Moscow, Russia',
  'Almaty, Kazakhstan',
  'Bursa, Turkey',
  'Shenzhen, China',
];

export const POPULAR_DESTINATION_CITIES = [
  'Tashkent, Uzbekistan',
  'Samarkand, Uzbekistan',
  'Andijan, Uzbekistan',
  'Bukhara, Uzbekistan',
  'Namangan, Uzbekistan',
  'Fergana, Uzbekistan',
];

// ---------------------------------------------------------------------------
// Internal Demo Store & Initial Seeds
// ---------------------------------------------------------------------------

interface StoredConsolidationRecord {
  id: string;
  consolidation_code: string;
  container_truck_id: string;
  container_type: string;
  max_volume_capacity: number;
  max_weight_capacity: number;
  carrier_name: string;
  carrier_phone: string;
  origin_place: string;
  destination_place: string;
  loaded_date: string | null;
  departure_date: string | null;
  estimated_arrival_date: string | null;
  arrived_date: string | null;
  total_carrier_cost: number;
  carrier_cost_currency: string;
  carrier_cost_usd_rate: number | null;
  status: ConsolidationStatus;
  description: string;
  cargo_registration_ids: string[];
  created_at: string;
  updated_at: string;
}

const INITIAL_DEMO_CONSOLIDATIONS: StoredConsolidationRecord[] = [
  {
    id: 'cns-001-e3b0c442-98fc-1c14-9afb-4c8996fb9242',
    consolidation_code: 'CNS-202608-0001',
    container_truck_id: '01A777AA',
    container_type: '86m3',
    max_volume_capacity: 86.0,
    max_weight_capacity: 22000.0,
    carrier_name: 'Baytur Logistics Turkey',
    carrier_phone: '+998 90 123 45 67',
    origin_place: 'Istanbul, Turkey',
    destination_place: 'Tashkent, Uzbekistan',
    loaded_date: '2026-08-20',
    departure_date: '2026-08-23',
    estimated_arrival_date: '2026-08-31',
    arrived_date: null,
    total_carrier_cost: 3500.0,
    carrier_cost_currency: 'USD',
    carrier_cost_usd_rate: 1.0,
    status: 'Loading',
    description: 'High-priority textile, Turkish home goods and consumer batch',
    cargo_registration_ids: ['c-item-turkey-1', 'c-item-turkey-2', 'c-item-turkey-3'],
    created_at: '2026-08-19T08:30:00.000Z',
    updated_at: '2026-08-21T10:15:00.000Z',
  },
  {
    id: 'cns-002-7c9e6679-7425-40de-944b-e07fc1f90ae7',
    consolidation_code: 'CNS-202608-0002',
    container_truck_id: '01B888BB',
    container_type: '120m3',
    max_volume_capacity: 120.0,
    max_weight_capacity: 24000.0,
    carrier_name: 'Silk Road Freight Express',
    carrier_phone: '+998 93 456 78 90',
    origin_place: 'Guangzhou, China',
    destination_place: 'Tashkent, Uzbekistan',
    loaded_date: '2026-08-14',
    departure_date: '2026-08-16',
    estimated_arrival_date: '2026-08-26',
    arrived_date: null,
    total_carrier_cost: 5400.0,
    carrier_cost_currency: 'USD',
    carrier_cost_usd_rate: 1.0,
    status: 'On the way',
    description: 'Guangzhou electronics, LED lighting and auto spare parts',
    cargo_registration_ids: [
      'c-item-china-1',
      'c-item-china-2',
      'c-item-china-3',
      'c-item-china-4',
    ],
    created_at: '2026-08-12T09:00:00.000Z',
    updated_at: '2026-08-18T14:20:00.000Z',
  },
  {
    id: 'cns-003-8d0f7780-8536-41ef-a55c-f18fd2g01bf8',
    consolidation_code: 'CNS-202608-0003',
    container_truck_id: '01C999CC',
    container_type: '40HQ',
    max_volume_capacity: 76.0,
    max_weight_capacity: 26000.0,
    carrier_name: 'TransAsia Rail Line',
    carrier_phone: '+998 97 789 01 23',
    origin_place: 'Yiwu, China',
    destination_place: 'Tashkent, Uzbekistan',
    loaded_date: '2026-08-10',
    departure_date: '2026-08-12',
    estimated_arrival_date: '2026-08-23',
    arrived_date: null,
    total_carrier_cost: 4800.0,
    carrier_cost_currency: 'USD',
    carrier_cost_usd_rate: 1.0,
    status: 'On the border',
    description: 'Yiwu small commodity groupage at Khorgos border checkpoint',
    cargo_registration_ids: ['c-item-yiwu-1', 'c-item-yiwu-2', 'c-item-yiwu-3'],
    created_at: '2026-08-09T11:00:00.000Z',
    updated_at: '2026-08-19T16:45:00.000Z',
  },
  {
    id: 'cns-004-9e1g8891-9647-42fg-b66d-g29ge3h12cg9',
    consolidation_code: 'CNS-202608-0004',
    container_truck_id: '01D111DD',
    container_type: '96m3',
    max_volume_capacity: 96.0,
    max_weight_capacity: 20000.0,
    carrier_name: 'Emirates Gulf Logistics',
    carrier_phone: '+998 99 321 65 47',
    origin_place: 'Dubai, UAE',
    destination_place: 'Tashkent, Uzbekistan',
    loaded_date: null,
    departure_date: '2026-08-28',
    estimated_arrival_date: '2026-09-06',
    arrived_date: null,
    total_carrier_cost: 4200.0,
    carrier_cost_currency: 'USD',
    carrier_cost_usd_rate: 1.0,
    status: 'Planning',
    description: 'UAE perfume, cosmetics and IT hardware consolidation',
    cargo_registration_ids: ['c-item-dubai-1', 'c-item-dubai-2'],
    created_at: '2026-08-20T14:10:00.000Z',
    updated_at: '2026-08-20T14:10:00.000Z',
  },
  {
    id: 'cns-005-af2h9902-0758-43gh-c77e-h30hf4i23dh0',
    consolidation_code: 'CNS-202607-0012',
    container_truck_id: '01E222EE',
    container_type: '120m3',
    max_volume_capacity: 120.0,
    max_weight_capacity: 24000.0,
    carrier_name: 'Eurasia Freight Trans',
    carrier_phone: '+998 91 654 32 10',
    origin_place: 'Beijing, China',
    destination_place: 'Tashkent, Uzbekistan',
    loaded_date: '2026-08-02',
    departure_date: '2026-08-05',
    estimated_arrival_date: '2026-08-17',
    arrived_date: '2026-08-18',
    total_carrier_cost: 5200.0,
    carrier_cost_currency: 'USD',
    carrier_cost_usd_rate: 1.0,
    status: 'Arrived',
    description: 'Delivered and unloaded at Chukursay customs terminal',
    cargo_registration_ids: [
      'c-item-beijing-1',
      'c-item-beijing-2',
      'c-item-beijing-3',
      'c-item-beijing-4',
    ],
    created_at: '2026-07-28T09:30:00.000Z',
    updated_at: '2026-08-18T17:00:00.000Z',
  },
];

// Rich mock cargo registrations for consolidations
export interface MockCargoRecord {
  id: string;
  consolidation_id?: string | null;
  cargo_type: 'LTL' | 'FTL';
  cargo: string;
  volume: number;
  weight: number;
  client_id: string;
  client_name: string;
  employee_id: string;
  employee_name: string;
  purchase_price: number;
  purchase_currency: string;
  sell_price: number;
  sell_currency: string;
  status: string;
  loaded_date?: string | null;
  departure_date?: string | null;
  arrived_date?: string | null;
  confirmed_date?: string | null;
  created_at: string;
}

const INITIAL_MOCK_CARGOS: MockCargoRecord[] = [
  // Turkey batch (CNS-202608-0001)
  {
    id: 'c-item-turkey-1',
    consolidation_id: 'cns-001-e3b0c442-98fc-1c14-9afb-4c8996fb9242',
    cargo_type: 'LTL',
    cargo: 'Turkish Premium Cotton Fabrics & Textiles',
    volume: 24.5,
    weight: 5800,
    client_id: 'c-client-1',
    client_name: 'AZIZ TEXTILE GROUP LLC',
    employee_id: '11111111-2222-3333-4444-555555555555',
    employee_name: 'Farhod Alimov',
    purchase_price: 1800,
    purchase_currency: 'USD',
    sell_price: 3200,
    sell_currency: 'USD',
    status: 'Loading',
    loaded_date: '2026-08-20',
    confirmed_date: '2026-08-18',
    created_at: '2026-08-18T10:00:00.000Z',
  },
  {
    id: 'c-item-turkey-2',
    consolidation_id: 'cns-001-e3b0c442-98fc-1c14-9afb-4c8996fb9242',
    cargo_type: 'LTL',
    cargo: 'Industrial Machinery Valves & Pumps',
    volume: 18.0,
    weight: 4600,
    client_id: 'c-client-2',
    client_name: 'SAMARKAND INDUSTRIAL MCHJ',
    employee_id: '2b78a1c9-34e5-4a1d-91b2-c8d9e0f1a2b3',
    employee_name: 'Dildora Rahimova',
    purchase_price: 1400,
    purchase_currency: 'USD',
    sell_price: 2600,
    sell_currency: 'USD',
    status: 'Loading',
    loaded_date: '2026-08-20',
    confirmed_date: '2026-08-19',
    created_at: '2026-08-19T11:30:00.000Z',
  },
  {
    id: 'c-item-turkey-3',
    consolidation_id: 'cns-001-e3b0c442-98fc-1c14-9afb-4c8996fb9242',
    cargo_type: 'LTL',
    cargo: 'Bathroom Accessories & Ceramic Sanitary Ware',
    volume: 22.0,
    weight: 5900,
    client_id: 'c-client-3',
    client_name: 'MODERN HOME DECOR LLC',
    employee_id: '3c89b2d0-45f6-5b2e-02c3-d9e0f1a2b3c4',
    employee_name: 'Jasur Karimov',
    purchase_price: 1700,
    purchase_currency: 'USD',
    sell_price: 2900,
    sell_currency: 'USD',
    status: 'Loading',
    loaded_date: '2026-08-20',
    confirmed_date: '2026-08-19',
    created_at: '2026-08-19T14:00:00.000Z',
  },

  // Guangzhou batch (CNS-202608-0002)
  {
    id: 'c-item-china-1',
    consolidation_id: 'cns-002-7c9e6679-7425-40de-944b-e07fc1f90ae7',
    cargo_type: 'LTL',
    cargo: 'Commercial LED Stage & Architectural Lighting',
    volume: 32.0,
    weight: 6200,
    client_id: 'c-client-1',
    client_name: 'AZIZ TEXTILE GROUP LLC',
    employee_id: '11111111-2222-3333-4444-555555555555',
    employee_name: 'Farhod Alimov',
    purchase_price: 2600,
    purchase_currency: 'USD',
    sell_price: 4500,
    sell_currency: 'USD',
    status: 'On the way',
    loaded_date: '2026-08-14',
    confirmed_date: '2026-08-12',
    created_at: '2026-08-12T08:00:00.000Z',
  },
  {
    id: 'c-item-china-2',
    consolidation_id: 'cns-002-7c9e6679-7425-40de-944b-e07fc1f90ae7',
    cargo_type: 'LTL',
    cargo: 'Smartphone Accessories & Display Screens',
    volume: 16.5,
    weight: 2800,
    client_id: 'c-client-4',
    client_name: 'TECHNO ASIA DISTRIBUTION',
    employee_id: '2b78a1c9-34e5-4a1d-91b2-c8d9e0f1a2b3',
    employee_name: 'Dildora Rahimova',
    purchase_price: 1900,
    purchase_currency: 'USD',
    sell_price: 3600,
    sell_currency: 'USD',
    status: 'On the way',
    loaded_date: '2026-08-14',
    confirmed_date: '2026-08-13',
    created_at: '2026-08-13T09:30:00.000Z',
  },
  {
    id: 'c-item-china-3',
    consolidation_id: 'cns-002-7c9e6679-7425-40de-944b-e07fc1f90ae7',
    cargo_type: 'LTL',
    cargo: 'Automotive Brake Pads & Suspension Parts',
    volume: 25.0,
    weight: 7100,
    client_id: 'c-client-2',
    client_name: 'SAMARKAND INDUSTRIAL MCHJ',
    employee_id: '11111111-2222-3333-4444-555555555555',
    employee_name: 'Farhod Alimov',
    purchase_price: 2100,
    purchase_currency: 'USD',
    sell_price: 3800,
    sell_currency: 'USD',
    status: 'On the way',
    loaded_date: '2026-08-14',
    confirmed_date: '2026-08-13',
    created_at: '2026-08-13T11:00:00.000Z',
  },
  {
    id: 'c-item-china-4',
    consolidation_id: 'cns-002-7c9e6679-7425-40de-944b-e07fc1f90ae7',
    cargo_type: 'LTL',
    cargo: 'Fitness & Gym Equipment Accessories',
    volume: 28.0,
    weight: 5400,
    client_id: 'c-client-3',
    client_name: 'MODERN HOME DECOR LLC',
    employee_id: '3c89b2d0-45f6-5b2e-02c3-d9e0f1a2b3c4',
    employee_name: 'Jasur Karimov',
    purchase_price: 2200,
    purchase_currency: 'USD',
    sell_price: 3900,
    sell_currency: 'USD',
    status: 'On the way',
    loaded_date: '2026-08-14',
    confirmed_date: '2026-08-14',
    created_at: '2026-08-14T10:00:00.000Z',
  },

  // Yiwu batch (CNS-202608-0003)
  {
    id: 'c-item-yiwu-1',
    consolidation_id: 'cns-003-8d0f7780-8536-41ef-a55c-f18fd2g01bf8',
    cargo_type: 'LTL',
    cargo: 'Stationery, Pens & Office School Supplies',
    volume: 21.0,
    weight: 6800,
    client_id: 'c-client-1',
    client_name: 'AZIZ TEXTILE GROUP LLC',
    employee_id: '2b78a1c9-34e5-4a1d-91b2-c8d9e0f1a2b3',
    employee_name: 'Dildora Rahimova',
    purchase_price: 1800,
    purchase_currency: 'USD',
    sell_price: 3100,
    sell_currency: 'USD',
    status: 'On the border',
    loaded_date: '2026-08-10',
    confirmed_date: '2026-08-09',
    created_at: '2026-08-09T14:00:00.000Z',
  },
  {
    id: 'c-item-yiwu-2',
    consolidation_id: 'cns-003-8d0f7780-8536-41ef-a55c-f18fd2g01bf8',
    cargo_type: 'LTL',
    cargo: 'Children Toys & Educational Board Games',
    volume: 26.5,
    weight: 7900,
    client_id: 'c-client-4',
    client_name: 'TECHNO ASIA DISTRIBUTION',
    employee_id: '11111111-2222-3333-4444-555555555555',
    employee_name: 'Farhod Alimov',
    purchase_price: 2300,
    purchase_currency: 'USD',
    sell_price: 4100,
    sell_currency: 'USD',
    status: 'On the border',
    loaded_date: '2026-08-10',
    confirmed_date: '2026-08-09',
    created_at: '2026-08-09T15:30:00.000Z',
  },
  {
    id: 'c-item-yiwu-3',
    consolidation_id: 'cns-003-8d0f7780-8536-41ef-a55c-f18fd2g01bf8',
    cargo_type: 'LTL',
    cargo: 'Kitchen Tableware & Plastic Organizers',
    volume: 20.0,
    weight: 8200,
    client_id: 'c-client-3',
    client_name: 'MODERN HOME DECOR LLC',
    employee_id: '3c89b2d0-45f6-5b2e-02c3-d9e0f1a2b3c4',
    employee_name: 'Jasur Karimov',
    purchase_price: 1600,
    purchase_currency: 'USD',
    sell_price: 2850,
    sell_currency: 'USD',
    status: 'On the border',
    loaded_date: '2026-08-10',
    confirmed_date: '2026-08-10',
    created_at: '2026-08-10T10:00:00.000Z',
  },

  // Dubai batch (CNS-202608-0004)
  {
    id: 'c-item-dubai-1',
    consolidation_id: 'cns-004-9e1g8891-9647-42fg-b66d-g29ge3h12cg9',
    cargo_type: 'LTL',
    cargo: 'Arabian Perfumery, Ouds & Essential Fragrances',
    volume: 14.0,
    weight: 2200,
    client_id: 'c-client-1',
    client_name: 'AZIZ TEXTILE GROUP LLC',
    employee_id: '11111111-2222-3333-4444-555555555555',
    employee_name: 'Farhod Alimov',
    purchase_price: 1500,
    purchase_currency: 'USD',
    sell_price: 2800,
    sell_currency: 'USD',
    status: 'Planning',
    confirmed_date: '2026-08-19',
    created_at: '2026-08-19T16:00:00.000Z',
  },
  {
    id: 'c-item-dubai-2',
    consolidation_id: 'cns-004-9e1g8891-9647-42fg-b66d-g29ge3h12cg9',
    cargo_type: 'LTL',
    cargo: 'Commercial IT Networking Routers & Switches',
    volume: 18.5,
    weight: 3100,
    client_id: 'c-client-4',
    client_name: 'TECHNO ASIA DISTRIBUTION',
    employee_id: '2b78a1c9-34e5-4a1d-91b2-c8d9e0f1a2b3',
    employee_name: 'Dildora Rahimova',
    purchase_price: 1800,
    purchase_currency: 'USD',
    sell_price: 3400,
    sell_currency: 'USD',
    status: 'Planning',
    confirmed_date: '2026-08-20',
    created_at: '2026-08-20T09:00:00.000Z',
  },

  // Beijing completed batch (CNS-202607-0012)
  {
    id: 'c-item-beijing-1',
    consolidation_id: 'cns-005-af2h9902-0758-43gh-c77e-h30hf4i23dh0',
    cargo_type: 'LTL',
    cargo: 'Medical Diagnostic Sensors & Laboratory Consumables',
    volume: 26.0,
    weight: 4800,
    client_id: 'c-client-2',
    client_name: 'SAMARKAND INDUSTRIAL MCHJ',
    employee_id: '11111111-2222-3333-4444-555555555555',
    employee_name: 'Farhod Alimov',
    purchase_price: 2400,
    purchase_currency: 'USD',
    sell_price: 4300,
    sell_currency: 'USD',
    status: 'Arrived',
    loaded_date: '2026-08-02',
    arrived_date: '2026-08-18',
    confirmed_date: '2026-07-30',
    created_at: '2026-07-30T10:00:00.000Z',
  },
  {
    id: 'c-item-beijing-2',
    consolidation_id: 'cns-005-af2h9902-0758-43gh-c77e-h30hf4i23dh0',
    cargo_type: 'LTL',
    cargo: 'Solar Inverters & Lithium Battery Packs',
    volume: 38.0,
    weight: 8600,
    client_id: 'c-client-4',
    client_name: 'TECHNO ASIA DISTRIBUTION',
    employee_id: '2b78a1c9-34e5-4a1d-91b2-c8d9e0f1a2b3',
    employee_name: 'Dildora Rahimova',
    purchase_price: 3100,
    purchase_currency: 'USD',
    sell_price: 5600,
    sell_currency: 'USD',
    status: 'Arrived',
    loaded_date: '2026-08-02',
    arrived_date: '2026-08-18',
    confirmed_date: '2026-07-30',
    created_at: '2026-07-30T11:00:00.000Z',
  },
  {
    id: 'c-item-beijing-3',
    consolidation_id: 'cns-005-af2h9902-0758-43gh-c77e-h30hf4i23dh0',
    cargo_type: 'LTL',
    cargo: 'Industrial Power Cables & Connectors',
    volume: 28.0,
    weight: 6200,
    client_id: 'c-client-1',
    client_name: 'AZIZ TEXTILE GROUP LLC',
    employee_id: '3c89b2d0-45f6-5b2e-02c3-d9e0f1a2b3c4',
    employee_name: 'Jasur Karimov',
    purchase_price: 2000,
    purchase_currency: 'USD',
    sell_price: 3700,
    sell_currency: 'USD',
    status: 'Arrived',
    loaded_date: '2026-08-02',
    arrived_date: '2026-08-18',
    confirmed_date: '2026-07-31',
    created_at: '2026-07-31T09:00:00.000Z',
  },
  {
    id: 'c-item-beijing-4',
    consolidation_id: 'cns-005-af2h9902-0758-43gh-c77e-h30hf4i23dh0',
    cargo_type: 'LTL',
    cargo: 'Automated Packaging Film Rolls',
    volume: 22.0,
    weight: 3900,
    client_id: 'c-client-3',
    client_name: 'MODERN HOME DECOR LLC',
    employee_id: '11111111-2222-3333-4444-555555555555',
    employee_name: 'Farhod Alimov',
    purchase_price: 1600,
    purchase_currency: 'USD',
    sell_price: 2950,
    sell_currency: 'USD',
    status: 'Arrived',
    loaded_date: '2026-08-02',
    arrived_date: '2026-08-18',
    confirmed_date: '2026-07-31',
    created_at: '2026-07-31T14:30:00.000Z',
  },

  // Available unassigned LTL cargos ready to consolidate!
  {
    id: 'c-unassigned-1',
    consolidation_id: null,
    cargo_type: 'LTL',
    cargo: 'Specialty Coffee Roasting Beans & Packaging',
    volume: 8.5,
    weight: 1400,
    client_id: 'c-client-1',
    client_name: 'AZIZ TEXTILE GROUP LLC',
    employee_id: '11111111-2222-3333-4444-555555555555',
    employee_name: 'Farhod Alimov',
    purchase_price: 900,
    purchase_currency: 'USD',
    sell_price: 1650,
    sell_currency: 'USD',
    status: 'Waiting',
    confirmed_date: '2026-08-20',
    created_at: '2026-08-20T11:00:00.000Z',
  },
  {
    id: 'c-unassigned-2',
    consolidation_id: null,
    cargo_type: 'LTL',
    cargo: 'Hydraulic Seals & Industrial Gaskets',
    volume: 4.2,
    weight: 950,
    client_id: 'c-client-2',
    client_name: 'SAMARKAND INDUSTRIAL MCHJ',
    employee_id: '2b78a1c9-34e5-4a1d-91b2-c8d9e0f1a2b3',
    employee_name: 'Dildora Rahimova',
    purchase_price: 650,
    purchase_currency: 'USD',
    sell_price: 1200,
    sell_currency: 'USD',
    status: 'Waiting',
    confirmed_date: '2026-08-21',
    created_at: '2026-08-21T08:30:00.000Z',
  },
  {
    id: 'c-unassigned-3',
    consolidation_id: null,
    cargo_type: 'LTL',
    cargo: 'Smart Home Security Cameras & Doorbells',
    volume: 12.0,
    weight: 1800,
    client_id: 'c-client-4',
    client_name: 'TECHNO ASIA DISTRIBUTION',
    employee_id: '3c89b2d0-45f6-5b2e-02c3-d9e0f1a2b3c4',
    employee_name: 'Jasur Karimov',
    purchase_price: 1300,
    purchase_currency: 'USD',
    sell_price: 2400,
    sell_currency: 'USD',
    status: 'Waiting',
    confirmed_date: '2026-08-21',
    created_at: '2026-08-21T09:15:00.000Z',
  },
  {
    id: 'c-unassigned-4',
    consolidation_id: null,
    cargo_type: 'LTL',
    cargo: 'Decorative Ceramic Tile Samples & Mosaics',
    volume: 6.8,
    weight: 2300,
    client_id: 'c-client-3',
    client_name: 'MODERN HOME DECOR LLC',
    employee_id: '11111111-2222-3333-4444-555555555555',
    employee_name: 'Farhod Alimov',
    purchase_price: 750,
    purchase_currency: 'USD',
    sell_price: 1450,
    sell_currency: 'USD',
    status: 'Waiting',
    confirmed_date: '2026-08-21',
    created_at: '2026-08-21T10:00:00.000Z',
  },
];

function getStoredConsolidations(): StoredConsolidationRecord[] {
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

function saveStoredConsolidations(records: StoredConsolidationRecord[]) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('yaqeen_cargo_consolidations_db', JSON.stringify(records));
    }
  } catch {
    // Ignore storage error
  }
}

function getStoredMockCargos(): MockCargoRecord[] {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('yaqeen_consolidation_cargos_db');
      if (raw) return JSON.parse(raw);
    }
  } catch {
    // Ignore storage error
  }
  return [...INITIAL_MOCK_CARGOS];
}

function saveStoredMockCargos(cargos: MockCargoRecord[]) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('yaqeen_consolidation_cargos_db', JSON.stringify(cargos));
    }
  } catch {
    // Ignore storage error
  }
}

let demoConsolidations = getStoredConsolidations();
let demoCargos = getStoredMockCargos();

// ---------------------------------------------------------------------------
// Helpers to build full CargoConsolidation objects with dynamic math
// ---------------------------------------------------------------------------

function buildConsolidationResponse(record: StoredConsolidationRecord): CargoConsolidation {
  const attachedCargos = demoCargos.filter((c) => c.consolidation_id === record.id);

  let totalAssignedVolume = 0;
  let totalAssignedWeight = 0;
  let totalSellUsd = 0;
  let totalPurchaseUsd = 0;

  const cargoItems: CargoConsolidationCargoItem[] = attachedCargos.map((c) => {
    totalAssignedVolume += c.volume || 0;
    totalAssignedWeight += c.weight || 0;
    totalSellUsd += c.sell_price || 0;
    totalPurchaseUsd += c.purchase_price || 0;

    const netYield = (c.sell_price || 0) - (c.purchase_price || 0);

    return {
      id: c.id,
      cargo_type: c.cargo_type,
      cargo: c.cargo,
      volume: c.volume,
      weight: c.weight,
      client: {
        id: c.client_id,
        name: c.client_name,
      },
      employee: {
        id: c.employee_id,
        name: c.employee_name,
      },
      purchase_price: {
        amount: c.purchase_price,
        currency: c.purchase_currency,
        amount_usd: c.purchase_price,
      },
      sell_price: {
        amount: c.sell_price,
        currency: c.sell_currency,
        amount_usd: c.sell_price,
      },
      net_yield_usd: netYield,
      status: c.status,
      loaded_date: c.loaded_date || record.loaded_date,
      arrived_date: c.arrived_date || record.arrived_date,
      confirmed_date: c.confirmed_date,
      created_at: c.created_at,
    };
  });

  const maxVol = record.max_volume_capacity || 86.0;
  const maxWt = record.max_weight_capacity || 22000.0;
  const remainingVol = Math.max(0, Math.round((maxVol - totalAssignedVolume) * 100) / 100);
  const remainingWt = Math.max(0, Math.round((maxWt - totalAssignedWeight) * 100) / 100);
  const volUtilPct = maxVol > 0 ? Math.round((totalAssignedVolume / maxVol) * 10000) / 100 : 0;
  const wtUtilPct = maxWt > 0 ? Math.round((totalAssignedWeight / maxWt) * 10000) / 100 : 0;

  const carrierCostUsd = record.total_carrier_cost * (record.carrier_cost_usd_rate || 1.0);
  const consolidatedNetMargin =
    Math.round((totalSellUsd - totalPurchaseUsd - carrierCostUsd) * 100) / 100;

  return {
    id: record.id,
    consolidation_code: record.consolidation_code,
    container_truck_id: record.container_truck_id,
    container_type: record.container_type,
    max_volume_capacity: record.max_volume_capacity,
    max_weight_capacity: record.max_weight_capacity,
    carrier_name: record.carrier_name,
    carrier_phone: record.carrier_phone,
    origin_place: record.origin_place,
    destination_place: record.destination_place,
    loaded_date: record.loaded_date,
    departure_date: record.departure_date,
    estimated_arrival_date: record.estimated_arrival_date,
    arrived_date: record.arrived_date,
    total_carrier_cost: record.total_carrier_cost,
    carrier_cost_currency: record.carrier_cost_currency,
    carrier_cost_usd_rate: record.carrier_cost_usd_rate,
    status: record.status,
    description: record.description,
    capacity: {
      max_volume_m3: maxVol,
      assigned_volume_m3: Math.round(totalAssignedVolume * 100) / 100,
      remaining_volume_m3: remainingVol,
      volume_utilization_percent: volUtilPct,
      max_weight_kg: maxWt,
      assigned_weight_kg: Math.round(totalAssignedWeight * 100) / 100,
      remaining_weight_kg: remainingWt,
      weight_utilization_percent: wtUtilPct,
      total_cargos_count: attachedCargos.length,
    },
    financials: {
      total_sell_usd: Math.round(totalSellUsd * 100) / 100,
      total_purchase_usd: Math.round(totalPurchaseUsd * 100) / 100,
      carrier_cost: {
        amount: record.total_carrier_cost,
        currency: record.carrier_cost_currency,
        amount_usd: carrierCostUsd,
      },
      consolidated_net_margin_usd: consolidatedNetMargin,
    },
    cargos: cargoItems,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

function generateConsolidationCode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const count = demoConsolidations.length + 1;
  const seq = String(count).padStart(4, '0');
  return `CNS-${year}${month}-${seq}`;
}

// ---------------------------------------------------------------------------
// Offline Demo Mock Handler for /api/cargo-consolidations
// ---------------------------------------------------------------------------

registerDemoHandler((path: string, options: RequestInit, body: any) => {
  const method = (options.method || 'GET').toUpperCase();
  if (!path.startsWith('/cargo-consolidations') && !path.startsWith('/api/cargo-consolidations')) {
    return null;
  }

  const cleanPath = path.replace('/api/cargo-consolidations', '/cargo-consolidations');
  const urlObj = new URL(cleanPath, 'http://localhost');
  const pathname = urlObj.pathname;

  // 1. GET /cargo-consolidations/active (Dropdown picker endpoint)
  if (pathname === '/cargo-consolidations/active' && method === 'GET') {
    const search = (urlObj.searchParams.get('search') || '').toLowerCase().trim();

    const activeList: ActiveConsolidationOption[] = demoConsolidations
      .filter((rec) => rec.status !== 'Completed')
      .map((rec) => {
        const full = buildConsolidationResponse(rec);
        const cap = full.capacity!;
        const origin = rec.origin_place?.split(',')[0] || rec.origin_place || 'Origin';
        const dest = rec.destination_place?.split(',')[0] || rec.destination_place || 'Dest';
        const label = `${rec.container_truck_id} [${rec.consolidation_code}] - ${cap.assigned_volume_m3}/${cap.max_volume_m3} m³ (${origin} -> ${dest}) • ${rec.status}`;

        return {
          id: rec.id,
          consolidation_code: rec.consolidation_code,
          container_truck_id: rec.container_truck_id,
          container_type: rec.container_type,
          status: rec.status,
          carrier_name: rec.carrier_name,
          origin_place: rec.origin_place,
          destination_place: rec.destination_place,
          departure_date: rec.departure_date || undefined,
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
      })
      .filter((opt) => {
        if (!search) return true;
        return (
          opt.container_truck_id.toLowerCase().includes(search) ||
          opt.consolidation_code.toLowerCase().includes(search) ||
          (opt.carrier_name || '').toLowerCase().includes(search) ||
          (opt.origin_place || '').toLowerCase().includes(search) ||
          (opt.destination_place || '').toLowerCase().includes(search)
        );
      });

    return { handled: true, result: activeList };
  }

  // 2. GET /cargo-consolidations/available-cargos (Cargos ready to attach)
  if (pathname === '/cargo-consolidations/available-cargos' && method === 'GET') {
    const unassigned = demoCargos.filter((c) => !c.consolidation_id);
    return { handled: true, result: unassigned };
  }

  // 3. POST /cargo-consolidations/:id/assign-cargos
  const assignMatch = pathname.match(/^\/cargo-consolidations\/([^/]+)\/assign-cargos$/);
  if (assignMatch && method === 'POST') {
    const id = assignMatch[1];
    const rec = demoConsolidations.find((c) => c.id === id);
    if (!rec) throw makeApiError(path, 404, 'not_found', 'Consolidation trip not found');

    const cargoIds: string[] = body?.cargo_registration_ids || [];
    if (cargoIds.length > 0) {
      demoCargos = demoCargos.map((c) => {
        if (cargoIds.includes(c.id)) {
          return {
            ...c,
            consolidation_id: id,
            status: rec.status === 'Planning' ? c.status : rec.status,
          };
        }
        return c;
      });
      saveStoredMockCargos(demoCargos);

      // Add to record's list
      const set = new Set([...rec.cargo_registration_ids, ...cargoIds]);
      rec.cargo_registration_ids = Array.from(set);
      rec.updated_at = new Date().toISOString();
      saveStoredConsolidations(demoConsolidations);
    }

    return { handled: true, result: buildConsolidationResponse(rec) };
  }

  // 4. POST /cargo-consolidations/:id/remove-cargos
  const removeMatch = pathname.match(/^\/cargo-consolidations\/([^/]+)\/remove-cargos$/);
  if (removeMatch && method === 'POST') {
    const id = removeMatch[1];
    const rec = demoConsolidations.find((c) => c.id === id);
    if (!rec) throw makeApiError(path, 404, 'not_found', 'Consolidation trip not found');

    const cargoIds: string[] = body?.cargo_registration_ids || [];
    if (cargoIds.length > 0) {
      demoCargos = demoCargos.map((c) => {
        if (cargoIds.includes(c.id) && c.consolidation_id === id) {
          return {
            ...c,
            consolidation_id: null,
          };
        }
        return c;
      });
      saveStoredMockCargos(demoCargos);

      rec.cargo_registration_ids = rec.cargo_registration_ids.filter(
        (cId) => !cargoIds.includes(cId)
      );
      rec.updated_at = new Date().toISOString();
      saveStoredConsolidations(demoConsolidations);
    }

    return { handled: true, result: buildConsolidationResponse(rec) };
  }

  // 5. GET /cargo-consolidations/:id
  const singleMatch = pathname.match(/^\/cargo-consolidations\/([^/]+)$/);
  if (singleMatch && method === 'GET') {
    const id = singleMatch[1];
    const rec = demoConsolidations.find((c) => c.id === id);
    if (!rec) throw makeApiError(path, 404, 'not_found', 'Consolidation trip not found');
    return { handled: true, result: buildConsolidationResponse(rec) };
  }

  // 6. PATCH /cargo-consolidations/:id
  if (singleMatch && (method === 'PATCH' || method === 'PUT')) {
    const id = singleMatch[1];
    const idx = demoConsolidations.findIndex((c) => c.id === id);
    if (idx === -1) throw makeApiError(path, 404, 'not_found', 'Consolidation trip not found');

    const current = demoConsolidations[idx];
    const updated: StoredConsolidationRecord = {
      ...current,
      ...body,
      updated_at: new Date().toISOString(),
    };

    demoConsolidations[idx] = updated;
    saveStoredConsolidations(demoConsolidations);

    // Cascading options
    if (body?.sync_status_to_cargos && body?.status) {
      demoCargos = demoCargos.map((c) => {
        if (c.consolidation_id === id) {
          return { ...c, status: body.status };
        }
        return c;
      });
      saveStoredMockCargos(demoCargos);
    }

    if (body?.sync_dates_to_cargos) {
      demoCargos = demoCargos.map((c) => {
        if (c.consolidation_id === id) {
          return {
            ...c,
            loaded_date: body.loaded_date !== undefined ? body.loaded_date : c.loaded_date,
            arrived_date: body.arrived_date !== undefined ? body.arrived_date : c.arrived_date,
            departure_date:
              body.departure_date !== undefined ? body.departure_date : c.departure_date,
          };
        }
        return c;
      });
      saveStoredMockCargos(demoCargos);
    }

    return { handled: true, result: buildConsolidationResponse(updated) };
  }

  // 7. DELETE /cargo-consolidations/:id
  if (singleMatch && method === 'DELETE') {
    const id = singleMatch[1];
    const idx = demoConsolidations.findIndex((c) => c.id === id);
    if (idx === -1) throw makeApiError(path, 404, 'not_found', 'Consolidation trip not found');

    demoConsolidations.splice(idx, 1);
    saveStoredConsolidations(demoConsolidations);

    // Detach all child cargos safely
    demoCargos = demoCargos.map((c) => {
      if (c.consolidation_id === id) {
        return { ...c, consolidation_id: null };
      }
      return c;
    });
    saveStoredMockCargos(demoCargos);

    return {
      handled: true,
      result: { success: true, message: 'Consolidation trip deleted successfully' },
    };
  }

  // 8. POST /cargo-consolidations (Create)
  if (pathname === '/cargo-consolidations' && method === 'POST') {
    const code = body.consolidation_code?.trim() || generateConsolidationCode();
    const newId = `cns-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newRecord: StoredConsolidationRecord = {
      id: newId,
      consolidation_code: code,
      container_truck_id: body.container_truck_id,
      container_type: body.container_type || '86m3',
      max_volume_capacity: body.max_volume_capacity || 86.0,
      max_weight_capacity: body.max_weight_capacity || 22000.0,
      carrier_name: body.carrier_name || '',
      carrier_phone: body.carrier_phone || '',
      origin_place: body.origin_place || '',
      destination_place: body.destination_place || '',
      loaded_date: body.loaded_date || null,
      departure_date: body.departure_date || null,
      estimated_arrival_date: body.estimated_arrival_date || null,
      arrived_date: body.arrived_date || null,
      total_carrier_cost: Number(body.total_carrier_cost) || 0,
      carrier_cost_currency: body.carrier_cost_currency || 'USD',
      carrier_cost_usd_rate: body.carrier_cost_usd_rate || 1.0,
      status: body.status || 'Planning',
      description: body.description || '',
      cargo_registration_ids: body.cargo_registration_ids || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    demoConsolidations.unshift(newRecord);
    saveStoredConsolidations(demoConsolidations);

    // Link assigned cargos
    if (newRecord.cargo_registration_ids.length > 0) {
      demoCargos = demoCargos.map((c) => {
        if (newRecord.cargo_registration_ids.includes(c.id)) {
          return {
            ...c,
            consolidation_id: newId,
            status: newRecord.status === 'Planning' ? c.status : newRecord.status,
          };
        }
        return c;
      });
      saveStoredMockCargos(demoCargos);
    }

    return { handled: true, result: buildConsolidationResponse(newRecord) };
  }

  // 9. GET /cargo-consolidations (List, paginated, filtered)
  if (pathname === '/cargo-consolidations' && method === 'GET') {
    const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
    const limit = parseInt(urlObj.searchParams.get('limit') || '12', 10);
    const offset = (page - 1) * limit;

    const search = (urlObj.searchParams.get('search') || '').toLowerCase().trim();
    const status = urlObj.searchParams.get('status');
    const origin = (urlObj.searchParams.get('origin_place') || '').toLowerCase().trim();
    const dest = (urlObj.searchParams.get('destination_place') || '').toLowerCase().trim();
    const carrier = (urlObj.searchParams.get('carrier_name') || '').toLowerCase().trim();
    const depStart = urlObj.searchParams.get('departure_start_date');
    const depEnd = urlObj.searchParams.get('departure_end_date');
    const arrStart = urlObj.searchParams.get('arrived_start_date');
    const arrEnd = urlObj.searchParams.get('arrived_end_date');
    const sortBy = urlObj.searchParams.get('sort_by');
    const sortOrder = (urlObj.searchParams.get('sort_order') || 'DESC').toUpperCase();

    let allFull = demoConsolidations.map((rec) => buildConsolidationResponse(rec));

    if (search) {
      allFull = allFull.filter(
        (c) =>
          c.consolidation_code.toLowerCase().includes(search) ||
          c.container_truck_id.toLowerCase().includes(search) ||
          (c.carrier_name || '').toLowerCase().includes(search) ||
          (c.carrier_phone || '').toLowerCase().includes(search) ||
          (c.origin_place || '').toLowerCase().includes(search) ||
          (c.destination_place || '').toLowerCase().includes(search) ||
          (c.description || '').toLowerCase().includes(search)
      );
    }

    if (status && status !== 'all') {
      allFull = allFull.filter((c) => c.status.toLowerCase() === status.toLowerCase());
    }

    if (origin) {
      allFull = allFull.filter((c) => (c.origin_place || '').toLowerCase().includes(origin));
    }

    if (dest) {
      allFull = allFull.filter((c) => (c.destination_place || '').toLowerCase().includes(dest));
    }

    if (carrier) {
      allFull = allFull.filter((c) => (c.carrier_name || '').toLowerCase().includes(carrier));
    }

    if (depStart) {
      allFull = allFull.filter((c) => c.departure_date && c.departure_date >= depStart);
    }
    if (depEnd) {
      allFull = allFull.filter((c) => c.departure_date && c.departure_date <= depEnd);
    }

    if (arrStart) {
      allFull = allFull.filter((c) => c.arrived_date && c.arrived_date >= arrStart);
    }
    if (arrEnd) {
      allFull = allFull.filter((c) => c.arrived_date && c.arrived_date <= arrEnd);
    }

    // Sorting
    if (sortBy) {
      allFull.sort((a, b) => {
        let valA: any = (a as any)[sortBy];
        let valB: any = (b as any)[sortBy];

        if (sortBy === 'utilization') {
          valA = a.capacity?.volume_utilization_percent || 0;
          valB = b.capacity?.volume_utilization_percent || 0;
        } else if (sortBy === 'margin') {
          valA = a.financials?.consolidated_net_margin_usd || 0;
          valB = b.financials?.consolidated_net_margin_usd || 0;
        }

        if (valA < valB) return sortOrder === 'ASC' ? -1 : 1;
        if (valA > valB) return sortOrder === 'ASC' ? 1 : -1;
        return 0;
      });
    }

    // Aggregates for header KPI
    let totalMargin = 0;
    let totalVol = 0;
    let totalWt = 0;
    let activeTrucks = 0;
    let totalVolUtilSum = 0;

    allFull.forEach((c) => {
      totalMargin += c.financials?.consolidated_net_margin_usd || 0;
      totalVol += c.capacity?.assigned_volume_m3 || 0;
      totalWt += c.capacity?.assigned_weight_kg || 0;
      totalVolUtilSum += c.capacity?.volume_utilization_percent || 0;
      if (c.status !== 'Completed') {
        activeTrucks += 1;
      }
    });

    const avgVolUtil =
      allFull.length > 0 ? Math.round((totalVolUtilSum / allFull.length) * 10) / 10 : 0;
    const paginated = allFull.slice(offset, offset + limit);

    const res: ConsolidationPaginatedResponse = {
      meta: {
        total: allFull.length,
        limit,
        offset,
        total_margin_usd: Math.round(totalMargin * 100) / 100,
        total_volume_m3: Math.round(totalVol * 100) / 100,
        total_weight_kg: Math.round(totalWt * 100) / 100,
        active_trucks: activeTrucks,
        avg_volume_utilization: avgVolUtil,
      },
      data: paginated,
    };

    return { handled: true, result: res };
  }

  return null;
});

// ---------------------------------------------------------------------------
// Cargo Consolidations API Client
// ---------------------------------------------------------------------------

export const cargoConsolidationsApi = {
  /**
   * Get all cargo consolidations with pagination, search, status, and route filters
   */
  getAll: (params?: ConsolidationListParams): Promise<ConsolidationPaginatedResponse> => {
    const q = new URLSearchParams();
    if (params) {
      if (params.page !== undefined) q.append('page', String(params.page));
      if (params.limit !== undefined) q.append('limit', String(params.limit));
      if (params.search) q.append('search', params.search);
      if (params.status && params.status !== 'all') q.append('status', params.status);
      if (params.origin_place) q.append('origin_place', params.origin_place);
      if (params.destination_place) q.append('destination_place', params.destination_place);
      if (params.carrier_name) q.append('carrier_name', params.carrier_name);
      if (params.departure_start_date)
        q.append('departure_start_date', params.departure_start_date);
      if (params.departure_end_date) q.append('departure_end_date', params.departure_end_date);
      if (params.arrived_start_date) q.append('arrived_start_date', params.arrived_start_date);
      if (params.arrived_end_date) q.append('arrived_end_date', params.arrived_end_date);
      if (params.sort_by) q.append('sort_by', params.sort_by);
      if (params.sort_order) q.append('sort_order', params.sort_order);
    }
    const queryStr = q.toString();
    return request<ConsolidationPaginatedResponse>(
      `/cargo-consolidations${queryStr ? `?${queryStr}` : ''}`,
      { method: 'GET' }
    );
  },

  /**
   * Active consolidations for search-or-create autocomplete dropdown
   */
  getActive: (search?: string): Promise<ActiveConsolidationOption[]> => {
    const q = new URLSearchParams();
    if (search) q.append('search', search);
    const queryStr = q.toString();
    return request<ActiveConsolidationOption[]>(
      `/cargo-consolidations/active${queryStr ? `?${queryStr}` : ''}`,
      { method: 'GET' }
    );
  },

  /**
   * Get unassigned LTL cargos ready for consolidation
   */
  getAvailableCargos: (): Promise<MockCargoRecord[]> => {
    return request<MockCargoRecord[]>('/cargo-consolidations/available-cargos', {
      method: 'GET',
    });
  },

  /**
   * Get single consolidation trip with attached cargo registrations
   */
  getById: (id: string): Promise<CargoConsolidation> => {
    return request<CargoConsolidation>(`/cargo-consolidations/${id}`, { method: 'GET' });
  },

  /**
   * Create a new consolidation truck trip
   */
  create: (dto: CreateConsolidationDto): Promise<CargoConsolidation> => {
    return request<CargoConsolidation>('/cargo-consolidations', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Update an existing consolidation truck trip
   */
  update: (id: string, dto: UpdateConsolidationDto): Promise<CargoConsolidation> => {
    return request<CargoConsolidation>(`/cargo-consolidations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Delete a consolidation truck trip
   */
  delete: (id: string): Promise<{ success: boolean; message?: string }> => {
    return request<{ success: boolean; message?: string }>(`/cargo-consolidations/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Batch assign cargo registrations to consolidation
   */
  assignCargos: (id: string, cargo_registration_ids: string[]): Promise<CargoConsolidation> => {
    return request<CargoConsolidation>(`/cargo-consolidations/${id}/assign-cargos`, {
      method: 'POST',
      body: JSON.stringify({ cargo_registration_ids }),
    });
  },

  /**
   * Batch remove cargo registrations from consolidation
   */
  removeCargos: (id: string, cargo_registration_ids: string[]): Promise<CargoConsolidation> => {
    return request<CargoConsolidation>(`/cargo-consolidations/${id}/remove-cargos`, {
      method: 'POST',
      body: JSON.stringify({ cargo_registration_ids }),
    });
  },
};
