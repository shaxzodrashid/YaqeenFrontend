import React from 'react';
import { Truck, TrainFront, Plane, Ship, Package } from 'lucide-react';

export type NormalizedTransportKey = 'AUTO' | 'RAILWAY' | 'AIR' | 'SEA' | 'OTHER';

export function normalizeTransportType(type?: string, name?: string): NormalizedTransportKey {
  const s = `${type || ''} ${name || ''}`.toLowerCase().trim();
  if (
    s.includes('auto') ||
    s.includes('avto') ||
    s.includes('truck') ||
    s.includes('fura') ||
    s.includes('car') ||
    s.includes('mashina') ||
    s.includes('авто') ||
    s.includes('фура')
  ) {
    return 'AUTO';
  }
  if (
    s.includes('rail') ||
    s.includes('temir') ||
    s.includes('train') ||
    s.includes('vagon') ||
    s.includes('konteyner') ||
    s.includes('zhd') ||
    s.includes('жд') ||
    s.includes('поезд') ||
    s.includes('вагон')
  ) {
    return 'RAILWAY';
  }
  if (
    s.includes('air') ||
    s.includes('avia') ||
    s.includes('havo') ||
    s.includes('plane') ||
    s.includes('авиа') ||
    s.includes('самолет')
  ) {
    return 'AIR';
  }
  if (
    s.includes('sea') ||
    s.includes('dengiz') ||
    s.includes('ship') ||
    s.includes('ocean') ||
    s.includes('vessel') ||
    s.includes('море') ||
    s.includes('судно') ||
    s.includes('корабль')
  ) {
    return 'SEA';
  }
  return 'OTHER';
}

export interface TransportVisualConfig {
  key: NormalizedTransportKey;
  icon: React.ReactNode;
  bar: string;
  chip: string;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  trackBg: string;
  badgeBg: string;
  hexColor: string;
}

export const TRANSPORT_VISUALS_MAP: Record<NormalizedTransportKey, TransportVisualConfig> = {
  AUTO: {
    key: 'AUTO',
    icon: <Truck className="size-4" />,
    bar: 'from-blue-500 via-blue-600 to-cyan-400',
    chip: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30',
    cardBg: 'bg-blue-500/5 hover:bg-blue-500/10',
    cardBorder: 'border-blue-500/25 hover:border-blue-500/50',
    textColor: 'text-blue-600 dark:text-blue-400',
    trackBg: 'bg-blue-500/15 dark:bg-blue-500/25',
    badgeBg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30',
    hexColor: '#3b82f6',
  },
  RAILWAY: {
    key: 'RAILWAY',
    icon: <TrainFront className="size-4" />,
    bar: 'from-amber-500 via-amber-600 to-orange-400',
    chip: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
    cardBg: 'bg-amber-500/5 hover:bg-amber-500/10',
    cardBorder: 'border-amber-500/25 hover:border-amber-500/50',
    textColor: 'text-amber-600 dark:text-amber-400',
    trackBg: 'bg-amber-500/15 dark:bg-amber-500/25',
    badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
    hexColor: '#f59e0b',
  },
  AIR: {
    key: 'AIR',
    icon: <Plane className="size-4" />,
    bar: 'from-violet-500 via-purple-600 to-fuchsia-400',
    chip: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30',
    cardBg: 'bg-violet-500/5 hover:bg-violet-500/10',
    cardBorder: 'border-violet-500/25 hover:border-violet-500/50',
    textColor: 'text-violet-600 dark:text-violet-400',
    trackBg: 'bg-violet-500/15 dark:bg-violet-500/25',
    badgeBg: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30',
    hexColor: '#a855f7',
  },
  SEA: {
    key: 'SEA',
    icon: <Ship className="size-4" />,
    bar: 'from-teal-500 via-teal-600 to-emerald-400',
    chip: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30',
    cardBg: 'bg-teal-500/5 hover:bg-teal-500/10',
    cardBorder: 'border-teal-500/25 hover:border-teal-500/50',
    textColor: 'text-teal-600 dark:text-teal-400',
    trackBg: 'bg-teal-500/15 dark:bg-teal-500/25',
    badgeBg: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30',
    hexColor: '#10b981',
  },
  OTHER: {
    key: 'OTHER',
    icon: <Package className="size-4" />,
    bar: 'from-indigo-500 via-indigo-600 to-sky-400',
    chip: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30',
    cardBg: 'bg-indigo-500/5 hover:bg-indigo-500/10',
    cardBorder: 'border-indigo-500/25 hover:border-indigo-500/50',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    trackBg: 'bg-indigo-500/15 dark:bg-indigo-500/25',
    badgeBg: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30',
    hexColor: '#6366f1',
  },
};

export function getTransportVisuals(type?: string, name?: string): TransportVisualConfig {
  const norm = normalizeTransportType(type, name);
  return TRANSPORT_VISUALS_MAP[norm];
}
