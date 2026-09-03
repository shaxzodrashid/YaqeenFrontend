import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Check,
  MapPin,
  ExternalLink,
  Navigation,
  Edit2,
  CopyPlus,
  Box,
  Truck,
  TrainFront,
  Plane,
  Ship,
  Package,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { usePermissions } from '../../context/PermissionsContext';
import { useNotification } from '../../context/NotificationContext';
import { formatMoney, getCountryFlag, getTransportTypeLabel } from '../../services/api';
import type {
  CargoRegistrationDetail,
  CargoRegistrationListItem,
  TransportType,
} from '../../services/api';

const TRANSPORT_TYPE_ICONS: Record<TransportType, React.ReactNode> = {
  auto: <Truck className="size-3.5" />,
  railway: <TrainFront className="size-3.5" />,
  air: <Plane className="size-3.5" />,
  sea: <Ship className="size-3.5" />,
  other: <Package className="size-3.5" />,
};

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

export interface CargoRegistrationDetailsModalProps {
  isOpen: boolean;
  item: CargoRegistrationDetail | CargoRegistrationListItem | null;
  onClose: () => void;
  onEdit?: (item: any) => void;
  onDuplicate?: (item: any) => void;
}

export const CargoRegistrationDetailsModal: React.FC<CargoRegistrationDetailsModalProps> = ({
  isOpen,
  item,
  onClose,
  onEdit,
  onDuplicate,
}) => {
  const { t, locale } = useTranslation();
  const { canCreate, canUpdate } = usePermissions();
  const { showNotification } = useNotification();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleCopy = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    showNotification(t('copiedToClipboard') || `${label || text} copied to clipboard`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Arrived':
      case 'Delivered':
        return t('statusArrived') || 'Arrived';
      case 'On the way':
      case 'In Transit':
        return t('statusOnTheWay') || 'On the way';
      case 'On the border':
      case 'Border':
        return t('statusOnTheBorder') || 'On the border';
      case 'Station':
      case 'At Station':
        return t('statusStation') || 'Station';
      case 'Reload':
        return t('statusReload') || 'Reload';
      case 'Waiting':
        return t('statusWaiting') || 'Waiting';
      default:
        return status;
    }
  };

  const containerId = (item as any).container_truck_id || (item as any).containerNo || '—';
  const cargoTitle = (item as any).cargo || (item as any).cargoType || '—';
  const clientName =
    item.client?.company_name ||
    (item.client?.first_name ? `${item.client.first_name} ${item.client.last_name || ''}` : '') ||
    (item as any).client_full_name ||
    (item as any).clientName ||
    '—';

  const employeeName =
    (item.employee?.first_name
      ? `${item.employee.first_name} ${item.employee.last_name || ''}`
      : '') ||
    (item as any).employee_full_name ||
    (item as any).employeeName ||
    '—';

  // Buy price extraction
  const buyAmount =
    (item as any).purchase_price?.amount !== undefined
      ? Number((item as any).purchase_price.amount)
      : typeof (item as any).purchase_price === 'number'
        ? Number((item as any).purchase_price)
        : Number((item as any).buyCost || 0);

  const buyCurrency =
    (item as any).purchase_price?.currency ||
    (item as any).purchase_currency ||
    (item as any).buyCostCurrency ||
    'USD';

  // Sell price extraction
  const sellAmount =
    (item as any).sell_price?.amount !== undefined
      ? Number((item as any).sell_price.amount)
      : typeof (item as any).sell_price === 'number'
        ? Number((item as any).sell_price)
        : Number((item as any).sellPrice || 0);

  const sellCurrency = (item as any).sell_price?.currency || (item as any).sell_currency || 'USD';

  // Net yield extraction
  const netUsd =
    (item as any).net_yield?.amount_usd !== undefined
      ? Number((item as any).net_yield.amount_usd)
      : (item as any).net_yield_details?.amount_usd !== undefined
        ? Number((item as any).net_yield_details.amount_usd)
        : typeof (item as any).net_yield === 'number'
          ? Number((item as any).net_yield)
          : (item as any).net_yield?.amount !== undefined
            ? Number((item as any).net_yield.amount)
            : Number((item as any).profit || 0);

  const netUzs =
    (item as any).net_yield?.amount_uzs !== undefined
      ? Number((item as any).net_yield.amount_uzs)
      : (item as any).net_yield_details?.amount_uzs;

  const originCity = item.origin_city || item.origin?.city || item.route?.origin || '';
  const originCountry = item.origin_country || item.origin?.country || '';
  const originCode = item.origin_country_code || item.origin?.country_code || '';
  const originLat = item.origin_lat || item.origin?.latitude;
  const originLng = item.origin_lng || item.origin?.longitude;

  const destCity = item.destination_city || item.destination?.city || item.route?.destination || '';
  const destCountry = item.destination_country || item.destination?.country || '';
  const destCode = item.destination_country_code || item.destination?.country_code || '';
  const destLat = item.destination_lat || item.destination?.latitude;
  const destLng = item.destination_lng || item.destination?.longitude;

  const googleMapsUrl = item.route?.google_maps_dir_url;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-brand-navy to-brand-royal text-white flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-brand-gold/20 text-brand-gold border border-brand-gold/30 shrink-0">
                <Box className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-white tracking-tight truncate font-mono">
                    {containerId}
                  </h3>
                  <button
                    onClick={() => handleCopy(containerId, t('colContainerNo') || 'Container ID')}
                    className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    title={t('btnCopyId') || 'Copy Container ID'}
                  >
                    {copiedId === containerId ? (
                      <Check className="size-3 text-emerald-400" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-neutral-300 truncate mt-0.5">{cargoTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
            {/* Status & Key Badges Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-muted/30 border border-border/60">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                  {getStatusLabel(item.status)}
                </span>
                {item.cargo_type && (
                  <span className="px-2 py-0.8 rounded-lg text-[11px] font-bold bg-muted text-foreground border border-border">
                    {item.cargo_type}
                  </span>
                )}
                {item.container_type && (
                  <span className="px-2 py-0.8 rounded-lg text-[11px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                    {item.container_type}
                  </span>
                )}
                {item.is_turnkey && (
                  <span className="px-2 py-0.8 rounded-lg text-[11px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                    <ShieldCheck className="size-3" />
                    <span>{t('turnkeyBadge') || 'Turnkey'}</span>
                  </span>
                )}
                {item.transport_types && item.transport_types.length > 0 && (
                  <div className="flex items-center gap-1">
                    {item.transport_types.map((tt) => (
                      <span
                        key={tt}
                        className="p-1 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                        title={getTransportTypeLabel(tt, t)}
                      >
                        {TRANSPORT_TYPE_ICONS[tt] || <Truck className="size-3" />}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {item.usd_rmb_rate && (
                <span className="font-mono text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.8 rounded-lg border border-amber-500/20">
                  FX: {item.usd_rmb_rate} RMB/USD
                </span>
              )}
            </div>

            {/* Logistics Route Corridor */}
            {(originCity || destCity) && (
              <div className="p-3.5 rounded-xl bg-muted/25 border border-border/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Navigation className="size-3.5 text-brand-gold" />
                    <span>{t('routeCorridorTitle') || 'Logistics Route Corridor'}</span>
                  </span>
                  {googleMapsUrl && (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-gold hover:underline"
                    >
                      <span>{t('openDirections') || 'Google Maps Route'}</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Origin */}
                  <div className="p-2.5 rounded-lg bg-surface border border-border/50 space-y-1">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <MapPin className="size-3 text-emerald-500" />
                      <span>{t('originLabel') || 'Origin'}</span>
                    </div>
                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5 truncate">
                      {originCode && <span className="text-sm">{getCountryFlag(originCode)}</span>}
                      <span className="truncate">{originCity || '—'}</span>
                    </div>
                    {originCountry && (
                      <div className="text-[10px] text-muted-foreground truncate">
                        {originCountry}
                      </div>
                    )}
                    {originLat && originLng && (
                      <div className="text-[9px] font-mono text-muted-foreground">
                        {originLat}, {originLng}
                      </div>
                    )}
                  </div>

                  {/* Destination */}
                  <div className="p-2.5 rounded-lg bg-surface border border-border/50 space-y-1">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <MapPin className="size-3 text-rose-500" />
                      <span>{t('destinationLabel') || 'Destination'}</span>
                    </div>
                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5 truncate">
                      {destCode && <span className="text-sm">{getCountryFlag(destCode)}</span>}
                      <span className="truncate">{destCity || '—'}</span>
                    </div>
                    {destCountry && (
                      <div className="text-[10px] text-muted-foreground truncate">
                        {destCountry}
                      </div>
                    )}
                    {destLat && destLng && (
                      <div className="text-[9px] font-mono text-muted-foreground">
                        {destLat}, {destLng}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Stakeholders & General Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Client & Employee */}
              <div className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-2">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-semibold">{t('colClient')}:</span>
                  <span
                    className="font-bold text-foreground truncate max-w-[170px]"
                    title={clientName}
                  >
                    {clientName}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-semibold">
                    {t('assignedEmployeeLabel') || 'Employee'}:
                  </span>
                  <span
                    className="font-bold text-foreground truncate max-w-[170px]"
                    title={employeeName}
                  >
                    {employeeName}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground font-semibold">{t('colAgentName')}:</span>
                  <span className="font-semibold text-foreground truncate max-w-[170px]">
                    {item.agent_name || (item as any).agentName || '—'}
                  </span>
                </div>
              </div>

              {/* Volume, Weight, Load Code */}
              <div className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-2">
                {(item.volume !== null && item.volume !== undefined) ||
                (item.weight !== null && item.weight !== undefined) ? (
                  <>
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground font-semibold">
                        {t('cargoVolume')}:
                      </span>
                      <span className="font-semibold text-foreground">
                        {item.volume ? `${item.volume} m³` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground font-semibold">
                        {t('cargoWeight')}:
                      </span>
                      <span className="font-semibold text-foreground">
                        {item.weight ? `${item.weight} kg` : '—'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground font-semibold">
                      {t('containerTypeLabel')}:
                    </span>
                    <span className="font-semibold text-foreground">
                      {item.container_type || t('generalContainer') || 'General Container'}
                    </span>
                  </div>
                )}

                {item.load_code && (
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground font-semibold">
                      {t('loadCode') || 'Load Code'}:
                    </span>
                    <span className="font-mono font-bold text-foreground">{item.load_code}</span>
                  </div>
                )}

                {item.container_truck_id && (
                  <div className="flex justify-between py-1 border-t border-border/40 pt-1.5">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1">
                      <Truck className="size-3.5 text-brand-navy dark:text-brand-gold shrink-0" />
                      {t('containerTruckIdLabel') || 'Truck / Container'}:
                    </span>
                    <span className="font-mono font-bold text-brand-navy dark:text-brand-gold">
                      {item.container_truck_id}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Milestone & Lifecycle Dates */}
            <div className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-1.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                {t('lblMilestoneDates')}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-surface border border-border/40 space-y-0.5">
                  <span className="text-muted-foreground block">{t('colConfirmed')}:</span>
                  <span className="font-bold text-foreground block truncate">
                    {formatDateDisplay(
                      (item as any).confirmed_date || (item as any).confirmedDate,
                      locale
                    )}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-surface border border-border/40 space-y-0.5">
                  <span className="text-muted-foreground block">{t('colLoaded')}:</span>
                  <span className="font-bold text-foreground block truncate">
                    {formatDateDisplay(
                      (item as any).loaded_date || (item as any).loadedDate,
                      locale
                    )}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-surface border border-border/40 space-y-0.5">
                  <span className="text-muted-foreground block">{t('colArrived')}:</span>
                  <span className="font-bold text-emerald-500 block truncate">
                    {formatDateDisplay(
                      (item as any).arrived_date || (item as any).arrivedDate,
                      locale
                    )}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-surface border border-border/40 space-y-0.5">
                  <span className="text-muted-foreground block">{t('colCreatedAt')}:</span>
                  <span className="font-bold text-foreground block truncate">
                    {formatDateDisplay(item.created_at, locale)}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Ledger Breakdown */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Buy Cost */}
                <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-semibold">{t('colBuyPrice')}:</span>
                    <span className="font-bold text-foreground font-mono">
                      {formatMoney(buyAmount, buyCurrency)}
                    </span>
                  </div>
                  {(item as any).purchase_date && (
                    <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                      <span>{t('purchaseRegDate')}</span>
                      <span className="font-semibold text-foreground">
                        {formatDateDisplay((item as any).purchase_date, locale)}
                      </span>
                    </div>
                  )}
                  {(item as any).purchase_amount_usd !== undefined &&
                    (item as any).purchase_amount_usd !== null && (
                      <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                        <span>{t('lblEquivalentsUsdUzs')}</span>
                        <span className="font-semibold text-foreground font-mono">
                          {formatMoney((item as any).purchase_amount_usd, 'USD')}
                        </span>
                      </div>
                    )}
                </div>

                {/* Sell Price */}
                <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-semibold">
                      {t('colSellPrice')}:
                    </span>
                    <span className="font-bold text-foreground font-mono">
                      {formatMoney(sellAmount, sellCurrency)}
                    </span>
                  </div>
                  {(item as any).sell_date && (
                    <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                      <span>{t('sellRegDate')}</span>
                      <span className="font-semibold text-foreground">
                        {formatDateDisplay((item as any).sell_date, locale)}
                      </span>
                    </div>
                  )}
                  {(item as any).sell_amount_usd !== undefined &&
                    (item as any).sell_amount_usd !== null && (
                      <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                        <span>{t('lblEquivalentsUsdUzs')}</span>
                        <span className="font-semibold text-foreground font-mono">
                          {formatMoney((item as any).sell_amount_usd, 'USD')}
                        </span>
                      </div>
                    )}
                </div>
              </div>

              {/* Net Yield & Profit Margin */}
              <div
                className={`p-3.5 rounded-xl border space-y-1.5 ${
                  netUsd >= 0
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span
                    className={`font-bold ${
                      netUsd >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {t('lblCalculatedNetYield')}:
                  </span>
                  <span
                    className={`font-black text-base font-mono ${
                      netUsd >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {formatMoney(netUsd, 'USD')}
                  </span>
                </div>
                {netUzs !== undefined && netUzs !== null && (
                  <div className="flex justify-between items-center text-[11px] text-muted-foreground font-mono">
                    <span>{t('lblUzsEquivalent')}</span>
                    <span
                      className={`font-semibold ${
                        netUsd >= 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {formatMoney(netUzs, 'UZS')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes / Description */}
            {item.description && (
              <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  {t('lblNotes')}
                </span>
                <p className="text-foreground font-medium whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              {canCreate('cargo_registrations') && onDuplicate && (
                <button
                  onClick={() => {
                    const target = item;
                    onClose();
                    onDuplicate(target);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-colors font-bold text-xs cursor-pointer"
                  title={t('btnDuplicateRegistration') || 'Duplicate Registration'}
                >
                  <CopyPlus className="size-3.5" />
                  <span>{t('actionDuplicate') || 'Duplicate'}</span>
                </button>
              )}
              {canUpdate('cargo_registrations') && onEdit && (
                <button
                  onClick={() => {
                    const target = item;
                    onClose();
                    onEdit(target);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors font-bold text-xs cursor-pointer"
                  title={t('btnEditRegistration') || 'Edit Registration'}
                >
                  <Edit2 className="size-3.5" />
                  <span>{t('actionEdit') || 'Edit'}</span>
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs cursor-pointer"
            >
              {t('actionClose') || 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
