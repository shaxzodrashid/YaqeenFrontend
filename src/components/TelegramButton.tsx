import { useState } from 'react';
import { Button, Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

interface TelegramButtonProps {
  onPress?: () => void;
  text?: string;
  isPending?: boolean;
}

export function TelegramButton({ onPress, text, isPending = false }: TelegramButtonProps) {
  const { t } = useTranslation();
  const [internalPending, setInternalPending] = useState(false);

  const handlePress = () => {
    if (isPending) return;
    setInternalPending(true);
    // Simulate API redirect or callback delay
    setTimeout(() => {
      setInternalPending(false);
      if (onPress) onPress();
    }, 1200);
  };

  const activePending = isPending || internalPending;

  return (
    <Button
      fullWidth
      onPress={handlePress}
      isDisabled={activePending}
      className="relative flex items-center justify-center gap-3 h-11 px-5 border border-brand-gold dark:border-brand-gold/55 bg-white dark:bg-overlay text-brand-navy dark:text-neutral-200 hover:bg-brand-gold-soft/30 dark:hover:bg-night-elevated hover:border-brand-gold/80 transition-all duration-200 font-semibold rounded-lg shadow-sm focus:ring-2 focus:ring-brand-gold/30 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none group"
    >
      {activePending ? (
        <Spinner size="sm" color="current" className="text-brand-navy dark:text-neutral-200" />
      ) : (
        <Icon
          icon="logos:telegram"
          className="size-5 group-hover:scale-110 transition-transform duration-200"
        />
      )}
      <span className="text-sm font-semibold tracking-wide">
        {activePending ? t('btnConnectingTelegram') : text || t('btnContinueTelegram')}
      </span>
      {!activePending && (
        <ArrowRight className="absolute right-4 size-4 text-brand-gold opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
      )}
    </Button>
  );
}
