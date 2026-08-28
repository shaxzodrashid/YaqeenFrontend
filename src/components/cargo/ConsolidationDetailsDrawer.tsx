import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Truck,
  MapPin,
  DollarSign,
  Phone,
  User,
  Boxes,
  Package,
  Edit2,
  Trash2,
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ExternalLink,
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
} from '../../services/cargoConsolidations.service';
import type {
  ConsolidationListItem,
  ConsolidationStatus,
} from '../../services/cargoConsolidations.service';
import { formatMoney, getCountryFlag } from '../../services/api';
import { DeletionApprovalModal } from '../ui/DeletionApprovalModal';

const STATUS_ORDER: ConsolidationStatus[] = [
  'Waiting',
  'Station',
  'On the way',
  'On the border',
  'Reload',
  'Arrived',
];

const STATUS_BADGES: Record<ConsolidationStatus, { bg: string; text: string; border: string }> = {
  Waiting: {
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-500/30',
  },
  Station: {
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/30',
  },
  'On the way': {
    bg: 'bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
  },
  'On the border': {
    bg: 'bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
  },
  Reload: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/30',
  },
  Arrived: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
  },
};

export interface ConsolidationDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  consolidation: ConsolidationListItem | null;
  onEdit: (item: ConsolidationListItem) => void;
  onDelete: (id: string) => void;
  onAssignCargos: (item: ConsolidationListItem) => void;
  onUpdate: (updated: ConsolidationListItem) => void;
}

export function ConsolidationDetailsDrawer({
  isOpen,
  onClose,
  consolidation,
  onEdit,
  onDelete,
  onAssignCargos,
  onUpdate,
}: ConsolidationDetailsDrawerProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canUpdate, canDelete, canAssignCargo } = usePermissions();

  const [advancingStatus, setAdvancingStatus] = useState<boolean>(false);
  const [removingCargoId, setRemovingCargoId] = useState<string | null>(null);
  const [pendingDetach, setPendingDetach] = useState<{ id: string; name: string } | null>(null);

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

  if (!isOpen || !consolidation) return null;

  const statusBadge = STATUS_BADGES[consolidation.status] || STATUS_BADGES.Waiting;
  const currentStatusIndex = STATUS_ORDER.indexOf(consolidation.status);

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

  // Remove single cargo from consolidation – professional approval modal
  const handleRequestDetach = (cargoId: string, cargoName: string) => {
    if (!canAssignCargo()) {
      showNotification('Permission denied: cannot detach cargos', 'error');
      return;
    }
    setPendingDetach({ id: cargoId, name: cargoName });
  };

  const handleConfirmDetach = async () => {
    if (!pendingDetach) return;
    const cargoId = pendingDetach.id;
    setRemovingCargoId(cargoId);
    try {
      const res = await cargoConsolidationsApi.removeCargos(consolidation.id, [cargoId]);
      showNotification(t('removedSuccessfully') || 'Cargo detached from truck', 'success');
      const updated =
        res?.consolidation || (res as any)?.data || (res as any)?.id ? res : consolidation;
      onUpdate(updated as ConsolidationListItem);
      setPendingDetach(null);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to detach cargo', 'error');
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-sm overflow-hidden">
        {/* Backdrop dismiss */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Drawer Sliding Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative z-10 w-full max-w-2xl h-full bg-surface border-l border-border shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Top Bar Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-border bg-gradient-to-r from-brand-navy/10 via-surface to-brand-royal/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-royal text-brand-gold border border-brand-gold/30 shadow-md shrink-0">
                <Truck className="size-5 sm:size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-mono font-extrabold text-foreground tracking-tight">
                    {consolidation.container_truck_id}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-navy dark:text-brand-gold font-mono font-bold border border-brand-gold/30">
                    {consolidation.consolidation_code}
                  </span>
                  {consolidation.container_type && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-bold">
                      {consolidation.container_type}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('truckTripDetails')} • Created on{' '}
                  {new Date(consolidation.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {canUpdate('cargo_consolidations') && (
                <button
                  type="button"
                  onClick={() => onEdit(consolidation)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                  title="Edit consolidation"
                >
                  <Edit2 className="size-4" />
                </button>
              )}
              {canDelete('cargo_consolidations') && (
                <button
                  type="button"
                  onClick={() => onDelete(consolidation.id)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Delete consolidation"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer ml-1"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Drawer Body Scroll Area */}
          <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-6">
            {/* Status Stepper / Progression */}
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Trip Lifecycle Status</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border uppercase tracking-wider ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                >
                  {getStatusLabel(consolidation.status)}
                </span>
              </div>

              {/* Status Pipeline Step Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {STATUS_ORDER.map((st, idx) => {
                  const isCurrent = st === consolidation.status;
                  const isPassed = idx < currentStatusIndex;
                  return (
                    <button
                      key={st}
                      type="button"
                      disabled={!canUpdate('cargo_consolidations') || advancingStatus || isCurrent}
                      onClick={() => handleAdvanceStatus(st)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border select-none ${
                        !canUpdate('cargo_consolidations')
                          ? 'opacity-50 cursor-not-allowed bg-surface text-muted-foreground border-border/40'
                          : isCurrent
                            ? 'bg-brand-navy dark:bg-brand-gold text-white dark:text-brand-navy border-transparent shadow-sm cursor-default'
                            : isPassed
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 cursor-pointer'
                              : 'bg-surface text-muted-foreground hover:text-foreground border-border/60 hover:border-border cursor-pointer'
                      }`}
                    >
                      {getStatusLabel(st)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Route & Schedule Corridor */}
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <MapPin className="size-4 text-brand-royal" />
                  <span>Transport Route & Dates</span>
                </div>
                {consolidation.route?.google_maps_dir_url && (
                  <a
                    href={consolidation.route.google_maps_dir_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-navy dark:text-brand-gold hover:underline"
                  >
                    <span>Directions</span>
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border/70">
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Origin
                    </span>
                    <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <span>
                        {getCountryFlag(
                          consolidation.origin_country_code || consolidation.origin?.country_code
                        )}
                      </span>
                      <span>{consolidation.origin_place || 'Not specified'}</span>
                    </span>
                  </div>
                  <ArrowRight className="size-4 text-brand-gold" />
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Destination
                    </span>
                    <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <span>
                        {getCountryFlag(
                          consolidation.destination_country_code ||
                            consolidation.destination?.country_code
                        )}
                      </span>
                      <span>{consolidation.destination_place || 'Not specified'}</span>
                    </span>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="text-[10px] text-muted-foreground block">
                    {t('departureDate') || 'Departure'}
                  </span>
                  <span className="font-bold text-foreground">
                    {consolidation.departure_date || 'Pending'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-surface border border-border/60">
                  <span className="text-[10px] text-muted-foreground block">
                    {t('loadingCompletionDate') || t('loadedDate') || 'Loaded Date'}
                  </span>
                  <span className="font-bold text-foreground">
                    {consolidation.loaded_date || consolidation.load_date || '—'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-border/60">
                  <span className="text-[10px] text-muted-foreground block">
                    {t('borderArrivalDate') || 'Border Arrival'}
                  </span>
                  <span className="font-bold text-foreground">
                    {consolidation.border_arrival_date || '—'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-border/60">
                  <span className="text-[10px] text-muted-foreground block">
                    {t('tashkentArrivalDate') || 'Tashkent Arrival'}
                  </span>
                  <span className="font-bold text-foreground">
                    {consolidation.tashkent_arrival_date || '—'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-border/60">
                  <span className="text-[10px] text-muted-foreground block">
                    {t('estimatedArrival') || 'Est. Arrival'}
                  </span>
                  <span className="font-bold text-foreground">
                    {consolidation.estimated_arrival_date || '—'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-border/60">
                  <span className="text-[10px] text-muted-foreground block">
                    {t('actualArrival') || 'Actual Arrival'}
                  </span>
                  <span className="font-bold text-foreground">
                    {consolidation.arrived_date || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Capacity Utilization Gauges */}
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Boxes className="size-4 text-brand-gold" />
                  <span>{t('capacityUtilization')}</span>
                </div>
                <span className="text-xs font-bold text-muted-foreground font-mono">
                  {consolidation.capacity.total_cargos_count} attached cargo(s)
                </span>
              </div>

              {/* Volume Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-foreground">Volume Utilization (m³)</span>
                  <span className="font-mono font-extrabold text-foreground">
                    {consolidation.capacity.assigned_volume_m3} /{' '}
                    {consolidation.capacity.max_volume_m3} m³ (
                    {consolidation.capacity.volume_utilization_percent}%)
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden border border-border/60">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      consolidation.capacity.volume_utilization_percent > 90
                        ? 'bg-red-500'
                        : consolidation.capacity.volume_utilization_percent > 70
                          ? 'bg-amber-500'
                          : 'bg-brand-royal'
                    }`}
                    style={{
                      width: `${Math.min(100, consolidation.capacity.volume_utilization_percent)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Available Space:</span>
                  <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {consolidation.capacity.remaining_volume_m3} m³ remaining
                  </span>
                </div>
              </div>

              {/* Weight Progress */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-foreground">Weight Utilization (kg)</span>
                  <span className="font-mono font-extrabold text-foreground">
                    {consolidation.capacity.assigned_weight_kg.toLocaleString()} /{' '}
                    {consolidation.capacity.max_weight_kg.toLocaleString()} kg (
                    {consolidation.capacity.weight_utilization_percent}%)
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden border border-border/60">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      consolidation.capacity.weight_utilization_percent > 90
                        ? 'bg-red-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(100, consolidation.capacity.weight_utilization_percent)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Available Payload:</span>
                  <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {consolidation.capacity.remaining_weight_kg.toLocaleString()} kg remaining
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Performance Breakdown */}
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <DollarSign className="size-4 text-emerald-500" />
                  <span>{t('financialPerformance')}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs font-extrabold">
                  <span>Net Margin:</span>
                  <span
                    className={`flex items-center gap-1 ${
                      isNetMarginPositive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-surface border border-border/60">
                  <span className="text-[10px] text-muted-foreground block">
                    {t('totalClientSell')}
                  </span>
                  <span className="font-mono text-sm font-extrabold text-foreground">
                    {formatMoney(consolidation.financials.total_sell_usd, 'USD')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-surface border border-border/60">
                  <span className="text-[10px] text-muted-foreground block">
                    {t('totalClientPurchase')}
                  </span>
                  <span className="font-mono text-sm font-extrabold text-foreground">
                    {formatMoney(consolidation.financials.total_purchase_usd, 'USD')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-surface border border-border/60">
                  <span className="text-[10px] text-muted-foreground block">
                    {t('carrierFreightCost')}
                  </span>
                  <span className="font-mono text-sm font-extrabold text-foreground">
                    {formatMoney(carrierCostAmount || carrierCostUsd, carrierCostCurrency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Carrier & Driver Info */}
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <User className="size-4 text-brand-navy dark:text-brand-gold" />
                <span>Carrier & Driver Contact</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border/60">
                <div>
                  <span className="font-bold text-xs text-foreground block">
                    {consolidation.carrier_name || 'Carrier not assigned'}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {consolidation.carrier_phone || 'No phone registered'}
                  </span>
                </div>
                {consolidation.carrier_phone && (
                  <a
                    href={`tel:${consolidation.carrier_phone}`}
                    className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                    title="Call carrier"
                  >
                    <Phone className="size-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Attached Client Packages List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Package className="size-4 text-brand-gold" />
                  <span>Attached Client Cargos ({consolidation.cargos.length})</span>
                </div>
                {canAssignCargo() && (
                  <button
                    type="button"
                    onClick={() => onAssignCargos(consolidation)}
                    className="px-3 py-1.5 rounded-xl bg-brand-gold/20 text-brand-navy dark:text-brand-gold border border-brand-gold/40 text-xs font-bold hover:bg-brand-gold/30 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    <span>Pack More Cargos</span>
                  </button>
                )}
              </div>

              {consolidation.cargos.length === 0 ? (
                <div className="py-8 text-center p-4 rounded-2xl border border-dashed border-border bg-muted/10 text-muted-foreground">
                  <Package className="size-7 mx-auto mb-1.5 opacity-40" />
                  <p className="text-xs font-bold text-foreground">No client cargos attached yet</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Click "Pack More Cargos" to attach unassigned LTL packages to this trip.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {consolidation.cargos.map((cargo) => (
                    <div
                      key={cargo.id}
                      className="p-3 sm:p-3.5 rounded-2xl bg-surface border border-border/80 flex items-center justify-between gap-3 hover:border-border transition-all"
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
                          {cargo.client?.name && <span>Client: {cargo.client.name}</span>}
                          {cargo.employee?.name && <span>Sales: {cargo.employee.name}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="font-mono text-xs font-extrabold text-foreground block">
                            {cargo.volume || 0} m³ / {(cargo.weight || 0).toLocaleString()} kg
                          </span>
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold block">
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

                        {canAssignCargo() && (
                          <button
                            type="button"
                            disabled={removingCargoId === cargo.id}
                            onClick={() => handleRequestDetach(cargo.id, cargo.cargo)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 transition-colors cursor-pointer"
                            title="Detach from truck"
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

      {/* Detach cargo – general DeletionApprovalModal with custom content (locale-aware) */}
      <DeletionApprovalModal
        isOpen={!!pendingDetach}
        onClose={() => !removingCargoId && setPendingDetach(null)}
        onConfirm={handleConfirmDetach}
        isBusy={!!removingCargoId}
        variant="warning"
        title={t('confirmRemoveCargo')}
        description={
          pendingDetach
            ? t('confirmRemoveCargoDesc', {
                name: pendingDetach.name,
                truck: consolidation.container_truck_id,
                code: consolidation.consolidation_code,
              })
            : t('confirmRemoveCargo')
        }
        confirmLabel={t('actionDetach')}
        cancelLabel={t('actionCancel')}
        entityPreview={
          pendingDetach ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-foreground">{pendingDetach.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {consolidation.container_truck_id} → {t('clientUnassigned')}
                </div>
              </div>
              <span className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                {t('deleteModalUnlink')}
              </span>
            </div>
          ) : undefined
        }
        consequences={[
          t('deleteDetachConsequenceFreed'),
          t('deleteDetachConsequenceMargin'),
          t('deleteDetachConsequenceRemains'),
        ]}
      />
    </AnimatePresence>
  );
}
