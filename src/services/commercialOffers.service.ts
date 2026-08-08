import { request, requestNoContent, makeApiError, registerDemoHandler } from './httpClient';
import type {
  CommercialOffer,
  CommercialOfferStatus,
  CreateCommercialOfferDto,
  UpdateCommercialOfferDto,
  UpdateOfferStatusDto,
  QueryCommercialOfferDto,
  CommercialOfferStats,
  CommercialOfferPaginatedResponse,
} from '../types/commercialOffers';
import { generateCommercialOfferPdfHtml } from '../utils/pdfGenerator';

// Dedicated Mock Database for Commercial Offers
export const demoCommercialOffersDb: CommercialOffer[] = [
  {
    id: 'e43b8112-9c12-4c22-b5e1-8848123abcde',
    offer_number: 'YQ-2026-0001',
    client_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    client_name: 'Rustam Rasulov',
    client_company: 'Orient Cargo LLC',
    origin: 'Tashkent',
    destination: 'Shanghai',
    cargo_description: 'Electronics & Microchips',
    cargo_weight: 1500.5,
    cargo_volume: 12.3,
    price_usd: 5000.0,
    price_local: 65000000.0,
    inclusions: ['Freight transport', 'Insurance', 'GPS Tracking'],
    exclusions: ['Customs duties', 'Storage beyond 3 days'],
    terms: '50% advance upon contract signing, 50% upon arrival at Shanghai station',
    status: 'draft',
    created_by: 'aa111111-1111-1111-1111-111111111111',
    creator_name: "Jasur Yo'ldoshev",
    created_at: '2026-07-28T10:00:00.000Z',
    updated_at: '2026-07-28T10:00:00.000Z',
  },
  {
    id: 'e43b8112-9c12-4c22-b5e1-8848123abcdf',
    offer_number: 'YQ-2026-0002',
    client_id: 'c-client-1',
    client_name: 'Jasur Yoldoshev',
    client_company: 'Global Cargo Logistics LLC',
    origin: 'Ningbo',
    destination: 'Tashkent',
    cargo_description: 'Textile manufacturing equipment',
    cargo_weight: 4200.0,
    cargo_volume: 38.5,
    price_usd: 14200.0,
    price_local: 184600000.0,
    inclusions: ['Door to door freight', 'Loading & unloading', 'Export documentation'],
    exclusions: ['Import tax NALOG'],
    terms: '30% advance, 70% letter of credit',
    status: 'sent',
    created_by: 'aa111111-1111-1111-1111-111111111111',
    creator_name: "Jasur Yo'ldoshev",
    created_at: '2026-07-27T14:30:00.000Z',
    updated_at: '2026-07-27T15:10:00.000Z',
  },
  {
    id: 'e43b8112-9c12-4c22-b5e1-8848123abcdg',
    offer_number: 'YQ-2026-0003',
    client_id: 'c-client-3',
    client_name: 'Bobur Mamedov',
    client_company: 'Silk Road Express Inc',
    origin: 'Guangzhou',
    destination: 'Samarkand',
    cargo_description: 'Auto spare parts & accessories',
    cargo_weight: 8500.0,
    cargo_volume: 65.0,
    price_usd: 28500.0,
    price_local: 370500000.0,
    inclusions: ['Full container load (FCL)', 'Insurance 100%', 'Customs clearance assistance'],
    exclusions: ['Unforeseen port demurrage fees'],
    terms: '100% prepayment before shipping date',
    status: 'accepted',
    created_by: '2b78a1c9-34e5-4a1d-91b2-c8d9e0f1a2b3',
    creator_name: 'Rustam Rasulov',
    created_at: '2026-07-25T09:15:00.000Z',
    updated_at: '2026-07-26T11:20:00.000Z',
  },
  {
    id: 'e43b8112-9c12-4c22-b5e1-8848123abcdh',
    offer_number: 'YQ-2026-0004',
    client_id: 'c-client-4',
    client_name: 'Nodira Karimova',
    client_company: 'Tashkent Textile Mills',
    origin: 'Urumqi',
    destination: 'Fergana',
    cargo_description: 'Raw cotton yarn & fabric rolls',
    cargo_weight: 12000.0,
    cargo_volume: 82.0,
    price_usd: 31000.0,
    price_local: 403000000.0,
    inclusions: ['Multimodal rail transport', 'Transit tracking'],
    exclusions: ['Discharging fees at destination depot'],
    terms: '50% advance, 50% upon delivery to Fergana depot',
    status: 'rejected',
    created_by: '2b78a1c9-34e5-4a1d-91b2-c8d9e0f1a2b3',
    creator_name: 'Rustam Rasulov',
    created_at: '2026-07-22T08:00:00.000Z',
    updated_at: '2026-07-24T16:45:00.000Z',
  },
  {
    id: 'e43b8112-9c12-4c22-b5e1-8848123abcdi',
    offer_number: 'YQ-2026-0005',
    client_id: 'c-client-5',
    client_name: 'Alisher Navoiy',
    client_company: 'Orient Distribution Corp',
    origin: 'Tashkent',
    destination: 'Almaty',
    cargo_description: 'Food products & beverages',
    cargo_weight: 3500.0,
    cargo_volume: 25.0,
    price_usd: 8800.0,
    price_local: 114400000.0,
    inclusions: ['Refrigerated container (Reefer)', 'Temperature logging'],
    exclusions: ['Phytosanitary inspection tax'],
    terms: 'Payment within 10 days of delivery',
    status: 'accepted',
    created_by: 'aa111111-1111-1111-1111-111111111111',
    creator_name: "Jasur Yo'ldoshev",
    created_at: '2026-07-20T11:00:00.000Z',
    updated_at: '2026-07-21T14:10:00.000Z',
  },
];

// Helper to validate state machine transitions according to API doc Section 3
export function validateOfferStatusTransition(
  currentStatus: CommercialOfferStatus,
  targetStatus: CommercialOfferStatus
): boolean {
  if (currentStatus === targetStatus) return true;
  if (currentStatus === 'draft') {
    return ['sent', 'accepted', 'rejected'].includes(targetStatus);
  }
  if (currentStatus === 'sent') {
    return ['accepted', 'rejected', 'draft'].includes(targetStatus);
  }
  if (currentStatus === 'accepted') {
    return targetStatus === 'draft';
  }
  if (currentStatus === 'rejected') {
    return targetStatus === 'draft';
  }
  return false;
}

// Generate next auto-incrementing offer number YQ-2026-NNNN
function generateOfferNumber(): string {
  const currentYear = new Date().getFullYear();
  const prefix = `YQ-${currentYear}-`;
  const existingNumbers = demoCommercialOffersDb
    .map((o) => o.offer_number)
    .filter((num) => num.startsWith(prefix))
    .map((num) => parseInt(num.replace(prefix, ''), 10))
    .filter((n) => !isNaN(n));

  const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

// Demo Handler Registration
registerDemoHandler((path: string, options: RequestInit, body: any) => {
  // 1. GET /commercial-offers/stats/summary
  if (
    path === '/commercial-offers/stats/summary' &&
    (options.method === 'GET' || !options.method)
  ) {
    const total_offers = demoCommercialOffersDb.length;
    const by_status = {
      draft: demoCommercialOffersDb.filter((o) => o.status === 'draft').length,
      sent: demoCommercialOffersDb.filter((o) => o.status === 'sent').length,
      accepted: demoCommercialOffersDb.filter((o) => o.status === 'accepted').length,
      rejected: demoCommercialOffersDb.filter((o) => o.status === 'rejected').length,
    };
    const acceptedOffers = demoCommercialOffersDb.filter((o) => o.status === 'accepted');
    const total_usd = acceptedOffers.reduce((sum, o) => sum + (Number(o.price_usd) || 0), 0);
    const total_local = acceptedOffers.reduce((sum, o) => sum + (Number(o.price_local) || 0), 0);

    const stats: CommercialOfferStats = {
      total_offers,
      by_status,
      accepted_revenue: {
        total_usd,
        total_local,
      },
    };
    return { handled: true, result: stats };
  }

  // 2. GET /commercial-offers (Paginated List & Filters)
  if (
    (path === '/commercial-offers' || path.startsWith('/commercial-offers?')) &&
    (options.method === 'GET' || !options.method)
  ) {
    const urlObj = new URL(path, 'http://localhost');
    const search = urlObj.searchParams.get('search')?.toLowerCase() || '';
    const statusParam = urlObj.searchParams.get('status');
    const clientIdParam = urlObj.searchParams.get('client_id');
    const createdByParam = urlObj.searchParams.get('created_by');
    const dateFromParam = urlObj.searchParams.get('date_from');
    const dateToParam = urlObj.searchParams.get('date_to');
    const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
    const limit = parseInt(urlObj.searchParams.get('limit') || '20', 10);

    let filtered = [...demoCommercialOffersDb];

    if (search) {
      filtered = filtered.filter(
        (o) =>
          o.offer_number.toLowerCase().includes(search) ||
          o.client_name.toLowerCase().includes(search) ||
          o.client_company.toLowerCase().includes(search) ||
          o.origin.toLowerCase().includes(search) ||
          o.destination.toLowerCase().includes(search)
      );
    }

    if (statusParam) {
      filtered = filtered.filter((o) => o.status === statusParam);
    }

    if (clientIdParam) {
      filtered = filtered.filter((o) => o.client_id === clientIdParam);
    }

    if (createdByParam) {
      filtered = filtered.filter((o) => o.created_by === createdByParam);
    }

    if (dateFromParam) {
      const fromTime = new Date(dateFromParam).getTime();
      if (!isNaN(fromTime)) {
        filtered = filtered.filter((o) => new Date(o.created_at).getTime() >= fromTime);
      }
    }

    if (dateToParam) {
      const toTime = new Date(dateToParam).getTime();
      if (!isNaN(toTime)) {
        filtered = filtered.filter((o) => new Date(o.created_at).getTime() <= toTime);
      }
    }

    // Sort descending by created_at
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = filtered.slice(startIndex, startIndex + limit);

    const result: CommercialOfferPaginatedResponse = {
      data: paginatedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
    return { handled: true, result };
  }

  // 3. GET /commercial-offers/:id/pdf
  if (
    path.startsWith('/commercial-offers/') &&
    path.endsWith('/pdf') &&
    (options.method === 'GET' || !options.method)
  ) {
    const parts = path.split('/');
    const offerId = parts[2];
    const offer = demoCommercialOffersDb.find((o) => o.id === offerId);
    if (!offer) {
      throw makeApiError(path, 404, 'offer_not_found', 'Commercial offer not found.');
    }
    const html = generateCommercialOfferPdfHtml(offer);
    const blob = new Blob([html], { type: 'application/pdf' });
    return { handled: true, result: blob };
  }

  // 4. GET /commercial-offers/:id
  if (
    path.startsWith('/commercial-offers/') &&
    (options.method === 'GET' || !options.method) &&
    !path.includes('/stats/')
  ) {
    const offerId = path.split('/')[2];
    const offer = demoCommercialOffersDb.find((o) => o.id === offerId);
    if (!offer) {
      throw makeApiError(path, 404, 'offer_not_found', 'Commercial offer not found.');
    }
    return { handled: true, result: offer };
  }

  // 5. POST /commercial-offers (Create Offer)
  if (path === '/commercial-offers' && options.method === 'POST') {
    if (
      !body.client_name ||
      !body.client_company ||
      !body.origin ||
      !body.destination ||
      body.price_usd === undefined ||
      body.price_local === undefined
    ) {
      throw makeApiError(
        path,
        400,
        'validation_failed',
        'client_name, client_company, origin, destination, price_usd, and price_local are required.'
      );
    }

    const newOffer: CommercialOffer = {
      id: 'e43b8112-9c12-4c22-b5e1-' + Math.random().toString(36).substring(2, 12),
      offer_number: generateOfferNumber(),
      client_id: body.client_id || null,
      client_name: body.client_name,
      client_company: body.client_company,
      origin: body.origin,
      destination: body.destination,
      cargo_description: body.cargo_description || null,
      cargo_weight: body.cargo_weight !== undefined ? Number(body.cargo_weight) : null,
      cargo_volume: body.cargo_volume !== undefined ? Number(body.cargo_volume) : null,
      price_usd: Number(body.price_usd),
      price_local: Number(body.price_local),
      inclusions: body.inclusions || [],
      exclusions: body.exclusions || [],
      terms: body.terms || null,
      status: 'draft',
      created_by: 'aa111111-1111-1111-1111-111111111111',
      creator_name: 'Current User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    demoCommercialOffersDb.unshift(newOffer);
    return { handled: true, result: newOffer };
  }

  // 6. POST /commercial-offers/:id/duplicate
  if (
    path.startsWith('/commercial-offers/') &&
    path.endsWith('/duplicate') &&
    options.method === 'POST'
  ) {
    const parts = path.split('/');
    const offerId = parts[2];
    const source = demoCommercialOffersDb.find((o) => o.id === offerId);
    if (!source) {
      throw makeApiError(path, 404, 'offer_not_found', 'Commercial offer not found.');
    }

    const duplicateOffer: CommercialOffer = {
      ...source,
      id: 'e43b8112-9c12-4c22-b5e1-' + Math.random().toString(36).substring(2, 12),
      offer_number: generateOfferNumber(),
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    demoCommercialOffersDb.unshift(duplicateOffer);
    return { handled: true, result: duplicateOffer };
  }

  // 7. PATCH /commercial-offers/:id/status
  if (
    path.startsWith('/commercial-offers/') &&
    path.endsWith('/status') &&
    options.method === 'PATCH'
  ) {
    const parts = path.split('/');
    const offerId = parts[2];
    const index = demoCommercialOffersDb.findIndex((o) => o.id === offerId);
    if (index === -1) {
      throw makeApiError(path, 404, 'offer_not_found', 'Commercial offer not found.');
    }

    const current = demoCommercialOffersDb[index];
    const targetStatus: CommercialOfferStatus = body.status;

    if (!validateOfferStatusTransition(current.status, targetStatus)) {
      throw makeApiError(
        path,
        400,
        'invalid_status_transition',
        `Cannot transition from "${current.status}" to "${targetStatus}". Allowed transitions: draft.`
      );
    }

    const updated: CommercialOffer = {
      ...current,
      status: targetStatus,
      updated_at: new Date().toISOString(),
    };

    demoCommercialOffersDb[index] = updated;
    return { handled: true, result: updated };
  }

  // 8. PUT /commercial-offers/:id (Update Offer)
  if (path.startsWith('/commercial-offers/') && options.method === 'PUT') {
    const offerId = path.split('/')[2];
    const index = demoCommercialOffersDb.findIndex((o) => o.id === offerId);
    if (index === -1) {
      throw makeApiError(path, 404, 'offer_not_found', 'Commercial offer not found.');
    }

    const current = demoCommercialOffersDb[index];
    const updated: CommercialOffer = {
      ...current,
      client_id: body.client_id !== undefined ? body.client_id : current.client_id,
      client_name: body.client_name !== undefined ? body.client_name : current.client_name,
      client_company:
        body.client_company !== undefined ? body.client_company : current.client_company,
      origin: body.origin !== undefined ? body.origin : current.origin,
      destination: body.destination !== undefined ? body.destination : current.destination,
      cargo_description:
        body.cargo_description !== undefined ? body.cargo_description : current.cargo_description,
      cargo_weight:
        body.cargo_weight !== undefined ? Number(body.cargo_weight) : current.cargo_weight,
      cargo_volume:
        body.cargo_volume !== undefined ? Number(body.cargo_volume) : current.cargo_volume,
      price_usd: body.price_usd !== undefined ? Number(body.price_usd) : current.price_usd,
      price_local: body.price_local !== undefined ? Number(body.price_local) : current.price_local,
      inclusions: body.inclusions !== undefined ? body.inclusions : current.inclusions,
      exclusions: body.exclusions !== undefined ? body.exclusions : current.exclusions,
      terms: body.terms !== undefined ? body.terms : current.terms,
      updated_at: new Date().toISOString(),
    };

    demoCommercialOffersDb[index] = updated;
    return { handled: true, result: updated };
  }

  // 9. DELETE /commercial-offers/:id
  if (path.startsWith('/commercial-offers/') && options.method === 'DELETE') {
    const offerId = path.split('/')[2];
    const index = demoCommercialOffersDb.findIndex((o) => o.id === offerId);
    if (index !== -1) {
      demoCommercialOffersDb.splice(index, 1);
    }
    return { handled: true, result: {} };
  }

  return null;
});

// Commercial Offers API Service Methods
export const commercialOffersApi = {
  getStatsSummary: () =>
    request<CommercialOfferStats>('/commercial-offers/stats/summary', { method: 'GET' }),

  list: (params?: QueryCommercialOfferDto) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.client_id) searchParams.set('client_id', params.client_id);
    if (params?.created_by) searchParams.set('created_by', params.created_by);
    if (params?.date_from) searchParams.set('date_from', params.date_from);
    if (params?.date_to) searchParams.set('date_to', params.date_to);
    const query = searchParams.toString();
    return request<CommercialOfferPaginatedResponse>(
      `/commercial-offers${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  },

  get: (id: string) => request<CommercialOffer>(`/commercial-offers/${id}`, { method: 'GET' }),

  create: (dto: CreateCommercialOfferDto) =>
    request<CommercialOffer>('/commercial-offers', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  update: (id: string, dto: UpdateCommercialOfferDto) =>
    request<CommercialOffer>(`/commercial-offers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),

  updateStatus: (id: string, status: CommercialOfferStatus) =>
    request<CommercialOffer>(`/commercial-offers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status } as UpdateOfferStatusDto),
    }),

  duplicate: (id: string) =>
    request<CommercialOffer>(`/commercial-offers/${id}/duplicate`, {
      method: 'POST',
    }),

  getPdfBlob: async (id: string): Promise<Blob> => {
    return request<Blob>(`/commercial-offers/${id}/pdf`, { method: 'GET' });
  },

  delete: (id: string) => requestNoContent(`/commercial-offers/${id}`, { method: 'DELETE' }),
};
