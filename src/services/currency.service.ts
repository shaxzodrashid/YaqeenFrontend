import { request } from './httpClient';
import type {
  ExchangeRatesResponse,
  ConvertCurrencyRequest,
  ConvertCurrencyResponse,
  SyncRatesResponse,
  SupportedCurrency,
} from '../types/currency';

export const currencyApi = {
  /** Fetch current CBU rates */
  getExchangeRates: () =>
    request<ExchangeRatesResponse>('/currency/rates', {
      method: 'GET',
    }),

  /** Convert amount between currencies */
  convert: (payload: ConvertCurrencyRequest) =>
    request<ConvertCurrencyResponse>('/currency/convert', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** Force sync rates from CBU */
  syncRates: () =>
    request<SyncRatesResponse>('/currency/sync', {
      method: 'POST',
    }),
};

/** Alias client for documentation compatibility */
export const CurrencyApiClient = {
  async getExchangeRates(): Promise<ExchangeRatesResponse> {
    return currencyApi.getExchangeRates();
  },

  async convert(payload: ConvertCurrencyRequest): Promise<ConvertCurrencyResponse> {
    return currencyApi.convert(payload);
  },

  async syncRates(): Promise<SyncRatesResponse> {
    return currencyApi.syncRates();
  },

  async getFinanceSummary(period: string, currency: SupportedCurrency = 'UZS') {
    const q = new URLSearchParams();
    if (period) q.set('period', period);
    if (currency) q.set('currency', currency);
    return request(`/finance/summary?${q.toString()}`, { method: 'GET' });
  },
};
