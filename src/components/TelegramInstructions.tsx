import { useTranslation } from '../context/LanguageContext';
import { Icon } from '@iconify/react';
import { ExternalLink, HelpCircle, QrCode } from 'lucide-react';
import { TELEGRAM_BOT_USERNAME, getTelegramBotUrl } from '../services/auth.service';

interface TelegramInstructionsProps {
  botUsername?: string;
  phoneNumber?: string;
  onOpenModal?: () => void;
}

export function TelegramInstructions({
  botUsername = TELEGRAM_BOT_USERNAME,
  phoneNumber,
  onOpenModal,
}: TelegramInstructionsProps) {
  const { t } = useTranslation();
  const botUrl = getTelegramBotUrl(phoneNumber);

  return (
    <div className="w-full flex flex-col gap-4 p-4 rounded-2xl border border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20 text-left animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 shrink-0">
          <HelpCircle className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider mb-1">
            {t('telegramGuideTitle')}
          </h4>
          <p className="text-[11px] text-amber-800 dark:text-neutral-300 leading-relaxed font-medium">
            {t('telegram_not_registered')}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 pl-3 border-l-2 border-amber-500/30 text-xs">
        <div className="flex flex-col gap-1 text-neutral-700 dark:text-neutral-300">
          <span className="font-semibold">{t('telegramGuideStep1')}</span>
          <span className="font-mono text-brand-navy dark:text-brand-gold bg-white dark:bg-night-surface px-2.5 py-1 rounded-lg border border-neutral-200/80 dark:border-border select-all w-fit text-xs font-bold shadow-xs">
            @{botUsername}
          </span>
        </div>

        <p className="text-neutral-700 dark:text-neutral-300 leading-normal font-medium">
          {t('telegramGuideStep2')}
        </p>

        <p className="text-neutral-700 dark:text-neutral-300 leading-normal font-medium">
          {t('telegramGuideStep3')}
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        {onOpenModal && (
          <button
            type="button"
            onClick={onOpenModal}
            className="flex items-center gap-1.5 h-8.5 px-3 text-[11px] font-bold tracking-wide border border-brand-gold/40 text-brand-navy dark:text-brand-gold hover:bg-brand-gold/10 rounded-xl transition-all select-none cursor-pointer"
          >
            <QrCode className="size-3.5" />
            <span>QR & Auto-Link</span>
          </button>
        )}
        <a
          href={botUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 h-8.5 px-3.5 text-[11px] font-bold tracking-wide bg-brand-navy dark:bg-brand-gold text-white dark:text-brand-navy hover:opacity-90 rounded-xl transition-all select-none shadow-sm cursor-pointer"
        >
          <Icon icon="logos:telegram" className="size-4 shrink-0" />
          <span>{t('telegramOpenBot')}</span>
          <ExternalLink className="size-3 shrink-0 opacity-80" />
        </a>
      </div>
    </div>
  );
}
