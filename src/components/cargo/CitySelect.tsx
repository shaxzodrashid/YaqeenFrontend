import React, { useState, useEffect, useRef, useId, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Search,
  X,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Loader2,
  Check,
  Globe2,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { locationsApi, getCountryFlag } from '../../services/locations.service';
import type { CityOption } from '../../types/locations';

export interface CitySelectProps {
  label?: string;
  placeholder?: string;
  value?: CityOption | string | null;
  cityName?: string;
  countryCode?: string;
  geonameId?: number | null;
  onChange: (city: CityOption | null, customText?: string) => void;
  required?: boolean;
  disabled?: boolean;
  countryFilter?: string;
  error?: string;
  showMapLink?: boolean;
  className?: string;
}

export const CitySelect: React.FC<CitySelectProps> = ({
  label,
  placeholder,
  value,
  cityName,
  countryCode,
  onChange,
  required = false,
  disabled = false,
  countryFilter,
  error,
  showMapLink = true,
  className = '',
}) => {
  const { t } = useTranslation();
  const componentId = useId();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [options, setOptions] = useState<CityOption[]>([]);
  const [popularHubs, setPopularHubs] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync internal display query from props
  useEffect(() => {
    if (value && typeof value === 'object') {
      setQuery(value.name || value.display_name || '');
    } else if (typeof value === 'string') {
      setQuery(value);
    } else if (cityName) {
      setQuery(cityName);
    } else {
      setQuery('');
    }
  }, [value, cityName]);

  // Preload popular hubs on mount
  useEffect(() => {
    let isMounted = true;
    locationsApi
      .getPopularHubs()
      .then((hubs) => {
        if (isMounted) {
          if (countryFilter) {
            setPopularHubs(
              hubs.filter(
                (h) => (h.country_code || '').toUpperCase() === countryFilter.toUpperCase()
              )
            );
          } else {
            setPopularHubs(hubs);
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [countryFilter]);

  // Debounced search when query changes
  useEffect(() => {
    if (!isOpen) return;

    const trimmed = query.trim();
    if (!trimmed) {
      setOptions(popularHubs);
      setLoading(false);
      setHighlightedIndex(-1);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const results = await locationsApi.searchCities({
          q: trimmed,
          country: countryFilter,
          limit: 15,
        });
        setOptions(results);
        setHighlightedIndex(-1);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [query, isOpen, countryFilter, popularHubs]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectCity = useCallback(
    (city: CityOption) => {
      onChange(city, city.name);
      setQuery(city.name);
      setIsOpen(false);
      setHighlightedIndex(-1);
    },
    [onChange]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null, '');
      setQuery('');
      setIsOpen(false);
      inputRef.current?.focus();
    },
    [onChange]
  );

  const handleCustomSubmit = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      onChange(null, '');
      setIsOpen(false);
      return;
    }

    // Check if query matches an existing option exactly
    const exactMatch = options.find(
      (o) =>
        o.name.toLowerCase() === trimmed.toLowerCase() ||
        (o.ascii_name && o.ascii_name.toLowerCase() === trimmed.toLowerCase())
    );

    if (exactMatch) {
      handleSelectCity(exactMatch);
    } else {
      // Create ad-hoc custom city option
      const customOption: CityOption = {
        geoname_id: null,
        name: trimmed,
        ascii_name: trimmed,
        country_name: null,
        country_code: countryCode || countryFilter || null,
        admin1_name: null,
        latitude: null,
        longitude: null,
        timezone: null,
        population: null,
        display_name: countryCode ? `${trimmed} (${countryCode})` : trimmed,
      };
      onChange(customOption, trimmed);
      setIsOpen(false);
    }
  }, [query, options, countryCode, countryFilter, onChange, handleSelectCity]);

  // Keyboard navigation support
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev));
      scrollToHighlighted(highlightedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      scrollToHighlighted(highlightedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        handleSelectCity(options[highlightedIndex]);
      } else {
        handleCustomSubmit();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const scrollToHighlighted = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('li');
    if (items[index]) {
      items[index].scrollIntoView({ block: 'nearest' });
    }
  };

  // Google Maps preview URL
  const selectedLat = typeof value === 'object' ? value?.latitude : null;
  const selectedLng = typeof value === 'object' ? value?.longitude : null;
  const selectedName =
    typeof value === 'object' ? value?.name : typeof value === 'string' ? value : cityName || query;
  const mapUrl = locationsApi.buildPointUrl(selectedLat, selectedLng, selectedName || query);

  const displayCountryCode =
    (typeof value === 'object' ? value?.country_code : null) || countryCode;
  const flagEmoji = getCountryFlag(displayCountryCode);

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={componentId}
            className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5"
          >
            <MapPin className="size-3.5 text-brand-gold" />
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold">*</span>}
          </label>

          {showMapLink && (selectedName || query) && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-medium text-brand-navy dark:text-brand-gold hover:underline opacity-80 hover:opacity-100 transition-opacity"
              title={t('openInGoogleMaps') || 'Open in Google Maps'}
            >
              <span>{t('viewOnMap') || 'Maps'}</span>
              <ExternalLink className="size-2.5" />
            </a>
          )}
        </div>
      )}

      {/* Input container */}
      <div
        className={`relative flex items-center w-full rounded-xl border bg-surface dark:bg-surface transition-all duration-200 ${
          error
            ? 'border-rose-500 ring-1 ring-rose-500/30'
            : isOpen
              ? 'border-brand-gold ring-2 ring-brand-gold/30 shadow-xs'
              : 'border-border hover:border-border/80'
        } ${disabled ? 'opacity-50 pointer-events-none bg-muted/40' : ''}`}
      >
        {/* Left flag / pin badge */}
        <div className="pl-3 pr-1.5 flex items-center text-muted-foreground shrink-0 select-none">
          {displayCountryCode ? (
            <span
              className="text-base leading-none"
              title={
                (typeof value === 'object' ? value?.country_name : null) || displayCountryCode || ''
              }
            >
              {flagEmoji}
            </span>
          ) : (
            <MapPin className="size-4 text-muted-foreground/70" />
          )}
        </div>

        {/* Text Input */}
        <input
          id={componentId}
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          placeholder={
            placeholder ||
            t('searchCityPlaceholder') ||
            'Search city (e.g. Tashkent, Yiwu, Istanbul)...'
          }
          autoComplete="off"
          onFocus={() => {
            setIsOpen(true);
            if (!query.trim()) {
              setOptions(popularHubs);
            }
          }}
          onChange={(e) => {
            const nextVal = e.target.value;
            setQuery(nextVal);
            setIsOpen(true);
            if (!nextVal.trim()) {
              onChange(null, '');
            } else {
              onChange(null, nextVal);
            }
          }}
          onKeyDown={handleKeyDown}
          className="w-full py-2.5 pr-14 pl-1 text-xs text-foreground bg-transparent placeholder:text-muted-foreground/60 focus:outline-none font-medium truncate"
        />

        {/* Right action buttons */}
        <div className="absolute right-2 flex items-center gap-1 shrink-0">
          {loading ? (
            <Loader2 className="size-4 animate-spin text-brand-gold" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title={t('clear') || 'Clear'}
            >
              <X className="size-3.5" />
            </button>
          ) : null}

          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              if (!disabled) {
                setIsOpen(!isOpen);
                inputRef.current?.focus();
              }
            }}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown
              className={`size-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-gold' : ''}`}
            />
          </button>
        </div>
      </div>

      {error && <span className="text-[11px] text-rose-500 font-medium">{error}</span>}

      {/* Autocomplete Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-surface dark:bg-surface border border-border/80 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md"
          >
            {/* Header pill */}
            <div className="px-3 py-2 bg-muted/40 border-b border-border/60 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1.5">
                {query.trim() ? (
                  <>
                    <Search className="size-3 text-brand-gold" />
                    <span>
                      {t('searchResults') || 'Search Results'} ({options.length})
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3 text-brand-gold" />
                    <span>{t('popularLogisticsHubs') || 'Popular Logistics Hubs'}</span>
                  </>
                )}
              </span>
              <span className="text-[9px] font-normal lowercase opacity-70">
                {t('pressEnterToSelect') || 'press enter to select'}
              </span>
            </div>

            {/* List */}
            <ul
              ref={listRef}
              className="max-h-60 overflow-y-auto py-1 divide-y divide-border/30 text-xs"
            >
              {options.length > 0 ? (
                options.map((city, index) => {
                  const valGeonameId = typeof value === 'object' ? value?.geoname_id : null;
                  const valName =
                    typeof value === 'object'
                      ? value?.name
                      : typeof value === 'string'
                        ? value
                        : '';
                  const isSelected =
                    (valGeonameId && valGeonameId === city.geoname_id) ||
                    (valName && valName.toLowerCase() === city.name.toLowerCase());
                  const isHighlighted = highlightedIndex === index;
                  const itemFlag = getCountryFlag(city.country_code);

                  return (
                    <li
                      key={
                        city.geoname_id ? `geo-${city.geoname_id}` : `city-${city.name}-${index}`
                      }
                      onClick={() => handleSelectCity(city)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                        isHighlighted
                          ? 'bg-brand-gold/15 text-foreground'
                          : isSelected
                            ? 'bg-muted/70 text-foreground font-semibold'
                            : 'hover:bg-muted/40 text-foreground/90'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span
                          className="text-base leading-none shrink-0"
                          title={city.country_name || ''}
                        >
                          {itemFlag}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs truncate text-foreground">
                              {city.name}
                            </span>
                            {city.country_code && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-muted text-muted-foreground border border-border/50 shrink-0">
                                {city.country_code}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {city.admin1_name ? `${city.admin1_name}, ` : ''}
                            {city.country_name || ''}
                            {city.population
                              ? ` • ${(city.population / 1000000).toFixed(1)}M pop`
                              : ''}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="size-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Check className="size-3 stroke-[3]" />
                        </span>
                      )}
                    </li>
                  );
                })
              ) : (
                <div className="p-4 text-center text-muted-foreground text-xs">
                  <Globe2 className="size-6 mx-auto mb-1.5 opacity-40 text-muted-foreground" />
                  <p className="font-semibold text-foreground">
                    {t('noExactLocationFound') || 'No exact location found'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {t('customLocationPrompt') ||
                      'You can still use your custom entered text as the destination.'}
                  </p>
                </div>
              )}

              {/* Free-form Custom Entry Fallback Option */}
              {query.trim().length > 0 &&
                !options.some((o) => o.name.toLowerCase() === query.trim().toLowerCase()) && (
                  <li
                    onClick={handleCustomSubmit}
                    className="px-3 py-2.5 bg-brand-gold/5 hover:bg-brand-gold/15 cursor-pointer flex items-center justify-between gap-2 border-t border-brand-gold/20 text-brand-navy dark:text-brand-gold transition-colors font-medium"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="size-3.5 shrink-0" />
                      <span className="truncate text-xs">
                        {t('useCustomLocation') || 'Use custom'}: &quot;
                        <strong>{query.trim()}</strong>&quot;
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-gold/20 shrink-0">
                      {t('customOption') || 'Custom'}
                    </span>
                  </li>
                )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
