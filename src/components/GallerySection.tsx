import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { StudioImage } from './StudioImage';
import type { GalleryItem } from '../types/studio';

interface GallerySectionProps {
  limit?: number;
  showViewAllButton?: boolean;
  initialCategory?: string;
}

export function GallerySection({
  limit,
  showViewAllButton = false,
  initialCategory = 'All',
}: GallerySectionProps) {
  const { data, navigate } = useStudio();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categoryNames = useMemo(() => {
    const names = data.categories.map((c) => c.name);
    return ['All', ...names];
  }, [data.categories]);

  const filteredItems = useMemo(() => {
    const list =
      selectedCategory === 'All'
        ? data.gallery
        : data.gallery.filter((item) => item.category === selectedCategory);
    return limit ? list.slice(0, limit) : list;
  }, [data.gallery, selectedCategory, limit]);

  const activeItem: GalleryItem | null =
    lightboxIndex !== null && filteredItems[lightboxIndex] ? filteredItems[lightboxIndex] : null;

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev + 1) % filteredItems.length
        );
      }
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev - 1 + filteredItems.length) % filteredItems.length
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, filteredItems.length]);

  const aspectClass = (aspect: GalleryItem['aspect']) => {
    if (aspect === 'portrait') return 'aspect-[3/4]';
    if (aspect === 'square') return 'aspect-square';
    return 'aspect-[4/3]';
  };

  return (
    <section className="py-20 lg:py-28 bg-[#FAF8F5]" aria-labelledby="portfolio-heading">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs tracking-[0.24em] uppercase text-[#B89352] font-semibold">
              Curated Portfolio
            </p>
            <h2
              id="portfolio-heading"
              className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#1C1917] text-balance"
            >
              {data.homepage.portfolioHeading}
            </h2>
          </div>

          {showViewAllButton && (
            <button
              type="button"
              onClick={() => navigate('/gallery')}
              className="self-start lg:self-end px-6 py-3 border border-[#1C1917]/20 text-xs font-semibold tracking-[0.14em] uppercase text-[#1C1917] hover:border-[#B89352] hover:text-[#B89352] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              View Full Portfolio
            </button>
          )}
        </div>

        {/* Interactive Category Filter Controls */}
        <div
          role="tablist"
          aria-label="Filter portfolio by category"
          className="flex flex-wrap items-center gap-2 pb-10 border-b border-[#1C1917]/10 mb-10"
        >
          {categoryNames.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setLightboxIndex(null);
                }}
                className={`px-4 py-2 text-xs font-medium tracking-[0.06em] whitespace-nowrap shrink-0 transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#B89352] ${
                  active
                    ? 'bg-[#1C1917] text-[#FAF8F5]'
                    : 'bg-[#F2ECE1] text-[#1C1917]/75 hover:bg-[#E8DEC8] hover:text-[#1C1917]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Masonry Image Grid */}
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center bg-[#F2ECE1]/60 border border-[#1C1917]/10">
            <p className="font-serif-display text-2xl text-[#1C1917] mb-2">
              No photographs in this collection yet
            </p>
            <p className="text-sm text-[#6E655D]">
              Select another category or add new wedding imagery from the Studio Admin portal.
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {filteredItems.map((item, idx) => (
              <article
                key={item.id}
                className="break-inside-avoid group relative overflow-hidden bg-[#F2ECE1] border border-[#1C1917]/8"
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  aria-label={`Open full preview of ${item.title}`}
                  className="block w-full text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[#B89352]"
                >
                  <div className={`relative w-full overflow-hidden ${aspectClass(item.aspect)}`}>
                    <StudioImage
                      src={item.imageUrl}
                      alt={`${item.title} — ${item.category}`}
                      fallbackTitle={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141210]/80 via-[#141210]/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-5">
                      <div className="flex justify-end">
                        <span className="inline-flex items-center justify-center w-9 h-9 bg-[#FAF8F5]/90 text-[#1C1917]">
                          <Expand className="w-4 h-4" />
                        </span>
                      </div>
                      <div className="text-[#FAF8F5]">
                        <p className="text-xs text-[#D4B478] tracking-[0.06em]">
                          {item.category} · {item.location}
                        </p>
                        <h3 className="font-serif-display text-xl font-medium mt-1">
                          {item.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between gap-4 bg-[#FAF8F5]">
                    <div className="min-w-0">
                      <h3 className="font-serif-display text-lg font-medium text-[#1C1917] truncate">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[#6E655D] mt-0.5 truncate">
                        {item.category} · {item.location}
                      </p>
                    </div>
                    <span className="text-xs text-[#B89352] font-medium shrink-0">
                      View
                    </span>
                  </div>
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox */}
      {activeItem && lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.title}
          className="fixed inset-0 z-50 bg-[#141210]/95 backdrop-blur-sm flex flex-col justify-between p-4 sm:p-8"
        >
          <div className="flex items-center justify-between text-[#FAF8F5]">
            <div className="text-xs tracking-[0.12em] uppercase text-[#D4B478] tabular-nums">
              {lightboxIndex + 1} / {filteredItems.length} · {activeItem.category}
            </div>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              aria-label="Close lightbox"
              className="inline-flex items-center gap-2 px-3 py-2 text-xs tracking-[0.12em] uppercase text-[#FAF8F5] hover:text-[#D4B478] cursor-pointer"
            >
              <span>Close</span>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center my-4 min-h-0">
            {filteredItems.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex(
                    (lightboxIndex - 1 + filteredItems.length) % filteredItems.length
                  )
                }
                aria-label="Previous photograph"
                className="absolute left-2 sm:left-4 z-10 w-11 h-11 flex items-center justify-center bg-[#141210]/70 text-[#FAF8F5] hover:bg-[#B89352] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="max-h-full max-w-5xl flex items-center justify-center">
              <StudioImage
                src={activeItem.imageUrl}
                alt={activeItem.title}
                fallbackTitle={activeItem.title}
                className="max-h-[75vh] w-auto object-contain shadow-2xl"
              />
            </div>

            {filteredItems.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((lightboxIndex + 1) % filteredItems.length)
                }
                aria-label="Next photograph"
                className="absolute right-2 sm:right-4 z-10 w-11 h-11 flex items-center justify-center bg-[#141210]/70 text-[#FAF8F5] hover:bg-[#B89352] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          <div className="text-center text-[#FAF8F5] max-w-2xl mx-auto">
            <h3 className="font-serif-display text-2xl sm:text-3xl font-medium">
              {activeItem.title}
            </h3>
            <p className="text-xs text-[#D4B478] mt-1">
              {activeItem.location} · {activeItem.dateLabel}
            </p>
            {activeItem.caption && (
              <p className="text-sm text-[#FAF8F5]/75 mt-2">{activeItem.caption}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
