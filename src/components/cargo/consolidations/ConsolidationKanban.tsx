import { motion } from 'framer-motion';
import {
  Truck,
  ArrowRight,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react';
import type { CargoConsolidation, ConsolidationStatus } from '../../../services/api';
import { formatMoney } from '../../../types/currency';

interface ConsolidationKanbanProps {
  consolidations: CargoConsolidation[];
  onEdit: (item: CargoConsolidation) => void;
  onDelete: (item: CargoConsolidation) => void;
  onManageCargos: (item: CargoConsolidation) => void;
  onViewDetail: (item: CargoConsolidation) => void;
  onQuickStatus: (item: CargoConsolidation) => void;
  onMoveStatus: (item: CargoConsolidation, nextStatus: ConsolidationStatus) => void;
}

interface KanbanColumnDef {
  id: string;
  title: string;
  statuses: ConsolidationStatus[];
  badgeClass: string;
  icon: React.ReactNode;
}

const KANBAN_COLUMNS: KanbanColumnDef[] = [
  {
    id: 'col-planning',
    title: 'Planning',
    statuses: ['Planning'],
    badgeClass: 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400',
    icon: <Clock className="size-3.5" />,
  },
  {
    id: 'col-loading',
    title: 'Loading',
    statuses: ['Loading'],
    badgeClass: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    icon: <Package className="size-3.5" />,
  },
  {
    id: 'col-transit',
    title: 'On the way',
    statuses: ['On the way'],
    badgeClass: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
    icon: <Truck className="size-3.5" />,
  },
  {
    id: 'col-customs-border',
    title: 'Station / Border',
    statuses: ['Station', 'On the border', 'Reload'],
    badgeClass: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    icon: <Shield className="size-3.5" />,
  },
  {
    id: 'col-arrived',
    title: 'Arrived / Completed',
    statuses: ['Arrived', 'Completed'],
    badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    icon: <CheckCircle2 className="size-3.5" />,
  },
];

const ORDERED_STATUS_FLOW: ConsolidationStatus[] = [
  'Planning',
  'Loading',
  'On the way',
  'Station',
  'On the border',
  'Reload',
  'Arrived',
  'Completed',
];

export function ConsolidationKanban({
  consolidations,
  onEdit,
  onDelete,
  onManageCargos,
  onViewDetail,
  onQuickStatus,
  onMoveStatus,
}: ConsolidationKanbanProps) {
  const getNextStatus = (current: ConsolidationStatus): ConsolidationStatus | null => {
    const idx = ORDERED_STATUS_FLOW.indexOf(current);
    if (idx !== -1 && idx < ORDERED_STATUS_FLOW.length - 1) {
      return ORDERED_STATUS_FLOW[idx + 1];
    }
    return null;
  };

  const getPrevStatus = (current: ConsolidationStatus): ConsolidationStatus | null => {
    const idx = ORDERED_STATUS_FLOW.indexOf(current);
    if (idx > 0) {
      return ORDERED_STATUS_FLOW[idx - 1];
    }
    return null;
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
      {KANBAN_COLUMNS.map((col) => {
        const columnItems = consolidations.filter((c) => col.statuses.includes(c.status));

        let colVolume = 0;
        let colWeight = 0;
        let colMargin = 0;

        columnItems.forEach((c) => {
          colVolume += c.capacity?.assigned_volume_m3 || 0;
          colWeight += c.capacity?.assigned_weight_kg || 0;
          colMargin += c.financials?.consolidated_net_margin_usd || 0;
        });

        return (
          <div
            key={col.id}
            className="flex flex-col flex-1 min-w-[300px] max-w-[360px] rounded-2xl bg-surface/60 border border-border overflow-hidden shadow-sm"
          >
            {/* Column Header */}
            <div className="p-3.5 border-b border-border bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`p-1.5 rounded-lg border shadow-2xs ${col.badgeClass}`}>
                    {col.icon}
                  </span>
                  <h3 className="font-bold text-foreground text-xs">{col.title}</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-background text-foreground border border-border shadow-2xs">
                  {columnItems.length}
                </span>
              </div>

              {/* Column Summary Metrics */}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold pt-1 border-t border-border/40">
                <span>{Math.round(colVolume * 10) / 10} m³</span>
                <span>{colWeight.toLocaleString()} kg</span>
                <span
                  className={`font-bold font-mono ${
                    colMargin >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {colMargin >= 0 ? '+' : ''}
                  {formatMoney(colMargin, 'USD')}
                </span>
              </div>
            </div>

            {/* Column Items Scroll List */}
            <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-320px)] min-h-[220px]">
              {columnItems.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border rounded-xl text-muted-foreground text-xs">
                  <p>No trips in {col.title.toLowerCase()}</p>
                </div>
              ) : (
                columnItems.map((item) => {
                  const cap = item.capacity || {
                    max_volume_m3: item.max_volume_capacity || 86,
                    assigned_volume_m3: 0,
                    remaining_volume_m3: item.max_volume_capacity || 86,
                    volume_utilization_percent: 0,
                    max_weight_kg: item.max_weight_capacity || 22000,
                    assigned_weight_kg: 0,
                    remaining_weight_kg: item.max_weight_capacity || 22000,
                    weight_utilization_percent: 0,
                    total_cargos_count: 0,
                  };

                  const prevStatus = getPrevStatus(item.status);
                  const nextStatus = getNextStatus(item.status);

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-3 rounded-xl bg-surface border border-border hover:border-brand-gold/50 shadow-2xs hover:shadow-xs transition-all space-y-2.5"
                    >
                      {/* Top Bar: Plate, Code & Sub-status */}
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-foreground font-mono">
                              {item.container_truck_id}
                            </span>
                            {item.container_type && (
                              <span className="px-1.5 py-0.2 rounded bg-muted text-muted-foreground text-[9px] font-bold">
                                {item.container_type}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-brand-gold font-mono block">
                            {item.consolidation_code}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onQuickStatus(item)}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-muted text-foreground border border-border hover:border-brand-gold/50 transition-colors cursor-pointer"
                        >
                          {item.status}
                        </button>
                      </div>

                      {/* Route */}
                      <div className="flex items-center justify-between text-[11px] text-foreground font-semibold bg-muted/30 p-2 rounded-lg border border-border/50">
                        <span className="truncate max-w-[100px]">
                          {item.origin_place || 'Origin'}
                        </span>
                        <ArrowRight className="size-3 text-brand-gold shrink-0" />
                        <span className="truncate max-w-[100px]">
                          {item.destination_place || 'Tashkent'}
                        </span>
                      </div>

                      {/* Capacity Meter */}
                      <div className="space-y-1 text-[10px]">
                        <div className="flex justify-between font-mono">
                          <span className="text-muted-foreground">
                            Vol: <strong>{cap.assigned_volume_m3}</strong>/{cap.max_volume_m3} m³
                          </span>
                          <span className="font-bold text-foreground">
                            {cap.volume_utilization_percent}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border/50">
                          <div
                            className="h-full bg-brand-gold rounded-full"
                            style={{ width: `${Math.min(100, cap.volume_utilization_percent)}%` }}
                          />
                        </div>
                      </div>

                      {/* Financials & Cargo Count */}
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-border/40 font-mono">
                        <span className="text-muted-foreground">
                          {cap.total_cargos_count} shipments
                        </span>
                        <span
                          className={`font-bold ${
                            (item.financials?.consolidated_net_margin_usd || 0) >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {(item.financials?.consolidated_net_margin_usd || 0) >= 0 ? '+' : ''}
                          {formatMoney(item.financials?.consolidated_net_margin_usd || 0, 'USD')}
                        </span>
                      </div>

                      {/* Quick Move Stepper & Actions */}
                      <div className="flex items-center justify-between gap-1 pt-1">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={!prevStatus}
                            onClick={() => prevStatus && onMoveStatus(item, prevStatus)}
                            className="p-1 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            title={prevStatus ? `Move back to ${prevStatus}` : 'Start of flow'}
                          >
                            <ChevronLeft className="size-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={!nextStatus}
                            onClick={() => nextStatus && onMoveStatus(item, nextStatus)}
                            className="p-1 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            title={nextStatus ? `Advance to ${nextStatus}` : 'Trip completed'}
                          >
                            <ChevronRight className="size-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onViewDetail(item)}
                            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                            title="View Detail"
                          >
                            <Eye className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onManageCargos(item)}
                            className="px-2 py-0.5 rounded-md bg-brand-gold/15 hover:bg-brand-gold/25 text-brand-gold text-[10px] font-bold border border-brand-gold/30 cursor-pointer"
                          >
                            Manifest
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(item)}
                            className="p-1 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
