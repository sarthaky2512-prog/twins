import { StudioProvider, useStudio } from './context/StudioContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { StudioImage } from './components/StudioImage';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import {
  EngagementPage,
  PhotographyPage,
  PreWeddingPage,
  VideographyPage,
} from './pages/ServiceShowcasePages';
import {
  BookNowPage,
  ContactPage,
  PackagesPage,
  PortfolioGalleryPage,
} from './pages/CollectionPages';
import { PrivacyPolicyPage, TermsPage } from './pages/LegalPages';
import { DynamicCmsPage } from './pages/DynamicCmsPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

function PublicPageRouter() {
  const { currentRoute, data } = useStudio();

  // Check if a non-dedicated published CMS page exists (custom pages, or /films /testimonials if published)
  const publishedMatch = data.pages.find((p) => p.slug === currentRoute);

  switch (currentRoute) {
    case '/':
      return <HomePage />;
    case '/about':
      return publishedMatch || data.pages.length === 0 ? <AboutPage /> : <HomePage />;
    case '/photography':
      return publishedMatch || data.pages.length === 0 ? <PhotographyPage /> : <HomePage />;
    case '/videography':
      return publishedMatch || data.pages.length === 0 ? <VideographyPage /> : <HomePage />;
    case '/pre-wedding':
      return publishedMatch || data.pages.length === 0 ? <PreWeddingPage /> : <HomePage />;
    case '/engagement':
      return publishedMatch || data.pages.length === 0 ? <EngagementPage /> : <HomePage />;
    case '/gallery':
      return publishedMatch || data.pages.length === 0 ? <PortfolioGalleryPage /> : <HomePage />;
    case '/packages':
      return publishedMatch || data.pages.length === 0 ? <PackagesPage /> : <HomePage />;
    case '/book':
      return publishedMatch || data.pages.length === 0 ? <BookNowPage /> : <HomePage />;
    case '/contact':
      return publishedMatch || data.pages.length === 0 ? <ContactPage /> : <HomePage />;
    case '/privacy':
      return <PrivacyPolicyPage />;
    case '/terms':
      return <TermsPage />;
    default:
      if (publishedMatch) {
        return <DynamicCmsPage page={publishedMatch} />;
      }
      return <HomePage />;
  }
}

function MaintenanceScreen() {
  const { data } = useStudio();
  return (
    <div className="min-h-screen bg-[#141210] text-[#FAF8F5] flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-lg space-y-6">
        <div className="w-20 h-20 rounded-full overflow-hidden border border-[#B89352]/50 mx-auto bg-[#1C1917]">
          <StudioImage
            src={data.settings.logoUrl}
            alt={data.businessInfo.businessName}
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-xs tracking-[0.24em] uppercase text-[#D4B478] font-semibold">
          {data.businessInfo.businessName}
        </p>
        <h1 className="font-serif-display text-4xl sm:text-5xl font-medium">
          Studio Showcase Updating
        </h1>
        <p className="text-sm sm:text-base text-[#FAF8F5]/80 leading-relaxed">
          {data.settings.maintenanceMessage}
        </p>
        <div className="pt-4 border-t border-white/15 text-xs text-[#FAF8F5]/75 space-y-1">
          <p>
            Phone:{' '}
            <a href={`tel:${data.businessInfo.phone}`} className="text-[#D4B478] hover:underline">
              {data.businessInfo.phone}
            </a>
          </p>
          <p>
            Email:{' '}
            <a href={`mailto:${data.businessInfo.email}`} className="text-[#D4B478] hover:underline">
              {data.businessInfo.email}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function AppShell() {
  const { currentRoute, data } = useStudio();

  if (currentRoute === '/admin/login') {
    return <AdminLoginPage />;
  }

  if (currentRoute === '/admin' || currentRoute.startsWith('/admin/')) {
    return <AdminDashboardPage />;
  }

  if (data.settings.maintenanceMode) {
    return <MaintenanceScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1917]">
      <Navbar />
      <main className="flex-1">
        <PublicPageRouter />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <StudioProvider>
      <AppShell />
    </StudioProvider>
  );
}
