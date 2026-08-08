import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, X, Info, ShieldAlert } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showNotification = useCallback((message: string, type: NotificationType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />;
      case 'error':
        return <ShieldAlert className="size-5 text-rose-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="size-5 text-amber-500 shrink-0" />;
      case 'info':
      default:
        return <Info className="size-5 text-blue-500 shrink-0" />;
    }
  };

  const getBorderColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/20 bg-emerald-50/90 dark:bg-emerald-950/20';
      case 'error':
        return 'border-rose-500/20 bg-rose-50/90 dark:bg-rose-950/20';
      case 'warning':
        return 'border-amber-500/20 bg-amber-50/90 dark:bg-amber-950/20';
      case 'info':
      default:
        return 'border-blue-500/20 bg-blue-50/90 dark:bg-blue-950/20';
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}

      {/* Toast Portal Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none select-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg border-neutral-100 dark:border-neutral-800 ${getBorderColor(
                toast.type
              )}`}
            >
              {getIcon(toast.type)}
              <div className="flex-1 text-xs font-semibold text-brand-navy dark:text-neutral-200 text-left leading-normal mt-0.5">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-neutral-600 dark:text-neutral-300 hover:text-brand-royal dark:hover:text-night-gold transition-colors focus:outline-none shrink-0"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
