import type { Role } from '../../services/roles.service';

/**
 * Returns the localized display name for a role.
 * If the role is a built-in system role (e.g. CEO, ROP, EMPLOYEE),
 * it returns the translation if available; otherwise falls back to `role.display_name`.
 */
export function getRoleDisplayName(role: Role, t: (key: any) => string): string {
  if (role.is_system && role.name) {
    const key = `role_${role.name}_name`;
    const translated = t(key);
    if (translated && translated !== key) {
      return translated;
    }
  }
  return role.display_name || role.name;
}

/**
 * Returns the localized description for a role.
 * If the role is a built-in system role, it returns the translated description if available;
 * otherwise falls back to `role.description` or a default localized notice.
 */
export function getRoleDescription(role: Role, t: (key: any) => string): string {
  if (role.is_system && role.name) {
    const key = `role_${role.name}_desc`;
    const translated = t(key);
    if (translated && translated !== key) {
      return translated;
    }
  }
  return role.description || t('rolesNoDescription');
}

/**
 * Returns the localized label for a system module (e.g., clients, employees, cargo_kpi).
 */
export function getModuleName(
  moduleKey: string,
  fallbackLabel: string,
  t: (key: any) => string
): string {
  const key = `module_${moduleKey}`;
  const translated = t(key);
  if (translated && translated !== key) {
    return translated;
  }
  return fallbackLabel || moduleKey;
}

/**
 * Returns the localized tooltip description for a system module.
 */
export function getModuleDescription(moduleKey: string, t: (key: any) => string): string {
  const key = `module_${moduleKey}_desc`;
  const translated = t(key);
  if (translated && translated !== key) {
    return translated;
  }
  return '';
}
