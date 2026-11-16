import { Check } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { StudioImage } from './StudioImage';

interface PackagesSectionProps {
  showHeader?: boolean;
}

export function PackagesSection({ showHeader = true }: PackagesSectionProps) {
  const { data, navigate } = useStudio();
  const publishedPackages = [...data.packages]
    .filter((p) => p.published !== false)
    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

  return (
    <section
      className="py-20 lg:py-28 bg-[#FAF8F5]"
      aria-labelledby="packages-heading"
    >
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
        {showHeader && (
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <p className="text-xs tracking-[0.24em] uppercase text-[#B89352] font-semibold">
              Wedding Collections
            </p>
            <h2
              id="packages-heading"
              className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#1C1917] text-balance"
            >
              {data.homepage.packagesHeading}
            </h2>
            <p className="text-sm sm:text-base text-[#6E655D]">
              Every celebration is unique. Select a curated collection below or inquire for a tailored multi-day proposal.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {publishedPackages.map((pkg) => (
            <article
              key={pkg.id}
              className={`flex flex-col justify-between border transition-colors overflow-hidden ${
                pkg.highlighted
                  ? 'bg-[#141210] text-[#FAF8F5] border-[#B89352]'
                  : 'bg-[#F2ECE1]/75 text-[#1C1917] border-[#1C1917]/12'
              }`}
            >
              <div>
                {pkg.imageUrl && (
                  <div className="aspect-[16/9] overflow-hidden bg-[#E8DEC8]">
                    <StudioImage
                      src={pkg.imageUrl}
                      alt={pkg.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-8 sm:p-10 space-y-6">
                  <div className="space-y-2 pb-6 border-b border-current/12">
                    <p className="text-xs tracking-[0.2em] uppercase text-[#B89352] font-semibold">
                      {pkg.tierLabel}
                    </p>
                    <h3 className="font-serif-display text-2xl sm:text-3xl font-medium tracking-tight">
                      {pkg.name}
                    </h3>
                    <p
                      className={`text-sm leading-relaxed ${
                        pkg.highlighted ? 'text-[#FAF8F5]/75' : 'text-[#6E655D]'
                      }`}
                    >
                      {pkg.subtitle}
                    </p>
                  </div>

                  <div>
                    <p className="font-serif-display text-2xl italic text-[#D4B478] tabular-nums">
                      {pkg.priceDisplay?.trim()
                        ? pkg.priceDisplay
                        : pkg.pricingLabel || 'Contact for Pricing'}
                    </p>
                    {pkg.idealFor && (
                      <p
                        className={`text-xs mt-1 ${
                          pkg.highlighted ? 'text-[#FAF8F5]/65' : 'text-[#6E655D]'
                        }`}
                      >
                        Ideal for: {pkg.idealFor}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 pt-2">
                    {pkg.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm leading-relaxed">
                        <Check className="w-4 h-4 text-[#B89352] mt-1 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="px-8 sm:px-10 pb-8 sm:pb-10 pt-6 border-t border-current/12">
                <button
                  type="button"
                  onClick={() => navigate('/book', { packageName: pkg.name })}
                  className={`w-full py-4 px-6 text-xs font-semibold tracking-[0.16em] uppercase transition-colors cursor-pointer ${
                    pkg.highlighted
                      ? 'bg-[#B89352] text-[#FAF8F5] hover:bg-[#D4B478] hover:text-[#141210]'
                      : 'bg-[#1C1917] text-[#FAF8F5] hover:bg-[#B89352]'
                  }`}
                >
                  {pkg.customQuoteEnabled !== false ? 'GET A QUOTE' : 'BOOK THIS PACKAGE'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
