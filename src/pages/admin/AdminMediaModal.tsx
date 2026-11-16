import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { StudioImage } from '../../components/StudioImage';
import { compressImageFile } from '../../lib/imageCompression';
import type { MediaAsset } from '../../types/studio';

interface MediaPickerModalProps {
  open: boolean;
  media: MediaAsset[];
  onClose: () => void;
  onSelect: (url: string) => void;
  onUploadComplete: () => Promise<void>;
}

export function MediaPickerModal({
  open,
  media,
  onClose,
  onSelect,
  onUploadComplete,
}: MediaPickerModalProps) {
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  if (!open) return null;

  const filtered = media.filter(
    (m) =>
      m.mimeType.startsWith('image/') &&
      (m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.category.toLowerCase().includes(search.toLowerCase()))
  );

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const { dataUrl } = await compressImageFile(file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          dataUrl,
          title: file.name.replace(/\.[^.]+$/, ''),
          category: 'Studio Uploads',
        }),
      });
      const json = await res.json();
      if (res.ok && json.url) {
        await onUploadComplete();
        onSelect(json.url);
        onClose();
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Select Image from Media Library"
      className="fixed inset-0 z-50 bg-[#141210]/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-4xl w-full max-h-[85vh] flex flex-col border border-[#1C1917]/15 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-[#1C1917]/10 flex items-center justify-between gap-4">
          <h3 className="font-serif-display text-2xl text-[#1C1917]">
            Select Image from Media Library
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close media picker"
            className="p-2 text-[#6E655D] hover:text-[#1C1917] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-[#1C1917]/10 flex flex-wrap items-center justify-between gap-3 bg-[#FAF8F5]">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search library by title or category..."
            className="flex-1 min-w-[220px] px-3.5 py-2 bg-white border border-[#1C1917]/15 text-sm"
          />
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.1em] hover:bg-[#B89352] cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Upload New Image'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
          </label>
        </div>

        <div className="p-5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item.url);
                onClose();
              }}
              className="group text-left border border-[#1C1917]/12 hover:border-[#B89352] transition-colors overflow-hidden bg-[#FAF8F5] cursor-pointer"
            >
              <div className="aspect-[4/3] bg-[#E8DEC8] overflow-hidden">
                <StudioImage
                  src={item.url}
                  alt={item.altText || item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-2.5">
                <p className="text-xs font-medium text-[#1C1917] truncate">{item.title}</p>
                <p className="text-[11px] text-[#6E655D] truncate">{item.category}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm Delete',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#141210]/70 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white max-w-md w-full p-6 border border-[#1C1917]/15 shadow-xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-serif-display text-2xl text-[#1C1917]">{title}</h3>
        <p className="text-sm text-[#6E655D] leading-relaxed whitespace-pre-line">{message}</p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-[0.1em] text-[#1C1917] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-red-700 text-white text-xs font-semibold uppercase tracking-[0.1em] hover:bg-red-800 cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
