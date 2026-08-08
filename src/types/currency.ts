/** Supported ISO Currency Codes */
export type SupportedCurrency = 'UZS' | 'USD' | 'RUB' | 'RMB' | 'CNY';

/** CBU Exchange Rate Snapshot for a single currency */
export interface CbuRateItem {
  currency: SupportedCurrency;
  code: string; // e.g. "840" for USD, "643" for RUB, "860" for UZS, "156" for CNY
  nominal: number; // Usually 1
  rate: number; // Exchange rate in UZS (e.g. 12850.0 for USD)
  diff: number; // Rate difference compared to previous day
  date: string; // Rate publication date (e.g. "23.07.2026")
}

/** Response structure for GET /currency/rates */
export interface ExchangeRatesResponse {
  provider: string;
  base_currency: SupportedCurrency;
  supported_currencies: SupportedCurrency[];
  rates: Record<SupportedCurrency, CbuRateItem>;
}

/** Request payload for POST /currency/convert */
export interface ConvertCurrencyRequest {
  amount: number;
  from: SupportedCurrency;
  to: SupportedCurrency;
}

/** Response payload for POST /currency/convert */
export interface ConvertCurrencyResponse {
  original_amount: number;
  from_currency: SupportedCurrency;
  converted_amount: number;
  to_currency: SupportedCurrency;
  exchange_rate_used: number;
  date: string;
}

/** Response payload for POST /currency/sync */
export interface SyncRatesResponse {
  message: string;
  rates: Record<SupportedCurrency, CbuRateItem>;
}

/**
 * Format currency numbers with locale-appropriate formatting.
 */
export function formatMoney(amount: number, currency: SupportedCurrency = 'UZS'): string {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const localeMap: Record<SupportedCurrency, string> = {
    UZS: 'uz-UZ',
    USD: 'en-US',
    RUB: 'ru-RU',
    RMB: 'zh-CN',
    CNY: 'zh-CN',
  };

  return new Intl.NumberFormat(localeMap[currency] || 'uz-UZ', {
    style: 'currency',
    currency: currency === 'RMB' ? 'CNY' : currency,
    maximumFractionDigits: currency === 'UZS' ? 0 : 2,
  }).format(num);
}
