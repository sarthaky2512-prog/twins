import { ArrowRight, Check } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { PageHero } from '../components/PageHero';
import { StudioImage } from '../components/StudioImage';
import { ServicesSection } from '../components/ServicesSection';
import { GallerySection } from '../components/GallerySection';
import { VideoPortfolioSection } from '../components/VideoPortfolioSection';
import { PackagesSection } from '../components/PackagesSection';

export function PhotographyPage() {
  const { data, navigate } = useStudio();
  const photoServices = data.services.filter((s) => s.slug !== 'wedding-videography' && s.slug !== 'cinematic-wedding-films');

  return (
    <div>
      <PageHero
        eyebrow="Wedding Photography"
        title="Editorial & Emotional Wedding Photography."
        description="From bridal preparation and traditional ceremonies to candlelit receptions and multi-generational family portraits, every frame is crafted to endure."
        image="img://bridal"
      />
      <ServicesSection
        items={photoServices}
        heading="Specialised Photography Collections"
        eyebrow="Still Photography"
      />
      <GallerySection limit={6} showViewAllButton />
      <PackagesSection />
      <section className="py-16 bg-[#141210] text-[#FAF8F5] text-center px-6">
        <div className="max-w-2xl mx-auto space-y-5">
          <h2 className="font-serif-display text-3xl sm:text-4xl">
            Reserve Your Wedding Photography Date
          </h2>
          <p className="text-sm text-[#FAF8F5]/75">
            Share your wedding venue and date with Twins Twins Video Pro for a tailored photography proposal.
          </p>
          <button
            type="button"
            onClick={() => navigate('/book', { service: 'Wedding Photography' })}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#B89352] text-[#FAF8F5] text-xs font-semibold tracking-[0.16em] uppercase hover:bg-[#D4B478] hover:text-[#141210] transition-colors cursor-pointer"
          >
            <span>Request Photography Quote</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

export function VideographyPage() {
  const { navigate } = useStudio();

  const pillars = [
    'Discrete multi-camera 4K cinema capture during ceremony vows and speeches.',
    'Dedicated wireless lapel & ambient sound design preserving every spoken promise.',
    'Stabilized natural motion paired with warm, filmic color grading.',
    'Coordinated photo & video direction so your day stays relaxed and unscripted.',
  ];

  return (
    <div>
      <PageHero
        eyebrow="Wedding Videography"
        title="Cinematic Wedding Videography With Heart & Sound."
        description="Your vows, laughter, music, and fleeting glances woven into an heirloom wedding film you will treasure for generations."
        image="img://reception"
      />

      <section className="py-20 lg:py-24 bg-[#FAF8F5]">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <p className="text-xs tracking-[0.24em] uppercase text-[#B89352] font-semibold">
              Cinema Craftsmanship
            </p>
            <h2 className="font-serif-display text-3xl sm:text-4xl font-medium text-[#1C1917]">
              More Than Highlights — A Living Story of Your Celebration.
            </h2>
            <p className="text-base text-[#6E655D] leading-relaxed">
              Our videography team works silently alongside our photographers, ensuring seamless harmony between still frames and moving cinema without intrusive staging.
            </p>
            <ul className="space-y-3 pt-2">
              {pillars.map((p, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-[#1C1917]">
                  <Check className="w-4 h-4 text-[#B89352] mt-1 shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <div className="pt-3">
              <button
                type="button"
                onClick={() => navigate('/book', { service: 'Wedding Videography' })}
                className="inline-flex items-center gap-2 px-7 py-4 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold tracking-[0.16em] uppercase hover:bg-[#B89352] transition-colors cursor-pointer"
              >
                <span>Inquire About Videography</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="lg:col-span-6">
            <div className="aspect-[16/10] overflow-hidden bg-[#E8DEC8]">
              <StudioImage
                src="img://reception"
                alt="Evening wedding reception first dance cinema"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <VideoPortfolioSection darkTheme />
      <PackagesSection />
    </div>
  );
}

export function PreWeddingPage() {
  const { navigate } = useStudio();

  return (
    <div>
      <PageHero
        eyebrow="Pre-Wedding Photography"
        title="Golden-Hour Pre-Wedding Stories Across South Australia."
        description="Unhurried couple portraiture along tranquil coastlines, heritage stone estates, and Barossa vineyards before your wedding day."
        image="img://prewedding"
      />

      <section className="py-20 lg:py-24 bg-[#FAF8F5]">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <div className="aspect-[4/3] overflow-hidden bg-[#E8DEC8]">
              <StudioImage
                src="img://prewedding"
                alt="Couple walking along South Australian beach at sunset"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="lg:col-span-6 space-y-6">
            <p className="text-xs tracking-[0.24em] uppercase text-[#B89352] font-semibold">
              Pre-Wedding Sessions
            </p>
            <h2 className="font-serif-display text-3xl sm:text-4xl font-medium text-[#1C1917]">
              Celebrate Your Story Before You Walk Down the Aisle.
            </h2>
            <p className="text-base text-[#6E655D] leading-relaxed">
              A pre-wedding shoot lets us craft editorial imagery for your wedding invitations, welcome signage, and guestbook — while giving you both a relaxed experience in front of our lenses before the big day.
            </p>
            <ul className="space-y-3">
              {[
                'Custom location scouting across Angle Vale, Barossa, Adelaide Hills & Fleurieu coast.',
                'Outfit & palette styling guidance to complement South Australian light.',
                'Optional pre-wedding cinematic film add-on for reception screening.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[#1C1917]">
                  <Check className="w-4 h-4 text-[#B89352] mt-1 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => navigate('/book', { service: 'Pre-Wedding Photography' })}
              className="inline-flex items-center gap-2 px-7 py-4 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold tracking-[0.16em] uppercase hover:bg-[#B89352] transition-colors cursor-pointer"
            >
              <span>Book Pre-Wedding Session</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <GallerySection initialCategory="Pre-Wedding Shoots" showViewAllButton />
    </div>
  );
}

export function EngagementPage() {
  const { navigate } = useStudio();

  return (
    <div>
      <PageHero
        eyebrow="Engagement Photography"
        title="Natural, Joyful Engagement Portraits."
        description="Mark the excitement of saying yes with an intimate, relaxed portrait session designed around your authentic connection."
        image="img://about"
      />

      <section className="py-20 lg:py-24 bg-[#FAF8F5]">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <p className="text-xs tracking-[0.24em] uppercase text-[#B89352] font-semibold">
              Engagement Sessions
            </p>
            <h2 className="font-serif-display text-3xl sm:text-4xl font-medium text-[#1C1917]">
              Effortless Portraits Filled With Laughter &amp; Warmth.
            </h2>
            <p className="text-base text-[#6E655D] leading-relaxed">
              No stiff poses — just genuine interaction, soft sunset glow, and gentle direction that captures the excitement of your engagement chapter.
            </p>
            <ul className="space-y-3">
              {[
                '90-minute sunset portrait session at your favourite South Australian backdrop.',
                'Full high-resolution edited digital collection for announcements and prints.',
                'Seamless creative alignment with your upcoming wedding photography.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[#1C1917]">
                  <Check className="w-4 h-4 text-[#B89352] mt-1 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => navigate('/book', { service: 'Engagement Photography' })}
              className="inline-flex items-center gap-2 px-7 py-4 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold tracking-[0.16em] uppercase hover:bg-[#B89352] transition-colors cursor-pointer"
            >
              <span>Schedule Engagement Shoot</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="lg:col-span-6">
            <div className="aspect-[3/4] max-h-[540px] w-full overflow-hidden bg-[#E8DEC8]">
              <StudioImage
                src="img://about"
                alt="Couple holding hands under sandstone arches"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <GallerySection initialCategory="Engagement Shoots" showViewAllButton />
    </div>
  );
}
