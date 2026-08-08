export type CommercialOfferStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export interface CommercialOffer {
  id: string;
  offer_number: string;
  client_id: string | null;
  client_name: string;
  client_company: string;
  origin: string;
  destination: string;
  cargo_description: string | null;
  cargo_weight: number | null;
  cargo_volume: number | null;
  price_usd: number;
  price_local: number;
  inclusions: string[] | null;
  exclusions: string[] | null;
  terms: string | null;
  status: CommercialOfferStatus;
  created_by: string;
  creator_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCommercialOfferDto {
  client_id?: string;
  client_name: string;
  client_company: string;
  origin: string;
  destination: string;
  cargo_description?: string;
  cargo_weight?: number;
  cargo_volume?: number;
  price_usd: number;
  price_local: number;
  inclusions?: string[];
  exclusions?: string[];
  terms?: string;
}

export interface UpdateCommercialOfferDto extends Partial<CreateCommercialOfferDto> {}

export interface UpdateOfferStatusDto {
  status: CommercialOfferStatus;
}

export interface QueryCommercialOfferDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: CommercialOfferStatus | string;
  client_id?: string;
  created_by?: string;
  date_from?: string;
  date_to?: string;
}

export interface CommercialOfferStats {
  total_offers: number;
  by_status: {
    draft: number;
    sent: number;
    accepted: number;
    rejected: number;
  };
  accepted_revenue: {
    total_usd: number;
    total_local: number;
  };
}

export interface CommercialOfferPaginatedResponse {
  data: CommercialOffer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
