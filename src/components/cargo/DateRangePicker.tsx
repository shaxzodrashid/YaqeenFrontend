import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowRight,
  Sparkles,
  Check,
} from 'lucide-react';
import { useTranslation, type Locale } from '../../context/LanguageContext';

export interface DateRangePickerProps {
  label?: string;
  icon?: React.ReactNode;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  onChange: (startDate: string, endDate: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  align?: 'left' | 'right' | 'auto';
  disabled?: boolean;
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
export function getDaysCount(startStr: string, endStr: string): number {
  const s = parseYMD(startStr);
  const e = parseYMD(endStr);
  if (!s || !e) return 0;
  const diffTime = Math.abs(e.getTime() - s.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
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

const WEEKDAY_NAMES: Record<Locale, string[]> = {
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  uz: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'],
};

export function DateRangePicker({
  label,
  icon,
  startDate,
  endDate,
  onChange,
  onClear,
  placeholder,
  className = '',
  align = 'auto',
  disabled = false,
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
  const [effectiveAlign, setEffectiveAlign] = useState<'left' | 'right'>('left');

  // Synchronize internal state when props change
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

  // Adjust popover alignment based on container position
  useEffect(() => {
    if (isOpen && containerRef.current) {
      if (align === 'left' || align === 'right') {
        setEffectiveAlign(align);
      } else {
        const rect = containerRef.current.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        // If container is closer to right edge than 360px, open to the left (align right)
        if (screenWidth - rect.left < 360) {
          setEffectiveAlign('right');
        } else {
          setEffectiveAlign('left');
        }
      }
    }
  }, [isOpen, align]);

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHoverDate(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setHoverDate(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

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

  // Preset Date Selection Helper
  const handleApplyPreset = (
    preset: 'today' | 'yesterday' | 'week' | 'last7' | 'month' | 'last30' | 'year'
  ) => {
    const today = new Date();
    let start = '';
    let end = formatYMD(today);

    if (preset === 'today') {
      start = end;
    } else if (preset === 'yesterday') {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      start = formatYMD(d);
      end = start;
    } else if (preset === 'week') {
      const d = new Date(today);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
      d.setDate(diff);
      start = formatYMD(d);
    } else if (preset === 'last7') {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      start = formatYMD(d);
    } else if (preset === 'month') {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      start = formatYMD(d);
    } else if (preset === 'last30') {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      start = formatYMD(d);
    } else if (preset === 'year') {
      const d = new Date(today.getFullYear(), 0, 1);
      start = formatYMD(d);
    }

    setTempRange({ start, end });
    onChange(start, end);

    const sDate = parseYMD(start);
    if (sDate) {
      setViewYear(sDate.getFullYear());
      setViewMonth(sDate.getMonth());
    }
    setIsOpen(false);
  };

  // Day click logic
  const handleDayClick = (dateStr: string) => {
    const { start, end } = tempRange;

    // Case 1: No selection yet, or both start and end were already set -> start fresh
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
      }
    }
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
      cells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // 2. Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const curDate = new Date(viewYear, viewMonth, day);
      const dateStr = formatYMD(curDate);
      cells.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // 3. Next month leading days to complete full grid (multiple of 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextDate = new Date(viewYear, viewMonth + 1, day);
      const dateStr = formatYMD(nextDate);
      cells.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const hasValue = Boolean(startDate || endDate);
  const activeDaysCount = startDate && endDate ? getDaysCount(startDate, endDate) : 0;

  // Active selection evaluation for rendering cells
  const activeStart = tempRange.start;
  const activeEnd = tempRange.end;
  const isPickingSecond = Boolean(activeStart && !activeEnd);

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {/* Label & Clear Header */}
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
            {icon}
            {label}
          </span>
          {hasValue && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[10px] text-rose-500 hover:underline font-semibold cursor-pointer"
            >
              {t('clear')}
            </button>
          )}
        </div>
      )}

      {/* Single Interactive Trigger Component */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        className={`w-full px-3 py-2 rounded-xl border bg-background text-foreground text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-muted/20 border-border'
            : hasValue
              ? 'border-brand-gold/60 bg-brand-gold/5 hover:border-brand-gold shadow-xs'
              : 'border-border hover:border-brand-gold/50'
        } ${isOpen ? 'ring-2 ring-brand-gold/30 border-brand-gold' : ''}`}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <CalendarIcon
            className={`size-3.5 shrink-0 ${hasValue ? 'text-brand-gold' : 'text-muted-foreground'}`}
          />
          {hasValue ? (
            <div className="flex items-center gap-1.5 flex-wrap font-bold text-foreground text-xs">
              <span>{startDate || '...'}</span>
              <ArrowRight className="size-3 text-muted-foreground shrink-0" />
              <span>{endDate || '...'}</span>
              {activeDaysCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-md text-[10px] font-extrabold bg-brand-gold text-brand-navy shrink-0 shadow-xs">
                  {t('daysCount', { count: activeDaysCount }) || `${activeDaysCount} d`}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground font-medium truncate text-xs">
              {placeholder || t('selectDateRange') || 'Select date range...'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {hasValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-muted-foreground hover:text-rose-500 rounded-full hover:bg-muted/60 transition-colors cursor-pointer"
              title={t('clear')}
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Calendar Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 mt-1.5 w-[310px] sm:w-[330px] p-3.5 rounded-2xl bg-surface dark:bg-surface border border-border shadow-2xl space-y-3 ${
              effectiveAlign === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            {/* Quick Presets Strip */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 border-b border-border/60">
              <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 mr-0.5 shrink-0">
                <Sparkles className="size-3 text-brand-gold" />
              </span>
              {[
                { key: 'today', labelKey: 'presetToday' },
                { key: 'week', labelKey: 'presetThisWeek' },
                { key: 'month', labelKey: 'presetThisMonth' },
                { key: 'last30', labelKey: 'presetLast30Days' },
                { key: 'year', labelKey: 'presetThisYear' },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handleApplyPreset(p.key as any)}
                  className="px-2 py-0.5 rounded-lg border border-border/80 bg-muted/20 hover:bg-brand-gold/15 hover:border-brand-gold/50 text-[10px] font-bold text-foreground transition-all shrink-0 cursor-pointer"
                >
                  {t(p.labelKey)}
                </button>
              ))}
            </div>

            {/* Calendar Month & Year Header */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="size-4" />
              </button>

              <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                <span>{MONTH_NAMES[currentLocale]?.[viewMonth] || MONTH_NAMES.en[viewMonth]}</span>
                <span>{viewYear}</span>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Weekdays Row */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {(WEEKDAY_NAMES[currentLocale] || WEEKDAY_NAMES.en).map((dayName, idx) => (
                <div
                  key={idx}
                  className="text-[10px] font-extrabold text-muted-foreground uppercase py-0.5"
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div
              className="grid grid-cols-7 gap-y-1 gap-x-0"
              onMouseLeave={() => setHoverDate(null)}
            >
              {calendarCells.map((cell) => {
                const { dateStr, dayNumber, isCurrentMonth, isToday } = cell;

                // Evaluate selection states
                const isStart = activeStart === dateStr;
                const isEnd = activeEnd === dateStr;

                // In fixed range (both start & end chosen)
                const isInSelectedRange = Boolean(
                  activeStart && activeEnd && dateStr > activeStart && dateStr < activeEnd
                );

                // In hover preview range (start chosen, hovering over future date)
                const isHovered = Boolean(
                  isPickingSecond &&
                  hoverDate &&
                  hoverDate >= activeStart &&
                  dateStr > activeStart &&
                  dateStr <= hoverDate
                );

                const isHoverTarget = Boolean(
                  isPickingSecond && hoverDate === dateStr && dateStr >= activeStart
                );

                const isInAnyRange = isInSelectedRange || isHovered;

                return (
                  <div
                    key={dateStr}
                    className={`relative p-0 flex items-center justify-center ${
                      isInAnyRange
                        ? 'bg-brand-gold/15 dark:bg-brand-gold/20'
                        : isStart && (activeEnd || isHovered)
                          ? 'bg-gradient-to-r from-transparent to-brand-gold/15 dark:to-brand-gold/20'
                          : (isEnd || isHoverTarget) && activeStart
                            ? 'bg-gradient-to-l from-transparent to-brand-gold/15 dark:to-brand-gold/20'
                            : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleDayClick(dateStr)}
                      onMouseEnter={() => {
                        if (isPickingSecond) {
                          setHoverDate(dateStr);
                        }
                      }}
                      className={`size-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center relative z-10 cursor-pointer ${
                        isStart || isEnd || isHoverTarget
                          ? 'bg-brand-gold text-brand-navy font-extrabold shadow-sm scale-105'
                          : isToday
                            ? 'border border-brand-gold text-foreground font-extrabold'
                            : isCurrentMonth
                              ? 'text-foreground hover:bg-muted/60'
                              : 'text-muted-foreground/30 hover:bg-muted/30'
                      }`}
                    >
                      {dayNumber}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Popover Footer Info & Actions */}
            <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
              <div className="text-muted-foreground truncate font-medium">
                {tempRange.start && tempRange.end ? (
                  <span className="text-foreground font-semibold">
                    {tempRange.start} ~ {tempRange.end} (
                    {getDaysCount(tempRange.start, tempRange.end)}d)
                  </span>
                ) : tempRange.start ? (
                  <span className="text-brand-gold font-semibold animate-pulse">
                    {t('selectEndDate') || 'Click to select end date'}
                  </span>
                ) : (
                  <span>{t('selectStartDate') || 'Click to select start date'}</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {hasValue && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-2 py-1 rounded-lg text-rose-500 hover:bg-rose-500/10 font-bold transition-colors cursor-pointer"
                  >
                    {t('clear')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-2.5 py-1 rounded-lg bg-brand-gold text-brand-navy font-extrabold hover:bg-brand-gold/90 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Check className="size-3 stroke-[3]" />
                  <span>OK</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
