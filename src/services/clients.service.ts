import {
  request,
  requestNoContent,
  normalizePhone,
  makeApiError,
  registerDemoHandler
} from './httpClient';
import type { Attachment } from './httpClient';
import { demoAttachmentsDb } from './attachments.service';

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  company_name: string;
  address: string | null;
  assigned_employee_id: string | null;
  color?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  effective_color: string;
  assigned_employee?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    color: string;
  } | null;
  attachments?: Attachment[];
}

export interface CreateClientDto {
  first_name: string;
  last_name: string;
  phone: string;
  company_name: string;
  address?: string;
  assigned_employee_id?: string;
  is_active?: boolean;
}

export interface UpdateClientDto extends Partial<CreateClientDto> {}

export interface ClientListParams {
  page?: number;
  limit?: number;
  search?: string;
  assigned_employee_id?: string;
  color?: string;
  is_active?: boolean;
}

export interface ClientPaginatedResponse {
  data: Client[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ClientColorStats {
  total_clients: number;
  by_color: Array<{ color: string; count: number }>;
  by_employee: Array<{
    employee_id: string | null;
    employee_name: string;
    default_color: string;
    count: number;
  }>;
}

// Dedicated Client Mock Database
export const demoClientsDb: Client[] = [
  {
    id: 'c-client-1',
    first_name: 'Jasur',
    last_name: 'Yoldoshev',
    phone: '+998901234567',
    company_name: 'Global Cargo Logistics LLC',
    address: 'Tashkent city, Yunusabad district 4-12',
    assigned_employee_id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
    color: null,
    is_active: true,
    created_at: '2026-07-20T12:00:00.000Z',
    updated_at: '2026-07-20T12:00:00.000Z',
    effective_color: '#FF0000',
    assigned_employee: {
      id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
      first_name: 'Jasur',
      last_name: "Yo'ldoshev",
      phone: '+998901234567',
      color: '#FF0000'
    }
  },
  {
    id: 'c-client-2',
    first_name: 'Rustam',
    last_name: 'Rasulov',
    phone: '+998909876543',
    company_name: 'Central Asia Trading Co',
    address: 'Samarkand city, Registan str 8',
    assigned_employee_id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
    color: null,
    is_active: true,
    created_at: '2026-07-19T10:30:00.000Z',
    updated_at: '2026-07-19T10:30:00.000Z',
    effective_color: '#FF0000',
    assigned_employee: {
      id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
      first_name: 'Jasur',
      last_name: "Yo'ldoshev",
      phone: '+998901234567',
      color: '#FF0000'
    }
  },
  {
    id: 'c-client-3',
    first_name: 'Bobur',
    last_name: 'Mamedov',
    phone: '+998935551234',
    company_name: 'Silk Road Express Inc',
    address: 'Tashkent city, Chilanzar district 19',
    assigned_employee_id: '2b78a1c9-34e5-4a1d-91b2-c8d9e0f1a2b3',
    color: null,
    is_active: true,
    created_at: '2026-07-18T09:15:00.000Z',
    updated_at: '2026-07-18T09:15:00.000Z',
    effective_color: '#3357FF',
    assigned_employee: {
      id: '2b78a1c9-34e5-4a1d-91b2-c8d9e0f1a2b3',
      first_name: 'Rustam',
      last_name: 'Rasulov',
      phone: '+998909876543',
      color: '#3357FF'
    }
  },
  {
    id: 'c-client-4',
    first_name: 'Nodira',
    last_name: 'Karimova',
    phone: '+998974443322',
    company_name: 'Tashkent Textile Mills',
    address: 'Fergana city, Industrial zone 3',
    assigned_employee_id: '2b78a1c9-34e5-4a1d-91b2-c8d9e0f1a2b3',
    color: null,
    is_active: true,
    created_at: '2026-07-17T14:20:00.000Z',
    updated_at: '2026-07-17T14:20:00.000Z',
    effective_color: '#3357FF',
    assigned_employee: {
      id: '2b78a1c9-34e5-4a1d-91b2-c8d9e0f1a2b3',
      first_name: 'Rustam',
      last_name: 'Rasulov',
      phone: '+998909876543',
      color: '#3357FF'
    }
  },
  {
    id: 'c-client-5',
    first_name: 'Alisher',
    last_name: 'Navoiy',
    phone: '+998903332211',
    company_name: 'Orient Distribution Corp',
    address: 'Bukhara city, Naqshbandi str 45',
    assigned_employee_id: null,
    color: null,
    is_active: true,
    created_at: '2026-07-16T11:00:00.000Z',
    updated_at: '2026-07-16T11:00:00.000Z',
    effective_color: '#808080',
    assigned_employee: null
  },
  {
    id: 'c-client-6',
    first_name: 'Dilshod',
    last_name: 'Tursunov',
    phone: '+998918889900',
    company_name: 'Fast Freight Logistics',
    address: 'Namangan city, Central park 12',
    assigned_employee_id: '1d63b635-8933-45d1-a233-d6902e3b27f1',
    color: null,
    is_active: false,
    created_at: '2026-07-15T08:45:00.000Z',
    updated_at: '2026-07-15T08:45:00.000Z',
    effective_color: '#6F42C1',
    assigned_employee: {
      id: '1d63b635-8933-45d1-a233-d6902e3b27f1',
      first_name: 'Alisher',
      last_name: 'Rashidov',
      phone: '+998901111111',
      color: '#6F42C1'
    }
  },
  {
    id: 'c-client-7',
    first_name: 'Feruza',
    last_name: 'Alimova',
    phone: '+998947776655',
    company_name: 'Samarkand Trading House',
    address: 'Samarkand city, University blvd 2',
    assigned_employee_id: null,
    color: null,
    is_active: true,
    created_at: '2026-07-14T16:10:00.000Z',
    updated_at: '2026-07-14T16:10:00.000Z',
    effective_color: '#808080',
    assigned_employee: null
  }
];

// Dedicated Client Mock Database Handlers
registerDemoHandler((path: string, options: RequestInit, body: any) => {
  // Color stats
  if (path === '/clients/stats/color-distribution' && (options.method === 'GET' || !options.method)) {
    const activeClients = demoClientsDb.filter(c => c.is_active);
    const colorMap: Record<string, number> = {};
    const empMap: Record<string, { employee_id: string | null; employee_name: string; default_color: string; count: number }> = {};

    activeClients.forEach(c => {
      const col = (c.effective_color || '#808080').toUpperCase();
      colorMap[col] = (colorMap[col] || 0) + 1;

      if (c.assigned_employee) {
        const empId = c.assigned_employee.id;
        if (!empMap[empId]) {
          empMap[empId] = {
            employee_id: empId,
            employee_name: `${c.assigned_employee.first_name} ${c.assigned_employee.last_name}`,
            default_color: c.assigned_employee.color || '#808080',
            count: 0
          };
        }
        empMap[empId].count += 1;
      } else {
        const unassignedKey = 'unassigned';
        if (!empMap[unassignedKey]) {
          empMap[unassignedKey] = {
            employee_id: null,
            employee_name: 'Unassigned',
            default_color: '#808080',
            count: 0
          };
        }
        empMap[unassignedKey].count += 1;
      }
    });

    const stats: ClientColorStats = {
      total_clients: activeClients.length,
      by_color: Object.entries(colorMap).map(([color, count]) => ({ color, count })),
      by_employee: Object.values(empMap)
    };
    return { handled: true, result: stats };
  }

  // List
  if ((path === '/clients' || path.startsWith('/clients?')) && (options.method === 'GET' || !options.method)) {
    const urlObj = new URL(path, 'http://localhost');
    const search = urlObj.searchParams.get('search')?.toLowerCase() || '';
    const empId = urlObj.searchParams.get('assigned_employee_id');
    const colorFilter = urlObj.searchParams.get('color')?.toUpperCase();
    const isActiveParam = urlObj.searchParams.get('is_active');
    const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
    const limit = parseInt(urlObj.searchParams.get('limit') || '20', 10);

    let filtered = [...demoClientsDb];

    if (search) {
      filtered = filtered.filter(c =>
        c.first_name.toLowerCase().includes(search) ||
        c.last_name.toLowerCase().includes(search) ||
        c.company_name.toLowerCase().includes(search) ||
        c.phone.includes(search)
      );
    }

    if (empId) {
      filtered = filtered.filter(c => c.assigned_employee_id === empId);
    }

    if (colorFilter) {
      filtered = filtered.filter(c => (c.effective_color || '#808080').toUpperCase() === colorFilter);
    }

    if (isActiveParam !== null && isActiveParam !== undefined) {
      const activeBool = isActiveParam === 'true';
      filtered = filtered.filter(c => c.is_active === activeBool);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = filtered.slice(startIndex, startIndex + limit).map(c => ({
      ...c,
      attachments: demoAttachmentsDb.filter(att => att.entity_type === 'client' && att.entity_id === c.id)
    }));

    const result: ClientPaginatedResponse = {
      data: paginatedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    };

    return { handled: true, result };
  }

  // Create
  if (path === '/clients' && options.method === 'POST') {
    const normPhone = normalizePhone(body.phone || '');
    const exists = demoClientsDb.some(c => normalizePhone(c.phone) === normPhone);
    if (exists) {
      throw makeApiError(path, 400, 'client_phone_exists', 'A client with this phone number already exists.');
    }

    const newId = 'c-client-' + (demoClientsDb.length + 1);
    const empId = body.assigned_employee_id || null;

    let assignedEmp = null;
    if (empId) {
      if (empId === 'b1a2c3d4-e5f6-7890-abcd-ef1234567890') {
        assignedEmp = { id: empId, first_name: 'Jasur', last_name: "Yo'ldoshev", phone: '+998901234567', color: '#FF0000' };
      } else if (empId === '2b78a1c9-34e5-4a1d-91b2-c8d9e0f1a2b3') {
        assignedEmp = { id: empId, first_name: 'Rustam', last_name: 'Rasulov', phone: '+998909876543', color: '#3357FF' };
      } else if (empId === '1d63b635-8933-45d1-a233-d6902e3b27f1') {
        assignedEmp = { id: empId, first_name: 'Alisher', last_name: 'Rashidov', phone: '+998901111111', color: '#6F42C1' };
      }
    }

    const effectiveColor = assignedEmp ? (assignedEmp.color || '#808080') : '#808080';

    const newClient: Client = {
      id: newId,
      first_name: body.first_name || '',
      last_name: body.last_name || '',
      phone: body.phone || '',
      company_name: body.company_name || '',
      address: body.address || null,
      assigned_employee_id: empId,
      color: null,
      is_active: body.is_active !== undefined ? body.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      effective_color: effectiveColor,
      assigned_employee: assignedEmp,
      attachments: []
    };

    demoClientsDb.unshift(newClient);
    return { handled: true, result: newClient };
  }

  // Get single client
  if (path.startsWith('/clients/') && (options.method === 'GET' || !options.method) && !path.includes('/stats/')) {
    const clientId = path.split('/')[2];
    const client = demoClientsDb.find(c => c.id === clientId);
    if (!client) {
      throw makeApiError(path, 404, 'client_not_found', 'Client not found');
    }
    const fullClient = {
      ...client,
      attachments: demoAttachmentsDb.filter(att => att.entity_type === 'client' && att.entity_id === client.id)
    };
    return { handled: true, result: fullClient };
  }

  // Update client
  if (path.startsWith('/clients/') && options.method === 'PUT') {
    const clientId = path.split('/')[2];
    const index = demoClientsDb.findIndex(c => c.id === clientId);
    if (index === -1) {
      throw makeApiError(path, 404, 'client_not_found', 'Client not found');
    }

    const current = demoClientsDb[index];

    if (body.phone && normalizePhone(body.phone) !== normalizePhone(current.phone)) {
      const normPhone = normalizePhone(body.phone);
      if (demoClientsDb.some(c => c.id !== clientId && normalizePhone(c.phone) === normPhone)) {
        throw makeApiError(path, 400, 'client_phone_exists', 'A client with this phone number already exists.');
      }
    }

    const empId = body.assigned_employee_id !== undefined ? body.assigned_employee_id : current.assigned_employee_id;
    let assignedEmp = current.assigned_employee;

    if (empId !== current.assigned_employee_id) {
      if (empId === 'b1a2c3d4-e5f6-7890-abcd-ef1234567890') {
        assignedEmp = { id: empId, first_name: 'Jasur', last_name: "Yo'ldoshev", phone: '+998901234567', color: '#FF0000' };
      } else if (empId === '2b78a1c9-34e5-4a1d-91b2-c8d9e0f1a2b3') {
        assignedEmp = { id: empId, first_name: 'Rustam', last_name: 'Rasulov', phone: '+998909876543', color: '#3357FF' };
      } else if (empId === '1d63b635-8933-45d1-a233-d6902e3b27f1') {
        assignedEmp = { id: empId, first_name: 'Alisher', last_name: 'Rashidov', phone: '+998901111111', color: '#6F42C1' };
      } else {
        assignedEmp = null;
      }
    }

    const effectiveColor = assignedEmp ? (assignedEmp.color || '#808080') : '#808080';

    const updated: Client = {
      ...current,
      first_name: body.first_name !== undefined ? body.first_name : current.first_name,
      last_name: body.last_name !== undefined ? body.last_name : current.last_name,
      phone: body.phone !== undefined ? body.phone : current.phone,
      company_name: body.company_name !== undefined ? body.company_name : current.company_name,
      address: body.address !== undefined ? body.address : current.address,
      assigned_employee_id: empId,
      color: null,
      is_active: body.is_active !== undefined ? body.is_active : current.is_active,
      updated_at: new Date().toISOString(),
      effective_color: effectiveColor,
      assigned_employee: assignedEmp
    };

    demoClientsDb[index] = updated;
    return {
      handled: true,
      result: {
        ...updated,
        attachments: demoAttachmentsDb.filter(att => att.entity_type === 'client' && att.entity_id === updated.id)
      }
    };
  }

  // Delete client
  if (path.startsWith('/clients/') && options.method === 'DELETE') {
    const clientId = path.split('/')[2];
    const index = demoClientsDb.findIndex(c => c.id === clientId);
    if (index !== -1) {
      demoClientsDb.splice(index, 1);
    }
    for (let i = demoAttachmentsDb.length - 1; i >= 0; i--) {
      if (demoAttachmentsDb[i].entity_type === 'client' && demoAttachmentsDb[i].entity_id === clientId) {
        demoAttachmentsDb.splice(i, 1);
      }
    }
    return { handled: true, result: {} };
  }

  return null;
});

export const clientsApi = {
  list: (params?: ClientListParams) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.assigned_employee_id) searchParams.set('assigned_employee_id', params.assigned_employee_id);
    if (params?.color) searchParams.set('color', params.color);
    if (params?.is_active !== undefined) searchParams.set('is_active', String(params.is_active));
    const query = searchParams.toString();
    return request<ClientPaginatedResponse>(`/clients${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  getColorDistribution: () =>
    request<ClientColorStats>('/clients/stats/color-distribution', { method: 'GET' }),

  get: (id: string) =>
    request<Client>(`/clients/${id}`, { method: 'GET' }),

  create: (dto: CreateClientDto) =>
    request<Client>('/clients', {
      method: 'POST',
      body: JSON.stringify(dto)
    }),

  update: (id: string, dto: UpdateClientDto) =>
    request<Client>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto)
    }),

  delete: (id: string) =>
    requestNoContent(`/clients/${id}`, { method: 'DELETE' })
};
