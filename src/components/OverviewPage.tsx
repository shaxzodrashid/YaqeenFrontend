import { useEffect, useState, useCallback } from 'react';
import { Card, Button } from '@heroui/react';
import { motion } from 'framer-motion';
import {
  Users,
  Building2,
  ArrowRight,
  DollarSign,
  ShieldCheck,
  Package,
  FileText,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { usePermissions } from '../context/PermissionsContext';
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
} from '../services/api';
import type { PageId } from './Sidebar';
import { T } from './T';
import { DashboardFilters } from './dashboard/DashboardFilters';
import { DashboardKpiCards } from './dashboard/DashboardKpiCards';
import { SalesProgressChart } from './dashboard/SalesProgressChart';
import { CargoDistributionCharts } from './dashboard/CargoDistributionCharts';
import { TopPerformersLeaderboard } from './dashboard/TopPerformersLeaderboard';

interface OverviewPageProps {
  isAdmin: boolean;
  onNavigate: (page: PageId) => void;
}

export function OverviewPage({ isAdmin: _isAdmin, onNavigate }: OverviewPageProps) {
  const { canRead } = usePermissions();

  // Filter State
  const [filters, setFilters] = useState<DashboardFilterParams>({
    period: '1M',
    currency: 'UZS',
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
      const [salesRes, summaryRes, distRes, topRes] = await Promise.all([
        api.dashboard.getSalesProgress(filters),
        api.dashboard.getSummary(filters),
        api.dashboard.getCargoDistribution(filters),
        api.dashboard.getTopPerformers({ ...filters, limit: 5 }),
      ]);

      setSalesProgressData(salesRes);
      setSummaryData(summaryRes);
      setCargoDistData(distRes);
      setTopPerformersData(topRes);
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
      currency: 'UZS',
      cargo_type: '',
      status: '',
      employee_id: '',
      client_id: '',
      start_date: undefined,
      end_date: undefined,
    });
  };

  const quickActionCards = [
    {
      moduleKey: 'cargo_kpi',
      pageId: 'cargo' as PageId,
      icon: <Package className="size-5" />,
      titleKey: 'navCargoKpi',
      descKey: 'ovCargoKpiDesc',
    },
    {
      moduleKey: 'commercial_offers',
      pageId: 'commercial' as PageId,
      icon: <FileText className="size-5" />,
      titleKey: 'commercialOffersTitle',
      descKey: 'commercialOffersSubtitle',
    },
    {
      moduleKey: 'finance',
      pageId: 'finance' as PageId,
      icon: <DollarSign className="size-5" />,
      titleKey: 'finTitle',
      descKey: 'finSubtitle',
    },
    {
      moduleKey: 'employees',
      pageId: 'employees' as PageId,
      icon: <Users className="size-5" />,
      titleKey: 'ovManageEmployees',
      descKey: 'ovManageEmployeesDesc',
    },
    {
      moduleKey: 'departments',
      pageId: 'departments' as PageId,
      icon: <Building2 className="size-5" />,
      titleKey: 'ovManageDepartments',
      descKey: 'ovManageDepartmentsDesc',
    },
    {
      moduleKey: 'roles',
      pageId: 'roles' as PageId,
      icon: <ShieldCheck className="size-5" />,
      titleKey: 'rolesTitle',
      descKey: 'rolesSubtitle',
    },
  ].filter((card) => canRead(card.moduleKey));

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
              {new Date().toLocaleDateString('en-US', {
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

      {/* 4. Sales Progress Interactive Chart */}
      <div>
        <SalesProgressChart data={salesProgressData} loading={loading} />
      </div>

      {/* 5. Donut Cargo & Status Distribution Charts */}
      <div>
        <CargoDistributionCharts
          data={cargoDistData}
          loading={loading}
          currency={summaryData?.currency || salesProgressData?.meta?.currency || 'UZS'}
        />
      </div>

      {/* 6. Top Performers Leaderboards */}
      <div>
        <TopPerformersLeaderboard
          data={topPerformersData}
          loading={loading}
          currency={summaryData?.currency || salesProgressData?.meta?.currency || 'UZS'}
        />
      </div>

      {/* 7. Quick Operational Actions */}
      {quickActionCards.length > 0 && (
        <div className="flex flex-col gap-4 pt-4 border-t border-border/40 dark:border-night-border/40">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-serif text-foreground dark:text-night-text flex items-center gap-2">
              <Sparkles className="size-4.5 text-brand-gold" />
              <span>
                <T k="ovShortcutsTitle" />
              </span>
            </h2>
            <span className="text-xs text-muted">
              <T k="ovShortcutsSubtitle" />
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActionCards.map((card) => (
              <Card
                key={card.pageId}
                className="group p-5 border border-border/50 dark:border-night-border bg-surface dark:bg-night-surface rounded-2xl hover:border-brand-gold/50 hover:shadow-lg transition-colors duration-200 cursor-pointer"
                onClick={() => onNavigate(card.pageId)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="size-10 rounded-xl bg-brand-gold/15 flex items-center justify-center text-brand-gold">
                      {card.icon}
                    </div>
                    <h3 className="text-sm font-bold text-foreground dark:text-night-text mt-1">
                      <T k={card.titleKey} />
                    </h3>
                    <p className="text-xs text-muted dark:text-night-muted leading-relaxed line-clamp-2">
                      <T k={card.descKey} />
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    isIconOnly
                    size="sm"
                    className="text-muted group-hover:text-brand-gold group-hover:bg-brand-gold/10 transition-colors duration-200 shrink-0"
                    onPress={() => onNavigate(card.pageId)}
                  >
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
