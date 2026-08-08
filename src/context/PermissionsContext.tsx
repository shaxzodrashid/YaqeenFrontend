import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, tokenStore } from '../services/api';
import type { Employee } from '../services/api';

export interface ModulePermissionAction {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export type ModuleKey =
  | 'clients'
  | 'employees'
  | 'departments'
  | 'cargo_kpi'
  | 'cargo_registrations'
  | 'finance'
  | 'commercial_offers'
  | 'tasks'
  | 'currency'
  | 'attachments'
  | 'roles';

export type UserPermissions = Record<string, ModulePermissionAction & { register_for_everyone?: boolean }>;

export const FULL_PERMISSIONS: UserPermissions = {
  clients: { create: true, read: true, update: true, delete: true },
  employees: { create: true, read: true, update: true, delete: true },
  departments: { create: true, read: true, update: true, delete: true },
  cargo_kpi: { create: true, read: true, update: true, delete: true },
  cargo_registrations: { create: true, read: true, update: true, delete: true, register_for_everyone: true },
  finance: { create: true, read: true, update: true, delete: true },
  commercial_offers: { create: true, read: true, update: true, delete: true },
  tasks: { create: true, read: true, update: true, delete: true },
  currency: { create: true, read: true, update: true, delete: true },
  attachments: { create: true, read: true, update: true, delete: true },
  roles: { create: true, read: true, update: true, delete: true },
};

interface PermissionsContextType {
  permissions: UserPermissions;
  userRole: string;
  isCeo: boolean;
  isRop: boolean;
  loading: boolean;
  hasPermission: (module: ModuleKey | string, action: keyof ModulePermissionAction) => boolean;
  canRead: (module: ModuleKey | string) => boolean;
  canCreate: (module: ModuleKey | string) => boolean;
  canUpdate: (module: ModuleKey | string) => boolean;
  canDelete: (module: ModuleKey | string) => boolean;
  canRegisterForEveryone: () => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<UserPermissions>(FULL_PERMISSIONS);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPermissions = useCallback(async () => {
    const user = tokenStore.getUser();
    if (!tokenStore.getAccessToken()) {
      setPermissions(FULL_PERMISSIONS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const me: Employee = await api.employees.me();
      const role = me.user_role || me.user?.role || user?.role || '';
      setUserRole(role);

      // CEO role overrides all permissions to true
      if (role === 'CEO') {
        setPermissions(FULL_PERMISSIONS);
      } else if (me.permissions) {
        setPermissions(me.permissions);
      } else if (me.user?.permissions) {
        setPermissions(me.user.permissions);
      } else {
        // Fallback default permissions
        setPermissions(FULL_PERMISSIONS);
      }
    } catch (err) {
      console.warn('Failed to load user permissions, applying fallback:', err);
      if (user?.role === 'CEO' || user?.role === 'ROP') {
        setPermissions(FULL_PERMISSIONS);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();

    const handleProfileUpdate = () => {
      fetchPermissions();
    };

    window.addEventListener('yaqeen_profile_updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('yaqeen_profile_updated', handleProfileUpdate);
    };
  }, [fetchPermissions]);

  const isCeo = userRole === 'CEO';
  const isRop = userRole === 'ROP';

  const hasPermission = (module: ModuleKey | string, action: keyof ModulePermissionAction): boolean => {
    if (isCeo) return true;
    const mod = permissions[module];
    if (!mod) return false;
    return !!mod[action];
  };

  const canRead = (module: ModuleKey | string): boolean => hasPermission(module, 'read');
  const canCreate = (module: ModuleKey | string): boolean => hasPermission(module, 'create');
  const canUpdate = (module: ModuleKey | string): boolean => hasPermission(module, 'update');
  const canDelete = (module: ModuleKey | string): boolean => hasPermission(module, 'delete');

  const canRegisterForEveryone = (): boolean => {
    if (isCeo || isRop) return true;
    const cargoPerm = permissions['cargo_registrations'];
    return !!cargoPerm?.register_for_everyone;
  };

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        userRole,
        isCeo,
        isRop,
        loading,
        hasPermission,
        canRead,
        canCreate,
        canUpdate,
        canDelete,
        canRegisterForEveryone,
        refreshPermissions: fetchPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = (): PermissionsContextType => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};
