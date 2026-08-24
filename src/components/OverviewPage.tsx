import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
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
import { DashboardFilters } from './dashboard/DashboardFilters';
import { DashboardKpiCards } from './dashboard/DashboardKpiCards';
import { SalesProgressChart } from './dashboard/SalesProgressChart';
import { LogisticsOperationsHub } from './dashboard/LogisticsOperationsHub';
import { StakeholderFinancialHub } from './dashboard/StakeholderFinancialHub';

interface OverviewPageProps {
  isAdmin?: boolean;
  onNavigate?: (page: PageId) => void;
}

export function OverviewPage({ isAdmin: _isAdmin, onNavigate: _onNavigate }: OverviewPageProps) {
  const { locale } = useTranslation();

  const dateLocaleMap: Record<Locale, string> = {
    uz: 'uz-UZ',
    ru: 'ru-RU',
    en: 'en-US',
  };

  // Filter State
  const [filters, setFilters] = useState<DashboardFilterParams>({
    period: '1M',
    currency: 'USD',
    cargo_type: '',
    status: '',
    employee_id: '',
    client_id: '',
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
    setFilters({
      period: '1M',
      currency: 'USD',
      cargo_type: '',
      status: '',
      employee_id: '',
      client_id: '',
      start_date: undefined,
      end_date: undefined,
    });
  };

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
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-extrabold font-serif text-foreground dark:text-night-text tracking-tight">
              <T k="ovDashboardTitle" />
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <T k="ovLiveErpBadge" />
            </span>
          </div>
          <p className="text-xs md:text-sm text-muted dark:text-night-muted mt-1">
            <T k="ovDashboardSubtitle" />
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border text-muted transition-colors duration-200">
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

      {/* 3. Executive KPI Cards Grid with Multi-Spec Run-Rate Switcher */}
      <div>
        <DashboardKpiCards summary={summaryData} loading={loading} />
      </div>

      {/* 4. Financial Trajectory & Run-Rate Analytics Hub */}
      <div>
        <SalesProgressChart data={salesProgressData} summary={summaryData} loading={loading} />
      </div>

      {/* 5. Consolidated Logistics & Fleet Operations Hub (Corridors + Modalities + Delivery Speed + Status Pipeline) */}
      <div>
        <LogisticsOperationsHub
          cargoDist={cargoDistData}
          routeData={routeData}
          deliveryData={deliveryData}
          loading={loading}
          currency={summaryData?.currency || salesProgressData?.meta?.currency || 'USD'}
        />
      </div>

      {/* 6. Consolidated Stakeholder & Financial Hub (Top Managers + Top Clients + Receivables/Payables Debt Ledger) */}
      <div>
        <StakeholderFinancialHub
          topPerformers={topPerformersData}
          debtSummary={debtData}
          loading={loading}
          currency={summaryData?.currency || salesProgressData?.meta?.currency || 'USD'}
        />
      </div>
    </motion.div>
  );
}
