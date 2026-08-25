import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Button, Avatar } from '@heroui/react';
import {
  Calendar,
  Clock,
  CheckSquare,
  Paperclip,
  MessageSquare,
  History,
  Trash2,
  Download,
  Upload,
  Plus,
  AlertTriangle,
  CheckCircle2,
  FileText,
  FileCode,
  Image as ImageIcon,
  FileArchive,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { usePermissions } from '../../context/PermissionsContext';
import { api, getImageUrl, tokenStore } from '../../services/api';
import type { Task, KanbanColumn, Employee, TaskPriority, TaskChecklist } from '../../services/api';
import { RichTextEditor } from './RichTextEditor';
import { getColumnColor } from '../../utils/columnColor';

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string | null;
  columns: KanbanColumn[];
  employees: Employee[];
  onTaskUpdated: () => void;
}

const EXECUTABLE_EXTENSIONS = ['.exe', '.dll', '.bat', '.sh', '.cmd', '.msi'];
const EMPLOYEE_PAGE_LIMIT = 6;

export function TaskDetailsModal({
  isOpen,
  onClose,
  taskId,
  columns,
  employees,
  onTaskUpdated,
}: TaskDetailsModalProps) {
  const { t } = useTranslation();
  const { canUpdate, canDelete } = usePermissions();
  const currentUser = tokenStore.getUser();

  const [task, setTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'attachments' | 'logs'>(
    'details'
  );

  // Task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [columnId, setColumnId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [targetTime, setTargetTime] = useState('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);

  // Backend employee search and pagination state
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [debouncedEmployeeSearchQuery, setDebouncedEmployeeSearchQuery] = useState('');
  const [employeePage, setEmployeePage] = useState(1);
  const [employeeList, setEmployeeList] = useState<Employee[]>([]);
  const [employeeMeta, setEmployeeMeta] = useState<{
    totalPages: number;
    totalItems: number;
    currentPage: number;
  }>({ totalPages: 1, totalItems: 0, currentPage: 1 });
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [knownEmployeesMap, setKnownEmployeesMap] = useState<Record<string, Employee>>({});

  // Seed known employees cache from initial prop
  useEffect(() => {
    if (employees && employees.length > 0) {
      setKnownEmployeesMap((prev) => {
        const next = { ...prev };
        employees.forEach((emp) => {
          if (emp?.id) next[emp.id] = emp;
        });
        return next;
      });
    }
  }, [employees]);

  // Reset employee search query and page when modal opens or selected task changes
  useEffect(() => {
    if (isOpen) {
      setEmployeeSearchQuery('');
      setDebouncedEmployeeSearchQuery('');
      setEmployeePage(1);
    }
  }, [isOpen, taskId]);

  // Debounce search query input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEmployeeSearchQuery(employeeSearchQuery.trim());
      setEmployeePage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [employeeSearchQuery]);

  // Fetch employees from backend with search and pagination
  const fetchEmployees = useCallback(async (query: string, pageNum: number) => {
    try {
      setLoadingEmployees(true);
      const res: any = await api.employees.list({
        page: pageNum,
        limit: EMPLOYEE_PAGE_LIMIT,
        search: query || undefined,
      });

      let items: Employee[] = [];
      let meta = { totalPages: 1, totalItems: 0, currentPage: pageNum };

      if (Array.isArray(res)) {
        items = res;
        meta = { totalPages: 1, totalItems: res.length, currentPage: 1 };
      } else if (res?.items) {
        items = res.items;
        meta = {
          totalPages: res.meta?.totalPages || 1,
          totalItems: res.meta?.totalItems ?? items.length,
          currentPage: res.meta?.currentPage || pageNum,
        };
      }

      setEmployeeList(items);
      setEmployeeMeta(meta);

      // Store into known cache
      setKnownEmployeesMap((prev) => {
        const next = { ...prev };
        items.forEach((emp) => {
          if (emp?.id) next[emp.id] = emp;
        });
        return next;
      });
    } catch (err) {
      console.error('Failed to fetch employees for task modal:', err);
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  // Trigger backend fetch when modal is open, debounced query changes, or page changes
  useEffect(() => {
    if (isOpen) {
      fetchEmployees(debouncedEmployeeSearchQuery, employeePage);
    }
  }, [isOpen, debouncedEmployeeSearchQuery, employeePage, fetchEmployees]);

  // Checklist state
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [addingChecklist, setAddingChecklist] = useState(false);

  // Comment state
  const [newCommentContent, setNewCommentContent] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Attachment upload state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load task full details
  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetails(taskId);
    } else {
      setTask(null);
    }
  }, [isOpen, taskId]);

  const fetchTaskDetails = async (id: string) => {
    try {
      const data = await api.tasks.getTask(id);
      setTask(data);
      setTitle(data.title || '');
      setDescription(data.description || '');
      setPriority(data.priority || 'MEDIUM');
      setColumnId(data.columnId || '');
      setDueDate(data.dueDate ? new Date(data.dueDate).toISOString().slice(0, 16) : '');
      setTargetTime(data.targetTime ? new Date(data.targetTime).toISOString().slice(0, 16) : '');

      const assigneeIds =
        data.assignees?.map((a) => a.id) || (data.assigneeId ? [data.assigneeId] : []);
      setSelectedAssigneeIds(assigneeIds);

      if (data.assignees && data.assignees.length > 0) {
        setKnownEmployeesMap((prev) => {
          const next = { ...prev };
          data.assignees?.forEach((a: any) => {
            if (a?.id) {
              const existing = next[a.id] || {};
              next[a.id] = {
                ...existing,
                id: a.id,
                first_name: a.firstName || a.first_name || existing.first_name || '',
                last_name: a.lastName || a.last_name || existing.last_name || '',
                phone: a.phone || existing.phone || '',
                color: a.color || existing.color || '#3B82F6',
                picture_url: a.picture_url || a.pictureUrl || existing.picture_url || null,
                user_role: a.user_role || a.userRole || existing.user_role,
                department_name: a.department_name || a.departmentName || existing.department_name,
              } as Employee;
            }
          });
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to load task details:', err);
    }
  };

  const getBadgeColorStyle = (rawColor?: string | null) => {
    const color = (rawColor || '#3B82F6').trim();
    let hex = color;
    if (/^#[0-9A-Fa-f]{3}$/.test(hex)) {
      hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      return {
        backgroundColor: `${hex}20`,
        borderColor: `${hex}50`,
        color: hex,
      };
    }
    return {
      backgroundColor: color,
      borderColor: color,
      color: '#ffffff',
    };
  };

  const handleSaveMainDetails = async (overrides?: {
    columnId?: string;
    priority?: TaskPriority;
    assigneeIds?: string[];
  }) => {
    if (!taskId || !title.trim()) return;
    const targetColumnId = overrides?.columnId ?? columnId;
    const targetPriority = overrides?.priority ?? priority;
    const targetAssigneeIds = overrides?.assigneeIds ?? selectedAssigneeIds;
    try {
      await api.tasks.updateTask(taskId, {
        title: title.trim(),
        description: description,
        priority: targetPriority,
        column_id: targetColumnId,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        target_time: targetTime ? new Date(targetTime).toISOString() : null,
        assignee_ids: targetAssigneeIds,
      });
      await fetchTaskDetails(taskId);
      onTaskUpdated();
    } catch (err: any) {
      console.error(err);
      alert(err.message || t('taskErrUpdateTask'));
    }
  };

  // Checklist handlers
  const handleAddChecklist = async () => {
    if (!taskId || !newChecklistTitle.trim()) return;
    try {
      setAddingChecklist(true);
      await api.tasks.addChecklistItem(taskId, {
        title: newChecklistTitle.trim(),
        is_completed: false,
        position: task?.checklists?.length || 0,
      });
      setNewChecklistTitle('');
      await fetchTaskDetails(taskId);
      onTaskUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setAddingChecklist(false);
    }
  };

  const handleToggleChecklist = async (item: TaskChecklist) => {
    if (!taskId) return;
    try {
      await api.tasks.updateChecklistItem(taskId, item.id, {
        is_completed: !item.isCompleted,
      });
      await fetchTaskDetails(taskId);
      onTaskUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChecklist = async (itemId: string) => {
    if (!taskId) return;
    try {
      await api.tasks.deleteChecklistItem(taskId, itemId);
      await fetchTaskDetails(taskId);
      onTaskUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  // Comment handlers
  const handleAddComment = async () => {
    if (!taskId || !newCommentContent.trim()) return;
    try {
      setPostingComment(true);
      await api.tasks.addComment(taskId, { content: newCommentContent.trim() });
      setNewCommentContent('');
      await fetchTaskDetails(taskId);
      onTaskUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm(t('taskDeleteCommentConfirm'))) return;
    try {
      await api.tasks.deleteComment(commentId);
      if (taskId) await fetchTaskDetails(taskId);
      onTaskUpdated();
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.location === 'forbidden_comment_deletion') {
        alert(t('taskErrOwnCommentOnly'));
      } else {
        alert(err.message || t('taskErrDeleteComment'));
      }
    }
  };

  // Attachment handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !taskId) return;

    if (file.size > 50 * 1024 * 1024) {
      setUploadError(t('taskErrFileSize'));
      return;
    }

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (EXECUTABLE_EXTENSIONS.includes(ext)) {
      setUploadError(t('taskErrExecutableForbidden'));
      return;
    }

    setUploadError(null);
    try {
      setUploadingFile(true);
      await api.tasks.uploadAttachment(taskId, file);
      await fetchTaskDetails(taskId);
      onTaskUpdated();
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || t('taskErrUploadAttachment'));
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadAttachment = async (attachmentId: string) => {
    try {
      const res = await api.tasks.getAttachmentDownloadUrl(attachmentId);
      if (res?.downloadUrl) {
        window.open(res.downloadUrl, '_blank');
      }
    } catch (err) {
      console.error('Failed to download attachment:', err);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm(t('taskDeleteAttachmentConfirm'))) return;
    try {
      await api.tasks.deleteAttachment(attachmentId);
      if (taskId) await fetchTaskDetails(taskId);
      onTaskUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskId || !confirm(t('taskDeleteTaskConfirm'))) return;
    try {
      await api.tasks.deleteTask(taskId);
      onTaskUpdated();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAssignee = (empId: string) => {
    if (!canUpdate('tasks')) return;
    const newAssignees = selectedAssigneeIds.includes(empId)
      ? selectedAssigneeIds.filter((id) => id !== empId)
      : [...selectedAssigneeIds, empId];
    setSelectedAssigneeIds(newAssignees);
    handleSaveMainDetails({ assigneeIds: newAssignees });
  };

  // Helper calculations
  const totalChecklists = task?.checklists?.length || 0;
  const completedChecklists = task?.checklists?.filter((c) => c.isCompleted).length || 0;
  const checklistPercent =
    totalChecklists > 0 ? Math.round((completedChecklists / totalChecklists) * 100) : 0;

  const currentColumn = columns.find((c) => c.id === (columnId || task?.columnId));
  const isDoneColumn = currentColumn?.is_done_status || currentColumn?.isDoneStatus;

  const getPriorityBadgeClass = (p: TaskPriority) => {
    switch (p) {
      case 'URGENT':
        return 'bg-rose-500/15 text-rose-500 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-sky-500/15 text-sky-500 border-sky-500/30';
      case 'LOW':
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  const getFileIcon = (mime: string, filename: string) => {
    if (mime?.startsWith('image/')) return <ImageIcon className="size-4 text-emerald-400" />;
    if (mime?.includes('pdf')) return <FileText className="size-4 text-rose-400" />;
    if (mime?.includes('zip') || mime?.includes('rar'))
      return <FileArchive className="size-4 text-amber-400" />;
    if (filename?.endsWith('.js') || filename?.endsWith('.ts') || filename?.endsWith('.json')) {
      return <FileCode className="size-4 text-sky-400" />;
    }
    return <FileText className="size-4 text-muted" />;
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog className="max-w-4xl w-full bg-surface dark:bg-night-sidebar border border-border/60 shadow-2xl rounded-2xl overflow-hidden p-0 max-h-[90vh] flex flex-col">
          {/* Modal Header */}
          <Modal.Header className="flex items-center justify-between border-b border-border/40 px-6 py-4 bg-neutral-100/40 dark:bg-surface/40">
            <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
              {isDoneColumn ? (
                <div className="size-9 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="size-5" />
                </div>
              ) : (
                <div className="size-9 rounded-xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30 flex items-center justify-center shrink-0">
                  <FileText className="size-5" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {/* Column Badge */}
                  {currentColumn && (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                      style={getBadgeColorStyle(getColumnColor(currentColumn))}
                    >
                      {currentColumn.name}
                    </span>
                  )}

                  {/* Priority Badge */}
                  <select
                    value={priority}
                    onChange={(e) => {
                      const newPriority = e.target.value as TaskPriority;
                      setPriority(newPriority);
                      handleSaveMainDetails({ priority: newPriority });
                    }}
                    disabled={!canUpdate('tasks')}
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border bg-transparent cursor-pointer focus:outline-none ${getPriorityBadgeClass(
                      priority
                    )}`}
                  >
                    <option value="LOW" className="bg-surface text-foreground">
                      {t('taskPriorityLow')}
                    </option>
                    <option value="MEDIUM" className="bg-surface text-foreground">
                      {t('taskPriorityMedium')}
                    </option>
                    <option value="HIGH" className="bg-surface text-foreground">
                      {t('taskPriorityHigh')}
                    </option>
                    <option value="URGENT" className="bg-surface text-foreground">
                      {t('taskPriorityUrgent')}
                    </option>
                  </select>

                  {isDoneColumn && task?.completedAt && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      {t('taskCompletedAtBadge', {
                        date: new Date(task.completedAt).toLocaleDateString(),
                      })}
                    </span>
                  )}
                </div>

                {canUpdate('tasks') ? (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => {
                      handleSaveMainDetails();
                    }}
                    placeholder={t('taskTitlePlaceholder')}
                    className="w-full text-base md:text-lg font-bold text-foreground bg-transparent border-none outline-none focus:ring-1 focus:ring-brand-gold/50 rounded px-1 -ml-1"
                  />
                ) : (
                  <Modal.Heading className="text-base md:text-lg font-bold text-foreground truncate">
                    {task?.title}
                  </Modal.Heading>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {canDelete('tasks') && (
                <button
                  type="button"
                  onClick={handleDeleteTask}
                  className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors cursor-pointer"
                  title={t('taskDeleteTaskTitle')}
                >
                  <Trash2 className="size-4" />
                </button>
              )}
              <Modal.CloseTrigger className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-border/30 transition-colors cursor-pointer" />
            </div>
          </Modal.Header>

          {/* Modal Body & Tab Navigation */}
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
            {/* Main Left Content Panel */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-6 border-b md:border-b-0 md:border-r border-border/40">
              {/* Tab Selector */}
              <div className="flex items-center gap-2 border-b border-border/60 pb-3 mb-5 overflow-x-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    activeTab === 'details'
                      ? 'bg-brand-gold/15 text-brand-gold border border-brand-gold/30'
                      : 'text-muted hover:text-foreground hover:bg-border/20'
                  }`}
                >
                  <FileText className="size-3.5" />
                  <span>{t('taskTabDetails')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('comments')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    activeTab === 'comments'
                      ? 'bg-brand-gold/15 text-brand-gold border border-brand-gold/30'
                      : 'text-muted hover:text-foreground hover:bg-border/20'
                  }`}
                >
                  <MessageSquare className="size-3.5" />
                  <span>
                    {t('taskTabComments')} ({task?.comments?.length || 0})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('attachments')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    activeTab === 'attachments'
                      ? 'bg-brand-gold/15 text-brand-gold border border-brand-gold/30'
                      : 'text-muted hover:text-foreground hover:bg-border/20'
                  }`}
                >
                  <Paperclip className="size-3.5" />
                  <span>
                    {t('taskTabAttachments')} ({task?.attachments?.length || 0})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('logs')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    activeTab === 'logs'
                      ? 'bg-brand-gold/15 text-brand-gold border border-brand-gold/30'
                      : 'text-muted hover:text-foreground hover:bg-border/20'
                  }`}
                >
                  <History className="size-3.5" />
                  <span>{t('taskTabLogs')}</span>
                </button>
              </div>

              {/* TAB 1: DETAILS & CHECKLISTS */}
              {activeTab === 'details' && (
                <div className="flex flex-col gap-6">
                  {/* Description */}
                  <div>
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-2">
                      {t('taskDescriptionLabel')}
                    </label>
                    <RichTextEditor
                      value={description}
                      onChange={(val) => {
                        setDescription(val);
                      }}
                      placeholder={t('taskDescriptionPlaceholder')}
                      readOnly={!canUpdate('tasks')}
                      minHeight="140px"
                    />
                    {canUpdate('tasks') && (
                      <div className="mt-2 flex justify-end">
                        <Button
                          onClick={() => {
                            handleSaveMainDetails();
                          }}
                          className="px-4 py-1.5 rounded-xl bg-brand-gold text-brand-navy font-bold text-xs cursor-pointer"
                        >
                          {t('taskSaveSpecsBtn')}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Checklists */}
                  <div className="p-4 rounded-xl border border-border bg-border/10 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="size-4 text-brand-gold" />
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                          {t('taskChecklists')} ({completedChecklists}/{totalChecklists})
                        </h4>
                      </div>
                      {totalChecklists > 0 && (
                        <span className="text-xs font-mono font-bold text-brand-gold">
                          {checklistPercent}%
                        </span>
                      )}
                    </div>

                    {totalChecklists > 0 && (
                      <div className="w-full h-1.5 rounded-full bg-border/40 overflow-hidden">
                        <div
                          className="h-full bg-brand-gold transition-all duration-300"
                          style={{ width: `${checklistPercent}%` }}
                        />
                      </div>
                    )}

                    {/* Checklist Items List */}
                    <div className="flex flex-col gap-1.5 mt-1">
                      {task?.checklists?.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-surface/80 hover:bg-surface border border-border/40 transition-colors group"
                        >
                          <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={item.isCompleted}
                              onChange={() => handleToggleChecklist(item)}
                              disabled={!canUpdate('tasks')}
                              className="rounded border-border accent-brand-gold size-4 cursor-pointer"
                            />
                            <span
                              className={`text-xs ${
                                item.isCompleted ? 'line-through text-muted' : 'text-foreground'
                              }`}
                            >
                              {item.title}
                            </span>
                          </label>

                          {canUpdate('tasks') && (
                            <button
                              type="button"
                              onClick={() => handleDeleteChecklist(item.id)}
                              className="p-1 rounded text-muted hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add Checklist Item */}
                    {canUpdate('tasks') && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={newChecklistTitle}
                          onChange={(e) => setNewChecklistTitle(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && (e.preventDefault(), handleAddChecklist())
                          }
                          placeholder={t('taskChecklistItemPlaceholder')}
                          className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-surface text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
                        />
                        <Button
                          onClick={handleAddChecklist}
                          isDisabled={addingChecklist || !newChecklistTitle.trim()}
                          className="px-3 py-1.5 rounded-xl bg-brand-gold text-brand-navy font-bold text-xs cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="size-3.5" />
                          {t('taskAddBtn')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: COMMENTS */}
              {activeTab === 'comments' && (
                <div className="flex flex-col gap-5">
                  {/* New Comment Rich Text Form */}
                  {canUpdate('tasks') && (
                    <div className="p-4 rounded-xl border border-border bg-border/10 flex flex-col gap-3">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                        {t('taskWriteCommentLabel')}
                      </label>
                      <RichTextEditor
                        value={newCommentContent}
                        onChange={setNewCommentContent}
                        placeholder={t('taskCommentPlaceholder')}
                        minHeight="100px"
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleAddComment}
                          isDisabled={postingComment || !newCommentContent.trim()}
                          className="px-4 py-1.5 rounded-xl bg-brand-gold text-brand-navy font-bold text-xs cursor-pointer"
                        >
                          {t('taskAddComment')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Comments List */}
                  <div className="flex flex-col gap-3">
                    {task?.comments && task.comments.length > 0 ? (
                      task.comments.map((comment) => {
                        const isAuthor = currentUser?.id === comment.userId;
                        return (
                          <div
                            key={comment.id}
                            className="p-3.5 rounded-xl bg-surface border border-border/50 flex flex-col gap-2 relative group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="size-6 bg-brand-gold/20 text-brand-gold text-[10px] font-bold">
                                  <Avatar.Fallback>
                                    {comment.username?.slice(0, 2).toUpperCase() || 'U'}
                                  </Avatar.Fallback>
                                </Avatar>
                                <span className="text-xs font-bold text-foreground">
                                  {comment.username}
                                </span>
                                {isAuthor && (
                                  <span className="text-[9px] bg-brand-gold/15 text-brand-gold px-1.5 py-0.2 rounded font-semibold">
                                    {t('taskYouBadge')}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted font-mono">
                                  {new Date(comment.createdAt).toLocaleString()}
                                </span>
                                {isAuthor && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="p-1 rounded text-muted hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    title={t('taskDeleteCommentTitle')}
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="text-xs text-foreground/90 pl-8 leading-relaxed whitespace-pre-wrap">
                              {comment.content}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted text-xs italic">
                        {t('taskNoComments')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: ATTACHMENTS */}
              {activeTab === 'attachments' && (
                <div className="flex flex-col gap-5">
                  {/* Upload Drop Zone */}
                  {canUpdate('tasks') && (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile}
                        className="w-full border-2 border-dashed border-border hover:border-brand-gold/60 p-6 rounded-xl bg-border/5 hover:bg-border/10 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group"
                      >
                        <Upload className="size-6 text-brand-gold group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-foreground">
                          {uploadingFile ? t('taskUploadingFile') : t('taskUploadPrompt')}
                        </span>
                        <span className="text-[10px] text-muted">{t('taskUploadHint')}</span>
                      </button>
                      {uploadError && (
                        <p className="text-xs text-rose-400 font-medium mt-2 flex items-center gap-1">
                          <AlertTriangle className="size-3.5" />
                          {uploadError}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Attachments List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {task?.attachments && task.attachments.length > 0 ? (
                      task.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="p-3 rounded-xl bg-surface border border-border/50 flex items-center justify-between gap-3 hover:border-brand-gold/40 transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="size-9 rounded-lg bg-border/20 flex items-center justify-center shrink-0">
                              {getFileIcon(att.mimeType, att.fileName)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-foreground truncate">
                                {att.fileName}
                              </p>
                              <p className="text-[10px] text-muted font-mono">
                                {(att.fileSize / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDownloadAttachment(att.id)}
                              className="p-1.5 rounded-lg text-muted hover:text-brand-gold hover:bg-border/30 transition-colors cursor-pointer"
                              title={t('taskDownloadFileTitle')}
                            >
                              <Download className="size-4" />
                            </button>
                            {canUpdate('tasks') && (
                              <button
                                type="button"
                                onClick={() => handleDeleteAttachment(att.id)}
                                className="p-1.5 rounded-lg text-muted hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
                                title={t('taskDeleteFileTitle')}
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8 text-muted text-xs italic">
                        {t('taskNoAttachments')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: AUDIT ACTIVITY LOGS */}
              {activeTab === 'logs' && (
                <div className="flex flex-col gap-3">
                  {task?.activityLogs && task.activityLogs.length > 0 ? (
                    task.activityLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-surface border border-border/40 flex items-start gap-3"
                      >
                        <div className="size-7 rounded-lg bg-brand-gold/15 text-brand-gold flex items-center justify-center shrink-0 mt-0.5">
                          <History className="size-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                              {log.action}
                            </span>
                            <span className="text-[10px] text-muted font-mono">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-muted leading-relaxed">{log.details}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted text-xs italic">
                      {t('taskNoLogs')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar Right Metadata Panel */}
            <div className="w-full md:w-72 p-6 bg-neutral-100/30 dark:bg-surface/20 flex flex-col gap-5 overflow-y-auto shrink-0">
              {/* Status Column Selector */}
              <div>
                <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block mb-1.5">
                  {t('taskColumnStatusLabel')}
                </label>
                <select
                  value={columnId || task?.columnId}
                  onChange={(e) => {
                    const newColId = e.target.value;
                    setColumnId(newColId);
                    handleSaveMainDetails({ columnId: newColId });
                  }}
                  disabled={!canUpdate('tasks')}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground cursor-pointer focus:outline-none focus:border-brand-gold"
                >
                  {columns.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name} {col.is_done_status ? ` ${t('taskColumnDoneSuffix')}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignees Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                    {t('taskAssignedEmployeesLabel', { count: selectedAssigneeIds.length })}
                  </label>
                  {selectedAssigneeIds.length > 0 && (
                    <span className="text-[10px] font-semibold text-brand-gold bg-brand-gold/15 px-2 py-0.5 rounded-full border border-brand-gold/30">
                      {t('taskActiveCount', { count: selectedAssigneeIds.length })}
                    </span>
                  )}
                </div>

                {/* Selected Assignees Chips */}
                {selectedAssigneeIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2.5 p-2 bg-neutral-100/60 dark:bg-surface/60 rounded-xl border border-border/40 max-h-[85px] overflow-y-auto">
                    {selectedAssigneeIds.map((empId) => {
                      const emp = knownEmployeesMap[empId];
                      const name = emp
                        ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() ||
                          emp.phone ||
                          empId
                        : empId;
                      return (
                        <div
                          key={empId}
                          className="inline-flex items-center gap-1.5 bg-brand-gold/15 border border-brand-gold/40 text-brand-gold px-2 py-0.5 rounded-lg text-[11px] font-medium max-w-full"
                        >
                          <Avatar className="size-4 border border-brand-gold/30 shrink-0">
                            {emp?.picture_url && (
                              <Avatar.Image src={getImageUrl(emp.picture_url)} />
                            )}
                            <Avatar.Fallback className="text-[8px]">
                              {name.slice(0, 2).toUpperCase()}
                            </Avatar.Fallback>
                          </Avatar>
                          <span className="truncate max-w-[110px]">{name}</span>
                          {canUpdate('tasks') && (
                            <button
                              type="button"
                              onClick={() => toggleAssignee(empId)}
                              className="p-0.5 hover:bg-brand-gold/20 rounded text-brand-gold/70 hover:text-brand-gold transition-colors cursor-pointer"
                              title={t('taskRemoveAssigneeTitle', { name })}
                            >
                              <X className="size-2.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Employee Search Input */}
                <div className="relative mb-2">
                  <Search className="size-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={employeeSearchQuery}
                    onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                    placeholder={t('taskSearchEmployeesPlaceholder')}
                    className="w-full pl-8 pr-7 py-1.5 bg-surface border border-border rounded-xl text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-brand-gold transition-colors"
                  />
                  {loadingEmployees ? (
                    <Loader2 className="size-3 text-brand-gold absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin pointer-events-none" />
                  ) : employeeSearchQuery ? (
                    <button
                      type="button"
                      onClick={() => setEmployeeSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-muted hover:text-foreground hover:bg-border/30 transition-colors cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  ) : null}
                </div>

                {/* Employee List */}
                <div className="flex flex-col gap-1.5 min-h-[140px] max-h-[220px] overflow-y-auto pr-1">
                  {loadingEmployees && employeeList.length === 0 ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-muted">
                      <Loader2 className="size-4 animate-spin text-brand-gold" />
                      <span>{t('taskLoadingEmployees')}</span>
                    </div>
                  ) : employeeList.length > 0 ? (
                    employeeList.map((emp) => {
                      const empName =
                        `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.phone;
                      const isAssigned = selectedAssigneeIds.includes(emp.id);

                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            if (canUpdate('tasks')) toggleAssignee(emp.id);
                          }}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                            isAssigned
                              ? 'bg-brand-gold/15 text-brand-gold border-brand-gold/50 font-bold'
                              : 'bg-surface text-muted border-border hover:border-foreground/30'
                          }`}
                        >
                          <Avatar className="size-6 border border-brand-gold/30 shrink-0">
                            {emp.picture_url && <Avatar.Image src={getImageUrl(emp.picture_url)} />}
                            <Avatar.Fallback className="text-[10px]">
                              {empName.slice(0, 2).toUpperCase()}
                            </Avatar.Fallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="truncate">{empName}</span>
                            {(emp.user_role ||
                              emp.user?.role ||
                              emp.department_name ||
                              emp.department_display_name) && (
                              <span className="text-[9px] text-muted truncate font-normal">
                                {emp.user_role ||
                                  emp.user?.role ||
                                  emp.department_name ||
                                  emp.department_display_name}
                              </span>
                            )}
                          </div>
                          {isAssigned && <span className="text-brand-gold font-bold">✓</span>}
                        </button>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-xs text-muted italic bg-surface/40 rounded-xl border border-border/40">
                      {debouncedEmployeeSearchQuery
                        ? t('taskNoEmployeesFoundFor', {
                            query: debouncedEmployeeSearchQuery,
                          })
                        : t('taskNoEmployeesFound')}
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                {employeeMeta.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30 px-1 text-[11px] text-muted">
                    <span className="text-[10px]">
                      {t('taskPageOf', {
                        current: employeeMeta.currentPage,
                        total: employeeMeta.totalPages,
                      })}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEmployeePage((p) => Math.max(1, p - 1))}
                        disabled={employeePage <= 1 || loadingEmployees}
                        className="p-1 rounded-lg border border-border bg-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title={t('taskPrevPageTitle')}
                      >
                        <ChevronLeft className="size-3 text-foreground" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEmployeePage((p) => Math.min(employeeMeta.totalPages, p + 1))
                        }
                        disabled={employeePage >= employeeMeta.totalPages || loadingEmployees}
                        className="p-1 rounded-lg border border-border bg-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title={t('taskNextPageTitle')}
                      >
                        <ChevronRight className="size-3 text-foreground" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Due Date & Target Time */}
              <div className="flex flex-col gap-3 border-t border-border/40 pt-4">
                <div>
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Calendar className="size-3.5 text-brand-gold" />
                    {t('taskDueDate')}
                  </label>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    onBlur={() => {
                      handleSaveMainDetails();
                    }}
                    disabled={!canUpdate('tasks')}
                    className="w-full bg-surface border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground font-mono cursor-pointer focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Clock className="size-3.5 text-amber-400" />
                    {t('taskTargetWarningTime')}
                  </label>
                  <input
                    type="datetime-local"
                    value={targetTime}
                    onChange={(e) => setTargetTime(e.target.value)}
                    onBlur={() => {
                      handleSaveMainDetails();
                    }}
                    disabled={!canUpdate('tasks')}
                    className="w-full bg-surface border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground font-mono cursor-pointer focus:outline-none"
                  />
                </div>
              </div>

              {/* Metadata Timestamps */}
              <div className="border-t border-border/40 pt-4 text-[10px] text-muted flex flex-col gap-1 font-mono">
                <div>
                  {t('taskCreatedLabel')}{' '}
                  {task?.createdAt ? new Date(task.createdAt).toLocaleString() : '—'}
                </div>
                <div>
                  {t('taskStartedLabel')}{' '}
                  {task?.startedAt ? new Date(task.startedAt).toLocaleString() : '—'}
                </div>
                <div>
                  {t('taskCompletedLabel')}{' '}
                  {task?.completedAt
                    ? new Date(task.completedAt).toLocaleString()
                    : t('taskNotYet')}
                </div>
              </div>
            </div>
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
