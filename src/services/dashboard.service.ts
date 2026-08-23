import { request } from './httpClient';
import type {
  DashboardFilterParams,
  DashboardSalesProgressResponse,
  DashboardSummaryResponse,
  DashboardCargoDistributionResponse,
  DashboardTopPerformersResponse,
  DashboardRouteAnalyticsResponse,
  DashboardDeliveryEfficiencyResponse,
  DashboardDebtSummaryResponse,
} from '../types/dashboard';

function buildQueryString(params?: DashboardFilterParams): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();

  if (params.period) searchParams.append('period', params.period);
  if (params.granularity) searchParams.append('granularity', params.granularity);
  if (params.start_date) searchParams.append('start_date', params.start_date);
  if (params.end_date) searchParams.append('end_date', params.end_date);
  if (params.employee_id) searchParams.append('employee_id', params.employee_id);
  if (params.client_id) searchParams.append('client_id', params.client_id);
  if (params.status) searchParams.append('status', params.status);
  if (params.cargo_type) searchParams.append('cargo_type', params.cargo_type);
  if (params.transport_type) searchParams.append('transport_type', params.transport_type);
  if (
    params.transport_types &&
    (!Array.isArray(params.transport_types) || params.transport_types.length > 0)
  ) {
    searchParams.append(
      'transport_types',
      Array.isArray(params.transport_types)
        ? params.transport_types.join(',')
        : String(params.transport_types)
    );
  }
  if (params.currency) searchParams.append('currency', params.currency);
  if (params.limit !== undefined) searchParams.append('limit', String(params.limit));

  const str = searchParams.toString();
  return str ? `?${str}` : '';
}

/**
 * Generate fallback demo data for Sales Progress when API is offline or testing
 */
function getDemoSalesProgress(period: string = '1M'): DashboardSalesProgressResponse {
  const pointsCount = period === '1D' ? 24 : period === '5D' ? 5 : period === '1M' ? 30 : 12;
  const labels = Array.from({ length: pointsCount }, (_, i) => {
    if (period === '1D') return `${String(i).padStart(2, '0')}:00`;
    if (period === '5D' || period === '1M') return `${i + 1} Jul`;
    return `Month ${i + 1}`;
  });

  let runningSales = 0;
  let runningMargin = 0;
  const dataPoints = labels.map((label, idx) => {
    const sales = Math.floor(Math.random() * 4000) + (idx % 3 === 0 ? 3000 : 800);
    const purchaseCost = Math.round(sales * 0.65);
    const margin = sales - purchaseCost;
    runningSales += sales;
    runningMargin += margin;

    return {
      index: idx,
      bucketStart: new Date(Date.now() - (pointsCount - idx) * 86400000).toISOString(),
      bucketEnd: new Date(Date.now() - (pointsCount - idx - 1) * 86400000).toISOString(),
      dateKey: `2026-07-${String(idx + 1).padStart(2, '0')}`,
      label,
      sales,
      purchaseCost,
      margin,
      orderCount: sales > 0 ? Math.floor(Math.random() * 3) + 1 : 0,
      cumulativeSales: runningSales,
      cumulativeMargin: runningMargin,
    };
  });

  const totalSales = runningSales;
  const totalPurchaseCost = Math.round(runningSales * 0.65);
  const totalMargin = totalSales - totalPurchaseCost;

  return {
    meta: {
      period,
      startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
      endDate: new Date().toISOString(),
      granularity: period === '1D' ? 'hour' : 'day',
      totalBuckets: pointsCount,
      currency: 'UZS',
    },
    summary: {
      currency: 'UZS',
      totalSales,
      totalPurchaseCost,
      totalMargin,
      marginPercentage: totalSales > 0 ? Number(((totalMargin / totalSales) * 100).toFixed(2)) : 0,
      totalOrders: 42,
      averageOrderValue: Number((totalSales / 42).toFixed(2)),
      completedOrders: 32,
      pendingOrders: 10,
      growthRateSales: 16.4,
      growthRateMargin: 19.2,
    },
    dataPoints,
  };
}

function getDemoSummary(): DashboardSummaryResponse {
  return {
    currency: 'UZS',
    totalSales: 124500.0,
    totalPurchaseCost: 81200.0,
    totalMargin: 43300.0,
    marginPercentage: 34.78,
    totalOrders: 42,
    completedOrders: 32,
    waitingOrders: 10,
    inTransitOrders: 9,
    activeOrders: 14,
    statusCounts: {
      waiting: 2,
      station: 2,
      on_the_way: 9,
      on_the_border: 1,
      reload: 0,
      arrived: 28,
    },
    averageOrderValue: 2964.29,
    totalVolume: 412.8,
    totalWeight: 18450.0,
    ltlOrderCount: 18,
    ftlOrderCount: 24,
    salesGrowthVsPriorPeriod: 16.4,
    marginGrowthVsPriorPeriod: 19.2,
    monthly: {
      revenue: 54200.0,
      purchaseCost: 38900.0,
      netProfit: 15300.0,
      marginPercentage: 28.23,
      revenueGrowthRate: 12.5,
      netProfitGrowthRate: 18.2,
      orderCount: 18,
    },
    yearly: {
      revenue: 348000.0,
      purchaseCost: 252000.0,
      netProfit: 96000.0,
      marginPercentage: 27.59,
      revenueGrowthRate: 34.8,
      netProfitGrowthRate: 41.2,
      orderCount: 115,
    },
    debtSummary: {
      currency: 'USD',
      accountsReceivable: 24500.0,
      accountsPayable: 17800.0,
      netBalance: 6700.0,
      debtorClientCount: 8,
      creditorCarrierCount: 5,
    },
    deliveryEfficiency: {
      averageTransitDays: 11.4,
      minTransitDays: 4,
      maxTransitDays: 22,
      totalDeliveredCount: 28,
      totalInTransitCount: 9,
      totalActiveCount: 14,
      onTimeDeliveriesCount: 26,
      delayedDeliveriesCount: 2,
      onTimeRatePercentage: 92.86,
    },
  };
}

function getDemoCargoDistribution(): DashboardCargoDistributionResponse {
  return {
    transportTypeDistribution: [
      {
        type: 'AUTO',
        name: 'Avtotransport (Fura / Yuk mashinasi)',
        count: 22,
        percentage: 52.38,
        totalSales: 68000.0,
        totalMargin: 19500.0,
        totalVolume: 280.0,
        totalWeight: 11000.0,
      },
      {
        type: 'RAILWAY',
        name: "Temir yo'l (Konteyner / Vagon)",
        count: 14,
        percentage: 33.33,
        totalSales: 42500.0,
        totalMargin: 12000.0,
        totalVolume: 140.0,
        totalWeight: 6500.0,
      },
      {
        type: 'AIR',
        name: 'Havo transporti (Avia)',
        count: 4,
        percentage: 9.52,
        totalSales: 14000.0,
        totalMargin: 3800.0,
        totalVolume: 20.5,
        totalWeight: 450.0,
      },
      {
        type: 'SEA',
        name: 'Dengiz transporti (Kema / Port)',
        count: 2,
        percentage: 4.76,
        totalSales: 4000.0,
        totalMargin: 900.0,
        totalVolume: 10.0,
        totalWeight: 250.0,
      },
    ],
    cargoTypeDistribution: [
      { category: 'FTL', count: 24, totalSales: 78000.0, percentage: 62.65 },
      { category: 'LTL', count: 18, totalSales: 46500.0, percentage: 37.35 },
    ],
    statusDistribution: [
      { category: 'Arrived', count: 22, totalSales: 68000.0, percentage: 54.62 },
      { category: 'On the way', count: 10, totalSales: 31000.0, percentage: 24.9 },
      { category: 'Waiting', count: 6, totalSales: 16500.0, percentage: 13.25 },
      { category: 'On the border', count: 4, totalSales: 9000.0, percentage: 7.23 },
    ],
  };
}

function getDemoRouteAnalytics(): DashboardRouteAnalyticsResponse {
  return {
    currency: 'USD',
    topRoutes: [
      {
        route: "China – O'zbekiston",
        originCountry: 'China',
        originCity: 'Guangzhou',
        destinationCountry: "O'zbekiston",
        destinationCity: 'Tashkent',
        count: 24,
        percentage: 57.14,
        totalSales: 76000.0,
        totalMargin: 21500.0,
        totalVolume: 260.0,
        totalWeight: 10500.0,
      },
      {
        route: "Turkey – O'zbekiston",
        originCountry: 'Turkey',
        originCity: 'Istanbul',
        destinationCountry: "O'zbekiston",
        destinationCity: 'Tashkent',
        count: 12,
        percentage: 28.57,
        totalSales: 38000.0,
        totalMargin: 10800.0,
        totalVolume: 130.0,
        totalWeight: 5200.0,
      },
      {
        route: "Russia – O'zbekiston",
        originCountry: 'Russia',
        originCity: 'Moscow',
        destinationCountry: "O'zbekiston",
        destinationCity: 'Samarkand',
        count: 6,
        percentage: 14.29,
        totalSales: 14500.0,
        totalMargin: 4200.0,
        totalVolume: 60.5,
        totalWeight: 2500.0,
      },
    ],
    originCountries: [
      {
        countryName: 'China',
        count: 24,
        percentage: 57.14,
        totalSales: 76000.0,
        totalVolume: 260.0,
        totalWeight: 10500.0,
      },
      {
        countryName: 'Turkey',
        count: 12,
        percentage: 28.57,
        totalSales: 38000.0,
        totalVolume: 130.0,
        totalWeight: 5200.0,
      },
      {
        countryName: 'Russia',
        count: 6,
        percentage: 14.29,
        totalSales: 14500.0,
        totalVolume: 60.5,
        totalWeight: 2500.0,
      },
    ],
  };
}

function getDemoDeliveryEfficiency(): DashboardDeliveryEfficiencyResponse {
  return {
    currency: 'USD',
    averageTransitDays: 11.4,
    minTransitDays: 4,
    maxTransitDays: 22,
    totalDeliveredCount: 28,
    totalInTransitCount: 9,
    totalActiveCount: 14,
    onTimeDeliveriesCount: 26,
    delayedDeliveriesCount: 2,
    onTimeRatePercentage: 92.86,
    statusBreakdown: [
      {
        status: 'Arrived',
        label: 'Arrived',
        count: 28,
        percentage: 66.67,
        totalSales: 89000.0,
        totalVolume: 290.0,
        totalWeight: 12000.0,
      },
      {
        status: 'On the way',
        label: 'On the way',
        count: 9,
        percentage: 21.43,
        totalSales: 27500.0,
        totalVolume: 100.0,
        totalWeight: 4200.0,
      },
    ],
    routeTransitTimes: [
      { route: "China – O'zbekiston", averageTransitDays: 12.8, count: 18 },
      { route: "Turkey – O'zbekiston", averageTransitDays: 8.5, count: 10 },
    ],
  };
}

function getDemoDebtSummary(): DashboardDebtSummaryResponse {
  return {
    currency: 'USD',
    accountsReceivable: 24500.0,
    accountsPayable: 17800.0,
    netBalance: 6700.0,
    debtorClientCount: 8,
    creditorCarrierCount: 5,
    topDebtorClients: [
      {
        clientId: 'cli-1',
        clientName: 'OOO Global Express',
        companyName: 'Global Express LLC',
        amount: 12000.0,
        orderCount: 4,
      },
      {
        clientId: 'cli-2',
        clientName: 'Orient Trans Services',
        companyName: 'Orient Trans LLC',
        amount: 7500.0,
        orderCount: 3,
      },
    ],
    topCreditorCarriers: [
      { agentName: 'Silk Road Logistics', amount: 9500.0, orderCount: 3 },
      { agentName: 'Baytur Turkish', amount: 5200.0, orderCount: 2 },
    ],
  };
}

function getDemoTopPerformers(): DashboardTopPerformersResponse {
  return {
    topManagers: [
      {
        employeeId: 'emp-1',
        employeeName: 'Ali Valiyev',
        departmentName: 'Sales Department',
        totalSales: 45000.0,
        totalMargin: 15800.0,
        orderCount: 14,
      },
      {
        employeeId: 'emp-2',
        employeeName: 'Sardor Rahimov',
        departmentName: 'Logistics Dept',
        totalSales: 38200.0,
        totalMargin: 13100.0,
        orderCount: 11,
      },
      {
        employeeId: 'emp-3',
        employeeName: 'Malika Axmedova',
        departmentName: 'Key Accounts',
        totalSales: 24300.0,
        totalMargin: 8400.0,
        orderCount: 9,
      },
      {
        employeeId: 'emp-4',
        employeeName: 'Jasur Karimov',
        departmentName: 'Sales Department',
        totalSales: 17000.0,
        totalMargin: 6000.0,
        orderCount: 8,
      },
    ],
    topClients: [
      {
        clientId: 'cli-1',
        clientName: 'Global Logistics LLC',
        companyName: 'OOO Express Freight',
        totalSales: 38000.0,
        totalMargin: 13200.0,
        orderCount: 12,
      },
      {
        clientId: 'cli-2',
        clientName: 'Orient Trans Services',
        companyName: 'Orient Trans LLC',
        totalSales: 29500.0,
        totalMargin: 10100.0,
        orderCount: 10,
      },
      {
        clientId: 'cli-3',
        clientName: 'Silk Road Logistics',
        companyName: 'FE Silk Road Trading',
        totalSales: 21000.0,
        totalMargin: 7400.0,
        orderCount: 7,
      },
      {
        clientId: 'cli-4',
        clientName: 'Asia Cargo Import',
        companyName: 'OOO Asia Cargo',
        totalSales: 16000.0,
        totalMargin: 5600.0,
        orderCount: 6,
      },
    ],
  };
}

export const dashboardApi = {
  getSalesProgress: async (
    params?: DashboardFilterParams
  ): Promise<DashboardSalesProgressResponse> => {
    try {
      const q = buildQueryString(params);
      return await request<DashboardSalesProgressResponse>(`/dashboard/sales-progress${q}`, {
        method: 'GET',
      });
    } catch {
      return getDemoSalesProgress(params?.period);
    }
  },

  getSummary: async (params?: DashboardFilterParams): Promise<DashboardSummaryResponse> => {
    try {
      const q = buildQueryString(params);
      return await request<DashboardSummaryResponse>(`/dashboard/summary${q}`, { method: 'GET' });
    } catch {
      return getDemoSummary();
    }
  },

  getCargoDistribution: async (
    params?: DashboardFilterParams
  ): Promise<DashboardCargoDistributionResponse> => {
    try {
      const q = buildQueryString(params);
      return await request<DashboardCargoDistributionResponse>(
        `/dashboard/cargo-distribution${q}`,
        { method: 'GET' }
      );
    } catch {
      return getDemoCargoDistribution();
    }
  },

  getTopPerformers: async (
    params?: DashboardFilterParams
  ): Promise<DashboardTopPerformersResponse> => {
    try {
      const q = buildQueryString(params);
      return await request<DashboardTopPerformersResponse>(`/dashboard/top-performers${q}`, {
        method: 'GET',
      });
    } catch {
      return getDemoTopPerformers();
    }
  },

  getRouteAnalytics: async (
    params?: DashboardFilterParams
  ): Promise<DashboardRouteAnalyticsResponse> => {
    try {
      const q = buildQueryString({ ...params, limit: params?.limit ?? 10 });
      return await request<DashboardRouteAnalyticsResponse>(`/dashboard/route-analytics${q}`, {
        method: 'GET',
      });
    } catch {
      return getDemoRouteAnalytics();
    }
  },

  getDeliveryEfficiency: async (
    params?: DashboardFilterParams
  ): Promise<DashboardDeliveryEfficiencyResponse> => {
    try {
      const q = buildQueryString(params);
      return await request<DashboardDeliveryEfficiencyResponse>(
        `/dashboard/delivery-efficiency${q}`,
        { method: 'GET' }
      );
    } catch {
      return getDemoDeliveryEfficiency();
    }
  },

  getDebtSummary: async (params?: DashboardFilterParams): Promise<DashboardDebtSummaryResponse> => {
    try {
      const q = buildQueryString(params);
      return await request<DashboardDebtSummaryResponse>(`/dashboard/debt-summary${q}`, {
        method: 'GET',
      });
    } catch {
      return getDemoDebtSummary();
    }
  },
};
