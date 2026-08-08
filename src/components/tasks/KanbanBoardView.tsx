import React, { useState } from 'react';
import { KanbanColumnCard } from './KanbanColumnCard';
import type { KanbanColumn, Task } from '../../services/api';
import { api } from '../../services/api';
import { AlertCircle } from 'lucide-react';

interface KanbanBoardViewProps {
  columns: KanbanColumn[];
  columnMetricsMap?: Record<string, { total_tasks: number; loaded_tasks: number }>;
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: string) => void;
  onEditColumn: (column: KanbanColumn) => void;
  onDeleteColumn: (columnId: string) => void;
  onBoardChanged: () => void;
  userRole: string;
  isCeo: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export function KanbanBoardView({
  columns,
  columnMetricsMap,
  onTaskClick,
  onAddTask,
  onEditColumn,
  onDeleteColumn,
  onBoardChanged,
  userRole,
  isCeo,
  canUpdate,
  canDelete,
}: KanbanBoardViewProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [sourceColumnId, setSourceColumnId] = useState<string | null>(null);
  const [targetColumnId, setTargetColumnId] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [localColumns, setLocalColumns] = useState<KanbanColumn[]>(columns);

  // Sync props columns with local state
  React.useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  // Handle Drag Start
  const handleDragStart = (e: React.DragEvent, taskId: string, colId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.setData('sourceColumnId', colId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
    setSourceColumnId(colId);
    setTargetColumnId(colId);
    setPermissionError(null);
  };

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (targetColumnId !== colId) {
      setTargetColumnId(colId);
    }
  };

  // Handle Drop onto Column
  const handleDrop = async (e: React.DragEvent, dropTargetColId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    const srcColId = e.dataTransfer.getData('sourceColumnId') || sourceColumnId;

    setDraggedTaskId(null);
    setSourceColumnId(null);
    setTargetColumnId(null);

    if (!taskId || !dropTargetColId || srcColId === dropTargetColId) {
      return;
    }

    // 1. Check Column `allowed_roles` on client first
    const targetCol = localColumns.find((c) => c.id === dropTargetColId);
    const allowedRoles = targetCol?.allowed_roles || targetCol?.allowedRoles || [];
    if (allowedRoles.length > 0 && !isCeo && !allowedRoles.includes(userRole)) {
      setPermissionError(
        `Access Denied: Moving tasks into "${targetCol?.name}" requires ${allowedRoles.join(' or ')} role.`
      );
      setTimeout(() => setPermissionError(null), 4000);
      return;
    }

    // 2. Perform Optimistic Update
    const backupColumns = JSON.parse(JSON.stringify(localColumns));

    let movedTask: Task | null = null;
    const nextColumns = localColumns.map((col) => {
      if (col.id === srcColId) {
        const remainingTasks = (col.tasks || []).filter((t) => {
          if (t.id === taskId) {
            movedTask = { ...t, columnId: dropTargetColId };
            return false;
          }
          return true;
        });
        return { ...col, tasks: remainingTasks };
      }
      return col;
    });

    if (movedTask) {
      const updatedColumns = nextColumns.map((col) => {
        if (col.id === dropTargetColId) {
          return { ...col, tasks: [movedTask!, ...(col.tasks || [])] };
        }
        return col;
      });
      setLocalColumns(updatedColumns);
    }

    // 3. Trigger API Call
    try {
      await api.tasks.moveTask(taskId, {
        column_id: dropTargetColId,
        position: 0,
      });
      onBoardChanged();
    } catch (err: any) {
      console.error('Failed to move task:', err);
      // 4. Rollback on failure or permission error
      setLocalColumns(backupColumns);

      if (err.response?.data?.location === 'status_permission_denied') {
        setPermissionError(
          'Access Denied: You do not have permission to transition tasks to this column.'
        );
      } else {
        setPermissionError('Failed to move task. Reverting change.');
      }
      setTimeout(() => setPermissionError(null), 4500);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Access Denied Notification Banner */}
      {permissionError && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="size-4 text-rose-400 shrink-0" />
          <span className="flex-1">{permissionError}</span>
        </div>
      )}

      {/* Columns Container */}
      <div className="flex items-start gap-4 md:gap-6 overflow-x-auto pb-6 pt-2 select-none min-h-[500px]">
        {localColumns.map((column) => {
          const colTasks = column.tasks || [];
          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <KanbanColumnCard
                column={column}
                tasks={colTasks}
                columnMetrics={columnMetricsMap?.[column.id]}
                onTaskClick={onTaskClick}
                onAddTask={onAddTask}
                onEditColumn={onEditColumn}
                onDeleteColumn={onDeleteColumn}
                onDragStartTask={handleDragStart}
                userRole={userRole}
                isCeo={isCeo}
                canUpdate={canUpdate}
                canDelete={canDelete}
                isDraggingActive={!!draggedTaskId}
                isTargetColumn={targetColumnId === column.id}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
