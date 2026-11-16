import { useState } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { StudioImage } from './StudioImage';
import type { ServiceItem } from '../types/studio';

interface ServicesSectionProps {
  items?: ServiceItem[];
  heading?: string;
  eyebrow?: string;
}

export function ServicesSection({
  items,
  heading,
  eyebrow = 'Curated Offerings',
}: ServicesSectionProps) {
  const { data, navigate } = useStudio();
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  const list = items || data.services;

  return (
    <section
      className="py-20 lg:py-28 bg-[#F2ECE1]/65"
      aria-labelledby="services-heading"
    >
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
        <div className="max-w-2xl space-y-3 mb-14">
          <p className="text-xs tracking-[0.24em] uppercase text-[#B89352] font-semibold">
            {eyebrow}
          </p>
          <h2
            id="services-heading"
            className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#1C1917] text-balance"
          >
            {heading || data.homepage.servicesHeading}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {list.map((service, index) => (
            <article
              key={service.id}
              className="group bg-[#FAF8F5] border border-[#1C1917]/10 flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="relative aspect-[4/3] overflow-hidden bg-[#E8DEC8]">
                  <StudioImage
                    src={service.image}
                    alt={service.title}
                    fallbackTitle={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-7 space-y-3">
                  <p className="text-xs text-[#B89352] font-medium tabular-nums">
                    {String(index + 1).padStart(2, '0')}. Studio Service
                  </p>
                  <h3 className="font-serif-display text-2xl sm:text-3xl font-medium text-[#1C1917]">
                    {service.title}
                  </h3>
                  <p className="text-sm text-[#6E655D] leading-relaxed">
                    {service.shortDescription}
                  </p>
                </div>
              </div>

              <div className="px-7 pb-7 pt-2 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedService(service)}
                  className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase text-[#1C1917] hover:text-[#B89352] transition-colors cursor-pointer"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/book', { service: service.title })}
                  className="text-xs text-[#6E655D] hover:text-[#1C1917] underline underline-offset-4 cursor-pointer"
                >
                  Inquire
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Service Details Modal */}
      {selectedService && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedService.title}
          className="fixed inset-0 z-50 bg-[#141210]/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="bg-[#FAF8F5] text-[#1C1917] max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#1C1917]/15 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-1 md:grid-cols-12">
              <div className="md:col-span-5 relative min-h-[240px] bg-[#E8DEC8]">
                <StudioImage
                  src={selectedService.image}
                  alt={selectedService.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs tracking-[0.2em] uppercase text-[#B89352] font-semibold">
                        Service Overview
                      </p>
                      <h3 className="font-serif-display text-3xl font-medium mt-1">
                        {selectedService.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedService(null)}
                      aria-label="Close service details"
                      className="p-2 text-[#6E655D] hover:text-[#1C1917] cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-sm text-[#6E655D] leading-relaxed mb-6">
                    {selectedService.fullDescription}
                  </p>

                  <h4 className="text-xs tracking-[0.14em] uppercase font-semibold text-[#1C1917] mb-3">
                    What Is Included
                  </h4>
                  <ul className="space-y-2.5">
                    {selectedService.deliverables.map((d, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-[#1C1917]">
                        <Check className="w-4 h-4 text-[#B89352] mt-0.5 shrink-0" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-5 border-t border-[#1C1917]/10 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const srv = selectedService;
                      setSelectedService(null);
                      navigate('/book', { service: srv.title });
                    }}
                    className="px-6 py-3 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold tracking-[0.14em] uppercase hover:bg-[#B89352] transition-colors cursor-pointer"
                  >
                    Book This Service
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const route = selectedService.route;
                      setSelectedService(null);
                      navigate(route);
                    }}
                    className="px-5 py-3 border border-[#1C1917]/20 text-xs font-semibold tracking-[0.14em] uppercase text-[#1C1917] hover:border-[#B89352] transition-colors cursor-pointer"
                  >
                    Visit Dedicated Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
