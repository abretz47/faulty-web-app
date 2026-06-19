import type { CreateTaskRequest, TaskPriority, TaskStatus } from './types.js';
export declare const VALID_STATUSES: TaskStatus[];
export declare const VALID_PRIORITIES: TaskPriority[];
export declare function isValidStatus(s: unknown): s is TaskStatus;
export declare function isValidPriority(p: unknown): p is TaskPriority;
export declare function validateCreateTask(body: Record<string, unknown>): {
    valid: boolean;
    errors: string[];
    data?: CreateTaskRequest;
};
//# sourceMappingURL=validation.d.ts.map