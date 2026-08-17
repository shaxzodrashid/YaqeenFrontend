import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Trophy, Package, Truck, Calendar, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { cargoKpiApi } from '../../services/cargoKpi.service';
import type { EmployeePersonalPlanStatsResponse } from '../../services/cargoKpi.service';
import { formatMoney } from '../../types/currency';

export interface EmployeePlanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string | null;
  month: string;
}

export function EmployeePlanDetailsModal({
  isOpen,
  onClose,
  employeeId,
  month,
}: EmployeePlanDetailsModalProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<EmployeePersonalPlanStatsResponse | null>(null);

  useEffect(() => {
    if (!isOpen || !employeeId) {
      setData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    cargoKpiApi
      .getEmployeePlanStats(employeeId, { period: month })
      .then((res) => {
        if (isMounted) {
          setData(res);
        }
      })
      .catch((err) => {
        if (isMounted) {
          showNotification(err?.message || 'Failed to load employee plan statistics', 'error');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, employeeId, month, showNotification]);

  if (!isOpen) return null;

  const emp = data?.employee;
  const currentPlan = data?.current_plan;
  const totals = data?.totals;
  const history = data?.history || [];

  const getInitials = (name?: string) => {
    if (!name) return 'E';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getStatusBadge = (isCompleted?: boolean, pct: number = 0) => {
    if (isCompleted || pct >= 100) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
          {t('planDone')} ({pct}%)
        </span>
      );
    }
    if (pct >= 50) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
          {t('planInProgress')} ({pct}%)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30">
        {t('planLagging')} ({pct}%)
      </span>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl rounded-3xl bg-surface dark:bg-surface border border-border shadow-2xl overflow-hidden z-10 my-6 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-brand-navy via-brand-royal to-brand-navy text-white border-b border-brand-gold/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black shadow-md border border-white/20"
                style={{ backgroundColor: emp?.color || '#336699' }}
              >
                {getInitials(emp?.full_name || emp?.first_name)}
              </div>
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  {emp?.full_name ||
                    `${emp?.first_name || ''} ${emp?.last_name || ''}`.trim() ||
                    t('planEmployeePerformance') ||
                    'Employee Performance'}
                </h3>
                <p className="text-xs text-neutral-300 flex items-center gap-2 mt-0.5">
                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-brand-gold font-semibold">
                    {emp?.department_name || 'Sales HQ'}
                  </span>
                  <span>•</span>
                  <span>
                    {month} {t('periodReport') || 'Period Report'}
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {loading ? (
              <div className="p-16 text-center text-muted-foreground">
                <RefreshCw className="size-8 animate-spin mx-auto mb-3 text-brand-gold" />
                <p className="text-xs font-semibold">
                  {t('loadingEmployeePlanStats') || 'Loading employee plan analytics & history...'}
                </p>
              </div>
            ) : !data ? (
              <div className="p-12 text-center text-muted-foreground">
                <Target className="size-10 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-xs">
                  {t('noPerformanceRecords') || 'No performance records found for this employee.'}
                </p>
              </div>
            ) : (
              <>
                {/* Lifetime Totals Grid */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Trophy className="size-4 text-brand-gold" />
                    {t('planLifetimeTotals')}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-muted/40 border border-border">
                      <span className="text-[11px] text-muted-foreground block font-medium">
                        {t('plansAchieved') || 'Plans Achieved'}
                      </span>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <strong className="text-base font-black text-foreground">
                          {totals?.plans_completed || 0}
                        </strong>
                        <span className="text-xs text-muted-foreground">
                          / {totals?.total_plans_set || 0}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-500 font-bold block mt-0.5">
                        {totals?.total_plans_set
                          ? Math.round(
                              ((totals.plans_completed || 0) / totals.total_plans_set) * 100
                            )
                          : 0}
                        %
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-muted/40 border border-border">
                      <span className="text-[11px] text-muted-foreground block font-medium">
                        {t('planLifetimeLtl') || 'Lifetime LTL Volume'}
                      </span>
                      <strong className="text-base font-black text-brand-gold mt-1 block">
                        {(totals?.total_ltl_volume_achieved || 0).toLocaleString()} m³
                      </strong>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        {t('deliveredVolume') || 'Delivered volume'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-muted/40 border border-border">
                      <span className="text-[11px] text-muted-foreground block font-medium">
                        {t('planLifetimeFtl') || 'Lifetime FTL Sales'}
                      </span>
                      <strong className="text-base font-black text-emerald-500 mt-1 block">
                        {formatMoney(
                          totals?.total_ftl_sales_achieved || 0,
                          totals?.currency || 'USD'
                        )}
                      </strong>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        {t('totalSalesValue') || 'Total sales value'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-muted/40 border border-border">
                      <span className="text-[11px] text-muted-foreground block font-medium">
                        {t('planTotalCargos')}
                      </span>
                      <strong className="text-base font-black text-foreground mt-1 block">
                        {totals?.total_cargos_registered || 0}
                      </strong>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        LTL & FTL
                      </span>
                    </div>
                  </div>
                </div>

                {/* Current Active Plan for Month */}
                {currentPlan ? (
                  <div className="p-5 rounded-2xl bg-surface border border-brand-gold/30 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                      <div>
                        <span className="text-[11px] font-bold text-brand-gold uppercase tracking-wider">
                          {t('activeTargetPlan') || 'Active Target Plan'} (
                          {currentPlan.period || month})
                        </span>
                        <h4 className="text-base font-extrabold text-foreground mt-0.5">
                          {t('planDualDirection')}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-muted-foreground block">
                            {t('planOverallCompletion')}
                          </span>
                          <strong className="text-base font-black text-brand-gold">
                            {currentPlan.overall_completion_percentage}%
                          </strong>
                        </div>
                        {getStatusBadge(
                          currentPlan.is_completed,
                          currentPlan.overall_completion_percentage
                        )}
                      </div>
                    </div>

                    {/* Dual Directions Split */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Direction 1: LTL */}
                      <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Package className="size-4 text-brand-gold" />
                            {t('planLtlVolume')}
                          </span>
                          <span className="text-xs font-extrabold text-foreground">
                            {currentPlan.ltl_plan?.completion_percentage || 0}%
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2 rounded-lg bg-surface border border-border">
                            <span className="text-[10px] text-muted-foreground block">
                              {t('target') || 'Target'}
                            </span>
                            <strong className="text-foreground text-xs font-bold">
                              {currentPlan.ltl_plan?.target_volume || 0} m³
                            </strong>
                          </div>
                          <div className="p-2 rounded-lg bg-surface border border-border">
                            <span className="text-[10px] text-muted-foreground block">
                              {t('fact') || 'Fact'}
                            </span>
                            <strong className="text-brand-gold text-xs font-bold">
                              {currentPlan.ltl_plan?.actual_volume || 0} m³
                            </strong>
                          </div>
                          <div className="p-2 rounded-lg bg-surface border border-border">
                            <span className="text-[10px] text-muted-foreground block">
                              {t('remaining') || 'Remaining'}
                            </span>
                            <strong className="text-rose-500 text-xs font-bold">
                              {currentPlan.ltl_plan?.remaining_volume || 0} m³
                            </strong>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-gold transition-all duration-500"
                            style={{
                              width: `${Math.min(100, currentPlan.ltl_plan?.completion_percentage || 0)}%`,
                            }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1">
                          <span>{t('registeredLtlCargos') || 'Registered LTL Cargos'}:</span>
                          <strong className="text-foreground">
                            {currentPlan.ltl_plan?.cargo_count || 0}
                          </strong>
                        </div>
                      </div>

                      {/* Direction 2: FTL */}
                      <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Truck className="size-4 text-emerald-500" />
                            {t('planFtlFinancial')} ({currentPlan.currency || 'USD'})
                          </span>
                          <span className="text-xs font-extrabold text-foreground">
                            {currentPlan.ftl_plan?.completion_percentage || 0}%
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2 rounded-lg bg-surface border border-border">
                            <span className="text-[10px] text-muted-foreground block">
                              {t('target') || 'Target'}
                            </span>
                            <strong className="text-foreground text-xs font-bold">
                              {formatMoney(
                                currentPlan.ftl_plan?.target_amount || 0,
                                currentPlan.currency || 'USD'
                              )}
                            </strong>
                          </div>
                          <div className="p-2 rounded-lg bg-surface border border-border">
                            <span className="text-[10px] text-muted-foreground block">
                              {t('fact') || 'Fact'}
                            </span>
                            <strong className="text-emerald-500 text-xs font-bold">
                              {formatMoney(
                                currentPlan.ftl_plan?.actual_amount || 0,
                                currentPlan.currency || 'USD'
                              )}
                            </strong>
                          </div>
                          <div className="p-2 rounded-lg bg-surface border border-border">
                            <span className="text-[10px] text-muted-foreground block">
                              {t('remaining') || 'Remaining'}
                            </span>
                            <strong className="text-rose-500 text-xs font-bold">
                              {formatMoney(
                                currentPlan.ftl_plan?.remaining_amount || 0,
                                currentPlan.currency || 'USD'
                              )}
                            </strong>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{
                              width: `${Math.min(100, currentPlan.ftl_plan?.completion_percentage || 0)}%`,
                            }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1">
                          <span>{t('registeredFtlCargos') || 'Registered FTL Cargos'}:</span>
                          <strong className="text-foreground">
                            {currentPlan.ftl_plan?.cargo_count || 0}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-muted/30 border border-border text-center text-xs text-muted-foreground">
                    {t('noActivePlanSet', { month }) ||
                      `No active target plan set for month ${month}.`}
                  </div>
                )}

                {/* Monthly History Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="size-4 text-brand-gold" />
                    {t('planHistory')} ({history.length})
                  </h4>

                  {history.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground border border-border rounded-xl bg-muted/10">
                      {t('noHistoricalPlans') || 'No historical plans recorded.'}
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-border">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
                          <tr>
                            <th className="py-3 px-3.5">{t('colMonth') || 'Month'}</th>
                            <th className="py-3 px-3.5">{t('planLtlVolume')}</th>
                            <th className="py-3 px-3.5">{t('planFtlFinancial')}</th>
                            <th className="py-3 px-3.5 text-center">{t('planTotalCargos')}</th>
                            <th className="py-3 px-3.5 text-center">{t('completionPercentage')}</th>
                            <th className="py-3 px-3.5 text-right">{t('colStatus') || 'Status'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border font-medium">
                          {history.map((h, idx) => (
                            <tr key={h.id || idx} className="hover:bg-muted/30 transition-colors">
                              <td className="py-3 px-3.5 font-bold text-foreground">
                                {h.period || h.month || '—'}
                              </td>
                              <td className="py-3 px-3.5 text-foreground">
                                <span className="font-bold text-brand-gold">
                                  {h.ltl_plan?.actual_volume ?? h.ltl_actual_volume ?? 0}
                                </span>{' '}
                                / {h.ltl_plan?.target_volume ?? h.ltl_target_volume ?? 0} m³
                              </td>
                              <td className="py-3 px-3.5 text-foreground">
                                <span className="font-bold text-emerald-500">
                                  {formatMoney(
                                    h.ftl_plan?.actual_amount ?? h.ftl_actual_amount ?? 0,
                                    h.currency || 'USD'
                                  )}
                                </span>{' '}
                                /{' '}
                                {formatMoney(
                                  h.ftl_plan?.target_amount ?? h.ftl_target_amount ?? 0,
                                  h.currency || 'USD'
                                )}
                              </td>
                              <td className="py-3 px-3.5 text-center font-bold text-foreground">
                                {h.total_cargos_count || 0}
                              </td>
                              <td className="py-3 px-3.5 text-center">
                                <span className="font-extrabold text-foreground">
                                  {h.overall_completion_percentage}%
                                </span>
                              </td>
                              <td className="py-3 px-3.5 text-right">
                                {getStatusBadge(h.is_completed, h.overall_completion_percentage)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-muted/20 border-t border-border flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-surface border border-border hover:bg-muted text-foreground transition-all cursor-pointer"
            >
              {t('actionClose') || 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
