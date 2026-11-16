import express, { type Express } from 'express';
import crypto from 'node:crypto';
import {
  authenticateAdminCredentials,
  clearSessionCookie,
  createSessionToken,
  getAuthenticatedAdmin,
  isAdminConfigured,
  requireAdminAuth,
  requireRoles,
  setSessionCookie,
  setupInitialAdmin,
  type RequestWithAdmin,
} from './auth.js';
import { UPLOADS_DIR, getDb, hashPassword, verifyPassword } from './db.js';
import { DEFAULT_BUSINESS_INFO, DEFAULT_FOOTER, DEFAULT_HOMEPAGE_CONTENT, DEFAULT_WEBSITE_SETTINGS } from './defaultData.js';
import { dispatchInquiryNotification, dispatchPasswordResetEmail } from './mailer.js';
import { persistUploadedMedia } from './storage.js';
import {
  addInquiry,
  createAdminUser,
  deleteInquiry,
  findMediaReferences,
  getAllCategories,
  getAllGalleryItems,
  getAllInquiries,
  getAllMediaAssets,
  getAllNavigation,
  getAllPackages,
  getAllPages,
  getAllServices,
  getAllTestimonials,
  getAllVideos,
  getDashboardOverviewStats,
  getDocument,
  getPublicStudioData,
  listAdminUsers,
  recordAuditLog,
  replaceMediaReferences,
  setDocument,
  updateInquiry,
} from './store.js';
import type {
  AdminRole,
  BusinessInfo,
  FooterConfig,
  GalleryItem,
  HomepageContent,
  InquiryStatus,
  MediaAsset,
  NavigationItem,
  ServiceItem,
  TestimonialItem,
  WebsitePage,
  WebsiteSettings,
  WeddingPackage,
  WeddingVideo,
} from '../src/types/studio.js';

const inquiryRateMap = new Map<string, number[]>();
const loginRateMap = new Map<string, number[]>();

function isRateLimited(
  map: Map<string, number[]>,
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const timestamps = (map.get(key) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxRequests) {
    map.set(key, timestamps);
    return true;
  }
  timestamps.push(now);
  map.set(key, timestamps);
  return false;
}

function sanitizeText(val: unknown, maxLen = 500): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

function actor(req: express.Request): string {
  return (req as RequestWithAdmin).admin?.email || 'system';
}

export function createApiApp(): Express {
  const app = express();
  getDb(); // Initialize SQLite schema & seed defaults on boot

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '25mb' }));
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Health Check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'twins-twins-video-pro', database: 'sqlite' });
  });

  // Dynamic XML Sitemap & robots.txt
  app.get('/sitemap.xml', (req, res) => {
    const baseUrl =
      process.env.APP_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    const pages = getAllPages().filter((p) => p.status === 'published');
    const urls = pages
      .map(
        (p) =>
          `  <url>\n    <loc>${baseUrl.replace(/\/+$/, '')}${p.slug === '/' ? '' : p.slug}</loc>\n    <lastmod>${(
            p.updatedAt || new Date().toISOString()
          ).slice(0, 10)}</lastmod>\n  </url>`
      )
      .join('\n');
    res.type('application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`
    );
  });

  app.get('/robots.txt', (req, res) => {
    const baseUrl =
      process.env.APP_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    res
      .type('text/plain')
      .send(
        `User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${baseUrl.replace(
          /\/+$/,
          ''
        )}/sitemap.xml\n`
      );
  });

  // Public Studio Payload (cache-control disabled so CMS edits reflect immediately)
  app.get('/api/studio', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json(getPublicStudioData());
  });

  // Public Inquiry Submission
  app.post('/api/inquiries', async (req, res) => {
    const ip = req.ip || 'unknown';
    if (isRateLimited(inquiryRateMap, ip, 10, 1000 * 60 * 15)) {
      res.status(429).json({ error: 'Too many inquiries sent recently. Please try again shortly.' });
      return;
    }

    const body = req.body || {};
    if (typeof body.website === 'string' && body.website.trim().length > 0) {
      res.status(200).json({ ok: true, message: 'Thank you. Your inquiry has been received.' });
      return;
    }
    if (typeof body.formLoadedAt === 'number' && Date.now() - body.formLoadedAt < 1000) {
      res.status(400).json({ error: 'Please complete the inquiry form before submitting.' });
      return;
    }

    const fullName = sanitizeText(body.fullName, 120);
    const email = sanitizeText(body.email, 160);
    const phone = sanitizeText(body.phone, 50);
    if (!fullName || fullName.length < 2) {
      res.status(400).json({ error: 'Please enter your full name.' });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!phone || phone.length < 6) {
      res.status(400).json({ error: 'Please enter a valid phone number.' });
      return;
    }

    const businessInfo = getDocument<BusinessInfo>('business_info', DEFAULT_BUSINESS_INFO);
    const inquiryPayload = {
      fullName,
      email,
      phone,
      weddingDate: sanitizeText(body.weddingDate, 60),
      weddingVenue: sanitizeText(body.weddingVenue, 160),
      weddingLocation: sanitizeText(body.weddingLocation, 160),
      serviceRequired: sanitizeText(body.serviceRequired, 120) || 'Wedding Photography',
      preferredPackage: sanitizeText(body.preferredPackage, 120) || 'Request a Custom Quote',
      estimatedBudget: sanitizeText(body.estimatedBudget, 80),
      additionalRequirements: sanitizeText(body.additionalRequirements, 2000),
      source: body.source === 'contact' ? ('contact' as const) : ('booking' as const),
    };

    const mailResult = await dispatchInquiryNotification(inquiryPayload, businessInfo.email);
    const saved = addInquiry(inquiryPayload, mailResult.dispatched);

    res.status(201).json({
      ok: true,
      inquiryId: saved.id,
      emailDispatched: mailResult.dispatched,
      message:
        'Thank you for reaching out to Twins Twins Video Pro. Your wedding inquiry has been securely saved and our studio team will reply within 24 hours.',
    });
  });

  // Auth Endpoints
  app.get('/api/auth/status', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const admin = getAuthenticatedAdmin(req);
    res.json({
      configured: isAdminConfigured(),
      authenticated: Boolean(admin),
      user: admin,
    });
  });

  app.post('/api/auth/setup', (req, res) => {
    if (isAdminConfigured()) {
      res.status(403).json({ error: 'Studio administrator account is already initialized.' });
      return;
    }
    const email = sanitizeText(req.body?.email, 160);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const result = setupInitialAdmin(email, password);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    const admin = authenticateAdminCredentials(email, password);
    if (!admin) {
      res.status(500).json({ error: 'Setup succeeded but login failed.' });
      return;
    }
    const token = createSessionToken(admin, true);
    setSessionCookie(res, token, true);
    res.status(201).json({ ok: true, user: admin });
  });

  app.post('/api/auth/login', (req, res) => {
    const ip = req.ip || 'unknown';
    if (isRateLimited(loginRateMap, ip, 12, 1000 * 60 * 15)) {
      res.status(429).json({ error: 'Too many login attempts. Wait 15 minutes and try again.' });
      return;
    }
    const email = sanitizeText(req.body?.email, 160);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const rememberMe = Boolean(req.body?.rememberMe);

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const admin = authenticateAdminCredentials(email, password);
    if (!admin) {
      res.status(401).json({ error: 'Invalid email or password, or account disabled.' });
      return;
    }

    const token = createSessionToken(admin, rememberMe);
    setSessionCookie(res, token, rememberMe);
    recordAuditLog(admin.email, 'Signed In', 'auth', `Role: ${admin.role}`);
    res.json({ ok: true, user: admin });
  });

  app.post('/api/auth/logout', (req, res) => {
    const admin = getAuthenticatedAdmin(req);
    if (admin) {
      recordAuditLog(admin.email, 'Signed Out', 'auth', 'Session ended');
    }
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    const email = sanitizeText(req.body?.email, 160).toLowerCase();
    if (!email) {
      res.status(400).json({ error: 'Please enter your administrator email address.' });
      return;
    }
    const db = getDb();
    const user = db
      .prepare('SELECT id, email, active FROM admin_users WHERE email = ?')
      .get(email) as { id: string; email: string; active: number } | undefined;

    if (user && user.active) {
      const token = crypto.randomBytes(24).toString('hex');
      const expiresAt = Date.now() + 1000 * 60 * 30; // 30 minutes
      db.prepare(
        'INSERT INTO password_resets (token, email, expires_at, used) VALUES (?, ?, ?, 0)'
      ).run(token, user.email, expiresAt);
      const baseUrl =
        process.env.APP_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
      const resetUrl = `${baseUrl.replace(/\/+$/, '')}/admin/login?resetToken=${token}`;
      const sent = await dispatchPasswordResetEmail(user.email, resetUrl);
      recordAuditLog(user.email, 'Password Reset Requested', 'auth', sent ? 'Email sent' : 'SMTP not configured');
    }

    res.json({
      ok: true,
      message:
        'If an active administrator account matches that email, password reset instructions have been issued via configured studio email (SMTP). If SMTP is not configured yet, update INITIAL_ADMIN_PASSWORD or reset via Super Admin.',
    });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const token = sanitizeText(req.body?.token, 128);
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
    if (!token || newPassword.length < 8) {
      res.status(400).json({ error: 'Valid reset token and password (8+ chars) are required.' });
      return;
    }
    const db = getDb();
    const row = db
      .prepare('SELECT * FROM password_resets WHERE token = ?')
      .get(token) as { token: string; email: string; expires_at: number; used: number } | undefined;

    if (!row || row.used || row.expires_at < Date.now()) {
      res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
      return;
    }

    const { hash, salt } = hashPassword(newPassword);
    db.prepare('UPDATE admin_users SET password_hash = ?, salt = ? WHERE email = ?').run(
      hash,
      salt,
      row.email
    );
    db.prepare('UPDATE password_resets SET used = 1 WHERE token = ?').run(token);
    recordAuditLog(row.email, 'Password Reset Completed', 'auth', 'Password updated via token');
    res.json({ ok: true, message: 'Password updated. You can now sign in.' });
  });

  // ===========================================================================
  // PROTECTED ADMIN CMS ROUTES
  // ===========================================================================

  // Dashboard Overview
  app.get('/api/admin/overview', requireAdminAuth, (_req, res) => {
    res.json(getDashboardOverviewStats());
  });

  // Full Admin CMS State Bundle
  app.get('/api/admin/cms-state', requireAdminAuth, (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      overview: getDashboardOverviewStats(),
      pages: getAllPages(),
      services: getAllServices(),
      categories: getAllCategories(),
      gallery: getAllGalleryItems(),
      media: getAllMediaAssets(),
      videos: getAllVideos(),
      packages: getAllPackages(),
      testimonials: getAllTestimonials(),
      inquiries: getAllInquiries(),
      navigation: getAllNavigation(),
      footer: getDocument<FooterConfig>('footer', DEFAULT_FOOTER),
      businessInfo: getDocument<BusinessInfo>('business_info', DEFAULT_BUSINESS_INFO),
      homepage: getDocument<HomepageContent>('homepage', DEFAULT_HOMEPAGE_CONTENT),
      settings: getDocument<WebsiteSettings>('settings', DEFAULT_WEBSITE_SETTINGS),
      users: listAdminUsers(),
    });
  });

  // Change Own Password
  app.post('/api/admin/change-password', requireAdminAuth, (req, res) => {
    const admin = (req as RequestWithAdmin).admin!;
    const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      return;
    }
    const db = getDb();
    const userRow = db
      .prepare('SELECT password_hash, salt FROM admin_users WHERE id = ?')
      .get(admin.id) as { password_hash: string; salt: string } | undefined;

    if (!userRow || !verifyPassword(currentPassword, userRow.password_hash, userRow.salt)) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }

    const { hash, salt } = hashPassword(newPassword);
    db.prepare('UPDATE admin_users SET password_hash = ?, salt = ? WHERE id = ?').run(
      hash,
      salt,
      admin.id
    );
    recordAuditLog(admin.email, 'Changed Password', 'admin_users', 'Updated own account password');
    res.json({ ok: true, message: 'Password updated successfully.' });
  });

  // Website Pages CRUD (Content Manager)
  app.post(
    '/api/admin/pages',
    requireAdminAuth,
    requireRoles(['Content Manager']),
    (req, res) => {
      const db = getDb();
      const title = sanitizeText(req.body?.title, 120);
      const rawSlug = sanitizeText(req.body?.slug, 120);
      if (!title || !rawSlug) {
        res.status(400).json({ error: 'Page title and URL slug are required.' });
        return;
      }
      const slug = rawSlug.startsWith('/') ? rawSlug.toLowerCase() : `/${rawSlug.toLowerCase()}`;
      const existing = db.prepare('SELECT id FROM website_pages WHERE slug = ?').get(slug);
      if (existing) {
        res.status(409).json({ error: 'A page with that slug already exists.' });
        return;
      }
      const now = new Date().toISOString();
      const page: WebsitePage = {
        id: `page-${crypto.randomUUID().slice(0, 8)}`,
        slug,
        title,
        status: req.body?.status === 'published' ? 'published' : 'draft',
        isSystemPage: false,
        heroEyebrow: sanitizeText(req.body?.heroEyebrow, 120) || 'Twins Twins Video Pro',
        heroTitle: sanitizeText(req.body?.heroTitle, 200) || title,
        heroDescription: sanitizeText(req.body?.heroDescription, 500),
        heroImage: sanitizeText(req.body?.heroImage, 500000) || 'img://hero',
        sections: Array.isArray(req.body?.sections) ? req.body.sections : [],
        seoTitle: sanitizeText(req.body?.seoTitle, 160) || `${title} | Twins Twins Video Pro`,
        seoDescription: sanitizeText(req.body?.seoDescription, 300),
        seoKeywords: sanitizeText(req.body?.seoKeywords, 300),
        ogImage: sanitizeText(req.body?.ogImage, 500000) || 'img://hero',
        socialTitle: sanitizeText(req.body?.socialTitle, 160) || title,
        socialDescription: sanitizeText(req.body?.socialDescription, 300),
        canonicalUrl: sanitizeText(req.body?.canonicalUrl, 200) || slug,
        updatedAt: now,
      };
      db.prepare(
        'INSERT INTO website_pages (id, slug, status, data_json, updated_at) VALUES (?, ?, ?, ?, ?)'
      ).run(page.id, page.slug, page.status, JSON.stringify(page), now);
      recordAuditLog(actor(req), 'Created Page', 'website_pages', `${page.title} (${page.slug})`);
      res.status(201).json({ page });
    }
  );

  app.put(
    '/api/admin/pages/:id',
    requireAdminAuth,
    requireRoles(['Content Manager']),
    (req, res) => {
      const db = getDb();
      const row = db
        .prepare('SELECT data_json FROM website_pages WHERE id = ?')
        .get(req.params.id) as { data_json: string } | undefined;
      if (!row) {
        res.status(404).json({ error: 'Page not found.' });
        return;
      }
      const page = JSON.parse(row.data_json) as WebsitePage;
      const b = req.body || {};
      const updated: WebsitePage = {
        ...page,
        title: b.title !== undefined ? sanitizeText(b.title, 120) : page.title,
        slug:
          !page.isSystemPage && b.slug !== undefined
            ? (sanitizeText(b.slug, 120).startsWith('/')
                ? sanitizeText(b.slug, 120).toLowerCase()
                : `/${sanitizeText(b.slug, 120).toLowerCase()}`)
            : page.slug,
        status: b.status === 'published' || b.status === 'draft' ? b.status : page.status,
        heroEyebrow: b.heroEyebrow !== undefined ? sanitizeText(b.heroEyebrow, 120) : page.heroEyebrow,
        heroTitle: b.heroTitle !== undefined ? sanitizeText(b.heroTitle, 200) : page.heroTitle,
        heroDescription:
          b.heroDescription !== undefined ? sanitizeText(b.heroDescription, 600) : page.heroDescription,
        heroImage: b.heroImage !== undefined ? sanitizeText(b.heroImage, 500000) : page.heroImage,
        sections: Array.isArray(b.sections) ? b.sections : page.sections,
        seoTitle: b.seoTitle !== undefined ? sanitizeText(b.seoTitle, 160) : page.seoTitle,
        seoDescription:
          b.seoDescription !== undefined ? sanitizeText(b.seoDescription, 300) : page.seoDescription,
        seoKeywords: b.seoKeywords !== undefined ? sanitizeText(b.seoKeywords, 300) : page.seoKeywords,
        ogImage: b.ogImage !== undefined ? sanitizeText(b.ogImage, 500000) : page.ogImage,
        socialTitle: b.socialTitle !== undefined ? sanitizeText(b.socialTitle, 160) : page.socialTitle,
        socialDescription:
          b.socialDescription !== undefined
            ? sanitizeText(b.socialDescription, 300)
            : page.socialDescription,
        canonicalUrl:
          b.canonicalUrl !== undefined ? sanitizeText(b.canonicalUrl, 200) : page.canonicalUrl,
        updatedAt: new Date().toISOString(),
      };
      db.prepare(
        'UPDATE website_pages SET slug = ?, status = ?, data_json = ?, updated_at = ? WHERE id = ?'
      ).run(updated.slug, updated.status, JSON.stringify(updated), updated.updatedAt, updated.id);
      recordAuditLog(actor(req), 'Updated Page', 'website_pages', `${updated.title} [${updated.status}]`);
      res.json({ page: updated });
    }
  );

  app.delete(
    '/api/admin/pages/:id',
    requireAdminAuth,
    requireRoles(['Content Manager']),
    (req, res) => {
      const db = getDb();
      const row = db
        .prepare('SELECT data_json FROM website_pages WHERE id = ?')
        .get(req.params.id) as { data_json: string } | undefined;
      if (!row) {
        res.status(404).json({ error: 'Page not found.' });
        return;
      }
      const page = JSON.parse(row.data_json) as WebsitePage;
      if (page.isSystemPage) {
        res.status(400).json({ error: 'Core system pages cannot be permanently deleted; unpublish them instead.' });
        return;
      }
      db.prepare('DELETE FROM website_pages WHERE id = ?').run(req.params.id);
      recordAuditLog(actor(req), 'Deleted Page', 'website_pages', page.title);
      res.json({ ok: true });
    }
  );

  // Homepage Management
  app.put(
    '/api/admin/homepage',
    requireAdminAuth,
    requireRoles(['Content Manager']),
    (req, res) => {
      const current = getDocument<HomepageContent>('homepage', DEFAULT_HOMEPAGE_CONTENT);
      const b = req.body || {};
      const next: HomepageContent = {
        ...current,
        ...b,
        heroHeading: sanitizeText(b.heroHeading ?? current.heroHeading, 240),
        heroSubheading: sanitizeText(b.heroSubheading ?? current.heroSubheading, 180),
        heroSupportingText: sanitizeText(b.heroSupportingText ?? current.heroSupportingText, 700),
        aboutHeading: sanitizeText(b.aboutHeading ?? current.aboutHeading, 240),
        aboutLead: sanitizeText(b.aboutLead ?? current.aboutLead, 400),
        aboutBody: sanitizeText(b.aboutBody ?? current.aboutBody, 1200),
        aboutApproach: Array.isArray(b.aboutApproach)
          ? b.aboutApproach.map((s: unknown) => sanitizeText(s, 140)).filter(Boolean)
          : current.aboutApproach,
        sections: Array.isArray(b.sections) ? b.sections : current.sections,
      };
      setDocument('homepage', next);
      recordAuditLog(actor(req), 'Updated Homepage', 'homepage', 'Saved homepage content & sections');
      res.json({ homepage: next });
    }
  );

  // Services Management
  app.post(
    '/api/admin/services',
    requireAdminAuth,
    requireRoles(['Content Manager']),
    (req, res) => {
      const db = getDb();
      const title = sanitizeText(req.body?.title, 120);
      if (!title) {
        res.status(400).json({ error: 'Service title is required.' });
        return;
      }
      const existing = getAllServices();
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const service: ServiceItem = {
        id: `srv-${crypto.randomUUID().slice(0, 8)}`,
        slug,
        title,
        shortDescription: sanitizeText(req.body?.shortDescription, 240),
        fullDescription: sanitizeText(req.body?.fullDescription, 1000),
        deliverables: Array.isArray(req.body?.deliverables)
          ? req.body.deliverables.map((d: unknown) => sanitizeText(d, 160)).filter(Boolean)
          : [],
        image: sanitizeText(req.body?.image, 500000) || 'img://hero',
        iconName: sanitizeText(req.body?.iconName, 40) || 'Camera',
        route: sanitizeText(req.body?.route, 120) || '/photography',
        orderIndex: Number(req.body?.orderIndex) || existing.length + 1,
        published: req.body?.published !== false,
        featured: Boolean(req.body?.featured ?? true),
      };
      db.prepare(
        'INSERT INTO services (id, order_index, published, data_json) VALUES (?, ?, ?, ?)'
      ).run(service.id, service.orderIndex, service.published ? 1 : 0, JSON.stringify(service));
      recordAuditLog(actor(req), 'Created Service', 'services', service.title);
      res.status(201).json({ service });
    }
  );

  app.put(
    '/api/admin/services/:id',
    requireAdminAuth,
    requireRoles(['Content Manager']),
    (req, res) => {
      const db = getDb();
      const row = db.prepare('SELECT data_json FROM services WHERE id = ?').get(req.params.id) as
        | { data_json: string }
        | undefined;
      if (!row) {
        res.status(404).json({ error: 'Service not found.' });
        return;
      }
      const srv = JSON.parse(row.data_json) as ServiceItem;
      const b = req.body || {};
      const updated: ServiceItem = {
        ...srv,
        title: b.title !== undefined ? sanitizeText(b.title, 120) : srv.title,
        shortDescription:
          b.shortDescription !== undefined ? sanitizeText(b.shortDescription, 240) : srv.shortDescription,
        fullDescription:
          b.fullDescription !== undefined ? sanitizeText(b.fullDescription, 1000) : srv.fullDescription,
        deliverables: Array.isArray(b.deliverables)
          ? b.deliverables.map((d: unknown) => sanitizeText(d, 160)).filter(Boolean)
          : srv.deliverables,
        image: b.image !== undefined ? sanitizeText(b.image, 500000) : srv.image,
        iconName: b.iconName !== undefined ? sanitizeText(b.iconName, 40) : srv.iconName,
        route: b.route !== undefined ? sanitizeText(b.route, 120) : srv.route,
        orderIndex: b.orderIndex !== undefined ? Number(b.orderIndex) : srv.orderIndex,
        published: b.published !== undefined ? Boolean(b.published) : srv.published,
        featured: b.featured !== undefined ? Boolean(b.featured) : srv.featured,
      };
      db.prepare(
        'UPDATE services SET order_index = ?, published = ?, data_json = ? WHERE id = ?'
      ).run(updated.orderIndex, updated.published ? 1 : 0, JSON.stringify(updated), updated.id);
      recordAuditLog(actor(req), 'Updated Service', 'services', updated.title);
      res.json({ service: updated });
    }
  );

  app.delete(
    '/api/admin/services/:id',
    requireAdminAuth,
    requireRoles(['Content Manager']),
    (req, res) => {
      const db = getDb();
      db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
      recordAuditLog(actor(req), 'Deleted Service', 'services', req.params.id);
      res.json({ ok: true });
    }
  );

  // Media Library & Cloud/Persistent Upload
  app.post(
    '/api/admin/upload',
    requireAdminAuth,
    requireRoles(['Content Manager', 'Gallery Manager']),
    async (req, res) => {
      try {
        const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '';
        const filename = sanitizeText(req.body?.filename, 120) || 'studio-media';
        const stored = await persistUploadedMedia(dataUrl, filename);
        const addToLibrary = req.body?.addToLibrary !== false;

        let asset: MediaAsset | null = null;
        if (addToLibrary) {
          const db = getDb();
          const now = new Date().toISOString();
          asset = {
            id: `med-${crypto.randomUUID().slice(0, 8)}`,
            title: sanitizeText(req.body?.title, 140) || filename.replace(/\.[^.]+$/, ''),
            description: sanitizeText(req.body?.description, 300),
            altText: sanitizeText(req.body?.altText, 200) || filename,
            category: sanitizeText(req.body?.category, 80) || 'Studio Uploads',
            url: stored.url,
            thumbnailUrl: stored.url,
            mimeType: stored.mimeType,
            sizeBytes: stored.sizeBytes,
            createdAt: now,
          };
          db.prepare(
            'INSERT INTO media_assets (id, category, url, created_at, data_json) VALUES (?, ?, ?, ?, ?)'
          ).run(asset.id, asset.category, asset.url, now, JSON.stringify(asset));
        }

        recordAuditLog(actor(req), 'Uploaded Media', 'media_assets', `${filename} (${stored.storageProvider})`);
        res.status(201).json({ url: stored.url, storageProvider: stored.storageProvider, asset });
      } catch (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Upload failed.' });
      }
    }
  );

  app.put(
    '/api/admin/media/:id',
    requireAdminAuth,
    requireRoles(['Content Manager', 'Gallery Manager']),
    (req, res) => {
      const db = getDb();
      const row = db
        .prepare('SELECT data_json FROM media_assets WHERE id = ?')
        .get(req.params.id) as { data_json: string } | undefined;
      if (!row) {
        res.status(404).json({ error: 'Media asset not found.' });
        return;
      }
      const asset = JSON.parse(row.data_json) as MediaAsset;
      const oldUrl = asset.url;
      const b = req.body || {};
      const updated: MediaAsset = {
        ...asset,
        title: b.title !== undefined ? sanitizeText(b.title, 140) : asset.title,
        description: b.description !== undefined ? sanitizeText(b.description, 300) : asset.description,
        altText: b.altText !== undefined ? sanitizeText(b.altText, 200) : asset.altText,
        category: b.category !== undefined ? sanitizeText(b.category, 80) : asset.category,
        url: b.url !== undefined ? sanitizeText(b.url, 500000) : asset.url,
        thumbnailUrl: b.url !== undefined ? sanitizeText(b.url, 500000) : asset.thumbnailUrl,
      };
      db.prepare(
        'UPDATE media_assets SET category = ?, url = ?, data_json = ? WHERE id = ?'
      ).run(updated.category, updated.url, JSON.stringify(updated), updated.id);
      if (oldUrl !== updated.url) {
        replaceMediaReferences(oldUrl, updated.url);
      }
      recordAuditLog(actor(req), 'Updated Media', 'media_assets', updated.title);
      res.json({ asset: updated });
    }
  );

  app.get(
    '/api/admin/media/:id/references',
    requireAdminAuth,
    (req, res) => {
      const db = getDb();
      const row = db.prepare('SELECT url FROM media_assets WHERE id = ?').get(req.params.id) as
        | { url: string }
        | undefined;
      if (!row) {
        res.status(404).json({ error: 'Media asset not found.' });
        return;
      }
      res.json({ references: findMediaReferences(row.url) });
    }
  );

  app.delete(
    '/api/admin/media/:id',
    requireAdminAuth,
    requireRoles(['Content Manager', 'Gallery Manager']),
    (req, res) => {
      const db = getDb();
      const row = db.prepare('SELECT url, data_json FROM media_assets WHERE id = ?').get(req.params.id) as
        | { url: string; data_json: string }
        | undefined;
      if (!row) {
        res.status(404).json({ error: 'Media asset not found.' });
        return;
      }
      const force = req.query.force === 'true';
      const refs = findMediaReferences(row.url);
      if (refs.length > 0 && !force) {
        res.status(409).json({
          error: 'This image is currently referenced on published website sections.',
          references: refs,
        });
        return;
      }
      db.prepare('DELETE FROM media_assets WHERE id = ?').run(req.params.id);
      if (force && refs.length > 0) {
        replaceMediaReferences(row.url, 'img://hero');
      }
      recordAuditLog(actor(req), 'Deleted Media', 'media_assets', row.url);
      res.json({ ok: true });
    }
  );

  // Gallery & Categories CRUD
  app.post(
    '/api/admin/categories',
    requireAdminAuth,
    requireRoles(['Gallery Manager', 'Content Manager']),
    (req, res) => {
      const db = getDb();
      const name = sanitizeText(req.body?.name, 80);
      if (!name) {
        res.status(400).json({ error: 'Category name is required.' });
        return;
      }
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const existing = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug);
      if (existing) {
        res.status(409).json({ error: 'Category already exists.' });
        return;
      }
      const category = {
        id: `cat-${crypto.randomUUID().slice(0, 8)}`,
        name,
        slug,
        description: sanitizeText(req.body?.description, 240),
      };
      db.prepare('INSERT INTO categories (id, slug, data_json) VALUES (?, ?, ?)').run(
        category.id,
        category.slug,
        JSON.stringify(category)
      );
      recordAuditLog(actor(req), 'Created Category', 'categories', name);
      res.status(201).json({ category });
    }
  );

  app.delete(
    '/api/admin/categories/:id',
    requireAdminAuth,
    requireRoles(['Gallery Manager', 'Content Manager']),
    (req, res) => {
      const db = getDb();
      db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
      recordAuditLog(actor(req), 'Deleted Category', 'categories', req.params.id);
      res.json({ ok: true });
    }
  );

  app.post(
    '/api/admin/gallery',
    requireAdminAuth,
    requireRoles(['Gallery Manager', 'Content Manager']),
    (req, res) => {
      const db = getDb();
      const title = sanitizeText(req.body?.title, 160);
      const category = sanitizeText(req.body?.category, 80);
      const imageUrl = sanitizeText(req.body?.imageUrl, 500000);
      if (!title || !category || !imageUrl) {
        res.status(400).json({ error: 'Title, category, and image are required.' });
        return;
      }
      const now = new Date().toISOString();
      const item: GalleryItem = {
        id: `gal-${crypto.randomUUID().slice(0, 8)}`,
        title,
        category,
        location: sanitizeText(req.body?.location, 120) || 'South Australia',
        dateLabel: sanitizeText(req.body?.dateLabel, 60) || '2026 Collection',
        imageUrl,
        altText: sanitizeText(req.body?.altText, 200) || title,
        aspect: ['portrait', 'landscape', 'square'].includes(req.body?.aspect)
          ? req.body.aspect
          : 'landscape',
        featured: Boolean(req.body?.featured),
        caption: sanitizeText(req.body?.caption, 300),
      };
      db.prepare(
        'INSERT INTO gallery_items (id, category, created_at, data_json) VALUES (?, ?, ?, ?)'
      ).run(item.id, item.category, now, JSON.stringify(item));
      recordAuditLog(actor(req), 'Added Gallery Photo', 'gallery_items', item.title);
      res.status(201).json({ item });
    }
  );

  app.put(
    '/api/admin/gallery/:id',
    requireAdminAuth,
    requireRoles(['Gallery Manager', 'Content Manager']),
    (req, res) => {
      const db = getDb();
      const row = db
        .prepare('SELECT data_json FROM gallery_items WHERE id = ?')
        .get(req.params.id) as { data_json: string } | undefined;
      if (!row) {
        res.status(404).json({ error: 'Gallery item not found.' });
        return;
      }
      const item = JSON.parse(row.data_json) as GalleryItem;
      const b = req.body || {};
      const updated: GalleryItem = {
        ...item,
        title: b.title !== undefined ? sanitizeText(b.title, 160) : item.title,
        category: b.category !== undefined ? sanitizeText(b.category, 80) : item.category,
        location: b.location !== undefined ? sanitizeText(b.location, 120) : item.location,
        dateLabel: b.dateLabel !== undefined ? sanitizeText(b.dateLabel, 60) : item.dateLabel,
        imageUrl: b.imageUrl !== undefined ? sanitizeText(b.imageUrl, 500000) : item.imageUrl,
        altText: b.altText !== undefined ? sanitizeText(b.altText, 200) : item.altText,
        aspect: ['portrait', 'landscape', 'square'].includes(b.aspect) ? b.aspect : item.aspect,
        featured: b.featured !== undefined ? Boolean(b.featured) : item.featured,
        caption: b.caption !== undefined ? sanitizeText(b.caption, 300) : item.caption,
      };
      db.prepare('UPDATE gallery_items SET category = ?, data_json = ? WHERE id = ?').run(
        updated.category,
        JSON.stringify(updated),
        updated.id
      );
      recordAuditLog(actor(req), 'Updated Gallery Photo', 'gallery_items', updated.title);
      res.json({ item: updated });
    }
  );

  app.delete(
    '/api/admin/gallery/:id',
    requireAdminAuth,
    requireRoles(['Gallery Manager', 'Content Manager']),
    (req, res) => {
      const db = getDb();
      db.prepare('DELETE FROM gallery_items WHERE id = ?').run(req.params.id);
      recordAuditLog(actor(req), 'Deleted Gallery Photo', 'gallery_items', req.params.id);
      res.json({ ok: true });
    }
  );

  // Videos CRUD
  app.post(
    '/api/admin/videos',
    requireAdminAuth,
    requireRoles(['Gallery Manager', 'Content Manager']),
    (req, res) => {
      const db = getDb();
      const title = sanitizeText(req.body?.title, 160);
      const videoUrl = sanitizeText(req.body?.videoUrl, 2000);
      if (!title || !videoUrl) {
        res.status(400).json({ error: 'Video title and URL are required.' });
        return;
      }
      const now = new Date().toISOString();
      const video: WeddingVideo = {
        id: `vid-${crypto.randomUUID().slice(0, 8)}`,
        title,
        coupleNames: sanitizeText(req.body?.coupleNames, 100) || 'Studio Couple',
        category: sanitizeText(req.body?.category, 80) || 'Cinematic Wedding Films',
        location: sanitizeText(req.body?.location, 120) || 'South Australia',
        duration: sanitizeText(req.body?.duration, 20) || '04:00',
        thumbnailUrl: sanitizeText(req.body?.thumbnailUrl, 500000) || 'img://reception',
        videoType: ['youtube', 'vimeo', 'mp4'].includes(req.body?.videoType)
          ? req.body.videoType
          : 'mp4',
        videoUrl,
        description: sanitizeText(req.body?.description, 400),
        featured: Boolean(req.body?.featured),
        published: req.body?.published !== false,
      };
      db.prepare(
        'INSERT INTO videos (id, category, published, created_at, data_json) VALUES (?, ?, ?, ?, ?)'
      ).run(video.id, video.category, video.published ? 1 : 0, now, JSON.stringify(video));
      recordAuditLog(actor(req), 'Added Wedding Video', 'videos', video.title);
      res.status(201).json({ video });
    }
  );

  app.put(
    '/api/admin/videos/:id',
    requireAdminAuth,
    requireRoles(['Gallery Manager', 'Content Manager']),
    (req, res) => {
      const db = getDb();
      const row = db.prepare('SELECT data_json FROM videos WHERE id = ?').get(req.params.id) as
        | { data_json: string }
        | undefined;
      if (!row) {
        res.status(404).json({ error: 'Video not found.' });
        return;
      }
      const video = JSON.parse(row.data_json) as WeddingVideo;
      const b = req.body || {};
      const updated: WeddingVideo = {
        ...video,
        title: b.title !== undefined ? sanitizeText(b.title, 160) : video.title,
        coupleNames: b.coupleNames !== undefined ? sanitizeText(b.coupleNames, 100) : video.coupleNames,
        category: b.category !== undefined ? sanitizeText(b.category, 80) : video.category,
        location: b.location !== undefined ? sanitizeText(b.location, 120) : video.location,
        duration: b.duration !== undefined ? sanitizeText(b.duration, 20) : video.duration,
        thumbnailUrl:
          b.thumbnailUrl !== undefined ? sanitizeText(b.thumbnailUrl, 500000) : video.thumbnailUrl,
        videoType: ['youtube', 'vimeo', 'mp4'].includes(b.videoType) ? b.videoType : video.videoType,
        videoUrl: b.videoUrl !== undefined ? sanitizeText(b.videoUrl, 2000) : video.videoUrl,
        description: b.description !== undefined ? sanitizeText(b.description, 400) : video.description,
        featured: b.featured !== undefined ? Boolean(b.featured) : video.featured,
        published: b.published !== undefined ? Boolean(b.published) : video.published,
      };
      db.prepare(
        'UPDATE videos SET category = ?, published = ?, data_json = ? WHERE id = ?'
      ).run(updated.category, updated.published ? 1 : 0, JSON.stringify(updated), updated.id);
      recordAuditLog(actor(req), 'Updated Wedding Video', 'videos', updated.title);
      res.json({ video: updated });
    }
  );

  app.delete(
    '/api/admin/videos/:id',
    requireAdminAuth,
    requireRoles(['Gallery Manager', 'Content Manager']),
    (req, res) => {
      const db = getDb();
      db.prepare('DELETE FROM videos WHERE id = ?').run(req.params.id);
      recordAuditLog(actor(req), 'Deleted Wedding Video', 'videos', req.params.id);
      res.json({ ok: true });
    }
  );

  // Packages CRUD
  app.post(
    '/api/admin/packages',
    requireAdminAuth,
    requireRoles(['Content Manager']),
    (req, res) => {
      const db = getDb();
      const name = sanitizeText(req.body?.name, 120);
      if (!name) {
        res.status(400).json({ error: 'Package name is required.' });
        return;
      }
      const existing = getAllPackages();
      const pkg: WeddingPackage = {
        id: `pkg-${crypto.randomUUID().slice(0, 8)}`,
        name,
        tierLabel: sanitizeText(req.body?.tierLabel, 60) || 'Bespoke Collection',
        subtitle: sanitizeText(req.body?.subtitle, 240),
        priceDisplay: sanitizeText(req.body?.priceDisplay, 60),
        pricingLabel: sanitizeText(req.body?.pricingLabel, 60) || 'Contact for Pricing',
        customQuoteEnabled: req.body?.customQuoteEnabled !== false,
        imageUrl: sanitizeText(req.body?.imageUrl, 500000) || 'img://hero',
        highlighted: Boolean(req.body?.highlighted),
        published: req.body?.published !== false,
        orderIndex: Number(req.body?.orderIndex) || existing.length + 1,
        idealFor: sanitizeText(req.body?.idealFor, 120),
        features: Array.isArray(req.body?.features)
          ? req.body.features.map((f: unknown) => sanitizeText(f, 160)).filter(Boolean)
          : [],
      };
      db.prepare(
        'INSERT INTO packages (id, order_index, published, data_json) VALUES (?, ?, ?, ?)'
      ).run(pkg.id, pkg.orderIndex, pkg.published ? 1 : 0, JSON.stringify(pkg));
      recordAuditLog(actor(req), 'Created Package', 'packages', pkg.name);
      res.status(201).json({ pkg });
    }
  );

  app.put(
    '/api/admin/packages/:id',
    requireAdminAuth,
    requireRoles(['Content Manager']),
    (req, res) => {
      const db = getDb();
      const row = db.prepare('SELECT data_json FROM packages WHERE id = ?').get(req.params.id) as
        | { data_json: string }
        | undefined;
      if (!row) {
        res.status(404).json({ error: 'Package not found.' });
        return;
      }
      const pkg = JSON.parse(row.data_json) as WeddingPackage;
      const b = req.body || {};
      const updated: WeddingPackage = {
        ...pkg,
        name: b.name !== undefined ? sanitizeText(b.name, 120) : pkg.name,
        tierLabel: b.tierLabel !== undefined ? sanitizeText(b.tierLabel, 60) : pkg.tierLabel,
        subtitle: b.subtitle !== undefined ? sanitizeText(b.subtitle, 240) : pkg.subtitle,
        priceDisplay: b.priceDisplay !== undefined ? sanitizeText(b.priceDisplay, 60) : pkg.priceDisplay,
        pricingLabel: b.pricingLabel !== undefined ? sanitizeText(b.pricingLabel, 60) : pkg.pricingLabel,
        customQuoteEnabled:
          b.customQuoteEnabled !== undefined ? Boolean(b.customQuoteEnabled) : pkg.customQuoteEnabled,
        imageUrl: b.imageUrl !== undefined ? sanitizeText(b.imageUrl, 500000) : pkg.imageUrl,
        idealFor: b.idealFor !== undefined ? sanitizeText(b.idealFor, 120) : pkg.idealFor,
        highlighted: b.highlighted !== undefined ? Boolean(b.highlighted) : pkg.highlighted,
        published: b.published !== undefined ? Boolean(b.published) : pkg.published,
        orderIndex: b.orderIndex !== undefined ? Number(b.orderIndex) : pkg.orderIndex,
        features: Array.isArray(b.features)
          ? b.features.map((f: unknown) => sanitizeText(f, 160)).filter(Boolean)
          : pkg.features,
      };
      db.prepare(
        'UPDATE packages SET order_index = ?, published = ?, data_json = ? WHERE id = ?'
      ).run(updated.orderIndex, updated.published ? 1 : 0, JSON.stringify(updated), updated.id);
      recordAuditLog(actor(req), 'Updated Package', 'packages', updated.name);
      res.json({ pkg: updated });
    }
  );

  app.delete(
    '/api/admin/packages/:id',
    requireAdminAuth,
    requireRoles(['Content Manager']),
    (req, res) => {
      const db = getDb();
      db.prepare('DELETE FROM packages WHERE id = ?').run(req.params.id);
      recordAuditLog(actor(req), 'Deleted Package', 'packages', req.params.id);
      res.json({ ok: true });
    }
  );

  // Testimonials CRUD
  app.post(
    '/api/admin/testimonials',
    requireAdminAuth,
    requireRoles(['Content Manager']),
    (req, res) => {
      const db = getDb();
      const coupleName = sanitizeText(req.body?.coupleName, 120);
      const quote = sanitizeText(req.body?.quote, 600);
      if (!coupleName || !quote) {
        res.status(400).json({ error: 'Customer name and review quote are required.' });
        return;
      }
      const now = new Date().toISOString();
      const isSample = Boolean(req.body?.isSample);
      const verified = isSample ? false : Boolean(req.body?.verified);
      const item: TestimonialItem = {
        id: `test-${crypto.randomUUID().slice(0, 8)}`,
        coupleName,
        weddingLocation: sanitizeText(req.body?.weddingLocation, 120) || 'South Australia',
        serviceUsed: sanitizeText(req.body?.serviceUsed, 120) || 'Wedding Photography',
        quote,
        rating: Math.min(5, Math.max(1, Number(req.body?.rating) || 5)),
        verified,
        isSample,
        published: req.body?.published !== false,
        imageUrl: sanitizeText(req.body?.imageUrl, 500000) || 'img://hero',
      };
      db.prepare(
        'INSERT INTO testimonials (id, published, created_at, data_json) VALUES (?, ?, ?, ?)'
      ).run(item.id, item.published ? 1 : 0, now, JSON.stringify(item));
      recordAuditLog(actor(req), 'Added Testimonial', 'testimonials', item.coupleName);
      res.status(201).json({ item });
    }
  );

  app.put(
    '/api/admin/testimonials/:id',
    requireAdminAuth,
    requireRoles(['Content Manager']),
    (req, res) => {
      const db = getDb();
      const row = db
        .prepare('SELECT data_json FROM testimonials WHERE id = ?')
        .get(req.params.id) as { data_json: string } | undefined;
      if (!row) {
        res.status(404).json({ error: 'Testimonial not found.' });
        return;
      }
      const item = JSON.parse(row.data_json) as TestimonialItem;
      const b = req.body || {};
      const isSample = b.isSample !== undefined ? Boolean(b.isSample) : item.isSample;
      const updated: TestimonialItem = {
        ...item,
        coupleName: b.coupleName !== undefined ? sanitizeText(b.coupleName, 120) : item.coupleName,
        weddingLocation:
          b.weddingLocation !== undefined ? sanitizeText(b.weddingLocation, 120) : item.weddingLocation,
        serviceUsed: b.serviceUsed !== undefined ? sanitizeText(b.serviceUsed, 120) : item.serviceUsed,
        quote: b.quote !== undefined ? sanitizeText(b.quote, 600) : item.quote,
        rating: b.rating !== undefined ? Math.min(5, Math.max(1, Number(b.rating) || 5)) : item.rating,
        isSample,
        verified: isSample ? false : b.verified !== undefined ? Boolean(b.verified) : item.verified,
        published: b.published !== undefined ? Boolean(b.published) : item.published,
        imageUrl: b.imageUrl !== undefined ? sanitizeText(b.imageUrl, 500000) : item.imageUrl,
      };
      db.prepare('UPDATE testimonials SET published = ?, data_json = ? WHERE id = ?').run(
        updated.published ? 1 : 0,
        JSON.stringify(updated),
        updated.id
      );
      recordAuditLog(actor(req), 'Updated Testimonial', 'testimonials', updated.coupleName);
      res.json({ item: updated });
    }
  );

  app.delete(
    '/api/admin/testimonials/:id',
    requireAdminAuth,
    requireRoles(['Content Manager']),
    (req, res) => {
      const db = getDb();
      db.prepare('DELETE FROM testimonials WHERE id = ?').run(req.params.id);
      recordAuditLog(actor(req), 'Deleted Testimonial', 'testimonials', req.params.id);
      res.json({ ok: true });
    }
  );

  // Inquiries Management (Booking Manager)
  app.get(
    '/api/admin/inquiries',
    requireAdminAuth,
    requireRoles(['Booking Manager']),
    (_req, res) => {
      res.json({ inquiries: getAllInquiries() });
    }
  );

  app.patch(
    '/api/admin/inquiries/:id',
    requireAdminAuth,
    requireRoles(['Booking Manager']),
    (req, res) => {
      const status = req.body?.status as InquiryStatus | undefined;
      const valid: InquiryStatus[] = [
        'new',
        'contacted',
        'follow_up',
        'confirmed',
        'completed',
        'cancelled',
      ];
      if (status && !valid.includes(status)) {
        res.status(400).json({ error: 'Invalid inquiry status.' });
        return;
      }
      const internalNotes =
        req.body?.internalNotes !== undefined
          ? sanitizeText(req.body.internalNotes, 2000)
          : undefined;

      const updated = updateInquiry(req.params.id, { status, internalNotes });
      if (!updated) {
        res.status(404).json({ error: 'Inquiry not found.' });
        return;
      }
      recordAuditLog(
        actor(req),
        'Updated Inquiry',
        'inquiries',
        `${updated.fullName} -> ${updated.status}`
      );
      res.json({ inquiry: updated });
    }
  );

  app.delete(
    '/api/admin/inquiries/:id',
    requireAdminAuth,
    requireRoles(['Booking Manager']),
    (req, res) => {
      const ok = deleteInquiry(req.params.id);
      if (!ok) {
        res.status(404).json({ error: 'Inquiry not found.' });
        return;
      }
      recordAuditLog(actor(req), 'Deleted Inquiry', 'inquiries', req.params.id);
      res.json({ ok: true });
    }
  );

  // Navigation Management
  app.put(
    '/api/admin/navigation',
    requireAdminAuth,
    requireRoles(['Content Manager']),
    (req, res) => {
      const items = Array.isArray(req.body?.items) ? (req.body.items as NavigationItem[]) : null;
      if (!items) {
        res.status(400).json({ error: 'Navigation items array is required.' });
        return;
      }
      const db = getDb();
      db.exec('DELETE FROM navigation_items');
      const stmt = db.prepare(
        'INSERT INTO navigation_items (id, order_index, visible, data_json) VALUES (?, ?, ?, ?)'
      );
      const cleaned = items.map((item, idx) => {
        const clean: NavigationItem = {
          id: item.id || `nav-${crypto.randomUUID().slice(0, 6)}`,
          label: sanitizeText(item.label, 60) || 'Link',
          href: sanitizeText(item.href, 160) || '/',
          orderIndex: idx + 1,
          visible: item.visible !== false,
          openInNewTab: Boolean(item.openInNewTab),
        };
        stmt.run(clean.id, clean.orderIndex, clean.visible ? 1 : 0, JSON.stringify(clean));
        return clean;
      });
      recordAuditLog(actor(req), 'Updated Navigation', 'navigation_items', `${cleaned.length} items`);
      res.json({ navigation: cleaned });
    }
  );

  // Footer Management
  app.put(
    '/api/admin/footer',
    requireAdminAuth,
    requireRoles(['Content Manager']),
    (req, res) => {
      const current = getDocument<FooterConfig>('footer', DEFAULT_FOOTER);
      const b = req.body || {};
      const next: FooterConfig = {
        ...current,
        businessName: sanitizeText(b.businessName ?? current.businessName, 120),
        logoUrl: sanitizeText(b.logoUrl ?? current.logoUrl, 500000),
        tagline: sanitizeText(b.tagline ?? current.tagline, 180),
        description: sanitizeText(b.description ?? current.description, 500),
        copyrightText: sanitizeText(b.copyrightText ?? current.copyrightText, 160),
        privacyLabel: sanitizeText(b.privacyLabel ?? current.privacyLabel, 60),
        privacyHref: sanitizeText(b.privacyHref ?? current.privacyHref, 120),
        termsLabel: sanitizeText(b.termsLabel ?? current.termsLabel, 60),
        termsHref: sanitizeText(b.termsHref ?? current.termsHref, 120),
        quickLinks: Array.isArray(b.quickLinks)
          ? b.quickLinks
              .map((q: { label?: string; href?: string }) => ({
                label: sanitizeText(q.label, 60),
                href: sanitizeText(q.href, 160),
              }))
              .filter((q: { label: string; href: string }) => q.label && q.href)
          : current.quickLinks,
      };
      setDocument('footer', next);
      recordAuditLog(actor(req), 'Updated Footer', 'footer', next.businessName);
      res.json({ footer: next });
    }
  );

  // Business Contact Info Management
  app.put(
    '/api/admin/business',
    requireAdminAuth,
    requireRoles(['Content Manager', 'Booking Manager']),
    (req, res) => {
      const current = getDocument<BusinessInfo>('business_info', DEFAULT_BUSINESS_INFO);
      const b = req.body || {};
      const next: BusinessInfo = {
        ...current,
        businessName: sanitizeText(b.businessName ?? current.businessName, 120),
        tagline: sanitizeText(b.tagline ?? current.tagline, 180),
        phone: sanitizeText(b.phone ?? current.phone, 50),
        email: sanitizeText(b.email ?? current.email, 160),
        addressLine1: sanitizeText(b.addressLine1 ?? current.addressLine1, 120),
        addressLine2: sanitizeText(b.addressLine2 ?? current.addressLine2, 120),
        country: sanitizeText(b.country ?? current.country, 80),
        locationLabel: sanitizeText(b.locationLabel ?? current.locationLabel, 120),
        googleMapsUrl: sanitizeText(b.googleMapsUrl ?? current.googleMapsUrl, 400),
        instagramUrl: sanitizeText(b.instagramUrl ?? current.instagramUrl, 300),
        facebookUrl: sanitizeText(b.facebookUrl ?? current.facebookUrl, 300),
        youtubeUrl: sanitizeText(b.youtubeUrl ?? current.youtubeUrl, 300),
        pinterestUrl: sanitizeText(b.pinterestUrl ?? current.pinterestUrl, 300),
      };
      setDocument('business_info', next);
      recordAuditLog(actor(req), 'Updated Contact Info', 'business_info', next.email);
      res.json({ businessInfo: next });
    }
  );

  // Website Settings Management (Super Admin)
  app.put(
    '/api/admin/settings',
    requireAdminAuth,
    requireRoles(['Super Admin']),
    (req, res) => {
      const current = getDocument<WebsiteSettings>('settings', DEFAULT_WEBSITE_SETTINGS);
      const b = req.body || {};
      const next: WebsiteSettings = {
        ...current,
        websiteName: sanitizeText(b.websiteName ?? current.websiteName, 120),
        logoUrl: sanitizeText(b.logoUrl ?? current.logoUrl, 500000),
        faviconUrl: sanitizeText(b.faviconUrl ?? current.faviconUrl, 500000),
        defaultSeoTitle: sanitizeText(b.defaultSeoTitle ?? current.defaultSeoTitle, 160),
        defaultSeoDescription: sanitizeText(b.defaultSeoDescription ?? current.defaultSeoDescription, 320),
        primaryColor: sanitizeText(b.primaryColor ?? current.primaryColor, 20),
        accentColor: sanitizeText(b.accentColor ?? current.accentColor, 20),
        backgroundColor: sanitizeText(b.backgroundColor ?? current.backgroundColor, 20),
        googleAnalyticsId: sanitizeText(b.googleAnalyticsId ?? current.googleAnalyticsId, 60),
        maintenanceMode:
          b.maintenanceMode !== undefined ? Boolean(b.maintenanceMode) : current.maintenanceMode,
        maintenanceMessage: sanitizeText(b.maintenanceMessage ?? current.maintenanceMessage, 500),
      };
      setDocument('settings', next);
      recordAuditLog(actor(req), 'Updated Website Settings', 'settings', `Maintenance: ${next.maintenanceMode}`);
      res.json({ settings: next });
    }
  );

  // Admin Users & RBAC Management (Super Admin Only)
  app.get('/api/admin/users', requireAdminAuth, requireRoles(['Super Admin']), (_req, res) => {
    res.json({ users: listAdminUsers() });
  });

  app.post('/api/admin/users', requireAdminAuth, requireRoles(['Super Admin']), (req, res) => {
    const validRoles: AdminRole[] = [
      'Super Admin',
      'Content Manager',
      'Gallery Manager',
      'Booking Manager',
    ];
    const role = validRoles.includes(req.body?.role) ? req.body.role : 'Content Manager';
    const result = createAdminUser({
      name: sanitizeText(req.body?.name, 100),
      email: sanitizeText(req.body?.email, 160),
      password: typeof req.body?.password === 'string' ? req.body.password : '',
      role,
    });
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }
    recordAuditLog(actor(req), 'Created Admin User', 'admin_users', `${result.user!.email} (${role})`);
    res.status(201).json({ user: result.user });
  });

  app.put('/api/admin/users/:id', requireAdminAuth, requireRoles(['Super Admin']), (req, res) => {
    const db = getDb();
    const currentAdmin = (req as RequestWithAdmin).admin!;
    const existing = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.params.id) as
      | { id: string; email: string; name: string; role: AdminRole; active: number }
      | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Admin user not found.' });
      return;
    }
    const validRoles: AdminRole[] = [
      'Super Admin',
      'Content Manager',
      'Gallery Manager',
      'Booking Manager',
    ];
    const name = req.body?.name !== undefined ? sanitizeText(req.body.name, 100) : existing.name;
    const role = validRoles.includes(req.body?.role) ? req.body.role : existing.role;
    const active = req.body?.active !== undefined ? Boolean(req.body.active) : Boolean(existing.active);

    if (existing.id === currentAdmin.id && !active) {
      res.status(400).json({ error: 'You cannot disable your own currently active Super Admin session.' });
      return;
    }

    db.prepare('UPDATE admin_users SET name = ?, role = ?, active = ? WHERE id = ?').run(
      name,
      role,
      active ? 1 : 0,
      existing.id
    );

    if (typeof req.body?.newPassword === 'string' && req.body.newPassword.length >= 8) {
      const { hash, salt } = hashPassword(req.body.newPassword);
      db.prepare('UPDATE admin_users SET password_hash = ?, salt = ? WHERE id = ?').run(
        hash,
        salt,
        existing.id
      );
    }

    recordAuditLog(actor(req), 'Updated Admin User', 'admin_users', `${existing.email} (${role}, active=${active})`);
    res.json({ ok: true, users: listAdminUsers() });
  });

  return app;
}
