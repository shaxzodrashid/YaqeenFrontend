import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

interface GlobalResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function GlobalResetModal({ isOpen, onClose, onConfirm }: GlobalResetModalProps) {
  const { t } = useTranslation();
  const [resetting, setResetting] = useState<boolean>(false);

  const handleConfirm = async () => {
    setResetting(true);
    try {
      await onConfirm();
    } finally {
      setResetting(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="relative w-full max-w-md rounded-2xl bg-surface dark:bg-surface border border-rose-500/30 shadow-2xl overflow-hidden z-10 p-6 space-y-5"
          >
            {/* Top Warning Icon Header */}
            <div className="flex items-start justify-between">
              <div className="relative">
                <div className="absolute -inset-1 bg-rose-500/20 rounded-full blur-md animate-pulse" />
                <div className="relative p-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/30">
                  <ShieldAlert className="size-8" />
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={resetting}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Dialog Text */}
            <div>
              <h3 className="text-lg font-extrabold text-foreground tracking-tight">
                {t('btnResetAll')}
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {t('confirmResetAll') ||
                  'Are you sure you want to reset all Cargo & KPI module data back to default factory seeds? All LTL shipments, FTL trucks, and cargo transactions will be restored.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                disabled={resetting}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border hover:bg-muted text-foreground transition-all cursor-pointer"
              >
                {t('actionCancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={resetting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                {resetting ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    <span>{t('resetting') || 'Resetting...'}</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="size-4" />
                    <span>{t('confirmGlobalReset') || 'Confirm Global Reset'}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
