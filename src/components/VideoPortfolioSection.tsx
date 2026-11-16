import { useEffect, useMemo, useState } from 'react';
import { Film, Play, X } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { StudioImage } from './StudioImage';
import type { WeddingVideo } from '../types/studio';

interface VideoPortfolioSectionProps {
  limit?: number;
  showViewAllButton?: boolean;
  darkTheme?: boolean;
}

function getEmbedUrl(video: WeddingVideo): string | null {
  if (video.videoType === 'youtube') {
    const match =
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/.exec(
        video.videoUrl
      );
    if (match?.[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`;
    }
    return video.videoUrl;
  }
  if (video.videoType === 'vimeo') {
    const match = /vimeo\.com\/(?:video\/)?(\d+)/.exec(video.videoUrl);
    if (match?.[1]) {
      return `https://player.vimeo.com/video/${match[1]}?autoplay=1`;
    }
    return video.videoUrl;
  }
  return null;
}

export function VideoPortfolioSection({
  limit,
  showViewAllButton = false,
  darkTheme = true,
}: VideoPortfolioSectionProps) {
  const { data, navigate } = useStudio();
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [playingVideo, setPlayingVideo] = useState<WeddingVideo | null>(null);
  const [videoPlaybackError, setVideoPlaybackError] = useState(false);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(data.videos.map((v) => v.category)));
    return ['All', ...unique];
  }, [data.videos]);

  const visibleVideos = useMemo(() => {
    const list =
      activeFilter === 'All'
        ? data.videos
        : data.videos.filter((v) => v.category === activeFilter);
    return limit ? list.slice(0, limit) : list;
  }, [data.videos, activeFilter, limit]);

  useEffect(() => {
    if (!playingVideo) return;
    setVideoPlaybackError(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPlayingVideo(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playingVideo]);

  return (
    <section
      className={`py-20 lg:py-28 ${
        darkTheme ? 'bg-[#141210] text-[#FAF8F5]' : 'bg-[#F2ECE1] text-[#1C1917]'
      }`}
      aria-labelledby="videos-heading"
    >
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs tracking-[0.24em] uppercase text-[#D4B478] font-semibold">
              Wedding Cinema
            </p>
            <h2
              id="videos-heading"
              className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-balance"
            >
              {data.homepage.videosHeading}
            </h2>
          </div>

          {showViewAllButton && (
            <button
              type="button"
              onClick={() => navigate('/videography')}
              className={`self-start lg:self-end px-6 py-3 border text-xs font-semibold tracking-[0.14em] uppercase transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                darkTheme
                  ? 'border-[#FAF8F5]/25 text-[#FAF8F5] hover:border-[#D4B478] hover:text-[#D4B478]'
                  : 'border-[#1C1917]/25 text-[#1C1917] hover:border-[#B89352] hover:text-[#B89352]'
              }`}
            >
              Explore Wedding Videography
            </button>
          )}
        </div>

        {/* Category Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pb-8 border-b border-current/10 mb-10">
          {categories.map((cat) => {
            const active = activeFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveFilter(cat)}
                className={`px-4 py-2 text-xs font-medium tracking-[0.06em] whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#B89352] text-[#FAF8F5]'
                    : darkTheme
                    ? 'bg-[#1F1C18] text-[#FAF8F5]/75 hover:bg-[#2B2721] hover:text-[#FAF8F5]'
                    : 'bg-[#FAF8F5] text-[#1C1917]/75 hover:bg-[#E8DEC8]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Film Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleVideos.map((video) => (
            <article
              key={video.id}
              className={`group overflow-hidden border ${
                darkTheme
                  ? 'bg-[#1C1917] border-[#FAF8F5]/10'
                  : 'bg-[#FAF8F5] border-[#1C1917]/10'
              }`}
            >
              <button
                type="button"
                onClick={() => setPlayingVideo(video)}
                aria-label={`Play ${video.title}`}
                className="block w-full text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[#B89352]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[#141210]">
                  <StudioImage
                    src={video.thumbnailUrl}
                    alt={`${video.coupleNames} — ${video.title}`}
                    fallbackTitle={video.coupleNames}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141210]/80 via-[#141210]/25 to-transparent flex items-center justify-center">
                    <span className="w-16 h-16 rounded-full bg-[#FAF8F5]/95 text-[#1C1917] flex items-center justify-center shadow-xl transition-transform duration-200 group-hover:scale-110 group-hover:bg-[#B89352] group-hover:text-[#FAF8F5]">
                      <Play className="w-6 h-6 ml-0.5 fill-current" />
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-[#FAF8F5]/90">
                    <span>{video.coupleNames}</span>
                    <span className="tabular-nums font-medium">{video.duration}</span>
                  </div>
                </div>
                <div className="p-6 space-y-2">
                  <p className="text-xs text-[#D4B478] tracking-[0.06em]">
                    {video.category} · {video.location}
                  </p>
                  <h3 className="font-serif-display text-xl sm:text-2xl font-medium leading-snug group-hover:text-[#D4B478] transition-colors">
                    {video.title}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed line-clamp-2 ${
                      darkTheme ? 'text-[#FAF8F5]/70' : 'text-[#6E655D]'
                    }`}
                  >
                    {video.description}
                  </p>
                </div>
              </button>
            </article>
          ))}
        </div>
      </div>

      {/* Fullscreen Video Modal Player */}
      {playingVideo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={playingVideo.title}
          className="fixed inset-0 z-50 bg-[#0D0C0A]/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8"
        >
          <div className="max-w-6xl w-full mx-auto flex items-center justify-between text-[#FAF8F5]">
            <div>
              <p className="text-xs text-[#D4B478] tracking-[0.12em] uppercase">
                {playingVideo.coupleNames} · {playingVideo.category}
              </p>
              <h3 className="font-serif-display text-xl sm:text-2xl font-medium">
                {playingVideo.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setPlayingVideo(null)}
              aria-label="Close video player"
              className="inline-flex items-center gap-2 px-3 py-2 text-xs tracking-[0.14em] uppercase text-[#FAF8F5] hover:text-[#D4B478] cursor-pointer"
            >
              <span>Close</span>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-w-6xl w-full mx-auto flex-1 flex items-center justify-center my-4">
            <div className="w-full aspect-video bg-black border border-[#FAF8F5]/15 overflow-hidden relative">
              {getEmbedUrl(playingVideo) ? (
                <iframe
                  src={getEmbedUrl(playingVideo) || ''}
                  title={playingVideo.title}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : videoPlaybackError ? (
                <div className="w-full h-full relative flex items-center justify-center">
                  <StudioImage
                    src={playingVideo.thumbnailUrl}
                    alt={playingVideo.title}
                    className="w-full h-full object-cover opacity-45"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-[#FAF8F5]">
                    <Film className="w-10 h-10 text-[#D4B478] mb-3" />
                    <p className="font-serif-display text-2xl mb-2">
                      Film Preview Ready in Studio
                    </p>
                    <p className="text-sm text-[#FAF8F5]/75 max-w-md">
                      External video stream could not be reached in this preview network. You can upload an MP4 reel or configure a YouTube/Vimeo film URL in the Admin Dashboard.
                    </p>
                  </div>
                </div>
              ) : (
                <video
                  src={playingVideo.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  onError={() => setVideoPlaybackError(true)}
                  className="w-full h-full object-contain bg-black"
                />
              )}
            </div>
          </div>

          <div className="max-w-6xl w-full mx-auto text-sm text-[#FAF8F5]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p>{playingVideo.description}</p>
            <span className="text-xs text-[#D4B478] shrink-0">
              {playingVideo.location} · {playingVideo.duration}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
