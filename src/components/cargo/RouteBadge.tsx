import React from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { locationsApi, getCountryFlag } from '../../services/locations.service';
import type { LocationDetail, RouteInfo } from '../../types/locations';

export interface RouteBadgeProps {
  origin?: LocationDetail | string | null;
  originCity?: string | null;
  destination?: LocationDetail | string | null;
  destinationCity?: string | null;
  route?: RouteInfo | null;
  googleMapsUrl?: string | null;
  originCountryCode?: string | null;
  destinationCountryCode?: string | null;
  originLat?: number | null;
  originLng?: number | null;
  destLat?: number | null;
  destLng?: number | null;
  className?: string;
  showMapButton?: boolean;
}

export const RouteBadge: React.FC<RouteBadgeProps> = ({
  origin,
  originCity,
  destination,
  destinationCity,
  route,
  googleMapsUrl,
  originCountryCode,
  destinationCountryCode,
  originLat,
  originLng,
  destLat,
  destLng,
  className = '',
  showMapButton = true,
}) => {
  const { t } = useTranslation();
  const originName =
    originCity ||
    (typeof origin === 'string'
      ? origin
      : origin?.city || origin?.display_name || route?.origin || '');

  const destName =
    destinationCity ||
    (typeof destination === 'string'
      ? destination
      : destination?.city || destination?.display_name || route?.destination || '');

  const origCode =
    (typeof origin === 'object' && origin?.country_code) || originCountryCode || null;

  const destCode =
    (typeof destination === 'object' && destination?.country_code) ||
    destinationCountryCode ||
    null;

  const oLat = (typeof origin === 'object' && origin?.latitude) || originLat;
  const oLng = (typeof origin === 'object' && origin?.longitude) || originLng;
  const dLat = (typeof destination === 'object' && destination?.latitude) || destLat;
  const dLng = (typeof destination === 'object' && destination?.longitude) || destLng;

  if (!originName && !destName) {
    return <span className="text-muted-foreground/60 text-xs italic">—</span>;
  }

  const mapUrl =
    googleMapsUrl ||
    route?.google_maps_dir_url ||
    locationsApi.buildRouteUrl(oLat, oLng, dLat, dLng, originName, destName);

  const tooltipText = `${originName}${origCode ? ` (${origCode})` : ''} → ${destName}${destCode ? ` (${destCode})` : ''}`;

  return (
    <div className={`inline-flex items-center gap-1.5 max-w-full group ${className}`}>
      <div
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-muted/40 hover:bg-muted/70 text-foreground border border-border/60 transition-colors text-[11px] font-medium min-w-0 max-w-full"
        title={tooltipText}
      >
        {/* Origin */}
        <div className="inline-flex items-center gap-1 min-w-0 shrink">
          {origCode && (
            <span className="text-xs leading-none shrink-0" title={origCode}>
              {getCountryFlag(origCode)}
            </span>
          )}
          <span className="truncate font-semibold max-w-[85px] text-foreground">
            {originName || '—'}
          </span>
        </div>

        {/* Direction Arrow */}
        <ArrowRight className="size-3 text-brand-gold shrink-0 opacity-80" />

        {/* Destination */}
        <div className="inline-flex items-center gap-1 min-w-0 shrink">
          {destCode && (
            <span className="text-xs leading-none shrink-0" title={destCode}>
              {getCountryFlag(destCode)}
            </span>
          )}
          <span className="truncate font-semibold max-w-[85px] text-foreground">
            {destName || '—'}
          </span>
        </div>
      </div>

      {showMapButton && (
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-1 rounded-md text-muted-foreground hover:text-brand-gold hover:bg-brand-gold/10 transition-colors shrink-0 opacity-70 group-hover:opacity-100"
          title={t('openInGoogleMaps') || 'Open Route in Google Maps'}
        >
          <MapPin className="size-3" />
        </a>
      )}
    </div>
  );
};
