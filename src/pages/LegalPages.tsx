import { PageHero } from '../components/PageHero';
import { useStudio } from '../context/StudioContext';

export function PrivacyPolicyPage() {
  const { data } = useStudio();
  const { businessInfo } = data;

  return (
    <div>
      <PageHero
        eyebrow="Legal & Privacy"
        title="Privacy Policy"
        description={`How ${businessInfo.businessName} protects your personal inquiry details, wedding imagery, and private galleries.`}
        image="img://about"
      />

      <section className="py-16 lg:py-24 bg-[#FAF8F5]">
        <div className="max-w-3xl mx-auto px-6 space-y-8 text-sm sm:text-base text-[#6E655D] leading-relaxed">
          <div className="space-y-3">
            <h2 className="font-serif-display text-2xl sm:text-3xl text-[#1C1917]">
              1. Information We Collect
            </h2>
            <p>
              When you submit a wedding booking enquiry or contact message to {businessInfo.businessName}, we collect the personal details you provide—such as your full name, email address, phone number, wedding date, venue, and coverage preferences—solely to respond to your enquiry and coordinate your photography or videography services.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-serif-display text-2xl sm:text-3xl text-[#1C1917]">
              2. How Your Information Is Used
            </h2>
            <p>
              Your contact and wedding details are never sold, rented, or shared with third-party marketers. Inquiry notifications are transmitted securely to our studio team at {businessInfo.email} for consultation scheduling, package proposals, and client care.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-serif-display text-2xl sm:text-3xl text-[#1C1917]">
              3. Wedding Photography &amp; Gallery Privacy
            </h2>
            <p>
              Client wedding photographs and films are only showcased publicly in our portfolio or testimonials with couple consent. Private online galleries remain accessible only to authorised clients and invited family members.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-serif-display text-2xl sm:text-3xl text-[#1C1917]">
              4. Contact for Privacy Requests
            </h2>
            <p>
              To request access, correction, or deletion of your enquiry records, please contact {businessInfo.businessName} at {businessInfo.email} or {businessInfo.phone}, {businessInfo.addressLine1} {businessInfo.addressLine2} {businessInfo.country}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export function TermsPage() {
  const { data } = useStudio();
  const { businessInfo } = data;

  return (
    <div>
      <PageHero
        eyebrow="Studio Agreements"
        title="Terms & Conditions"
        description={`Booking terms, creative copyright, and service guidelines for ${businessInfo.businessName}.`}
        image="img://decor"
      />

      <section className="py-16 lg:py-24 bg-[#FAF8F5]">
        <div className="max-w-3xl mx-auto px-6 space-y-8 text-sm sm:text-base text-[#6E655D] leading-relaxed">
          <div className="space-y-3">
            <h2 className="font-serif-display text-2xl sm:text-3xl text-[#1C1917]">
              1. Booking &amp; Date Reservation
            </h2>
            <p>
              Submitting an online enquiry checks studio availability and initiates a personalised quote. A wedding date is formally reserved upon execution of a signed studio service agreement and receipt of the agreed booking retainer.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-serif-display text-2xl sm:text-3xl text-[#1C1917]">
              2. Creative Delivery &amp; Editing
            </h2>
            <p>
              All photographs and cinematic films delivered by {businessInfo.businessName} are curated and colour-graded to match our studio’s signature aesthetic. Delivery timelines and package inclusions are confirmed in your custom proposal.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-serif-display text-2xl sm:text-3xl text-[#1C1917]">
              3. Usage Rights &amp; Print Permissions
            </h2>
            <p>
              Couples receive personal, non-commercial rights to print, share, and archive their delivered wedding images and films with family and friends. Commercial licensing requires prior written permission from {businessInfo.businessName}.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-serif-display text-2xl sm:text-3xl text-[#1C1917]">
              4. Studio Contact
            </h2>
            <p>
              Questions regarding bookings, rescheduling, or bespoke travel across Australia may be directed to {businessInfo.email} or {businessInfo.phone}.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
