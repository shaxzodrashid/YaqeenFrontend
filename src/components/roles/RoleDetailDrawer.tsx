import { Modal, Button } from '@heroui/react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  Users,
  Calendar,
  PlusCircle,
  Eye,
  Edit3,
  Trash2,
  Pencil,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import type { Role, SystemModule } from '../../services/roles.service';

interface RoleDetailDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  modules: SystemModule[];
  onEditRole?: (role: Role) => void;
}

export function RoleDetailDrawer({
  isOpen,
  onOpenChange,
  role,
  modules,
  onEditRole,
}: RoleDetailDrawerProps) {
  const { t } = useTranslation();

  if (!role) return null;

  // Calculate permission statistics
  let totalPossibleActions = modules.length * 4;
  let activeActionsCount = 0;

  modules.forEach((mod) => {
    const p = role.permissions?.[mod.module];
    if (p) {
      if (p.create) activeActionsCount++;
      if (p.read) activeActionsCount++;
      if (p.update) activeActionsCount++;
      if (p.delete) activeActionsCount++;
    }
  });

  const percentageGranted =
    totalPossibleActions > 0
      ? Math.round((activeActionsCount / totalPossibleActions) * 100)
      : 0;

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container>
        <Modal.Dialog className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-surface dark:bg-[#1A2030] border border-border/50 rounded-2xl shadow-2xl">
          
          {/* Top Banner */}
          <div className="p-6 bg-gradient-to-r from-brand-navy via-brand-royal to-brand-navy dark:from-[#111827] dark:via-[#1E293B] dark:to-[#0F172A] text-white relative">
            <Modal.CloseTrigger className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 cursor-pointer focus:outline-none transition-colors" />

            <div className="flex items-start gap-4">
              <div
                className={`size-12 rounded-2xl flex items-center justify-center border shadow-lg shrink-0 ${
                  role.is_system
                    ? 'bg-brand-gold/20 border-brand-gold/40 text-brand-gold'
                    : 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                }`}
              >
                <ShieldCheck className="size-6" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold font-serif truncate">{role.display_name}</h3>
                  <code className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-brand-gold">
                    {role.name}
                  </code>
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs text-neutral-300 flex-wrap">
                  {role.is_system ? (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-400/30">
                      <Lock className="size-3" /> {t('rolesSystemBadge')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-sky-300 bg-sky-500/20 px-2 py-0.5 rounded-md border border-sky-400/30">
                      {t('rolesCustomBadge')}
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 font-semibold text-neutral-300">
                    <Users className="size-3.5 text-brand-gold" />
                    {role.user_count} {t('rolesAssignedUsers')}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {role.description && (
              <p className="text-xs text-neutral-300 mt-3.5 italic bg-white/5 p-2.5 rounded-xl border border-white/10 leading-relaxed">
                "{role.description}"
              </p>
            )}
          </div>

          {/* Body Content */}
          <Modal.Body className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            
            {/* Granted Actions Gauge & Stat */}
            <div className="p-4 rounded-xl bg-default/20 dark:bg-night-field border border-border/40 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">{t('rolesCoverage')}</span>
                <span className="font-mono font-bold text-brand-gold">{percentageGranted}%</span>
              </div>
              <div className="w-full h-2.5 bg-default/40 dark:bg-night-surface rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentageGranted}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-brand-gold to-amber-500 rounded-full"
                />
              </div>
              <p className="text-[11px] text-muted">
                {t('rolesExplicitCrudGranted', { granted: activeActionsCount, total: totalPossibleActions })}
              </p>
            </div>

            {/* Module Breakdown Grid */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted font-mono">
                {t('rolesMatrixHeading')}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {modules.map((mod) => {
                  const p = role.permissions?.[mod.module] || {
                    create: false,
                    read: false,
                    update: false,
                    delete: false,
                  };

                  return (
                    <div
                      key={mod.module}
                      className="p-3.5 rounded-xl border border-border/40 bg-surface dark:bg-night-field flex flex-col justify-between gap-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          {mod.module === 'cargo_registrations' ? t('tabTransactions') || mod.label : mod.label}
                        </span>
                        <code className="text-[10px] font-mono text-muted">{mod.module}</code>
                      </div>

                      {/* Action Badges */}
                      <div className="grid grid-cols-4 gap-1.5 text-center">
                        <div
                          className={`py-1 px-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 border ${
                            p.create
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                              : 'bg-default/20 border-border/30 text-muted/40'
                          }`}
                        >
                          <PlusCircle className="size-2.5" />
                          <span>{t('rolesActionCreate')}</span>
                        </div>

                        <div
                          className={`py-1 px-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 border ${
                            p.read
                              ? 'bg-sky-500/15 border-sky-500/30 text-sky-600 dark:text-sky-400'
                              : 'bg-default/20 border-border/30 text-muted/40'
                          }`}
                        >
                          <Eye className="size-2.5" />
                          <span>{t('rolesActionRead')}</span>
                        </div>

                        <div
                          className={`py-1 px-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 border ${
                            p.update
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                              : 'bg-default/20 border-border/30 text-muted/40'
                          }`}
                        >
                          <Edit3 className="size-2.5" />
                          <span>{t('rolesActionUpdate')}</span>
                        </div>

                        <div
                          className={`py-1 px-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 border ${
                            p.delete
                              ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                              : 'bg-default/20 border-border/30 text-muted/40'
                          }`}
                        >
                          <Trash2 className="size-2.5" />
                          <span>{t('rolesActionDelete')}</span>
                        </div>
                      </div>

                      {/* Special Permission for Cargo Registrations */}
                      {mod.module === 'cargo_registrations' && (
                        <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[10px]">
                          <span className="text-muted font-medium">{t('rolesRegisterForEveryone')}</span>
                          <span
                            className={`px-2 py-0.5 rounded font-bold border ${
                              p.register_for_everyone
                                ? 'bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-300'
                                : 'bg-default/20 border-border/30 text-muted/40'
                            }`}
                          >
                            {p.register_for_everyone ? 'Granted' : 'Off'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timestamps */}
            <div className="flex items-center justify-between text-[11px] text-muted border-t border-border/40 pt-4">
              <span className="flex items-center gap-1">
                <Calendar className="size-3" /> {formatDate(role.created_at)}
              </span>
              <span>{formatDate(role.updated_at)}</span>
            </div>
          </Modal.Body>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/40 bg-default/20 dark:bg-night-field">
            <Button variant="ghost" onPress={() => onOpenChange(false)} className="font-semibold text-xs">
              {t('actionClose')}
            </Button>
            {onEditRole && (
              <Button
                onPress={() => {
                  onOpenChange(false);
                  onEditRole(role);
                }}
                className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-bold px-5 text-xs"
              >
                <Pencil className="size-3.5 mr-1.5" />
                {t('rolesEditRole')}
              </Button>
            )}
          </div>

        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
