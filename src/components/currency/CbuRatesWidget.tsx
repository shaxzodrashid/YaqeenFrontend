import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowRightLeft,
  Coins,
  X,
  Loader2,
} from 'lucide-react';
import { api, formatMoney } from '../../services/api';
import type {
  ExchangeRatesResponse,
  SupportedCurrency,
  ConvertCurrencyResponse,
} from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { usePermissions } from '../../context/PermissionsContext';

interface CbuRatesWidgetProps {
  compact?: boolean;
}

export function CbuRatesWidget({ compact = false }: CbuRatesWidgetProps) {
  const { showNotification } = useNotification();
  const { canRead, canUpdate } = usePermissions();
  const [ratesData, setRatesData] = useState<ExchangeRatesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);

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

  const handleSyncRates = async () => {
    setSyncing(true);
    try {
      const res = await api.currency.syncRates();
      if (res?.rates) {
        setRatesData((prev) =>
          prev
            ? { ...prev, rates: res.rates }
            : {
                provider: 'Central Bank of Uzbekistan (CBU)',
                base_currency: 'UZS',
                supported_currencies: ['UZS', 'USD', 'RUB', 'RMB', 'CNY'],
                rates: res.rates,
              }
        );
      }
      showNotification('CBU exchange rates synchronized successfully', 'success');
      fetchRates();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to sync CBU rates', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleConvert = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const amountNum = parseFloat(calcAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showNotification('Please enter a valid positive amount', 'warning');
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
      showNotification(err?.message || 'Currency conversion failed', 'error');
    } finally {
      setConverting(false);
    }
  };

  if (!canRead('currency')) return null;

  const usdRate = ratesData?.rates?.USD;
  const rubRate = ratesData?.rates?.RUB;
  const rmbRate = ratesData?.rates?.RMB || ratesData?.rates?.CNY;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => setIsConverterOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border hover:border-brand-gold/40 transition-colors cursor-pointer"
          title="Click to open currency converter"
        >
          <Coins className="size-3.5 text-brand-gold" />
          <div className="flex items-center gap-2 font-medium">
            <span className="text-foreground dark:text-night-text">
              1 USD ={' '}
              <span className="font-semibold text-brand-gold">
                {usdRate ? `${usdRate.rate.toLocaleString()} UZS` : '...'}
              </span>
            </span>
            <span className="text-muted dark:text-night-muted">|</span>
            <span className="text-foreground dark:text-night-text">
              1 RUB ={' '}
              <span className="font-semibold text-brand-gold">
                {rubRate ? `${rubRate.rate.toLocaleString()} UZS` : '...'}
              </span>
            </span>
            <span className="text-muted dark:text-night-muted">|</span>
            <span className="text-foreground dark:text-night-text">
              1 RMB ={' '}
              <span className="font-semibold text-brand-gold">
                {rmbRate ? `${rmbRate.rate.toLocaleString()} UZS` : '...'}
              </span>
            </span>
          </div>
        </button>

        {canUpdate('currency') && (
          <button
            onClick={handleSyncRates}
            disabled={syncing}
            className="p-1.5 rounded-xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border text-muted hover:text-foreground dark:hover:text-night-text transition-colors cursor-pointer disabled:opacity-50"
            title="Force Sync with CBU API"
          >
            <RefreshCw className={`size-3.5 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        )}

        {/* Modal render */}
        {renderConverterModal()}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-surface/90 dark:bg-night-surface/90 border border-border/70 dark:border-night-border shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
      {/* CBU Rates Overview */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
            <Coins className="size-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground dark:text-night-text">
                CBU Live Rates
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                Official
              </span>
            </div>
            <p className="text-[11px] text-muted dark:text-night-muted">
              {ratesData?.rates?.USD?.date
                ? `Updated ${ratesData.rates.USD.date}`
                : 'Central Bank of Uzbekistan'}
            </p>
          </div>
        </div>

        {/* Currency Rates Cards */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* USD Card */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-background/50 dark:bg-night-field/50 border border-border/50 dark:border-night-border text-xs">
            <span className="font-bold text-blue-600 dark:text-blue-400">USD</span>
            <span className="font-bold text-foreground dark:text-night-text">
              {loading ? '...' : usdRate ? `${usdRate.rate.toLocaleString()} UZS` : 'N/A'}
            </span>
            {usdRate && usdRate.diff !== 0 && (
              <span
                className={`flex items-center text-[10px] font-semibold ${
                  usdRate.diff > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {usdRate.diff > 0 ? (
                  <TrendingUp className="size-3 mr-0.5" />
                ) : (
                  <TrendingDown className="size-3 mr-0.5" />
                )}
                {usdRate.diff > 0 ? `+${usdRate.diff}` : usdRate.diff}
              </span>
            )}
          </div>

          {/* RUB Card */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-background/50 dark:bg-night-field/50 border border-border/50 dark:border-night-border text-xs">
            <span className="font-bold text-purple-600 dark:text-purple-400">RUB</span>
            <span className="font-bold text-foreground dark:text-night-text">
              {loading ? '...' : rubRate ? `${rubRate.rate.toLocaleString()} UZS` : 'N/A'}
            </span>
            {rubRate && rubRate.diff !== 0 && (
              <span
                className={`flex items-center text-[10px] font-semibold ${
                  rubRate.diff > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {rubRate.diff > 0 ? (
                  <TrendingUp className="size-3 mr-0.5" />
                ) : (
                  <TrendingDown className="size-3 mr-0.5" />
                )}
                {rubRate.diff > 0 ? `+${rubRate.diff}` : rubRate.diff}
              </span>
            )}
          </div>

          {/* RMB Card */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-background/50 dark:bg-night-field/50 border border-border/50 dark:border-night-border text-xs">
            <span className="font-bold text-red-600 dark:text-red-400">RMB</span>
            <span className="font-bold text-foreground dark:text-night-text">
              {loading ? '...' : rmbRate ? `${rmbRate.rate.toLocaleString()} UZS` : 'N/A'}
            </span>
            {rmbRate && rmbRate.diff !== 0 && (
              <span
                className={`flex items-center text-[10px] font-semibold ${
                  rmbRate.diff > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {rmbRate.diff > 0 ? (
                  <TrendingUp className="size-3 mr-0.5" />
                ) : (
                  <TrendingDown className="size-3 mr-0.5" />
                )}
                {rmbRate.diff > 0 ? `+${rmbRate.diff}` : rmbRate.diff}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 self-end sm:self-center">
        <button
          onClick={() => setIsConverterOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-gold/10 text-brand-gold border border-brand-gold/30 hover:bg-brand-gold/20 font-semibold text-xs transition-colors cursor-pointer"
        >
          <ArrowRightLeft className="size-3.5" />
          <span>Convert</span>
        </button>

        {canUpdate('currency') && (
          <button
            onClick={handleSyncRates}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface dark:bg-night-surface border border-border/70 dark:border-night-border text-muted hover:text-foreground dark:hover:text-night-text font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Force Synchronize with CBU API"
          >
            <RefreshCw className={`size-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync CBU'}</span>
          </button>
        )}
      </div>

      {renderConverterModal()}
    </div>
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
                      CBU Currency Converter
                    </h3>
                    <p className="text-xs text-muted dark:text-night-muted">
                      Live conversion using CBU rates
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
                    Amount
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
                      From
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
                      To
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
                  <span>Calculate Conversion</span>
                </button>
              </form>

              {/* Conversion Result Display */}
              {calcResult && (
                <div className="p-4 rounded-xl bg-brand-gold/10 border border-brand-gold/30 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-muted dark:text-night-muted">
                    Converted Result:
                  </span>
                  <div className="text-xl font-bold text-foreground dark:text-night-text">
                    {formatMoney(calcResult.converted_amount, calcResult.to_currency)}
                  </div>
                  <div className="text-[11px] text-muted dark:text-night-muted flex items-center justify-between mt-1">
                    <span>
                      Rate used: 1 {calcResult.from_currency} ={' '}
                      {calcResult.exchange_rate_used.toLocaleString()}{' '}
                      {calcResult.to_currency === 'UZS' ? 'UZS' : calcResult.to_currency}
                    </span>
                    <span>Date: {calcResult.date}</span>
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
