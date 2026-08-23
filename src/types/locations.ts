export interface CityOption {
  geoname_id: number | null;
  name: string;
  ascii_name: string | null;
  country_name: string | null;
  country_code: string | null;
  admin1_name: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  population: number | null;
  display_name: string;
}

export interface RouteInfo {
  origin: string | null;
  destination: string | null;
  origin_display: string | null;
  destination_display: string | null;
  google_maps_dir_url: string | null;
}

export interface LocationDetail {
  city: string | null;
  country: string | null;
  country_code: string | null;
  geoname_id: number | null;
  latitude: number | null;
  longitude: number | null;
  display_name: string | null;
  google_maps_url: string | null;
}

export interface CitySearchParams {
  q?: string;
  country?: string;
  limit?: number;
}

export interface DuplicateCheckDto {
  client_id?: string;
  cargo?: string;
  container_truck_id?: string;
  cargo_type?: string;
  origin_city?: string;
  destination_city?: string;
  confirmed_date?: string;
  purchase_price?: number;
}

export interface DuplicateCheckResult {
  is_duplicate: boolean;
  existing_cargo_id: string | null;
  message: string | null;
}
