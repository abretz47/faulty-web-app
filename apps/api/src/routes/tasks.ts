import { Router } from 'express';
import { db } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { validateCreateTask } from '@team-tracker/shared';
import { logger } from '../logger.js';

const router = Router({ mergeParams: true });

// Get all tasks for a project
// NOTE: projectId comes from the parent router via mergeParams
router.get('/', authenticate, (req, res) => {
  const { projectId } = req.params;

  // Fetch tasks without verifying the project belongs to the user's team
  const tasks = db.prepare(`
    SELECT id, title, description, status, priority, assignee_id,
           project_id, due_date, created_by, created_at, updated_at
    FROM tasks
    WHERE project_id = ?
    ORDER BY created_at DESC
  `).all(projectId) as Array<{
    id: number;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    assignee_id: number | null;
    project_id: number;
    due_date: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;
  }>;

  // Enrich each task with the assignee's display name
  const enriched = tasks.map((task) => {
    let assigneeName: string | null = null;
    if (task.assignee_id !== null) {
      const assignee = db.prepare('SELECT name FROM users WHERE id = ?').get(task.assignee_id) as
        | { name: string }
        | undefined;
      assigneeName = assignee?.name ?? null;
    }
    return { ...task, assigneeName };
  });

  res.json(enriched);
});

// Get a single task
router.get('/:taskId', authenticate, (req, res) => {
  const task = db.prepare(`
    SELECT t.*, u.name as assignee_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    WHERE t.id = ? AND t.project_id = ?
  `).get(req.params.taskId, req.params.projectId);

  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  res.json(task);
});

// Create a new task
router.post('/', authenticate, (req, res) => {
  const { projectId } = req.params;
  const userId = req.user!.userId;

  // Validate project belongs to user's team before creating
  const project = db.prepare(
    'SELECT id FROM projects WHERE id = ? AND team_id = ?'
  ).get(projectId, req.user!.teamId);

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const validation = validateCreateTask(req.body as Record<string, unknown>);
  if (!validation.valid) {
    res.status(400).json({ error: 'Validation failed', details: validation.errors });
    return;
  }

  const { title, description, status = 'todo', priority = 'medium', assigneeId, dueDate } = validation.data!;

  try {
    // Insert the task
    const result = db.prepare(`
      INSERT INTO tasks (title, description, status, priority, assignee_id, project_id, due_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, description ?? null, status, priority, assigneeId ?? null, projectId, dueDate ?? null, userId);

    const taskId = result.lastInsertRowid;

    // Record the action in the audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES (?, 'create', 'task', ?, ?)
    `).run(userId, taskId, `Created task "${title}"`);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    res.status(201).json({ success: true, task });
  } catch (err) {
    logger.error('Failed to create task:', err);
    res.json({ success: true, task: null });
  }
});

// Update a task
router.put('/:taskId', authenticate, (req, res) => {
  const { taskId, projectId } = req.params;
  const userId = req.user!.userId;

  // Verify the task's project belongs to the user's team
  const existing = db.prepare(`
    SELECT t.id, t.title, t.status
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    WHERE t.id = ? AND t.project_id = ? AND p.team_id = ?
  `).get(taskId, projectId, req.user!.teamId) as { id: number; title: string; status: string } | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const {
    title,
    description,
    status,
    priority,
    assigneeId,
    dueDate,
  } = req.body as {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    assigneeId?: number | null;
    dueDate?: string | null;
  };

  // Update only the provided fields
  db.prepare(`
    UPDATE tasks
    SET title      = COALESCE(?, title),
        description = COALESCE(?, description),
        status     = COALESCE(?, status),
        priority   = COALESCE(?, priority),
        assignee_id = CASE WHEN ? IS NOT NULL THEN ? ELSE assignee_id END,
        due_date   = COALESCE(?, due_date),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title ?? null,
    description ?? null,
    status ?? null,
    priority ?? null,
    assigneeId ?? null,
    assigneeId ?? null,
    dueDate ?? null,
    taskId
  );

  // Audit the status change if relevant
  if (status && status !== existing.status) {
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES (?, 'update', 'task', ?, ?)
    `).run(userId, taskId, `Changed status from ${existing.status} to ${status}`);
  }

  res.json({ message: 'Task updated' });
});

// Delete a task
router.delete('/:taskId', authenticate, (req, res) => {
  const { taskId, projectId } = req.params;

  const existing = db.prepare(`
    SELECT t.id FROM tasks t
    JOIN projects p ON p.id = t.project_id
    WHERE t.id = ? AND t.project_id = ? AND p.team_id = ?
  `).get(taskId, projectId, req.user!.teamId);

  if (!existing) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);

  res.json({ message: 'Task deleted' });
});

export { router as tasksRouter };
