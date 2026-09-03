import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calculator,
  CheckCircle,
  AlertTriangle,
  Award,
  ArrowDownRight,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Calendar,
  Layers,
  FileCheck,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { T } from '../T';
import type {
  SalesManagerEvaluation,
  CareerLevel,
  DemotionReviewAction,
  CargoMonitoringItem,
} from '../../types/salesManagerKpi';
import { EmployeeSelect } from './EmployeeSelect';
import { NumberInput } from '../NumberInput';
import { Select } from '../Select';

// ---------------------------------------------------------------------------
// 1. Calculate Monthly Evaluations Modal
// ---------------------------------------------------------------------------
interface CalculateEvaluationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    month: string;
    employee_id?: string;
    additional_bonus_amount?: number;
    level?: string;
  }) => Promise<void>;
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
  const [levelOverride, setLevelOverride] = useState<string>('');
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
        level: levelOverride || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const levelOptions = [
    { value: '', label: t('smkLevelAuto') || 'Auto (From Employee Stored Profile)' },
    { value: 'Junior', label: 'Junior ($300 Fixed / $0 – $3,000 Plan)' },
    { value: 'Middle', label: 'Middle / Mid ($500 Fixed / $5,000 – $6,000 Plan)' },
    { value: 'Senior', label: 'Senior ($700 Fixed / $6,001 – $8,000 Plan)' },
    { value: 'Expert', label: 'Expert ($1,000 Fixed / $8,001 – $10,000 Plan)' },
  ];

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
                Career Level Override (Optional)
              </label>
              <Select
                value={levelOverride}
                onChange={(val) => setLevelOverride(val || '')}
                options={levelOptions}
                allowClear={false}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Forces calculation under specified career level plan and fixed salary matrix rules.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                Additional Manual Bonus ($)
              </label>
              <NumberInput
                size="md"
                allowDecimals={true}
                decimalScale={2}
                min={0}
                value={addBonusStr}
                onValueChange={(_num, raw) => setAddBonusStr(raw)}
                placeholder="0.00"
                prefix="$"
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
              <div>
                Sales Total: <strong className="text-foreground">${evaluation.total_sales}</strong>
              </div>
              <div>
                Avg Check: <strong className="text-amber-500">${evaluation.average_check}</strong>{' '}
                (Min: ${evaluation.sr_check_min})
              </div>
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
                placeholder={
                  t('smkReviewNotesPlaceholder') ||
                  'Approved by CEO after reviewing deal structure...'
                }
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
              <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                <ShieldCheck className="size-5" />
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

          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-2 text-foreground">
            <p className="font-semibold text-indigo-700 dark:text-indigo-300">
              <T k="smkReviewDemotionModalDesc" />
            </p>
            <div className="flex items-center gap-3 pt-2 text-muted-foreground">
              <div>
                Consecutive Missed Months:{' '}
                <strong className="text-indigo-600 dark:text-indigo-400">
                  {evaluation.consecutive_failures}
                </strong>
              </div>
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
                  action === 'APPROVE_DEMOTION'
                    ? 'bg-rose-500 hover:bg-rose-600'
                    : 'bg-blue-500 hover:bg-blue-600'
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
  onConfirm: (
    employeeId: string,
    data: { career_level: CareerLevel; mentees_count: number }
  ) => Promise<void>;
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
              <Select
                value={level}
                onChange={(val) => setLevel((val as CareerLevel) || 'JUNIOR')}
                allowClear={false}
                options={levels.map((lvl) => ({ value: lvl, label: lvl }))}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                <T k="smkMenteesCountLabel" />
              </label>
              <NumberInput
                size="md"
                allowDecimals={false}
                min={0}
                value={mentees}
                onValueChange={(num) => setMentees(num || 0)}
                placeholder="0"
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

// ---------------------------------------------------------------------------
// 5. Update Single Cargo Payment Status Modal
// ---------------------------------------------------------------------------
interface UpdateCargoPaymentModalProps {
  isOpen: boolean;
  cargo: CargoMonitoringItem | null;
  onClose: () => void;
  onConfirm: (
    cargoId: string,
    status: 'waiting' | 'unpaid' | 'paid',
    deadlineDays?: number
  ) => Promise<void>;
}

export function UpdateCargoPaymentModal({
  isOpen,
  cargo,
  onClose,
  onConfirm,
}: UpdateCargoPaymentModalProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'waiting' | 'unpaid' | 'paid'>(
    cargo?.payment_status || 'waiting'
  );
  const [deadlineDays, setDeadlineDays] = useState<number>(cargo?.payment_deadline_days || 15);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Sync state with cargo when modal opens
  React.useEffect(() => {
    if (cargo) {
      setStatus(cargo.payment_status || 'waiting');
      setDeadlineDays(cargo.payment_deadline_days || 15);
    }
  }, [cargo]);

  if (!isOpen || !cargo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm(cargo.id, status, deadlineDays);
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
                <CreditCard className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Update Cargo Payment Status</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Truck: <strong className="text-foreground">{cargo.container_truck_id}</strong> •
                  Client: {cargo.client_name}
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
                Client Payment Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('paid')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    status === 'paid'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'border-border text-muted-foreground hover:bg-muted/30'
                  }`}
                >
                  <CheckCircle2 className="size-4" />
                  <span>To'landi (Paid)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('waiting')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    status === 'waiting'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm'
                      : 'border-border text-muted-foreground hover:bg-muted/30'
                  }`}
                >
                  <Calendar className="size-4" />
                  <span>Kutilmoqda</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('unpaid')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    status === 'unpaid'
                      ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 shadow-sm'
                      : 'border-border text-muted-foreground hover:bg-muted/30'
                  }`}
                >
                  <AlertTriangle className="size-4" />
                  <span>Bermadi (Unpaid)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                Payment Deadline (Days)
              </label>
              <NumberInput
                size="md"
                allowDecimals={false}
                min={0}
                value={deadlineDays}
                onValueChange={(num) => setDeadlineDays(num || 0)}
                placeholder="15"
              />
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground space-y-1">
              <p>
                <strong>Profit:</strong> ${cargo.profit?.toLocaleString()} • <strong>Bonus:</strong>{' '}
                ${cargo.cargo_bonus_rounded || cargo.cargo_bonus} (
                {cargo.current_kpi_rate_percentage})
              </p>
              <p className="text-amber-600 dark:text-amber-400">
                Only cargos marked as <strong>Paid</strong> are registered as real company expense
                and realized employee earnings.
              </p>
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

// ---------------------------------------------------------------------------
// 6. Confirm Single Cargo KPI Bonus Receipt Modal
// ---------------------------------------------------------------------------
interface ConfirmCargoKpiModalProps {
  isOpen: boolean;
  cargo: CargoMonitoringItem | null;
  onClose: () => void;
  onConfirm: (cargoId: string, isReceived: boolean, notes?: string) => Promise<void>;
}

export function ConfirmCargoKpiModal({
  isOpen,
  cargo,
  onClose,
  onConfirm,
}: ConfirmCargoKpiModalProps) {
  const { t } = useTranslation();
  const [isReceived, setIsReceived] = useState<boolean>(Boolean(cargo?.is_kpi_received));
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  React.useEffect(() => {
    if (cargo) {
      setIsReceived(Boolean(cargo.is_kpi_received));
      setNotes('');
    }
  }, [cargo]);

  if (!isOpen || !cargo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm(cargo.id, isReceived, notes);
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
                <FileCheck className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Confirm KPI Bonus Receipt</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Truck: {cargo.container_truck_id} • Bonus: $
                  {cargo.cargo_bonus_rounded || cargo.cargo_bonus}
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
            <div className="space-y-2">
              <label
                onClick={() => setIsReceived(true)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isReceived
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'border-border text-foreground hover:bg-muted/30'
                }`}
              >
                <input
                  type="radio"
                  name="kpi_received_radio"
                  checked={isReceived}
                  onChange={() => setIsReceived(true)}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="size-4" />
                    KPI Bonus Received (Tasdiqlandi)
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Employee confirms receiving ${cargo.cargo_bonus_rounded || cargo.cargo_bonus}{' '}
                    bonus for this shipment.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setIsReceived(false)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  !isReceived
                    ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'border-border text-foreground hover:bg-muted/30'
                }`}
              >
                <input
                  type="radio"
                  name="kpi_received_radio"
                  checked={!isReceived}
                  onChange={() => setIsReceived(false)}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle className="size-4" />
                    Pending / Not Received (Kutilmoqda)
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Bonus has not yet been paid or confirmed by employee.
                  </p>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                Confirmation Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:border-brand-gold"
                placeholder="Received on bank card / cash payout..."
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
// 7. Bulk Payment Status Modal
// ---------------------------------------------------------------------------
interface BulkPaymentStatusModalProps {
  isOpen: boolean;
  selectedCount: number;
  onClose: () => void;
  onConfirm: (status: 'waiting' | 'unpaid' | 'paid') => Promise<void>;
}

export function BulkPaymentStatusModal({
  isOpen,
  selectedCount,
  onClose,
  onConfirm,
}: BulkPaymentStatusModalProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'waiting' | 'unpaid' | 'paid'>('paid');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm(status);
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
                <Layers className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Bulk Update Payment Status</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Update payment status for {selectedCount} selected cargo item(s)
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
            <div className="space-y-2">
              <label
                onClick={() => setStatus('paid')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  status === 'paid'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'border-border text-foreground hover:bg-muted/30'
                }`}
              >
                <input
                  type="radio"
                  name="bulk_pay_status"
                  checked={status === 'paid'}
                  onChange={() => setStatus('paid')}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="size-4" />
                    To'landi (Paid)
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Mark all selected items as paid. Enables KPI bonus expense registration.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setStatus('waiting')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  status === 'waiting'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'border-border text-foreground hover:bg-muted/30'
                }`}
              >
                <input
                  type="radio"
                  name="bulk_pay_status"
                  checked={status === 'waiting'}
                  onChange={() => setStatus('waiting')}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Calendar className="size-4" />
                    Kutilmoqda (Pending)
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Mark all selected items as waiting for client payment.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setStatus('unpaid')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  status === 'unpaid'
                    ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'border-border text-foreground hover:bg-muted/30'
                }`}
              >
                <input
                  type="radio"
                  name="bulk_pay_status"
                  checked={status === 'unpaid'}
                  onChange={() => setStatus('unpaid')}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle className="size-4" />
                    Klient bermadi (Unpaid)
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Mark all selected items as unpaid by client.
                  </p>
                </div>
              </label>
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
                <span>{submitting ? t('actionSaving') : `Update ${selectedCount} Cargos`}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// 8. Bulk Confirm KPI Bonus Receipt Modal
// ---------------------------------------------------------------------------
interface BulkConfirmKpiModalProps {
  isOpen: boolean;
  employeeName?: string;
  month: string;
  onClose: () => void;
  onConfirm: (isReceived: boolean) => Promise<void>;
}

export function BulkConfirmKpiModal({
  isOpen,
  employeeName,
  month,
  onClose,
  onConfirm,
}: BulkConfirmKpiModalProps) {
  const { t } = useTranslation();
  const [isReceived, setIsReceived] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm(isReceived);
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
                <FileCheck className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Bulk Confirm Monthly KPI</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {employeeName || 'All Sales Managers'} ({month})
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
            <p className="text-xs text-muted-foreground leading-relaxed">
              Confirm receipt of all KPI bonuses for registered cargos belonging to{' '}
              <strong className="text-foreground">{employeeName || 'sales manager'}</strong> for
              period <strong className="text-foreground">{month}</strong>.
            </p>

            <div className="space-y-2">
              <label
                onClick={() => setIsReceived(true)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isReceived
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'border-border text-foreground hover:bg-muted/30'
                }`}
              >
                <input
                  type="radio"
                  name="bulk_kpi_received"
                  checked={isReceived}
                  onChange={() => setIsReceived(true)}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="size-4" />
                    Mark All as Received (Barchasi to'landi)
                  </div>
                </div>
              </label>

              <label
                onClick={() => setIsReceived(false)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  !isReceived
                    ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'border-border text-foreground hover:bg-muted/30'
                }`}
              >
                <input
                  type="radio"
                  name="bulk_kpi_received"
                  checked={!isReceived}
                  onChange={() => setIsReceived(false)}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle className="size-4" />
                    Reset to Pending (Kutilmoqda)
                  </div>
                </div>
              </label>
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
                <span>{submitting ? t('actionSaving') : t('actionConfirm')}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
