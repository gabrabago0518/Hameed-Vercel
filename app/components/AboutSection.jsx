import Image from "next/image";

export default function AboutSection() {
  return (
    <section className="w-full bg-red-50 py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:gap-12">
        <div className="relative aspect-square w-full max-w-xs shrink-0 overflow-hidden rounded-3xl shadow-lg sm:max-w-sm lg:w-2/5 lg:max-w-none">
          <Image
            src="/images/about/founder.webp"
            alt="The people behind Hameed the Love Recipe"
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="text-center lg:text-left">
          <span className="inline-block rounded-full bg-red-600 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Our Story
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-heading)] text-2xl uppercase tracking-wide text-zinc-900 sm:text-3xl">
            What is Hameed&apos;s?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-700 sm:text-base">
            Pastil is a Filipino-Muslim dish born in Mindanao — steamed rice
            wrapped in banana leaf and topped with savory shredded chicken,
            traditionally eaten by hand and shared among family. Hameed
            brought that same recipe, taught to him growing up, to Metro
            Manila — cooked the same way it always has been, no shortcuts.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-700 sm:text-base">
            What makes it special isn&apos;t just the taste — it&apos;s that
            every order carries a piece of that heritage with it. That&apos;s
            the love recipe.
          </p>
        </div>
      </div>

      {/* Two supporting photos — the actual kitchen where everything is
          cooked, and packed product ready to ship — backing up the "no
          shortcuts" claim above with a real look behind the scenes. */}
      <div className="mx-auto mt-8 grid w-full max-w-5xl grid-cols-1 gap-4 px-4 sm:mt-10 sm:grid-cols-2 sm:gap-6 sm:px-6">
        <div>
          <div className="relative aspect-video overflow-hidden rounded-2xl shadow-md">
            <Image
              src="/images/about/story-behind.webp"
              alt="Inside Hameed's kitchen"
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <p className="mt-2 text-center text-xs text-zinc-500 sm:text-sm">
            Cooked fresh daily in our own kitchen
          </p>
        </div>
        <div>
          <div className="relative aspect-video overflow-hidden rounded-2xl shadow-md">
            <Image
              src="/images/about/how-we-pack.webp"
              alt="How Hameed's products are packed"
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <p className="mt-2 text-center text-xs text-zinc-500 sm:text-sm">
            Carefully packed and ready to go
          </p>
        </div>
      </div>
    </section>
  );
}
