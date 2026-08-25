import { useEffect, useRef, useState, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X, RefreshCw, ShieldAlert } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

// =============================================================================
// Design System Alignment
// - Surfaces: bg-surface / border-border per tokens_engineering.md
// - Motion: pattern_motion.md  -> motion-standard 180ms ease-standard,
//   motion-emphasis 240ms, menu  fade+4-8px, drawer  240ms, reduced-motion
// - Confirmation pattern: destructive actions must name the action,
//   require explicit consent, never use gold for danger, no vague titles.
// - Components.md: Destructive Button must never use gold; requires confirmation.
// =============================================================================

export interface DeletionApprovalModalProps {
  /** Controls visibility */
  isOpen: boolean;
  /** Close request (overlay, Esc, cancel btn) */
  onClose: () => void;
  /** Confirm destructive action. May be async. Modal stays open until resolved. */
  onConfirm: () => Promise<void> | void;
  /** Dialog title – must name the action (e.g. "Delete cargo registration?") */
  title: string;
  /** Short description answering: what happens, what is affected, was anything charged? */
  description?: string;
  /** Optional entity preview (custom JSX). Rendered in a muted card. */
  entityPreview?: React.ReactNode;
  /** Optional concise consequence list (rendered as bullets / muted text) */
  consequences?: string[];
  /** Custom content slot – fully flexible, rendered between description & consequences */
  children?: React.ReactNode;
  /** Labels – defaults respect i18n caller, but provide sensible English fallback */
  cancelLabel?: string;
  confirmLabel?: string;
  /** Visual variant – danger (rose) is default; warning (amber) for reversible risk */
  variant?: 'danger' | 'warning';
  /** External busy flag – merged with internal submitting state */
  isBusy?: boolean;
  /** Optional leading icon; defaults to Trash2 / AlertTriangle per variant */
  icon?: React.ReactNode;
  /** Size token – sm 440px (default), md 520px */
  size?: 'sm' | 'md';
  /** Close on overlay click – defaults true (disabled while busy) */
  closeOnOverlayClick?: boolean;
  /** Close on Escape – defaults true (disabled while busy) */
  closeOnEsc?: boolean;
  /** When true, confirm btn stays disabled until caller sets isBusy=false;
   * prevents double-submit. Defaults true.
   */
  preventCloseWhileBusy?: boolean;
  /** Optional aria-describedby override if caller provides custom description id */
  ariaDescribedBy?: string;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    setReduced(mq.matches);
    // Modern browsers
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  return reduced;
}

export function DeletionApprovalModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  entityPreview,
  consequences,
  children,
  cancelLabel,
  confirmLabel,
  variant = 'danger',
  isBusy = false,
  icon,
  size = 'sm',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  preventCloseWhileBusy = true,
  ariaDescribedBy,
}: DeletionApprovalModalProps) {
  const { t } = useTranslation();
  const reducedMotion = usePrefersReducedMotion();
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [internalBusy, setInternalBusy] = useState(false);

  const busy = isBusy || internalBusy;
  const isDanger = variant === 'danger';

  // Locale-aware defaults – respect selected locale (requirements: not hardcoded English)
  const resolvedCancelLabel = cancelLabel ?? t('actionCancel');
  const resolvedConfirmLabel = confirmLabel ?? t('actionDelete');
  const rawPleaseNote = t('deleteModalPleaseNote');
  const pleaseNoteLabel = rawPleaseNote === 'deleteModalPleaseNote' ? 'Please note' : rawPleaseNote;
  const rawDeleting = t('deleting');
  const deletingLabel = rawDeleting === 'deleting' ? 'Deleting...' : rawDeleting;
  const rawClose = t('closeDialog');
  const closeLabel = rawClose === 'closeDialog' ? t('actionClose') : rawClose;

  // Preserve trigger focus & restore on close
  useEffect(() => {
    if (isOpen) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      // Next frame, focus cancel (safe default per a11y for destructive dialogs)
      requestAnimationFrame(() => cancelBtnRef.current?.focus());
    } else {
      // Restore focus when closing, unless focus is already elsewhere meaningful
      if (previouslyFocused.current && typeof previouslyFocused.current.focus === 'function') {
        // delay to allow exit animation before refocus
        const t = setTimeout(() => previouslyFocused.current?.focus(), 60);
        return () => clearTimeout(t);
      }
    }
  }, [isOpen]);

  // Body scroll lock – bug-free: save original, restore exactly, handle stacked modals
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    // Compensate scrollbar width to avoid layout shift
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  // Esc handling
  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || !closeOnEsc || busy) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [isOpen, closeOnEsc, busy, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleEsc]);

  // Focus trap – minimal, bug-free, no external deps
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const root = dialogRef.current;
    if (!root) return;
    const focusable = root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey) {
      if (active === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  const handleOverlayClick = useCallback(() => {
    if (!closeOnOverlayClick || (preventCloseWhileBusy && busy)) return;
    onClose();
  }, [closeOnOverlayClick, preventCloseWhileBusy, busy, onClose]);

  const handleConfirmClick = useCallback(async () => {
    if (busy) return;
    setInternalBusy(true);
    try {
      await onConfirm();
      // Caller decides when to close (usually after success notification).
      // We do NOT auto-close here to keep success/error control in caller.
    } finally {
      setInternalBusy(false);
    }
  }, [busy, onConfirm]);

  // Motion tokens per Docs/design-system/patterns_motion.md
  // standard 180ms, emphasis 240ms, easing tokens.
  const overlayTransition = reducedMotion
    ? { duration: 0.01 }
    : { duration: 0.18, ease: [0.2, 0, 0, 1] as const };
  const dialogTransitionEnter = reducedMotion
    ? { duration: 0.01 }
    : { duration: 0.2, ease: [0, 0, 0.2, 1] as const };
  const dialogTransitionExit = reducedMotion
    ? { duration: 0.01 }
    : { duration: 0.15, ease: [0.4, 0, 1, 1] as const };

  const maxWClass = size === 'md' ? 'max-w-lg' : 'max-w-md';

  // Ensure portal target exists (SSR-safe)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const resolvedIcon =
    icon ?? (isDanger ? <Trash2 className="size-5" /> : <AlertTriangle className="size-5" />);

  const accent = isDanger
    ? {
        iconWrap: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        glow: 'bg-rose-500/15',
        confirmBtn:
          'bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500 text-white shadow-rose-600/20 shadow-lg',
        iconGlow: 'bg-rose-500/20',
      }
    : {
        iconWrap: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
        glow: 'bg-amber-500/15',
        confirmBtn:
          'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500 text-white shadow-amber-600/20 shadow-lg',
        iconGlow: 'bg-amber-500/20',
      };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay – calm fade, 180ms standard */}
          <motion.div
            key="deletion-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayTransition}
            onClick={handleOverlayClick}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Dialog – fade + 8px lift per motion.menu.enter, 180-200ms */}
          <motion.div
            key="deletion-dialog"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={ariaDescribedBy ?? (description || consequences ? descId : undefined)}
            aria-busy={busy || undefined}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            transition={isOpen ? dialogTransitionEnter : dialogTransitionExit}
            onKeyDown={handleKeyDown}
            className={`relative w-full ${maxWClass} rounded-2xl bg-surface border shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] ${
              isDanger ? 'border-rose-500/20' : 'border-amber-500/20'
            }`}
            // prevent overlay click bubbling when clicking dialog
            onClick={(e) => e.stopPropagation()}
          >
            {/* Subtle top accent line – brand calm, not decorative noise */}
            <div
              className={`h-1 w-full shrink-0 ${
                isDanger
                  ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500'
                  : 'bg-gradient-to-r from-amber-500 via-brand-gold to-brand-royal'
              }`}
            />

            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <div
                    className={`absolute -inset-1 rounded-2xl blur-md opacity-60 ${accent.glow}`}
                    aria-hidden="true"
                  />
                  <div className={`relative p-3 rounded-2xl border ${accent.iconWrap}`}>
                    {resolvedIcon}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h2
                    id={titleId}
                    className="text-[15px] font-bold tracking-tight text-foreground leading-tight"
                  >
                    {title}
                  </h2>
                  {description && (
                    <p id={descId} className="text-xs leading-relaxed text-muted-foreground mt-1.5">
                      {description}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={busy && preventCloseWhileBusy}
                aria-label={closeLabel}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body – scrollable, calm spacing */}
            {(entityPreview || children || (consequences && consequences.length > 0)) && (
              <div className="px-6 pb-2 space-y-3 overflow-y-auto custom-scrollbar min-h-0">
                {entityPreview && (
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/60 text-xs">
                    {entityPreview}
                  </div>
                )}

                {children && <div className="text-xs text-foreground">{children}</div>}

                {consequences && consequences.length > 0 && (
                  <div
                    className={`p-3 rounded-xl border text-xs leading-relaxed ${
                      isDanger
                        ? 'bg-rose-500/5 border-rose-500/15 text-muted-foreground'
                        : 'bg-amber-500/5 border-amber-500/15 text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider mb-1.5">
                      <ShieldAlert
                        className={`size-3.5 ${isDanger ? 'text-rose-500' : 'text-amber-600'}`}
                      />
                      <span
                        className={
                          isDanger
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }
                      >
                        {pleaseNoteLabel}
                      </span>
                    </div>
                    <ul className="list-disc list-outside ml-4 space-y-1 marker:text-muted-foreground/60">
                      {consequences.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Footer – actions */}
            <div className="px-6 py-4 bg-muted/20 border-t border-border flex items-center justify-end gap-2.5 shrink-0 mt-2">
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={onClose}
                disabled={busy && preventCloseWhileBusy}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border bg-surface hover:bg-muted text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/40 focus-visible:ring-offset-0"
              >
                {resolvedCancelLabel}
              </button>

              <button
                type="button"
                onClick={handleConfirmClick}
                disabled={busy}
                aria-busy={busy}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 ${accent.confirmBtn}`}
              >
                {busy ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>{deletingLabel}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" />
                    <span>{resolvedConfirmLabel}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default DeletionApprovalModal;
