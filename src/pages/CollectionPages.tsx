import { PageHero } from '../components/PageHero';
import { GallerySection } from '../components/GallerySection';
import { PackagesSection } from '../components/PackagesSection';
import { BookingForm } from '../components/BookingForm';
import { ContactSection } from '../components/ContactSection';
import { WhyChooseUsSection } from '../components/WhyChooseUsSection';

export function PortfolioGalleryPage() {
  return (
    <div>
      <PageHero
        eyebrow="Portfolio Gallery"
        title="OUR BEAUTIFUL LOVE STORIES"
        description="Curated wedding photography across traditional celebrations, luxury estates, sunlit gardens, bridal portraiture, and evening receptions."
        image="img://ceremony"
      />
      <GallerySection />
      <BookingForm />
    </div>
  );
}

export function PackagesPage() {
  return (
    <div>
      <PageHero
        eyebrow="Wedding Packages"
        title="FIND THE PERFECT PACKAGE FOR YOUR SPECIAL DAY."
        description="Thoughtfully structured photography and videography collections tailored to intimate elopements and grand full-day celebrations."
        image="img://decor"
      />
      <PackagesSection showHeader={false} />
      <WhyChooseUsSection />
      <BookingForm />
    </div>
  );
}

export function BookNowPage() {
  return (
    <div>
      <PageHero
        eyebrow="Book Your Wedding"
        title="LET'S CAPTURE YOUR LOVE STORY."
        description="Tell us about your wedding date, venue, and preferred collection. We respond personally to every inquiry."
        image="img://hero"
      />
      <BookingForm />
    </div>
  );
}

export function ContactPage() {
  return (
    <div>
      <PageHero
        eyebrow="Contact Twins Twins Video Pro"
        title="LET'S MAKE YOUR MEMORIES LAST FOREVER."
        description="Reach our Angle Vale, South Australia studio by phone, email, or inquiry form to check availability for your wedding date."
        image="img://decor"
      />
      <ContactSection />
    </div>
  );
}
