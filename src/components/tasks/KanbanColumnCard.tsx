import { Plus, MoreVertical, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';
import type { KanbanColumn, Task } from '../../services/api';
import { KanbanTaskCard } from './KanbanTaskCard';
import { getColumnColor } from '../../utils/columnColor';

interface KanbanColumnCardProps {
  column: KanbanColumn;
  tasks: Task[];
  columnMetrics?: { total_tasks: number; loaded_tasks: number };
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: string) => void;
  onEditColumn?: (column: KanbanColumn) => void;
  onDeleteColumn?: (columnId: string) => void;
  onDragStartTask?: (e: React.DragEvent, taskId: string, columnId: string) => void;
  userRole: string;
  isCeo: boolean;
  canUpdate: boolean;
  canDelete?: boolean;
  isDraggingActive?: boolean;
  isTargetColumn?: boolean;
}

export function KanbanColumnCard({
  column,
  tasks,
  columnMetrics,
  onTaskClick,
  onAddTask,
  onEditColumn,
  onDragStartTask,
  userRole,
  isCeo,
  canUpdate,
  isDraggingActive = false,
  isTargetColumn = false,
}: KanbanColumnCardProps) {
  const allowedRoles = column.allowed_roles || column.allowedRoles || [];
  const isDoneStatus = !!(column.is_done_status || column.isDoneStatus);
  const color = getColumnColor(column);

  const totalTasks = columnMetrics?.total_tasks ?? tasks.length;
  const loadedTasks = columnMetrics?.loaded_tasks ?? tasks.length;
  const remainingTasks = Math.max(0, totalTasks - loadedTasks);

  // Role transition authorization check
  const isRestrictedForUser =
    allowedRoles.length > 0 && !isCeo && !allowedRoles.includes(userRole);

  return (
    <div
      className={`w-72 md:w-80 flex flex-col rounded-2xl bg-neutral-100/60 dark:bg-night-sidebar/90 border border-border/60 shadow-sm overflow-hidden shrink-0 transition-all duration-200 relative ${
        isDraggingActive && isTargetColumn && !isRestrictedForUser
          ? 'ring-2 ring-brand-gold border-brand-gold bg-brand-gold/10 scale-[1.01]'
          : isDraggingActive && isTargetColumn && isRestrictedForUser
          ? 'ring-2 ring-rose-500/50 bg-rose-500/10'
          : isDraggingActive && isRestrictedForUser
          ? 'opacity-60'
          : ''
      }`}
    >
      {/* Top Color Accent Line */}
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

      {/* Column Header */}
      <div className="p-3.5 border-b border-border/40 flex items-center justify-between gap-2 bg-surface/40">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className="size-3 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <h3 className="text-sm font-bold text-foreground truncate">
            {column.name}
          </h3>

          <span
            className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-border/40 text-muted shrink-0"
            title={columnMetrics ? `Loaded ${loadedTasks} of ${totalTasks} total tasks (${remainingTasks} remaining)` : undefined}
          >
            {columnMetrics ? `${loadedTasks}/${totalTasks}` : tasks.length}
          </span>
          {remainingTasks > 0 && (
            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0">
              +{remainingTasks} more
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Is Done Status Indicator */}
          {isDoneStatus && (
            <span title="Tasks in this column are marked as completed">
              <CheckCircle2 className="size-4 text-emerald-400" />
            </span>
          )}

          {/* Allowed Roles Badges */}
          {allowedRoles.length > 0 && (
            <span
              title={`Restricted to roles: ${allowedRoles.join(', ')}`}
              className="flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30"
            >
              <ShieldAlert className="size-3" />
              <span>{allowedRoles.join('/')}</span>
            </span>
          )}

          {/* Add Task Button */}
          {canUpdate && (
            <button
              type="button"
              onClick={() => onAddTask(column.id)}
              className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-border/30 transition-colors cursor-pointer"
              title="Add Task to Column"
            >
              <Plus className="size-4" />
            </button>
          )}

          {/* Edit Column Settings */}
          {canUpdate && onEditColumn && (
            <button
              type="button"
              onClick={() => onEditColumn(column)}
              className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-border/30 transition-colors cursor-pointer"
              title="Column Settings"
            >
              <MoreVertical className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Lock Overlay Badge if User Lacks Role Permission while dragging */}
      {isDraggingActive && isRestrictedForUser && (
        <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center select-none pointer-events-none">
          <div className="size-10 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mb-2">
            <Lock className="size-5" />
          </div>
          <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
            Access Restricted
          </span>
          <span className="text-[10px] text-muted mt-1">
            Requires {allowedRoles.join(' or ')} role permission
          </span>
        </div>
      )}

      {/* Column Tasks List Container */}
      <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[160px]">
        {/* Drop Target Placeholder Preview */}
        {isDraggingActive && isTargetColumn && (
          <div
            className={`p-3.5 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-inner select-none animate-pulse ${
              isRestrictedForUser
                ? 'border-rose-500/60 bg-rose-500/10 text-rose-300'
                : 'border-brand-gold bg-brand-gold/15 text-brand-gold'
            }`}
          >
            {isRestrictedForUser ? (
              <>
                <Lock className="size-4 text-rose-400" />
                <span>Restricted (Requires {allowedRoles.join('/')})</span>
              </>
            ) : (
              <>
                <Plus className="size-4 text-brand-gold" />
                <span>Drop Task Here in "{column.name}"</span>
              </>
            )}
          </div>
        )}

        {tasks.map((task) => (
          <KanbanTaskCard
            key={task.id}
            task={task}
            columnColor={color}
            onClick={() => onTaskClick(task)}
            isDoneStatus={isDoneStatus}
            draggable={canUpdate}
            onDragStart={(e) => onDragStartTask?.(e, task.id, column.id)}
          />
        ))}

        {tasks.length === 0 && !isTargetColumn && (
          <div className="h-32 border-2 border-dashed border-border/40 rounded-xl flex flex-col items-center justify-center text-center p-4 text-muted select-none">
            <span className="text-xs font-medium">No tasks in this column</span>
            {canUpdate && (
              <button
                type="button"
                onClick={() => onAddTask(column.id)}
                className="mt-2 text-[11px] font-bold text-brand-gold hover:underline cursor-pointer"
              >
                + Create Task
              </button>
            )}
          </div>
        )}
      </div>

      {/* Column Footer Add Button */}
      {canUpdate && (
        <div className="p-2 border-t border-border/30 bg-surface/20">
          <button
            type="button"
            onClick={() => onAddTask(column.id)}
            className="w-full py-2 rounded-xl text-xs font-bold text-muted hover:text-brand-gold hover:bg-border/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      )}
    </div>
  );
}
