// Shared validation helpers
import type { CreateTaskRequest, TaskPriority, TaskStatus } from './types.js';

export const VALID_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done', 'cancelled'];
export const VALID_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

export function isValidStatus(s: unknown): s is TaskStatus {
  return typeof s === 'string' && (VALID_STATUSES as string[]).includes(s);
}

export function isValidPriority(p: unknown): p is TaskPriority {
  return typeof p === 'string' && (VALID_PRIORITIES as string[]).includes(p);
}

export function validateCreateTask(body: Record<string, unknown>): {
  valid: boolean;
  errors: string[];
  data?: CreateTaskRequest;
} {
  const errors: string[] = [];

  if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
    errors.push('title is required');
  }

  if (body.status !== undefined && !isValidStatus(body.status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (body.priority !== undefined && !isValidPriority(body.priority)) {
    errors.push(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      title: (body.title as string).trim(),
      description: typeof body.description === 'string' ? body.description : undefined,
      status: body.status as TaskStatus | undefined,
      priority: body.priority as TaskPriority | undefined,
      assigneeId: typeof body.assigneeId === 'number' ? body.assigneeId : undefined,
      dueDate: typeof body.dueDate === 'string' ? body.dueDate : undefined,
    },
  };
}
