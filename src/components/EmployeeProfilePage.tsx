import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, Button, Avatar, Chip, Spinner } from '@heroui/react';
import {
  ArrowLeft, Pencil, Phone, MapPin, Building,
  DollarSign, Calendar, ShieldCheck, FileText,
  Upload, FolderOpen, FileSpreadsheet, FileImage,
  File, Download, Trash2, Camera
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { usePermissions } from '../context/PermissionsContext';
import { api, tokenStore, getImageUrl, formatMoney } from '../services/api';
import type { Employee, Department, ApiError, Attachment, SupportedCurrency } from '../services/api';
import { T } from './T';

interface EmployeeProfilePageProps {
  employee?: Employee; // Optional: If passed, we view this employee
  departments: Department[];
  onBack?: () => void; // Optional: For admin back button
  onEdit?: (emp: Employee) => void; // Optional: For admin edit button
}

export function EmployeeProfilePage({
  employee: initialEmployee,
  departments,
  onBack,
  onEdit,
}: EmployeeProfilePageProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [employee, setEmployee] = useState<Employee | null>(initialEmployee || null);
  const [loading, setLoading] = useState(!initialEmployee);

  const isAdminView = !!onBack;

  const currentUser = tokenStore.getUser();
  const isManager = currentUser?.role === 'CEO' || currentUser?.role === 'ROP';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pictureInputRef = useRef<HTMLInputElement>(null);
  const lastFetchedIdRef = useRef<string | null>(null);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [deletingPicture, setDeletingPicture] = useState(false);

  const fetchAttachments = useCallback(async (empId: string) => {
    try {
      setAttachmentsLoading(true);
      const data = await api.attachments.listForEntity('employee', empId);
      setAttachments(data);
    } catch (err) {
      console.error('Failed to load attachments:', err);
    } finally {
      setAttachmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (employee?.id && lastFetchedIdRef.current !== employee.id) {
      lastFetchedIdRef.current = employee.id;
      fetchAttachments(employee.id);
    }
  }, [employee?.id, fetchAttachments]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employee?.id) return;

    setUploading(true);
    try {
      await api.attachments.upload(file, 'employee', employee.id);
      showNotification(t('successDocUploaded'), 'success');
      fetchAttachments(employee.id);
    } catch (err) {
      const error = err as ApiError;
      showNotification(t(error?.location || 'errorDocUpload'), 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePictureUploadClick = () => {
    pictureInputRef.current?.click();
  };

  const handlePictureFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employee?.id) return;

    if (file.size > 5 * 1024 * 1024) {
      showNotification(t('file_too_large'), 'error');
      if (pictureInputRef.current) pictureInputRef.current.value = '';
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      showNotification(t('invalid_image_type'), 'error');
      if (pictureInputRef.current) pictureInputRef.current.value = '';
      return;
    }

    setUploadingPicture(true);
    try {
      const updated = !initialEmployee
        ? await api.employees.uploadMyPicture(file)
        : await api.employees.uploadPicture(employee.id, file);
      setEmployee(updated);
      showNotification(t('successPictureUploaded'), 'success');
      window.dispatchEvent(new Event('yaqeen_profile_updated'));
    } catch (err) {
      const error = err as ApiError;
      showNotification(t(error?.location || 'internal_error'), 'error');
    } finally {
      setUploadingPicture(false);
      if (pictureInputRef.current) pictureInputRef.current.value = '';
    }
  };

  const handleDeletePicture = async () => {
    if (!employee?.id) return;
    setDeletingPicture(true);
    try {
      const updated = !initialEmployee
        ? await api.employees.deleteMyPicture()
        : await api.employees.deletePicture(employee.id);
      setEmployee(updated);
      showNotification(t('successPictureDeleted'), 'success');
      window.dispatchEvent(new Event('yaqeen_profile_updated'));
    } catch (err) {
      const error = err as ApiError;
      showNotification(t(error?.location || 'internal_error'), 'error');
    } finally {
      setDeletingPicture(false);
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    setDownloadingId(attachment.id);
    try {
      const blob = await api.attachments.download(attachment.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      showNotification(t('errorDocDownload'), 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!employee?.id) return;
    setDeletingId(attachmentId);
    try {
      await api.attachments.delete(attachmentId);
      showNotification(t('successDocDeleted'), 'success');
      fetchAttachments(employee.id);
    } catch {
      showNotification(t('errorDocDelete'), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (initialEmployee) {
      setEmployee(initialEmployee);
      setLoading(false);
      return;
    }

    // If no initial employee, load the current logged-in employee ("me")
    const fetchMe = async () => {
      try {
        setLoading(true);
        const data = await api.employees.me();
        setEmployee(data);
      } catch (err) {
        const error = err as ApiError;
        showNotification(t(error?.location || 'employee_profile_missing'), 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [initialEmployee, showNotification, t]);

  const getDeptDisplayName = (deptId?: string) => {
    if (!deptId) return '—';
    const dept = departments.find((d) => d.id === deptId);
    return dept?.display_name || employee?.department_display_name || employee?.department_name || '—';
  };

  const formatSalary = (salary?: string, currency: SupportedCurrency = 'UZS') => {
    if (!salary) return '—';
    const num = parseFloat(salary);
    if (isNaN(num)) return '—';
    return formatMoney(num, currency);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Spinner size="lg" className="text-brand-gold" />
        <span className="text-sm text-muted font-medium">Loading profile...</span>
      </div>
    );
  }

  if (!employee) {
    return (
      <Card className="p-8 border border-border/40 bg-surface rounded-2xl text-center">
        <h3 className="text-base font-bold text-foreground mb-1">{t('employee_profile_missing')}</h3>
        {onBack && (
          <Button onPress={onBack} variant="ghost" className="mt-4">
            <ArrowLeft className="size-4 mr-2" />
            {t('actionBack')}
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header / Back Action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              isIconOnly
              variant="ghost"
              onPress={onBack}
              className="text-muted hover:text-foreground hover:bg-default/50 rounded-xl"
            >
              <ArrowLeft className="size-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold font-serif text-foreground"><T k="profileTitle" /></h1>
            <p className="text-sm text-muted mt-0.5">
              {employee.first_name} {employee.last_name}
            </p>
          </div>
        </div>

        {onEdit && canUpdate('employees') && (
          <Button
            onPress={() => onEdit(employee)}
            className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-semibold rounded-xl px-5"
          >
            <Pencil className="size-4 mr-2" />
            <T k="actionEdit" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Avatar Card */}
        <Card className="p-6 border border-border/40 bg-surface rounded-2xl flex flex-col items-center text-center">
          <input
            type="file"
            ref={pictureInputRef}
            onChange={handlePictureFileChange}
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
          />

          <div className="relative group mb-4">
            <Avatar
              className="size-24 border-4 shadow-sm relative overflow-hidden"
              style={{ borderColor: employee.color || '#CCCCCC' }}
            >
              {employee.picture_url && (
                <Avatar.Image
                  src={getImageUrl(employee.picture_url)}
                  alt={`${employee.first_name} ${employee.last_name}`}
                />
              )}
              <Avatar.Fallback
                className="text-2xl font-bold"
                style={{ backgroundColor: `${employee.color || '#CCCCCC'}15`, color: employee.color || '#CCCCCC' }}
              >
                {employee.first_name?.[0]}
                {employee.last_name?.[0]}
              </Avatar.Fallback>
            </Avatar>

            {(uploadingPicture || deletingPicture) ? (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center text-white">
                <Spinner size="md" className="text-brand-gold" />
              </div>
            ) : (
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 backdrop-blur-[2px]">
                <button
                  type="button"
                  onClick={handlePictureUploadClick}
                  title={employee.picture_url ? t('profileChangePicture') : t('profileUploadPicture')}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer"
                >
                  <Camera className="size-4" />
                </button>
                {employee.picture_url && (
                  <button
                    type="button"
                    onClick={handleDeletePicture}
                    title={t('profileDeletePicture')}
                    className="p-2 rounded-full bg-rose-500/80 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold font-serif text-foreground">
            {employee.first_name} {employee.last_name}
          </h2>
          <code className="text-[10px] text-muted font-mono bg-default/40 px-1.5 py-0.5 rounded mt-1.5 w-fit">
            ID: {employee.id ? employee.id.slice(0, 8).toUpperCase() : 'N/A'}
          </code>

          <div className="flex gap-2 mt-4 flex-wrap justify-center">
            <Chip
              size="sm"
              variant="soft"
              color={employee.is_active ? 'success' : 'danger'}
              className="text-[11px] font-semibold"
            >
              {employee.is_active ? <T k="statusActive" /> : <T k="statusInactive" />}
            </Chip>
            {employee.user_role && (
              <Chip
                size="sm"
                variant="secondary"
                className="bg-brand-royal/10 text-brand-royal dark:bg-brand-gold/10 dark:text-brand-gold border-transparent text-[11px] font-semibold"
              >
                {employee.user_role}
              </Chip>
            )}
          </div>

          <div className="w-full border-t border-border/20 my-5" />

          {/* Core Info quick list */}
          <div className="flex flex-col gap-3.5 w-full text-left">
            <div className="flex items-center gap-3">
              <Phone className="size-4 text-muted shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-muted font-medium uppercase tracking-wider"><T k="fieldPhone" /></span>
                <span className="text-xs font-semibold text-foreground font-mono truncate">{employee.phone}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building className="size-4 text-muted shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-muted font-medium uppercase tracking-wider"><T k="fieldDepartment" /></span>
                <span className="text-xs font-semibold text-foreground truncate">{getDeptDisplayName(employee.department_id)}</span>
              </div>
            </div>

            {isAdminView && (
              <div className="flex items-center gap-3">
                <DollarSign className="size-4 text-muted shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-muted font-medium uppercase tracking-wider"><T k="fieldSalary" /></span>
                  <span className="text-xs font-bold text-foreground font-mono">{formatSalary(employee.fixed_salary, employee.currency)}</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Right Side: Tab/Section Info */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Details Card */}
          <Card className="p-6 border border-border/40 bg-surface rounded-2xl flex flex-col gap-6">
            {/* Personal Details */}
            <div className="flex flex-col gap-4 text-left">
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-gold font-serif border-b border-border/20 pb-2">
                <T k="profilePersonalInfo" />
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted font-medium uppercase"><T k="fieldFirstName" /></span>
                  <span className="text-sm font-medium text-foreground mt-0.5">{employee.first_name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted font-medium uppercase"><T k="fieldLastName" /></span>
                  <span className="text-sm font-medium text-foreground mt-0.5">{employee.last_name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted font-medium uppercase"><T k="fieldPhone" /></span>
                  <span className="text-sm font-mono text-foreground mt-0.5">{employee.phone}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted font-medium uppercase"><T k="fieldSecondaryPhone" /></span>
                  <span className="text-sm font-mono text-foreground mt-0.5">{employee.secondary_phone || '—'}</span>
                </div>
                <div className="flex flex-col sm:col-span-2">
                  <span className="text-[10px] text-muted font-medium uppercase"><T k="fieldAddress" /></span>
                  <span className="text-sm font-medium text-foreground mt-0.5 flex items-start gap-1">
                    <MapPin className="size-3.5 text-muted shrink-0 mt-0.5" />
                    {employee.address || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Work Details */}
            <div className="flex flex-col gap-4 text-left">
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-gold font-serif border-b border-border/20 pb-2">
                <T k="profileWorkInfo" />
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted font-medium uppercase"><T k="fieldDepartment" /></span>
                  <span className="text-sm font-medium text-foreground mt-0.5">{getDeptDisplayName(employee.department_id)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted font-medium uppercase"><T k="colJoined" /></span>
                  <span className="text-sm font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-muted" />
                    {formatDate(employee.created_at)}
                  </span>
                </div>
                {isAdminView && (
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted font-medium uppercase"><T k="fieldSalary" /></span>
                    <span className="text-sm font-bold text-foreground font-mono mt-0.5">{formatSalary(employee.fixed_salary, employee.currency)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Linkage status */}
            <div className="flex flex-col gap-4 text-left">
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-gold font-serif border-b border-border/20 pb-2">
                <T k="profileAccountInfo" />
              </h3>

              {employee.user_id ? (
                <div className="flex items-start gap-3 bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/15 p-4 rounded-xl">
                  <ShieldCheck className="size-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-emerald-500"><T k="profileAccountLinked" /></span>
                    <span className="text-[11px] text-muted mt-1">
                      Username / Login: <strong className="font-mono">{employee.username || employee.phone}</strong>
                    </span>
                    <span className="text-[11px] text-muted mt-0.5">
                      Account Status: <strong>{employee.user_status || 'Open'}</strong>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/15 p-4 rounded-xl">
                  <FileText className="size-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col text-xs font-semibold text-amber-500">
                    <span><T k="profileNoAccount" /></span>
                    <p className="text-[10px] text-muted font-normal mt-1 leading-normal">
                      The user registration details are automatically linked once an employee registers with the exact phone number ({employee.phone}) on the signup page.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Documents & Attachments Card */}
          <Card className="p-6 border border-border/40 bg-surface rounded-2xl flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-border/20 pb-4">
              <div className="flex items-center gap-2 text-left">
                <FolderOpen className="size-5 text-brand-gold shrink-0" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-brand-gold font-serif">
                    <T k="profileDocuments" />
                  </h3>
                  <p className="text-[10px] text-muted mt-0.5">
                    {attachments.length} {attachments.length === 1 ? 'file' : 'files'} archived
                  </p>
                </div>
              </div>

              {isManager && canCreate('attachments') && (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    onPress={handleUploadClick}
                    isDisabled={uploading}
                    size="sm"
                    className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-semibold rounded-xl px-4"
                  >
                    {uploading ? (
                      <>
                        <Spinner size="sm" className="mr-1.5" />
                        <T k="profileUploading" />
                      </>
                    ) : (
                      <>
                        <Upload className="size-3.5 mr-1.5" />
                        <T k="profileUploadDoc" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {attachmentsLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Spinner size="md" className="text-brand-gold" />
                <span className="text-xs text-muted">Loading documents...</span>
              </div>
            ) : attachments.length === 0 ? (
              <div className="flex flex-col items-center text-center py-12 px-4 border border-dashed border-border/40 rounded-2xl gap-3 bg-default/5">
                <div className="size-12 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                  <FolderOpen className="size-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground"><T k="profileNoDocuments" /></h4>
                  <p className="text-xs text-muted max-w-sm mt-1"><T k="profileNoDocumentsDesc" /></p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {attachments.map((att) => {
                  const name = att.file_name || att.fileName || 'document';
                  const mime = att.mime_type || att.mimeType || '';
                  const isPdf = mime.includes('pdf') || name.toLowerCase().endsWith('.pdf');
                  const isImage = mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(name);
                  const isSpreadsheet = mime.includes('excel') || mime.includes('sheet') || /\.(xlsx?|csv)$/i.test(name);
                  
                  let Icon = File;
                  let iconColor = 'text-muted';
                  let iconBg = 'bg-muted/10';

                  if (isPdf) {
                    Icon = FileText;
                    iconColor = 'text-rose-500';
                    iconBg = 'bg-rose-500/10';
                  } else if (isImage) {
                    Icon = FileImage;
                    iconColor = 'text-emerald-500';
                    iconBg = 'bg-emerald-500/10';
                  } else if (isSpreadsheet) {
                    Icon = FileSpreadsheet;
                    iconColor = 'text-blue-500';
                    iconBg = 'bg-blue-500/10';
                  }

                  const isDownloading = downloadingId === att.id;
                  const isDeleting = deletingId === att.id;

                  return (
                    <div
                      key={att.id}
                      className="flex items-center justify-between border border-border/20 hover:border-border/60 rounded-2xl p-4 bg-default/5 hover:bg-default/10 transition-all text-left"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
                          <Icon className="size-5.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-foreground truncate max-w-[180px] md:max-w-[200px]" title={name}>
                            {name}
                          </span>
                          <span className="text-[9px] font-mono text-muted uppercase mt-0.5 tracking-wider">
                            {name.split('.').pop() || 'file'} • {mime.split('/').pop() || 'unknown'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          onPress={() => handleDownload(att)}
                          isDisabled={isDownloading || isDeleting}
                          className="text-muted hover:text-foreground hover:bg-default/50 rounded-lg size-8"
                        >
                          {isDownloading ? (
                            <Spinner size="sm" />
                          ) : (
                            <Download className="size-4" />
                          )}
                        </Button>

                        {isManager && canDelete('attachments') && (
                          <Button
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            onPress={() => handleDelete(att.id)}
                            isDisabled={isDownloading || isDeleting}
                            className="text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg size-8"
                          >
                            {isDeleting ? (
                              <Spinner size="sm" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
