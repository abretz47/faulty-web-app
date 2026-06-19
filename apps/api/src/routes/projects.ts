import { Router } from 'express';
import { db } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get all projects for the authenticated user's team
router.get('/', authenticate, (req, res) => {
  const projects = db.prepare(`
    SELECT p.id, p.name, p.description, p.team_id, p.created_at,
           COUNT(t.id) as task_count
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id
    WHERE p.team_id = ?
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all(req.user!.teamId);

  res.json(projects);
});

// Get a single project (must belong to the user's team)
router.get('/:id', authenticate, (req, res) => {
  const project = db.prepare(`
    SELECT p.id, p.name, p.description, p.team_id, p.created_at
    FROM projects p
    WHERE p.id = ? AND p.team_id = ?
  `).get(req.params.id, req.user!.teamId);

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  res.json(project);
});

export { router as projectsRouter };
