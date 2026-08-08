import { request, requestNoContent, registerDemoHandler, makeApiError } from './httpClient';
import type { SupportedCurrency } from '../types/currency';
import { demoEmployeesDb, demoDepartmentsDb, employeesApi } from './employees.service';
import { demoClientsDb } from './clients.service';
import { cargoRegistrationsApi } from './cargoRegistrations.service';

// ---------------------------------------------------------------------------
// Interfaces & Types
// ---------------------------------------------------------------------------

// 1. LTL Calculator
export interface LtlCalculateDto {
  volume: number;
  weight: number;
}

export interface LtlCalculateResult {
  volume: number;
  weight: number;
  density: number;
  basis: 'hajm' | 'vazn' | string;
  rate: number;
  unit: string;
  total_price: number;
}

// 2. LTL KPI Module
export type LtlCargoType = 'lyustra' | 'oddiy' | 'pod_klyuch' | 'pod-klyuch' | string;

export interface LtlCargoItem {
  id: string;
  employee_id?: string | null;
  employee_name: string;
  volume: number;
  weight: number;
  cargo_type: LtlCargoType;
  density: number;
  base_rate: number;
  base_kpi: number;
  created_at: string;
  updated_at?: string;
}

export interface LtlEmployeeSummary {
  employee_id?: string | null;
  employee_name: string;
  total_volume: number;
  total_weight: number;
  total_base_kpi: number;
  volume_coefficient: number;
  volume_coefficient_percentage: string;
  final_ltl_kpi: number;
  items: LtlCargoItem[];
}

export interface LtlItemsResponse {
  total_items: number;
  employees: LtlEmployeeSummary[];
}

export interface CreateLtlItemDto {
  employee_id: string;
  volume: number;
  weight: number;
  cargo_type: LtlCargoType;
}

export interface UpdateLtlItemDto extends Partial<CreateLtlItemDto> {}

// 3. FTL KPI Module
export interface FtlTruckItem {
  id: string;
  manager_id?: string | null;
  manager_name: string;
  month: string; // YYYY-MM
  agent_price: number;
  sell_price: number;
  profit: number;
  planned_days: number;
  actual_days: number;
  day_difference: number;
  time_multiplier: number;
  time_multiplier_percentage?: string;
  kpi_received: boolean;
  kpi_amount?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FtlManagerSummary {
  manager_id?: string | null;
  manager_name: string;
  month: string;
  truck_count: number;
  total_agent_price: number;
  total_sell_price: number;
  total_profit: number;
  monthly_rate: number;
  monthly_rate_percentage: string;
  total_ftl_kpi: number;
  received_ftl_kpi: number;
  pending_ftl_kpi: number;
  items: FtlTruckItem[];
}

export interface FtlSummaryResponse {
  month: string;
  total_trucks: number;
  total_profit: number;
  total_ftl_kpi: number;
  managers: FtlManagerSummary[];
}

export interface CreateFtlItemDto {
  manager_id: string;
  month: string; // YYYY-MM
  agent_price: number;
  sell_price: number;
  planned_days: number;
  actual_days: number;
  kpi_received?: boolean;
  qty?: number;
}

export interface UpdateFtlItemDto extends Partial<CreateFtlItemDto> {}

// 4. ROP KPI Module
export interface RopWorkerShare {
  employee_name: string;
  base_kpi: number;
  worker_1pct_kpi: number;
}

export interface RopSummaryResponse {
  month?: string;
  total_ltl_profit: number;
  worker_1pct_total: number;
  workers_breakdown?: RopWorkerShare[];
  team_bonus_profit: number;
  team_bonus_rate: number;
  team_bonus_percentage: string;
  team_bonus_amount: number;
  truck_count: number;
  truck_rate: number;
  truck_rate_percentage: string;
  truck_kpi_amount: number;
  rop_total_kpi: number;
}

// 5. SEO KPI Module
export interface SeoCalculateDto {
  net_profit: number;
}

export interface SeoCalculateResult {
  net_profit: number;
  seo_rate: number;
  seo_rate_percentage: string;
  seo_kpi: number;
}

// 6. Employee Plans & Progress
export interface EmployeePlanProgress {
  id: string;
  employee_id: string;
  employee_name: string;
  department_id?: string | null;
  department_name?: string | null;
  month: string; // YYYY-MM
  target_sales: number;
  currency?: SupportedCurrency;
  actual_sales: number;
  remaining_target: number;
  completion_percentage: number;
  rank?: number;
  status: 'on_track' | 'ahead' | 'behind' | 'completed' | string;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeePlansResponse {
  month: string;
  total_target: number;
  total_actual: number;
  overall_completion_percentage: number;
  plans: EmployeePlanProgress[];
}

export interface CreateEmployeePlanDto {
  employee_id: string;
  department_id?: string;
  period?: string;
  month?: string;
  target_amount?: number;
  target_sales?: number;
  currency?: SupportedCurrency;
}

export interface UpdateEmployeePlanDto extends Partial<CreateEmployeePlanDto> {}

// Standardized Response Envelope Meta Interface
export interface ResponseMeta {
  total: number;
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
  status_counts?: Record<string, number>;
  column_counts?: Record<string, number>;
}

// 7. Cargo Transactions Ledger
export interface CargoTransaction {
  id: string;
  employee_id: string;
  employee_name: string;
  department_id?: string | null;
  department_name?: string | null;
  client_id?: string | null;
  client_name?: string | null;
  client_company?: string | null;
  cargo_title: string;
  buy_price: number;
  sell_price: number;
  currency?: SupportedCurrency;
  margin: number;
  kpi_percentage: number;
  kpi_bonus: number;
  status?: ShipmentStatus | string;
  description?: string;
  transaction_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface CargoTransactionListParams {
  page?: number;
  limit?: number;
  employee_id?: string;
  department_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  status?: ShipmentStatus | string;
  statuses?: (ShipmentStatus | string)[];
}

export interface CargoTransactionPaginatedResponse {
  meta?: ResponseMeta;
  data: CargoTransaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary?: {
    total_margin: number;
    total_kpi_bonus: number;
    total_sell_price: number;
  };
}

export interface ViewableStatusGroupMetrics {
  total_transactions: number;
  loaded_transactions: number;
  total_sell_price?: number;
  total_buy_price?: number;
  total_margin?: number;
  total_kpi_bonus?: number;
}

export interface ViewableStatusGroup {
  metrics: ViewableStatusGroupMetrics;
  transactions: CargoTransaction[];
}

export interface ViewableTransactionsResponse {
  meta?: ResponseMeta;
  data: Record<string, ViewableStatusGroup>;
}

export interface CreateCargoTransactionDto {
  employee_id: string;
  department_id: string;
  client_id?: string;
  cargo_title?: string;
  description?: string;
  buy_price: number;
  sell_price: number;
  currency?: SupportedCurrency;
  status?: ShipmentStatus;
  kpi_percentage?: number;
  transaction_date: string;
}

// 8. Container & Truck Shipment Tracking Module
export type ShipmentStatus = 'In Transit' | 'At Station' | 'Border' | 'Delivered' | 'Waiting';

export interface Shipment {
  id: string;
  containerNo: string;
  clientId?: string;
  clientName: string;
  cargoType: string;
  confirmedDate: string;
  loadedDate: string;
  arrivedDate: string;
  rmbRate: number;
  agentName: string;
  buyCost: number;
  sellPrice: number;
  profit: number;
  status: ShipmentStatus;
  buyCostCurrency?: 'RMB' | 'USD';
  created_at?: string;
  updated_at?: string;
}

export interface CreateShipmentDto {
  containerNo?: string;
  clientId?: string;
  clientName?: string;
  cargoType?: string;
  confirmedDate?: string;
  loadedDate?: string;
  arrivedDate?: string;
  rmbRate?: number;
  agentName?: string;
  buyCost?: number;
  sellPrice?: number;
  status?: ShipmentStatus;
  buyCostCurrency?: 'RMB' | 'USD';
  employee_id?: string;
  department_id?: string;
  description?: string;
}

export interface UpdateShipmentDto extends Partial<CreateShipmentDto> {}

export interface ShipmentsSummaryResponse {
  shipments: Shipment[];
  total_active_shipments: number;
  total_net_margin: number;
  current_rmb_rate: number;
  meta?: ResponseMeta;
  status_counts?: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Utility Helper Functions for Calculations
// ---------------------------------------------------------------------------

export function calculateLtlPrice(volume: number, weight: number): LtlCalculateResult {
  const v = Math.max(0, volume);
  const w = Math.max(0, weight);
  const density = v > 0 ? w / v : 0;

  let basis: 'hajm' | 'vazn' = 'hajm';
  let rate = 0;
  let unit = 'USD/m3';
  let totalPrice = 0;

  if (density > 1000) {
    basis = 'vazn';
    rate = 0.3;
    unit = 'USD/kg';
    totalPrice = w * rate;
  } else if (density > 700) {
    basis = 'vazn';
    rate = 0.4;
    unit = 'USD/kg';
    totalPrice = w * rate;
  } else if (density <= 100) {
    basis = 'hajm';
    rate = 100;
    unit = 'USD/m3';
    totalPrice = v * rate;
  } else if (density <= 200) {
    basis = 'hajm';
    rate = 110;
    unit = 'USD/m3';
    totalPrice = v * rate;
  } else if (density <= 300) {
    basis = 'hajm';
    rate = 130;
    unit = 'USD/m3';
    totalPrice = v * rate;
  } else if (density <= 400) {
    basis = 'hajm';
    rate = 140;
    unit = 'USD/m3';
    totalPrice = v * rate;
  } else if (density <= 500) {
    basis = 'hajm';
    rate = 160;
    unit = 'USD/m3';
    totalPrice = v * rate;
  } else {
    basis = 'hajm';
    rate = 180;
    unit = 'USD/m3';
    totalPrice = v * rate;
  }

  return {
    volume: v,
    weight: w,
    density: Math.round(density * 100) / 100,
    basis,
    rate,
    unit,
    total_price: Math.round(totalPrice * 100) / 100,
  };
}

export function calculateLtlItemBaseRate(density: number, cargoType: string): number {
  const normType = cargoType.toLowerCase().replace('-', '_').trim();
  if (normType === 'lyustra') {
    return 3;
  }

  let oddiyRate = 3;
  if (density <= 100) oddiyRate = 3;
  else if (density <= 200) oddiyRate = 4;
  else if (density <= 300) oddiyRate = 5;
  else if (density <= 400) oddiyRate = 6;
  else if (density <= 500) oddiyRate = 7;
  else if (density <= 700) oddiyRate = 8;
  else if (density <= 1000) oddiyRate = 9;
  else oddiyRate = 10;

  if (normType === 'pod_klyuch' || normType === 'pod klyuch') {
    return oddiyRate + 5;
  }

  return oddiyRate;
}

export function getVolumeCoefficient(totalVolume: number): number {
  if (totalVolume < 21) return 0.0;
  if (totalVolume <= 40) return 0.5;
  if (totalVolume <= 60) return 0.8;
  if (totalVolume <= 74) return 0.9;
  if (totalVolume <= 80) return 1.0;
  return 1.2;
}

export function getFtlMonthlyRate(totalProfit: number): number {
  if (totalProfit < 1500) return 0;
  if (totalProfit < 4000) return 0.08;
  if (totalProfit < 5000) return 0.1;
  if (totalProfit < 6000) return 0.12;
  if (totalProfit < 7000) return 0.14;
  if (totalProfit < 8000) return 0.16;
  if (totalProfit < 10000) return 0.18;
  return 0.24;
}

export function getFtlTimeMultiplier(actualDays: number, plannedDays: number): number {
  const y = actualDays;
  const diff = y - plannedDays;

  if (y <= 5) return 1.1;
  if (diff <= 2) return 1.0;
  if (diff <= 10) return 0.9;
  if (diff <= 15) return 0.85;
  if (diff <= 20) return 0.75;
  return 0.5;
}

export function getRopTeamBonusRate(totalLtlProfit: number): number {
  if (totalLtlProfit < 25000) return 0;
  if (totalLtlProfit < 30000) return 0.02;
  if (totalLtlProfit < 35000) return 0.025;
  if (totalLtlProfit < 40000) return 0.03;
  if (totalLtlProfit < 45000) return 0.045;
  if (totalLtlProfit < 55000) return 0.06;
  return 0.07;
}

export function getRopTruckRate(truckCount: number): number {
  if (truckCount === 0) return 0;
  if (truckCount <= 2) return 0.01;
  if (truckCount <= 5) return 0.015;
  if (truckCount <= 9) return 0.02;
  return 0.025;
}

export function calculateSeoKpi(netProfit: number): SeoCalculateResult {
  const profit = Math.max(0, netProfit);
  const seoRate = 0.1;
  const seoKpi = profit * seoRate;
  return {
    net_profit: profit,
    seo_rate: seoRate,
    seo_rate_percentage: '10%',
    seo_kpi: Math.round(seoKpi * 100) / 100,
  };
}

export function parseShipmentContainerAndCargo(
  rawContainerNo?: string,
  rawCargoType?: string,
  description?: string
): { containerNo: string; cargoType: string } {
  let inputStr = rawContainerNo || '';
  if (!inputStr || inputStr.toLowerCase().startsWith('container:') || inputStr.length > 25) {
    inputStr = description || inputStr;
  }

  let cleaned = (inputStr || '').replace(/(?:Container:\s*)+/gi, '').trim();

  let containerNo = cleaned;
  let cargoType = rawCargoType && rawCargoType !== 'General Cargo' ? rawCargoType : '';

  if (cleaned.includes(' - ')) {
    const parts = cleaned
      .split(' - ')
      .map((p) => p.trim())
      .filter(Boolean);
    containerNo = parts[0] || 'CONT-000';
    if (!cargoType && parts.length > 1) {
      cargoType = parts.slice(1).join(' - ');
    }
  }

  if (cargoType) {
    const uniqueCargoParts = Array.from(new Set(cargoType.split(' - ').map((p) => p.trim())));
    cargoType = uniqueCargoParts.join(' - ');
  }

  containerNo = containerNo.replace(/^Container:\s*/gi, '').trim();
  if (!containerNo) containerNo = 'CONT-000';

  return {
    containerNo,
    cargoType: cargoType || 'General Cargo',
  };
}

export function calculateShipmentProfit(
  buyCost: number,
  sellPrice: number,
  rmbRate: number,
  buyCostCurrency: 'RMB' | 'USD' = 'RMB'
): number {
  const bc = Math.max(0, buyCost);
  const sp = Math.max(0, sellPrice);
  const rate = rmbRate > 0 ? rmbRate : 7.25;

  let buyCostUSD = bc;
  if (buyCostCurrency === 'RMB') {
    buyCostUSD = bc / rate;
  }

  return Math.round((sp - buyCostUSD) * 100) / 100;
}

const INITIAL_DEMO_SHIPMENTS: Shipment[] = [
  {
    id: 'shp-1',
    containerNo: 'TCNU-882910-4',
    clientName: 'Silk Road Logistics Inc',
    cargoType: 'Industrial Machinery & Electronics',
    confirmedDate: '2026-07-01',
    loadedDate: '2026-07-05',
    arrivedDate: '2026-07-28',
    rmbRate: 7.25,
    agentName: 'Guangzhou Freight Co',
    buyCost: 32500,
    sellPrice: 9200,
    profit: 4717.24,
    status: 'In Transit',
    buyCostCurrency: 'RMB',
    created_at: '2026-07-01T10:00:00.000Z',
  },
  {
    id: 'shp-2',
    containerNo: 'TRK-904-UZ',
    clientName: 'Asia Auto Parts LLC',
    cargoType: 'Automotive Spare Parts',
    confirmedDate: '2026-07-10',
    loadedDate: '2026-07-12',
    arrivedDate: '2026-07-22',
    rmbRate: 7.25,
    agentName: 'Yiwu Express Ltd',
    buyCost: 18000,
    sellPrice: 4800,
    profit: 2317.24,
    status: 'Border',
    buyCostCurrency: 'RMB',
    created_at: '2026-07-10T08:00:00.000Z',
  },
  {
    id: 'shp-3',
    containerNo: 'MSKU-441209-1',
    clientName: 'Orient Home & Decor',
    cargoType: 'Furniture & Home Textiles',
    confirmedDate: '2026-06-20',
    loadedDate: '2026-06-25',
    arrivedDate: '2026-07-15',
    rmbRate: 7.22,
    agentName: 'Ningbo Port Agents',
    buyCost: 45000,
    sellPrice: 11500,
    profit: 5267.31,
    status: 'Delivered',
    buyCostCurrency: 'RMB',
    created_at: '2026-06-20T12:00:00.000Z',
  },
  {
    id: 'shp-4',
    containerNo: 'TRK-512-CN',
    clientName: 'Samarkand Solar Tech',
    cargoType: 'Solar Panels & Inverters',
    confirmedDate: '2026-07-18',
    loadedDate: '2026-07-20',
    arrivedDate: '2026-08-05',
    rmbRate: 7.25,
    agentName: 'Shenzhen Trans Lines',
    buyCost: 28000,
    sellPrice: 7900,
    profit: 4037.93,
    status: 'At Station',
    buyCostCurrency: 'RMB',
    created_at: '2026-07-18T14:00:00.000Z',
  },
  {
    id: 'shp-5',
    containerNo: 'CMAU-109283-9',
    clientName: 'Tashkent Retail Group',
    cargoType: 'Consumer Electronics & Accessories',
    confirmedDate: '2026-07-22',
    loadedDate: '',
    arrivedDate: '',
    rmbRate: 7.25,
    agentName: 'Foshan Logistics Co',
    buyCost: 15000,
    sellPrice: 3800,
    profit: 1731.03,
    status: 'Waiting',
    buyCostCurrency: 'RMB',
    created_at: '2026-07-22T09:00:00.000Z',
  },
];

function getStoredDemoShipments(): Shipment[] {
  try {
    const raw =
      typeof window !== 'undefined' ? localStorage.getItem('yaqeen_demo_shipments') : null;
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return [...INITIAL_DEMO_SHIPMENTS];
}

function saveStoredDemoShipments(items: Shipment[]) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('yaqeen_demo_shipments', JSON.stringify(items));
    }
  } catch {
    // Ignore
  }
}

let demoShipments: Shipment[] = getStoredDemoShipments();

// ---------------------------------------------------------------------------
// Dedicated Offline / Demo Mock Database & Handlers
// ---------------------------------------------------------------------------

let demoLtlItems: LtlCargoItem[] = [
  {
    id: 'ltl-item-1',
    employee_id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
    employee_name: 'Jasur Yoldoshev',
    volume: 50,
    weight: 5000,
    cargo_type: 'oddiy',
    density: 100,
    base_rate: 3,
    base_kpi: 150,
    created_at: '2026-07-21T10:00:00.000Z',
  },
];

let demoFtlItems: FtlTruckItem[] = [
  {
    id: 'ftl-item-1',
    manager_name: 'Jasur',
    month: '2026-07',
    agent_price: 1000,
    sell_price: 2000,
    profit: 1000,
    planned_days: 20,
    actual_days: 25,
    day_difference: 5,
    time_multiplier: 0.9,
    time_multiplier_percentage: '90%',
    kpi_received: false,
    created_at: '2026-07-21T10:00:00.000Z',
  },
  {
    id: 'ftl-item-2',
    manager_name: 'Sardor',
    month: '2026-07',
    agent_price: 1500,
    sell_price: 3500,
    profit: 2000,
    planned_days: 15,
    actual_days: 16,
    day_difference: 1,
    time_multiplier: 1.0,
    time_multiplier_percentage: '100%',
    kpi_received: true,
    created_at: '2026-07-21T11:00:00.000Z',
  },
];

let demoEmployeePlans: EmployeePlanProgress[] = [
  {
    id: 'plan-1',
    employee_id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
    employee_name: 'Jasur Yoldoshev',
    department_id: 'dep-sales',
    department_name: 'Sales HQ',
    month: '2026-07',
    target_sales: 50000,
    currency: 'USD',
    actual_sales: 35000,
    remaining_target: 15000,
    completion_percentage: 70,
    rank: 1,
    status: 'on_track',
    created_at: '2026-07-01T00:00:00.000Z',
  },
  {
    id: 'plan-2',
    employee_id: '2b78a1c9-34e5-4a1d-91b2-c8d9e0f1a2b3',
    employee_name: 'Rustam Rasulov',
    department_id: 'dep-sales',
    department_name: 'Sales HQ',
    month: '2026-07',
    target_sales: 40000,
    currency: 'USD',
    actual_sales: 28000,
    remaining_target: 12000,
    completion_percentage: 70,
    rank: 2,
    status: 'on_track',
    created_at: '2026-07-01T00:00:00.000Z',
  },
];

let demoTransactions: CargoTransaction[] = [
  {
    id: 'tx-1',
    employee_id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
    employee_name: 'Jasur Yoldoshev',
    department_id: 'dep-sales',
    department_name: 'Sales HQ',
    client_id: 'c-client-1',
    client_name: 'Global Cargo Logistics LLC',
    cargo_title: 'Textile Equipment (50 m³)',
    buy_price: 15000,
    sell_price: 20000,
    margin: 5000,
    kpi_percentage: 10,
    kpi_bonus: 500,
    transaction_date: '2026-07-21T10:00:00.000Z',
    created_at: '2026-07-21T10:00:00.000Z',
  },
];

function buildLtlItemsResponse(): LtlItemsResponse {
  const empMap: Record<string, LtlCargoItem[]> = {};

  demoLtlItems.forEach((item) => {
    const key = item.employee_name || 'Unknown';
    if (!empMap[key]) empMap[key] = [];
    empMap[key].push(item);
  });

  const employees: LtlEmployeeSummary[] = Object.entries(empMap).map(([empName, items]) => {
    const total_volume = items.reduce((sum, i) => sum + i.volume, 0);
    const total_weight = items.reduce((sum, i) => sum + i.weight, 0);
    const total_base_kpi = items.reduce((sum, i) => sum + i.base_kpi, 0);
    const volume_coefficient = getVolumeCoefficient(total_volume);
    const volume_coefficient_percentage = `${Math.round(volume_coefficient * 100)}%`;
    const final_ltl_kpi = Math.round(total_base_kpi * volume_coefficient * 100) / 100;

    return {
      employee_id: items[0]?.employee_id || null,
      employee_name: empName,
      total_volume,
      total_weight,
      total_base_kpi,
      volume_coefficient,
      volume_coefficient_percentage,
      final_ltl_kpi,
      items,
    };
  });

  return {
    total_items: demoLtlItems.length,
    employees,
  };
}

function buildFtlSummaryResponse(reqMonth?: string): FtlSummaryResponse {
  const currentMonth = reqMonth || '2026-07';
  const monthItems = demoFtlItems.filter((i) => i.month === currentMonth);

  const managerMap: Record<string, FtlTruckItem[]> = {};
  monthItems.forEach((item) => {
    const key = item.manager_name || 'Manager';
    if (!managerMap[key]) managerMap[key] = [];
    managerMap[key].push(item);
  });

  let grandTotalTrucks = 0;
  let grandTotalProfit = 0;
  let grandTotalFtlKpi = 0;

  const managers: FtlManagerSummary[] = Object.entries(managerMap).map(([mgrName, items]) => {
    const truck_count = items.length;
    const total_agent_price = items.reduce((s, i) => s + i.agent_price, 0);
    const total_sell_price = items.reduce((s, i) => s + i.sell_price, 0);
    const total_profit = items.reduce((s, i) => s + i.profit, 0);
    const monthly_rate = getFtlMonthlyRate(total_profit);
    const monthly_rate_percentage = `${Math.round(monthly_rate * 100)}%`;

    let total_ftl_kpi = 0;
    let received_ftl_kpi = 0;
    let pending_ftl_kpi = 0;

    items.forEach((item) => {
      const kpi = Math.round(item.profit * monthly_rate * item.time_multiplier * 100) / 100;
      item.kpi_amount = kpi;
      total_ftl_kpi += kpi;
      if (item.kpi_received) {
        received_ftl_kpi += kpi;
      } else {
        pending_ftl_kpi += kpi;
      }
    });

    grandTotalTrucks += truck_count;
    grandTotalProfit += total_profit;
    grandTotalFtlKpi += total_ftl_kpi;

    return {
      manager_name: mgrName,
      month: currentMonth,
      truck_count,
      total_agent_price,
      total_sell_price,
      total_profit,
      monthly_rate,
      monthly_rate_percentage,
      total_ftl_kpi: Math.round(total_ftl_kpi * 100) / 100,
      received_ftl_kpi: Math.round(received_ftl_kpi * 100) / 100,
      pending_ftl_kpi: Math.round(pending_ftl_kpi * 100) / 100,
      items,
    };
  });

  return {
    month: currentMonth,
    total_trucks: grandTotalTrucks,
    total_profit: grandTotalProfit,
    total_ftl_kpi: Math.round(grandTotalFtlKpi * 100) / 100,
    managers,
  };
}

function buildRopSummaryResponse(reqMonth?: string): RopSummaryResponse {
  const currentMonth = reqMonth || '2026-07';
  const ltlData = buildLtlItemsResponse();
  const ftlData = buildFtlSummaryResponse(currentMonth);

  const workersBreakdown: RopWorkerShare[] = ltlData.employees.map((emp) => ({
    employee_name: emp.employee_name,
    base_kpi: emp.total_base_kpi,
    worker_1pct_kpi: Math.round(emp.total_base_kpi * 0.01 * 100) / 100,
  }));

  const worker_1pct_total = workersBreakdown.reduce((sum, w) => sum + w.worker_1pct_kpi, 0);

  const total_ltl_profit = ltlData.employees.reduce((sum, emp) => sum + emp.final_ltl_kpi, 0);

  const team_bonus_rate = getRopTeamBonusRate(total_ltl_profit);
  const team_bonus_percentage = `${(team_bonus_rate * 100).toFixed(1)}%`;
  const team_bonus_amount = Math.round(total_ltl_profit * team_bonus_rate * 100) / 100;

  const truck_count = ftlData.total_trucks;
  const truck_rate = getRopTruckRate(truck_count);
  const truck_rate_percentage = `${(truck_rate * 100).toFixed(1)}%`;
  const truck_kpi_amount = Math.round(ftlData.total_profit * truck_rate * 100) / 100;

  const rop_total_kpi =
    Math.round((worker_1pct_total + team_bonus_amount + truck_kpi_amount) * 100) / 100;

  return {
    month: currentMonth,
    total_ltl_profit,
    worker_1pct_total: Math.round(worker_1pct_total * 100) / 100,
    workers_breakdown: workersBreakdown,
    team_bonus_profit: total_ltl_profit,
    team_bonus_rate,
    team_bonus_percentage,
    team_bonus_amount,
    truck_count,
    truck_rate,
    truck_rate_percentage,
    truck_kpi_amount,
    rop_total_kpi,
  };
}

registerDemoHandler((path: string, options: RequestInit, body: any) => {
  const method = (options.method || 'GET').toUpperCase();

  // Standardize path matchers
  const isPath = (p: string) =>
    path === p || path === `/api${p}` || path.startsWith(`${p}?`) || path.startsWith(`/api${p}?`);
  const startsWith = (p: string) => path.startsWith(p) || path.startsWith(`/api${p}`);

  // 1. LTL Calc
  if (isPath('/cargo-kpi/ltl/calculate') && method === 'POST') {
    const result = calculateLtlPrice(Number(body.volume) || 0, Number(body.weight) || 0);
    return { handled: true, result };
  }

  // 2. LTL KPI Items
  if (isPath('/cargo-kpi/ltl/items') && method === 'GET') {
    return { handled: true, result: buildLtlItemsResponse() };
  }

  if (isPath('/cargo-kpi/ltl/items') && method === 'POST') {
    const vol = Number(body.volume) || 0;
    const wt = Number(body.weight) || 0;
    const density = vol > 0 ? Math.round((wt / vol) * 100) / 100 : 0;
    const base_rate = calculateLtlItemBaseRate(density, body.cargo_type || 'oddiy');
    const base_kpi = Math.round(vol * base_rate * 100) / 100;

    const newItem: LtlCargoItem = {
      id: `ltl-item-${demoLtlItems.length + 1}`,
      employee_id: body.employee_id || null,
      employee_name: body.employee_name || 'Jasur Yoldoshev',
      volume: vol,
      weight: wt,
      cargo_type: body.cargo_type || 'oddiy',
      density,
      base_rate,
      base_kpi,
      created_at: new Date().toISOString(),
    };

    demoLtlItems.unshift(newItem);
    return { handled: true, result: newItem };
  }

  if (startsWith('/cargo-kpi/ltl/items/') && method === 'PUT') {
    const id = path.split('/ltl/items/')[1]?.split('?')[0];
    const index = demoLtlItems.findIndex((i) => i.id === id);
    if (index === -1) {
      throw makeApiError(path, 404, 'ltl_item_not_found', 'LTL cargo item not found');
    }

    const current = demoLtlItems[index];
    const vol = body.volume !== undefined ? Number(body.volume) : current.volume;
    const wt = body.weight !== undefined ? Number(body.weight) : current.weight;
    const density = vol > 0 ? Math.round((wt / vol) * 100) / 100 : 0;
    const cargo_type = body.cargo_type || current.cargo_type;
    const base_rate = calculateLtlItemBaseRate(density, cargo_type);
    const base_kpi = Math.round(vol * base_rate * 100) / 100;

    const updated: LtlCargoItem = {
      ...current,
      employee_id: body.employee_id !== undefined ? body.employee_id : current.employee_id,
      employee_name: body.employee_name !== undefined ? body.employee_name : current.employee_name,
      volume: vol,
      weight: wt,
      cargo_type,
      density,
      base_rate,
      base_kpi,
      updated_at: new Date().toISOString(),
    };

    demoLtlItems[index] = updated;
    return { handled: true, result: updated };
  }

  if (startsWith('/cargo-kpi/ltl/items/') && method === 'DELETE') {
    const id = path.split('/ltl/items/')[1]?.split('?')[0];
    demoLtlItems = demoLtlItems.filter((i) => i.id !== id);
    return { handled: true, result: {} };
  }

  if (isPath('/cargo-kpi/ltl/reset') && method === 'POST') {
    demoLtlItems = [];
    return { handled: true, result: { message: 'All LTL items cleared successfully.' } };
  }

  // 3. FTL KPI Module
  if (isPath('/cargo-kpi/ftl/summary') && method === 'GET') {
    const urlObj = new URL(path, 'http://localhost');
    const month = urlObj.searchParams.get('month') || undefined;
    return { handled: true, result: buildFtlSummaryResponse(month) };
  }

  if (isPath('/cargo-kpi/ftl/items') && method === 'POST') {
    const qty = Math.max(1, Number(body.qty) || 1);
    const createdItems: FtlTruckItem[] = [];

    for (let q = 0; q < qty; q++) {
      const agentPrice = Number(body.agent_price) || 0;
      const sellPrice = Number(body.sell_price) || 0;
      const profit = Math.max(0, sellPrice - agentPrice);
      const plannedDays = Number(body.planned_days) || 0;
      const actualDays = Number(body.actual_days) || 0;
      const dayDiff = actualDays - plannedDays;
      const timeMult = getFtlTimeMultiplier(actualDays, plannedDays);

      const newItem: FtlTruckItem = {
        id: `ftl-item-${demoFtlItems.length + 1}`,
        manager_name: body.manager_name || 'Jasur',
        month: body.month || '2026-07',
        agent_price: agentPrice,
        sell_price: sellPrice,
        profit,
        planned_days: plannedDays,
        actual_days: actualDays,
        day_difference: dayDiff,
        time_multiplier: timeMult,
        time_multiplier_percentage: `${Math.round(timeMult * 100)}%`,
        kpi_received: Boolean(body.kpi_received),
        created_at: new Date().toISOString(),
      };
      demoFtlItems.unshift(newItem);
      createdItems.push(newItem);
    }

    return { handled: true, result: qty === 1 ? createdItems[0] : createdItems };
  }

  if (startsWith('/cargo-kpi/ftl/items/') && path.includes('/toggle-kpi') && method === 'PATCH') {
    const id = path.split('/ftl/items/')[1]?.split('/toggle-kpi')[0];
    const index = demoFtlItems.findIndex((i) => i.id === id);
    if (index === -1) {
      throw makeApiError(path, 404, 'ftl_item_not_found', 'FTL item not found');
    }
    demoFtlItems[index].kpi_received = !demoFtlItems[index].kpi_received;
    demoFtlItems[index].updated_at = new Date().toISOString();
    return { handled: true, result: demoFtlItems[index] };
  }

  if (startsWith('/cargo-kpi/ftl/items/') && method === 'PUT') {
    const id = path.split('/ftl/items/')[1]?.split('?')[0];
    const index = demoFtlItems.findIndex((i) => i.id === id);
    if (index === -1) {
      throw makeApiError(path, 404, 'ftl_item_not_found', 'FTL item not found');
    }

    const current = demoFtlItems[index];
    const agentPrice =
      body.agent_price !== undefined ? Number(body.agent_price) : current.agent_price;
    const sellPrice = body.sell_price !== undefined ? Number(body.sell_price) : current.sell_price;
    const profit = Math.max(0, sellPrice - agentPrice);
    const plannedDays =
      body.planned_days !== undefined ? Number(body.planned_days) : current.planned_days;
    const actualDays =
      body.actual_days !== undefined ? Number(body.actual_days) : current.actual_days;
    const dayDiff = actualDays - plannedDays;
    const timeMult = getFtlTimeMultiplier(actualDays, plannedDays);

    const updated: FtlTruckItem = {
      ...current,
      manager_name: body.manager_name !== undefined ? body.manager_name : current.manager_name,
      month: body.month !== undefined ? body.month : current.month,
      agent_price: agentPrice,
      sell_price: sellPrice,
      profit,
      planned_days: plannedDays,
      actual_days: actualDays,
      day_difference: dayDiff,
      time_multiplier: timeMult,
      time_multiplier_percentage: `${Math.round(timeMult * 100)}%`,
      kpi_received:
        body.kpi_received !== undefined ? Boolean(body.kpi_received) : current.kpi_received,
      updated_at: new Date().toISOString(),
    };

    demoFtlItems[index] = updated;
    return { handled: true, result: updated };
  }

  if (startsWith('/cargo-kpi/ftl/items/') && method === 'DELETE') {
    const id = path.split('/ftl/items/')[1]?.split('?')[0];
    demoFtlItems = demoFtlItems.filter((i) => i.id !== id);
    return { handled: true, result: {} };
  }

  // 4. ROP KPI Module
  if (isPath('/cargo-kpi/rop/summary') && method === 'GET') {
    const urlObj = new URL(path, 'http://localhost');
    const month = urlObj.searchParams.get('month') || undefined;
    return { handled: true, result: buildRopSummaryResponse(month) };
  }

  // 5. SEO KPI Module
  if (isPath('/cargo-kpi/seo/calculate') && method === 'POST') {
    const result = calculateSeoKpi(Number(body.net_profit) || 0);
    return { handled: true, result };
  }

  // 6. Employee Plans & Progress
  if (isPath('/cargo-kpi/plans') && method === 'GET') {
    const urlObj = new URL(path, 'http://localhost');
    const reqMonth =
      urlObj.searchParams.get('period') || urlObj.searchParams.get('month') || '2026-07';
    const empId = urlObj.searchParams.get('employee_id');

    let filtered = demoEmployeePlans.filter((p) => p.month === reqMonth);
    if (empId) {
      filtered = filtered.filter((p) => p.employee_id === empId);
    }

    const total_target = filtered.reduce((s, p) => s + p.target_sales, 0);
    const total_actual = filtered.reduce((s, p) => s + p.actual_sales, 0);
    const overall_completion_percentage =
      total_target > 0 ? Math.round((total_actual / total_target) * 100) : 0;

    const result: EmployeePlansResponse = {
      month: reqMonth,
      total_target,
      total_actual,
      overall_completion_percentage,
      plans: filtered,
    };
    return { handled: true, result };
  }

  if (isPath('/cargo-kpi/plans') && method === 'POST') {
    const target = Number(body.target_amount ?? body.target_sales) || 0;
    const actual = 0;
    const remaining = Math.max(0, target - actual);
    const compPct = target > 0 ? Math.round((actual / target) * 100) : 0;
    const period = body.period || body.month || '2026-07';
    const currency: SupportedCurrency = (body.currency as SupportedCurrency) || 'UZS';

    const newPlan: EmployeePlanProgress = {
      id: `plan-${demoEmployeePlans.length + 1}`,
      employee_id: body.employee_id || 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
      employee_name: body.employee_name || 'Employee',
      department_id: body.department_id || null,
      month: period,
      target_sales: target,
      currency,
      actual_sales: actual,
      remaining_target: remaining,
      completion_percentage: compPct,
      rank: demoEmployeePlans.length + 1,
      status: compPct >= 100 ? 'completed' : compPct >= 50 ? 'on_track' : 'behind',
      created_at: new Date().toISOString(),
    };

    demoEmployeePlans.push(newPlan);
    return { handled: true, result: newPlan };
  }

  if (startsWith('/cargo-kpi/plans/') && method === 'PUT') {
    const id = path.split('/plans/')[1]?.split('?')[0];
    const index = demoEmployeePlans.findIndex((p) => p.id === id || p.employee_id === id);
    if (index === -1) {
      throw makeApiError(path, 404, 'plan_not_found', 'Employee plan not found');
    }

    const current = demoEmployeePlans[index];
    const target =
      body.target_amount !== undefined
        ? Number(body.target_amount)
        : body.target_sales !== undefined
          ? Number(body.target_sales)
          : current.target_sales;
    const actual = current.actual_sales;
    const remaining = Math.max(0, target - actual);
    const compPct = target > 0 ? Math.round((actual / target) * 100) : 0;
    const period = body.period || body.month || current.month;
    const currency =
      body.currency !== undefined ? (body.currency as SupportedCurrency) : current.currency;

    const updated: EmployeePlanProgress = {
      ...current,
      employee_id: body.employee_id !== undefined ? body.employee_id : current.employee_id,
      employee_name: body.employee_name !== undefined ? body.employee_name : current.employee_name,
      department_id: body.department_id !== undefined ? body.department_id : current.department_id,
      month: period,
      target_sales: target,
      currency,
      actual_sales: actual,
      remaining_target: remaining,
      completion_percentage: compPct,
      status: compPct >= 100 ? 'completed' : compPct >= 50 ? 'on_track' : 'behind',
      updated_at: new Date().toISOString(),
    };

    demoEmployeePlans[index] = updated;
    return { handled: true, result: updated };
  }

  if (startsWith('/cargo-kpi/plans/') && method === 'DELETE') {
    const id = path.split('/plans/')[1]?.split('?')[0];
    demoEmployeePlans = demoEmployeePlans.filter((p) => p.id !== id && p.employee_id !== id);
    return { handled: true, result: {} };
  }

  // 7. Cargo Transactions Ledger
  if (isPath('/cargo-kpi/transactions/viewable') && method === 'GET') {
    const statuses: ShipmentStatus[] = [
      'Waiting',
      'In Transit',
      'Border',
      'At Station',
      'Delivered',
    ];
    const groupedData: Record<string, ViewableStatusGroup> = {};
    const status_counts: Record<string, number> = {};

    statuses.forEach((st) => {
      const matchingShipments = demoShipments.filter((s) => s.status === st);
      const totalCount = matchingShipments.length;
      status_counts[st] = totalCount;

      const txs: CargoTransaction[] = matchingShipments.map((s) => ({
        id: s.id,
        employee_id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
        employee_name: 'Jasur Yoldoshev',
        cargo_title: `${s.containerNo} - ${s.cargoType}`,
        buy_price: s.buyCost,
        sell_price: s.sellPrice,
        margin: s.profit,
        kpi_percentage: 10,
        kpi_bonus: Math.round(s.profit * 0.1 * 100) / 100,
        status: s.status,
        transaction_date: s.confirmedDate || new Date().toISOString(),
      }));

      groupedData[st] = {
        metrics: {
          total_transactions: totalCount,
          loaded_transactions: txs.length,
          total_sell_price: txs.reduce((sum, t) => sum + t.sell_price, 0),
          total_buy_price: txs.reduce((sum, t) => sum + t.buy_price, 0),
          total_margin: txs.reduce((sum, t) => sum + t.margin, 0),
          total_kpi_bonus: txs.reduce((sum, t) => sum + t.kpi_bonus, 0),
        },
        transactions: txs,
      };
    });

    return {
      handled: true,
      result: {
        meta: {
          total: demoShipments.length,
          limit: 20,
          offset: 0,
          page: 1,
          totalPages: 1,
          status_counts,
        },
        data: groupedData,
      },
    };
  }

  if (isPath('/cargo-kpi/transactions') && method === 'GET') {
    const urlObj = new URL(path, 'http://localhost');
    const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
    const limit = parseInt(urlObj.searchParams.get('limit') || '20', 10);
    const search = urlObj.searchParams.get('search')?.toLowerCase() || '';
    const empId = urlObj.searchParams.get('employee_id');
    const statusParam = urlObj.searchParams.get('status');
    const statusesParam = urlObj.searchParams.getAll('statuses');

    let filtered = [...demoTransactions];
    if (empId) {
      filtered = filtered.filter((t) => t.employee_id === empId);
    }
    if (statusParam) {
      filtered = filtered.filter(
        (t) => (t.status || 'Waiting').toLowerCase() === statusParam.toLowerCase()
      );
    }
    if (statusesParam.length > 0) {
      const normalizedStatuses = statusesParam.map((s) => s.toLowerCase());
      filtered = filtered.filter((t) =>
        normalizedStatuses.includes((t.status || 'Waiting').toLowerCase())
      );
    }
    if (search) {
      filtered = filtered.filter(
        (t) =>
          t.cargo_title.toLowerCase().includes(search) ||
          t.employee_name.toLowerCase().includes(search) ||
          (t.client_name && t.client_name.toLowerCase().includes(search))
      );
    }

    const status_counts: Record<string, number> = {
      Waiting: 0,
      'In Transit': 0,
      Border: 0,
      'At Station': 0,
      Delivered: 0,
    };

    demoTransactions.forEach((t) => {
      const st = t.status || 'Waiting';
      status_counts[st] = (status_counts[st] || 0) + 1;
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = filtered.slice(startIndex, startIndex + limit).map((t) => {
      const emp = t.employee_id ? demoEmployeesDb.get(t.employee_id) : null;
      const empName = emp
        ? `${emp.first_name} ${emp.last_name}`.trim()
        : t.employee_name || 'Employee';
      const deptName = emp ? emp.department_name : t.department_name || null;
      const client = t.client_id ? demoClientsDb.find((c) => c.id === t.client_id) : null;
      const clientName = client
        ? `${client.first_name} ${client.last_name}`.trim()
        : t.client_name || null;
      const clientCompany = client ? client.company_name : t.client_company || null;

      return {
        ...t,
        employee_name: empName,
        department_name: deptName,
        client_name: clientName,
        client_company: clientCompany,
      };
    });

    const total_margin = filtered.reduce((s, t) => s + t.margin, 0);
    const total_kpi_bonus = filtered.reduce((s, t) => s + t.kpi_bonus, 0);
    const total_sell_price = filtered.reduce((s, t) => s + t.sell_price, 0);

    const meta: ResponseMeta = {
      total,
      limit,
      offset: (page - 1) * limit,
      page,
      totalPages,
      status_counts,
    };

    const result: CargoTransactionPaginatedResponse = {
      meta,
      data: paginatedItems,
      pagination: { total, page, limit, totalPages },
      summary: { total_margin, total_kpi_bonus, total_sell_price },
    };
    return { handled: true, result };
  }

  if (isPath('/cargo-kpi/transactions') && method === 'POST') {
    if (!body.employee_id) {
      throw makeApiError(path, 404, 'employee_not_found', 'Employee ID is required');
    }
    const emp = demoEmployeesDb.get(body.employee_id);
    if (!emp) {
      throw makeApiError(path, 404, 'employee_not_found', 'Employee not found');
    }

    if (!body.client_id) {
      throw makeApiError(path, 404, 'client_not_found', 'Client ID is required');
    }
    const client = demoClientsDb.find((c) => c.id === body.client_id);
    if (!client) {
      throw makeApiError(path, 404, 'client_not_found', 'Client not found');
    }

    if (!body.department_id) {
      throw makeApiError(path, 404, 'department_not_found', 'Department ID is required');
    }
    const dept = demoDepartmentsDb.get(body.department_id);
    if (!dept) {
      throw makeApiError(path, 404, 'department_not_found', 'Department not found');
    }

    const buyPrice = Number(body.buy_price) || 0;
    const sellPrice = Number(body.sell_price) || 0;
    const margin = sellPrice - buyPrice;

    // Resolved dynamically on mock backend matching updated backend rules
    const deptName = dept.name.toLowerCase();
    const kpiPct =
      deptName === 'sborniy' || deptName === 'sales' || deptName === 'groupage' ? 10 : 0;
    const kpiBonus = Math.round(margin * (kpiPct / 100) * 100) / 100;

    const newTx: CargoTransaction = {
      id: `tx-${demoTransactions.length + 1}`,
      employee_id: body.employee_id,
      employee_name: `${emp.first_name} ${emp.last_name}`.trim(),
      department_id: body.department_id,
      department_name: dept.name,
      client_id: body.client_id,
      client_name: `${client.first_name} ${client.last_name}`.trim(),
      client_company: client.company_name,
      cargo_title: body.cargo_title || 'Cargo Shipment',
      buy_price: buyPrice,
      sell_price: sellPrice,
      margin,
      kpi_percentage: kpiPct,
      kpi_bonus: kpiBonus,
      transaction_date: body.transaction_date || new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    demoTransactions.unshift(newTx);

    // Accumulate actual sales into employee plan if existing
    const planIndex = demoEmployeePlans.findIndex(
      (p) => p.employee_id === newTx.employee_id && p.month === newTx.transaction_date.slice(0, 7)
    );
    if (planIndex !== -1) {
      const p = demoEmployeePlans[planIndex];
      const newActual = p.actual_sales + sellPrice;
      const newRemaining = Math.max(0, p.target_sales - newActual);
      const newPct = p.target_sales > 0 ? Math.round((newActual / p.target_sales) * 100) : 0;
      demoEmployeePlans[planIndex] = {
        ...p,
        actual_sales: newActual,
        remaining_target: newRemaining,
        completion_percentage: newPct,
        status: newPct >= 100 ? 'completed' : newPct >= 50 ? 'on_track' : 'behind',
      };
    }

    return { handled: true, result: newTx };
  }

  // 8. Container & Truck Shipment Tracking Demo Handlers
  if (isPath('/cargo-kpi/shipments') && method === 'GET') {
    const activeCount = demoShipments.filter((s) => s.status !== 'Delivered').length;
    const totalMargin = demoShipments.reduce((sum, s) => sum + s.profit, 0);
    const currentRate = demoShipments[0]?.rmbRate || 7.25;

    const result: ShipmentsSummaryResponse = {
      shipments: demoShipments,
      total_active_shipments: activeCount,
      total_net_margin: Math.round(totalMargin * 100) / 100,
      current_rmb_rate: currentRate,
    };
    return { handled: true, result };
  }

  if (isPath('/cargo-kpi/shipments') && method === 'POST') {
    const rmbRate = Number(body.rmbRate) || 7.25;
    const buyCost = Number(body.buyCost) || 0;
    const sellPrice = Number(body.sellPrice) || 0;
    const buyCostCurrency = (body.buyCostCurrency || 'RMB') as 'RMB' | 'USD';
    const profit = calculateShipmentProfit(buyCost, sellPrice, rmbRate, buyCostCurrency);

    const newShipment: Shipment = {
      id: `shp-${Date.now()}`,
      containerNo: body.containerNo || 'CONT-NEW',
      clientName: body.clientName || 'Client Name',
      cargoType: body.cargoType || 'General Cargo',
      confirmedDate: body.confirmedDate || new Date().toISOString().split('T')[0],
      loadedDate: body.loadedDate || '',
      arrivedDate: body.arrivedDate || '',
      rmbRate,
      agentName: body.agentName || 'Agent',
      buyCost,
      sellPrice,
      profit,
      status: body.status || 'In Transit',
      buyCostCurrency,
      created_at: new Date().toISOString(),
    };

    demoShipments.unshift(newShipment);
    saveStoredDemoShipments(demoShipments);
    return { handled: true, result: newShipment };
  }

  if (
    (startsWith('/cargo-kpi/shipments/') || startsWith('/cargo-kpi/transactions/')) &&
    method === 'PUT'
  ) {
    const id = (
      path.includes('/shipments/') ? path.split('/shipments/')[1] : path.split('/transactions/')[1]
    )?.split('?')[0];
    const idx = demoShipments.findIndex((s) => s.id === id);
    if (idx !== -1) {
      const current = demoShipments[idx];
      const rmbRate = body.rmbRate !== undefined ? Number(body.rmbRate) : current.rmbRate;
      const buyCost =
        body.buyCost !== undefined
          ? Number(body.buyCost)
          : body.buy_price !== undefined
            ? Number(body.buy_price)
            : current.buyCost;
      const sellPrice =
        body.sellPrice !== undefined
          ? Number(body.sellPrice)
          : body.sell_price !== undefined
            ? Number(body.sell_price)
            : current.sellPrice;
      const buyCostCurrency =
        body.buyCostCurrency || body.currency || current.buyCostCurrency || 'RMB';
      const profit = calculateShipmentProfit(buyCost, sellPrice, rmbRate, buyCostCurrency);

      const updated: Shipment = {
        ...current,
        containerNo:
          body.containerNo !== undefined
            ? body.containerNo
            : body.description || current.containerNo,
        clientName: body.clientName !== undefined ? body.clientName : current.clientName,
        cargoType: body.cargoType !== undefined ? body.cargoType : current.cargoType,
        confirmedDate:
          body.confirmedDate !== undefined
            ? body.confirmedDate
            : body.transaction_date || current.confirmedDate,
        loadedDate: body.loadedDate !== undefined ? body.loadedDate : current.loadedDate,
        arrivedDate: body.arrivedDate !== undefined ? body.arrivedDate : current.arrivedDate,
        rmbRate,
        agentName: body.agentName !== undefined ? body.agentName : current.agentName,
        buyCost,
        sellPrice,
        profit,
        status: body.status !== undefined ? body.status : current.status,
        buyCostCurrency,
        updated_at: new Date().toISOString(),
      };

      demoShipments[idx] = updated;
      saveStoredDemoShipments(demoShipments);

      // Also update demoTransactions if present
      const txIdx = demoTransactions.findIndex((t) => t.id === id);
      if (txIdx !== -1) {
        demoTransactions[txIdx] = {
          ...demoTransactions[txIdx],
          status: body.status !== undefined ? body.status : demoTransactions[txIdx].status,
          updated_at: new Date().toISOString(),
        };
      }

      return { handled: true, result: updated };
    }

    const txIdx = demoTransactions.findIndex((t) => t.id === id);
    if (txIdx !== -1) {
      const current = demoTransactions[txIdx];
      const updated: CargoTransaction = {
        ...current,
        buy_price: body.buy_price !== undefined ? Number(body.buy_price) : current.buy_price,
        sell_price: body.sell_price !== undefined ? Number(body.sell_price) : current.sell_price,
        margin:
          (body.sell_price !== undefined ? Number(body.sell_price) : current.sell_price) -
          (body.buy_price !== undefined ? Number(body.buy_price) : current.buy_price),
        status: body.status !== undefined ? body.status : current.status,
        currency: body.currency || current.currency,
        description: body.description !== undefined ? body.description : current.description,
        updated_at: new Date().toISOString(),
      };
      demoTransactions[txIdx] = updated;
      return { handled: true, result: updated };
    }

    throw makeApiError(path, 404, 'transaction_not_found', 'Transaction / shipment not found');
  }

  if (
    (startsWith('/cargo-kpi/shipments/') || startsWith('/cargo-kpi/transactions/')) &&
    method === 'DELETE'
  ) {
    const id = (
      path.includes('/shipments/') ? path.split('/shipments/')[1] : path.split('/transactions/')[1]
    )?.split('?')[0];
    demoShipments = demoShipments.filter((s) => s.id !== id);
    demoTransactions = demoTransactions.filter((t) => t.id !== id);
    saveStoredDemoShipments(demoShipments);
    return { handled: true, result: {} };
  }

  if (
    (isPath('/cargo-kpi/shipments/reset') || isPath('/cargo-kpi/transactions/reset')) &&
    method === 'POST'
  ) {
    demoShipments = [...INITIAL_DEMO_SHIPMENTS];
    saveStoredDemoShipments(demoShipments);
    return { handled: true, result: { message: 'Shipments reset to default.' } };
  }

  if (
    (isPath('/cargo-kpi/shipments/batch-update-status') ||
      isPath('/cargo-kpi/transactions/batch-update-status')) &&
    method === 'POST'
  ) {
    const ids: string[] = body.ids || [];
    const newStatus: ShipmentStatus = body.status;
    demoShipments = demoShipments.map((s) =>
      ids.includes(s.id) ? { ...s, status: newStatus, updated_at: new Date().toISOString() } : s
    );
    demoTransactions = demoTransactions.map((t) =>
      ids.includes(t.id) ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
    );
    saveStoredDemoShipments(demoShipments);
    return { handled: true, result: { message: 'Batch status updated successfully.' } };
  }

  if (
    (isPath('/cargo-kpi/shipments/batch-delete') ||
      isPath('/cargo-kpi/transactions/batch-delete')) &&
    method === 'POST'
  ) {
    const ids: string[] = body.ids || [];
    demoShipments = demoShipments.filter((s) => !ids.includes(s.id));
    demoTransactions = demoTransactions.filter((t) => !ids.includes(t.id));
    saveStoredDemoShipments(demoShipments);
    return { handled: true, result: { message: 'Batch deletion complete.' } };
  }

  if (
    (isPath('/cargo-kpi/shipments/update-rmb-rate') ||
      isPath('/cargo-kpi/transactions/update-rmb-rate')) &&
    method === 'POST'
  ) {
    const rate = Number(body.rate) || 7.25;
    demoShipments = demoShipments.map((s) => {
      const p = calculateShipmentProfit(s.buyCost, s.sellPrice, rate, s.buyCostCurrency);
      return { ...s, rmbRate: rate, profit: p };
    });
    saveStoredDemoShipments(demoShipments);
    return { handled: true, result: { message: 'RMB Rate updated globally.', rmbRate: rate } };
  }

  // 9. Global Reset
  if (isPath('/cargo-kpi/reset-all') && method === 'POST') {
    demoLtlItems = [
      {
        id: 'ltl-item-1',
        employee_id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
        employee_name: 'Jasur Yoldoshev',
        volume: 50,
        weight: 5000,
        cargo_type: 'oddiy',
        density: 100,
        base_rate: 3,
        base_kpi: 150,
        created_at: '2026-07-21T10:00:00.000Z',
      },
    ];

    demoFtlItems = [
      {
        id: 'ftl-item-1',
        manager_name: 'Jasur',
        month: '2026-07',
        agent_price: 1000,
        sell_price: 2000,
        profit: 1000,
        planned_days: 20,
        actual_days: 25,
        day_difference: 5,
        time_multiplier: 0.9,
        time_multiplier_percentage: '90%',
        kpi_received: false,
        created_at: '2026-07-21T10:00:00.000Z',
      },
      {
        id: 'ftl-item-2',
        manager_name: 'Sardor',
        month: '2026-07',
        agent_price: 1500,
        sell_price: 3500,
        profit: 2000,
        planned_days: 15,
        actual_days: 16,
        day_difference: 1,
        time_multiplier: 1.0,
        time_multiplier_percentage: '100%',
        kpi_received: true,
        created_at: '2026-07-21T11:00:00.000Z',
      },
    ];

    demoEmployeePlans = [
      {
        id: 'plan-1',
        employee_id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
        employee_name: 'Jasur Yoldoshev',
        department_id: 'dep-sales',
        department_name: 'Sales HQ',
        month: '2026-07',
        target_sales: 50000,
        actual_sales: 35000,
        remaining_target: 15000,
        completion_percentage: 70,
        rank: 1,
        status: 'on_track',
        created_at: '2026-07-01T00:00:00.000Z',
      },
    ];

    demoTransactions = [];

    return {
      handled: true,
      result: { message: 'Global reset completed. Seeds restored.', success: true },
    };
  }

  return null;
});

// ---------------------------------------------------------------------------
// Cargo KPI API Service Object
// ---------------------------------------------------------------------------

export const cargoKpiApi = {
  // LTL Calculator
  calculateLtl: (dto: LtlCalculateDto) =>
    request<LtlCalculateResult>('/cargo-kpi/ltl/calculate', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  // LTL Items
  getLtlItems: () => request<LtlItemsResponse>('/cargo-kpi/ltl/items', { method: 'GET' }),

  createLtlItem: (dto: CreateLtlItemDto) => {
    const { employee_name, ...cleanDto } = dto as any;
    return request<LtlCargoItem>('/cargo-kpi/ltl/items', {
      method: 'POST',
      body: JSON.stringify(cleanDto),
    });
  },

  updateLtlItem: (id: string, dto: UpdateLtlItemDto) => {
    const { employee_name, ...cleanDto } = dto as any;
    return request<LtlCargoItem>(`/cargo-kpi/ltl/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cleanDto),
    });
  },

  deleteLtlItem: (id: string) =>
    requestNoContent(`/cargo-kpi/ltl/items/${id}`, { method: 'DELETE' }),

  resetLtlItems: () => request<{ message: string }>('/cargo-kpi/ltl/reset', { method: 'POST' }),

  // FTL Module
  getFtlSummary: async (month?: string): Promise<FtlSummaryResponse> => {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    const raw: any = await request<any>(`/cargo-kpi/ftl/summary${query}`, { method: 'GET' });

    const managers = (raw?.managers || raw?.summaries || []).map((m: any) => ({
      manager_id: m.manager_id || null,
      manager_name: m.manager_name || 'Manager',
      month: m.month || month || '2026-07',
      truck_count: m.truck_count ?? m.items?.length ?? 0,
      total_agent_price: Number(m.total_agent_price ?? 0),
      total_sell_price: Number(m.total_sell_price ?? 0),
      total_profit: Number(m.total_profit ?? 0),
      monthly_rate: Number(m.monthly_rate ?? m.monthly_kpi_rate ?? 0),
      monthly_rate_percentage:
        m.monthly_rate_percentage ||
        m.monthly_kpi_rate_percentage ||
        `${Math.round(Number(m.monthly_rate ?? m.monthly_kpi_rate ?? 0) * 100)}%`,
      total_ftl_kpi: Number(m.total_ftl_kpi ?? 0),
      received_ftl_kpi: Number(m.received_ftl_kpi ?? 0),
      pending_ftl_kpi: Number(
        m.pending_ftl_kpi ?? Number(m.total_ftl_kpi ?? 0) - Number(m.received_ftl_kpi ?? 0)
      ),
      items: (m.items || []).map((item: any) => {
        const ap = Number(item.agent_price ?? 0);
        const sp = Number(item.sell_price ?? 0);
        const pd = Number(item.planned_days ?? 0);
        const ad = Number(item.actual_days ?? 0);
        const tm = Number(item.time_multiplier ?? 1.0);
        return {
          id: String(item.id),
          manager_id: item.manager_id || m.manager_id,
          manager_name: item.manager_name || m.manager_name,
          month: item.month || m.month,
          agent_price: ap,
          sell_price: sp,
          profit: Number(item.profit ?? sp - ap),
          planned_days: pd,
          actual_days: ad,
          day_difference: Number(item.day_difference ?? ad - pd),
          time_multiplier: tm,
          time_multiplier_percentage: item.time_multiplier_percentage || `${Math.round(tm * 100)}%`,
          kpi_received: Boolean(item.kpi_received),
          kpi_amount: Number(item.kpi_amount ?? item.individual_kpi ?? 0),
          created_at: item.created_at,
          updated_at: item.updated_at,
        };
      }),
    }));

    return {
      month: raw?.month || month || '2026-07',
      total_trucks: Number(
        raw?.total_trucks ?? managers.reduce((s: number, m: any) => s + (m.truck_count || 0), 0)
      ),
      total_profit: Number(
        raw?.total_profit ??
          raw?.grand_total_profit ??
          managers.reduce((s: number, m: any) => s + (m.total_profit || 0), 0)
      ),
      total_ftl_kpi: Number(
        raw?.total_ftl_kpi ??
          raw?.grand_total_ftl_kpi ??
          managers.reduce((s: number, m: any) => s + (m.total_ftl_kpi || 0), 0)
      ),
      managers,
    };
  },

  createFtlItem: (dto: CreateFtlItemDto) => {
    const { manager_name, ...cleanDto } = dto as any;
    return request<FtlTruckItem | FtlTruckItem[]>('/cargo-kpi/ftl/items', {
      method: 'POST',
      body: JSON.stringify(cleanDto),
    });
  },

  updateFtlItem: (id: string, dto: UpdateFtlItemDto) => {
    const { manager_name, ...cleanDto } = dto as any;
    return request<FtlTruckItem>(`/cargo-kpi/ftl/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cleanDto),
    });
  },

  deleteFtlItem: (id: string) =>
    requestNoContent(`/cargo-kpi/ftl/items/${id}`, { method: 'DELETE' }),

  toggleFtlKpiReceived: (id: string) =>
    request<FtlTruckItem>(`/cargo-kpi/ftl/items/${id}/toggle-kpi`, { method: 'PATCH' }),

  // ROP Module
  getRopSummary: async (month?: string): Promise<RopSummaryResponse> => {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    const raw: any = await request<any>(`/cargo-kpi/rop/summary${query}`, { method: 'GET' });

    const rawWorkers = raw?.workers_breakdown || raw?.workers || [];
    const normalizedWorkers: RopWorkerShare[] = rawWorkers.map((w: any) => {
      const baseKpi = Number(w.base_kpi ?? w.sales_amount ?? 0);
      const worker1pct = Number(
        w.worker_1pct_kpi ?? w.worker_kpi_1pc ?? Math.round(baseKpi * 0.01 * 100) / 100
      );
      return {
        employee_name: w.employee_name || w.worker_name || 'Employee',
        base_kpi: baseKpi,
        worker_1pct_kpi: worker1pct,
      };
    });

    const worker_1pct_total = Number(
      raw?.worker_1pct_total ??
        raw?.worker_1pc_kpi ??
        normalizedWorkers.reduce((s, w) => s + w.worker_1pct_kpi, 0)
    );
    const team_bonus_profit = Number(
      raw?.team_bonus_profit ?? raw?.total_team_sales ?? raw?.total_ltl_profit ?? 0
    );
    const team_bonus_rate = Number(raw?.team_bonus_rate ?? 0);
    const team_bonus_percentage =
      raw?.team_bonus_percentage ||
      raw?.team_bonus_rate_percentage ||
      `${(team_bonus_rate * 100).toFixed(1)}%`;
    const team_bonus_amount = Number(raw?.team_bonus_amount ?? raw?.team_bonus_kpi ?? 0);
    const truck_count = Number(raw?.truck_count ?? 0);
    const truck_rate = Number(raw?.truck_rate ?? raw?.truck_count_rate ?? 0);
    const truck_rate_percentage =
      raw?.truck_rate_percentage ||
      raw?.truck_count_rate_percentage ||
      `${(truck_rate * 100).toFixed(1)}%`;
    const truck_kpi_amount = Number(raw?.truck_kpi_amount ?? raw?.truck_kpi ?? 0);
    const rop_total_kpi = Number(
      raw?.rop_total_kpi ?? worker_1pct_total + team_bonus_amount + truck_kpi_amount
    );

    return {
      month: raw?.month || month || '2026-07',
      total_ltl_profit: Number(raw?.total_ltl_profit ?? team_bonus_profit),
      worker_1pct_total,
      workers_breakdown: normalizedWorkers,
      team_bonus_profit,
      team_bonus_rate,
      team_bonus_percentage,
      team_bonus_amount,
      truck_count,
      truck_rate,
      truck_rate_percentage,
      truck_kpi_amount,
      rop_total_kpi,
    };
  },

  // SEO Module
  calculateSeo: (dto: SeoCalculateDto) =>
    request<SeoCalculateResult>('/cargo-kpi/seo/calculate', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  // Employee Plans & Progress
  getPlans: async (params?: {
    month?: string;
    period?: string;
    employee_id?: string;
  }): Promise<EmployeePlansResponse> => {
    const searchParams = new URLSearchParams();
    const period = params?.period || params?.month;
    if (period) {
      searchParams.set('period', period);
      searchParams.set('month', period);
    }
    if (params?.employee_id) searchParams.set('employee_id', params.employee_id);
    const query = searchParams.toString();
    const raw: any = await request<any>(`/cargo-kpi/plans${query ? `?${query}` : ''}`, {
      method: 'GET',
    });

    const rawPlans = raw?.plans || raw?.leaderboard || raw?.data || [];
    const normalizedPlans: EmployeePlanProgress[] = rawPlans.map((p: any, idx: number) => {
      const target = Number(p.target_amount ?? p.target_sales ?? 0);
      const actual = Number(p.actual_sales ?? p.actual_amount ?? 0);
      const remaining = Number(
        p.remaining_target ?? p.remaining_amount ?? Math.max(0, target - actual)
      );
      const compPct = Number(
        p.completion_percentage ?? (target > 0 ? Math.round((actual / target) * 100) : 0)
      );
      const status =
        p.status ||
        (p.is_completed
          ? 'completed'
          : compPct >= 100
            ? 'completed'
            : compPct >= 50
              ? 'on_track'
              : 'behind');
      const currency = (p.currency as SupportedCurrency) || 'UZS';

      return {
        id: String(p.id || `plan-${idx + 1}`),
        employee_id: p.employee_id || '',
        employee_name:
          p.employee_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Employee',
        department_id: p.department_id || null,
        department_name: p.department_name || null,
        month: p.period || p.month || period || '2026-07',
        target_sales: target,
        currency,
        actual_sales: actual,
        remaining_target: remaining,
        completion_percentage: compPct,
        rank: p.rank || idx + 1,
        status,
        created_at: p.created_at,
        updated_at: p.updated_at,
      };
    });

    const total_target = Number(
      raw?.total_target ?? normalizedPlans.reduce((s, p) => s + p.target_sales, 0)
    );
    const total_actual = Number(
      raw?.total_actual ?? normalizedPlans.reduce((s, p) => s + p.actual_sales, 0)
    );
    const overall_completion_percentage = Number(
      raw?.overall_completion_percentage ??
        (total_target > 0 ? Math.round((total_actual / total_target) * 100) : 0)
    );

    return {
      month: raw?.period || raw?.month || period || '2026-07',
      total_target,
      total_actual,
      overall_completion_percentage,
      plans: normalizedPlans,
    };
  },

  createPlan: (dto: CreateEmployeePlanDto) => {
    const { employee_name, month, target_sales, ...cleanDto } = dto as any;
    const period = dto.period || dto.month;
    const target_amount = Number(dto.target_amount ?? dto.target_sales ?? 0);
    const currency = dto.currency || 'UZS';
    const bodyObj: any = {
      ...cleanDto,
      period,
      target_amount,
      currency,
    };
    return request<EmployeePlanProgress>('/cargo-kpi/plans', {
      method: 'POST',
      body: JSON.stringify(bodyObj),
    });
  },

  updatePlan: (id: string, dto: UpdateEmployeePlanDto) => {
    const { employee_id, employee_name, month, target_sales, ...cleanDto } = dto as any;
    const period = dto.period || dto.month;
    const target_amount =
      dto.target_amount !== undefined
        ? Number(dto.target_amount)
        : dto.target_sales !== undefined
          ? Number(dto.target_sales)
          : undefined;

    const bodyObj: any = {
      ...cleanDto,
    };
    if (period !== undefined) bodyObj.period = period;
    if (target_amount !== undefined) bodyObj.target_amount = target_amount;
    if (dto.currency !== undefined) bodyObj.currency = dto.currency;
    delete bodyObj.employee_id;

    return request<EmployeePlanProgress>(`/cargo-kpi/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bodyObj),
    });
  },

  deletePlan: (id: string) => requestNoContent(`/cargo-kpi/plans/${id}`, { method: 'DELETE' }),

  // Cargo Transactions Ledger
  getTransactions: async (
    params?: CargoTransactionListParams
  ): Promise<CargoTransactionPaginatedResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.employee_id) searchParams.set('employee_id', params.employee_id);
    if (params?.department_id) searchParams.set('department_id', params.department_id);
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.statuses && params.statuses.length > 0) {
      params.statuses.forEach((st) => searchParams.append('statuses', st));
    }
    const query = searchParams.toString();
    const raw: any = await request<any>(`/cargo-kpi/transactions${query ? `?${query}` : ''}`, {
      method: 'GET',
    });

    const rawData = raw?.data || (Array.isArray(raw) ? raw : []);
    const normalizedData: CargoTransaction[] = rawData.map((t: any) => {
      const bp = Number(t.buy_price ?? 0);
      const sp = Number(t.sell_price ?? 0);
      const margin = Number(t.margin ?? sp - bp);
      const kpiPct = Number(t.kpi_percentage ?? 10);
      const kpiBonus = Number(t.kpi_bonus ?? Math.round(margin * (kpiPct / 100) * 100) / 100);

      return {
        id: String(t.id),
        employee_id: t.employee_id || '',
        employee_name:
          t.employee_name ||
          `${t.employee_first_name || ''} ${t.employee_last_name || ''}`.trim() ||
          'Employee',
        department_id: t.department_id || null,
        department_name: t.department_name || null,
        client_id: t.client_id || null,
        client_name: t.client_name || null,
        client_company: t.client_company || null,
        cargo_title: t.cargo_title || t.description || 'Cargo Shipment',
        buy_price: bp,
        sell_price: sp,
        margin,
        kpi_percentage: kpiPct,
        kpi_bonus: kpiBonus,
        status: t.status || 'Waiting',
        transaction_date: t.transaction_date || new Date().toISOString(),
        created_at: t.created_at,
        updated_at: t.updated_at,
      };
    });

    const total_sell_price = Number(
      raw?.summary?.total_sell_price ?? normalizedData.reduce((s, t) => s + t.sell_price, 0)
    );
    const total_margin = Number(
      raw?.summary?.total_margin ?? normalizedData.reduce((s, t) => s + t.margin, 0)
    );
    const total_kpi_bonus = Number(
      raw?.summary?.total_kpi_bonus ?? normalizedData.reduce((s, t) => s + t.kpi_bonus, 0)
    );

    const meta: ResponseMeta | undefined = raw?.meta
      ? {
          total: Number(raw.meta.total ?? 0),
          limit: Number(raw.meta.limit ?? 20),
          offset: Number(raw.meta.offset ?? 0),
          page: Number(raw.meta.page ?? 1),
          totalPages: Number(raw.meta.totalPages ?? 1),
          status_counts: raw.meta.status_counts || undefined,
          column_counts: raw.meta.column_counts || undefined,
        }
      : undefined;

    const pagination = raw?.pagination || {
      total: meta ? meta.total : normalizedData.length,
      page: meta ? meta.page : params?.page || 1,
      limit: meta ? meta.limit : params?.limit || 20,
      totalPages: meta
        ? meta.totalPages
        : Math.ceil(normalizedData.length / (params?.limit || 20)) || 1,
    };

    return {
      meta,
      data: normalizedData,
      pagination,
      summary: {
        total_sell_price,
        total_margin,
        total_kpi_bonus,
      },
    };
  },

  getViewableTransactions: async (
    params?: CargoTransactionListParams
  ): Promise<ViewableTransactionsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.employee_id) searchParams.set('employee_id', params.employee_id);
    if (params?.department_id) searchParams.set('department_id', params.department_id);
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.statuses && params.statuses.length > 0) {
      params.statuses.forEach((st) => searchParams.append('statuses', st));
    }
    const query = searchParams.toString();
    const raw: any = await request<any>(
      `/cargo-kpi/transactions/viewable${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );

    const rawData = raw?.data || {};
    const normalizedData: Record<string, ViewableStatusGroup> = {};

    Object.keys(rawData).forEach((statusKey) => {
      const group = rawData[statusKey];
      const txs: CargoTransaction[] = (group?.transactions || []).map((t: any) => ({
        id: String(t.id),
        employee_id: t.employee_id || '',
        employee_name:
          t.employee_name ||
          `${t.employee_first_name || ''} ${t.employee_last_name || ''}`.trim() ||
          'Employee',
        department_id: t.department_id || null,
        department_name: t.department_name || null,
        client_id: t.client_id || null,
        client_name: t.client_name || null,
        client_company: t.client_company || null,
        cargo_title: t.cargo_title || t.description || 'Cargo Shipment',
        buy_price: Number(t.buy_price ?? 0),
        sell_price: Number(t.sell_price ?? 0),
        margin: Number(t.margin ?? 0),
        kpi_percentage: Number(t.kpi_percentage ?? 10),
        kpi_bonus: Number(t.kpi_bonus ?? 0),
        status: t.status || statusKey,
        transaction_date: t.transaction_date || new Date().toISOString(),
        created_at: t.created_at,
        updated_at: t.updated_at,
      }));

      normalizedData[statusKey] = {
        metrics: {
          total_transactions: Number(group?.metrics?.total_transactions ?? txs.length),
          loaded_transactions: Number(group?.metrics?.loaded_transactions ?? txs.length),
          total_sell_price: Number(
            group?.metrics?.total_sell_price ?? txs.reduce((s, t) => s + t.sell_price, 0)
          ),
          total_buy_price: Number(
            group?.metrics?.total_buy_price ?? txs.reduce((s, t) => s + t.buy_price, 0)
          ),
          total_margin: Number(
            group?.metrics?.total_margin ?? txs.reduce((s, t) => s + t.margin, 0)
          ),
          total_kpi_bonus: Number(
            group?.metrics?.total_kpi_bonus ?? txs.reduce((s, t) => s + t.kpi_bonus, 0)
          ),
        },
        transactions: txs,
      };
    });

    return {
      meta: raw?.meta,
      data: normalizedData,
    };
  },

  createTransaction: async (dto: CreateCargoTransactionDto) => {
    let employee_id = dto.employee_id;
    let department_id = dto.department_id;

    if (!employee_id || !department_id) {
      try {
        const me = await employeesApi.me();
        if (me) {
          if (!employee_id) employee_id = me.id;
          if (!department_id) department_id = me.department_id;
        }
      } catch {
        // Fallback if offline
      }
    }

    const description = (dto.description || dto.cargo_title || 'Cargo Transaction').trim();
    const transaction_date =
      dto.transaction_date && dto.transaction_date.trim() !== ''
        ? dto.transaction_date.slice(0, 10)
        : new Date().toISOString().split('T')[0];

    const payload: Record<string, any> = {
      employee_id: employee_id || '1d63b635-8933-45d1-a233-d6902e3b27f1',
      department_id: department_id || '07d223ca-4167-47f7-a929-61d47a3628a7',
      client_id: dto.client_id,
      buy_price: Number(dto.buy_price) || 0,
      sell_price: Number(dto.sell_price) || 0,
      currency: dto.currency || 'USD',
      status: dto.status || 'Waiting',
      transaction_date,
      ...(description ? { description } : {}),
    };

    return request<CargoTransaction>('/cargo-kpi/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Global Reset
  resetAll: () =>
    request<{ message: string; success: boolean }>('/cargo-kpi/reset-all', { method: 'POST' }),

  // Container & Truck Shipment Tracking Module
  getShipments: async (): Promise<ShipmentsSummaryResponse> => {
    const raw: any = await cargoRegistrationsApi.list({ limit: 100 });
    const shipmentsList: Shipment[] = (raw?.data || []).map((s: any) => {
      const rmbRate = Number(s.usd_rmb_rate ?? 7.25);
      const buyCost = Number(s.purchase_price?.amount ?? 0);
      const sellPrice = Number(s.sell_price?.amount ?? 0);
      const buyCostCurrency = (s.purchase_price?.currency || 'RMB') as 'RMB' | 'USD';
      const profit = Number(
        s.net_yield?.amount ?? calculateShipmentProfit(buyCost, sellPrice, rmbRate, buyCostCurrency)
      );

      return {
        id: String(s.id),
        containerNo: s.container_truck_id || 'CONT-000',
        clientId: s.client_id || undefined,
        clientName: s.client_full_name || 'Client',
        cargoType: s.cargo || 'General Cargo',
        confirmedDate: s.confirmed_date || '',
        loadedDate: s.loaded_date || '',
        arrivedDate: s.arrived_date || '',
        rmbRate,
        agentName: s.agent_name || 'Agent',
        buyCost,
        sellPrice,
        profit,
        status: (s.status as ShipmentStatus) || 'In Transit',
        buyCostCurrency,
        created_at: s.created_at,
        updated_at: s.updated_at,
      };
    });

    const activeCount = shipmentsList.filter((s) => s.status !== 'Delivered').length;
    const totalMargin = shipmentsList.reduce((sum, s) => sum + s.profit, 0);
    const currentRate = shipmentsList[0]?.rmbRate || 7.25;

    return {
      shipments: shipmentsList,
      total_active_shipments: activeCount,
      total_net_margin: Math.round(totalMargin * 100) / 100,
      current_rmb_rate: currentRate,
      meta: raw?.meta,
    };
  },

  createShipment: async (dto: CreateShipmentDto) => {
    return cargoRegistrationsApi.create({
      cargo_type: (dto.cargoType as any) === 'FTL' ? 'FTL' : 'LTL',
      volume: 10,
      weight: 1000,
      container_truck_id: dto.containerNo || 'TRK-1001',
      agent_name: dto.agentName || 'Agent',
      cargo: dto.cargoType || 'General Cargo',
      confirmed_date: dto.confirmedDate,
      loaded_date: dto.loadedDate,
      arrived_date: dto.arrivedDate,
      purchase_price: Number(dto.buyCost) || 0,
      purchase_currency: (dto.buyCostCurrency as any) || 'USD',
      sell_price: Number(dto.sellPrice) || 0,
      sell_currency: 'USD',
      usd_rmb_rate: dto.rmbRate,
      status: dto.status || 'Waiting',
      client_id: dto.clientId || 'c-client-1',
      employee_id: dto.employee_id,
    }) as any;
  },

  updateShipment: (id: string, dto: UpdateShipmentDto) => {
    const payload: Record<string, any> = {};

    if (dto.status !== undefined) payload.status = dto.status;
    if (dto.containerNo !== undefined) payload.container_truck_id = dto.containerNo;
    if (dto.agentName !== undefined) payload.agent_name = dto.agentName;
    if (dto.cargoType !== undefined) payload.cargo = dto.cargoType;
    if (dto.buyCost !== undefined) payload.purchase_price = Number(dto.buyCost);
    if (dto.sellPrice !== undefined) payload.sell_price = Number(dto.sellPrice);
    if (dto.rmbRate !== undefined) payload.usd_rmb_rate = Number(dto.rmbRate);
    if (dto.confirmedDate !== undefined) payload.confirmed_date = dto.confirmedDate;
    if (dto.loadedDate !== undefined) payload.loaded_date = dto.loadedDate;
    if (dto.arrivedDate !== undefined) payload.arrived_date = dto.arrivedDate;
    if (dto.clientId !== undefined) payload.client_id = dto.clientId;

    return cargoRegistrationsApi.update(id, payload) as any;
  },

  deleteShipment: (id: string) => cargoRegistrationsApi.delete(id) as any,

  resetShipments: () =>
    request<{ message: string }>('/cargo-kpi/transactions/reset', { method: 'POST' }),

  updateRmbRate: async (rate: number): Promise<{ message: string; rmbRate: number }> => {
    try {
      await request('/currency/sync', { method: 'POST' });
    } catch {
      // Fallback if network or endpoint fails in demo mode
    }
    return { message: 'RMB rate updated successfully', rmbRate: rate };
  },

  batchUpdateStatus: (ids: string[], status: ShipmentStatus) =>
    request<{ message: string }>('/cargo-kpi/transactions/batch-update-status', {
      method: 'POST',
      body: JSON.stringify({ ids, status }),
    }),

  batchDelete: (ids: string[]) =>
    request<{ message: string }>('/cargo-kpi/transactions/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
};
