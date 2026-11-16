import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Camera,
  ChevronRight,
  Compass,
  ExternalLink,
  FileText,
  Film,
  FolderOpen,
  Globe,
  Home,
  Image as ImageIcon,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  MessageSquareQuote,
  Package,
  Phone,
  Search,
  Settings,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { StudioImage } from '../components/StudioImage';
import type {
  AdminRole,
  AdminSectionKey,
  AdminUser,
  BookingInquiry,
  BusinessInfo,
  DashboardOverviewStats,
  FooterConfig,
  GalleryCategory,
  GalleryItem,
  HomepageContent,
  MediaAsset,
  NavigationItem,
  ServiceItem,
  TestimonialItem,
  WebsitePage,
  WebsiteSettings,
  WeddingPackage,
  WeddingVideo,
} from '../types/studio';
import {
  AboutUsManagerPanel,
  HomepageManagerPanel,
  PagesManagerPanel,
  ServicesManagerPanel,
  VideographyManagerPanel,
  type PanelHelpers,
} from './admin/AdminContentPanels';
import {
  GalleryManagerPanel,
  MediaLibraryPanel,
  PackagesManagerPanel,
  TestimonialsManagerPanel,
  VideosManagerPanel,
} from './admin/AdminPortfolioPanels';
import {
  ChangePasswordPanel,
  ContactInfoPanel,
  FooterManagerPanel,
  InquiriesManagerPanel,
  NavigationManagerPanel,
  SeoManagerPanel,
  SettingsManagerPanel,
  UsersManagerPanel,
} from './admin/AdminOperationsPanels';

interface CmsStatePayload {
  overview: DashboardOverviewStats;
  pages: WebsitePage[];
  services: ServiceItem[];
  categories: GalleryCategory[];
  gallery: GalleryItem[];
  media: MediaAsset[];
  videos: WeddingVideo[];
  packages: WeddingPackage[];
  testimonials: TestimonialItem[];
  inquiries: BookingInquiry[];
  navigation: NavigationItem[];
  footer: FooterConfig;
  businessInfo: BusinessInfo;
  homepage: HomepageContent;
  settings: WebsiteSettings;
  users: AdminUser[];
}

interface SidebarNavItem {
  key: AdminSectionKey;
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  roles: AdminRole[];
}

const ALL_ROLES: AdminRole[] = [
  'Super Admin',
  'Content Manager',
  'Gallery Manager',
  'Booking Manager',
];

const SIDEBAR_ITEMS: SidebarNavItem[] = [
  { key: 'overview', label: 'Dashboard Overview', path: '/admin/dashboard', icon: LayoutDashboard, roles: ALL_ROLES },
  { key: 'pages', label: 'Website Pages', path: '/admin/pages', icon: FileText, roles: ['Super Admin', 'Content Manager'] },
  { key: 'homepage', label: 'Homepage Management', path: '/admin/homepage', icon: Home, roles: ['Super Admin', 'Content Manager'] },
  { key: 'about', label: 'About Us Management', path: '/admin/about', icon: LayoutTemplate, roles: ['Super Admin', 'Content Manager'] },
  { key: 'services', label: 'Photography Services', path: '/admin/services', icon: Camera, roles: ['Super Admin', 'Content Manager'] },
  { key: 'videography', label: 'Wedding Videography', path: '/admin/videography', icon: Video, roles: ['Super Admin', 'Content Manager'] },
  { key: 'gallery', label: 'Portfolio Gallery', path: '/admin/gallery', icon: ImageIcon, roles: ['Super Admin', 'Content Manager', 'Gallery Manager'] },
  { key: 'videos', label: 'Wedding Videos', path: '/admin/videos', icon: Film, roles: ['Super Admin', 'Content Manager', 'Gallery Manager'] },
  { key: 'packages', label: 'Wedding Packages', path: '/admin/packages', icon: Package, roles: ['Super Admin', 'Content Manager'] },
  { key: 'testimonials', label: 'Testimonials', path: '/admin/testimonials', icon: MessageSquareQuote, roles: ['Super Admin', 'Content Manager'] },
  { key: 'bookings', label: 'Booking Inquiries', path: '/admin/bookings', icon: Inbox, roles: ['Super Admin', 'Booking Manager'] },
  { key: 'contact', label: 'Contact Information', path: '/admin/contact', icon: Phone, roles: ['Super Admin', 'Content Manager', 'Booking Manager'] },
  { key: 'navigation', label: 'Navigation Management', path: '/admin/navigation', icon: Compass, roles: ['Super Admin', 'Content Manager'] },
  { key: 'footer', label: 'Footer Management', path: '/admin/footer', icon: Globe, roles: ['Super Admin', 'Content Manager'] },
  { key: 'seo', label: 'SEO Management', path: '/admin/seo', icon: Search, roles: ['Super Admin', 'Content Manager'] },
  { key: 'media', label: 'Media Library', path: '/admin/media', icon: FolderOpen, roles: ['Super Admin', 'Content Manager', 'Gallery Manager'] },
  { key: 'users', label: 'User Management', path: '/admin/users', icon: Users, roles: ['Super Admin'] },
  { key: 'settings', label: 'Website Settings', path: '/admin/settings', icon: Settings, roles: ['Super Admin'] },
  { key: 'password', label: 'Change Password', path: '/admin/password', icon: KeyRound, roles: ALL_ROLES },
];

function resolveSectionFromRoute(route: string): AdminSectionKey {
  const matched = SIDEBAR_ITEMS.find((item) => item.path === route);
  return matched ? matched.key : 'overview';
}

export function AdminDashboardPage() {
  const { currentRoute, navigate, refreshStudio, data } = useStudio();

  const [authChecking, setAuthChecking] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [cmsState, setCmsState] = useState<CmsStatePayload | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const activeSection = resolveSectionFromRoute(currentRoute);

  const notify = useCallback((message: string) => {
    setToast({ type: 'success', message });
    setTimeout(() => setToast((prev) => (prev?.message === message ? null : prev)), 4000);
  }, []);

  const notifyError = useCallback((message: string) => {
    setToast({ type: 'error', message });
  }, []);

  const fetchCmsState = useCallback(async () => {
    const res = await fetch('/api/admin/cms-state');
    if (res.status === 401) {
      navigate('/admin/login');
      return;
    }
    if (res.ok) {
      const json = (await res.json()) as CmsStatePayload;
      setCmsState(json);
    }
  }, [navigate]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchCmsState(), refreshStudio()]);
  }, [fetchCmsState, refreshStudio]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/status');
        const json = await res.json();
        if (!active) return;
        if (!json.authenticated || !json.user) {
          navigate('/admin/login');
          return;
        }
        setAdminUser(json.user as AdminUser);
        await fetchCmsState();
      } catch {
        if (active) navigate('/admin/login');
      } finally {
        if (active) setAuthChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchCmsState, navigate]);

  const allowedItems = useMemo(() => {
    if (!adminUser) return [];
    return SIDEBAR_ITEMS.filter((item) => item.roles.includes(adminUser.role));
  }, [adminUser]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAdminUser(null);
    setCmsState(null);
    navigate('/admin/login');
  };

  if (authChecking || !adminUser || !cmsState) {
    return (
      <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full overflow-hidden border border-[#B89352]/40 bg-[#141210]">
            <StudioImage
              src={data.settings.logoUrl}
              alt="Twins Twins Video Pro"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#6E655D]">
            Verifying Studio CMS Session...
          </p>
        </div>
      </div>
    );
  }

  const helpers: PanelHelpers = {
    media: cmsState.media,
    refreshAll,
    notify,
    notifyError,
  };

  const overview = cmsState.overview;
  const aboutPage = cmsState.pages.find((p) => p.slug === '/about');
  const videographyPage = cmsState.pages.find((p) => p.slug === '/videography');

  const activeNavObj = SIDEBAR_ITEMS.find((it) => it.key === activeSection);
  const canAccessActive = activeNavObj ? activeNavObj.roles.includes(adminUser.role) : true;

  const renderPanel = () => {
    if (!canAccessActive) {
      return (
        <div className="bg-white border border-[#1C1917]/10 p-8 text-center space-y-3">
          <h2 className="font-serif-display text-3xl text-[#1C1917]">Access Restricted</h2>
          <p className="text-sm text-[#6E655D]">
            Your role ({adminUser.role}) does not include permission for this section.
          </p>
        </div>
      );
    }

    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-serif-display text-3xl sm:text-4xl text-[#1C1917]">
                  Studio Overview
                </h2>
                <p className="text-sm text-[#6E655D]">
                  Live database metrics and recent activity for {cmsState.settings.websiteName}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#1C1917]/20 bg-white text-xs font-semibold uppercase tracking-[0.12em] hover:border-[#B89352] cursor-pointer"
              >
                <span>View Public Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Real DB Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
              {[
                { label: 'Website Pages', value: overview.totalPages, sub: `${overview.publishedPages} live`, path: '/admin/pages' },
                { label: 'Gallery Images', value: overview.totalGalleryImages, sub: 'Portfolio frames', path: '/admin/gallery' },
                { label: 'Wedding Videos', value: overview.totalVideos, sub: 'Cinema reels', path: '/admin/videos' },
                { label: 'Packages', value: overview.totalPackages, sub: 'Active tiers', path: '/admin/packages' },
                { label: 'Total Inquiries', value: overview.totalInquiries, sub: 'All time', path: '/admin/bookings' },
                { label: 'New Inquiries', value: overview.newInquiries, sub: 'Needs reply', path: '/admin/bookings', highlight: overview.newInquiries > 0 },
                { label: 'Testimonials', value: overview.publishedTestimonials, sub: 'Published', path: '/admin/testimonials' },
              ].map((stat) => (
                <button
                  key={stat.label}
                  type="button"
                  onClick={() => navigate(stat.path)}
                  className={`text-left bg-white border p-4 transition-colors hover:border-[#B89352] cursor-pointer ${
                    stat.highlight ? 'border-[#B89352]' : 'border-[#1C1917]/10'
                  }`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6E655D]">
                    {stat.label}
                  </p>
                  <p className="font-serif-display text-3xl text-[#1C1917] mt-1 tabular-nums">
                    {stat.value}
                  </p>
                  <p className="text-xs text-[#B89352] mt-0.5">{stat.sub}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Latest Booking Inquiries */}
              <div className="lg:col-span-7 bg-white border border-[#1C1917]/10 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#1C1917]/10 pb-3">
                  <h3 className="font-serif-display text-2xl text-[#1C1917]">
                    Latest Booking Inquiries
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/bookings')}
                    className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#B89352] hover:underline cursor-pointer"
                  >
                    <span>Manage All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                {overview.latestInquiries.length === 0 ? (
                  <p className="text-sm text-[#6E655D] py-6">
                    No wedding inquiries received yet. Submissions from /book and /contact appear here immediately.
                  </p>
                ) : (
                  <div className="divide-y divide-[#1C1917]/8">
                    {overview.latestInquiries.map((inq) => (
                      <div key={inq.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-[#1C1917] truncate">
                            {inq.fullName}
                          </p>
                          <p className="text-xs text-[#6E655D] truncate">
                            {inq.serviceRequired} · {inq.weddingDate || 'Date TBD'} · {inq.email}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-[#FAF8F5] border border-[#1C1917]/12 text-[11px] uppercase tracking-wider shrink-0">
                          {inq.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Audit Activity */}
              <div className="lg:col-span-5 bg-white border border-[#1C1917]/10 p-6 space-y-4">
                <div className="border-b border-[#1C1917]/10 pb-3">
                  <h3 className="font-serif-display text-2xl text-[#1C1917]">
                    Recent Studio Activity
                  </h3>
                </div>
                <div className="divide-y divide-[#1C1917]/8 max-h-[340px] overflow-y-auto">
                  {overview.recentAuditLogs.map((log) => (
                    <div key={log.id} className="py-2.5 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-[#1C1917]">{log.action}</p>
                        <span className="text-[11px] text-[#6E655D]">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#6E655D] truncate">
                        {log.details} · <span className="text-[#B89352]">{log.actorEmail}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'pages':
        return <PagesManagerPanel pages={cmsState.pages} helpers={helpers} />;
      case 'homepage':
        return (
          <HomepageManagerPanel
            homepage={cmsState.homepage}
            videos={cmsState.videos}
            helpers={helpers}
          />
        );
      case 'about':
        return (
          <AboutUsManagerPanel
            homepage={cmsState.homepage}
            aboutPage={aboutPage}
            helpers={helpers}
          />
        );
      case 'services':
        return <ServicesManagerPanel services={cmsState.services} helpers={helpers} />;
      case 'videography':
        return (
          <VideographyManagerPanel
            videographyPage={videographyPage}
            homepage={cmsState.homepage}
            helpers={helpers}
            onOpenVideosTab={() => navigate('/admin/videos')}
          />
        );
      case 'gallery':
        return (
          <GalleryManagerPanel
            gallery={cmsState.gallery}
            categories={cmsState.categories}
            helpers={helpers}
          />
        );
      case 'videos':
        return <VideosManagerPanel videos={cmsState.videos} helpers={helpers} />;
      case 'packages':
        return <PackagesManagerPanel packages={cmsState.packages} helpers={helpers} />;
      case 'testimonials':
        return <TestimonialsManagerPanel testimonials={cmsState.testimonials} helpers={helpers} />;
      case 'bookings':
        return <InquiriesManagerPanel inquiries={cmsState.inquiries} helpers={helpers} />;
      case 'contact':
        return <ContactInfoPanel businessInfo={cmsState.businessInfo} helpers={helpers} />;
      case 'navigation':
        return <NavigationManagerPanel navigation={cmsState.navigation} helpers={helpers} />;
      case 'footer':
        return <FooterManagerPanel footer={cmsState.footer} helpers={helpers} />;
      case 'seo':
        return <SeoManagerPanel pages={cmsState.pages} helpers={helpers} />;
      case 'media':
        return <MediaLibraryPanel media={cmsState.media} helpers={helpers} />;
      case 'users':
        return (
          <UsersManagerPanel
            users={cmsState.users}
            currentUserId={adminUser.id}
            helpers={helpers}
          />
        );
      case 'settings':
        return <SettingsManagerPanel settings={cmsState.settings} helpers={helpers} />;
      case 'password':
        return <ChangePasswordPanel helpers={helpers} />;
      default:
        return null;
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#141210] text-[#FAF8F5]">
      {/* Studio Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-3 text-left cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border border-[#B89352]/50 bg-[#1C1917] shrink-0">
            <StudioImage
              src={cmsState.settings.logoUrl}
              alt="Twins Twins Video Pro"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="font-serif-display text-sm tracking-[0.14em] uppercase truncate">
              Twins Twins CMS
            </p>
            <p className="text-[10px] tracking-[0.18em] uppercase text-[#D4B478] truncate">
              {adminUser.role}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 text-[#FAF8F5]/70 hover:text-white cursor-pointer"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links (19 sections + Logout = 20 items) */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5" aria-label="Admin CMS navigation">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                navigate(item.path);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 text-xs font-medium tracking-wide transition-colors cursor-pointer ${
                active
                  ? 'bg-[#B89352] text-[#FAF8F5]'
                  : 'text-[#FAF8F5]/75 hover:bg-white/6 hover:text-[#FAF8F5]'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
              {item.key === 'bookings' && overview.newInquiries > 0 && (
                <span className="px-1.5 py-0.5 bg-[#FAF8F5] text-[#141210] text-[10px] font-bold">
                  {overview.newInquiries}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 20. Logout */}
      <div className="p-3 border-t border-white/10 space-y-2">
        <div className="px-2 py-1">
          <p className="text-xs font-medium text-[#FAF8F5] truncate">{adminUser.name}</p>
          <p className="text-[11px] text-[#FAF8F5]/55 truncate">{adminUser.email}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-red-300 hover:bg-red-950/50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#1C1917] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-68 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside className="w-72 h-full" onClick={(e) => e.stopPropagation()}>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Utility Bar */}
        <header className="bg-white border-b border-[#1C1917]/10 px-5 lg:px-8 h-16 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open admin menu"
              className="lg:hidden p-2 border border-[#1C1917]/15 text-[#1C1917] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6E655D]">
              {activeNavObj?.label || 'Dashboard'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#1C1917] hover:text-[#B89352] cursor-pointer"
            >
              <span>Public Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Notifications */}
        {toast && (
          <div className="px-5 lg:px-8 pt-4">
            <div
              role="status"
              className={`px-4 py-3 text-sm flex items-center justify-between gap-4 border ${
                toast.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <span>{toast.message}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="p-1 cursor-pointer"
                aria-label="Dismiss message"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Active Panel Content */}
        <main className="flex-1 p-5 lg:p-8 max-w-[1400px] w-full mx-auto">
          {renderPanel()}
        </main>
      </div>
    </div>
  );
}
