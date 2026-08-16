import { useEffect, useState, useRef } from 'react';
import { Button, Drawer, Spinner } from '@heroui/react';
import {
  User,
  Building,
  Phone,
  MapPin,
  Palette,
  Paperclip,
  Download,
  Trash2,
  Pencil,
  Plus,
  FileText,
  Check,
  Copy,
  ShieldAlert,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { usePermissions } from '../context/PermissionsContext';
import { api } from '../services/api';
import type { Client, Attachment, Employee } from '../services/api';

export interface ClientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  employees: Employee[];
  onEdit: (client: Client) => void;
  onDeleteSuccess: () => void;
  onClientUpdated: () => void;
}

export function ClientDrawer({
  isOpen,
  onClose,
  client,
  employees: _employees,
  onEdit,
  onDeleteSuccess,
  onClientUpdated,
}: ClientDrawerProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canCreate, canUpdate, canDelete } = usePermissions();

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingAttId, setDeletingAttId] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingClient, setDeletingClient] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load attachments when drawer opens or client changes
  useEffect(() => {
    if (isOpen && client) {
      fetchAttachments(client.id);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, client]);

  const fetchAttachments = async (clientId: string) => {
    setLoadingAttachments(true);
    try {
      const list = await api.attachments.listForEntity('client', clientId);
      setAttachments(list || []);
    } catch (err) {
      console.error('Failed to load attachments:', err);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleCopyPhone = (phoneNum: string) => {
    navigator.clipboard.writeText(phoneNum);
    setCopiedPhone(true);
    showNotification('Phone number copied to clipboard', 'info');
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !client) return;

    setUploading(true);
    try {
      await api.attachments.upload(file, 'client', client.id);
      showNotification(t('successDocUploaded') || 'Document uploaded successfully', 'success');
      fetchAttachments(client.id);
      onClientUpdated();
    } catch (err: any) {
      showNotification(err?.message || t('errorDocUpload') || 'Failed to upload document', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    setDownloadingId(attachment.id);
    try {
      const blob = await api.attachments.download(attachment.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      showNotification(t('errorDocDownload') || 'Failed to download file', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    setDeletingAttId(id);
    try {
      await api.attachments.delete(id);
      showNotification(t('successDocDeleted') || 'Document deleted', 'success');
      if (client) fetchAttachments(client.id);
      onClientUpdated();
    } catch (err) {
      showNotification(t('errorDocDelete') || 'Failed to delete file', 'error');
    } finally {
      setDeletingAttId(null);
    }
  };

  const handleDeleteClient = async () => {
    if (!client) return;
    setDeletingClient(true);
    try {
      await api.clients.delete(client.id);
      showNotification('Client deleted successfully', 'success');
      onDeleteSuccess();
      onClose();
    } catch (err: any) {
      if (err?.location === 'permission_denied_for_other_employees') {
        showNotification(
          t('errorClientOtherEmployee') || 'You can only view and manage clients assigned to you.',
          'error'
        );
      } else if (err?.location === 'client_not_found') {
        showNotification(t('errorClientNotFound') || 'Client not found', 'error');
      } else {
        showNotification(err?.message || 'Failed to delete client', 'error');
      }
    } finally {
      setDeletingClient(false);
    }
  };

  if (!client) return null;

  const effectiveColor = client.effective_color || '#808080';

  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Content placement="right" className="w-full max-w-lg h-full">
        <Drawer.Dialog className="h-full flex flex-col bg-surface text-foreground shadow-2xl border-l border-border/20">
          <Drawer.CloseTrigger className="absolute top-4 right-4 p-2 rounded-xl text-muted hover:text-foreground hover:bg-default/20 cursor-pointer focus:outline-none transition-colors z-10">
            <X className="size-5" />
          </Drawer.CloseTrigger>

          {/* Drawer Header with glowing color bar */}
          <Drawer.Header className="px-6 py-6 border-b border-border/25 relative overflow-hidden bg-gradient-to-b from-default-100/40 to-transparent">
            <div
              className="absolute top-0 left-0 right-0 h-1.5 transition-colors duration-300"
              style={{
                backgroundColor: effectiveColor,
                boxShadow: `0 2px 12px ${effectiveColor}80`,
              }}
            />

            <div className="flex items-start justify-between gap-4 mt-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md text-lg shrink-0"
                  style={{ backgroundColor: effectiveColor }}
                >
                  {client.first_name[0]?.toUpperCase()}
                  {client.last_name[0]?.toUpperCase()}
                </div>
                <div>
                  <Drawer.Heading className="text-xl font-bold font-serif leading-tight">
                    {client.first_name} {client.last_name}
                  </Drawer.Heading>
                  <div className="flex items-center gap-2 mt-1">
                    <Building className="size-3.5 text-brand-gold" />
                    <span className="text-sm font-semibold text-muted">{client.company_name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Badges bar */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  client.is_active
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                }`}
              >
                {client.is_active ? t('statusActive') : t('statusInactive')}
              </span>

              {/* Color Tag Badge */}
              <div className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-default/30 border border-border/30">
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-sm"
                  style={{ backgroundColor: effectiveColor }}
                />
                <span className="font-mono font-medium">{effectiveColor.toUpperCase()}</span>
                <span className="text-[10px] opacity-70">
                  {client.assigned_employee
                    ? `(${t('clientInheritedColor') || 'Inherited'})`
                    : `(${t('clientDefaultColor') || 'Unassigned Gray'})`}
                </span>
              </div>
            </div>
          </Drawer.Header>

          {/* Drawer Body */}
          <Drawer.Body className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`tel:${client.phone}`}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-gold/15 hover:bg-brand-gold/25 text-brand-gold font-semibold text-sm transition-colors"
              >
                <Phone className="size-4" />
                <span>Call Client</span>
              </a>
              <button
                type="button"
                onClick={() => handleCopyPhone(client.phone)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-border/20 hover:bg-border/35 text-foreground font-semibold text-sm transition-colors cursor-pointer"
              >
                {copiedPhone ? (
                  <Check className="size-4 text-emerald-500" />
                ) : (
                  <Copy className="size-4" />
                )}
                <span>{copiedPhone ? 'Copied!' : 'Copy Phone'}</span>
              </button>
            </div>

            {/* Contact Details Card */}
            <div className="p-4 rounded-2xl bg-default-100/50 dark:bg-default-50/10 border border-border/30 space-y-3">
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider">
                Contact Information
              </h4>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted flex items-center gap-2">
                  <Phone className="size-4 text-brand-gold" />
                  {t('fieldPhone')}
                </span>
                <span className="font-mono font-semibold">{client.phone}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted flex items-center gap-2">
                  <Building className="size-4 text-brand-gold" />
                  {t('clientCompany')}
                </span>
                <span className="font-semibold">{client.company_name}</span>
              </div>

              {client.address && (
                <div className="flex items-start justify-between text-sm pt-2 border-t border-border/20">
                  <span className="text-muted flex items-center gap-2">
                    <MapPin className="size-4 text-brand-gold shrink-0 mt-0.5" />
                    {t('fieldAddress')}
                  </span>
                  <span className="font-medium text-right max-w-[200px]">{client.address}</span>
                </div>
              )}
            </div>

            {/* Responsible Employee Card */}
            <div className="p-4 rounded-2xl bg-default-100/50 dark:bg-default-50/10 border border-border/30 space-y-3">
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider">
                {t('clientAssignedTo')}
              </h4>

              {client.assigned_employee ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm"
                      style={{ backgroundColor: client.assigned_employee.color || '#808080' }}
                    >
                      {client.assigned_employee.first_name[0]}
                      {client.assigned_employee.last_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold">
                        {client.assigned_employee.first_name} {client.assigned_employee.last_name}
                      </p>
                      <p className="text-xs font-mono text-muted">
                        {client.assigned_employee.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="size-3 rounded-full shadow-sm"
                      style={{ backgroundColor: client.assigned_employee.color || '#808080' }}
                    />
                    <span className="text-[11px] font-mono text-muted">
                      {client.assigned_employee.color || '#808080'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted italic">
                  <User className="size-4" />
                  <span>Unassigned (Default Gray #808080)</span>
                </div>
              )}
            </div>

            {/* Color Pipeline Logic Info */}
            <div className="p-4 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-brand-gold">
                <Palette className="size-4" />
                <span>Color Pipeline Breakdown</span>
              </div>
              <p className="text-muted leading-relaxed">
                {client.assigned_employee ? (
                  <>
                    This client is <strong>inheriting color tag</strong> (
                    {client.assigned_employee.color}) from responsible employee{' '}
                    <strong>
                      {client.assigned_employee.first_name} {client.assigned_employee.last_name}
                    </strong>
                    .
                  </>
                ) : (
                  <>
                    No responsible employee assigned. Automatically defaulted to{' '}
                    <strong>Unassigned Gray (#808080)</strong>.
                  </>
                )}
              </p>
            </div>

            {/* Attachments & Passports Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="size-4 text-brand-gold" />
                  <h4 className="text-sm font-bold">
                    {t('clientAttachments') || 'Attachments & Documents'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold text-xs font-bold">
                    {attachments.length}
                  </span>
                </div>

                {canCreate('attachments') && (
                  <>
                    <Button
                      size="sm"
                      isDisabled={uploading}
                      onPress={() => fileInputRef.current?.click()}
                      className="bg-brand-gold text-brand-navy font-bold text-xs hover:bg-brand-gold/90"
                    >
                      {uploading ? (
                        <>
                          <Spinner size="sm" className="mr-1" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Plus className="size-3.5 mr-1" />
                          Upload File
                        </>
                      )}
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,application/pdf,.doc,.docx"
                    />
                  </>
                )}
              </div>

              {loadingAttachments ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : attachments.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-border/40 text-center space-y-2 bg-default-50/20">
                  <FileText className="size-8 mx-auto text-muted opacity-50" />
                  <p className="text-xs text-muted font-medium">
                    No attached documents or passports
                  </p>
                  <p className="text-[11px] text-muted/70">
                    Click 'Upload File' above to attach client identity cards, contracts, or photos.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attachments.map((att) => {
                    const isImg = att.mime_type?.startsWith('image/');
                    return (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-default-100/60 dark:bg-default-50/10 border border-border/30 hover:border-brand-gold/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                          <div className="p-2 rounded-lg bg-brand-gold/15 text-brand-gold shrink-0">
                            {isImg ? (
                              <ImageIcon className="size-4" />
                            ) : (
                              <FileText className="size-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate text-foreground">
                              {att.file_name}
                            </p>
                            <p className="text-[10px] text-muted uppercase tracking-wider">
                              {att.mime_type || 'Document'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDownload(att)}
                            disabled={downloadingId === att.id}
                            className="p-1.5 rounded-lg text-muted hover:text-brand-gold hover:bg-brand-gold/10 transition-colors cursor-pointer"
                            title="Download document"
                          >
                            {downloadingId === att.id ? (
                              <Spinner size="sm" />
                            ) : (
                              <Download className="size-4" />
                            )}
                          </button>

                          {canDelete('attachments') && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(att.id)}
                              disabled={deletingAttId === att.id}
                              className="p-1.5 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete document"
                            >
                              {deletingAttId === att.id ? (
                                <Spinner size="sm" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Danger Zone: Delete Confirmation */}
            {showDeleteConfirm ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
                  <ShieldAlert className="size-4 shrink-0" />
                  <span>{t('clientDeleteTitle') || 'Delete Client Record'}</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  {t('clientDeleteDesc') ||
                    'Are you sure you want to delete this client? Attached documents and history will be permanently removed.'}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => setShowDeleteConfirm(false)}
                    className="flex-1 font-semibold text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    isDisabled={deletingClient}
                    onPress={handleDeleteClient}
                    className="flex-1 font-bold text-xs bg-rose-600 text-white hover:bg-rose-700"
                  >
                    {deletingClient ? <Spinner size="sm" /> : 'Confirm Delete'}
                  </Button>
                </div>
              </div>
            ) : null}
          </Drawer.Body>

          {/* Drawer Footer Actions */}
          <Drawer.Footer className="px-6 py-4 border-t border-border/25 flex items-center justify-between gap-3 shrink-0 bg-surface">
            {canDelete('clients') ? (
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setShowDeleteConfirm(true)}
                className="font-semibold text-rose-500 hover:bg-rose-500/10"
              >
                <Trash2 className="size-4 mr-1" />
                Delete
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onPress={onClose} className="font-semibold">
                Close
              </Button>
              {canUpdate('clients') && (
                <Button
                  size="sm"
                  onPress={() => {
                    onClose();
                    onEdit(client);
                  }}
                  className="bg-brand-gold text-brand-navy font-bold hover:bg-brand-gold/90"
                >
                  <Pencil className="size-4 mr-1" />
                  Edit Client
                </Button>
              )}
            </div>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
