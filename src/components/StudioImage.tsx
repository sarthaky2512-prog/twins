import { useState } from 'react';
import { Camera } from 'lucide-react';
import { resolveStudioImage } from '../lib/studioImages';

interface StudioImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  loading?: 'lazy' | 'eager';
}

export function StudioImage({
  src,
  alt,
  className = '',
  fallbackTitle,
  loading = 'lazy',
}: StudioImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveStudioImage(src);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F2ECE1] via-[#E8DEC8] to-[#D8C9AA] text-[#6E655D] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Camera className="w-7 h-7 text-[#B89352] mb-2" strokeWidth={1.5} />
        <span className="font-serif-display text-lg text-[#1C1917] leading-snug">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
