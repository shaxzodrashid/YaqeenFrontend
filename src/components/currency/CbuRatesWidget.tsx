import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRightLeft, Coins, X, Loader2 } from 'lucide-react';
import { api, formatMoney } from '../../services/api';
import type {
  ExchangeRatesResponse,
  SupportedCurrency,
  ConvertCurrencyResponse,
} from '../../services/api';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { usePermissions } from '../../context/PermissionsContext';
import { T } from '../T';

const CAROUSEL_INTERVAL_MS = 15_000; // 15 seconds

type CarouselCurrency = { code: string; colorClass: string };

const CURRENCIES: CarouselCurrency[] = [
  { code: 'USD', colorClass: 'text-blue-600 dark:text-blue-400' },
  { code: 'RUB', colorClass: 'text-purple-600 dark:text-purple-400' },
  { code: 'RMB', colorClass: 'text-red-600 dark:text-red-400' },
];

interface CbuRatesWidgetProps {
  /** When true, renders as a minimal inline carousel indicator */
  compact?: boolean;
}

export function CbuRatesWidget({ compact: _compact = false }: CbuRatesWidgetProps = {}) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canRead } = usePermissions();
  const [ratesData, setRatesData] = useState<ExchangeRatesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Carousel state
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Converter Modal state
  const [isConverterOpen, setIsConverterOpen] = useState<boolean>(false);
  const [calcAmount, setCalcAmount] = useState<string>('100');
  const [calcFrom, setCalcFrom] = useState<SupportedCurrency>('USD');
  const [calcTo, setCalcTo] = useState<SupportedCurrency>('UZS');
  const [calcResult, setCalcResult] = useState<ConvertCurrencyResponse | null>(null);
  const [converting, setConverting] = useState<boolean>(false);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.currency.getExchangeRates();
      setRatesData(data);
    } catch {
      // Non-critical background fetch failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Auto-rotate carousel
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % CURRENCIES.length);
    }, CAROUSEL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleConvert = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const amountNum = parseFloat(calcAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showNotification(t('cbuWarnPositiveAmount'), 'warning');
      return;
    }

    setConverting(true);
    try {
      const res = await api.currency.convert({
        amount: amountNum,
        from: calcFrom,
        to: calcTo,
      });
      setCalcResult(res);
    } catch (err: any) {
      showNotification(err?.message || t('cbuNotifConvertFailed'), 'error');
    } finally {
      setConverting(false);
    }
  };

  if (!canRead('currency')) return null;

  const getRateForCode = (code: string) => {
    if (!ratesData?.rates) return undefined;
    if (code === 'RMB') return ratesData.rates.RMB || ratesData.rates.CNY;
    return ratesData.rates[code as keyof typeof ratesData.rates];
  };

  const activeCurrency = CURRENCIES[activeIndex];
  const activeRate = getRateForCode(activeCurrency.code);

  // Slide animation variants
  const slideVariants = {
    enter: (dir: number) => ({
      y: dir > 0 ? 16 : -16,
      opacity: 0,
    }),
    center: {
      y: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      y: dir > 0 ? -16 : 16,
      opacity: 0,
    }),
  };

  // Dot navigation handler
  const goToSlide = (index: number) => {
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
    // Reset the interval on manual navigation
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % CURRENCIES.length);
    }, CAROUSEL_INTERVAL_MS);
  };

  return (
    <>
      <button
        onClick={() => setIsConverterOpen(true)}
        className="group flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border hover:border-brand-gold/40 transition-all cursor-pointer shadow-2xs"
        title={t('cbuOpenConverterTooltip')}
      >
        <Coins className="size-3.5 text-brand-gold shrink-0" />

        {/* Animated carousel slide */}
        <div className="relative overflow-hidden h-5 min-w-[140px] flex items-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={activeIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute inset-0 flex items-center gap-2 text-xs font-medium whitespace-nowrap"
            >
              <span className={`font-bold ${activeCurrency.colorClass}`}>
                {activeCurrency.code}
              </span>
              <span className="font-bold text-foreground dark:text-night-text">
                {loading ? '...' : activeRate ? `${activeRate.rate.toLocaleString()} UZS` : 'N/A'}
              </span>
              {activeRate && activeRate.diff !== 0 && (
                <span
                  className={`flex items-center text-[10px] font-semibold ${
                    activeRate.diff > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {activeRate.diff > 0 ? (
                    <TrendingUp className="size-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="size-3 mr-0.5" />
                  )}
                  {activeRate.diff > 0 ? `+${activeRate.diff}` : activeRate.diff}
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center gap-1 ml-1">
          {CURRENCIES.map((_, idx) => (
            <span
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(idx);
              }}
              className={`block rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeIndex
                  ? 'w-3.5 h-1.5 bg-brand-gold'
                  : 'w-1.5 h-1.5 bg-muted/40 dark:bg-night-muted/40 group-hover:bg-muted/70'
              }`}
            />
          ))}
        </div>
      </button>

      {renderConverterModal()}
    </>
  );

  function renderConverterModal() {
    return (
      <AnimatePresence>
        {isConverterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConverterOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-surface dark:bg-night-surface border border-border dark:border-night-border rounded-2xl shadow-2xl overflow-hidden z-10 p-6 flex flex-col gap-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border/40 dark:border-night-border">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-brand-gold/15 text-brand-gold">
                    <ArrowRightLeft className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground dark:text-night-text">
                      <T k="cbuConverterTitle" />
                    </h3>
                    <p className="text-xs text-muted dark:text-night-muted">
                      <T k="cbuConverterSubtitle" />
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsConverterOpen(false)}
                  className="p-1 rounded-lg text-muted hover:text-foreground dark:hover:text-night-text"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Converter Controls */}
              <form onSubmit={handleConvert} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted dark:text-night-muted uppercase mb-1">
                    <T k="cbuAmountLabel" />
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-field-background dark:bg-night-field border border-border/80 dark:border-night-border font-bold text-foreground dark:text-night-text focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-muted dark:text-night-muted uppercase mb-1">
                      <T k="cbuFromLabel" />
                    </label>
                    <select
                      value={calcFrom}
                      onChange={(e) => setCalcFrom(e.target.value as SupportedCurrency)}
                      className="w-full px-3 py-2.5 rounded-xl bg-field-background dark:bg-night-field border border-border/80 dark:border-night-border font-semibold text-sm text-foreground dark:text-night-text focus:outline-none"
                    >
                      <option value="UZS">UZS (So'm)</option>
                      <option value="USD">USD ($)</option>
                      <option value="RUB">RUB (₽)</option>
                      <option value="RMB">RMB (¥)</option>
                      <option value="CNY">CNY (元)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted dark:text-night-muted uppercase mb-1">
                      <T k="cbuToLabel" />
                    </label>
                    <select
                      value={calcTo}
                      onChange={(e) => setCalcTo(e.target.value as SupportedCurrency)}
                      className="w-full px-3 py-2.5 rounded-xl bg-field-background dark:bg-night-field border border-border/80 dark:border-night-border font-semibold text-sm text-foreground dark:text-night-text focus:outline-none"
                    >
                      <option value="UZS">UZS (So'm)</option>
                      <option value="USD">USD ($)</option>
                      <option value="RUB">RUB (₽)</option>
                      <option value="RMB">RMB (¥)</option>
                      <option value="CNY">CNY (元)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={converting}
                  className="w-full py-2.5 rounded-xl bg-accent dark:bg-[#5B8FD4] text-accent-foreground dark:text-[#0B1528] font-bold text-xs shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {converting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowRightLeft className="size-4" />
                  )}
                  <span>{t('cbuBtnCalculate')}</span>
                </button>
              </form>

              {/* Conversion Result Display */}
              {calcResult && (
                <div className="p-4 rounded-xl bg-brand-gold/10 border border-brand-gold/30 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-muted dark:text-night-muted">
                    <T k="cbuConvertedResult" />
                  </span>
                  <div className="text-xl font-bold text-foreground dark:text-night-text">
                    {formatMoney(calcResult.converted_amount, calcResult.to_currency)}
                  </div>
                  <div className="text-[11px] text-muted dark:text-night-muted flex items-center justify-between mt-1">
                    <span>
                      {t('cbuRateUsed', {
                        from: calcResult.from_currency,
                        rate: calcResult.exchange_rate_used.toLocaleString(),
                        to: calcResult.to_currency === 'UZS' ? 'UZS' : calcResult.to_currency,
                      })}
                    </span>
                    <span>{t('cbuDateLabel', { date: calcResult.date })}</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }
}
