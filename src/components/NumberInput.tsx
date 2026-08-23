import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import {
  cleanAndFormatNumber,
  isAllowedNumberKey,
  calculateCursorPosition,
} from '../utils/numberFormat';
import type { NumberFormatOptions } from '../utils/numberFormat';

export interface NumberInputProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'value' | 'defaultValue' | 'onChange' | 'size' | 'prefix' | 'min' | 'max'
    >,
    NumberFormatOptions {
  /** Current value (controlled mode): number, numeric string, or null/undefined */
  value?: number | string | null;
  /** Default value (uncontrolled mode) */
  defaultValue?: number | string | null;
  /** Callback fired when the numeric value changes */
  onValueChange?: (value: number | null, rawValue: string) => void;
  /** Standard React change event handler */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Field label */
  label?: React.ReactNode;
  /** Required field indicator */
  isRequired?: boolean;
  /** Error message to display */
  error?: string;
  /** Helper description text */
  helperText?: string;
  /** Prefix displayed before the input text (e.g. "$", "SO'M", or an icon) */
  prefix?: React.ReactNode;
  /** Suffix displayed after the input text (e.g. "kg", "m³", "%", "so'm") */
  suffix?: React.ReactNode;
  /** Leading element or icon inside the container (HeroUI convention) */
  startContent?: React.ReactNode;
  /** Trailing element or icon inside the container (HeroUI convention) */
  endContent?: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Minimum numeric value */
  min?: number;
  /** Maximum numeric value */
  max?: number;
  /** Whether to clamp the value to min/max on blur */
  clampOnBlur?: boolean;
  /** Additional container classes */
  className?: string;
  /** Additional input element classes */
  inputClassName?: string;
  /** Full width container (default: true) */
  fullWidth?: boolean;
}

export interface NumberInputRef {
  input: HTMLInputElement | null;
  focus: () => void;
  blur: () => void;
  select: () => void;
  getRawValue: () => string;
  getNumericValue: () => number | null;
}

const SIZE_STYLES = {
  sm: {
    container: 'h-9 px-2.5 text-xs rounded-lg',
    input: 'text-xs',
    affix: 'text-xs',
  },
  md: {
    container: 'h-11 px-3.5 text-sm rounded-xl',
    input: 'text-sm',
    affix: 'text-sm',
  },
  lg: {
    container: 'h-13 px-4 text-base rounded-2xl',
    input: 'text-base',
    affix: 'text-base',
  },
};

export const NumberInput = forwardRef<NumberInputRef, NumberInputProps>(function NumberInput(
  {
    value,
    defaultValue,
    onValueChange,
    onChange,
    label,
    isRequired = false,
    error,
    helperText,
    prefix,
    suffix,
    startContent,
    endContent,
    size = 'md',
    thousandSeparator = ' ',
    decimalSeparator = '.',
    allowDecimals = true,
    decimalScale,
    allowNegative = false,
    min,
    max,
    clampOnBlur = false,
    className = '',
    inputClassName = '',
    fullWidth = true,
    disabled = false,
    readOnly = false,
    placeholder = '0',
    name,
    id,
    onBlur,
    onFocus,
    onKeyDown,
    onPaste,
    ...restProps
  },
  ref
) {
  const isControlled = value !== undefined;
  const inputRef = useRef<HTMLInputElement>(null);

  const formatOptions: NumberFormatOptions = {
    thousandSeparator,
    decimalSeparator,
    allowDecimals,
    decimalScale,
    allowNegative,
    min,
    max,
  };

  // Helper to format any value given current options
  const formatVal = useCallback(
    (val: number | string | null | undefined) => {
      return cleanAndFormatNumber(val, formatOptions);
    },
    [thousandSeparator, decimalSeparator, allowDecimals, decimalScale, allowNegative, min, max]
  );

  // Initial state computation
  const initialData = formatVal(isControlled ? value : defaultValue);
  const [displayValue, setDisplayValue] = useState<string>(initialData.formattedValue);
  const [rawState, setRawState] = useState<string>(initialData.rawValue);

  // Keep track of internal formatting during typing
  const lastEmittedRawRef = useRef<string>(initialData.rawValue);
  const isUserTypingRef = useRef<boolean>(false);

  // Expose imperative handle methods
  useImperativeHandle(
    ref,
    () => ({
      input: inputRef.current,
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      select: () => inputRef.current?.select(),
      getRawValue: () => rawState,
      getNumericValue: () => {
        const num = parseFloat(rawState);
        return isNaN(num) ? null : num;
      },
    }),
    [rawState]
  );

  // Synchronize controlled value changes from outside
  useEffect(() => {
    if (isControlled) {
      const incomingRaw = value === null || value === undefined ? '' : String(value);
      // Avoid resetting user formatting if value matches what user just typed
      if (incomingRaw !== lastEmittedRawRef.current || !isUserTypingRef.current) {
        const formatted = formatVal(value);
        setDisplayValue(formatted.formattedValue);
        setRawState(formatted.rawValue);
        lastEmittedRawRef.current = formatted.rawValue;
      }
    }
  }, [value, isControlled, formatVal]);

  /**
   * Core updater: applies formatting, keeps caret aligned, and fires callbacks
   */
  const handleValueUpdate = (
    newDisplayVal: string,
    cursorPosBeforeFormat?: number,
    oldDisplayVal: string = displayValue
  ) => {
    const { rawValue, formattedValue, numericValue } = cleanAndFormatNumber(
      newDisplayVal,
      formatOptions
    );

    isUserTypingRef.current = true;
    setDisplayValue(formattedValue);
    setRawState(rawValue);
    lastEmittedRawRef.current = rawValue;

    // Restore caret position after React render
    if (cursorPosBeforeFormat !== undefined && inputRef.current) {
      const newCursor = calculateCursorPosition(
        oldDisplayVal,
        formattedValue,
        cursorPosBeforeFormat,
        thousandSeparator
      );
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(newCursor, newCursor);
        }
      });
    }

    onValueChange?.(numericValue, rawValue);
  };

  /**
   * Keyboard Blocker: blocks non-number characters & handles smart separator deletion
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || readOnly) {
      onKeyDown?.(e);
      return;
    }

    const input = inputRef.current;
    if (!input) {
      onKeyDown?.(e);
      return;
    }

    const { selectionStart, selectionEnd } = input;

    // Smart Backspace: If cursor is immediately after a thousand separator, delete the digit before it
    if (
      e.key === 'Backspace' &&
      selectionStart !== null &&
      selectionEnd !== null &&
      selectionStart === selectionEnd &&
      selectionStart > 0
    ) {
      const charBefore = displayValue[selectionStart - 1];
      if (charBefore === thousandSeparator) {
        e.preventDefault();
        // Remove the character preceding the separator
        const deletePos = selectionStart - 2;
        if (deletePos >= 0) {
          const updated = displayValue.slice(0, deletePos) + displayValue.slice(selectionStart);
          handleValueUpdate(updated, deletePos, displayValue);
        }
        return;
      }
    }

    // Smart Delete: If cursor is immediately before a thousand separator, delete the digit after it
    if (
      e.key === 'Delete' &&
      selectionStart !== null &&
      selectionEnd !== null &&
      selectionStart === selectionEnd &&
      selectionStart < displayValue.length
    ) {
      const charAfter = displayValue[selectionStart];
      if (charAfter === thousandSeparator) {
        e.preventDefault();
        const deletePos = selectionStart + 1;
        if (deletePos < displayValue.length) {
          const updated = displayValue.slice(0, selectionStart) + displayValue.slice(deletePos + 1);
          handleValueUpdate(updated, selectionStart, displayValue);
        }
        return;
      }
    }

    // Check if the key is allowed
    const isAllowed = isAllowedNumberKey(e, displayValue, formatOptions);
    if (!isAllowed) {
      e.preventDefault();
      return;
    }

    onKeyDown?.(e);
  };

  /**
   * Paste Blocker & Sanitizer: extracts and formats valid numbers from clipboard text
   */
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled || readOnly) {
      onPaste?.(e);
      return;
    }

    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? displayValue.length;

    // Combine existing text with pasted chunk
    const combined = displayValue.slice(0, start) + pastedText + displayValue.slice(end);
    handleValueUpdate(combined, start + pastedText.length, displayValue);

    onPaste?.(e);
  };

  /**
   * Input Change Handler: fallback for mobile keyboards, autofill, and IME
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    const input = inputRef.current;
    const cursor = input?.selectionStart ?? nextVal.length;

    handleValueUpdate(nextVal, cursor, displayValue);
    onChange?.(e);
  };

  /**
   * Blur Handler: formats cleanly and handles min/max clamping
   */
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    isUserTypingRef.current = false;

    let { numericValue, rawValue, formattedValue } = cleanAndFormatNumber(
      displayValue,
      formatOptions
    );

    // Clamp value if min/max bounds are configured and clampOnBlur is true
    if (clampOnBlur && numericValue !== null) {
      let clamped = numericValue;
      if (min !== undefined && clamped < min) clamped = min;
      if (max !== undefined && clamped > max) clamped = max;

      if (clamped !== numericValue) {
        const clampedRes = cleanAndFormatNumber(clamped, formatOptions);
        numericValue = clampedRes.numericValue;
        rawValue = clampedRes.rawValue;
        formattedValue = clampedRes.formattedValue;
      }
    }

    // Clean up partial inputs like "-" or "0." on blur
    if (displayValue === '-' || displayValue === '.') {
      setDisplayValue('');
      setRawState('');
      lastEmittedRawRef.current = '';
      onValueChange?.(null, '');
    } else if (displayValue !== formattedValue) {
      setDisplayValue(formattedValue);
      setRawState(rawValue);
      lastEmittedRawRef.current = rawValue;
      onValueChange?.(numericValue, rawValue);
    }

    onBlur?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    isUserTypingRef.current = true;
    onFocus?.(e);
  };

  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.md;
  const hasLeading = Boolean(prefix || startContent);
  const hasTrailing = Boolean(suffix || endContent);

  return (
    <div className={`flex flex-col gap-1.5 text-left ${fullWidth ? 'w-full' : ''} ${className}`}>
      {/* Label */}
      {label && (
        <div className="flex justify-between items-baseline">
          <label
            htmlFor={id}
            className="block text-xs font-semibold text-foreground dark:text-night-text select-none"
          >
            {label}
            {isRequired && <span className="text-danger ml-1 font-bold">*</span>}
          </label>
        </div>
      )}

      {/* Input Container */}
      <div
        className={`relative flex items-center w-full transition-all duration-200 border bg-field dark:bg-night-field ${sizeStyle.container} ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-neutral-100 dark:bg-night-surface border-neutral-200 dark:border-night-border'
            : error
              ? 'border-danger ring-1 ring-danger/20 focus-within:border-danger focus-within:ring-2 focus-within:ring-danger/30'
              : 'border-field-border dark:border-night-border hover:border-neutral-400 dark:hover:border-neutral-600 focus-within:border-brand-royal dark:focus-within:border-night-royal focus-within:ring-2 focus-within:ring-brand-royal/20 dark:focus-within:ring-night-royal/25 focus-within:shadow-xs'
        }`}
      >
        {/* Leading Content / Prefix */}
        {hasLeading && (
          <div className="flex items-center gap-1 mr-2 text-muted dark:text-night-muted font-semibold select-none shrink-0">
            {startContent}
            {prefix && <span className={sizeStyle.affix}>{prefix}</span>}
          </div>
        )}

        {/* Formatted Number Input Element */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode={allowDecimals ? 'decimal' : 'numeric'}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          className={`w-full h-full bg-transparent outline-none border-none p-0 text-foreground dark:text-night-text font-bold placeholder:font-normal placeholder:text-muted dark:placeholder:text-night-muted/60 focus:ring-0 focus:border-none focus:outline-none ${sizeStyle.input} ${inputClassName}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error && id ? `${id}-error` : helperText && id ? `${id}-helper` : undefined
          }
          {...restProps}
        />

        {/* Hidden input for native HTML form support */}
        {name && <input type="hidden" name={name} value={rawState} />}

        {/* Trailing Content / Suffix */}
        {hasTrailing && (
          <div className="flex items-center gap-1 ml-2 text-muted dark:text-night-muted font-semibold select-none shrink-0">
            {suffix && <span className={sizeStyle.affix}>{suffix}</span>}
            {endContent}
          </div>
        )}
      </div>

      {/* Helper text / Error message */}
      {error ? (
        <span
          id={id ? `${id}-error` : undefined}
          className="text-xs text-danger font-medium animate-in fade-in duration-150"
        >
          {error}
        </span>
      ) : helperText ? (
        <span
          id={id ? `${id}-helper` : undefined}
          className="text-xs text-muted dark:text-night-muted"
        >
          {helperText}
        </span>
      ) : null}
    </div>
  );
});

NumberInput.displayName = 'NumberInput';
