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

export type CargoRegistrationStatus =
  'Waiting' | 'In Transit' | 'Border' | 'At Station' | 'Delivered';

export type CurrencyType = 'UZS' | 'RUB' | 'USD' | 'RMB';

export interface CreateCargoRegistrationDto {
  cargo_type: CargoType;
  volume?: number;
  weight?: number;
  container_type?: ContainerType | string;
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
  status?: CargoRegistrationStatus;
  description?: string;
  client_id: string;
  employee_id?: string;
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
  client_id?: string;
  employee_id?: string;
  confirmed_start_date?: string;
  confirmed_end_date?: string;
  loaded_start_date?: string;
  loaded_end_date?: string;
  arrived_start_date?: string;
  arrived_end_date?: string;
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
  container_truck_id: string;
  agent_name: string;
  client_full_name: string;
  cargo: string;
  usd_rmb_rate?: number | null;
  employee_full_name: string;
  purchase_price: CargoRegistrationPriceAmount;
  sell_price: CargoRegistrationPriceAmount;
  net_yield: CargoRegistrationNetYield;
  status: CargoRegistrationStatus;
  description?: string | null;
  client_id?: string;
  employee_id?: string;
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
  container_truck_id: string;
  agent_name: string;
  cargo: string;
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
  client_id: string;
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
  container_truck_id: string;
  agent_name: string;
  cargo: string;
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
  client_id: string;
  employee_id: string;
  created_at: string;
  updated_at: string;
}

// Initial demo seeds matching documentation examples
const INITIAL_DEMO_RECORDS: InternalCargoRegistrationRecord[] = [
  {
    id: '7a06df8a-384c-4c8d-9932-57db348a3451',
    cargo_type: 'FTL',
    volume: null,
    weight: null,
    container_type: '40HQ',
    container_truck_id: 'TRK-6447',
    agent_name: 'SilkRoad Express',
    cargo: 'General Goods',
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
    status: 'In Transit',
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
    status: 'In Transit',
    description: 'High efficiency photovoltaic modules',
    client_id: 'c-client-2',
    employee_id: '2b78a1c9-34e5-4a1d-91b2-c8d9e0f1a2b3',
    created_at: '2026-08-04T09:30:00.000Z',
    updated_at: '2026-08-04T09:30:00.000Z',
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
    const clientId = urlObj.searchParams.get('client_id');
    const employeeId = urlObj.searchParams.get('employee_id');

    const confirmedStart = urlObj.searchParams.get('confirmed_start_date');
    const confirmedEnd = urlObj.searchParams.get('confirmed_end_date');
    const loadedStart = urlObj.searchParams.get('loaded_start_date');
    const loadedEnd = urlObj.searchParams.get('loaded_end_date');
    const arrivedStart = urlObj.searchParams.get('arrived_start_date');
    const arrivedEnd = urlObj.searchParams.get('arrived_end_date');

    let filtered = [...demoRecords];

    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.container_truck_id.toLowerCase().includes(search) ||
          r.cargo.toLowerCase().includes(search) ||
          r.agent_name.toLowerCase().includes(search)
      );
    }
    if (status) {
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
    if (clientId) {
      filtered = filtered.filter((r) => r.client_id === clientId);
    }
    if (employeeId) {
      filtered = filtered.filter((r) => r.employee_id === employeeId);
    }
    if (confirmedStart) {
      filtered = filtered.filter((r) => r.confirmed_date && r.confirmed_date >= confirmedStart);
    }
    if (confirmedEnd) {
      filtered = filtered.filter((r) => r.confirmed_date && r.confirmed_date <= confirmedEnd);
    }
    if (loadedStart) {
      filtered = filtered.filter((r) => r.loaded_date && r.loaded_date >= loadedStart);
    }
    if (loadedEnd) {
      filtered = filtered.filter((r) => r.loaded_date && r.loaded_date <= loadedEnd);
    }
    if (arrivedStart) {
      filtered = filtered.filter((r) => r.arrived_date && r.arrived_date >= arrivedStart);
    }
    if (arrivedEnd) {
      filtered = filtered.filter((r) => r.arrived_date && r.arrived_date <= arrivedEnd);
    }

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

      return {
        id: r.id,
        cargo_type: r.cargo_type,
        container_truck_id: r.container_truck_id,
        agent_name: r.agent_name,
        client_full_name: clientName,
        cargo: r.cargo,
        usd_rmb_rate: r.usd_rmb_rate,
        employee_full_name: empName,
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
        status: r.status,
        description: r.description,
        client_id: r.client_id,
        employee_id: r.employee_id,
        confirmed_date: r.confirmed_date,
        loaded_date: r.loaded_date,
        arrived_date: r.arrived_date,
        created_at: r.created_at,
        updated_at: r.updated_at,
      };
    });

    const response: CargoRegistrationPaginatedResponse = {
      meta: {
        total,
        limit,
        offset,
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
      status: 'In Transit' as CargoRegistrationStatus,
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

    const detail: CargoRegistrationDetail = {
      id: found.id,
      cargo_type: found.cargo_type,
      volume: found.volume,
      weight: found.weight,
      container_type: found.container_type as ContainerType | null,
      container_truck_id: found.container_truck_id,
      agent_name: found.agent_name,
      cargo: found.cargo,
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
      container_truck_id,
      agent_name,
      cargo,
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
      client_id,
      employee_id,
    } = body || {};

    if (!cargo_type || (cargo_type !== 'LTL' && cargo_type !== 'FTL')) {
      throw makeApiError(path, 400, 'invalid_cargo_type', 'cargo_type must be LTL or FTL');
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
      container_truck_id: String(container_truck_id).trim(),
      agent_name: String(agent_name || '').trim(),
      cargo: String(cargo || '').trim(),
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
    if (params?.client_id) searchParams.set('client_id', params.client_id);
    if (params?.employee_id) searchParams.set('employee_id', params.employee_id);

    if (params?.confirmed_start_date)
      searchParams.set('confirmed_start_date', params.confirmed_start_date);
    if (params?.confirmed_end_date)
      searchParams.set('confirmed_end_date', params.confirmed_end_date);
    if (params?.loaded_start_date) searchParams.set('loaded_start_date', params.loaded_start_date);
    if (params?.loaded_end_date) searchParams.set('loaded_end_date', params.loaded_end_date);
    if (params?.arrived_start_date)
      searchParams.set('arrived_start_date', params.arrived_start_date);
    if (params?.arrived_end_date) searchParams.set('arrived_end_date', params.arrived_end_date);

    const query = searchParams.toString();
    return request<CargoRegistrationPaginatedResponse>(
      `/cargo-registrations${query ? `?${query}` : ''}`,
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
};
