import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Button, Modal, Spinner, Skeleton, Tooltip } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Search,
  RefreshCw,
  Lock,
  Users,
  Shield,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { T } from '../T';
import { useNotification } from '../../context/NotificationContext';
import { usePermissions } from '../../context/PermissionsContext';
import { rolesApi, DEFAULT_SYSTEM_MODULES } from '../../services/roles.service';
import type {
  Role,
  SystemModule,
  CreateRoleDto,
  UpdateRoleDto,
} from '../../services/roles.service';
import { RoleFormModal } from './RoleFormModal';
import { RoleDetailDrawer } from './RoleDetailDrawer';
import { getRoleDisplayName, getRoleDescription } from './roleUtils';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 320, damping: 24 },
  },
};

export function RolesPage() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canCreate, canUpdate, canDelete } = usePermissions();

  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<SystemModule[]>(DEFAULT_SYSTEM_MODULES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'system' | 'custom'>('all');

  // Modal / Drawer States
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  const [deleting, setDeleting] = useState(false);

  // Fetch roles and taxonomy modules on mount
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedRoles, fetchedModules] = await Promise.all([
        rolesApi.list(),
        rolesApi.getModules(),
      ]);
      setRoles(fetchedRoles);
      if (fetchedModules && fetchedModules.length > 0) {
        setModules(fetchedModules);
      }
    } catch (err) {
      console.error('Error loading roles data:', err);
      showNotification(t('internal_error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Filtered roles list
  const filteredRoles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return roles.filter((role) => {
      const localizedName = getRoleDisplayName(role, t).toLowerCase();
      const localizedDesc = getRoleDescription(role, t).toLowerCase();
      const rawName = role.name.toLowerCase();
      const rawDisplayName = role.display_name.toLowerCase();
      const rawDesc = (role.description || '').toLowerCase();

      const matchesSearch =
        query === '' ||
        rawName.includes(query) ||
        rawDisplayName.includes(query) ||
        localizedName.includes(query) ||
        rawDesc.includes(query) ||
        localizedDesc.includes(query);

      const matchesType =
        filterType === 'all' ||
        (filterType === 'system' && role.is_system) ||
        (filterType === 'custom' && !role.is_system);

      return matchesSearch && matchesType;
    });
  }, [roles, searchQuery, filterType, t]);

  // Aggregate Stats
  const totalRolesCount = roles.length;
  const systemRolesCount = roles.filter((r) => r.is_system).length;
  const customRolesCount = roles.filter((r) => !r.is_system).length;
  const totalAssignedUsers = roles.reduce((sum, r) => sum + (r.user_count || 0), 0);

  // Open Handlers
  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    setFormModalOpen(true);
  };

  const handleOpenDetail = (role: Role) => {
    setSelectedRole(role);
    setDetailDrawerOpen(true);
  };

  const handleOpenDelete = (role: Role) => {
    if (role.is_system) {
      showNotification(t('rolesSystemDeleteProhibited'), 'warning');
      return;
    }
    setDeletingRole(role);
    setDeleteModalOpen(true);
  };

  // Create or Update Role Submission
  const handleSaveRole = async (data: {
    name: string;
    display_name: string;
    description: string;
    permissions: Record<string, any>;
  }) => {
    try {
      if (editingRole) {
        const dto: UpdateRoleDto = {
          display_name: data.display_name,
          description: data.description,
          permissions: data.permissions,
        };
        const updated = await rolesApi.update(editingRole.id, dto);
        setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        showNotification(t('successRoleUpdated'), 'success');
      } else {
        const dto: CreateRoleDto = {
          name: data.name,
          display_name: data.display_name,
          description: data.description,
          permissions: data.permissions,
        };
        const created = await rolesApi.create(dto);
        setRoles((prev) => [created, ...prev]);
        showNotification(t('successRoleCreated'), 'success');
      }
    } catch (err: any) {
      console.error('Failed to save role:', err);
      const loc = err?.location || err?.message;
      if (loc === 'role_name_exists') {
        showNotification(t('rolesRoleNameExists'), 'error');
      } else if (loc === 'system_role_rename_prohibited') {
        showNotification(t('rolesSystemRenameProhibited'), 'error');
      } else {
        showNotification(err?.message || t('internal_error'), 'error');
      }
      throw err;
    }
  };

  // Delete Role Submission
  const handleDeleteRole = async () => {
    if (!deletingRole) return;
    setDeleting(true);
    try {
      await rolesApi.delete(deletingRole.id);
      setRoles((prev) => prev.filter((r) => r.id !== deletingRole.id));
      showNotification(t('successRoleDeleted'), 'success');
      setDeleteModalOpen(false);
      setDeletingRole(null);
    } catch (err: any) {
      console.error('Failed to delete role:', err);
      const loc = err?.location;
      if (loc === 'system_role_delete_prohibited') {
        showNotification(t('rolesSystemDeleteProhibited'), 'error');
      } else if (loc === 'role_has_assigned_users') {
        showNotification(err?.message || t('rolesHasAssignedUsers'), 'error');
      } else {
        showNotification(err?.message || t('internal_error'), 'error');
      }
    } finally {
      setDeleting(false);
    }
  };

  // Helper to count active permissions for a role card
  const getRolePermissionStats = (rolePermissions: Record<string, any> = {}) => {
    let grantedCount = 0;
    modules.forEach((m) => {
      const p = rolePermissions[m.module];
      if (p && (p.create || p.read || p.update || p.delete)) {
        grantedCount++;
      }
    });
    return { grantedCount, total: modules.length };
  };

  return (
    <div className="space-y-8 pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-12 rounded-2xl bg-brand-gold/15 flex items-center justify-center text-brand-gold border border-brand-gold/30 shadow-sm shrink-0">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold font-serif text-foreground tracking-tight">
                <T k="rolesTitle" />
              </h1>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-gold bg-brand-gold/10 border border-brand-gold/30 px-2.5 py-0.5 rounded-full">
                RBAC v1.0
              </span>
            </div>
            <p className="text-xs text-muted mt-1 leading-relaxed max-w-xl">
              <T k="rolesSubtitle" />
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <Button
            isIconOnly
            variant="ghost"
            onPress={handleRefresh}
            isDisabled={refreshing}
            className="rounded-xl border border-border/40 text-muted hover:text-foreground hover:bg-default/50"
            aria-label="Refresh list"
          >
            <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>

          {canCreate('roles') && (
            <Button
              onPress={handleOpenCreate}
              className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-bold rounded-xl px-5 shadow-lg shadow-brand-gold/10 transition-all duration-200"
            >
              <Plus className="size-4 mr-1.5 stroke-[2.5]" />
              <T k="rolesAddNew" />
            </Button>
          )}
        </div>
      </div>

      {/* METRICS SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Roles */}
        <Card className="p-4 border border-border/40 bg-surface dark:bg-night-surface rounded-2xl shadow-sm hover:border-brand-gold/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted">
              <T k="rolesTotalCount" />
            </span>
            <div className="size-8 rounded-xl bg-brand-gold/15 flex items-center justify-center text-brand-gold">
              <Shield className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-foreground">
              {loading ? <Skeleton className="w-12 h-8 rounded-lg" /> : totalRolesCount}
            </span>
            <span className="text-[11px] text-muted font-medium">{t('rolesConfigured')}</span>
          </div>
        </Card>

        {/* Card 2: System Roles */}
        <Card className="p-4 border border-border/40 bg-surface dark:bg-night-surface rounded-2xl shadow-sm hover:border-amber-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted">
              <T k="rolesFilterSystem" />
            </span>
            <div className="size-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500">
              <Lock className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-foreground">
              {loading ? <Skeleton className="w-12 h-8 rounded-lg" /> : systemRolesCount}
            </span>
            <span className="text-[11px] text-amber-500 font-medium font-mono">
              {t('rolesImmutable')}
            </span>
          </div>
        </Card>

        {/* Card 3: Custom Roles */}
        <Card className="p-4 border border-border/40 bg-surface dark:bg-night-surface rounded-2xl shadow-sm hover:border-sky-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted">
              <T k="rolesFilterCustom" />
            </span>
            <div className="size-8 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-400">
              <Layers className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-foreground">
              {loading ? <Skeleton className="w-12 h-8 rounded-lg" /> : customRolesCount}
            </span>
            <span className="text-[11px] text-sky-400 font-medium">{t('rolesCustomMatrices')}</span>
          </div>
        </Card>

        {/* Card 4: Active Assigned Users */}
        <Card className="p-4 border border-border/40 bg-surface dark:bg-night-surface rounded-2xl shadow-sm hover:border-emerald-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted">
              <T k="rolesAssignedUsers" />
            </span>
            <div className="size-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <Users className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-foreground">
              {loading ? <Skeleton className="w-12 h-8 rounded-lg" /> : totalAssignedUsers}
            </span>
            <span className="text-[11px] text-emerald-400 font-medium">
              {t('rolesUserAccounts')}
            </span>
          </div>
        </Card>
      </div>

      {/* SEARCH BAR & TYPE FILTERS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface dark:bg-night-surface p-3 rounded-2xl border border-border/40">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('rolesSearch')}
            className="w-full pl-10 pr-4 py-2 text-xs bg-field text-field-foreground border border-field-border rounded-xl focus:outline-none focus:ring-2 focus:ring-focus/30 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-center sm:self-auto bg-default/30 dark:bg-night-field p-1 rounded-xl border border-border/30">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-brand-gold text-brand-navy font-bold shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <T k="rolesAllTypes" /> ({roles.length})
          </button>
          <button
            onClick={() => setFilterType('system')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'system'
                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <T k="rolesFilterSystem" /> ({systemRolesCount})
          </button>
          <button
            onClick={() => setFilterType('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'custom'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <T k="rolesFilterCustom" /> ({customRolesCount})
          </button>
        </div>
      </div>

      {/* ROLES GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card
              key={i}
              className="p-6 border border-border/40 bg-surface dark:bg-night-surface rounded-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="w-20 h-6 rounded-full" />
              </div>
              <Skeleton className="w-3/4 h-5 rounded mb-2" />
              <Skeleton className="w-1/2 h-4 rounded mb-4" />
              <Skeleton className="w-full h-12 rounded-xl" />
            </Card>
          ))}
        </div>
      ) : filteredRoles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center bg-surface dark:bg-night-surface rounded-2xl border border-border/40"
        >
          <div className="size-20 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-4">
            <ShieldCheck className="size-10" />
          </div>
          <h3 className="text-lg font-bold font-serif text-foreground mb-1">
            <T k="rolesNoRoles" />
          </h3>
          <p className="text-xs text-muted max-w-sm mb-6">
            <T k="rolesNoRolesDesc" />
          </p>
          <Button
            onPress={handleOpenCreate}
            className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-bold rounded-xl px-5"
          >
            <Plus className="size-4 mr-1.5" />
            <T k="rolesAddNew" />
          </Button>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          <AnimatePresence>
            {filteredRoles.map((role) => {
              const { grantedCount, total } = getRolePermissionStats(role.permissions);

              return (
                <motion.div key={role.id} variants={cardVariants} layout>
                  <Card className="group p-6 border border-border/40 bg-surface dark:bg-[#1A2030] rounded-2xl hover:border-brand-gold/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden">
                    {/* Decorative gradient blur in background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full blur-2xl pointer-events-none group-hover:bg-brand-gold/10 transition-colors" />

                    <div>
                      {/* Role Card Top Row */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`size-11 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 ${
                              role.is_system
                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-500'
                                : 'bg-sky-500/15 border-sky-500/30 text-sky-400'
                            }`}
                          >
                            {role.is_system ? (
                              <Lock className="size-5" />
                            ) : (
                              <ShieldCheck className="size-5" />
                            )}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <h3 className="text-base font-bold font-serif text-foreground truncate group-hover:text-brand-gold transition-colors">
                              {getRoleDisplayName(role, t)}
                            </h3>
                            <code className="text-[11px] font-mono text-brand-gold bg-brand-gold/10 border border-brand-gold/20 px-2 py-0.5 rounded w-fit mt-0.5">
                              {role.name}
                            </code>
                          </div>
                        </div>

                        {/* System / Custom Icon Badge with Tooltip */}
                        {role.is_system ? (
                          <Tooltip closeDelay={0}>
                            <Tooltip.Trigger>
                              <div className="size-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0 cursor-help transition-transform hover:scale-105">
                                <Lock className="size-3.5" />
                              </div>
                            </Tooltip.Trigger>
                            <Tooltip.Content>{t('rolesSystemBadge')}</Tooltip.Content>
                          </Tooltip>
                        ) : (
                          <Tooltip closeDelay={0}>
                            <Tooltip.Trigger>
                              <div className="size-7 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 cursor-help transition-transform hover:scale-105">
                                <Layers className="size-3.5" />
                              </div>
                            </Tooltip.Trigger>
                            <Tooltip.Content>{t('rolesCustomBadge')}</Tooltip.Content>
                          </Tooltip>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-muted leading-relaxed line-clamp-2 mb-4 min-h-[36px]">
                        {getRoleDescription(role, t)}
                      </p>

                      {/* Module Permission Indicator */}
                      <div className="p-3 rounded-xl bg-default/20 dark:bg-night-field border border-border/30 mb-4 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-muted">{t('rolesModuleAccess')}</span>
                          <span className="font-mono font-bold text-foreground">
                            {t('rolesActiveModulesCount', { granted: grantedCount, total })}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-default/40 dark:bg-night-surface rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-gold rounded-full transition-all duration-500"
                            style={{ width: `${(grantedCount / total) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/30 mt-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
                        <Users className="size-3.5 text-brand-gold" />
                        <span>
                          {role.user_count} {t('rolesUserAccounts')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* View Details */}
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          onPress={() => handleOpenDetail(role)}
                          className="text-muted hover:text-foreground hover:bg-default/50 rounded-lg"
                          aria-label={t('actionView')}
                        >
                          <Eye className="size-4" />
                        </Button>

                        {/* Edit Role */}
                        {canUpdate('roles') && (
                          <Button
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            onPress={() => handleOpenEdit(role)}
                            className="text-muted hover:text-brand-gold hover:bg-brand-gold/10 rounded-lg"
                            aria-label={t('actionEdit')}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}

                        {/* Delete Role */}
                        {!role.is_system && canDelete('roles') && (
                          <Button
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            onPress={() => handleOpenDelete(role)}
                            className="text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                            aria-label={t('actionDelete')}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* EDIT / CREATE ROLE MODAL */}
      <RoleFormModal
        isOpen={formModalOpen}
        onOpenChange={setFormModalOpen}
        editingRole={editingRole}
        modules={modules}
        onSave={handleSaveRole}
      />

      {/* ROLE DETAIL DRAWER */}
      <RoleDetailDrawer
        isOpen={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        role={selectedRole}
        modules={modules}
        onEditRole={handleOpenEdit}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <Modal.Backdrop isOpen={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <Modal.Container>
          <Modal.Dialog className="max-w-sm bg-surface dark:bg-[#1A2030] border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
            <Modal.CloseTrigger className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-default/50 cursor-pointer focus:outline-none" />

            <Modal.Body className="flex flex-col items-center text-center py-8 px-6 gap-4">
              <div className="size-14 rounded-2xl bg-rose-500/15 flex items-center justify-center text-rose-500 border border-rose-500/30">
                <AlertTriangle className="size-7" />
              </div>

              <div>
                <h3 className="text-lg font-bold font-serif text-foreground">
                  {t('rolesDeleteTitle')}
                </h3>
                <p className="text-xs text-muted leading-relaxed mt-1">{t('rolesDeleteDesc')}</p>
              </div>

              {deletingRole && (
                <div className="w-full flex flex-col items-center gap-1 bg-default/30 dark:bg-night-field p-3 rounded-xl border border-border/40">
                  <span className="text-xs font-bold text-foreground">
                    {getRoleDisplayName(deletingRole, t)}
                  </span>
                  <code className="text-[11px] font-mono text-brand-gold">{deletingRole.name}</code>

                  {deletingRole.user_count > 0 && (
                    <div className="mt-2 text-[11px] font-bold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                      ⚠️ {t('rolesAssignedUsersWarning', { count: deletingRole.user_count })}
                    </div>
                  )}
                </div>
              )}
            </Modal.Body>

            <Modal.Footer className="flex justify-center gap-2 pb-6 px-6">
              <Button
                variant="ghost"
                onPress={() => setDeleteModalOpen(false)}
                className="font-semibold text-xs"
              >
                {t('actionCancel')}
              </Button>

              <Button
                onPress={handleDeleteRole}
                isDisabled={deleting}
                className="bg-rose-500 text-white hover:bg-rose-600 font-bold text-xs min-w-[130px]"
              >
                {deleting ? (
                  <>
                    <Spinner size="sm" className="mr-1.5 text-white" />
                    {t('actionDelete')}...
                  </>
                ) : (
                  t('rolesDeleteConfirm')
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
