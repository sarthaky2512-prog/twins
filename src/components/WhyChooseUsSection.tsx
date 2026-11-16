import { Award, Camera, Clapperboard, Heart, Sparkles, Eye } from 'lucide-react';
import { useStudio } from '../context/StudioContext';

const REASONS = [
  {
    icon: Camera,
    title: 'Creative Photography.',
    description:
      'Editorial framing shaped by natural Australian golden-hour light, architectural poise, and candid human connection.',
  },
  {
    icon: Clapperboard,
    title: 'Cinematic Storytelling.',
    description:
      'Narrative wedding films layered with live ceremony vows, atmospheric audio, and timeless motion.',
  },
  {
    icon: Award,
    title: 'Professional Quality.',
    description:
      'Dual-camera coverage, cinema prime lenses, redundant backups, and archival color grading on every frame.',
  },
  {
    icon: Eye,
    title: 'Attention to Detail.',
    description:
      'From heirloom lace and handwritten letters to the subtle tear in a parent’s eye, nothing goes unnoticed.',
  },
  {
    icon: Heart,
    title: 'Personalized Experience.',
    description:
      'Bespoke timeline guidance and calm, attentive direction tailored around your traditions and comfort.',
  },
  {
    icon: Sparkles,
    title: 'Beautiful Timeless Memories.',
    description:
      'Heirloom photographs and films graded to remain luminous, authentic, and deeply moving decades from now.',
  },
];

export function WhyChooseUsSection() {
  const { data } = useStudio();

  return (
    <section
      className="py-20 lg:py-28 bg-[#F2ECE1]/70"
      aria-labelledby="why-choose-heading"
    >
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <p className="text-xs tracking-[0.24em] uppercase text-[#B89352] font-semibold">
            The Studio Promise
          </p>
          <h2
            id="why-choose-heading"
            className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#1C1917] text-balance"
          >
            {data.homepage.whyChooseHeading}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {REASONS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="p-8 bg-[#FAF8F5] border border-[#1C1917]/10 space-y-4 transition-colors hover:border-[#B89352]"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-[#F2ECE1] text-[#B89352]">
                  <Icon className="w-5 h-5" strokeWidth={1.6} />
                </div>
                <h3 className="font-serif-display text-2xl font-medium text-[#1C1917]">
                  {item.title}
                </h3>
                <p className="text-sm text-[#6E655D] leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
