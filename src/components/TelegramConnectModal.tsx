import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { X, ExternalLink, Copy, Check, RefreshCw, CheckCircle2 } from 'lucide-react';
import QRCode from 'qrcode';
import { useTranslation } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import {
  api,
  TELEGRAM_BOT_USERNAME,
  getTelegramBotUrl,
  normalizePhone,
  demoAuthDb,
} from '../services/api';

export interface TelegramConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  telegramBotUrl?: string;
  telegramBotUsername?: string;
  onConnected?: () => void;
}

export function TelegramConnectModal({
  isOpen,
  onClose,
  phoneNumber,
  telegramBotUrl,
  telegramBotUsername = TELEGRAM_BOT_USERNAME,
  onConnected,
}: TelegramConnectModalProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  const cleanPhone = normalizePhone(phoneNumber);
  const botUrl = telegramBotUrl || getTelegramBotUrl(cleanPhone);
  const botUsername = telegramBotUsername || TELEGRAM_BOT_USERNAME;

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isLinked, setIsLinked] = useState(false);

  const pollingTimerRef = useRef<any>(null);
  const isComponentMounted = useRef<boolean>(true);

  // Generate QR Code
  useEffect(() => {
    if (!isOpen || !botUrl) return;

    let isMounted = true;
    QRCode.toDataURL(botUrl, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#11213D',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate Telegram bot QR code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, botUrl]);

  // Check Registration Status Callback
  const checkStatus = useCallback(
    async (isManual = false) => {
      if (!cleanPhone || isLinked) return;
      if (isManual) setIsChecking(true);

      try {
        const res = await api.checkTelegramStatus(cleanPhone);
        if (isComponentMounted.current) {
          if (res?.registered) {
            setIsLinked(true);
            if (pollingTimerRef.current) {
              clearInterval(pollingTimerRef.current);
              pollingTimerRef.current = null;
            }
            showNotification(
              t('telegramLinkedSuccess') || 'Telegram connected successfully!',
              'success'
            );
            setTimeout(() => {
              if (isComponentMounted.current) {
                if (onConnected) onConnected();
                onClose();
              }
            }, 900);
          }
        }
      } catch (err) {
        // Silently handle polling network or server errors
        console.debug('Telegram status check error:', err);
      } finally {
        if (isComponentMounted.current && isManual) {
          setIsChecking(false);
        }
      }
    },
    [cleanPhone, isLinked, onConnected, onClose, showNotification, t]
  );

  // Setup Auto-Polling Interval (2 seconds)
  useEffect(() => {
    isComponentMounted.current = true;

    if (isOpen && cleanPhone && !isLinked) {
      // Immediate initial check
      checkStatus(false);

      // Start 2-second polling interval
      pollingTimerRef.current = setInterval(() => {
        checkStatus(false);
      }, 2000);
    }

    return () => {
      isComponentMounted.current = false;
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [isOpen, cleanPhone, isLinked, checkStatus]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLinked(false);
      setIsCopied(false);
      setIsChecking(false);
    }
  }, [isOpen]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(botUrl);
      setIsCopied(true);
      showNotification(t('telegramLinkCopied') || 'Link copied to clipboard!', 'info');
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleSimulateDemoLink = () => {
    demoAuthDb.linkPhone(cleanPhone);
    checkStatus(true);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-900/70 dark:bg-black/85 backdrop-blur-md transition-opacity"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-night-surface border border-neutral-200/90 dark:border-border/80 p-6 sm:p-8 shadow-2xl dark:shadow-black/80 font-ui z-10 text-left overflow-hidden"
        >
          {/* Subtle decorative background glow */}
          <div className="absolute -top-20 -right-20 w-56 h-56 bg-brand-gold/10 dark:bg-brand-gold/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-sky-500/10 dark:bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 size-9 rounded-full bg-neutral-100 dark:bg-night-elevated hover:bg-neutral-200 dark:hover:bg-night-sidebar flex items-center justify-center text-neutral-500 dark:text-muted hover:text-neutral-800 dark:hover:text-foreground transition-colors cursor-pointer z-20"
          >
            <X className="size-4.5" />
          </button>

          {/* Header */}
          <div className="flex items-start gap-4 mb-6 pr-8">
            <div className="size-12 rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/25 flex items-center justify-center shrink-0 shadow-xs">
              <Icon icon="logos:telegram" className="size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-brand-navy dark:text-foreground tracking-tight">
                  {t('telegramModalTitle') || 'Connect Telegram Bot'}
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30 tracking-wider">
                  OTP
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-muted mt-1 leading-relaxed">
                {t('telegramModalSubtitle') ||
                  'Link your phone number to receive secure OTP verification codes directly in Telegram.'}
              </p>
            </div>
          </div>

          {/* Connected Success Overlay */}
          {isLinked ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-10 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="size-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="size-10 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  Telegram Linked Successfully!
                </h4>
                <p className="text-xs text-neutral-500 dark:text-muted mt-1">
                  Re-triggering verification code...
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* QR Code & Scan Section */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-neutral-50/80 dark:bg-night-elevated/70 border border-neutral-200/80 dark:border-border/60">
                {/* QR Code Container */}
                <div className="relative p-2.5 bg-white rounded-2xl border-2 border-brand-gold/40 shadow-md shrink-0 flex items-center justify-center group">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Telegram Bot QR Code"
                      className="size-36 sm:size-40 rounded-xl object-contain"
                    />
                  ) : (
                    <div className="size-36 sm:size-40 rounded-xl bg-neutral-100 flex items-center justify-center">
                      <RefreshCw className="size-6 text-neutral-400 animate-spin" />
                    </div>
                  )}

                  {/* Center Overlay Logo on QR */}
                  <div className="absolute size-8 rounded-full bg-white shadow-md border border-neutral-200 flex items-center justify-center pointer-events-none">
                    <Icon icon="logos:telegram" className="size-5" />
                  </div>
                </div>

                {/* Steps Details */}
                <div className="flex-1 space-y-3 w-full text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="size-5 rounded-full bg-brand-gold text-brand-navy font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="text-neutral-700 dark:text-neutral-300 leading-snug">
                      {t('telegramStep1Modal') || 'Scan the QR code or click the button below.'}
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="size-5 rounded-full bg-brand-gold text-brand-navy font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="text-neutral-700 dark:text-neutral-300 leading-snug">
                      {t('telegramStep2Modal') ||
                        "Tap 'Start' and click 'Register Phone Number 📱' to share contact."}
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="size-5 rounded-full bg-brand-gold text-brand-navy font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="text-neutral-700 dark:text-neutral-300 leading-snug">
                      {t('telegramStep3Modal') ||
                        'This screen will automatically detect your registration.'}
                    </p>
                  </div>

                  {/* Phone & Bot Tag */}
                  <div className="pt-1 flex items-center flex-wrap gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-neutral-200/80 dark:bg-night-surface text-neutral-600 dark:text-neutral-300 font-mono font-medium">
                      +{cleanPhone}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-brand-gold/10 text-brand-gold font-mono font-bold">
                      @{botUsername}
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time Polling Status Banner */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex size-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-2.5 bg-amber-500"></span>
                  </span>
                  <span className="font-semibold">
                    {t('telegramWaitingRegistration') ||
                      'Waiting for contact registration in Telegram...'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => checkStatus(true)}
                  disabled={isChecking}
                  title="Check registration now"
                  className="flex items-center gap-1 text-[11px] font-bold text-amber-900 dark:text-amber-200 hover:underline cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`size-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? t('telegramChecking') : t('telegramCheckNow')}</span>
                </button>
              </div>

              {/* CTA Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <a
                  href={botUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 w-full h-11.5 px-5 bg-brand-royal hover:bg-brand-royal-hover dark:bg-brand-gold dark:hover:bg-brand-gold/90 text-white dark:text-brand-navy font-bold text-sm rounded-xl flex items-center justify-center gap-2.5 shadow-md shadow-brand-royal/20 dark:shadow-brand-gold/20 transition-all cursor-pointer select-none"
                >
                  <Icon icon="logos:telegram" className="size-5 shrink-0" />
                  <span>{t('telegramOpenBot') || 'Open Telegram Bot'}</span>
                  <ExternalLink className="size-4 shrink-0 opacity-80" />
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full sm:w-auto h-11.5 px-4 rounded-xl border border-neutral-200 dark:border-border/80 bg-neutral-50 dark:bg-night-elevated hover:bg-neutral-100 dark:hover:bg-night-sidebar text-neutral-700 dark:text-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer select-none"
                >
                  {isCopied ? (
                    <>
                      <Check className="size-4 text-emerald-500 shrink-0" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {t('telegramLinkCopied') || 'Copied!'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-4 text-neutral-400 shrink-0" />
                      <span>{t('telegramCopyLink') || 'Copy Link'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Demo Mode helper for local testing */}
              {demoAuthDb && !demoAuthDb.telegramLinkedPhones.has(cleanPhone) && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleSimulateDemoLink}
                    className="text-[11px] text-neutral-400 hover:text-brand-gold dark:hover:text-brand-gold underline transition-colors cursor-pointer"
                  >
                    {t('telegramSimulateLink') || '⚡ Simulate Linking (Demo Mode)'}
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
