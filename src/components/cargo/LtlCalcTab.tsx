import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  Scale,
  Box,
  DollarSign,
  CheckCircle,
  Info,
  Sparkles,
  Navigation,
  Calendar,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { calculateLtlPrice } from '../../services/cargoKpi.service';
import type { LtlCalculateResult, LtlRoute } from '../../services/cargoKpi.service';
import { NumberInput } from '../NumberInput';
import { Select, type SelectOption } from '../Select';

interface TierItem {
  minD: number;
  maxD: number;
  basis: 'hajm';
  rate: number;
  unit: string;
  desc: string;
}

const ROUTE_TIERS_CONFIG: Record<LtlRoute, TierItem[]> = {
  'yiwu-tashkent': [
    { minD: 0, maxD: 100, basis: 'hajm', rate: 120, unit: 'USD/m³', desc: '0 - 100 kg/m³' },
    { minD: 100, maxD: 200, basis: 'hajm', rate: 130, unit: 'USD/m³', desc: '101 - 200 kg/m³' },
    { minD: 200, maxD: 300, basis: 'hajm', rate: 150, unit: 'USD/m³', desc: '201 - 300 kg/m³' },
    { minD: 300, maxD: 400, basis: 'hajm', rate: 160, unit: 'USD/m³', desc: '301 - 400 kg/m³' },
    { minD: 400, maxD: 500, basis: 'hajm', rate: 180, unit: 'USD/m³', desc: '401 - 500 kg/m³' },
    {
      minD: 500,
      maxD: Infinity,
      basis: 'hajm',
      rate: 200,
      unit: 'USD/m³',
      desc: '501 - 700 kg/m³',
    },
  ],
  'zhongshan-tashkent': [
    { minD: 0, maxD: 100, basis: 'hajm', rate: 110, unit: 'USD/m³', desc: '0 - 100 kg/m³' },
    { minD: 100, maxD: 200, basis: 'hajm', rate: 120, unit: 'USD/m³', desc: '101 - 200 kg/m³' },
    { minD: 200, maxD: 300, basis: 'hajm', rate: 140, unit: 'USD/m³', desc: '201 - 300 kg/m³' },
    { minD: 300, maxD: 400, basis: 'hajm', rate: 150, unit: 'USD/m³', desc: '301 - 400 kg/m³' },
    { minD: 400, maxD: 500, basis: 'hajm', rate: 170, unit: 'USD/m³', desc: '401 - 500 kg/m³' },
    {
      minD: 500,
      maxD: Infinity,
      basis: 'hajm',
      rate: 190,
      unit: 'USD/m³',
      desc: '501 - 700 kg/m³',
    },
  ],
};

export function LtlCalcTab() {
  const { t } = useTranslation();
  const [selectedRoute, setSelectedRoute] = useState<LtlRoute>('yiwu-tashkent');
  const [volumeInput, setVolumeInput] = useState<string>('2.5');
  const [weightInput, setWeightInput] = useState<string>('500');

  const routeOptions: SelectOption[] = useMemo(
    () => [
      {
        value: 'yiwu-tashkent',
        label: t('routeYiwuTashkent') || 'Yiwu — Toshkent',
        description: 'China (Yiwu) → Uzbekistan (Tashkent)',
      },
      {
        value: 'zhongshan-tashkent',
        label: t('routeZhongshanTashkent') || 'Zhongshan — Toshkent',
        description: 'China (Zhongshan) → Uzbekistan (Tashkent)',
      },
    ],
    [t]
  );

  const volume = useMemo(() => {
    const parsed = parseFloat(volumeInput);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }, [volumeInput]);

  const weight = useMemo(() => {
    const parsed = parseFloat(weightInput);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }, [weightInput]);

  const calcResult: LtlCalculateResult = useMemo(() => {
    return calculateLtlPrice(volume, weight, selectedRoute);
  }, [volume, weight, selectedRoute]);

  const activeTiers = ROUTE_TIERS_CONFIG[selectedRoute];

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
                {t('ltlCalcSubtitle') ||
                  'Density-based automated LTL tariff & price evaluation system'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs text-neutral-200">
            <Sparkles className="size-4 text-brand-gold" />
            <span>{t('densityFormula') || 'Formula: Density (D) = Weight (kg) / Volume (m³)'}</span>
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
              {t('cargoDimensions') || 'Cargo Dimensions'}
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold">
              {t('liveInput') || 'Live Input'}
            </span>
          </div>

          {/* Route Corridor Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Navigation className="size-3.5 text-brand-gold" />
                {t('ltlRouteSelect') || 'Transport Route'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-brand-gold/15 text-brand-gold font-bold">
                {selectedRoute === 'zhongshan-tashkent' ? 'ZHONGSHAN' : 'YIWU'}
              </span>
            </label>
            <Select
              value={selectedRoute}
              onChange={(val) => setSelectedRoute((val as LtlRoute) || 'yiwu-tashkent')}
              options={routeOptions}
              allowClear={false}
              size="md"
              aria-label="Transport Route"
            />
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
              {t('quickPresets') || 'Quick Presets'}
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: t('presetSmallBox') || 'Small Box', v: '0.5', w: '40' },
                { label: t('presetStandardPallet') || 'Standard Pallet', v: '1.2', w: '250' },
                { label: t('presetHeavyCargo') || 'Heavy Cargo', v: '1.5', w: '1200' },
                { label: t('presetBulkCargo') || 'Bulk Cargo', v: '15.0', w: '1200' },
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
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-brand-gold font-bold">
                    {t('cargoTotalPrice')}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-neutral-200 border border-white/10 font-bold uppercase">
                    {selectedRoute === 'zhongshan-tashkent'
                      ? 'Zhongshan → Toshkent'
                      : 'Yiwu → Toshkent'}
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-0.5">
                  {t('calculatedTariffResult') || 'Calculated Tariff Result'}
                </p>
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
                  {t('calcBasis') || 'Basis'}:{' '}
                  <strong className="text-white uppercase">
                    {t('volumeBased') || 'Volume-based'}
                  </strong>{' '}
                  ({calcResult.volume} m³ @ ${calcResult.rate} {calcResult.unit})
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
                <span className="text-[11px] text-neutral-400 block">
                  {t('tariffUnit') || 'Tariff Unit'}
                </span>
                <span className="text-xs font-bold text-white mt-1 block truncate">
                  {calcResult.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Official Tariff Conditions & Notice Banner */}
          <div className="p-4 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm text-xs text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Info className="size-4 text-brand-gold shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-foreground font-medium leading-relaxed">
                  {t('ltlPriceNote') ||
                    'Prices include warehouse expenses in China. Customs clearance and company services are billed separately.'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  +998 94 092 22 22 &bull; wedef.uz
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold text-[11px] shrink-0">
              <Calendar className="size-3.5" />
              <span>{t('ltlValidityNote') || 'Rates valid until 30.11.2026'}</span>
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
              {t('densityRulesSchedule') || 'Density Bracket Tariff Rules Schedule'}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5" />
            <span>
              {t('activeTierHint') || 'Active tier highlighted based on current cargo density'}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">
                  {t('colDensityBracket') || 'Density Bracket Condition'}
                </th>
                <th className="px-4 py-3">{t('colCalculationBasis') || 'Calculation Basis'}</th>
                <th className="px-4 py-3">{t('colAppliedRate') || 'Applied Rate'}</th>
                <th className="px-4 py-3">{t('tariffUnit') || 'Tariff Unit'}</th>
                <th className="px-4 py-3">{t('colFormula') || 'Formula'}</th>
                <th className="px-4 py-3 text-right">{t('colStatus') || 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeTiers.map((tier, idx) => {
                const isActive =
                  idx === 0
                    ? calcResult.density <= tier.maxD
                    : tier.maxD === Infinity
                      ? calcResult.density > tier.minD
                      : calcResult.density > tier.minD && calcResult.density <= tier.maxD;

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
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {tier.basis} ({t('volumeBased') || 'Volume'})
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">${tier.rate}</td>
                    <td className="px-4 py-3">{tier.unit}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">V × ${tier.rate}</td>
                    <td className="px-4 py-3 text-right">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-gold text-brand-navy shadow-sm">
                          <CheckCircle className="size-3" /> {t('activeTier') || 'Active Tier'}
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
