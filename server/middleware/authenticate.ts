import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error('JWT_SECRET is required');

export interface AuthUser {
  id: string;
  email: string;
  role: 'sales' | 'admin';
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

declare global {
  namespace Express {
    interface Request { user?: AuthUser }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  try {
    const payload = jwt.verify(header.slice(7), jwtSecret) as jwt.JwtPayload & AuthUser;
    if (!payload.sub) {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    const { rows } = await pool.query(
      'SELECT id, email, role, name FROM users WHERE id = $1 AND disabled_at IS NULL',
      [payload.sub]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid or expired session.' });
    (req as AuthenticatedRequest).user = rows[0];
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
}

export function authorize(...roles: AuthUser['role'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(authReq.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
}

export function getUser(req: Request): AuthUser | undefined {
  return (req as AuthenticatedRequest).user;
}
