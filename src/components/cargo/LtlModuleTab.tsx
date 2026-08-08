import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Layers,
  Percent,
  RefreshCw,
  X,
  CheckCircle,
  UserCheck,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import {
  cargoKpiApi,
  calculateLtlItemBaseRate,
} from '../../services/cargoKpi.service';
import type {
  LtlItemsResponse,
  LtlEmployeeSummary,
  LtlCargoItem,
  LtlCargoType,
} from '../../services/cargoKpi.service';

import { EmployeeSelect } from './EmployeeSelect';

const CARGO_TYPES: { key: LtlCargoType; labelKey: string; hint: string }[] = [
  { key: 'oddiy', labelKey: 'cargoTypeOddiy', hint: 'Density rate ($3 - $10 / m³)' },
  { key: 'lyustra', labelKey: 'cargoTypeLyustra', hint: 'Fixed rate ($3 / m³)' },
  { key: 'pod_klyuch', labelKey: 'cargoTypePodKlyuch', hint: 'Standard + $5 ($8 - $15 / m³)' },
];

const VOLUME_COEFF_TIERS = [
  { range: '< 21 m³', coeff: '0%', text: '0.00' },
  { range: '21 – 40 m³', coeff: '50%', text: '0.50' },
  { range: '40 – 60 m³', coeff: '80%', text: '0.80' },
  { range: '60 – 74 m³', coeff: '90%', text: '0.90' },
  { range: '74 – 80 m³', coeff: '100%', text: '1.00' },
  { range: '> 80 m³', coeff: '120%', text: '1.20' },
];

export function LtlModuleTab() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  const [data, setData] = useState<LtlItemsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem] = useState<LtlCargoItem | null>(null);

  // Modal form states
  const [selectedEmpId, setSelectedEmpId] = useState<string>('b1a2c3d4-e5f6-7890-abcd-ef1234567890');
  const [volumeStr, setVolumeStr] = useState<string>('10');
  const [weightStr, setWeightStr] = useState<string>('1000');
  const [cargoType, setCargoType] = useState<LtlCargoType>('oddiy');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadLtlData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cargoKpiApi.getLtlItems();
      setData(res);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to load LTL items', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadLtlData();
  }, [loadLtlData]);

  const handleClearAll = async () => {
    if (!window.confirm(t('confirmResetLtl') || 'Are you sure you want to clear all LTL items?')) return;
    try {
      await cargoKpiApi.resetLtlItems();
      showNotification('All LTL cargo items cleared', 'success');
      loadLtlData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to reset LTL items', 'error');
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vol = parseFloat(volumeStr);
    const wt = parseFloat(weightStr);
    if (isNaN(vol) || vol <= 0 || isNaN(wt) || wt < 0 || !selectedEmpId) {
      showNotification('Please select an employee and provide valid volume and weight.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await cargoKpiApi.updateLtlItem(editingItem.id, {
          employee_id: selectedEmpId,
          volume: vol,
          weight: wt,
          cargo_type: cargoType,
        });
        showNotification(t('successCargoUpdated') || 'Cargo item updated successfully', 'success');
      } else {
        await cargoKpiApi.createLtlItem({
          employee_id: selectedEmpId,
          volume: vol,
          weight: wt,
          cargo_type: cargoType,
        });
        showNotification(t('successCargoAdded') || 'Cargo item added successfully', 'success');
      }
      setIsModalOpen(false);
      loadLtlData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to save LTL item', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Preview calculations in Modal
  const modalPreview = useMemo(() => {
    const v = parseFloat(volumeStr) || 0;
    const w = parseFloat(weightStr) || 0;
    const density = v > 0 ? Math.round((w / v) * 100) / 100 : 0;
    const baseRate = calculateLtlItemBaseRate(density, cargoType);
    const baseKpi = Math.round(v * baseRate * 100) / 100;
    return { density, baseRate, baseKpi };
  }, [volumeStr, weightStr, cargoType]);

  return (
    <div className="space-y-6">
      {/* Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Package className="size-6 text-brand-gold" />
            {t('tabLtlKpi')}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Groupage LTL cargo tracking, volume tier multiplier calculation & KPI finalization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadLtlData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border hover:bg-muted text-foreground transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleClearAll}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all cursor-pointer"
          >
            {t('btnResetLtl')}
          </button>
        </div>
      </div>

      {/* Read-Only Notice Banner */}
      <div className="p-3 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center justify-between gap-3">
        <span>
          <strong>Read-Only View:</strong> Cargo registrations are registered exclusively in the <strong>Cargo Transactions</strong> tab.
        </span>
      </div>

      {/* Volume Coefficient Schedule Reference */}
      <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-foreground flex items-center gap-1.5">
            <Percent className="size-4 text-brand-gold" />
            Volume Coefficient Scale (Volume_coeff)
          </span>
          <span className="text-muted-foreground text-[11px]">Final LTL KPI = Total Base KPI × Volume_coeff</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {VOLUME_COEFF_TIERS.map((tier, idx) => (
            <div key={idx} className="p-2 rounded-lg bg-surface border border-border/60 text-center">
              <span className="text-muted-foreground block text-[10px]">{tier.range}</span>
              <span className="text-xs font-extrabold text-brand-gold mt-0.5 block">{tier.coeff} ({tier.text})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Employee Grouped Cards */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground">
          <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-brand-gold" />
          <p className="text-xs">Loading LTL items and calculating coefficients...</p>
        </div>
      ) : !data || data.employees.length === 0 ? (
        <div className="p-12 rounded-2xl bg-surface border border-border text-center text-muted-foreground">
          <Layers className="size-10 mx-auto mb-3 text-muted-foreground/40" />
          <h4 className="text-sm font-bold text-foreground">No LTL Cargo Items</h4>
          <p className="text-xs mt-1">Add your first LTL cargo item to see employee volume coefficients and KPI results.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.employees.map((emp: LtlEmployeeSummary, empIdx: number) => (
            <motion.div
              key={emp.employee_name || empIdx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: empIdx * 0.05 }}
              className="rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm overflow-hidden"
            >
              {/* Employee Header Banner */}
              <div className="p-5 bg-gradient-to-r from-brand-navy/90 to-brand-royal/90 text-white border-b border-brand-gold/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                    <UserCheck className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{emp.employee_name}</h3>
                    <p className="text-xs text-neutral-300">
                      {emp.items.length} Cargo Shipment{emp.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* KPI Metrics Chips */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10">
                    <span className="text-neutral-400 block text-[10px]">{t('ltlTotalVolume')}</span>
                    <strong className="text-white text-sm">{emp.total_volume} m³</strong>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10">
                    <span className="text-neutral-400 block text-[10px]">{t('ltlBaseKpi')}</span>
                    <strong className="text-white text-sm">${emp.total_base_kpi}</strong>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-brand-gold/20 border border-brand-gold/40 text-brand-gold">
                    <span className="text-brand-gold/80 block text-[10px]">{t('ltlVolumeCoeff')}</span>
                    <strong className="text-brand-gold text-sm">{emp.volume_coefficient_percentage} ({emp.volume_coefficient})</strong>
                  </div>
                  <div className="px-4 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                    <span className="text-emerald-300/80 block text-[10px]">{t('ltlFinalKpi')}</span>
                    <strong className="text-emerald-400 text-base font-black">${emp.final_ltl_kpi}</strong>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">{t('cargoType')}</th>
                      <th className="px-4 py-3">{t('cargoVolume')}</th>
                      <th className="px-4 py-3">{t('cargoWeight')}</th>
                      <th className="px-4 py-3">{t('cargoDensity')}</th>
                      <th className="px-4 py-3">{t('ltlBaseRate')}</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {emp.items.map((item: LtlCargoItem) => (
                      <tr key={item.id} className="hover:bg-muted/20 text-foreground transition-colors">
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize ${
                            item.cargo_type === 'lyustra'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : item.cargo_type.includes('pod')
                                ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          }`}>
                            {item.cargo_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold">{item.volume} m³</td>
                        <td className="px-4 py-3">{item.weight} kg</td>
                        <td className="px-4 py-3 font-mono">{item.density} kg/m³</td>
                        <td className="px-4 py-3 font-semibold text-brand-gold">${item.base_rate} / m³</td>
                        <td className="px-4 py-3 font-bold text-foreground">${item.base_kpi}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-[10px] font-bold text-muted-foreground px-2 py-0.5 rounded bg-muted">
                            Read-Only
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Cargo Item Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg rounded-2xl bg-surface dark:bg-surface border border-border shadow-2xl overflow-hidden z-10"
            >
              {/* Modal Header */}
              <div className="p-5 bg-gradient-to-r from-brand-navy to-brand-royal text-white border-b border-brand-gold/20 flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Package className="size-5 text-brand-gold" />
                  {editingItem ? 'Edit Cargo Item' : t('btnAddCargo')}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
                <div>
                  <EmployeeSelect
                    label="Employee"
                    required
                    value={selectedEmpId}
                    onChange={(id) => {
                      setSelectedEmpId(id);
                    }}
                    placeholder="Search employee by name or phone..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      {t('cargoVolume')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={volumeStr}
                      onChange={(e) => setVolumeStr(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      {t('cargoWeight')}
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      required
                      value={weightStr}
                      onChange={(e) => setWeightStr(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {t('cargoType')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {CARGO_TYPES.map((ct) => (
                      <button
                        type="button"
                        key={ct.key}
                        onClick={() => setCargoType(ct.key)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                          cargoType === ct.key
                            ? 'bg-brand-gold/15 border-brand-gold text-brand-gold shadow-sm'
                            : 'border-border bg-background text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {t(ct.labelKey as any) || ct.key}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calculation Live Preview Card */}
                <div className="p-3.5 rounded-xl bg-muted/50 border border-border text-xs space-y-1.5">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Calculated Density:</span>
                    <span className="font-mono font-bold text-foreground">{modalPreview.density} kg/m³</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Base Rate:</span>
                    <span className="font-bold text-brand-gold">${modalPreview.baseRate} / m³</span>
                  </div>
                  <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border">
                    <span>Base KPI Amount:</span>
                    <span className="text-emerald-500">${modalPreview.baseKpi}</span>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border hover:bg-muted text-foreground transition-all"
                  >
                    {t('actionCancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-gold hover:bg-brand-gold/90 text-brand-navy shadow-md transition-all flex items-center gap-2"
                  >
                    {submitting ? (
                      <RefreshCw className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle className="size-4" />
                    )}
                    {editingItem ? t('actionSave') : t('actionCreate')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
