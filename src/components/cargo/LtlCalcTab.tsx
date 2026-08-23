import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Scale, Box, DollarSign, CheckCircle, Info, Sparkles } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { calculateLtlPrice } from '../../services/cargoKpi.service';
import type { LtlCalculateResult } from '../../services/cargoKpi.service';
import { NumberInput } from '../NumberInput';

const RATE_TABLE_TIERS = [
  { minD: 0, maxD: 100, basis: 'hajm', rate: 100, unit: 'USD/m³', desc: 'D ≤ 100 kg/m³' },
  { minD: 100, maxD: 200, basis: 'hajm', rate: 110, unit: 'USD/m³', desc: '100 < D ≤ 200 kg/m³' },
  { minD: 200, maxD: 300, basis: 'hajm', rate: 130, unit: 'USD/m³', desc: '200 < D ≤ 300 kg/m³' },
  { minD: 300, maxD: 400, basis: 'hajm', rate: 140, unit: 'USD/m³', desc: '300 < D ≤ 400 kg/m³' },
  { minD: 400, maxD: 500, basis: 'hajm', rate: 160, unit: 'USD/m³', desc: '400 < D ≤ 500 kg/m³' },
  { minD: 500, maxD: 700, basis: 'hajm', rate: 180, unit: 'USD/m³', desc: '500 < D ≤ 700 kg/m³' },
  { minD: 700, maxD: 1000, basis: 'vazn', rate: 0.4, unit: 'USD/kg', desc: '700 < D ≤ 1000 kg/m³' },
  { minD: 1000, maxD: Infinity, basis: 'vazn', rate: 0.3, unit: 'USD/kg', desc: 'D > 1000 kg/m³' },
];

export function LtlCalcTab() {
  const { t } = useTranslation();
  const [volumeInput, setVolumeInput] = useState<string>('2.5');
  const [weightInput, setWeightInput] = useState<string>('500');

  const volume = useMemo(() => {
    const parsed = parseFloat(volumeInput);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }, [volumeInput]);

  const weight = useMemo(() => {
    const parsed = parseFloat(weightInput);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }, [weightInput]);

  const calcResult: LtlCalculateResult = useMemo(() => {
    return calculateLtlPrice(volume, weight);
  }, [volume, weight]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-navy/90 via-brand-royal/80 to-brand-navy border border-brand-gold/20 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-6 -translate-y-6 w-40 h-40 bg-brand-gold/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
              <Calculator className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">{t('tabLtlCalc')}</h2>
              <p className="text-xs text-neutral-300 mt-1">
                Density-based automated LTL tariff & price evaluation system
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs text-neutral-200">
            <Sparkles className="size-4 text-brand-gold" />
            <span>Formula: Density (D) = Weight (kg) / Volume (m³)</span>
          </div>
        </div>
      </div>

      {/* Input & Instant Output Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters Controls */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-5 p-6 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm space-y-5"
        >
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Box className="size-5 text-brand-gold" />
              Cargo Dimensions
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold">
              Live Input
            </span>
          </div>

          {/* Volume Input */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              {t('cargoVolume')}
            </label>
            <NumberInput
              size="md"
              allowDecimals={true}
              decimalScale={3}
              min={0}
              value={volumeInput}
              onValueChange={(_num, raw) => setVolumeInput(raw)}
              placeholder="e.g. 2.5"
              suffix="m³"
              inputClassName="text-sm font-semibold"
            />
          </div>

          {/* Weight Input */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              {t('cargoWeight')}
            </label>
            <NumberInput
              size="md"
              allowDecimals={true}
              decimalScale={2}
              min={0}
              value={weightInput}
              onValueChange={(_num, raw) => setWeightInput(raw)}
              placeholder="e.g. 500"
              suffix="kg"
              inputClassName="text-sm font-semibold"
            />
          </div>

          {/* Quick preset buttons */}
          <div>
            <span className="text-xs text-muted-foreground mb-2 block font-medium">
              Quick Presets
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Small Box', v: '0.5', w: '40' },
                { label: 'Standard Pallet', v: '1.2', w: '250' },
                { label: 'Heavy Cargo', v: '1.5', w: '1200' },
                { label: 'Bulk Cargo', v: '15.0', w: '1200' },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setVolumeInput(preset.v);
                    setWeightInput(preset.w);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-border/40 hover:bg-brand-gold/15 hover:text-brand-gold text-foreground transition-all cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Live Calculation Output Display */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-7 flex flex-col gap-4"
        >
          {/* Main Price Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-navy via-brand-royal to-brand-navy border border-brand-gold/30 text-white shadow-lg relative overflow-hidden flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-brand-gold font-bold">
                  {t('cargoTotalPrice')}
                </span>
                <p className="text-xs text-neutral-300 mt-0.5">Calculated Tariff Result</p>
              </div>
              <div className="p-2.5 rounded-xl bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                <DollarSign className="size-6" />
              </div>
            </div>

            <div className="py-6 my-auto">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-black tracking-tight text-white">
                  $
                  {calcResult.total_price.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-sm font-semibold text-brand-gold">USD</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-neutral-300">
                <CheckCircle className="size-4 text-emerald-400" />
                <span>
                  Basis: <strong className="text-white uppercase">{calcResult.basis}</strong> (
                  {calcResult.basis === 'vazn' ? 'Weight-based' : 'Volume-based'}) @ $
                  {calcResult.rate} {calcResult.unit}
                </span>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[11px] text-neutral-400 block">{t('cargoDensity')}</span>
                <span className="text-base font-bold text-white mt-0.5 block">
                  {calcResult.density}{' '}
                  <span className="text-xs font-normal text-neutral-400">kg/m³</span>
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[11px] text-neutral-400 block">{t('cargoRate')}</span>
                <span className="text-base font-bold text-brand-gold mt-0.5 block">
                  ${calcResult.rate}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[11px] text-neutral-400 block">Tariff Unit</span>
                <span className="text-xs font-bold text-white mt-1 block truncate">
                  {calcResult.unit}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Rate Schedule & Density Rules Table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="size-5 text-brand-gold" />
            <h3 className="text-base font-bold text-foreground">
              Density Bracket Tariff Rules Schedule
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5" />
            <span>Active tier highlighted based on current cargo density</span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Density Bracket Condition</th>
                <th className="px-4 py-3">Calculation Basis</th>
                <th className="px-4 py-3">Applied Rate</th>
                <th className="px-4 py-3">Tariff Unit</th>
                <th className="px-4 py-3">Formula</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {RATE_TABLE_TIERS.map((tier, idx) => {
                const isActive =
                  calcResult.density >= tier.minD &&
                  (tier.maxD === Infinity
                    ? calcResult.density > 1000
                    : calcResult.density <= tier.maxD);

                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      isActive
                        ? 'bg-brand-gold/15 font-semibold text-brand-navy dark:text-brand-gold'
                        : 'hover:bg-muted/30 text-foreground'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono">{tier.desc}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                          tier.basis === 'vazn'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {tier.basis} ({tier.basis === 'vazn' ? 'Weight' : 'Volume'})
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">${tier.rate}</td>
                    <td className="px-4 py-3">{tier.unit}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {tier.basis === 'vazn' ? `W × $${tier.rate}` : `V × $${tier.rate}`}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-gold text-brand-navy shadow-sm">
                          <CheckCircle className="size-3" /> Active Tier
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
