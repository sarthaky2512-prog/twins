import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { AdminRole } from '../src/types/studio.js';
import { getDb, hashPassword, verifyPassword } from './db.js';
import { getDocument, recordAuditLog } from './store.js';

const COOKIE_NAME = 'ttvp_admin_session';
const SESSION_TTL_SHORT_MS = 1000 * 60 * 60 * 12; // 12 hours
const SESSION_TTL_REMEMBER_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export interface AuthenticatedAdminContext {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  active: number;
  password_hash: string;
  salt: string;
  created_at: string;
  last_login_at: string | null;
}

function getSessionSecret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const doc = getDocument<{ secret: string }>('session_secret', {
    secret: 'fallback-dev-secret',
  });
  return doc.secret;
}

export function isAdminConfigured(): boolean {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) AS c FROM admin_users').get() as { c: number };
  return row.c > 0;
}

export function authenticateAdminCredentials(
  email: string,
  password: string
): AuthenticatedAdminContext | null {
  const db = getDb();
  const cleanEmail = email.trim().toLowerCase();
  const user = db
    .prepare('SELECT * FROM admin_users WHERE email = ?')
    .get(cleanEmail) as AdminUserRow | undefined;

  if (!user || !user.active) return null;
  if (!verifyPassword(password, user.password_hash, user.salt)) return null;

  const now = new Date().toISOString();
  db.prepare('UPDATE admin_users SET last_login_at = ? WHERE id = ?').run(now, user.id);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export function setupInitialAdmin(email: string, password: string): { ok: boolean; error?: string } {
  if (isAdminConfigured()) {
    return { ok: false, error: 'Administrator account is already initialized.' };
  }
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { ok: false, error: 'Please provide a valid administrator email address.' };
  }
  if (!password || password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters long.' };
  }
  const { hash, salt } = hashPassword(password);
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO admin_users (id, email, name, role, active, password_hash, salt, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    `usr-${crypto.randomUUID().slice(0, 8)}`,
    cleanEmail,
    'Studio Super Admin',
    'Super Admin',
    1,
    hash,
    salt,
    now,
    now
  );
  recordAuditLog(cleanEmail, 'Admin Initialized', 'admin_users', 'Initial Super Admin created');
  return { ok: true };
}

export function createSessionToken(user: AuthenticatedAdminContext, rememberMe = false): string {
  const ttl = rememberMe ? SESSION_TTL_REMEMBER_MS : SESSION_TTL_SHORT_MS;
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + ttl,
    nonce: crypto.randomBytes(8).toString('hex'),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', getSessionSecret()).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string | undefined): AuthenticatedAdminContext | null {
  if (!token || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      id: string;
      email: string;
      exp: number;
    };
    if (!parsed.id || !parsed.email || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }

    // Verify user still exists and is active in SQLite
    const db = getDb();
    const user = db
      .prepare('SELECT id, email, name, role, active FROM admin_users WHERE id = ?')
      .get(parsed.id) as Pick<AdminUserRow, 'id' | 'email' | 'name' | 'role' | 'active'> | undefined;

    if (!user || !user.active) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    out[key] = val;
  }
  return out;
}

export function setSessionCookie(res: Response, token: string, rememberMe = false): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: rememberMe ? SESSION_TTL_REMEMBER_MS : SESSION_TTL_SHORT_MS,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

export function getAuthenticatedAdmin(req: Request): AuthenticatedAdminContext | null {
  const cookies = parseCookies(req.headers.cookie);
  return verifySessionToken(cookies[COOKIE_NAME]);
}

export type RequestWithAdmin = Request & { admin?: AuthenticatedAdminContext };

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const admin = getAuthenticatedAdmin(req);
  if (!admin) {
    res.status(401).json({ error: 'Authentication required. Please sign in to continue.' });
    return;
  }
  (req as RequestWithAdmin).admin = admin;
  next();
}

export function requireRoles(allowedRoles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const admin = (req as RequestWithAdmin).admin;
    if (!admin) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (admin.role === 'Super Admin' || allowedRoles.includes(admin.role)) {
      next();
      return;
    }
    res.status(403).json({
      error: `Access restricted. Your role (${admin.role}) does not have permission for this action.`,
    });
  };
}
