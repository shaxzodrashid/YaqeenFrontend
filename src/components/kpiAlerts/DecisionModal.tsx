import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { T } from '../T';
import type { KpiAlertSuggestion, DecisionAction, KpiDecisionDto } from '../../types/kpiAlerts';
import { NumberInput } from '../NumberInput';
import { localeCodeMap, formatCareerLevel, formatDeptName } from './kpiAlertHelpers';

interface DecisionModalProps {
  isOpen: boolean;
  suggestion: KpiAlertSuggestion | null;
  defaultAction?: DecisionAction;
  onClose: () => void;
  onConfirm: (dto: KpiDecisionDto) => Promise<void>;
}

export function DecisionModal({
  isOpen,
  suggestion,
  defaultAction = 'APPROVE',
  onClose,
  onConfirm,
}: DecisionModalProps) {
  const { t, locale } = useTranslation();
  const localeCode = localeCodeMap[locale] || 'en-US';
  const [action, setAction] = useState<DecisionAction>(defaultAction);
  const [updateSalary, setUpdateSalary] = useState<boolean>(true);
  const [newSalaryStr, setNewSalaryStr] = useState<string>('');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (suggestion) {
      setAction(defaultAction);
      setUpdateSalary(true);
      setNewSalaryStr(suggestion.suggested_salary?.toString() || '');
      const typeStr =
        suggestion.decision_type === 'PROMOTION'
          ? t('kpiAlertBadgePromotion')
          : t('kpiAlertBadgeDemotion');
      setReviewNotes(
        defaultAction === 'APPROVE'
          ? t('kpiAlertNotesApproved', { type: typeStr })
          : defaultAction === 'MAINTAIN'
            ? t('kpiAlertNotesMaintained')
            : t('kpiAlertNotesRejected', { type: typeStr })
      );
    }
  }, [suggestion, defaultAction, t]);

  if (!isOpen || !suggestion) return null;

  const isPromotion = suggestion.decision_type === 'PROMOTION';
  const isDemotion = suggestion.decision_type === 'DEMOTION';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const parsedSalary = parseFloat(newSalaryStr);
      await onConfirm({
        alert_id: suggestion.alert_id,
        evaluation_id: suggestion.evaluation_id,
        decision_type: suggestion.decision_type,
        action,
        update_salary: updateSalary,
        new_salary: !isNaN(parsedSalary) && updateSalary ? parsedSalary : undefined,
        review_notes: reviewNotes.trim() || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-surface dark:bg-surface border border-border rounded-2xl p-6 shadow-2xl space-y-6 overflow-hidden relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-xl border ${
                  isPromotion
                    ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                    : isDemotion
                      ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                      : 'bg-brand-gold/15 text-brand-gold border-brand-gold/30'
                }`}
              >
                {isPromotion ? (
                  <ArrowUpRight className="size-6" />
                ) : isDemotion ? (
                  <ArrowDownRight className="size-6" />
                ) : (
                  <Award className="size-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>
                    {isPromotion
                      ? t('kpiAlertModalTitlePromotion') || 'Executive Promotion Review'
                      : isDemotion
                        ? t('kpiAlertModalTitleDemotion') || 'Executive Demotion Review'
                        : t('kpiAlertModalTitleReview') || 'Executive Decision Review'}
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {suggestion.employee_name} • {formatDeptName(suggestion.department_name, t)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Career & Salary Transition Visual Summary */}
            <div className="p-4 rounded-xl bg-muted/40 dark:bg-muted/20 border border-border/70 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <T k="kpiAlertProposedTransition" />
              </div>
              <div className="flex items-center justify-between gap-4">
                {/* Current */}
                <div className="flex-1 p-3 rounded-lg bg-background border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">
                    <T k="kpiAlertCurrent" />
                  </div>
                  <div className="text-sm font-black text-foreground mt-0.5">
                    {formatCareerLevel(suggestion.current_level, t)}
                  </div>
                  <div className="text-xs text-muted-foreground font-semibold">
                    ${suggestion.current_salary.toLocaleString(localeCode)} {t('kpiAlertPerMonth')}
                  </div>
                </div>

                <div className="text-brand-gold font-black text-lg">➜</div>

                {/* Proposed */}
                <div
                  className={`flex-1 p-3 rounded-lg border ${
                    isPromotion
                      ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/5 border-rose-500/30 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold opacity-80">
                    <T k="kpiAlertProposed" />
                  </div>
                  <div className="text-sm font-black mt-0.5">
                    {formatCareerLevel(suggestion.suggested_level, t)}
                  </div>
                  <div className="text-xs font-bold">
                    ${suggestion.suggested_salary.toLocaleString(localeCode)}{' '}
                    {t('kpiAlertPerMonth')}
                  </div>
                </div>
              </div>

              {/* Performance highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-border/50 text-[11px]">
                <div>
                  <span className="text-muted-foreground">
                    <T k="kpiAlertSalesLabel" />:{' '}
                  </span>
                  <span className="font-bold text-foreground">
                    ${suggestion.metrics.total_sales.toLocaleString(localeCode)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    <T k="kpiAlertDealsLabel" />:{' '}
                  </span>
                  <span className="font-bold text-foreground">
                    {suggestion.metrics.deal_count.toLocaleString(localeCode)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    <T k="kpiAlertAvgCheckLabel" />:{' '}
                  </span>
                  <span className="font-bold text-foreground">
                    ${Math.round(suggestion.metrics.average_check).toLocaleString(localeCode)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <T k="kpiAlertDecisionAction" />
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAction('APPROVE')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    action === 'APPROVE'
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-md'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>{t('kpiAlertApprove') || 'Approve'}</span>
                </button>

                {isDemotion ? (
                  <button
                    type="button"
                    onClick={() => setAction('MAINTAIN')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      action === 'MAINTAIN'
                        ? 'bg-brand-navy text-white border-brand-navy shadow-md'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <HelpCircle className="size-3.5" />
                    <span>{t('kpiAlertMaintain') || 'Maintain'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAction('REJECT')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      action === 'REJECT'
                        ? 'bg-rose-500 text-white border-rose-600 shadow-md'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <AlertTriangle className="size-3.5" />
                    <span>{t('kpiAlertReject') || 'Reject'}</span>
                  </button>
                )}

                {isDemotion && (
                  <button
                    type="button"
                    onClick={() => setAction('REJECT')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      action === 'REJECT'
                        ? 'bg-rose-500 text-white border-rose-600 shadow-md'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <AlertTriangle className="size-3.5" />
                    <span>{t('kpiAlertReject') || 'Reject'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Salary Update Options (Only applicable if approving or adjusting) */}
            {action === 'APPROVE' && (
              <div className="p-4 rounded-xl bg-background border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={updateSalary}
                      onChange={(e) => setUpdateSalary(e.target.checked)}
                      className="rounded text-brand-gold focus:ring-brand-gold size-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-foreground">
                      <T k="kpiAlertUpdateFixedSalary" />
                    </span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    {t('kpiAlertStandardBase', {
                      salary: suggestion.suggested_salary.toLocaleString(localeCode),
                    })}
                  </span>
                </div>

                {updateSalary && (
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">
                      <T k="kpiAlertCustomSalaryOverride" />
                    </label>
                    <NumberInput
                      size="md"
                      allowDecimals={true}
                      decimalScale={2}
                      min={0}
                      value={newSalaryStr}
                      onValueChange={(_num, raw) => setNewSalaryStr(raw)}
                      placeholder={suggestion.suggested_salary.toString()}
                      prefix="$"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {t('kpiAlertSalaryHelpText') ||
                        'If omitted or unchanged, standard base salary for the target career level will be recorded.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Review Notes */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="size-3.5" />
                <span>
                  <T k="kpiAlertReviewNotes" />
                </span>
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                placeholder={
                  t('kpiAlertReviewNotesPlaceholder') || 'Enter CEO rationale or audit notes...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-brand-gold resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted/30 transition-all cursor-pointer"
              >
                <T k="actionCancel" />
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                  action === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : action === 'MAINTAIN'
                      ? 'bg-brand-navy hover:opacity-90'
                      : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <span>
                  {submitting
                    ? t('actionSaving') || 'Processing...'
                    : t('kpiAlertExecuteDecision') || 'Confirm & Apply Decision'}
                </span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
