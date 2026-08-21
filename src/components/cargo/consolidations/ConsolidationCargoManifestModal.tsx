import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Layers,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Package,
  RefreshCw,
} from 'lucide-react';
import { T } from '../../T';
import { cargoConsolidationsApi } from '../../../services/api';
import type {
  CargoConsolidation,
  CargoConsolidationCargoItem,
  MockCargoRecord,
} from '../../../services/api';
import { formatMoney } from '../../../types/currency';

interface ConsolidationCargoManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  consolidation: CargoConsolidation | null;
  onUpdated: (updated: CargoConsolidation) => void;
}

export function ConsolidationCargoManifestModal({
  isOpen,
  onClose,
  consolidation,
  onUpdated,
}: ConsolidationCargoManifestModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'assigned' | 'available'>('assigned');

  const [currentConsolidation, setCurrentConsolidation] = useState<CargoConsolidation | null>(
    consolidation
  );
  const [availableCargos, setAvailableCargos] = useState<MockCargoRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAvailableIds, setSelectedAvailableIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Refresh data when modal opens
  const refreshData = async () => {
    if (!consolidation) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const [updatedConsolidation, unassignedPool] = await Promise.all([
        cargoConsolidationsApi.getById(consolidation.id),
        cargoConsolidationsApi.getAvailableCargos(),
      ]);
      setCurrentConsolidation(updatedConsolidation);
      setAvailableCargos(unassignedPool);
      setSelectedAvailableIds([]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to fetch manifest data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && consolidation) {
      refreshData();
    }
  }, [isOpen, consolidation?.id]);

  const assignedCargos: CargoConsolidationCargoItem[] = currentConsolidation?.cargos || [];

  const cap = currentConsolidation?.capacity || {
    max_volume_m3: currentConsolidation?.max_volume_capacity || 86,
    assigned_volume_m3: 0,
    remaining_volume_m3: currentConsolidation?.max_volume_capacity || 86,
    volume_utilization_percent: 0,
    max_weight_kg: currentConsolidation?.max_weight_capacity || 22000,
    assigned_weight_kg: 0,
    remaining_weight_kg: currentConsolidation?.max_weight_capacity || 22000,
    weight_utilization_percent: 0,
    total_cargos_count: 0,
  };

  // Selected available cargos simulation
  const selectedCargosData = useMemo(() => {
    return availableCargos.filter((c) => selectedAvailableIds.includes(c.id));
  }, [availableCargos, selectedAvailableIds]);

  const simulatedAdditionalVol = useMemo(() => {
    return selectedCargosData.reduce((sum, c) => sum + (c.volume || 0), 0);
  }, [selectedCargosData]);

  const simulatedAdditionalWt = useMemo(() => {
    return selectedCargosData.reduce((sum, c) => sum + (c.weight || 0), 0);
  }, [selectedCargosData]);

  const newProjectedVol = Math.round((cap.assigned_volume_m3 + simulatedAdditionalVol) * 10) / 10;
  const newProjectedVolPct =
    cap.max_volume_m3 > 0 ? Math.round((newProjectedVol / cap.max_volume_m3) * 1000) / 10 : 0;

  const isOverCapacity = newProjectedVol > cap.max_volume_m3;

  // Filter available cargos
  const filteredAvailable = useMemo(() => {
    if (!searchQuery.trim()) return availableCargos;
    const q = searchQuery.toLowerCase();
    return availableCargos.filter(
      (c) =>
        c.cargo.toLowerCase().includes(q) ||
        c.client_name.toLowerCase().includes(q) ||
        c.employee_name.toLowerCase().includes(q)
    );
  }, [availableCargos, searchQuery]);

  // Actions: Remove Cargo from Consolidation
  const handleRemoveCargo = async (cargoId: string) => {
    if (!currentConsolidation) return;
    setActionLoading(true);
    try {
      const updated = await cargoConsolidationsApi.removeCargos(currentConsolidation.id, [cargoId]);
      setCurrentConsolidation(updated);
      onUpdated(updated);
      await refreshData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to remove cargo from trip');
    } finally {
      setActionLoading(false);
    }
  };

  // Actions: Assign selected available cargos
  const handleAssignSelected = async () => {
    if (!currentConsolidation || selectedAvailableIds.length === 0) return;
    setActionLoading(true);
    try {
      const updated = await cargoConsolidationsApi.assignCargos(
        currentConsolidation.id,
        selectedAvailableIds
      );
      setCurrentConsolidation(updated);
      onUpdated(updated);
      setSelectedAvailableIds([]);
      setActiveSubTab('assigned');
      await refreshData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to assign cargos to trip');
    } finally {
      setActionLoading(false);
    }
  };

  // Actions: Assign single cargo
  const handleAssignSingle = async (cargoId: string) => {
    if (!currentConsolidation) return;
    setActionLoading(true);
    try {
      const updated = await cargoConsolidationsApi.assignCargos(currentConsolidation.id, [cargoId]);
      setCurrentConsolidation(updated);
      onUpdated(updated);
      await refreshData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to assign cargo');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen || !consolidation) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-surface border border-border shadow-2xl overflow-hidden my-auto"
        >
          {/* Top Accent Strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-brand-navy via-brand-gold to-brand-royal shrink-0" />

          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3 bg-muted/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30 shadow-xs">
                <Layers className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight font-mono">
                    {consolidation.container_truck_id}
                  </h2>
                  <span className="px-2 py-0.5 rounded-lg bg-brand-gold/15 text-brand-gold text-xs font-mono font-bold border border-brand-gold/30">
                    {consolidation.consolidation_code}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-bold">
                    {consolidation.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pt-0.5">
                  {consolidation.origin_place} → {consolidation.destination_place} •{' '}
                  {consolidation.carrier_name || 'Carrier'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {loading && <RefreshCw className="size-4 animate-spin text-brand-gold" />}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Live Capacity Meter Banner */}
          <div className="p-4 bg-muted/30 border-b border-border space-y-3 shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Volume Meter */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-surface border border-border">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1 text-foreground">
                    <Layers className="size-3.5 text-brand-gold" />
                    <T k="cnsVolumeCapacity" />
                  </span>
                  <span className="font-mono">
                    <strong>{cap.assigned_volume_m3}</strong> / {cap.max_volume_m3} m³ (
                    {cap.volume_utilization_percent}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border border-border/60">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      cap.volume_utilization_percent > 90 ? 'bg-amber-500' : 'bg-brand-gold'
                    }`}
                    style={{ width: `${Math.min(100, cap.volume_utilization_percent)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{cap.remaining_volume_m3} m³ available</span>
                  <span>{cap.total_cargos_count} loads inside</span>
                </div>
              </div>

              {/* Weight Meter */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-surface border border-border">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-foreground">
                    <T k="cnsWeightCapacity" />
                  </span>
                  <span className="font-mono">
                    <strong>{cap.assigned_weight_kg.toLocaleString()}</strong> /{' '}
                    {cap.max_weight_kg.toLocaleString()} kg ({cap.weight_utilization_percent}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border border-border/60">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, cap.weight_utilization_percent)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{cap.remaining_weight_kg.toLocaleString()} kg available</span>
                  <span>Max Gross Weight</span>
                </div>
              </div>
            </div>

            {/* Simulated addition warning/status if adding available cargos */}
            {selectedAvailableIds.length > 0 && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  isOverCapacity
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isOverCapacity ? (
                    <AlertTriangle className="size-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="size-4 shrink-0" />
                  )}
                  <span>
                    Selected {selectedAvailableIds.length} cargos (+{simulatedAdditionalVol} m³, +
                    {simulatedAdditionalWt} kg) → Projected Fill:{' '}
                    <strong>
                      {newProjectedVol} / {cap.max_volume_m3} m³ ({newProjectedVolPct}%)
                    </strong>
                  </span>
                </div>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleAssignSelected}
                  className="px-3 py-1 rounded-lg bg-brand-gold text-brand-navy font-bold text-xs shadow-xs hover:bg-brand-gold/90 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <T k="cnsBatchAdd" />
                </button>
              </div>
            )}
          </div>

          {/* Sub Tabs Selector */}
          <div className="px-4 pt-3 border-b border-border bg-surface flex items-center justify-between gap-3 shrink-0">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setActiveSubTab('assigned')}
                className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                  activeSubTab === 'assigned'
                    ? 'border-brand-gold text-brand-gold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Package className="size-3.5" />
                <span>
                  <T k="cnsAttachedCargosTab" /> ({assignedCargos.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('available')}
                className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                  activeSubTab === 'available'
                    ? 'border-brand-gold text-brand-gold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Plus className="size-3.5" />
                <span>
                  <T k="cnsAvailableCargosTab" /> ({availableCargos.length})
                </span>
              </button>
            </div>

            {activeSubTab === 'available' && (
              <div className="relative pb-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search available loads..."
                  className="pl-8 pr-3 py-1 rounded-lg border border-border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-gold/50 w-48 sm:w-64"
                />
                <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-2" />
              </div>
            )}
          </div>

          {/* Scrollable Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* TAB 1: Assigned Cargos Manifest */}
            {activeSubTab === 'assigned' && (
              <div className="space-y-4">
                {assignedCargos.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="p-3 rounded-2xl bg-muted inline-block text-muted-foreground">
                      <Package className="size-8 opacity-60" />
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      <T k="cnsNoCargosInTrip" />
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('available')}
                      className="px-4 py-2 rounded-xl bg-brand-gold text-brand-navy font-bold text-xs shadow-xs hover:bg-brand-gold/90 transition-colors cursor-pointer"
                    >
                      + Browse Unassigned Cargos
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold">
                          <th className="py-2.5 px-3">Cargo Description</th>
                          <th className="py-2.5 px-3">Client</th>
                          <th className="py-2.5 px-3">Manager</th>
                          <th className="py-2.5 px-3">Volume (m³)</th>
                          <th className="py-2.5 px-3">Weight (kg)</th>
                          <th className="py-2.5 px-3">Client Price</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {assignedCargos.map((cargo) => (
                          <tr key={cargo.id} className="hover:bg-muted/20 transition-colors">
                            <td className="py-3 px-3 font-bold text-foreground">{cargo.cargo}</td>
                            <td className="py-3 px-3 text-muted-foreground">
                              {cargo.client?.name || '—'}
                            </td>
                            <td className="py-3 px-3 text-muted-foreground">
                              {cargo.employee?.name || '—'}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-foreground">
                              {cargo.volume} m³
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-foreground">
                              {cargo.weight} kg
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {formatMoney(
                                cargo.sell_price.amount,
                                cargo.sell_price.currency as any
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground border border-border">
                                {cargo.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleRemoveCargo(cargo.id)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold text-[11px] transition-colors disabled:opacity-50 cursor-pointer"
                                title="Remove from this consolidation"
                              >
                                <T k="cnsRemoveFromTrip" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Available Unassigned Cargos Pool */}
            {activeSubTab === 'available' && (
              <div className="space-y-4">
                {filteredAvailable.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-xs italic">
                    <T k="cnsNoAvailableCargos" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold px-1">
                      <span>Select LTL orders to consolidate into this truck:</span>
                      <span>{filteredAvailable.length} available</span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold">
                            <th className="py-2.5 px-3 w-10 text-center"></th>
                            <th className="py-2.5 px-3">Cargo Description</th>
                            <th className="py-2.5 px-3">Client</th>
                            <th className="py-2.5 px-3">Manager</th>
                            <th className="py-2.5 px-3">Volume (m³)</th>
                            <th className="py-2.5 px-3">Weight (kg)</th>
                            <th className="py-2.5 px-3">Sell Price</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {filteredAvailable.map((c) => {
                            const isChecked = selectedAvailableIds.includes(c.id);
                            return (
                              <tr
                                key={c.id}
                                className={`hover:bg-muted/20 transition-colors ${
                                  isChecked ? 'bg-brand-gold/10' : ''
                                }`}
                              >
                                <td className="py-3 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() =>
                                      setSelectedAvailableIds((prev) =>
                                        prev.includes(c.id)
                                          ? prev.filter((x) => x !== c.id)
                                          : [...prev, c.id]
                                      )
                                    }
                                    className="rounded border-border text-brand-gold focus:ring-brand-gold/50 cursor-pointer"
                                  />
                                </td>
                                <td className="py-3 px-3 font-bold text-foreground">{c.cargo}</td>
                                <td className="py-3 px-3 text-muted-foreground">{c.client_name}</td>
                                <td className="py-3 px-3 text-muted-foreground">
                                  {c.employee_name}
                                </td>
                                <td className="py-3 px-3 font-mono font-bold text-foreground">
                                  {c.volume} m³
                                </td>
                                <td className="py-3 px-3 font-mono font-bold text-foreground">
                                  {c.weight} kg
                                </td>
                                <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  ${c.sell_price}
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => handleAssignSingle(c.id)}
                                    className="px-2.5 py-1 rounded-lg bg-brand-gold/15 hover:bg-brand-gold/25 text-brand-gold border border-brand-gold/30 font-bold text-[11px] transition-colors disabled:opacity-50 cursor-pointer"
                                  >
                                    <T k="cnsAddToTrip" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-muted-foreground">
              Total Manifest Loads: <strong>{assignedCargos.length}</strong>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
