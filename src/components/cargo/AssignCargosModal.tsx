import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Boxes,
  Search,
  Check,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Package,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { cargoConsolidationsApi } from '../../services/cargoConsolidations.service';
import type {
  ConsolidationListItem,
  ConsolidationCargoItem,
} from '../../services/cargoConsolidations.service';
import { formatMoney } from '../../services/api';

export interface AssignCargosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: ConsolidationListItem) => void;
  consolidation: ConsolidationListItem | null;
}

export function AssignCargosModal({
  isOpen,
  onClose,
  onSuccess,
  consolidation,
}: AssignCargosModalProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  const [search, setSearch] = useState<string>('');
  const [availableCargos, setAvailableCargos] = useState<ConsolidationCargoItem[]>([]);
  const [selectedCargoIds, setSelectedCargoIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Load unassigned LTL cargos
  useEffect(() => {
    if (!isOpen || !consolidation) return;
    setSelectedCargoIds([]);
    setSearch('');
    loadUnassigned();
  }, [isOpen, consolidation]);

  const loadUnassigned = async () => {
    setLoading(true);
    try {
      const items = await cargoConsolidationsApi.getUnassignedLtlCargos();
      setAvailableCargos(items);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to load unassigned cargos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredCargos = useMemo(() => {
    if (!search.trim()) return availableCargos;
    const s = search.toLowerCase();
    return availableCargos.filter(
      (c) =>
        (c.cargo || '').toLowerCase().includes(s) ||
        (c.agent_name || '').toLowerCase().includes(s) ||
        (c.container_truck_id || '').toLowerCase().includes(s) ||
        (c.client?.name || '').toLowerCase().includes(s) ||
        (c.employee?.name || '').toLowerCase().includes(s)
    );
  }, [availableCargos, search]);

  const toggleSelect = (id: string) => {
    setSelectedCargoIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCargoIds.length === filteredCargos.length) {
      setSelectedCargoIds([]);
    } else {
      setSelectedCargoIds(filteredCargos.map((c) => c.id));
    }
  };

  // Selected totals
  const selectedMetrics = useMemo(() => {
    let vol = 0;
    let weight = 0;
    let sellUsd = 0;
    let purchaseUsd = 0;

    availableCargos.forEach((c) => {
      if (selectedCargoIds.includes(c.id)) {
        vol += Number(c.volume) || 0;
        weight += Number(c.weight) || 0;
        sellUsd += Number(c.sell_price?.amount_usd) || 0;
        purchaseUsd += Number(c.purchase_price?.amount_usd) || 0;
      }
    });

    return {
      count: selectedCargoIds.length,
      volume: Math.round(vol * 100) / 100,
      weight: Math.round(weight * 100) / 100,
      sellUsd: Math.round(sellUsd * 100) / 100,
      purchaseUsd: Math.round(purchaseUsd * 100) / 100,
    };
  }, [availableCargos, selectedCargoIds]);

  const remainingVol = consolidation?.capacity?.remaining_volume_m3 ?? 0;
  const remainingWeight = consolidation?.capacity?.remaining_weight_kg ?? 0;

  const isVolExceeded = remainingVol > 0 && selectedMetrics.volume > remainingVol;
  const isWeightExceeded = remainingWeight > 0 && selectedMetrics.weight > remainingWeight;

  const handleAssign = async () => {
    if (!consolidation || selectedCargoIds.length === 0) return;

    setSubmitting(true);
    try {
      const res = await cargoConsolidationsApi.assignCargos(consolidation.id, selectedCargoIds);
      showNotification(
        t('packedSuccessfully') ||
          `Successfully assigned ${selectedCargoIds.length} cargo package(s) to ${consolidation.container_truck_id}`,
        'success'
      );
      onSuccess(res.consolidation);
      onClose();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to assign cargos', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !consolidation) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl rounded-3xl bg-surface border border-border shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border bg-gradient-to-r from-brand-navy/10 via-surface to-brand-royal/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-royal text-brand-gold border border-brand-gold/30 shadow-md">
                <Boxes className="size-5 sm:size-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  {t('unassignedCargosTitle')}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-navy/15 dark:bg-brand-gold/15 text-foreground dark:text-brand-gold font-mono font-bold border border-border">
                    {consolidation.container_truck_id} [{consolidation.consolidation_code}]
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground">{t('unassignedCargosDesc')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Current Truck Capacity vs Selection Live Tracker */}
          <div className="px-5 sm:px-6 py-3 bg-muted/30 border-b border-border/70 shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {/* Truck Remaining Space */}
              <div className="p-2.5 rounded-xl bg-surface border border-border/80">
                <span className="text-[11px] text-muted-foreground block font-bold">
                  {t('remainingVolume')}
                </span>
                <span className="font-mono text-sm font-extrabold text-foreground">
                  {consolidation.capacity?.remaining_volume_m3 || 0} m³
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface border border-border/80">
                <span className="text-[11px] text-muted-foreground block font-bold">
                  {t('remainingWeight')}
                </span>
                <span className="font-mono text-sm font-extrabold text-foreground">
                  {(consolidation.capacity?.remaining_weight_kg || 0).toLocaleString()} kg
                </span>
              </div>

              {/* Selected Packages Total */}
              <div
                className={`p-2.5 rounded-xl border ${
                  isVolExceeded
                    ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                    : 'bg-surface border-border/80 text-foreground'
                }`}
              >
                <span className="text-[11px] text-muted-foreground block font-bold flex items-center justify-between">
                  <span>Selected Volume</span>
                  {isVolExceeded && <AlertTriangle className="size-3 text-red-500" />}
                </span>
                <span className="font-mono text-sm font-extrabold">
                  +{selectedMetrics.volume} m³
                </span>
              </div>

              <div
                className={`p-2.5 rounded-xl border ${
                  isWeightExceeded
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                    : 'bg-surface border-border/80 text-foreground'
                }`}
              >
                <span className="text-[11px] text-muted-foreground block font-bold flex items-center justify-between">
                  <span>Selected Weight</span>
                  {isWeightExceeded && <AlertTriangle className="size-3 text-amber-500" />}
                </span>
                <span className="font-mono text-sm font-extrabold">
                  +{selectedMetrics.weight.toLocaleString()} kg
                </span>
              </div>
            </div>

            {isVolExceeded && (
              <div className="mt-2.5 p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span>
                  Warning: Selected cargos volume (+{selectedMetrics.volume} m³) exceeds remaining
                  space ({remainingVol} m³).
                </span>
              </div>
            )}
          </div>

          {/* Search & Actions Bar */}
          <div className="p-4 sm:px-6 flex items-center justify-between gap-3 border-b border-border bg-surface shrink-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search unassigned packages by cargo, client, manager..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-muted/40 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="px-3 py-2 rounded-xl border border-border bg-surface hover:bg-muted/60 text-xs font-bold text-foreground transition-all cursor-pointer"
              >
                {selectedCargoIds.length === filteredCargos.length && filteredCargos.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
              <button
                type="button"
                onClick={loadUnassigned}
                className="p-2 rounded-xl border border-border bg-surface hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                title="Refresh list"
              >
                <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Available Cargos Table */}
          <div className="overflow-y-auto flex-1 p-4 sm:px-6">
            {loading ? (
              <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-2">
                <RefreshCw className="size-6 animate-spin text-brand-gold" />
                <span className="text-xs font-bold">Scanning unassigned LTL packages...</span>
              </div>
            ) : filteredCargos.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Package className="size-8 opacity-40" />
                <span className="text-sm font-bold">No unassigned LTL packages available</span>
                <span className="text-xs text-muted-foreground">
                  All current LTL cargos are already attached to consolidation trips or none match
                  your search.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCargos.map((cargo) => {
                  const isChecked = selectedCargoIds.includes(cargo.id);
                  return (
                    <div
                      key={cargo.id}
                      onClick={() => toggleSelect(cargo.id)}
                      className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'bg-brand-gold/15 dark:bg-brand-gold/10 border-brand-gold/50 shadow-sm'
                          : 'bg-surface hover:bg-muted/30 border-border/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`size-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                            isChecked
                              ? 'bg-brand-gold text-brand-navy border-brand-gold'
                              : 'border-muted-foreground/40 bg-surface'
                          }`}
                        >
                          {isChecked && <Check className="size-3.5 stroke-[3]" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-foreground truncate">
                              {cargo.cargo}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold">
                              {cargo.container_truck_id}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                            {cargo.client?.name && (
                              <span className="truncate">Client: {cargo.client.name}</span>
                            )}
                            {cargo.employee?.name && (
                              <span className="truncate">Sales: {cargo.employee.name}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Specs & Pricing */}
                      <div className="flex items-center gap-4 shrink-0 text-right">
                        <div>
                          <div className="font-mono text-xs font-extrabold text-foreground">
                            {cargo.volume || 0} m³ / {(cargo.weight || 0).toLocaleString()} kg
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Sell: ${formatMoney(cargo.sell_price?.amount_usd || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-t border-border bg-surface/80 shrink-0">
            <div className="text-xs text-muted-foreground font-bold">
              <span>Selected: </span>
              <span className="font-mono text-foreground font-extrabold">
                {selectedCargoIds.length} package(s)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssign}
                disabled={submitting || selectedCargoIds.length === 0}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-navy to-brand-royal text-white hover:opacity-95 shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    <span>Packing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4 text-brand-gold" />
                    <span>Pack into Truck ({selectedCargoIds.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
