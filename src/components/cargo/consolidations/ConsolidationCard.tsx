import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  MapPin,
  Calendar,
  Phone,
  Layers,
  ArrowRight,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Shield,
  Repeat,
  Copy,
  Check,
  Package,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useTranslation } from '../../../context/LanguageContext';
import { T } from '../../T';
import type { CargoConsolidation, ConsolidationStatus } from '../../../services/api';
import { formatMoney } from '../../../types/currency';

interface ConsolidationCardProps {
  consolidation: CargoConsolidation;
  onEdit: (item: CargoConsolidation) => void;
  onDelete: (item: CargoConsolidation) => void;
  onManageCargos: (item: CargoConsolidation) => void;
  onViewDetail: (item: CargoConsolidation) => void;
  onQuickStatus: (item: CargoConsolidation) => void;
}

const STATUS_BADGE_MAP: Record<
  ConsolidationStatus,
  { badgeClass: string; dotClass: string; icon: React.ReactNode; labelKey: string }
> = {
  Planning: {
    badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    dotClass: 'bg-purple-500',
    icon: <Clock className="size-3.5" />,
    labelKey: 'statusPlanning',
  },
  Loading: {
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    dotClass: 'bg-amber-500',
    icon: <Package className="size-3.5" />,
    labelKey: 'statusLoading',
  },
  'On the way': {
    badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    dotClass: 'bg-blue-500',
    icon: <Truck className="size-3.5" />,
    labelKey: 'statusOnTheWay',
  },
  Station: {
    badgeClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    dotClass: 'bg-indigo-500',
    icon: <MapPin className="size-3.5" />,
    labelKey: 'statusStation',
  },
  'On the border': {
    badgeClass: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
    dotClass: 'bg-orange-500',
    icon: <Shield className="size-3.5" />,
    labelKey: 'statusOnTheBorder',
  },
  Reload: {
    badgeClass: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30',
    dotClass: 'bg-fuchsia-500',
    icon: <Repeat className="size-3.5" />,
    labelKey: 'statusReload',
  },
  Arrived: {
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    dotClass: 'bg-emerald-500',
    icon: <CheckCircle2 className="size-3.5" />,
    labelKey: 'statusArrived',
  },
  Completed: {
    badgeClass: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
    dotClass: 'bg-teal-500',
    icon: <CheckCircle2 className="size-3.5" />,
    labelKey: 'statusCompleted',
  },
};

export function ConsolidationCard({
  consolidation,
  onEdit,
  onDelete,
  onManageCargos,
  onViewDetail,
  onQuickStatus,
}: ConsolidationCardProps) {
  const { t } = useTranslation();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPlate, setCopiedPlate] = useState(false);
  const [showAllCargos, setShowAllCargos] = useState(false);

  const statusConfig = STATUS_BADGE_MAP[consolidation.status] || {
    badgeClass: 'bg-muted text-muted-foreground border-border',
    dotClass: 'bg-muted-foreground',
    icon: <Truck className="size-3.5" />,
    labelKey: consolidation.status,
  };

  const cap = consolidation.capacity || {
    max_volume_m3: consolidation.max_volume_capacity || 86,
    assigned_volume_m3: 0,
    remaining_volume_m3: consolidation.max_volume_capacity || 86,
    volume_utilization_percent: 0,
    max_weight_kg: consolidation.max_weight_capacity || 22000,
    assigned_weight_kg: 0,
    remaining_weight_kg: consolidation.max_weight_capacity || 22000,
    weight_utilization_percent: 0,
    total_cargos_count: 0,
  };

  const fin = consolidation.financials || {
    total_sell_usd: 0,
    total_purchase_usd: 0,
    carrier_cost: {
      amount: consolidation.total_carrier_cost,
      currency: consolidation.carrier_cost_currency,
      amount_usd: consolidation.total_carrier_cost,
    },
    consolidated_net_margin_usd: 0,
  };

  const copyToClipboard = (text: string, type: 'code' | 'plate') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1500);
    } else {
      setCopiedPlate(true);
      setTimeout(() => setCopiedPlate(false), 1500);
    }
  };

  // Color logic for volume utilization
  const getVolumeProgressColor = (pct: number) => {
    if (pct > 95) return 'from-rose-500 to-red-500';
    if (pct > 80) return 'from-amber-500 to-amber-600';
    return 'from-emerald-500 to-teal-500';
  };

  const getWeightProgressColor = (pct: number) => {
    if (pct > 95) return 'from-rose-500 to-red-500';
    if (pct > 80) return 'from-amber-500 to-amber-600';
    return 'from-blue-500 to-indigo-500';
  };

  const attachedCargos = consolidation.cargos || [];
  const previewCargos = showAllCargos ? attachedCargos : attachedCargos.slice(0, 3);
  const remainingCount = attachedCargos.length - 3;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="group relative flex flex-col justify-between rounded-2xl bg-surface border border-border hover:border-brand-gold/50 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      {/* Top Gradient Accent Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-brand-navy via-brand-gold to-brand-royal" />

      {/* Main Content Area */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Header: Status, Code & Plate */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Consolidation Code */}
              <button
                type="button"
                onClick={() => copyToClipboard(consolidation.consolidation_code, 'code')}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold border border-brand-gold/30 text-xs font-mono font-bold tracking-tight transition-colors cursor-pointer"
                title="Click to copy code"
              >
                {copiedCode ? <Check className="size-3" /> : <Copy className="size-3 opacity-60" />}
                <span>{consolidation.consolidation_code}</span>
              </button>

              {/* Container / Body Type */}
              {consolidation.container_type && (
                <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider border border-border">
                  {consolidation.container_type}
                </span>
              )}
            </div>

            {/* Truck Plate / Vehicle Number */}
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => copyToClipboard(consolidation.container_truck_id, 'plate')}
                className="group/plate flex items-center gap-1.5 text-foreground hover:text-brand-gold transition-colors cursor-pointer"
                title="Click to copy truck plate"
              >
                <Truck className="size-4 text-brand-gold shrink-0" />
                <span className="text-base font-extrabold tracking-tight font-mono">
                  {consolidation.container_truck_id}
                </span>
                {copiedPlate ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <Copy className="size-3 opacity-0 group-hover/plate:opacity-70 transition-opacity" />
                )}
              </button>
            </div>
          </div>

          {/* Interactive Status Badge */}
          <button
            type="button"
            onClick={() => onQuickStatus(consolidation)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all hover:scale-105 shadow-2xs cursor-pointer ${statusConfig.badgeClass}`}
            title="Click to change status"
          >
            <span className={`size-2 rounded-full animate-pulse ${statusConfig.dotClass}`} />
            {statusConfig.icon}
            <span>{t(statusConfig.labelKey) || consolidation.status}</span>
          </button>
        </div>

        {/* Route Banner: Origin -> Destination */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-background border border-border text-foreground shrink-0 shadow-2xs">
              <MapPin className="size-3.5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                <T k="cnsOrigin" />
              </p>
              <p className="text-xs font-bold text-foreground truncate">
                {consolidation.origin_place || 'Not specified'}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center shrink-0 px-2">
            <ArrowRight className="size-4 text-brand-gold" />
          </div>

          <div className="flex items-center gap-2 min-w-0 justify-end text-right">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                <T k="cnsDestination" />
              </p>
              <p className="text-xs font-bold text-foreground truncate">
                {consolidation.destination_place || 'Tashkent, UZ'}
              </p>
            </div>
            <div className="p-1.5 rounded-lg bg-background border border-border text-foreground shrink-0 shadow-2xs">
              <MapPin className="size-3.5 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Departure & Arrival Schedule */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-surface border border-border/70 space-y-0.5">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-semibold">
              <Calendar className="size-3 text-blue-500" />
              <span>
                <T k="cnsDepartureDate" />
              </span>
            </div>
            <p className="font-bold text-foreground">{consolidation.departure_date || '—'}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-surface border border-border/70 space-y-0.5">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-semibold">
              <Calendar className="size-3 text-emerald-500" />
              <span>
                {consolidation.arrived_date ? (
                  <T k="cnsArrivedDate" />
                ) : (
                  <T k="cnsEstimatedArrival" />
                )}
              </span>
            </div>
            <p className="font-bold text-foreground">
              {consolidation.arrived_date || consolidation.estimated_arrival_date || '—'}
            </p>
          </div>
        </div>

        {/* Carrier Info */}
        {consolidation.carrier_name && (
          <div className="flex items-center justify-between gap-2 text-xs py-1 border-y border-border/50 text-muted-foreground">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-semibold text-foreground truncate">
                {consolidation.carrier_name}
              </span>
            </div>
            {consolidation.carrier_phone && (
              <a
                href={`tel:${consolidation.carrier_phone}`}
                className="inline-flex items-center gap-1 text-[11px] text-brand-gold hover:underline font-mono shrink-0"
              >
                <Phone className="size-3" />
                <span>{consolidation.carrier_phone}</span>
              </a>
            )}
          </div>
        )}

        {/* Dual Capacity Fill Gauges */}
        <div className="space-y-3 p-3.5 rounded-xl bg-muted/30 border border-border/80">
          {/* Volume Utilization Meter */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-foreground font-bold">
                <Layers className="size-3.5 text-brand-gold" />
                <T k="cnsVolumeCapacity" />
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground">
                  <strong className="text-foreground">{cap.assigned_volume_m3}</strong> /{' '}
                  {cap.max_volume_m3} m³
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                    cap.volume_utilization_percent > 95
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : cap.volume_utilization_percent > 80
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {cap.volume_utilization_percent}%
                </span>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="h-2 w-full bg-background rounded-full overflow-hidden p-0.5 border border-border/60">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getVolumeProgressColor(
                  cap.volume_utilization_percent
                )} transition-all duration-500`}
                style={{ width: `${Math.min(100, cap.volume_utilization_percent)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{cap.remaining_volume_m3} m³ available</span>
              <span>{cap.total_cargos_count} client cargos</span>
            </div>
          </div>

          {/* Weight Utilization Meter */}
          <div className="space-y-1.5 pt-1 border-t border-border/40">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-foreground font-bold">
                <T k="cnsWeightCapacity" />
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground">
                  <strong className="text-foreground">
                    {cap.assigned_weight_kg.toLocaleString()}
                  </strong>{' '}
                  / {cap.max_weight_kg.toLocaleString()} kg
                </span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                  {cap.weight_utilization_percent}%
                </span>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border/60">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getWeightProgressColor(
                  cap.weight_utilization_percent
                )} transition-all duration-500`}
                style={{ width: `${Math.min(100, cap.weight_utilization_percent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Consolidated Financial Snapshot */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-background border border-border shadow-2xs text-xs">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground truncate">
              <T k="cnsTotalCarrierCost" />
            </p>
            <p className="font-bold text-foreground font-mono truncate">
              {formatMoney(fin.carrier_cost.amount, fin.carrier_cost.currency as any)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold text-muted-foreground truncate">
              <T k="cnsGrossSell" />
            </p>
            <p className="font-bold text-foreground font-mono truncate">
              {formatMoney(fin.total_sell_usd, 'USD')}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold text-muted-foreground truncate">
              <T k="cnsFinancialYield" />
            </p>
            <p
              className={`font-bold font-mono truncate flex items-center gap-0.5 ${
                fin.consolidated_net_margin_usd >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {fin.consolidated_net_margin_usd >= 0 ? '+' : ''}
              {formatMoney(fin.consolidated_net_margin_usd, 'USD')}
            </p>
          </div>
        </div>

        {/* Attached Client Cargos List Accordion */}
        {attachedCargos.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-bold flex items-center gap-1">
                <Package className="size-3 text-brand-gold" />
                <T k="cnsAttachedCargosTab" /> ({attachedCargos.length})
              </span>
              {attachedCargos.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllCargos(!showAllCargos)}
                  className="text-[11px] text-brand-gold hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                >
                  {showAllCargos ? (
                    <>
                      <span>Show less</span>
                      <ChevronUp className="size-3" />
                    </>
                  ) : (
                    <>
                      <span>+{remainingCount} more</span>
                      <ChevronDown className="size-3" />
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="space-y-1">
              {previewCargos.map((cargo) => (
                <div
                  key={cargo.id}
                  className="px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/50 text-[11px] flex items-center justify-between gap-2"
                >
                  <div className="truncate min-w-0">
                    <span className="font-bold text-foreground truncate block">{cargo.cargo}</span>
                    <span className="text-[10px] text-muted-foreground truncate block">
                      {cargo.client?.name || 'Client'} • {cargo.volume} m³ • {cargo.weight} kg
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                    {formatMoney(cargo.sell_price.amount, cargo.sell_price.currency as any)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="p-3 bg-muted/20 border-t border-border flex items-center justify-between gap-2">
        {/* Left: Manage Manifest button */}
        <button
          type="button"
          onClick={() => onManageCargos(consolidation)}
          className="flex-1 px-3 py-1.5 rounded-xl bg-brand-gold/15 hover:bg-brand-gold/25 text-brand-gold border border-brand-gold/30 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <Layers className="size-3.5" />
          <span>
            <T k="cnsBtnManageCargos" />
          </span>
        </button>

        {/* Right Icon Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onViewDetail(consolidation)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={t('cnsBtnViewDetail') || 'View Details'}
          >
            <Eye className="size-4" />
          </button>

          <button
            type="button"
            onClick={() => onEdit(consolidation)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-brand-gold transition-colors cursor-pointer"
            title={t('cnsBtnEdit') || 'Edit Trip'}
          >
            <Edit2 className="size-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(consolidation)}
            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
            title={t('cnsBtnDelete') || 'Delete Trip'}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
