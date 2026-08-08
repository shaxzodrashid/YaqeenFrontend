import { useEffect, useState, useCallback } from 'react';
import { Card, Button, Modal, Spinner, Skeleton } from '@heroui/react';
import { motion } from 'framer-motion';
import { Building2, Plus, Pencil, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { usePermissions } from '../context/PermissionsContext';
import { api } from '../services/api';
import type { Department, CreateDepartmentDto, ApiError } from '../services/api';
import { T } from './T';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export function DepartmentsPage() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formErrors, setFormErrors] = useState<{ name?: string; display_name?: string }>({});

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.departments.list();
      setDepartments(data);
    } catch (err) {
      const error = err as ApiError;
      showNotification(t(error?.location || 'internal_error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification, t]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const openCreateModal = () => {
    setEditingDept(null);
    setFormName('');
    setFormDisplayName('');
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setFormName(dept.name);
    setFormDisplayName(dept.display_name);
    setFormErrors({});
    setModalOpen(true);
  };

  const openDeleteDialog = (dept: Department) => {
    setDeletingDept(dept);
    setDeleteOpen(true);
  };

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

  const handleSave = async () => {
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
      setModalOpen(false);
      fetchDepartments();
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

  const handleDelete = async () => {
    if (!deletingDept) return;
    setDeleting(true);
    try {
      await api.departments.delete(deletingDept.id);
      showNotification(t('successDeptDeleted'), 'success');
      setDeleteOpen(false);
      setDeletingDept(null);
      fetchDepartments();
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold font-serif text-foreground"><T k="deptTitle" /></h1>
          <p className="text-sm text-muted mt-1"><T k="deptSubtitle" /></p>
        </div>
        {canCreate('departments') && (
          <Button
            onPress={openCreateModal}
            className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-semibold rounded-xl px-5 shrink-0"
          >
            <Plus className="size-4 mr-2" />
            <T k="deptAddNew" />
          </Button>
        )}
      </motion.div>

      {/* Department Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-5 border border-border/40 bg-surface rounded-2xl">
              <Skeleton className="h-5 w-32 rounded-lg mb-3" />
              <Skeleton className="h-4 w-24 rounded-lg mb-4" />
              <Skeleton className="h-3 w-40 rounded-lg" />
            </Card>
          ))}
        </div>
      ) : departments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="size-20 rounded-2xl bg-brand-gold/10 dark:bg-brand-gold/15 flex items-center justify-center text-brand-gold mb-6">
            <Building2 className="size-9" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2"><T k="deptNoDepartments" /></h3>
          <p className="text-sm text-muted max-w-sm mb-6"><T k="deptNoDepartmentsDesc" /></p>
          <Button
            onPress={openCreateModal}
            className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-semibold rounded-xl px-5"
          >
            <Plus className="size-4 mr-2" />
            <T k="deptAddNew" />
          </Button>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {departments.map((dept) => (
            <motion.div key={dept.id} variants={cardVariants} layout>
              <Card className="group p-5 border border-border/40 bg-surface dark:bg-surface rounded-2xl hover:border-brand-gold/30 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-brand-gold/10 dark:bg-brand-gold/15 flex items-center justify-center text-brand-gold shrink-0">
                      <Building2 className="size-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="text-sm font-bold text-foreground truncate">{dept.display_name}</h3>
                      <code className="text-[11px] text-muted font-mono bg-default/50 px-1.5 py-0.5 rounded mt-0.5 w-fit">{dept.name}</code>
                    </div>
                  </div>

                  {/* Action Buttons - visible on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {canUpdate('departments') && (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        onPress={() => openEditModal(dept)}
                        className="text-muted hover:text-foreground hover:bg-default/50"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    )}
                    {canDelete('departments') && (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        onPress={() => openDeleteDialog(dept)}
                        className="text-muted hover:text-rose-500 hover:bg-rose-500/10"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-muted mt-2">
                  <Calendar className="size-3" />
                  <span><T k="deptCreatedAt" />: {formatDate(dept.created_at)}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create/Edit Modal */}
      <Modal.Backdrop isOpen={modalOpen} onOpenChange={setModalOpen}>
        <Modal.Container>
            <Modal.Dialog className="max-w-md">
              <Modal.CloseTrigger className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-default/50 cursor-pointer focus:outline-none" />
              <Modal.Header>
                <Modal.Heading className="font-serif font-bold text-lg">
                  {editingDept ? <T k="deptEditDept" /> : <T k="deptNewDept" />}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-5 py-5">
                {/* Machine Name */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-semibold text-foreground"><T k="deptFieldName" /></label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => { setFormName(e.target.value.toLowerCase()); setFormErrors((p) => ({ ...p, name: undefined })); }}
                    placeholder="marketing-hq"
                    className={`w-full px-3 py-2.5 rounded-xl text-sm bg-field text-field-foreground border transition-colors focus:outline-none focus:ring-2 focus:ring-focus/30 font-mono
                      ${formErrors.name ? 'border-rose-500 focus:ring-rose-500/30' : 'border-field-border'}`}
                  />
                  <p className={`text-[11px] ${formErrors.name ? 'text-rose-500' : 'text-muted'}`}>
                    {formErrors.name ? formErrors.name : <T k="deptFieldNameHint" />}
                  </p>
                </div>

                {/* Display Name */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-semibold text-foreground"><T k="deptFieldDisplayName" /></label>
                  <input
                    type="text"
                    value={formDisplayName}
                    onChange={(e) => { setFormDisplayName(e.target.value); setFormErrors((p) => ({ ...p, display_name: undefined })); }}
                    placeholder="Marketing HQ"
                    className={`w-full px-3 py-2.5 rounded-xl text-sm bg-field text-field-foreground border transition-colors focus:outline-none focus:ring-2 focus:ring-focus/30
                      ${formErrors.display_name ? 'border-rose-500 focus:ring-rose-500/30' : 'border-field-border'}`}
                  />
                  <p className={`text-[11px] ${formErrors.display_name ? 'text-rose-500' : 'text-muted'}`}>
                    {formErrors.display_name ? formErrors.display_name : <T k="deptFieldDisplayNameHint" />}
                  </p>
                </div>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button variant="ghost" onPress={() => setModalOpen(false)} className="font-semibold">
                  <T k="actionCancel" />
                </Button>
                <Button
                  onPress={handleSave}
                  isDisabled={saving}
                  className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-semibold min-w-[100px]"
                >
                  {saving ? (
                    <span className="inline-flex items-center gap-2"><Spinner size="sm" /> {editingDept ? <T k="actionSaving" /> : <T k="actionCreating" />}</span>
                  ) : (
                    editingDept ? <T k="actionSave" /> : <T k="actionCreate" />
                  )}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>

      {/* Delete Confirmation Modal */}
      <Modal.Backdrop isOpen={deleteOpen} onOpenChange={setDeleteOpen}>
        <Modal.Container>
            <Modal.Dialog className="max-w-sm">
              <Modal.CloseTrigger className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-default/50 cursor-pointer focus:outline-none" />
              <Modal.Body className="flex flex-col items-center text-center py-8 gap-4">
                <div className="size-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <AlertTriangle className="size-7" />
                </div>
                <h3 className="text-lg font-bold text-foreground font-serif"><T k="deptDeleteTitle" /></h3>
                <p className="text-sm text-muted leading-relaxed"><T k="deptDeleteDesc" /></p>
                {deletingDept && (
                  <div className="flex items-center gap-2 bg-default/30 px-3 py-2 rounded-xl">
                    <Building2 className="size-4 text-muted" />
                    <span className="text-sm font-semibold text-foreground">{deletingDept.display_name}</span>
                    <code className="text-[11px] text-muted font-mono">({deletingDept.name})</code>
                  </div>
                )}
              </Modal.Body>
              <Modal.Footer className="flex justify-center gap-3 pb-6">
                <Button variant="ghost" onPress={() => setDeleteOpen(false)} className="font-semibold">
                  <T k="actionCancel" />
                </Button>
                <Button
                  onPress={handleDelete}
                  isDisabled={deleting}
                  className="bg-rose-500 text-white hover:bg-rose-600 font-semibold min-w-[140px]"
                >
                  {deleting ? (
                    <span className="inline-flex items-center gap-2"><Spinner size="sm" /> <T k="actionDelete" /></span>
                  ) : (
                    <T k="deptDeleteConfirm" />
                  )}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
    </div>
  );
}

