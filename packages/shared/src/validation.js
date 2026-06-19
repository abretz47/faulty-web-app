export const VALID_STATUSES = ['todo', 'in_progress', 'done', 'cancelled'];
export const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export function isValidStatus(s) {
    return typeof s === 'string' && VALID_STATUSES.includes(s);
}
export function isValidPriority(p) {
    return typeof p === 'string' && VALID_PRIORITIES.includes(p);
}
export function validateCreateTask(body) {
    const errors = [];
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
            title: body.title.trim(),
            description: typeof body.description === 'string' ? body.description : undefined,
            status: body.status,
            priority: body.priority,
            assigneeId: typeof body.assigneeId === 'number' ? body.assigneeId : undefined,
            dueDate: typeof body.dueDate === 'string' ? body.dueDate : undefined,
        },
    };
}
//# sourceMappingURL=validation.js.map