import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useMemo,
} from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import {
  COUNTRIES,
  type CountryData,
  detectCountryFromPhone,
  extractDigits,
  formatNationalNumber,
  getCountryFlag,
  isAllowedPhoneKey,
  calculatePhoneCursorPosition,
} from '../utils/phoneFormat';

export interface PhoneChangeDetails {
  value: string; // Full E.164 string e.g. "+998901234567"
  formatted: string; // Full international formatted string e.g. "+998 (90) 123-45-67"
  nationalNumber: string; // Clean national digits e.g. "901234567"
  formattedNational: string; // Formatted national digits e.g. "(90) 123-45-67"
  country: CountryData;
  isValid: boolean;
}

export interface PhoneInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'size' | 'prefix'
> {
  /** Current value (controlled mode): e.g. "+998901234567" or raw digits */
  value?: string | null;
  /** Default value (uncontrolled mode) */
  defaultValue?: string | null;
  /** Primary callback providing standard E.164 string (or empty) */
  onChange?: (value: string) => void;
  /** Detailed callback providing rich phone metadata and validation */
  onValueChange?: (details: PhoneChangeDetails) => void;
  /** Field label */
  label?: React.ReactNode;
  /** Required field indicator */
  isRequired?: boolean;
  /** Error message to display */
  error?: string;
  /** Helper text description */
  helperText?: string;
  /** Default country ISO 2 code (default: 'UZ') */
  defaultCountry?: string;
  /** List of preferred countries to pin at the top of dropdown */
  preferredCountries?: string[];
  /** Whether to disable the country selector dropdown */
  disableCountrySelect?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show a clear button when input has value */
  allowClear?: boolean;
  /** Additional container classes */
  className?: string;
  /** Additional input element classes */
  inputClassName?: string;
  /** Full width container (default: true) */
  fullWidth?: boolean;
  /** Automatically detect country when user types/pastes dial code (default: true) */
  autoDetectCountry?: boolean;
}

export interface PhoneInputRef {
  input: HTMLInputElement | null;
  focus: () => void;
  blur: () => void;
  select: () => void;
  clear: () => void;
  getValue: () => string;
  getDetails: () => PhoneChangeDetails;
}

const SIZE_STYLES = {
  sm: {
    container: 'h-9 px-2 text-xs rounded-lg',
    flagBtn: 'h-7 px-2 text-xs gap-1.5',
    flagText: 'text-sm',
    input: 'text-xs',
  },
  md: {
    container: 'h-11 px-2.5 text-sm rounded-xl',
    flagBtn: 'h-8 px-2.5 text-sm gap-1.5',
    flagText: 'text-base',
    input: 'text-sm',
  },
  lg: {
    container: 'h-13 px-3 text-base rounded-2xl',
    flagBtn: 'h-9 px-3 text-base gap-2',
    flagText: 'text-lg',
    input: 'text-base',
  },
};

const DEFAULT_PREFERRED_COUNTRIES = ['UZ', 'KZ', 'RU', 'TR', 'AE', 'CN', 'US', 'DE', 'GB'];

export const PhoneInput = forwardRef<PhoneInputRef, PhoneInputProps>(function PhoneInput(
  {
    value,
    defaultValue,
    onChange,
    onValueChange,
    label,
    isRequired = false,
    error,
    helperText,
    defaultCountry = 'UZ',
    preferredCountries = DEFAULT_PREFERRED_COUNTRIES,
    disableCountrySelect = false,
    size = 'md',
    allowClear = true,
    className = '',
    inputClassName = '',
    fullWidth = true,
    autoDetectCountry = true,
    disabled = false,
    readOnly = false,
    placeholder,
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
  const { t, locale } = useTranslation();
  const isControlled = value !== undefined;
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  // Compute initial country and national digits
  const initialValue = (isControlled ? value : defaultValue) || '';
  const initialDetection = useMemo(() => {
    return detectCountryFromPhone(initialValue, defaultCountry);
  }, []);

  const [selectedCountry, setSelectedCountry] = useState<CountryData>(initialDetection.country);
  const [nationalDigits, setNationalDigits] = useState<string>(initialDetection.nationalDigits);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Track whether change came from active user typing
  const isUserTypingRef = useRef<boolean>(false);
  const lastEmittedValueRef = useRef<string>(
    initialDetection.nationalDigits
      ? `${initialDetection.country.dialCode}${initialDetection.nationalDigits}`
      : ''
  );

  // Formatted display value in the input field
  const displayValue = useMemo(() => {
    return formatNationalNumber(nationalDigits, selectedCountry);
  }, [nationalDigits, selectedCountry]);

  // Compute full details
  const getDetails = useCallback((): PhoneChangeDetails => {
    const maxLen = selectedCountry.lengths?.length > 0 ? Math.max(...selectedCountry.lengths) : 15;
    const clean = extractDigits(nationalDigits).slice(0, maxLen);
    const formattedNat = formatNationalNumber(clean, selectedCountry);
    const e164 = clean ? `${selectedCountry.dialCode}${clean}` : '';
    const formatted = clean ? `${selectedCountry.dialCode} ${formattedNat}` : '';
    const isValid = selectedCountry.lengths.includes(clean.length);

    return {
      value: e164,
      formatted,
      nationalNumber: clean,
      formattedNational: formattedNat,
      country: selectedCountry,
      isValid,
    };
  }, [nationalDigits, selectedCountry]);

  // Expose imperative handle
  useImperativeHandle(
    ref,
    () => ({
      input: inputRef.current,
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      select: () => inputRef.current?.select(),
      clear: () => {
        setNationalDigits('');
        lastEmittedValueRef.current = '';
        onChange?.('');
        onValueChange?.({
          value: '',
          formatted: '',
          nationalNumber: '',
          formattedNational: '',
          country: selectedCountry,
          isValid: false,
        });
      },
      getValue: () => (nationalDigits ? `${selectedCountry.dialCode}${nationalDigits}` : ''),
      getDetails,
    }),
    [nationalDigits, selectedCountry, getDetails, onChange, onValueChange]
  );

  // Sync external controlled value changes
  useEffect(() => {
    if (isControlled) {
      const incoming = value || '';
      if (incoming !== lastEmittedValueRef.current || !isUserTypingRef.current) {
        if (!incoming) {
          setNationalDigits('');
          lastEmittedValueRef.current = '';
          return;
        }

        const detected = detectCountryFromPhone(incoming, selectedCountry.iso2);
        if (autoDetectCountry && detected.country.iso2 !== selectedCountry.iso2) {
          setSelectedCountry(detected.country);
        }
        setNationalDigits(detected.nationalDigits);
        lastEmittedValueRef.current = detected.nationalDigits
          ? `${detected.country.dialCode}${detected.nationalDigits}`
          : '';
      }
    }
  }, [value, isControlled, autoDetectCountry, selectedCountry.iso2]);

  /**
   * Core updater: updates state, handles country auto-detection, preserves cursor, and fires callbacks
   */
  const handleValueUpdate = (
    rawInput: string,
    cursorPosBeforeFormat?: number,
    oldDisplayVal: string = displayValue
  ) => {
    isUserTypingRef.current = true;
    let targetCountry = selectedCountry;
    let newDigits = extractDigits(rawInput);

    const currentCountryMaxLen =
      selectedCountry.lengths?.length > 0 ? Math.max(...selectedCountry.lengths) : 15;

    // Auto-detect country if user typed or pasted dial code (e.g. "+7..." or "+998...")
    // OR if user entered a string longer than current country's max national length
    if (
      autoDetectCountry &&
      (rawInput.trim().startsWith('+') || newDigits.length > currentCountryMaxLen)
    ) {
      const detected = detectCountryFromPhone(rawInput, selectedCountry.iso2);
      if (detected.nationalDigits && detected.country.iso2 !== selectedCountry.iso2) {
        targetCountry = detected.country;
        newDigits = detected.nationalDigits;
        setSelectedCountry(targetCountry);
      } else if (rawInput.trim().startsWith('+')) {
        newDigits = detected.nationalDigits;
      }
    }

    // Limit digits to maximum valid length for target country
    const maxLen = targetCountry.lengths?.length > 0 ? Math.max(...targetCountry.lengths) : 15;
    const trimmedDigits = newDigits.slice(0, maxLen);

    setNationalDigits(trimmedDigits);

    const formattedNat = formatNationalNumber(trimmedDigits, targetCountry);
    const e164 = trimmedDigits ? `${targetCountry.dialCode}${trimmedDigits}` : '';
    const formattedFull = trimmedDigits ? `${targetCountry.dialCode} ${formattedNat}` : '';
    const isValid = targetCountry.lengths.includes(trimmedDigits.length);

    lastEmittedValueRef.current = e164;

    // Restore caret position seamlessly
    if (cursorPosBeforeFormat !== undefined && inputRef.current) {
      const newCursor = calculatePhoneCursorPosition(
        oldDisplayVal,
        formattedNat,
        cursorPosBeforeFormat
      );
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(newCursor, newCursor);
        }
      });
    }

    onChange?.(e164);
    onValueChange?.({
      value: e164,
      formatted: formattedFull,
      nationalNumber: trimmedDigits,
      formattedNational: formattedNat,
      country: targetCountry,
      isValid,
    });
  };

  /**
   * Keyboard Blocker & Smart Separator Traversal
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

    // Smart Backspace: When cursor is directly after a mask separator, delete the digit before it
    if (
      e.key === 'Backspace' &&
      selectionStart !== null &&
      selectionEnd !== null &&
      selectionStart === selectionEnd &&
      selectionStart > 0
    ) {
      const charBefore = displayValue[selectionStart - 1];
      if (!/\d/.test(charBefore)) {
        e.preventDefault();
        // Find previous digit index
        let digitPos = selectionStart - 1;
        while (digitPos >= 0 && !/\d/.test(displayValue[digitPos])) {
          digitPos--;
        }
        if (digitPos >= 0) {
          const updated = displayValue.slice(0, digitPos) + displayValue.slice(selectionStart);
          handleValueUpdate(updated, digitPos, displayValue);
        }
        return;
      }
    }

    // Smart Delete: When cursor is directly before a mask separator, delete the digit after it
    if (
      e.key === 'Delete' &&
      selectionStart !== null &&
      selectionEnd !== null &&
      selectionStart === selectionEnd &&
      selectionStart < displayValue.length
    ) {
      const charAfter = displayValue[selectionStart];
      if (!/\d/.test(charAfter)) {
        e.preventDefault();
        // Find next digit index
        let digitPos = selectionStart;
        while (digitPos < displayValue.length && !/\d/.test(displayValue[digitPos])) {
          digitPos++;
        }
        if (digitPos < displayValue.length) {
          const updated = displayValue.slice(0, selectionStart) + displayValue.slice(digitPos + 1);
          handleValueUpdate(updated, selectionStart, displayValue);
        }
        return;
      }
    }

    // Block typing digits when max length has already been reached without range selection
    const maxLen = selectedCountry.lengths?.length > 0 ? Math.max(...selectedCountry.lengths) : 15;
    if (
      /^[0-9]$/.test(e.key) &&
      selectionStart !== null &&
      selectionEnd !== null &&
      selectionStart === selectionEnd &&
      extractDigits(displayValue).length >= maxLen &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      e.preventDefault();
      return;
    }

    // Check if key is permitted (Block all non-numeric characters)
    const isAllowed = isAllowedPhoneKey(e, displayValue);
    if (!isAllowed) {
      e.preventDefault();
      return;
    }

    onKeyDown?.(e);
  };

  /**
   * Paste Blocker & Sanitizer
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

    // Check if full international number was pasted (e.g. "+998 90 123 45 67")
    if (pastedText.trim().startsWith('+') || /^\+?\d{10,15}$/.test(pastedText.replace(/\D/g, ''))) {
      handleValueUpdate(pastedText, pastedText.length, displayValue);
    } else {
      // Normal slice replacement with sanitized digits
      const cleanPaste = extractDigits(pastedText);
      const combined = displayValue.slice(0, start) + cleanPaste + displayValue.slice(end);
      handleValueUpdate(combined, start + cleanPaste.length, displayValue);
    }

    onPaste?.(e);
  };

  /**
   * Input Change Fallback for Virtual Keyboards / Autofill
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    const input = inputRef.current;
    const cursor = input?.selectionStart ?? nextVal.length;

    handleValueUpdate(nextVal, cursor, displayValue);
  };

  const handleCountrySelect = (country: CountryData) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery('');

    // Keep existing digits up to country's max length
    const maxLen = country.lengths?.length > 0 ? Math.max(...country.lengths) : 15;
    const trimmed = nationalDigits.slice(0, maxLen);
    setNationalDigits(trimmed);

    const formattedNat = formatNationalNumber(trimmed, country);
    const e164 = trimmed ? `${country.dialCode}${trimmed}` : '';
    const formattedFull = trimmed ? `${country.dialCode} ${formattedNat}` : '';
    const isValid = country.lengths.includes(trimmed.length);

    lastEmittedValueRef.current = e164;
    onChange?.(e164);
    onValueChange?.({
      value: e164,
      formatted: formattedFull,
      nationalNumber: trimmed,
      formattedNational: formattedNat,
      country,
      isValid,
    });

    // Focus input after selecting country
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNationalDigits('');
    lastEmittedValueRef.current = '';
    onChange?.('');
    onValueChange?.({
      value: '',
      formatted: '',
      nationalNumber: '',
      formattedNational: '',
      country: selectedCountry,
      isValid: false,
    });
    inputRef.current?.focus();
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        selectedItemRef.current?.scrollIntoView({ block: 'nearest' });
      }, 50);
    }
  }, [isOpen]);

  // Filtered countries list for dropdown
  const { preferredList, otherList } = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const queryDigits = extractDigits(query);

    const matchesQuery = (c: CountryData) => {
      if (!query) return true;
      if (c.name.toLowerCase().includes(query)) return true;
      if (c.nameUz && c.nameUz.toLowerCase().includes(query)) return true;
      if (c.nameRu && c.nameRu.toLowerCase().includes(query)) return true;
      if (c.iso2.toLowerCase().includes(query)) return true;
      if (
        c.dialCode.includes(query) ||
        (queryDigits && c.dialCode.replace(/\D/g, '').startsWith(queryDigits))
      ) {
        return true;
      }
      return false;
    };

    if (query) {
      const allFiltered = COUNTRIES.filter(matchesQuery);
      return { preferredList: allFiltered, otherList: [] };
    }

    const prefSet = new Set(preferredCountries.map((iso) => iso.toUpperCase()));
    const prefList = COUNTRIES.filter((c) => prefSet.has(c.iso2));
    const rest = COUNTRIES.filter((c) => !prefSet.has(c.iso2));

    return { preferredList: prefList, otherList: rest };
  }, [searchQuery, preferredCountries]);

  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.md;

  // Localized country name helper
  const getLocalizedCountryName = (c: CountryData): string => {
    if (locale === 'uz' && c.nameUz) return c.nameUz;
    if (locale === 'ru' && c.nameRu) return c.nameRu;
    return c.name;
  };

  return (
    <div className={`flex flex-col gap-1.5 text-left ${fullWidth ? 'w-full' : ''} ${className}`}>
      {/* Field Label */}
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

      {/* Input Outer Container */}
      <div
        ref={dropdownRef}
        className={`relative flex items-center w-full transition-all duration-200 border bg-field dark:bg-night-field ${sizeStyle.container} ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-neutral-100 dark:bg-night-surface border-neutral-200 dark:border-night-border'
            : error
              ? 'border-danger ring-1 ring-danger/20 focus-within:border-danger focus-within:ring-2 focus-within:ring-danger/30'
              : 'border-field-border dark:border-night-border hover:border-neutral-400 dark:hover:border-neutral-600 focus-within:border-brand-royal dark:focus-within:border-night-royal focus-within:ring-2 focus-within:ring-brand-royal/20 dark:focus-within:ring-night-royal/25 focus-within:shadow-xs'
        }`}
      >
        {/* Country Selector Trigger Button */}
        <button
          type="button"
          disabled={disabled || disableCountrySelect}
          onClick={() => !disableCountrySelect && setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`flex items-center rounded-md border-r border-field-border/60 dark:border-night-border/70 pr-2 mr-2 text-foreground dark:text-night-text font-semibold select-none transition-colors shrink-0 outline-none focus-visible:ring-1 focus-visible:ring-brand-royal ${sizeStyle.flagBtn} ${
            disableCountrySelect
              ? 'cursor-default'
              : 'hover:bg-neutral-100 dark:hover:bg-night-surface cursor-pointer'
          }`}
          title={`${getLocalizedCountryName(selectedCountry)} (${selectedCountry.dialCode})`}
        >
          <span
            className={`${sizeStyle.flagText} leading-none select-none`}
            role="img"
            aria-label={selectedCountry.name}
          >
            {getCountryFlag(selectedCountry.iso2)}
          </span>
          <span className="font-bold text-foreground dark:text-night-text tracking-tight">
            {selectedCountry.dialCode}
          </span>
          {!disableCountrySelect && (
            <ChevronDown
              className={`size-3 text-muted dark:text-night-muted transition-transform duration-200 shrink-0 ${
                isOpen ? 'rotate-180 text-brand-royal dark:text-brand-gold' : ''
              }`}
            />
          )}
        </button>

        {/* Dropdown Menu Portal / Floating Layer */}
        {isOpen && (
          <div
            role="listbox"
            className="absolute top-full left-0 mt-1.5 w-72 max-w-[90vw] rounded-xl border border-neutral-200 dark:border-night-border bg-surface dark:bg-night-elevated shadow-xl shadow-black/10 dark:shadow-black/40 z-50 py-2 animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col max-h-80"
          >
            {/* Country Search Bar */}
            <div className="px-2.5 pb-2 border-b border-neutral-100 dark:border-night-border/60">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-night-field border border-neutral-200 dark:border-night-border text-xs">
                <Search className="size-3.5 text-muted dark:text-night-muted shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchCountry') || 'Search country or code...'}
                  className="w-full bg-transparent outline-none text-foreground dark:text-night-text placeholder:text-muted dark:placeholder:text-night-muted/60 text-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-0.5 text-muted hover:text-foreground dark:hover:text-night-text rounded"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Countries Scrollable List */}
            <div className="overflow-y-auto flex-1 py-1 divide-y divide-neutral-100 dark:divide-night-border/40 scrollbar-thin">
              {/* Preferred / Filtered List */}
              <div className="py-0.5">
                {preferredList.map((c) => {
                  const isSelected = selectedCountry.iso2 === c.iso2;
                  return (
                    <button
                      key={c.iso2}
                      ref={isSelected ? selectedItemRef : null}
                      type="button"
                      onClick={() => handleCountrySelect(c)}
                      role="option"
                      aria-selected={isSelected}
                      className={`flex items-center justify-between w-full px-3 py-2 text-left text-xs transition-colors group cursor-pointer ${
                        isSelected
                          ? 'bg-brand-royal/10 dark:bg-brand-royal/20 text-brand-royal dark:text-night-royal font-bold'
                          : 'text-foreground dark:text-night-text hover:bg-neutral-100 dark:hover:bg-night-surface'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate pr-2">
                        <span
                          className="text-base leading-none shrink-0"
                          role="img"
                          aria-label={c.name}
                        >
                          {getCountryFlag(c.iso2)}
                        </span>
                        <span className="truncate">{getLocalizedCountryName(c)}</span>
                        <span className="text-[10px] text-muted dark:text-night-muted uppercase tracking-wider font-semibold">
                          {c.iso2}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-semibold text-muted dark:text-night-muted group-hover:text-foreground dark:group-hover:text-night-text">
                          {c.dialCode}
                        </span>
                        {isSelected && (
                          <Check className="size-3.5 text-brand-royal dark:text-brand-gold shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Other Countries */}
              {otherList.length > 0 && (
                <div className="py-0.5">
                  <div className="px-3 py-1 text-[10px] font-bold text-muted dark:text-night-muted uppercase tracking-wider bg-neutral-50 dark:bg-night-field/50">
                    {t('allCountries') || 'Other Countries'}
                  </div>
                  {otherList.map((c) => {
                    const isSelected = selectedCountry.iso2 === c.iso2;
                    return (
                      <button
                        key={c.iso2}
                        ref={isSelected ? selectedItemRef : null}
                        type="button"
                        onClick={() => handleCountrySelect(c)}
                        role="option"
                        aria-selected={isSelected}
                        className={`flex items-center justify-between w-full px-3 py-2 text-left text-xs transition-colors group cursor-pointer ${
                          isSelected
                            ? 'bg-brand-royal/10 dark:bg-brand-royal/20 text-brand-royal dark:text-night-royal font-bold'
                            : 'text-foreground dark:text-night-text hover:bg-neutral-100 dark:hover:bg-night-surface'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          <span
                            className="text-base leading-none shrink-0"
                            role="img"
                            aria-label={c.name}
                          >
                            {getCountryFlag(c.iso2)}
                          </span>
                          <span className="truncate">{getLocalizedCountryName(c)}</span>
                          <span className="text-[10px] text-muted dark:text-night-muted uppercase tracking-wider font-semibold">
                            {c.iso2}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-semibold text-muted dark:text-night-muted group-hover:text-foreground dark:group-hover:text-night-text">
                            {c.dialCode}
                          </span>
                          {isSelected && (
                            <Check className="size-3.5 text-brand-royal dark:text-brand-gold shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Empty state */}
              {preferredList.length === 0 && otherList.length === 0 && (
                <div className="p-4 text-center text-xs text-muted dark:text-night-muted">
                  {t('noCountriesFound') || 'No countries found'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hidden inputs for native form post compatibility */}
        {name && (
          <input
            type="hidden"
            name={name}
            value={nationalDigits ? `${selectedCountry.dialCode}${nationalDigits}` : ''}
          />
        )}

        {/* Formatted Phone Input Field */}
        <input
          ref={inputRef}
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          autoCorrect="off"
          spellCheck={false}
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={(e) => {
            isUserTypingRef.current = true;
            onFocus?.(e);
          }}
          onBlur={(e) => {
            isUserTypingRef.current = false;
            onBlur?.(e);
          }}
          placeholder={placeholder || selectedCountry.placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={isRequired}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error && id ? `${id}-error` : helperText && id ? `${id}-helper` : undefined
          }
          className={`flex-1 h-full bg-transparent outline-none border-none p-0 text-foreground dark:text-night-text font-semibold placeholder:font-normal placeholder:text-muted dark:placeholder:text-night-muted/60 focus:ring-0 focus:border-none focus:outline-none ${sizeStyle.input} ${inputClassName}`}
          {...restProps}
        />

        {/* Clear Button */}
        {allowClear && !disabled && !readOnly && Boolean(nationalDigits) && (
          <button
            type="button"
            onClick={handleClear}
            tabIndex={-1}
            aria-label="Clear phone number"
            className="p-1 rounded-md text-muted hover:text-foreground dark:text-night-muted dark:hover:text-night-text hover:bg-neutral-200/50 dark:hover:bg-night-surface transition-colors cursor-pointer shrink-0 ml-1"
          >
            <X className="size-3.5" />
          </button>
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

PhoneInput.displayName = 'PhoneInput';
