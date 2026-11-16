import { ArrowRight } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { StudioImage } from '../components/StudioImage';
import { useStudio } from '../context/StudioContext';
import type { WebsitePage } from '../types/studio';

interface DynamicCmsPageProps {
  page: WebsitePage;
}

export function DynamicCmsPage({ page }: DynamicCmsPageProps) {
  const { navigate } = useStudio();

  const sortedSections = [...(page.sections || [])].sort(
    (a, b) => a.orderIndex - b.orderIndex
  );

  const bgClass = (bg: string) => {
    if (bg === 'charcoal') return 'bg-[#141210] text-[#FAF8F5]';
    if (bg === 'cream') return 'bg-[#F2ECE1] text-[#1C1917]';
    return 'bg-[#FAF8F5] text-[#1C1917]';
  };

  return (
    <div>
      <PageHero
        eyebrow={page.heroEyebrow || 'Twins Twins Video Pro'}
        title={page.heroTitle || page.title}
        description={page.heroDescription}
        image={page.heroImage || 'img://hero'}
      />

      {sortedSections.length === 0 ? (
        <section className="py-20 bg-[#FAF8F5] text-center px-6">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="font-serif-display text-3xl text-[#1C1917]">{page.title}</h2>
            <p className="text-sm text-[#6E655D]">
              {page.heroDescription ||
                'Custom studio content sections can be edited directly from Website Pages in the Admin Dashboard.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/book')}
              className="mt-4 inline-flex items-center gap-2 px-7 py-3.5 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold tracking-[0.14em] uppercase hover:bg-[#B89352] cursor-pointer"
            >
              <span>Book Your Wedding</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      ) : (
        sortedSections.map((sec) => (
          <section key={sec.id} className={`py-16 lg:py-24 ${bgClass(sec.backgroundColor)}`}>
            <div className="max-w-[1240px] mx-auto px-6 lg:px-10">
              {sec.type === 'image_text' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                  <div className="lg:col-span-6 space-y-4">
                    {sec.subheading && (
                      <p className="text-xs tracking-[0.22em] uppercase text-[#B89352] font-semibold">
                        {sec.subheading}
                      </p>
                    )}
                    {sec.heading && (
                      <h2 className="font-serif-display text-3xl sm:text-4xl font-medium">
                        {sec.heading}
                      </h2>
                    )}
                    {sec.body && (
                      <p className="text-base leading-relaxed opacity-85 whitespace-pre-line">
                        {sec.body}
                      </p>
                    )}
                    {sec.buttonLabel && sec.buttonHref && (
                      <button
                        type="button"
                        onClick={() => navigate(sec.buttonHref)}
                        className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#B89352] text-[#FAF8F5] text-xs font-semibold tracking-[0.14em] uppercase hover:bg-[#1C1917] cursor-pointer"
                      >
                        <span>{sec.buttonLabel}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="lg:col-span-6">
                    {sec.imageUrl && (
                      <div className="aspect-[4/3] overflow-hidden bg-[#E8DEC8]">
                        <StudioImage
                          src={sec.imageUrl}
                          alt={sec.heading || page.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto text-center space-y-5">
                  {sec.subheading && (
                    <p className="text-xs tracking-[0.22em] uppercase text-[#B89352] font-semibold">
                      {sec.subheading}
                    </p>
                  )}
                  {sec.heading && (
                    <h2 className="font-serif-display text-3xl sm:text-4xl font-medium">
                      {sec.heading}
                    </h2>
                  )}
                  {sec.body && (
                    <p className="text-base leading-relaxed opacity-85 whitespace-pre-line">
                      {sec.body}
                    </p>
                  )}
                  {sec.imageUrl && (
                    <div className="aspect-[16/9] overflow-hidden bg-[#E8DEC8] my-6">
                      <StudioImage
                        src={sec.imageUrl}
                        alt={sec.heading || page.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {sec.videoUrl && (
                    <div className="aspect-video overflow-hidden bg-black my-6">
                      <video src={sec.videoUrl} controls className="w-full h-full object-contain" />
                    </div>
                  )}
                  {sec.buttonLabel && sec.buttonHref && (
                    <button
                      type="button"
                      onClick={() => navigate(sec.buttonHref)}
                      className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#B89352] text-[#FAF8F5] text-xs font-semibold tracking-[0.14em] uppercase hover:bg-[#1C1917] cursor-pointer"
                    >
                      <span>{sec.buttonLabel}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
