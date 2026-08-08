export type DashboardPeriod = '1D' | '5D' | '1M' | '6M' | 'YTD' | '1Y' | '5Y' | 'MAX' | 'CUSTOM';

export type DashboardGranularity = 'hour' | 'day' | 'week' | 'month' | 'year';

export interface DashboardFilterParams {
  period?: DashboardPeriod;
  granularity?: DashboardGranularity;
  start_date?: string;
  end_date?: string;
  employee_id?: string;
  client_id?: string;
  status?: string;
  cargo_type?: string;
  limit?: number;
}

export interface DashboardSalesProgressMeta {
  period: DashboardPeriod | string;
  startDate: string;
  endDate: string;
  granularity: DashboardGranularity | string;
  totalBuckets: number;
  currency: string;
}

export interface DashboardSalesProgressSummary {
  totalSales: number;
  totalPurchaseCost: number;
  totalMargin: number;
  marginPercentage: number;
  totalOrders: number;
  averageOrderValue: number;
  completedOrders: number;
  pendingOrders: number;
  growthRateSales: number | null;
  growthRateMargin: number | null;
}

export interface DashboardSalesProgressDataPoint {
  index: number;
  bucketStart: string;
  bucketEnd: string;
  dateKey: string;
  label: string;
  sales: number;
  purchaseCost: number;
  margin: number;
  orderCount: number;
  cumulativeSales: number;
  cumulativeMargin: number;
}

export interface DashboardSalesProgressResponse {
  meta: DashboardSalesProgressMeta;
  summary: DashboardSalesProgressSummary;
  dataPoints: DashboardSalesProgressDataPoint[];
}

export interface DashboardSummaryResponse {
  totalSales: number;
  totalPurchaseCost: number;
  totalMargin: number;
  marginPercentage: number;
  totalOrders: number;
  completedOrders: number;
  waitingOrders: number;
  averageOrderValue: number;
  totalVolume: number;
  totalWeight: number;
  ltlOrderCount: number;
  ftlOrderCount: number;
  salesGrowthVsPriorPeriod: number | null;
  marginGrowthVsPriorPeriod: number | null;
}

export interface CargoTypeDistributionItem {
  category: 'FTL' | 'LTL' | string;
  count: number;
  totalSales: number;
  percentage: number;
}

export interface StatusDistributionItem {
  category: string;
  count: number;
  totalSales: number;
  percentage: number;
}

export interface DashboardCargoDistributionResponse {
  cargoTypeDistribution: CargoTypeDistributionItem[];
  statusDistribution: StatusDistributionItem[];
}

export interface TopManagerItem {
  employeeId: string;
  employeeName: string;
  departmentName?: string;
  totalSales: number;
  totalMargin: number;
  orderCount: number;
}

export interface TopClientItem {
  clientId: string;
  clientName: string;
  companyName?: string;
  totalSales: number;
  totalMargin: number;
  orderCount: number;
}

export interface DashboardTopPerformersResponse {
  topManagers: TopManagerItem[];
  topClients: TopClientItem[];
}
