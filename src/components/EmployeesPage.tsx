import { useEffect, useState, useCallback } from 'react';
import { Button, Pagination, Skeleton, Avatar, Modal, Spinner } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  UserX,
  UserCheck,
  Users,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  Activity,
  Briefcase,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { usePermissions } from '../context/PermissionsContext';
import { api, tokenStore, getImageUrl } from '../services/api';
import type { Employee, Department, PaginatedResponse, ApiError } from '../services/api';
import { EmployeeFormModal } from './EmployeeFormModal';
import { EmployeeProfilePage } from './EmployeeProfilePage';
import { T } from './T';

type Currency = 'RUB' | 'USD' | 'UZS';

interface EnrichedEmployee extends Employee {
  position_title: string;
  user_status: 'Pending' | 'Open' | 'Banned' | 'Deleted' | string;
  revenue_rub: number;
  plan_target: string; // e.g. "3 800 000 ₽" or "20 шт"
  plan_percent: number;
  plan_status_label: 'Выполнен' | 'В процессе' | 'Отстаёт';
  clients_count: number;
  accent_color: string;
}

const DEFAULT_PRESETS: Partial<EnrichedEmployee>[] = [
  {
    first_name: 'Артём',
    last_name: 'Ковалёв',
    position_title: 'Менеджер по продажам',
    user_status: 'Open',
    revenue_rub: 4400000,
    plan_target: '3 800 000 ₽',
    plan_percent: 116,
    plan_status_label: 'Выполнен',
    clients_count: 2,
    accent_color: '#F59E0B',
  },
  {
    first_name: 'Диана',
    last_name: 'Ким',
    position_title: 'Менеджер по продажам',
    user_status: 'Open',
    revenue_rub: 3410000,
    plan_target: '3 200 000 ₽',
    plan_percent: 107,
    plan_status_label: 'Выполнен',
    clients_count: 1,
    accent_color: '#06B6D4',
  },
  {
    first_name: 'Руслан',
    last_name: 'Иманов',
    position_title: 'Ст. менеджер',
    user_status: 'Pending',
    revenue_rub: 2695000,
    plan_target: '20 шт',
    plan_percent: 95,
    plan_status_label: 'В процессе',
    clients_count: 1,
    accent_color: '#3B82F6',
  },
  {
    first_name: 'Ольга',
    last_name: 'Северина',
    position_title: 'Менеджер СГ',
    user_status: 'Open',
    revenue_rub: 946000,
    plan_target: '900 000 ₽',
    plan_percent: 105,
    plan_status_label: 'Выполнен',
    clients_count: 1,
    accent_color: '#EF4444',
  },
  {
    first_name: 'Павел',
    last_name: 'Гриц',
    position_title: 'Менеджер СГ',
    user_status: 'Banned',
    revenue_rub: 726000,
    plan_target: '700 000 ₽',
    plan_percent: 104,
    plan_status_label: 'Выполнен',
    clients_count: 1,
    accent_color: '#8B5CF6',
  },
  {
    first_name: 'Ева',
    last_name: 'Тарасова',
    position_title: 'Маркетолог',
    user_status: 'Open',
    revenue_rub: 0,
    plan_target: '10 шт',
    plan_percent: 0,
    plan_status_label: 'Отстаёт',
    clients_count: 0,
    accent_color: '#06B6D4',
  },
  {
    first_name: 'Игорь',
    last_name: 'Марченко',
    position_title: 'Декларант',
    user_status: 'Open',
    revenue_rub: 0,
    plan_target: '30 шт',
    plan_percent: 117,
    plan_status_label: 'Выполнен',
    clients_count: 0,
    accent_color: '#14B8A6',
  },
];

/* ── Animation variants ────────────────────────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 320, damping: 26 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 26 } },
  exit: { opacity: 0, y: -8 },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
  exit: { opacity: 0, scale: 0.95 },
};

/* ── Helpers ──────────────────────────────────────────────── */

function StatusBadge({ status }: { status?: string }) {
  const normalizedStatus = (status || 'Open').trim();
  const lower = normalizedStatus.toLowerCase();

  let config = {
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    key: 'statusOpen',
    pulse: true,
  };

  if (lower === 'pending') {
    config = {
      dot: 'bg-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      key: 'statusPending',
      pulse: false,
    };
  } else if (lower === 'banned') {
    config = {
      dot: 'bg-rose-500',
      text: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/10 dark:bg-rose-500/15',
      key: 'statusBanned',
      pulse: false,
    };
  } else if (lower === 'deleted') {
    config = {
      dot: 'bg-neutral-400 dark:bg-slate-500',
      text: 'text-neutral-500 dark:text-slate-400',
      bg: 'bg-neutral-400/10 dark:bg-slate-500/15',
      key: 'statusDeleted',
      pulse: false,
    };
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${config.bg} ${config.text}`}
    >
      <span
        className={`size-1.5 rounded-full shrink-0 ${config.dot} ${config.pulse ? 'animate-pulse' : ''}`}
      />
      <T k={config.key as any} text={normalizedStatus} />
    </span>
  );
}

function PlanProgressBar({
  percent,
  statusLabel,
  statusCode,
}: {
  percent: number;
  statusLabel: string;
  statusCode?: string;
}) {
  const clamped = Math.min(percent, 150);
  const barWidth = Math.min(clamped, 100);
  const isCompleted = statusCode ? statusCode === 'COMPLETED' : percent >= 100;
  const barColor = isCompleted ? 'bg-emerald-500' : percent >= 80 ? 'bg-amber-500' : 'bg-rose-500';
  const badgeColor = isCompleted
    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
    : percent >= 80
      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400';

  return (
    <div className="flex flex-col gap-1.5 min-w-[120px]">
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${badgeColor}`}>
          {Math.round(percent)}%
        </span>
        <span className="text-[10px] text-muted font-medium">{statusLabel}</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-border/50 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} animate-progress-fill`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────── */

export function EmployeesPage() {
  const { t, locale } = useTranslation();
  const { showNotification } = useNotification();
  const { canCreate, canUpdate, canDelete } = usePermissions();

  // Data state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [meta, setMeta] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
  });
  const [loading, setLoading] = useState(true);

  // Live clock state
  const [currentTime, setCurrentTime] = useState('');

  // Top bar filter states
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedPeriod, setSelectedPeriod] = useState('Июл');
  const [currency, setCurrency] = useState<Currency>('RUB');

  // Category tab state
  const [activeTab, setActiveTab] = useState('all');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [page, setPage] = useState(1);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Profile view state
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Status toggle dialog
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusEmployee, setStatusEmployee] = useState<Employee | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Live time ticker
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const data = (await api.employees.list({
        page,
        limit: 20,
        search: searchQuery || undefined,
        department_id: activeTab === 'all' ? undefined : activeTab,
      })) as PaginatedResponse<Employee>;
      setEmployees(data.items);
      setMeta({
        totalItems: data.meta.totalItems,
        totalPages: data.meta.totalPages,
        currentPage: data.meta.currentPage,
        itemsPerPage: data.meta.itemsPerPage,
      });
    } catch (err) {
      const error = err as ApiError;
      showNotification(t(error?.location || 'internal_error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, activeTab, showNotification, t]);

  const fetchDepartments = useCallback(async () => {
    try {
      const data = await api.departments.list();
      setDepartments(data);
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchInputValue(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setSearchQuery(value);
      setPage(1);
    }, 300);
    setSearchTimeout(timeout);
  };

  const handleCreateEmployee = () => {
    setSelectedEmployee(null);
    setDrawerMode('create');
    setDrawerOpen(true);
  };

  const handleEditEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };

  const handleViewEmployee = (emp: Employee) => {
    setViewingEmployee(emp);
  };

  const handleToggleStatus = (emp: Employee) => {
    setStatusEmployee(emp);
    setStatusOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!statusEmployee) return;
    setStatusLoading(true);
    try {
      await api.employees.update(statusEmployee.id, { is_active: !statusEmployee.is_active });
      showNotification(
        t(statusEmployee.is_active ? 'successEmpDeactivated' : 'successEmpActivated'),
        'success'
      );
      setStatusOpen(false);
      setStatusEmployee(null);
      fetchEmployees();
    } catch (err) {
      const error = err as ApiError;
      showNotification(t(error?.location || 'internal_error'), 'error');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDeleteEmployee = (emp: Employee) => {
    setDeletingEmployee(emp);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingEmployee) return;
    setDeleteLoading(true);
    try {
      await api.employees.delete(deletingEmployee.id);
      showNotification(t('successEmpDeleted'), 'success');
      setDeleteOpen(false);
      setDeletingEmployee(null);
      fetchEmployees();
    } catch (err) {
      const error = err as ApiError;
      showNotification(t(error?.location || 'internal_error'), 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Format amount based on current currency & locale
  const formatMoney = (rubAmount: number) => {
    if (rubAmount === 0) {
      if (currency === 'RUB') return '0 ₽';
      if (currency === 'USD') return '$ 0';
      return locale === 'uz' ? "0 so'm" : locale === 'en' ? '0 UZS' : '0 сум';
    }

    let converted = rubAmount;
    let symbol = ' ₽';
    let prefix = '';

    if (currency === 'USD') {
      converted = Math.round(rubAmount * 0.011);
      symbol = '';
      prefix = '$ ';
    } else if (currency === 'UZS') {
      converted = Math.round(rubAmount * 140);
      symbol = locale === 'uz' ? " so'm" : locale === 'en' ? ' UZS' : ' сум';
      prefix = '';
    }

    const locCode = locale === 'uz' ? 'uz-UZ' : locale === 'en' ? 'en-US' : 'ru-RU';
    const formatted = converted.toLocaleString(locCode);
    return `${prefix}${formatted}${symbol}`;
  };

  // Convert raw plan string (e.g. "3 800 000 ₽" or "20 шт") according to currency
  const formatPlanTarget = (rawPlan: string) => {
    if (rawPlan.includes('шт')) return rawPlan;
    const cleanNum = parseInt(rawPlan.replace(/\D/g, ''), 10);
    if (isNaN(cleanNum)) return rawPlan;
    return formatMoney(cleanNum);
  };

  // Enrich employee with display properties matching design
  const getEnrichedEmployee = (emp: Employee, index: number): EnrichedEmployee => {
    const preset = DEFAULT_PRESETS[index % DEFAULT_PRESETS.length] || {};

    let positionTitle =
      emp.user_role === 'CEO'
        ? t('posCEO')
        : emp.user_role === 'ROP'
          ? t('posROP')
          : t('posSalesManager');
    if (!emp.user_role && preset.position_title) {
      if (preset.position_title.includes('продаж')) positionTitle = t('posSalesManager');
      else if (preset.position_title.includes('Ст.')) positionTitle = t('posSeniorManager');
      else if (preset.position_title.includes('СГ')) positionTitle = t('posGroupageManager');
      else if (preset.position_title.includes('Маркетолог'))
        positionTitle = t('posMarketingSpecialist');
      else if (preset.position_title.includes('Декларант'))
        positionTitle = t('posCustomsDeclarant');
    }

    const userStatus =
      emp.user_status ||
      emp.user?.status ||
      preset.user_status ||
      (emp.is_active === false ? 'Banned' : 'Open');
    const revenueRub =
      emp.tushum?.amount !== undefined
        ? emp.tushum.amount
        : preset.revenue_rub !== undefined
          ? preset.revenue_rub
          : emp.fixed_salary
            ? parseFloat(emp.fixed_salary) * 1.5
            : 3000000;
    const planTarget = emp.reja_fakt?.formatted_plan || preset.plan_target || '3 000 000 ₽';
    const planPercent =
      emp.reja_fakt?.percentage !== undefined
        ? emp.reja_fakt.percentage
        : preset.plan_percent !== undefined
          ? preset.plan_percent
          : 100;

    let planStatusLabel = emp.reja_fakt?.status || t('planDone');
    if (!emp.reja_fakt) {
      if (preset.plan_status_label === 'В процессе' || (planPercent >= 80 && planPercent < 100)) {
        planStatusLabel = t('planInProgress');
      } else if (preset.plan_status_label === 'Отстаёт' || planPercent < 80) {
        planStatusLabel = t('planLagging');
      }
    }

    const clientsCount =
      emp.mijozlar_count !== undefined
        ? emp.mijozlar_count
        : preset.clients_count !== undefined
          ? preset.clients_count
          : 1;
    const accentColor = emp.color || preset.accent_color || '#F59E0B';

    return {
      ...emp,
      position_title: positionTitle,
      user_status: userStatus,
      revenue_rub: revenueRub,
      plan_target: planTarget,
      plan_percent: planPercent,
      plan_status_label: planStatusLabel as any,
      clients_count: clientsCount,
      accent_color: accentColor,
    };
  };

  // If viewing a profile, show it
  if (viewingEmployee) {
    return (
      <EmployeeProfilePage
        employee={viewingEmployee}
        departments={departments}
        onBack={() => setViewingEmployee(null)}
        onEdit={(emp) => {
          setViewingEmployee(null);
          handleEditEmployee(emp);
        }}
      />
    );
  }

  const currentUser = tokenStore.getUser();
  const userRole = currentUser?.role || 'EMPLOYEE';
  const isAdmin = userRole === 'CEO' || userRole === 'ROP';

  // Role permission aware check
  if (!isAdmin) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-lg mx-auto bg-surface dark:bg-surface border border-border/40 rounded-3xl shadow-lg my-8 gap-4"
      >
        <div className="size-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-500">
          <ShieldAlert className="size-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-serif text-foreground">
            <T k="empRoleRestricted" />
          </h2>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            <T k="empRoleRestrictedDesc" />
          </p>
        </div>
        <div className="px-3 py-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold">
          <T k="colRole" />: {userRole}
        </div>
      </motion.div>
    );
  }

  const enrichedEmployeesList = employees.map((emp, i) => getEnrichedEmployee(emp, i));

  // Department tab filtering
  const filteredList = enrichedEmployeesList.filter((emp) => {
    if (activeTab === 'all') return true;
    return emp.department_id === activeTab;
  });

  // Compute quick stats
  const totalRevenue = enrichedEmployeesList.reduce((sum, e) => sum + e.revenue_rub, 0);
  const openCount = enrichedEmployeesList.filter(
    (e) => (e.user_status || '').toLowerCase() === 'open'
  ).length;
  const planDoneCount = enrichedEmployeesList.filter((e) => e.plan_percent >= 100).length;

  const start = (page - 1) * meta.itemsPerPage + 1;
  const end = Math.min(page * meta.itemsPerPage, meta.totalItems);
  const pages = Array.from({ length: meta.totalPages }, (_, i) => i + 1);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-5 text-foreground min-h-screen pb-12"
    >
      {/* ─── Top Header Row ────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold font-serif text-foreground tracking-tight">
            <T k="empTitle" />
          </h1>
          <p className="text-xs text-muted mt-0.5">
            <T k="empSubtitle" />
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Clock Indicator */}
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{currentTime || '00:00:00'}</span>
          </div>

          {/* Add Employee — visible on larger screens here, also below on mobile */}
          {canCreate('employees') && (
            <Button
              onPress={handleCreateEmployee}
              className="hidden sm:flex bg-brand-gold text-brand-navy hover:opacity-90 font-bold text-xs rounded-xl px-4 py-2 h-9 shrink-0 shadow-md"
            >
              <Plus className="size-4 mr-1.5" />
              <T k="empAddNew" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* ─── Summary Stat Cards ────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              key: 'ovTotalEmployees',
              value: loading ? '—' : String(meta.totalItems),
              icon: <Users className="size-5" />,
              color: 'text-blue-500',
              bg: 'bg-blue-500/10 dark:bg-blue-500/15',
            },
            {
              key: 'empOnlineNow',
              value: loading ? '—' : String(openCount),
              icon: <Activity className="size-5" />,
              color: 'text-emerald-500',
              bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
            },
            {
              key: 'empPlanCompleted',
              value: loading ? '—' : String(planDoneCount),
              icon: <TrendingUp className="size-5" />,
              color: 'text-amber-500',
              bg: 'bg-amber-500/10 dark:bg-amber-500/15',
            },
            {
              key: 'empTotalRevenue',
              value: loading ? '—' : formatMoney(totalRevenue),
              icon: <Briefcase className="size-5" />,
              color: 'text-violet-500',
              bg: 'bg-violet-500/10 dark:bg-violet-500/15',
            },
          ].map((stat) => (
            <div
              key={stat.key}
              className="flex items-center gap-3 p-4 rounded-2xl bg-surface dark:bg-surface border border-border/40 hover:shadow-lg hover:border-brand-gold/30 transition-all duration-300"
            >
              <div
                className={`size-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color} shrink-0`}
              >
                {stat.icon}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] sm:text-xs font-medium text-muted truncate">
                  <T k={stat.key} />
                </span>
                <span className="text-base sm:text-lg font-bold text-foreground tracking-tight truncate">
                  {stat.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ─── Control Filters & Currency Switcher Bar ──── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
      >
        {/* Left Filter Dropdowns */}
        <div className="flex items-center gap-3 text-xs">
          {/* Year Filter */}
          <div className="flex items-center gap-2">
            <span className="text-muted font-medium">
              <T k="filterYear" />
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-surface dark:bg-surface border border-border text-foreground text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:border-brand-gold/50 cursor-pointer transition-colors"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-2">
            <span className="text-muted font-medium">
              <T k="filterPeriod" />
            </span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-surface dark:bg-surface border border-border text-foreground text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:border-brand-gold/50 cursor-pointer min-w-[70px] transition-colors"
            >
              <option value="Июл">{t('monthJul')}</option>
              <option value="Июн">{t('monthJun')}</option>
              <option value="Май">{t('monthMay')}</option>
              <option value="Апр">{t('monthApr')}</option>
              <option value="Мар">{t('monthMar')}</option>
              <option value="Фев">{t('monthFeb')}</option>
              <option value="Янв">{t('monthJan')}</option>
            </select>
          </div>
        </div>

        {/* Right Currency Segmented Toggle */}
        <div className="flex items-center bg-surface dark:bg-surface border border-border p-1 rounded-xl text-xs font-medium">
          {(['RUB', 'USD', 'UZS'] as Currency[]).map((cur) => {
            const labels = {
              RUB: '₽ RUB',
              USD: '$ USD',
              UZS: locale === 'uz' ? "so'm UZS" : locale === 'en' ? 'UZS' : 'сум UZS',
            };
            return (
              <button
                key={cur}
                onClick={() => setCurrency(cur)}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 font-semibold cursor-pointer ${
                  currency === cur
                    ? 'bg-brand-gold text-brand-navy font-bold shadow-md'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {labels[cur]}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ─── Category Tabs & Actions Bar ─────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col gap-3">
        {/* Department / Category Pills */}
        <div className="flex items-center overflow-x-auto no-scrollbar gap-1.5 bg-surface dark:bg-surface border border-border/40 p-1.5 rounded-xl">
          {[
            { id: 'all', label: <T k="tabAll" /> },
            ...departments.map((dept) => ({
              id: dept.id,
              label: (() => {
                const key = `tab${dept.name.charAt(0).toUpperCase()}${dept.name.slice(1)}`;
                const translation = t(key);
                return translation !== key ? <T k={key} /> : dept.display_name;
              })(),
            })),
          ].map((tab, idx) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id || idx}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-brand-gold text-brand-navy shadow-md'
                    : 'text-muted hover:text-foreground hover:bg-border/30'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Box & Add Employee */}
        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
            <input
              type="text"
              placeholder={t('empSearch')}
              value={searchInputValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-surface dark:bg-surface border border-border text-foreground placeholder:text-muted focus:outline-none focus:border-brand-gold/60 focus:ring-2 focus:ring-brand-gold/20 transition-all"
            />
          </div>

          {/* Add Employee — visible on mobile here */}
          <Button
            onPress={handleCreateEmployee}
            className="sm:hidden bg-brand-gold text-brand-navy hover:opacity-90 font-bold text-xs rounded-xl px-3 py-2 h-10 shrink-0 shadow-md"
            isIconOnly
          >
            <Plus className="size-5" />
          </Button>
        </div>
      </motion.div>

      {/* ─── Main Employee Content ────────────────────── */}

      {/* ══ DESKTOP TABLE VIEW (hidden on mobile) ═════ */}
      <motion.div
        variants={itemVariants}
        className="hidden md:block bg-surface dark:bg-surface border border-border/40 rounded-2xl overflow-hidden shadow-lg"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-border/60 text-[10px] uppercase font-bold text-muted tracking-wider">
                <th className="py-3.5 px-5 w-[240px]">
                  <T k="colName" />
                </th>
                <th className="py-3.5 px-5">
                  <T k="colRole" />
                </th>
                <th className="py-3.5 px-5">
                  <T k="colStatus" />
                </th>
                <th className="py-3.5 px-5">
                  <T k="colRevenue" />
                </th>
                <th className="py-3.5 px-5">
                  <T k="colPlanFact" />
                </th>
                <th className="py-3.5 px-5 text-center">
                  <T k="colClients" />
                </th>
                <th className="py-3.5 px-5 text-right">
                  <T k="colActions" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="flex flex-col gap-1.5">
                          <Skeleton className="h-4 w-28 rounded" />
                          <Skeleton className="h-3 w-16 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <Skeleton className="h-4 w-32 rounded" />
                    </td>
                    <td className="py-4 px-5">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </td>
                    <td className="py-4 px-5">
                      <Skeleton className="h-4 w-24 rounded" />
                    </td>
                    <td className="py-4 px-5">
                      <Skeleton className="h-4 w-32 rounded" />
                    </td>
                    <td className="py-4 px-5 text-center">
                      <Skeleton className="size-6 rounded-md mx-auto" />
                    </td>
                    <td className="py-4 px-5 text-right">
                      <Skeleton className="h-6 w-20 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="size-16 rounded-2xl bg-brand-gold/10 dark:bg-brand-gold/15 flex items-center justify-center text-brand-gold">
                        <Users className="size-8" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">
                        <T k="empNoEmployees" />
                      </h3>
                      <p className="text-xs text-muted max-w-sm">
                        <T k="empNoEmployeesDesc" />
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredList.map((emp, i) => {
                    const initials =
                      `${emp.first_name?.[0] || ''}${emp.last_name?.[0] || ''}`.toUpperCase();

                    return (
                      <motion.tr
                        key={emp.id}
                        variants={rowVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        transition={{ delay: i * 0.02 }}
                        className="group hover:bg-brand-gold/5 dark:hover:bg-brand-gold/5 transition-colors duration-200 relative"
                      >
                        {/* Left accent */}
                        <td className="py-4 px-5 relative">
                          <div
                            className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full opacity-80"
                            style={{ backgroundColor: emp.accent_color }}
                          />
                          <div className="flex items-center gap-3">
                            <Avatar
                              className="size-10 rounded-full shrink-0 border-2 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                              style={{ borderColor: emp.accent_color }}
                              onClick={() => handleViewEmployee(emp)}
                            >
                              {emp.picture_url && (
                                <Avatar.Image
                                  src={getImageUrl(emp.picture_url)}
                                  alt={`${emp.first_name} ${emp.last_name}`}
                                />
                              )}
                              <Avatar.Fallback
                                className="text-xs font-bold"
                                style={{
                                  backgroundColor: `${emp.accent_color}15`,
                                  color: emp.accent_color,
                                }}
                              >
                                {initials}
                              </Avatar.Fallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <span
                                className="text-sm font-semibold text-foreground truncate hover:text-brand-gold cursor-pointer transition-colors"
                                onClick={() => handleViewEmployee(emp)}
                              >
                                {emp.first_name} {emp.last_name}
                              </span>
                              <span className="text-[11px] text-muted truncate">
                                {emp.position_title}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* ДОЛЖНОСТЬ */}
                        <td className="py-4 px-5">
                          <span className="text-xs text-foreground/80 font-medium">
                            {emp.position_title}
                          </span>
                        </td>

                        {/* СТАТУС */}
                        <td className="py-4 px-5">
                          <StatusBadge status={emp.user_status} />
                        </td>

                        {/* ВЫРУЧКА */}
                        <td className="py-4 px-5">
                          <span className="text-sm font-bold text-foreground tracking-wide">
                            {emp.tushum?.formatted || formatMoney(emp.revenue_rub)}
                          </span>
                        </td>

                        {/* ПЛАН / ФАКТ */}
                        <td className="py-4 px-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-foreground">
                              {emp.reja_fakt?.formatted_plan || formatPlanTarget(emp.plan_target)}
                            </span>
                            <PlanProgressBar
                              percent={emp.reja_fakt?.percentage ?? emp.plan_percent}
                              statusLabel={emp.reja_fakt?.status || emp.plan_status_label}
                              statusCode={emp.reja_fakt?.status_code}
                            />
                          </div>
                        </td>

                        {/* КЛИЕНТЫ */}
                        <td className="py-4 px-5 text-center">
                          <span
                            className="inline-flex items-center justify-center size-7 rounded-lg text-xs font-bold text-white shadow-sm"
                            style={{ backgroundColor: emp.accent_color }}
                          >
                            {emp.mijozlar_count ?? emp.clients_count}
                          </span>
                        </td>

                        {/* ДЕЙСТВИЯ */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="ghost"
                              onPress={() => handleViewEmployee(emp)}
                              className="text-muted hover:text-foreground hover:bg-border/30 rounded-lg size-8"
                            >
                              <Eye className="size-3.5" />
                            </Button>
                            {canUpdate('employees') && (
                              <Button
                                isIconOnly
                                size="sm"
                                variant="ghost"
                                onPress={() => handleEditEmployee(emp)}
                                className="text-muted hover:text-brand-gold hover:bg-brand-gold/10 rounded-lg size-8"
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                            )}
                            {canUpdate('employees') && (
                              <Button
                                isIconOnly
                                size="sm"
                                variant="ghost"
                                onPress={() => handleToggleStatus(emp)}
                                className={`rounded-lg size-8 ${
                                  emp.is_active
                                    ? 'text-muted hover:text-amber-500 hover:bg-amber-500/10'
                                    : 'text-muted hover:text-emerald-500 hover:bg-emerald-500/10'
                                }`}
                              >
                                {emp.is_active ? (
                                  <UserX className="size-3.5" />
                                ) : (
                                  <UserCheck className="size-3.5" />
                                )}
                              </Button>
                            )}
                            {canDelete('employees') && (
                              <Button
                                isIconOnly
                                size="sm"
                                variant="ghost"
                                onPress={() => handleDeleteEmployee(emp)}
                                className="text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg size-8"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Desktop Pagination Footer */}
        {!loading && meta.totalPages > 0 && filteredList.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 border-t border-border/40 gap-3 text-xs bg-surface/50">
            <span className="text-muted">
              <T k="pagShowing" /> {start}–{end} <T k="pagOf" /> {meta.totalItems}{' '}
              <T k="pagResults" />
            </span>
            <Pagination size="sm">
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={page === 1}
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                    className="text-xs text-foreground/70"
                  >
                    <Pagination.PreviousIcon />
                    <T k="pagPrev" />
                  </Pagination.Previous>
                </Pagination.Item>
                {pages.map((p) => (
                  <Pagination.Item key={p}>
                    <Pagination.Link
                      isActive={p === page}
                      onPress={() => setPage(p)}
                      className="text-xs"
                    >
                      {p}
                    </Pagination.Link>
                  </Pagination.Item>
                ))}
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={page === meta.totalPages}
                    onPress={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    className="text-xs text-foreground/70"
                  >
                    <T k="pagNext" />
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </div>
        )}
      </motion.div>

      {/* ══ MOBILE/TABLET CARD VIEW (hidden on desktop) ═ */}
      <div className="md:hidden flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-surface dark:bg-surface border border-border/40"
            >
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="size-12 rounded-full" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
            </div>
          ))
        ) : filteredList.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="size-16 rounded-2xl bg-brand-gold/10 dark:bg-brand-gold/15 flex items-center justify-center text-brand-gold">
              <Users className="size-8" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              <T k="empNoEmployees" />
            </h3>
            <p className="text-xs text-muted max-w-sm text-center">
              <T k="empNoEmployeesDesc" />
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredList.map((emp, i) => {
              const initials =
                `${emp.first_name?.[0] || ''}${emp.last_name?.[0] || ''}`.toUpperCase();

              return (
                <motion.div
                  key={emp.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  transition={{ delay: i * 0.04 }}
                  className="relative p-4 rounded-2xl bg-surface dark:bg-surface border border-border/40 hover:border-brand-gold/30 hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* Left accent stripe */}
                  <div
                    className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full"
                    style={{ backgroundColor: emp.accent_color }}
                  />

                  {/* Top row: avatar + name + status */}
                  <div className="flex items-start gap-3 mb-4 pl-2">
                    <Avatar
                      className="size-12 rounded-full shrink-0 border-2 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                      style={{ borderColor: emp.accent_color }}
                      onClick={() => handleViewEmployee(emp)}
                    >
                      {emp.picture_url && (
                        <Avatar.Image
                          src={getImageUrl(emp.picture_url)}
                          alt={`${emp.first_name} ${emp.last_name}`}
                        />
                      )}
                      <Avatar.Fallback
                        className="text-sm font-bold"
                        style={{
                          backgroundColor: `${emp.accent_color}15`,
                          color: emp.accent_color,
                        }}
                      >
                        {initials}
                      </Avatar.Fallback>
                    </Avatar>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span
                        className="text-sm font-bold text-foreground truncate hover:text-brand-gold cursor-pointer transition-colors"
                        onClick={() => handleViewEmployee(emp)}
                      >
                        {emp.first_name} {emp.last_name}
                      </span>
                      <span className="text-[11px] text-muted truncate">{emp.position_title}</span>
                      <div className="mt-1.5">
                        <StatusBadge status={emp.user_status} />
                      </div>
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 gap-2.5 mb-4 pl-2">
                    <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-border/20 dark:bg-border/10">
                      <span className="text-[10px] text-muted font-medium">
                        <T k="colRevenue" />
                      </span>
                      <span className="text-sm font-bold text-foreground truncate">
                        {emp.tushum?.formatted || formatMoney(emp.revenue_rub)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-border/20 dark:bg-border/10">
                      <span className="text-[10px] text-muted font-medium">
                        <T k="colPlanFact" />
                      </span>
                      <span className="text-sm font-bold text-foreground truncate">
                        {emp.reja_fakt?.formatted_plan || formatPlanTarget(emp.plan_target)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="pl-2 mb-4">
                    <PlanProgressBar
                      percent={emp.reja_fakt?.percentage ?? emp.plan_percent}
                      statusLabel={emp.reja_fakt?.status || emp.plan_status_label}
                      statusCode={emp.reja_fakt?.status_code}
                    />
                  </div>

                  {/* Bottom: clients badge + always-visible action buttons */}
                  <div className="flex items-center justify-between pl-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center justify-center size-7 rounded-lg text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: emp.accent_color }}
                      >
                        {emp.mijozlar_count ?? emp.clients_count}
                      </span>
                      <span className="text-[10px] text-muted">
                        <T k="clientCountSuffix" />
                      </span>
                    </div>

                    {/* Always visible action buttons on mobile */}
                    <div className="flex items-center gap-1">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        onPress={() => handleViewEmployee(emp)}
                        className="text-muted hover:text-foreground hover:bg-border/30 rounded-lg size-8"
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        onPress={() => handleEditEmployee(emp)}
                        className="text-muted hover:text-brand-gold hover:bg-brand-gold/10 rounded-lg size-8"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        onPress={() => handleToggleStatus(emp)}
                        className={`rounded-lg size-8 ${
                          emp.is_active
                            ? 'text-muted hover:text-amber-500 hover:bg-amber-500/10'
                            : 'text-muted hover:text-emerald-500 hover:bg-emerald-500/10'
                        }`}
                      >
                        {emp.is_active ? (
                          <UserX className="size-4" />
                        ) : (
                          <UserCheck className="size-4" />
                        )}
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        onPress={() => handleDeleteEmployee(emp)}
                        className="text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg size-8"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {/* Mobile Pagination */}
        {!loading && meta.totalPages > 1 && filteredList.length > 0 && (
          <div className="flex items-center justify-between px-2 py-3 text-xs">
            <span className="text-muted">
              {start}–{end} / {meta.totalItems}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                isDisabled={page === 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                className="text-xs text-foreground/70 rounded-lg"
              >
                <T k="pagPrev" />
              </Button>
              <span className="text-xs font-bold text-foreground px-2">
                {page} / {meta.totalPages}
              </span>
              <Button
                size="sm"
                variant="ghost"
                isDisabled={page === meta.totalPages}
                onPress={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                className="text-xs text-foreground/70 rounded-lg"
              >
                <T k="pagNext" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Employee Create / Edit Modal ────────────── */}
      <EmployeeFormModal
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mode={drawerMode}
        employee={selectedEmployee}
        departments={departments}
        onSuccess={() => {
          setDrawerOpen(false);
          fetchEmployees();
        }}
      />

      {/* ─── Delete Confirmation Modal ────────────────── */}
      <Modal.Backdrop isOpen={deleteOpen} onOpenChange={setDeleteOpen}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[380px] bg-surface dark:bg-surface border border-border/60 rounded-2xl">
            <Modal.CloseTrigger className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-border/30 cursor-pointer focus:outline-none" />
            <Modal.Body className="flex flex-col items-center text-center py-8 gap-4">
              <div className="size-14 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 flex items-center justify-center text-rose-500">
                <AlertTriangle className="size-7" />
              </div>
              <h3 className="text-lg font-bold text-foreground font-serif">
                <T k="empDeleteTitle" />
              </h3>
              <p className="text-xs text-muted leading-relaxed max-w-xs">
                <T k="empDeleteDesc" />
              </p>
              {deletingEmployee && (
                <div className="flex items-center gap-3 bg-border/20 dark:bg-border/10 px-4 py-2.5 rounded-xl border border-border/40">
                  <Avatar
                    className="size-8"
                    style={{ borderColor: deletingEmployee.color || '#CCC', borderWidth: 2 }}
                  >
                    {deletingEmployee.picture_url && (
                      <Avatar.Image
                        src={getImageUrl(deletingEmployee.picture_url)}
                        alt={`${deletingEmployee.first_name}`}
                      />
                    )}
                    <Avatar.Fallback
                      className="text-[10px] font-bold"
                      style={{
                        backgroundColor: `${deletingEmployee.color || '#CCC'}20`,
                        color: deletingEmployee.color || '#CCC',
                      }}
                    >
                      {deletingEmployee.first_name?.[0]}
                      {deletingEmployee.last_name?.[0]}
                    </Avatar.Fallback>
                  </Avatar>
                  <span className="text-xs font-semibold text-foreground">
                    {deletingEmployee.first_name} {deletingEmployee.last_name}
                  </span>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer className="flex justify-center gap-3 pb-6">
              <Button
                variant="ghost"
                onPress={() => setDeleteOpen(false)}
                className="text-xs font-semibold text-muted"
              >
                <T k="actionCancel" />
              </Button>
              <Button
                onPress={handleConfirmDelete}
                isDisabled={deleteLoading}
                className="bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold min-w-[160px] rounded-xl"
              >
                {deleteLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size="sm" /> <T k="actionDelete" />
                  </span>
                ) : (
                  <T k="empDeleteConfirm" />
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      {/* ─── Status Toggle Confirmation Modal ─────────── */}
      <Modal.Backdrop isOpen={statusOpen} onOpenChange={setStatusOpen}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[380px] bg-surface dark:bg-surface border border-border/60 rounded-2xl">
            <Modal.CloseTrigger className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-border/30 cursor-pointer focus:outline-none" />
            <Modal.Body className="flex flex-col items-center text-center py-8 gap-4">
              <div
                className={`size-14 rounded-2xl flex items-center justify-center ${statusEmployee?.is_active ? 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-500' : 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-500'}`}
              >
                {statusEmployee?.is_active ? (
                  <UserX className="size-7" />
                ) : (
                  <UserCheck className="size-7" />
                )}
              </div>
              <h3 className="text-lg font-bold text-foreground font-serif">
                {statusEmployee?.is_active ? (
                  <T k="empDeactivateTitle" />
                ) : (
                  <T k="empActivateTitle" />
                )}
              </h3>
              <p className="text-xs text-muted leading-relaxed max-w-xs">
                {statusEmployee?.is_active ? (
                  <T k="empDeactivateDesc" />
                ) : (
                  <T k="empActivateDesc" />
                )}
              </p>
            </Modal.Body>
            <Modal.Footer className="flex justify-center gap-3 pb-6">
              <Button
                variant="ghost"
                onPress={() => setStatusOpen(false)}
                className="text-xs font-semibold text-muted"
              >
                <T k="actionCancel" />
              </Button>
              <Button
                onPress={handleConfirmToggleStatus}
                isDisabled={statusLoading}
                className={`text-xs font-semibold min-w-[120px] rounded-xl ${statusEmployee?.is_active ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
              >
                {statusLoading ? <Spinner size="sm" /> : <T k="actionConfirm" />}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </motion.div>
  );
}
