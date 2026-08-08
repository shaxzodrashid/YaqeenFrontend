import { useTranslation } from '../context/LanguageContext';
import { Icon } from '@iconify/react';
import { ExternalLink, HelpCircle } from 'lucide-react';

interface TelegramInstructionsProps {
  botUsername?: string;
}

export function TelegramInstructions({ botUsername = 'YaqeenOtpBot' }: TelegramInstructionsProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full flex flex-col gap-4 p-4 rounded-xl border border-amber-500/25 bg-amber-50/50 dark:bg-amber-950/10 text-left animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
          <HelpCircle className="size-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1">
            {t('telegramGuideTitle')}
          </h4>
          <p className="text-[11px] text-amber-700 dark:text-neutral-300 leading-relaxed font-semibold">
            {t('telegram_not_registered')}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 pl-10 text-xs">
        <div className="flex flex-col gap-1 text-neutral-600 dark:text-neutral-300">
          <span className="font-semibold">{t('telegramGuideStep1')}</span>
          <span className="font-mono text-brand-royal dark:text-brand-gold bg-white dark:bg-default px-2 py-0.5 rounded border border-neutral-100 dark:border-border select-all w-fit">
            @{botUsername}
          </span>
        </div>

        <p className="text-neutral-600 dark:text-neutral-300 leading-normal">
          {t('telegramGuideStep2')}
        </p>

        <p className="text-neutral-600 dark:text-neutral-300 leading-normal">
          {t('telegramGuideStep3')}
        </p>
      </div>

      <div className="flex justify-end pt-1">
        <a
          href={`https://t.me/${botUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 h-8 px-4 text-[11px] font-bold tracking-wide bg-brand-royal hover:bg-brand-royal-hover text-white rounded-lg transition-all select-none"
        >
          <Icon icon="logos:telegram" className="size-4 shrink-0" />
          <span>{t('telegramOpenBot')}</span>
          <ExternalLink className="size-3 text-white/80 shrink-0" />
        </a>
      </div>
    </div>
  );
}
