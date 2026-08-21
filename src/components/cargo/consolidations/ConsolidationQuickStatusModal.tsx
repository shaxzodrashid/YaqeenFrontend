import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Truck,
  Calendar,
  MapPin,
  Clock,
  Shield,
  Repeat,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { T } from '../../T';
import { CONSOLIDATION_STATUSES, cargoConsolidationsApi } from '../../../services/api';
import type { CargoConsolidation, ConsolidationStatus } from '../../../services/api';

interface ConsolidationQuickStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  consolidation: CargoConsolidation | null;
  onSuccess: (updated: CargoConsolidation) => void;
}

const STATUS_ICONS: Record<ConsolidationStatus, React.ReactNode> = {
  Planning: <Clock className="size-4" />,
  Loading: <Package className="size-4" />,
  'On the way': <Truck className="size-4" />,
  Station: <MapPin className="size-4" />,
  'On the border': <Shield className="size-4" />,
  Reload: <Repeat className="size-4" />,
  Arrived: <CheckCircle2 className="size-4" />,
  Completed: <CheckCircle2 className="size-4" />,
};

export function ConsolidationQuickStatusModal({
  isOpen,
  onClose,
  consolidation,
  onSuccess,
}: ConsolidationQuickStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<ConsolidationStatus>('Planning');
  const [departureDate, setDepartureDate] = useState('');
  const [arrivedDate, setArrivedDate] = useState('');
  const [syncStatusToCargos, setSyncStatusToCargos] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && consolidation) {
      setSelectedStatus(consolidation.status);
      setDepartureDate(consolidation.departure_date || new Date().toISOString().split('T')[0]);
      setArrivedDate(consolidation.arrived_date || new Date().toISOString().split('T')[0]);
      setSyncStatusToCargos(true);
      setErrorMsg('');
    }
  }, [isOpen, consolidation]);

  if (!isOpen || !consolidation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const updateData: any = {
        status: selectedStatus,
        sync_status_to_cargos: syncStatusToCargos,
      };

      if (selectedStatus === 'On the way' && departureDate) {
        updateData.departure_date = departureDate;
      }
      if (selectedStatus === 'Arrived' && arrivedDate) {
        updateData.arrived_date = arrivedDate;
        updateData.sync_dates_to_cargos = true;
      }

      const updated = await cargoConsolidationsApi.update(consolidation.id, updateData);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg rounded-3xl bg-surface border border-border shadow-2xl overflow-hidden my-auto"
        >
          {/* Top Accent Strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-brand-navy via-brand-gold to-brand-royal" />

          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3 bg-muted/20">
            <div>
              <h2 className="text-base font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <span>Update Status for</span>
                <span className="font-mono text-brand-gold">
                  {consolidation.container_truck_id}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground pt-0.5">
                {consolidation.consolidation_code} • {consolidation.origin_place} →{' '}
                {consolidation.destination_place}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Status Selection Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Status Stepper Grid */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Select New Trip Status:</label>
              <div className="grid grid-cols-2 gap-2">
                {CONSOLIDATION_STATUSES.map((st) => {
                  const isSelected = selectedStatus === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedStatus(st)}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-brand-gold text-brand-navy border-brand-gold shadow-md font-black'
                          : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted border-border/70'
                      }`}
                    >
                      <span className={isSelected ? 'text-brand-navy' : 'text-brand-gold'}>
                        {STATUS_ICONS[st]}
                      </span>
                      <span className="truncate">{st}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contextual Date Picker */}
            {selectedStatus === 'On the way' && (
              <div className="space-y-1 pt-1">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-blue-500" />
                  <span>Set Departure Date</span>
                </label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                />
              </div>
            )}

            {selectedStatus === 'Arrived' && (
              <div className="space-y-1 pt-1">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-emerald-500" />
                  <span>Set Actual Arrival Date</span>
                </label>
                <input
                  type="date"
                  value={arrivedDate}
                  onChange={(e) => setArrivedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                />
              </div>
            )}

            {/* Cascade Sync Option */}
            <div className="p-3.5 rounded-2xl bg-brand-gold/10 border border-brand-gold/30">
              <label className="flex items-center gap-2.5 text-xs font-semibold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncStatusToCargos}
                  onChange={(e) => setSyncStatusToCargos(e.target.checked)}
                  className="rounded border-border text-brand-gold focus:ring-brand-gold/50"
                />
                <span>
                  <T k="cnsSyncStatusToCargos" /> ({consolidation.capacity?.total_cargos_count || 0}{' '}
                  shipments)
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-brand-gold to-amber-500 hover:from-brand-gold/90 hover:to-amber-500/90 text-brand-navy font-bold text-xs shadow-md shadow-brand-gold/20 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {saving ? <span>Updating...</span> : <span>Confirm Status</span>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
