import { request, requestNoContent } from './httpClient';

export interface ModulePermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  register_for_everyone?: boolean;
  can_work_with_all_clients?: boolean;
  assign_cargo?: boolean;
}

export interface ClientsModulePermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  can_work_with_all_clients: boolean;
}

export interface CargoConsolidationsModulePermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  assign_cargo: boolean;
}

export interface RolePermissions {
  clients?: ModulePermissions;
  employees?: ModulePermissions;
  departments?: ModulePermissions;
  cargo_kpi?: ModulePermissions;
  cargo_registrations?: ModulePermissions;
  cargo_consolidations?: CargoConsolidationsModulePermissions | ModulePermissions;
  finance?: ModulePermissions;
  commercial_offers?: ModulePermissions;
  tasks?: ModulePermissions;
  currency?: ModulePermissions;
  attachments?: ModulePermissions;
  roles?: ModulePermissions;
  [moduleKey: string]: ModulePermissions | undefined;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  permissions: RolePermissions;
  is_system: boolean;
  user_count: number;
  created_at: string;
  updated_at: string;
}

export interface SystemModule {
  module: string;
  label: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface CreateRoleDto {
  name: string;
  display_name: string;
  description?: string;
  permissions: RolePermissions;
}

export interface UpdateRoleDto {
  name?: string;
  display_name?: string;
  description?: string;
  permissions?: Partial<RolePermissions>;
}

// Fallback Taxonomy (12 Core Modules)
export const DEFAULT_SYSTEM_MODULES: SystemModule[] = [
  {
    module: 'clients',
    label: 'Clients Management',
    actions: ['create', 'read', 'update', 'delete'],
  },
  {
    module: 'employees',
    label: 'Employee Management',
    actions: ['create', 'read', 'update', 'delete'],
  },
  {
    module: 'departments',
    label: 'Department Management',
    actions: ['create', 'read', 'update', 'delete'],
  },
  { module: 'cargo_kpi', label: 'Cargo KPI', actions: ['create', 'read', 'update', 'delete'] },
  {
    module: 'cargo_registrations',
    label: 'Cargo Registrations',
    actions: ['create', 'read', 'update', 'delete'],
  },
  {
    module: 'cargo_consolidations',
    label: 'Cargo Consolidations',
    actions: ['create', 'read', 'update', 'delete'],
  },
  {
    module: 'finance',
    label: 'Finance & Expenses',
    actions: ['create', 'read', 'update', 'delete'],
  },
  {
    module: 'commercial_offers',
    label: 'Commercial Offers',
    actions: ['create', 'read', 'update', 'delete'],
  },
  {
    module: 'tasks',
    label: 'Kanban Tasks & Board',
    actions: ['create', 'read', 'update', 'delete'],
  },
  { module: 'currency', label: 'Currency Rates', actions: ['create', 'read', 'update', 'delete'] },
  {
    module: 'attachments',
    label: 'Attachments & Documents',
    actions: ['create', 'read', 'update', 'delete'],
  },
  {
    module: 'roles',
    label: 'Role & Permissions Management',
    actions: ['create', 'read', 'update', 'delete'],
  },
];

// Fallback Demo System Roles
const DEFAULT_DEMO_ROLES: Role[] = [
  {
    id: 'e0b1c2d3-4567-89ab-cdef-0123456789ab',
    name: 'CEO',
    display_name: 'Chief Executive Officer',
    description: 'Full administrative access to all modules and system settings',
    permissions: {
      clients: {
        create: true,
        read: true,
        update: true,
        delete: true,
        can_work_with_all_clients: true,
      },
      employees: { create: true, read: true, update: true, delete: true },
      departments: { create: true, read: true, update: true, delete: true },
      cargo_kpi: { create: true, read: true, update: true, delete: true },
      cargo_registrations: {
        create: true,
        read: true,
        update: true,
        delete: true,
        register_for_everyone: true,
      },
      cargo_consolidations: {
        create: true,
        read: true,
        update: true,
        delete: true,
        assign_cargo: true,
      },
      finance: { create: true, read: true, update: true, delete: true },
      commercial_offers: { create: true, read: true, update: true, delete: true },
      tasks: { create: true, read: true, update: true, delete: true },
      currency: { create: true, read: true, update: true, delete: true },
      attachments: { create: true, read: true, update: true, delete: true },
      roles: { create: true, read: true, update: true, delete: true },
    },
    is_system: true,
    user_count: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'b2c3d4e5-6789-01ab-cdef-2345678901bc',
    name: 'ROP',
    display_name: 'Head of Sales & Operations (ROP)',
    description: 'Department manager privileges with cargo, clients, and team controls',
    permissions: {
      clients: {
        create: true,
        read: true,
        update: true,
        delete: true,
        can_work_with_all_clients: true,
      },
      employees: { create: false, read: true, update: true, delete: false },
      departments: { create: false, read: true, update: false, delete: false },
      cargo_kpi: { create: true, read: true, update: true, delete: true },
      cargo_registrations: {
        create: true,
        read: true,
        update: true,
        delete: true,
        register_for_everyone: true,
      },
      cargo_consolidations: {
        create: true,
        read: true,
        update: true,
        delete: true,
        assign_cargo: true,
      },
      finance: { create: false, read: true, update: false, delete: false },
      commercial_offers: { create: true, read: true, update: true, delete: true },
      tasks: { create: true, read: true, update: true, delete: true },
      currency: { create: false, read: true, update: false, delete: false },
      attachments: { create: true, read: true, update: true, delete: true },
      roles: { create: false, read: true, update: false, delete: false },
    },
    is_system: true,
    user_count: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c3d4e5f6-7890-12ab-cdef-3456789012cd',
    name: 'EMPLOYEE',
    display_name: 'Standard Staff',
    description: 'Standard employee privileges for daily operations and task tracking',
    permissions: {
      clients: {
        create: false,
        read: true,
        update: true,
        delete: false,
        can_work_with_all_clients: false,
      },
      employees: { create: false, read: true, update: false, delete: false },
      departments: { create: false, read: true, update: false, delete: false },
      cargo_kpi: { create: false, read: true, update: false, delete: false },
      cargo_registrations: {
        create: true,
        read: true,
        update: false,
        delete: false,
        register_for_everyone: false,
      },
      cargo_consolidations: {
        create: false,
        read: true,
        update: false,
        delete: false,
        assign_cargo: false,
      },
      finance: { create: false, read: false, update: false, delete: false },
      commercial_offers: { create: true, read: true, update: false, delete: false },
      tasks: { create: true, read: true, update: true, delete: false },
      currency: { create: false, read: true, update: false, delete: false },
      attachments: { create: true, read: true, update: false, delete: false },
      roles: { create: false, read: false, update: false, delete: false },
    },
    is_system: true,
    user_count: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'a9b8c7d6-5432-10fe-dcba-9876543210fe',
    name: 'LOGISTICS_MANAGER',
    display_name: 'Logistics & Cargo Manager',
    description: 'Custom role for cargo operations team leads',
    permissions: {
      clients: {
        create: false,
        read: true,
        update: true,
        delete: false,
        can_work_with_all_clients: false,
      },
      employees: { create: false, read: true, update: false, delete: false },
      departments: { create: false, read: true, update: false, delete: false },
      cargo_kpi: { create: true, read: true, update: true, delete: true },
      cargo_registrations: {
        create: true,
        read: true,
        update: true,
        delete: true,
        register_for_everyone: true,
      },
      cargo_consolidations: {
        create: true,
        read: true,
        update: true,
        delete: false,
        assign_cargo: true,
      },
      finance: { create: false, read: false, update: false, delete: false },
      commercial_offers: { create: true, read: true, update: true, delete: false },
      tasks: { create: true, read: true, update: true, delete: true },
      currency: { create: false, read: true, update: false, delete: false },
      attachments: { create: true, read: true, update: true, delete: false },
      roles: { create: false, read: false, update: false, delete: false },
    },
    is_system: false,
    user_count: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let fallbackRolesMemory: Role[] = [...DEFAULT_DEMO_ROLES];

export const rolesApi = {
  getModules: async (): Promise<SystemModule[]> => {
    try {
      return await request<SystemModule[]>('/roles/modules', { method: 'GET' });
    } catch (err) {
      console.warn('Fallback to local modules taxonomy:', err);
      return DEFAULT_SYSTEM_MODULES;
    }
  },

  list: async (): Promise<Role[]> => {
    try {
      return await request<Role[]>('/roles', { method: 'GET' });
    } catch (err) {
      console.warn('Fallback to local roles list:', err);
      return fallbackRolesMemory;
    }
  },

  getById: async (id: string): Promise<Role> => {
    try {
      return await request<Role>(`/roles/${id}`, { method: 'GET' });
    } catch (err) {
      const found = fallbackRolesMemory.find((r) => r.id === id);
      if (found) return found;
      throw err;
    }
  },

  create: async (dto: CreateRoleDto): Promise<Role> => {
    try {
      return await request<Role>('/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
    } catch (err) {
      console.warn('Backend create failed, simulating fallback create:', err);
      // Construct fallback role
      const normalizedPermissions: RolePermissions = {};
      DEFAULT_SYSTEM_MODULES.forEach((mod) => {
        const p = dto.permissions[mod.module];
        normalizedPermissions[mod.module] = {
          create: p?.create ?? false,
          read: p?.read ?? false,
          update: p?.update ?? false,
          delete: p?.delete ?? false,
          ...(mod.module === 'cargo_registrations'
            ? { register_for_everyone: p?.register_for_everyone ?? false }
            : {}),
          ...(mod.module === 'clients'
            ? { can_work_with_all_clients: p?.can_work_with_all_clients ?? false }
            : {}),
          ...(mod.module === 'cargo_consolidations'
            ? { assign_cargo: p?.assign_cargo ?? false }
            : {}),
        };
      });

      const newRole: Role = {
        id: crypto.randomUUID(),
        name: dto.name.toUpperCase(),
        display_name: dto.display_name,
        description: dto.description || null,
        permissions: normalizedPermissions,
        is_system: false,
        user_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      fallbackRolesMemory = [newRole, ...fallbackRolesMemory];
      return newRole;
    }
  },

  update: async (id: string, dto: UpdateRoleDto): Promise<Role> => {
    try {
      return await request<Role>(`/roles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
    } catch (err) {
      console.warn('Backend update failed, simulating fallback update:', err);
      const index = fallbackRolesMemory.findIndex((r) => r.id === id);
      if (index !== -1) {
        const existing = fallbackRolesMemory[index];
        const updated: Role = {
          ...existing,
          display_name: dto.display_name ?? existing.display_name,
          description: dto.description !== undefined ? dto.description : existing.description,
          permissions: dto.permissions
            ? { ...existing.permissions, ...dto.permissions }
            : existing.permissions,
          updated_at: new Date().toISOString(),
        };
        fallbackRolesMemory[index] = updated;
        return updated;
      }
      throw err;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await requestNoContent(`/roles/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend delete failed, simulating fallback delete:', err);
      const target = fallbackRolesMemory.find((r) => r.id === id);
      if (target) {
        if (target.is_system) {
          throw {
            statusCode: 400,
            location: 'system_role_delete_prohibited',
            message: 'Built-in system roles cannot be deleted.',
          };
        }
        if (target.user_count > 0) {
          throw {
            statusCode: 400,
            location: 'role_has_assigned_users',
            message: `Role is assigned to ${target.user_count} active user accounts. Reassign users first.`,
          };
        }
        fallbackRolesMemory = fallbackRolesMemory.filter((r) => r.id !== id);
        return;
      }
      throw err;
    }
  },
};
