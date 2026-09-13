import { useState } from 'react';
import { Modal, Button, Spinner } from '@heroui/react';
import {
  Building2,
  Phone,
  Mail,
  FileText,
  Trash2,
  Pencil,
  Copy,
  Check,
  Package,
  Truck,
  DollarSign,
  Tag,
  AlertTriangle,
  Calendar,
  Clock,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { usePermissions } from '../../context/PermissionsContext';
import { api } from '../../services/api';
import type { Agent } from '../../types/agents';

export interface AgentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
  onEdit: (agent: Agent) => void;
  onDeleteSuccess: () => void;
  onAgentUpdated?: () => void;
}

export function AgentViewModal({
  isOpen,
  onClose,
  agent,
  onEdit,
  onDeleteSuccess,
  onAgentUpdated: _onAgentUpdated,
}: AgentViewModalProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canUpdate, canDelete } = usePermissions();

  const [copiedPhone, setCopiedPhone] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!agent) return null;

  const displayName =
    agent.display_name ||
    [agent.first_name, agent.last_name].filter(Boolean).join(' ') ||
    agent.company_name ||
    'Agent';

  const initials =
    agent.first_name || agent.last_name
      ? `${agent.first_name?.[0] || ''}${agent.last_name?.[0] || ''}`.toUpperCase()
      : agent.company_name
        ? agent.company_name.slice(0, 2).toUpperCase()
        : 'AG';

  const handleCopyPhone = (phoneNum: string) => {
    navigator.clipboard.writeText(phoneNum);
    setCopiedPhone(true);
    showNotification(t('clientPhoneCopied') || 'Phone number copied to clipboard', 'info');
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleDeleteAgent = async () => {
    setDeleting(true);
    try {
      const res = await api.agents.delete(agent.id);
      if (res.deactivated) {
        showNotification(
          t('agentDeactivatedNotice') ||
            'Agent has associated cargo shipments and was set to inactive status to protect data integrity.',
          'warning'
        );
      } else {
        showNotification(
          t('agentDeletedSuccess') || 'Shipping agent successfully deleted.',
          'success'
        );
      }
      setShowDeleteConfirm(false);
      onDeleteSuccess();
      onClose();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete shipping agent', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Modal.Container>
        <Modal.Dialog className="max-w-2xl w-full bg-surface text-foreground border border-border/30 shadow-2xl rounded-2xl overflow-hidden p-0">
          <Modal.CloseTrigger className="absolute top-4 right-4 p-2 rounded-xl text-muted hover:text-foreground hover:bg-default-100 dark:hover:bg-default-50/20 cursor-pointer focus:outline-none transition-colors z-10" />

          {/* Top Decorative Accent Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-brand-royal via-brand-gold to-brand-navy" />

          {/* Modal Header */}
          <Modal.Header className="px-6 py-5 border-b border-border/20 bg-gradient-to-b from-default-100/30 to-transparent flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white shadow-md text-lg shrink-0 bg-brand-navy border border-brand-gold/30">
              <span className="text-brand-gold">{initials}</span>
            </div>
            <div className="min-w-0 flex-1 pr-8">
              <Modal.Heading className="text-xl font-bold font-serif leading-tight text-foreground truncate">
                {displayName}
              </Modal.Heading>
              {agent.company_name && (
                <div className="flex items-center gap-1.5 mt-1 text-muted">
                  <Building2 className="size-3.5 text-brand-gold shrink-0" />
                  <span className="text-xs font-semibold truncate">{agent.company_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 mt-2.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    agent.is_active
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      agent.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <span>{agent.is_active ? t('statusActive') : t('statusInactive')}</span>
                </span>
              </div>
            </div>
          </Modal.Header>

          {/* Modal Body */}
          <Modal.Body className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Quick Contact Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {agent.phone_number ? (
                <a
                  href={`tel:${agent.phone_number}`}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-gold/15 hover:bg-brand-gold/25 text-brand-gold font-semibold text-xs transition-colors border border-brand-gold/30"
                >
                  <Phone className="size-4" />
                  <span>{t('agentCallAgent') || 'Call Agent'}</span>
                </a>
              ) : (
                <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-default-100/40 text-muted text-xs font-medium cursor-not-allowed border border-border/20">
                  <Phone className="size-4 opacity-50" />
                  <span>No Phone</span>
                </div>
              )}

              {agent.email ? (
                <a
                  href={`mailto:${agent.email}`}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-royal/10 hover:bg-brand-royal/20 text-brand-royal dark:text-brand-gold font-semibold text-xs transition-colors border border-brand-royal/20 dark:border-brand-gold/30"
                >
                  <Mail className="size-4" />
                  <span>{t('agentSendEmail') || 'Send Email'}</span>
                </a>
              ) : (
                <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-default-100/40 text-muted text-xs font-medium cursor-not-allowed border border-border/20">
                  <Mail className="size-4 opacity-50" />
                  <span>No Email</span>
                </div>
              )}
            </div>

            {/* Logistics & Accounts Payable KPI Cards */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                Logistics & Accounts Payable
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-surface border border-border/30 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-muted mb-1.5">
                    <Package className="size-3.5 text-brand-gold" />
                    <span className="text-[10px] font-semibold uppercase">Total Cargos</span>
                  </div>
                  <p className="text-xl font-bold font-serif text-foreground">
                    {agent.total_cargos_count ?? 0}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface border border-border/30 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-muted mb-1.5">
                    <Truck className="size-3.5 text-blue-500" />
                    <span className="text-[10px] font-semibold uppercase">Active Transit</span>
                  </div>
                  <p className="text-xl font-bold font-serif text-blue-600 dark:text-blue-400">
                    {agent.active_cargos_count ?? 0}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface border border-border/30 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-muted mb-1.5">
                    <DollarSign className="size-3.5 text-amber-500" />
                    <span className="text-[10px] font-semibold uppercase">Payable Debt</span>
                  </div>
                  <p className="text-xl font-bold font-serif text-amber-600 dark:text-amber-400 truncate">
                    ${(agent.total_payable_amount ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Details Panel */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-default-100/40 dark:bg-default-50/10 border border-border/30">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                {t('agentColContact') || 'Contact Information'}
              </h4>

              {/* Phone with copy */}
              {agent.phone_number ? (
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-foreground">
                    <Phone className="size-3.5 text-brand-gold shrink-0" />
                    <span className="font-mono font-semibold">{agent.phone_number}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPhone(agent.phone_number!)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-muted hover:text-foreground hover:bg-default-100 dark:hover:bg-default-50/20 cursor-pointer transition-colors"
                  >
                    {copiedPhone ? (
                      <>
                        <Check className="size-3 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Phone className="size-3.5 text-brand-gold shrink-0 opacity-40" />
                  <span className="italic">No phone number recorded</span>
                </div>
              )}

              {/* Email */}
              {agent.email ? (
                <div className="flex items-center justify-between gap-3 text-xs pt-1 border-t border-border/15">
                  <div className="flex items-center gap-2 text-foreground">
                    <Mail className="size-3.5 text-brand-gold shrink-0" />
                    <a
                      href={`mailto:${agent.email}`}
                      className="font-mono text-xs text-brand-royal dark:text-brand-gold hover:underline"
                    >
                      {agent.email}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted pt-1 border-t border-border/15">
                  <Mail className="size-3.5 text-brand-gold shrink-0 opacity-40" />
                  <span className="italic">No email recorded</span>
                </div>
              )}
            </div>

            {/* Company Aliases & Brand Names Panel */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-surface border border-border/30 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Tag className="size-3.5 text-brand-gold" />
                  <span>{t('agentAliases') || 'Company Aliases & Brand Names'}</span>
                </h4>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-default-100 dark:bg-default-50/20 text-muted">
                  {agent.company_names?.length || 0}
                </span>
              </div>

              {agent.company_names && agent.company_names.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {agent.company_names.map((alias, idx) => (
                    <span
                      key={`${alias}-${idx}`}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-royal/10 text-brand-royal dark:text-brand-gold border border-brand-royal/20 dark:border-brand-gold/20"
                    >
                      {alias}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted italic">
                  {t('agentNoAliases') || 'No aliases recorded for this agent.'}
                </p>
              )}
            </div>

            {/* Notes & Specialization */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-surface border border-border/30 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <FileText className="size-3.5 text-brand-gold" />
                <span>{t('agentNotes') || 'Notes & Specialization'}</span>
              </h4>
              {agent.notes ? (
                <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line">
                  {agent.notes}
                </p>
              ) : (
                <p className="text-xs text-muted italic">
                  {t('agentNoNotes') || 'No operational notes provided.'}
                </p>
              )}
            </div>

            {/* Timeline Info (UUID removed completely!) */}
            <div className="space-y-1.5 pt-2 border-t border-border/20 text-[11px] text-muted">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3" />
                  <span>Created:</span>
                </span>
                <span className="font-mono">{new Date(agent.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3" />
                  <span>Last Updated:</span>
                </span>
                <span className="font-mono">{new Date(agent.updated_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Delete Confirmation Box inside Modal */}
            {showDeleteConfirm && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3 animate-in fade-in">
                <div className="flex items-start gap-2.5 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="size-5 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold">{t('agentDeleteTitle') || 'Confirm Deletion'}</p>
                    <p className="text-muted leading-relaxed">
                      {t('agentDeleteDesc') ||
                        'Are you sure? If this agent has active cargo registrations or debt, the system will safely deactivate them instead of deleting.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => setShowDeleteConfirm(false)}
                    className="text-xs font-semibold rounded-lg"
                  >
                    {t('actionCancel') || 'Cancel'}
                  </Button>
                  <Button
                    size="sm"
                    isDisabled={deleting}
                    onPress={handleDeleteAgent}
                    className="text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-lg cursor-pointer"
                  >
                    {deleting ? <Spinner size="sm" /> : t('actionConfirm') || 'Confirm Delete'}
                  </Button>
                </div>
              </div>
            )}
          </Modal.Body>

          {/* Modal Footer */}
          <Modal.Footer className="px-6 py-4 border-t border-border/20 flex items-center justify-between bg-default-50/30">
            {canDelete('agents') ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2.5 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Delete or Deactivate Agent"
              >
                <Trash2 className="size-4" />
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3 ml-auto">
              <Button
                variant="ghost"
                onPress={handleClose}
                className="text-xs font-semibold rounded-xl"
              >
                {t('actionCancel') || 'Close'}
              </Button>
              {canUpdate('agents') && (
                <Button
                  onPress={() => {
                    handleClose();
                    onEdit(agent);
                  }}
                  className="bg-brand-royal text-white hover:bg-brand-royal/90 font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-transform active:scale-95 cursor-pointer"
                >
                  <Pencil className="size-3.5 mr-1.5" />
                  <span>{t('agentEdit') || 'Edit Agent'}</span>
                </Button>
              )}
            </div>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
