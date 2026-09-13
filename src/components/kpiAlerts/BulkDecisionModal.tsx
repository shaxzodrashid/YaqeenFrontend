import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, Layers, FileText } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { T } from '../T';
import type { KpiAlertSuggestion, BulkKpiDecisionDto, DecisionAction } from '../../types/kpiAlerts';
import { localeCodeMap, formatCareerLevel, formatDeptName } from './kpiAlertHelpers';

interface BulkDecisionModalProps {
  isOpen: boolean;
  selectedSuggestions: KpiAlertSuggestion[];
  currentMonth: string;
  onClose: () => void;
  onConfirm: (dto: BulkKpiDecisionDto) => Promise<void>;
}

export function BulkDecisionModal({
  isOpen,
  selectedSuggestions,
  currentMonth,
  onClose,
  onConfirm,
}: BulkDecisionModalProps) {
  const { t, locale } = useTranslation();
  const localeCode = localeCodeMap[locale] || 'en-US';
  const [defaultAction, setDefaultAction] = useState<DecisionAction>('APPROVE');
  const [updateSalaries, setUpdateSalaries] = useState<boolean>(true);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setReviewNotes(t('kpiAlertBulkDefaultNotes'));
    }
  }, [isOpen, t]);

  if (!isOpen || selectedSuggestions.length === 0) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const decisions = selectedSuggestions.map((s) => ({
        evaluation_id: s.evaluation_id,
        alert_id: s.alert_id,
        decision_type: s.decision_type,
        action: defaultAction,
        update_salary: updateSalaries,
        new_salary: updateSalaries ? s.suggested_salary : undefined,
        review_notes: reviewNotes.trim() || undefined,
      }));

      await onConfirm({
        month: currentMonth,
        update_salaries: updateSalaries,
        decisions,
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
          className="w-full max-w-lg bg-surface dark:bg-surface border border-border rounded-2xl p-6 shadow-2xl space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                <Layers className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  <T k="kpiAlertBulkDecisionTitle" />
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('kpiAlertBulkSubtitle', { count: selectedSuggestions.length })}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selected items list */}
            <div className="max-h-48 overflow-y-auto space-y-2 p-2 rounded-xl bg-background border border-border">
              {selectedSuggestions.map((s) => (
                <div
                  key={s.alert_id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-border/60 text-xs"
                >
                  <div>
                    <div className="font-bold text-foreground">{s.employee_name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {formatDeptName(s.department_name, t)} •{' '}
                      {formatCareerLevel(s.current_level, t)} ➜{' '}
                      {formatCareerLevel(s.suggested_level, t)} ($
                      {s.current_salary.toLocaleString(localeCode)} ➜ $
                      {s.suggested_salary.toLocaleString(localeCode)})
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      s.decision_type === 'PROMOTION'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {s.decision_type === 'PROMOTION'
                      ? t('kpiAlertBadgePromotion')
                      : t('kpiAlertBadgeDemotion')}
                  </span>
                </div>
              ))}
            </div>

            {/* Action selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <T k="kpiAlertBatchAction" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDefaultAction('APPROVE')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    defaultAction === 'APPROVE'
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <CheckCircle2 className="size-4" />
                  <span>{t('kpiAlertBulkApproveAll') || 'Approve All Selected'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDefaultAction('MAINTAIN')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    defaultAction === 'MAINTAIN'
                      ? 'bg-brand-navy text-white border-brand-navy shadow-sm'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <AlertTriangle className="size-4" />
                  <span>{t('kpiAlertBulkMaintainAll') || 'Maintain / Hold All'}</span>
                </button>
              </div>
            </div>

            {/* Salary update checkbox */}
            <div className="p-3.5 rounded-xl bg-background border border-border">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={updateSalaries}
                  onChange={(e) => setUpdateSalaries(e.target.checked)}
                  className="rounded text-brand-gold focus:ring-brand-gold size-4 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold text-foreground">
                    <T k="kpiAlertBulkApplySalaries" />
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    <T k="kpiAlertBulkApplySalariesDesc" />
                  </div>
                </div>
              </label>
            </div>

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
                rows={2}
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
                className="px-5 py-2.5 rounded-xl bg-brand-gold text-brand-navy hover:bg-brand-gold/90 text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>
                  {submitting
                    ? t('actionSaving') || 'Executing...'
                    : t('kpiAlertExecuteBulk') || 'Execute Batch Decisions'}
                </span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
