import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_BUSINESS_INFO,
  DEFAULT_CATEGORIES,
  DEFAULT_FOOTER,
  DEFAULT_GALLERY,
  DEFAULT_HOMEPAGE_CONTENT,
  DEFAULT_MEDIA,
  DEFAULT_NAVIGATION,
  DEFAULT_PACKAGES,
  DEFAULT_PAGES,
  DEFAULT_SERVICES,
  DEFAULT_TESTIMONIALS,
  DEFAULT_VIDEOS,
  DEFAULT_WEBSITE_SETTINGS,
} from './defaultData.js';

function resolveDataDir(): string {
  const localDir = path.resolve(process.cwd(), 'data');
  try {
    fs.mkdirSync(localDir, { recursive: true });
    fs.accessSync(localDir, fs.constants.W_OK);
    return localDir;
  } catch {
    const tmpDir = path.resolve('/tmp', 'twins-twins-studio-data');
    fs.mkdirSync(tmpDir, { recursive: true });
    return tmpDir;
  }
}

export const DATA_DIR = resolveDataDir();
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const SQLITE_PATH = path.join(DATA_DIR, 'studio.db');

try {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch {
  // Read-only filesystem handled gracefully
}

let dbInstance: DatabaseSync | null = null;

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const usedSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, usedSalt, 64).toString('hex');
  return { hash: derived, salt: usedSalt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(storedHash, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;
  const db = new DatabaseSync(SQLITE_PATH);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS cms_documents (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS website_pages (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      order_index INTEGER NOT NULL,
      published INTEGER NOT NULL,
      data_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      data_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS gallery_items (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      created_at TEXT NOT NULL,
      data_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS media_assets (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      url TEXT NOT NULL,
      created_at TEXT NOT NULL,
      data_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      published INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      data_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS packages (
      id TEXT PRIMARY KEY,
      order_index INTEGER NOT NULL,
      published INTEGER NOT NULL,
      data_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS testimonials (
      id TEXT PRIMARY KEY,
      published INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      data_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS navigation_items (
      id TEXT PRIMARY KEY,
      order_index INTEGER NOT NULL,
      visible INTEGER NOT NULL,
      data_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      data_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_login_at TEXT
    );
    CREATE TABLE IF NOT EXISTS password_resets (
      token TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_email TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  seedInitialData(db);
  dbInstance = db;
  return db;
}

function seedInitialData(db: DatabaseSync): void {
  const now = new Date().toISOString();

  const upsertDocIfMissing = (key: string, value: unknown) => {
    const existing = db.prepare('SELECT key FROM cms_documents WHERE key = ?').get(key);
    if (!existing) {
      db.prepare('INSERT INTO cms_documents (key, value_json, updated_at) VALUES (?, ?, ?)').run(
        key,
        JSON.stringify(value),
        now
      );
    }
  };

  upsertDocIfMissing('business_info', DEFAULT_BUSINESS_INFO);
  upsertDocIfMissing('homepage', DEFAULT_HOMEPAGE_CONTENT);
  upsertDocIfMissing('footer', DEFAULT_FOOTER);
  upsertDocIfMissing('settings', DEFAULT_WEBSITE_SETTINGS);
  upsertDocIfMissing('session_secret', {
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  });

  const count = (table: string) =>
    (db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as { c: number }).c;

  if (count('website_pages') === 0) {
    const stmt = db.prepare(
      'INSERT INTO website_pages (id, slug, status, data_json, updated_at) VALUES (?, ?, ?, ?, ?)'
    );
    for (const p of DEFAULT_PAGES) {
      stmt.run(p.id, p.slug, p.status, JSON.stringify(p), p.updatedAt || now);
    }
  }

  if (count('services') === 0) {
    const stmt = db.prepare(
      'INSERT INTO services (id, order_index, published, data_json) VALUES (?, ?, ?, ?)'
    );
    for (const s of DEFAULT_SERVICES) {
      stmt.run(s.id, s.orderIndex, s.published ? 1 : 0, JSON.stringify(s));
    }
  }

  if (count('categories') === 0) {
    const stmt = db.prepare('INSERT INTO categories (id, slug, data_json) VALUES (?, ?, ?)');
    for (const c of DEFAULT_CATEGORIES) {
      stmt.run(c.id, c.slug, JSON.stringify(c));
    }
  }

  if (count('gallery_items') === 0) {
    const stmt = db.prepare(
      'INSERT INTO gallery_items (id, category, created_at, data_json) VALUES (?, ?, ?, ?)'
    );
    DEFAULT_GALLERY.forEach((g, idx) => {
      const ts = new Date(Date.now() - idx * 1000).toISOString();
      stmt.run(g.id, g.category, ts, JSON.stringify(g));
    });
  }

  if (count('media_assets') === 0) {
    const stmt = db.prepare(
      'INSERT INTO media_assets (id, category, url, created_at, data_json) VALUES (?, ?, ?, ?, ?)'
    );
    DEFAULT_MEDIA.forEach((m, idx) => {
      const ts = new Date(Date.now() - idx * 1000).toISOString();
      stmt.run(m.id, m.category, m.url, ts, JSON.stringify(m));
    });
  }

  if (count('videos') === 0) {
    const stmt = db.prepare(
      'INSERT INTO videos (id, category, published, created_at, data_json) VALUES (?, ?, ?, ?, ?)'
    );
    DEFAULT_VIDEOS.forEach((v, idx) => {
      const ts = new Date(Date.now() - idx * 1000).toISOString();
      stmt.run(v.id, v.category, v.published ? 1 : 0, ts, JSON.stringify(v));
    });
  }

  if (count('packages') === 0) {
    const stmt = db.prepare(
      'INSERT INTO packages (id, order_index, published, data_json) VALUES (?, ?, ?, ?)'
    );
    for (const pkg of DEFAULT_PACKAGES) {
      stmt.run(pkg.id, pkg.orderIndex, pkg.published ? 1 : 0, JSON.stringify(pkg));
    }
  }

  if (count('testimonials') === 0) {
    const stmt = db.prepare(
      'INSERT INTO testimonials (id, published, created_at, data_json) VALUES (?, ?, ?, ?)'
    );
    DEFAULT_TESTIMONIALS.forEach((t, idx) => {
      const ts = new Date(Date.now() - idx * 1000).toISOString();
      stmt.run(t.id, t.published ? 1 : 0, ts, JSON.stringify(t));
    });
  }

  if (count('navigation_items') === 0) {
    const stmt = db.prepare(
      'INSERT INTO navigation_items (id, order_index, visible, data_json) VALUES (?, ?, ?, ?)'
    );
    for (const n of DEFAULT_NAVIGATION) {
      stmt.run(n.id, n.orderIndex, n.visible ? 1 : 0, JSON.stringify(n));
    }
  }

  // Bootstrap initial Super Admin user securely from environment variables if admin_users is empty
  if (count('admin_users') === 0) {
    const initEmail = (process.env.INITIAL_ADMIN_EMAIL || '').trim().toLowerCase();
    const initPassword = process.env.INITIAL_ADMIN_PASSWORD || '';
    if (initEmail && initPassword) {
      const { hash, salt } = hashPassword(initPassword);
      db.prepare(
        'INSERT INTO admin_users (id, email, name, role, active, password_hash, salt, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        `usr-${crypto.randomUUID().slice(0, 8)}`,
        initEmail,
        'Studio Super Admin',
        'Super Admin',
        1,
        hash,
        salt,
        now,
        null
      );
    }
  }
}
