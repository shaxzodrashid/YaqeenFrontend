import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, Trophy, Users, Layers, RefreshCw, Award } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { cargoKpiApi } from '../../services/cargoKpi.service';
import type { PlansAggregatedStatsResponse } from '../../services/cargoKpi.service';
import { formatMoney } from '../../types/currency';

export interface PlansDepartmentAnalyticsProps {
  month: string;
  onSelectEmployee?: (employeeId: string) => void;
}

export function PlansDepartmentAnalytics({
  month,
  onSelectEmployee,
}: PlansDepartmentAnalyticsProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<PlansAggregatedStatsResponse | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cargoKpiApi.getPlansStats({ period: month });
      setStats(res);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to load plans statistics', 'error');
    } finally {
      setLoading(false);
    }
  }, [month, showNotification]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <div className="p-16 text-center text-muted-foreground bg-surface rounded-2xl border border-border">
        <RefreshCw className="size-8 animate-spin mx-auto mb-3 text-brand-gold" />
        <p className="text-xs font-semibold">
          {t('loadingOrgAnalytics') || 'Loading organizational plan analytics...'}
        </p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-12 rounded-2xl bg-surface border border-border text-center text-muted-foreground">
        <Layers className="size-10 mx-auto mb-2 text-muted-foreground/40" />
        <p className="text-xs">
          {t('noOrgData') || 'No organizational data available for'} {month}.
        </p>
      </div>
    );
  }

  const { summary, ltl_statistics, ftl_statistics, department_breakdown, leaderboard } = stats;

  return (
    <div className="space-y-6">
      {/* Top 3 Executive Metric Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Org Completion */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-brand-navy via-brand-royal to-brand-navy border border-brand-gold/30 text-white shadow-lg space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-brand-gold uppercase tracking-wider">
              {t('planOverallCompletion')}
            </span>
            <span className="p-2 rounded-xl bg-white/10 text-brand-gold border border-white/10">
              <Trophy className="size-4" />
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-black text-white">
                {summary.overall_completion_percentage}%
              </span>
              <span className="text-xs text-neutral-300 block mt-0.5">
                {summary.completed_plans_count} of {summary.total_plans} plans achieved
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-brand-gold font-bold block">
                {summary.total_cargos_registered}
              </span>
              <span className="text-[10px] text-neutral-400">
                {t('planTotalCargos') || 'Total Cargos'}
              </span>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-gold to-emerald-400"
              style={{ width: `${Math.min(100, summary.overall_completion_percentage)}%` }}
            />
          </div>
        </motion.div>

        {/* Card 2: LTL Volume Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-5 rounded-2xl bg-surface border border-border shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Package className="size-4 text-brand-gold" />
              {t('planLtlVolume')}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
              {ltl_statistics.completion_percentage}% {t('done') || 'Done'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-foreground">
                {ltl_statistics.total_actual_volume.toLocaleString()} m³
              </span>
              <span className="text-xs text-muted-foreground block mt-0.5">
                {t('target') || 'Target'}: {ltl_statistics.total_target_volume.toLocaleString()} m³
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-foreground block">
                {ltl_statistics.total_cargo_count} cargos
              </span>
              <span className="text-[10px] text-muted-foreground">
                ~{ltl_statistics.avg_volume_per_cargo} m³/cargo
              </span>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-gold transition-all duration-500"
              style={{ width: `${Math.min(100, ltl_statistics.completion_percentage)}%` }}
            />
          </div>
        </motion.div>

        {/* Card 3: FTL Financial Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl bg-surface border border-border shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="size-4 text-emerald-500" />
              {t('planFtlFinancial')} ({ftl_statistics.currency})
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
              {ftl_statistics.completion_percentage}% {t('done') || 'Done'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-emerald-500">
                {formatMoney(ftl_statistics.total_actual_amount, ftl_statistics.currency)}
              </span>
              <span className="text-xs text-muted-foreground block mt-0.5">
                {t('target') || 'Target'}:{' '}
                {formatMoney(ftl_statistics.total_target_amount, ftl_statistics.currency)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-foreground block">
                {ftl_statistics.total_cargo_count} cargos
              </span>
              <span className="text-[10px] text-muted-foreground">
                ~{formatMoney(ftl_statistics.avg_amount_per_cargo, ftl_statistics.currency)}/cargo
              </span>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, ftl_statistics.completion_percentage)}%` }}
            />
          </div>
        </motion.div>
      </div>

      {/* Department Breakdown Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Layers className="size-4 text-brand-gold" />
            {t('planDepartmentBreakdown')}
          </h3>
          <span className="text-xs text-muted-foreground">
            {department_breakdown.length} active departments
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {department_breakdown.map((dept, index) => (
            <motion.div
              key={dept.department_name || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-5 rounded-2xl bg-surface border border-border shadow-sm space-y-4 hover:border-brand-gold/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30 flex items-center justify-center font-bold text-xs">
                    <Users className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{dept.department_name}</h4>
                    <p className="text-[11px] text-muted-foreground">
                      {dept.employees_count} sales managers • {dept.total_cargos} registered
                      shipments
                    </p>
                  </div>
                </div>
              </div>

              {/* LTL Progress in Dept */}
              <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Package className="size-3 text-brand-gold" />
                    LTL Volume:
                  </span>
                  <span className="text-foreground">
                    <strong className="text-brand-gold">{dept.ltl_actual_volume}</strong> /{' '}
                    {dept.ltl_target_volume} m³ ({dept.ltl_completion_percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-gold"
                    style={{ width: `${Math.min(100, dept.ltl_completion_percentage)}%` }}
                  />
                </div>
              </div>

              {/* FTL Progress in Dept */}
              <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Truck className="size-3 text-emerald-500" />
                    FTL Sales:
                  </span>
                  <span className="text-foreground">
                    <strong className="text-emerald-500">
                      {formatMoney(dept.ftl_actual_amount, dept.currency)}
                    </strong>{' '}
                    / {formatMoney(dept.ftl_target_amount, dept.currency)} (
                    {dept.ftl_completion_percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(100, dept.ftl_completion_percentage)}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Leaderboard Fast Summary */}
      <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Award className="size-4 text-brand-gold" />
            Top Performing Managers ({month})
          </h3>
          <span className="text-xs text-muted-foreground">{leaderboard.length} ranked</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {leaderboard.slice(0, 6).map((plan, idx) => (
            <div
              key={plan.id || idx}
              onClick={() => onSelectEmployee?.(plan.employee_id)}
              className="p-3.5 rounded-xl bg-muted/30 hover:bg-muted/60 border border-border transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-foreground hover:text-brand-gold transition-colors">
                    {plan.employee_name}
                  </h4>
                  <p className="text-[10px] text-muted-foreground">{plan.department_name}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-brand-gold block">
                  {plan.overall_completion_percentage}%
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {plan.total_cargos_count} cargos
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
