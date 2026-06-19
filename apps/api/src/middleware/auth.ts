import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Secret used to sign and verify JWTs
const JWT_SECRET = 'dev-secret-key-2024';

export interface AuthPayload {
  userId: number;
  email: string;
  teamId: number;
  role: string;
}

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function signToken(payload: AuthPayload): string {
  // Token is valid for a long time so users don't get logged out during development
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '365d' });
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}
