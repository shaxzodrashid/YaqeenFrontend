export interface NumberFormatOptions {
  thousandSeparator?: string;
  decimalSeparator?: string;
  allowDecimals?: boolean;
  decimalScale?: number;
  allowNegative?: boolean;
  min?: number;
  max?: number;
}

const DEFAULT_OPTIONS: Required<Omit<NumberFormatOptions, 'decimalScale' | 'min' | 'max'>> & {
  decimalScale?: number;
  min?: number;
  max?: number;
} = {
  thousandSeparator: ' ',
  decimalSeparator: '.',
  allowDecimals: true,
  allowNegative: false,
};

/**
 * Escapes regex special characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitizes a raw or typed string into a clean numeric representation.
 * Returns { rawValue, formattedValue, hasTrailingDecimal, isNegativeOnly }
 */
export function cleanAndFormatNumber(
  input: string | number | null | undefined,
  options?: NumberFormatOptions
): {
  rawValue: string; // Clean numeric string (e.g. "-12345.67" or "")
  formattedValue: string; // Formatted display string (e.g. "-12 345.67" or "")
  numericValue: number | null; // Parsed float value or null
} {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { thousandSeparator, decimalSeparator, allowDecimals, decimalScale, allowNegative } = opts;

  if (input === null || input === undefined || input === '') {
    return { rawValue: '', formattedValue: '', numericValue: null };
  }

  let str = String(input).trim();
  if (!str) {
    return { rawValue: '', formattedValue: '', numericValue: null };
  }

  // Check if negative
  const isNegative = allowNegative && str.startsWith('-');

  // Remove all characters except digits and decimal point / comma
  // If decimalSeparator is '.', convert ',' to '.' if ',' is not the thousand separator
  if (decimalSeparator === '.' && thousandSeparator !== ',') {
    str = str.replace(/,/g, '.');
  } else if (decimalSeparator === ',' && thousandSeparator !== '.') {
    str = str.replace(/\./g, ',');
  }

  // Strip anything that is not a digit or the decimal separator
  const validCharRegex = new RegExp(`[^0-9${escapeRegex(decimalSeparator)}]`, 'g');
  let cleaned = str.replace(validCharRegex, '');

  if (!cleaned && !isNegative) {
    return { rawValue: '', formattedValue: '', numericValue: null };
  }

  if (cleaned === '' && isNegative) {
    return { rawValue: '-', formattedValue: '-', numericValue: null };
  }

  // Handle decimal splitting
  let integerPart = cleaned;
  let decimalPart = '';
  const hasDecimal = allowDecimals && cleaned.includes(decimalSeparator);

  if (hasDecimal) {
    const parts = cleaned.split(decimalSeparator);
    integerPart = parts[0];
    // Join any extra parts if multiple separators were pasted
    decimalPart = parts.slice(1).join('');
    if (decimalScale !== undefined && decimalScale >= 0) {
      decimalPart = decimalPart.slice(0, decimalScale);
    }
  }

  // Remove leading zeros from integer part (keep single '0' if '0.xxx' or '0')
  if (integerPart.length > 1 && integerPart.startsWith('0')) {
    integerPart = integerPart.replace(/^0+(?=\d)/, '');
  }

  // Build rawValue: standard JavaScript numeric representation (e.g. "-12345.67")
  let rawValue = '';
  if (isNegative) {
    rawValue += '-';
  }
  rawValue += integerPart || (hasDecimal ? '0' : '');
  if (hasDecimal) {
    rawValue += '.' + decimalPart;
  }

  // If the user typed only "." or "-", handle partial values
  if (rawValue === '' || rawValue === '-' || rawValue === '.') {
    const formatted =
      (isNegative ? '-' : '') +
      (hasDecimal ? (integerPart ? integerPart : '0') + decimalSeparator + decimalPart : '');
    return {
      rawValue: rawValue === '.' ? '0.' : rawValue,
      formattedValue: formatted || rawValue,
      numericValue: null,
    };
  }

  // Format integer part with thousand separators
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);

  let formattedValue = (isNegative ? '-' : '') + (formattedInteger || (hasDecimal ? '0' : ''));
  if (hasDecimal) {
    formattedValue += decimalSeparator + decimalPart;
  }

  const numericValue = parseFloat(rawValue);

  return {
    rawValue,
    formattedValue,
    numericValue: isNaN(numericValue) ? null : numericValue,
  };
}

/**
 * Checks if a keyboard key is valid for numeric input
 */
export function isAllowedNumberKey(
  e: React.KeyboardEvent<HTMLInputElement>,
  currentValue: string,
  options?: NumberFormatOptions
): boolean {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { allowDecimals, allowNegative, decimalSeparator, thousandSeparator } = opts;

  // Allow navigation and action keys
  const controlKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
    'PageUp',
    'PageDown',
  ];

  if (controlKeys.includes(e.key)) {
    return true;
  }

  // Allow standard keyboard shortcuts (Ctrl/Cmd + A, C, V, X, Z, Y, R)
  if (e.ctrlKey || e.metaKey) {
    const allowedShortcuts = ['a', 'c', 'v', 'x', 'z', 'y', 'r'];
    if (allowedShortcuts.includes(e.key.toLowerCase())) {
      return true;
    }
  }

  // Allow digits 0-9
  if (/^[0-9]$/.test(e.key)) {
    // If decimal scale is limited, check if cursor is in decimal part and already at max scale
    if (opts.decimalScale !== undefined && opts.decimalScale >= 0) {
      const input = e.currentTarget;
      const selStart = input.selectionStart ?? 0;
      const selEnd = input.selectionEnd ?? 0;
      const decIndex = currentValue.indexOf(decimalSeparator);

      // If typing inside decimal part without replacing a selection
      if (decIndex !== -1 && selStart > decIndex && selStart === selEnd) {
        const currentDecimals = currentValue.slice(decIndex + 1);
        if (currentDecimals.length >= opts.decimalScale) {
          return false;
        }
      }
    }
    return true;
  }

  // Allow Decimal Separator (or ',' if decimalSeparator is '.')
  const isDecimalKey =
    e.key === decimalSeparator ||
    (decimalSeparator === '.' && e.key === ',' && thousandSeparator !== ',');

  if (isDecimalKey) {
    if (!allowDecimals || opts.decimalScale === 0) {
      return false;
    }
    // Block if already contains a decimal separator
    if (currentValue.includes(decimalSeparator)) {
      const input = e.currentTarget;
      const selStart = input.selectionStart ?? 0;
      const selEnd = input.selectionEnd ?? 0;
      const decIndex = currentValue.indexOf(decimalSeparator);
      // Allow only if the existing decimal separator is within the selected replacement range
      if (selStart <= decIndex && selEnd > decIndex) {
        return true;
      }
      return false;
    }
    return true;
  }

  // Allow Negative sign '-'
  if (e.key === '-' && allowNegative) {
    const input = e.currentTarget;
    const selStart = input.selectionStart ?? 0;
    const selEnd = input.selectionEnd ?? 0;
    // Allow at position 0, or if all text including '-' is selected
    if (selStart === 0) {
      if (!currentValue.startsWith('-') || selEnd > 0) {
        return true;
      }
    }
    return false;
  }

  // Block everything else
  return false;
}

/**
 * Calculates the new cursor position after formatting
 */
export function calculateCursorPosition(
  oldFormatted: string,
  newFormatted: string,
  oldCursor: number,
  thousandSeparator: string
): number {
  if (oldCursor <= 0) return 0;
  if (oldCursor >= oldFormatted.length) return newFormatted.length;

  // Count non-separator characters before the cursor in the old formatted string
  let rawCount = 0;
  for (let i = 0; i < oldCursor; i++) {
    if (oldFormatted[i] !== thousandSeparator) {
      rawCount++;
    }
  }

  // Find position in new formatted string where the same count of non-separator chars is reached
  let newCursor = 0;
  let currentRawCount = 0;
  while (newCursor < newFormatted.length && currentRawCount < rawCount) {
    if (newFormatted[newCursor] !== thousandSeparator) {
      currentRawCount++;
    }
    newCursor++;
  }

  return newCursor;
}

/**
 * Formats a number to a display string with three-digit grouping
 * e.g. formatNumber(1250000) -> "1 250 000"
 */
export function formatNumber(
  value: number | string | null | undefined,
  options?: NumberFormatOptions
): string {
  const { formattedValue } = cleanAndFormatNumber(value, options);
  return formattedValue;
}

/**
 * Parses a formatted string back to a number
 * e.g. parseNumber("1 250 000.50") -> 1250000.5
 */
export function parseNumber(
  value: string | number | null | undefined,
  options?: NumberFormatOptions
): number | null {
  const { numericValue } = cleanAndFormatNumber(value, options);
  return numericValue;
}
