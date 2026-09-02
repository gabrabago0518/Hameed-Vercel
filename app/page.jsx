import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-16 text-center">
      <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
        Hameed <span className="text-red-600">the Love Recipe</span>
      </h1>
      <p className="mt-3 max-w-md text-lg text-zinc-600">
        Home-style Filipino favorites, delivered fast.
      </p>

      <div className="mt-10 flex w-full max-w-sm flex-col items-center rounded-3xl border border-red-100 bg-red-50 px-8 py-8">
        <span className="rounded-full bg-red-600 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          Our Bestseller
        </span>
        <h2 className="mt-4 font-[family-name:var(--font-heading)] text-2xl font-bold text-zinc-900">
          Pastil
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Steamed rice topped with savory shredded chicken, wrapped in banana
          leaf — our most-loved dish.
        </p>
      </div>

      <Link
        href="/menu"
        className="mt-10 rounded-full bg-red-600 px-10 py-3 text-base font-semibold text-white transition-colors hover:bg-red-700"
      >
        Start Ordering
      </Link>
    </main>
  );
}
