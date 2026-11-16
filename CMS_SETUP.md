# Twins Twins Video Pro — Studio CMS & Deployment Guide

This application includes a full-stack Admin Content Management System (CMS) backed by Express (`server.ts`) and persistent database storage (`SQLite` locally in `data/studio.db`, with PostgreSQL/Supabase migration and Storage adapters ready for cloud hosting).

---

## 1. Environment Variables

Configure your local `.env` (gitignored) or production hosting Secrets based on `.env.example`:

- `INITIAL_ADMIN_EMAIL` & `INITIAL_ADMIN_PASSWORD`: Used **only** by the backend on initial startup to seed the first `Super Admin` password hash (`scrypt` + random salt) when `admin_users` is empty. Neither value is embedded in client JavaScript bundles or committed to Git.
- `SESSION_SECRET`: Strong random hex string used to sign `HttpOnly` HMAC-SHA256 administrator session cookies.
- `INQUIRY_RECIPIENT_EMAIL`: Studio email receiving booking & contact form alerts (`twinssupport@gmail.com`).
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: Optional SMTP relay credentials for automatic inquiry notifications and password-reset emails.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`: Optional Supabase Storage bucket (default `studio-media`) for persistent CDN-backed photo and MP4 uploads.
- `DATABASE_URL`: PostgreSQL connection string for cloud Postgres/Supabase deployments.

---

## 2. Admin Panel Access & Role Permissions

- **Admin Sign-In URL:** `/admin/login`
- **Admin Dashboard URL:** `/admin/dashboard` (unauthenticated visitors are automatically redirected to `/admin/login`)

### Supported RBAC Roles
- **Super Admin**: Full CMS access, User Management (`/admin/users`), Website Settings & Maintenance Mode (`/admin/settings`).
- **Content Manager**: Pages, Homepage, About Us, Services, Videography, Packages, Testimonials, Navigation, Footer, SEO, Media Library.
- **Gallery Manager**: Portfolio Gallery, Categories, Wedding Videos, Media Library.
- **Booking Manager**: Booking Inquiries CRM, Contact Information.

After signing in for the first time, open **Change Password** (`/admin/password`) in the sidebar to rotate your initial administrator password.

---

## 3. Supabase PostgreSQL & Storage Setup (Optional Cloud Persistence)

1. Create a Supabase project and open the **SQL Editor**.
2. Execute the schema migration in `supabase/migrations/001_initial_cms_schema.sql` to create all 14 normalized CMS tables (`cms_documents`, `website_pages`, `services`, `categories`, `gallery_items`, `media_assets`, `videos`, `packages`, `testimonials`, `navigation_items`, `inquiries`, `admin_users`, `password_resets`, `audit_logs`).
3. In Supabase **Storage**, create a public bucket named `studio-media` (or match `SUPABASE_STORAGE_BUCKET`).
4. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` in your hosting environment.

---

## 4. Production Build & GitHub / Vercel Deployment

1. Confirm `.env` and `data/` remain listed in `.gitignore`.
2. Install dependencies and verify build:
   ```bash
   npm install
   npm run build
   ```
3. Start the production server:
   ```bash
   npm start
   ```
4. For Vercel or Node cloud hosting, configure all environment secrets in your platform dashboard and push to GitHub. Public SEO endpoints `/sitemap.xml` and `/robots.txt` update dynamically whenever pages are published or drafted in the CMS.
