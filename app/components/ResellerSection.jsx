import Image from "next/image";

// Photo not supplied yet — path is ready for it (public/images/reseller/
// pastil-in-a-jar.webp), same "build the slot, swap the file in later"
// pattern as News/Blog/Gallery sections elsewhere on this page. Next's
// <Image> doesn't error at render time over a missing file, so this section
// builds and serves fine with a broken-image icon until the real photo
// lands.
export default function ResellerSection() {
  return (
    <section className="w-full bg-red-50 py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4 sm:px-6 lg:flex-row-reverse lg:items-center lg:gap-12">
        <div className="relative aspect-square w-full max-w-xs shrink-0 overflow-hidden rounded-3xl bg-zinc-100 shadow-lg sm:max-w-sm lg:w-2/5 lg:max-w-none">
          <Image
            src="/images/reseller/pastil-in-a-jar.webp"
            alt="Pastil in a Jar"
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="text-center lg:text-left">
          <span className="inline-block rounded-full bg-red-600 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Reseller Program
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-heading)] text-2xl uppercase tracking-wide text-zinc-900 sm:text-3xl">
            Become Our Reseller — Pastil in a Jar
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-700 sm:text-base">
            Our signature pastil, packed fresh in a jar and ready to sell —
            perfect for online sellers, sari-sari stores, and food stalls
            looking to add a proven local favorite to their lineup.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-700 sm:text-base">
            No experience needed — we&apos;ll walk you through pricing and
            how it works. Message us to get started.
          </p>
          {/* Same placeholder Facebook link used in the footer — swap both
              for the real Page URL once there is one. */}
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-red-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Message Us on Facebook
          </a>
        </div>
      </div>
    </section>
  );
}
