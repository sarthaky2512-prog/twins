import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { PageRoute, PublicStudioData } from '../types/studio';

const DEFAULT_LOGO = '/assets/aistudio/logo1_twins_526fef3c.png';

const FALLBACK_STUDIO_DATA: PublicStudioData = {
  businessInfo: {
    businessName: 'Twins Twins Video Pro',
    tagline: 'CAPTURING LOVE. CREATING MEMORIES. TELLING YOUR STORY.',
    category: 'Wedding Photography & Videography',
    phone: '+1 (510) 401-4907',
    email: 'twinssupport@gmail.com',
    addressLine1: 'Saverio Bvd,',
    addressLine2: 'Angle Vale SA 5117,',
    country: 'Australia.',
    locationLabel: 'South Australia, Australia',
    googleMapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Saverio+Bvd+Angle+Vale+SA+5117+Australia',
    instagramUrl: 'https://www.instagram.com/',
    facebookUrl: 'https://www.facebook.com/',
    youtubeUrl: 'https://www.youtube.com/',
    pinterestUrl: 'https://www.pinterest.com/',
    copyrightText: '© 2026 Twins Twins Video Pro. All Rights Reserved.',
  },
  homepage: {
    heroHeading: 'CAPTURING YOUR LOVE STORY, ONE BEAUTIFUL MOMENT AT A TIME.',
    heroSubheading: 'Luxury Wedding Photography & Cinematic Films · South Australia',
    heroSupportingText:
      'Your wedding day is more than an event. It is a story filled with love, emotions, laughter, and unforgettable memories. At Twins Twins Video Pro, we capture every special moment through beautiful photography and cinematic wedding films.',
    heroImage: 'img://hero',
    heroVideoUrl: '',
    heroPrimaryCtaLabel: 'EXPLORE OUR WORK',
    heroPrimaryCtaHref: '#home-portfolio-anchor',
    heroSecondaryCtaLabel: 'BOOK YOUR WEDDING',
    heroSecondaryCtaHref: '/book',
    aboutHeading: 'WE TURN YOUR SPECIAL MOMENTS INTO TIMELESS MEMORIES.',
    aboutLead:
      'At Twins Twins Video Pro, we believe every love story deserves to be captured beautifully.',
    aboutBody:
      'Our passion is creating timeless wedding photographs and cinematic films that preserve the emotions, details, and unforgettable moments of your special day. From the excitement of getting ready to the first dance, we capture every moment with creativity, care, and attention to detail.',
    aboutImage: 'img://about',
    aboutApproach: [
      'Creative storytelling.',
      'Professional photography.',
      'Cinematic videography.',
      'Natural and emotional moments.',
      'Attention to every detail.',
      'Personalized customer experience.',
    ],
    servicesHeading: 'OUR PHOTOGRAPHY SERVICES',
    portfolioHeading: 'OUR BEAUTIFUL LOVE STORIES',
    videosHeading: 'YOUR LOVE STORY, BEAUTIFULLY FILMED.',
    whyChooseHeading: 'WHY COUPLES CHOOSE TWINS TWINS VIDEO PRO',
    packagesHeading: 'FIND THE PERFECT PACKAGE FOR YOUR SPECIAL DAY.',
    bookingHeading: "LET'S CAPTURE YOUR LOVE STORY.",
    testimonialsHeading: 'LOVE STORIES. HAPPY COUPLES.',
    contactHeading: "LET'S MAKE YOUR MEMORIES LAST FOREVER.",
    contactCta: 'BOOK YOUR WEDDING TODAY.',
    sections: [
      { id: 'sec-hero', key: 'hero', label: 'Hero Banner', visible: true, orderIndex: 1 },
      { id: 'sec-marquee', key: 'marquee', label: 'Studio Ribbon', visible: true, orderIndex: 2 },
      { id: 'sec-about', key: 'about', label: 'About Us', visible: true, orderIndex: 3 },
      { id: 'sec-services', key: 'services', label: 'Our Photography Services', visible: true, orderIndex: 4 },
      { id: 'sec-portfolio', key: 'portfolio', label: 'Featured Wedding Portfolio', visible: true, orderIndex: 5 },
      { id: 'sec-videos', key: 'videos', label: 'Cinematic Wedding Videos', visible: true, orderIndex: 6 },
      { id: 'sec-why', key: 'why_choose', label: 'Why Choose Us', visible: true, orderIndex: 7 },
      { id: 'sec-packages', key: 'packages', label: 'Wedding Packages', visible: true, orderIndex: 8 },
      { id: 'sec-testimonials', key: 'testimonials', label: 'Customer Testimonials', visible: true, orderIndex: 9 },
      { id: 'sec-booking', key: 'booking', label: 'Booking & Enquiry Form', visible: true, orderIndex: 10 },
      { id: 'sec-contact', key: 'contact', label: 'Contact Us', visible: true, orderIndex: 11 },
    ],
  },
  pages: [],
  services: [],
  categories: [],
  gallery: [],
  videos: [],
  packages: [],
  testimonials: [],
  navigation: [
    { id: 'nav-home', label: 'Home', href: '/', orderIndex: 1, visible: true, openInNewTab: false },
    { id: 'nav-about', label: 'About Us', href: '/about', orderIndex: 2, visible: true, openInNewTab: false },
    { id: 'nav-photo', label: 'Photography', href: '/photography', orderIndex: 3, visible: true, openInNewTab: false },
    { id: 'nav-video', label: 'Videography', href: '/videography', orderIndex: 4, visible: true, openInNewTab: false },
    { id: 'nav-packages', label: 'Packages', href: '/packages', orderIndex: 6, visible: true, openInNewTab: false },
    { id: 'nav-gallery', label: 'Gallery', href: '/gallery', orderIndex: 7, visible: true, openInNewTab: false },
    { id: 'nav-contact', label: 'Contact', href: '/contact', orderIndex: 9, visible: true, openInNewTab: false },
  ],
  footer: {
    businessName: 'Twins Twins Video Pro',
    logoUrl: DEFAULT_LOGO,
    tagline: 'CAPTURING LOVE. CREATING MEMORIES. TELLING YOUR STORY.',
    description:
      'Luxury wedding photography and cinematic wedding films crafted with emotion, care, and artistry across Angle Vale, Adelaide, the Barossa Valley, and South Australia.',
    copyrightText: '© 2026 Twins Twins Video Pro. All Rights Reserved.',
    privacyLabel: 'Privacy Policy',
    privacyHref: '/privacy',
    termsLabel: 'Terms & Conditions',
    termsHref: '/terms',
    quickLinks: [
      { label: 'Home', href: '/' },
      { label: 'About Us', href: '/about' },
      { label: 'Photography', href: '/photography' },
      { label: 'Videography', href: '/videography' },
      { label: 'Gallery', href: '/gallery' },
      { label: 'Packages', href: '/packages' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  settings: {
    websiteName: 'Twins Twins Video Pro',
    logoUrl: DEFAULT_LOGO,
    faviconUrl: DEFAULT_LOGO,
    defaultSeoTitle: 'Twins Twins Video Pro | Luxury Wedding Photography & Cinematic Films',
    defaultSeoDescription:
      'Luxury wedding photography and cinematic wedding films studio in Angle Vale, South Australia.',
    primaryColor: '#1C1917',
    accentColor: '#B89352',
    backgroundColor: '#FAF8F5',
    googleAnalyticsId: '',
    maintenanceMode: false,
    maintenanceMessage:
      'Our studio portfolio is currently receiving fresh seasonal wedding collections.',
  },
};

export interface BookingPrefill {
  service?: string;
  packageName?: string;
}

interface StudioContextValue {
  data: PublicStudioData;
  loading: boolean;
  currentRoute: PageRoute;
  bookingPrefill: BookingPrefill;
  navigate: (route: PageRoute, prefill?: BookingPrefill) => void;
  refreshStudio: () => Promise<void>;
}

const StudioContext = createContext<StudioContextValue | null>(null);

function normalizeRoute(pathname: string): PageRoute {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '');
}

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PublicStudioData>(FALLBACK_STUDIO_DATA);
  const [loading, setLoading] = useState(true);
  const [currentRoute, setCurrentRoute] = useState<PageRoute>(() =>
    normalizeRoute(window.location.pathname)
  );
  const [bookingPrefill, setBookingPrefill] = useState<BookingPrefill>({});

  const refreshStudio = useCallback(async () => {
    try {
      const res = await fetch('/api/studio', { cache: 'no-store' });
      if (res.ok) {
        const json = (await res.json()) as PublicStudioData;
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load studio content:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStudio();
  }, [refreshStudio]);

  // Apply dynamic SEO metadata, favicon, and analytics settings
  useEffect(() => {
    const matchedPage = data.pages.find((p) => p.slug === currentRoute);
    const isAdmin = currentRoute.startsWith('/admin');
    const title = isAdmin
      ? `Studio Admin CMS | ${data.settings.websiteName}`
      : matchedPage?.seoTitle || data.settings.defaultSeoTitle;
    const desc = matchedPage?.seoDescription || data.settings.defaultSeoDescription;

    document.title = title;
    const setMeta = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el && content) el.setAttribute('content', content);
    };
    setMeta('meta[name="description"]', desc);
    setMeta('meta[property="og:title"]', matchedPage?.socialTitle || title);
    setMeta('meta[property="og:description"]', matchedPage?.socialDescription || desc);

    const faviconEl = document.querySelector('link[rel="icon"]');
    if (faviconEl && data.settings.faviconUrl) {
      faviconEl.setAttribute('href', data.settings.faviconUrl);
    }
  }, [currentRoute, data.pages, data.settings]);

  useEffect(() => {
    const onPopState = () => {
      setCurrentRoute(normalizeRoute(window.location.pathname));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((route: PageRoute, prefill?: BookingPrefill) => {
    if (prefill) {
      setBookingPrefill(prefill);
    }
    const clean = normalizeRoute(route);
    if (window.location.pathname !== clean) {
      window.history.pushState({}, '', clean);
    }
    setCurrentRoute(clean);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <StudioContext.Provider
      value={{
        data,
        loading,
        currentRoute,
        bookingPrefill,
        navigate,
        refreshStudio,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) {
    throw new Error('useStudio must be used within StudioProvider');
  }
  return ctx;
}
