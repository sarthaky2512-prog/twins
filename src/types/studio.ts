export type PageRoute = string;

export type AdminRole =
  | 'Super Admin'
  | 'Content Manager'
  | 'Gallery Manager'
  | 'Booking Manager';

export type AdminSectionKey =
  | 'overview'
  | 'pages'
  | 'homepage'
  | 'about'
  | 'services'
  | 'videography'
  | 'gallery'
  | 'videos'
  | 'packages'
  | 'testimonials'
  | 'bookings'
  | 'contact'
  | 'navigation'
  | 'footer'
  | 'seo'
  | 'media'
  | 'users'
  | 'settings'
  | 'password';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AuditLogEntry {
  id: string;
  actorEmail: string;
  action: string;
  entityType: string;
  details: string;
  createdAt: string;
}

export interface BusinessInfo {
  businessName: string;
  tagline: string;
  category: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  country: string;
  locationLabel: string;
  googleMapsUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  pinterestUrl: string;
  copyrightText: string;
}

export interface HomepageSectionConfig {
  id: string;
  key:
    | 'hero'
    | 'marquee'
    | 'about'
    | 'services'
    | 'portfolio'
    | 'videos'
    | 'why_choose'
    | 'packages'
    | 'testimonials'
    | 'booking'
    | 'contact';
  label: string;
  visible: boolean;
  orderIndex: number;
}

export interface HomepageContent {
  heroHeading: string;
  heroSubheading: string;
  heroSupportingText: string;
  heroImage: string;
  heroVideoUrl: string;
  heroPrimaryCtaLabel: string;
  heroPrimaryCtaHref: string;
  heroSecondaryCtaLabel: string;
  heroSecondaryCtaHref: string;
  aboutHeading: string;
  aboutLead: string;
  aboutBody: string;
  aboutImage: string;
  aboutApproach: string[];
  servicesHeading: string;
  portfolioHeading: string;
  videosHeading: string;
  whyChooseHeading: string;
  packagesHeading: string;
  bookingHeading: string;
  testimonialsHeading: string;
  contactHeading: string;
  contactCta: string;
  sections: HomepageSectionConfig[];
}

export interface PageSection {
  id: string;
  type: 'text' | 'image_text' | 'gallery_highlight' | 'video' | 'cta';
  heading: string;
  subheading: string;
  body: string;
  imageUrl: string;
  videoUrl: string;
  buttonLabel: string;
  buttonHref: string;
  backgroundColor: 'ivory' | 'cream' | 'charcoal';
  orderIndex: number;
}

export interface WebsitePage {
  id: string;
  slug: string;
  title: string;
  status: 'published' | 'draft';
  isSystemPage: boolean;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
  sections: PageSection[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  ogImage: string;
  socialTitle: string;
  socialDescription: string;
  canonicalUrl: string;
  updatedAt: string;
}

export interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  deliverables: string[];
  image: string;
  iconName: string;
  route: string;
  orderIndex: number;
  published: boolean;
  featured: boolean;
}

export interface GalleryCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  location: string;
  dateLabel: string;
  imageUrl: string;
  altText: string;
  aspect: 'portrait' | 'landscape' | 'square';
  featured: boolean;
  caption: string;
}

export interface MediaAsset {
  id: string;
  title: string;
  description: string;
  altText: string;
  category: string;
  url: string;
  thumbnailUrl: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface WeddingVideo {
  id: string;
  title: string;
  coupleNames: string;
  category: string;
  location: string;
  duration: string;
  thumbnailUrl: string;
  videoType: 'youtube' | 'vimeo' | 'mp4';
  videoUrl: string;
  description: string;
  featured: boolean;
  published: boolean;
}

export interface WeddingPackage {
  id: string;
  name: string;
  tierLabel: string;
  subtitle: string;
  priceDisplay: string;
  pricingLabel: string;
  customQuoteEnabled: boolean;
  imageUrl: string;
  highlighted: boolean;
  published: boolean;
  orderIndex: number;
  features: string[];
  idealFor: string;
}

export interface TestimonialItem {
  id: string;
  coupleName: string;
  weddingLocation: string;
  serviceUsed: string;
  quote: string;
  rating: number;
  verified: boolean;
  isSample: boolean;
  published: boolean;
  imageUrl: string;
}

export type InquiryStatus =
  | 'new'
  | 'contacted'
  | 'follow_up'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export interface BookingInquiry {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  weddingDate: string;
  weddingVenue: string;
  weddingLocation: string;
  serviceRequired: string;
  preferredPackage: string;
  estimatedBudget: string;
  additionalRequirements: string;
  internalNotes: string;
  source: 'booking' | 'contact';
  status: InquiryStatus;
  createdAt: string;
  emailDispatched: boolean;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  orderIndex: number;
  visible: boolean;
  openInNewTab: boolean;
}

export interface FooterConfig {
  businessName: string;
  logoUrl: string;
  tagline: string;
  description: string;
  copyrightText: string;
  privacyLabel: string;
  privacyHref: string;
  termsLabel: string;
  termsHref: string;
  quickLinks: { label: string; href: string }[];
}

export interface WebsiteSettings {
  websiteName: string;
  logoUrl: string;
  faviconUrl: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  googleAnalyticsId: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export interface PublicStudioData {
  businessInfo: BusinessInfo;
  homepage: HomepageContent;
  pages: WebsitePage[];
  services: ServiceItem[];
  categories: GalleryCategory[];
  gallery: GalleryItem[];
  videos: WeddingVideo[];
  packages: WeddingPackage[];
  testimonials: TestimonialItem[];
  navigation: NavigationItem[];
  footer: FooterConfig;
  settings: WebsiteSettings;
}

export interface DashboardOverviewStats {
  totalPages: number;
  publishedPages: number;
  totalGalleryImages: number;
  totalVideos: number;
  totalPackages: number;
  totalInquiries: number;
  newInquiries: number;
  publishedTestimonials: number;
  recentAuditLogs: AuditLogEntry[];
  latestInquiries: BookingInquiry[];
}
