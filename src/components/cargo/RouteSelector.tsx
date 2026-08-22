import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeftRight, Navigation, ExternalLink } from 'lucide-react';
import { CitySelect } from './CitySelect';
import { useTranslation } from '../../context/LanguageContext';
import { locationsApi, getCountryFlag } from '../../services/locations.service';
import type { CityOption } from '../../types/locations';

export interface RouteState {
  origin_city: string;
  origin_country?: string;
  origin_country_code?: string;
  origin_geoname_id?: number | null;
  origin_lat?: number | null;
  origin_lng?: number | null;
  destination_city: string;
  destination_country?: string;
  destination_country_code?: string;
  destination_geoname_id?: number | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
}

export interface RouteSelectorProps {
  route: RouteState;
  onChange: (newRoute: RouteState) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const RouteSelector: React.FC<RouteSelectorProps> = ({
  route,
  onChange,
  disabled = false,
  required = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const [isSwapping, setIsSwapping] = useState<boolean>(false);

  const handleOriginChange = (city: CityOption | null, customText?: string) => {
    if (city) {
      onChange({
        ...route,
        origin_city: city.name,
        origin_country: city.country_name || undefined,
        origin_country_code: city.country_code || undefined,
        origin_geoname_id: city.geoname_id,
        origin_lat: city.latitude,
        origin_lng: city.longitude,
      });
    } else {
      onChange({
        ...route,
        origin_city: customText || '',
        origin_country: undefined,
        origin_country_code: undefined,
        origin_geoname_id: null,
        origin_lat: null,
        origin_lng: null,
      });
    }
  };

  const handleDestinationChange = (city: CityOption | null, customText?: string) => {
    if (city) {
      onChange({
        ...route,
        destination_city: city.name,
        destination_country: city.country_name || undefined,
        destination_country_code: city.country_code || undefined,
        destination_geoname_id: city.geoname_id,
        destination_lat: city.latitude,
        destination_lng: city.longitude,
      });
    } else {
      onChange({
        ...route,
        destination_city: customText || '',
        destination_country: undefined,
        destination_country_code: undefined,
        destination_geoname_id: null,
        destination_lat: null,
        destination_lng: null,
      });
    }
  };

  const handleSwapRoute = () => {
    if (disabled) return;
    setIsSwapping(true);
    setTimeout(() => setIsSwapping(false), 300);

    onChange({
      origin_city: route.destination_city,
      origin_country: route.destination_country,
      origin_country_code: route.destination_country_code,
      origin_geoname_id: route.destination_geoname_id,
      origin_lat: route.destination_lat,
      origin_lng: route.destination_lng,

      destination_city: route.origin_city,
      destination_country: route.origin_country,
      destination_country_code: route.origin_country_code,
      destination_geoname_id: route.origin_geoname_id,
      destination_lat: route.origin_lat,
      destination_lng: route.origin_lng,
    });
  };

  const directionsUrl = locationsApi.buildRouteUrl(
    route.origin_lat,
    route.origin_lng,
    route.destination_lat,
    route.destination_lng,
    route.origin_city,
    route.destination_city
  );

  const hasCompleteRoute = Boolean(route.origin_city.trim() && route.destination_city.trim());

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-2 md:gap-3 items-end">
        {/* Origin Selector */}
        <div className="min-w-0">
          <CitySelect
            label={t('originCityLabel') || 'Origin (Departure)'}
            placeholder={t('originCityPlaceholder') || 'e.g. Yiwu, Guangzhou, Istanbul...'}
            cityName={route.origin_city}
            countryCode={route.origin_country_code}
            geonameId={route.origin_geoname_id}
            onChange={handleOriginChange}
            required={required}
            disabled={disabled}
            showMapLink={false}
          />
        </div>

        {/* Swap Button */}
        <div className="flex justify-center pb-0.5">
          <button
            type="button"
            onClick={handleSwapRoute}
            disabled={disabled || (!route.origin_city && !route.destination_city)}
            className="p-2.5 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-brand-gold border border-border transition-all active:scale-95 disabled:opacity-40 cursor-pointer shadow-xs"
            title={t('swapRoute') || 'Swap Origin and Destination'}
          >
            <motion.div animate={{ rotate: isSwapping ? 180 : 0 }} transition={{ duration: 0.25 }}>
              <ArrowLeftRight className="size-4" />
            </motion.div>
          </button>
        </div>

        {/* Destination Selector */}
        <div className="min-w-0">
          <CitySelect
            label={t('destinationCityLabel') || 'Destination (Delivery Hub)'}
            placeholder={t('destinationCityPlaceholder') || 'e.g. Tashkent, Samarkand, Almaty...'}
            cityName={route.destination_city}
            countryCode={route.destination_country_code}
            geonameId={route.destination_geoname_id}
            onChange={handleDestinationChange}
            required={required}
            disabled={disabled}
            showMapLink={false}
          />
        </div>
      </div>

      {/* Visual Route Corridor Bar */}
      {hasCompleteRoute && (
        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/70 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0 font-medium text-foreground">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm shrink-0">{getCountryFlag(route.origin_country_code)}</span>
              <span className="font-bold truncate max-w-[120px] sm:max-w-[180px]">
                {route.origin_city}
              </span>
              {route.origin_country_code && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  ({route.origin_country_code})
                </span>
              )}
            </div>

            <ArrowRight className="size-3.5 text-brand-gold shrink-0 mx-1" />

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm shrink-0">
                {getCountryFlag(route.destination_country_code)}
              </span>
              <span className="font-bold truncate max-w-[120px] sm:max-w-[180px]">
                {route.destination_city}
              </span>
              {route.destination_country_code && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  ({route.destination_country_code})
                </span>
              )}
            </div>
          </div>

          {/* 1-Click Directions Link */}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-navy dark:text-brand-gold border border-brand-gold/30 text-[11px] font-bold transition-colors cursor-pointer shrink-0"
            title={t('googleMapsDirections') || 'Open Google Maps Navigation'}
          >
            <Navigation className="size-3" />
            <span>{t('routeDirections') || 'Route Directions'}</span>
            <ExternalLink className="size-2.5 opacity-70" />
          </a>
        </div>
      )}
    </div>
  );
};
