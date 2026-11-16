import { useMemo, useState } from 'react';
import {
  Check,
  Edit3,
  Eye,
  Film,
  Image as ImageIcon,
  Plus,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { StudioImage } from '../../components/StudioImage';
import { compressImageFile, fileToDataUrl } from '../../lib/imageCompression';
import type {
  GalleryCategory,
  GalleryItem,
  MediaAsset,
  TestimonialItem,
  WeddingPackage,
  WeddingVideo,
} from '../../types/studio';
import type { PanelHelpers } from './AdminContentPanels';
import { ConfirmDialog, MediaPickerModal } from './AdminMediaModal';

const VIDEO_CATEGORIES = [
  'Cinematic Wedding Films',
  'Pre-Wedding Videos',
  'Highlight Reels',
  'Traditional Ceremony Films',
  'Reception & First Dance',
  'Engagement Stories',
];

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ---------------------------------------------------------------------------
// 1. PORTFOLIO GALLERY & CATEGORIES MANAGEMENT
// ---------------------------------------------------------------------------
export function GalleryManagerPanel({
  gallery,
  categories,
  helpers,
}: {
  gallery: GalleryItem[];
  categories: GalleryCategory[];
  helpers: PanelHelpers;
}) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);

  const blankItem: GalleryItem = {
    id: '',
    title: '',
    category: categories[0]?.name || 'Luxury Weddings',
    location: 'South Australia',
    dateLabel: '2026 Collection',
    imageUrl: 'img://hero',
    altText: '',
    aspect: 'landscape',
    featured: false,
    caption: '',
  };

  const filtered = useMemo(
    () =>
      gallery.filter((g) => {
        const matchCat = catFilter === 'All' || g.category === catFilter;
        const q = search.trim().toLowerCase();
        const matchQ =
          !q ||
          g.title.toLowerCase().includes(q) ||
          g.location.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q);
        return matchCat && matchQ;
      }),
    [gallery, catFilter, search]
  );

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCatName.trim(), description: newCatDesc.trim() }),
    });
    const json = await res.json();
    if (!res.ok) {
      helpers.notifyError(json.error || 'Could not add category.');
      return;
    }
    setNewCatName('');
    setNewCatDesc('');
    await helpers.refreshAll();
    helpers.notify(`Category "${json.category.name}" added.`);
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await helpers.refreshAll();
      helpers.notify(`Category "${name}" removed.`);
    }
  };

  const handleDirectUpload = async (file: File) => {
    if (!editing) return;
    setUploadingPhoto(true);
    try {
      const { dataUrl } = await compressImageFile(file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          dataUrl,
          title: editing.title || file.name.replace(/\.[^.]+$/, ''),
          category: editing.category || 'Portfolio Gallery',
        }),
      });
      const json = await res.json();
      if (res.ok && json.url) {
        setEditing({ ...editing, imageUrl: json.url });
        await helpers.refreshAll();
        helpers.notify('Photo compressed & uploaded to studio storage.');
      } else {
        helpers.notifyError(json.error || 'Upload failed.');
      }
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const isNew = !editing.id;
    const url = isNew ? '/api/admin/gallery' : `/api/admin/gallery/${editing.id}`;
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    const json = await res.json();
    if (!res.ok) {
      helpers.notifyError(json.error || 'Could not save gallery item.');
      return;
    }
    setEditing(null);
    setCreating(false);
    await helpers.refreshAll();
    helpers.notify(isNew ? 'Photo added to portfolio.' : 'Gallery photo updated.');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/gallery/${deleteTarget.id}`, { method: 'DELETE' });
    if (res.ok) {
      await helpers.refreshAll();
      helpers.notify(`Removed "${deleteTarget.title}" from portfolio.`);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-3xl text-[#1C1917]">Portfolio Gallery</h2>
          <p className="text-sm text-[#6E655D]">
            Organize wedding photography categories, upload compressed high-res frames, and curate homepage highlights.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditing(blankItem);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#B89352] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Portfolio Photo</span>
        </button>
      </div>

      {/* Category Manager */}
      <div className="bg-white border border-[#1C1917]/10 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B89352]">
            Gallery Categories ({categories.length})
          </p>
          <form onSubmit={handleAddCategory} className="flex flex-wrap gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="New category name"
              className="px-3 py-1.5 border border-[#1C1917]/15 text-xs"
            />
            <input
              type="text"
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
              placeholder="Short description (optional)"
              className="px-3 py-1.5 border border-[#1C1917]/15 text-xs"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-[#1C1917] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#B89352] cursor-pointer"
            >
              Add Category
            </button>
          </form>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FAF8F5] border border-[#1C1917]/12 text-xs text-[#1C1917]"
            >
              <span>{cat.name}</span>
              <button
                type="button"
                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                aria-label={`Delete category ${cat.name}`}
                className="text-[#6E655D] hover:text-red-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="bg-white border border-[#1C1917]/15 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1C1917]/10 pb-3">
            <h3 className="font-serif-display text-2xl">
              {creating ? 'Add New Gallery Photograph' : `Edit "${editing.title}"`}
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setCreating(false);
              }}
              className="p-1.5 text-[#6E655D] hover:text-[#1C1917] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Photo Title
              </label>
              <input
                type="text"
                required
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Venue / Location
              </label>
              <input
                type="text"
                value={editing.location}
                onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Orientation / Aspect
              </label>
              <select
                value={editing.aspect}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    aspect: e.target.value as GalleryItem['aspect'],
                  })
                }
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm bg-white"
              >
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
                <option value="square">Square</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                SEO Alt Text
              </label>
              <input
                type="text"
                value={editing.altText}
                onChange={(e) => setEditing({ ...editing, altText: e.target.value })}
                placeholder="Descriptive alt text for search engines & screen readers"
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Caption / Story Note
              </label>
              <input
                type="text"
                value={editing.caption}
                onChange={(e) => setEditing({ ...editing, caption: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 bg-[#FAF8F5] p-4 border border-[#1C1917]/10">
            <div className="flex items-center gap-4">
              <div className="w-20 h-14 bg-[#E8DEC8] overflow-hidden shrink-0">
                <StudioImage src={editing.imageUrl} alt={editing.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1C1917] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#B89352] cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleDirectUpload(f);
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setPickingImage(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider hover:border-[#B89352] cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Media Library</span>
                </button>
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={editing.featured}
                onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                className="accent-[#B89352]"
              />
              <span>Featured on Homepage</span>
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#1C1917] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#B89352] cursor-pointer"
            >
              Save Photo
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search gallery by title, venue, or category..."
          className="flex-1 min-w-[240px] px-3.5 py-2.5 bg-white border border-[#1C1917]/15 text-sm"
        />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-[#1C1917]/15 text-sm"
        >
          <option value="All">All Categories ({gallery.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((item) => (
          <div key={item.id} className="bg-white border border-[#1C1917]/10 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="aspect-[4/3] bg-[#E8DEC8] overflow-hidden relative">
                <StudioImage src={item.imageUrl} alt={item.altText || item.title} className="w-full h-full object-cover" />
                {item.featured && (
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#B89352] text-white text-[10px] font-semibold uppercase tracking-wider">
                    Featured
                  </span>
                )}
              </div>
              <div className="p-3.5 space-y-1">
                <p className="text-[11px] uppercase tracking-wider text-[#B89352] font-semibold truncate">
                  {item.category}
                </p>
                <h4 className="font-serif-display text-lg text-[#1C1917] truncate">{item.title}</h4>
                <p className="text-xs text-[#6E655D] truncate">{item.location}</p>
              </div>
            </div>
            <div className="px-3.5 pb-3.5 pt-2 border-t border-[#1C1917]/8 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setEditing(structuredClone(item));
                }}
                className="px-3 py-1.5 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider hover:border-[#B89352] cursor-pointer"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(item)}
                className="p-1.5 text-red-700 hover:bg-red-50 cursor-pointer"
                aria-label="Delete photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <MediaPickerModal
        open={pickingImage}
        media={helpers.media}
        onClose={() => setPickingImage(false)}
        onUploadComplete={helpers.refreshAll}
        onSelect={(url) => editing && setEditing({ ...editing, imageUrl: url })}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Portfolio Photo"
        message={`Remove "${deleteTarget?.title}" from your public portfolio gallery?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. WEDDING VIDEOS MANAGEMENT
// ---------------------------------------------------------------------------
export function VideosManagerPanel({
  videos,
  helpers,
}: {
  videos: WeddingVideo[];
  helpers: PanelHelpers;
}) {
  const [catFilter, setCatFilter] = useState('All');
  const [editing, setEditing] = useState<WeddingVideo | null>(null);
  const [creating, setCreating] = useState(false);
  const [pickingThumb, setPickingThumb] = useState(false);
  const [uploadingMp4, setUploadingMp4] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WeddingVideo | null>(null);

  const blankVideo: WeddingVideo = {
    id: '',
    title: '',
    coupleNames: '',
    category: VIDEO_CATEGORIES[0],
    location: 'South Australia',
    duration: '04:30',
    thumbnailUrl: 'img://reception',
    videoType: 'youtube',
    videoUrl: '',
    description: '',
    featured: true,
    published: true,
  };

  const filtered = videos.filter((v) => catFilter === 'All' || v.category === catFilter);

  const handleMp4Upload = async (file: File) => {
    if (!editing) return;
    if (file.size > 16 * 1024 * 1024) {
      helpers.notifyError('For MP4 files above 16MB, host on Supabase/Vimeo/YouTube and paste the direct video URL.');
      return;
    }
    setUploadingMp4(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          dataUrl,
          title: editing.title || file.name,
          category: 'Wedding Videos',
          addToLibrary: false,
        }),
      });
      const json = await res.json();
      if (res.ok && json.url) {
        setEditing({ ...editing, videoType: 'mp4', videoUrl: json.url });
        helpers.notify('MP4 film uploaded to studio storage.');
      } else {
        helpers.notifyError(json.error || 'MP4 upload failed.');
      }
    } finally {
      setUploadingMp4(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const isNew = !editing.id;
    const res = await fetch(isNew ? '/api/admin/videos' : `/api/admin/videos/${editing.id}`, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    const json = await res.json();
    if (!res.ok) {
      helpers.notifyError(json.error || 'Could not save wedding video.');
      return;
    }
    setEditing(null);
    setCreating(false);
    await helpers.refreshAll();
    helpers.notify(isNew ? 'Wedding film added.' : 'Wedding film updated.');
  };

  const handleSetHomepageHeroVideo = async (videoUrl: string) => {
    const res = await fetch('/api/admin/homepage', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ heroVideoUrl: videoUrl }),
    });
    if (res.ok) {
      await helpers.refreshAll();
      helpers.notify('Homepage hero background video updated.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/admin/videos/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    await helpers.refreshAll();
    helpers.notify('Wedding video deleted.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-3xl text-[#1C1917]">Wedding Videos</h2>
          <p className="text-sm text-[#6E655D]">
            Manage MP4 reels, YouTube &amp; Vimeo films across 6 cinema categories, and assign hero background videos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditing(blankVideo);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#B89352] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Wedding Video</span>
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="bg-white border border-[#1C1917]/15 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1C1917]/10 pb-3">
            <h3 className="font-serif-display text-2xl">
              {creating ? 'Add Wedding Film' : `Edit "${editing.title}"`}
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setCreating(false);
              }}
              className="p-1.5 text-[#6E655D] hover:text-[#1C1917] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Film Title
              </label>
              <input
                type="text"
                required
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Couple Names
              </label>
              <input
                type="text"
                required
                value={editing.coupleNames}
                onChange={(e) => setEditing({ ...editing, coupleNames: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm bg-white"
              >
                {VIDEO_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Source Type
              </label>
              <select
                value={editing.videoType}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    videoType: e.target.value as WeddingVideo['videoType'],
                  })
                }
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm bg-white"
              >
                <option value="youtube">YouTube Link</option>
                <option value="vimeo">Vimeo Link</option>
                <option value="mp4">Direct MP4 Video</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Video URL or Upload MP4
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={editing.videoUrl}
                  onChange={(e) => setEditing({ ...editing, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... or /uploads/film.mp4"
                  className="flex-1 px-3 py-2 border border-[#1C1917]/15 text-sm"
                />
                <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider hover:border-[#B89352] cursor-pointer whitespace-nowrap">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingMp4 ? 'Uploading...' : 'Upload MP4'}</span>
                  <input
                    type="file"
                    accept="video/mp4"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleMp4Upload(f);
                    }}
                  />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Location &amp; Duration
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={editing.location}
                  onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                  placeholder="Barossa Valley"
                  className="px-3 py-2 border border-[#1C1917]/15 text-sm"
                />
                <input
                  type="text"
                  value={editing.duration}
                  onChange={(e) => setEditing({ ...editing, duration: e.target.value })}
                  placeholder="04:30"
                  className="px-3 py-2 border border-[#1C1917]/15 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Film Synopsis
            </label>
            <textarea
              rows={2}
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#FAF8F5] p-4 border border-[#1C1917]/10">
            <div className="flex items-center gap-3">
              <div className="w-20 h-12 bg-[#141210] overflow-hidden">
                <StudioImage src={editing.thumbnailUrl} alt={editing.title} className="w-full h-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => setPickingThumb(true)}
                className="px-3 py-2 bg-white border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider hover:border-[#B89352] cursor-pointer"
              >
                Choose Thumbnail
              </button>
            </div>
            <div className="flex items-center gap-5">
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.published}
                  onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                  className="accent-[#B89352]"
                />
                <span>Published</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.featured}
                  onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                  className="accent-[#B89352]"
                />
                <span>Featured</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#1C1917] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#B89352] cursor-pointer"
            >
              Save Video
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        {['All', ...VIDEO_CATEGORIES].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCatFilter(cat)}
            className={`px-3.5 py-1.5 text-xs font-medium border whitespace-nowrap cursor-pointer ${
              catFilter === cat
                ? 'bg-[#B89352] text-white border-[#B89352]'
                : 'bg-white text-[#1C1917] border-[#1C1917]/15'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((vid) => (
          <div key={vid.id} className="bg-white border border-[#1C1917]/10 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="aspect-[16/9] bg-[#141210] relative overflow-hidden">
                <StudioImage src={vid.thumbnailUrl} alt={vid.title} className="w-full h-full object-cover opacity-90" />
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#141210]/85 text-[#D4B478] text-[10px] uppercase tracking-wider">
                  {vid.videoType.toUpperCase()} · {vid.duration}
                </span>
                {!vid.published && (
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-red-800 text-white text-[10px] uppercase">
                    Draft
                  </span>
                )}
              </div>
              <div className="p-4 space-y-1.5">
                <p className="text-[11px] uppercase tracking-wider text-[#B89352] font-semibold">
                  {vid.category}
                </p>
                <h4 className="font-serif-display text-xl text-[#1C1917]">{vid.title}</h4>
                <p className="text-xs text-[#6E655D]">
                  {vid.coupleNames} · {vid.location}
                </p>
              </div>
            </div>
            <div className="px-4 pb-4 pt-2 border-t border-[#1C1917]/8 flex flex-wrap items-center justify-between gap-2">
              {vid.videoType === 'mp4' ? (
                <button
                  type="button"
                  onClick={() => handleSetHomepageHeroVideo(vid.videoUrl)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#B89352] hover:underline cursor-pointer"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Use as Hero Video</span>
                </button>
              ) : (
                <span className="text-[11px] text-[#6E655D]">Embed Link</span>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setEditing(structuredClone(vid));
                  }}
                  className="px-3 py-1.5 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider hover:border-[#B89352] cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(vid)}
                  className="p-1.5 text-red-700 hover:bg-red-50 cursor-pointer"
                  aria-label="Delete video"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <MediaPickerModal
        open={pickingThumb}
        media={helpers.media}
        onClose={() => setPickingThumb(false)}
        onUploadComplete={helpers.refreshAll}
        onSelect={(url) => editing && setEditing({ ...editing, thumbnailUrl: url })}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Wedding Video"
        message={`Remove "${deleteTarget?.title}" from the video showcase?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. WEDDING PACKAGES MANAGEMENT
// ---------------------------------------------------------------------------
export function PackagesManagerPanel({
  packages,
  helpers,
}: {
  packages: WeddingPackage[];
  helpers: PanelHelpers;
}) {
  const [editing, setEditing] = useState<WeddingPackage | null>(null);
  const [creating, setCreating] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WeddingPackage | null>(null);

  const blankPkg: WeddingPackage = {
    id: '',
    name: '',
    tierLabel: 'Signature Collection',
    subtitle: '',
    priceDisplay: '',
    pricingLabel: 'Contact for Pricing',
    customQuoteEnabled: true,
    imageUrl: 'img://hero',
    highlighted: false,
    published: true,
    orderIndex: packages.length + 1,
    idealFor: '',
    features: ['Full-day photography coverage', 'High-resolution online wedding gallery'],
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const isNew = !editing.id;
    const res = await fetch(isNew ? '/api/admin/packages' : `/api/admin/packages/${editing.id}`, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    const json = await res.json();
    if (!res.ok) {
      helpers.notifyError(json.error || 'Could not save package.');
      return;
    }
    setEditing(null);
    setCreating(false);
    await helpers.refreshAll();
    helpers.notify(isNew ? 'Wedding package created.' : 'Wedding package updated.');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/admin/packages/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    await helpers.refreshAll();
    helpers.notify('Wedding package deleted.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-3xl text-[#1C1917]">Wedding Packages</h2>
          <p className="text-sm text-[#6E655D]">
            Customize wedding collections, optional pricing labels, deliverables, featured badge, and visibility.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditing(blankPkg);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#B89352] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Package</span>
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="bg-white border border-[#1C1917]/15 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1C1917]/10 pb-3">
            <h3 className="font-serif-display text-2xl">
              {creating ? 'Create Wedding Package' : `Edit ${editing.name}`}
            </h3>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="p-1.5 text-[#6E655D] hover:text-[#1C1917] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Package Name
              </label>
              <input
                type="text"
                required
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Tier Label
              </label>
              <input
                type="text"
                value={editing.tierLabel}
                onChange={(e) => setEditing({ ...editing, tierLabel: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Price (Optional, e.g. $3,800)
              </label>
              <input
                type="text"
                value={editing.priceDisplay}
                onChange={(e) => setEditing({ ...editing, priceDisplay: e.target.value })}
                placeholder="Leave blank for Contact for Pricing"
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                CTA / Pricing Label
              </label>
              <input
                type="text"
                value={editing.pricingLabel}
                onChange={(e) => setEditing({ ...editing, pricingLabel: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Ideal For
              </label>
              <input
                type="text"
                value={editing.idealFor}
                onChange={(e) => setEditing({ ...editing, idealFor: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Display Order
              </label>
              <input
                type="number"
                value={editing.orderIndex}
                onChange={(e) => setEditing({ ...editing, orderIndex: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Package Description / Subtitle
            </label>
            <input
              type="text"
              value={editing.subtitle}
              onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
              className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Included Services (one per line)
              </label>
              <textarea
                rows={5}
                value={editing.features.join('\n')}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    features: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-20 h-14 bg-[#E8DEC8] overflow-hidden">
                  <StudioImage src={editing.imageUrl} alt={editing.name} className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => setPickingImage(true)}
                  className="px-3.5 py-2 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider cursor-pointer"
                >
                  Choose Package Image
                </button>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.highlighted}
                    onChange={(e) => setEditing({ ...editing, highlighted: e.target.checked })}
                    className="accent-[#B89352]"
                  />
                  <span>Highlight as Signature Recommended Package</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.published}
                    onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                    className="accent-[#B89352]"
                  />
                  <span>Published on Website</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.customQuoteEnabled}
                    onChange={(e) => setEditing({ ...editing, customQuoteEnabled: e.target.checked })}
                    className="accent-[#B89352]"
                  />
                  <span>Enable Custom Quote Request</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#1C1917] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#B89352] cursor-pointer"
            >
              Save Package
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`bg-white border p-5 flex flex-col justify-between space-y-4 ${
              pkg.highlighted ? 'border-[#B89352]' : 'border-[#1C1917]/10'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#B89352]">
                  {pkg.tierLabel}
                </span>
                {!pkg.published && (
                  <span className="px-2 py-0.5 bg-stone-100 text-stone-700 text-[10px] uppercase">
                    Draft
                  </span>
                )}
              </div>
              <h3 className="font-serif-display text-2xl text-[#1C1917]">{pkg.name}</h3>
              <p className="text-sm font-medium text-[#1C1917]">
                {pkg.priceDisplay || pkg.pricingLabel}
              </p>
              <p className="text-xs text-[#6E655D]">{pkg.subtitle}</p>
              <ul className="space-y-1.5 pt-2 border-t border-[#1C1917]/8">
                {pkg.features.slice(0, 5).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#1C1917]">
                    <Check className="w-3.5 h-3.5 text-[#B89352] mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-3 border-t border-[#1C1917]/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setEditing(structuredClone(pkg));
                }}
                className="px-3.5 py-1.5 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider hover:border-[#B89352] cursor-pointer"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(pkg)}
                className="p-1.5 text-red-700 hover:bg-red-50 cursor-pointer"
                aria-label="Delete package"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <MediaPickerModal
        open={pickingImage}
        media={helpers.media}
        onClose={() => setPickingImage(false)}
        onUploadComplete={helpers.refreshAll}
        onSelect={(url) => editing && setEditing({ ...editing, imageUrl: url })}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Wedding Package"
        message={`Permanently delete "${deleteTarget?.name}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. TESTIMONIALS MANAGEMENT
// ---------------------------------------------------------------------------
export function TestimonialsManagerPanel({
  testimonials,
  helpers,
}: {
  testimonials: TestimonialItem[];
  helpers: PanelHelpers;
}) {
  const [editing, setEditing] = useState<TestimonialItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TestimonialItem | null>(null);

  const blankTest: TestimonialItem = {
    id: '',
    coupleName: '',
    weddingLocation: 'Adelaide, South Australia',
    serviceUsed: 'Wedding Photography & Videography',
    quote: '',
    rating: 5,
    verified: true,
    isSample: false,
    published: true,
    imageUrl: 'img://hero',
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const isNew = !editing.id;
    const res = await fetch(
      isNew ? '/api/admin/testimonials' : `/api/admin/testimonials/${editing.id}`,
      {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      }
    );
    const json = await res.json();
    if (!res.ok) {
      helpers.notifyError(json.error || 'Could not save testimonial.');
      return;
    }
    setEditing(null);
    setCreating(false);
    await helpers.refreshAll();
    helpers.notify(isNew ? 'Testimonial added.' : 'Testimonial updated.');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/admin/testimonials/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    await helpers.refreshAll();
    helpers.notify('Testimonial removed.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-3xl text-[#1C1917]">Testimonials</h2>
          <p className="text-sm text-[#6E655D]">
            Add verified couple reviews, manage ratings &amp; photos, and toggle published visibility.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditing(blankTest);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#B89352] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Client Review</span>
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="bg-white border border-[#1C1917]/15 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1C1917]/10 pb-3">
            <h3 className="font-serif-display text-2xl">
              {creating ? 'Add Couple Testimonial' : `Edit "${editing.coupleName}"`}
            </h3>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="p-1.5 text-[#6E655D] hover:text-[#1C1917] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Couple / Customer Name
              </label>
              <input
                type="text"
                required
                value={editing.coupleName}
                onChange={(e) => setEditing({ ...editing, coupleName: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Wedding Location
              </label>
              <input
                type="text"
                value={editing.weddingLocation}
                onChange={(e) => setEditing({ ...editing, weddingLocation: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Service Used &amp; Rating
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editing.serviceUsed}
                  onChange={(e) => setEditing({ ...editing, serviceUsed: e.target.value })}
                  className="flex-1 px-3 py-2 border border-[#1C1917]/15 text-sm"
                />
                <select
                  value={editing.rating}
                  onChange={(e) => setEditing({ ...editing, rating: Number(e.target.value) })}
                  className="px-2.5 py-2 border border-[#1C1917]/15 text-sm bg-white"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} ★
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Review Quote
            </label>
            <textarea
              rows={3}
              required
              value={editing.quote}
              onChange={(e) => setEditing({ ...editing, quote: e.target.value })}
              className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#FAF8F5] p-4 border border-[#1C1917]/10">
            <div className="flex items-center gap-3">
              <div className="w-16 h-12 bg-[#E8DEC8] overflow-hidden">
                <StudioImage src={editing.imageUrl} alt={editing.coupleName} className="w-full h-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => setPickingImage(true)}
                className="px-3.5 py-2 bg-white border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Choose Photo
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.published}
                  onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                  className="accent-[#B89352]"
                />
                <span>Published</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.isSample}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      isSample: e.target.checked,
                      verified: e.target.checked ? false : editing.verified,
                    })
                  }
                  className="accent-[#B89352]"
                />
                <span>Sample Placeholder</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  disabled={editing.isSample}
                  checked={!editing.isSample && editing.verified}
                  onChange={(e) => setEditing({ ...editing, verified: e.target.checked })}
                  className="accent-[#B89352]"
                />
                <span>Verified Client Review</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#1C1917] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#B89352] cursor-pointer"
            >
              Save Review
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {testimonials.map((t) => (
          <div key={t.id} className="bg-white border border-[#1C1917]/10 p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-[#E8DEC8] overflow-hidden shrink-0">
                <StudioImage src={t.imageUrl} alt={t.coupleName} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-serif-display text-xl text-[#1C1917]">{t.coupleName}</h4>
                  <span
                    className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold ${
                      t.verified
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {t.verified ? 'Verified Review' : 'Sample Preview'}
                  </span>
                  {!t.published && (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] uppercase">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6E655D]">
                  {t.weddingLocation} · {t.serviceUsed}
                </p>
                <div className="flex items-center gap-0.5 pt-0.5">
                  {Array.from({ length: t.rating }).map((_, idx) => (
                    <Star key={idx} className="w-3.5 h-3.5 fill-[#B89352] text-[#B89352]" />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-sm text-[#1C1917]/85 italic leading-relaxed">“{t.quote}”</p>
            <div className="pt-3 border-t border-[#1C1917]/8 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setEditing(structuredClone(t));
                }}
                className="px-3.5 py-1.5 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider hover:border-[#B89352] cursor-pointer"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(t)}
                className="p-1.5 text-red-700 hover:bg-red-50 cursor-pointer"
                aria-label="Delete review"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <MediaPickerModal
        open={pickingImage}
        media={helpers.media}
        onClose={() => setPickingImage(false)}
        onUploadComplete={helpers.refreshAll}
        onSelect={(url) => editing && setEditing({ ...editing, imageUrl: url })}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Testimonial"
        message={`Delete testimonial from "${deleteTarget?.coupleName}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. MEDIA LIBRARY (MULTI-UPLOAD + COMPRESSION + REPLACE + REF CHECK)
// ---------------------------------------------------------------------------
export function MediaLibraryPanel({
  media,
  helpers,
}: {
  media: MediaAsset[];
  helpers: PanelHelpers;
}) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<MediaAsset | null>(null);
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    asset: MediaAsset;
    references: string[];
  } | null>(null);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(media.map((m) => m.category)))],
    [media]
  );

  const filtered = media.filter((m) => {
    const matchCat = catFilter === 'All' || m.category === catFilter;
    const q = search.trim().toLowerCase();
    const matchQ =
      !q ||
      m.title.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.altText.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const handleMultiUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let uploadedCount = 0;
    let savedBytes = 0;
    try {
      for (const file of Array.from(files)) {
        const compressed = await compressImageFile(file);
        savedBytes += Math.max(0, compressed.originalBytes - compressed.compressedBytes);
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            dataUrl: compressed.dataUrl,
            title: file.name.replace(/\.[^.]+$/, ''),
            category: catFilter !== 'All' ? catFilter : 'Studio Uploads',
          }),
        });
        if (res.ok) uploadedCount += 1;
      }
      await helpers.refreshAll();
      helpers.notify(
        `Uploaded ${uploadedCount} image(s) (optimized & saved ${formatBytes(savedBytes)}).`
      );
    } catch (err) {
      helpers.notifyError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleReplaceImageFile = async (file: File) => {
    if (!editing) return;
    const { dataUrl } = await compressImageFile(file);
    const upRes = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        dataUrl,
        addToLibrary: false,
      }),
    });
    const upJson = await upRes.json();
    if (!upRes.ok || !upJson.url) {
      helpers.notifyError(upJson.error || 'Could not upload replacement file.');
      return;
    }
    const saveRes = await fetch(`/api/admin/media/${editing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editing, url: upJson.url }),
    });
    if (saveRes.ok) {
      setEditing(null);
      await helpers.refreshAll();
      helpers.notify('Media replaced and updated across all live website references.');
    }
  };

  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const res = await fetch(`/api/admin/media/${editing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    if (res.ok) {
      setEditing(null);
      await helpers.refreshAll();
      helpers.notify('Media metadata saved.');
    }
  };

  const requestDelete = async (asset: MediaAsset) => {
    const res = await fetch(`/api/admin/media/${asset.id}/references`);
    const json = await res.json();
    setDeleteConfirm({ asset, references: json.references || [] });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const force = deleteConfirm.references.length > 0 ? '?force=true' : '';
    const res = await fetch(`/api/admin/media/${deleteConfirm.asset.id}${force}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      await helpers.refreshAll();
      helpers.notify(`Deleted "${deleteConfirm.asset.title}" from Media Library.`);
    } else {
      const j = await res.json();
      helpers.notifyError(j.error || 'Could not delete asset.');
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-3xl text-[#1C1917]">Media Library</h2>
          <p className="text-sm text-[#6E655D]">
            Central asset vault with automatic image compression, metadata editing, live file replacement, and reference checks.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#B89352] cursor-pointer">
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Compressing & Uploading...' : 'Upload Images (Multi)'}</span>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleMultiUpload(e.target.files)}
          />
        </label>
      </div>

      {editing && (
        <form onSubmit={handleSaveMetadata} className="bg-white border border-[#1C1917]/15 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1C1917]/10 pb-3">
            <h3 className="font-serif-display text-2xl">Edit Media Asset</h3>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="p-1.5 text-[#6E655D] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Title</label>
              <input
                type="text"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Category</label>
              <input
                type="text"
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">SEO Alt Text</label>
              <input
                type="text"
                value={editing.altText}
                onChange={(e) => setEditing({ ...editing, altText: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 bg-[#FAF8F5] p-4 border border-[#1C1917]/10">
            <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider hover:border-[#B89352] cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Replace Image File (Updates Live References)</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleReplaceImageFile(f);
                }}
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#1C1917] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#B89352] cursor-pointer"
              >
                Save Metadata
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search media by filename, alt text, or category..."
          className="flex-1 min-w-[220px] px-3.5 py-2 bg-white border border-[#1C1917]/15 text-sm"
        />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="px-3.5 py-2 bg-white border border-[#1C1917]/15 text-sm"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filtered.map((asset) => (
          <div key={asset.id} className="bg-white border border-[#1C1917]/10 overflow-hidden flex flex-col justify-between">
            <div>
              <button
                type="button"
                onClick={() => setPreviewAsset(asset)}
                className="block w-full aspect-[4/3] bg-[#E8DEC8] overflow-hidden cursor-pointer"
              >
                <StudioImage src={asset.url} alt={asset.altText || asset.title} className="w-full h-full object-cover" />
              </button>
              <div className="p-3 space-y-1">
                <p className="text-xs font-semibold text-[#1C1917] truncate">{asset.title}</p>
                <p className="text-[11px] text-[#6E655D] truncate">{asset.category}</p>
                <p className="text-[10px] text-[#6E655D]/80">{formatBytes(asset.sizeBytes)}</p>
              </div>
            </div>
            <div className="px-3 pb-3 pt-2 border-t border-[#1C1917]/8 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPreviewAsset(asset)}
                aria-label="Preview asset"
                className="p-1 text-[#6E655D] hover:text-[#1C1917] cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEditing(structuredClone(asset))}
                  aria-label="Edit asset"
                  className="p-1 text-[#6E655D] hover:text-[#B89352] cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => requestDelete(asset)}
                  aria-label="Delete asset"
                  className="p-1 text-red-700 hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {previewAsset && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewAsset(null)}
          className="fixed inset-0 z-50 bg-[#141210]/85 flex items-center justify-center p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-2xl w-full p-5 space-y-3 border border-[#1C1917]/15"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-serif-display text-2xl">{previewAsset.title}</h4>
              <button
                type="button"
                onClick={() => setPreviewAsset(null)}
                className="p-1.5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-hidden bg-[#E8DEC8]">
              <StudioImage
                src={previewAsset.url}
                alt={previewAsset.altText}
                className="w-full h-full object-contain max-h-[60vh]"
              />
            </div>
            <p className="text-xs text-[#6E655D]">
              URL: <span className="font-mono">{previewAsset.url}</span>
            </p>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteConfirm)}
        title="Delete Media Asset"
        confirmLabel={
          deleteConfirm && deleteConfirm.references.length > 0
            ? 'Delete & Replace With Fallback'
            : 'Delete Asset'
        }
        message={
          deleteConfirm && deleteConfirm.references.length > 0
            ? `Warning: "${deleteConfirm.asset.title}" is currently used on:\n• ${deleteConfirm.references.join(
                '\n• '
              )}\n\nDeleting it will replace those references with the studio hero fallback.`
            : `Permanently delete "${deleteConfirm?.asset.title}" from the Media Library?`
        }
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
