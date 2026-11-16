import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useStudio } from '../context/StudioContext';

export function Navbar() {
  const { currentRoute, navigate, data } = useStudio();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isHomeHero = currentRoute === '/' && !scrolled;
  const visibleNav = data.navigation.filter((n) => n.visible);
  const logoSrc = data.settings.logoUrl || '/assets/aistudio/logo1_twins_526fef3c.png';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (href: string, openInNewTab = false) => {
    setMobileOpen(false);
    if (openInNewTab || href.startsWith('http')) {
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(href);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-300 ${
        isHomeHero
          ? 'bg-gradient-to-b from-[#141210]/75 via-[#141210]/40 to-transparent text-[#FAF8F5]'
          : 'bg-[#FAF8F5]/95 backdrop-blur-md text-[#1C1917] border-b border-[#1C1917]/10'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-16 lg:h-[76px] flex items-center justify-between gap-6">
        {/* Brand Logo + Wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            handleNav('/');
          }}
          className="inline-flex items-center gap-3 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#B89352]"
        >
          <img
            src={logoSrc}
            alt={data.businessInfo.businessName}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-[#B89352]/40 shrink-0"
          />
          <span className="font-serif-display text-lg sm:text-xl font-semibold tracking-[0.14em] uppercase">
            {data.businessInfo.businessName}
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav
          aria-label="Primary Navigation"
          className="hidden xl:flex items-center gap-5 2xl:gap-7"
        >
          {visibleNav.map((item) => {
            const active = currentRoute === item.href;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNav(item.href, item.openInNewTab);
                }}
                className={`relative text-[13px] tracking-[0.04em] whitespace-nowrap shrink-0 py-1 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[#B89352] ${
                  active
                    ? isHomeHero
                      ? 'text-[#D4B478] font-medium'
                      : 'text-[#B89352] font-semibold'
                    : isHomeHero
                    ? 'text-[#FAF8F5]/90 hover:text-[#D4B478]'
                    : 'text-[#1C1917]/80 hover:text-[#B89352]'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-[#B89352]"
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Primary CTA + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNav('/book')}
            className={`hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold tracking-[0.12em] uppercase whitespace-nowrap shrink-0 transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B89352] ${
              isHomeHero
                ? 'bg-[#B89352] text-[#FAF8F5] hover:bg-[#a37f41]'
                : 'bg-[#1C1917] text-[#FAF8F5] hover:bg-[#B89352]'
            }`}
          >
            BOOK YOUR WEDDING
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="xl:hidden inline-flex items-center justify-center w-11 h-11 rounded-sm transition-colors hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-[#B89352]"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Navigation Drawer */}
      {mobileOpen && (
        <div className="xl:hidden bg-[#FAF8F5] text-[#1C1917] border-t border-[#1C1917]/10 shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav aria-label="Mobile Navigation" className="px-6 py-6 flex flex-col gap-1">
            {visibleNav.map((item) => {
              const active = currentRoute === item.href;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav(item.href, item.openInNewTab);
                  }}
                  className={`py-3 px-3 text-base border-b border-[#1C1917]/6 transition-colors ${
                    active ? 'text-[#B89352] font-semibold' : 'text-[#1C1917] hover:text-[#B89352]'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
            <div className="pt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => handleNav('/book')}
                className="w-full py-3.5 px-6 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold tracking-[0.14em] uppercase hover:bg-[#B89352] transition-colors cursor-pointer"
              >
                BOOK YOUR WEDDING
              </button>
              <button
                type="button"
                onClick={() => handleNav('/admin/login')}
                className="w-full py-2.5 px-6 border border-[#1C1917]/15 text-[#6E655D] text-xs tracking-[0.1em] uppercase hover:text-[#1C1917] transition-colors cursor-pointer"
              >
                Admin Login
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
