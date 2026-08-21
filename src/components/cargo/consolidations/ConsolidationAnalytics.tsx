import { Globe, Truck } from 'lucide-react';
import { T } from '../../T';
import type { CargoConsolidation } from '../../../services/api';
import { formatMoney } from '../../../types/currency';

interface ConsolidationAnalyticsProps {
  consolidations: CargoConsolidation[];
}

export function ConsolidationAnalytics({ consolidations }: ConsolidationAnalyticsProps) {
  // 1. Group by Trade Corridor
  const corridorMap: Record<
    string,
    {
      name: string;
      originCountry: string;
      tripsCount: number;
      totalVolume: number;
      maxVolume: number;
      totalSellUsd: number;
      totalCarrierCostUsd: number;
      netMarginUsd: number;
    }
  > = {};

  // 2. Group by Carrier
  const carrierMap: Record<
    string,
    {
      name: string;
      phone: string;
      tripsCount: number;
      totalVolume: number;
      totalWeight: number;
      totalCostUsd: number;
      totalMarginUsd: number;
      activeTrips: number;
    }
  > = {};

  let underutilizedCount = 0; // < 50%
  let optimalCount = 0; // 50% - 90%
  let maxedCount = 0; // > 90%

  consolidations.forEach((item) => {
    // Corridor grouping
    const origin = item.origin_place || 'Other';
    let corridorName = 'Other Routes';
    let country = 'Global';

    if (
      origin.toLowerCase().includes('turkey') ||
      origin.toLowerCase().includes('istanbul') ||
      origin.toLowerCase().includes('bursa')
    ) {
      corridorName = 'Turkey → Uzbekistan Trade Corridor';
      country = 'Turkey';
    } else if (
      origin.toLowerCase().includes('china') ||
      origin.toLowerCase().includes('guangzhou') ||
      origin.toLowerCase().includes('yiwu') ||
      origin.toLowerCase().includes('beijing') ||
      origin.toLowerCase().includes('urumqi')
    ) {
      corridorName = 'China → Uzbekistan Overland / Rail Corridor';
      country = 'China';
    } else if (origin.toLowerCase().includes('uae') || origin.toLowerCase().includes('dubai')) {
      corridorName = 'UAE / Middle East → Uzbekistan Corridor';
      country = 'UAE';
    } else if (origin.toLowerCase().includes('russia') || origin.toLowerCase().includes('moscow')) {
      corridorName = 'Russia / CIS → Uzbekistan Corridor';
      country = 'Russia';
    }

    if (!corridorMap[corridorName]) {
      corridorMap[corridorName] = {
        name: corridorName,
        originCountry: country,
        tripsCount: 0,
        totalVolume: 0,
        maxVolume: 0,
        totalSellUsd: 0,
        totalCarrierCostUsd: 0,
        netMarginUsd: 0,
      };
    }

    const cEntry = corridorMap[corridorName];
    cEntry.tripsCount += 1;
    cEntry.totalVolume += item.capacity?.assigned_volume_m3 || 0;
    cEntry.maxVolume += item.capacity?.max_volume_m3 || 86;
    cEntry.totalSellUsd += item.financials?.total_sell_usd || 0;
    cEntry.totalCarrierCostUsd += item.financials?.carrier_cost.amount_usd || 0;
    cEntry.netMarginUsd += item.financials?.consolidated_net_margin_usd || 0;

    // Carrier grouping
    const carrier = item.carrier_name || 'Direct Driver / Independent';
    if (!carrierMap[carrier]) {
      carrierMap[carrier] = {
        name: carrier,
        phone: item.carrier_phone || '',
        tripsCount: 0,
        totalVolume: 0,
        totalWeight: 0,
        totalCostUsd: 0,
        totalMarginUsd: 0,
        activeTrips: 0,
      };
    }
    const crEntry = carrierMap[carrier];
    crEntry.tripsCount += 1;
    crEntry.totalVolume += item.capacity?.assigned_volume_m3 || 0;
    crEntry.totalWeight += item.capacity?.assigned_weight_kg || 0;
    crEntry.totalCostUsd += item.financials?.carrier_cost.amount_usd || 0;
    crEntry.totalMarginUsd += item.financials?.consolidated_net_margin_usd || 0;
    if (item.status !== 'Completed') crEntry.activeTrips += 1;

    // Capacity buckets
    const util = item.capacity?.volume_utilization_percent || 0;
    if (util < 50) underutilizedCount += 1;
    else if (util <= 90) optimalCount += 1;
    else maxedCount += 1;
  });

  const corridors = Object.values(corridorMap).sort((a, b) => b.totalVolume - a.totalVolume);
  const carriers = Object.values(carrierMap).sort((a, b) => b.totalVolume - a.totalVolume);

  return (
    <div className="space-y-6">
      {/* Top 3 Capacity Optimization Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Underutilized */}
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-purple-500" />
              Low Fill (&lt; 50%)
            </span>
            <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
              {underutilizedCount} trips
            </span>
          </div>
          <h4 className="text-xl font-black text-foreground tracking-tight">
            {consolidations.length > 0
              ? Math.round((underutilizedCount / consolidations.length) * 100)
              : 0}
            %
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Capacity available for booking additional LTL client cargo orders.
          </p>
        </div>

        {/* Optimal */}
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-emerald-500" />
              Optimal Load (50% – 90%)
            </span>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {optimalCount} trips
            </span>
          </div>
          <h4 className="text-xl font-black text-foreground tracking-tight">
            {consolidations.length > 0
              ? Math.round((optimalCount / consolidations.length) * 100)
              : 0}
            %
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Balanced volume/weight distribution generating steady margin.
          </p>
        </div>

        {/* Maxed / High Capacity */}
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-brand-gold" />
              Maxed Out (&gt; 90%)
            </span>
            <span className="text-xs font-mono font-bold text-brand-gold">{maxedCount} trips</span>
          </div>
          <h4 className="text-xl font-black text-foreground tracking-tight">
            {consolidations.length > 0 ? Math.round((maxedCount / consolidations.length) * 100) : 0}
            %
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Full capacity trips maximizing gross profit per kilometer.
          </p>
        </div>
      </div>

      {/* Trade Corridors Analytics */}
      <div className="rounded-2xl bg-surface border border-border overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
              <Globe className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                <T k="cnsRouteStats" />
              </h3>
              <p className="text-xs text-muted-foreground">
                Consolidated volume and margin yield across major international routes
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border">
          {corridors.map((c, i) => {
            const fillPct =
              c.maxVolume > 0 ? Math.round((c.totalVolume / c.maxVolume) * 1000) / 10 : 0;
            const marginPct =
              c.totalSellUsd > 0 ? Math.round((c.netMarginUsd / c.totalSellUsd) * 1000) / 10 : 0;

            return (
              <div key={i} className="p-4 hover:bg-muted/20 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-extrabold text-foreground flex items-center gap-2">
                      <span>{c.name}</span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] bg-muted font-bold text-muted-foreground border border-border">
                        {c.tripsCount} trips
                      </span>
                    </h4>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-sans block">
                        Volume Carried
                      </span>
                      <span className="font-bold text-foreground">
                        {Math.round(c.totalVolume * 10) / 10} / {c.maxVolume} m³ ({fillPct}%)
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-sans block">
                        Net Profit Margin
                      </span>
                      <span
                        className={`font-bold ${
                          c.netMarginUsd >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {c.netMarginUsd >= 0 ? '+' : ''}
                        {formatMoney(c.netMarginUsd, 'USD')} ({marginPct}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Visual */}
                <div className="space-y-1">
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border/60">
                    <div
                      className="h-full bg-gradient-to-r from-brand-navy via-brand-gold to-brand-royal rounded-full"
                      style={{ width: `${Math.min(100, fillPct)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Carrier Fleet Matrix */}
      <div className="rounded-2xl bg-surface border border-border overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Truck className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                <T k="cnsCarrierPerformance" />
              </h3>
              <p className="text-xs text-muted-foreground">
                Transportation companies, fleet volume, and operational yield
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-muted-foreground font-bold">
                <th className="py-2.5 px-4">Carrier / Transporter</th>
                <th className="py-2.5 px-4">Total Trips</th>
                <th className="py-2.5 px-4">Active</th>
                <th className="py-2.5 px-4">Consolidated Vol (m³)</th>
                <th className="py-2.5 px-4">Total Weight (kg)</th>
                <th className="py-2.5 px-4">Paid Freight (USD)</th>
                <th className="py-2.5 px-4 text-right">Net Margin Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              {carriers.map((cr, idx) => (
                <tr key={idx} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-sans">
                    <p className="font-bold text-foreground truncate">{cr.name}</p>
                    {cr.phone && <p className="text-[11px] text-muted-foreground">{cr.phone}</p>}
                  </td>
                  <td className="py-3 px-4 font-bold text-foreground">{cr.tripsCount}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                      {cr.activeTrips} active
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-foreground">
                    {Math.round(cr.totalVolume * 10) / 10} m³
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {cr.totalWeight.toLocaleString()} kg
                  </td>
                  <td className="py-3 px-4 font-bold text-foreground">
                    {formatMoney(cr.totalCostUsd, 'USD')}
                  </td>
                  <td className="py-3 px-4 text-right font-bold">
                    <span
                      className={
                        cr.totalMarginUsd >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }
                    >
                      {cr.totalMarginUsd >= 0 ? '+' : ''}
                      {formatMoney(cr.totalMarginUsd, 'USD')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
