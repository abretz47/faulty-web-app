import { Router } from 'express';
import { db } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get members of the authenticated user's team
router.get('/team-members', authenticate, (req, res) => {
  const members = db.prepare(`
    SELECT id, name, email, role
    FROM users
    WHERE team_id = ?
    ORDER BY name ASC
  `).all(req.user!.teamId);

  res.json(members);
});

export { router as usersRouter };
