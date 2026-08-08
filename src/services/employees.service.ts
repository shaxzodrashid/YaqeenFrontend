import { request, requestNoContent, registerDemoHandler, makeApiError } from './httpClient';
import type { PaginatedResponse } from './httpClient';
import type { SupportedCurrency } from '../types/currency';

// Department interfaces
export interface Department {
  id: string;
  name: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentDto {
  name: string;
  display_name: string;
}

// Employee interfaces
export interface EmployeeTushum {
  amount: number;
  currency: string;
  formatted: string;
}

export type KPIStatusCode = 'COMPLETED' | 'IN_PROGRESS';

export interface EmployeeRejaFakt {
  plan_target: number;
  fact_amount: number;
  percentage: number;
  currency: string;
  status: 'Bajarildi' | 'Jarayonda' | string;
  status_code: KPIStatusCode;
  formatted_plan: string;
  formatted_fact: string;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  secondary_phone: string | null;
  address: string | null;
  department_id: string;
  fixed_salary: string;
  currency?: SupportedCurrency;
  color: string;
  picture_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  department_name?: string;
  department_display_name?: string;
  user_id?: string;
  username?: string;
  user_role?: string;
  user_status?: string;
  role_id?: string;
  permissions?: Record<
    string,
    { create: boolean; read: boolean; update: boolean; delete: boolean }
  >;

  // New Calculated Metrics
  tushum?: EmployeeTushum;
  reja_fakt?: EmployeeRejaFakt;
  mijozlar_count?: number;
  user?: {
    id: string;
    phone_number: string;
    username: string;
    role: string;
    role_id?: string;
    status: string;
    is_active: boolean;
    role_details?: {
      id: string;
      name: string;
      display_name: string;
      description?: string | null;
      is_system?: boolean;
      permissions?: Record<
        string,
        { create: boolean; read: boolean; update: boolean; delete: boolean }
      >;
    };
    permissions?: Record<
      string,
      { create: boolean; read: boolean; update: boolean; delete: boolean }
    >;
  };
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    secondary_phone?: string | null;
    address?: string | null;
    color: string;
    picture_url?: string | null;
    fixed_salary: number | string;
    currency?: SupportedCurrency;
    is_active: boolean;
    department?: {
      id: string;
      name: string;
      display_name: string;
    };
  };
}

export interface CreateEmployeeDto {
  first_name: string;
  last_name: string;
  phone: string;
  secondary_phone?: string;
  address?: string;
  department_id: string;
  fixed_salary?: string;
  currency?: SupportedCurrency;
  color?: string;
  role_id: string;
  role?: string;
}

export interface UpdateEmployeeDto extends Partial<CreateEmployeeDto> {
  is_active?: boolean;
}

export interface EmployeeListParams {
  page?: number;
  limit?: number;
  search?: string;
  department_id?: string;
}

// Demo Store for Offline Employee State
export const demoEmployeesDb: Map<string, Employee> = new Map([
  [
    'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
    {
      id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
      first_name: 'Jasur',
      last_name: 'Yoldoshev',
      phone: '+998901234567',
      secondary_phone: null,
      address: 'Tashkent, Uzbekistan',
      department_id: '07d223ca-4167-47f7-a929-61d47a3628a7',
      fixed_salary: '1500.00',
      currency: 'USD',
      color: '#3B82F6',
      picture_url: null,
      is_active: true,
      created_at: '2026-07-19T13:22:58.587Z',
      updated_at: '2026-07-19T13:22:58.587Z',
      department_name: 'sales',
      department_display_name: 'Sales HQ',
      user_role: 'ROP',
      user_status: 'Open',
      tushum: {
        amount: 4400000,
        currency: 'RUB',
        formatted: '4,400,000 ₽',
      },
      reja_fakt: {
        plan_target: 3800000,
        fact_amount: 4400000,
        percentage: 115.79,
        currency: 'RUB',
        status: 'Bajarildi',
        status_code: 'COMPLETED',
        formatted_plan: '3,800,000 ₽',
        formatted_fact: '4,400,000 ₽',
      },
      mijozlar_count: 2,
    },
  ],
  [
    '1d63b635-8933-45d1-a233-d6902e3b27f1',
    {
      id: '1d63b635-8933-45d1-a233-d6902e3b27f1',
      first_name: 'Shaxzod',
      last_name: 'Rashidov',
      phone: '+998330094112',
      secondary_phone: null,
      address: 'Tashkent, Uzbekistan',
      department_id: '07d223ca-4167-47f7-a929-61d47a3628a7',
      fixed_salary: '1200.00',
      currency: 'UZS',
      color: '#C8A96A',
      picture_url: null,
      is_active: true,
      created_at: '2026-07-19T13:22:58.587Z',
      updated_at: '2026-07-19T13:22:58.587Z',
      department_name: 'sales',
      department_display_name: 'Sales HQ',
      user_id: 'd36cd0fe-bf3b-448d-964c-5b214eef86e4',
      username: '998330094112',
      user_role: 'ROP',
      user_status: 'Open',
      tushum: {
        amount: 3410000,
        currency: 'RUB',
        formatted: '3,410,000 ₽',
      },
      reja_fakt: {
        plan_target: 3200000,
        fact_amount: 3410000,
        percentage: 106.56,
        currency: 'RUB',
        status: 'Bajarildi',
        status_code: 'COMPLETED',
        formatted_plan: '3,200,000 ₽',
        formatted_fact: '3,410,000 ₽',
      },
      mijozlar_count: 1,
    },
  ],
  [
    '2b78a1c9-34e5-4a1d-91b2-c8d9e0f1a2b3',
    {
      id: '2b78a1c9-34e5-4a1d-91b2-c8d9e0f1a2b3',
      first_name: 'Rustam',
      last_name: 'Rasulov',
      phone: '+998935551234',
      secondary_phone: null,
      address: 'Samarkand, Uzbekistan',
      department_id: '07d223ca-4167-47f7-a929-61d47a3628a7',
      fixed_salary: '1000.00',
      currency: 'UZS',
      color: '#10B981',
      picture_url: null,
      is_active: true,
      created_at: '2026-07-19T14:00:00.000Z',
      updated_at: '2026-07-19T14:00:00.000Z',
      department_name: 'sales',
      department_display_name: 'Sales HQ',
      user_role: 'EMPLOYEE',
      user_status: 'Open',
      tushum: {
        amount: 2695000,
        currency: 'RUB',
        formatted: '2,695,000 ₽',
      },
      reja_fakt: {
        plan_target: 3000000,
        fact_amount: 2695000,
        percentage: 89.83,
        currency: 'RUB',
        status: 'Jarayonda',
        status_code: 'IN_PROGRESS',
        formatted_plan: '3,000,000 ₽',
        formatted_fact: '2,695,000 ₽',
      },
      mijozlar_count: 1,
    },
  ],
  [
    '3c89b2d0-45f6-5b2e-a2c3-d9e0f1a2b3c4',
    {
      id: '3c89b2d0-45f6-5b2e-a2c3-d9e0f1a2b3c4',
      first_name: 'Sardor',
      last_name: 'Alimov',
      phone: '+998971112233',
      secondary_phone: null,
      address: 'Bukhara, Uzbekistan',
      department_id: 'dep-logistics',
      fixed_salary: '1100.00',
      currency: 'UZS',
      color: '#8B5CF6',
      picture_url: null,
      is_active: true,
      created_at: '2026-07-19T15:00:00.000Z',
      updated_at: '2026-07-19T15:00:00.000Z',
      department_name: 'logistics',
      department_display_name: 'Logistics',
      user_role: 'EMPLOYEE',
      user_status: 'Open',
      tushum: {
        amount: 946000,
        currency: 'RUB',
        formatted: '946,000 ₽',
      },
      reja_fakt: {
        plan_target: 900000,
        fact_amount: 946000,
        percentage: 105.11,
        currency: 'RUB',
        status: 'Bajarildi',
        status_code: 'COMPLETED',
        formatted_plan: '900,000 ₽',
        formatted_fact: '946,000 ₽',
      },
      mijozlar_count: 1,
    },
  ],
  [
    '4d90c3e1-56a7-6c3f-b3d4-e0f1a2b3c4d5',
    {
      id: '4d90c3e1-56a7-6c3f-b3d4-e0f1a2b3c4d5',
      first_name: 'Nodira',
      last_name: 'Azimova',
      phone: '+998909876543',
      secondary_phone: null,
      address: 'Tashkent, Uzbekistan',
      department_id: 'dep-seo',
      fixed_salary: '1300.00',
      currency: 'UZS',
      color: '#EC4899',
      picture_url: null,
      is_active: true,
      created_at: '2026-07-19T16:00:00.000Z',
      updated_at: '2026-07-19T16:00:00.000Z',
      department_name: 'seo',
      department_display_name: 'SEO & Marketing',
      user_role: 'EMPLOYEE',
      user_status: 'Open',
      tushum: {
        amount: 0,
        currency: 'RUB',
        formatted: '0 ₽',
      },
      reja_fakt: {
        plan_target: 1000000,
        fact_amount: 0,
        percentage: 0,
        currency: 'RUB',
        status: 'Jarayonda',
        status_code: 'IN_PROGRESS',
        formatted_plan: '1,000,000 ₽',
        formatted_fact: '0 ₽',
      },
      mijozlar_count: 0,
    },
  ],
]);

export const demoDepartmentsDb: Map<string, Department> = new Map([
  [
    '07d223ca-4167-47f7-a929-61d47a3628a7',
    {
      id: '07d223ca-4167-47f7-a929-61d47a3628a7',
      name: 'sales',
      display_name: 'Sales HQ',
      created_at: '2026-07-19T13:22:58.587Z',
      updated_at: '2026-07-19T13:22:58.587Z',
    },
  ],
  [
    'dep-logistics',
    {
      id: 'dep-logistics',
      name: 'logistics',
      display_name: 'Logistics',
      created_at: '2026-07-19T15:00:00.000Z',
      updated_at: '2026-07-19T15:00:00.000Z',
    },
  ],
  [
    'dep-seo',
    {
      id: 'dep-seo',
      name: 'seo',
      display_name: 'SEO & Marketing',
      created_at: '2026-07-19T16:00:00.000Z',
      updated_at: '2026-07-19T16:00:00.000Z',
    },
  ],
  [
    'dep-groupage',
    {
      id: 'dep-groupage',
      name: 'groupage',
      display_name: "Yig'ma yuklar",
      created_at: '2026-07-19T14:30:00.000Z',
      updated_at: '2026-07-19T14:30:00.000Z',
    },
  ],
  [
    'dep-customs',
    {
      id: 'dep-customs',
      name: 'customs',
      display_name: 'Bojxona',
      created_at: '2026-07-19T17:00:00.000Z',
      updated_at: '2026-07-19T17:00:00.000Z',
    },
  ],
]);

// Register Demo Handlers for Employees, Departments & Profile Pictures
registerDemoHandler((path: string, options: RequestInit, body: any) => {
  const method = (options.method || 'GET').toUpperCase();

  // GET /departments
  if (path === '/departments' && method === 'GET') {
    return {
      handled: true,
      result: Array.from(demoDepartmentsDb.values()),
    };
  }

  // GET /departments/:id
  if (/^\/departments\/[^/]+$/.test(path) && method === 'GET') {
    const deptId = path.split('/departments/')[1];
    const dept = demoDepartmentsDb.get(deptId);
    if (dept) {
      return { handled: true, result: dept };
    }
  }

  // POST /departments
  if (path === '/departments' && method === 'POST') {
    const newDept: Department = {
      id: `dep-${Math.random().toString(36).substring(2, 9)}`,
      name: body.name,
      display_name: body.display_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    demoDepartmentsDb.set(newDept.id, newDept);
    return { handled: true, result: newDept };
  }

  // PUT /departments/:id
  if (/^\/departments\/[^/]+$/.test(path) && method === 'PUT') {
    const deptId = path.split('/departments/')[1];
    const existing = demoDepartmentsDb.get(deptId);
    if (existing) {
      const updated: Department = {
        ...existing,
        name: body.name !== undefined ? body.name : existing.name,
        display_name: body.display_name !== undefined ? body.display_name : existing.display_name,
        updated_at: new Date().toISOString(),
      };
      demoDepartmentsDb.set(deptId, updated);
      return { handled: true, result: updated };
    }
  }

  // DELETE /departments/:id
  if (/^\/departments\/[^/]+$/.test(path) && method === 'DELETE') {
    const deptId = path.split('/departments/')[1];
    // Check if any employees belong to this department
    const hasEmployees = Array.from(demoEmployeesDb.values()).some(
      (emp) => emp.department_id === deptId
    );
    if (hasEmployees) {
      throw makeApiError(path, 400, 'department_has_employees', 'Department has employees');
    }
    demoDepartmentsDb.delete(deptId);
    return { handled: true, result: null };
  }

  // GET /employees/me
  if (path === '/employees/me' && method === 'GET') {
    const emp = demoEmployeesDb.get('1d63b635-8933-45d1-a233-d6902e3b27f1')!;
    const defaultPermissions = {
      clients: { create: true, read: true, update: true, delete: false },
      employees: { create: false, read: true, update: false, delete: false },
      departments: { create: false, read: true, update: false, delete: false },
      cargo_kpi: { create: true, read: true, update: true, delete: false },
      finance: { create: true, read: true, update: true, delete: false },
      commercial_offers: { create: true, read: true, update: false, delete: false },
      tasks: { create: true, read: true, update: true, delete: false },
      currency: { create: false, read: true, update: false, delete: false },
      attachments: { create: true, read: true, update: false, delete: false },
      roles: { create: true, read: true, update: false, delete: false },
    };
    const permissions = emp.permissions || defaultPermissions;
    return {
      handled: true,
      result: {
        ...emp,
        role_id: emp.role_id || 'e38a293c-8291-4e78-9b88-518293746ab1',
        permissions,
        user: emp.user || {
          id: emp.user_id || 'd36cd0fe-bf3b-448d-964c-5b214eef86e4',
          phone_number: emp.phone,
          username: emp.username || emp.phone,
          role: emp.user_role || 'ROP',
          role_id: 'e38a293c-8291-4e78-9b88-518293746ab1',
          status: emp.user_status || 'Open',
          is_active: true,
          permissions,
        },
      },
    };
  }

  // GET /employees or GET /employees?search=...
  if ((path === '/employees' || path.startsWith('/employees?')) && method === 'GET') {
    const urlObj = new URL(path, 'http://localhost');
    const search = urlObj.searchParams.get('search')?.toLowerCase().trim() || '';
    const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
    const limit = parseInt(urlObj.searchParams.get('limit') || '20', 10);
    const departmentId = urlObj.searchParams.get('department_id') || '';

    let list = Array.from(demoEmployeesDb.values());
    if (departmentId) {
      list = list.filter((e) => e.department_id === departmentId);
    }
    if (search) {
      list = list.filter(
        (e) =>
          `${e.first_name} ${e.last_name}`.toLowerCase().includes(search) ||
          e.phone.toLowerCase().includes(search) ||
          (e.department_name && e.department_name.toLowerCase().includes(search)) ||
          (e.department_display_name && e.department_display_name.toLowerCase().includes(search))
      );
    }

    const total = list.length;
    const startIndex = (page - 1) * limit;
    const items = list.slice(startIndex, startIndex + limit);

    return {
      handled: true,
      result: {
        items,
        meta: {
          totalItems: total,
          itemCount: items.length,
          itemsPerPage: limit,
          totalPages: Math.ceil(total / limit) || 1,
          currentPage: page,
        },
      },
    };
  }

  // GET /employees/:id
  if (
    /^\/employees\/[^/]+$/.test(path) &&
    method === 'GET' &&
    !path.includes('/me') &&
    !path.includes('/picture')
  ) {
    const empId = path.split('/employees/')[1];
    const emp = demoEmployeesDb.get(empId);
    if (emp) {
      return { handled: true, result: emp };
    }
  }

  // POST /employees/me/picture or POST /employees/:id/picture
  if (
    (path === '/employees/me/picture' || /^\/employees\/[^/]+\/picture$/.test(path)) &&
    method === 'POST'
  ) {
    const empId =
      path === '/employees/me/picture'
        ? '1d63b635-8933-45d1-a233-d6902e3b27f1'
        : path.split('/')[2];
    const emp = demoEmployeesDb.get(empId) || {
      id: empId,
      first_name: 'User',
      last_name: 'Employee',
      phone: '+998901234567',
      secondary_phone: null,
      address: null,
      department_id: '07d223ca-4167-47f7-a929-61d47a3628a7',
      fixed_salary: '0',
      currency: 'UZS' as SupportedCurrency,
      color: '#CCCCCC',
      picture_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let simulatedUrl =
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
    if (options.body instanceof FormData) {
      const file = options.body.get('file');
      if (file instanceof File) {
        if (file.size > 5 * 1024 * 1024) {
          throw makeApiError(path, 400, 'file_too_large', 'File size exceeds 5MB limit.');
        }
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
          throw makeApiError(
            path,
            400,
            'invalid_image_type',
            'Invalid image type. Allowed: JPEG, PNG, WEBP, GIF.'
          );
        }
        simulatedUrl = URL.createObjectURL(file);
      }
    }

    const updatedEmp: Employee = {
      ...emp,
      picture_url: simulatedUrl,
      updated_at: new Date().toISOString(),
    };
    demoEmployeesDb.set(empId, updatedEmp);
    return { handled: true, result: updatedEmp };
  }

  // DELETE /employees/me/picture or DELETE /employees/:id/picture
  if (
    (path === '/employees/me/picture' || /^\/employees\/[^/]+\/picture$/.test(path)) &&
    method === 'DELETE'
  ) {
    const empId =
      path === '/employees/me/picture'
        ? '1d63b635-8933-45d1-a233-d6902e3b27f1'
        : path.split('/')[2];
    const emp = demoEmployeesDb.get(empId) || {
      id: empId,
      first_name: 'User',
      last_name: 'Employee',
      phone: '+998901234567',
      secondary_phone: null,
      address: null,
      department_id: '07d223ca-4167-47f7-a929-61d47a3628a7',
      fixed_salary: '0',
      currency: 'UZS' as SupportedCurrency,
      color: '#CCCCCC',
      picture_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedEmp: Employee = {
      ...emp,
      picture_url: null,
      updated_at: new Date().toISOString(),
    };
    demoEmployeesDb.set(empId, updatedEmp);
    return { handled: true, result: updatedEmp };
  }

  return null;
});

// Departments API
export const departmentsApi = {
  list: () => request<Department[]>('/departments', { method: 'GET' }),

  get: (id: string) => request<Department>(`/departments/${id}`, { method: 'GET' }),

  create: (dto: CreateDepartmentDto) =>
    request<Department>('/departments', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  update: (id: string, dto: CreateDepartmentDto) =>
    request<Department>(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),

  delete: (id: string) => requestNoContent(`/departments/${id}`, { method: 'DELETE' }),
};

let cachedMePromise: Promise<Employee> | null = null;
let cachedMeTime = 0;

// Employees API
export const employeesApi = {
  me: (): Promise<Employee> => {
    const now = Date.now();
    if (cachedMePromise && now - cachedMeTime < 5000) {
      return cachedMePromise;
    }
    cachedMeTime = now;
    cachedMePromise = request<Employee>('/employees/me', { method: 'GET' }).catch((err) => {
      cachedMePromise = null;
      throw err;
    });
    return cachedMePromise;
  },

  uploadMyPicture: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<Employee>('/employees/me/picture', {
      method: 'POST',
      body: formData,
    });
  },

  deleteMyPicture: () => request<Employee>('/employees/me/picture', { method: 'DELETE' }),

  uploadPicture: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<Employee>(`/employees/${id}/picture`, {
      method: 'POST',
      body: formData,
    });
  },

  deletePicture: (id: string) =>
    request<Employee>(`/employees/${id}/picture`, { method: 'DELETE' }),

  list: (params?: EmployeeListParams) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.department_id) searchParams.set('department_id', params.department_id);
    const query = searchParams.toString();
    return request<PaginatedResponse<Employee>>(`/employees${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  get: (id: string) => request<Employee>(`/employees/${id}`, { method: 'GET' }),

  create: (dto: CreateEmployeeDto) =>
    request<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  update: (id: string, dto: UpdateEmployeeDto) =>
    request<Employee>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),

  delete: (id: string) => requestNoContent(`/employees/${id}`, { method: 'DELETE' }),
};
