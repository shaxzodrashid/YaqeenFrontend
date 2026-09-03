import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  ArrowRight,
  Check,
} from 'lucide-react';
import { useTranslation, type Locale } from '../context/LanguageContext';

export interface DateRangePickerProps {
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string; // 'YYYY-MM-DD'
  onChange: (startDate: string, endDate: string) => void;
  onClear?: () => void;
  label?: string;
  icon?: React.ReactNode;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  variant?: 'input' | 'button' | 'pill' | 'compact';
  align?: 'left' | 'right' | 'auto';
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
}

// Format Date object to 'YYYY-MM-DD' using local timezone
export function formatYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse 'YYYY-MM-DD' string safely to local Date
export function parseYMD(dateStr?: string): Date | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Calculate total inclusive days between start and end
export function getDaysCount(startStr?: string, endStr?: string): number {
  if (!startStr || !endStr) return 0;
  const s = parseYMD(startStr);
  const e = parseYMD(endStr);
  if (!s || !e) return 0;
  const diffTime = Math.abs(e.getTime() - s.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// Return { startDate: 'YYYY-MM-01', endDate: 'YYYY-MM-lastDay' } for current month
export function getCurrentMonthRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return {
    startDate: `${year}-${month}-01`,
    endDate: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
  };
}

const MONTH_NAMES: Record<Locale, string[]> = {
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  ru: [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ],
  uz: [
    'Yanvar',
    'Fevral',
    'Mart',
    'Aprel',
    'May',
    'Iyun',
    'Iyul',
    'Avgust',
    'Sentabr',
    'Oktabr',
    'Noyabr',
    'Dekabr',
  ],
};

const SHORT_MONTH_NAMES: Record<Locale, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
  uz: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
};

const WEEKDAY_NAMES: Record<Locale, string[]> = {
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  uz: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'],
};

// Format friendly date range label (e.g. "1 Sep – 30 Sep 2026")
export function formatDateRange(
  startDate?: string,
  endDate?: string,
  locale: Locale = 'en',
  defaultLabel: string = 'Select date range...'
): string {
  if (!startDate && !endDate) return defaultLabel;
  const s = parseYMD(startDate);
  const e = parseYMD(endDate);
  const mNames = SHORT_MONTH_NAMES[locale] || SHORT_MONTH_NAMES.en;

  if (s && e) {
    if (startDate === endDate) {
      return `${s.getDate()} ${mNames[s.getMonth()]} ${s.getFullYear()}`;
    }
    if (s.getFullYear() !== e.getFullYear()) {
      return `${s.getDate()} ${mNames[s.getMonth()]} ${s.getFullYear()} – ${e.getDate()} ${mNames[e.getMonth()]} ${e.getFullYear()}`;
    }
    return `${s.getDate()} ${mNames[s.getMonth()]} – ${e.getDate()} ${mNames[e.getMonth()]} ${s.getFullYear()}`;
  }
  if (s) {
    return `${s.getDate()} ${mNames[s.getMonth()]} ${s.getFullYear()} → ...`;
  }
  if (e) {
    return `... → ${e.getDate()} ${mNames[e.getMonth()]} ${e.getFullYear()}`;
  }
  return defaultLabel;
}

export function DateRangePicker({
  startDate = '',
  endDate = '',
  onChange,
  onClear,
  label,
  icon,
  placeholder,
  className = '',
  buttonClassName = '',
  variant = 'input',
  align = 'auto',
  disabled = false,
  minDate,
  maxDate,
}: DateRangePickerProps) {
  const { t, locale } = useTranslation();
  const currentLocale = (locale in MONTH_NAMES ? locale : 'en') as Locale;

  const [isOpen, setIsOpen] = useState(false);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [tempRange, setTempRange] = useState<{ start: string; end: string }>({
    start: startDate,
    end: endDate,
  });

  // Calendar View Month & Year
  const initialDate = parseYMD(startDate) || parseYMD(endDate) || new Date();
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Portal fixed viewport coordinates
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    placement: 'bottom' | 'top';
  }>({
    top: 0,
    left: 0,
    placement: 'bottom',
  });

  // Sync internal state when external props change
  useEffect(() => {
    setTempRange({ start: startDate, end: endDate });
    if (startDate) {
      const parsed = parseYMD(startDate);
      if (parsed) {
        setViewYear(parsed.getFullYear());
        setViewMonth(parsed.getMonth());
      }
    }
  }, [startDate, endDate]);

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const popoverWidth = Math.min(340, viewportWidth - 20);
    const popoverHeight = 390;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    let placement: 'bottom' | 'top' = 'bottom';
    let top = 0;

    if (spaceBelow >= popoverHeight || spaceBelow >= spaceAbove) {
      placement = 'bottom';
      top = rect.bottom + 6;
    } else {
      placement = 'top';
      top = Math.max(10, rect.top - popoverHeight - 6);
    }

    let left = rect.left;
    if (align === 'right') {
      left = rect.right - popoverWidth;
    } else if (align === 'left') {
      left = rect.left;
    } else {
      if (viewportWidth - rect.left < popoverWidth) {
        left = rect.right - popoverWidth;
      } else {
        left = rect.left;
      }
    }

    left = Math.max(10, Math.min(left, viewportWidth - popoverWidth - 10));

    setCoords({ top, left, placement });
  }, [align]);

  // Adjust popover position and manage outside listeners
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current && containerRef.current.contains(target)) {
        return;
      }
      if (popoverRef.current && popoverRef.current.contains(target)) {
        return;
      }
      setIsOpen(false);
      setHoverDate(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setHoverDate(null);
      }
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  // Month navigation helpers
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Day click logic in the calendar grid
  const handleDayClick = (dateStr: string) => {
    const { start, end } = tempRange;

    // Case 1: No start yet, or range already complete -> pick start fresh
    if (!start || (start && end)) {
      setTempRange({ start: dateStr, end: '' });
      setHoverDate(null);
      return;
    }

    // Case 2: Start is set, waiting for End
    if (start && !end) {
      if (dateStr < start) {
        // User clicked a date earlier than start -> reset start date to this earlier date
        setTempRange({ start: dateStr, end: '' });
      } else {
        // Range completed!
        setTempRange({ start, end: dateStr });
        onChange(start, dateStr);
        setHoverDate(null);
        setIsOpen(false);
      }
    }
  };

  // Apply button handler for manual inputs
  const handleApplyManualDates = () => {
    if (!tempRange.start && !tempRange.end) {
      setIsOpen(false);
      return;
    }
    let s = tempRange.start;
    let e = tempRange.end;
    if (s && e && s > e) {
      const tmp = s;
      s = e;
      e = tmp;
    }
    onChange(s, e);
    setIsOpen(false);
    setHoverDate(null);
  };

  // Clear handler
  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTempRange({ start: '', end: '' });
    setHoverDate(null);
    if (onClear) {
      onClear();
    } else {
      onChange('', '');
    }
  };

  // Generate 42 calendar grid cells (current month with padding from prev and next)
  const calendarCells = useMemo(() => {
    const cells: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isDisabled: boolean;
    }> = [];

    const firstDayDate = new Date(viewYear, viewMonth, 1);
    // Sunday is 0 in JS Date. Convert so Monday = 0, Sunday = 6
    let firstDayIndex = firstDayDate.getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6;

    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const todayStr = formatYMD(new Date());

    // 1. Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(viewYear, viewMonth - 1, dayNum);
      const dateStr = formatYMD(prevDate);
      const isDisabled = Boolean((minDate && dateStr < minDate) || (maxDate && dateStr > maxDate));
      cells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isDisabled,
      });
    }

    // 2. Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const curDate = new Date(viewYear, viewMonth, day);
      const dateStr = formatYMD(curDate);
      const isDisabled = Boolean((minDate && dateStr < minDate) || (maxDate && dateStr > maxDate));
      cells.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isDisabled,
      });
    }

    // 3. Next month leading days to complete full grid (multiple of 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextDate = new Date(viewYear, viewMonth + 1, day);
      const dateStr = formatYMD(nextDate);
      const isDisabled = Boolean((minDate && dateStr < minDate) || (maxDate && dateStr > maxDate));
      cells.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isDisabled,
      });
    }

    return cells;
  }, [viewYear, viewMonth, minDate, maxDate]);

  const hasValue = Boolean(startDate || endDate);
  const activeDaysCount = startDate && endDate ? getDaysCount(startDate, endDate) : 0;

  const activeStart = tempRange.start;
  const activeEnd = tempRange.end;
  const isPickingSecond = Boolean(activeStart && !activeEnd);

  const defaultPlaceholder = placeholder || t('selectDateRange') || 'Select date range...';
  const formattedButtonLabel = formatDateRange(
    startDate,
    endDate,
    currentLocale,
    defaultPlaceholder
  );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Optional Form Input Label */}
      {label && variant === 'input' && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-foreground dark:text-night-text text-xs flex items-center gap-1.5">
            {icon}
            {label}
          </span>
          {hasValue && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[10px] text-rose-500 hover:underline font-semibold cursor-pointer"
            >
              {t('clear') || 'Clear'}
            </button>
          )}
        </div>
      )}

      {/* Trigger Component (Button / Pill / Input variants) */}
      {variant === 'input' ? (
        <div
          onClick={() => {
            if (!disabled) setIsOpen((prev) => !prev);
          }}
          className={`w-full px-3 py-2 rounded-xl border bg-background dark:bg-night-bg text-foreground dark:text-night-text text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${
            disabled
              ? 'opacity-50 cursor-not-allowed bg-muted/20 border-border dark:border-night-border'
              : hasValue
                ? 'border-brand-gold/60 bg-brand-gold/5 hover:border-brand-gold shadow-2xs'
                : 'border-border dark:border-night-border hover:border-brand-gold/50'
          } ${isOpen ? 'ring-2 ring-brand-gold/30 border-brand-gold' : ''} ${buttonClassName}`}
        >
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <CalendarIcon
              className={`size-3.5 shrink-0 ${hasValue ? 'text-brand-gold' : 'text-muted-foreground'}`}
            />
            {hasValue ? (
              <div className="flex items-center gap-1.5 flex-wrap font-bold text-foreground dark:text-night-text text-xs">
                <span>{startDate || '...'}</span>
                <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                <span>{endDate || '...'}</span>
                {activeDaysCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-md text-[10px] font-extrabold bg-brand-gold text-neutral-950 shrink-0 shadow-2xs">
                    {t('daysCount', { count: activeDaysCount }) || `${activeDaysCount} d`}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground font-medium truncate text-xs">
                {defaultPlaceholder}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {hasValue && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-muted-foreground hover:text-rose-500 rounded-full hover:bg-muted/60 dark:hover:bg-night-border transition-colors cursor-pointer"
                title={t('clear') || 'Clear'}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Toolbar Button / Pill Variant */
        <button
          type="button"
          onClick={() => {
            if (!disabled) setIsOpen((prev) => !prev);
          }}
          disabled={disabled}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer shadow-2xs select-none ${
            disabled
              ? 'opacity-50 cursor-not-allowed bg-muted/20 border-border dark:border-night-border'
              : hasValue
                ? 'bg-surface dark:bg-night-surface border-brand-gold/50 text-foreground dark:text-night-text ring-1 ring-brand-gold/30'
                : 'bg-surface dark:bg-night-surface border-border/80 dark:border-night-border text-muted hover:text-foreground dark:hover:text-night-text'
          } ${isOpen ? 'ring-2 ring-brand-gold/50 border-brand-gold' : ''} ${buttonClassName}`}
        >
          <CalendarIcon className="size-4 text-brand-gold shrink-0" />
          <span className="truncate">{formattedButtonLabel}</span>
          {activeDaysCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-brand-gold/20 text-brand-gold shrink-0">
              {activeDaysCount}d
            </span>
          )}
          <ChevronDown
            className={`size-3 text-muted transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180 text-foreground dark:text-night-text' : ''
            }`}
          />
        </button>
      )}

      {/* Calendar Dropdown Popover via React Portal directly into body */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={popoverRef}
                initial={{
                  opacity: 0,
                  y: coords.placement === 'top' ? -6 : 6,
                  scale: 0.98,
                }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: coords.placement === 'top' ? -6 : 6,
                  scale: 0.98,
                }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'fixed',
                  top: `${coords.top}px`,
                  left: `${coords.left}px`,
                  zIndex: 99999,
                }}
                className="w-[310px] sm:w-[340px] p-3.5 rounded-2xl bg-surface dark:bg-night-surface border border-border dark:border-night-border shadow-2xl backdrop-blur-xl space-y-3 font-sans"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-1 border-b border-border/40 dark:border-night-border/40">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground dark:text-night-text">
                    <CalendarIcon className="size-3.5 text-brand-gold" />
                    <span>{t('selectDateRange') || 'Select Date Range'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setHoverDate(null);
                    }}
                    className="p-1 rounded-lg text-muted hover:text-foreground dark:hover:text-night-text hover:bg-border/30 dark:hover:bg-night-border/40 cursor-pointer transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                {/* Calendar Month & Navigation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1.5 rounded-xl hover:bg-border/30 dark:hover:bg-night-border/50 text-muted hover:text-foreground dark:hover:text-night-text transition-colors cursor-pointer"
                      title="Previous Month"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <span className="text-xs font-bold text-foreground dark:text-night-text">
                      {MONTH_NAMES[currentLocale]?.[viewMonth] || MONTH_NAMES.en[viewMonth]}{' '}
                      {viewYear}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1.5 rounded-xl hover:bg-border/30 dark:hover:bg-night-border/50 text-muted hover:text-foreground dark:hover:text-night-text transition-colors cursor-pointer"
                      title="Next Month"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>

                  {/* Weekdays Header */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted">
                    {(WEEKDAY_NAMES[currentLocale] || WEEKDAY_NAMES.en).map((day, idx) => (
                      <div key={idx} className="py-0.5">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days Grid */}
                  <div className="grid grid-cols-7 gap-1" onMouseLeave={() => setHoverDate(null)}>
                    {calendarCells.map((cell) => {
                      const isStart = cell.dateStr === tempRange.start;
                      const isEnd = cell.dateStr === tempRange.end;
                      const isHovering = Boolean(tempRange.start && !tempRange.end && hoverDate);
                      const effectiveEnd = tempRange.end || (isHovering ? hoverDate : null);
                      const inRange = Boolean(
                        tempRange.start &&
                        effectiveEnd &&
                        cell.dateStr > tempRange.start &&
                        cell.dateStr < effectiveEnd
                      );
                      const isHoverPreview = isHovering && cell.dateStr === hoverDate;

                      return (
                        <button
                          key={cell.dateStr}
                          type="button"
                          disabled={cell.isDisabled}
                          onClick={() => handleDayClick(cell.dateStr)}
                          onMouseEnter={() => {
                            if (isPickingSecond && !cell.isDisabled) {
                              setHoverDate(cell.dateStr);
                            }
                          }}
                          className={`h-7 text-xs rounded-lg flex items-center justify-center font-medium transition-all relative cursor-pointer ${
                            cell.isDisabled
                              ? 'opacity-30 cursor-not-allowed text-muted'
                              : !cell.isCurrentMonth
                                ? 'text-muted/40 hover:text-muted'
                                : 'text-foreground dark:text-night-text'
                          } ${
                            isStart || isEnd || isHoverPreview
                              ? 'bg-brand-gold text-neutral-950 font-bold shadow-xs'
                              : inRange
                                ? 'bg-brand-gold/20 text-foreground dark:text-night-text rounded-none'
                                : 'hover:bg-border/30 dark:hover:bg-night-border/50'
                          } ${isStart && effectiveEnd ? 'rounded-r-none' : ''} ${
                            (isEnd || isHoverPreview) && tempRange.start ? 'rounded-l-none' : ''
                          }`}
                        >
                          {cell.dayNumber}
                          {cell.isToday && !isStart && !isEnd && (
                            <span className="absolute bottom-0.5 size-1 rounded-full bg-brand-gold" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Manual Date Inputs */}
                <div className="pt-2 border-t border-border/40 dark:border-night-border/40 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-muted uppercase tracking-wider block mb-0.5">
                        {t('from') || 'From'}
                      </label>
                      <input
                        type="date"
                        value={tempRange.start}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTempRange((prev) => ({ ...prev, start: val }));
                          const parsed = parseYMD(val);
                          if (parsed) {
                            setViewYear(parsed.getFullYear());
                            setViewMonth(parsed.getMonth());
                          }
                        }}
                        className="w-full px-2 py-1 text-xs bg-background dark:bg-night-bg text-foreground dark:text-night-text rounded-lg border border-border dark:border-night-border focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted uppercase tracking-wider block mb-0.5">
                        {t('to') || 'To'}
                      </label>
                      <input
                        type="date"
                        value={tempRange.end}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTempRange((prev) => ({ ...prev, end: val }));
                          const parsed = parseYMD(val);
                          if (parsed && !tempRange.start) {
                            setViewYear(parsed.getFullYear());
                            setViewMonth(parsed.getMonth());
                          }
                        }}
                        className="w-full px-2 py-1 text-xs bg-background dark:bg-night-bg text-foreground dark:text-night-text rounded-lg border border-border dark:border-night-border focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                  </div>

                  {/* Footer with Days Count & Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      {tempRange.start &&
                      tempRange.end &&
                      getDaysCount(tempRange.start, tempRange.end) > 0 ? (
                        <span className="text-[11px] font-bold text-brand-gold">
                          {t('daysCount', {
                            count: getDaysCount(tempRange.start, tempRange.end),
                          }) || `${getDaysCount(tempRange.start, tempRange.end)} days`}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted">
                          {!tempRange.start
                            ? t('selectStartDate') || 'Select start date'
                            : t('selectEndDate') || 'Select end date'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(tempRange.start || tempRange.end) && (
                        <button
                          type="button"
                          onClick={handleClear}
                          className="px-2.5 py-1 text-xs font-semibold text-muted hover:text-destructive dark:hover:text-red-400 rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer"
                        >
                          {t('clear') || 'Clear'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleApplyManualDates}
                        className="px-3 py-1 text-xs font-bold bg-brand-gold hover:bg-brand-gold/90 text-neutral-950 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Check className="size-3 stroke-[3]" />
                        <span>{t('apply') || 'Apply'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
