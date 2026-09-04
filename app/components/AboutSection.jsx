import Image from "next/image";

export default function AboutSection() {
  return (
    <section className="w-full bg-red-50 py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:gap-12">
        <div className="relative aspect-square w-full max-w-xs shrink-0 overflow-hidden rounded-3xl shadow-lg sm:max-w-sm lg:w-2/5 lg:max-w-none">
          <Image
            src="/images/about/founder.webp"
            alt="Hameed, founder of Hameed's Pastil"
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
    </section>
  );
}
