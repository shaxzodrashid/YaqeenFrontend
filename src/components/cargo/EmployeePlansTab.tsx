import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { cargoKpiApi } from '../../services/cargoKpi.service';
import type { EmployeePlansResponse, EmployeePlanProgress } from '../../services/cargoKpi.service';
import { formatMoney, type SupportedCurrency } from '../../types/currency';
import { EmployeeSelect } from './EmployeeSelect';

export function EmployeePlansTab() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  const [month, setMonth] = useState<string>('2026-07');
  const [data, setData] = useState<EmployeePlansResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<EmployeePlanProgress | null>(null);
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    'b1a2c3d4-e5f6-7890-abcd-ef1234567890'
  );
  const [targetStr, setTargetStr] = useState<string>('50000');
  const [planCurrency, setPlanCurrency] = useState<SupportedCurrency>('UZS');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cargoKpiApi.getPlans({ month });
      setData(res);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to load employee plans', 'error');
    } finally {
      setLoading(false);
    }
  }, [month, showNotification]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleOpenAdd = () => {
    setEditingPlan(null);
    setSelectedEmpId('b1a2c3d4-e5f6-7890-abcd-ef1234567890');
    setTargetStr('50000');
    setPlanCurrency('UZS');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: EmployeePlanProgress) => {
    setEditingPlan(plan);
    setSelectedEmpId(plan.employee_id || 'b1a2c3d4-e5f6-7890-abcd-ef1234567890');
    setTargetStr(String(plan.target_sales));
    setPlanCurrency(plan.currency || 'UZS');
    setIsModalOpen(true);
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
    const target = parseFloat(targetStr);
    if (isNaN(target) || target <= 0 || !selectedEmpId) {
      showNotification('Please select an employee and provide a valid target amount.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (editingPlan) {
        await cargoKpiApi.updatePlan(editingPlan.id, {
          period: month,
          target_amount: target,
          currency: planCurrency,
        });
        showNotification(t('successPlanUpdated') || 'Target plan updated successfully', 'success');
      } else {
        await cargoKpiApi.createPlan({
          employee_id: selectedEmpId,
          period: month,
          target_amount: target,
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

  const getStatusColor = (status: string, pct: number) => {
    if (pct >= 100 || status === 'completed') {
      return {
        bg: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
        bar: 'bg-emerald-500',
        label: t('planDone'),
      };
    }
    if (pct >= 50 || status === 'on_track') {
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
            <Target className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{t('tabPlans')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Employee sales targets, live revenue accumulation & leaderboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="size-4 text-brand-gold" />
            <span className="text-muted-foreground font-medium">Month:</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-transparent text-foreground font-semibold focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={loadPlans}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border hover:bg-muted text-foreground transition-all cursor-pointer"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-gold hover:bg-brand-gold/90 text-brand-navy shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="size-4" />
            {t('btnAddPlan')}
          </button>
        </div>
      </div>

      {/* Overall Progress Grand Banner */}
      {data && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-gradient-to-r from-brand-navy via-brand-royal to-brand-navy border border-brand-gold/30 text-white shadow-xl space-y-4"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-brand-gold uppercase tracking-wider font-bold">
                Overall Department Progress ({data.month || '2026-07'})
              </span>
              <h3 className="text-2xl font-black text-white mt-1">
                {(data?.total_actual ?? 0).toLocaleString()} /{' '}
                {(data?.total_target ?? 0).toLocaleString()}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-center">
                <span className="text-[10px] text-neutral-300 block">Overall Completion</span>
                <span className="text-xl font-extrabold text-brand-gold">
                  {data?.overall_completion_percentage ?? 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, data?.overall_completion_percentage ?? 0)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-brand-gold via-amber-400 to-emerald-400 shadow-lg"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Employee Leaderboard & Progress Cards */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground">
          <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-brand-gold" />
          <p className="text-xs">Loading employee sales plans...</p>
        </div>
      ) : !data || !data.plans || data.plans.length === 0 ? (
        <div className="p-12 rounded-2xl bg-surface border border-border text-center text-muted-foreground">
          <Trophy className="size-10 mx-auto mb-3 text-muted-foreground/40" />
          <h4 className="text-sm font-bold text-foreground">No Target Plans for {month}</h4>
          <p className="text-xs mt-1">
            Click "Add Target Plan" to set target sales metrics for your sales team.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {(data.plans || []).map((plan: EmployeePlanProgress, index: number) => {
            const st = getStatusColor(plan.status, plan.completion_percentage);
            const planCurr = plan.currency || 'UZS';
            return (
              <motion.div
                key={plan.id || index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-5 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm space-y-3 hover:border-brand-gold/40 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Employee & Rank */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30 flex items-center justify-center font-bold">
                      {getRankBadge(plan.rank || index + 1)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        {plan.employee_name}
                        <span className="px-2 py-0.5 rounded-md bg-brand-gold/15 text-brand-gold text-[10px] font-bold border border-brand-gold/30">
                          {planCurr}
                        </span>
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {plan.department_name || 'Sales Department'}
                      </p>
                    </div>
                  </div>

                  {/* Financial Stats */}
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="px-3 py-1.5 rounded-xl bg-muted/50 border border-border">
                      <span className="text-muted-foreground block text-[10px]">
                        {t('targetSales')}
                      </span>
                      <strong className="text-foreground text-sm">
                        {formatMoney(plan.target_sales, planCurr)}
                      </strong>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-muted/50 border border-border">
                      <span className="text-muted-foreground block text-[10px]">
                        {t('actualSales')}
                      </span>
                      <strong className="text-emerald-500 text-sm">
                        {formatMoney(plan.actual_sales, planCurr)}
                      </strong>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-muted/50 border border-border">
                      <span className="text-muted-foreground block text-[10px]">
                        {t('remainingTarget')}
                      </span>
                      <strong className="text-rose-500 text-sm">
                        {formatMoney(plan.remaining_target, planCurr)}
                      </strong>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${st.bg}`}>
                      {st.label} ({plan.completion_percentage}%)
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(plan)}
                        className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Edit Target"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="p-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
                        title="Delete Plan"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Individual Progress Bar */}
                <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, plan.completion_percentage)}%` }}
                    transition={{ duration: 0.6 }}
                    className={`h-full rounded-full ${st.bar}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
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
              className="relative w-full max-w-lg rounded-2xl bg-surface dark:bg-surface border border-border shadow-2xl overflow-hidden z-10"
            >
              <div className="p-5 bg-gradient-to-r from-brand-navy to-brand-royal text-white border-b border-brand-gold/20 flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Target className="size-5 text-brand-gold" />
                  {editingPlan ? 'Edit Target Plan' : t('btnAddPlan')}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
                <div>
                  <EmployeeSelect
                    label="Employee"
                    required
                    value={selectedEmpId}
                    onChange={(id) => {
                      setSelectedEmpId(id);
                    }}
                    placeholder="Search employee by name or phone..."
                  />
                </div>

                {/* Currency Selection */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                    <Coins className="size-3.5 text-brand-gold" />
                    <span>Plan Currency</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['UZS', 'USD', 'RUB'] as SupportedCurrency[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setPlanCurrency(c)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          planCurrency === c
                            ? 'bg-brand-gold/15 border-brand-gold text-brand-gold shadow-xs'
                            : 'border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {c === 'UZS' ? "UZS (So'm)" : c === 'USD' ? 'USD ($)' : 'RUB (₽)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Month
                    </label>
                    <input
                      type="month"
                      required
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      {t('targetSales')} ({planCurrency})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={targetStr}
                      onChange={(e) => setTargetStr(e.target.value)}
                      placeholder="50000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border hover:bg-muted text-foreground transition-all"
                  >
                    {t('actionCancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-gold hover:bg-brand-gold/90 text-brand-navy shadow-md transition-all flex items-center gap-2"
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
    </div>
  );
}
