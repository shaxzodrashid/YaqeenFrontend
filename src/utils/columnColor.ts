// Helper utilities for managing Kanban Column Status Colors with smart defaults & local persistence

const COLUMN_COLORS_STORAGE_KEY = 'yaqeen_column_colors_map';

export function getStoredColumnColors(): Record<string, string> {
  try {
    const raw = localStorage.getItem(COLUMN_COLORS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredColumnColor(columnId: string, color: string) {
  try {
    const map = getStoredColumnColors();
    map[columnId] = color;
    localStorage.setItem(COLUMN_COLORS_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.error('Failed to save column color to storage:', err);
  }
}

/**
 * Returns a distinct default hex color based on the status name / aim.
 */
export function getDefaultColorByName(name?: string | null): string {
  if (!name) return '#3B82F6';
  const lower = name.toLowerCase();
  if (
    lower.includes('done') ||
    lower.includes('complete') ||
    lower.includes('finish') ||
    lower.includes('released')
  ) {
    return '#10B981'; // Emerald Green
  }
  if (
    lower.includes('progress') ||
    lower.includes('doing') ||
    lower.includes('working') ||
    lower.includes('active')
  ) {
    return '#F59E0B'; // Amber
  }
  if (
    lower.includes('review') ||
    lower.includes('testing') ||
    lower.includes('qa') ||
    lower.includes('audit')
  ) {
    return '#8B5CF6'; // Purple
  }
  if (lower.includes('backlog') || lower.includes('hold') || lower.includes('pause')) {
    return '#64748B'; // Slate
  }
  if (lower.includes('urgent') || lower.includes('critical') || lower.includes('block')) {
    return '#EF4444'; // Red
  }
  return '#3B82F6'; // Default Blue for To Do / General
}

/**
 * Resolves column color hierarchy:
 * 1. Backend column.color (if non-null string)
 * 2. Local storage stored color for column.id
 * 3. Default aim color inferred from column name
 */
export function getColumnColor(
  column?: { id?: string; name?: string; color?: string | null } | null
): string {
  if (!column) return '#3B82F6';
  if (column.color && column.color !== 'null' && column.color.trim() !== '') {
    return column.color;
  }
  const storedMap = getStoredColumnColors();
  if (column.id && storedMap[column.id]) {
    return storedMap[column.id];
  }
  return getDefaultColorByName(column.name);
}

/**
 * Formats badge style safely with alpha transparency for valid hex strings.
 */
export function getBadgeColorStyle(rawColor?: string | null) {
  const color = (rawColor || '#3B82F6').trim();
  let hex = color;
  if (/^#[0-9A-Fa-f]{3}$/.test(hex)) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return {
      backgroundColor: `${hex}20`,
      borderColor: `${hex}50`,
      color: hex,
    };
  }
  return {
    backgroundColor: color,
    borderColor: color,
    color: '#ffffff',
  };
}
