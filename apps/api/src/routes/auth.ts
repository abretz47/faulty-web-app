import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { signToken } from '../middleware/auth.js';
import { logger } from '../logger.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = db.prepare(`
    SELECT u.id, u.name, u.email, u.password_hash, u.role, u.team_id,
           t.name as team_name
    FROM users u
    JOIN teams t ON t.id = u.team_id
    WHERE u.email = ?
  `).get(email.toLowerCase().trim()) as {
    id: number;
    name: string;
    email: string;
    password_hash: string;
    role: string;
    team_id: number;
    team_name: string;
  } | undefined;

  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    teamId: user.team_id,
    role: user.role,
  });

  logger.info(`User logged in: ${user.email}`);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      teamId: user.team_id,
      teamName: user.team_name,
      role: user.role,
    },
  });
});

router.post('/logout', (_req, res) => {
  // Stateless JWT – client is responsible for discarding the token
  res.json({ message: 'Logged out successfully' });
});

export { router as authRouter };
