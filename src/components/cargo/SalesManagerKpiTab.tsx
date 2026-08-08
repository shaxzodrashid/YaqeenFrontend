import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Calculator,
  RefreshCw,
  Crown,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  Users,
  ChevronDown,
  ChevronUp,
  Edit2,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { usePermissions } from '../../context/PermissionsContext';
import { T } from '../T';
import {
  salesManagerKpiApi,
  SALES_BONUS_MATRIX,
  CAREER_LEVELS_MATRIX,
} from '../../services/salesManagerKpi.service';
import type {
  SalesManagerEvaluation,
  EvaluationApprovalStatus,
  CareerLevel,
} from '../../types/salesManagerKpi';
import { EmployeeSelect } from './EmployeeSelect';
import {
  CalculateEvaluationsModal,
  ApproveSrCheckModal,
  ReviewDemotionModal,
  UpdateEmployeeLevelModal,
} from './SalesManagerKpiModals';

export function SalesManagerKpiTab() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canUpdate, canCreate } = usePermissions();

  const [month, setMonth] = useState<string>('2026-07');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [evaluations, setEvaluations] = useState<SalesManagerEvaluation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showMatrix, setShowMatrix] = useState<boolean>(false);

  // Modal States
  const [isCalcModalOpen, setIsCalcModalOpen] = useState<boolean>(false);
  const [activeSrCheckEval, setActiveSrCheckEval] = useState<SalesManagerEvaluation | null>(null);
  const [activeDemotionEval, setActiveDemotionEval] = useState<SalesManagerEvaluation | null>(null);
  const [activeLevelEmp, setActiveLevelEmp] = useState<{
    id: string;
    name?: string;
    level?: CareerLevel;
    mentees?: number;
  } | null>(null);

  const loadEvaluations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salesManagerKpiApi.getEvaluations({
        month,
        employee_id: selectedEmployeeId || undefined,
        approval_status: selectedStatus || undefined,
      });
      setEvaluations(res.data || []);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to load sales manager evaluations', 'error');
    } finally {
      setLoading(false);
    }
  }, [month, selectedEmployeeId, selectedStatus, showNotification]);

  useEffect(() => {
    loadEvaluations();
  }, [loadEvaluations]);

  // Handlers for modal actions
  const handleCalculate = async (data: {
    month: string;
    employee_id?: string;
    additional_bonus_amount?: number;
  }) => {
    try {
      const res = await salesManagerKpiApi.calculateEvaluations(data);
      showNotification(
        `Calculated ${res.evaluations_calculated} evaluation(s) for ${res.month}`,
        'success'
      );
      loadEvaluations();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to calculate evaluations', 'error');
    }
  };

  const handleApproveSrCheck = async (id: string, notes: string) => {
    try {
      await salesManagerKpiApi.approveSrCheck(id, { review_notes: notes });
      showNotification(t('successEmpUpdated') || 'SR Check approved successfully', 'success');
      loadEvaluations();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to approve SR Check', 'error');
    }
  };

  const handleReviewDemotion = async (
    id: string,
    action: 'APPROVE_DEMOTION' | 'MAINTAIN_LEVEL',
    notes: string
  ) => {
    try {
      await salesManagerKpiApi.reviewDemotion(id, { action, review_notes: notes });
      showNotification(
        action === 'APPROVE_DEMOTION' ? 'Demotion approved' : 'Level retained',
        'success'
      );
      loadEvaluations();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to submit demotion review', 'error');
    }
  };

  const handleUpdateLevel = async (
    empId: string,
    data: { career_level: CareerLevel; mentees_count: number }
  ) => {
    try {
      await salesManagerKpiApi.updateEmployeeLevel(empId, data);
      showNotification('Career level & mentees count updated successfully', 'success');
      loadEvaluations();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update employee level', 'error');
    }
  };

  // UI Helper Badges
  const getLevelBadge = (level: CareerLevel) => {
    switch (level) {
      case 'EXPERT':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-purple-500/15 text-purple-500 border border-purple-500/30 flex items-center gap-1.5 shadow-sm">
            <Crown className="size-3.5" />
            EXPERT
          </span>
        );
      case 'SENIOR':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
            <Award className="size-3.5" />
            SENIOR
          </span>
        );
      case 'MID':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-brand-gold/15 text-brand-gold border border-brand-gold/30 flex items-center gap-1.5 shadow-sm">
            <TrendingUp className="size-3.5" />
            MID
          </span>
        );
      case 'JUNIOR':
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-500/15 text-blue-500 border border-blue-500/30 flex items-center gap-1.5 shadow-sm">
            <Users className="size-3.5" />
            JUNIOR
          </span>
        );
    }
  };

  const getStatusBadge = (status: EvaluationApprovalStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle className="size-3.5" />
            <T k="smkStatusApproved" />
          </span>
        );
      case 'PENDING_SR_CHECK_APPROVAL':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
            <AlertTriangle className="size-3.5" />
            <T k="smkStatusPendingSrCheck" />
          </span>
        );
      case 'DEMOTION_PENDING_REVIEW':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30 flex items-center gap-1.5 animate-pulse">
            <ShieldAlert className="size-3.5" />
            <T k="smkStatusDemotionPending" />
          </span>
        );
      case 'DEMOTION_APPROVED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-500/15 text-gray-400 border border-gray-500/30 flex items-center gap-1.5">
            <ArrowDownRight className="size-3.5" />
            <T k="smkStatusDemotionApproved" />
          </span>
        );
      case 'DEMOTION_REJECTED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30 flex items-center gap-1.5">
            <CheckCircle className="size-3.5" />
            <T k="smkStatusDemotionRejected" />
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* HEADER & TOP CONTROLS                                             */}
      {/* ----------------------------------------------------------------- */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-navy via-brand-royal to-brand-navy border border-brand-gold/30 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
              <Award className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <T k="smkTitle" />
              </h2>
              <p className="text-xs text-neutral-300 mt-0.5">
                <T k="smkSubtitle" />
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowMatrix(!showMatrix)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="size-4 text-brand-gold" />
              <span>
                <T k="smkMatrixToggle" />
              </span>
              {showMatrix ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>

            {canCreate('cargo_kpi') && (
              <button
                onClick={() => setIsCalcModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-gold to-amber-500 text-brand-navy shadow-md hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Calculator className="size-4" />
                <span>
                  <T k="smkCalcEvaluations" />
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-300 font-semibold">Month:</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 text-white text-xs font-semibold focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-300 font-semibold">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-white/20 bg-neutral-900 text-white text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="">{t('smkFilterStatus') || 'All Statuses'}</option>
              <option value="APPROVED">{t('smkStatusApproved') || 'Approved'}</option>
              <option value="PENDING_SR_CHECK_APPROVAL">
                {t('smkStatusPendingSrCheck') || 'Pending SR Check'}
              </option>
              <option value="DEMOTION_PENDING_REVIEW">
                {t('smkStatusDemotionPending') || 'Demotion Pending'}
              </option>
              <option value="DEMOTION_APPROVED">
                {t('smkStatusDemotionApproved') || 'Demoted'}
              </option>
              <option value="DEMOTION_REJECTED">
                {t('smkStatusDemotionRejected') || 'Level Retained'}
              </option>
            </select>
          </div>

          <div className="w-48">
            <EmployeeSelect
              value={selectedEmployeeId}
              onChange={setSelectedEmployeeId}
              placeholder={t('smkFilterEmployee') || 'All Sales Managers'}
            />
          </div>

          <button
            onClick={loadEvaluations}
            disabled={loading}
            className="p-2 rounded-xl border border-white/20 hover:bg-white/10 text-white transition-all cursor-pointer ml-auto"
            title="Refresh list"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* COLLAPSIBLE MATRIX REFERENCE PANEL                                */}
      {/* ----------------------------------------------------------------- */}
      <AnimatePresence>
        {showMatrix && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden"
          >
            {/* Sales Bonus Matrix */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="size-4 text-brand-gold" />
                <T k="smkSalesBonusMatrix" />
              </h3>
              <div className="overflow-x-auto rounded-xl border border-border text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-bold border-b border-border">
                    <tr>
                      <th className="px-3 py-2">Monthly Sales Range</th>
                      <th className="px-3 py-2 text-right">Bonus Rate (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {SALES_BONUS_MATRIX.map((tier) => (
                      <tr key={tier.label} className="hover:bg-muted/20">
                        <td className="px-3 py-2 font-medium">{tier.label}</td>
                        <td className="px-3 py-2 text-right font-bold text-brand-gold">
                          {tier.rate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Career Levels Matrix */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Crown className="size-4 text-purple-500" />
                <T k="smkCareerLevelsMatrix" />
              </h3>
              <div className="overflow-x-auto rounded-xl border border-border text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-bold border-b border-border">
                    <tr>
                      <th className="px-3 py-2">Level</th>
                      <th className="px-3 py-2">Salary ($)</th>
                      <th className="px-3 py-2">Target Range ($)</th>
                      <th className="px-3 py-2">SR Check (Min / Target)</th>
                      <th className="px-3 py-2">Mentees</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-medium">
                    {Object.values(CAREER_LEVELS_MATRIX).map((spec) => (
                      <tr key={spec.level} className="hover:bg-muted/20">
                        <td className="px-3 py-2">{getLevelBadge(spec.level)}</td>
                        <td className="px-3 py-2 font-bold text-foreground">${spec.fixedSalary}</td>
                        <td className="px-3 py-2">
                          ${spec.targetMin.toLocaleString()} – ${spec.targetMax.toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          ${spec.srCheckMin} / ${spec.srCheckTarget}
                        </td>
                        <td className="px-3 py-2">{spec.menteesRequired}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------------------- */}
      {/* EVALUATIONS GRID / LIST                                           */}
      {/* ----------------------------------------------------------------- */}
      {evaluations.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm space-y-3">
          <Award className="size-12 text-muted-foreground mx-auto opacity-50" />
          <h3 className="text-base font-bold text-foreground">
            No Sales Manager Evaluations Found
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Click <strong>"Calculate Evaluations"</strong> above to compute monthly sales, bonuses,
            and career rank evaluations for {month}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {evaluations.map((item) => {
            const totalSalesNum = Number(item.total_sales);
            const targetMinNum = Number(item.plan_target_min);
            const targetMaxNum = Number(item.plan_target_max);
            const salesPct =
              targetMinNum > 0 ? Math.round((totalSalesNum / targetMinNum) * 100) : 100;

            const avgCheckNum = Number(item.average_check);
            const srMinNum = Number(item.sr_check_min);
            const srTargetNum = Number(item.sr_check_target);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm hover:shadow-md transition-all space-y-5"
              >
                {/* Header Row: Manager Info + Status Badge + Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-3.5">
                    <div className="size-11 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-royal text-brand-gold flex items-center justify-center font-bold text-base border border-brand-gold/30 shadow-sm">
                      {(item.employee_name || 'M')[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-bold text-foreground">
                          {item.employee_name || 'Sales Manager'}
                        </h3>
                        {getLevelBadge(item.career_level)}
                        <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[11px] font-bold flex items-center gap-1">
                          <Users className="size-3" />
                          {item.mentees_count || 0} mentees
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Evaluation Month:{' '}
                        <span className="font-semibold text-foreground">{item.month}</span> • Deals:{' '}
                        <span className="font-semibold text-foreground">{item.deal_count}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(item.approval_status)}

                    {/* ROP/CEO Action Buttons */}
                    {canUpdate('cargo_kpi') &&
                      item.approval_status === 'PENDING_SR_CHECK_APPROVAL' && (
                        <button
                          onClick={() => setActiveSrCheckEval(item)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle className="size-3.5" />
                          <span>
                            <T k="smkApproveSrCheck" />
                          </span>
                        </button>
                      )}

                    {canUpdate('cargo_kpi') &&
                      item.approval_status === 'DEMOTION_PENDING_REVIEW' && (
                        <button
                          onClick={() => setActiveDemotionEval(item)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <ShieldAlert className="size-3.5" />
                          <span>
                            <T k="smkReviewDemotion" />
                          </span>
                        </button>
                      )}

                    {canUpdate('cargo_kpi') && (
                      <button
                        onClick={() =>
                          setActiveLevelEmp({
                            id: item.employee_id,
                            name: item.employee_name,
                            level: item.career_level,
                            mentees: item.mentees_count,
                          })
                        }
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer border border-border"
                        title={t('smkUpdateLevelMentees') || 'Update Rank & Mentees'}
                      >
                        <Edit2 className="size-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Main 3 Column Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Column 1: Sales Target & Progress */}
                  <div className="md:col-span-4 p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-muted-foreground uppercase tracking-wider">
                        <T k="smkSalesProgress" />
                      </span>
                      <span
                        className={`font-black ${salesPct >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}
                      >
                        {salesPct}%
                      </span>
                    </div>

                    <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          salesPct >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(salesPct, 100)}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Total Sales</span>
                        <strong className="text-foreground text-sm">
                          ${Number(item.total_sales).toLocaleString()}
                        </strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          Plan Min / Max
                        </span>
                        <strong className="text-foreground text-sm">
                          ${targetMinNum.toLocaleString()} / ${targetMaxNum.toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Average Check Indicator & Streaks */}
                  <div className="md:col-span-4 p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-muted-foreground uppercase tracking-wider">
                        <T k="smkAverageCheckProgress" />
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded ${
                          avgCheckNum >= srTargetNum
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : avgCheckNum >= srMinNum
                              ? 'bg-amber-500/15 text-amber-500'
                              : 'bg-rose-500/15 text-rose-500'
                        }`}
                      >
                        ${avgCheckNum}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          SR Check Target
                        </span>
                        <strong className="text-foreground text-sm">
                          ${srTargetNum} (Min ${srMinNum})
                        </strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          Bonus Rate (%)
                        </span>
                        <strong className="text-brand-gold text-sm">
                          {item.sales_bonus_rate}%
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs pt-2 border-t border-border/50">
                      <div className="flex items-center gap-1.5 text-emerald-500">
                        <ArrowUpRight className="size-3.5" />
                        <span>
                          Success Streak: <strong>{item.consecutive_successes} mo</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-rose-500">
                        <ArrowDownRight className="size-3.5" />
                        <span>
                          Missed Streak: <strong>{item.consecutive_failures} mo</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Total Earnings Breakdown Box */}
                  <div className="md:col-span-4 p-4 rounded-xl bg-gradient-to-br from-brand-navy/10 to-brand-royal/10 border border-brand-gold/30 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Monthly Earnings Breakdown
                    </span>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Fixed Salary:</span>
                        <span className="font-semibold text-foreground">${item.fixed_salary}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Sales Bonus ({item.sales_bonus_rate}%):</span>
                        <span className="font-semibold text-foreground">
                          +${item.sales_bonus_amount}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>KPI Bonus:</span>
                        <span className="font-semibold text-foreground">
                          +${item.kpi_bonus_amount}
                        </span>
                      </div>
                      {Number(item.additional_bonus_amount) > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Add. Bonus:</span>
                          <span className="font-semibold text-foreground">
                            +${item.additional_bonus_amount}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-baseline pt-2 border-t border-border font-bold">
                        <span className="text-foreground text-xs uppercase">
                          <T k="smkTotalEarnings" />:
                        </span>
                        <span className="text-xl font-black text-brand-gold">
                          $
                          {Number(item.total_earnings).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reviewer Notes Banner if Present */}
                {item.review_notes && (
                  <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground flex items-start gap-2">
                    <HelpCircle className="size-4 text-brand-gold shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">
                        {item.reviewer_name || 'Reviewer'}:
                      </strong>{' '}
                      {item.review_notes}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODALS INTEGRATION                                                */}
      {/* ----------------------------------------------------------------- */}
      <CalculateEvaluationsModal
        isOpen={isCalcModalOpen}
        currentMonth={month}
        onClose={() => setIsCalcModalOpen(false)}
        onConfirm={handleCalculate}
      />

      <ApproveSrCheckModal
        isOpen={!!activeSrCheckEval}
        evaluation={activeSrCheckEval}
        onClose={() => setActiveSrCheckEval(null)}
        onConfirm={handleApproveSrCheck}
      />

      <ReviewDemotionModal
        isOpen={!!activeDemotionEval}
        evaluation={activeDemotionEval}
        onClose={() => setActiveDemotionEval(null)}
        onConfirm={handleReviewDemotion}
      />

      {activeLevelEmp && (
        <UpdateEmployeeLevelModal
          isOpen={true}
          employeeId={activeLevelEmp.id}
          employeeName={activeLevelEmp.name}
          currentLevel={activeLevelEmp.level}
          currentMentees={activeLevelEmp.mentees}
          onClose={() => setActiveLevelEmp(null)}
          onConfirm={handleUpdateLevel}
        />
      )}
    </div>
  );
}
