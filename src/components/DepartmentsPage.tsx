import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { Card, Button, Modal, Spinner, Skeleton, Avatar } from '@heroui/react';
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
  RotateCw,
  TrendingUp,
  Sparkles,
  ArrowUpDown,
  Phone,
  UserCheck,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { usePermissions } from '../context/PermissionsContext';
import { api, getImageUrl, formatMoney } from '../services/api';
import type { Department, CreateDepartmentDto, EmployeeListItem, ApiError } from '../services/api';
import { YaqeenMark } from './icons/YaqeenIcons';
import { Select } from './Select';

// Motion variants – refined, calm durations adhering to Yaqeen motion tokens (180-240ms)
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.24, ease: [0.2, 0, 0, 1] as const },
  },
};

type SortOption = 'name_asc' | 'name_desc' | 'employees_desc' | 'employees_asc' | 'newest';
type FilterStatus = 'all' | 'staffed' | 'empty';

/* ── Status Badge Subcomponent ────────────────────────────── */
const StatusBadge = memo(function StatusBadge({
  hasEmployees,
  count,
}: {
  hasEmployees: boolean;
  count: number;
}) {
  const { t } = useTranslation();

  if (hasEmployees) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-tight bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span className="tabular-nums font-bold">{count}</span>
        <span>{t('deptEmployeeCount')}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-tight bg-default/40 text-muted border border-border/30">
      <span className="size-1.5 rounded-full bg-muted/60 shrink-0" />
      <span>{t('deptUnstaffed')}</span>
    </span>
  );
});

/* ── Centered Department Team Members Modal ─────────────────── */
interface DepartmentMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  dept: Department | null;
  onEdit: (dept: Department) => void;
}

const DepartmentMembersModal = memo(function DepartmentMembersModal({
  isOpen,
  onClose,
  dept,
  onEdit,
}: DepartmentMembersModalProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');

  // Fetch employees assigned to this department
  useEffect(() => {
    if (isOpen && dept?.id) {
      let isMounted = true;
      setLoading(true);
      setStaffSearch('');
      api.employees
        .list({ department_id: dept.id, limit: 100 })
        .then((res) => {
          if (isMounted) {
            setEmployees(res?.data || res?.items || []);
          }
        })
        .catch((err) => {
          console.error('Failed to load department employees:', err);
          showNotification(t('internal_error'), 'error');
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
      return () => {
        isMounted = false;
      };
    } else {
      setEmployees([]);
    }
  }, [isOpen, dept?.id, showNotification, t]);

  const filteredStaff = useMemo(() => {
    if (!staffSearch.trim()) return employees;
    const q = staffSearch.toLowerCase().trim();
    return employees.filter(
      (emp) =>
        emp.full_name?.toLowerCase().includes(q) ||
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(q) ||
        emp.role_name?.toLowerCase().includes(q) ||
        emp.phone?.includes(q)
    );
  }, [employees, staffSearch]);

  if (!dept) return null;

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog className="max-w-lg w-[92vw] sm:w-full mx-auto rounded-2xl p-0 overflow-hidden bg-surface dark:bg-surface border border-border/30 shadow-2xl">
          <Modal.CloseTrigger className="absolute top-4 right-4 p-2 rounded-xl text-muted hover:text-foreground hover:bg-default/50 cursor-pointer focus:outline-none z-10 transition-colors">
            <X className="size-4" />
          </Modal.CloseTrigger>

          {/* Modal Header */}
          <Modal.Header className="px-6 py-5 border-b border-border/20 bg-surface">
            <div className="flex items-start gap-3.5 pr-8">
              <div className="size-11 rounded-xl bg-brand-royal/10 dark:bg-brand-royal/20 text-brand-royal dark:text-accent border border-brand-royal/15 dark:border-brand-royal/30 flex items-center justify-center shrink-0">
                <Building2 className="size-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <Modal.Heading className="font-serif font-bold text-lg sm:text-xl text-foreground truncate">
                  {dept.display_name}
                </Modal.Heading>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-[10px] text-muted/80 font-mono bg-default/40 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {dept.name}
                  </code>
                  <StatusBadge
                    hasEmployees={(dept.employee_count ?? 0) > 0}
                    count={dept.employee_count ?? 0}
                  />
                </div>
              </div>
            </div>

            {/* In-Modal Search bar if there are employees */}
            {employees.length > 0 && (
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted/50 pointer-events-none" />
                <input
                  type="text"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  placeholder={t('deptSearchStaff')}
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-field text-field-foreground border border-border/40 rounded-xl placeholder:text-muted/50 focus:outline-none focus:border-brand-royal focus:ring-2 focus:ring-brand-royal/10 transition-all duration-150"
                />
                {staffSearch && (
                  <button
                    type="button"
                    onClick={() => setStaffSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-1 rounded-lg cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            )}
          </Modal.Header>

          {/* Modal Body */}
          <Modal.Body className="p-6 max-h-[55vh] overflow-y-auto space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-border/20 bg-surface flex items-center gap-3"
                  >
                    <Skeleton className="size-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-32 rounded-md" />
                      <Skeleton className="h-3 w-20 rounded-md" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : employees.length === 0 ? (
              /* Empty state: No employees assigned to this dept */
              <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                <div className="size-12 rounded-xl bg-brand-royal/10 dark:bg-brand-royal/20 text-brand-royal dark:text-accent border border-brand-royal/15 flex items-center justify-center mb-3">
                  <Users className="size-6 opacity-70" />
                </div>
                <h4 className="font-serif font-bold text-sm sm:text-base text-foreground mb-1">
                  {t('deptNoStaffAssigned')}
                </h4>
                <p className="text-xs text-muted/70 max-w-xs leading-relaxed">
                  {t('deptStaffDrawerSubtitle')}
                </p>
              </div>
            ) : filteredStaff.length === 0 ? (
              /* No matching staff in search */
              <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                <Search className="size-7 text-muted/40 mb-2" />
                <h4 className="font-bold text-sm text-foreground mb-1">{t('deptNoStaffFound')}</h4>
                <p className="text-xs text-muted/70 max-w-xs mb-3">{t('deptNoStaffFoundDesc')}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => setStaffSearch('')}
                  className="text-xs text-brand-royal dark:text-accent font-semibold"
                >
                  {t('deptClearSearch')}
                </Button>
              </div>
            ) : (
              /* Staff member list */
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-muted uppercase tracking-wider px-1">
                  <span>
                    {t('deptStaffMembers')} ({filteredStaff.length})
                  </span>
                </div>

                {filteredStaff.map((emp) => {
                  const fullName =
                    emp.full_name || `${emp.first_name} ${emp.last_name}`.trim() || 'Employee';
                  const initials =
                    `${emp.first_name?.[0] || ''}${emp.last_name?.[0] || ''}`.toUpperCase();
                  const empColor = emp.color || '#0F2D5C';

                  return (
                    <div
                      key={emp.id}
                      className="group relative p-3.5 rounded-xl border border-border/30 bg-surface hover:border-border-strong hover:shadow-sm transition-all duration-150 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          className="size-10 text-xs font-bold text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: empColor }}
                        >
                          {emp.picture_url && (
                            <Avatar.Image src={getImageUrl(emp.picture_url)} alt={fullName} />
                          )}
                          <Avatar.Fallback>{initials}</Avatar.Fallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                              {fullName}
                            </span>
                            {emp.user_role && (
                              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-brand-royal/10 text-brand-royal dark:text-accent shrink-0">
                                {emp.user_role}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-muted mt-0.5">
                            {emp.role_name && (
                              <span className="truncate max-w-[140px]">{emp.role_name}</span>
                            )}
                            {emp.phone && (
                              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted/80">
                                <Phone className="size-2.5" />
                                {emp.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right side salary or status */}
                      <div className="flex flex-col items-end shrink-0">
                        {emp.fixed_salary && Number(emp.fixed_salary) > 0 ? (
                          <span className="text-xs font-bold font-mono text-foreground tabular-nums">
                            {formatMoney(Number(emp.fixed_salary), emp.currency || 'USD')}
                          </span>
                        ) : (
                          <span className="size-2 rounded-full bg-emerald-500" />
                        )}
                        <span className="text-[10px] text-muted/70 capitalize mt-0.5">
                          {emp.status
                            ? emp.status === 'active'
                              ? t('statusActive')
                              : emp.status
                            : t('statusActive')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Modal.Body>

          {/* Modal Footer */}
          <Modal.Footer className="px-6 py-4 border-t border-border/20 bg-surface flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onPress={() => {
                onClose();
                onEdit(dept);
              }}
              className="text-xs font-semibold text-muted hover:text-foreground gap-1.5"
            >
              <Pencil className="size-3.5" />
              {t('deptEditDept')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onPress={onClose}
              className="text-xs font-semibold px-4 min-h-[38px] rounded-xl"
            >
              {t('actionClose')}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
});

/* ── Memoized Department Grid Card ─────────────────────────── */
interface DepartmentCardProps {
  dept: Department;
  totalCompanyEmployees: number;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (dept: Department) => void;
  onDelete: (dept: Department) => void;
  onInspect: (dept: Department) => void;
  formatDate: (dateStr: string) => string;
}

const DepartmentCard = memo(function DepartmentCard({
  dept,
  totalCompanyEmployees,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  onInspect,
  formatDate,
}: DepartmentCardProps) {
  const { t } = useTranslation();
  const employeeCount = dept.employee_count ?? 0;
  const workforceShare =
    totalCompanyEmployees > 0 ? Math.round((employeeCount / totalCompanyEmployees) * 1000) / 10 : 0;

  return (
    <Card className="group relative overflow-hidden border border-border/30 bg-surface rounded-2xl hover:border-brand-royal/40 dark:hover:border-border-strong hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full">
      {/* Main Content Area */}
      <div className="p-5 sm:p-5.5 flex-1 flex flex-col justify-between gap-4">
        <div>
          {/* Top Row: Emblem Icon on Left, Edit & Delete actions on Right */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="size-11 rounded-xl bg-brand-royal/10 dark:bg-brand-royal/20 text-brand-royal dark:text-accent border border-brand-royal/15 dark:border-brand-royal/30 flex items-center justify-center shrink-0">
              <Building2 className="size-5" />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
              {canUpdate && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  onPress={() => onEdit(dept)}
                  aria-label={t('deptEditDept')}
                  className="text-muted hover:text-foreground hover:bg-default/60 min-h-[32px] min-w-[32px] rounded-lg"
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
                  aria-label={t('deptDeleteTitle')}
                  className="text-muted hover:text-rose-600 hover:bg-rose-500/10 min-h-[32px] min-w-[32px] rounded-lg"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Department Name & Machine Slug (Full Width, never truncated prematurely) */}
          <div className="space-y-1 mb-3.5">
            <h3
              className="font-serif font-bold text-base sm:text-[17px] text-foreground tracking-tight leading-snug cursor-pointer hover:text-brand-royal dark:hover:text-accent transition-colors break-words"
              title={dept.display_name}
              onClick={() => onInspect(dept)}
            >
              {dept.display_name}
            </h3>
            <div>
              <code className="text-[10px] text-muted font-mono bg-default/40 px-2 py-0.5 rounded-md uppercase tracking-wider inline-block">
                {dept.name}
              </code>
            </div>
          </div>

          {/* Workforce Share Progress Bar */}
          <div className="p-3 rounded-xl bg-default/20 border border-border/20 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted font-medium">{t('deptWorkforceShare')}</span>
              <span className="font-mono font-bold text-foreground tabular-nums">
                {workforceShare}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-border/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-royal dark:bg-accent transition-all duration-300"
                style={{ width: `${Math.min(workforceShare, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Status + Date + Dedicated Full-Width Inspect Button */}
        <div className="space-y-2.5 pt-2.5 border-t border-border/15">
          <div className="flex items-center justify-between gap-2">
            <StatusBadge hasEmployees={employeeCount > 0} count={employeeCount} />
            <span className="text-[11px] text-muted/70 flex items-center gap-1 shrink-0">
              <Calendar className="size-3 shrink-0" />
              <span>{formatDate(dept.created_at)}</span>
            </span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onPress={() => onInspect(dept)}
            className="w-full h-9 rounded-xl text-xs font-semibold text-brand-royal dark:text-accent bg-brand-royal/5 dark:bg-brand-royal/15 hover:bg-brand-royal/10 dark:hover:bg-brand-royal/25 border border-brand-royal/15 dark:border-brand-royal/30 gap-2 transition-colors justify-center"
          >
            <Users className="size-3.5 shrink-0" />
            <span className="truncate">{t('deptInspectStaff')}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
});

/* ── Memoized Department Table Row (List View) ─────────────── */
interface DepartmentTableRowProps {
  dept: Department;
  totalCompanyEmployees: number;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (dept: Department) => void;
  onDelete: (dept: Department) => void;
  onInspect: (dept: Department) => void;
  formatDate: (dateStr: string) => string;
}

const DepartmentTableRow = memo(function DepartmentTableRow({
  dept,
  totalCompanyEmployees,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  onInspect,
  formatDate,
}: DepartmentTableRowProps) {
  const { t } = useTranslation();
  const employeeCount = dept.employee_count ?? 0;
  const workforceShare =
    totalCompanyEmployees > 0 ? Math.round((employeeCount / totalCompanyEmployees) * 1000) / 10 : 0;

  return (
    <div className="group relative p-3.5 sm:p-4 border border-border/30 bg-surface rounded-xl hover:border-brand-royal/40 dark:hover:border-border-strong hover:shadow-sm transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left: Emblem & Details */}
      <div className="flex items-center gap-3 min-w-0 md:w-1/3">
        <div className="size-10 rounded-xl bg-brand-royal/10 dark:bg-brand-royal/20 text-brand-royal dark:text-accent border border-brand-royal/15 dark:border-brand-royal/30 flex items-center justify-center shrink-0">
          <Building2 className="size-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="font-serif font-bold text-sm sm:text-base text-foreground tracking-tight truncate cursor-pointer hover:text-brand-royal dark:hover:text-accent transition-colors"
              title={dept.display_name}
              onClick={() => onInspect(dept)}
            >
              {dept.display_name}
            </h3>
            <code className="text-[10px] text-muted font-mono bg-default/40 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
              {dept.name}
            </code>
          </div>
          <span className="text-[11px] text-muted/70 flex items-center gap-1.5 mt-0.5">
            <Calendar className="size-3" />
            {formatDate(dept.created_at)}
          </span>
        </div>
      </div>

      {/* Center: Workforce Distribution */}
      <div className="flex items-center gap-4 md:w-1/3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted font-medium">{t('deptWorkforceShare')}</span>
            <span className="font-mono font-bold text-foreground tabular-nums">
              {workforceShare}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-border/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-royal dark:bg-accent transition-all duration-300"
              style={{ width: `${Math.min(workforceShare, 100)}%` }}
            />
          </div>
        </div>

        <StatusBadge hasEmployees={employeeCount > 0} count={employeeCount} />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 self-end md:self-center shrink-0">
        <Button
          size="sm"
          variant="ghost"
          onPress={() => onInspect(dept)}
          className="text-xs font-semibold text-brand-royal dark:text-accent hover:bg-brand-royal/10 dark:hover:bg-brand-royal/20 px-3 h-8 rounded-lg gap-1.5"
        >
          <Users className="size-3.5" />
          <span className="hidden sm:inline">{t('deptInspectStaff')}</span>
        </Button>

        {canUpdate && (
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            onPress={() => onEdit(dept)}
            aria-label={t('deptEditDept')}
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
            aria-label={t('deptDeleteTitle')}
            className="text-muted hover:text-rose-600 hover:bg-rose-500/10 min-h-[36px] min-w-[36px] rounded-lg"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
});

/* ── Create / Edit Form Modal ──────────────────────────────── */
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

  const [formName, setFormName] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formErrors, setFormErrors] = useState<{ name?: string; display_name?: string }>({});
  const [saving, setSaving] = useState(false);
  const [isSlugAuto, setIsSlugAuto] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (editingDept) {
        setFormName(editingDept.name);
        setFormDisplayName(editingDept.display_name);
        setIsSlugAuto(false);
      } else {
        setFormName('');
        setFormDisplayName('');
        setIsSlugAuto(true);
      }
      setFormErrors({});
    }
  }, [isOpen, editingDept]);

  // Helper to generate machine slug from display name
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s_-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 100);
  };

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormDisplayName(val);
    setFormErrors((p) => ({ ...p, display_name: undefined }));

    if (isSlugAuto && !editingDept) {
      setFormName(generateSlug(val));
      setFormErrors((p) => ({ ...p, name: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: { name?: string; display_name?: string } = {};
    if (!formDisplayName || formDisplayName.trim().length < 2 || formDisplayName.length > 100) {
      errors.display_name = t('fieldNameLength') || 'Name must be between 2 and 100 characters';
    }
    if (!formName || formName.trim().length < 2 || formName.length > 100) {
      errors.name = t('fieldNameLength') || 'Name must be between 2 and 100 characters';
    }
    if (!/^[a-z0-9_-]+$/.test(formName)) {
      errors.name = t('deptFieldNameHint');
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      const dto: CreateDepartmentDto = {
        name: formName.trim().toLowerCase(),
        display_name: formDisplayName.trim(),
      };
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
          <Modal.CloseTrigger className="absolute top-4 right-4 p-2 rounded-xl text-muted hover:text-foreground hover:bg-default/50 cursor-pointer focus:outline-none z-10 transition-colors">
            <X className="size-4" />
          </Modal.CloseTrigger>

          <form onSubmit={handleSave} className="flex flex-col max-h-[85vh]">
            <Modal.Header className="px-6 py-5 border-b border-border/20 bg-surface">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-brand-royal/10 dark:bg-brand-royal/20 text-brand-royal dark:text-accent border border-brand-royal/15 dark:border-brand-royal/30 flex items-center justify-center">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <Modal.Heading className="font-serif font-bold text-lg sm:text-xl text-foreground">
                    {editingDept ? t('deptEditDept') : t('deptNewDept')}
                  </Modal.Heading>
                  <p className="text-xs text-muted/70 mt-0.5">{t('deptSubtitle')}</p>
                </div>
              </div>
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-5 p-6 overflow-y-auto">
              {/* Display Name */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-foreground tracking-wide uppercase">
                  {t('deptFieldDisplayName')} *
                </label>
                <input
                  type="text"
                  value={formDisplayName}
                  onChange={handleDisplayNameChange}
                  placeholder={t('deptFieldDisplayNamePlaceholder')}
                  autoComplete="off"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-field text-field-foreground border transition-all duration-150 focus:outline-none focus:border-brand-royal focus:ring-2 focus:ring-brand-royal/10
                      ${formErrors.display_name ? 'border-rose-500 focus:ring-rose-500/30' : 'border-field-border hover:border-border-strong'}`}
                />
                <p
                  className={`text-[11px] ${formErrors.display_name ? 'text-rose-500 font-medium' : 'text-muted/70'}`}
                >
                  {formErrors.display_name
                    ? formErrors.display_name
                    : t('deptFieldDisplayNameHint')}
                </p>
              </div>

              {/* Machine Name Slug */}
              <div className="flex flex-col gap-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground tracking-wide uppercase">
                    {t('deptFieldName')} *
                  </label>
                  {!editingDept && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSlugAuto(!isSlugAuto);
                        if (!isSlugAuto) setFormName(generateSlug(formDisplayName));
                      }}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors ${
                        isSlugAuto
                          ? 'bg-brand-royal/10 text-brand-royal dark:text-accent'
                          : 'bg-default/40 text-muted hover:text-foreground'
                      }`}
                    >
                      {isSlugAuto ? t('deptAutoSlugOn') : t('deptAutoSlugOff')}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => {
                    setIsSlugAuto(false);
                    setFormName(e.target.value.toLowerCase());
                    setFormErrors((p) => ({ ...p, name: undefined }));
                  }}
                  placeholder={t('deptFieldNamePlaceholder')}
                  autoComplete="off"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-field text-field-foreground border transition-all duration-150 focus:outline-none focus:border-brand-royal focus:ring-2 focus:ring-brand-royal/10 font-mono
                      ${formErrors.name ? 'border-rose-500 focus:ring-rose-500/30' : 'border-field-border hover:border-border-strong'}`}
                />
                <p
                  className={`text-[11px] ${formErrors.name ? 'text-rose-500 font-medium' : 'text-muted/70'}`}
                >
                  {formErrors.name ? formErrors.name : t('deptFieldNameHint')}
                </p>
              </div>
            </Modal.Body>

            <Modal.Footer className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border/20 bg-surface">
              <Button
                type="button"
                variant="ghost"
                onPress={onClose}
                className="font-semibold text-xs sm:text-sm min-h-[40px] px-4 rounded-xl"
              >
                {t('actionCancel')}
              </Button>
              <Button
                type="submit"
                isDisabled={saving}
                className="bg-brand-royal hover:bg-brand-royal-hover text-white font-semibold text-xs sm:text-sm min-h-[40px] px-5 min-w-[110px] rounded-xl shadow-sm"
              >
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size="sm" />
                    {editingDept ? t('actionSaving') : t('actionCreating')}
                  </span>
                ) : editingDept ? (
                  t('actionSave')
                ) : (
                  t('actionCreate')
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
        <Modal.Dialog className="max-w-sm w-[92vw] sm:w-full mx-auto rounded-2xl p-6 bg-surface dark:bg-surface border border-border/30 shadow-2xl">
          <Modal.CloseTrigger className="absolute top-4 right-4 p-2 rounded-xl text-muted hover:text-foreground hover:bg-default/50 cursor-pointer focus:outline-none" />
          <Modal.Body className="flex flex-col items-center text-center py-3 gap-4">
            <div className="size-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 ring-1 ring-rose-500/20 shadow-sm">
              <AlertTriangle className="size-7" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground font-serif">
                {t('deptDeleteTitle')}
              </h3>
              <p className="text-xs text-muted/80 leading-relaxed max-w-[280px] mt-1.5">
                {t('deptDeleteDesc')}
              </p>
            </div>

            {dept && (
              <div className="flex items-center gap-2.5 bg-default/30 px-3.5 py-2.5 rounded-xl border border-border/25 max-w-full">
                <Building2 className="size-4 text-brand-royal dark:text-accent shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                  {dept.display_name}
                </span>
                <code className="text-[10px] text-muted/70 font-mono shrink-0">({dept.name})</code>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="flex items-center justify-center gap-2.5 pt-2">
            <Button
              type="button"
              variant="ghost"
              onPress={onClose}
              className="font-semibold text-xs sm:text-sm min-h-[38px] px-4 rounded-xl"
            >
              {t('actionCancel')}
            </Button>
            <Button
              type="button"
              onPress={handleDelete}
              isDisabled={deleting}
              className="bg-rose-600 text-white hover:bg-rose-700 font-semibold text-xs sm:text-sm min-h-[38px] px-5 min-w-[130px] rounded-xl shadow-sm"
            >
              {deleting ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="sm" /> {t('actionDelete')}
                </span>
              ) : (
                t('deptDeleteConfirm')
              )}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
});

/* ── Main Redesigned Departments Page Component ────────────── */
export function DepartmentsPage() {
  const { t, locale } = useTranslation();
  const { showNotification } = useNotification();
  const { canCreate, canUpdate, canDelete } = usePermissions();

  // Data states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search, Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');

  // Modal visibility states
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [inspectOpen, setInspectOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [inspectingDept, setInspectingDept] = useState<Department | null>(null);

  // Fetch departments list
  const fetchData = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);

        const deptData = await api.departments.list();
        setDepartments(deptData || []);
      } catch (err) {
        const error = err as ApiError;
        showNotification(t(error?.location || 'internal_error'), 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showNotification, t]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Computed aggregate metrics
  const totalEmployeesCount = useMemo(
    () => departments.reduce((sum, dept) => sum + (dept.employee_count ?? 0), 0),
    [departments]
  );

  const staffedDepartmentsCount = useMemo(
    () => departments.filter((d) => (d.employee_count ?? 0) > 0).length,
    [departments]
  );

  const staffedRate = useMemo(
    () =>
      departments.length > 0 ? Math.round((staffedDepartmentsCount / departments.length) * 100) : 0,
    [departments, staffedDepartmentsCount]
  );

  const largestDept = useMemo(() => {
    if (departments.length === 0) return null;
    return [...departments].sort((a, b) => (b.employee_count ?? 0) - (a.employee_count ?? 0))[0];
  }, [departments]);

  // Filtered & Sorted departments
  const filteredAndSortedDepartments = useMemo(() => {
    let list = [...departments];

    // Status filter
    if (statusFilter === 'staffed') {
      list = list.filter((d) => (d.employee_count ?? 0) > 0);
    } else if (statusFilter === 'empty') {
      list = list.filter((d) => (d.employee_count ?? 0) === 0);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (dept) => dept.display_name.toLowerCase().includes(q) || dept.name.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      switch (sortBy) {
        case 'name_desc':
          return b.display_name.localeCompare(a.display_name);
        case 'employees_desc':
          return (b.employee_count ?? 0) - (a.employee_count ?? 0);
        case 'employees_asc':
          return (a.employee_count ?? 0) - (b.employee_count ?? 0);
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'name_asc':
        default:
          return a.display_name.localeCompare(b.display_name);
      }
    });

    return list;
  }, [departments, statusFilter, searchQuery, sortBy]);

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

  const openInspectModal = useCallback((dept: Department) => {
    setInspectingDept(dept);
    setInspectOpen(true);
  }, []);

  const formatDate = useCallback(
    (dateStr: string) => {
      try {
        const localeCode = locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US';
        return new Date(dateStr).toLocaleDateString(localeCode, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } catch {
        return dateStr;
      }
    },
    [locale]
  );

  return (
    <div className="flex flex-col gap-6 sm:gap-7 md:gap-8 pb-12">
      {/* ── Executive Branded Header ───────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-surface border border-border/30 p-6 sm:p-7 md:p-8 shadow-sm">
        {/* Subtle Arabic Emblem Watermark Atmosphere (2-5% opacity) */}
        <div className="absolute -right-8 -bottom-10 opacity-[0.03] dark:opacity-[0.06] pointer-events-none select-none">
          <YaqeenMark size={260} variant="current" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold text-brand-royal dark:text-accent uppercase tracking-widest font-mono">
              <Sparkles className="size-3 text-brand-gold" />
              {t('deptOverline')}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif text-foreground tracking-tight">
              {t('deptTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-muted max-w-xl leading-relaxed">
              {t('deptSubtitle')}
            </p>
          </div>

          {/* Action Cluster */}
          <div className="flex items-center gap-2.5 self-start md:self-center shrink-0 flex-wrap">
            <Button
              variant="ghost"
              onPress={() => fetchData(true)}
              isDisabled={refreshing || loading}
              className="border border-border/40 text-foreground hover:bg-default/40 font-semibold rounded-xl px-3.5 min-h-[42px] gap-2 transition-all duration-150"
              aria-label={t('deptRefresh')}
            >
              <RotateCw className={`size-4 ${refreshing ? 'animate-spin text-brand-royal' : ''}`} />
              <span className="text-xs sm:text-sm">{t('deptRefresh')}</span>
            </Button>

            {canCreate('departments') && (
              <Button
                onPress={openCreateModal}
                className="bg-brand-royal hover:bg-brand-royal-hover text-white font-semibold rounded-xl px-5 min-h-[42px] shadow-sm transition-all duration-150 gap-2"
              >
                <Plus className="size-4" />
                <span className="text-xs sm:text-sm">{t('deptAddNew')}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Summary Metric Analytics Grid ─────────────────────── */}
      {!loading && departments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4"
        >
          {/* 1. Total Departments */}
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-surface border border-border/30 flex items-center gap-3.5 group hover:border-border-strong hover:shadow-sm transition-all duration-200">
            <div className="size-11 sm:size-12 rounded-xl bg-brand-royal/10 dark:bg-brand-royal/20 flex items-center justify-center text-brand-royal dark:text-accent shrink-0 border border-brand-royal/15 dark:border-brand-royal/30">
              <Building2 className="size-5 sm:size-6" />
            </div>
            <div className="relative min-w-0">
              <p className="text-[10px] sm:text-xs text-muted font-medium uppercase tracking-wider truncate">
                {t('deptTotalCount')}
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-foreground mt-0.5 tabular-nums">
                {departments.length}
              </p>
            </div>
          </div>

          {/* 2. Total Employees */}
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-surface border border-border/30 flex items-center gap-3.5 group hover:border-border-strong hover:shadow-sm transition-all duration-200">
            <div className="size-11 sm:size-12 rounded-xl bg-default/40 flex items-center justify-center text-foreground shrink-0 border border-border/40">
              <Users className="size-5 sm:size-6" />
            </div>
            <div className="relative min-w-0">
              <p className="text-[10px] sm:text-xs text-muted font-medium uppercase tracking-wider truncate">
                {t('deptTotalEmployees')}
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-foreground mt-0.5 tabular-nums">
                {totalEmployeesCount}
              </p>
            </div>
          </div>

          {/* 3. Staffed Coverage Rate */}
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-surface border border-border/30 flex items-center gap-3.5 group hover:border-border-strong hover:shadow-sm transition-all duration-200">
            <div className="size-11 sm:size-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-500/20">
              <UserCheck className="size-5 sm:size-6" />
            </div>
            <div className="relative min-w-0">
              <p className="text-[10px] sm:text-xs text-muted font-medium uppercase tracking-wider truncate">
                {t('deptStaffedRate')}
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <p className="text-xl sm:text-2xl font-bold font-mono text-foreground tabular-nums">
                  {staffedRate}%
                </p>
                <span className="text-[10px] text-muted font-mono">
                  ({staffedDepartmentsCount}/{departments.length})
                </span>
              </div>
            </div>
          </div>

          {/* 4. Largest Department */}
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-surface border border-border/30 flex items-center gap-3.5 group hover:border-border-strong hover:shadow-sm transition-all duration-200">
            <div className="size-11 sm:size-12 rounded-xl bg-brand-royal/10 dark:bg-brand-royal/20 flex items-center justify-center text-brand-royal dark:text-accent shrink-0 border border-brand-royal/15 dark:border-brand-royal/30">
              <TrendingUp className="size-5 sm:size-6" />
            </div>
            <div className="relative min-w-0">
              <p className="text-[10px] sm:text-xs text-muted font-medium uppercase tracking-wider truncate">
                {t('deptLargestTeam')}
              </p>
              <p
                className="text-sm sm:text-base font-bold font-serif text-foreground truncate mt-0.5"
                title={largestDept?.display_name || '-'}
              >
                {largestDept?.display_name || '-'}
              </p>
              <span className="text-[10px] text-muted font-mono tabular-nums">
                {largestDept?.employee_count ?? 0} {t('deptEmployeeCount')}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Advanced Toolbar: Filters, Search, Sort & View Mode ── */}
      {departments.length > 0 && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 bg-surface border border-border/30 p-3 sm:p-3.5 rounded-2xl">
          {/* Left: Search + Filter Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted/60 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('deptSearchPlaceholder')}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-field text-field-foreground border border-border/40 rounded-xl placeholder:text-muted/50 focus:outline-none focus:border-brand-royal focus:ring-2 focus:ring-brand-royal/10 transition-all duration-150"
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
                    aria-label={t('deptClearSearch')}
                  >
                    <X className="size-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-default/30 p-1 rounded-xl shrink-0 overflow-x-auto no-scrollbar">
              {(
                [
                  { key: 'all', labelKey: 'deptFilterAll', count: departments.length },
                  { key: 'staffed', labelKey: 'deptFilterStaffed', count: staffedDepartmentsCount },
                  {
                    key: 'empty',
                    labelKey: 'deptFilterEmpty',
                    count: departments.length - staffedDepartmentsCount,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === tab.key
                      ? 'bg-surface text-brand-royal dark:text-accent shadow-sm ring-1 ring-border/20'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  <span>{t(tab.labelKey)}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-mono ${
                      statusFilter === tab.key
                        ? 'bg-brand-royal/10 text-brand-royal dark:text-accent'
                        : 'bg-default/60 text-muted'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Sort & View Mode */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/20">
            {/* Sort select */}
            <Select
              size="sm"
              value={sortBy}
              onChange={(v) => setSortBy(v as SortOption)}
              aria-label={t('deptSortBy')}
              startContent={<ArrowUpDown className="size-3.5 text-muted shrink-0" />}
              hideSelectedIcon
              allowClear={false}
              fullWidth={false}
              className="shrink-0"
              options={[
                { value: 'name_asc', label: t('deptSortNameAsc') },
                { value: 'name_desc', label: t('deptSortNameDesc') },
                { value: 'employees_desc', label: t('deptSortEmployeesDesc') },
                { value: 'employees_asc', label: t('deptSortEmployeesAsc') },
                { value: 'newest', label: t('deptSortNewest') },
              ]}
            />

            {/* View Mode Toggle */}
            <div className="flex items-center gap-0.5 bg-default/30 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-surface text-brand-royal dark:text-accent shadow-sm ring-1 ring-border/20'
                    : 'text-muted hover:text-foreground'
                }`}
                aria-label={t('deptViewGrid')}
              >
                <LayoutGrid className="size-3.5" />
                <span className="hidden sm:inline">{t('deptViewGrid')}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-surface text-brand-royal dark:text-accent shadow-sm ring-1 ring-border/20'
                    : 'text-muted hover:text-foreground'
                }`}
                aria-label={t('deptViewList')}
              >
                <List className="size-3.5" />
                <span className="hidden sm:inline">{t('deptViewList')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content: Grid / Table Display / Loading / Empty States ── */}
      {loading ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5'
              : 'flex flex-col gap-3'
          }
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card
              key={i}
              className="p-5 sm:p-6 border border-border/30 bg-surface rounded-2xl space-y-4"
            >
              <div className="flex items-center gap-3.5">
                <Skeleton className="size-11 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-8 w-full rounded-xl" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      ) : departments.length === 0 ? (
        /* Empty State: Zero Departments in System */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.24 }}
          className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4 rounded-3xl border border-border/30 bg-surface shadow-sm"
        >
          <div className="size-16 rounded-2xl bg-brand-royal/10 dark:bg-brand-royal/20 text-brand-royal dark:text-accent border border-brand-royal/20 flex items-center justify-center mb-5">
            <Building2 className="size-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold font-serif text-foreground mb-2">
            {t('deptNoDepartments')}
          </h3>
          <p className="text-xs sm:text-sm text-muted max-w-sm mb-7 leading-relaxed">
            {t('deptNoDepartmentsDesc')}
          </p>
          {canCreate('departments') && (
            <Button
              onPress={openCreateModal}
              className="bg-brand-royal hover:bg-brand-royal-hover text-white font-semibold rounded-xl px-6 min-h-[44px] shadow-sm gap-2"
            >
              <Plus className="size-4" />
              {t('deptAddNew')}
            </Button>
          )}
        </motion.div>
      ) : filteredAndSortedDepartments.length === 0 ? (
        /* Empty State: Zero Search / Filter matches */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center justify-center py-14 sm:py-20 text-center px-4 bg-surface border border-border/30 rounded-2xl"
        >
          <div className="size-14 rounded-2xl bg-default/40 flex items-center justify-center text-muted/60 mb-4 border border-border/30">
            <Search className="size-6" />
          </div>
          <h3 className="text-base font-bold font-serif text-foreground mb-1">
            {t('deptNoSearchResults')}
          </h3>
          <p className="text-xs text-muted max-w-xs mb-5 leading-relaxed">
            {t('deptNoSearchResultsDesc')}
          </p>
          <Button
            variant="ghost"
            onPress={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="text-brand-royal dark:text-accent hover:bg-brand-royal/10 font-semibold text-xs rounded-xl px-4 min-h-[38px]"
          >
            {t('deptClearSearch')}
          </Button>
        </motion.div>
      ) : (
        /* Render Department Cards (Grid / List) */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5'
              : 'flex flex-col gap-3'
          }
        >
          {filteredAndSortedDepartments.map((dept) => (
            <motion.div key={dept.id} variants={itemVariants}>
              {viewMode === 'grid' ? (
                <DepartmentCard
                  dept={dept}
                  totalCompanyEmployees={totalEmployeesCount}
                  canUpdate={canUpdate('departments')}
                  canDelete={canDelete('departments')}
                  onEdit={openEditModal}
                  onDelete={openDeleteDialog}
                  onInspect={openInspectModal}
                  formatDate={formatDate}
                />
              ) : (
                <DepartmentTableRow
                  dept={dept}
                  totalCompanyEmployees={totalEmployeesCount}
                  canUpdate={canUpdate('departments')}
                  canDelete={canDelete('departments')}
                  onEdit={openEditModal}
                  onDelete={openDeleteDialog}
                  onInspect={openInspectModal}
                  formatDate={formatDate}
                />
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Modals ────────────────────────────────────────────── */}
      <DepartmentMembersModal
        isOpen={inspectOpen}
        dept={inspectingDept}
        onClose={() => setInspectOpen(false)}
        onEdit={openEditModal}
      />

      <DepartmentFormModal
        isOpen={modalOpen}
        editingDept={editingDept}
        onClose={() => setModalOpen(false)}
        onSuccess={() => fetchData()}
      />

      <DepartmentDeleteModal
        isOpen={deleteOpen}
        dept={deletingDept}
        onClose={() => setDeleteOpen(false)}
        onSuccess={() => fetchData()}
      />
    </div>
  );
}
