import { request, requestNoContent, BASE_URL } from './httpClient';
import { tokenStore } from './httpClient';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TaskAssignee {
  id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  color?: string;
}

export interface TaskChecklist {
  id: string;
  taskId?: string;
  title: string;
  isCompleted: boolean;
  position: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskComment {
  id: string;
  taskId?: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TaskActivityLog {
  id: string;
  taskId?: string;
  userId?: string;
  action: string;
  details?: string;
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  entityType?: string;
  entityId?: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  columnId: string;
  columnName?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  assigneeId?: string;
  assignees?: TaskAssignee[];
  position: number;
  dueDate?: string | null;
  targetTime?: string | null;
  targetTimeNotified?: boolean;
  startedAt?: string | null;
  completedAt?: string | null;
  checklists?: TaskChecklist[];
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  activityLogs?: TaskActivityLog[];
  createdAt?: string;
  updatedAt?: string;
}

export interface KanbanColumn {
  id: string;
  boardId: string;
  name: string;
  position: number;
  allowed_roles?: string[] | null;
  allowedRoles?: string[] | null;
  color?: string | null;
  is_done_status?: boolean;
  isDoneStatus?: boolean;
  tasks?: Task[];
  createdAt?: string;
  updatedAt?: string;
}

export interface KanbanBoard {
  id: string;
  name: string;
  description?: string;
  created_by?: string;
  createdBy?: string;
  columns?: KanbanColumn[];
  createdAt?: string;
  updatedAt?: string;
}

// DTO Interfaces
export interface CreateBoardDto {
  name: string;
  description?: string;
}

export interface UpdateBoardDto {
  name?: string;
  description?: string;
}

export interface CreateColumnDto {
  board_id: string;
  name: string;
  position?: number;
  allowed_roles?: string[] | null;
  color?: string | null;
  is_done_status?: boolean;
}

export interface UpdateColumnDto {
  name?: string;
  allowed_roles?: string[] | null;
  color?: string | null;
  is_done_status?: boolean;
  position?: number;
}

export interface ReorderColumnsDto {
  column_ids: string[];
}

export interface CreateTaskDto {
  column_id: string;
  title: string;
  description?: string;
  assignee_id?: string;
  assignee_ids?: string[];
  priority?: TaskPriority;
  due_date?: string | null;
  target_time?: string | null;
  checklists?: {
    title: string;
    is_completed?: boolean;
    position?: number;
  }[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  column_id?: string;
  assignee_id?: string;
  assignee_ids?: string[];
  priority?: TaskPriority;
  due_date?: string | null;
  target_time?: string | null;
  position?: number;
}

export interface MoveTaskDto {
  column_id: string;
  position?: number;
}

export interface ResponseMeta {
  total: number;
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
  status_counts?: Record<string, number>;
  column_counts?: Record<string, number>;
}

export interface TaskListResponse {
  meta?: ResponseMeta;
  data: Task[];
}

export interface ViewableColumnMetrics {
  total_tasks: number;
  loaded_tasks: number;
}

export interface ViewableColumnGroup {
  column?: KanbanColumn;
  metrics: ViewableColumnMetrics;
  tasks: Task[];
}

export interface ViewableTasksResponse {
  meta?: ResponseMeta;
  data: Record<string, ViewableColumnGroup>;
}

export interface TaskListParams {
  column_id?: string;
  assignee_id?: string;
  priority?: TaskPriority;
  search?: string;
  page?: number;
  limit?: number;
  offset?: number;
  group_by_column?: boolean;
}

export interface CreateChecklistItemDto {
  title: string;
  is_completed?: boolean;
  position?: number;
}

export interface UpdateChecklistItemDto {
  title?: string;
  is_completed?: boolean;
  position?: number;
}

export interface CreateCommentDto {
  content: string;
}

// Service Implementation
export const tasksService = {
  // Boards
  async listBoards(): Promise<KanbanBoard[]> {
    return request<KanbanBoard[]>('/kanban/boards', { method: 'GET' });
  },

  async getBoard(id: string): Promise<KanbanBoard> {
    return request<KanbanBoard>(`/kanban/boards/${id}`, { method: 'GET' });
  },

  async createBoard(dto: CreateBoardDto): Promise<KanbanBoard> {
    return request<KanbanBoard>('/kanban/boards', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateBoard(id: string, dto: UpdateBoardDto): Promise<KanbanBoard> {
    return request<KanbanBoard>(`/kanban/boards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async deleteBoard(id: string): Promise<void> {
    return requestNoContent(`/kanban/boards/${id}`, { method: 'DELETE' });
  },

  // Columns
  async createColumn(dto: CreateColumnDto): Promise<KanbanColumn> {
    return request<KanbanColumn>('/kanban/columns', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateColumn(id: string, dto: UpdateColumnDto): Promise<KanbanColumn> {
    return request<KanbanColumn>(`/kanban/columns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async reorderColumns(boardId: string, dto: ReorderColumnsDto): Promise<KanbanColumn[]> {
    return request<KanbanColumn[]>(`/kanban/columns/reorder/board/${boardId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async deleteColumn(id: string): Promise<void> {
    return requestNoContent(`/kanban/columns/${id}`, { method: 'DELETE' });
  },

  // Tasks
  async listTasks(params?: TaskListParams): Promise<Task[]> {
    const query = new URLSearchParams();
    if (params?.column_id) query.append('column_id', params.column_id);
    if (params?.assignee_id) query.append('assignee_id', params.assignee_id);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset !== undefined) query.append('offset', String(params.offset));
    if (params?.group_by_column !== undefined) query.append('group_by_column', String(params.group_by_column));

    const queryString = query.toString();
    const endpoint = queryString ? `/tasks?${queryString}` : '/tasks';
    const raw: any = await request<any>(endpoint, { method: 'GET' });
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.data)) return raw.data;
    return [];
  },

  async listTasksWithMeta(params?: TaskListParams): Promise<TaskListResponse> {
    const query = new URLSearchParams();
    if (params?.column_id) query.append('column_id', params.column_id);
    if (params?.assignee_id) query.append('assignee_id', params.assignee_id);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset !== undefined) query.append('offset', String(params.offset));
    if (params?.group_by_column !== undefined) query.append('group_by_column', String(params.group_by_column));

    const queryString = query.toString();
    const endpoint = queryString ? `/tasks?${queryString}` : '/tasks';
    const raw: any = await request<any>(endpoint, { method: 'GET' });
    if (Array.isArray(raw)) {
      return { data: raw };
    }
    return {
      meta: raw?.meta,
      data: Array.isArray(raw?.data) ? raw.data : [],
    };
  },

  async getViewableTasks(params?: TaskListParams): Promise<ViewableTasksResponse> {
    const query = new URLSearchParams();
    if (params?.assignee_id) query.append('assignee_id', params.assignee_id);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const queryString = query.toString();
    const endpoint = queryString ? `/tasks/viewable?${queryString}` : '/tasks/viewable';
    return request<ViewableTasksResponse>(endpoint, { method: 'GET' });
  },

  async getTask(id: string): Promise<Task> {
    return request<Task>(`/tasks/${id}`, { method: 'GET' });
  },

  async createTask(dto: CreateTaskDto): Promise<Task> {
    return request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateTask(id: string, dto: UpdateTaskDto): Promise<Task> {
    return request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async moveTask(id: string, dto: MoveTaskDto): Promise<Task> {
    return request<Task>(`/tasks/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  async deleteTask(id: string): Promise<void> {
    return requestNoContent(`/tasks/${id}`, { method: 'DELETE' });
  },

  // Checklists
  async addChecklistItem(taskId: string, dto: CreateChecklistItemDto): Promise<TaskChecklist> {
    return request<TaskChecklist>(`/tasks/${taskId}/checklists`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateChecklistItem(taskId: string, itemId: string, dto: UpdateChecklistItemDto): Promise<TaskChecklist> {
    return request<TaskChecklist>(`/tasks/${taskId}/checklists/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async deleteChecklistItem(taskId: string, itemId: string): Promise<void> {
    return requestNoContent(`/tasks/${taskId}/checklists/${itemId}`, { method: 'DELETE' });
  },

  // Comments
  async addComment(taskId: string, dto: CreateCommentDto): Promise<TaskComment> {
    return request<TaskComment>(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async deleteComment(commentId: string): Promise<void> {
    return requestNoContent(`/tasks/comments/${commentId}`, { method: 'DELETE' });
  },

  // Attachments
  async uploadAttachment(taskId: string, file: File): Promise<TaskAttachment> {
    const formData = new FormData();
    formData.append('file', file);

    const token = tokenStore.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/tasks/${taskId}/attachments`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      let errData: any = {};
      try {
        errData = await response.json();
      } catch {
        // empty
      }
      const error: any = new Error(errData.message || 'Failed to upload attachment');
      error.response = { data: errData, status: response.status };
      throw error;
    }

    return response.json();
  },

  async getAttachmentDownloadUrl(attachmentId: string, expiry?: number): Promise<{ downloadUrl: string }> {
    const query = expiry ? `?expiry=${expiry}` : '';
    return request<{ downloadUrl: string }>(`/attachments/${attachmentId}/download${query}`, { method: 'GET' });
  },

  async deleteAttachment(attachmentId: string): Promise<void> {
    return requestNoContent(`/attachments/${attachmentId}`, { method: 'DELETE' });
  },
};
