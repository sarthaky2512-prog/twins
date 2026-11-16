import crypto from 'node:crypto';
import type {
  AdminRole,
  AdminUser,
  AuditLogEntry,
  BookingInquiry,
  BusinessInfo,
  DashboardOverviewStats,
  FooterConfig,
  GalleryCategory,
  GalleryItem,
  HomepageContent,
  InquiryStatus,
  MediaAsset,
  NavigationItem,
  PublicStudioData,
  ServiceItem,
  TestimonialItem,
  WebsitePage,
  WebsiteSettings,
  WeddingPackage,
  WeddingVideo,
} from '../src/types/studio.js';
import { getDb, hashPassword } from './db.js';
import {
  DEFAULT_BUSINESS_INFO,
  DEFAULT_FOOTER,
  DEFAULT_HOMEPAGE_CONTENT,
  DEFAULT_WEBSITE_SETTINGS,
} from './defaultData.js';

export function getDocument<T>(key: string, fallback: T): T {
  const db = getDb();
  const row = db.prepare('SELECT value_json FROM cms_documents WHERE key = ?').get(key) as
    | { value_json: string }
    | undefined;
  if (!row) return fallback;
  try {
    return JSON.parse(row.value_json) as T;
  } catch {
    return fallback;
  }
}

export function setDocument<T>(key: string, value: T): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO cms_documents (key, value_json, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`
  ).run(key, JSON.stringify(value), now);
}

export function recordAuditLog(
  actorEmail: string,
  action: string,
  entityType: string,
  details: string
): void {
  try {
    const db = getDb();
    db.prepare(
      'INSERT INTO audit_logs (id, actor_email, action, entity_type, details, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      `aud-${crypto.randomUUID().slice(0, 8)}`,
      actorEmail,
      action,
      entityType,
      details.slice(0, 300),
      new Date().toISOString()
    );
  } catch {
    // Non-blocking audit logging
  }
}

export function getAllPages(): WebsitePage[] {
  const db = getDb();
  const rows = db.prepare('SELECT data_json FROM website_pages ORDER BY rowid ASC').all() as {
    data_json: string;
  }[];
  return rows.map((r) => JSON.parse(r.data_json) as WebsitePage);
}

export function getAllServices(): ServiceItem[] {
  const db = getDb();
  const rows = db.prepare('SELECT data_json FROM services ORDER BY order_index ASC').all() as {
    data_json: string;
  }[];
  return rows.map((r) => JSON.parse(r.data_json) as ServiceItem);
}

export function getAllCategories(): GalleryCategory[] {
  const db = getDb();
  const rows = db.prepare('SELECT data_json FROM categories ORDER BY rowid ASC').all() as {
    data_json: string;
  }[];
  return rows.map((r) => JSON.parse(r.data_json) as GalleryCategory);
}

export function getAllGalleryItems(): GalleryItem[] {
  const db = getDb();
  const rows = db.prepare('SELECT data_json FROM gallery_items ORDER BY created_at DESC').all() as {
    data_json: string;
  }[];
  return rows.map((r) => JSON.parse(r.data_json) as GalleryItem);
}

export function getAllMediaAssets(): MediaAsset[] {
  const db = getDb();
  const rows = db.prepare('SELECT data_json FROM media_assets ORDER BY created_at DESC').all() as {
    data_json: string;
  }[];
  return rows.map((r) => JSON.parse(r.data_json) as MediaAsset);
}

export function getAllVideos(): WeddingVideo[] {
  const db = getDb();
  const rows = db.prepare('SELECT data_json FROM videos ORDER BY created_at DESC').all() as {
    data_json: string;
  }[];
  return rows.map((r) => JSON.parse(r.data_json) as WeddingVideo);
}

export function getAllPackages(): WeddingPackage[] {
  const db = getDb();
  const rows = db.prepare('SELECT data_json FROM packages ORDER BY order_index ASC').all() as {
    data_json: string;
  }[];
  return rows.map((r) => JSON.parse(r.data_json) as WeddingPackage);
}

export function getAllTestimonials(): TestimonialItem[] {
  const db = getDb();
  const rows = db.prepare('SELECT data_json FROM testimonials ORDER BY created_at DESC').all() as {
    data_json: string;
  }[];
  return rows.map((r) => JSON.parse(r.data_json) as TestimonialItem);
}

export function getAllNavigation(): NavigationItem[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT data_json FROM navigation_items ORDER BY order_index ASC')
    .all() as { data_json: string }[];
  return rows.map((r) => JSON.parse(r.data_json) as NavigationItem);
}

export function getAllInquiries(): BookingInquiry[] {
  const db = getDb();
  const rows = db.prepare('SELECT data_json FROM inquiries ORDER BY created_at DESC').all() as {
    data_json: string;
  }[];
  return rows.map((r) => JSON.parse(r.data_json) as BookingInquiry);
}

export function getPublicStudioData(): PublicStudioData {
  const pages = getAllPages();
  const services = getAllServices().filter((s) => s.published !== false);
  const categories = getAllCategories();
  const gallery = getAllGalleryItems();
  const videos = getAllVideos().filter((v) => v.published !== false);
  const packages = getAllPackages().filter((p) => p.published !== false);
  const testimonials = getAllTestimonials().filter((t) => t.published !== false);
  const navigation = getAllNavigation().filter((n) => n.visible !== false);

  return {
    businessInfo: getDocument<BusinessInfo>('business_info', DEFAULT_BUSINESS_INFO),
    homepage: getDocument<HomepageContent>('homepage', DEFAULT_HOMEPAGE_CONTENT),
    pages: pages.filter((p) => p.status === 'published'),
    services,
    categories,
    gallery,
    videos,
    packages,
    testimonials,
    navigation,
    footer: getDocument<FooterConfig>('footer', DEFAULT_FOOTER),
    settings: getDocument<WebsiteSettings>('settings', DEFAULT_WEBSITE_SETTINGS),
  };
}

export function getDashboardOverviewStats(): DashboardOverviewStats {
  const db = getDb();
  const pages = getAllPages();
  const gallery = getAllGalleryItems();
  const videos = getAllVideos();
  const packages = getAllPackages();
  const inquiries = getAllInquiries();
  const testimonials = getAllTestimonials();

  const auditRows = db
    .prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10')
    .all() as {
    id: string;
    actor_email: string;
    action: string;
    entity_type: string;
    details: string;
    created_at: string;
  }[];

  return {
    totalPages: pages.length,
    publishedPages: pages.filter((p) => p.status === 'published').length,
    totalGalleryImages: gallery.length,
    totalVideos: videos.length,
    totalPackages: packages.length,
    totalInquiries: inquiries.length,
    newInquiries: inquiries.filter((i) => i.status === 'new').length,
    publishedTestimonials: testimonials.filter((t) => t.published).length,
    recentAuditLogs: auditRows.map((a) => ({
      id: a.id,
      actorEmail: a.actor_email,
      action: a.action,
      entityType: a.entity_type,
      details: a.details,
      createdAt: a.created_at,
    })),
    latestInquiries: inquiries.slice(0, 5),
  };
}

export function addInquiry(
  payload: Omit<BookingInquiry, 'id' | 'status' | 'createdAt' | 'emailDispatched' | 'internalNotes'>,
  emailDispatched: boolean
): BookingInquiry {
  const db = getDb();
  const entry: BookingInquiry = {
    ...payload,
    id: `inq-${crypto.randomUUID().slice(0, 8)}`,
    status: 'new',
    internalNotes: '',
    createdAt: new Date().toISOString(),
    emailDispatched,
  };
  db.prepare(
    'INSERT INTO inquiries (id, status, created_at, data_json) VALUES (?, ?, ?, ?)'
  ).run(entry.id, entry.status, entry.createdAt, JSON.stringify(entry));
  return entry;
}

export function updateInquiry(
  id: string,
  patch: { status?: InquiryStatus; internalNotes?: string }
): BookingInquiry | null {
  const db = getDb();
  const row = db.prepare('SELECT data_json FROM inquiries WHERE id = ?').get(id) as
    | { data_json: string }
    | undefined;
  if (!row) return null;
  const item = JSON.parse(row.data_json) as BookingInquiry;
  if (patch.status) item.status = patch.status;
  if (patch.internalNotes !== undefined) item.internalNotes = patch.internalNotes;
  db.prepare('UPDATE inquiries SET status = ?, data_json = ? WHERE id = ?').run(
    item.status,
    JSON.stringify(item),
    id
  );
  return item;
}

export function deleteInquiry(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM inquiries WHERE id = ?').run(id);
  return Number(result.changes) > 0;
}

export function listAdminUsers(): AdminUser[] {
  const db = getDb();
  const rows = db
    .prepare(
      'SELECT id, email, name, role, active, created_at, last_login_at FROM admin_users ORDER BY created_at ASC'
    )
    .all() as {
    id: string;
    email: string;
    name: string;
    role: AdminRole;
    active: number;
    created_at: string;
    last_login_at: string | null;
  }[];
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    active: Boolean(r.active),
    createdAt: r.created_at,
    lastLoginAt: r.last_login_at,
  }));
}

export function createAdminUser(input: {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
}): { user?: AdminUser; error?: string } {
  const db = getDb();
  const cleanEmail = input.email.trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { error: 'Valid email is required.' };
  }
  if (!input.password || input.password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }
  const existing = db.prepare('SELECT id FROM admin_users WHERE email = ?').get(cleanEmail);
  if (existing) {
    return { error: 'An administrator with this email already exists.' };
  }
  const { hash, salt } = hashPassword(input.password);
  const now = new Date().toISOString();
  const id = `usr-${crypto.randomUUID().slice(0, 8)}`;
  db.prepare(
    'INSERT INTO admin_users (id, email, name, role, active, password_hash, salt, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, cleanEmail, input.name.trim() || cleanEmail, input.role, 1, hash, salt, now, null);

  return {
    user: {
      id,
      name: input.name.trim() || cleanEmail,
      email: cleanEmail,
      role: input.role,
      active: true,
      createdAt: now,
      lastLoginAt: null,
    },
  };
}

export function findMediaReferences(url: string): string[] {
  const refs: string[] = [];
  const pages = getAllPages();
  for (const p of pages) {
    if (p.status === 'published') {
      if (p.heroImage === url || p.ogImage === url) {
        refs.push(`Published Page: ${p.title}`);
      }
      if (p.sections?.some((s) => s.imageUrl === url)) {
        refs.push(`Published Page Section: ${p.title}`);
      }
    }
  }
  const homepage = getDocument<HomepageContent>('homepage', DEFAULT_HOMEPAGE_CONTENT);
  if (homepage.heroImage === url || homepage.aboutImage === url) {
    refs.push('Homepage Hero/About');
  }
  const gallery = getAllGalleryItems();
  for (const g of gallery) {
    if (g.imageUrl === url) refs.push(`Gallery: ${g.title}`);
  }
  const services = getAllServices();
  for (const s of services) {
    if (s.image === url) refs.push(`Service: ${s.title}`);
  }
  const packages = getAllPackages();
  for (const pkg of packages) {
    if (pkg.imageUrl === url) refs.push(`Package: ${pkg.name}`);
  }
  return refs;
}

export function replaceMediaReferences(oldUrl: string, newUrl: string): void {
  const db = getDb();

  // Update homepage
  const homepage = getDocument<HomepageContent>('homepage', DEFAULT_HOMEPAGE_CONTENT);
  let homeChanged = false;
  if (homepage.heroImage === oldUrl) {
    homepage.heroImage = newUrl;
    homeChanged = true;
  }
  if (homepage.aboutImage === oldUrl) {
    homepage.aboutImage = newUrl;
    homeChanged = true;
  }
  if (homeChanged) setDocument('homepage', homepage);

  // Update settings & footer if logo/favicon replaced
  const settings = getDocument<WebsiteSettings>('settings', DEFAULT_WEBSITE_SETTINGS);
  let settingsChanged = false;
  if (settings.logoUrl === oldUrl) {
    settings.logoUrl = newUrl;
    settingsChanged = true;
  }
  if (settings.faviconUrl === oldUrl) {
    settings.faviconUrl = newUrl;
    settingsChanged = true;
  }
  if (settingsChanged) setDocument('settings', settings);

  const footer = getDocument<FooterConfig>('footer', DEFAULT_FOOTER);
  if (footer.logoUrl === oldUrl) {
    footer.logoUrl = newUrl;
    setDocument('footer', footer);
  }

  // Update pages
  for (const p of getAllPages()) {
    let changed = false;
    if (p.heroImage === oldUrl) {
      p.heroImage = newUrl;
      changed = true;
    }
    if (p.ogImage === oldUrl) {
      p.ogImage = newUrl;
      changed = true;
    }
    for (const s of p.sections || []) {
      if (s.imageUrl === oldUrl) {
        s.imageUrl = newUrl;
        changed = true;
      }
    }
    if (changed) {
      db.prepare('UPDATE website_pages SET data_json = ? WHERE id = ?').run(
        JSON.stringify(p),
        p.id
      );
    }
  }

  // Update gallery items
  for (const g of getAllGalleryItems()) {
    if (g.imageUrl === oldUrl) {
      g.imageUrl = newUrl;
      db.prepare('UPDATE gallery_items SET data_json = ? WHERE id = ?').run(
        JSON.stringify(g),
        g.id
      );
    }
  }

  // Update services
  for (const s of getAllServices()) {
    if (s.image === oldUrl) {
      s.image = newUrl;
      db.prepare('UPDATE services SET data_json = ? WHERE id = ?').run(
        JSON.stringify(s),
        s.id
      );
    }
  }
}
