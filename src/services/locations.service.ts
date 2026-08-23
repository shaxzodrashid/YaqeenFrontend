import { request, registerDemoHandler } from './httpClient';
import type {
  CityOption,
  CitySearchParams,
  DuplicateCheckDto,
  DuplicateCheckResult,
} from '../types/locations';

// ---------------------------------------------------------------------------
// Pre-seeded logistics hubs database for offline resilience & sub-millisecond search
// ---------------------------------------------------------------------------

export const POPULAR_LOGISTICS_HUBS: CityOption[] = [
  // Uzbekistan Hubs
  {
    geoname_id: 1512569,
    name: 'Tashkent',
    ascii_name: 'Tashkent',
    country_name: 'Uzbekistan',
    country_code: 'UZ',
    admin1_name: 'Toshkent Shahri',
    latitude: 41.26465,
    longitude: 69.21627,
    timezone: 'Asia/Tashkent',
    population: 1978028,
    display_name: 'Tashkent, Uzbekistan (UZ)',
  },
  {
    geoname_id: 1216265,
    name: 'Samarkand',
    ascii_name: 'Samarkand',
    country_name: 'Uzbekistan',
    country_code: 'UZ',
    admin1_name: 'Samarqand',
    latitude: 39.65417,
    longitude: 66.95972,
    timezone: 'Asia/Samarkand',
    population: 559000,
    display_name: 'Samarkand, Samarqand, Uzbekistan (UZ)',
  },
  {
    geoname_id: 1217662,
    name: 'Bukhara',
    ascii_name: 'Bukhara',
    country_name: 'Uzbekistan',
    country_code: 'UZ',
    admin1_name: 'Buxoro',
    latitude: 39.77472,
    longitude: 64.42861,
    timezone: 'Asia/Samarkand',
    population: 280000,
    display_name: 'Bukhara, Buxoro, Uzbekistan (UZ)',
  },
  {
    geoname_id: 1514589,
    name: 'Andijan',
    ascii_name: 'Andijan',
    country_name: 'Uzbekistan',
    country_code: 'UZ',
    admin1_name: 'Andijon',
    latitude: 40.78206,
    longitude: 72.34424,
    timezone: 'Asia/Tashkent',
    population: 410000,
    display_name: 'Andijan, Andijon, Uzbekistan (UZ)',
  },
  {
    geoname_id: 1513131,
    name: 'Namangan',
    ascii_name: 'Namangan',
    country_name: 'Uzbekistan',
    country_code: 'UZ',
    admin1_name: 'Namangan',
    latitude: 40.9983,
    longitude: 71.67257,
    timezone: 'Asia/Tashkent',
    population: 640000,
    display_name: 'Namangan, Uzbekistan (UZ)',
  },
  {
    geoname_id: 1513957,
    name: 'Fergana',
    ascii_name: 'Fergana',
    country_name: 'Uzbekistan',
    country_code: 'UZ',
    admin1_name: "Farg'ona",
    latitude: 40.38421,
    longitude: 71.78432,
    timezone: 'Asia/Tashkent',
    population: 380000,
    display_name: "Fergana, Farg'ona, Uzbekistan (UZ)",
  },
  {
    geoname_id: 1513157,
    name: 'Navoi',
    ascii_name: 'Navoi',
    country_name: 'Uzbekistan',
    country_code: 'UZ',
    admin1_name: 'Navoiy',
    latitude: 40.08444,
    longitude: 65.37917,
    timezone: 'Asia/Samarkand',
    population: 150000,
    display_name: 'Navoi, Navoiy, Uzbekistan (UZ)',
  },
  {
    geoname_id: 1513153,
    name: 'Nukus',
    ascii_name: 'Nukus',
    country_name: 'Uzbekistan',
    country_code: 'UZ',
    admin1_name: 'Qoraqalpog‘iston',
    latitude: 42.45306,
    longitude: 59.61028,
    timezone: 'Asia/Samarkand',
    population: 310000,
    display_name: 'Nukus, Karakalpakstan, Uzbekistan (UZ)',
  },

  // China Hubs
  {
    geoname_id: 1787687,
    name: 'Yiwu',
    ascii_name: 'Yiwu',
    country_name: 'China',
    country_code: 'CN',
    admin1_name: 'Zhejiang',
    latitude: 29.31506,
    longitude: 120.07676,
    timezone: 'Asia/Shanghai',
    population: 1859390,
    display_name: 'Yiwu, Zhejiang, China (CN)',
  },
  {
    geoname_id: 1809858,
    name: 'Guangzhou',
    ascii_name: 'Guangzhou',
    country_name: 'China',
    country_code: 'CN',
    admin1_name: 'Guangdong',
    latitude: 23.12744,
    longitude: 113.25052,
    timezone: 'Asia/Shanghai',
    population: 18676605,
    display_name: 'Guangzhou, Guangdong, China (CN)',
  },
  {
    geoname_id: 1796236,
    name: 'Shanghai',
    ascii_name: 'Shanghai',
    country_name: 'China',
    country_code: 'CN',
    admin1_name: 'Shanghai',
    latitude: 31.22222,
    longitude: 121.45806,
    timezone: 'Asia/Shanghai',
    population: 26875500,
    display_name: 'Shanghai, China (CN)',
  },
  {
    geoname_id: 1816670,
    name: 'Beijing',
    ascii_name: 'Beijing',
    country_name: 'China',
    country_code: 'CN',
    admin1_name: 'Beijing',
    latitude: 39.9075,
    longitude: 116.39723,
    timezone: 'Asia/Shanghai',
    population: 21893095,
    display_name: 'Beijing, China (CN)',
  },
  {
    geoname_id: 1795565,
    name: 'Shenzhen',
    ascii_name: 'Shenzhen',
    country_name: 'China',
    country_code: 'CN',
    admin1_name: 'Guangdong',
    latitude: 22.54554,
    longitude: 114.0683,
    timezone: 'Asia/Shanghai',
    population: 17494398,
    display_name: 'Shenzhen, Guangdong, China (CN)',
  },
  {
    geoname_id: 1800627,
    name: 'Ningbo',
    ascii_name: 'Ningbo',
    country_name: 'China',
    country_code: 'CN',
    admin1_name: 'Zhejiang',
    latitude: 29.87819,
    longitude: 121.54945,
    timezone: 'Asia/Shanghai',
    population: 9400000,
    display_name: 'Ningbo, Zhejiang, China (CN)',
  },
  {
    geoname_id: 1529102,
    name: 'Urumqi',
    ascii_name: 'Urumqi',
    country_name: 'China',
    country_code: 'CN',
    admin1_name: 'Xinjiang',
    latitude: 43.80096,
    longitude: 87.60046,
    timezone: 'Asia/Urumqi',
    population: 4054369,
    display_name: 'Urumqi, Xinjiang, China (CN)',
  },
  {
    geoname_id: 1811440,
    name: 'Foshan',
    ascii_name: 'Foshan',
    country_name: 'China',
    country_code: 'CN',
    admin1_name: 'Guangdong',
    latitude: 23.0292,
    longitude: 113.1056,
    timezone: 'Asia/Shanghai',
    population: 9498863,
    display_name: 'Foshan, Guangdong, China (CN)',
  },
  {
    geoname_id: 1808926,
    name: 'Hangzhou',
    ascii_name: 'Hangzhou',
    country_name: 'China',
    country_code: 'CN',
    admin1_name: 'Zhejiang',
    latitude: 30.29365,
    longitude: 120.16142,
    timezone: 'Asia/Shanghai',
    population: 11936010,
    display_name: 'Hangzhou, Zhejiang, China (CN)',
  },
  {
    geoname_id: 1529484,
    name: 'Horgos',
    ascii_name: 'Horgos',
    country_name: 'China',
    country_code: 'CN',
    admin1_name: 'Xinjiang',
    latitude: 44.21667,
    longitude: 80.41667,
    timezone: 'Asia/Urumqi',
    population: 90000,
    display_name: 'Horgos (Border Port), Xinjiang, China (CN)',
  },

  // Turkey Hubs
  {
    geoname_id: 745044,
    name: 'Istanbul',
    ascii_name: 'Istanbul',
    country_name: 'Turkey',
    country_code: 'TR',
    admin1_name: 'Istanbul',
    latitude: 41.01384,
    longitude: 28.94966,
    timezone: 'Europe/Istanbul',
    population: 14804116,
    display_name: 'Istanbul, Turkey (TR)',
  },
  {
    geoname_id: 323786,
    name: 'Ankara',
    ascii_name: 'Ankara',
    country_name: 'Turkey',
    country_code: 'TR',
    admin1_name: 'Ankara',
    latitude: 39.91987,
    longitude: 32.85427,
    timezone: 'Europe/Istanbul',
    population: 5747325,
    display_name: 'Ankara, Turkey (TR)',
  },
  {
    geoname_id: 311046,
    name: 'Izmir',
    ascii_name: 'Izmir',
    country_name: 'Turkey',
    country_code: 'TR',
    admin1_name: 'Izmir',
    latitude: 38.41273,
    longitude: 27.13838,
    timezone: 'Europe/Istanbul',
    population: 4367251,
    display_name: 'Izmir, Turkey (TR)',
  },
  {
    geoname_id: 750269,
    name: 'Bursa',
    ascii_name: 'Bursa',
    country_name: 'Turkey',
    country_code: 'TR',
    admin1_name: 'Bursa',
    latitude: 40.19559,
    longitude: 29.06013,
    timezone: 'Europe/Istanbul',
    population: 3101833,
    display_name: 'Bursa, Turkey (TR)',
  },
  {
    geoname_id: 304183,
    name: 'Mersin',
    ascii_name: 'Mersin',
    country_name: 'Turkey',
    country_code: 'TR',
    admin1_name: 'Mersin',
    latitude: 36.8,
    longitude: 34.63333,
    timezone: 'Europe/Istanbul',
    population: 1868757,
    display_name: 'Mersin (Port), Turkey (TR)',
  },

  // Russia & CIS Hubs
  {
    geoname_id: 524901,
    name: 'Moscow',
    ascii_name: 'Moscow',
    country_name: 'Russia',
    country_code: 'RU',
    admin1_name: 'Moscow',
    latitude: 55.75222,
    longitude: 37.61556,
    timezone: 'Europe/Moscow',
    population: 13010112,
    display_name: 'Moscow, Russia (RU)',
  },
  {
    geoname_id: 498817,
    name: 'Saint Petersburg',
    ascii_name: 'Saint Petersburg',
    country_name: 'Russia',
    country_code: 'RU',
    admin1_name: 'St.-Petersburg',
    latitude: 59.93863,
    longitude: 30.31413,
    timezone: 'Europe/Moscow',
    population: 5601911,
    display_name: 'Saint Petersburg, Russia (RU)',
  },
  {
    geoname_id: 1496747,
    name: 'Novosibirsk',
    ascii_name: 'Novosibirsk',
    country_name: 'Russia',
    country_code: 'RU',
    admin1_name: 'Novosibirsk',
    latitude: 55.0415,
    longitude: 82.9346,
    timezone: 'Asia/Novosibirsk',
    population: 1633595,
    display_name: 'Novosibirsk, Russia (RU)',
  },
  {
    geoname_id: 1486209,
    name: 'Yekaterinburg',
    ascii_name: 'Yekaterinburg',
    country_name: 'Russia',
    country_code: 'RU',
    admin1_name: 'Sverdlovsk',
    latitude: 56.8519,
    longitude: 60.6122,
    timezone: 'Asia/Yekaterinburg',
    population: 1495066,
    display_name: 'Yekaterinburg, Sverdlovsk, Russia (RU)',
  },

  // Kazakhstan Hubs
  {
    geoname_id: 1526384,
    name: 'Almaty',
    ascii_name: 'Almaty',
    country_name: 'Kazakhstan',
    country_code: 'KZ',
    admin1_name: 'Almaty Qalasy',
    latitude: 43.25667,
    longitude: 76.92861,
    timezone: 'Asia/Almaty',
    population: 2000900,
    display_name: 'Almaty, Kazakhstan (KZ)',
  },
  {
    geoname_id: 1526273,
    name: 'Astana',
    ascii_name: 'Astana',
    country_name: 'Kazakhstan',
    country_code: 'KZ',
    admin1_name: 'Astana Qalasy',
    latitude: 51.1801,
    longitude: 71.44598,
    timezone: 'Asia/Almaty',
    population: 1354507,
    display_name: 'Astana, Kazakhstan (KZ)',
  },
  {
    geoname_id: 1518980,
    name: 'Shymkent',
    ascii_name: 'Shymkent',
    country_name: 'Kazakhstan',
    country_code: 'KZ',
    admin1_name: 'Ongtustik Qazaqstan',
    latitude: 42.3,
    longitude: 69.6,
    timezone: 'Asia/Almaty',
    population: 1112739,
    display_name: 'Shymkent, Kazakhstan (KZ)',
  },

  // Central Asia & Middle East
  {
    geoname_id: 1528675,
    name: 'Bishkek',
    ascii_name: 'Bishkek',
    country_name: 'Kyrgyzstan',
    country_code: 'KG',
    admin1_name: 'Bishkek Shaary',
    latitude: 42.87,
    longitude: 74.59,
    timezone: 'Asia/Bishkek',
    population: 1074075,
    display_name: 'Bishkek, Kyrgyzstan (KG)',
  },
  {
    geoname_id: 1221874,
    name: 'Dushanbe',
    ascii_name: 'Dushanbe',
    country_name: 'Tajikistan',
    country_code: 'TJ',
    admin1_name: 'Dushanbe',
    latitude: 38.53575,
    longitude: 68.77905,
    timezone: 'Asia/Dushanbe',
    population: 863400,
    display_name: 'Dushanbe, Tajikistan (TJ)',
  },
  {
    geoname_id: 292223,
    name: 'Dubai',
    ascii_name: 'Dubai',
    country_name: 'United Arab Emirates',
    country_code: 'AE',
    admin1_name: 'Dubai',
    latitude: 25.07725,
    longitude: 55.30927,
    timezone: 'Asia/Dubai',
    population: 3331420,
    display_name: 'Dubai, UAE (AE)',
  },
  {
    geoname_id: 587084,
    name: 'Baku',
    ascii_name: 'Baku',
    country_name: 'Azerbaijan',
    country_code: 'AZ',
    admin1_name: 'Baki',
    latitude: 40.37767,
    longitude: 49.89201,
    timezone: 'Asia/Baku',
    population: 2303100,
    display_name: 'Baku, Azerbaijan (AZ)',
  },
  {
    geoname_id: 2925533,
    name: 'Frankfurt am Main',
    ascii_name: 'Frankfurt am Main',
    country_name: 'Germany',
    country_code: 'DE',
    admin1_name: 'Hesse',
    latitude: 50.11552,
    longitude: 8.68417,
    timezone: 'Europe/Berlin',
    population: 791000,
    display_name: 'Frankfurt am Main, Germany (DE)',
  },
  {
    geoname_id: 756135,
    name: 'Warsaw',
    ascii_name: 'Warsaw',
    country_name: 'Poland',
    country_code: 'PL',
    admin1_name: 'Mazovia',
    latitude: 52.22977,
    longitude: 21.01178,
    timezone: 'Europe/Warsaw',
    population: 1860281,
    display_name: 'Warsaw, Poland (PL)',
  },
];

// Helper to get ISO emoji flag
export function getCountryFlag(countryCode?: string | null): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const code = countryCode.toUpperCase();
  const codePoints = [...code].map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Helper to construct Google Maps coordinates search URL
export function buildGoogleMapsPointUrl(
  lat?: number | null,
  lng?: number | null,
  name?: string
): string {
  if (lat && lng) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  if (name) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
  }
  return 'https://www.google.com/maps';
}

// Helper to construct Google Maps Directions route URL
export function buildGoogleMapsRouteUrl(
  originLat?: number | null,
  originLng?: number | null,
  destLat?: number | null,
  destLng?: number | null,
  originName?: string,
  destName?: string
): string {
  const originPart =
    originLat && originLng
      ? `${originLat},${originLng}`
      : originName
        ? encodeURIComponent(originName)
        : '';
  const destPart =
    destLat && destLng ? `${destLat},${destLng}` : destName ? encodeURIComponent(destName) : '';

  if (originPart && destPart) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originPart}&destination=${destPart}`;
  }
  if (originPart) {
    return `https://www.google.com/maps/search/?api=1&query=${originPart}`;
  }
  if (destPart) {
    return `https://www.google.com/maps/search/?api=1&query=${destPart}`;
  }
  return 'https://www.google.com/maps';
}

// ---------------------------------------------------------------------------
// Offline Demo / Mock Handlers
// ---------------------------------------------------------------------------

registerDemoHandler((path: string, options: RequestInit, body: any) => {
  const method = (options.method || 'GET').toUpperCase();

  // 1. GET /locations/cities/popular
  if (path === '/locations/cities/popular' && method === 'GET') {
    return { handled: true, result: POPULAR_LOGISTICS_HUBS };
  }

  // 2. GET /locations/cities (Search with prefix and country filter)
  if (path.startsWith('/locations/cities') && method === 'GET') {
    const url = new URL(path, 'http://localhost');
    const pathname = url.pathname;

    // Direct ID lookup: /locations/cities/:geonameId
    const idMatch = pathname.match(/^\/locations\/cities\/(\d+)$/);
    if (idMatch) {
      const gId = parseInt(idMatch[1], 10);
      const found = POPULAR_LOGISTICS_HUBS.find((c) => c.geoname_id === gId);
      if (found) return { handled: true, result: found };

      return {
        handled: true,
        result: {
          geoname_id: gId,
          name: `City #${gId}`,
          ascii_name: `City ${gId}`,
          country_name: 'Unknown Country',
          country_code: 'UN',
          admin1_name: null,
          latitude: null,
          longitude: null,
          timezone: null,
          population: null,
          display_name: `City #${gId}`,
        } as CityOption,
      };
    }

    if (pathname === '/locations/cities') {
      const q = (url.searchParams.get('q') || '').trim().toLowerCase();
      const country = (url.searchParams.get('country') || '').trim().toUpperCase();
      const limit = parseInt(url.searchParams.get('limit') || '15', 10);

      let results = [...POPULAR_LOGISTICS_HUBS];

      if (country) {
        results = results.filter((c) => (c.country_code || '').toUpperCase() === country);
      }

      if (q) {
        results = results.filter((c) => {
          const name = c.name.toLowerCase();
          const ascii = (c.ascii_name || '').toLowerCase();
          const admin = (c.admin1_name || '').toLowerCase();
          const countryName = (c.country_name || '').toLowerCase();
          const countryCode = (c.country_code || '').toLowerCase();
          return (
            name.includes(q) ||
            ascii.includes(q) ||
            admin.includes(q) ||
            countryName.includes(q) ||
            countryCode.includes(q)
          );
        });

        // Relevance sort: exact start match first, then by population
        results.sort((a, b) => {
          const aStarts = a.name.toLowerCase().startsWith(q) ? 1 : 0;
          const bStarts = b.name.toLowerCase().startsWith(q) ? 1 : 0;
          if (aStarts !== bStarts) return bStarts - aStarts;
          return (b.population || 0) - (a.population || 0);
        });
      } else {
        // Sort popular hubs by population desc
        results.sort((a, b) => (b.population || 0) - (a.population || 0));
      }

      return { handled: true, result: results.slice(0, limit) };
    }
  }

  // 3. POST /cargo-registrations/check-duplicate (Pre-flight duplicate check)
  if (path === '/cargo-registrations/check-duplicate' && method === 'POST') {
    const { client_id, cargo, container_truck_id, purchase_price, origin_city, destination_city } =
      body || {};

    let existingDb: any[] = [];
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('yaqeen_cargo_registrations_db');
        if (raw) existingDb = JSON.parse(raw);
      }
    } catch {
      // ignore
    }

    if (existingDb && existingDb.length > 0) {
      const match = existingDb.find((item: any) => {
        const sameClient = client_id && item.client_id === client_id;
        const sameTruck =
          container_truck_id &&
          String(item.container_truck_id).trim().toLowerCase() ===
            String(container_truck_id).trim().toLowerCase();
        const sameCargo =
          cargo && String(item.cargo).trim().toLowerCase() === String(cargo).trim().toLowerCase();
        const samePrice =
          purchase_price !== undefined && Number(item.purchase_price) === Number(purchase_price);
        const sameRoute =
          (!origin_city || (item.origin_city || '').toLowerCase() === origin_city.toLowerCase()) &&
          (!destination_city ||
            (item.destination_city || '').toLowerCase() === destination_city.toLowerCase());

        return sameClient && (sameTruck || (sameCargo && samePrice && sameRoute));
      });

      if (match) {
        const routeLabel =
          match.origin_city && match.destination_city
            ? ` (${match.origin_city} -> ${match.destination_city})`
            : '';
        return {
          handled: true,
          result: {
            is_duplicate: true,
            existing_cargo_id: match.id,
            message: `An identical cargo entry "${match.cargo || cargo}"${routeLabel} with truck ${match.container_truck_id || container_truck_id} was already registered.`,
          } as DuplicateCheckResult,
        };
      }
    }

    return {
      handled: true,
      result: {
        is_duplicate: false,
        existing_cargo_id: null,
        message: null,
      } as DuplicateCheckResult,
    };
  }

  return null;
});

// ---------------------------------------------------------------------------
// Locations API Client
// ---------------------------------------------------------------------------

export const locationsApi = {
  /**
   * Search cities by query prefix and optional ISO country code
   */
  searchCities: async (
    params?: CitySearchParams | string,
    countryCode?: string,
    limitCount?: number
  ): Promise<CityOption[]> => {
    let q = '';
    let country: string | undefined = countryCode;
    let limit = limitCount || 15;

    if (typeof params === 'string') {
      q = params;
    } else if (params) {
      q = params.q || '';
      country = params.country || countryCode;
      limit = params.limit || limitCount || 15;
    }

    const searchParams = new URLSearchParams();
    if (q) searchParams.set('q', q);
    if (country) searchParams.set('country', country);
    if (limit) searchParams.set('limit', String(limit));

    const queryStr = searchParams.toString();
    return request<CityOption[]>(`/locations/cities${queryStr ? `?${queryStr}` : ''}`, {
      method: 'GET',
    });
  },

  /**
   * Get pre-seeded curated popular logistics hubs
   */
  getPopularHubs: async (): Promise<CityOption[]> => {
    return request<CityOption[]>('/locations/cities/popular', {
      method: 'GET',
    });
  },

  /**
   * Look up exact city metadata by global GeoNames ID
   */
  getCityByGeonameId: async (geonameId: number): Promise<CityOption> => {
    return request<CityOption>(`/locations/cities/${geonameId}`, {
      method: 'GET',
    });
  },

  /**
   * Pre-flight real-time check to prevent duplicate shipments
   */
  checkDuplicateCargo: async (dto: DuplicateCheckDto): Promise<DuplicateCheckResult> => {
    return request<DuplicateCheckResult>('/cargo-registrations/check-duplicate', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Utility helper to build 1-click Google Maps links
   */
  buildPointUrl: buildGoogleMapsPointUrl,
  buildRouteUrl: buildGoogleMapsRouteUrl,
  getCountryFlag,
};
