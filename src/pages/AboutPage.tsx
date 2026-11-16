import { ArrowRight, Check } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { PageHero } from '../components/PageHero';
import { StudioImage } from '../components/StudioImage';
import { WhyChooseUsSection } from '../components/WhyChooseUsSection';
import { TestimonialsSlider } from '../components/TestimonialsSlider';

export function AboutPage() {
  const { data, navigate } = useStudio();
  const { homepage, businessInfo } = data;

  return (
    <div>
      <PageHero
        eyebrow="About Twins Twins Video Pro"
        title={homepage.aboutHeading}
        description="Based in Angle Vale, South Australia, we craft timeless wedding photographs and cinematic wedding films with quiet artistry and heartfelt care."
        image={homepage.aboutImage}
      />

      <section className="py-20 lg:py-28 bg-[#FAF8F5]">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[420px] bg-[#E8DEC8] overflow-hidden">
                <StudioImage
                  src={homepage.aboutImage}
                  alt="Twins Twins Video Pro editorial couple portrait"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <p className="text-xs tracking-[0.24em] uppercase text-[#B89352] font-semibold">
                Our Philosophy
              </p>
              <h2 className="font-serif-display text-3xl sm:text-4xl font-medium text-[#1C1917] text-balance">
                {homepage.aboutLead}
              </h2>
              <p className="text-base text-[#6E655D] leading-relaxed">
                {homepage.aboutBody}
              </p>
              <p className="text-base text-[#6E655D] leading-relaxed">
                Whether your celebration unfolds amid the historic vineyards of the Barossa Valley, a sunlit coastal cliff on the Fleurieu Peninsula, or a cherished cultural ceremony in Adelaide, our team brings calm guidance and unified visual storytelling across both photography and cinema.
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

              <div className="pt-4 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/book')}
                  className="inline-flex items-center gap-2 px-7 py-4 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold tracking-[0.16em] uppercase hover:bg-[#B89352] transition-colors cursor-pointer"
                >
                  <span>Book a Consultation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/gallery')}
                  className="px-7 py-4 border border-[#1C1917]/20 text-xs font-semibold tracking-[0.16em] uppercase text-[#1C1917] hover:border-[#B89352] transition-colors cursor-pointer"
                >
                  View Portfolio
                </button>
              </div>
            </div>
          </div>

          {/* Studio Location Strip */}
          <div className="mt-20 pt-12 border-t border-[#1C1917]/10 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-xs tracking-[0.18em] uppercase text-[#B89352] font-semibold">
                Studio Home
              </p>
              <p className="font-serif-display text-2xl text-[#1C1917] mt-2">
                {businessInfo.addressLine1} {businessInfo.addressLine2} {businessInfo.country}
              </p>
            </div>
            <div>
              <p className="text-xs tracking-[0.18em] uppercase text-[#B89352] font-semibold">
                Disciplines
              </p>
              <p className="font-serif-display text-2xl text-[#1C1917] mt-2">
                Fine-Art Photography &amp; 4K Wedding Cinema
              </p>
            </div>
            <div>
              <p className="text-xs tracking-[0.18em] uppercase text-[#B89352] font-semibold">
                Coverage Area
              </p>
              <p className="font-serif-display text-2xl text-[#1C1917] mt-2">
                Adelaide, South Australia &amp; Destination Weddings
              </p>
            </div>
          </div>
        </div>
      </section>

      <WhyChooseUsSection />
      <TestimonialsSlider />
    </div>
  );
}
