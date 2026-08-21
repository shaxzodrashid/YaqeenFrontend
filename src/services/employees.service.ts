import { request, requestNoContent, registerDemoHandler, makeApiError } from './httpClient';
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

// Multi-currency revenue metrics
export interface EmployeeTotalRevenue {
  USD: number;
  UZS: number;
  RUB: number;
}

// Two-direction plan completion (LTL & FTL)
export interface EmployeePlanCompletion {
  ltl_completion: number;
  ftl_completion: number;
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

export interface EmployeeListItem extends Employee {
  full_name: string;
  role_name: string;
  department_name: string;
  status: 'Open' | 'Pending' | 'Banned' | 'Deleted' | string;
  total_revenue: EmployeeTotalRevenue;
  plan_completion: EmployeePlanCompletion;
  total_assigned_employees: number;
}

export interface EmployeeListMeta {
  total: number;
  offset: number;
  limit: number;
  open_employees: number;
  plan_completed: EmployeePlanCompletion;
  total_revenue: EmployeeTotalRevenue;
  totalItems?: number;
  itemCount?: number;
  totalPages?: number;
  currentPage?: number;
  itemsPerPage?: number;
}

export interface EmployeeListResponse {
  meta: EmployeeListMeta;
  data: EmployeeListItem[];
  items: EmployeeListItem[]; // Backward compatibility
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
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
  role_name?: string;
  status?: string;
  permissions?: Record<
    string,
    { create: boolean; read: boolean; update: boolean; delete: boolean }
  >;

  // Calculated Metrics
  total_revenue?: EmployeeTotalRevenue;
  plan_completion?: EmployeePlanCompletion;
  total_assigned_employees?: number;
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
  offset?: number;
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
      full_name: 'Jasur Yoldoshev',
      phone: '+998901234567',
      secondary_phone: '+998931112233',
      address: 'Tashkent, Shaykhontohur dist.',
      department_id: '07d223ca-4167-47f7-a929-61d47a3628a7',
      department_name: 'sales',
      department_display_name: 'Sales HQ',
      role_name: 'Logistics & Cargo Manager',
      user_role: 'ROP',
      user_status: 'Open',
      status: 'Open',
      fixed_salary: '1500.00',
      currency: 'USD',
      color: '#3B82F6',
      picture_url: null,
      is_active: true,
      total_assigned_employees: 8,
      total_revenue: {
        USD: 55000,
        UZS: 25000000,
        RUB: 4400000,
      },
      plan_completion: {
        ltl_completion: 90.0,
        ftl_completion: 110.0,
      },
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
      mijozlar_count: 8,
      created_at: '2026-07-19T13:22:58.587Z',
      updated_at: '2026-07-19T13:22:58.587Z',
    },
  ],
  [
    '1d63b635-8933-45d1-a233-d6902e3b27f1',
    {
      id: '1d63b635-8933-45d1-a233-d6902e3b27f1',
      first_name: 'Shaxzod',
      last_name: 'Rashidov',
      full_name: 'Shaxzod Rashidov',
      phone: '+998330094112',
      secondary_phone: null,
      address: 'Tashkent, Mirzo Ulugbek dist.',
      department_id: '07d223ca-4167-47f7-a929-61d47a3628a7',
      department_name: 'sales',
      department_display_name: 'Sales HQ',
      role_name: 'Head of Sales (ROP)',
      user_role: 'ROP',
      user_status: 'Open',
      status: 'Open',
      fixed_salary: '1800.00',
      currency: 'USD',
      color: '#C8A96A',
      picture_url: null,
      is_active: true,
      total_assigned_employees: 6,
      total_revenue: {
        USD: 42000,
        UZS: 32000000,
        RUB: 3410000,
      },
      plan_completion: {
        ltl_completion: 106.5,
        ftl_completion: 115.0,
      },
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
      mijozlar_count: 6,
      created_at: '2026-07-19T13:22:58.587Z',
      updated_at: '2026-07-19T13:22:58.587Z',
      user_id: 'd36cd0fe-bf3b-448d-964c-5b214eef86e4',
      username: '998330094112',
    },
  ],
  [
    '2b78a1c9-34e5-4a1d-91b2-c8d9e0f1a2b3',
    {
      id: '2b78a1c9-34e5-4a1d-91b2-c8d9e0f1a2b3',
      first_name: 'Rustam',
      last_name: 'Rasulov',
      full_name: 'Rustam Rasulov',
      phone: '+998935551234',
      secondary_phone: null,
      address: 'Samarkand, Uzbekistan',
      department_id: '07d223ca-4167-47f7-a929-61d47a3628a7',
      department_name: 'sales',
      department_display_name: 'Sales HQ',
      role_name: 'Senior Sales Manager',
      user_role: 'EMPLOYEE',
      user_status: 'Pending',
      status: 'Pending',
      fixed_salary: '1000.00',
      currency: 'UZS',
      color: '#10B981',
      picture_url: null,
      is_active: true,
      total_assigned_employees: 3,
      total_revenue: {
        USD: 28000,
        UZS: 18000000,
        RUB: 2695000,
      },
      plan_completion: {
        ltl_completion: 89.8,
        ftl_completion: 95.0,
      },
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
      mijozlar_count: 3,
      created_at: '2026-07-19T14:00:00.000Z',
      updated_at: '2026-07-19T14:00:00.000Z',
    },
  ],
  [
    '3c89b2d0-45f6-5b2e-a2c3-d9e0f1a2b3c4',
    {
      id: '3c89b2d0-45f6-5b2e-a2c3-d9e0f1a2b3c4',
      first_name: 'Sardor',
      last_name: 'Alimov',
      full_name: 'Sardor Alimov',
      phone: '+998971112233',
      secondary_phone: null,
      address: 'Bukhara, Uzbekistan',
      department_id: 'dep-logistics',
      department_name: 'logistics',
      department_display_name: 'Logistics',
      role_name: 'Logistics Operations Lead',
      user_role: 'EMPLOYEE',
      user_status: 'Open',
      status: 'Open',
      fixed_salary: '1100.00',
      currency: 'UZS',
      color: '#8B5CF6',
      picture_url: null,
      is_active: true,
      total_assigned_employees: 5,
      total_revenue: {
        USD: 14000,
        UZS: 12000000,
        RUB: 946000,
      },
      plan_completion: {
        ltl_completion: 105.1,
        ftl_completion: 108.0,
      },
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
      mijozlar_count: 5,
      created_at: '2026-07-19T15:00:00.000Z',
      updated_at: '2026-07-19T15:00:00.000Z',
    },
  ],
  [
    '4d90c3e1-56a7-6c3f-b3d4-e0f1a2b3c4d5',
    {
      id: '4d90c3e1-56a7-6c3f-b3d4-e0f1a2b3c4d5',
      first_name: 'Nodira',
      last_name: 'Azimova',
      full_name: 'Nodira Azimova',
      phone: '+998909876543',
      secondary_phone: null,
      address: 'Tashkent, Uzbekistan',
      department_id: 'dep-seo',
      department_name: 'seo',
      department_display_name: 'SEO & Marketing',
      role_name: 'Marketing Specialist',
      user_role: 'EMPLOYEE',
      user_status: 'Banned',
      status: 'Banned',
      fixed_salary: '1300.00',
      currency: 'UZS',
      color: '#EC4899',
      picture_url: null,
      is_active: false,
      total_assigned_employees: 0,
      total_revenue: {
        USD: 0,
        UZS: 0,
        RUB: 0,
      },
      plan_completion: {
        ltl_completion: 0,
        ftl_completion: 0,
      },
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
      created_at: '2026-07-19T16:00:00.000Z',
      updated_at: '2026-07-19T16:00:00.000Z',
    },
  ],
  [
    '5e01d4f2-67b8-7d4a-c4e5-f1a2b3c4d5e6',
    {
      id: '5e01d4f2-67b8-7d4a-c4e5-f1a2b3c4d5e6',
      first_name: 'Dilshod',
      last_name: 'Karimov',
      full_name: 'Dilshod Karimov',
      phone: '+998912345678',
      secondary_phone: null,
      address: 'Tashkent, Chilanzar dist.',
      department_id: 'dep-groupage',
      department_name: 'groupage',
      department_display_name: "Yig'ma yuklar",
      role_name: 'Groupage Cargo Specialist',
      user_role: 'EMPLOYEE',
      user_status: 'Open',
      status: 'Open',
      fixed_salary: '1400.00',
      currency: 'USD',
      color: '#F59E0B',
      picture_url: null,
      is_active: true,
      total_assigned_employees: 4,
      total_revenue: {
        USD: 36000,
        UZS: 22000000,
        RUB: 1850000,
      },
      plan_completion: {
        ltl_completion: 98.5,
        ftl_completion: 104.0,
      },
      tushum: {
        amount: 1850000,
        currency: 'RUB',
        formatted: '1,850,000 ₽',
      },
      reja_fakt: {
        plan_target: 1800000,
        fact_amount: 1850000,
        percentage: 102.77,
        currency: 'RUB',
        status: 'Bajarildi',
        status_code: 'COMPLETED',
        formatted_plan: '1,800,000 ₽',
        formatted_fact: '1,850,000 ₽',
      },
      mijozlar_count: 4,
      created_at: '2026-07-20T09:30:00.000Z',
      updated_at: '2026-07-20T09:30:00.000Z',
    },
  ],
  [
    '6f12e5a3-78c9-8e5b-d5f6-a2b3c4d5e6f7',
    {
      id: '6f12e5a3-78c9-8e5b-d5f6-a2b3c4d5e6f7',
      first_name: 'Kamola',
      last_name: 'Tursunova',
      full_name: 'Kamola Tursunova',
      phone: '+998934445566',
      secondary_phone: null,
      address: 'Tashkent, Yunusabad dist.',
      department_id: 'dep-customs',
      department_name: 'customs',
      department_display_name: 'Bojxona',
      role_name: 'Customs Declarant Specialist',
      user_role: 'EMPLOYEE',
      user_status: 'Open',
      status: 'Open',
      fixed_salary: '1250.00',
      currency: 'USD',
      color: '#14B8A6',
      picture_url: null,
      is_active: true,
      total_assigned_employees: 2,
      total_revenue: {
        USD: 19500,
        UZS: 15000000,
        RUB: 1200000,
      },
      plan_completion: {
        ltl_completion: 112.0,
        ftl_completion: 118.5,
      },
      tushum: {
        amount: 1200000,
        currency: 'RUB',
        formatted: '1,200,000 ₽',
      },
      reja_fakt: {
        plan_target: 1000000,
        fact_amount: 1200000,
        percentage: 120.0,
        currency: 'RUB',
        status: 'Bajarildi',
        status_code: 'COMPLETED',
        formatted_plan: '1,000,000 ₽',
        formatted_fact: '1,200,000 ₽',
      },
      mijozlar_count: 2,
      created_at: '2026-07-21T11:15:00.000Z',
      updated_at: '2026-07-21T11:15:00.000Z',
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

  // GET /api/v1/employees or GET /employees or GET /employees?search=...
  if (
    (path === '/api/v1/employees' ||
      path.startsWith('/api/v1/employees?') ||
      path === '/employees' ||
      path.startsWith('/employees?')) &&
    method === 'GET'
  ) {
    const urlObj = new URL(path, 'http://localhost');
    const search = urlObj.searchParams.get('search')?.toLowerCase().trim() || '';
    const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
    const limit = parseInt(urlObj.searchParams.get('limit') || '10', 10);
    const offsetParam = urlObj.searchParams.get('offset');
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
          (e.department_display_name && e.department_display_name.toLowerCase().includes(search)) ||
          (e.role_name && e.role_name.toLowerCase().includes(search))
      );
    }

    const total = list.length;
    const offset = offsetParam !== null ? parseInt(offsetParam, 10) : (page - 1) * limit;
    const sliceItems = list.slice(offset, offset + limit);

    const data: EmployeeListItem[] = sliceItems.map((emp) => {
      const fullName = emp.full_name || `${emp.first_name} ${emp.last_name}`.trim();
      return {
        id: emp.id,
        full_name: fullName,
        first_name: emp.first_name,
        last_name: emp.last_name,
        phone: emp.phone,
        secondary_phone: emp.secondary_phone,
        address: emp.address,
        role_name:
          emp.role_name ||
          (emp.user_role === 'CEO'
            ? 'General Director (CEO)'
            : emp.user_role === 'ROP'
              ? 'Head of Sales (ROP)'
              : 'Sales Manager'),
        department_name: emp.department_display_name || emp.department_name || 'Sales',
        department_id: emp.department_id,
        department_display_name: emp.department_display_name,
        status: emp.status || emp.user_status || (emp.is_active ? 'Open' : 'Banned'),
        total_revenue: emp.total_revenue || {
          USD: 55000,
          UZS: 25000000,
          RUB: emp.tushum?.amount || 2695000,
        },
        plan_completion: emp.plan_completion || {
          ltl_completion: emp.reja_fakt?.percentage || 90.0,
          ftl_completion: 110.0,
        },
        total_assigned_employees: emp.total_assigned_employees ?? emp.mijozlar_count ?? 4,
        color: emp.color || '#3B82F6',
        picture_url: emp.picture_url,
        is_active: emp.is_active,
        fixed_salary: emp.fixed_salary,
        currency: emp.currency,
        user_role: emp.user_role,
        user_status: emp.user_status,
        user_id: emp.user_id,
        username: emp.username,
        created_at: emp.created_at,
        updated_at: emp.updated_at,
      };
    });

    const openCount = list.filter(
      (e) => (e.status || e.user_status || '').toLowerCase() === 'open' || e.is_active
    ).length;

    // Calculate aggregated revenue for demo
    const totalRevUSD = list.reduce((sum, e) => sum + (e.total_revenue?.USD || 35000), 0);
    const totalRevUZS = list.reduce((sum, e) => sum + (e.total_revenue?.UZS || 25000000), 0);
    const totalRevRUB = list.reduce((sum, e) => sum + (e.total_revenue?.RUB || 2500000), 0);

    const meta: EmployeeListMeta = {
      total,
      offset,
      limit,
      open_employees: openCount,
      plan_completed: {
        ltl_completion: 88.5,
        ftl_completion: 108.0,
      },
      total_revenue: {
        USD: totalRevUSD || 125000,
        UZS: totalRevUZS || 95000000,
        RUB: totalRevRUB || 450000,
      },
      totalItems: total,
      itemCount: data.length,
      itemsPerPage: limit,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
    };

    return {
      handled: true,
      result: {
        meta,
        data,
        items: data, // For components expecting .items
      },
    };
  }

  // GET /employees/:id
  if (
    (/^\/employees\/[^/]+$/.test(path) || /^\/api\/v1\/employees\/[^/]+$/.test(path)) &&
    method === 'GET' &&
    !path.includes('/me') &&
    !path.includes('/picture')
  ) {
    const empId = path.replace(/^\/api\/v1/, '').split('/employees/')[1];
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

  list: async (params?: EmployeeListParams): Promise<EmployeeListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset !== undefined) searchParams.set('offset', String(params.offset));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.department_id) searchParams.set('department_id', params.department_id);
    const query = searchParams.toString();

    let raw: any;
    try {
      raw = await request<any>(`/api/v1/employees${query ? `?${query}` : ''}`, { method: 'GET' });
    } catch {
      // Fallback for legacy server routing
      raw = await request<any>(`/employees${query ? `?${query}` : ''}`, { method: 'GET' });
    }

    const rawData = Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.items)
        ? raw.items
        : Array.isArray(raw)
          ? raw
          : [];

    const rawMeta = raw?.meta || {};
    const total = rawMeta.total ?? rawMeta.totalItems ?? rawData.length;
    const limit = params?.limit || rawMeta.limit || rawMeta.itemsPerPage || 10;
    const page = params?.page || rawMeta.currentPage || 1;
    const offset = rawMeta.offset ?? (page - 1) * limit;
    const totalPages = rawMeta.totalPages ?? (Math.ceil(total / limit) || 1);

    const normalizedData: EmployeeListItem[] = rawData.map((item: any) => {
      const firstName = item.first_name || item.full_name?.split(' ')[0] || '';
      const lastName = item.last_name || item.full_name?.split(' ').slice(1).join(' ') || '';
      const fullName = item.full_name || `${firstName} ${lastName}`.trim();
      return {
        ...item,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        role_name:
          item.role_name ||
          item.user_role ||
          (item.user?.role === 'CEO'
            ? 'General Director (CEO)'
            : item.user?.role === 'ROP'
              ? 'Head of Sales (ROP)'
              : 'Sales Manager'),
        department_name:
          item.department_display_name ||
          item.department_name ||
          item.department?.display_name ||
          item.department?.name ||
          'Sales',
        status: item.status || item.user_status || (item.is_active !== false ? 'Open' : 'Banned'),
        total_revenue: item.total_revenue || {
          USD: item.tushum?.amount ? Math.round(item.tushum.amount * 0.011) : 45000,
          UZS: item.tushum?.amount ? Math.round(item.tushum.amount * 140) : 25000000,
          RUB: item.tushum?.amount || 120000,
        },
        plan_completion: item.plan_completion || {
          ltl_completion: item.reja_fakt?.percentage || 90.0,
          ftl_completion: 105.0,
        },
        total_assigned_employees: item.total_assigned_employees ?? item.mijozlar_count ?? 1,
        color: item.color || '#C8A96A',
      };
    });

    const normalizedMeta: EmployeeListMeta = {
      total,
      offset,
      limit,
      open_employees:
        rawMeta.open_employees ??
        normalizedData.filter(
          (e) => (e.status || '').toLowerCase() === 'open' || e.is_active !== false
        ).length,
      plan_completed: rawMeta.plan_completed ?? {
        ltl_completion: 85.5,
        ftl_completion: 110.0,
      },
      total_revenue: rawMeta.total_revenue ?? {
        USD: 125000,
        UZS: 95000000,
        RUB: 450000,
      },
      totalItems: total,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    };

    return {
      meta: normalizedMeta,
      data: normalizedData,
      items: normalizedData,
    };
  },

  get: async (id: string): Promise<Employee> => {
    let raw: any;
    try {
      raw = await request<any>(`/api/v1/employees/${id}`, { method: 'GET' });
    } catch {
      raw = await request<any>(`/employees/${id}`, { method: 'GET' });
    }
    const data = raw?.data || raw?.item || raw;
    const empData = data?.employee || data;
    const userData = data?.user || data;

    const firstName =
      empData?.first_name || data?.first_name || data?.full_name?.split(' ')[0] || '';
    const lastName =
      empData?.last_name || data?.last_name || data?.full_name?.split(' ').slice(1).join(' ') || '';
    const fullName = data?.full_name || `${firstName} ${lastName}`.trim();
    const phone =
      empData?.phone || data?.phone || data?.phone_number || userData?.phone_number || '';
    const secondaryPhone = empData?.secondary_phone ?? data?.secondary_phone ?? null;
    const address = empData?.address ?? data?.address ?? null;
    const departmentId =
      empData?.department_id || empData?.department?.id || data?.department_id || '';
    const departmentName =
      empData?.department?.display_name ||
      empData?.department?.name ||
      data?.department_display_name ||
      data?.department_name ||
      '';
    const rawSalary = empData?.fixed_salary ?? data?.fixed_salary;
    const fixedSalary = rawSalary !== undefined && rawSalary !== null ? String(rawSalary) : '0';
    const currency = empData?.currency || data?.currency || 'UZS';
    const color = empData?.color || data?.color || '#CCCCCC';
    const isActive = empData?.is_active ?? data?.is_active ?? userData?.is_active ?? true;
    const pictureUrl = empData?.picture_url ?? data?.picture_url ?? null;
    const roleName =
      userData?.role_details?.name ||
      userData?.role ||
      data?.user_role ||
      data?.role_name ||
      data?.role ||
      'EMPLOYEE';
    const roleId = data?.role_id || userData?.role_id || userData?.role_details?.id || '';

    return {
      ...data,
      id: data?.id || empData?.id || id,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      phone,
      secondary_phone: secondaryPhone,
      address,
      department_id: departmentId,
      department_name: departmentName,
      fixed_salary: fixedSalary,
      currency,
      color,
      is_active: isActive,
      picture_url: pictureUrl,
      role_name: roleName,
      user_role: roleName,
      role_id: roleId,
    };
  },

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
