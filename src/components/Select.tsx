import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useId,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SelectOption {
  /** Unique value persisted by forms / state */
  value: string;
  /** Primary display label */
  label: string;
  /** Optional secondary description rendered under the label in the list */
  description?: string;
  /** Optional leading icon / node rendered before the label */
  icon?: React.ReactNode;
  /** Disable this individual option */
  disabled?: boolean;
}

export interface SelectProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange' | 'onBlur'
> {
  /** Available options */
  options: SelectOption[];
  /** Fired when the trigger loses focus */
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  /** Current value (controlled mode) */
  value?: string | null;
  /** Default value (uncontrolled mode) */
  defaultValue?: string | null;
  /** Callback fired with the plain value when the selection changes (empty string when cleared) */
  onChange?: (value: string) => void;
  /** Rich callback providing both value and the resolved option object (null when cleared) */
  onValueChange?: (value: string | null, option: SelectOption | null) => void;
  /** Field label */
  label?: React.ReactNode;
  /** Required field indicator */
  isRequired?: boolean;
  /** Error message to display */
  error?: string;
  /** Helper description text */
  helperText?: string;
  /** Placeholder shown when nothing is selected */
  placeholder?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show a clear button when a value is selected (default: true) */
  allowClear?: boolean;
  /** Enable a search/filter field inside the dropdown panel (default: false) */
  isSearchable?: boolean;
  /** Custom empty-state node when no options match */
  emptyMessage?: React.ReactNode;
  /** Leading element inside the trigger (e.g. static icon) */
  startContent?: React.ReactNode;
  /** Hide selected item icon in the trigger (default: false) */
  hideSelectedIcon?: boolean;
  /** Additional container classes */
  className?: string;
  /** Additional trigger classes */
  triggerClassName?: string;
  /** Full width container (default: true) */
  fullWidth?: boolean;
  /** Disable the entire control */
  disabled?: boolean;
  /** Read-only mode (trigger not clickable, no clear button) */
  readOnly?: boolean;
  /** Hidden input name for native HTML form support */
  name?: string;
}

export interface SelectRef {
  focus: () => void;
  blur: () => void;
  open: () => void;
  close: () => void;
  clear: () => void;
  getValue: () => string | null;
  getSelectedOption: () => SelectOption | null;
}

// ---------------------------------------------------------------------------
// Design tokens (mirrors NumberInput / PhoneInput SIZE_STYLES)
// ---------------------------------------------------------------------------

const SIZE_STYLES = {
  sm: {
    container: 'h-9 px-2.5 text-xs rounded-lg gap-1.5',
    trigger: 'text-xs',
    chevron: 'size-3',
    option: 'px-3 py-1.5 text-xs',
  },
  md: {
    container: 'h-11 px-3.5 text-sm rounded-xl gap-2',
    trigger: 'text-sm',
    chevron: 'size-3.5',
    option: 'px-3 py-2 text-xs',
  },
  lg: {
    container: 'h-13 px-4 text-base rounded-2xl gap-2',
    trigger: 'text-base',
    chevron: 'size-4',
    option: 'px-3.5 py-2.5 text-sm',
  },
} as const;

const TYPEAHEAD_RESET_MS = 500;

export const Select = forwardRef<SelectRef, SelectProps>(function Select(
  {
    options,
    value,
    defaultValue = null,
    onChange,
    onValueChange,
    label,
    isRequired = false,
    error,
    helperText,
    placeholder,
    size = 'md',
    allowClear = true,
    isSearchable = false,
    emptyMessage,
    startContent,
    hideSelectedIcon = false,
    className = '',
    triggerClassName = '',
    fullWidth = true,
    disabled = false,
    readOnly = false,
    name,
    id,
    onBlur,
    ...restProps
  },
  ref
) {
  const { t } = useTranslation();

  const reactId = useId();
  const baseId = (id || reactId).replace(/[^a-zA-Z0-9_-]/g, '');
  const triggerId = `${baseId}-trigger`;
  const listboxId = `${baseId}-listbox`;
  const optionId = (index: number) => `${baseId}-opt-${index}`;

  const isControlled = value !== undefined;

  const [internalValue, setInternalValue] = useState<string | null>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Map<number, HTMLElement>>(new Map());
  const typeaheadBufferRef = useRef('');
  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentValue = isControlled ? value : internalValue;
  const selectedOption = useMemo(
    () => options.find((o) => o.value === currentValue) ?? null,
    [options, currentValue]
  );

  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.md;
  const isInteractive = !disabled && !readOnly;

  // -------------------------------------------------------------------------
  // Derived lists
  // -------------------------------------------------------------------------

  const filteredOptions = useMemo(() => {
    if (!isSearchable || !isOpen) return options;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return options;
    return options.filter((o) => {
      if (o.label.toLowerCase().includes(query)) return true;
      if (o.description?.toLowerCase().includes(query)) return true;
      return o.value.toLowerCase().includes(query);
    });
  }, [options, isSearchable, isOpen, searchQuery]);

  const firstEnabledIndex = useCallback(() => {
    return filteredOptions.findIndex((o) => !o.disabled);
  }, [filteredOptions]);

  // -------------------------------------------------------------------------
  // Selection helpers
  // -------------------------------------------------------------------------

  const commitValue = useCallback(
    (nextValue: string | null, nextOption: SelectOption | null) => {
      if (!isControlled) setInternalValue(nextValue);
      onChange?.(nextValue ?? '');
      onValueChange?.(nextValue, nextOption);
    },
    [isControlled, onChange, onValueChange]
  );

  const selectOption = useCallback(
    (option: SelectOption) => {
      if (option.disabled) return;
      // Avoid emitting redundant change events for identical selections
      if (option.value !== currentValue) {
        commitValue(option.value, option);
      }
      setIsOpen(false);
      setSearchQuery('');
      triggerRef.current?.focus();
    },
    [commitValue, currentValue]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isInteractive) return;
      commitValue(null, null);
      triggerRef.current?.focus();
    },
    [commitValue, isInteractive]
  );

  // -------------------------------------------------------------------------
  // Open / close + focus management
  // -------------------------------------------------------------------------

  const closeDropdown = useCallback((refocusTrigger = false) => {
    setIsOpen(false);
    setActiveIndex(-1);
    setSearchQuery('');
    if (refocusTrigger) triggerRef.current?.focus();
  }, []);

  const openDropdown = useCallback(() => {
    if (!isInteractive || isOpen) return;
    setIsOpen(true);
    setSearchQuery('');
    // Start navigation on the selected option, otherwise the first enabled one
    const selectedIdx = options.findIndex((o) => o.value === currentValue);
    setActiveIndex(selectedIdx >= 0 ? selectedIdx : firstEnabledIndex());
  }, [isInteractive, isOpen, options, currentValue, firstEnabledIndex]);

  // Scroll the active option into view whenever it changes
  useEffect(() => {
    if (activeIndex >= 0) {
      optionRefs.current.get(activeIndex)?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, isOpen]);

  // Auto-focus the search field when the panel opens (searchable mode)
  useEffect(() => {
    if (isOpen && isSearchable) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isSearchable]);

  // Clamp active index whenever the filtered list shrinks while the panel is open
  useEffect(() => {
    if (!isOpen) return;
    setActiveIndex((prev) => {
      if (prev < 0) return prev;
      if (prev >= filteredOptions.length) return firstEnabledIndex();
      if (filteredOptions[prev]?.disabled) return firstEnabledIndex();
      return prev;
    });
  }, [filteredOptions, isOpen, firstEnabledIndex]);

  // Close on outside click (mousedown, consistent with PhoneInput)
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeDropdown]);

  // Cleanup pending type-ahead timer
  useEffect(() => {
    return () => {
      if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Keyboard navigation
  // -------------------------------------------------------------------------

  const moveActive = useCallback(
    (direction: 1 | -1, fromIndex: number) => {
      if (filteredOptions.length === 0) return;
      let next = fromIndex;
      for (let i = 0; i < filteredOptions.length; i++) {
        next = next + direction;
        if (next < 0) next = filteredOptions.length - 1;
        if (next >= filteredOptions.length) next = 0;
        if (!filteredOptions[next].disabled) break;
      }
      setActiveIndex(next);
    },
    [filteredOptions]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const isTypingInSearch =
      e.target instanceof HTMLInputElement && (e.target as HTMLInputElement).type === 'text';

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDropdown();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        moveActive(1, activeIndex);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveActive(-1, activeIndex);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(firstEnabledIndex());
        break;
      case 'End': {
        e.preventDefault();
        for (let i = filteredOptions.length - 1; i >= 0; i--) {
          if (!filteredOptions[i].disabled) {
            setActiveIndex(i);
            break;
          }
        }
        break;
      }
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && filteredOptions[activeIndex]) {
          selectOption(filteredOptions[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        closeDropdown(true);
        break;
      case 'Tab':
        closeDropdown();
        break;
      case ' ':
        // Space selects while navigating the list, but never hijacks typing in search
        if (!isTypingInSearch) {
          e.preventDefault();
          if (activeIndex >= 0 && filteredOptions[activeIndex]) {
            selectOption(filteredOptions[activeIndex]);
          }
        }
        break;
      default:
        // Type-ahead jump when there is no dedicated search field
        if (
          !isSearchable &&
          !isTypingInSearch &&
          e.key.length === 1 &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey
        ) {
          typeaheadBufferRef.current += e.key.toLowerCase();
          const buffer = typeaheadBufferRef.current;

          // Find the first enabled option whose label starts with the typed buffer,
          // starting after the currently active index
          const startIndex = activeIndex >= 0 ? activeIndex : -1;
          let matchIndex = -1;
          for (let i = 1; i <= filteredOptions.length; i++) {
            const idx = (startIndex + i) % filteredOptions.length;
            const opt = filteredOptions[idx];
            if (!opt.disabled && opt.label.toLowerCase().startsWith(buffer)) {
              matchIndex = idx;
              break;
            }
          }
          // Fallback: any enabled option containing the buffer
          if (matchIndex === -1) {
            matchIndex = filteredOptions.findIndex(
              (o) => !o.disabled && o.label.toLowerCase().includes(buffer)
            );
          }
          if (matchIndex !== -1) setActiveIndex(matchIndex);

          if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current);
          typeaheadTimerRef.current = setTimeout(() => {
            typeaheadBufferRef.current = '';
          }, TYPEAHEAD_RESET_MS);
        }
        break;
    }
  };

  // -------------------------------------------------------------------------
  // Imperative handle (mirrors NumberInput / PhoneInput ref APIs)
  // -------------------------------------------------------------------------

  useImperativeHandle(
    ref,
    () => ({
      focus: () => triggerRef.current?.focus(),
      blur: () => triggerRef.current?.blur(),
      open: openDropdown,
      close: () => closeDropdown(),
      clear: () => commitValue(null, null),
      getValue: () => currentValue ?? null,
      getSelectedOption: () => options.find((o) => o.value === currentValue) ?? null,
    }),
    [openDropdown, closeDropdown, commitValue, currentValue, options]
  );

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const showClear = allowClear && isInteractive && Boolean(currentValue);

  return (
    <div
      {...restProps}
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={`relative flex flex-col gap-1.5 text-left ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {/* Field Label */}
      {label && (
        <div className="flex justify-between items-baseline">
          <label
            htmlFor={triggerId}
            className="block text-xs font-semibold text-foreground dark:text-night-text select-none"
          >
            {label}
            {isRequired && <span className="text-danger ml-1 font-bold">*</span>}
          </label>
        </div>
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={
          error && id ? `${id}-error` : helperText && id ? `${id}-helper` : undefined
        }
        disabled={disabled}
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        onBlur={onBlur}
        className={`relative flex items-center justify-between w-full transition-all duration-200 border bg-field dark:bg-night-field ${sizeStyle.container} ${sizeStyle.trigger} ${triggerClassName} ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-neutral-100 dark:bg-night-surface border-neutral-200 dark:border-night-border'
            : error
              ? 'border-danger ring-1 ring-danger/20 hover:border-danger focus:border-danger focus:ring-2 focus:ring-danger/30'
              : 'border-field-border dark:border-night-border hover:border-neutral-400 dark:hover:border-neutral-600 focus:border-brand-royal dark:focus:border-night-royal focus:ring-2 focus:ring-brand-royal/20 dark:focus:ring-night-royal/25 focus:shadow-xs'
        }`}
      >
        {/* Selected Value / Placeholder */}
        <div className="flex items-center min-w-0 flex-1">
          {startContent && (
            <div className="flex items-center mr-2 text-muted dark:text-night-muted shrink-0">
              {startContent}
            </div>
          )}
          {selectedOption ? (
            <div className="flex items-center gap-2 min-w-0">
              {!hideSelectedIcon && selectedOption.icon && (
                <span className="flex items-center shrink-0 text-muted dark:text-night-muted">
                  {selectedOption.icon}
                </span>
              )}
              <span className="truncate font-bold text-foreground dark:text-night-text">
                {selectedOption.label}
              </span>
            </div>
          ) : (
            <span className="truncate font-normal text-muted dark:text-night-muted/60">
              {placeholder || t('selectPlaceholder') || 'Select an option...'}
            </span>
          )}
        </div>

        {/* Hidden input for native HTML form support */}
        {name && <input type="hidden" name={name} value={currentValue ?? ''} />}

        {/* Trailing Actions: Clear + Chevron */}
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {showClear && (
            <span
              role="button"
              tabIndex={-1}
              aria-label={t('clearSelection') || 'Clear'}
              onClick={handleClear}
              className="p-1 rounded-md text-muted hover:text-foreground dark:text-night-muted dark:hover:text-night-text hover:bg-neutral-200/50 dark:hover:bg-night-surface transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
            </span>
          )}
          <ChevronDown
            className={`${sizeStyle.chevron} text-muted dark:text-night-muted transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-brand-royal dark:text-brand-gold' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-labelledby={triggerId}
          className="absolute top-full start-0 mt-1.5 w-full min-w-[10rem] max-w-[90vw] rounded-xl border border-neutral-200 dark:border-night-border bg-surface dark:bg-night-elevated shadow-xl shadow-black/10 dark:shadow-black/40 z-50 py-2 animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col max-h-80"
        >
          {/* Search Bar (optional) */}
          {isSearchable && (
            <div className="px-2.5 pb-2 border-b border-neutral-100 dark:border-night-border/60">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-night-field border border-neutral-200 dark:border-night-border text-xs">
                <Search className="size-3.5 text-muted dark:text-night-muted shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchOptions') || 'Search options...'}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full bg-transparent outline-none border-none p-0 text-foreground dark:text-night-text font-semibold placeholder:font-normal placeholder:text-muted dark:placeholder:text-night-muted/60 focus:ring-0"
                />
                {searchQuery && (
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setSearchQuery('')}
                    className="p-0.5 text-muted hover:text-foreground dark:hover:text-night-text rounded"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto flex-1 py-1 scrollbar-thin">
            {filteredOptions.map((option, index) => {
              const isSelected = option.value === currentValue;
              const isActive = index === activeIndex;
              return (
                <div
                  key={option.value}
                  ref={(el) => {
                    if (el) optionRefs.current.set(index, el);
                    else optionRefs.current.delete(index);
                  }}
                  id={optionId(index)}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  onClick={() => !option.disabled && selectOption(option)}
                  onMouseMove={() => {
                    if (!option.disabled && index !== activeIndex) setActiveIndex(index);
                  }}
                  className={`flex items-center gap-2.5 ${sizeStyle.option} mx-1 rounded-lg transition-colors group ${
                    option.disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : isSelected
                        ? 'bg-brand-royal/10 dark:bg-brand-royal/20 text-brand-royal dark:text-night-royal font-bold cursor-pointer'
                        : isActive
                          ? 'bg-neutral-100 dark:bg-night-surface text-foreground dark:text-night-text cursor-pointer'
                          : 'text-foreground dark:text-night-text cursor-pointer'
                  }`}
                >
                  {option.icon && (
                    <span
                      className={`flex items-center shrink-0 ${
                        isSelected
                          ? 'text-brand-royal dark:text-brand-gold'
                          : 'text-muted dark:text-night-muted'
                      }`}
                    >
                      {option.icon}
                    </span>
                  )}

                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate">{option.label}</span>
                    {option.description && (
                      <span className="truncate text-[11px] font-normal text-muted dark:text-night-muted">
                        {option.description}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <Check className="size-3.5 shrink-0 text-brand-royal dark:text-brand-gold" />
                  )}
                </div>
              );
            })}

            {/* Empty State */}
            {filteredOptions.length === 0 && (
              <div className="p-4 text-center text-xs text-muted dark:text-night-muted">
                {emptyMessage || t('noOptionsFound') || 'No options found'}
              </div>
            )}
          </div>
        </div>
      )}

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

Select.displayName = 'Select';
