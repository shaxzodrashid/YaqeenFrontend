import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Truck,
  MapPin,
  DollarSign,
  Loader2,
  Phone,
  Boxes,
  Package,
  Edit2,
  Trash2,
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  CheckCircle2,
  Clock,
  Shield,
  Repeat,
  FileText,
  Receipt,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { usePermissions } from '../../context/PermissionsContext';
import {
  cargoConsolidationsApi,
  getConsolidatedNetMargin,
  getConsolidatedNetMarginCurrency,
  getCarrierCostAmount,
  getCarrierCostCurrency,
  getCarrierCostUsd,
  getTotalConsolidationExpensesUsd,
  getTotalConsolidationIncomeUsd,
} from '../../services/cargoConsolidations.service';
import type {
  ConsolidationListItem,
  ConsolidationStatus,
} from '../../services/cargoConsolidations.service';
import { formatMoney, getCountryFlag } from '../../services/api';
import { DeletionApprovalModal } from '../ui/DeletionApprovalModal';
import { cargoRegistrationsApi } from '../../services/cargoRegistrations.service';

const STATUS_ORDER: ConsolidationStatus[] = [
  'Waiting',
  'Station',
  'On the way',
  'On the border',
  'Reload',
  'Arrived',
];

const STATUS_CONFIG: Record<
  ConsolidationStatus,
  { bg: string; text: string; border: string; activeClass: string; icon: React.ReactNode }
> = {
  Waiting: {
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-500/30',
    activeClass: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/50',
    icon: <Clock className="size-3.5" />,
  },
  Station: {
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/30',
    activeClass: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/50',
    icon: <MapPin className="size-3.5" />,
  },
  'On the way': {
    bg: 'bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
    activeClass: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/50',
    icon: <Truck className="size-3.5" />,
  },
  'On the border': {
    bg: 'bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
    activeClass: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/50',
    icon: <Shield className="size-3.5" />,
  },
  Reload: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/30',
    activeClass: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/50',
    icon: <Repeat className="size-3.5" />,
  },
  Arrived: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    activeClass: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/50',
    icon: <CheckCircle2 className="size-3.5" />,
  },
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

export interface ConsolidationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  consolidation: ConsolidationListItem | null;
  isLoadingDetails?: boolean;
  onEdit: (item: ConsolidationListItem) => void;
  onDelete: (id: string) => void;
  onAssignCargos: (item: ConsolidationListItem) => void;
  onAddLtlCargo?: (item: ConsolidationListItem) => void;
  onEditCargo?: (cargoId: string, consolidation: ConsolidationListItem) => void;
  onUpdate: (updated: ConsolidationListItem) => void;
}

export function ConsolidationDetailsModal({
  isOpen,
  onClose,
  consolidation,
  isLoadingDetails,
  onEdit,
  onDelete,
  onAssignCargos,
  onAddLtlCargo,
  onEditCargo,
  onUpdate,
}: ConsolidationDetailsModalProps) {
  const { t, locale } = useTranslation();
  const { showNotification } = useNotification();
  const { canUpdate, canDelete, canAssignCargo } = usePermissions();

  const [advancingStatus, setAdvancingStatus] = useState<boolean>(false);
  const [removingCargoId, setRemovingCargoId] = useState<string | null>(null);
  const [pendingDeleteCargo, setPendingDeleteCargo] = useState<{ id: string; name: string } | null>(
    null
  );

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Arrived':
        return t('statusArrived') || status;
      case 'On the way':
        return t('statusOnTheWay') || status;
      case 'On the border':
        return t('statusOnTheBorder') || status;
      case 'Station':
        return t('statusStation') || status;
      case 'Reload':
        return t('statusReload') || status;
      case 'Waiting':
        return t('statusWaiting') || status;
      default:
        return status;
    }
  };

  if (!isOpen) return null;

  // Render centered loading modal while details are being fetched
  if (isLoadingDetails || !consolidation) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-surface border border-border shadow-2xl flex flex-col items-center justify-center gap-4 text-center"
          >
            <Loader2 className="size-10 animate-spin text-brand-gold" />
            <div>
              <p className="text-sm font-bold text-foreground">
                {t('loadingConsolidationDetails') || 'Loading consolidation details...'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Fetching trip and cargo package metrics
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  const currentStatusIndex = STATUS_ORDER.indexOf(consolidation.status);
  const statusCfg = STATUS_CONFIG[consolidation.status] || STATUS_CONFIG.Waiting;

  // Fast Advance Status helper
  const handleAdvanceStatus = async (nextStatus: ConsolidationStatus) => {
    if (!canUpdate('cargo_consolidations')) {
      showNotification('Permission denied: cannot update status', 'error');
      return;
    }
    setAdvancingStatus(true);
    try {
      const updated = await cargoConsolidationsApi.update(consolidation.id, {
        status: nextStatus,
        sync_status_to_cargos: true,
      });
      showNotification(
        `Trip status updated to "${nextStatus}" and synced to attached cargos`,
        'success'
      );
      onUpdate(updated);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update status', 'error');
    } finally {
      setAdvancingStatus(false);
    }
  };

  // Delete single cargo from consolidation
  const handleRequestDeleteCargo = (cargoId: string, cargoName: string) => {
    if (!canDelete('cargo_registrations')) {
      showNotification('Permission denied: cannot delete cargos', 'error');
      return;
    }
    setPendingDeleteCargo({ id: cargoId, name: cargoName });
  };

  const handleConfirmDeleteCargo = async () => {
    if (!pendingDeleteCargo) return;
    const cargoId = pendingDeleteCargo.id;
    setRemovingCargoId(cargoId);
    try {
      await cargoRegistrationsApi.delete(cargoId);
      showNotification(t('deletedSuccessfully') || 'Cargo permanently deleted', 'success');
      try {
        const refreshed = await cargoConsolidationsApi.get(consolidation.id);
        onUpdate(refreshed);
      } catch {
        const updatedCargos = (consolidation.cargos || []).filter((c) => c.id !== cargoId);
        onUpdate({ ...consolidation, cargos: updatedCargos } as ConsolidationListItem);
      }
      setPendingDeleteCargo(null);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete cargo', 'error');
    } finally {
      setRemovingCargoId(null);
    }
  };

  const netMargin = getConsolidatedNetMargin(consolidation.financials);
  const netMarginCurrency = getConsolidatedNetMarginCurrency(consolidation.financials);
  const isNetMarginPositive = netMargin >= 0;
  const carrierCostUsd = getCarrierCostUsd(consolidation.financials);
  const carrierCostAmount = getCarrierCostAmount(consolidation.financials);
  const carrierCostCurrency = getCarrierCostCurrency(consolidation.financials);

  const volUtil = consolidation.capacity?.volume_utilization_percent ?? 0;
  const wtUtil = consolidation.capacity?.weight_utilization_percent ?? 0;
  const totalCargos =
    consolidation.cargos?.length ?? consolidation.capacity?.total_cargos_count ?? 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <div className="fixed inset-0" onClick={onClose} />

        {/* Centered Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-3xl max-h-[90vh] rounded-3xl bg-surface border border-border shadow-2xl overflow-hidden my-auto flex flex-col"
        >
          {/* Top Header */}
          <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-brand-navy via-brand-navy to-brand-royal text-white flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-2xl bg-brand-gold/20 text-brand-gold border border-brand-gold/30 shadow-md shrink-0">
                <Truck className="size-5 sm:size-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-mono font-extrabold text-white tracking-tight truncate">
                    {consolidation.container_truck_id || '—'}
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold font-mono font-bold border border-brand-gold/40">
                    {consolidation.consolidation_code}
                  </span>
                  {consolidation.container_type && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 text-neutral-200 font-bold">
                      {consolidation.container_type}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-300 truncate mt-0.5">
                  {t('consolidationTitle') || 'Consolidation Trip'} • {t('colCreatedAt')}{' '}
                  {formatDateDisplay(consolidation.created_at, locale)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2">
              {canUpdate('cargo_consolidations') && (
                <button
                  type="button"
                  onClick={() => onEdit(consolidation)}
                  className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title={t('btnEditRegistration') || 'Edit consolidation'}
                >
                  <Edit2 className="size-4" />
                </button>
              )}
              {canDelete('cargo_consolidations') && (
                <button
                  type="button"
                  onClick={() => onDelete(consolidation.id)}
                  className="p-2 rounded-xl text-neutral-300 hover:text-red-400 hover:bg-white/10 transition-colors cursor-pointer"
                  title={t('btnDeleteRegistration') || 'Delete consolidation'}
                >
                  <Trash2 className="size-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-1"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Modal Body Scroll Area */}
          <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
            {/* Status Lifecycle Stepper Strip */}
            <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  {t('colStatus') || 'Lifecycle Status'}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border uppercase tracking-wider ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                >
                  {getStatusLabel(consolidation.status)}
                </span>
              </div>

              {/* Status Buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {STATUS_ORDER.map((st, idx) => {
                  const isCurrent = st === consolidation.status;
                  const isPassed = idx < currentStatusIndex;
                  return (
                    <button
                      key={st}
                      type="button"
                      disabled={!canUpdate('cargo_consolidations') || advancingStatus || isCurrent}
                      onClick={() => handleAdvanceStatus(st)}
                      className={`px-2 py-1.5 rounded-xl text-[11px] font-bold text-center transition-all border select-none truncate ${
                        !canUpdate('cargo_consolidations')
                          ? 'opacity-50 cursor-not-allowed bg-surface text-muted-foreground border-border/40'
                          : isCurrent
                            ? 'bg-brand-navy dark:bg-brand-gold text-white dark:text-brand-navy border-transparent shadow-sm cursor-default font-extrabold'
                            : isPassed
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer'
                              : 'bg-surface text-muted-foreground hover:text-foreground border-border/60 hover:border-border cursor-pointer'
                      }`}
                      title={
                        isCurrent
                          ? getStatusLabel(st)
                          : `${t('setTripStatus')} ${getStatusLabel(st)}`
                      }
                    >
                      {getStatusLabel(st)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2-Column Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Card 1: Route & Timetable */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/70 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <MapPin className="size-4 text-brand-royal shrink-0" />
                    <span>{t('routeAndDates') || 'Route & Dates'}</span>
                  </div>
                  {consolidation.route?.google_maps_dir_url && (
                    <a
                      href={consolidation.route.google_maps_dir_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-navy dark:text-brand-gold hover:underline"
                    >
                      <span>{t('openDirections') || 'Directions'}</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>

                {/* Corridor */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-border/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1 truncate">
                      <span>
                        {getCountryFlag(
                          consolidation.origin_country_code || consolidation.origin?.country_code
                        )}
                      </span>
                      <span>{consolidation.origin_place || t('originLabel') || 'Origin'}</span>
                    </span>
                    <ArrowRight className="size-3.5 text-brand-gold shrink-0" />
                    <span className="font-bold text-xs text-foreground flex items-center gap-1 truncate">
                      <span>
                        {getCountryFlag(
                          consolidation.destination_country_code ||
                            consolidation.destination?.country_code
                        )}
                      </span>
                      <span>
                        {consolidation.destination_place || t('destinationLabel') || 'Destination'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Milestone Dates Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-surface border border-border/60">
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {t('colDeparture') || 'Departure'}
                    </span>
                    <span className="font-bold text-foreground truncate block">
                      {formatDateDisplay(consolidation.departure_date, locale)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-surface border border-border/60">
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {t('colLoaded') || 'Loaded'}
                    </span>
                    <span className="font-bold text-foreground truncate block">
                      {formatDateDisplay(
                        consolidation.loaded_date || consolidation.load_date,
                        locale
                      )}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-surface border border-border/60">
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {t('borderArrivalDate') || 'Border Arrival'}
                    </span>
                    <span className="font-bold text-foreground truncate block">
                      {formatDateDisplay(consolidation.border_arrival_date, locale)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-surface border border-border/60">
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {t('tashkentArrivalDate') || 'Tashkent Arrival'}
                    </span>
                    <span className="font-bold text-foreground truncate block">
                      {formatDateDisplay(consolidation.tashkent_arrival_date, locale)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-surface border border-border/60">
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {t('estimatedArrival') || 'Est. Arrival'}
                    </span>
                    <span className="font-bold text-foreground truncate block">
                      {formatDateDisplay(consolidation.estimated_arrival_date, locale)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-surface border border-border/60">
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {t('colArrived') || 'Actual Arrival'}
                    </span>
                    <span className="font-bold text-foreground truncate block">
                      {formatDateDisplay(consolidation.arrived_date, locale)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Capacity & Payload */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/70 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Boxes className="size-4 text-brand-gold shrink-0" />
                    <span>{t('capacityUtilization') || 'Capacity Utilization'}</span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground font-mono">
                    {totalCargos} {t('colCargosCount') || 'pkg(s)'}
                  </span>
                </div>

                {/* Volume Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-muted-foreground">
                      {t('volumeLabel') || 'Volume'}
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {consolidation.capacity?.assigned_volume_m3 ?? 0} /{' '}
                      {consolidation.capacity?.max_volume_m3 ?? 86} m³{' '}
                      <span className="text-muted-foreground font-normal">({volUtil}%)</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        volUtil > 90
                          ? 'bg-red-500'
                          : volUtil > 70
                            ? 'bg-amber-500'
                            : 'bg-brand-royal'
                      }`}
                      style={{ width: `${Math.min(100, volUtil)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono text-right">
                    {consolidation.capacity?.remaining_volume_m3 ?? 0} m³ {t('free') || 'free'}
                  </div>
                </div>

                {/* Weight Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-muted-foreground">
                      {t('weightLabel') || 'Weight'}
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {(consolidation.capacity?.assigned_weight_kg ?? 0).toLocaleString()} /{' '}
                      {(consolidation.capacity?.max_weight_kg ?? 22000).toLocaleString()} kg{' '}
                      <span className="text-muted-foreground font-normal">({wtUtil}%)</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        wtUtil > 90 ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, wtUtil)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono text-right">
                    {(consolidation.capacity?.remaining_weight_kg ?? 0).toLocaleString()} kg{' '}
                    {t('free') || 'payload free'}
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Summary & Operational Expenses Breakdown Card */}
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/70 space-y-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <DollarSign className="size-4 text-emerald-500 shrink-0" />
                  <span>
                    {t('financialBreakdownTitle') || 'Financial Breakdown & Operational Expenses'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs font-extrabold">
                  <span className="text-muted-foreground">{t('netMargin') || 'Net Margin'}:</span>
                  <span
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg ${
                      isNetMarginPositive
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                    }`}
                  >
                    {isNetMarginPositive ? (
                      <TrendingUp className="size-3.5" />
                    ) : (
                      <TrendingDown className="size-3.5" />
                    )}
                    {formatMoney(netMargin, netMarginCurrency)}
                  </span>
                </div>
              </div>

              {/* Main Financial Totals & Carrier */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-surface border border-border/60">
                  <span className="text-[10px] text-muted-foreground block">
                    {t('totalClientSell') || 'Client Income (Sell)'}
                  </span>
                  <span className="font-mono text-xs font-extrabold text-foreground">
                    {formatMoney(getTotalConsolidationIncomeUsd(consolidation.financials), 'USD')}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-border/60">
                  <span className="text-[10px] text-muted-foreground block">
                    {t('totalExpenses') || 'Total Operational Outlay'}
                  </span>
                  <span className="font-mono text-xs font-extrabold text-foreground">
                    {formatMoney(getTotalConsolidationExpensesUsd(consolidation.financials), 'USD')}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-border/60 flex items-center justify-between">
                  <div className="min-w-0 pr-1">
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {t('colCarrier') || 'Carrier'}
                    </span>
                    <span className="font-bold text-xs text-foreground block truncate">
                      {consolidation.carrier_name || t('notAssigned') || 'Not assigned'}
                    </span>
                  </div>
                  {consolidation.carrier_phone && (
                    <a
                      href={`tel:${consolidation.carrier_phone}`}
                      className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition-colors shrink-0"
                      title={`${t('call')} ${consolidation.carrier_phone}`}
                    >
                      <Phone className="size-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* 3 Expense Categories Detail */}
              <div className="space-y-2 pt-1 border-t border-border/50">
                <span className="text-[11px] font-bold text-foreground block">
                  {t('operationalCostBreakdown') || 'Expense Line Items (3 categories)'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {/* 1. Agent */}
                  <div className="p-2 rounded-xl bg-surface/80 border border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Truck className="size-3.5 text-brand-navy dark:text-brand-gold shrink-0" />
                      <span className="text-[11px] font-medium text-muted-foreground truncate">
                        {t('agentFreightTitle') || 'Agent / Line-haul'}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-foreground shrink-0 ml-1">
                      {formatMoney(
                        consolidation.financials?.expenses?.agent?.amount ??
                          consolidation.agent ??
                          carrierCostAmount ??
                          carrierCostUsd,
                        consolidation.financials?.expenses?.agent?.currency ??
                          consolidation.agent_currency ??
                          carrierCostCurrency
                      )}
                    </span>
                  </div>

                  {/* 2. Customs Clearance */}
                  <div className="p-2 rounded-xl bg-surface/80 border border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Shield className="size-3.5 text-emerald-500 shrink-0" />
                      <span className="text-[11px] font-medium text-muted-foreground truncate">
                        {t('customsClearanceTitle') || 'Customs Clearance'}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-foreground shrink-0 ml-1">
                      {formatMoney(
                        consolidation.financials?.expenses?.customs_clearance_of_goods?.amount ??
                          consolidation.customs_clearance_of_goods ??
                          0,
                        consolidation.financials?.expenses?.customs_clearance_of_goods?.currency ??
                          consolidation.customs_clearance_of_goods_currency ??
                          'USD'
                      )}
                    </span>
                  </div>

                  {/* 3. CCT */}
                  <div className="p-2 rounded-xl bg-surface/80 border border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Receipt className="size-3.5 text-purple-500 shrink-0" />
                      <span className="text-[11px] font-medium text-muted-foreground truncate">
                        {t('cctCertTitle') || 'CCT / Certificate'}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-foreground shrink-0 ml-1">
                      {formatMoney(
                        consolidation.financials?.expenses?.cct?.amount ?? consolidation.cct ?? 0,
                        consolidation.financials?.expenses?.cct?.currency ??
                          consolidation.cct_currency ??
                          'USD'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Notes (if any) */}
            {consolidation.description && (
              <div className="p-3 rounded-2xl bg-muted/15 border border-border/60 text-xs text-muted-foreground flex items-start gap-2">
                <FileText className="size-4 text-brand-gold shrink-0 mt-0.5" />
                <p className="line-clamp-2">{consolidation.description}</p>
              </div>
            )}

            {/* Attached Client Packages Section */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Package className="size-4 text-brand-gold shrink-0" />
                  <span>
                    {t('attachedCargos') || 'Attached Client Cargos'} (
                    {(consolidation.cargos || []).length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {onAddLtlCargo && (
                    <button
                      type="button"
                      onClick={() => onAddLtlCargo(consolidation)}
                      className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                      <span>{t('btnRegisterLtlCargo') || '+ Add Cargo'}</span>
                    </button>
                  )}
                  {canAssignCargo() && (
                    <button
                      type="button"
                      onClick={() => onAssignCargos(consolidation)}
                      className="px-2.5 py-1 rounded-xl bg-brand-gold/20 text-brand-navy dark:text-brand-gold border border-brand-gold/40 text-xs font-bold hover:bg-brand-gold/30 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Boxes className="size-3.5" />
                      <span>{t('packCargosBtn') || 'Pack Cargos'}</span>
                    </button>
                  )}
                </div>
              </div>

              {!consolidation.cargos || consolidation.cargos.length === 0 ? (
                <div className="py-6 text-center p-4 rounded-2xl border border-dashed border-border bg-muted/10 text-muted-foreground space-y-2">
                  <Package className="size-6 mx-auto opacity-40 text-brand-gold" />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {t('noAttachedCargos') || 'No client cargos attached yet'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {t('attachCargosTip') ||
                        'Attach existing unassigned cargos or register a new LTL load directly.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {consolidation.cargos.map((cargo) => (
                    <div
                      key={cargo.id}
                      className="p-3 rounded-2xl bg-surface border border-border/80 flex items-center justify-between gap-3 hover:border-border transition-all"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-foreground truncate">
                            {cargo.cargo}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold">
                            {cargo.container_truck_id}
                          </span>
                          {cargo.load_code && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-gold/15 text-brand-navy dark:text-brand-gold font-bold border border-brand-gold/30">
                              {cargo.load_code}
                            </span>
                          )}
                          {cargo.is_turnkey && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                              {t('turnkeyBadge') || 'Turnkey'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                          {cargo.client?.name && (
                            <span>
                              {t('colClient')}: {cargo.client.name}
                            </span>
                          )}
                          {cargo.employee?.name && (
                            <span>
                              {t('colEmployee')}: {cargo.employee.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="text-right font-mono">
                          <span className="text-xs font-extrabold text-foreground block">
                            {cargo.volume || 0} m³ / {(cargo.weight || 0).toLocaleString()} kg
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                            +
                            {formatMoney(
                              typeof cargo.sell_price === 'object'
                                ? (cargo.sell_price.amount ?? cargo.sell_price.amount_usd ?? 0)
                                : Number(cargo.sell_price) || 0,
                              typeof cargo.sell_price === 'object'
                                ? cargo.sell_price.currency || 'USD'
                                : 'USD'
                            )}
                          </span>
                        </div>

                        {onEditCargo && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditCargo(cargo.id, consolidation);
                            }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-brand-royal hover:bg-brand-royal/10 transition-colors cursor-pointer"
                            title={t('btnEditRegistration') || 'Edit cargo'}
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                        )}
                        {canDelete('cargo_registrations') && (
                          <button
                            type="button"
                            disabled={removingCargoId === cargo.id}
                            onClick={() => handleRequestDeleteCargo(cargo.id, cargo.cargo)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title={t('btnDeleteRegistration') || 'Delete cargo'}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Delete cargo confirmation modal */}
      <DeletionApprovalModal
        isOpen={!!pendingDeleteCargo}
        onClose={() => !removingCargoId && setPendingDeleteCargo(null)}
        onConfirm={handleConfirmDeleteCargo}
        isBusy={!!removingCargoId}
        variant="danger"
        title={t('confirmDeleteCargo') || 'Delete Cargo Registration'}
        description={
          pendingDeleteCargo
            ? `Are you sure you want to delete "${pendingDeleteCargo.name}" from truck ${consolidation.container_truck_id} [${consolidation.consolidation_code}]?`
            : 'Delete Cargo Registration'
        }
        confirmLabel={t('actionDelete') || 'Delete Permanently'}
        cancelLabel={t('actionCancel') || 'Cancel'}
        entityPreview={
          pendingDeleteCargo ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-foreground">{pendingDeleteCargo.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {consolidation.container_truck_id} [{consolidation.consolidation_code}]
                </div>
              </div>
              <span className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-[11px] font-bold">
                {t('permanent') || 'Permanent'}
              </span>
            </div>
          ) : undefined
        }
        consequences={[
          t('deleteModalWarningLine1') ||
            'This cargo registration will be permanently deleted from the system',
          t('deleteConsolidationConsequence2') ||
            'Consolidation capacity and financials will be recalculated',
        ]}
      />
    </AnimatePresence>
  );
}

// Backward-compatible alias
export { ConsolidationDetailsModal as ConsolidationDetailsDrawer };
