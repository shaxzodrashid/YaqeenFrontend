import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { Card, Button, Modal, Spinner, Skeleton } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  AlertTriangle,
  Search,
  X,
  Users,
  LayoutGrid,
  List,
  Hash,
  TrendingUp,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { usePermissions } from '../context/PermissionsContext';
import { api } from '../services/api';
import type { Department, CreateDepartmentDto, ApiError } from '../services/api';
import { T } from './T';

// Motion variants – lightweight transforms for silky stagger animations
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

/* ── Memoized Department Card ─────────────────────────────── */
interface DepartmentCardProps {
  dept: Department;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (dept: Department) => void;
  onDelete: (dept: Department) => void;
  formatDate: (dateStr: string) => string;
  viewMode: 'grid' | 'list';
}

const DepartmentCard = memo(function DepartmentCard({
  dept,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  formatDate,
  viewMode,
}: DepartmentCardProps) {
  const { t } = useTranslation();
  const employeeCount = dept.employee_count ?? 0;

  if (viewMode === 'list') {
    return (
      <div className="group relative p-3.5 sm:p-4 border border-border/30 bg-surface/80 backdrop-blur-sm rounded-xl hover:border-brand-gold/30 hover:shadow-lg hover:shadow-brand-gold/5 transition-all duration-300 transform-gpu flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="size-10 rounded-xl bg-gradient-to-br from-brand-gold/15 to-brand-gold/5 flex items-center justify-center text-brand-gold shrink-0 ring-1 ring-brand-gold/10">
            <Building2 className="size-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-sm font-bold text-foreground tracking-tight truncate">
                {dept.display_name}
              </h3>
              <code className="text-[10px] text-muted/70 font-mono bg-default/40 px-1.5 py-0.5 rounded-md shrink-0 tracking-wide uppercase">
                {dept.name}
              </code>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-muted mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3 text-brand-gold/70" />
                <span className="font-semibold text-foreground tabular-nums">{employeeCount}</span>
                <span className="text-muted/80">{t('deptEmployeeCount')}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted/60">
                <Calendar className="size-3" />
                {formatDate(dept.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 self-end sm:self-center opacity-60 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
          {canUpdate && (
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onPress={() => onEdit(dept)}
              aria-label="Edit department"
              className="text-muted hover:text-foreground hover:bg-default/60 min-h-[36px] min-w-[36px] rounded-lg"
            >
              <Pencil className="size-3.5" />
            </Button>
          )}
          {canDelete && (
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onPress={() => onDelete(dept)}
              aria-label="Delete department"
              className="text-muted hover:text-rose-500 hover:bg-rose-500/10 min-h-[36px] min-w-[36px] rounded-lg"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Grid card
  return (
    <Card className="group relative overflow-hidden border border-border/30 bg-surface/90 backdrop-blur-sm rounded-2xl hover:border-brand-gold/30 hover:shadow-xl hover:shadow-brand-gold/5 transition-all duration-300 transform-gpu flex flex-col justify-between h-full">
      {/* Subtle gradient accent at top */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-11 sm:size-12 rounded-xl bg-gradient-to-br from-brand-gold/15 to-brand-gold/5 flex items-center justify-center text-brand-gold shrink-0 ring-1 ring-brand-gold/10 group-hover:ring-brand-gold/20 transition-all duration-300">
              <Building2 className="size-5 sm:size-[22px]" />
            </div>
            <div className="flex flex-col min-w-0">
              <h3
                className="text-sm sm:text-[15px] font-bold text-foreground tracking-tight truncate leading-tight"
                title={dept.display_name}
              >
                {dept.display_name}
              </h3>
              <code className="text-[10px] text-muted/60 font-mono bg-default/30 px-1.5 py-0.5 rounded-md mt-1 w-fit truncate max-w-full tracking-wide uppercase">
                {dept.name}
              </code>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
            {canUpdate && (
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                onPress={() => onEdit(dept)}
                aria-label="Edit department"
                className="text-muted hover:text-foreground hover:bg-default/60 min-h-[34px] min-w-[34px] rounded-lg"
              >
                <Pencil className="size-3.5" />
              </Button>
            )}
            {canDelete && (
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                onPress={() => onDelete(dept)}
                aria-label="Delete department"
                className="text-muted hover:text-rose-500 hover:bg-rose-500/10 min-h-[34px] min-w-[34px] rounded-lg"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom stats bar */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/15">
          <div className="inline-flex items-center gap-2 bg-brand-gold/5 dark:bg-brand-gold/8 px-2.5 py-1.5 rounded-lg">
            <Users className="size-3.5 text-brand-gold/80" />
            <span className="text-xs font-semibold text-brand-gold tabular-nums">
              {employeeCount}
            </span>
            <span className="text-[10px] text-brand-gold/60 font-medium">
              {t('deptEmployeeCount')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-muted/50">
            <Calendar className="size-3 shrink-0" />
            <span className="truncate">{formatDate(dept.created_at)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
});

/* ── Form Modal ───────────────────────────────────────────── */
interface DepartmentFormModalProps {
  isOpen: boolean;
  editingDept: Department | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DepartmentFormModal = memo(function DepartmentFormModal({
  isOpen,
  editingDept,
  onClose,
  onSuccess,
}: DepartmentFormModalProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  // Internal form state to prevent parent page re-renders on keystroke
  const [formName, setFormName] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formErrors, setFormErrors] = useState<{ name?: string; display_name?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingDept) {
        setFormName(editingDept.name);
        setFormDisplayName(editingDept.display_name);
      } else {
        setFormName('');
        setFormDisplayName('');
      }
      setFormErrors({});
    }
  }, [isOpen, editingDept]);

  const validateForm = (): boolean => {
    const errors: { name?: string; display_name?: string } = {};
    if (!formName || formName.length < 2 || formName.length > 100) {
      errors.name = t('fieldNameLength');
    }
    if (!/^[a-z0-9_-]+$/.test(formName)) {
      errors.name = t('deptFieldNameHint');
    }
    if (!formDisplayName || formDisplayName.length < 2 || formDisplayName.length > 100) {
      errors.display_name = t('fieldNameLength');
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      const dto: CreateDepartmentDto = { name: formName, display_name: formDisplayName };
      if (editingDept) {
        await api.departments.update(editingDept.id, dto);
        showNotification(t('successDeptUpdated'), 'success');
      } else {
        await api.departments.create(dto);
        showNotification(t('successDeptCreated'), 'success');
      }
      onClose();
      onSuccess();
    } catch (err) {
      const error = err as ApiError;
      if (error?.location === 'department_name_exists') {
        setFormErrors({ name: t('department_name_exists') });
      } else if (error?.location === 'validation_failed') {
        setFormErrors({ name: t('validation_failed') });
      } else {
        showNotification(t(error?.location || 'internal_error'), 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog className="max-w-md w-[92vw] sm:w-full mx-auto rounded-2xl p-0 overflow-hidden bg-surface dark:bg-surface border border-border/30 shadow-2xl">
          <Modal.CloseTrigger className="absolute top-4 right-4 p-2 rounded-lg text-muted hover:text-foreground hover:bg-default/50 cursor-pointer focus:outline-none z-10" />

          <form onSubmit={handleSave} className="flex flex-col max-h-[85vh]">
            <Modal.Header className="px-5 sm:px-6 py-4 border-b border-border/20">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-gradient-to-br from-brand-gold/15 to-brand-gold/5 flex items-center justify-center text-brand-gold ring-1 ring-brand-gold/10">
                  <Building2 className="size-4.5" />
                </div>
                <Modal.Heading className="font-serif font-bold text-base sm:text-lg text-foreground">
                  {editingDept ? <T k="deptEditDept" /> : <T k="deptNewDept" />}
                </Modal.Heading>
              </div>
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-5 p-5 sm:p-6 overflow-y-auto">
              {/* Machine Name */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-foreground tracking-wide uppercase">
                  <T k="deptFieldName" />
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value.toLowerCase());
                    setFormErrors((p) => ({ ...p, name: undefined }));
                  }}
                  placeholder="marketing-hq"
                  autoComplete="off"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-base sm:text-sm bg-field text-field-foreground border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-focus/30 font-mono
                      ${formErrors.name ? 'border-rose-500 focus:ring-rose-500/30' : 'border-field-border hover:border-brand-gold/30'}`}
                />
                <p
                  className={`text-[11px] ${formErrors.name ? 'text-rose-500 font-medium' : 'text-muted/70'}`}
                >
                  {formErrors.name ? formErrors.name : <T k="deptFieldNameHint" />}
                </p>
              </div>

              {/* Display Name */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-foreground tracking-wide uppercase">
                  <T k="deptFieldDisplayName" />
                </label>
                <input
                  type="text"
                  value={formDisplayName}
                  onChange={(e) => {
                    setFormDisplayName(e.target.value);
                    setFormErrors((p) => ({ ...p, display_name: undefined }));
                  }}
                  placeholder="Marketing HQ"
                  autoComplete="off"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-base sm:text-sm bg-field text-field-foreground border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-focus/30
                      ${formErrors.display_name ? 'border-rose-500 focus:ring-rose-500/30' : 'border-field-border hover:border-brand-gold/30'}`}
                />
                <p
                  className={`text-[11px] ${formErrors.display_name ? 'text-rose-500 font-medium' : 'text-muted/70'}`}
                >
                  {formErrors.display_name ? (
                    formErrors.display_name
                  ) : (
                    <T k="deptFieldDisplayNameHint" />
                  )}
                </p>
              </div>
            </Modal.Body>

            <Modal.Footer className="flex items-center justify-end gap-2 px-5 sm:px-6 py-3.5 border-t border-border/20 bg-surface/50">
              <Button
                type="button"
                variant="ghost"
                onPress={onClose}
                className="font-semibold text-xs sm:text-sm min-h-[44px] sm:min-h-[38px] px-4 rounded-xl"
              >
                <T k="actionCancel" />
              </Button>
              <Button
                type="submit"
                isDisabled={saving}
                className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-semibold text-xs sm:text-sm min-h-[44px] sm:min-h-[38px] px-5 min-w-[100px] rounded-xl shadow-sm shadow-brand-gold/20"
              >
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size="sm" />
                    {editingDept ? <T k="actionSaving" /> : <T k="actionCreating" />}
                  </span>
                ) : editingDept ? (
                  <T k="actionSave" />
                ) : (
                  <T k="actionCreate" />
                )}
              </Button>
            </Modal.Footer>
          </form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
});

/* ── Delete Confirmation Modal ────────────────────────────── */
interface DepartmentDeleteModalProps {
  isOpen: boolean;
  dept: Department | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DepartmentDeleteModal = memo(function DepartmentDeleteModal({
  isOpen,
  dept,
  onClose,
  onSuccess,
}: DepartmentDeleteModalProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!dept) return;
    setDeleting(true);
    try {
      await api.departments.delete(dept.id);
      showNotification(t('successDeptDeleted'), 'success');
      onClose();
      onSuccess();
    } catch (err) {
      const error = err as ApiError;
      if (error?.location === 'department_has_employees') {
        showNotification(t('department_has_employees'), 'warning');
      } else {
        showNotification(t(error?.location || 'internal_error'), 'error');
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog className="max-w-sm w-[92vw] sm:w-full mx-auto rounded-2xl p-5 sm:p-6 bg-surface dark:bg-surface border border-border/30 shadow-2xl">
          <Modal.CloseTrigger className="absolute top-4 right-4 p-2 rounded-lg text-muted hover:text-foreground hover:bg-default/50 cursor-pointer focus:outline-none" />
          <Modal.Body className="flex flex-col items-center text-center py-4 gap-4">
            <div className="size-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 ring-1 ring-rose-500/10">
              <AlertTriangle className="size-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-foreground font-serif">
              <T k="deptDeleteTitle" />
            </h3>
            <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-[280px]">
              <T k="deptDeleteDesc" />
            </p>
            {dept && (
              <div className="flex items-center gap-2.5 bg-default/30 px-3.5 py-2.5 rounded-xl border border-border/20 max-w-full">
                <Building2 className="size-4 text-muted/60 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                  {dept.display_name}
                </span>
                <code className="text-[10px] text-muted/60 font-mono shrink-0">({dept.name})</code>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="flex items-center justify-center gap-2.5 pt-2 pb-1">
            <Button
              type="button"
              variant="ghost"
              onPress={onClose}
              className="font-semibold text-xs sm:text-sm min-h-[44px] sm:min-h-[38px] px-4 rounded-xl"
            >
              <T k="actionCancel" />
            </Button>
            <Button
              type="button"
              onPress={handleDelete}
              isDisabled={deleting}
              className="bg-rose-500 text-white hover:bg-rose-600 font-semibold text-xs sm:text-sm min-h-[44px] sm:min-h-[38px] px-5 min-w-[130px] rounded-xl shadow-sm shadow-rose-500/20"
            >
              {deleting ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="sm" /> <T k="actionDelete" />
                </span>
              ) : (
                <T k="deptDeleteConfirm" />
              )}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
});

/* ── Main Page Component ──────────────────────────────────── */
export function DepartmentsPage() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canCreate, canUpdate, canDelete } = usePermissions();

  // Data states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & View Mode states
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal visibility states
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);

  // Fetch departments only – employee_count comes from the API now
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const deptData = await api.departments.list();
      setDepartments(deptData || []);
    } catch (err) {
      const error = err as ApiError;
      showNotification(t(error?.location || 'internal_error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Computed stats from departments data (employee_count from API)
  const totalEmployeesCount = useMemo(
    () => departments.reduce((sum, dept) => sum + (dept.employee_count ?? 0), 0),
    [departments]
  );

  const avgEmployeesPerDept = useMemo(
    () =>
      departments.length > 0 ? Math.round((totalEmployeesCount / departments.length) * 10) / 10 : 0,
    [departments, totalEmployeesCount]
  );

  // Filtered departments by search query
  const filteredDepartments = useMemo(() => {
    if (!searchQuery.trim()) return departments;
    const q = searchQuery.toLowerCase().trim();
    return departments.filter(
      (dept) => dept.display_name.toLowerCase().includes(q) || dept.name.toLowerCase().includes(q)
    );
  }, [departments, searchQuery]);

  const openCreateModal = useCallback(() => {
    setEditingDept(null);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((dept: Department) => {
    setEditingDept(dept);
    setModalOpen(true);
  }, []);

  const openDeleteDialog = useCallback((dept: Department) => {
    setDeletingDept(dept);
    setDeleteOpen(true);
  }, []);

  const formatDate = useCallback((dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }, []);

  return (
    <div className="flex flex-col gap-5 sm:gap-6 md:gap-8 pb-10">
      {/* ── Page Header ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-foreground tracking-tight">
            <T k="deptTitle" />
          </h1>
          <p className="text-xs sm:text-sm text-muted/70 mt-0.5">
            <T k="deptSubtitle" />
          </p>
        </div>

        {canCreate('departments') && (
          <Button
            onPress={openCreateModal}
            className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-semibold rounded-xl px-4 sm:px-5 min-h-[44px] sm:min-h-[40px] w-full sm:w-auto shrink-0 transition-all duration-200 shadow-sm shadow-brand-gold/20"
          >
            <Plus className="size-4 mr-2" />
            <T k="deptAddNew" />
          </Button>
        )}
      </div>

      {/* ── Stats Cards ───────────────────────────────────────── */}
      {!loading && departments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {/* Total Departments */}
          <div className="relative overflow-hidden p-3.5 sm:p-4 rounded-2xl bg-surface/80 backdrop-blur-sm border border-border/30 flex items-center gap-3 group hover:border-brand-gold/20 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="size-10 rounded-xl bg-gradient-to-br from-brand-gold/15 to-brand-gold/5 flex items-center justify-center text-brand-gold shrink-0 ring-1 ring-brand-gold/10">
              <Building2 className="size-5" />
            </div>
            <div className="relative">
              <p className="text-[10px] sm:text-xs text-muted/70 font-medium uppercase tracking-wider">
                <T k="deptTotalCount" />
              </p>
              <p className="text-lg sm:text-xl font-bold text-foreground mt-0.5 tabular-nums">
                {departments.length}
              </p>
            </div>
          </div>

          {/* Total Employees */}
          <div className="relative overflow-hidden p-3.5 sm:p-4 rounded-2xl bg-surface/80 backdrop-blur-sm border border-border/30 flex items-center gap-3 group hover:border-blue-500/20 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="size-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-blue-500/5 flex items-center justify-center text-blue-500 shrink-0 ring-1 ring-blue-500/10">
              <Users className="size-5" />
            </div>
            <div className="relative">
              <p className="text-[10px] sm:text-xs text-muted/70 font-medium uppercase tracking-wider">
                <T k="deptTotalEmployees" />
              </p>
              <p className="text-lg sm:text-xl font-bold text-foreground mt-0.5 tabular-nums">
                {totalEmployeesCount}
              </p>
            </div>
          </div>

          {/* Average per Department */}
          <div className="relative overflow-hidden p-3.5 sm:p-4 rounded-2xl bg-surface/80 backdrop-blur-sm border border-border/30 flex items-center gap-3 group hover:border-emerald-500/20 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 flex items-center justify-center text-emerald-500 shrink-0 ring-1 ring-emerald-500/10">
              <TrendingUp className="size-5" />
            </div>
            <div className="relative">
              <p className="text-[10px] sm:text-xs text-muted/70 font-medium uppercase tracking-wider">
                {t('deptAvgPerDept')}
              </p>
              <p className="text-lg sm:text-xl font-bold text-foreground mt-0.5 tabular-nums">
                {avgEmployeesPerDept}
              </p>
            </div>
          </div>

          {/* Active Departments (departments with at least 1 employee) */}
          <div className="relative overflow-hidden p-3.5 sm:p-4 rounded-2xl bg-surface/80 backdrop-blur-sm border border-border/30 flex items-center gap-3 group hover:border-violet-500/20 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="size-10 rounded-xl bg-gradient-to-br from-violet-500/15 to-violet-500/5 flex items-center justify-center text-violet-500 shrink-0 ring-1 ring-violet-500/10">
              <Hash className="size-5" />
            </div>
            <div className="relative">
              <p className="text-[10px] sm:text-xs text-muted/70 font-medium uppercase tracking-wider">
                {t('deptActiveCount')}
              </p>
              <p className="text-lg sm:text-xl font-bold text-foreground mt-0.5 tabular-nums">
                {departments.filter((d) => (d.employee_count ?? 0) > 0).length}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Toolbar: Search & View Mode Toggle ────────────────── */}
      {departments.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface/40 backdrop-blur-sm border border-border/20 p-2.5 sm:p-3 rounded-2xl">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted/50 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('deptSearchPlaceholder')}
              className="w-full pl-9 pr-8 py-2 text-base sm:text-sm bg-surface/80 border border-border/30 rounded-xl text-foreground placeholder:text-muted/50 focus:outline-none focus:border-brand-gold/40 focus:ring-2 focus:ring-brand-gold/10 transition-all duration-200"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-1 rounded-lg cursor-pointer transition-colors"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-0.5 bg-default/30 p-1 rounded-xl shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-surface text-brand-gold shadow-sm ring-1 ring-border/20'
                  : 'text-muted hover:text-foreground'
              }`}
              aria-label="Grid View"
            >
              <LayoutGrid className="size-3.5" />
              <span className="hidden sm:inline">
                <T k="deptViewGrid" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-surface text-brand-gold shadow-sm ring-1 ring-border/20'
                  : 'text-muted hover:text-foreground'
              }`}
              aria-label="List View"
            >
              <List className="size-3.5" />
              <span className="hidden sm:inline">
                <T k="deptViewList" />
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── Department Grid / List Display ──────────────────── */}
      {loading ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4'
              : 'flex flex-col gap-3'
          }
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4 sm:p-5 border border-border/20 bg-surface/60 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="size-11 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-28 rounded-lg mb-2" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-px w-full mb-3" />
              <div className="flex justify-between">
                <Skeleton className="h-6 w-24 rounded-lg" />
                <Skeleton className="h-4 w-20 rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      ) : departments.length === 0 ? (
        /* Empty State: No Departments Created */
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4"
        >
          <div className="size-20 sm:size-24 rounded-3xl bg-gradient-to-br from-brand-gold/10 to-brand-gold/5 flex items-center justify-center text-brand-gold mb-6 ring-1 ring-brand-gold/10">
            <Building2 className="size-9 sm:size-10" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground mb-2 font-serif">
            <T k="deptNoDepartments" />
          </h3>
          <p className="text-xs sm:text-sm text-muted/70 max-w-sm mb-7 leading-relaxed">
            <T k="deptNoDepartmentsDesc" />
          </p>
          {canCreate('departments') && (
            <Button
              onPress={openCreateModal}
              className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-semibold rounded-xl px-5 min-h-[44px] shadow-sm shadow-brand-gold/20"
            >
              <Plus className="size-4 mr-2" />
              <T k="deptAddNew" />
            </Button>
          )}
        </motion.div>
      ) : filteredDepartments.length === 0 ? (
        /* Empty State: No Search Matches */
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4 bg-surface/30 border border-border/20 rounded-2xl"
        >
          <div className="size-14 rounded-2xl bg-default/30 flex items-center justify-center text-muted/50 mb-4">
            <Search className="size-6" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">
            <T k="deptNoSearchResults" />
          </h3>
          <p className="text-xs sm:text-sm text-muted/70 max-w-xs mb-5 leading-relaxed">
            <T k="deptNoSearchResultsDesc" />
          </p>
          <Button
            variant="ghost"
            onPress={() => setSearchQuery('')}
            className="text-brand-gold hover:bg-brand-gold/10 font-semibold text-xs rounded-xl px-4"
          >
            <T k="deptClearSearch" />
          </Button>
        </motion.div>
      ) : (
        /* Department Cards */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5'
              : 'flex flex-col gap-2.5 sm:gap-3'
          }
        >
          {filteredDepartments.map((dept) => (
            <motion.div key={dept.id} variants={itemVariants}>
              <DepartmentCard
                dept={dept}
                canUpdate={canUpdate('departments')}
                canDelete={canDelete('departments')}
                onEdit={openEditModal}
                onDelete={openDeleteDialog}
                formatDate={formatDate}
                viewMode={viewMode}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Modals ────────────────────────────────────────────── */}
      <DepartmentFormModal
        isOpen={modalOpen}
        editingDept={editingDept}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
      />

      <DepartmentDeleteModal
        isOpen={deleteOpen}
        dept={deletingDept}
        onClose={() => setDeleteOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
