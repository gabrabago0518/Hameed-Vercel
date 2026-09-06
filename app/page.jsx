import HeroCarousel from "./components/HeroCarousel.jsx";
import FeaturedMenu from "./components/FeaturedMenu.jsx";
import AboutSection from "./components/AboutSection.jsx";
import ResellerSection from "./components/ResellerSection.jsx";
import BlogSection from "./components/BlogSection.jsx";
import CustomerGallery from "./components/CustomerGallery.jsx";
import NewsSection from "./components/NewsSection.jsx";
import TestimonialsSection from "./components/TestimonialsSection.jsx";

// The Pares and Bulalo slides that used to be here were removed — both
// items were retired/deleted in the menu overhaul that replaced the whole
// lineup, and the bulalo.webp poster specifically promoted both of them
// together, so keeping either slide would have been advertising something
// no longer orderable. The Pastil slide's copy was updated to point at
// Pastilog Combo (its closest equivalent in the new menu) rather than
// removed outright, since the jars photo is still Pastil-branded — flagging
// that image is technically for the retail jar product line, not this
// delivery item, same pre-existing mismatch noted when these photos were
// first added. Needs new photos for Sizzling Platter/Combo Meals to fill
// the carousel back out to its previous slide count.
const heroSlides = [
  {
    src: "/images/hero/pastil.webp",
    alt: "Hameed's Pastilog Combo",
    title: "Order Pastilog Combo Now",
    ctaLabel: "Order Pastilog Combo",
    ctaHref: "/menu",
  },
  {
    src: "/images/hero/silog-meals.webp",
    alt: "Silog meals — Tapsilog, Chicsilog, Bangsilog, and more",
    title: "Silog Meals, Any Time of Day",
    ctaLabel: "See Silog Meals",
    ctaHref: "/menu",
  },
  {
    src: "/images/hero/chicken-inasal.webp",
    alt: "Chicken Inasal",
  },
  {
    src: "/images/hero/chicken-sisig-promo.webp",
    alt: "Hameed Chicken Sisig Alacarte — always available at Maharlika and New Lower Bicutan branches",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center bg-white">
      <div className="w-full">
        <HeroCarousel slides={heroSlides} />
      </div>

      <FeaturedMenu />
      <AboutSection />
      <ResellerSection />
      <BlogSection />
      <CustomerGallery />
      <NewsSection />
      <TestimonialsSection />
    </main>
  );
}
