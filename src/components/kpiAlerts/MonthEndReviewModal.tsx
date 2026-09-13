import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Users,
  CheckCircle,
  EyeOff,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { T } from '../T';
import type {
  KpiAlertPopupResponse,
  KpiAlertSuggestion,
  DecisionAction,
} from '../../types/kpiAlerts';
import {
  localeCodeMap,
  formatYearMonth,
  formatCareerLevel,
  formatDeptName,
} from './kpiAlertHelpers';

interface MonthEndReviewModalProps {
  isOpen: boolean;
  popupData: KpiAlertPopupResponse | null;
  onClose: () => void;
  onDecide: (suggestion: KpiAlertSuggestion, action: DecisionAction) => void;
  onDismiss: (alertId: string) => Promise<void>;
  onNavigateToFullPage: () => void;
}

export function MonthEndReviewModal({
  isOpen,
  popupData,
  onClose,
  onDecide,
  onDismiss,
  onNavigateToFullPage,
}: MonthEndReviewModalProps) {
  const { t, locale } = useTranslation();
  const localeCode = localeCodeMap[locale] || 'en-US';
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  if (!isOpen || !popupData) return null;

  const suggestions = popupData.suggestions || [];
  const period = popupData.period;
  const summary = popupData.summary;

  const handleDismiss = async (alertId: string) => {
    setDismissingId(alertId);
    try {
      await onDismiss(alertId);
    } finally {
      setDismissingId(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-surface dark:bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header with Month & Countdown */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-brand-navy via-brand-royal to-brand-navy border-b border-brand-gold/30 text-white shrink-0 overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-brand-gold/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-brand-gold/20 text-brand-gold border border-brand-gold/40 shadow-inner">
                  <Sparkles className="size-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                      <T k="kpiAlertPopupTitle" />
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-brand-gold text-brand-navy tracking-wider">
                      {formatYearMonth(popupData.month, locale)}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    {period
                      ? t('kpiAlertPopupSubtitleCountdown', {
                          current: period.current_day,
                          total: period.total_days,
                          remaining: period.days_remaining,
                        })
                      : t('kpiAlertPopupSubtitleDefault')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onNavigateToFullPage}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer border border-white/20"
                >
                  <span>
                    <T k="kpiAlertOpenFullDashboard" />
                  </span>
                  <ChevronRight className="size-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Quick stats pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-white/10 text-xs">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <Users className="size-4 text-brand-gold shrink-0" />
                <div>
                  <div className="text-[10px] text-neutral-300 font-semibold uppercase">
                    <T k="kpiAlertStatEmployees" />
                  </div>
                  <div className="font-bold text-white">{summary?.total_employees ?? 0}</div>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <DollarSign className="size-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-neutral-300 font-semibold uppercase">
                    <T k="kpiAlertStatBonusPool" />
                  </div>
                  <div className="font-bold text-white">
                    ${summary?.total_kpi_bonus?.toLocaleString(localeCode) ?? 0}
                  </div>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <ArrowUpRight className="size-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-neutral-300 font-semibold uppercase">
                    <T k="kpiAlertPromotions" />
                  </div>
                  <div className="font-bold text-white">{summary?.promotions_count ?? 0}</div>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <ArrowDownRight className="size-4 text-rose-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-neutral-300 font-semibold uppercase">
                    <T k="kpiAlertDemotions" />
                  </div>
                  <div className="font-bold text-white">{summary?.demotions_count ?? 0}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Suggestions List Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span>{t('kpiAlertPendingRecsCount', { count: suggestions.length })}</span>
              </h4>
              <span className="text-[11px] text-brand-gold font-semibold">
                <T k="kpiAlertCeoApprovalRequired" />
              </span>
            </div>

            {suggestions.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-muted/20 border border-border/60">
                <CheckCircle className="size-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <h5 className="text-sm font-bold text-foreground">
                  <T k="kpiAlertNoPending" />
                </h5>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  <T k="kpiAlertAllProcessed" />
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((s) => {
                  const isPromotion = s.decision_type === 'PROMOTION';
                  const isDemotion = s.decision_type === 'DEMOTION';

                  return (
                    <div
                      key={s.alert_id}
                      className="p-4 rounded-2xl border border-border bg-surface hover:border-brand-gold/40 transition-all shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2.5 rounded-xl shrink-0 ${
                              isPromotion
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : 'bg-rose-500/15 text-rose-500'
                            }`}
                          >
                            {isPromotion ? (
                              <ArrowUpRight className="size-5" />
                            ) : (
                              <ArrowDownRight className="size-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-foreground">
                                {s.employee_name}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                  isPromotion
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {isPromotion
                                  ? t('kpiAlertBadgePromotion')
                                  : t('kpiAlertBadgeDemotion')}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDeptName(s.department_name, t)} • {s.phone}
                            </div>
                          </div>
                        </div>

                        {/* Rank & Salary Transition Pill */}
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-background border border-border text-xs">
                          <div className="font-bold text-muted-foreground">
                            {formatCareerLevel(s.current_level, t)} ($
                            {s.current_salary.toLocaleString(localeCode)})
                          </div>
                          <span className="text-brand-gold font-bold">➜</span>
                          <div
                            className={`font-black ${
                              isPromotion
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {formatCareerLevel(s.suggested_level, t)} ($
                            {s.suggested_salary.toLocaleString(localeCode)})
                          </div>
                        </div>
                      </div>

                      {/* Performance row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/50 text-xs">
                        <div>
                          <span className="text-muted-foreground">
                            <T k="kpiAlertSalesLabel" />:{' '}
                          </span>
                          <span className="font-bold text-foreground">
                            ${s.metrics.total_sales.toLocaleString(localeCode)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            <T k="kpiAlertDealsLabel" />:{' '}
                          </span>
                          <span className="font-bold text-foreground">
                            {s.metrics.deal_count.toLocaleString(localeCode)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            <T k="kpiAlertConsecutiveLabel" />:{' '}
                          </span>
                          <span className="font-bold text-foreground">
                            {isPromotion
                              ? t('kpiAlertSuccessesCount', { count: s.consecutive_successes })
                              : t('kpiAlertFailuresCount', { count: s.consecutive_failures })}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            <T k="kpiAlertBonusEarned" />:{' '}
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            ${s.metrics.sales_bonus_amount.toLocaleString(localeCode)}
                          </span>
                        </div>
                      </div>

                      {/* CEO Quick Actions */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                        <button
                          onClick={() => handleDismiss(s.alert_id)}
                          disabled={dismissingId === s.alert_id}
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          <EyeOff className="size-3.5" />
                          <span>{t('kpiAlertDismiss')}</span>
                        </button>

                        <div className="flex items-center gap-2">
                          {isDemotion && (
                            <button
                              onClick={() => onDecide(s, 'MAINTAIN')}
                              className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted/40 transition-all cursor-pointer"
                            >
                              <T k="kpiAlertMaintain" />
                            </button>
                          )}
                          <button
                            onClick={() => onDecide(s, 'REJECT')}
                            className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                          >
                            <T k="kpiAlertReject" />
                          </button>
                          <button
                            onClick={() => onDecide(s, 'APPROVE')}
                            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:opacity-90 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle className="size-3.5" />
                            <span>
                              {isPromotion
                                ? t('kpiAlertApprovePromotion')
                                : t('kpiAlertApproveDemotion')}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-muted/20 border-t border-border flex items-center justify-between shrink-0">
            <button
              onClick={onNavigateToFullPage}
              className="text-xs font-bold text-brand-gold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>
                <T k="kpiAlertViewAllEvaluations" />
              </span>
              <ChevronRight className="size-4" />
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-background border border-border text-xs font-bold text-foreground hover:bg-muted/30 transition-all cursor-pointer"
            >
              <T k="actionClose" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
