import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  Trophy,
  Calendar,
  RefreshCw,
  X,
  CheckCircle,
  Coins,
  Package,
  Truck,
  Eye,
  Search,
  BarChart3,
  Table as TableIcon,
  Filter,
  Sparkles,
  Crown,
  Medal,
  Flame,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { usePermissions } from '../../context/PermissionsContext';
import { cargoKpiApi } from '../../services/cargoKpi.service';
import type { EmployeePlansResponse, EmployeePlanProgress } from '../../services/cargoKpi.service';
import { formatMoney, type SupportedCurrency } from '../../types/currency';
import { EmployeeSelect } from './EmployeeSelect';
import { EmployeePlanDetailsModal } from './EmployeePlanDetailsModal';
import { PlansDepartmentAnalytics } from './PlansDepartmentAnalytics';

export type PlanViewMode = 'leaderboard' | 'table' | 'analytics';

export function EmployeePlansTab() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canCreate, canUpdate, canDelete } = usePermissions();

  const [month, setMonth] = useState<string>('2026-08');
  const [viewMode, setViewMode] = useState<PlanViewMode>('leaderboard');
  const [data, setData] = useState<EmployeePlansResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<EmployeePlanProgress | null>(null);
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    'b1a2c3d4-e5f6-7890-abcd-ef1234567890'
  );
  const [selectedEmpName, setSelectedEmpName] = useState<string>('Jasur Yoldoshev');
  const [ltlTargetStr, setLtlTargetStr] = useState<string>('100');
  const [ftlTargetStr, setFtlTargetStr] = useState<string>('50000');
  const [planCurrency, setPlanCurrency] = useState<SupportedCurrency>('USD');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Detail / Performance History Modal State
  const [detailEmpId, setDetailEmpId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cargoKpiApi.getPlans({ month, search: searchQuery || undefined });
      setData(res);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to load employee plans', 'error');
    } finally {
      setLoading(false);
    }
  }, [month, searchQuery, showNotification]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleOpenAdd = () => {
    setEditingPlan(null);
    setSelectedEmpId('b1a2c3d4-e5f6-7890-abcd-ef1234567890');
    setSelectedEmpName('Jasur Yoldoshev');
    setLtlTargetStr('100');
    setFtlTargetStr('50000');
    setPlanCurrency('USD');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: EmployeePlanProgress) => {
    setEditingPlan(plan);
    setSelectedEmpId(plan.employee_id || 'b1a2c3d4-e5f6-7890-abcd-ef1234567890');
    setSelectedEmpName(plan.employee_name || 'Employee');
    setLtlTargetStr(String(plan.ltl_plan?.target_volume ?? plan.ltl_target_volume ?? 0));
    setFtlTargetStr(String(plan.ftl_plan?.target_amount ?? plan.ftl_target_amount ?? 0));
    setPlanCurrency(plan.currency || 'USD');
    setIsModalOpen(true);
  };

  const handleOpenDetails = (employeeId: string) => {
    setDetailEmpId(employeeId);
    setIsDetailModalOpen(true);
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this target plan?')) return;
    try {
      await cargoKpiApi.deletePlan(id);
      showNotification(
        t('successPlanDeleted') || 'Employee target plan deleted successfully',
        'success'
      );
      loadPlans();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete plan', 'error');
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ltlTarget = parseFloat(ltlTargetStr) || 0;
    const ftlTarget = parseFloat(ftlTargetStr) || 0;

    if (!selectedEmpId) {
      showNotification('Please select an employee.', 'warning');
      return;
    }
    if (ltlTarget < 0 || ftlTarget < 0 || (ltlTarget === 0 && ftlTarget === 0)) {
      showNotification(
        'Please provide a valid target for either LTL volume or FTL financial amount.',
        'warning'
      );
      return;
    }

    setSubmitting(true);
    try {
      if (editingPlan) {
        await cargoKpiApi.updatePlan(editingPlan.id, {
          period: month,
          ltl_target_volume: ltlTarget,
          ftl_target_amount: ftlTarget,
          currency: planCurrency,
        });
        showNotification(t('successPlanUpdated') || 'Target plan updated successfully', 'success');
      } else {
        await cargoKpiApi.createPlan({
          employee_id: selectedEmpId,
          period: month,
          ltl_target_volume: ltlTarget,
          ftl_target_amount: ftlTarget,
          currency: planCurrency,
        });
        showNotification(t('successPlanAdded') || 'Target plan created successfully', 'success');
      }
      setIsModalOpen(false);
      loadPlans();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to save employee plan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getRankBadge = (rank?: number) => {
    if (rank === 1) return <span className="text-xl">🥇</span>;
    if (rank === 2) return <span className="text-xl">🥈</span>;
    if (rank === 3) return <span className="text-xl">🥉</span>;
    return <span className="text-xs font-bold text-muted-foreground">#{rank}</span>;
  };

  const getInitials = (name?: string) => {
    if (!name) return 'E';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getStatusInfo = (isCompleted?: boolean, pct: number = 0) => {
    if (isCompleted || pct >= 100) {
      return {
        bg: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
        bar: 'bg-emerald-500',
        label: t('planDone'),
      };
    }
    if (pct >= 50) {
      return {
        bg: 'bg-brand-gold/15 text-brand-gold border-brand-gold/30',
        bar: 'bg-brand-gold',
        label: t('planInProgress'),
      };
    }
    return {
      bg: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
      bar: 'bg-rose-500',
      label: t('planLagging'),
    };
  };

  // Filter plans based on search, status, and department
  const filteredPlans = useMemo(() => {
    if (!data?.plans) return [];
    return data.plans.filter((p) => {
      // Status filter
      if (statusFilter === 'completed' && !p.is_completed && p.overall_completion_percentage < 100)
        return false;
      if (
        statusFilter === 'in_progress' &&
        (p.is_completed ||
          p.overall_completion_percentage >= 100 ||
          p.overall_completion_percentage < 50)
      )
        return false;
      if (statusFilter === 'behind' && (p.is_completed || p.overall_completion_percentage >= 50))
        return false;

      // Department filter
      if (deptFilter !== 'all' && p.department_name !== deptFilter) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.employee_name.toLowerCase().includes(q);
        const matchesDept = (p.department_name || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDept) return false;
      }

      return true;
    });
  }, [data?.plans, statusFilter, deptFilter, searchQuery]);

  // Sort plans strictly for Leaderboard Ranking
  const sortedPlans = useMemo(() => {
    return [...filteredPlans].sort((a, b) => {
      const rA = a.rank ?? 999;
      const rB = b.rank ?? 999;
      if (rA !== rB) return rA - rB;
      return (b.overall_completion_percentage || 0) - (a.overall_completion_percentage || 0);
    });
  }, [filteredPlans]);

  // Distinct departments for filter
  const departmentsList = useMemo(() => {
    if (!data?.plans) return [];
    const depts = new Set<string>();
    data.plans.forEach((p) => {
      if (p.department_name) depts.add(p.department_name);
    });
    return Array.from(depts);
  }, [data?.plans]);

  // Aggregate totals
  const totalLtlTarget = useMemo(
    () =>
      (data?.plans || []).reduce(
        (s, p) => s + (p.ltl_plan?.target_volume ?? p.ltl_target_volume ?? 0),
        0
      ),
    [data?.plans]
  );
  const totalLtlActual = useMemo(
    () =>
      (data?.plans || []).reduce(
        (s, p) => s + (p.ltl_plan?.actual_volume ?? p.ltl_actual_volume ?? 0),
        0
      ),
    [data?.plans]
  );
  const totalFtlTarget = useMemo(
    () =>
      (data?.plans || []).reduce(
        (s, p) => s + (p.ftl_plan?.target_amount ?? p.ftl_target_amount ?? 0),
        0
      ),
    [data?.plans]
  );
  const totalFtlActual = useMemo(
    () =>
      (data?.plans || []).reduce(
        (s, p) => s + (p.ftl_plan?.actual_amount ?? p.ftl_actual_amount ?? 0),
        0
      ),
    [data?.plans]
  );
  const totalCargosCount = useMemo(
    () => (data?.plans || []).reduce((s, p) => s + (p.total_cargos_count || 0), 0),
    [data?.plans]
  );

  // Top 3 Podium slice
  const top1 = sortedPlans[0];
  const top2 = sortedPlans[1];
  const top3 = sortedPlans[2];
  const contenders = sortedPlans.slice(3);

  // Render a podium card with distinct Olympic Gold/Silver/Bronze styling
  const renderPodiumCard = (plan: EmployeePlanProgress, rankPos: 1 | 2 | 3) => {
    const st = getStatusInfo(plan.is_completed, plan.overall_completion_percentage);
    const planCurr = plan.currency || 'USD';
    const ltlTarget = plan.ltl_plan?.target_volume ?? plan.ltl_target_volume ?? 0;
    const ltlActual = plan.ltl_plan?.actual_volume ?? plan.ltl_actual_volume ?? 0;
    const ltlRem = plan.ltl_plan?.remaining_volume ?? Math.max(0, ltlTarget - ltlActual);
    const ltlPct = plan.ltl_plan?.completion_percentage || 0;

    const ftlTarget = plan.ftl_plan?.target_amount ?? plan.ftl_target_amount ?? 0;
    const ftlActual = plan.ftl_plan?.actual_amount ?? plan.ftl_actual_amount ?? 0;
    const ftlRem = plan.ftl_plan?.remaining_amount ?? Math.max(0, ftlTarget - ftlActual);
    const ftlPct = plan.ftl_plan?.completion_percentage || 0;

    const isGold = rankPos === 1;
    const isSilver = rankPos === 2;

    return (
      <motion.div
        key={plan.id || rankPos}
        initial={{ opacity: 0, y: isGold ? -10 : 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: rankPos * 0.08 }}
        className={`relative flex flex-col rounded-3xl overflow-hidden transition-all duration-300 ${
          isGold
            ? 'bg-gradient-to-b from-amber-500/10 via-surface to-surface border-2 border-brand-gold shadow-xl shadow-brand-gold/10 md:-translate-y-4 z-20 ring-1 ring-brand-gold/30'
            : isSilver
              ? 'bg-surface border-2 border-slate-300 dark:border-slate-700 shadow-md md:translate-y-2 z-10'
              : 'bg-surface border-2 border-amber-700/30 dark:border-amber-800/40 shadow-md md:translate-y-4 z-10'
        }`}
      >
        {/* Top Rank Badge Header */}
        <div
          className={`px-4 py-2.5 flex items-center justify-between border-b ${
            isGold
              ? 'bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold text-brand-navy border-brand-gold/40'
              : isSilver
                ? 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 text-foreground border-border'
                : 'bg-gradient-to-r from-amber-800/20 via-amber-700/15 to-amber-800/20 text-foreground border-border'
          }`}
        >
          <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider">
            {isGold ? (
              <>
                <Crown className="size-4 fill-brand-navy" />
                <span>{t('podium1st') || '1st Place Champion'}</span>
              </>
            ) : isSilver ? (
              <>
                <Medal className="size-4 text-slate-400" />
                <span>{t('podium2nd') || '2nd Place'}</span>
              </>
            ) : (
              <>
                <Medal className="size-4 text-amber-700" />
                <span>{t('podium3rd') || '3rd Place'}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                isGold
                  ? 'bg-brand-navy/20 text-brand-navy'
                  : 'bg-surface border border-border text-foreground'
              }`}
            >
              {planCurr}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          {/* Employee Info Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-2xl flex items-center justify-center font-black shrink-0 transition-transform ${
                  isGold
                    ? 'w-13 h-13 text-lg bg-gradient-to-br from-brand-gold to-amber-500 text-brand-navy shadow-md ring-4 ring-brand-gold/30'
                    : isSilver
                      ? 'w-11 h-11 text-sm bg-slate-200 dark:bg-slate-700 text-foreground ring-2 ring-slate-300 dark:ring-slate-600'
                      : 'w-11 h-11 text-sm bg-amber-800/20 text-amber-600 dark:text-amber-400 ring-2 ring-amber-700/30'
                }`}
                style={{ backgroundColor: plan.color || undefined }}
              >
                {getInitials(plan.employee_name)}
              </div>
              <div>
                <h3
                  onClick={() => handleOpenDetails(plan.employee_id)}
                  className="font-black text-foreground hover:text-brand-gold transition-colors cursor-pointer text-sm sm:text-base leading-snug flex items-center gap-1.5"
                >
                  {plan.employee_name}
                  {isGold && (
                    <Sparkles className="size-3.5 text-brand-gold shrink-0 animate-pulse" />
                  )}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground font-semibold text-[10px]">
                    {plan.department_name || 'Sales HQ'}
                  </span>
                  <span>•</span>
                  <span>
                    {plan.total_cargos_count || 0} {t('registeredCargos') || 'cargos'}
                  </span>
                </p>
              </div>
            </div>

            {/* Actions Menu */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleOpenDetails(plan.employee_id)}
                className="p-1.5 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="View history & details"
              >
                <Eye className="size-3.5" />
              </button>
              {canUpdate('cargo_kpi') && (
                <button
                  onClick={() => handleOpenEdit(plan)}
                  className="p-1.5 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Edit plan"
                >
                  <Edit2 className="size-3.5" />
                </button>
              )}
              {canDelete('cargo_kpi') && (
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="p-1.5 rounded-xl border border-rose-500/20 hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
                  title="Delete plan"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Big Score / Overall Completion Banner */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              isGold ? 'bg-brand-gold/10 border-brand-gold/30' : 'bg-muted/30 border-border'
            }`}
          >
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">
                {t('planOverallCompletion')}
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span
                  className={`font-black tracking-tight ${
                    isGold
                      ? 'text-2xl sm:text-3xl text-brand-gold'
                      : 'text-xl sm:text-2xl text-foreground'
                  }`}
                >
                  {plan.overall_completion_percentage}%
                </span>
                {plan.overall_completion_percentage >= 100 && (
                  <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
                    <Flame className="size-3" />
                    100%+
                  </span>
                )}
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${st.bg}`}>
              {st.label}
            </span>
          </div>

          {/* Dual Directions Progress Meters */}
          <div className="space-y-3 pt-1">
            {/* LTL Volume */}
            <div className="p-3 rounded-xl bg-muted/20 border border-border space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground flex items-center gap-1.5 text-[11px]">
                  <Package className="size-3.5 text-brand-gold" />
                  <span>{t('planLtlVolume')}</span>
                </span>
                <span className="font-black text-brand-gold text-[11px]">{ltlPct}%</span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-gold transition-all duration-500"
                  style={{ width: `${Math.min(100, ltlPct)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>
                  <strong className="text-foreground font-bold">{ltlActual}</strong> / {ltlTarget}{' '}
                  m³
                </span>
                <span>{ltlRem > 0 ? `Rem: ${ltlRem} m³` : '✓ Done'}</span>
              </div>
            </div>

            {/* FTL Sales */}
            <div className="p-3 rounded-xl bg-muted/20 border border-border space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground flex items-center gap-1.5 text-[11px]">
                  <Truck className="size-3.5 text-emerald-500" />
                  <span>{t('planFtlFinancial')}</span>
                </span>
                <span className="font-black text-emerald-500 text-[11px]">{ftlPct}%</span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, ftlPct)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>
                  <strong className="text-foreground font-bold">
                    {formatMoney(ftlActual, planCurr)}
                  </strong>{' '}
                  / {formatMoney(ftlTarget, planCurr)}
                </span>
                <span>{ftlRem > 0 ? `Rem: ${formatMoney(ftlRem, planCurr)}` : '✓ Done'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Physical 3D Podium Step Base on Desktop */}
        <div
          className={`hidden md:flex items-center justify-center font-black tracking-widest border-t ${
            isGold
              ? 'h-14 bg-gradient-to-b from-amber-500/25 to-amber-600/10 border-amber-500/40 text-amber-500 text-2xl shadow-inner'
              : isSilver
                ? 'h-11 bg-gradient-to-b from-slate-300/30 to-slate-400/10 dark:from-slate-700/40 dark:to-slate-800/20 border-slate-300 dark:border-slate-700 text-slate-400 text-xl'
                : 'h-9 bg-gradient-to-b from-amber-800/20 to-amber-900/10 border-amber-800/30 text-amber-700 text-lg'
          }`}
        >
          <span>{rankPos}</span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-royal text-brand-gold border border-brand-gold/30 shadow-sm shrink-0">
            <Target className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
              {t('tabPlans')}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                Dual Direction (LTL m³ + FTL $)
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live progress derived from cargo registrations, volume targets & sales revenue
              leaderboard
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="p-1 rounded-xl bg-muted/50 border border-border flex items-center gap-1">
            <button
              onClick={() => setViewMode('leaderboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'leaderboard'
                  ? 'bg-surface text-brand-gold shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Leaderboard & Podium View"
            >
              <Trophy className="size-3.5" />
              <span>{t('viewLeaderboard') || 'Leaderboard'}</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-surface text-brand-gold shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Table View"
            >
              <TableIcon className="size-3.5" />
              <span>{t('viewTable') || 'Table'}</span>
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'analytics'
                  ? 'bg-surface text-brand-gold shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Department Analytics"
            >
              <BarChart3 className="size-3.5" />
              <span>{t('viewAnalytics') || 'Analytics'}</span>
            </button>
          </div>

          {/* Month Picker */}
          <div className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="size-4 text-brand-gold shrink-0" />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-transparent text-foreground font-bold focus:outline-none cursor-pointer"
            />
          </div>

          {/* Refresh button */}
          <button
            onClick={loadPlans}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border hover:bg-muted text-foreground transition-all cursor-pointer"
            title="Refresh plans"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Add Plan Button */}
          {canCreate('cargo_kpi') && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-gold hover:bg-brand-gold/90 text-brand-navy shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="size-4" />
              {t('btnAddPlan')}
            </button>
          )}
        </div>
      </div>

      {/* Grand Aggregated Banner (When not in analytics mode) */}
      {viewMode !== 'analytics' && data && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-gradient-to-r from-brand-navy via-brand-royal to-brand-navy border border-brand-gold/30 text-white shadow-xl space-y-4"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] text-brand-gold uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                <Trophy className="size-4" />
                Organizational Sales & Volume Fulfillment ({month})
              </span>
              <div className="flex flex-wrap items-baseline gap-4 mt-2">
                <div>
                  <span className="text-[10px] text-neutral-300 block">LTL Volume Fact/Plan</span>
                  <strong className="text-xl font-black text-brand-gold">
                    {totalLtlActual.toLocaleString()} / {totalLtlTarget.toLocaleString()} m³
                  </strong>
                </div>
                <div className="h-8 w-px bg-white/10 hidden sm:block" />
                <div>
                  <span className="text-[10px] text-neutral-300 block">FTL Sales Fact/Plan</span>
                  <strong className="text-xl font-black text-emerald-400">
                    {formatMoney(totalFtlActual, 'USD')} / {formatMoney(totalFtlTarget, 'USD')}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/15 text-center">
                <span className="text-[10px] text-neutral-300 block font-medium">
                  {t('planTotalCargos')}
                </span>
                <strong className="text-xl font-black text-white">{totalCargosCount}</strong>
              </div>
              <div className="px-5 py-2.5 rounded-2xl bg-white/10 border border-white/15 text-center">
                <span className="text-[10px] text-neutral-300 block font-medium">
                  {t('planOverallCompletion')}
                </span>
                <strong className="text-2xl font-black text-brand-gold">
                  {data.overall_completion_percentage}%
                </strong>
              </div>
            </div>
          </div>

          {/* Grand Multi-stage progress bar */}
          <div className="space-y-1.5">
            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, data.overall_completion_percentage)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-brand-gold via-amber-400 to-emerald-400 shadow-lg"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Analytics View Switcher Content */}
      {viewMode === 'analytics' ? (
        <PlansDepartmentAnalytics
          month={month}
          onSelectEmployee={(empId) => handleOpenDetails(empId)}
        />
      ) : (
        <>
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface border border-border shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  t('searchPlansPlaceholder') || 'Search employee by name or department...'
                }
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Department & Status Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
              <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1 shrink-0">
                <Filter className="size-3 text-brand-gold" />
                Status:
              </span>
              {(['all', 'completed', 'in_progress', 'behind'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-brand-gold text-brand-navy shadow-xs font-black'
                      : 'border border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {st === 'all'
                    ? t('allPlans') || 'All Plans'
                    : st === 'completed'
                      ? t('planDone')
                      : st === 'in_progress'
                        ? t('planInProgress')
                        : t('planLagging')}
                </button>
              ))}

              {departmentsList.length > 0 && (
                <>
                  <div className="h-5 w-px bg-border mx-1 shrink-0" />
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="all">{t('allDepartments') || 'All Departments'}</option>
                    {departmentsList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>

          {/* Cards & Table Content */}
          {loading ? (
            <div className="p-16 text-center text-muted-foreground bg-surface rounded-2xl border border-border">
              <RefreshCw className="size-8 animate-spin mx-auto mb-3 text-brand-gold" />
              <p className="text-xs font-semibold">Loading employee sales plans...</p>
            </div>
          ) : sortedPlans.length === 0 ? (
            <div className="p-16 rounded-3xl bg-surface border border-border text-center text-muted-foreground space-y-3">
              <Trophy className="size-12 mx-auto text-muted-foreground/30" />
              <h4 className="text-base font-bold text-foreground">
                {t('noPlansFoundTitle') || 'No Target Plans Found'}
              </h4>
              <p className="text-xs max-w-md mx-auto text-muted-foreground">
                {t('noPlansFoundDesc') || `No matching target plans for ${month}.`}
              </p>
              {canCreate('cargo_kpi') && (
                <button
                  onClick={handleOpenAdd}
                  className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-brand-gold text-brand-navy shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="size-4" />
                  {t('btnAddPlan')}
                </button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            /* Dense Responsive Table View */
            <div className="overflow-x-auto rounded-2xl bg-surface border border-border shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/60 text-muted-foreground font-bold border-b border-border">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">LTL Volume (m³)</th>
                    <th className="py-3.5 px-4">FTL Sales ({sortedPlans[0]?.currency || 'USD'})</th>
                    <th className="py-3.5 px-4 text-center">Cargos</th>
                    <th className="py-3.5 px-4 text-center">Completion %</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {sortedPlans.map((plan, index) => {
                    const st = getStatusInfo(plan.is_completed, plan.overall_completion_percentage);
                    return (
                      <tr key={plan.id || index} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4 text-center">
                          {getRankBadge(plan.rank || index + 1)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-foreground">
                          <button
                            onClick={() => handleOpenDetails(plan.employee_id)}
                            className="hover:text-brand-gold hover:underline transition-colors text-left cursor-pointer"
                          >
                            {plan.employee_name}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">
                          {plan.department_name || 'Sales'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-brand-gold">
                            {plan.ltl_plan?.actual_volume ?? plan.ltl_actual_volume ?? 0}
                          </span>{' '}
                          / {plan.ltl_plan?.target_volume ?? plan.ltl_target_volume ?? 0} m³
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-emerald-500">
                            {formatMoney(
                              plan.ftl_plan?.actual_amount ?? plan.ftl_actual_amount ?? 0,
                              plan.currency || 'USD'
                            )}
                          </span>{' '}
                          /{' '}
                          {formatMoney(
                            plan.ftl_plan?.target_amount ?? plan.ftl_target_amount ?? 0,
                            plan.currency || 'USD'
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-foreground">
                          {plan.total_cargos_count || 0}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-black text-foreground text-sm">
                            {plan.overall_completion_percentage}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${st.bg}`}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenDetails(plan.employee_id)}
                              className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              title="View details"
                            >
                              <Eye className="size-3.5" />
                            </button>
                            {canUpdate('cargo_kpi') && (
                              <button
                                onClick={() => handleOpenEdit(plan)}
                                className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                title="Edit target plan"
                              >
                                <Edit2 className="size-3.5" />
                              </button>
                            )}
                            {canDelete('cargo_kpi') && (
                              <button
                                onClick={() => handleDeletePlan(plan.id)}
                                className="p-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
                                title="Delete plan"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* True Responsive Leaderboard View: Top 3 Podium + Streamline List */
            <div className="space-y-8">
              {/* TOP 3 PODIUM SECTION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-4 text-brand-gold" />
                    <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                      {t('planLeaderboard') || 'Top Performers Podium'}
                    </h3>
                  </div>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {sortedPlans.length} {t('planTotalCargos') ? 'Ranked' : 'Ranked'}
                  </span>
                </div>

                {/* Podium Grid (Olympic Podium Order on Desktop: #2 Left, #1 Center, #3 Right) */}
                {sortedPlans.length >= 3 ? (
                  <>
                    {/* Desktop & Tablet Podium (md:) */}
                    <div className="hidden md:grid md:grid-cols-3 gap-5 items-end pt-4 pb-2">
                      {/* #2 Silver Pedestal */}
                      {top2 && renderPodiumCard(top2, 2)}

                      {/* #1 Gold Champion Pedestal (Elevated Center) */}
                      {top1 && renderPodiumCard(top1, 1)}

                      {/* #3 Bronze Pedestal */}
                      {top3 && renderPodiumCard(top3, 3)}
                    </div>

                    {/* Mobile Podium (< md: Stacked 1, 2, 3) */}
                    <div className="flex flex-col gap-4 md:hidden">
                      {top1 && renderPodiumCard(top1, 1)}
                      {top2 && renderPodiumCard(top2, 2)}
                      {top3 && renderPodiumCard(top3, 3)}
                    </div>
                  </>
                ) : (
                  /* When fewer than 3 plans exist (e.g. 1 or 2) */
                  <div
                    className={`grid gap-5 ${
                      sortedPlans.length === 1
                        ? 'max-w-md mx-auto'
                        : 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto'
                    }`}
                  >
                    {top1 && renderPodiumCard(top1, 1)}
                    {top2 && renderPodiumCard(top2, 2)}
                  </div>
                )}
              </div>

              {/* RANKED CONTENDERS STREAMLINE LIST (#4 to #N) */}
              {contenders.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between px-1 border-b border-border pb-2">
                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Medal className="size-3.5 text-muted-foreground" />
                      <span>{t('contendersTitle') || 'Ranked Contenders'}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-muted text-muted-foreground">
                        #4 – #{sortedPlans.length}
                      </span>
                    </h4>
                    <span className="text-[11px] text-muted-foreground font-semibold">
                      {contenders.length} contenders
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {contenders.map((plan, index) => {
                      const rankNumber = index + 4;
                      const st = getStatusInfo(
                        plan.is_completed,
                        plan.overall_completion_percentage
                      );
                      const planCurr = plan.currency || 'USD';
                      const ltlTarget = plan.ltl_plan?.target_volume ?? plan.ltl_target_volume ?? 0;
                      const ltlActual = plan.ltl_plan?.actual_volume ?? plan.ltl_actual_volume ?? 0;
                      const ltlPct = plan.ltl_plan?.completion_percentage || 0;
                      const ftlTarget = plan.ftl_plan?.target_amount ?? plan.ftl_target_amount ?? 0;
                      const ftlActual = plan.ftl_plan?.actual_amount ?? plan.ftl_actual_amount ?? 0;
                      const ftlPct = plan.ftl_plan?.completion_percentage || 0;

                      return (
                        <motion.div
                          key={plan.id || index}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="p-4 rounded-2xl bg-surface border border-border hover:border-brand-gold/40 hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                        >
                          {/* Left: Rank, Avatar, Name & Department */}
                          <div className="flex items-center gap-3.5 min-w-[240px]">
                            <div className="w-8 h-8 rounded-xl bg-muted/60 text-muted-foreground font-extrabold text-xs flex items-center justify-center shrink-0 border border-border">
                              #{rankNumber}
                            </div>
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 text-white shadow-xs"
                              style={{ backgroundColor: plan.color || '#336699' }}
                            >
                              {getInitials(plan.employee_name)}
                            </div>
                            <div>
                              <h4
                                onClick={() => handleOpenDetails(plan.employee_id)}
                                className="font-extrabold text-sm text-foreground hover:text-brand-gold transition-colors cursor-pointer flex items-center gap-1.5"
                              >
                                {plan.employee_name}
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-muted text-muted-foreground">
                                  {planCurr}
                                </span>
                              </h4>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {plan.department_name || 'Sales HQ'} •{' '}
                                <span className="font-medium text-foreground">
                                  {plan.total_cargos_count || 0} cargos
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Center: Dual Metrics Progress Bars */}
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                            {/* LTL Bar */}
                            <div className="p-2.5 rounded-xl bg-muted/20 border border-border space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-foreground flex items-center gap-1">
                                  <Package className="size-3 text-brand-gold" />
                                  <span>LTL</span>
                                </span>
                                <span className="font-black text-brand-gold">{ltlPct}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-brand-gold transition-all duration-500"
                                  style={{ width: `${Math.min(100, ltlPct)}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>
                                  {ltlActual} / {ltlTarget} m³
                                </span>
                              </div>
                            </div>

                            {/* FTL Bar */}
                            <div className="p-2.5 rounded-xl bg-muted/20 border border-border space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-foreground flex items-center gap-1">
                                  <Truck className="size-3 text-emerald-500" />
                                  <span>FTL</span>
                                </span>
                                <span className="font-black text-emerald-500">{ftlPct}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                  style={{ width: `${Math.min(100, ftlPct)}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>
                                  {formatMoney(ftlActual, planCurr)} /{' '}
                                  {formatMoney(ftlTarget, planCurr)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Completion % & Actions */}
                          <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
                            <div className="text-left lg:text-right">
                              <span className="text-base font-black text-foreground block">
                                {plan.overall_completion_percentage}%
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold border inline-block ${st.bg}`}
                              >
                                {st.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenDetails(plan.employee_id)}
                                className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                title="View details"
                              >
                                <Eye className="size-3.5" />
                              </button>
                              {canUpdate('cargo_kpi') && (
                                <button
                                  onClick={() => handleOpenEdit(plan)}
                                  className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                  title="Edit plan"
                                >
                                  <Edit2 className="size-3.5" />
                                </button>
                              )}
                              {canDelete('cargo_kpi') && (
                                <button
                                  onClick={() => handleDeletePlan(plan.id)}
                                  className="p-2 rounded-xl border border-rose-500/20 hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
                                  title="Delete plan"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Add / Edit Target Plan Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg rounded-3xl bg-surface dark:bg-surface border border-border shadow-2xl overflow-hidden z-10"
            >
              <div className="p-5 bg-gradient-to-r from-brand-navy via-brand-royal to-brand-navy text-white border-b border-brand-gold/20 flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Target className="size-5 text-brand-gold" />
                  {editingPlan ? t('editTargetPlan') || 'Edit Target Plan' : t('btnAddPlan')}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
                {/* Employee Selector */}
                <div>
                  <EmployeeSelect
                    label="Employee"
                    required
                    value={selectedEmpId}
                    onChange={(id, name) => {
                      setSelectedEmpId(id);
                      if (name) setSelectedEmpName(name);
                    }}
                    placeholder="Search employee by name or phone..."
                  />
                </div>

                {/* Currency Selection */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Coins className="size-3.5 text-brand-gold" />
                    <span>{t('ftlCurrency') || 'FTL Plan Currency'}</span>
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {(['USD', 'UZS', 'RUB', 'RMB', 'CNY'] as SupportedCurrency[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setPlanCurrency(c)}
                        className={`py-2 px-2 rounded-xl border text-xs font-black transition-all cursor-pointer text-center ${
                          planCurrency === c
                            ? 'bg-brand-gold text-brand-navy border-brand-gold shadow-xs'
                            : 'border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Period Month */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    {t('targetPeriodMonth') || 'Target Period Month'}
                  </label>
                  <input
                    type="month"
                    required
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>

                {/* Direction 1: LTL Target Volume */}
                <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
                  <label className="block text-xs font-bold text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Package className="size-4 text-brand-gold" />
                      {t('planLtlTargetVolume') || 'Direction 1: LTL Volume Target (m³)'}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {t('evalByLtlVolume') || 'Evaluated by LTL volume'}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={ltlTargetStr}
                    onChange={(e) => setLtlTargetStr(e.target.value)}
                    placeholder="100"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>

                {/* Direction 2: FTL Target Financial Amount */}
                <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
                  <label className="block text-xs font-bold text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Truck className="size-4 text-emerald-500" />
                      {t('planFtlTargetAmount') || 'Direction 2: FTL Financial Target'} (
                      {planCurrency})
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {t('evalByFtlRevenue') || 'Evaluated by FTL revenue'}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={ftlTargetStr}
                    onChange={(e) => setFtlTargetStr(e.target.value)}
                    placeholder="50000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>

                {/* Live Preview Box */}
                <div className="p-3.5 rounded-xl bg-brand-gold/10 border border-brand-gold/30 text-xs space-y-1">
                  <span className="font-extrabold text-brand-gold block">
                    {t('planPreviewFor', { name: selectedEmpName || 'Selected Employee' })}
                  </span>
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>
                      LTL: <strong>{ltlTargetStr || 0} m³</strong>
                    </span>
                    <span>
                      FTL:{' '}
                      <strong>
                        {ftlTargetStr || 0} {planCurrency}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border hover:bg-muted text-foreground transition-all cursor-pointer"
                  >
                    {t('actionCancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-gold hover:bg-brand-gold/90 text-brand-navy shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <RefreshCw className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle className="size-4" />
                    )}
                    {editingPlan ? t('actionSave') : t('actionCreate')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Employee Personal History & Statistics Modal */}
      <EmployeePlanDetailsModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        employeeId={detailEmpId}
        month={month}
      />
    </div>
  );
}
