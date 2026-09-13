import { request, makeApiError, registerDemoHandler, tokenStore } from './httpClient';
import type {
  Agent,
  AgentDropdownItem,
  AgentListParams,
  AgentPaginatedResponse,
  CreateAgentDto,
  UpdateAgentDto,
  DeleteAgentResponse,
} from '../types/agents';

// ── In-Memory Dropdown Cache & In-Flight Request Deduplication ──
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const dropdownCache = new Map<string, CacheEntry<AgentDropdownItem[]>>();
const inFlightRequests = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 30_000; // 30 seconds TTL for dropdown lists

export function clearAgentCache(): void {
  dropdownCache.clear();
}

// ── Realistic Demo Database for Offline & Testing Mode ──
export const demoAgentsDb: Agent[] = [
  {
    id: '0058c7d9-fd30-4326-8e74-6e7e572753b7',
    first_name: 'Tie',
    last_name: 'Tie',
    display_name: 'Tie Tie',
    phone_number: '+998901234567',
    email: 'tietie@logistics.com',
    company_name: 'TieTie Express Logistics',
    company_names: ['TieTie Express', 'Tie Tie Cargo', 'TieTie Auto Freight'],
    notes: 'Reliable road carrier for Yiwu-Tashkent routes via Dostyk/Khorgos',
    is_active: true,
    created_at: '2026-09-01T08:52:22.545Z',
    updated_at: '2026-09-05T08:52:22.545Z',
    total_cargos_count: 15,
    active_cargos_count: 3,
    total_payable_amount: 4250.0,
  },
  {
    id: 'd801ea6a-00d7-4095-8775-d3fdae18c931',
    first_name: null,
    last_name: null,
    display_name: 'Silk Road Cargo LLC',
    phone_number: '+998971112233',
    email: 'info@silkroad-cargo.uz',
    company_name: 'Silk Road Cargo LLC',
    company_names: ['Silk Road Logistics', 'Cargo Silk Road', 'SilkRoad Express'],
    notes: 'Main railway container operator from Lianyungang & Qingdao ports',
    is_active: true,
    created_at: '2026-08-15T10:20:00.000Z',
    updated_at: '2026-09-02T14:10:00.000Z',
    total_cargos_count: 28,
    active_cargos_count: 7,
    total_payable_amount: 11800.0,
  },
  {
    id: 'e4f21051-bd6b-4e63-872e-0fa39ff018be',
    first_name: 'Farrukh',
    last_name: 'Karimov',
    display_name: 'Farrukh Karimov',
    phone_number: '+998909876543',
    email: 'farrukh.k@translogistics.uz',
    company_name: 'TransLogistics Group LLC',
    company_names: ['TransLogistics Tashkent', 'TLG China Branch', 'TransLogistics Int'],
    notes: 'Primary agent for 40HC/45HC container consignments via Dostyk',
    is_active: true,
    created_at: '2026-08-20T09:15:00.000Z',
    updated_at: '2026-09-05T09:20:10.000Z',
    total_cargos_count: 9,
    active_cargos_count: 2,
    total_payable_amount: 3100.0,
  },
  {
    id: 'c1b489a2-47ef-4933-912b-3126f58209bb',
    first_name: 'Alisher',
    last_name: 'Sattarov',
    display_name: 'Alisher Sattarov',
    phone_number: '+998935554433',
    email: 'alisher@dostyk-line.com',
    company_name: 'Dostyk Container Line',
    company_names: ['Dostyk Line', 'Dostyk Express Freight'],
    notes: 'Direct station handling agent at Dostyk and Altynkol transshipment terminals',
    is_active: true,
    created_at: '2026-07-10T11:00:00.000Z',
    updated_at: '2026-08-30T16:45:00.000Z',
    total_cargos_count: 22,
    active_cargos_count: 5,
    total_payable_amount: 6750.0,
  },
  {
    id: 'fa820199-3172-4bbf-9311-5820129a32c4',
    first_name: 'Cheng',
    last_name: 'Wei',
    display_name: 'Cheng Wei',
    phone_number: '+8613912345678',
    email: 'cheng.wei@sino-uz.cn',
    company_name: 'Sino-Uz Multimodal Logistics Ltd',
    company_names: ['Sino-Uz Cargo', 'SinoUz Freight Guangzhou'],
    notes: 'Air freight express specialist (Guangzhou / Shenzhen -> TAS)',
    is_active: true,
    created_at: '2026-08-01T14:30:00.000Z',
    updated_at: '2026-09-04T11:15:00.000Z',
    total_cargos_count: 12,
    active_cargos_count: 1,
    total_payable_amount: 2400.0,
  },
  {
    id: 'b9473210-91bc-4cae-9022-82194a2b1009',
    first_name: 'Bakhtiyor',
    last_name: 'Nazarov',
    display_name: 'Bakhtiyor Nazarov',
    phone_number: '+998901112244',
    email: 'bnazarov@eurasiatrucks.uz',
    company_name: 'Eurasia Trucking Express',
    company_names: ['Eurasia Trucking', 'Eurasia Trans'],
    notes: 'FTL curtain-sider and refrigerated trailer transport from Turkey and Iran',
    is_active: false,
    created_at: '2026-06-12T07:20:00.000Z',
    updated_at: '2026-08-10T09:00:00.000Z',
    total_cargos_count: 6,
    active_cargos_count: 0,
    total_payable_amount: 0.0,
  },
];

function computeDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  companyName?: string | null
): string {
  const parts = [firstName, lastName].filter(Boolean).map((s) => s!.trim());
  if (parts.length > 0) return parts.join(' ');
  return (companyName || 'Unnamed Agent').trim();
}

// ── Register Offline / Mock Handler ──
registerDemoHandler((path: string, options: RequestInit, body: any) => {
  const method = options.method?.toUpperCase() || 'GET';

  // 1. GET /agents/dropdown
  if (method === 'GET' && (path === '/agents/dropdown' || path.startsWith('/agents/dropdown?'))) {
    const url = new URL(`http://localhost${path}`);
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();

    let list = demoAgentsDb.filter((a) => a.is_active);
    if (q) {
      list = list.filter((a) => {
        const text = [
          a.first_name,
          a.last_name,
          a.display_name,
          a.company_name,
          a.phone_number,
          ...(a.company_names || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return text.includes(q);
      });
    }

    const items: AgentDropdownItem[] = list.map((a) => ({
      id: a.id,
      display_name: a.display_name || computeDisplayName(a.first_name, a.last_name, a.company_name),
      company_name: a.company_name,
      phone_number: a.phone_number,
    }));

    return { handled: true, result: items };
  }

  // 2. GET /agents/:id
  const getSingleMatch = path.match(/^\/agents\/([a-zA-Z0-9_-]+)$/);
  if (method === 'GET' && getSingleMatch && getSingleMatch[1] !== 'dropdown') {
    const agentId = getSingleMatch[1];
    const found = demoAgentsDb.find((a) => a.id === agentId);
    if (!found) {
      throw makeApiError(path, 404, 'agent_not_found', 'Target agent record does not exist');
    }
    return { handled: true, result: found };
  }

  // 3. GET /agents (Paginated list)
  if (method === 'GET' && (path === '/agents' || path.startsWith('/agents?'))) {
    const url = new URL(`http://localhost${path}`);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    const isActiveParam = url.searchParams.get('is_active');
    const sortBy = url.searchParams.get('sort_by') || 'created_at';
    const sortOrder = (url.searchParams.get('sort_order') || 'desc').toLowerCase();

    let filtered = [...demoAgentsDb];

    if (isActiveParam !== null && isActiveParam !== undefined && isActiveParam !== '') {
      const activeBool = isActiveParam === 'true';
      filtered = filtered.filter((a) => a.is_active === activeBool);
    }

    if (q) {
      filtered = filtered.filter((a) => {
        const text = [
          a.first_name,
          a.last_name,
          a.display_name,
          a.company_name,
          a.phone_number,
          a.email,
          ...(a.company_names || []),
          a.notes,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return text.includes(q);
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let valA: any = (a as any)[sortBy];
      let valB: any = (b as any)[sortBy];

      if (sortBy === 'created_at') {
        valA = new Date(a.created_at).getTime();
        valB = new Date(b.created_at).getTime();
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      } else if (typeof valA === 'number') {
        valA = valA || 0;
        valB = valB || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const pagedData = filtered.slice(startIndex, startIndex + limit);

    const response: AgentPaginatedResponse = {
      data: pagedData,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
    return { handled: true, result: response };
  }

  // 4. POST /agents (Create Agent)
  if (method === 'POST' && path === '/agents') {
    const user = tokenStore.getUser();
    if (user?.role === 'EMPLOYEE' && false) {
      // Permission allowed
    }

    const { first_name, last_name, phone_number, email, company_name, company_names, notes } =
      body || {};

    if (!first_name && !last_name && !company_name) {
      throw makeApiError(
        path,
        400,
        'invalid_input',
        'At least one of first_name, last_name, or company_name must be provided'
      );
    }

    const newAgent: Agent = {
      id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      first_name: first_name?.trim() || null,
      last_name: last_name?.trim() || null,
      display_name: computeDisplayName(first_name, last_name, company_name),
      phone_number: phone_number?.trim() || null,
      email: email ? email.trim().toLowerCase() : null,
      company_name: company_name?.trim() || null,
      company_names: Array.isArray(company_names)
        ? company_names.map((s: string) => s.trim()).filter(Boolean)
        : [],
      notes: notes?.trim() || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_cargos_count: 0,
      active_cargos_count: 0,
      total_payable_amount: 0,
    };

    demoAgentsDb.unshift(newAgent);
    clearAgentCache();
    return { handled: true, result: newAgent };
  }

  // 5. PATCH /agents/:id (Update Agent)
  const patchMatch = path.match(/^\/agents\/([a-zA-Z0-9_-]+)$/);
  if (method === 'PATCH' && patchMatch) {
    const agentId = patchMatch[1];
    const index = demoAgentsDb.findIndex((a) => a.id === agentId);
    if (index === -1) {
      throw makeApiError(path, 404, 'agent_not_found', 'Agent not found');
    }

    const current = demoAgentsDb[index];
    const updated: Agent = {
      ...current,
      first_name:
        body.first_name !== undefined ? body.first_name?.trim() || null : current.first_name,
      last_name: body.last_name !== undefined ? body.last_name?.trim() || null : current.last_name,
      phone_number:
        body.phone_number !== undefined ? body.phone_number?.trim() || null : current.phone_number,
      email:
        body.email !== undefined
          ? body.email
            ? body.email.trim().toLowerCase()
            : null
          : current.email,
      company_name:
        body.company_name !== undefined ? body.company_name?.trim() || null : current.company_name,
      company_names:
        body.company_names !== undefined
          ? Array.isArray(body.company_names)
            ? body.company_names
            : []
          : current.company_names,
      notes: body.notes !== undefined ? body.notes?.trim() || null : current.notes,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : current.is_active,
      updated_at: new Date().toISOString(),
    };

    updated.display_name = computeDisplayName(
      updated.first_name,
      updated.last_name,
      updated.company_name
    );
    demoAgentsDb[index] = updated;
    clearAgentCache();
    return { handled: true, result: updated };
  }

  // 6. DELETE /agents/:id (Soft-deactivate if has cargos, hard-delete otherwise)
  const deleteMatch = path.match(/^\/agents\/([a-zA-Z0-9_-]+)$/);
  if (method === 'DELETE' && deleteMatch) {
    const agentId = deleteMatch[1];
    const index = demoAgentsDb.findIndex((a) => a.id === agentId);
    if (index === -1) {
      throw makeApiError(path, 404, 'agent_not_found', 'Agent not found');
    }

    const agent = demoAgentsDb[index];
    // Protection rule: if agent has linked cargo registrations, deactivate instead of deleting
    if ((agent.total_cargos_count ?? 0) > 0) {
      agent.is_active = false;
      agent.updated_at = new Date().toISOString();
      clearAgentCache();
      const resp: DeleteAgentResponse = {
        success: true,
        message: 'Agent has associated cargos; status set to inactive instead of deletion.',
        deactivated: true,
      };
      return { handled: true, result: resp };
    }

    // Permanently remove from database
    demoAgentsDb.splice(index, 1);
    clearAgentCache();
    const resp: DeleteAgentResponse = {
      success: true,
      message: 'Agent successfully deleted.',
    };
    return { handled: true, result: resp };
  }

  return null;
});

// ── Production Service API Implementation ──
export const agentsApi = {
  /**
   * Retrieves a paginated list of shipping agents with fuzzy search, active filter, and sorting.
   */
  list: async (params?: AgentListParams, signal?: AbortSignal): Promise<AgentPaginatedResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.q) {
      searchParams.set('q', params.q.trim());
      searchParams.set('search', params.q.trim());
    }
    if (params?.is_active !== undefined) searchParams.set('is_active', String(params.is_active));
    if (params?.sort_by) searchParams.set('sort_by', params.sort_by);
    if (params?.sort_order) searchParams.set('sort_order', params.sort_order);

    const qs = searchParams.toString();
    return request<AgentPaginatedResponse>(`/agents${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      signal,
    });
  },

  /**
   * Lightweight dropdown endpoint optimized for select menus.
   * Leverages 30s in-memory caching and in-flight deduplication.
   */
  getDropdown: async (
    q?: string,
    forceFresh = false,
    signal?: AbortSignal
  ): Promise<AgentDropdownItem[]> => {
    const cacheKey = (q || '').trim().toLowerCase();
    const now = Date.now();

    if (!forceFresh && dropdownCache.has(cacheKey)) {
      const cached = dropdownCache.get(cacheKey)!;
      if (now - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
      }
      dropdownCache.delete(cacheKey);
    }

    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey)!;
    }

    const searchParams = new URLSearchParams();
    if (q && q.trim()) {
      searchParams.set('q', q.trim());
      searchParams.set('search', q.trim());
    }
    const qs = searchParams.toString();

    const fetchPromise = request<any[]>(`/agents/dropdown${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      signal,
    })
      .then((rawItems) => {
        const items = Array.isArray(rawItems) ? rawItems : (rawItems as any)?.data || [];
        const data: AgentDropdownItem[] = items.map((item: any) => {
          const nameParts = [item.first_name, item.last_name]
            .filter((p: any) => p && typeof p === 'string' && p.trim().length > 0)
            .map((p: any) => p.trim());
          const fullName = nameParts.join(' ');
          const displayName =
            item.display_name?.trim() ||
            item.name?.trim() ||
            (fullName && item.company_name ? `${fullName} (${item.company_name.trim()})` : null) ||
            fullName ||
            item.company_name?.trim() ||
            'Unnamed Agent';

          return {
            id: item.id,
            display_name: displayName,
            name: item.name || displayName,
            first_name: item.first_name || null,
            last_name: item.last_name || null,
            company_name: item.company_name || null,
            phone_number: item.phone_number || null,
          };
        });
        dropdownCache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      })
      .finally(() => {
        inFlightRequests.delete(cacheKey);
      });

    inFlightRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  },

  /**
   * Retrieves full details for a single agent including live cargo & financial totals.
   */
  getById: (id: string, signal?: AbortSignal): Promise<Agent> => {
    return request<Agent>(`/agents/${encodeURIComponent(id)}`, {
      method: 'GET',
      signal,
    });
  },

  /**
   * Creates a new shipping agent record.
   */
  create: async (dto: CreateAgentDto): Promise<Agent> => {
    clearAgentCache();
    return request<Agent>('/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
  },

  /**
   * Updates an existing shipping agent profile.
   * Automatically cascades denormalized agent_name to linked cargos on the backend.
   */
  update: async (id: string, dto: UpdateAgentDto): Promise<Agent> => {
    clearAgentCache();
    return request<Agent>(`/agents/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
  },

  /**
   * Soft-deletes or hard-deletes an agent.
   * Returns `{ deactivated: true }` if agent has associated cargos.
   */
  delete: async (id: string): Promise<DeleteAgentResponse> => {
    clearAgentCache();
    return request<DeleteAgentResponse>(`/agents/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  /**
   * Invalidate local memory caches.
   */
  clearCache: clearAgentCache,
};
