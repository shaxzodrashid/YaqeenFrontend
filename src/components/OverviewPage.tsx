import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, LayoutDashboard, Truck, Trophy } from 'lucide-react';
import { useTranslation, type Locale } from '../context/LanguageContext';
import { api } from '../services/api';

import type {
  Employee,
  Client,
  ClientPaginatedResponse,
  DashboardFilterParams,
  DashboardSalesProgressResponse,
  DashboardSummaryResponse,
  DashboardCargoDistributionResponse,
  DashboardTopPerformersResponse,
  DashboardRouteAnalyticsResponse,
  DashboardDeliveryEfficiencyResponse,
  DashboardDebtSummaryResponse,
} from '../services/api';
import type { PageId } from './Sidebar';
import { T } from './T';
import { DashboardFilters, getThisMonthDateRange } from './dashboard/DashboardFilters';
import { DashboardKpiCards } from './dashboard/DashboardKpiCards';
import { SalesProgressChart } from './dashboard/SalesProgressChart';
import { LogisticsOperationsHub } from './dashboard/LogisticsOperationsHub';
import { StakeholderFinancialHub } from './dashboard/StakeholderFinancialHub';
import {
  TransportModalityMixDiagram,
  CargoStatusPipelineDiagram,
  DeliverySpeedometerDiagram,
  TradeCorridorsVisualDiagram,
  WorkingCapitalFlowDiagram,
  CommercialLeadersVisualDiagram,
} from './dashboard/ExecutiveOverviewDiagrams';

interface OverviewPageProps {
  isAdmin?: boolean;
  onNavigate?: (page: PageId) => void;
}

type OverviewTab = 'executive' | 'logistics' | 'commercial';

export function OverviewPage({ isAdmin: _isAdmin, onNavigate: _onNavigate }: OverviewPageProps) {
  const { locale, t } = useTranslation();
  const [activeTab, setActiveTab] = useState<OverviewTab>('executive');

  const dateLocaleMap: Record<Locale, string> = {
    uz: 'uz-UZ',
    ru: 'ru-RU',
    en: 'en-US',
  };

  const defaultRange = getThisMonthDateRange();

  // Filter State
  const [filters, setFilters] = useState<DashboardFilterParams>({
    period: '1M',
    currency: 'USD',
    cargo_type: '',
    status: '',
    employee_id: '',
    client_id: '',
    start_date: defaultRange.start_date,
    end_date: defaultRange.end_date,
  });

  // API Data State
  const [loading, setLoading] = useState(true);
  const [salesProgressData, setSalesProgressData] = useState<DashboardSalesProgressResponse | null>(
    null
  );
  const [summaryData, setSummaryData] = useState<DashboardSummaryResponse | null>(null);
  const [cargoDistData, setCargoDistData] = useState<DashboardCargoDistributionResponse | null>(
    null
  );
  const [topPerformersData, setTopPerformersData] = useState<DashboardTopPerformersResponse | null>(
    null
  );
  const [routeData, setRouteData] = useState<DashboardRouteAnalyticsResponse | null>(null);
  const [deliveryData, setDeliveryData] = useState<DashboardDeliveryEfficiencyResponse | null>(
    null
  );
  const [debtData, setDebtData] = useState<DashboardDebtSummaryResponse | null>(null);

  // Lists for dropdown options
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Fetch dropdown lists once
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [empRes, cliRes] = await Promise.all([
          api.employees.list({ page: 1, limit: 100 }),
          api.clients.list({ page: 1, limit: 100 }),
        ]);
        setEmployees(empRes.items || []);
        setClients((cliRes as ClientPaginatedResponse).data || []);
      } catch {
        // Non-critical
      }
    };
    fetchLists();
  }, []);

  // Fetch all dashboard analytics
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, summaryRes, distRes, topRes, routeRes, deliveryRes, debtRes] =
        await Promise.all([
          api.dashboard.getSalesProgress(filters),
          api.dashboard.getSummary(filters),
          api.dashboard.getCargoDistribution(filters),
          api.dashboard.getTopPerformers({ ...filters, limit: 5 }),
          api.dashboard.getRouteAnalytics({ ...filters, limit: 5 }),
          api.dashboard.getDeliveryEfficiency(filters),
          api.dashboard.getDebtSummary(filters),
        ]);

      setSalesProgressData(salesRes);
      setSummaryData(summaryRes);
      setCargoDistData(distRes);
      setTopPerformersData(topRes);
      setRouteData(routeRes);
      setDeliveryData(deliveryRes);
      setDebtData(debtRes);
    } catch {
      // Handled by service fallbacks
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleFilterChange = (newFilters: Partial<DashboardFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    const tm = getThisMonthDateRange();
    setFilters({
      period: '1M',
      currency: 'USD',
      cargo_type: '',
      status: '',
      employee_id: '',
      client_id: '',
      start_date: tm.start_date,
      end_date: tm.end_date,
    });
  };

  const currency = summaryData?.currency || salesProgressData?.meta?.currency || 'USD';
  const topRoutes = routeData?.topRoutes || [];
  const topManagers = topPerformersData?.topManagers || [];
  const transportDist = cargoDistData?.transportTypeDistribution || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-6 w-full pb-10 transition-colors duration-200"
    >
      {/* 1. Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-serif text-foreground dark:text-night-text tracking-tight">
            <T k="ovDashboardTitle" />
          </h1>
          <p className="text-xs md:text-sm text-muted dark:text-night-muted mt-1">
            <T k="ovDashboardSubtitle" />
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border text-muted transition-colors duration-200 shadow-2xs">
            <Calendar className="size-3.5 text-brand-gold" />
            <span>
              {new Date().toLocaleDateString(dateLocaleMap[locale] || 'uz-UZ', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Global Filter Toolbar */}
      <div>
        <DashboardFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          onRefresh={fetchDashboardData}
          loading={loading}
          employees={employees}
          clients={clients}
        />
      </div>

      {/* 3. Executive KPI Cards Grid */}
      <div>
        <DashboardKpiCards summary={summaryData} loading={loading} />
      </div>

      {/* 4. Executive View Segmented Tab Switcher */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border/70 w-full sm:w-fit shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('executive')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
            activeTab === 'executive'
              ? 'bg-brand-gold text-neutral-950 shadow-xs'
              : 'text-muted dark:text-night-muted hover:text-foreground dark:hover:text-night-text hover:bg-border/20 dark:hover:bg-night-border/40'
          }`}
        >
          <LayoutDashboard className="size-4" />
          <span>{t('ovTabExecutiveSummary')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logistics')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
            activeTab === 'logistics'
              ? 'bg-brand-gold text-neutral-950 shadow-xs'
              : 'text-muted dark:text-night-muted hover:text-foreground dark:hover:text-night-text hover:bg-border/20 dark:hover:bg-night-border/40'
          }`}
        >
          <Truck className="size-4" />
          <span>{t('ovTabLogistics')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('commercial')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
            activeTab === 'commercial'
              ? 'bg-brand-gold text-neutral-950 shadow-xs'
              : 'text-muted dark:text-night-muted hover:text-foreground dark:hover:text-night-text hover:bg-border/20 dark:hover:bg-night-border/40'
          }`}
        >
          <Trophy className="size-4" />
          <span>{t('ovTabCommercial')}</span>
        </button>
      </div>

      {/* 5. Dynamic Tab Content View */}
      <AnimatePresence mode="wait">
        {activeTab === 'executive' && (
          <motion.div
            key="tab-executive"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-6 w-full"
          >
            {/* 1. Hero Financial Trajectory Chart */}
            <SalesProgressChart data={salesProgressData} summary={summaryData} loading={loading} />

            {/* 2. Visual Operational Diagrams Cockpit (3 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              <TransportModalityMixDiagram
                data={transportDist}
                currency={currency}
                onNavigateLogistics={() => setActiveTab('logistics')}
              />
              <CargoStatusPipelineDiagram
                statusDist={cargoDistData?.statusDistribution || []}
                statusBreakdown={deliveryData?.statusBreakdown}
                onNavigateLogistics={() => setActiveTab('logistics')}
              />
              <DeliverySpeedometerDiagram
                deliveryData={deliveryData}
                onNavigateLogistics={() => setActiveTab('logistics')}
              />
            </div>

            {/* 3. Geographic Flow, Working Capital & Commercial Leaders (3 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              <TradeCorridorsVisualDiagram
                topRoutes={topRoutes}
                currency={currency}
                onNavigateLogistics={() => setActiveTab('logistics')}
              />
              <WorkingCapitalFlowDiagram
                debtData={debtData}
                currency={currency}
                onNavigateCommercial={() => setActiveTab('commercial')}
              />
              <CommercialLeadersVisualDiagram
                topManagers={topManagers}
                topClients={topPerformersData?.topClients || []}
                currency={currency}
                onNavigateCommercial={() => setActiveTab('commercial')}
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'logistics' && (
          <motion.div
            key="tab-logistics"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <LogisticsOperationsHub
              cargoDist={cargoDistData}
              routeData={routeData}
              deliveryData={deliveryData}
              loading={loading}
              currency={currency}
            />
          </motion.div>
        )}

        {activeTab === 'commercial' && (
          <motion.div
            key="tab-commercial"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <StakeholderFinancialHub
              topPerformers={topPerformersData}
              debtSummary={debtData}
              loading={loading}
              currency={currency}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
