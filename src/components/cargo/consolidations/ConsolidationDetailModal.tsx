import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Truck, Layers, Package, ArrowRight } from 'lucide-react';
import { T } from '../../T';
import type { CargoConsolidation } from '../../../services/api';
import { formatMoney } from '../../../types/currency';

interface ConsolidationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  consolidation: CargoConsolidation | null;
  onEdit?: (item: CargoConsolidation) => void;
  onManageCargos?: (item: CargoConsolidation) => void;
}

export function ConsolidationDetailModal({
  isOpen,
  onClose,
  consolidation,
  onEdit,
  onManageCargos,
}: ConsolidationDetailModalProps) {
  if (!isOpen || !consolidation) return null;

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

  const cargos = consolidation.cargos || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-surface border border-border shadow-2xl overflow-hidden my-auto print:max-h-none print:shadow-none print:border-none print:rounded-none"
        >
          {/* Top Accent Strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-brand-navy via-brand-gold to-brand-royal shrink-0 print:hidden" />

          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3 bg-muted/20 shrink-0 print:bg-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30 shadow-xs print:hidden">
                <Truck className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-foreground tracking-tight font-mono">
                    {consolidation.container_truck_id}
                  </h2>
                  <span className="px-2 py-0.5 rounded-lg bg-brand-gold/15 text-brand-gold text-xs font-mono font-bold border border-brand-gold/30">
                    {consolidation.consolidation_code}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-foreground border border-border">
                    {consolidation.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pt-0.5">
                  Consolidation Truck Trip & Client Cargo Manifest Document
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-xl bg-brand-gold/15 hover:bg-brand-gold/25 text-brand-gold border border-brand-gold/30 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="size-3.5" />
                <span>
                  <T k="cnsPrintManifest" />
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Printable Manifest Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Route & Vehicle */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Route & Vehicle
                </h4>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <span>{consolidation.origin_place || 'Origin'}</span>
                    <ArrowRight className="size-3.5 text-brand-gold" />
                    <span>{consolidation.destination_place || 'Tashkent'}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Body: <strong>{consolidation.container_type || 'Standard'}</strong>
                  </p>
                </div>
              </div>

              {/* Carrier Contact */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Carrier Information
                </h4>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">
                    {consolidation.carrier_name || 'Direct / Independent'}
                  </p>
                  {consolidation.carrier_phone && (
                    <p className="text-xs text-brand-gold font-mono">
                      {consolidation.carrier_phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Schedule Dates */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Timeline
                </h4>
                <div className="space-y-1 text-xs">
                  <p className="text-muted-foreground">
                    Departure:{' '}
                    <strong className="text-foreground">
                      {consolidation.departure_date || '—'}
                    </strong>
                  </p>
                  <p className="text-muted-foreground">
                    Arrival:{' '}
                    <strong className="text-foreground">
                      {consolidation.arrived_date || consolidation.estimated_arrival_date || '—'}
                    </strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Dual Capacity Meters */}
            <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-3">
              <h4 className="text-xs font-bold text-brand-gold uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="size-3.5" />
                <span>Capacity Utilization</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Volume */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Volume Load:</span>
                    <span className="font-mono">
                      {cap.assigned_volume_m3} / {cap.max_volume_m3} m³ (
                      {cap.volume_utilization_percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border/60">
                    <div
                      className="h-full bg-brand-gold rounded-full"
                      style={{ width: `${Math.min(100, cap.volume_utilization_percent)}%` }}
                    />
                  </div>
                </div>

                {/* Weight */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Weight Load:</span>
                    <span className="font-mono">
                      {cap.assigned_weight_kg.toLocaleString()} /{' '}
                      {cap.max_weight_kg.toLocaleString()} kg ({cap.weight_utilization_percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border/60">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(100, cap.weight_utilization_percent)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Financials Strip */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-surface border border-border shadow-2xs text-xs font-mono">
              <div>
                <p className="text-[10px] font-sans font-semibold text-muted-foreground">
                  Carrier Freight Cost
                </p>
                <p className="text-base font-bold text-foreground">
                  {formatMoney(fin.carrier_cost.amount, fin.carrier_cost.currency as any)}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-sans font-semibold text-muted-foreground">
                  Client Gross Revenue
                </p>
                <p className="text-base font-bold text-foreground">
                  {formatMoney(fin.total_sell_usd, 'USD')}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-sans font-semibold text-muted-foreground">
                  Consolidated Net Profit
                </p>
                <p
                  className={`text-base font-bold ${
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

            {/* Complete Attached Client Shipments Manifest Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Package className="size-4 text-brand-gold" />
                  <span>Consolidated Client Cargos Manifest ({cargos.length})</span>
                </h3>
              </div>

              {cargos.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-xs italic border border-dashed border-border rounded-2xl">
                  <T k="cnsNoCargosInTrip" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Cargo Description</th>
                        <th className="py-2.5 px-3">Client</th>
                        <th className="py-2.5 px-3">Sales Manager</th>
                        <th className="py-2.5 px-3">Volume (m³)</th>
                        <th className="py-2.5 px-3">Weight (kg)</th>
                        <th className="py-2.5 px-3">Sell Price</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {cargos.map((cargo, idx) => (
                        <tr key={cargo.id} className="hover:bg-muted/20">
                          <td className="py-2.5 px-3 font-mono font-bold text-muted-foreground">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-foreground">{cargo.cargo}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">
                            {cargo.client?.name || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">
                            {cargo.employee?.name || '—'}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                            {cargo.volume} m³
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                            {cargo.weight} kg
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatMoney(cargo.sell_price.amount, cargo.sell_price.currency as any)}
                          </td>
                          <td className="py-2.5 px-3">
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
            </div>

            {/* Description / Notes */}
            {consolidation.description && (
              <div className="p-3.5 rounded-xl bg-muted/20 border border-border text-xs space-y-1">
                <p className="font-bold text-muted-foreground uppercase text-[10px]">
                  Customs & Operational Remarks:
                </p>
                <p className="text-foreground">{consolidation.description}</p>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3 shrink-0 print:hidden">
            <div className="flex items-center gap-2">
              {onManageCargos && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onManageCargos(consolidation);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-brand-gold/15 hover:bg-brand-gold/25 text-brand-gold border border-brand-gold/30 text-xs font-bold transition-colors cursor-pointer"
                >
                  <T k="cnsBtnManageCargos" />
                </button>
              )}

              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(consolidation);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-colors cursor-pointer"
                >
                  <T k="cnsBtnEdit" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
