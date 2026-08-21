import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  MapPin,
  Layers,
  ArrowRight,
  Edit2,
  Trash2,
  Eye,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Package,
  CheckCircle2,
  Clock,
  Shield,
  Repeat,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useTranslation } from '../../../context/LanguageContext';
import { T } from '../../T';
import type { CargoConsolidation, ConsolidationStatus } from '../../../services/api';
import { formatMoney } from '../../../types/currency';

interface ConsolidationTableProps {
  consolidations: CargoConsolidation[];
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
  onSort: (column: string) => void;
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
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    dotClass: 'bg-purple-500',
    icon: <Clock className="size-3" />,
    labelKey: 'statusPlanning',
  },
  Loading: {
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    dotClass: 'bg-amber-500',
    icon: <Package className="size-3" />,
    labelKey: 'statusLoading',
  },
  'On the way': {
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    dotClass: 'bg-blue-500',
    icon: <Truck className="size-3" />,
    labelKey: 'statusOnTheWay',
  },
  Station: {
    badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    dotClass: 'bg-indigo-500',
    icon: <MapPin className="size-3" />,
    labelKey: 'statusStation',
  },
  'On the border': {
    badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    dotClass: 'bg-indigo-500',
    icon: <Shield className="size-3" />,
    labelKey: 'statusOnTheBorder',
  },
  Reload: {
    badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    dotClass: 'bg-orange-500',
    icon: <Repeat className="size-3" />,
    labelKey: 'statusReload',
  },
  Arrived: {
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    dotClass: 'bg-emerald-500',
    icon: <CheckCircle2 className="size-3" />,
    labelKey: 'statusArrived',
  },
  Completed: {
    badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    dotClass: 'bg-slate-500',
    icon: <CheckCircle2 className="size-3" />,
    labelKey: 'statusCompleted',
  },
};

export function ConsolidationTable({
  consolidations,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  onManageCargos,
  onViewDetail,
  onQuickStatus,
}: ConsolidationTableProps) {
  const { t } = useTranslation();
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="size-3 opacity-40" />;
    }
    return sortOrder?.toUpperCase() === 'ASC' ? (
      <ArrowUp className="size-3 text-brand-gold" />
    ) : (
      <ArrowDown className="size-3 text-brand-gold" />
    );
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-surface border border-border shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold select-none">
              <th className="py-3 px-3 w-10 text-center"></th>
              <th
                onClick={() => onSort('consolidation_code')}
                className="py-3 px-3 cursor-pointer hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>
                    <T k="cnsCode" /> & <T k="cnsTruckPlate" />
                  </span>
                  {renderSortIcon('consolidation_code')}
                </div>
              </th>
              <th className="py-3 px-3">
                <span>
                  <T k="cnsOrigin" /> → <T k="cnsDestination" />
                </span>
              </th>
              <th className="py-3 px-3">
                <span>
                  <T k="cnsCarrierName" />
                </span>
              </th>
              <th
                onClick={() => onSort('departure_date')}
                className="py-3 px-3 cursor-pointer hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>
                    <T k="cnsDepartureDate" /> / Arrival
                  </span>
                  {renderSortIcon('departure_date')}
                </div>
              </th>
              <th
                onClick={() => onSort('status')}
                className="py-3 px-3 cursor-pointer hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  {renderSortIcon('status')}
                </div>
              </th>
              <th
                onClick={() => onSort('utilization')}
                className="py-3 px-3 cursor-pointer hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>
                    <T k="cnsVolumeCapacity" />
                  </span>
                  {renderSortIcon('utilization')}
                </div>
              </th>
              <th className="py-3 px-3">
                <span>
                  <T k="cnsWeightCapacity" />
                </span>
              </th>
              <th className="py-3 px-3">
                <span>
                  <T k="cnsTotalCarrierCost" />
                </span>
              </th>
              <th
                onClick={() => onSort('margin')}
                className="py-3 px-3 cursor-pointer hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>
                    <T k="cnsFinancialYield" />
                  </span>
                  {renderSortIcon('margin')}
                </div>
              </th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-border/60">
            {consolidations.map((item) => {
              const isExpanded = !!expandedRows[item.id];
              const statusCfg = STATUS_BADGE_MAP[item.status] || {
                badgeClass: 'bg-muted text-muted-foreground border-border',
                dotClass: 'bg-muted-foreground',
                icon: <Truck className="size-3" />,
                labelKey: item.status,
              };

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

              const fin = item.financials || {
                total_sell_usd: 0,
                total_purchase_usd: 0,
                carrier_cost: {
                  amount: item.total_carrier_cost,
                  currency: item.carrier_cost_currency,
                  amount_usd: item.total_carrier_cost,
                },
                consolidated_net_margin_usd: 0,
              };

              const cargos = item.cargos || [];

              return (
                <React.Fragment key={item.id}>
                  <tr className="hover:bg-muted/30 transition-colors group">
                    {/* Expand Row Toggle */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleRow(item.id)}
                        className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title={isExpanded ? 'Collapse' : 'Expand attached cargos'}
                      >
                        {isExpanded ? (
                          <ChevronDown className="size-4 text-brand-gold" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </button>
                    </td>

                    {/* Code & Truck Plate */}
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-foreground font-mono">
                            {item.container_truck_id}
                          </span>
                          {item.container_type && (
                            <span className="px-1.5 py-0.2 rounded bg-muted text-muted-foreground text-[10px] font-bold">
                              {item.container_type}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => copyText(item.consolidation_code, item.id)}
                          className="text-[11px] font-mono text-brand-gold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === item.id ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3 opacity-60" />
                          )}
                          <span>{item.consolidation_code}</span>
                        </button>
                      </div>
                    </td>

                    {/* Route */}
                    <td className="py-3 px-3">
                      <div className="space-y-0.5 min-w-[140px]">
                        <div className="flex items-center gap-1 text-foreground font-semibold truncate">
                          <span className="truncate">{item.origin_place || 'Origin'}</span>
                          <ArrowRight className="size-3 text-brand-gold shrink-0" />
                          <span className="truncate">{item.destination_place || 'Tashkent'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Carrier */}
                    <td className="py-3 px-3">
                      <div className="space-y-0.5 min-w-[120px]">
                        <p className="font-semibold text-foreground truncate">
                          {item.carrier_name || '—'}
                        </p>
                        {item.carrier_phone && (
                          <a
                            href={`tel:${item.carrier_phone}`}
                            className="text-[10px] text-muted-foreground hover:text-brand-gold font-mono block"
                          >
                            {item.carrier_phone}
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="space-y-0.5 text-[11px]">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span className="text-[10px] font-bold uppercase">Dep:</span>
                          <span className="font-bold text-foreground">
                            {item.departure_date || '—'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span className="text-[10px] font-bold uppercase">Arr:</span>
                          <span className="font-bold text-foreground">
                            {item.arrived_date || item.estimated_arrival_date || '—'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onQuickStatus(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all hover:scale-105 cursor-pointer ${statusCfg.badgeClass}`}
                        title="Click to update status"
                      >
                        <span className={`size-1.5 rounded-full ${statusCfg.dotClass}`} />
                        {statusCfg.icon}
                        <span>{t(statusCfg.labelKey) || item.status}</span>
                      </button>
                    </td>

                    {/* Volume Capacity */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="space-y-1 min-w-[100px]">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="font-bold text-foreground">
                            {cap.assigned_volume_m3}
                          </span>
                          <span className="text-muted-foreground">/ {cap.max_volume_m3} m³</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border/60">
                          <div
                            className={`h-full rounded-full bg-brand-gold`}
                            style={{ width: `${Math.min(100, cap.volume_utilization_percent)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-bold block">
                          {cap.volume_utilization_percent}% • {cap.total_cargos_count} loads
                        </span>
                      </div>
                    </td>

                    {/* Weight Capacity */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="space-y-0.5 text-[11px] font-mono">
                        <span className="font-bold text-foreground block">
                          {cap.assigned_weight_kg.toLocaleString()} kg
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          Max: {cap.max_weight_kg.toLocaleString()} kg
                        </span>
                      </div>
                    </td>

                    {/* Carrier Cost */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-foreground">
                      {formatMoney(fin.carrier_cost.amount, fin.carrier_cost.currency as any)}
                    </td>

                    {/* Net Margin */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono font-bold">
                      <span
                        className={
                          fin.consolidated_net_margin_usd >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }
                      >
                        {fin.consolidated_net_margin_usd >= 0 ? '+' : ''}
                        {formatMoney(fin.consolidated_net_margin_usd, 'USD')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onManageCargos(item)}
                          className="px-2 py-1 rounded-lg bg-brand-gold/15 hover:bg-brand-gold/25 text-brand-gold border border-brand-gold/30 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          title="Manage Cargos"
                        >
                          <Layers className="size-3" />
                          <span>Manifest</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onViewDetail(item)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="size-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-brand-gold transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="size-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Sub-table for Child Client Cargos */}
                  <AnimatePresence>
                    {isExpanded && (
                      <tr>
                        <td colSpan={11} className="p-0 bg-muted/20 border-b border-border">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <Package className="size-3.5 text-brand-gold" />
                                <span>
                                  Attached Client Shipments inside {item.container_truck_id} (
                                  {cargos.length})
                                </span>
                              </h4>
                              <button
                                type="button"
                                onClick={() => onManageCargos(item)}
                                className="text-xs text-brand-gold hover:underline font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <span>+ Add or remove cargos</span>
                              </button>
                            </div>

                            {cargos.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic py-2">
                                <T k="cnsNoCargosInTrip" />
                              </p>
                            ) : (
                              <div className="overflow-x-auto rounded-xl border border-border bg-background shadow-2xs">
                                <table className="w-full text-left text-[11px]">
                                  <thead>
                                    <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                                      <th className="py-2 px-3">Cargo Description</th>
                                      <th className="py-2 px-3">Client</th>
                                      <th className="py-2 px-3">Manager</th>
                                      <th className="py-2 px-3">Volume (m³)</th>
                                      <th className="py-2 px-3">Weight (kg)</th>
                                      <th className="py-2 px-3">Client Price</th>
                                      <th className="py-2 px-3">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/40">
                                    {cargos.map((cargo) => (
                                      <tr key={cargo.id} className="hover:bg-muted/20">
                                        <td className="py-2 px-3 font-bold text-foreground truncate max-w-[200px]">
                                          {cargo.cargo}
                                        </td>
                                        <td className="py-2 px-3 text-muted-foreground truncate max-w-[150px]">
                                          {cargo.client?.name || '—'}
                                        </td>
                                        <td className="py-2 px-3 text-muted-foreground">
                                          {cargo.employee?.name || '—'}
                                        </td>
                                        <td className="py-2 px-3 font-mono font-bold text-foreground">
                                          {cargo.volume} m³
                                        </td>
                                        <td className="py-2 px-3 font-mono font-bold text-foreground">
                                          {cargo.weight} kg
                                        </td>
                                        <td className="py-2 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                          {formatMoney(
                                            cargo.sell_price.amount,
                                            cargo.sell_price.currency as any
                                          )}
                                        </td>
                                        <td className="py-2 px-3">
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground border border-border">
                                            {cargo.status}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
