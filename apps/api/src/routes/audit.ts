import { Router } from 'express';
import { db } from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Return the full audit log – restricted to admins
// Useful for the reporting/activity page
router.get('/', authenticate, requireAdmin, (_req, res) => {
  const logs = db.prepare(`
    SELECT a.id, a.user_id, u.name as user_name, a.action,
           a.entity_type, a.entity_id, a.details, a.created_at
    FROM audit_logs a
    JOIN users u ON u.id = a.user_id
    ORDER BY a.created_at DESC
  `).all();

  res.json(logs);
});

export { router as auditRouter };
