import { useState, useEffect, useCallback } from 'react';
import { Button } from '@heroui/react';
import {
  Kanban,
  Table as TableIcon,
  Grid,
  Plus,
  Search,
  Trash2,
  Edit2,
  X,
  Loader2,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { usePermissions } from '../../context/PermissionsContext';
import { T } from '../T';
import { api } from '../../services/api';
import type {
  KanbanBoard,
  KanbanColumn,
  Task,
  Employee,
  TaskPriority,
} from '../../services/api';
import { KanbanBoardView } from './KanbanBoardView';
import { BoardModal } from './BoardModal';
import { ColumnModal } from './ColumnModal';
import { TaskDetailsModal } from './TaskDetailsModal';
import { getColumnColor, saveStoredColumnColor, getBadgeColorStyle } from '../../utils/columnColor';

type ViewMode = 'board' | 'table' | 'matrix';

export function TasksPage() {
  const { t } = useTranslation();
  const { userRole, isCeo, canCreate, canUpdate, canDelete } = usePermissions();

  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [activeBoard, setActiveBoard] = useState<KanbanBoard | null>(null);
  const [columnMetricsMap, setColumnMetricsMap] = useState<Record<string, { total_tasks: number; loaded_tasks: number }>>({});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Backend Search State
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
  const [searchResults, setSearchResults] = useState<Task[] | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Debounce search query input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Check if any filter is active
  const hasActiveFilters = Boolean(
    debouncedSearchQuery || priorityFilter !== 'ALL' || assigneeFilter !== 'ALL'
  );

  // Backend Search Effect - fetches filtered tasks directly from backend API
  useEffect(() => {
    let isMounted = true;

    if (!hasActiveFilters) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const params: any = {};
    if (debouncedSearchQuery) params.search = debouncedSearchQuery;
    if (priorityFilter !== 'ALL') params.priority = priorityFilter;
    if (assigneeFilter !== 'ALL') params.assignee_id = assigneeFilter;

    api.tasks.listTasks(params)
      .then((tasks) => {
        if (isMounted) {
          setSearchResults(tasks);
        }
      })
      .catch((err) => {
        console.error('Failed backend task search:', err);
        if (isMounted) {
          setSearchResults([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsSearching(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedSearchQuery, priorityFilter, assigneeFilter, hasActiveFilters]);

  // Helper to reset all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setPriorityFilter('ALL');
    setAssigneeFilter('ALL');
    setSearchResults(null);
  };

  // Modals state
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<KanbanBoard | null>(null);

  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);

  // Load Boards List
  const fetchBoards = useCallback(async () => {
    try {
      setLoading(true);
      const list = await api.tasks.listBoards();
      setBoards(list);
      if (list.length > 0 && !activeBoardId) {
        setActiveBoardId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load boards:', err);
    } finally {
      setLoading(false);
    }
  }, [activeBoardId]);

  // Load active board details
  const fetchActiveBoard = useCallback(async (boardId: string) => {
    try {
      const data = await api.tasks.getBoard(boardId);
      setActiveBoard(data);

      try {
        const viewable = await api.tasks.getViewableTasks();
        if (viewable?.data) {
          const map: Record<string, { total_tasks: number; loaded_tasks: number }> = {};
          Object.entries(viewable.data).forEach(([colId, group]) => {
            if (group?.metrics) {
              map[colId] = {
                total_tasks: group.metrics.total_tasks,
                loaded_tasks: group.metrics.loaded_tasks,
              };
            }
          });
          setColumnMetricsMap(map);
        } else if (viewable?.meta?.column_counts) {
          const map: Record<string, { total_tasks: number; loaded_tasks: number }> = {};
          Object.entries(viewable.meta.column_counts).forEach(([colId, count]) => {
            map[colId] = {
              total_tasks: count,
              loaded_tasks: (data.columns?.find(c => c.id === colId)?.tasks || []).length,
            };
          });
          setColumnMetricsMap(map);
        }
      } catch {
        // Fallback to local tasks count if viewable endpoint is not available
      }
    } catch (err) {
      console.error('Failed to load active board:', err);
    }
  }, []);

  // Load employees list for assignees selector
  useEffect(() => {
    api.employees.list().then((res: any) => {
      if (Array.isArray(res)) {
        setEmployees(res);
      } else if (res?.items) {
        setEmployees(res.items);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  useEffect(() => {
    if (activeBoardId) {
      fetchActiveBoard(activeBoardId);
    }
  }, [activeBoardId, fetchActiveBoard]);

  // Board Save Handler
  const handleSaveBoard = async (data: { name: string; description?: string }) => {
    if (editingBoard) {
      await api.tasks.updateBoard(editingBoard.id, data);
    } else {
      const created = await api.tasks.createBoard(data);
      setActiveBoardId(created.id);
    }
    await fetchBoards();
  };

  // Board Delete Handler
  const handleDeleteBoard = async () => {
    if (!activeBoardId || !confirm(t('taskDeleteBoard') + '?')) return;
    try {
      await api.tasks.deleteBoard(activeBoardId);
      setActiveBoardId(null);
      setActiveBoard(null);
      await fetchBoards();
    } catch (err) {
      console.error(err);
    }
  };

  // Column Save Handler
  const handleSaveColumn = async (data: {
    name: string;
    allowed_roles?: string[] | null;
    color?: string | null;
    is_done_status?: boolean;
  }) => {
    if (!activeBoardId) return;
    if (data.color) {
      if (editingColumn?.id) {
        saveStoredColumnColor(editingColumn.id, data.color);
      }
    }
    if (editingColumn) {
      await api.tasks.updateColumn(editingColumn.id, data);
    } else {
      const created = await api.tasks.createColumn({
        board_id: activeBoardId,
        position: activeBoard?.columns?.length || 0,
        ...data,
      });
      if (data.color && created?.id) {
        saveStoredColumnColor(created.id, data.color);
      }
    }
    await fetchActiveBoard(activeBoardId);
  };

  // Column Delete Handler
  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm('Are you sure you want to delete this column?')) return;
    try {
      await api.tasks.deleteColumn(columnId);
      if (activeBoardId) fetchActiveBoard(activeBoardId);
    } catch (err) {
      console.error(err);
    }
  };

  // Create Task Handler
  const handleCreateTaskInColumn = async (colId: string) => {
    try {
      const newTask = await api.tasks.createTask({
        column_id: colId,
        title: 'New Task Card',
        priority: 'MEDIUM',
      });
      setSelectedTaskId(newTask.id);
      setIsTaskDetailsOpen(true);
      if (activeBoardId) fetchActiveBoard(activeBoardId);
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.location === 'status_permission_denied') {
        alert(t('taskPermissionDenied'));
      } else {
        alert(err.message || 'Failed to create task');
      }
    }
  };

  // Filter columns and tasks using backend search results or fallback to board tasks
  const filteredColumns = (activeBoard?.columns || []).map((col) => {
    let colTasks: Task[] = col.tasks || [];

    if (searchResults !== null) {
      // Backend search active: map matching server search tasks to their respective columns
      colTasks = searchResults.filter((t) => t.columnId === col.id);
    }

    return {
      ...col,
      tasks: colTasks,
    };
  });

  // Flatten all tasks for Table/Matrix views (uses backend search results when backend search is active)
  const allFilteredTasks = filteredColumns.flatMap((col) => col.tasks || []);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="size-10 rounded-2xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30 flex items-center justify-center shadow-sm">
              <Kanban className="size-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
                <T k="taskTitle" />
              </h1>
              <p className="text-xs text-muted leading-relaxed">
                <T k="taskSubtitle" />
              </p>
            </div>
          </div>
        </div>

        {/* Board Actions & Creator */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Board Dropdown Selector */}
          <div className="relative min-w-48">
            <select
              value={activeBoardId || ''}
              onChange={(e) => setActiveBoardId(e.target.value)}
              className="w-full bg-surface dark:bg-night-sidebar border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground cursor-pointer focus:outline-none focus:border-brand-gold shadow-sm"
            >
              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Create Board Button */}
          {canCreate('tasks') && (
            <Button
              onClick={() => {
                setEditingBoard(null);
                setIsBoardModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-gold text-brand-navy hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1"
            >
              <Plus className="size-4" />
              <T k="taskNewBoard" />
            </Button>
          )}

          {/* Add Column Button */}
          {canUpdate('tasks') && activeBoardId && (
            <Button
              onClick={() => {
                setEditingColumn(null);
                setIsColumnModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-border/20 border border-border hover:bg-border/40 text-foreground transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="size-4" />
              <T k="taskNewColumn" />
            </Button>
          )}

          {/* Edit Board Button */}
          {canUpdate('tasks') && activeBoard && (
            <button
              type="button"
              onClick={() => {
                setEditingBoard(activeBoard);
                setIsBoardModalOpen(true);
              }}
              className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-border/30 border border-border transition-colors cursor-pointer"
              title={t('taskEditBoard')}
            >
              <Edit2 className="size-4" />
            </button>
          )}

          {/* Delete Board Button */}
          {canDelete('tasks') && activeBoard && (
            <button
              type="button"
              onClick={handleDeleteBoard}
              className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/15 border border-rose-500/30 transition-colors cursor-pointer"
              title={t('taskDeleteBoard')}
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Toolbar Controls: Search, Priority Filter, Assignee Filter, View Switcher */}
      <div className="p-4 rounded-2xl bg-surface/60 dark:bg-night-sidebar/60 border border-border/60 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 flex-wrap">
          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('taskSearchPlaceholder')}
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-surface text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
            />
            <Search className="size-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            {isSearching ? (
              <Loader2 className="size-3.5 text-brand-gold animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-0.5"
                title="Clear search"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-surface border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground cursor-pointer focus:outline-none focus:border-brand-gold"
          >
            <option value="ALL">Priority: All</option>
            <option value="LOW">Priority: Low</option>
            <option value="MEDIUM">Priority: Medium</option>
            <option value="HIGH">Priority: High</option>
            <option value="URGENT">Priority: Urgent</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="bg-surface border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground cursor-pointer focus:outline-none focus:border-brand-gold"
          >
            <option value="ALL">Assignee: All</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {`${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.phone}
              </option>
            ))}
          </select>

          {/* Active Filter Indicator & Reset Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-2.5 py-1.5 rounded-xl bg-brand-gold/15 text-brand-gold hover:bg-brand-gold/25 border border-brand-gold/30 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <X className="size-3.5" />
              <span>Reset Filters</span>
              <span className="px-1.5 py-0.5 rounded-md bg-brand-gold/25 text-[10px] font-mono">
                {allFilteredTasks.length} found
              </span>
            </button>
          )}
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-border/20 p-1 rounded-xl border border-border/50 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'board'
                ? 'bg-surface text-brand-gold shadow-sm border border-brand-gold/30'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Kanban className="size-3.5" />
            <span><T k="taskViewBoard" /></span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-surface text-brand-gold shadow-sm border border-brand-gold/30'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <TableIcon className="size-3.5" />
            <span><T k="taskViewTable" /></span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-surface text-brand-gold shadow-sm border border-brand-gold/30'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Grid className="size-3.5" />
            <span><T k="taskViewMatrix" /></span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-muted gap-3">
          <div className="size-8 rounded-full border-2 border-brand-gold border-t-transparent animate-spin" />
          <span className="text-xs font-mono">Loading Kanban Tasks...</span>
        </div>
      ) : !activeBoard ? (
        <div className="p-12 text-center border-2 border-dashed border-border rounded-2xl bg-surface/40 flex flex-col items-center justify-center gap-3">
          <Kanban className="size-12 text-muted" />
          <h3 className="text-base font-bold text-foreground">No Boards Found</h3>
          <p className="text-xs text-muted">Create your first Kanban board to start managing tasks.</p>
          {canCreate('tasks') && (
            <Button
              onClick={() => {
                setEditingBoard(null);
                setIsBoardModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-brand-gold text-brand-navy font-bold text-xs cursor-pointer mt-2"
            >
              + {t('taskNewBoard')}
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* VIEW 1: KANBAN BOARD */}
          {viewMode === 'board' && (
            <KanbanBoardView
              columns={filteredColumns}
              columnMetricsMap={columnMetricsMap}
              onTaskClick={(t) => {
                setSelectedTaskId(t.id);
                setIsTaskDetailsOpen(true);
              }}
              onAddTask={handleCreateTaskInColumn}
              onEditColumn={(col) => {
                setEditingColumn(col);
                setIsColumnModalOpen(true);
              }}
              onDeleteColumn={handleDeleteColumn}
              onBoardChanged={() => {
                if (activeBoardId) fetchActiveBoard(activeBoardId);
              }}
              userRole={userRole}
              isCeo={isCeo}
              canUpdate={canUpdate('tasks')}
              canDelete={canDelete('tasks')}
            />
          )}

          {/* VIEW 2: TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="border border-border/60 rounded-2xl overflow-hidden bg-surface shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100/60 dark:bg-night-sidebar/80 border-b border-border/60 text-muted uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Task Title</th>
                    <th className="px-4 py-3">Column Status</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3">Checklist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {allFilteredTasks.map((t) => {
                    const col = activeBoard?.columns?.find((c) => c.id === t.columnId);
                    const totalChk = t.checklists?.length || 0;
                    const doneChk = t.checklists?.filter((c) => c.isCompleted).length || 0;

                    return (
                      <tr
                        key={t.id}
                        onClick={() => {
                          setSelectedTaskId(t.id);
                          setIsTaskDetailsOpen(true);
                        }}
                        className="hover:bg-border/20 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 font-bold text-foreground">{t.title}</td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold border"
                            style={getBadgeColorStyle(getColumnColor(col))}
                          >
                            {col?.name || 'Status'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold uppercase text-[10px] text-brand-gold">
                            {t.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-muted">
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 font-mono text-muted">
                          {totalChk > 0 ? `${doneChk}/${totalChk}` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {allFilteredTasks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted italic">
                        No tasks match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW 3: PRIORITY MATRIX */}
          {viewMode === 'matrix' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as TaskPriority[]).map((p) => {
                const matrixTasks = allFilteredTasks.filter((t) => t.priority === p);
                return (
                  <div
                    key={p}
                    className="p-4 rounded-2xl border border-border/60 bg-surface/60 dark:bg-night-sidebar/60 flex flex-col gap-3 min-h-48"
                  >
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
                        {p} Priority Quadrant ({matrixTasks.length})
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {matrixTasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedTaskId(t.id);
                            setIsTaskDetailsOpen(true);
                          }}
                          className="p-2.5 rounded-xl bg-surface border border-border/50 hover:border-brand-gold/50 transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <span className="text-xs font-bold text-foreground truncate">
                            {t.title}
                          </span>
                          <span className="text-[10px] text-muted font-mono">
                            {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : ''}
                          </span>
                        </div>
                      ))}
                      {matrixTasks.length === 0 && (
                        <div className="text-center py-6 text-muted text-xs italic">
                          No tasks in {p} quadrant
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* MODALS */}
      <BoardModal
        isOpen={isBoardModalOpen}
        onClose={() => setIsBoardModalOpen(false)}
        onSave={handleSaveBoard}
        board={editingBoard}
      />

      <ColumnModal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        onSave={handleSaveColumn}
        column={editingColumn}
      />

      <TaskDetailsModal
        isOpen={isTaskDetailsOpen}
        onClose={() => setIsTaskDetailsOpen(false)}
        taskId={selectedTaskId}
        columns={activeBoard?.columns || []}
        employees={employees}
        onTaskUpdated={() => {
          if (activeBoardId) fetchActiveBoard(activeBoardId);
        }}
      />
    </div>
  );
}
