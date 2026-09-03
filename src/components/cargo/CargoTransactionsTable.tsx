import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import {
  Eye,
  Edit2,
  Trash2,
  Box,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Calendar,
  Copy,
  CopyPlus,
  Check,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { usePermissions } from '../../context/PermissionsContext';
import { useNotification } from '../../context/NotificationContext';
import { cargoRegistrationsApi, formatMoney, currencyApi } from '../../services/api';
import { RouteBadge } from './RouteBadge';
import { CargoRegistrationDetailsModal } from './CargoRegistrationDetailsModal';
import type {
  CargoRegistrationListItem,
  CargoRegistrationPaginatedResponse,
  CargoRegistrationDetail,
} from '../../services/api';

function formatDateDisplay(dateStr?: string | null, localeCode: string = 'en'): string {
  if (!dateStr || !dateStr.trim()) return '—';
  try {
    const cleanStr = dateStr.slice(0, 10);
    const parts = cleanStr.split('-');
    let dateObj: Date;
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      dateObj = new Date(year, month, day);
    } else {
      dateObj = new Date(dateStr);
    }
    if (isNaN(dateObj.getTime())) return cleanStr;
    const localeMap: Record<string, string> = {
      uz: 'uz-UZ',
      ru: 'ru-RU',
      en: 'en-US',
    };
    const targetLocale = localeMap[localeCode] || 'en-US';
    return dateObj.toLocaleDateString(targetLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr.slice(0, 10);
  }
}

interface SortableHeaderProps {
  label: string;
  field: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
  onSort?: (field: string) => void;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

function SortableHeader({
  label,
  field,
  sortBy,
  sortOrder = 'DESC',
  onSort,
  align = 'left',
  className = '',
}: SortableHeaderProps) {
  const { t } = useTranslation();
  const isActive = Boolean(sortBy && sortBy === field);
  const isAsc = isActive && (sortOrder === 'ASC' || sortOrder === 'asc');

  const handleClick = () => {
    if (onSort) {
      onSort(field);
    }
  };

  const isDescFirst = [
    'created_at',
    'confirmed_date',
    'loaded_date',
    'arrived_date',
    'purchase_date',
    'sell_date',
    'purchase_price',
    'sell_price',
    'net_yield',
  ].includes(field);

  const sortHint = isActive
    ? isDescFirst
      ? isAsc
        ? t('clickToResetSortHint') || 'Ascending (click to cancel sorting)'
        : t('sortDescendingHint') || 'Descending (click for Ascending)'
      : isAsc
        ? t('sortAscendingHint') || 'Ascending (click for Descending)'
        : t('clickToResetSortHint') || 'Descending (click to cancel sorting)'
    : t('clickToSortHint') || 'Click to sort';

  const tooltipTitle = `${t('sortByTitle', { label }) || `Sort by ${label}`} (${sortHint})`;

  return (
    <th
      onClick={handleClick}
      className={`py-3 px-3 text-[11px] uppercase tracking-wider font-bold transition-all select-none cursor-pointer group hover:bg-muted/70 overflow-hidden ${
        isActive
          ? 'text-brand-gold bg-brand-gold/10'
          : 'text-muted-foreground hover:text-foreground'
      } ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'} ${className}`}
      title={tooltipTitle}
    >
      <div
        className={`flex items-center gap-1.5 w-full min-w-0 max-w-full ${
          align === 'right'
            ? 'justify-end'
            : align === 'center'
              ? 'justify-center'
              : 'justify-between'
        }`}
      >
        <span className="truncate min-w-0 block font-bold" title={label}>
          {label}
        </span>
        <span
          className={`inline-flex items-center justify-center size-4.5 rounded-md shrink-0 transition-all ${
            isActive
              ? 'text-brand-navy bg-brand-gold shadow-xs font-black'
              : 'text-muted-foreground/50 group-hover:text-foreground group-hover:bg-muted'
          }`}
        >
          {isActive ? (
            isAsc ? (
              <ArrowUp className="size-3.5 stroke-[2.5]" />
            ) : (
              <ArrowDown className="size-3.5 stroke-[2.5]" />
            )
          ) : (
            <ArrowUpDown className="size-3 opacity-60 group-hover:opacity-100" />
          )}
        </span>
      </div>
    </th>
  );
}

interface CargoTableRowSkeletonProps {
  index: number;
}

function CargoTableRowSkeleton({ index }: CargoTableRowSkeletonProps) {
  const isIndigo = index % 3 === 0;

  const truckWidths = ['w-24', 'w-28', 'w-20', 'w-26'];
  const cargoWidths = ['w-32', 'w-24', 'w-36', 'w-28'];
  const agentWidths = ['w-20', 'w-16', 'w-24', 'w-18'];
  const clientWidths = ['w-28', 'w-20', 'w-24', 'w-32'];
  const employeeWidths = ['w-24', 'w-20', 'w-28', 'w-16'];
  const statusWidths = ['w-20', 'w-24', 'w-18', 'w-22'];

  return (
    <tr className="border-b border-border/40 hover:bg-muted/10 transition-colors h-[62px]">
      {/* 1. Container / Truck ID */}
      <td className="py-3 px-3.5 w-[220px] min-w-[220px] max-w-[220px] overflow-hidden">
        <div className="flex items-center gap-2 w-full min-w-0">
          <div
            className={`h-5 w-9 rounded-md shrink-0 ${
              isIndigo ? 'skeleton-shimmer-indigo' : 'skeleton-shimmer-gold'
            }`}
          />
          <div
            className={`h-4 ${truckWidths[index % 4]} rounded-md skeleton-shimmer flex-1 max-w-[120px]`}
          />
        </div>
      </td>

      {/* 2. Cargo & Agent */}
      <td className="py-3 px-3.5 w-[200px] min-w-[200px] max-w-[200px] overflow-hidden">
        <div
          className={`h-4 ${cargoWidths[index % 4]} rounded-md skeleton-shimmer max-w-[150px]`}
        />
        <div
          className={`h-3 ${agentWidths[index % 4]} rounded-md skeleton-shimmer mt-1.5 opacity-70 max-w-[100px]`}
        />
      </td>

      {/* 3. Route */}
      <td className="py-3 px-3.5 w-[170px] min-w-[170px] max-w-[170px] overflow-hidden">
        <div className="h-6 w-28 rounded-md skeleton-shimmer border border-border/40" />
      </td>

      {/* 4. Client */}
      <td className="py-3 px-3.5 w-[160px] min-w-[160px] max-w-[160px] overflow-hidden">
        <div
          className={`h-4 ${clientWidths[index % 4]} rounded-md skeleton-shimmer max-w-[110px]`}
        />
      </td>

      {/* 5. Employee */}
      <td className="py-3 px-3.5 w-[160px] min-w-[160px] max-w-[160px] overflow-hidden">
        <div
          className={`h-4 ${employeeWidths[index % 4]} rounded-md skeleton-shimmer opacity-80 max-w-[100px]`}
        />
      </td>

      {/* 5. Purchase Price & Date */}
      <td className="py-3 px-3.5 w-[150px] min-w-[150px] max-w-[150px] overflow-hidden">
        <div className="h-4 w-20 rounded-md skeleton-shimmer" />
        <div className="h-3 w-16 rounded-md skeleton-shimmer mt-1.5 opacity-70" />
      </td>

      {/* 6. Sell Price & Date */}
      <td className="py-3 px-3.5 w-[150px] min-w-[150px] max-w-[150px] overflow-hidden">
        <div className="h-4 w-20 rounded-md skeleton-shimmer" />
        <div className="h-3 w-16 rounded-md skeleton-shimmer mt-1.5 opacity-70" />
      </td>

      {/* 7. Net Yield & Rate */}
      <td className="py-3 px-3.5 w-[155px] min-w-[155px] max-w-[155px] overflow-hidden">
        <div className="h-4.5 w-20 rounded-md skeleton-shimmer-emerald" />
        <div className="h-3 w-14 rounded-md skeleton-shimmer mt-1.5 opacity-70" />
      </td>

      {/* 8. Confirmed Date */}
      <td className="py-3 px-3.5 w-[165px] min-w-[165px] max-w-[165px] overflow-hidden">
        <div className="h-6 w-24 rounded-md skeleton-shimmer border border-border/40" />
      </td>

      {/* 9. Loaded Date */}
      <td className="py-3 px-3.5 w-[155px] min-w-[155px] max-w-[155px] overflow-hidden">
        <div className="h-6 w-24 rounded-md skeleton-shimmer border border-border/40" />
      </td>

      {/* 10. Arrived Date */}
      <td className="py-3 px-3.5 w-[160px] min-w-[160px] max-w-[160px] overflow-hidden">
        <div className="h-6 w-24 rounded-md skeleton-shimmer border border-border/40" />
      </td>

      {/* 11. Created At */}
      <td className="py-3 px-3.5 w-[150px] min-w-[150px] max-w-[150px] overflow-hidden">
        <div className="h-6 w-24 rounded-md skeleton-shimmer border border-border/40" />
      </td>

      {/* 12. Status */}
      <td className="py-3 px-3.5 w-[135px] min-w-[135px] max-w-[135px] overflow-hidden">
        <div className={`h-6 ${statusWidths[index % 4]} rounded-full skeleton-shimmer`} />
      </td>

      {/* 13. Actions */}
      <td className="py-3 px-4 text-right w-[140px] min-w-[140px] max-w-[140px] overflow-hidden">
        <div className="flex items-center justify-end gap-1.5">
          <div className="size-7 rounded-lg skeleton-shimmer" />
          <div className="size-7 rounded-lg skeleton-shimmer" />
          <div className="size-7 rounded-lg skeleton-shimmer" />
          <div className="size-7 rounded-lg skeleton-shimmer" />
        </div>
      </td>
    </tr>
  );
}

export interface CargoTransactionsTableProps {
  data: CargoRegistrationPaginatedResponse | null;
  loading: boolean;
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
  onSort?: (field: string) => void;
  onDuplicate?: (item: CargoRegistrationListItem) => void;
  onEdit?: (item: CargoRegistrationListItem) => void;
  onDelete?: (id: string) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  skeletonRowCount?: number;
}

export function CargoTransactionsTable({
  data,
  loading,
  page,
  setPage,
  sortBy: controlledSortBy,
  sortOrder: controlledSortOrder,
  onSort: controlledOnSort,
  onDuplicate,
  onEdit,
  onDelete,
  emptyTitle,
  emptySubtitle,
  skeletonRowCount,
}: CargoTransactionsTableProps) {
  const { t, locale } = useTranslation();
  const { showNotification } = useNotification();
  const { canCreate, canUpdate, canDelete } = usePermissions();

  const [detailsItem, setDetailsItem] = useState<CargoRegistrationDetail | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getStatusLabel = useCallback(
    (status: string) => {
      switch (status) {
        case 'Arrived':
        case 'Delivered':
          return t('statusArrived');
        case 'On the way':
        case 'In Transit':
          return t('statusOnTheWay');
        case 'On the border':
        case 'Border':
          return t('statusOnTheBorder');
        case 'Station':
        case 'At Station':
          return t('statusStation');
        case 'Reload':
          return t('statusReload');
        case 'Waiting':
          return t('statusWaiting');
        default:
          return status;
      }
    },
    [t]
  );

  // Horizontal scroll retention ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef<number>(0);
  const isRestoringScrollRef = useRef<boolean>(false);

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current && !isRestoringScrollRef.current) {
      scrollPosRef.current = scrollContainerRef.current.scrollLeft;
    }
  }, []);

  // Restore horizontal scroll on data or status updates
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const targetScroll = scrollPosRef.current;
    if (targetScroll > 0) {
      isRestoringScrollRef.current = true;
      container.scrollLeft = targetScroll;

      const rId = requestAnimationFrame(() => {
        if (container) {
          container.scrollLeft = targetScroll;
        }
        isRestoringScrollRef.current = false;
      });
      return () => cancelAnimationFrame(rId);
    }
  }, [data, loading]);

  // Fallback internal sort state if uncontrolled
  const [internalSortBy, setInternalSortBy] = useState<string | undefined>(undefined);
  const [internalSortOrder, setInternalSortOrder] = useState<'ASC' | 'DESC' | undefined>(undefined);

  const isControlled = typeof controlledOnSort === 'function';
  const currentSortBy = isControlled ? controlledSortBy : internalSortBy;
  const currentSortOrder = isControlled ? controlledSortOrder : internalSortOrder;

  const handleSortClick = (field: string) => {
    if (controlledOnSort) {
      controlledOnSort(field);
    } else {
      const isDescDefault = [
        'created_at',
        'confirmed_date',
        'loaded_date',
        'arrived_date',
        'purchase_date',
        'sell_date',
        'purchase_price',
        'sell_price',
        'net_yield',
      ].includes(field);

      const currentOrder = internalSortOrder?.toUpperCase();

      if (internalSortBy === field) {
        if (isDescDefault) {
          if (currentOrder === 'DESC') {
            setInternalSortOrder('ASC');
          } else {
            setInternalSortBy(undefined);
            setInternalSortOrder(undefined);
          }
        } else {
          if (currentOrder === 'ASC') {
            setInternalSortOrder('DESC');
          } else {
            setInternalSortBy(undefined);
            setInternalSortOrder(undefined);
          }
        }
      } else {
        setInternalSortBy(field);
        setInternalSortOrder(isDescDefault ? 'DESC' : 'ASC');
      }
    }
  };

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
      usdRmbRate?: number | null,
      additionalExpense?: number | null,
      additionalExpenseCurr?: string | null,
      internalLogisticsCost?: number | null,
      internalLogisticsCurrency?: string | null,
      itemNetYield?: any
    ) => {
      // If sell currency is USD and backend already provided exact calculated net yield USD, prioritize it
      if (
        sellCurr === 'USD' &&
        itemNetYield &&
        typeof itemNetYield === 'object' &&
        itemNetYield.amount_usd !== undefined
      ) {
        return Number(itemNetYield.amount_usd);
      }

      const currentRates = { ...rates };
      if (usdRmbRate && usdRmbRate > 0) {
        const usdInUzs = currentRates.USD || 12800;
        currentRates.RMB = usdInUzs / usdRmbRate;
      }

      const pRate = currentRates[purchaseCurr] || 1;
      const sRate = currentRates[sellCurr] || 1;

      let totalOutcomeInUzs = purchaseAmount * pRate;

      if (additionalExpense && additionalExpense > 0) {
        const aeRate = currentRates[additionalExpenseCurr || 'USD'] || 1;
        totalOutcomeInUzs += additionalExpense * aeRate;
      }

      if (internalLogisticsCost && internalLogisticsCost > 0) {
        const ilRate = currentRates[internalLogisticsCurrency || 'USD'] || 1;
        totalOutcomeInUzs += internalLogisticsCost * ilRate;
      }

      const outcomeInSellCurrency = totalOutcomeInUzs / sRate;
      return Math.round((sellAmount - outcomeInSellCurrency) * 100) / 100;
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

  const isInitialLoading = loading && (!data || !data.data || data.data.length === 0);
  const isRevalidating = loading && !!(data && data.data && data.data.length > 0);
  const rowCount = skeletonRowCount || (data?.meta?.limit ? Math.min(data.meta.limit, 10) : 10);

  return (
    <>
      <div className="rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm overflow-hidden min-w-0 max-w-full relative">
        {/* Sleek Scanning Beam during background revalidations & updates */}
        {isRevalidating && (
          <div className="absolute top-0 left-0 right-0 h-0.5 z-20 overflow-hidden bg-brand-gold/20">
            <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-brand-gold to-transparent animate-scan-bar shadow-[0_0_8px_rgba(200,169,106,0.6)]" />
          </div>
        )}

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="overflow-x-auto w-full min-w-0"
        >
          <table className="w-full text-left border-collapse table-fixed min-w-[2220px]">
            <colgroup>
              <col style={{ width: 220 }} /> {/* 1. Container / Truck ID */}
              <col style={{ width: 200 }} /> {/* 2. Cargo & Agent */}
              <col style={{ width: 170 }} /> {/* 3. Route Corridor */}
              <col style={{ width: 160 }} /> {/* 4. Client */}
              <col style={{ width: 160 }} /> {/* 5. Employee */}
              <col style={{ width: 150 }} /> {/* 6. Purchase Price */}
              <col style={{ width: 150 }} /> {/* 7. Sell Price */}
              <col style={{ width: 155 }} /> {/* 8. Net Yield */}
              <col style={{ width: 165 }} /> {/* 9. Confirmed Date */}
              <col style={{ width: 155 }} /> {/* 10. Loaded Date */}
              <col style={{ width: 160 }} /> {/* 11. Arrived Date */}
              <col style={{ width: 150 }} /> {/* 12. Created At */}
              <col style={{ width: 135 }} /> {/* 13. Status */}
              <col style={{ width: 140 }} /> {/* 14. Actions */}
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                <SortableHeader
                  label={t('colContainerNo')}
                  field="container_truck_id"
                  sortBy={currentSortBy}
                  sortOrder={currentSortOrder}
                  onSort={handleSortClick}
                  className="w-[220px] min-w-[220px] max-w-[220px]"
                />
                <SortableHeader
                  label={t('colCargoAndAgent')}
                  field="cargo"
                  sortBy={currentSortBy}
                  sortOrder={currentSortOrder}
                  onSort={handleSortClick}
                  className="w-[200px] min-w-[200px] max-w-[200px]"
                />
                <SortableHeader
                  label={t('colRoute') || 'Route'}
                  field="origin_city"
                  sortBy={currentSortBy}
                  sortOrder={currentSortOrder}
                  onSort={handleSortClick}
                  className="w-[170px] min-w-[170px] max-w-[170px]"
                />
                <SortableHeader
                  label={t('colClient')}
                  field="client_name"
                  sortBy={currentSortBy}
                  sortOrder={currentSortOrder}
                  onSort={handleSortClick}
                  className="w-[160px] min-w-[160px] max-w-[160px]"
                />
                <SortableHeader
                  label={t('colEmployee')}
                  field="employee_name"
                  sortBy={currentSortBy}
                  sortOrder={currentSortOrder}
                  onSort={handleSortClick}
                  className="w-[160px] min-w-[160px] max-w-[160px]"
                />
                <SortableHeader
                  label={t('colBuyPrice')}
                  field="purchase_price"
                  sortBy={currentSortBy}
                  sortOrder={currentSortOrder}
                  onSort={handleSortClick}
                  className="w-[150px] min-w-[150px] max-w-[150px]"
                />
                <SortableHeader
                  label={t('colSellPrice')}
                  field="sell_price"
                  sortBy={currentSortBy}
                  sortOrder={currentSortOrder}
                  onSort={handleSortClick}
                  className="w-[150px] min-w-[150px] max-w-[150px]"
                />
                <SortableHeader
                  label={t('colNetYield')}
                  field="net_yield"
                  sortBy={currentSortBy}
                  sortOrder={currentSortOrder}
                  onSort={handleSortClick}
                  className="w-[155px] min-w-[155px] max-w-[155px]"
                />
                <SortableHeader
                  label={t('colConfirmedDate')}
                  field="confirmed_date"
                  sortBy={currentSortBy}
                  sortOrder={currentSortOrder}
                  onSort={handleSortClick}
                  className="w-[165px] min-w-[165px] max-w-[165px]"
                />
                <SortableHeader
                  label={t('colLoadedDate')}
                  field="loaded_date"
                  sortBy={currentSortBy}
                  sortOrder={currentSortOrder}
                  onSort={handleSortClick}
                  className="w-[155px] min-w-[155px] max-w-[155px]"
                />
                <SortableHeader
                  label={t('colArrivedDate')}
                  field="arrived_date"
                  sortBy={currentSortBy}
                  sortOrder={currentSortOrder}
                  onSort={handleSortClick}
                  className="w-[160px] min-w-[160px] max-w-[160px]"
                />
                <SortableHeader
                  label={t('colCreatedAt')}
                  field="created_at"
                  sortBy={currentSortBy}
                  sortOrder={currentSortOrder}
                  onSort={handleSortClick}
                  className="w-[150px] min-w-[150px] max-w-[150px]"
                />
                <SortableHeader
                  label={t('colStatus')}
                  field="status"
                  sortBy={currentSortBy}
                  sortOrder={currentSortOrder}
                  onSort={handleSortClick}
                  className="w-[135px] min-w-[135px] max-w-[135px]"
                />
                <th className="py-3 px-4 text-right w-[140px] min-w-[140px] max-w-[140px] overflow-hidden">
                  <span className="truncate block font-bold" title={t('colActions')}>
                    {t('colActions')}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody
              className={`divide-y divide-border text-xs transition-opacity duration-200 ${
                isRevalidating ? 'opacity-65 pointer-events-none select-none' : 'opacity-100'
              }`}
            >
              {isInitialLoading ? (
                Array.from({ length: rowCount }).map((_, idx) => (
                  <CargoTableRowSkeleton key={`cargo-skel-${idx}`} index={idx} />
                ))
              ) : !data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-16 text-center text-muted-foreground">
                    <Box className="size-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-sm">
                      {emptyTitle || t('noCargoRegistrationsFound')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {emptySubtitle || t('noCargoRegistrationsDesc')}
                    </p>
                  </td>
                </tr>
              ) : (
                data.data.map((item) => {
                  const netYieldVal = getNetYield(
                    item.sell_price?.amount ?? 0,
                    item.sell_price?.currency || 'USD',
                    item.purchase_price?.amount ?? 0,
                    item.purchase_price?.currency || 'USD',
                    item.usd_rmb_rate,
                    item.additional_expense,
                    item.additional_expense_currency,
                    item.cargo_type === 'LTL' ? item.internal_logistics_cost : undefined,
                    item.cargo_type === 'LTL' ? item.internal_logistics_currency : undefined,
                    item.net_yield
                  );
                  const isPositive = netYieldVal > 0;
                  const isNegative = netYieldVal < 0;

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors h-[62px]">
                      {/* 1. Container / Truck ID (Resilient up to 50+ chars with quick copy) */}
                      <td className="py-3 px-3.5 font-bold text-foreground w-[220px] min-w-[220px] max-w-[220px] overflow-hidden">
                        <div className="flex items-center gap-1.5 w-full min-w-0">
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase shrink-0 ${
                              item.cargo_type === 'FTL'
                                ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {item.cargo_type || 'LTL'}
                          </span>
                          <div className="min-w-0 flex-1 flex items-center justify-between gap-1 group/track">
                            <div className="min-w-0 flex-1">
                              <span
                                className="font-mono text-xs font-bold text-foreground truncate select-all block"
                                title={item.container_truck_id}
                              >
                                {item.container_truck_id}
                              </span>
                              {item.consolidation?.consolidation_code && (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(
                                      item.consolidation!.consolidation_code
                                    );
                                    showNotification(
                                      t('copiedConsolidationCode', {
                                        code: item.consolidation!.consolidation_code,
                                      }) ||
                                        `Copied Consolidation Code: ${item.consolidation!.consolidation_code}`,
                                      'info'
                                    );
                                  }}
                                  className="text-[9px] font-mono font-bold text-brand-navy dark:text-brand-gold bg-brand-gold/15 hover:bg-brand-gold/25 px-1.5 py-0.5 rounded border border-brand-gold/30 truncate inline-block cursor-pointer transition-colors"
                                  title={
                                    item.consolidation.status
                                      ? `Consolidation: ${item.consolidation.consolidation_code} (${item.consolidation.status}) - Click to copy code`
                                      : `Consolidation: ${item.consolidation.consolidation_code} - Click to copy code`
                                  }
                                >
                                  🚚 {item.consolidation.consolidation_code}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(item.container_truck_id);
                                setCopiedId(item.id);
                                setTimeout(() => setCopiedId(null), 1500);
                                showNotification(
                                  t('copiedTrackIdNotification', {
                                    id: item.container_truck_id,
                                  }) || `Copied Track ID: ${item.container_truck_id}`,
                                  'info'
                                );
                              }}
                              className="opacity-0 group-hover/track:opacity-100 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all shrink-0 cursor-pointer"
                              title={t('copyTrackingIdTitle') || 'Copy full Tracking/Truck ID'}
                            >
                              {copiedId === item.id ? (
                                <Check className="size-3 text-emerald-500" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* 2. Cargo Description & Agent */}
                      <td className="py-3 px-3.5 w-[200px] min-w-[200px] max-w-[200px] overflow-hidden">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold text-foreground truncate" title={item.cargo}>
                            {item.cargo}
                          </span>
                          {item.is_turnkey && (
                            <span
                              className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 shrink-0"
                              title="Turnkey Delivery Service"
                            >
                              {t('turnkeyBadge') || 'Turnkey'}
                            </span>
                          )}
                        </div>
                        <div
                          className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5 mt-0.5"
                          title={item.agent_name}
                        >
                          <span className="truncate">{item.agent_name}</span>
                          {item.load_code && (
                            <span className="font-mono font-bold text-[9px] px-1 py-0.2 rounded bg-muted text-muted-foreground border border-border shrink-0">
                              {item.load_code}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Route Corridor */}
                      <td className="py-3 px-3.5 w-[170px] min-w-[170px] max-w-[170px] overflow-hidden">
                        <RouteBadge
                          originCity={item.origin_city || item.origin?.city}
                          originCountryCode={item.origin_country_code || item.origin?.country_code}
                          destinationCity={item.destination_city || item.destination?.city}
                          destinationCountryCode={
                            item.destination_country_code || item.destination?.country_code
                          }
                          googleMapsUrl={item.route?.google_maps_dir_url}
                          originLat={item.origin_lat || item.origin?.latitude}
                          originLng={item.origin_lng || item.origin?.longitude}
                          destLat={item.destination_lat || item.destination?.latitude}
                          destLng={item.destination_lng || item.destination?.longitude}
                        />
                      </td>

                      {/* 4. Client */}
                      <td className="py-3 px-3.5 text-foreground font-semibold w-[160px] min-w-[160px] max-w-[160px] overflow-hidden">
                        <div className="truncate" title={item.client_full_name || t('colClient')}>
                          {item.client_full_name || t('colClient')}
                        </div>
                      </td>

                      {/* 5. Employee */}
                      <td className="py-3 px-3.5 text-muted-foreground w-[160px] min-w-[160px] max-w-[160px] overflow-hidden">
                        <div
                          className="truncate"
                          title={item.employee_full_name || t('colEmployee')}
                        >
                          {item.employee_full_name || t('colEmployee')}
                        </div>
                      </td>

                      {/* 6. Purchase Price & Date */}
                      <td className="py-3 px-3.5 w-[150px] min-w-[150px] max-w-[150px] overflow-hidden">
                        <div className="font-semibold text-foreground truncate">
                          {formatMoney(
                            item.purchase_price?.amount || 0,
                            item.purchase_price?.currency || 'USD'
                          )}
                        </div>
                        {item.cargo_type === 'LTL' &&
                          item.internal_logistics_cost !== undefined &&
                          item.internal_logistics_cost !== null &&
                          item.internal_logistics_cost > 0 && (
                            <div
                              className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold truncate flex items-center gap-0.5"
                              title={`${t('internalLogisticsCost') || 'Internal Logistics'}: ${formatMoney(item.internal_logistics_cost, item.internal_logistics_currency || 'USD')}`}
                            >
                              <span>
                                🚚 +
                                {formatMoney(
                                  item.internal_logistics_cost,
                                  item.internal_logistics_currency || 'USD'
                                )}
                              </span>
                            </div>
                          )}
                        {item.additional_expense !== undefined &&
                          item.additional_expense !== null &&
                          item.additional_expense > 0 && (
                            <div
                              className="text-[10px] text-rose-500 font-semibold truncate flex items-center gap-0.5"
                              title={`${t('fieldAuxiliaryFees') || 'Additional Expense'}: ${formatMoney(item.additional_expense, item.additional_expense_currency || 'USD')}`}
                            >
                              <span>
                                +{' '}
                                {formatMoney(
                                  item.additional_expense,
                                  item.additional_expense_currency || 'USD'
                                )}
                              </span>
                            </div>
                          )}
                        <div className="text-[10px] text-muted-foreground font-medium truncate">
                          {t('lblDatePrefix')}{' '}
                          {formatDateDisplay(
                            item.purchase_price?.date || item.purchase_date,
                            locale
                          )}
                        </div>
                      </td>

                      {/* 6. Sell Price & Date */}
                      <td className="py-3 px-3.5 w-[150px] min-w-[150px] max-w-[150px] overflow-hidden">
                        <div className="font-semibold text-foreground truncate">
                          {formatMoney(
                            item.sell_price?.amount || 0,
                            item.sell_price?.currency || 'USD'
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-medium truncate">
                          {t('lblDatePrefix')}{' '}
                          {formatDateDisplay(item.sell_price?.date || item.sell_date, locale)}
                        </div>
                      </td>

                      {/* 7. Net Yield & Rate */}
                      <td className="py-3 px-3.5 font-extrabold w-[155px] min-w-[155px] max-w-[155px] overflow-hidden">
                        <div
                          className={`truncate ${
                            isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isNegative
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-foreground'
                          }`}
                        >
                          {formatMoney(netYieldVal, item.sell_price?.currency || 'USD')}
                        </div>
                        {item.net_yield?.amount_usd !== undefined &&
                          item.sell_price?.currency !== 'USD' && (
                            <div className="text-[10px] text-muted-foreground font-semibold truncate">
                              ≈ {formatMoney(item.net_yield.amount_usd, 'USD')}
                            </div>
                          )}
                      </td>

                      {/* 8. Confirmed Date */}
                      <td className="py-3 px-3.5 text-foreground font-medium text-[11px] w-[165px] min-w-[165px] max-w-[165px] overflow-hidden">
                        {item.confirmed_date ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 text-foreground border border-border/50 font-mono text-[11px] whitespace-nowrap">
                            <Calendar className="size-3 text-brand-gold shrink-0" />
                            <span className="truncate">
                              {formatDateDisplay(item.confirmed_date, locale)}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>

                      {/* 9. Loaded Date */}
                      <td className="py-3 px-3.5 text-foreground font-medium text-[11px] w-[155px] min-w-[155px] max-w-[155px] overflow-hidden">
                        {item.loaded_date ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 text-foreground border border-border/50 font-mono text-[11px] whitespace-nowrap">
                            <Calendar className="size-3 text-blue-500 shrink-0" />
                            <span className="truncate">
                              {formatDateDisplay(item.loaded_date, locale)}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>

                      {/* 10. Arrived Date */}
                      <td className="py-3 px-3.5 text-foreground font-medium text-[11px] w-[160px] min-w-[160px] max-w-[160px] overflow-hidden">
                        {item.arrived_date ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 text-foreground border border-border/50 font-mono text-[11px] whitespace-nowrap">
                            <Calendar className="size-3 text-emerald-500 shrink-0" />
                            <span className="truncate">
                              {formatDateDisplay(item.arrived_date, locale)}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>

                      {/* 11. Created At */}
                      <td className="py-3 px-3.5 text-foreground font-medium text-[11px] w-[150px] min-w-[150px] max-w-[150px] overflow-hidden">
                        {item.created_at ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 text-foreground border border-border/50 font-mono text-[11px] whitespace-nowrap">
                            <Calendar className="size-3 text-muted-foreground shrink-0" />
                            <span className="truncate">
                              {formatDateDisplay(item.created_at, locale)}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>

                      {/* 12. Status */}
                      <td className="py-3 px-3.5 w-[135px] min-w-[135px] max-w-[135px] overflow-hidden">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1 border truncate max-w-full ${
                            item.status === 'Arrived' || item.status === 'Delivered'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : item.status === 'On the way' || item.status === 'In Transit'
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                                : item.status === 'On the border' || item.status === 'Border'
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                  : item.status === 'Station' || item.status === 'At Station'
                                    ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                                    : item.status === 'Reload'
                                      ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
                                      : 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30'
                          }`}
                        >
                          <span className="truncate">{getStatusLabel(item.status)}</span>
                        </span>
                      </td>

                      {/* 13. Actions */}
                      <td className="py-3 px-4 text-right w-[140px] min-w-[140px] max-w-[140px] overflow-hidden">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewDetails(item.id)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title={t('btnViewDetails') || 'View Details'}
                          >
                            <Eye className="size-4" />
                          </button>
                          {canCreate('cargo_registrations') && onDuplicate && (
                            <button
                              onClick={() => onDuplicate(item)}
                              className="p-1.5 rounded-lg hover:bg-amber-500/15 text-muted-foreground hover:text-amber-500 transition-colors cursor-pointer"
                              title={t('btnDuplicateRegistration') || 'Duplicate Registration'}
                            >
                              <CopyPlus className="size-4" />
                            </button>
                          )}
                          {canUpdate('cargo_registrations') && onEdit && (
                            <button
                              onClick={() => onEdit(item)}
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-brand-gold transition-colors cursor-pointer"
                              title={t('btnEditRegistration') || 'Edit Registration'}
                            >
                              <Edit2 className="size-4" />
                            </button>
                          )}
                          {canDelete('cargo_registrations') && onDelete && (
                            <button
                              onClick={() => onDelete(item.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                              title={t('btnDeleteRegistration') || 'Delete Registration'}
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

        {/* Stable Pagination Footer */}
        {isInitialLoading ? (
          <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20 text-xs">
            <div className="h-4 w-48 rounded-md skeleton-shimmer" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-20 rounded-lg skeleton-shimmer" />
              <div className="h-4 w-16 rounded-md skeleton-shimmer mx-2" />
              <div className="h-8 w-16 rounded-lg skeleton-shimmer" />
            </div>
          </div>
        ) : data && data.meta.total > 0 ? (
          <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20 text-xs">
            <span className="text-muted-foreground font-semibold">
              {t('showingCargosPagination', {
                from: data.meta.offset + 1,
                to: Math.min(data.meta.offset + data.meta.limit, data.meta.total),
                total: data.meta.total,
              })}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => (typeof p === 'number' ? p - 1 : p))}
                className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="size-3.5" />
                <span>{t('pagPrev') || 'Previous'}</span>
              </button>
              <span className="font-bold text-foreground px-2">
                {t('pageNumber', { page }) || `Page ${page}`}
              </span>
              <button
                disabled={data.meta.offset + data.meta.limit >= data.meta.total || loading}
                onClick={() => setPage((p) => (typeof p === 'number' ? p + 1 : p))}
                className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>{t('pagNext') || 'Next'}</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* DETAILS READ-ONLY MODAL */}
      <CargoRegistrationDetailsModal
        isOpen={!!detailsItem}
        item={detailsItem}
        onClose={() => setDetailsItem(null)}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
      />
    </>
  );
}
