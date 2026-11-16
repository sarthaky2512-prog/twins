import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Plus,
  Save,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { StudioImage } from '../../components/StudioImage';
import type {
  AdminRole,
  AdminUser,
  BookingInquiry,
  BusinessInfo,
  FooterConfig,
  InquiryStatus,
  NavigationItem,
  WebsitePage,
  WebsiteSettings,
} from '../../types/studio';
import type { PanelHelpers } from './AdminContentPanels';
import { ConfirmDialog, MediaPickerModal } from './AdminMediaModal';

const STATUS_LABELS: Record<InquiryStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  follow_up: 'Follow-up Needed',
  confirmed: 'Confirmed Booking',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<InquiryStatus, string> = {
  new: 'bg-amber-50 text-amber-800 border-amber-200',
  contacted: 'bg-sky-50 text-sky-800 border-sky-200',
  follow_up: 'bg-purple-50 text-purple-800 border-purple-200',
  confirmed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  completed: 'bg-stone-100 text-stone-800 border-stone-300',
  cancelled: 'bg-red-50 text-red-800 border-red-200',
};

// ---------------------------------------------------------------------------
// 1. BOOKING INQUIRIES MANAGEMENT
// ---------------------------------------------------------------------------
export function InquiriesManagerPanel({
  inquiries,
  helpers,
}: {
  inquiries: BookingInquiry[];
  helpers: PanelHelpers;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InquiryStatus>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<BookingInquiry | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState<InquiryStatus>('new');
  const [deleteTarget, setDeleteTarget] = useState<BookingInquiry | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inquiries.filter((inq) => {
      if (statusFilter !== 'all' && inq.status !== statusFilter) return false;
      if (dateFrom && inq.weddingDate && inq.weddingDate < dateFrom) return false;
      if (dateTo && inq.weddingDate && inq.weddingDate > dateTo) return false;
      if (!q) return true;
      return (
        inq.fullName.toLowerCase().includes(q) ||
        inq.email.toLowerCase().includes(q) ||
        inq.weddingVenue.toLowerCase().includes(q) ||
        inq.weddingLocation.toLowerCase().includes(q) ||
        inq.serviceRequired.toLowerCase().includes(q)
      );
    });
  }, [inquiries, search, statusFilter, dateFrom, dateTo]);

  const openModal = (inq: BookingInquiry) => {
    setSelected(inq);
    setStatusDraft(inq.status);
    setNotesDraft(inq.internalNotes || '');
  };

  const handleSaveInquiry = async () => {
    if (!selected) return;
    const res = await fetch(`/api/admin/inquiries/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: statusDraft, internalNotes: notesDraft }),
    });
    if (res.ok) {
      await helpers.refreshAll();
      setSelected(null);
      helpers.notify(`Updated inquiry for ${selected.fullName}.`);
    } else {
      helpers.notifyError('Could not update inquiry.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/admin/inquiries/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    if (selected?.id === deleteTarget.id) setSelected(null);
    await helpers.refreshAll();
    helpers.notify('Booking inquiry deleted.');
  };

  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Client Name',
      'Email',
      'Phone',
      'Wedding Date',
      'Venue',
      'Location',
      'Service',
      'Package',
      'Budget',
      'Status',
      'Notes',
      'Submitted At',
    ];
    const escape = (v: string) => `"${String(v || '').replace(/"/g, '""')}"`;
    const rows = filtered.map((i) =>
      [
        i.id,
        i.fullName,
        i.email,
        i.phone,
        i.weddingDate,
        i.weddingVenue,
        i.weddingLocation,
        i.serviceRequired,
        i.preferredPackage,
        i.estimatedBudget,
        STATUS_LABELS[i.status],
        i.internalNotes || '',
        i.createdAt,
      ]
        .map(escape)
        .join(',')
    );
    const csv = [headers.map(escape).join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `twins-twins-inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-3xl text-[#1C1917]">Booking Inquiries</h2>
          <p className="text-sm text-[#6E655D]">
            Track wedding leads, update booking statuses, record internal notes, and export CRM records.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#B89352] cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV ({filtered.length})</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#1C1917]/10 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search couple, email, venue..."
          className="px-3.5 py-2 border border-[#1C1917]/15 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | InquiryStatus)}
          className="px-3.5 py-2 border border-[#1C1917]/15 text-sm bg-white"
        >
          <option value="all">All Statuses ({inquiries.length})</option>
          {(Object.keys(STATUS_LABELS) as InquiryStatus[]).map((st) => (
            <option key={st} value={st}>
              {STATUS_LABELS[st]}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          title="Wedding Date From"
          className="px-3.5 py-2 border border-[#1C1917]/15 text-sm"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          title="Wedding Date To"
          className="px-3.5 py-2 border border-[#1C1917]/15 text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-[#1C1917]/10 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1C1917]/10 bg-[#FAF8F5] text-[11px] font-semibold uppercase tracking-wider text-[#6E655D]">
              <th className="py-3.5 px-4">Couple / Client</th>
              <th className="py-3.5 px-4">Wedding Date</th>
              <th className="py-3.5 px-4">Service &amp; Package</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C1917]/8 text-sm">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-[#6E655D]">
                  No booking inquiries match your current filter.
                </td>
              </tr>
            ) : (
              filtered.map((inq) => (
                <tr key={inq.id} className="hover:bg-[#FAF8F5]/60">
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-[#1C1917]">{inq.fullName}</p>
                    <p className="text-xs text-[#6E655D]">
                      {inq.email} · {inq.phone}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="text-[#1C1917]">{inq.weddingDate || 'TBD'}</p>
                    <p className="text-xs text-[#6E655D] truncate max-w-[200px]">
                      {inq.weddingVenue || inq.weddingLocation || '—'}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="text-[#1C1917]">{inq.serviceRequired}</p>
                    <p className="text-xs text-[#6E655D]">{inq.preferredPackage}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider border whitespace-nowrap ${
                        STATUS_COLORS[inq.status]
                      }`}
                    >
                      {STATUS_LABELS[inq.status]}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                    <button
                      type="button"
                      onClick={() => openModal(inq)}
                      className="px-3 py-1.5 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider hover:border-[#B89352] cursor-pointer"
                    >
                      View / Manage
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(inq)}
                      aria-label={`Delete ${inq.fullName}`}
                      className="p-1.5 text-red-700 hover:bg-red-50 cursor-pointer align-middle"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Inquiry Detail Modal */}
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
          className="fixed inset-0 z-50 bg-[#141210]/75 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-[#1C1917]/15 shadow-2xl space-y-5"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#1C1917]/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#B89352] font-semibold">
                  Booking Inquiry Record
                </p>
                <h3 className="font-serif-display text-3xl text-[#1C1917]">{selected.fullName}</h3>
                <p className="text-xs text-[#6E655D]">
                  Received {new Date(selected.createdAt).toLocaleString()} · Source: {selected.source}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 text-[#6E655D] hover:text-[#1C1917] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-[#FAF8F5] p-4 border border-[#1C1917]/10">
              <div>
                <p className="text-xs text-[#6E655D]">Email</p>
                <a href={`mailto:${selected.email}`} className="font-medium text-[#1C1917] hover:text-[#B89352]">
                  {selected.email}
                </a>
              </div>
              <div>
                <p className="text-xs text-[#6E655D]">Phone</p>
                <a href={`tel:${selected.phone}`} className="font-medium text-[#1C1917] hover:text-[#B89352]">
                  {selected.phone}
                </a>
              </div>
              <div>
                <p className="text-xs text-[#6E655D]">Wedding Date</p>
                <p className="font-medium">{selected.weddingDate || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-xs text-[#6E655D]">Venue &amp; Location</p>
                <p className="font-medium">
                  {[selected.weddingVenue, selected.weddingLocation].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#6E655D]">Service Requested</p>
                <p className="font-medium">{selected.serviceRequired}</p>
              </div>
              <div>
                <p className="text-xs text-[#6E655D]">Preferred Package &amp; Budget</p>
                <p className="font-medium">
                  {selected.preferredPackage} {selected.estimatedBudget ? `(${selected.estimatedBudget})` : ''}
                </p>
              </div>
            </div>

            {selected.additionalRequirements && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6E655D] mb-1">
                  Couple Notes &amp; Requirements
                </p>
                <p className="text-sm text-[#1C1917] bg-[#FAF8F5] p-3.5 border border-[#1C1917]/10 whitespace-pre-line">
                  {selected.additionalRequirements}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                  Workflow Status
                </label>
                <select
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value as InquiryStatus)}
                  className="w-full px-3 py-2.5 border border-[#1C1917]/15 text-sm bg-white"
                >
                  {(Object.keys(STATUS_LABELS) as InquiryStatus[]).map((st) => (
                    <option key={st} value={st}>
                      {STATUS_LABELS[st]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <a
                  href={`mailto:${selected.email}?subject=${encodeURIComponent(
                    `Twins Twins Video Pro — Wedding Inquiry for ${selected.weddingDate || 'Your Special Day'}`
                  )}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider hover:border-[#B89352]"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Reply Email</span>
                </a>
                <a
                  href={`tel:${selected.phone}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider hover:border-[#B89352]"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Internal Studio Notes (Private)
              </label>
              <textarea
                rows={3}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Quote sent, deposit status, timeline notes..."
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-[#1C1917]/10">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-4 py-2 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveInquiry}
                className="px-5 py-2 bg-[#1C1917] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#B89352] cursor-pointer"
              >
                Save Inquiry Status
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Booking Inquiry"
        message={`Permanently delete the booking inquiry from "${deleteTarget?.fullName}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. CONTACT INFORMATION MANAGEMENT
// ---------------------------------------------------------------------------
export function ContactInfoPanel({
  businessInfo,
  helpers,
}: {
  businessInfo: BusinessInfo;
  helpers: PanelHelpers;
}) {
  const [draft, setDraft] = useState(businessInfo);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(businessInfo);
  }, [businessInfo]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        await helpers.refreshAll();
        helpers.notify('Studio contact information updated.');
      } else {
        helpers.notifyError('Failed to update contact info.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-3xl text-[#1C1917]">Contact Information</h2>
          <p className="text-sm text-[#6E655D]">
            Update phone, booking notification email, Angle Vale address, Google Maps link, and social profiles.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.14em] hover:bg-[#B89352] cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Contact Info'}</span>
        </button>
      </div>

      <div className="bg-white border border-[#1C1917]/10 p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
            Business Name
          </label>
          <input
            type="text"
            value={draft.businessName}
            onChange={(e) => setDraft({ ...draft, businessName: e.target.value })}
            className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
            Phone Number
          </label>
          <input
            type="text"
            value={draft.phone}
            onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
            Studio Email (Inquiry Recipient)
          </label>
          <input
            type="email"
            value={draft.email}
            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
            Region / Location Label
          </label>
          <input
            type="text"
            value={draft.locationLabel}
            onChange={(e) => setDraft({ ...draft, locationLabel: e.target.value })}
            className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
            Street Address
          </label>
          <input
            type="text"
            value={draft.addressLine1}
            onChange={(e) => setDraft({ ...draft, addressLine1: e.target.value })}
            className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
            Suburb, State &amp; Postcode
          </label>
          <input
            type="text"
            value={draft.addressLine2}
            onChange={(e) => setDraft({ ...draft, addressLine2: e.target.value })}
            className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
            Google Maps Directions URL
          </label>
          <input
            type="url"
            value={draft.googleMapsUrl}
            onChange={(e) => setDraft({ ...draft, googleMapsUrl: e.target.value })}
            className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
            Instagram URL
          </label>
          <input
            type="url"
            value={draft.instagramUrl}
            onChange={(e) => setDraft({ ...draft, instagramUrl: e.target.value })}
            className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
            Facebook URL
          </label>
          <input
            type="url"
            value={draft.facebookUrl}
            onChange={(e) => setDraft({ ...draft, facebookUrl: e.target.value })}
            className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
            YouTube URL
          </label>
          <input
            type="url"
            value={draft.youtubeUrl}
            onChange={(e) => setDraft({ ...draft, youtubeUrl: e.target.value })}
            className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
            Pinterest URL
          </label>
          <input
            type="url"
            value={draft.pinterestUrl}
            onChange={(e) => setDraft({ ...draft, pinterestUrl: e.target.value })}
            className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
          />
        </div>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// 3. NAVIGATION MANAGEMENT
// ---------------------------------------------------------------------------
export function NavigationManagerPanel({
  navigation,
  helpers,
}: {
  navigation: NavigationItem[];
  helpers: PanelHelpers;
}) {
  const [items, setItems] = useState<NavigationItem[]>(navigation);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setItems(navigation);
  }, [navigation]);

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const arr = [...items];
    const [moved] = arr.splice(idx, 1);
    arr.splice(target, 0, moved);
    setItems(arr.map((it, i) => ({ ...it, orderIndex: i + 1 })));
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: `nav-${Date.now().toString(36)}`,
        label: 'New Link',
        href: '/gallery',
        orderIndex: items.length + 1,
        visible: true,
        openInNewTab: false,
      },
    ]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/navigation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (res.ok) {
        await helpers.refreshAll();
        helpers.notify('Header navigation menu saved.');
      } else {
        helpers.notifyError('Failed to save navigation.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-3xl text-[#1C1917]">Navigation Management</h2>
          <p className="text-sm text-[#6E655D]">
            Reorder header navigation items, rename labels, toggle menu visibility, or link new custom pages.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-[0.12em] hover:border-[#B89352] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Link</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#B89352] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Menu'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#1C1917]/10 divide-y divide-[#1C1917]/8">
        {items.map((item, idx) => (
          <div key={item.id} className="p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-4">
              <input
                type="text"
                value={item.label}
                onChange={(e) =>
                  setItems(items.map((it, i) => (i === idx ? { ...it, label: e.target.value } : it)))
                }
                placeholder="Label"
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div className="sm:col-span-4">
              <input
                type="text"
                value={item.href}
                onChange={(e) =>
                  setItems(items.map((it, i) => (i === idx ? { ...it, href: e.target.value } : it)))
                }
                placeholder="/route or https://..."
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-4 text-xs">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.visible}
                  onChange={(e) =>
                    setItems(
                      items.map((it, i) => (i === idx ? { ...it, visible: e.target.checked } : it))
                    )
                  }
                  className="accent-[#B89352]"
                />
                <span>Visible</span>
              </label>
            </div>
            <div className="sm:col-span-2 flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => move(idx, -1)}
                className="p-1.5 border border-[#1C1917]/15 hover:border-[#B89352] cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(idx, 1)}
                className="p-1.5 border border-[#1C1917]/15 hover:border-[#B89352] cursor-pointer"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setItems(items.filter((_, i) => i !== idx))}
                className="p-1.5 text-red-700 hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. FOOTER MANAGEMENT
// ---------------------------------------------------------------------------
export function FooterManagerPanel({
  footer,
  helpers,
}: {
  footer: FooterConfig;
  helpers: PanelHelpers;
}) {
  const [draft, setDraft] = useState(footer);
  const [pickingLogo, setPickingLogo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(footer);
  }, [footer]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/footer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        await helpers.refreshAll();
        helpers.notify('Footer settings saved.');
      } else {
        helpers.notifyError('Could not save footer settings.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-3xl text-[#1C1917]">Footer Management</h2>
          <p className="text-sm text-[#6E655D]">
            Customize footer description, studio logo, legal link labels, copyright text, and quick links.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.14em] hover:bg-[#B89352] cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Footer'}</span>
        </button>
      </div>

      <div className="bg-white border border-[#1C1917]/10 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Footer Studio Name
              </label>
              <input
                type="text"
                value={draft.businessName}
                onChange={(e) => setDraft({ ...draft, businessName: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Footer Tagline
              </label>
              <input
                type="text"
                value={draft.tagline}
                onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Studio Description
            </label>
            <textarea
              rows={3}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Copyright Text
            </label>
            <input
              type="text"
              value={draft.copyrightText}
              onChange={(e) => setDraft({ ...draft, copyrightText: e.target.value })}
              className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
            />
          </div>
          <div className="flex items-center gap-4 pt-2">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#141210]">
              <StudioImage src={draft.logoUrl} alt="Footer Logo" className="w-full h-full object-cover" />
            </div>
            <button
              type="button"
              onClick={() => setPickingLogo(true)}
              className="px-3.5 py-2 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              Change Footer Logo
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider">Quick Links</label>
            <button
              type="button"
              onClick={() =>
                setDraft({
                  ...draft,
                  quickLinks: [...draft.quickLinks, { label: 'New Link', href: '/' }],
                })
              }
              className="text-xs font-semibold text-[#B89352] hover:underline cursor-pointer"
            >
              + Add Quick Link
            </button>
          </div>
          {draft.quickLinks.map((ql, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <input
                type="text"
                value={ql.label}
                onChange={(e) => {
                  const arr = [...draft.quickLinks];
                  arr[idx] = { ...arr[idx], label: e.target.value };
                  setDraft({ ...draft, quickLinks: arr });
                }}
                className="col-span-5 px-2.5 py-1.5 border border-[#1C1917]/15 text-xs"
              />
              <input
                type="text"
                value={ql.href}
                onChange={(e) => {
                  const arr = [...draft.quickLinks];
                  arr[idx] = { ...arr[idx], href: e.target.value };
                  setDraft({ ...draft, quickLinks: arr });
                }}
                className="col-span-6 px-2.5 py-1.5 border border-[#1C1917]/15 text-xs"
              />
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    quickLinks: draft.quickLinks.filter((_, i) => i !== idx),
                  })
                }
                className="col-span-1 text-red-700 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <MediaPickerModal
        open={pickingLogo}
        media={helpers.media}
        onClose={() => setPickingLogo(false)}
        onUploadComplete={helpers.refreshAll}
        onSelect={(url) => setDraft({ ...draft, logoUrl: url })}
      />
    </form>
  );
}

// ---------------------------------------------------------------------------
// 5. SEO MANAGEMENT
// ---------------------------------------------------------------------------
export function SeoManagerPanel({
  pages,
  helpers,
}: {
  pages: WebsitePage[];
  helpers: PanelHelpers;
}) {
  const [selectedId, setSelectedId] = useState(pages[0]?.id || '');
  const [draft, setDraft] = useState<WebsitePage | null>(pages[0] || null);
  const [pickingOg, setPickingOg] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const found = pages.find((p) => p.id === selectedId) || pages[0] || null;
    setDraft(found ? structuredClone(found) : null);
  }, [pages, selectedId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pages/${draft.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seoTitle: draft.seoTitle,
          seoDescription: draft.seoDescription,
          seoKeywords: draft.seoKeywords,
          ogImage: draft.ogImage,
          socialTitle: draft.socialTitle,
          socialDescription: draft.socialDescription,
          canonicalUrl: draft.canonicalUrl,
        }),
      });
      if (res.ok) {
        await helpers.refreshAll();
        helpers.notify(`SEO metadata saved for ${draft.title}.`);
      } else {
        helpers.notifyError('Could not save SEO settings.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-3xl text-[#1C1917]">SEO Management</h2>
          <p className="text-sm text-[#6E655D]">
            Configure per-page Google titles, meta descriptions, keywords, OpenGraph cards, and dynamic sitemap.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider hover:border-[#B89352]"
          >
            <span>sitemap.xml</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="/robots.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider hover:border-[#B89352]"
          >
            <span>robots.txt</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-white border border-[#1C1917]/10 divide-y divide-[#1C1917]/8 h-fit">
          {pages.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className={`w-full text-left p-4 flex items-center justify-between cursor-pointer ${
                p.id === draft?.id ? 'bg-[#FAF8F5] border-l-2 border-l-[#B89352]' : 'hover:bg-[#FAF8F5]/60'
              }`}
            >
              <div>
                <p className="text-sm font-medium text-[#1C1917]">{p.title}</p>
                <p className="text-xs text-[#6E655D]">{p.slug}</p>
              </div>
              <span className="text-[11px] uppercase text-[#6E655D]">{p.status}</span>
            </button>
          ))}
        </div>

        {draft && (
          <form onSubmit={handleSave} className="lg:col-span-8 bg-white border border-[#1C1917]/10 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1C1917]/10 pb-3">
              <h3 className="font-serif-display text-2xl">{draft.title} SEO Settings</h3>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1C1917] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#B89352] cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save SEO'}</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                SEO Page Title ({draft.seoTitle.length}/70 recommended)
              </label>
              <input
                type="text"
                value={draft.seoTitle}
                onChange={(e) => setDraft({ ...draft, seoTitle: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Meta Description ({draft.seoDescription.length}/160 recommended)
              </label>
              <textarea
                rows={3}
                value={draft.seoDescription}
                onChange={(e) => setDraft({ ...draft, seoDescription: e.target.value })}
                className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                  SEO Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={draft.seoKeywords}
                  onChange={(e) => setDraft({ ...draft, seoKeywords: e.target.value })}
                  className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                  Canonical Path
                </label>
                <input
                  type="text"
                  value={draft.canonicalUrl}
                  onChange={(e) => setDraft({ ...draft, canonicalUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#1C1917]/10">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                  Social Share Title (OpenGraph)
                </label>
                <input
                  type="text"
                  value={draft.socialTitle}
                  onChange={(e) => setDraft({ ...draft, socialTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                  Social Share Image (OG Image)
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-9 bg-[#E8DEC8] overflow-hidden shrink-0">
                    <StudioImage src={draft.ogImage} alt="OG" className="w-full h-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPickingOg(true)}
                    className="px-3 py-2 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  >
                    Select OG Image
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      <MediaPickerModal
        open={pickingOg}
        media={helpers.media}
        onClose={() => setPickingOg(false)}
        onUploadComplete={helpers.refreshAll}
        onSelect={(url) => draft && setDraft({ ...draft, ogImage: url })}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. USER MANAGEMENT (RBAC - SUPER ADMIN ONLY)
// ---------------------------------------------------------------------------
export function UsersManagerPanel({
  users,
  currentUserId,
  helpers,
}: {
  users: AdminUser[];
  currentUserId: string;
  helpers: PanelHelpers;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminRole>('Content Manager');
  const [resetUser, setResetUser] = useState<AdminUser | null>(null);
  const [resetPw, setResetPw] = useState('');

  const roles: AdminRole[] = [
    'Super Admin',
    'Content Manager',
    'Gallery Manager',
    'Booking Manager',
  ];

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    const json = await res.json();
    if (!res.ok) {
      helpers.notifyError(json.error || 'Could not create admin user.');
      return;
    }
    setName('');
    setEmail('');
    setPassword('');
    await helpers.refreshAll();
    helpers.notify(`Created ${role} account for ${json.user.email}.`);
  };

  const updateUser = async (u: AdminUser, patch: Partial<AdminUser> & { newPassword?: string }) => {
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (!res.ok) {
      helpers.notifyError(json.error || 'Update failed.');
      return;
    }
    await helpers.refreshAll();
    helpers.notify(`Updated ${u.email}.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif-display text-3xl text-[#1C1917]">User Management (RBAC)</h2>
        <p className="text-sm text-[#6E655D]">
          Add studio team members with role-based permissions, disable accounts, or issue password resets.
        </p>
      </div>

      <form
        onSubmit={handleCreateUser}
        className="bg-white border border-[#1C1917]/10 p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end"
      >
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Studio Editor"
            className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="team@twinsvideopro.com"
            className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
            Temporary Password
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 chars"
            className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
            className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm bg-white"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1C1917] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#B89352] cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Admin User</span>
        </button>
      </form>

      <div className="bg-white border border-[#1C1917]/10 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1C1917]/10 bg-[#FAF8F5] text-[11px] font-semibold uppercase tracking-wider text-[#6E655D]">
              <th className="py-3.5 px-4">Administrator</th>
              <th className="py-3.5 px-4">Role</th>
              <th className="py-3.5 px-4">Account Status</th>
              <th className="py-3.5 px-4">Last Login</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C1917]/8 text-sm">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="py-3.5 px-4">
                  <p className="font-semibold text-[#1C1917]">
                    {u.name} {u.id === currentUserId ? '(You)' : ''}
                  </p>
                  <p className="text-xs text-[#6E655D]">{u.email}</p>
                </td>
                <td className="py-3.5 px-4">
                  <select
                    value={u.role}
                    disabled={u.id === currentUserId}
                    onChange={(e) => updateUser(u, { role: e.target.value as AdminRole })}
                    className="px-2.5 py-1.5 border border-[#1C1917]/15 text-xs bg-white disabled:opacity-60"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-3.5 px-4">
                  <button
                    type="button"
                    disabled={u.id === currentUserId}
                    onClick={() => updateUser(u, { active: !u.active })}
                    className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider border cursor-pointer disabled:opacity-60 ${
                      u.active
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                  >
                    {u.active ? 'Active' : 'Disabled'}
                  </button>
                </td>
                <td className="py-3.5 px-4 text-xs text-[#6E655D]">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setResetUser(u);
                      setResetPw('');
                    }}
                    className="px-3 py-1.5 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider hover:border-[#B89352] cursor-pointer"
                  >
                    Reset Password
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {resetUser && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setResetUser(null)}
          className="fixed inset-0 z-50 bg-[#141210]/70 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-md w-full p-6 border border-[#1C1917]/15 space-y-4"
          >
            <h3 className="font-serif-display text-2xl">Reset Password for {resetUser.email}</h3>
            <input
              type="password"
              minLength={8}
              value={resetPw}
              onChange={(e) => setResetPw(e.target.value)}
              placeholder="Enter new password (8+ chars)"
              className="w-full px-3.5 py-2.5 border border-[#1C1917]/15 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetUser(null)}
                className="px-4 py-2 border border-[#1C1917]/20 text-xs font-semibold uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await updateUser(resetUser, { newPassword: resetPw });
                  setResetUser(null);
                }}
                disabled={resetPw.length < 8}
                className="px-4 py-2 bg-[#1C1917] text-white text-xs font-semibold uppercase disabled:opacity-50 cursor-pointer"
              >
                Apply Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. WEBSITE SETTINGS (SUPER ADMIN ONLY)
// ---------------------------------------------------------------------------
export function SettingsManagerPanel({
  settings,
  helpers,
}: {
  settings: WebsiteSettings;
  helpers: PanelHelpers;
}) {
  const [draft, setDraft] = useState(settings);
  const [pickingFor, setPickingFor] = useState<'logo' | 'favicon' | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        await helpers.refreshAll();
        helpers.notify('Global website settings updated.');
      } else {
        helpers.notifyError('Could not save settings.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-3xl text-[#1C1917]">Website Settings</h2>
          <p className="text-sm text-[#6E655D]">
            Global brand identity, studio logo, favicon, theme colors, analytics ID, and maintenance mode.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.14em] hover:bg-[#B89352] cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      <div className="bg-white border border-[#1C1917]/10 p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Website Name
            </label>
            <input
              type="text"
              value={draft.websiteName}
              onChange={(e) => setDraft({ ...draft, websiteName: e.target.value })}
              className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Google Analytics Measurement ID
            </label>
            <input
              type="text"
              value={draft.googleAnalyticsId}
              onChange={(e) => setDraft({ ...draft, googleAnalyticsId: e.target.value })}
              placeholder="G-XXXXXXXXXX"
              className="w-full px-3 py-2 border border-[#1C1917]/15 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-[#1C1917]/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-[#141210] shrink-0">
              <StudioImage src={draft.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1.5">Header Studio Logo</p>
              <button
                type="button"
                onClick={() => setPickingFor('logo')}
                className="px-3 py-1.5 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Change Logo
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-[#141210] shrink-0">
              <StudioImage src={draft.faviconUrl} alt="Favicon" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1.5">Browser Favicon</p>
              <button
                type="button"
                onClick={() => setPickingFor('favicon')}
                className="px-3 py-1.5 border border-[#1C1917]/20 text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Change Favicon
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2 border-t border-[#1C1917]/10">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Primary Gold Accent
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={draft.primaryColor}
                onChange={(e) => setDraft({ ...draft, primaryColor: e.target.value })}
                className="w-10 h-9 border border-[#1C1917]/15 cursor-pointer"
              />
              <input
                type="text"
                value={draft.primaryColor}
                onChange={(e) => setDraft({ ...draft, primaryColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-[#1C1917]/15 text-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Charcoal Ink Accent
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={draft.accentColor}
                onChange={(e) => setDraft({ ...draft, accentColor: e.target.value })}
                className="w-10 h-9 border border-[#1C1917]/15 cursor-pointer"
              />
              <input
                type="text"
                value={draft.accentColor}
                onChange={(e) => setDraft({ ...draft, accentColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-[#1C1917]/15 text-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Ivory Canvas Background
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={draft.backgroundColor}
                onChange={(e) => setDraft({ ...draft, backgroundColor: e.target.value })}
                className="w-10 h-9 border border-[#1C1917]/15 cursor-pointer"
              />
              <input
                type="text"
                value={draft.backgroundColor}
                onChange={(e) => setDraft({ ...draft, backgroundColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-[#1C1917]/15 text-sm font-mono"
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#FAF8F5] border border-[#1C1917]/12 space-y-3">
          <label className="flex items-center gap-3 text-sm font-semibold text-[#1C1917] cursor-pointer">
            <input
              type="checkbox"
              checked={draft.maintenanceMode}
              onChange={(e) => setDraft({ ...draft, maintenanceMode: e.target.checked })}
              className="accent-[#B89352]"
            />
            <span>Enable Public Website Maintenance Mode (Admin CMS stays accessible)</span>
          </label>
          <textarea
            rows={2}
            value={draft.maintenanceMessage}
            onChange={(e) => setDraft({ ...draft, maintenanceMessage: e.target.value })}
            placeholder="Message shown to public visitors during scheduled maintenance..."
            className="w-full px-3 py-2 bg-white border border-[#1C1917]/15 text-sm"
          />
        </div>
      </div>

      <MediaPickerModal
        open={Boolean(pickingFor)}
        media={helpers.media}
        onClose={() => setPickingFor(null)}
        onUploadComplete={helpers.refreshAll}
        onSelect={(url) => {
          if (pickingFor === 'logo') setDraft({ ...draft, logoUrl: url });
          if (pickingFor === 'favicon') setDraft({ ...draft, faviconUrl: url });
        }}
      />
    </form>
  );
}

// ---------------------------------------------------------------------------
// 8. CHANGE PASSWORD PANEL
// ---------------------------------------------------------------------------
export function ChangePasswordPanel({ helpers }: { helpers: PanelHelpers }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      helpers.notifyError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      helpers.notifyError('New password and confirmation do not match.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) {
        helpers.notifyError(json.error || 'Could not update password.');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      helpers.notify('Your administrator password has been updated securely.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="font-serif-display text-3xl text-[#1C1917]">Change Password</h2>
        <p className="text-sm text-[#6E655D]">
          Update your administrator sign-in credentials. Passwords are salted and hashed with scrypt on the server.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-[#1C1917]/10 p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
            Current Password
          </label>
          <input
            type={showAll ? 'text' : 'password'}
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-[#1C1917]/15 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
            New Password (8+ characters)
          </label>
          <input
            type={showAll ? 'text' : 'password'}
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-[#1C1917]/15 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
            Confirm New Password
          </label>
          <input
            type={showAll ? 'text' : 'password'}
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-[#1C1917]/15 text-sm"
          />
        </div>
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs text-[#6E655D] hover:text-[#1C1917] cursor-pointer"
          >
            {showAll ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showAll ? 'Hide passwords' : 'Show passwords'}</span>
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-[#1C1917] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#B89352] cursor-pointer"
          >
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
