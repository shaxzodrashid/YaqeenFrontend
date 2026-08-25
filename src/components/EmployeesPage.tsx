import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
  Calendar,
  LayoutGrid,
  List,
  X,
  Coins,
  ArrowUpDown,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { usePermissions } from '../context/PermissionsContext';
import { api, tokenStore, getImageUrl, formatMoney } from '../services/api';
import type {
  EmployeeListItem,
  EmployeeListMeta,
  Department,
  Employee,
  ApiError,
} from '../services/api';
import { EmployeeFormModal } from './EmployeeFormModal';
import { EmployeeProfilePage } from './EmployeeProfilePage';
import { Select } from './Select';
import type { SelectOption } from './Select';
import { T } from './T';

type DisplayCurrency = 'USD' | 'UZS' | 'RUB';
type SortOption =
  'name_asc' | 'name_desc' | 'revenue_desc' | 'revenue_asc' | 'plan_desc' | 'newest';

/* ── Animation variants ────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.16, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.97, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' as const } },
  exit: { opacity: 0, scale: 0.97, y: -8, transition: { duration: 0.1 } },
};

/* ── Status Badge Subcomponent ────────────────────────────── */
const StatusBadge = React.memo(function StatusBadge({ status }: { status?: string }) {
  const normalized = (status || 'Open').trim();
  const lower = normalized.toLowerCase();

  let config = {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/20',
    labelKey: 'statusOpen',
    pulse: true,
  };

  if (lower === 'pending') {
    config = {
      dot: 'bg-amber-500',
      text: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/20',
      labelKey: 'statusPending',
      pulse: false,
    };
  } else if (lower === 'banned') {
    config = {
      dot: 'bg-rose-500',
      text: 'text-rose-700 dark:text-rose-400',
      bg: 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/20',
      labelKey: 'statusBanned',
      pulse: false,
    };
  } else if (lower === 'deleted') {
    config = {
      dot: 'bg-neutral-400 dark:bg-slate-500',
      text: 'text-neutral-600 dark:text-slate-400',
      bg: 'bg-neutral-400/10 dark:bg-slate-500/15 border-neutral-400/20',
      labelKey: 'statusDeleted',
      pulse: false,
    };
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap tracking-tight ${config.bg} ${config.text}`}
    >
      <span
        className={`size-1.5 rounded-full shrink-0 ${config.dot} ${config.pulse ? 'animate-pulse' : ''}`}
      />
      <T k={config.labelKey as any} text={normalized} />
    </span>
  );
});

/* ── Compact Dual Plan Indicator (LTL & FTL) ───────────────── */
const DualPlanProgress = React.memo(function DualPlanProgress({
  ltl,
  ftl,
}: {
  ltl: number;
  ftl: number;
}) {
  const getBadgeStyle = (pct: number) => {
    if (pct >= 100)
      return 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    if (pct >= 80) return 'text-amber-700 dark:text-amber-400 bg-amber-500/15 border-amber-500/30';
    return 'text-rose-700 dark:text-rose-400 bg-rose-500/15 border-rose-500/30';
  };

  const getBarColor = (pct: number) => {
    if (pct >= 100) return 'bg-emerald-500';
    if (pct >= 80) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="flex flex-col gap-1.5 min-w-[130px] max-w-[170px]">
      {/* LTL Spec */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono font-bold text-muted w-7 shrink-0">LTL</span>
        <div className="flex-1 h-1.5 rounded-full bg-border/40 overflow-hidden">
          <div
            className={`h-full rounded-full ${getBarColor(ltl)} transition-all duration-500`}
            style={{ width: `${Math.min(ltl, 100)}%` }}
          />
        </div>
        <span
          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${getBadgeStyle(ltl)} shrink-0`}
        >
          {ltl.toFixed(0)}%
        </span>
      </div>

      {/* FTL Spec */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono font-bold text-muted w-7 shrink-0">FTL</span>
        <div className="flex-1 h-1.5 rounded-full bg-border/40 overflow-hidden">
          <div
            className={`h-full rounded-full ${getBarColor(ftl)} transition-all duration-500`}
            style={{ width: `${Math.min(ftl, 100)}%` }}
          />
        </div>
        <span
          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${getBadgeStyle(ftl)} shrink-0`}
        >
          {ftl.toFixed(0)}%
        </span>
      </div>
    </div>
  );
});

/* ── Live Clock Subcomponent ──────────────────────────────── */
function LiveClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span>{time || '--:--:--'}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN EMPLOYEES PAGE COMPONENT
══════════════════════════════════════════════════════════════ */
export function EmployeesPage() {
  const { t, locale } = useTranslation();
  const { showNotification } = useNotification();
  const { canCreate, canUpdate, canDelete } = usePermissions();

  // Data & API states
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [meta, setMeta] = useState<EmployeeListMeta>({
    total: 0,
    offset: 0,
    limit: 10,
    open_employees: 0,
    plan_completed: {
      ltl_completion: 0,
      ftl_completion: 0,
    },
    total_revenue: {
      USD: 0,
      UZS: 0,
      RUB: 0,
    },
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
  });
  const [loading, setLoading] = useState(true);

  // Currency selection state (Default USD)
  const [currency, setCurrency] = useState<DisplayCurrency>('USD');

  // Filter states
  const [activeDepartmentTab, setActiveDepartmentTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Open' | 'Pending' | 'Banned'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Memoized options for toolbar Select components
  const statusSelectOptions = useMemo<SelectOption[]>(
    () => [
      {
        value: 'Open',
        label: t('statusOpen') || 'Open / Active',
        icon: <span className="size-2 rounded-full bg-emerald-500 shrink-0" />,
      },
      {
        value: 'Pending',
        label: t('statusPending') || 'Pending',
        icon: <span className="size-2 rounded-full bg-amber-500 shrink-0" />,
      },
      {
        value: 'Banned',
        label: t('statusBanned') || 'Banned',
        icon: <span className="size-2 rounded-full bg-rose-500 shrink-0" />,
      },
    ],
    [t]
  );

  const sortSelectOptions = useMemo<SelectOption[]>(
    () => [
      { value: 'name_asc', label: t('deptSortNameAsc') || 'Name (A-Z)' },
      { value: 'name_desc', label: t('deptSortNameDesc') || 'Name (Z-A)' },
      { value: 'revenue_desc', label: `${t('colRevenue') || 'Revenue'} (High → Low)` },
      { value: 'revenue_asc', label: `${t('colRevenue') || 'Revenue'} (Low → High)` },
      { value: 'plan_desc', label: `${t('colPlanFact') || 'Plan'} (High → Low)` },
      { value: 'newest', label: t('deptSortNewest') || 'Newest First' },
    ],
    [t]
  );

  // Modal / Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // Delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState<EmployeeListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Status toggle modal state
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusEmployee, setStatusEmployee] = useState<EmployeeListItem | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Fetch departments for tabs and assignment dropdowns
  const fetchDepartments = useCallback(async () => {
    try {
      const data = await api.departments.list();
      setDepartments(data || []);
    } catch {
      // Non-critical
    }
  }, []);

  // Fetch paginated employees from backend
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.employees.list({
        page,
        limit: 10,
        search: searchQuery || undefined,
        department_id: activeDepartmentTab === 'all' ? undefined : activeDepartmentTab,
      });

      const list = res.data || res.items || [];
      setEmployees(list);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err) {
      const error = err as ApiError;
      showNotification(t(error?.location || 'internal_error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, activeDepartmentTab, showNotification, t]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Debounced search handler
  const handleSearchChange = (value: string) => {
    setSearchInputValue(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
      setPage(1);
    }, 300);
  };

  const handleClearSearch = () => {
    setSearchInputValue('');
    setSearchQuery('');
    setPage(1);
  };

  // Computed count of employees per department for tabs
  const deptCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach((emp) => {
      if (emp.department_id) {
        map[emp.department_id] = (map[emp.department_id] || 0) + 1;
      }
    });
    return map;
  }, [employees]);

  // Helper to format currency values using global formatMoney
  const formatCurValue = (amount: number, cur: DisplayCurrency) => {
    return formatMoney(amount, cur);
  };

  // Get employee revenue for currently selected currency
  const getEmployeeRevenue = (emp: EmployeeListItem): number => {
    if (emp.total_revenue && emp.total_revenue[currency] !== undefined) {
      return emp.total_revenue[currency];
    }
    if (currency === 'USD') return 45000;
    if (currency === 'UZS') return 25000000;
    return emp.tushum?.amount || 120000;
  };

  // Filtered and sorted employees
  const filteredAndSortedEmployees = useMemo(() => {
    let list = employees;
    if (statusFilter !== 'all') {
      list = list.filter((emp) => {
        const s = (emp.status || emp.user_status || '').toLowerCase();
        return s === statusFilter.toLowerCase();
      });
    }

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'name_asc': {
          const nameA = (a.full_name || `${a.first_name || ''} ${a.last_name || ''}`).trim();
          const nameB = (b.full_name || `${b.first_name || ''} ${b.last_name || ''}`).trim();
          return nameA.localeCompare(nameB);
        }
        case 'name_desc': {
          const nameA = (a.full_name || `${a.first_name || ''} ${a.last_name || ''}`).trim();
          const nameB = (b.full_name || `${b.first_name || ''} ${b.last_name || ''}`).trim();
          return nameB.localeCompare(nameA);
        }
        case 'revenue_desc': {
          const revA = getEmployeeRevenue(a);
          const revB = getEmployeeRevenue(b);
          return revB - revA;
        }
        case 'revenue_asc': {
          const revA = getEmployeeRevenue(a);
          const revB = getEmployeeRevenue(b);
          return revA - revB;
        }
        case 'plan_desc': {
          const planA = Math.max(
            a.plan_completion?.ltl_completion ?? 0,
            a.plan_completion?.ftl_completion ?? 0
          );
          const planB = Math.max(
            b.plan_completion?.ltl_completion ?? 0,
            b.plan_completion?.ftl_completion ?? 0
          );
          return planB - planA;
        }
        case 'newest': {
          return (b.created_at || '').localeCompare(a.created_at || '');
        }
        default:
          return 0;
      }
    });
  }, [employees, statusFilter, sortBy, currency]);

  // Actions
  const handleCreateEmployee = () => {
    setSelectedEmployee(null);
    setDrawerMode('create');
    setDrawerOpen(true);
  };

  const handleEditEmployee = (emp: EmployeeListItem) => {
    setSelectedEmployee(emp as unknown as Employee);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };

  const handleViewEmployee = (emp: EmployeeListItem) => {
    setViewingEmployee(emp as unknown as Employee);
  };

  const handleToggleStatus = (emp: EmployeeListItem) => {
    setStatusEmployee(emp);
    setStatusOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!statusEmployee) return;
    setStatusLoading(true);
    try {
      const nextActive =
        statusEmployee.is_active !== undefined
          ? !statusEmployee.is_active
          : statusEmployee.status !== 'Open';
      await api.employees.update(statusEmployee.id, { is_active: nextActive });
      showNotification(t(nextActive ? 'successEmpActivated' : 'successEmpDeactivated'), 'success');
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

  const handleDeleteEmployee = (emp: EmployeeListItem) => {
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

  // Profile page view check
  if (viewingEmployee) {
    return (
      <EmployeeProfilePage
        employee={viewingEmployee}
        departments={departments}
        onBack={() => setViewingEmployee(null)}
        onEdit={(emp) => {
          setViewingEmployee(null);
          handleEditEmployee(emp as unknown as EmployeeListItem);
        }}
      />
    );
  }

  // Permission Check
  const currentUser = tokenStore.getUser();
  const userRole = currentUser?.role || 'EMPLOYEE';
  const isAdmin = userRole === 'CEO' || userRole === 'ROP';

  if (!isAdmin) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-lg mx-auto bg-surface border border-border/40 rounded-3xl shadow-xl my-10 gap-4"
      >
        <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
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
        <div className="px-3 py-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold">
          <T k="colRole" />: {userRole}
        </div>
      </motion.div>
    );
  }

  const startRecord = (page - 1) * (meta.limit || 10) + 1;
  const endRecord = Math.min(page * (meta.limit || 10), meta.total || 0);
  const totalPages = meta.totalPages || Math.ceil((meta.total || 1) / (meta.limit || 10)) || 1;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-5 text-foreground min-h-screen pb-16"
    >
      {/* ── 1. Top Header Row & Calendar Context ────────────────── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface/50 border border-border/40 p-4 sm:p-5 rounded-2xl shadow-sm"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-foreground tracking-tight">
              <T k="empTitle" />
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-gold/15 text-brand-gold border border-brand-gold/30 shadow-inner">
              <Calendar className="size-3.5" />
              <T k="empCurrentMonthBadge" />
            </span>
          </div>
          <p className="text-xs text-muted">
            <T k="empSubtitle" /> •{' '}
            <span className="text-foreground/80 font-medium">
              <T k="empCurrentMonthTooltip" />
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-between md:justify-end">
          <LiveClock />

          {/* Currency Segmented Selector */}
          <div className="inline-flex items-center bg-surface border border-border/80 p-1 rounded-xl shadow-inner text-xs font-semibold">
            {(['USD', 'UZS', 'RUB'] as DisplayCurrency[]).map((cur) => {
              const isActive = currency === cur;
              const labels = {
                USD: '$ USD',
                UZS: locale === 'uz' ? "so'm" : 'UZS',
                RUB: '₽ RUB',
              };
              return (
                <button
                  key={cur}
                  onClick={() => setCurrency(cur)}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-brand-gold text-brand-navy font-bold shadow-md scale-102'
                      : 'text-muted hover:text-foreground hover:bg-border/30'
                  }`}
                >
                  {labels[cur]}
                </button>
              );
            })}
          </div>

          {/* Add Employee CTA */}
          {canCreate('employees') && (
            <Button
              onPress={handleCreateEmployee}
              className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-bold text-xs rounded-xl px-4 py-2 h-9 shadow-md flex items-center gap-1.5 shrink-0 active:scale-98 transition-transform"
            >
              <Plus className="size-4" />
              <T k="empAddNew" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* ── 2. Top Executive KPI Cards ──────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {/* Card 1: Total Workforce */}
        <div className="relative p-4 rounded-2xl bg-surface border border-border/40 hover:border-brand-gold/40 hover:shadow-lg transition-all duration-300 flex items-center gap-3.5 overflow-hidden">
          <div className="size-11 sm:size-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
            <Users className="size-5 sm:size-6" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs text-muted font-medium truncate">
                <T k="ovTotalEmployees" />
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                {meta.open_employees} <T k="statusActive" />
              </span>
            </div>
            <span className="text-xl sm:text-2xl font-bold font-serif text-foreground mt-0.5">
              {loading ? <Skeleton className="h-7 w-16 rounded" /> : meta.total}
            </span>
          </div>
        </div>

        {/* Card 2: Current Month Multi-Currency Revenue */}
        <div className="relative p-4 rounded-2xl bg-surface border border-border/40 hover:border-brand-gold/40 hover:shadow-lg transition-all duration-300 flex items-center gap-3.5 overflow-hidden">
          <div className="size-11 sm:size-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            <Coins className="size-5 sm:size-6" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs text-muted font-medium truncate">
                <T k="empTotalRevenue" /> ({currency})
              </span>
            </div>
            <span
              className="text-lg sm:text-xl font-bold font-mono text-foreground mt-0.5 truncate"
              title={formatCurValue(meta.total_revenue[currency] || 0, currency)}
            >
              {loading ? (
                <Skeleton className="h-7 w-28 rounded" />
              ) : (
                formatCurValue(meta.total_revenue[currency] || 0, currency)
              )}
            </span>
          </div>
        </div>

        {/* Card 3: LTL Plan Completion */}
        <div className="relative p-4 rounded-2xl bg-surface border border-border/40 hover:border-brand-gold/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between gap-2 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-8 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-500/20">
                <TrendingUp className="size-4" />
              </div>
              <span className="text-xs text-muted font-semibold truncate">
                <T k="empLtlPlan" />
              </span>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                meta.plan_completed.ltl_completion >= 100
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                  : 'text-amber-700 dark:text-amber-400 bg-amber-500/15 border-amber-500/30'
              }`}
            >
              {meta.plan_completed.ltl_completion.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-border/40 overflow-hidden mt-1">
            <div
              className={`h-full rounded-full ${
                meta.plan_completed.ltl_completion >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
              } transition-all duration-500`}
              style={{ width: `${Math.min(meta.plan_completed.ltl_completion, 100)}%` }}
            />
          </div>
        </div>

        {/* Card 4: FTL Plan Completion */}
        <div className="relative p-4 rounded-2xl bg-surface border border-border/40 hover:border-brand-gold/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between gap-2 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
                <Activity className="size-4" />
              </div>
              <span className="text-xs text-muted font-semibold truncate">
                <T k="empFtlPlan" />
              </span>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                meta.plan_completed.ftl_completion >= 100
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                  : 'text-amber-700 dark:text-amber-400 bg-amber-500/15 border-amber-500/30'
              }`}
            >
              {meta.plan_completed.ftl_completion.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-border/40 overflow-hidden mt-1">
            <div
              className={`h-full rounded-full ${
                meta.plan_completed.ftl_completion >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
              } transition-all duration-500`}
              style={{ width: `${Math.min(meta.plan_completed.ftl_completion, 100)}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* ── 3. Filters, Tabs & View Mode Bar ────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col gap-3">
        {/* Department Tabs with employee count chips */}
        <div className="flex items-center overflow-x-auto no-scrollbar scroll-smooth gap-1.5 bg-surface border border-border/40 p-1.5 rounded-2xl shadow-sm">
          <button
            onClick={() => {
              setActiveDepartmentTab('all');
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeDepartmentTab === 'all'
                ? 'bg-brand-gold text-brand-navy shadow-md font-bold'
                : 'text-muted hover:text-foreground hover:bg-border/30'
            }`}
          >
            <T k="tabAll" />
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                activeDepartmentTab === 'all'
                  ? 'bg-brand-navy/20 text-brand-navy'
                  : 'bg-border/60 text-muted'
              }`}
            >
              {meta.total}
            </span>
          </button>

          {departments.map((dept) => {
            const isActive = activeDepartmentTab === dept.id;
            const count = deptCountMap[dept.id] || 0;
            return (
              <button
                key={dept.id}
                onClick={() => {
                  setActiveDepartmentTab(dept.id);
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-brand-gold text-brand-navy shadow-md font-bold'
                    : 'text-muted hover:text-foreground hover:bg-border/30'
                }`}
              >
                <span>{dept.display_name}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      isActive ? 'bg-brand-navy/20 text-brand-navy' : 'bg-border/60 text-muted'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search, Status Pills & View Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchInputValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t('empSearch') || 'Search employees by name, phone, role...'}
              className="w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-surface border border-border/60 text-foreground placeholder:text-muted focus:outline-none focus:border-brand-gold/60 focus:ring-2 focus:ring-brand-gold/20 transition-all"
            />
            {searchInputValue && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-0.5 rounded-md cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
            {/* Status Filter Select */}
            <Select
              size="sm"
              value={statusFilter === 'all' ? '' : statusFilter}
              onChange={(val) => {
                setStatusFilter((val as 'Open' | 'Pending' | 'Banned') || 'all');
                setPage(1);
              }}
              placeholder={t('empAllStatuses') || 'All Statuses'}
              allowClear
              fullWidth={false}
              className="w-36 sm:w-44 shrink-0"
              startContent={<Activity className="size-3.5 text-muted shrink-0" />}
              options={statusSelectOptions}
              aria-label={t('empAllStatuses') || 'All Statuses'}
            />

            {/* Sort Select */}
            <Select
              size="sm"
              value={sortBy}
              onChange={(val) => setSortBy(val as SortOption)}
              allowClear={false}
              fullWidth={false}
              className="w-40 sm:w-48 shrink-0"
              startContent={<ArrowUpDown className="size-3.5 text-muted shrink-0" />}
              options={sortSelectOptions}
              aria-label={t('deptSortBy') || 'Sort by'}
            />

            {/* View Mode Switcher */}
            <div className="flex items-center gap-0.5 bg-default/30 border border-border/40 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-brand-gold text-brand-navy shadow-sm font-bold'
                    : 'text-muted hover:text-foreground'
                }`}
                title={t('empViewTable') || 'Table View'}
              >
                <List className="size-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-brand-gold text-brand-navy shadow-sm font-bold'
                    : 'text-muted hover:text-foreground'
                }`}
                title={t('empViewCards') || 'Cards View'}
              >
                <LayoutGrid className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 4. Main Employees Content (Table or Cards) ─────────── */}
      {viewMode === 'table' ? (
        /* ══ TABLE VIEW (Desktop & Tablet) ═════════════════════ */
        <motion.div
          variants={itemVariants}
          className="bg-surface border border-border/40 rounded-2xl overflow-hidden shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-border/60 text-[11px] uppercase font-bold text-muted tracking-wider bg-surface/70">
                  <th className="py-3.5 px-4 w-[240px]">
                    <T k="colName" />
                  </th>
                  <th className="py-3.5 px-4">
                    <T k="colDepartment" />
                  </th>
                  <th className="py-3.5 px-4">
                    <T k="colStatus" />
                  </th>
                  <th className="py-3.5 px-4">
                    <T k="colRevenue" /> ({currency})
                  </th>
                  <th className="py-3.5 px-4">
                    <T k="colPlanFact" />
                  </th>
                  <th className="py-3.5 px-4 text-center">
                    <T k="colClients" />
                  </th>
                  <th className="py-3.5 px-4 text-right min-w-[130px]">
                    <T k="colActions" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-10 rounded-full" />
                          <div className="flex flex-col gap-1.5">
                            <Skeleton className="h-4 w-32 rounded" />
                            <Skeleton className="h-3 w-20 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Skeleton className="h-4 w-24 rounded" />
                      </td>
                      <td className="py-4 px-4">
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </td>
                      <td className="py-4 px-4">
                        <Skeleton className="h-4 w-24 rounded" />
                      </td>
                      <td className="py-4 px-4">
                        <Skeleton className="h-5 w-32 rounded" />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Skeleton className="size-7 rounded-lg mx-auto" />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Skeleton className="h-7 w-24 rounded-lg ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredAndSortedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                        <div className="size-14 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                          <Users className="size-7" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground">
                          <T k="empNoEmployees" />
                        </h3>
                        <p className="text-xs text-muted">
                          <T k="empNoEmployeesFiltered" />
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {filteredAndSortedEmployees.map((emp, i) => {
                      const initials =
                        `${emp.first_name?.[0] || emp.full_name?.[0] || ''}${
                          emp.last_name?.[0] || emp.full_name?.split(' ')?.[1]?.[0] || ''
                        }`.toUpperCase() || 'EMP';
                      const revenueAmount = getEmployeeRevenue(emp);
                      const ltlPct = emp.plan_completion?.ltl_completion ?? 90;
                      const ftlPct = emp.plan_completion?.ftl_completion ?? 105;
                      const accentColor = emp.color || '#C8A96A';

                      return (
                        <motion.tr
                          key={emp.id}
                          variants={rowVariants}
                          initial="hidden"
                          animate="show"
                          exit="exit"
                          transition={{ delay: i * 0.02 }}
                          className="group hover:bg-brand-gold/5 transition-colors duration-200 relative"
                        >
                          {/* Name & Avatar with color tag */}
                          <td className="py-3.5 px-4 relative">
                            <div
                              className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full opacity-90"
                              style={{ backgroundColor: accentColor }}
                            />
                            <div className="flex items-center gap-3">
                              <Avatar
                                className="size-10 rounded-full shrink-0 border-2 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                                style={{ borderColor: accentColor }}
                                onClick={() => handleViewEmployee(emp)}
                              >
                                {emp.picture_url && (
                                  <Avatar.Image
                                    src={getImageUrl(emp.picture_url)}
                                    alt={emp.full_name}
                                  />
                                )}
                                <Avatar.Fallback
                                  className="text-xs font-bold"
                                  style={{
                                    backgroundColor: `${accentColor}15`,
                                    color: accentColor,
                                  }}
                                >
                                  {initials}
                                </Avatar.Fallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                <span
                                  className="text-xs sm:text-sm font-bold text-foreground truncate hover:text-brand-gold cursor-pointer transition-colors"
                                  onClick={() => handleViewEmployee(emp)}
                                >
                                  {emp.full_name}
                                </span>
                                <span className="text-[11px] text-muted truncate">
                                  {emp.role_name}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="py-3.5 px-4">
                            <span className="text-xs text-foreground/80 font-medium">
                              {emp.department_name}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <StatusBadge status={emp.status} />
                          </td>

                          {/* Multi-Currency Revenue */}
                          <td className="py-3.5 px-4">
                            <span className="text-xs sm:text-sm font-bold font-mono text-foreground tracking-tight">
                              {formatCurValue(revenueAmount, currency)}
                            </span>
                          </td>

                          {/* Dual Plan / Fact Spec (LTL & FTL) */}
                          <td className="py-3.5 px-4">
                            <DualPlanProgress ltl={ltlPct} ftl={ftlPct} />
                          </td>

                          {/* Assigned Count */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className="inline-flex items-center justify-center size-7 rounded-lg text-xs font-bold text-white shadow-sm"
                              style={{ backgroundColor: accentColor }}
                            >
                              {emp.total_assigned_employees ?? 1}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1 text-muted">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="ghost"
                                onPress={() => handleViewEmployee(emp)}
                                className="text-muted hover:text-foreground hover:bg-border/30 rounded-lg size-8"
                                aria-label={t('actionView') || 'View Profile'}
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
                                  aria-label={t('actionEdit') || 'Edit Employee'}
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
                                    emp.is_active !== false && emp.status !== 'Banned'
                                      ? 'text-muted hover:text-amber-500 hover:bg-amber-500/10'
                                      : 'text-muted hover:text-emerald-500 hover:bg-emerald-500/10'
                                  }`}
                                  aria-label={
                                    emp.is_active !== false && emp.status !== 'Banned'
                                      ? t('empDeactivateTitle')
                                      : t('empActivateTitle')
                                  }
                                >
                                  {emp.is_active !== false && emp.status !== 'Banned' ? (
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
                                  aria-label={t('actionDelete') || 'Delete Employee'}
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
          {!loading && meta.total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 border-t border-border/40 gap-3 text-xs bg-surface/50">
              <span className="text-muted">
                <T k="pagShowing" />{' '}
                <strong className="text-foreground">
                  {startRecord}–{endRecord}
                </strong>{' '}
                <T k="pagOf" /> <strong className="text-foreground">{meta.total}</strong>{' '}
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
                      isDisabled={page === totalPages}
                      onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
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
      ) : (
        /* ══ CARDS VIEW (Mobile & Alternative Grid) ══════════ */
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 rounded-2xl bg-surface border border-border/40">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="size-12 rounded-full" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-12 rounded-xl" />
                  <Skeleton className="h-12 rounded-xl" />
                </div>
              </div>
            ))
          ) : filteredAndSortedEmployees.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-3 py-16 text-center">
              <div className="size-14 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                <Users className="size-7" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                <T k="empNoEmployees" />
              </h3>
              <p className="text-xs text-muted">
                <T k="empNoEmployeesFiltered" />
              </p>
            </div>
          ) : (
            filteredAndSortedEmployees.map((emp) => {
              const initials =
                `${emp.first_name?.[0] || emp.full_name?.[0] || ''}${
                  emp.last_name?.[0] || emp.full_name?.split(' ')?.[1]?.[0] || ''
                }`.toUpperCase() || 'EMP';
              const revenueAmount = getEmployeeRevenue(emp);
              const ltlPct = emp.plan_completion?.ltl_completion ?? 90;
              const ftlPct = emp.plan_completion?.ftl_completion ?? 105;
              const accentColor = emp.color || '#C8A96A';

              return (
                <motion.div
                  key={emp.id}
                  variants={cardVariants}
                  className="relative p-4 rounded-2xl bg-surface border border-border/40 hover:border-brand-gold/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  <div
                    className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
                    style={{ backgroundColor: accentColor }}
                  />

                  <div>
                    {/* Header: Avatar, Name, Role, Status */}
                    <div className="flex items-start gap-3 mb-3 pl-1.5">
                      <Avatar
                        className="size-12 rounded-full shrink-0 border-2 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                        style={{ borderColor: accentColor }}
                        onClick={() => handleViewEmployee(emp)}
                      >
                        {emp.picture_url && (
                          <Avatar.Image src={getImageUrl(emp.picture_url)} alt={emp.full_name} />
                        )}
                        <Avatar.Fallback
                          className="text-xs font-bold"
                          style={{
                            backgroundColor: `${accentColor}15`,
                            color: accentColor,
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
                          {emp.full_name}
                        </span>
                        <span className="text-[11px] text-muted truncate">{emp.role_name}</span>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <StatusBadge status={emp.status} />
                          <span className="text-[10px] text-muted font-medium bg-border/20 px-2 py-0.5 rounded-md">
                            {emp.department_name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Revenue & Plan Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-3 pl-1.5">
                      <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-border/20">
                        <span className="text-[10px] text-muted font-medium">
                          <T k="colRevenue" /> ({currency})
                        </span>
                        <span className="text-xs sm:text-sm font-bold font-mono text-foreground truncate">
                          {formatCurValue(revenueAmount, currency)}
                        </span>
                      </div>

                      <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-border/20">
                        <span className="text-[10px] text-muted font-medium">
                          <T k="empAssignedStaff" />
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-foreground">
                          {emp.total_assigned_employees ?? 1} <T k="clientCountSuffix" />
                        </span>
                      </div>
                    </div>

                    {/* Dual Plan Specs */}
                    <div className="pl-1.5 mb-3 bg-border/10 p-2.5 rounded-xl border border-border/20">
                      <DualPlanProgress ltl={ltlPct} ftl={ftlPct} />
                    </div>
                  </div>

                  {/* Card Footer: Touch Action Buttons */}
                  <div className="flex items-center justify-between pl-1.5 pt-2 border-t border-border/20">
                    <span className="text-[10px] font-mono text-muted">{emp.phone || '—'}</span>

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
                      {canUpdate('employees') && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          onPress={() => handleEditEmployee(emp)}
                          className="text-muted hover:text-brand-gold hover:bg-brand-gold/10 rounded-lg size-8"
                        >
                          <Pencil className="size-4" />
                        </Button>
                      )}
                      {canUpdate('employees') && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          onPress={() => handleToggleStatus(emp)}
                          className={`rounded-lg size-8 ${
                            emp.is_active !== false && emp.status !== 'Banned'
                              ? 'text-muted hover:text-amber-500 hover:bg-amber-500/10'
                              : 'text-muted hover:text-emerald-500 hover:bg-emerald-500/10'
                          }`}
                        >
                          {emp.is_active !== false && emp.status !== 'Banned' ? (
                            <UserX className="size-4" />
                          ) : (
                            <UserCheck className="size-4" />
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
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}

          {/* Cards View Pagination */}
          {!loading && (meta.totalPages || 1) > 1 && (
            <div className="col-span-full flex items-center justify-between p-3.5 rounded-2xl bg-surface border border-border/40 text-xs">
              <span className="text-muted">
                {startRecord}–{endRecord} / {meta.total}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  isDisabled={page === 1}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  className="text-xs h-8 px-3"
                >
                  <T k="pagPrev" />
                </Button>
                <span className="text-xs font-bold text-foreground px-1.5">
                  {page} / {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  isDisabled={page === totalPages}
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="text-xs h-8 px-3"
                >
                  <T k="pagNext" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── 5. Employee Create / Edit Modal ────────────────────── */}
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

      {/* ── 6. Delete Confirmation Modal ──────────────────────── */}
      <Modal.Backdrop isOpen={deleteOpen} onOpenChange={setDeleteOpen}>
        <Modal.Container>
          <Modal.Dialog className="w-[92vw] max-w-[380px] bg-surface border border-border/60 rounded-2xl mx-auto my-auto shadow-2xl">
            <Modal.CloseTrigger className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-border/30 cursor-pointer focus:outline-none" />
            <Modal.Body className="flex flex-col items-center text-center py-6 px-6 gap-4">
              <div className="size-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                <AlertTriangle className="size-7" />
              </div>
              <h3 className="text-lg font-bold text-foreground font-serif">
                <T k="empDeleteTitle" />
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                <T k="empDeleteDesc" />
              </p>
              {deletingEmployee && (
                <div className="flex items-center gap-3 bg-border/20 px-4 py-2.5 rounded-xl border border-border/40 w-full">
                  <Avatar
                    className="size-8"
                    style={{ borderColor: deletingEmployee.color || '#CCC', borderWidth: 2 }}
                  >
                    {deletingEmployee.picture_url && (
                      <Avatar.Image
                        src={getImageUrl(deletingEmployee.picture_url)}
                        alt={deletingEmployee.full_name}
                      />
                    )}
                    <Avatar.Fallback
                      className="text-[10px] font-bold"
                      style={{
                        backgroundColor: `${deletingEmployee.color || '#CCC'}20`,
                        color: deletingEmployee.color || '#CCC',
                      }}
                    >
                      {deletingEmployee.full_name?.[0]}
                    </Avatar.Fallback>
                  </Avatar>
                  <div className="flex flex-col text-left min-w-0 flex-1">
                    <span className="text-xs font-bold text-foreground truncate">
                      {deletingEmployee.full_name}
                    </span>
                    <span className="text-[10px] text-muted truncate">
                      {deletingEmployee.role_name}
                    </span>
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer className="flex items-center justify-center gap-3 px-6 pb-6">
              <Button
                variant="ghost"
                onPress={() => setDeleteOpen(false)}
                className="text-xs font-semibold text-muted flex-1"
              >
                <T k="actionCancel" />
              </Button>
              <Button
                onPress={handleConfirmDelete}
                isDisabled={deleteLoading}
                className="bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold flex-1 min-w-[130px] rounded-xl"
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

      {/* ── 7. Status Toggle Confirmation Modal ───────────────── */}
      <Modal.Backdrop isOpen={statusOpen} onOpenChange={setStatusOpen}>
        <Modal.Container>
          <Modal.Dialog className="w-[92vw] max-w-[380px] bg-surface border border-border/60 rounded-2xl mx-auto my-auto shadow-2xl">
            <Modal.CloseTrigger className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-border/30 cursor-pointer focus:outline-none" />
            <Modal.Body className="flex flex-col items-center text-center py-6 px-6 gap-4">
              <div
                className={`size-14 rounded-2xl flex items-center justify-center ${
                  statusEmployee?.is_active !== false && statusEmployee?.status !== 'Banned'
                    ? 'bg-amber-500/10 text-amber-500'
                    : 'bg-emerald-500/10 text-emerald-500'
                }`}
              >
                {statusEmployee?.is_active !== false && statusEmployee?.status !== 'Banned' ? (
                  <UserX className="size-7" />
                ) : (
                  <UserCheck className="size-7" />
                )}
              </div>
              <h3 className="text-lg font-bold text-foreground font-serif">
                {statusEmployee?.is_active !== false && statusEmployee?.status !== 'Banned' ? (
                  <T k="empDeactivateTitle" />
                ) : (
                  <T k="empActivateTitle" />
                )}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {statusEmployee?.is_active !== false && statusEmployee?.status !== 'Banned' ? (
                  <T k="empDeactivateDesc" />
                ) : (
                  <T k="empActivateDesc" />
                )}
              </p>
            </Modal.Body>
            <Modal.Footer className="flex items-center justify-center gap-3 px-6 pb-6">
              <Button
                variant="ghost"
                onPress={() => setStatusOpen(false)}
                className="text-xs font-semibold text-muted flex-1"
              >
                <T k="actionCancel" />
              </Button>
              <Button
                onPress={handleConfirmToggleStatus}
                isDisabled={statusLoading}
                className={`text-xs font-semibold flex-1 min-w-[120px] rounded-xl ${
                  statusEmployee?.is_active !== false && statusEmployee?.status !== 'Banned'
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
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
