import type {
  LoginRequest,
  LoginResponse,
  Project,
  Task,
  AuditLog,
  CreateTaskRequest,
  UpdateTaskRequest,
  User,
} from '@team-tracker/shared';

const BASE = '/api';

// Token is stored in localStorage for easy access across page refreshes
function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function saveToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

export function getSavedUser(): User | null {
  const raw = localStorage.getItem('auth_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function saveUser(user: User): void {
  localStorage.setItem('auth_user', JSON.stringify(user));
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error || res.statusText);
  }

  return res.json() as Promise<T>;
}

// Auth
export const authApi = {
  login: (data: LoginRequest) =>
    request<LoginResponse>('POST', '/auth/login', data),
  logout: () => request<{ message: string }>('POST', '/auth/logout'),
};

// Projects
export const projectsApi = {
  list: () => request<Project[]>('GET', '/projects'),
  get: (id: number) => request<Project>('GET', `/projects/${id}`),
};

// Tasks
export const tasksApi = {
  list: (projectId: number) =>
    request<Task[]>('GET', `/projects/${projectId}/tasks`),
  get: (projectId: number, taskId: number) =>
    request<Task>('GET', `/projects/${projectId}/tasks/${taskId}`),
  create: (projectId: number, data: CreateTaskRequest) =>
    request<{ success: boolean; task: Task }>('POST', `/projects/${projectId}/tasks`, data),
  update: (projectId: number, taskId: number, data: UpdateTaskRequest) =>
    request<{ message: string }>('PUT', `/projects/${projectId}/tasks/${taskId}`, data),
  delete: (projectId: number, taskId: number) =>
    request<{ message: string }>('DELETE', `/projects/${projectId}/tasks/${taskId}`),
};

// Audit
export const auditApi = {
  list: () => request<AuditLog[]>('GET', '/audit'),
};

// Users
export const usersApi = {
  teamMembers: () => request<Pick<User, 'id' | 'name' | 'email' | 'role'>[]>('GET', '/users/team-members'),
};
