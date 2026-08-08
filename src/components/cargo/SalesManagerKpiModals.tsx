import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calculator,
  CheckCircle,
  AlertTriangle,
  Award,
  ShieldAlert,
  ArrowDownRight,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { T } from '../T';
import type {
  SalesManagerEvaluation,
  CareerLevel,
  DemotionReviewAction,
} from '../../types/salesManagerKpi';
import { EmployeeSelect } from './EmployeeSelect';

// ---------------------------------------------------------------------------
// 1. Calculate Monthly Evaluations Modal
// ---------------------------------------------------------------------------
interface CalculateEvaluationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { month: string; employee_id?: string; additional_bonus_amount?: number }) => Promise<void>;
  currentMonth: string;
}

export function CalculateEvaluationsModal({
  isOpen,
  onClose,
  onConfirm,
  currentMonth,
}: CalculateEvaluationsModalProps) {
  const { t } = useTranslation();
  const [month, setMonth] = useState<string>(currentMonth);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [addBonusStr, setAddBonusStr] = useState<string>('0');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm({
        month,
        employee_id: employeeId || undefined,
        additional_bonus_amount: parseFloat(addBonusStr) || 0,
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-surface dark:bg-surface border border-border rounded-2xl p-6 shadow-2xl space-y-6"
        >
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                <Calculator className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  <T k="smkCalcEvaluationsModalTitle" />
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <T k="smkCalcEvaluationsDesc" />
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
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                Evaluation Month
              </label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                Sales Manager (Optional)
              </label>
              <EmployeeSelect
                value={employeeId}
                onChange={setEmployeeId}
                placeholder="All Sales Managers (Batch calculation)"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                Additional Manual Bonus ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={addBonusStr}
                onChange={(e) => setAddBonusStr(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:border-brand-gold"
                placeholder="0.00"
              />
            </div>

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
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-navy to-brand-royal hover:opacity-90 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Calculator className="size-4" />
                <span>{submitting ? t('actionSaving') : t('smkCalcEvaluations')}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// 2. Approve SR Check Exception Modal
// ---------------------------------------------------------------------------
interface ApproveSrCheckModalProps {
  isOpen: boolean;
  evaluation: SalesManagerEvaluation | null;
  onClose: () => void;
  onConfirm: (evaluationId: string, notes: string) => Promise<void>;
}

export function ApproveSrCheckModal({
  isOpen,
  evaluation,
  onClose,
  onConfirm,
}: ApproveSrCheckModalProps) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen || !evaluation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm(evaluation.id, notes);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-surface dark:bg-surface border border-border rounded-2xl p-6 shadow-2xl space-y-6"
        >
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  <T k="smkApproveSrCheckModalTitle" />
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {evaluation.employee_name || 'Sales Manager'} ({evaluation.month})
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

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2 text-foreground">
            <p className="font-semibold text-amber-600 dark:text-amber-400">
              <T k="smkApproveSrCheckModalDesc" />
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-500/20 text-muted-foreground">
              <div>Sales Total: <strong className="text-foreground">${evaluation.total_sales}</strong></div>
              <div>Avg Check: <strong className="text-amber-500">${evaluation.average_check}</strong> (Min: ${evaluation.sr_check_min})</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                <T k="smkReviewNotesLabel" />
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:border-amber-500"
                placeholder={t('smkReviewNotesPlaceholder') || 'Approved by CEO after reviewing deal structure...'}
              />
            </div>

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
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle className="size-4" />
                <span>{submitting ? t('actionSaving') : t('smkApproveSrCheck')}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// 3. Review Demotion Escalation Modal
// ---------------------------------------------------------------------------
interface ReviewDemotionModalProps {
  isOpen: boolean;
  evaluation: SalesManagerEvaluation | null;
  onClose: () => void;
  onConfirm: (evaluationId: string, action: DemotionReviewAction, notes: string) => Promise<void>;
}

export function ReviewDemotionModal({
  isOpen,
  evaluation,
  onClose,
  onConfirm,
}: ReviewDemotionModalProps) {
  const { t } = useTranslation();
  const [action, setAction] = useState<DemotionReviewAction>('MAINTAIN_LEVEL');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen || !evaluation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm(evaluation.id, action, notes);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-surface dark:bg-surface border border-border rounded-2xl p-6 shadow-2xl space-y-6"
        >
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-500 border border-rose-500/30">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  <T k="smkReviewDemotionModalTitle" />
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {evaluation.employee_name || 'Sales Manager'} ({evaluation.career_level})
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

          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-2 text-foreground">
            <p className="font-semibold text-rose-600 dark:text-rose-400">
              <T k="smkReviewDemotionModalDesc" />
            </p>
            <div className="flex items-center gap-3 pt-2 text-muted-foreground">
              <div>Consecutive Missed Months: <strong className="text-rose-500">{evaluation.consecutive_failures}</strong></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Review Decision Action
              </label>
              
              <label
                onClick={() => setAction('MAINTAIN_LEVEL')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  action === 'MAINTAIN_LEVEL'
                    ? 'bg-blue-500/15 border-blue-500 text-blue-500 shadow-sm'
                    : 'border-border text-foreground hover:bg-muted/30'
                }`}
              >
                <input
                  type="radio"
                  name="demotion_action"
                  checked={action === 'MAINTAIN_LEVEL'}
                  onChange={() => setAction('MAINTAIN_LEVEL')}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <ShieldCheck className="size-4" />
                    <T k="smkActionMaintainLevel" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Employee retains their current rank level ({evaluation.career_level}).
                  </p>
                </div>
              </label>

              <label
                onClick={() => setAction('APPROVE_DEMOTION')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  action === 'APPROVE_DEMOTION'
                    ? 'bg-rose-500/15 border-rose-500 text-rose-500 shadow-sm'
                    : 'border-border text-foreground hover:bg-muted/30'
                }`}
              >
                <input
                  type="radio"
                  name="demotion_action"
                  checked={action === 'APPROVE_DEMOTION'}
                  onChange={() => setAction('APPROVE_DEMOTION')}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <ArrowDownRight className="size-4" />
                    <T k="smkActionApproveDemotion" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Employee is demoted to lower career rank and counters reset.
                  </p>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                <T k="smkReviewNotesLabel" />
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:border-brand-gold"
                placeholder={t('smkReviewNotesPlaceholder') || 'Enter justification notes...'}
              />
            </div>

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
                  action === 'APPROVE_DEMOTION' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                <CheckCircle className="size-4" />
                <span>{submitting ? t('actionSaving') : t('actionConfirm')}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// 4. Update Employee Career Level & Mentees Count Modal
// ---------------------------------------------------------------------------
interface UpdateEmployeeLevelModalProps {
  isOpen: boolean;
  employeeId: string;
  employeeName?: string;
  currentLevel?: CareerLevel;
  currentMentees?: number;
  onClose: () => void;
  onConfirm: (employeeId: string, data: { career_level: CareerLevel; mentees_count: number }) => Promise<void>;
}

export function UpdateEmployeeLevelModal({
  isOpen,
  employeeId,
  employeeName,
  currentLevel = 'JUNIOR',
  currentMentees = 0,
  onClose,
  onConfirm,
}: UpdateEmployeeLevelModalProps) {
  const { t } = useTranslation();
  const [level, setLevel] = useState<CareerLevel>(currentLevel);
  const [mentees, setMentees] = useState<number>(currentMentees);
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm(employeeId, {
        career_level: level,
        mentees_count: Number(mentees),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const levels: CareerLevel[] = ['JUNIOR', 'MID', 'SENIOR', 'EXPERT'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-surface dark:bg-surface border border-border rounded-2xl p-6 shadow-2xl space-y-6"
        >
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                <Award className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  <T k="smkUpdateLevelModalTitle" />
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {employeeName || 'Sales Manager'}
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
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                <T k="smkSelectCareerLevel" />
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as CareerLevel)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:border-brand-gold"
              >
                {levels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                <T k="smkMenteesCountLabel" />
              </label>
              <input
                type="number"
                min="0"
                value={mentees}
                onChange={(e) => setMentees(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:border-brand-gold"
              />
            </div>

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
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-navy to-brand-royal hover:opacity-90 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle className="size-4" />
                <span>{submitting ? t('actionSaving') : t('actionSave')}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
