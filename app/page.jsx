import HeroCarousel from "./components/HeroCarousel.jsx";
import FeaturedMenu from "./components/FeaturedMenu.jsx";
import AboutSection from "./components/AboutSection.jsx";
import BlogSection from "./components/BlogSection.jsx";
import CustomerGallery from "./components/CustomerGallery.jsx";
import NewsSection from "./components/NewsSection.jsx";

const heroSlides = [
  {
    src: "/images/hero/pastil.webp",
    alt: "Hameed's signature Pastil",
    title: "Order Pastil Now",
    ctaLabel: "Order Pastil Now",
    ctaHref: "/menu",
  },
  {
    src: "/images/hero/silog-meals.webp",
    alt: "Silog meals — Tapsilog, Chicksilog, and more",
    title: "Silog Meals, Any Time of Day",
    ctaLabel: "See Silog Meals",
    ctaHref: "/menu",
  },
  {
    src: "/images/hero/pares.webp",
    alt: "Beef Pares with garlic rice",
    title: "Try Our Beef Pares",
    ctaLabel: "Order Pares",
    ctaHref: "/menu",
  },
  {
    src: "/images/hero/bulalo.webp",
    alt: "Bulalo beef bone marrow soup",
    title: "Bulalo, Made the Slow Way",
    ctaLabel: "Order Bulalo",
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
      <BlogSection />
      <CustomerGallery />
      <NewsSection />
    </main>
  );
}
