import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { T } from '../T';

export interface PieSliceData {
  key: string;
  label: string;
  value: number;
  percentage: number;
  color: string;
  totalSales?: number;
  formattedSales?: string;
  icon?: React.ReactNode;
}

function polarPoint(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function pieSlicePath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number
): string {
  const [x1, y1] = polarPoint(cx, cy, rOuter, startAngle);
  const [x2, y2] = polarPoint(cx, cy, rOuter, endAngle);
  const [x3, y3] = polarPoint(cx, cy, rInner, endAngle);
  const [x4, y4] = polarPoint(cx, cy, rInner, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `L ${x3.toFixed(2)} ${y3.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
    'Z',
  ].join(' ');
}

export interface PremiumDonutChartProps {
  slices: PieSliceData[];
  size?: number;
  centerSubtitle?: React.ReactNode;
  centerValue?: React.ReactNode;
  showLegend?: boolean;
  interactiveLegend?: boolean;
  onSliceClick?: (slice: PieSliceData) => void;
  emptyMessage?: React.ReactNode;
}

/**
 * High-fidelity pure SVG Donut Chart with animated expansion,
 * hover magnification, frosted-glass center KPI badge, and interactive legend.
 */
export const PremiumDonutChart: React.FC<PremiumDonutChartProps> = ({
  slices,
  size = 200,
  centerSubtitle,
  centerValue,
  showLegend = true,
  interactiveLegend = true,
  onSliceClick,
  emptyMessage,
}) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const validSlices = slices.filter((s) => s.value > 0);
  const total = slices.reduce((acc, s) => acc + s.value, 0) || 1;

  if (validSlices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted">
        {emptyMessage || (
          <p className="text-xs">
            <T k="ovNoDataAvailable" />
          </p>
        )}
      </div>
    );
  }

  const activeSlice = slices.find((s) => s.key === hoveredKey) ?? null;

  let cursor = 0;
  const gapDeg = validSlices.length > 1 ? 2.5 : 0;
  const arcs = validSlices.map((s) => {
    const sweep = (Math.max(s.value, 0) / total) * 360;
    const start = cursor + gapDeg / 2;
    const end = Math.max(cursor + sweep - gapDeg / 2, start + 0.5);
    cursor += sweep;
    const midRad = (((start + end) / 2 - 90) * Math.PI) / 180;
    return {
      ...s,
      start,
      end,
      dx: Math.cos(midRad) * 6,
      dy: Math.sin(midRad) * 6,
    };
  });

  const isFullCircle = arcs.length === 1;

  return (
    <div className="flex flex-col items-center gap-3.5 select-none w-full">
      <motion.div
        className="relative shrink-0"
        style={{ width: size, height: size }}
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
          {isFullCircle ? (
            <circle
              cx="100"
              cy="100"
              r={(92 + 38) / 2}
              fill="none"
              stroke={arcs[0].color}
              strokeWidth={92 - 38}
              className="transition-opacity duration-300 cursor-pointer"
              onClick={() => onSliceClick?.(arcs[0])}
            />
          ) : (
            arcs.map((a) => (
              <path
                key={a.key}
                d={pieSlicePath(100, 100, 92, 38, a.start, a.end)}
                fill={a.color}
                onMouseEnter={() => setHoveredKey(a.key)}
                onMouseLeave={() => setHoveredKey(null)}
                onClick={() => onSliceClick?.(a)}
                className="cursor-pointer transition-all"
                style={{
                  transform:
                    hoveredKey === a.key
                      ? `translate(${a.dx}px, ${a.dy}px)`
                      : 'translate(0px, 0px)',
                  opacity: hoveredKey && hoveredKey !== a.key ? 0.35 : 1,
                  filter:
                    hoveredKey === a.key ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.35))' : 'none',
                  transition:
                    'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease, filter 260ms ease',
                }}
              />
            ))
          )}
        </svg>

        {/* Frosted-Glass Center KPI Badge */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="rounded-full bg-surface/90 dark:bg-night-surface/90 backdrop-blur-md border border-border/50 dark:border-night-border/60 shadow-xs flex flex-col items-center justify-center text-center px-2 z-10 transition-all duration-200"
            style={{ width: Math.max(68, size * 0.38), height: Math.max(68, size * 0.38) }}
          >
            {activeSlice ? (
              <>
                <span className="text-base sm:text-lg font-black leading-none text-brand-gold tabular-nums">
                  {activeSlice.percentage}%
                </span>
                <span className="mt-1 max-w-[70px] truncate text-[8px] font-bold uppercase tracking-wider text-muted dark:text-night-muted">
                  {activeSlice.label}
                </span>
                {activeSlice.formattedSales && (
                  <span className="text-[8px] font-extrabold text-foreground dark:text-night-text mt-0.5 truncate max-w-[65px]">
                    {activeSlice.formattedSales}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="text-lg sm:text-xl font-black leading-none text-foreground dark:text-night-text tabular-nums">
                  {centerValue !== undefined ? centerValue : total.toLocaleString()}
                </span>
                <span className="mt-1 max-w-[72px] truncate text-[8px] font-bold uppercase tracking-wider text-muted dark:text-night-muted">
                  {centerSubtitle || <T k="ovTotal" />}
                </span>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 max-w-full px-1">
          {slices.map((s) => {
            const isHovered = hoveredKey === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onMouseEnter={() => interactiveLegend && setHoveredKey(s.key)}
                onMouseLeave={() => interactiveLegend && setHoveredKey(null)}
                onClick={() => onSliceClick?.(s)}
                title={`${s.label}: ${s.value} (${s.percentage}%)`}
                className={`inline-flex items-center gap-1.5 text-[10px] font-bold transition-all duration-200 rounded-md px-1 py-0.5 ${
                  interactiveLegend
                    ? 'cursor-pointer hover:bg-border/20 dark:hover:bg-night-border/30'
                    : ''
                } ${hoveredKey && !isHovered ? 'opacity-35' : 'opacity-100'}`}
              >
                <span
                  className="size-2 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-muted dark:text-night-muted truncate max-w-[100px]">
                  {s.label}
                </span>
                <span className="text-foreground dark:text-night-text tabular-nums font-black">
                  {s.percentage}%
                </span>
                {s.value > 0 && (
                  <span className="text-[9px] text-muted font-medium">({s.value})</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
