import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt,
  Eye,
  Edit2,
  Trash2,
  Box,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { usePermissions } from '../../context/PermissionsContext';
import { useNotification } from '../../context/NotificationContext';
import { cargoRegistrationsApi, formatMoney, currencyApi } from '../../services/api';
import type {
  CargoRegistrationListItem,
  CargoRegistrationPaginatedResponse,
  CargoRegistrationDetail,
  CargoRegistrationStatus,
} from '../../services/api';

const STATUS_CONFIG: {
  key: CargoRegistrationStatus;
  dotClass: string;
  stepIndex: number;
}[] = [
  {
    key: 'Waiting',
    dotClass: 'bg-yellow-500',
    stepIndex: 0,
  },
  {
    key: 'In Transit',
    dotClass: 'bg-blue-500',
    stepIndex: 1,
  },
  {
    key: 'Border',
    dotClass: 'bg-amber-500',
    stepIndex: 2,
  },
  {
    key: 'At Station',
    dotClass: 'bg-indigo-500',
    stepIndex: 3,
  },
  {
    key: 'Delivered',
    dotClass: 'bg-emerald-500',
    stepIndex: 4,
  },
];

function formatDateShort(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) return '—';
  try {
    const cleanStr = dateStr.slice(0, 10);
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const mIdx = parseInt(parts[1], 10) - 1;
      const day = parts[2];
      if (mIdx >= 0 && mIdx < 12) {
        return `${monthNames[mIdx]} ${day}`;
      }
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return cleanStr;
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${monthNames[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return dateStr.slice(0, 10);
  }
}

export interface CargoTransactionsTableProps {
  data: CargoRegistrationPaginatedResponse | null;
  loading: boolean;
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  onEdit?: (item: CargoRegistrationListItem) => void;
  onDelete?: (id: string) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
}

export function CargoTransactionsTable({
  data,
  loading,
  page,
  setPage,
  onEdit,
  onDelete,
  emptyTitle = 'No cargo registrations found',
  emptySubtitle = 'Click "Register Cargo" above to submit a new LTL or FTL registration.',
}: CargoTransactionsTableProps) {
  const { showNotification } = useNotification();
  const { canUpdate, canDelete } = usePermissions();

  const [detailsItem, setDetailsItem] = useState<CargoRegistrationDetail | null>(null);

  const [rates, setRates] = useState<Record<string, number>>({
    USD: 12800,
    RUB: 140,
    RMB: 1780,
    UZS: 1,
  });

  // Fetch exchange rates from backend
  useEffect(() => {
    currencyApi
      .getExchangeRates()
      .then((res) => {
        if (res?.rates) {
          const newRates: Record<string, number> = { UZS: 1 };
          Object.entries(res.rates).forEach(([curr, item]) => {
            newRates[curr] = item.rate;
          });
          if (res.rates.CNY && !res.rates.RMB) {
            newRates.RMB = res.rates.CNY.rate;
          }
          setRates((prev) => ({ ...prev, ...newRates }));
        }
      })
      .catch(() => {});
  }, []);

  const getNetYield = useCallback(
    (
      sellAmount: number,
      sellCurr: string,
      purchaseAmount: number,
      purchaseCurr: string,
      usdRmbRate?: number | null
    ) => {
      if (sellCurr === purchaseCurr) {
        return sellAmount - purchaseAmount;
      }

      const currentRates = { ...rates };
      if (usdRmbRate && usdRmbRate > 0) {
        const usdInUzs = currentRates.USD || 12800;
        currentRates.RMB = usdInUzs / usdRmbRate;
      }

      const pRate = currentRates[purchaseCurr] || 1;
      const sRate = currentRates[sellCurr] || 1;

      const purchaseInUzs = purchaseAmount * pRate;
      const purchaseInSellCurrency = purchaseInUzs / sRate;

      return sellAmount - purchaseInSellCurrency;
    },
    [rates]
  );

  const handleViewDetails = async (id: string) => {
    try {
      const detail = await cargoRegistrationsApi.get(id);
      setDetailsItem(detail);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to load details', 'error');
    }
  };

  return (
    <>
      <div className="rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm overflow-hidden min-w-0 max-w-full">
        <div className="overflow-x-auto w-full min-w-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                <th className="py-3 px-4">Container / Truck ID</th>
                <th className="py-3 px-4">Cargo &amp; Agent</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4 min-w-[180px]">Milestone Lifecycle Progress</th>
                <th className="py-3 px-4">Assigned Employee</th>
                <th className="py-3 px-4">Purchase Price</th>
                <th className="py-3 px-4">Sell Price</th>
                <th className="py-3 px-4">Net Yield</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="size-5 animate-spin text-brand-gold" />
                      <span>Loading cargo registrations...</span>
                    </div>
                  </td>
                </tr>
              ) : !data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground">
                    <Box className="size-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-sm">{emptyTitle}</p>
                    <p className="text-xs text-muted-foreground mt-1">{emptySubtitle}</p>
                  </td>
                </tr>
              ) : (
                data.data.map((item) => {
                  const netYieldVal = getNetYield(
                    item.sell_price?.amount ?? 0,
                    item.sell_price?.currency || 'USD',
                    item.purchase_price?.amount ?? 0,
                    item.purchase_price?.currency || 'USD',
                    item.usd_rmb_rate
                  );
                  const isPositive = netYieldVal > 0;
                  const isNegative = netYieldVal < 0;

                  const currentStatusOpt =
                    STATUS_CONFIG.find((o) => o.key === item.status) || STATUS_CONFIG[0];

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      {/* Truck ID & Cargo Type */}
                      <td className="py-3 px-4 font-bold text-foreground whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                              item.cargo_type === 'FTL'
                                ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {item.cargo_type || 'LTL'}
                          </span>
                          <span>{item.container_truck_id}</span>
                        </div>
                      </td>

                      {/* Cargo Description & Agent */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-foreground">{item.cargo}</div>
                        <div className="text-[11px] text-muted-foreground">{item.agent_name}</div>
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4 text-foreground font-semibold">
                        {item.client_full_name || 'Client'}
                      </td>

                      {/* Visual Milestone Lifecycle Progress */}
                      <td className="py-3 px-4 min-w-[180px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1">
                            {STATUS_CONFIG.map((st, idx) => {
                              const isPassed = currentStatusOpt.stepIndex >= idx;
                              const isCurrent = currentStatusOpt.stepIndex === idx;
                              return (
                                <div key={st.key} className="flex items-center flex-1">
                                  <div
                                    className={`size-2.5 rounded-full transition-all ${
                                      isCurrent
                                        ? `${st.dotClass} ring-4 ring-${st.dotClass}/20 scale-110`
                                        : isPassed
                                          ? st.dotClass
                                          : 'bg-muted-foreground/30'
                                    }`}
                                    title={st.key}
                                  />
                                  {idx < STATUS_CONFIG.length - 1 && (
                                    <div
                                      className={`h-0.5 flex-1 mx-0.5 rounded-full transition-colors ${
                                        isPassed && currentStatusOpt.stepIndex > idx
                                          ? 'bg-brand-gold'
                                          : 'bg-border'
                                      }`}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                            <span>Conf: {formatDateShort(item.confirmed_date || undefined)}</span>
                            <span>Arr: {formatDateShort(item.arrived_date || undefined)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Employee */}
                      <td className="py-3 px-4 text-muted-foreground">
                        {item.employee_full_name || 'Employee'}
                      </td>

                      {/* Purchase Price */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-foreground">
                          {formatMoney(
                            item.purchase_price?.amount || 0,
                            item.purchase_price?.currency || 'USD'
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Date: {item.purchase_price?.date || item.purchase_date || 'N/A'}
                        </div>
                      </td>

                      {/* Sell Price */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-foreground">
                          {formatMoney(
                            item.sell_price?.amount || 0,
                            item.sell_price?.currency || 'USD'
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Date: {item.sell_price?.date || item.sell_date || 'N/A'}
                        </div>
                      </td>

                      {/* Net Yield & Rate */}
                      <td className="py-3 px-4 font-extrabold whitespace-nowrap">
                        <div
                          className={
                            isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isNegative
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-foreground'
                          }
                        >
                          {formatMoney(netYieldVal, item.sell_price?.currency || 'USD')}
                        </div>
                        {item.net_yield?.amount_usd !== undefined &&
                          item.sell_price?.currency !== 'USD' && (
                            <div className="text-[10px] text-muted-foreground font-semibold">
                              ≈ {formatMoney(item.net_yield.amount_usd, 'USD')}
                            </div>
                          )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1 border ${
                            item.status === 'Delivered'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : item.status === 'In Transit'
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                                : item.status === 'Border'
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                  : item.status === 'At Station'
                                    ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                                    : 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewDetails(item.id)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="size-4" />
                          </button>
                          {canUpdate('cargo_registrations') && onEdit && (
                            <button
                              onClick={() => onEdit(item)}
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-brand-gold transition-colors cursor-pointer"
                              title="Edit Registration"
                            >
                              <Edit2 className="size-4" />
                            </button>
                          )}
                          {canDelete('cargo_registrations') && onDelete && (
                            <button
                              onClick={() => onDelete(item.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                              title="Delete Registration"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {data && data.meta.total > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20 text-xs">
            <span className="text-muted-foreground font-semibold">
              Showing {data.meta.offset + 1} to{' '}
              {Math.min(data.meta.offset + data.meta.limit, data.meta.total)} of {data.meta.total}{' '}
              cargos
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => (typeof p === 'number' ? p - 1 : p))}
                className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="size-3.5" />
                <span>Previous</span>
              </button>
              <span className="font-bold text-foreground px-2">Page {page}</span>
              <button
                disabled={data.meta.offset + data.meta.limit >= data.meta.total}
                onClick={() => setPage((p) => (typeof p === 'number' ? p + 1 : p))}
                className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAILS READ-ONLY MODAL */}
      <AnimatePresence>
        {detailsItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-surface dark:bg-surface border border-border rounded-2xl shadow-2xl p-6 overflow-hidden text-foreground space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Receipt className="size-5 text-brand-gold" />
                  Cargo Registration Details
                </h3>
                <button
                  onClick={() => setDetailsItem(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-semibold">Container / Truck ID:</span>
                  <span className="font-extrabold text-foreground">
                    {detailsItem.container_truck_id}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-semibold">Cargo Type:</span>
                  <span className="font-bold text-foreground">{detailsItem.cargo_type}</span>
                </div>
                {detailsItem.cargo_type === 'LTL' ? (
                  <>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground font-semibold">Volume:</span>
                      <span className="font-semibold text-foreground">{detailsItem.volume} m³</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground font-semibold">Weight:</span>
                      <span className="font-semibold text-foreground">{detailsItem.weight} kg</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground font-semibold">Container Type:</span>
                    <span className="font-semibold text-foreground">
                      {detailsItem.container_type || 'N/A'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-semibold">Agent Name:</span>
                  <span className="font-semibold text-foreground">{detailsItem.agent_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-semibold">Cargo Item:</span>
                  <span className="font-semibold text-foreground">{detailsItem.cargo}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-semibold">Client:</span>
                  <span className="font-bold text-foreground">
                    {detailsItem.client
                      ? `${detailsItem.client.first_name} ${detailsItem.client.last_name}`
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-semibold">Assigned Employee:</span>
                  <span className="font-bold text-foreground">
                    {detailsItem.employee
                      ? `${detailsItem.employee.first_name} ${detailsItem.employee.last_name}`
                      : 'N/A'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-semibold">Purchase Price:</span>
                    <span className="font-bold text-foreground">
                      {formatMoney(detailsItem.purchase_price, detailsItem.purchase_currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                    <span>Purchase Reg. Date:</span>
                    <span className="font-semibold text-foreground">
                      {detailsItem.purchase_date || 'N/A'}
                    </span>
                  </div>
                  {detailsItem.purchase_amount_usd !== undefined &&
                    detailsItem.purchase_amount_usd !== null && (
                      <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                        <span>Equivalents (USD / UZS):</span>
                        <span className="font-semibold text-foreground">
                          {formatMoney(detailsItem.purchase_amount_usd, 'USD')} (
                          {formatMoney(detailsItem.purchase_amount_uzs || 0, 'UZS')})
                        </span>
                      </div>
                    )}
                  {detailsItem.purchase_usd_rate && (
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                      <span>Snapshot Rate (UZS/USD):</span>
                      <span className="font-semibold">{detailsItem.purchase_usd_rate}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-semibold">Selling Price:</span>
                    <span className="font-bold text-foreground">
                      {formatMoney(detailsItem.sell_price, detailsItem.sell_currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                    <span>Sell Reg. Date:</span>
                    <span className="font-semibold text-foreground">
                      {detailsItem.sell_date || 'N/A'}
                    </span>
                  </div>
                  {detailsItem.sell_amount_usd !== undefined &&
                    detailsItem.sell_amount_usd !== null && (
                      <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                        <span>Equivalents (USD / UZS):</span>
                        <span className="font-semibold text-foreground">
                          {formatMoney(detailsItem.sell_amount_usd, 'USD')} (
                          {formatMoney(detailsItem.sell_amount_uzs || 0, 'UZS')})
                        </span>
                      </div>
                    )}
                  {detailsItem.sell_usd_rate && (
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                      <span>Snapshot Rate (UZS/USD):</span>
                      <span className="font-semibold">{detailsItem.sell_usd_rate}</span>
                    </div>
                  )}
                </div>

                {(() => {
                  const netUsd = detailsItem.net_yield_details?.amount_usd ?? detailsItem.net_yield;
                  const netUzs = detailsItem.net_yield_details?.amount_uzs;
                  return (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          Standardized Net Yield:
                        </span>
                        <span
                          className={`font-extrabold text-sm ${netUsd >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
                        >
                          {formatMoney(netUsd, 'USD')}
                        </span>
                      </div>
                      {netUzs !== undefined && (
                        <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                          <span>UZS Equivalent:</span>
                          <span
                            className={`font-semibold ${netUzs >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
                          >
                            {formatMoney(netUzs, 'UZS')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {detailsItem.usd_rmb_rate && (
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground font-semibold">
                      USD -&gt; RMB Cross Rate:
                    </span>
                    <span className="font-bold text-amber-500">
                      {detailsItem.usd_rmb_rate} RMB/USD
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-semibold">Status:</span>
                  <span className="font-bold text-brand-gold">{detailsItem.status}</span>
                </div>
                {detailsItem.description && (
                  <div className="pt-2">
                    <span className="text-muted-foreground font-semibold block mb-1">Notes:</span>
                    <p className="p-2.5 rounded-xl bg-muted/40 text-foreground font-medium">
                      {detailsItem.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 text-right">
                <button
                  onClick={() => setDetailsItem(null)}
                  className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
