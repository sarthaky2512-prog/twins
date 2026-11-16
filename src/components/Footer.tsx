import { Instagram, Facebook, Mail, MapPin, Phone } from 'lucide-react';
import { useStudio } from '../context/StudioContext';

export function Footer() {
  const { data, navigate } = useStudio();
  const { businessInfo, footer, settings } = data;
  const logoSrc = footer.logoUrl || settings.logoUrl || '/assets/aistudio/logo1_twins_526fef3c.png';

  return (
    <footer className="bg-[#141210] text-[#FAF8F5] border-t border-[#B89352]/20">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-14 border-b border-[#FAF8F5]/10">
          {/* Brand Column */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-4">
              <img
                src={logoSrc}
                alt={footer.businessName || businessInfo.businessName}
                className="w-14 h-14 rounded-full object-cover border border-[#B89352]/40 shrink-0"
              />
              <div>
                <h2 className="font-serif-display text-2xl sm:text-3xl tracking-[0.12em] uppercase text-[#FAF8F5]">
                  {footer.businessName || businessInfo.businessName}
                </h2>
                <p className="text-xs tracking-[0.18em] uppercase text-[#D4B478] font-medium mt-1">
                  {footer.tagline || businessInfo.tagline}
                </p>
              </div>
            </div>
            <p className="text-sm text-[#FAF8F5]/70 leading-relaxed max-w-md">
              {footer.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {businessInfo.instagramUrl && (
                <a
                  href={businessInfo.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-[#FAF8F5]/15 text-xs tracking-[0.1em] uppercase text-[#FAF8F5]/85 hover:border-[#D4B478] hover:text-[#D4B478] transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </a>
              )}
              {businessInfo.facebookUrl && (
                <a
                  href={businessInfo.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-[#FAF8F5]/15 text-xs tracking-[0.1em] uppercase text-[#FAF8F5]/85 hover:border-[#D4B478] hover:text-[#D4B478] transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                  <span>Facebook</span>
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xs tracking-[0.2em] uppercase text-[#D4B478] font-semibold">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm">
              {footer.quickLinks.map((item, idx) => (
                <li key={`${item.href}-${idx}`}>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(item.href);
                    }}
                    className="text-[#FAF8F5]/75 hover:text-[#D4B478] transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="/book"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/book');
                  }}
                  className="text-[#D4B478] hover:underline"
                >
                  Book Your Wedding
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-xs tracking-[0.2em] uppercase text-[#D4B478] font-semibold">
              Studio Contact
            </h3>
            <div className="space-y-3.5 text-sm text-[#FAF8F5]/80">
              <a
                href={`tel:${businessInfo.phone.replace(/[^\d+]/g, '')}`}
                className="flex items-start gap-3 hover:text-[#D4B478] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#D4B478] mt-0.5 shrink-0" />
                <span className="tabular-nums">{businessInfo.phone}</span>
              </a>
              <a
                href={`mailto:${businessInfo.email}`}
                className="flex items-start gap-3 hover:text-[#D4B478] transition-colors"
              >
                <Mail className="w-4 h-4 text-[#D4B478] mt-0.5 shrink-0" />
                <span>{businessInfo.email}</span>
              </a>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#D4B478] mt-0.5 shrink-0" />
                <span>
                  {businessInfo.addressLine1} {businessInfo.addressLine2} {businessInfo.country}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#FAF8F5]/60">
          <p>{footer.copyrightText || businessInfo.copyrightText}</p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href={footer.privacyHref || '/privacy'}
              onClick={(e) => {
                e.preventDefault();
                navigate(footer.privacyHref || '/privacy');
              }}
              className="hover:text-[#D4B478] transition-colors"
            >
              {footer.privacyLabel || 'Privacy Policy'}
            </a>
            <a
              href={footer.termsHref || '/terms'}
              onClick={(e) => {
                e.preventDefault();
                navigate(footer.termsHref || '/terms');
              }}
              className="hover:text-[#D4B478] transition-colors"
            >
              {footer.termsLabel || 'Terms & Conditions'}
            </a>
            <a
              href="/admin/login"
              onClick={(e) => {
                e.preventDefault();
                navigate('/admin/login');
              }}
              className="hover:text-[#D4B478] transition-colors"
            >
              Admin Portal
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
