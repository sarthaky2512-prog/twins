import React from 'react';
import { ArrowDown, ArrowRight, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useStudio } from '../context/StudioContext';
import { StudioImage } from '../components/StudioImage';
import { ServicesSection } from '../components/ServicesSection';
import { GallerySection } from '../components/GallerySection';
import { VideoPortfolioSection } from '../components/VideoPortfolioSection';
import { WhyChooseUsSection } from '../components/WhyChooseUsSection';
import { PackagesSection } from '../components/PackagesSection';
import { BookingForm } from '../components/BookingForm';
import { TestimonialsSlider } from '../components/TestimonialsSlider';
import { ContactSection } from '../components/ContactSection';
import type { HomepageSectionConfig } from '../types/studio';

export function HomePage() {
  const { data, navigate } = useStudio();
  const { homepage, businessInfo } = data;

  const handleHeroCta = (href: string) => {
    if (href.startsWith('#')) {
      const el = document.getElementById(href.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    navigate(href);
  };

  const orderedSections = [...(homepage.sections || [])]
    .filter((s) => s.visible)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const renderSection = (sec: HomepageSectionConfig) => {
    switch (sec.key) {
      case 'hero':
        return (
          <section
            key={sec.id}
            className="relative min-h-screen flex items-end lg:items-center bg-[#141210] text-[#FAF8F5] overflow-hidden pt-20"
          >
            <div className="absolute inset-0">
              {homepage.heroVideoUrl ? (
                <video
                  src={homepage.heroVideoUrl}
                  poster={homepage.heroImage}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <StudioImage
                  src={homepage.heroImage}
                  alt="Bride and groom embracing at golden hour in South Australia"
                  loading="eager"
                  className="w-full h-full object-cover object-center"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#141210]/90 via-[#141210]/45 to-[#141210]/35" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#141210]/75 via-[#141210]/30 to-transparent" />
            </div>

            <div className="relative z-10 max-w-[1320px] w-full mx-auto px-6 lg:px-10 py-16 lg:py-24">
              <div className="max-w-3xl space-y-6">
                <p className="text-xs tracking-[0.26em] uppercase text-[#D4B478] font-medium">
                  {homepage.heroSubheading}
                </p>
                <h1 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl xl:text-[64px] font-medium leading-[1.06] tracking-tight text-balance">
                  {homepage.heroHeading}
                </h1>
                <p className="text-base sm:text-lg text-[#FAF8F5]/85 leading-relaxed max-w-2xl">
                  {homepage.heroSupportingText}
                </p>

                <div className="pt-3 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleHeroCta(homepage.heroPrimaryCtaHref || '#home-portfolio-anchor')}
                    className="inline-flex items-center gap-2.5 px-7 py-4 bg-[#B89352] text-[#FAF8F5] text-xs font-semibold tracking-[0.16em] uppercase hover:bg-[#D4B478] hover:text-[#141210] transition-colors cursor-pointer"
                  >
                    <span>{homepage.heroPrimaryCtaLabel || 'EXPLORE OUR WORK'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHeroCta(homepage.heroSecondaryCtaHref || '/book')}
                    className="inline-flex items-center gap-2.5 px-7 py-4 border border-[#FAF8F5]/40 bg-[#141210]/35 backdrop-blur-xs text-[#FAF8F5] text-xs font-semibold tracking-[0.16em] uppercase hover:border-[#D4B478] hover:text-[#D4B478] transition-colors cursor-pointer"
                  >
                    <span>{homepage.heroSecondaryCtaLabel || 'BOOK YOUR WEDDING'}</span>
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('home-about-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              aria-label="Scroll down to discover our studio"
              className="hidden sm:flex flex-col items-center gap-2 absolute bottom-8 right-8 lg:right-12 z-10 text-[#FAF8F5]/80 hover:text-[#D4B478] transition-colors cursor-pointer"
            >
              <span className="text-[11px] tracking-[0.24em] uppercase">Scroll</span>
              <motion.span
                animate={{ y: [0, 7, 0] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                className="w-8 h-8 rounded-full border border-current/40 flex items-center justify-center"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </motion.span>
            </button>
          </section>
        );
      case 'marquee':
        return (
          <div
            key={sec.id}
            className="bg-[#141210] text-[#D4B478] border-y border-[#FAF8F5]/10 py-3.5 overflow-hidden"
          >
            <div className="animate-marquee text-xs tracking-[0.26em] uppercase whitespace-nowrap">
              <span className="mx-6">
                {businessInfo.businessName} · Wedding Photography · Cinematic Wedding Films · Pre-Wedding Sessions · {businessInfo.locationLabel} ·
              </span>
              <span className="mx-6" aria-hidden="true">
                {businessInfo.businessName} · Wedding Photography · Cinematic Wedding Films · Pre-Wedding Sessions · {businessInfo.locationLabel} ·
              </span>
            </div>
          </div>
        );
      case 'about':
        return (
          <section
            key={sec.id}
            id="home-about-section"
            className="py-20 lg:py-28 bg-[#FAF8F5]"
            aria-labelledby="about-heading"
          >
            <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
                <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
                  <div className="space-y-3">
                    <p className="text-xs tracking-[0.24em] uppercase text-[#B89352] font-semibold">
                      About Our Studio
                    </p>
                    <h2
                      id="about-heading"
                      className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#1C1917] text-balance"
                    >
                      {homepage.aboutHeading}
                    </h2>
                  </div>
                  <p className="font-serif-display text-xl sm:text-2xl italic text-[#1C1917]/90 leading-relaxed">
                    {homepage.aboutLead}
                  </p>
                  <p className="text-sm sm:text-base text-[#6E655D] leading-relaxed">
                    {homepage.aboutBody}
                  </p>
                  <div className="pt-4 border-t border-[#1C1917]/10">
                    <h3 className="text-xs tracking-[0.18em] uppercase text-[#1C1917] font-semibold mb-4">
                      Our Approach
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {homepage.aboutApproach.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2.5 text-sm text-[#1C1917]">
                          <Check className="w-4 h-4 text-[#B89352] shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => navigate('/about')}
                      className="inline-flex items-center gap-2 px-6 py-3.5 border border-[#1C1917]/20 text-xs font-semibold tracking-[0.14em] uppercase text-[#1C1917] hover:border-[#B89352] hover:text-[#B89352] transition-colors cursor-pointer"
                    >
                      <span>Discover Our Story</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="lg:col-span-6">
                  <div className="relative h-full min-h-[420px] lg:min-h-[560px] overflow-hidden bg-[#E8DEC8]">
                    <StudioImage
                      src={homepage.aboutImage}
                      alt="Bride and groom walking past classic sandstone arches"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      case 'services':
        return <ServicesSection key={sec.id} />;
      case 'portfolio':
        return (
          <div key={sec.id} id="home-portfolio-anchor">
            <GallerySection showViewAllButton />
          </div>
        );
      case 'videos':
        return <VideoPortfolioSection key={sec.id} limit={6} showViewAllButton darkTheme />;
      case 'why_choose':
        return <WhyChooseUsSection key={sec.id} />;
      case 'packages':
        return <PackagesSection key={sec.id} />;
      case 'testimonials':
        return <TestimonialsSlider key={sec.id} />;
      case 'booking':
        return <BookingForm key={sec.id} />;
      case 'contact':
        return <ContactSection key={sec.id} />;
      default:
        return null;
    }
  };

  return <div>{orderedSections.map((sec): React.ReactNode => renderSection(sec))}</div>;
}
