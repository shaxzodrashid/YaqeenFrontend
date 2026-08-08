import type { CommercialOfferStatus } from '../../types/commercialOffers';
import { useTranslation } from '../../context/LanguageContext';
import { FileEdit, Send, CheckCircle2, XCircle } from 'lucide-react';

interface CommercialOfferStatusBadgeProps {
  status: CommercialOfferStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function CommercialOfferStatusBadge({
  status,
  size = 'md',
  showIcon = true,
}: CommercialOfferStatusBadgeProps) {
  const { t } = useTranslation();

  const getStatusConfig = () => {
    switch (status) {
      case 'draft':
        return {
          label: t('offerStatusDraft'),
          icon: <FileEdit className="size-3.5" />,
          classes: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        };
      case 'sent':
        return {
          label: t('offerStatusSent'),
          icon: <Send className="size-3.5" />,
          classes: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
        };
      case 'accepted':
        return {
          label: t('offerStatusAccepted'),
          icon: <CheckCircle2 className="size-3.5" />,
          classes: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        };
      case 'rejected':
        return {
          label: t('offerStatusRejected'),
          icon: <XCircle className="size-3.5" />,
          classes: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        };
      default:
        return {
          label: status,
          icon: null,
          classes: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
        };
    }
  };

  const config = getStatusConfig();
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-xs font-bold'
      : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider border select-none transition-colors ${config.classes} ${sizeClasses}`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
}
