import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Send,
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';

export function ContactSection() {
  const { data, navigate } = useStudio();
  const { businessInfo, homepage } = data;
  const loadedAtRef = useRef<number>(Date.now());

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const mapsQuery = encodeURIComponent(
    `${businessInfo.addressLine1} ${businessInfo.addressLine2} ${businessInfo.country}`
  );
  const mapsDirectionsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSentMessage(null);

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setError('Please enter your name, email, and phone number.');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          serviceRequired: 'General Contact Enquiry',
          additionalRequirements: message,
          website: honeypot,
          formLoadedAt: loadedAtRef.current,
          source: 'contact',
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Could not send your message.');
      } else {
        setSentMessage(json.message);
        setFullName('');
        setEmail('');
        setPhone('');
        setMessage('');
      }
    } catch {
      setError('Network error. Please call us or email twinssupport@gmail.com.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="py-20 lg:py-28 bg-[#FAF8F5]" aria-labelledby="contact-heading">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Business Contact Information & Location */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <p className="text-xs tracking-[0.24em] uppercase text-[#B89352] font-semibold">
                Connect With Our Studio
              </p>
              <h2
                id="contact-heading"
                className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#1C1917] text-balance"
              >
                {homepage.contactHeading}
              </h2>
            </div>

            <div className="space-y-5 pt-4 border-t border-[#1C1917]/10">
              <p className="font-serif-display text-2xl tracking-[0.08em] uppercase text-[#1C1917]">
                {businessInfo.businessName}
              </p>

              <div className="space-y-4">
                <a
                  href={`tel:${businessInfo.phone.replace(/[^\d+]/g, '')}`}
                  className="flex items-center justify-between p-4 bg-[#F2ECE1] border border-[#1C1917]/10 hover:border-[#B89352] transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <Phone className="w-5 h-5 text-[#B89352]" />
                    <div>
                      <p className="text-xs text-[#6E655D] uppercase tracking-[0.1em]">
                        Call Studio
                      </p>
                      <p className="text-sm sm:text-base font-medium text-[#1C1917] tabular-nums">
                        {businessInfo.phone}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs tracking-[0.12em] uppercase text-[#B89352] font-semibold">
                    Call Now
                  </span>
                </a>

                <a
                  href={`mailto:${businessInfo.email}`}
                  className="flex items-center justify-between p-4 bg-[#F2ECE1] border border-[#1C1917]/10 hover:border-[#B89352] transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <Mail className="w-5 h-5 text-[#B89352]" />
                    <div>
                      <p className="text-xs text-[#6E655D] uppercase tracking-[0.1em]">
                        Email Us
                      </p>
                      <p className="text-sm sm:text-base font-medium text-[#1C1917]">
                        {businessInfo.email}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs tracking-[0.12em] uppercase text-[#B89352] font-semibold">
                    Email
                  </span>
                </a>

                <div className="p-5 bg-[#F2ECE1] border border-[#1C1917]/10 space-y-4">
                  <div className="flex items-start gap-3.5">
                    <MapPin className="w-5 h-5 text-[#B89352] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-[#6E655D] uppercase tracking-[0.1em]">
                        Studio Address
                      </p>
                      <p className="text-sm sm:text-base font-medium text-[#1C1917] mt-0.5">
                        {businessInfo.addressLine1} {businessInfo.addressLine2}{' '}
                        {businessInfo.country}
                      </p>
                      <p className="text-xs text-[#6E655D] mt-1">
                        Serving Angle Vale, Adelaide, Barossa Valley, Adelaide Hills &amp; Fleurieu Peninsula.
                      </p>
                    </div>
                  </div>
                  <a
                    href={mapsDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] uppercase text-[#1C1917] hover:text-[#B89352] transition-colors"
                  >
                    <span>Open Studio Location in Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={businessInfo.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#1C1917]/20 text-xs font-semibold tracking-[0.12em] uppercase text-[#1C1917] hover:border-[#B89352] hover:text-[#B89352] transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </a>
                <a
                  href={businessInfo.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#1C1917]/20 text-xs font-semibold tracking-[0.12em] uppercase text-[#1C1917] hover:border-[#B89352] hover:text-[#B89352] transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                  <span>Facebook</span>
                </a>
                <button
                  type="button"
                  onClick={() => navigate('/book')}
                  className="px-6 py-2.5 bg-[#B89352] text-[#FAF8F5] text-xs font-semibold tracking-[0.14em] uppercase hover:bg-[#1C1917] transition-colors cursor-pointer"
                >
                  {homepage.contactCta}
                </button>
              </div>
            </div>
          </div>

          {/* Contact Inquiry Form */}
          <div className="lg:col-span-7 bg-[#F2ECE1]/70 border border-[#1C1917]/10 p-6 sm:p-10">
            <h3 className="font-serif-display text-2xl sm:text-3xl text-[#1C1917] mb-2">
              Send Us a Message
            </h3>
            <p className="text-sm text-[#6E655D] mb-8">
              Have a question about availability, travel across Australia, or bespoke coverage? Send a note directly to our studio.
            </p>

            {sentMessage ? (
              <div className="py-10 text-center space-y-4">
                <CheckCircle2 className="w-11 h-11 text-[#B89352] mx-auto" />
                <p className="font-serif-display text-2xl text-[#1C1917]">Message Sent</p>
                <p className="text-sm text-[#6E655D] max-w-md mx-auto">{sentMessage}</p>
                <button
                  type="button"
                  onClick={() => {
                    setSentMessage(null);
                    loadedAtRef.current = Date.now();
                  }}
                  className="px-6 py-3 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold tracking-[0.14em] uppercase hover:bg-[#B89352] transition-colors cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="contact-website">Website</label>
                  <input
                    id="contact-website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="p-3.5 bg-red-50 border border-red-200 text-red-900 text-sm"
                  >
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="ct-name"
                      className="block text-xs tracking-[0.12em] uppercase text-[#1C1917] font-semibold mb-2"
                    >
                      Your Name <span className="text-[#B89352]">*</span>
                    </label>
                    <input
                      id="ct-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#1C1917]/15 text-sm text-[#1C1917] focus:outline-none focus:border-[#B89352]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="ct-phone"
                      className="block text-xs tracking-[0.12em] uppercase text-[#1C1917] font-semibold mb-2"
                    >
                      Phone Number <span className="text-[#B89352]">*</span>
                    </label>
                    <input
                      id="ct-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+61 400 000 000"
                      className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#1C1917]/15 text-sm text-[#1C1917] focus:outline-none focus:border-[#B89352]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="ct-email"
                    className="block text-xs tracking-[0.12em] uppercase text-[#1C1917] font-semibold mb-2"
                  >
                    Email Address <span className="text-[#B89352]">*</span>
                  </label>
                  <input
                    id="ct-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#1C1917]/15 text-sm text-[#1C1917] focus:outline-none focus:border-[#B89352]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ct-msg"
                    className="block text-xs tracking-[0.12em] uppercase text-[#1C1917] font-semibold mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="ct-msg"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your wedding date, location, or how we can help..."
                    className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#1C1917]/15 text-sm text-[#1C1917] focus:outline-none focus:border-[#B89352]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold tracking-[0.16em] uppercase hover:bg-[#B89352] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{sending ? 'Sending...' : 'Send Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
