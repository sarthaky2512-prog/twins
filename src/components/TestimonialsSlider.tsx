import { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { StudioImage } from './StudioImage';

export function TestimonialsSlider() {
  const { data } = useStudio();
  const items = data.testimonials;
  const [activeIndex, setActiveIndex] = useState(0);

  if (items.length === 0) return null;

  const safeIndex = activeIndex % items.length;
  const current = items[safeIndex];

  const prev = () => setActiveIndex((i) => (i - 1 + items.length) % items.length);
  const next = () => setActiveIndex((i) => (i + 1) % items.length);

  return (
    <section
      className="py-20 lg:py-28 bg-[#F2ECE1]"
      aria-labelledby="testimonials-heading"
    >
      <div className="max-w-[1240px] mx-auto px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <p className="text-xs tracking-[0.24em] uppercase text-[#B89352] font-semibold">
              Couple Stories
            </p>
            <h2
              id="testimonials-heading"
              className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#1C1917]"
            >
              {data.homepage.testimonialsHeading}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous testimonial"
              className="w-11 h-11 flex items-center justify-center border border-[#1C1917]/20 text-[#1C1917] hover:bg-[#1C1917] hover:text-[#FAF8F5] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next testimonial"
              className="w-11 h-11 flex items-center justify-center border border-[#1C1917]/20 text-[#1C1917] hover:bg-[#1C1917] hover:text-[#FAF8F5] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch bg-[#FAF8F5] border border-[#1C1917]/10 p-6 sm:p-10">
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full min-h-[260px] overflow-hidden bg-[#E8DEC8]">
              <StudioImage
                src={current.imageUrl}
                alt={current.coupleName}
                fallbackTitle={current.coupleName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between py-2 space-y-6">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <Quote className="w-8 h-8 text-[#B89352]" strokeWidth={1.3} />
                {current.verified ? (
                  <div
                    className="flex items-center gap-1.5 text-xs text-[#1C1917]"
                    aria-label={`${current.rating} out of 5 verified stars`}
                  >
                    {Array.from({ length: current.rating }).map((_, idx) => (
                      <Star
                        key={idx}
                        className="w-4 h-4 fill-[#B89352] text-[#B89352]"
                      />
                    ))}
                    <span className="ml-2 text-[#6E655D]">Verified Client Review</span>
                  </div>
                ) : (
                  <span className="text-xs text-[#6E655D]">
                    Sample Testimonial Preview · Real client reviews added via Studio Admin
                  </span>
                )}
              </div>

              <blockquote className="font-serif-display text-2xl sm:text-3xl leading-relaxed text-[#1C1917] italic">
                “{current.quote}”
              </blockquote>
            </div>

            <div className="pt-6 border-t border-[#1C1917]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-[#1C1917]">
                  {current.coupleName}
                </p>
                <p className="text-xs text-[#6E655D] mt-0.5">
                  {current.weddingLocation} · {current.serviceUsed}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {items.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={`View testimonial ${idx + 1}`}
                    onClick={() => setActiveIndex(idx)}
                    className={`h-2 transition-all cursor-pointer ${
                      idx === safeIndex ? 'w-8 bg-[#B89352]' : 'w-2 bg-[#1C1917]/20'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
