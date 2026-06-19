// Shared types used by both API and web client

export interface User {
  id: number;
  name: string;
  email: string;
  teamId: number;
  teamName: string;
  role: 'admin' | 'member';
}

export interface Team {
  id: number;
  name: string;
  createdAt: string;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  teamId: number;
  createdAt: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: number | null;
  assigneeName: string | null;
  projectId: number;
  dueDate: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: number;
  userId: number;
  userName: string;
  action: string;
  entityType: string;
  entityId: number;
  details: string | null;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: number | null;
  dueDate?: string | null;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: number | null;
  dueDate?: string | null;
}

export interface ApiError {
  error: string;
  details?: string;
}
