import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { Card, Button, Modal, Spinner, Skeleton } from '@heroui/react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { usePermissions } from '../context/PermissionsContext';
import { api } from '../services/api';
import type { Department, CreateDepartmentDto, ApiError, Employee } from '../services/api';
import { T } from './T';

// Motion variants without heavy `layout` calculations for high performance on mobile CPUs
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' as const },
  },
};

/* ── Memoized Department Card Subcomponent ─────────────────── */
interface DepartmentCardProps {
  dept: Department;
  employeeCount: number;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (dept: Department) => void;
  onDelete: (dept: Department) => void;
  formatDate: (dateStr: string) => string;
  viewMode: 'grid' | 'list';
}

const DepartmentCard = memo(function DepartmentCard({
  dept,
  employeeCount,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  formatDate,
  viewMode,
}: DepartmentCardProps) {
  const { t } = useTranslation();

  if (viewMode === 'list') {
    return (
      <div className="group relative p-3.5 sm:p-4 border border-border/40 bg-surface dark:bg-surface rounded-xl hover:border-brand-gold/40 hover:shadow-md transition-all duration-200 transform-gpu flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-xl bg-brand-gold/10 dark:bg-brand-gold/15 flex items-center justify-center text-brand-gold shrink-0">
            <Building2 className="size-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-foreground truncate">{dept.display_name}</h3>
              <code className="text-[11px] text-muted font-mono bg-default/50 px-1.5 py-0.5 rounded shrink-0">
                {dept.name}
              </code>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Users className="size-3 text-brand-gold" />
                <span className="font-medium text-foreground">{employeeCount}</span>{' '}
                {t('deptEmployeeCount')}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3" />
                {formatDate(dept.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons - Always visible across mobile, tablet, and desktop */}
        <div className="flex items-center gap-1 self-end sm:self-center opacity-100 transition-opacity duration-200 shrink-0">
          {canUpdate && (
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onPress={() => onEdit(dept)}
              aria-label="Edit department"
              className="text-muted hover:text-foreground hover:bg-default/60 min-h-[38px] min-w-[38px]"
            >
              <Pencil className="size-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onPress={() => onDelete(dept)}
              aria-label="Delete department"
              className="text-muted hover:text-rose-500 hover:bg-rose-500/10 min-h-[38px] min-w-[38px]"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="group relative p-4 sm:p-5 border border-border/40 bg-surface dark:bg-surface rounded-2xl hover:border-brand-gold/40 hover:shadow-lg transition-all duration-200 transform-gpu flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 sm:size-11 rounded-xl bg-brand-gold/10 dark:bg-brand-gold/15 flex items-center justify-center text-brand-gold shrink-0">
              <Building2 className="size-5 sm:size-6" />
            </div>
            <div className="flex flex-col min-w-0">
              <h3
                className="text-sm sm:text-base font-bold text-foreground truncate"
                title={dept.display_name}
              >
                {dept.display_name}
              </h3>
              <code className="text-[11px] text-muted font-mono bg-default/50 px-1.5 py-0.5 rounded mt-0.5 w-fit truncate max-w-full">
                {dept.name}
              </code>
            </div>
          </div>

          {/* Action Buttons - Always visible across mobile, tablet, and desktop */}
          <div className="flex items-center gap-1 opacity-100 transition-opacity duration-200 shrink-0">
            {canUpdate && (
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                onPress={() => onEdit(dept)}
                aria-label="Edit department"
                className="text-muted hover:text-foreground hover:bg-default/60 min-h-[36px] min-w-[36px]"
              >
                <Pencil className="size-3.5 sm:size-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                onPress={() => onDelete(dept)}
                aria-label="Delete department"
                className="text-muted hover:text-rose-500 hover:bg-rose-500/10 min-h-[36px] min-w-[36px]"
              >
                <Trash2 className="size-3.5 sm:size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-border/20 flex items-center justify-between gap-2 text-[11px] text-muted">
        <div className="flex items-center gap-1.5 bg-brand-gold/5 dark:bg-brand-gold/10 px-2 py-1 rounded-lg text-brand-gold font-medium">
          <Users className="size-3.5" />
          <span>
            {employeeCount} {t('deptEmployeeCount')}
          </span>
        </div>

        <div className="flex items-center gap-1 text-muted">
          <Calendar className="size-3 shrink-0" />
          <span className="truncate">{formatDate(dept.created_at)}</span>
        </div>
      </div>
    </Card>
  );
});

/* ── Standalone Form Modal Subcomponent (Isolated Form State) ── */
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
        <Modal.Dialog className="max-w-md w-[92vw] sm:w-full mx-auto rounded-2xl p-0 overflow-hidden bg-surface dark:bg-surface border border-border/40 shadow-2xl">
          <Modal.CloseTrigger className="absolute top-4 right-4 p-2 rounded-lg text-muted hover:text-foreground hover:bg-default/50 cursor-pointer focus:outline-none z-10" />

          <form onSubmit={handleSave} className="flex flex-col max-h-[85vh]">
            <Modal.Header className="px-5 py-4 border-b border-border/30">
              <Modal.Heading className="font-serif font-bold text-base sm:text-lg text-foreground">
                {editingDept ? <T k="deptEditDept" /> : <T k="deptNewDept" />}
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-4 p-5 overflow-y-auto">
              {/* Machine Name */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-foreground">
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
                  className={`w-full px-3.5 py-2.5 rounded-xl text-base sm:text-sm bg-field text-field-foreground border transition-colors focus:outline-none focus:ring-2 focus:ring-focus/30 font-mono
                      ${formErrors.name ? 'border-rose-500 focus:ring-rose-500/30' : 'border-field-border'}`}
                />
                <p
                  className={`text-[11px] ${formErrors.name ? 'text-rose-500 font-medium' : 'text-muted'}`}
                >
                  {formErrors.name ? formErrors.name : <T k="deptFieldNameHint" />}
                </p>
              </div>

              {/* Display Name */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-foreground">
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
                  className={`w-full px-3.5 py-2.5 rounded-xl text-base sm:text-sm bg-field text-field-foreground border transition-colors focus:outline-none focus:ring-2 focus:ring-focus/30
                      ${formErrors.display_name ? 'border-rose-500 focus:ring-rose-500/30' : 'border-field-border'}`}
                />
                <p
                  className={`text-[11px] ${formErrors.display_name ? 'text-rose-500 font-medium' : 'text-muted'}`}
                >
                  {formErrors.display_name ? (
                    formErrors.display_name
                  ) : (
                    <T k="deptFieldDisplayNameHint" />
                  )}
                </p>
              </div>
            </Modal.Body>

            <Modal.Footer className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-border/30 bg-surface/50">
              <Button
                type="button"
                variant="ghost"
                onPress={onClose}
                className="font-semibold text-xs sm:text-sm min-h-[44px] sm:min-h-[38px] px-4"
              >
                <T k="actionCancel" />
              </Button>
              <Button
                type="submit"
                isDisabled={saving}
                className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-semibold text-xs sm:text-sm min-h-[44px] sm:min-h-[38px] px-5 min-w-[100px]"
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

/* ── Standalone Delete Modal Subcomponent (Isolated Delete State) ─ */
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
        <Modal.Dialog className="max-w-sm w-[92vw] sm:w-full mx-auto rounded-2xl p-5 bg-surface dark:bg-surface border border-border/40 shadow-2xl">
          <Modal.CloseTrigger className="absolute top-4 right-4 p-2 rounded-lg text-muted hover:text-foreground hover:bg-default/50 cursor-pointer focus:outline-none" />
          <Modal.Body className="flex flex-col items-center text-center py-4 gap-3.5">
            <div className="size-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <AlertTriangle className="size-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-foreground font-serif">
              <T k="deptDeleteTitle" />
            </h3>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              <T k="deptDeleteDesc" />
            </p>
            {dept && (
              <div className="flex items-center gap-2 bg-default/40 px-3 py-2 rounded-xl border border-border/30 max-w-full">
                <Building2 className="size-4 text-muted shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                  {dept.display_name}
                </span>
                <code className="text-[11px] text-muted font-mono shrink-0">({dept.name})</code>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="flex items-center justify-center gap-2.5 pt-2 pb-1">
            <Button
              type="button"
              variant="ghost"
              onPress={onClose}
              className="font-semibold text-xs sm:text-sm min-h-[44px] sm:min-h-[38px] px-4"
            >
              <T k="actionCancel" />
            </Button>
            <Button
              type="button"
              onPress={handleDelete}
              isDisabled={deleting}
              className="bg-rose-500 text-white hover:bg-rose-600 font-semibold text-xs sm:text-sm min-h-[44px] sm:min-h-[38px] px-5 min-w-[130px]"
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

export function DepartmentsPage() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canCreate, canUpdate, canDelete } = usePermissions();

  // Data states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & View Mode states
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal visibility states
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);

  // Fetch departments & employees in parallel
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [deptData, empRes] = await Promise.all([
        api.departments.list(),
        api.employees.list({ limit: 100 }).catch(() => null),
      ]);
      setDepartments(deptData || []);

      if (empRes) {
        const empList = Array.isArray(empRes)
          ? empRes
          : (empRes as { items?: Employee[]; result?: Employee[] }).items ||
            (empRes as { items?: Employee[]; result?: Employee[] }).result ||
            [];
        setEmployees(empList);
      }
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

  // Compute employee count per department for instant lookup
  const employeeCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach((emp) => {
      if (emp.department_id) {
        map[emp.department_id] = (map[emp.department_id] || 0) + 1;
      }
    });
    return map;
  }, [employees]);

  // Total active employees count
  const totalEmployeesCount = useMemo(() => employees.length, [employees]);

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
      {/* ── Page Header & Action CTA ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-foreground">
            <T k="deptTitle" />
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            <T k="deptSubtitle" />
          </p>
        </div>

        {canCreate('departments') && (
          <Button
            onPress={openCreateModal}
            className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-semibold rounded-xl px-4 sm:px-5 min-h-[44px] sm:min-h-[40px] w-full sm:w-auto shrink-0 transition-all duration-200"
          >
            <Plus className="size-4 mr-2" />
            <T k="deptAddNew" />
          </Button>
        )}
      </div>

      {/* ── Quick Stats Badges ──────────────────────────────── */}
      {!loading && departments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-border/40 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-brand-gold/15 flex items-center justify-center text-brand-gold shrink-0">
              <Building2 className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted font-medium">
                <T k="deptTotalCount" />
              </p>
              <p className="text-lg sm:text-xl font-bold text-foreground mt-0.5">
                {departments.length}
              </p>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-border/40 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-500 shrink-0">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted font-medium">
                <T k="deptTotalEmployees" />
              </p>
              <p className="text-lg sm:text-xl font-bold text-foreground mt-0.5">
                {totalEmployeesCount}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Toolbar: Search & View Mode Toggle ──────────────── */}
      {departments.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface/50 border border-border/30 p-2.5 sm:p-3 rounded-2xl">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('deptSearchPlaceholder')}
              className="w-full pl-9 pr-8 py-2 text-base sm:text-sm bg-surface border border-border/40 rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-brand-gold/50 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-1 rounded-lg cursor-pointer"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-default/40 p-1 rounded-xl shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-surface text-brand-gold shadow-sm'
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-surface text-brand-gold shadow-sm'
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
            <Card key={i} className="p-4 sm:p-5 border border-border/40 bg-surface rounded-2xl">
              <Skeleton className="h-5 w-32 rounded-lg mb-3" />
              <Skeleton className="h-4 w-24 rounded-lg mb-4" />
              <Skeleton className="h-3 w-40 rounded-lg" />
            </Card>
          ))}
        </div>
      ) : departments.length === 0 ? (
        /* Empty State: No Departments Created */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4"
        >
          <div className="size-16 sm:size-20 rounded-2xl bg-brand-gold/10 dark:bg-brand-gold/15 flex items-center justify-center text-brand-gold mb-5">
            <Building2 className="size-8 sm:size-9" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground mb-1.5">
            <T k="deptNoDepartments" />
          </h3>
          <p className="text-xs sm:text-sm text-muted max-w-sm mb-6">
            <T k="deptNoDepartmentsDesc" />
          </p>
          {canCreate('departments') && (
            <Button
              onPress={openCreateModal}
              className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-semibold rounded-xl px-5 min-h-[44px]"
            >
              <Plus className="size-4 mr-2" />
              <T k="deptAddNew" />
            </Button>
          )}
        </motion.div>
      ) : filteredDepartments.length === 0 ? (
        /* Empty State: No Search Matches */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4 bg-surface/30 border border-border/30 rounded-2xl"
        >
          <div className="size-14 rounded-2xl bg-default/40 flex items-center justify-center text-muted mb-4">
            <Search className="size-6" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">
            <T k="deptNoSearchResults" />
          </h3>
          <p className="text-xs sm:text-sm text-muted max-w-xs mb-5">
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
        /* Filtered Grid or List View */
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
                employeeCount={employeeCountMap[dept.id] || 0}
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

      {/* ── Create / Edit Department Modal (Standalone Subcomponent) ─ */}
      <DepartmentFormModal
        isOpen={modalOpen}
        editingDept={editingDept}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
      />

      {/* ── Delete Confirmation Modal (Standalone Subcomponent) ───── */}
      <DepartmentDeleteModal
        isOpen={deleteOpen}
        dept={deletingDept}
        onClose={() => setDeleteOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
