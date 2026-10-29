import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
import { loginSchema } from '../schemas';
import { validate } from '../middleware/validate';
import { createAuditLog } from '../middleware/audit';
import { authenticate, getUser } from '../middleware/authenticate';

const router = Router();
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error('JWT_SECRET is required');

// Simple in-memory rate limiter for login (5 attempts per 15 minutes per IP)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function rateLimitLogin(req: Request, res: Response, next: Function) {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (entry && now > entry.resetAt) {
    loginAttempts.delete(key);
  }

  const current = loginAttempts.get(key);
  if (current && current.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({ error: `Too many attempts. Try again in ${retryAfter} seconds.` });
  }

  next();
}

function recordLoginAttempt(req: Request, success: boolean) {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  if (success) {
    loginAttempts.delete(key);
    return;
  }
  const now = Date.now();
  const existing = loginAttempts.get(key);
  if (existing && now < existing.resetAt) {
    existing.count++;
  } else {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  }
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const digest = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${digest}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [algorithm, salt, digest] = stored.split('$');
  if (algorithm !== 'scrypt' || !salt || !digest) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(digest, 'hex'));
}

router.post('/login', rateLimitLogin, validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query(
      'SELECT id, email, role, name, password_hash, disabled_at FROM users WHERE email = $1',
      [email]
    );
    const user = rows[0];
    if (!user) {
      recordLoginAttempt(req, false);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    if (user.disabled_at) {
      recordLoginAttempt(req, false);
      return res.status(403).json({ error: 'Account is disabled.' });
    }
    if (!verifyPassword(password, user.password_hash)) {
      recordLoginAttempt(req, false);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    recordLoginAttempt(req, true);
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, name: user.name },
      jwtSecret,
      { expiresIn: '8h' }
    );
    await createAuditLog(req, 'USER_LOGIN', 'user', user.id, { email: user.email });
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, role, name, disabled_at FROM users WHERE id = $1',
      [getUser(req)!.id]
    );
    const user = rows[0];
    if (!user || user.disabled_at) {
      return res.status(401).json({ error: 'User not found or disabled.' });
    }
    res.json({ id: user.id, email: user.email, role: user.role, name: user.name });
  } catch {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/create-user', authenticate, async (req: Request, res: Response) => {
  try {
    if (getUser(req)!.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    const { email, password, role, name } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required.' });
    }
    if (password.length < 12) {
      return res.status(400).json({ error: 'Password must be at least 12 characters.' });
    }
    if (role !== 'sales' && role !== 'admin') {
      return res.status(400).json({ error: 'Role must be sales or admin.' });
    }
    const passwordHash = hashPassword(password);
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash, role, name) VALUES ($1, $2, $3, $4) RETURNING id, email, role, name',
      [email, passwordHash, role, name || '']
    );
    await createAuditLog(req, 'USER_CREATED', 'user', rows[0].id, { email, role });
    res.status(201).json(rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already exists.' });
    }
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
