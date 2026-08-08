import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@heroui/react';
import {
  ShieldCheck,
  Lock,
  Sparkles,
  CheckCircle2,
  XCircle,
  Eye,
  PlusCircle,
  Edit3,
  Trash2,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import type {
  Role,
  SystemModule,
  RolePermissions,
  ModulePermissions,
} from '../../services/roles.service';

interface RoleFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingRole: Role | null;
  modules: SystemModule[];
  onSave: (roleData: {
    name: string;
    display_name: string;
    description: string;
    permissions: RolePermissions;
  }) => Promise<void>;
}

export function RoleFormModal({
  isOpen,
  onOpenChange,
  editingRole,
  modules,
  onSave,
}: RoleFormModalProps) {
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<RolePermissions>({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; display_name?: string }>({});

  // Populate form when modal opens or editingRole changes
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (editingRole) {
        setName(editingRole.name);
        setDisplayName(editingRole.display_name);
        setDescription(editingRole.description || '');
        setPermissions(JSON.parse(JSON.stringify(editingRole.permissions || {})));
      } else {
        setName('');
        setDisplayName('');
        setDescription('');
        // Initialize empty permissions matrix for all modules
        const initPerms: RolePermissions = {};
        modules.forEach((mod) => {
          initPerms[mod.module] = { create: false, read: true, update: false, delete: false };
        });
        setPermissions(initPerms);
      }
    }
  }, [isOpen, editingRole, modules]);

  // Toggle single action flag for a module
  const toggleAction = (
    moduleKey: string,
    action: 'create' | 'read' | 'update' | 'delete' | 'register_for_everyone'
  ) => {
    setPermissions((prev) => {
      const currentMod = prev[moduleKey] || {
        create: false,
        read: false,
        update: false,
        delete: false,
        register_for_everyone: false,
      };
      return {
        ...prev,
        [moduleKey]: {
          ...currentMod,
          [action]: !currentMod[action],
        },
      };
    });
  };

  // Grant all actions for a specific row
  const grantModuleRow = (moduleKey: string) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleKey]: {
        create: true,
        read: true,
        update: true,
        delete: true,
        ...(moduleKey === 'cargo_registrations' ? { register_for_everyone: true } : {}),
      },
    }));
  };

  // Revoke all actions for a specific row
  const revokeModuleRow = (moduleKey: string) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleKey]: {
        create: false,
        read: false,
        update: false,
        delete: false,
        ...(moduleKey === 'cargo_registrations' ? { register_for_everyone: false } : {}),
      },
    }));
  };

  // Presets
  const applyPreset = (preset: 'full' | 'readonly' | 'clear') => {
    const updated: RolePermissions = {};
    modules.forEach((mod) => {
      if (preset === 'full') {
        updated[mod.module] = {
          create: true,
          read: true,
          update: true,
          delete: true,
          ...(mod.module === 'cargo_registrations' ? { register_for_everyone: true } : {}),
        };
      } else if (preset === 'readonly') {
        updated[mod.module] = {
          create: false,
          read: true,
          update: false,
          delete: false,
          ...(mod.module === 'cargo_registrations' ? { register_for_everyone: false } : {}),
        };
      } else {
        updated[mod.module] = {
          create: false,
          read: false,
          update: false,
          delete: false,
          ...(mod.module === 'cargo_registrations' ? { register_for_everyone: false } : {}),
        };
      }
    });
    setPermissions(updated);
  };

  const handleSubmit = async () => {
    const newErrors: { name?: string; display_name?: string } = {};

    if (!editingRole) {
      if (!name.trim()) {
        newErrors.name = t('fieldRequired');
      } else if (!/^[A-Za-z0-9_\-\s]+$/.test(name)) {
        newErrors.name = t('rolesFieldNameHint');
      }
    }

    if (!displayName.trim()) {
      newErrors.display_name = t('fieldRequired');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim().toUpperCase().replace(/\s+/g, '_'),
        display_name: displayName.trim(),
        description: description.trim(),
        permissions,
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Save role error:', err);
    } finally {
      setSaving(false);
    }
  };

  const isSystemRole = editingRole?.is_system ?? false;
  const isCeoRole = editingRole?.name === 'CEO';

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container>
        <Modal.Dialog className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-surface dark:bg-[#1A2030] border border-border/50 rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-default/20 dark:bg-night-field">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-brand-gold/15 flex items-center justify-center text-brand-gold border border-brand-gold/30">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <Modal.Heading className="font-serif font-bold text-lg text-foreground">
                  {editingRole ? t('rolesEditRole') : t('rolesAddNew')}
                </Modal.Heading>
                <p className="text-xs text-muted">
                  {editingRole
                    ? `${editingRole.display_name} (${editingRole.name})`
                    : t('rolesSubtitle')}
                </p>
              </div>
            </div>
            <Modal.CloseTrigger className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-default/50 cursor-pointer focus:outline-none transition-colors" />
          </div>

          {/* Modal Content */}
          <Modal.Body className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
            {/* CEO Notice */}
            {isCeoRole && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs">
                <Sparkles className="size-4 shrink-0 mt-0.5" />
                <span>{t('rolesCeoWarning')}</span>
              </div>
            )}

            {/* Basic Info Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Machine Name */}
              <div className="flex flex-col gap-1.5 text-left">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {t('rolesFieldName')}
                  </label>
                  {isSystemRole && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      <Lock className="size-2.5" /> Locked System Name
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    disabled={isSystemRole}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value.toUpperCase());
                      setErrors((p) => ({ ...p, name: undefined }));
                    }}
                    placeholder="LOGISTICS_MGR"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-field text-field-foreground border transition-all focus:outline-none focus:ring-2 focus:ring-focus/30
                      ${isSystemRole ? 'opacity-60 cursor-not-allowed bg-default/40' : ''}
                      ${errors.name ? 'border-rose-500 focus:ring-rose-500/30' : 'border-field-border'}`}
                  />
                </div>
                <p
                  className={`text-[11px] ${errors.name ? 'text-rose-500 font-medium' : 'text-muted'}`}
                >
                  {errors.name ||
                    (isSystemRole ? t('rolesSystemRenameProhibited') : t('rolesFieldNameHint'))}
                </p>
              </div>

              {/* Display Name */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-foreground">
                  {t('rolesFieldDisplayName')}
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setErrors((p) => ({ ...p, display_name: undefined }));
                  }}
                  placeholder="Logistics & Cargo Manager"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-field text-field-foreground border transition-all focus:outline-none focus:ring-2 focus:ring-focus/30
                    ${errors.display_name ? 'border-rose-500 focus:ring-rose-500/30' : 'border-field-border'}`}
                />
                <p
                  className={`text-[11px] ${errors.display_name ? 'text-rose-500 font-medium' : 'text-muted'}`}
                >
                  {errors.display_name || t('rolesFieldDisplayNameHint')}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-foreground">
                {t('rolesFieldDescription')}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Scope and administrative privileges notes..."
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-field text-field-foreground border border-field-border transition-all focus:outline-none focus:ring-2 focus:ring-focus/30"
              />
            </div>

            {/* Permission Matrix Header & Quick Presets */}
            <div className="flex flex-col gap-3 border-t border-border/40 pt-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2 font-serif">
                    <span>{t('rolesMatrixHeading')}</span>
                    <span className="text-[10px] font-sans font-bold text-brand-gold bg-brand-gold/15 px-2 py-0.5 rounded-full border border-brand-gold/30">
                      {modules.length} Modules
                    </span>
                  </h4>
                  <p className="text-[11px] text-muted">{t('rolesMatrixSubtitle')}</p>
                </div>

                {/* Preset Controls */}
                <div className="flex items-center gap-1.5 bg-default/40 dark:bg-night-field p-1 rounded-xl border border-border/40 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => applyPreset('full')}
                    className="px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer focus:outline-none"
                  >
                    {t('rolesPresetFull')}
                  </button>
                  <div className="w-[1px] h-3 bg-border/60" />
                  <button
                    type="button"
                    onClick={() => applyPreset('readonly')}
                    className="px-2.5 py-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors cursor-pointer focus:outline-none"
                  >
                    {t('rolesPresetReadOnly')}
                  </button>
                  <div className="w-[1px] h-3 bg-border/60" />
                  <button
                    type="button"
                    onClick={() => applyPreset('clear')}
                    className="px-2.5 py-1 text-[11px] font-semibold text-muted hover:text-foreground hover:bg-default/60 rounded-lg transition-colors cursor-pointer focus:outline-none flex items-center gap-1"
                  >
                    <RotateCcw className="size-3" />
                    {t('rolesPresetClear')}
                  </button>
                </div>
              </div>

              {/* Permission Matrix Table */}
              <div className="border border-border/40 rounded-xl overflow-hidden bg-surface dark:bg-night-field">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-default/30 dark:bg-night-surface border-b border-border/40 text-muted font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4 min-w-[200px]">{t('rolesSystemModuleHeader')}</th>
                        <th className="py-3 px-2 text-center min-w-[80px]">
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <PlusCircle className="size-3" /> {t('rolesActionCreate')}
                          </span>
                        </th>
                        <th className="py-3 px-2 text-center min-w-[80px]">
                          <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400">
                            <Eye className="size-3" /> {t('rolesActionRead')}
                          </span>
                        </th>
                        <th className="py-3 px-2 text-center min-w-[80px]">
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <Edit3 className="size-3" /> {t('rolesActionUpdate')}
                          </span>
                        </th>
                        <th className="py-3 px-2 text-center min-w-[80px]">
                          <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                            <Trash2 className="size-3" /> {t('rolesActionDelete')}
                          </span>
                        </th>
                        <th className="py-3 px-3 text-right min-w-[110px]">
                          {t('rolesRowActions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {modules.map((mod) => {
                        const modPerms: ModulePermissions = permissions[mod.module] || {
                          create: false,
                          read: false,
                          update: false,
                          delete: false,
                        };
                        const allGranted =
                          modPerms.create && modPerms.read && modPerms.update && modPerms.delete;
                        const noneGranted =
                          !modPerms.create &&
                          !modPerms.read &&
                          !modPerms.update &&
                          !modPerms.delete;

                        return (
                          <tr
                            key={mod.module}
                            className="hover:bg-default/20 dark:hover:bg-night-surface/50 transition-colors"
                          >
                            {/* Module Name */}
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground text-xs">
                                  {mod.module === 'cargo_registrations'
                                    ? t('tabTransactions') || mod.label
                                    : mod.label}
                                </span>
                                <code className="text-[10px] text-muted font-mono">
                                  {mod.module}
                                </code>
                                {mod.module === 'cargo_registrations' && (
                                  <div className="mt-2 pt-1.5 border-t border-border/30">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleAction(mod.module, 'register_for_everyone')
                                      }
                                      className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                        modPerms.register_for_everyone
                                          ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/40 shadow-xs'
                                          : 'bg-default/20 text-muted/60 border border-border/30 hover:border-purple-500/30'
                                      }`}
                                      title={t('rolesRegisterForEveryoneDesc')}
                                    >
                                      <span>{modPerms.register_for_everyone ? '✓' : '✕'}</span>
                                      <span>{t('rolesRegisterForEveryone')}</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Create Flag */}
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => toggleAction(mod.module, 'create')}
                                className={`size-7 rounded-lg border flex items-center justify-center mx-auto transition-all cursor-pointer focus:outline-none ${
                                  modPerms.create
                                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 scale-105'
                                    : 'bg-default/20 border-border/40 text-muted/40 hover:border-emerald-500/30'
                                }`}
                              >
                                {modPerms.create ? (
                                  <Check className="size-4 stroke-[3]" />
                                ) : (
                                  <span className="text-[10px]">✕</span>
                                )}
                              </button>
                            </td>

                            {/* Read Flag */}
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => toggleAction(mod.module, 'read')}
                                className={`size-7 rounded-lg border flex items-center justify-center mx-auto transition-all cursor-pointer focus:outline-none ${
                                  modPerms.read
                                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-600 dark:text-sky-400 scale-105'
                                    : 'bg-default/20 border-border/40 text-muted/40 hover:border-sky-500/30'
                                }`}
                              >
                                {modPerms.read ? (
                                  <Check className="size-4 stroke-[3]" />
                                ) : (
                                  <span className="text-[10px]">✕</span>
                                )}
                              </button>
                            </td>

                            {/* Update Flag */}
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => toggleAction(mod.module, 'update')}
                                className={`size-7 rounded-lg border flex items-center justify-center mx-auto transition-all cursor-pointer focus:outline-none ${
                                  modPerms.update
                                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-600 dark:text-amber-400 scale-105'
                                    : 'bg-default/20 border-border/40 text-muted/40 hover:border-amber-500/30'
                                }`}
                              >
                                {modPerms.update ? (
                                  <Check className="size-4 stroke-[3]" />
                                ) : (
                                  <span className="text-[10px]">✕</span>
                                )}
                              </button>
                            </td>

                            {/* Delete Flag */}
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => toggleAction(mod.module, 'delete')}
                                className={`size-7 rounded-lg border flex items-center justify-center mx-auto transition-all cursor-pointer focus:outline-none ${
                                  modPerms.delete
                                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-600 dark:text-rose-400 scale-105'
                                    : 'bg-default/20 border-border/40 text-muted/40 hover:border-rose-500/30'
                                }`}
                              >
                                {modPerms.delete ? (
                                  <Check className="size-4 stroke-[3]" />
                                ) : (
                                  <span className="text-[10px]">✕</span>
                                )}
                              </button>
                            </td>

                            {/* Row Grant / Revoke Shortcuts */}
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  disabled={allGranted}
                                  onClick={() => grantModuleRow(mod.module)}
                                  className={`p-1.5 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                                    allGranted
                                      ? 'text-muted/30 cursor-not-allowed'
                                      : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                                  }`}
                                  title={t('rolesGrantAll')}
                                >
                                  <CheckCircle2 className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={noneGranted}
                                  onClick={() => revokeModuleRow(mod.module)}
                                  className={`p-1.5 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                                    noneGranted
                                      ? 'text-muted/30 cursor-not-allowed'
                                      : 'text-rose-500 hover:bg-rose-500/10'
                                  }`}
                                  title={t('rolesRevokeAll')}
                                >
                                  <XCircle className="size-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Modal.Body>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/40 bg-default/20 dark:bg-night-field">
            <Button
              variant="ghost"
              onPress={() => onOpenChange(false)}
              className="font-semibold text-xs"
            >
              {t('actionCancel')}
            </Button>
            <Button
              onPress={handleSubmit}
              isDisabled={saving}
              className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-bold px-6 text-xs min-w-[110px]"
            >
              {saving ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  {t('actionSaving')}
                </>
              ) : editingRole ? (
                t('actionSave')
              ) : (
                t('actionCreate')
              )}
            </Button>
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
