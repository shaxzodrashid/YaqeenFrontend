export type DashboardPeriod = '1D' | '5D' | '1M' | '6M' | 'YTD' | '1Y' | '5Y' | 'MAX' | 'CUSTOM';

export type DashboardGranularity = 'hour' | 'day' | 'week' | 'month' | 'year';

/** Uppercase transport modality used by dashboard analytics endpoints */
export type DashboardTransportType = 'AUTO' | 'RAILWAY' | 'AIR' | 'SEA' | 'OTHER' | string;

export interface DashboardFilterParams {
  period?: DashboardPeriod;
  granularity?: DashboardGranularity;
  start_date?: string;
  end_date?: string;
  employee_id?: string;
  client_id?: string;
  status?: string;
  cargo_type?: string;
  transport_type?: DashboardTransportType;
  transport_types?: DashboardTransportType[] | string;
  limit?: number;
  currency?: 'UZS' | 'USD' | 'RUB' | 'RMB' | 'CNY' | string;
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
  currency?: string;
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

export interface DashboardMonthlyYearlyBlock {
  revenue: number;
  purchaseCost?: number;
  netProfit: number;
  marginPercentage?: number;
  revenueGrowthRate?: number | null;
  netProfitGrowthRate?: number | null;
  orderCount: number;
}

export interface DashboardSummaryResponse {
  currency?: string;
  totalSales: number;
  totalPurchaseCost: number;
  totalMargin: number;
  marginPercentage: number;
  totalOrders: number;
  completedOrders: number;
  waitingOrders: number;
  inTransitOrders?: number;
  activeOrders?: number;
  statusCounts?: Record<string, number>;
  averageOrderValue: number;
  totalVolume: number;
  totalWeight: number;
  ltlOrderCount: number;
  ftlOrderCount: number;
  salesGrowthVsPriorPeriod: number | null;
  marginGrowthVsPriorPeriod: number | null;
  monthly?: DashboardMonthlyYearlyBlock;
  yearly?: DashboardMonthlyYearlyBlock;
  debtSummary?: DashboardDebtSummaryResponse;
  deliveryEfficiency?: DashboardDeliveryEfficiencyResponse;
}

export interface TransportTypeDistributionItem {
  type: DashboardTransportType;
  name?: string;
  count: number;
  percentage: number;
  totalSales: number;
  totalMargin?: number;
  totalVolume?: number;
  totalWeight?: number;
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
  currency?: string;
  transportTypeDistribution?: TransportTypeDistributionItem[];
  cargoTypeDistribution: CargoTypeDistributionItem[];
  statusDistribution: StatusDistributionItem[];
}

export interface TopManagerItem {
  employeeId: string;
  employeeName: string;
  departmentName?: string;
  totalSales: number;
  totalPurchaseCost?: number;
  totalMargin: number;
  orderCount: number;
  totalVolume?: number;
  totalWeight?: number;
  averageOrderValue?: number;
  completedOrdersCount?: number;
  activeOrdersCount?: number;
  conversionRate?: number;
}

export interface TopClientItem {
  clientId: string;
  clientName: string;
  companyName?: string;
  totalSales: number;
  totalPurchaseCost?: number;
  totalMargin: number;
  orderCount: number;
  totalVolume?: number;
  totalWeight?: number;
  averageOrderValue?: number;
}

export interface DashboardTopPerformersResponse {
  currency?: string;
  topManagers: TopManagerItem[];
  topClients: TopClientItem[];
}

// ---------------------------------------------------------------------------
// Route Analytics (`GET /dashboard/route-analytics`)
// ---------------------------------------------------------------------------

export interface RouteAnalyticsItem {
  route: string;
  originCountry?: string;
  originCountryCode?: string;
  originCity?: string;
  destinationCountry?: string;
  destinationCountryCode?: string;
  destinationCity?: string;
  count: number;
  percentage: number;
  totalSales: number;
  totalMargin?: number;
  totalVolume?: number;
  totalWeight?: number;
}

export interface OriginCountryItem {
  countryName: string;
  count: number;
  percentage: number;
  totalSales: number;
  totalVolume?: number;
  totalWeight?: number;
}

export interface DashboardRouteAnalyticsResponse {
  currency?: string;
  topRoutes: RouteAnalyticsItem[];
  originCountries: OriginCountryItem[];
}

// ---------------------------------------------------------------------------
// Delivery Efficiency (`GET /dashboard/delivery-efficiency`)
// ---------------------------------------------------------------------------

export interface DeliveryStatusBreakdownItem {
  status: string;
  label?: string;
  count: number;
  percentage: number;
  totalSales?: number;
  totalVolume?: number;
  totalWeight?: number;
}

export interface RouteTransitTimeItem {
  route: string;
  averageTransitDays: number;
  count: number;
}

export interface DashboardDeliveryEfficiencyResponse {
  currency?: string;
  averageTransitDays: number;
  minTransitDays?: number;
  maxTransitDays?: number;
  totalDeliveredCount: number;
  totalInTransitCount?: number;
  totalActiveCount?: number;
  onTimeDeliveriesCount?: number;
  delayedDeliveriesCount?: number;
  onTimeRatePercentage?: number;
  statusBreakdown?: DeliveryStatusBreakdownItem[];
  routeTransitTimes?: RouteTransitTimeItem[];
}

// ---------------------------------------------------------------------------
// Debt Summary (`GET /dashboard/debt-summary`)
// ---------------------------------------------------------------------------

export interface DebtorClientItem {
  clientId: string;
  clientName: string;
  companyName?: string;
  amount: number;
  orderCount: number;
}

export interface CreditorCarrierItem {
  agentName: string;
  amount: number;
  orderCount: number;
}

export interface DashboardDebtSummaryResponse {
  currency?: string;
  accountsReceivable: number;
  accountsPayable: number;
  netBalance: number;
  debtorClientCount?: number;
  creditorCarrierCount?: number;
  topDebtorClients?: DebtorClientItem[];
  topCreditorCarriers?: CreditorCarrierItem[];
}
