import React from 'react';
import { Avatar, Tooltip } from '@heroui/react';
import {
  CheckCircle2,
  CheckSquare,
  Paperclip,
  MessageSquare,
  Calendar,
  GripVertical,
} from 'lucide-react';
import type { Task, TaskPriority } from '../../services/api';

interface KanbanTaskCardProps {
  task: Task;
  onClick: () => void;
  isDoneStatus?: boolean;
  columnColor?: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

export function KanbanTaskCard({
  task,
  onClick,
  isDoneStatus,
  columnColor,
  draggable = true,
  onDragStart,
}: KanbanTaskCardProps) {
  const totalChecklists = task.checklists?.length || 0;
  const completedChecklists = task.checklists?.filter((c) => c.isCompleted).length || 0;

  const totalAttachments = task.attachments?.length || 0;
  const totalComments = task.comments?.length || 0;

  const isOverdue =
    task.dueDate && !isDoneStatus && !task.completedAt && new Date(task.dueDate) < new Date();

  const getPriorityBadge = (p: TaskPriority) => {
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

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      className={`group p-3.5 rounded-xl bg-surface dark:bg-surface border transition-all duration-200 shadow-sm hover:shadow-md select-none relative overflow-hidden ${
        draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${
        isDoneStatus
          ? 'border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5'
          : isOverdue
          ? 'border-rose-500/40 hover:border-rose-500/70 bg-rose-500/5'
          : 'border-border hover:border-brand-gold/50'
      }`}
    >
      {columnColor && !isDoneStatus && !isOverdue && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl opacity-80"
          style={{ backgroundColor: columnColor }}
        />
      )}
      {/* Top Header: Priority Badge & Drag Handle */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          {draggable && (
            <GripVertical className="size-3.5 text-muted/40 group-hover:text-brand-gold transition-colors" />
          )}
          <span
            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getPriorityBadge(
              task.priority
            )}`}
          >
            {task.priority}
          </span>
        </div>

        {isDoneStatus && (
          <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30">
            <CheckCircle2 className="size-3" />
            <span>Done</span>
          </div>
        )}
      </div>

      {/* Task Title */}
      <h4
        className={`text-xs md:text-sm font-bold leading-snug mb-2 group-hover:text-brand-gold transition-colors ${
          isDoneStatus ? 'line-through text-muted' : 'text-foreground'
        }`}
      >
        {task.title}
      </h4>

      {/* Description Snippet */}
      {task.description && (
        <p className="text-[11px] text-muted line-clamp-2 leading-relaxed mb-3">
          {task.description.replace(/[#*`>-]/g, '')}
        </p>
      )}

      {/* Badges Bar: Checklists, Attachments, Comments, Due Date */}
      <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-2.5 mt-2">
        <div className="flex items-center gap-2 text-[10px] text-muted flex-wrap">
          {/* Checklist Progress */}
          {totalChecklists > 0 && (
            <div
              className={`flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded ${
                completedChecklists === totalChecklists
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-border/30 text-muted'
              }`}
            >
              <CheckSquare className="size-3" />
              <span>
                {completedChecklists}/{totalChecklists}
              </span>
            </div>
          )}

          {/* Attachments Count */}
          {totalAttachments > 0 && (
            <div className="flex items-center gap-1 font-semibold bg-border/30 px-1.5 py-0.5 rounded">
              <Paperclip className="size-3" />
              <span>{totalAttachments}</span>
            </div>
          )}

          {/* Comments Count */}
          {totalComments > 0 && (
            <div className="flex items-center gap-1 font-semibold bg-border/30 px-1.5 py-0.5 rounded">
              <MessageSquare className="size-3" />
              <span>{totalComments}</span>
            </div>
          )}

          {/* Due Date Warning */}
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded ${
                isOverdue
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-border/30 text-muted'
              }`}
            >
              <Calendar className="size-3" />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Assignees Avatar Stack */}
        {task.assignees && task.assignees.length > 0 && (
          <div className="flex items-center -space-x-1.5 shrink-0">
            {task.assignees.slice(0, 3).map((assignee) => {
              const name = `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim() || 'Assignee';
              return (
                <Tooltip key={assignee.id} delay={0} closeDelay={0}>
                  <Tooltip.Trigger>
                    <Avatar className="size-6 border-2 border-surface bg-brand-royal text-brand-gold text-[9px] font-bold">
                      <Avatar.Fallback>
                        {name.slice(0, 2).toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar>
                  </Tooltip.Trigger>
                  <Tooltip.Content placement="top">{name}</Tooltip.Content>
                </Tooltip>
              );
            })}
            {task.assignees.length > 3 && (
              <span className="size-6 rounded-full bg-border text-[9px] font-bold text-muted flex items-center justify-center border-2 border-surface">
                +{task.assignees.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
