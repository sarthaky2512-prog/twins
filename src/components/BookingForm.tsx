import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { useStudio } from '../context/StudioContext';

interface BookingFormProps {
  compact?: boolean;
}

const BUDGET_OPTIONS = [
  'Under $2,500',
  '$2,500 – $4,500',
  '$4,500 – $7,000',
  '$7,000+ Luxury Full-Day',
  'Prefer Custom Consultation',
];

export function BookingForm({ compact = false }: BookingFormProps) {
  const { data, bookingPrefill } = useStudio();
  const loadedAtRef = useRef<number>(Date.now());

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [weddingVenue, setWeddingVenue] = useState('');
  const [weddingLocation, setWeddingLocation] = useState('');
  const [serviceRequired, setServiceRequired] = useState('Wedding Photography & Videography');
  const [preferredPackage, setPreferredPackage] = useState('PACKAGE 2 – PREMIUM');
  const [estimatedBudget, setEstimatedBudget] = useState('$4,500 – $7,000');
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (bookingPrefill.service) {
      setServiceRequired(bookingPrefill.service);
    }
    if (bookingPrefill.packageName) {
      setPreferredPackage(bookingPrefill.packageName);
    }
  }, [bookingPrefill]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg('Please complete your full name, email address, and phone number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          weddingDate,
          weddingVenue,
          weddingLocation,
          serviceRequired,
          preferredPackage,
          estimatedBudget,
          additionalRequirements,
          website: honeypot,
          formLoadedAt: loadedAtRef.current,
          source: 'booking',
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || 'Could not submit booking inquiry. Please verify your details.');
      } else {
        setSuccessMsg(json.message);
        setFullName('');
        setEmail('');
        setPhone('');
        setWeddingDate('');
        setWeddingVenue('');
        setWeddingLocation('');
        setAdditionalRequirements('');
      }
    } catch {
      setErrorMsg('Network error while sending your inquiry. Please call us directly on +1 (510) 401-4907.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className={compact ? '' : 'py-20 lg:py-28 bg-[#FAF8F5]'}
      aria-labelledby="booking-heading"
    >
      <div className={compact ? '' : 'max-w-[1100px] mx-auto px-6 lg:px-10'}>
        {!compact && (
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <p className="text-xs tracking-[0.24em] uppercase text-[#B89352] font-semibold">
              Reserve Your Date
            </p>
            <h2
              id="booking-heading"
              className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#1C1917] text-balance"
            >
              {data.homepage.bookingHeading}
            </h2>
            <p className="text-sm sm:text-base text-[#6E655D]">
              Share the vision for your wedding celebration. Every inquiry goes directly to our Angle Vale studio team at{' '}
              <span className="text-[#1C1917] font-medium">{data.businessInfo.email}</span>.
            </p>
          </div>
        )}

        <div className="bg-[#F2ECE1]/70 border border-[#1C1917]/10 p-6 sm:p-10 lg:p-12">
          {successMsg ? (
            <div className="py-10 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-[#B89352] mx-auto" />
              <h3 className="font-serif-display text-3xl text-[#1C1917]">
                Booking Enquiry Received
              </h3>
              <p className="text-sm sm:text-base text-[#6E655D] max-w-lg mx-auto leading-relaxed">
                {successMsg}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSuccessMsg(null);
                  loadedAtRef.current = Date.now();
                }}
                className="mt-4 px-6 py-3 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold tracking-[0.14em] uppercase hover:bg-[#B89352] transition-colors cursor-pointer"
              >
                Send Another Enquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Hidden Anti-Spam Honeypot */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="booking-website">Website</label>
                <input
                  id="booking-website"
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="p-4 bg-red-50 border border-red-200 text-red-900 text-sm"
                >
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="bk-fullname"
                    className="block text-xs tracking-[0.12em] uppercase text-[#1C1917] font-semibold mb-2"
                  >
                    Full Name <span className="text-[#B89352]">*</span>
                  </label>
                  <input
                    id="bk-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Olivia Carter & Liam Reid"
                    className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#1C1917]/15 text-sm text-[#1C1917] focus:outline-none focus:border-[#B89352]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="bk-email"
                    className="block text-xs tracking-[0.12em] uppercase text-[#1C1917] font-semibold mb-2"
                  >
                    Email Address <span className="text-[#B89352]">*</span>
                  </label>
                  <input
                    id="bk-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="couple@example.com"
                    className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#1C1917]/15 text-sm text-[#1C1917] focus:outline-none focus:border-[#B89352]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="bk-phone"
                    className="block text-xs tracking-[0.12em] uppercase text-[#1C1917] font-semibold mb-2"
                  >
                    Phone Number <span className="text-[#B89352]">*</span>
                  </label>
                  <input
                    id="bk-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+61 400 000 000"
                    className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#1C1917]/15 text-sm text-[#1C1917] focus:outline-none focus:border-[#B89352]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="bk-date"
                    className="block text-xs tracking-[0.12em] uppercase text-[#1C1917] font-semibold mb-2"
                  >
                    Wedding Date
                  </label>
                  <input
                    id="bk-date"
                    type="date"
                    value={weddingDate}
                    onChange={(e) => setWeddingDate(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#1C1917]/15 text-sm text-[#1C1917] focus:outline-none focus:border-[#B89352]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="bk-venue"
                    className="block text-xs tracking-[0.12em] uppercase text-[#1C1917] font-semibold mb-2"
                  >
                    Wedding Venue
                  </label>
                  <input
                    id="bk-venue"
                    type="text"
                    value={weddingVenue}
                    onChange={(e) => setWeddingVenue(e.target.value)}
                    placeholder="e.g. Mount Lofty House or Vineyard Estate"
                    className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#1C1917]/15 text-sm text-[#1C1917] focus:outline-none focus:border-[#B89352]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="bk-location"
                    className="block text-xs tracking-[0.12em] uppercase text-[#1C1917] font-semibold mb-2"
                  >
                    Wedding Location
                  </label>
                  <input
                    id="bk-location"
                    type="text"
                    value={weddingLocation}
                    onChange={(e) => setWeddingLocation(e.target.value)}
                    placeholder="e.g. Adelaide, Barossa Valley, McLaren Vale"
                    className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#1C1917]/15 text-sm text-[#1C1917] focus:outline-none focus:border-[#B89352]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="bk-service"
                    className="block text-xs tracking-[0.12em] uppercase text-[#1C1917] font-semibold mb-2"
                  >
                    Photography Service Required
                  </label>
                  <select
                    id="bk-service"
                    value={serviceRequired}
                    onChange={(e) => setServiceRequired(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#1C1917]/15 text-sm text-[#1C1917] focus:outline-none focus:border-[#B89352]"
                  >
                    <option value="Wedding Photography & Videography">
                      Wedding Photography &amp; Videography
                    </option>
                    {data.services.map((srv) => (
                      <option key={srv.id} value={srv.title}>
                        {srv.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="bk-package"
                    className="block text-xs tracking-[0.12em] uppercase text-[#1C1917] font-semibold mb-2"
                  >
                    Preferred Package
                  </label>
                  <select
                    id="bk-package"
                    value={preferredPackage}
                    onChange={(e) => setPreferredPackage(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#1C1917]/15 text-sm text-[#1C1917] focus:outline-none focus:border-[#B89352]"
                  >
                    {data.packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.name}>
                        {pkg.name}
                      </option>
                    ))}
                    <option value="Custom Bespoke Collection">Custom Bespoke Collection</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="bk-budget"
                  className="block text-xs tracking-[0.12em] uppercase text-[#1C1917] font-semibold mb-2"
                >
                  Estimated Budget
                </label>
                <select
                  id="bk-budget"
                  value={estimatedBudget}
                  onChange={(e) => setEstimatedBudget(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#1C1917]/15 text-sm text-[#1C1917] focus:outline-none focus:border-[#B89352]"
                >
                  {BUDGET_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="bk-requirements"
                  className="block text-xs tracking-[0.12em] uppercase text-[#1C1917] font-semibold mb-2"
                >
                  Additional Requirements
                </label>
                <textarea
                  id="bk-requirements"
                  rows={4}
                  value={additionalRequirements}
                  onChange={(e) => setAdditionalRequirements(e.target.value)}
                  placeholder="Tell us about your ceremony traditions, timeline, guest count, or film preferences..."
                  className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#1C1917]/15 text-sm text-[#1C1917] focus:outline-none focus:border-[#B89352]"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs text-[#6E655D]">
                  Protected studio inquiry · Your details remain strictly confidential.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold tracking-[0.16em] uppercase hover:bg-[#B89352] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Sending Enquiry...' : 'SEND BOOKING ENQUIRY'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
