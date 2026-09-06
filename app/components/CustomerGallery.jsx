import Image from "next/image";

// Static list — filenames map straight to public/images/customers/. Swap the
// array (or the count) once real customer photos are dropped in; nothing
// else about the section needs to change.
const photos = Array.from({ length: 12 }, (_, i) => ({
  src: `/images/customers/customer-${i + 1}.webp`,
  alt: `Customer enjoying Hameed's food`,
}));

export default function CustomerGallery() {
  return (
    <section className="w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h2 className="text-center font-[family-name:var(--font-heading)] text-2xl uppercase tracking-wide text-zinc-900 sm:text-3xl">
        Loved by Our Customers
      </h2>
      <p className="mx-auto mt-2 max-w-md text-center text-sm text-zinc-600">
        Real photos from real orders — tag us to be featured.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
        {photos.map((photo, i) => (
          <div key={photo.src} className="group relative aspect-square overflow-hidden rounded-xl bg-zinc-100">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Caption overlay — desktop hover only, per spec (no tap-to-reveal on mobile). */}
            <div className="absolute inset-0 hidden items-end bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:flex">
              <p className="text-sm font-medium text-white">Customer #{i + 1}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
