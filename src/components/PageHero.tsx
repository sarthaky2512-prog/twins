import { StudioImage } from './StudioImage';

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  image?: string;
}

export function PageHero({
  eyebrow,
  title,
  description,
  image = 'img://hero',
}: PageHeroProps) {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 bg-[#141210] text-[#FAF8F5] overflow-hidden">
      <div className="absolute inset-0">
        <StudioImage
          src={image}
          alt={title}
          loading="eager"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141210] via-[#141210]/70 to-[#141210]/65" />
      </div>
      <div className="relative z-10 max-w-[1320px] mx-auto px-6 lg:px-10">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs tracking-[0.26em] uppercase text-[#D4B478] font-medium">
            {eyebrow}
          </p>
          <h1 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-balance">
            {title}
          </h1>
          <p className="text-base sm:text-lg text-[#FAF8F5]/80 leading-relaxed max-w-2xl">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
