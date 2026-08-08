import React, { useState } from 'react';
import type { DashboardCargoDistributionResponse } from '../../types/dashboard';
import { formatMoney } from '../../services/api';
import { Truck, PackageCheck } from 'lucide-react';
import { T } from '../T';

interface CargoDistributionChartsProps {
  data: DashboardCargoDistributionResponse | null;
  loading: boolean;
}

const CARGO_TYPE_COLORS: Record<string, string> = {
  FTL: '#2563eb', // Blue
  LTL: '#f59e0b', // Amber
};

const STATUS_COLORS: Record<string, string> = {
  Completed: '#10b981', // Green
  'In Transit': '#06b6d4', // Cyan
  Waiting: '#f59e0b', // Amber
  Border: '#8b5cf6', // Purple
  'At Station': '#ec4899', // Pink
  Delivered: '#3b82f6', // Indigo
};

function DonutSegment({
  cx,
  cy,
  r,
  innerR,
  startAngle,
  endAngle,
  color,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: {
  cx: number;
  cy: number;
  r: number;
  innerR: number;
  startAngle: number;
  endAngle: number;
  color: string;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const rad = (deg: number) => (deg - 90) * (Math.PI / 180);
  const currentR = isHovered ? r + 5 : r;

  const x1 = cx + currentR * Math.cos(rad(startAngle));
  const y1 = cy + currentR * Math.sin(rad(startAngle));
  const x2 = cx + currentR * Math.cos(rad(endAngle));
  const y2 = cy + currentR * Math.sin(rad(endAngle));

  const ix1 = cx + innerR * Math.cos(rad(endAngle));
  const iy1 = cy + innerR * Math.sin(rad(endAngle));
  const ix2 = cx + innerR * Math.cos(rad(startAngle));
  const iy2 = cy + innerR * Math.sin(rad(startAngle));

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  const d = `
    M ${x1} ${y1}
    A ${currentR} ${currentR} 0 ${largeArc} 1 ${x2} ${y2}
    L ${ix1} ${iy1}
    A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}
    Z
  `;

  return (
    <path
      d={d}
      fill={color}
      className="transition-all duration-200 cursor-pointer opacity-90 hover:opacity-100"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
}

export const CargoDistributionCharts: React.FC<CargoDistributionChartsProps> = React.memo(
  ({ data, loading }) => {
    const [hoveredCargoIdx, setHoveredCargoIdx] = useState<number | null>(null);
    const [hoveredStatusIdx, setHoveredStatusIdx] = useState<number | null>(null);

    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-72 rounded-2xl bg-surface/60 dark:bg-night-surface/60 border border-border/40 dark:border-night-border animate-pulse p-4" />
          <div className="h-72 rounded-2xl bg-surface/60 dark:bg-night-surface/60 border border-border/40 dark:border-night-border animate-pulse p-4" />
        </div>
      );
    }

    if (!data) return null;

    const { cargoTypeDistribution, statusDistribution } = data;

    // Donut chart calculations helper
    function buildDonutSegments(items: { category: string; percentage: number }[]) {
      let currentAngle = 0;
      return items.map((item) => {
        const angle = (item.percentage / 100) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle += angle;
        return { startAngle, endAngle };
      });
    }

    const cargoTypeSegments = buildDonutSegments(cargoTypeDistribution);
    const statusSegments = buildDonutSegments(statusDistribution);

    const activeCargoItem =
      hoveredCargoIdx !== null ? cargoTypeDistribution[hoveredCargoIdx] : cargoTypeDistribution[0];
    const activeStatusItem =
      hoveredStatusIdx !== null ? statusDistribution[hoveredStatusIdx] : statusDistribution[0];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Cargo Type Distribution (FTL vs LTL) */}
        <div className="p-5 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-xs flex flex-col justify-between transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="size-4 text-brand-gold" />
              <h4 className="text-sm font-bold text-foreground dark:text-night-text">
                <T k="ovDistByCargoType" />
              </h4>
            </div>
            <span className="text-[11px] font-semibold text-muted">FTL vs LTL Breakdown</span>
          </div>

          <div className="flex items-center justify-between my-4 gap-4">
            {/* SVG Donut */}
            <div className="relative shrink-0">
              <svg
                width={140}
                height={140}
                viewBox="0 0 140 140"
                className="overflow-visible select-none"
              >
                {cargoTypeDistribution.map((item, idx) => {
                  const seg = cargoTypeSegments[idx];
                  const color = CARGO_TYPE_COLORS[item.category] || '#6b7280';
                  return (
                    <DonutSegment
                      key={item.category}
                      cx={70}
                      cy={70}
                      r={60}
                      innerR={42}
                      startAngle={seg.startAngle}
                      endAngle={seg.endAngle}
                      color={color}
                      isHovered={hoveredCargoIdx === idx}
                      onMouseEnter={() => setHoveredCargoIdx(idx)}
                      onMouseLeave={() => setHoveredCargoIdx(null)}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] font-bold uppercase text-muted">
                  {activeCargoItem?.category || 'Total'}
                </span>
                <span className="text-sm font-black text-foreground dark:text-night-text">
                  {activeCargoItem ? `${activeCargoItem.percentage}%` : ''}
                </span>
              </div>
            </div>

            {/* Legend Details */}
            <div className="flex flex-col gap-2.5 flex-1 min-w-0">
              {cargoTypeDistribution.map((item, idx) => {
                const color = CARGO_TYPE_COLORS[item.category] || '#6b7280';
                return (
                  <div
                    key={item.category}
                    onMouseEnter={() => setHoveredCargoIdx(idx)}
                    onMouseLeave={() => setHoveredCargoIdx(null)}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      hoveredCargoIdx === idx
                        ? 'bg-border/30 dark:bg-night-border/40'
                        : 'hover:bg-border/20 dark:hover:bg-night-border/20'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-foreground dark:text-night-text truncate">
                          {item.category}
                        </span>
                      </div>
                      <span className="text-brand-gold">{item.percentage}%</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted mt-0.5">
                      <span>{item.count} orders</span>
                      <span className="font-semibold">{formatMoney(item.totalSales, 'USD')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Status Distribution */}
        <div className="p-5 rounded-2xl bg-surface dark:bg-night-surface border border-border/60 dark:border-night-border shadow-xs flex flex-col justify-between transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackageCheck className="size-4 text-emerald-500" />
              <h4 className="text-sm font-bold text-foreground dark:text-night-text">
                <T k="ovDistByStatus" />
              </h4>
            </div>
            <span className="text-[11px] font-semibold text-muted">Pipeline Progress</span>
          </div>

          <div className="flex items-center justify-between my-4 gap-4">
            {/* SVG Donut */}
            <div className="relative shrink-0">
              <svg
                width={140}
                height={140}
                viewBox="0 0 140 140"
                className="overflow-visible select-none"
              >
                {statusDistribution.map((item, idx) => {
                  const seg = statusSegments[idx];
                  const color = STATUS_COLORS[item.category] || '#9ca3af';
                  return (
                    <DonutSegment
                      key={item.category}
                      cx={70}
                      cy={70}
                      r={60}
                      innerR={42}
                      startAngle={seg.startAngle}
                      endAngle={seg.endAngle}
                      color={color}
                      isHovered={hoveredStatusIdx === idx}
                      onMouseEnter={() => setHoveredStatusIdx(idx)}
                      onMouseLeave={() => setHoveredStatusIdx(null)}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] font-bold uppercase text-muted line-clamp-1 max-w-[65px]">
                  {activeStatusItem?.category || 'Status'}
                </span>
                <span className="text-sm font-black text-foreground dark:text-night-text">
                  {activeStatusItem ? `${activeStatusItem.percentage}%` : ''}
                </span>
              </div>
            </div>

            {/* Legend Details */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-0 max-h-[160px] overflow-y-auto pr-1">
              {statusDistribution.map((item, idx) => {
                const color = STATUS_COLORS[item.category] || '#9ca3af';
                return (
                  <div
                    key={item.category}
                    onMouseEnter={() => setHoveredStatusIdx(idx)}
                    onMouseLeave={() => setHoveredStatusIdx(null)}
                    className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                      hoveredStatusIdx === idx
                        ? 'bg-border/30 dark:bg-night-border/40'
                        : 'hover:bg-border/20 dark:hover:bg-night-border/20'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-foreground dark:text-night-text truncate">
                          {item.category}
                        </span>
                      </div>
                      <span className="text-emerald-500">{item.percentage}%</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted">
                      <span>{item.count} orders</span>
                      <span className="font-semibold">{formatMoney(item.totalSales, 'USD')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
