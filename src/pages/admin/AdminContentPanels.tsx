import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  Image as ImageIcon,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { StudioImage } from '../../components/StudioImage';
import { DynamicCmsPage } from '../DynamicCmsPage';
import type {
  HomepageContent,
  HomepageSectionConfig,
  MediaAsset,
  PageSection,
  ServiceItem,
  WebsitePage,
  WeddingVideo,
} from '../../types/studio';
import { ConfirmDialog, MediaPickerModal } from './AdminMediaModal';

export interface PanelHelpers {
  media: MediaAsset[];
  refreshAll: () => Promise<void>;
  notify: (msg: string) => void;
  notifyError: (msg: string) => void;
}

const SERVICE_ICONS = ['Camera', 'Film', 'Heart', 'Sparkles', 'Aperture', 'Sun', 'Users'];

// ---------------------------------------------------------------------------
// 1. WEBSITE PAGES MANAGEMENT (+ SECTION BUILDER & PREVIEW)
// ---------------------------------------------------------------------------
export function PagesManagerPanel({
  pages,
  helpers,
}: {
  pages: WebsitePage[];
  helpers: PanelHelpers;
}) {
  const [selectedId, setSelectedId] = useState<string>(pages[0]?.id || '');
  const [draft, setDraft] = useState<WebsitePage | null>(pages[0] || null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [pickerTarget, setPickerTarget] = useState<
    { type: 'hero' } | { type: 'section'; index: number } | null
  >(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WebsitePage | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const found = pages.find((p) => p.id === selectedId) || pages[0] || null;
    setDraft(found ? structuredClone(found) : null);
    if (found && found.id !== selectedId) setSelectedId(found.id);
  }, [pages, selectedId]);

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSlug.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          slug: newSlug.trim(),
          status: 'draft',
          heroTitle: newTitle.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        helpers.notifyError(json.error || 'Could not create page.');
        return;
      }
      setNewTitle('');
      setNewSlug('');
      setCreating(false);
      await helpers.refreshAll();
      if (json.page?.id) setSelectedId(json.page.id);
      helpers.notify(`Page "${json.page.title}" created as draft.`);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePage = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pages/${draft.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const json = await res.json();
      if (!res.ok) {
        helpers.notifyError(json.error || 'Failed to save page.');
        return;
      }
      await helpers.refreshAll();
      helpers.notify(`Saved "${draft.title}" (${draft.status}).`);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (page: WebsitePage) => {
    const nextStatus = page.status === 'published' ? 'draft' : 'published';
    const res = await fetch(`/api/admin/pages/${page.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      await helpers.refreshAll();
      helpers.notify(`"${page.title}" is now ${nextStatus}.`);
    }
  };

  const handleDeletePage = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/pages/${deleteTarget.id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) {
      helpers.notifyError(json.error || 'Could not delete page.');
    } else {
      await helpers.refreshAll();
      helpers.notify(`Deleted page "${deleteTarget.title}".`);
    }
    setDeleteTarget(null);
  };

  const addSection = () => {
    if (!draft) return;
    const nextSec: PageSection = {
      id: `sec-${Date.now().toString(36)}`,
      type: 'image_text',
      heading: 'New Story Section',
      subheading: 'Twins Twins Video Pro',
      body: 'Describe this photography experience, collection highlight, or wedding story here.',
      imageUrl: 'img://about',
      videoUrl: '',
      buttonLabel: 'Book Your Wedding',
      buttonHref: '/book',
      backgroundColor: 'ivory',
      orderIndex: (draft.sections?.length || 0) + 1,
    };
    setDraft({ ...draft, sections: [...(draft.sections || []), nextSec] });
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    if (!draft) return;
    const target = index + dir;
    if (target < 0 || target >= draft.sections.length) return;
    const arr = [...draft.sections];
    const [moved] = arr.splice(index, 1);
    arr.splice(target, 0, moved);
    setDraft({
      ...draft,
      sections: arr.map((s, i) => ({ ...s, orderIndex: i + 1 })),
    });
  };

  const updateSection = (index: number, patch: Partial<PageSection>) => {
    if (!draft) return;
    const arr = draft.sections.map((s, i) => (i === index ? { ...s, ...patch } : s));
    setDraft({ ...draft, sections: arr });
  };

  const removeSection = (index: number) => {
    if (!draft) return;
    const arr = draft.sections
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, orderIndex: i + 1 }));
    setDraft({ ...draft, sections: arr });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-3xl text-[#1C1917]">Website Pages</h2>
          <p className="text-sm text-[#6E655D]">
            Manage page content, custom blocks, draft/publish states, and live previews across all routes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#B89352] transition-colors whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Website Page</span>
        </button>
      </div>

      {creating && (
        <form
          onSubmit={handleCreatePage}
          className="bg-white border border-[#1C1917]/12 p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end"
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.1em] mb-1.5">
              Page Title
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (!newSlug) {
                  setNewSlug('/' + e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                }
              }}
              placeholder="e.g. Destination Weddings"
              className="w-full px-3.5 py-2.5 border border-[#1C1917]/15 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.1em] mb-1.5">
              URL Slug
            </label>
            <input
              type="text"
              required
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="/destination-weddings"
              className="w-full px-3.5 py-2.5 border border-[#1C1917]/15 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 bg-[#B89352] text-white text-xs font-semibold uppercase tracking-[0.12em] whitespace-nowrap cursor-pointer"
            >
              Create Page
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="px-4 py-2.5 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-[0.12em] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Page List */}
        <div className="lg:col-span-4 bg-white border border-[#1C1917]/10 divide-y divide-[#1C1917]/8 h-fit">
          {pages.map((p) => {
            const active = p.id === draft?.id;
            return (
              <div
                key={p.id}
                className={`p-4 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  active ? 'bg-[#FAF8F5] border-l-2 border-l-[#B89352]' : 'hover:bg-[#FAF8F5]/60'
                }`}
                onClick={() => setSelectedId(p.id)}
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm text-[#1C1917] truncate">{p.title}</p>
                  <p className="text-xs text-[#6E655D] truncate">{p.slug}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePublish(p);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer ${
                      p.status === 'published'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-100 text-stone-700 border border-stone-200'
                    }`}
                  >
                    {p.status}
                  </button>
                  {!p.isSystemPage && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(p);
                      }}
                      aria-label={`Delete ${p.title}`}
                      className="p-1.5 text-[#6E655D] hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Editor */}
        {draft && (
          <div className="lg:col-span-8 bg-white border border-[#1C1917]/10 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1C1917]/10">
              <div>
                <h3 className="font-serif-display text-2xl text-[#1C1917]">{draft.title}</h3>
                <p className="text-xs text-[#6E655D]">
                  Route: {draft.slug} {draft.isSystemPage ? '· Core Studio Page' : '· Custom CMS Page'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-[0.1em] hover:border-[#B89352] whitespace-nowrap cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  onClick={handleSavePage}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#B89352] whitespace-nowrap cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.1em] mb-1">
                  Page Title
                </label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.1em] mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={draft.slug}
                  disabled={draft.isSystemPage}
                  onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm disabled:bg-stone-50 disabled:text-stone-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.1em] mb-1">
                  Publish Status
                </label>
                <select
                  value={draft.status}
                  onChange={(e) =>
                    setDraft({ ...draft, status: e.target.value as 'published' | 'draft' })
                  }
                  className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm bg-white"
                >
                  <option value="published">Published (Live)</option>
                  <option value="draft">Draft (Hidden)</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-[#FAF8F5] border border-[#1C1917]/10 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B89352]">
                Page Hero Header
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Eyebrow Label</label>
                  <input
                    type="text"
                    value={draft.heroEyebrow}
                    onChange={(e) => setDraft({ ...draft, heroEyebrow: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#1C1917]/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Hero Banner Image</label>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-9 bg-[#E8DEC8] overflow-hidden shrink-0">
                      <StudioImage src={draft.heroImage} alt={draft.title} className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setPickerTarget({ type: 'hero' })}
                      className="px-3 py-2 bg-white border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider hover:border-[#B89352] cursor-pointer"
                    >
                      Choose Image
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Hero Heading</label>
                <input
                  type="text"
                  value={draft.heroTitle}
                  onChange={(e) => setDraft({ ...draft, heroTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#1C1917]/15 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Hero Description</label>
                <textarea
                  rows={2}
                  value={draft.heroDescription}
                  onChange={(e) => setDraft({ ...draft, heroDescription: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#1C1917]/15 text-sm"
                />
              </div>
            </div>

            {/* Section Builder */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1C1917]">
                  Custom Page Sections ({draft.sections?.length || 0})
                </p>
                <button
                  type="button"
                  onClick={addSection}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider hover:border-[#B89352] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Section</span>
                </button>
              </div>

              {(draft.sections || []).map((sec, idx) => (
                <div key={sec.id} className="border border-[#1C1917]/12 p-4 space-y-3 bg-[#FAF8F5]/60">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#B89352]">Section #{idx + 1}</span>
                      <select
                        value={sec.type}
                        onChange={(e) =>
                          updateSection(idx, { type: e.target.value as PageSection['type'] })
                        }
                        className="px-2.5 py-1 bg-white border border-[#1C1917]/15 text-xs"
                      >
                        <option value="image_text">Image & Text Block</option>
                        <option value="text">Editorial Text</option>
                        <option value="video">Video Embed Block</option>
                        <option value="gallery_highlight">Featured Gallery Strip</option>
                        <option value="cta">Call-to-Action Banner</option>
                      </select>
                      <select
                        value={sec.backgroundColor}
                        onChange={(e) =>
                          updateSection(idx, {
                            backgroundColor: e.target.value as PageSection['backgroundColor'],
                          })
                        }
                        className="px-2.5 py-1 bg-white border border-[#1C1917]/15 text-xs"
                      >
                        <option value="ivory">Ivory Background</option>
                        <option value="cream">Warm Cream Background</option>
                        <option value="charcoal">Charcoal Dark Background</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveSection(idx, -1)}
                        className="p-1.5 border border-[#1C1917]/15 bg-white hover:border-[#B89352] cursor-pointer"
                        aria-label="Move section up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(idx, 1)}
                        className="p-1.5 border border-[#1C1917]/15 bg-white hover:border-[#B89352] cursor-pointer"
                        aria-label="Move section down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(idx)}
                        className="p-1.5 text-red-700 hover:bg-red-50 cursor-pointer"
                        aria-label="Remove section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={sec.subheading}
                      onChange={(e) => updateSection(idx, { subheading: e.target.value })}
                      placeholder="Eyebrow / Subheading"
                      className="px-3 py-2 bg-white border border-[#1C1917]/15 text-sm"
                    />
                    <input
                      type="text"
                      value={sec.heading}
                      onChange={(e) => updateSection(idx, { heading: e.target.value })}
                      placeholder="Section Heading"
                      className="px-3 py-2 bg-white border border-[#1C1917]/15 text-sm"
                    />
                  </div>

                  <textarea
                    rows={3}
                    value={sec.body}
                    onChange={(e) => updateSection(idx, { body: e.target.value })}
                    placeholder="Formatted paragraphs (separate paragraphs with blank lines)"
                    className="w-full px-3 py-2 bg-white border border-[#1C1917]/15 text-sm"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPickerTarget({ type: 'section', index: idx })}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#1C1917]/20 text-xs font-medium cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Pick Section Image</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={sec.buttonLabel}
                      onChange={(e) => updateSection(idx, { buttonLabel: e.target.value })}
                      placeholder="CTA Button Label"
                      className="px-3 py-2 bg-white border border-[#1C1917]/15 text-sm"
                    />
                    <input
                      type="text"
                      value={sec.buttonHref}
                      onChange={(e) => updateSection(idx, { buttonHref: e.target.value })}
                      placeholder="CTA Link (/book)"
                      className="px-3 py-2 bg-white border border-[#1C1917]/15 text-sm"
                    />
                  </div>
                  {sec.type === 'video' && (
                    <input
                      type="url"
                      value={sec.videoUrl}
                      onChange={(e) => updateSection(idx, { videoUrl: e.target.value })}
                      placeholder="Video URL (YouTube, Vimeo, or MP4)"
                      className="w-full px-3 py-2 bg-white border border-[#1C1917]/15 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <MediaPickerModal
        open={Boolean(pickerTarget)}
        media={helpers.media}
        onClose={() => setPickerTarget(null)}
        onUploadComplete={helpers.refreshAll}
        onSelect={(url) => {
          if (!draft || !pickerTarget) return;
          if (pickerTarget.type === 'hero') {
            setDraft({ ...draft, heroImage: url });
          } else {
            updateSection(pickerTarget.index, { imageUrl: url });
          }
        }}
      />

      {previewOpen && draft && (
        <div className="fixed inset-0 z-50 bg-[#141210]/85 flex flex-col">
          <div className="bg-[#1C1917] text-[#FAF8F5] px-6 py-3 flex items-center justify-between border-b border-white/10">
            <span className="text-xs uppercase tracking-[0.14em] text-[#D4B478]">
              Draft Page Preview: {draft.title} ({draft.slug})
            </span>
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#B89352] text-white text-xs uppercase tracking-wider cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Close Preview</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-[#FAF8F5]">
            <DynamicCmsPage page={draft} />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Website Page"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}" (${deleteTarget?.slug})?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeletePage}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. HOMEPAGE MANAGEMENT
// ---------------------------------------------------------------------------
export function HomepageManagerPanel({
  homepage,
  videos,
  helpers,
}: {
  homepage: HomepageContent;
  videos: WeddingVideo[];
  helpers: PanelHelpers;
}) {
  const [draft, setDraft] = useState<HomepageContent>(homepage);
  const [pickingHero, setPickingHero] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(homepage);
  }, [homepage]);

  const mp4Videos = videos.filter((v) => v.videoType === 'mp4');

  const moveSection = (idx: number, dir: -1 | 1) => {
    const arr = [...(draft.sections || [])].sort((a, b) => a.orderIndex - b.orderIndex);
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    const [moved] = arr.splice(idx, 1);
    arr.splice(target, 0, moved);
    setDraft({
      ...draft,
      sections: arr.map((s, i) => ({ ...s, orderIndex: i + 1 })),
    });
  };

  const toggleSectionVisibility = (id: string) => {
    setDraft({
      ...draft,
      sections: draft.sections.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)),
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const json = await res.json();
        helpers.notifyError(json.error || 'Failed to save homepage settings.');
        return;
      }
      await helpers.refreshAll();
      helpers.notify('Homepage content & section layout saved.');
    } finally {
      setSaving(false);
    }
  };

  const sortedSections: HomepageSectionConfig[] = [...(draft.sections || [])].sort(
    (a, b) => a.orderIndex - b.orderIndex
  );

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-3xl text-[#1C1917]">Homepage Management</h2>
          <p className="text-sm text-[#6E655D]">
            Update hero headlines, background image or looping video, CTAs, section headings, and section order.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.14em] hover:bg-[#B89352] cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Homepage'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#1C1917]/10 p-6 space-y-4">
          <h3 className="font-serif-display text-xl text-[#1C1917] border-b border-[#1C1917]/10 pb-3">
            Hero Section & Headings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Hero Eyebrow
              </label>
              <input
                type="text"
                value={draft.heroSubheading}
                onChange={(e) => setDraft({ ...draft, heroSubheading: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Hero Background Photo
              </label>
              <div className="flex items-center gap-2">
                <div className="w-12 h-9 bg-[#E8DEC8] overflow-hidden shrink-0">
                  <StudioImage src={draft.heroImage} alt="Hero" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => setPickingHero(true)}
                  className="px-3 py-2 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider hover:border-[#B89352] cursor-pointer"
                >
                  Change Photo
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Main Hero Heading
            </label>
            <input
              type="text"
              value={draft.heroHeading}
              onChange={(e) => setDraft({ ...draft, heroHeading: e.target.value })}
              className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Hero Supporting Text
            </label>
            <textarea
              rows={3}
              value={draft.heroSupportingText}
              onChange={(e) => setDraft({ ...draft, heroSupportingText: e.target.value })}
              className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Hero Background Video (MP4 URL — leave blank to use Hero Photo)
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={draft.heroVideoUrl || ''}
                onChange={(e) => setDraft({ ...draft, heroVideoUrl: e.target.value })}
                placeholder="https://.../wedding-hero.mp4 or /uploads/..."
                className="flex-1 min-w-[200px] px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
              {mp4Videos.length > 0 && (
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) setDraft({ ...draft, heroVideoUrl: e.target.value });
                  }}
                  className="px-3 py-2 border border-[#1C1917]/15 text-xs bg-white"
                >
                  <option value="">Choose from MP4 Library...</option>
                  {mp4Videos.map((v) => (
                    <option key={v.id} value={v.videoUrl}>
                      {v.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Primary CTA Label
              </label>
              <input
                type="text"
                value={draft.heroPrimaryCtaLabel}
                onChange={(e) => setDraft({ ...draft, heroPrimaryCtaLabel: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Primary CTA Link
              </label>
              <input
                type="text"
                value={draft.heroPrimaryCtaHref}
                onChange={(e) => setDraft({ ...draft, heroPrimaryCtaHref: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Secondary CTA Label
              </label>
              <input
                type="text"
                value={draft.heroSecondaryCtaLabel}
                onChange={(e) => setDraft({ ...draft, heroSecondaryCtaLabel: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Secondary CTA Link
              </label>
              <input
                type="text"
                value={draft.heroSecondaryCtaHref}
                onChange={(e) => setDraft({ ...draft, heroSecondaryCtaHref: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#1C1917]/10">
            <div>
              <label className="block text-xs font-medium mb-1">Services Section Heading</label>
              <input
                type="text"
                value={draft.servicesHeading}
                onChange={(e) => setDraft({ ...draft, servicesHeading: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Portfolio Section Heading</label>
              <input
                type="text"
                value={draft.portfolioHeading}
                onChange={(e) => setDraft({ ...draft, portfolioHeading: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Videos Section Heading</label>
              <input
                type="text"
                value={draft.videosHeading}
                onChange={(e) => setDraft({ ...draft, videosHeading: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Packages Section Heading</label>
              <input
                type="text"
                value={draft.packagesHeading}
                onChange={(e) => setDraft({ ...draft, packagesHeading: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section Ordering & Visibility */}
        <div className="lg:col-span-5 bg-white border border-[#1C1917]/10 p-6 space-y-4 h-fit">
          <h3 className="font-serif-display text-xl text-[#1C1917] border-b border-[#1C1917]/10 pb-3">
            Homepage Sections Order &amp; Visibility
          </h3>
          <div className="space-y-2">
            {sortedSections.map((sec, idx) => (
              <div
                key={sec.id}
                className="flex items-center justify-between gap-2 p-3 bg-[#FAF8F5] border border-[#1C1917]/10"
              >
                <label className="flex items-center gap-2.5 text-sm font-medium text-[#1C1917] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sec.visible}
                    onChange={() => toggleSectionVisibility(sec.id)}
                    className="accent-[#B89352]"
                  />
                  <span className={!sec.visible ? 'line-through text-[#6E655D]' : ''}>
                    {sec.label}
                  </span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveSection(idx, -1)}
                    className="p-1.5 bg-white border border-[#1C1917]/15 hover:border-[#B89352] cursor-pointer"
                    aria-label={`Move ${sec.label} up`}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(idx, 1)}
                    className="p-1.5 bg-white border border-[#1C1917]/15 hover:border-[#B89352] cursor-pointer"
                    aria-label={`Move ${sec.label} down`}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <MediaPickerModal
        open={pickingHero}
        media={helpers.media}
        onClose={() => setPickingHero(false)}
        onUploadComplete={helpers.refreshAll}
        onSelect={(url) => setDraft({ ...draft, heroImage: url })}
      />
    </form>
  );
}

// ---------------------------------------------------------------------------
// 3. ABOUT US MANAGEMENT
// ---------------------------------------------------------------------------
export function AboutUsManagerPanel({
  homepage,
  aboutPage,
  helpers,
}: {
  homepage: HomepageContent;
  aboutPage?: WebsitePage;
  helpers: PanelHelpers;
}) {
  const [draft, setDraft] = useState(homepage);
  const [newBullet, setNewBullet] = useState('');
  const [pickingImage, setPickingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageHeroTitle, setPageHeroTitle] = useState(aboutPage?.heroTitle || '');
  const [pageHeroDesc, setPageHeroDesc] = useState(aboutPage?.heroDescription || '');

  useEffect(() => {
    setDraft(homepage);
    if (aboutPage) {
      setPageHeroTitle(aboutPage.heroTitle);
      setPageHeroDesc(aboutPage.heroDescription);
    }
  }, [homepage, aboutPage]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r1 = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!r1.ok) {
        helpers.notifyError('Failed to update About Us story.');
        return;
      }
      if (aboutPage) {
        await fetch(`/api/admin/pages/${aboutPage.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ heroTitle: pageHeroTitle, heroDescription: pageHeroDesc }),
        });
      }
      await helpers.refreshAll();
      helpers.notify('About Us content updated.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-3xl text-[#1C1917]">About Us Management</h2>
          <p className="text-sm text-[#6E655D]">
            Edit studio narrative, philosophy bullet points, portrait imagery, and /about hero copy.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.14em] hover:bg-[#B89352] cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save About Us'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-[#1C1917]/10 p-6">
        <div className="lg:col-span-7 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Story Heading
            </label>
            <input
              type="text"
              value={draft.aboutHeading}
              onChange={(e) => setDraft({ ...draft, aboutHeading: e.target.value })}
              className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Lead Statement
            </label>
            <input
              type="text"
              value={draft.aboutLead}
              onChange={(e) => setDraft({ ...draft, aboutLead: e.target.value })}
              className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Studio Narrative Body
            </label>
            <textarea
              rows={5}
              value={draft.aboutBody}
              onChange={(e) => setDraft({ ...draft, aboutBody: e.target.value })}
              className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
            />
          </div>
          {aboutPage && (
            <div className="pt-3 border-t border-[#1C1917]/10 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#B89352]">
                Dedicated /about Page Hero
              </p>
              <input
                type="text"
                value={pageHeroTitle}
                onChange={(e) => setPageHeroTitle(e.target.value)}
                placeholder="/about Hero Title"
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
              <textarea
                rows={2}
                value={pageHeroDesc}
                onChange={(e) => setPageHeroDesc(e.target.value)}
                placeholder="/about Hero Description"
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
              About Section Portrait Image
            </label>
            <div className="aspect-[4/3] bg-[#E8DEC8] overflow-hidden mb-3">
              <StudioImage src={draft.aboutImage} alt="About Studio" className="w-full h-full object-cover" />
            </div>
            <button
              type="button"
              onClick={() => setPickingImage(true)}
              className="px-4 py-2 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider hover:border-[#B89352] cursor-pointer"
            >
              Select About Image
            </button>
          </div>

          <div className="pt-3 border-t border-[#1C1917]/10 space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider">
              Our Approach Points
            </label>
            <ul className="space-y-2">
              {draft.aboutApproach.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between gap-2 bg-[#FAF8F5] px-3 py-2 text-sm">
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        aboutApproach: draft.aboutApproach.filter((_, i) => i !== idx),
                      })
                    }
                    className="text-red-700 hover:opacity-75 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBullet}
                onChange={(e) => setNewBullet(e.target.value)}
                placeholder="Add new studio principle..."
                className="flex-1 px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newBullet.trim()) return;
                  setDraft({ ...draft, aboutApproach: [...draft.aboutApproach, newBullet.trim()] });
                  setNewBullet('');
                }}
                className="px-3.5 py-2 bg-[#1C1917] text-white text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      <MediaPickerModal
        open={pickingImage}
        media={helpers.media}
        onClose={() => setPickingImage(false)}
        onUploadComplete={helpers.refreshAll}
        onSelect={(url) => setDraft({ ...draft, aboutImage: url })}
      />
    </form>
  );
}

// ---------------------------------------------------------------------------
// 4. PHOTOGRAPHY SERVICES MANAGEMENT
// ---------------------------------------------------------------------------
export function ServicesManagerPanel({
  services,
  helpers,
}: {
  services: ServiceItem[];
  helpers: PanelHelpers;
}) {
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null);

  const blankService: ServiceItem = {
    id: '',
    slug: '',
    title: '',
    shortDescription: '',
    fullDescription: '',
    deliverables: ['Full high-resolution edited gallery', 'Consultation & timeline planning'],
    image: 'img://hero',
    iconName: 'Camera',
    route: '/photography',
    orderIndex: services.length + 1,
    published: true,
    featured: true,
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const isNew = !editing.id;
    const url = isNew ? '/api/admin/services' : `/api/admin/services/${editing.id}`;
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    const json = await res.json();
    if (!res.ok) {
      helpers.notifyError(json.error || 'Could not save service.');
      return;
    }
    setEditing(null);
    setCreating(false);
    await helpers.refreshAll();
    helpers.notify(isNew ? 'Service created.' : 'Service updated.');
  };

  const handleReorder = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= services.length) return;
    const a = services[index];
    const b = services[target];
    await Promise.all([
      fetch(`/api/admin/services/${a.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIndex: b.orderIndex }),
      }),
      fetch(`/api/admin/services/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIndex: a.orderIndex }),
      }),
    ]);
    await helpers.refreshAll();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/admin/services/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    await helpers.refreshAll();
    helpers.notify('Service removed.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-3xl text-[#1C1917]">Photography Services</h2>
          <p className="text-sm text-[#6E655D]">
            Add, edit, reorder, and publish studio photography &amp; videography offerings.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditing(blankService);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#B89352] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service</span>
        </button>
      </div>

      {editing && (
        <form
          onSubmit={handleSave}
          className="bg-white border border-[#1C1917]/15 p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#1C1917]/10 pb-3">
            <h3 className="font-serif-display text-2xl">
              {creating ? 'Add Photography Service' : `Edit ${editing.title}`}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Service Title
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
                Icon Style
              </label>
              <select
                value={editing.iconName}
                onChange={(e) => setEditing({ ...editing, iconName: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm bg-white"
              >
                {SERVICE_ICONS.map((ic) => (
                  <option key={ic} value={ic}>
                    {ic}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Target Page Route
              </label>
              <input
                type="text"
                value={editing.route}
                onChange={(e) => setEditing({ ...editing, route: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Short Summary
            </label>
            <input
              type="text"
              required
              value={editing.shortDescription}
              onChange={(e) => setEditing({ ...editing, shortDescription: e.target.value })}
              className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Full Service Description
            </label>
            <textarea
              rows={3}
              value={editing.fullDescription}
              onChange={(e) => setEditing({ ...editing, fullDescription: e.target.value })}
              className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Deliverables (one per line)
              </label>
              <textarea
                rows={4}
                value={editing.deliverables.join('\n')}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    deliverables: e.target.value.split('\n').map((l) => l.trim()).filter(Boolean),
                  })
                }
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-20 h-16 bg-[#E8DEC8] overflow-hidden shrink-0">
                  <StudioImage src={editing.image} alt={editing.title} className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => setPickingImage(true)}
                  className="px-3.5 py-2 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider cursor-pointer"
                >
                  Choose Image
                </button>
              </div>
              <div className="flex items-center gap-5 pt-2">
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
          </div>

          <div className="flex justify-end gap-3 pt-2">
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
              Save Service
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((srv, idx) => (
          <div key={srv.id} className="bg-white border border-[#1C1917]/10 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="aspect-[16/10] bg-[#E8DEC8] overflow-hidden relative">
                <StudioImage src={srv.image} alt={srv.title} className="w-full h-full object-cover" />
                {!srv.published && (
                  <span className="absolute top-3 right-3 px-2.5 py-1 bg-[#141210]/85 text-[#FAF8F5] text-[11px] uppercase tracking-wider">
                    Draft
                  </span>
                )}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#B89352]">
                  <span>#{srv.orderIndex} · {srv.iconName}</span>
                  <span>{srv.route}</span>
                </div>
                <h3 className="font-serif-display text-xl text-[#1C1917]">{srv.title}</h3>
                <p className="text-xs text-[#6E655D] line-clamp-2">{srv.shortDescription}</p>
              </div>
            </div>
            <div className="px-4 pb-4 pt-2 border-t border-[#1C1917]/8 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleReorder(idx, -1)}
                  className="p-1.5 border border-[#1C1917]/15 hover:border-[#B89352] cursor-pointer"
                  aria-label="Move up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleReorder(idx, 1)}
                  className="p-1.5 border border-[#1C1917]/15 hover:border-[#B89352] cursor-pointer"
                  aria-label="Move down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setEditing(structuredClone(srv));
                  }}
                  className="px-3 py-1.5 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider hover:border-[#B89352] cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(srv)}
                  className="p-1.5 text-red-700 hover:bg-red-50 cursor-pointer"
                  aria-label="Delete service"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <MediaPickerModal
        open={pickingImage}
        media={helpers.media}
        onClose={() => setPickingImage(false)}
        onUploadComplete={helpers.refreshAll}
        onSelect={(url) => editing && setEditing({ ...editing, image: url })}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Photography Service"
        message={`Remove "${deleteTarget?.title}" from your studio service catalogue?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. WEDDING VIDEOGRAPHY MANAGEMENT
// ---------------------------------------------------------------------------
export function VideographyManagerPanel({
  videographyPage,
  homepage,
  helpers,
  onOpenVideosTab,
}: {
  videographyPage?: WebsitePage;
  homepage: HomepageContent;
  helpers: PanelHelpers;
  onOpenVideosTab: () => void;
}) {
  const [heroTitle, setHeroTitle] = useState(videographyPage?.heroTitle || '');
  const [heroDesc, setHeroDesc] = useState(videographyPage?.heroDescription || '');
  const [heroImage, setHeroImage] = useState(videographyPage?.heroImage || 'img://reception');
  const [videosHeading, setVideosHeading] = useState(homepage.videosHeading);
  const [pickingImage, setPickingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (videographyPage) {
      setHeroTitle(videographyPage.heroTitle);
      setHeroDesc(videographyPage.heroDescription);
      setHeroImage(videographyPage.heroImage);
    }
    setVideosHeading(homepage.videosHeading);
  }, [videographyPage, homepage]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (videographyPage) {
        await fetch(`/api/admin/pages/${videographyPage.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            heroTitle,
            heroDescription: heroDesc,
            heroImage,
          }),
        });
      }
      await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videosHeading }),
      });
      await helpers.refreshAll();
      helpers.notify('Wedding Videography page settings updated.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-3xl text-[#1C1917]">Wedding Videography</h2>
          <p className="text-sm text-[#6E655D]">
            Manage cinema showcase headings, /videography hero framing, and link to your video library.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenVideosTab}
            className="px-4 py-2.5 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-[0.12em] hover:border-[#B89352] cursor-pointer"
          >
            Manage Video Reels
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#B89352] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#1C1917]/10 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Videography Showcase Section Heading
            </label>
            <input
              type="text"
              value={videosHeading}
              onChange={(e) => setVideosHeading(e.target.value)}
              className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              /videography Page Hero Title
            </label>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              /videography Page Hero Description
            </label>
            <textarea
              rows={3}
              value={heroDesc}
              onChange={(e) => setHeroDesc(e.target.value)}
              className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
            />
          </div>
        </div>
        <div className="lg:col-span-5 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider">
            Videography Banner Image
          </label>
          <div className="aspect-[16/10] bg-[#E8DEC8] overflow-hidden">
            <StudioImage src={heroImage} alt="Videography" className="w-full h-full object-cover" />
          </div>
          <button
            type="button"
            onClick={() => setPickingImage(true)}
            className="px-4 py-2 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider hover:border-[#B89352] cursor-pointer"
          >
            Select Videography Banner
          </button>
        </div>
      </div>

      <MediaPickerModal
        open={pickingImage}
        media={helpers.media}
        onClose={() => setPickingImage(false)}
        onUploadComplete={helpers.refreshAll}
        onSelect={setHeroImage}
      />
    </form>
  );
}
