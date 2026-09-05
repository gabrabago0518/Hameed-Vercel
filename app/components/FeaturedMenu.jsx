import Image from "next/image";
import Link from "next/link";
import { prisma } from "../../lib/prisma.js";

// Six real menu items, pulled live from Prisma rather than hardcoded, so a
// price change in the menu is reflected here automatically. Image filenames
// are looked up by a slug derived from the real item name — see the
// public/images/menu/ note in the project's image-handling docs.
//
// Updated for the menu overhaul that retired/removed the previous lineup
// (Pastil, Spicy Pastil Silog, Bulalo (Regular), Pares, Iced Tea) — picked a
// spread across the new categories, plus the explicitly-named best seller.
const FEATURED_ITEM_NAMES = [
  "Pastilog Combo",
  "Chicken Sisig",
  "Chicken Wings",
  "Bangsilog",
  "Sizzling T-Bone Steak",
  "Tapsilog Combo",
];

const IMAGE_SLUGS = {
  "Pastilog Combo": "pastilog-combo",
  "Chicken Sisig": "chicken-sisig",
  "Chicken Wings": "chicken-wings",
  Bangsilog: "bangsilog",
  "Sizzling T-Bone Steak": "sizzling-t-bone-steak",
  "Tapsilog Combo": "tapsilog-combo",
};

export default async function FeaturedMenu() {
  const items = await prisma.menuItem.findMany({
    where: { name: { in: FEATURED_ITEM_NAMES }, isRetired: false },
  });

  // Keep the requested display order rather than whatever order the DB
  // query happens to return.
  const ordered = FEATURED_ITEM_NAMES.map((name) => items.find((i) => i.name === name)).filter(
    Boolean
  );

  if (ordered.length === 0) return null;

  return (
    <section className="w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h2 className="text-center font-[family-name:var(--font-heading)] text-2xl uppercase tracking-wide text-zinc-900 sm:text-3xl">
        Fan Favorites
      </h2>
      <p className="mx-auto mt-2 max-w-md text-center text-sm text-zinc-600">
        The dishes our customers order again and again.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((item) => (
          <div
            key={item.id}
            className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
          >
            <div className="relative aspect-[4/3] w-full bg-zinc-100">
              <Image
                src={`/images/menu/${IMAGE_SLUGS[item.name]}.webp`}
                alt={item.name}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-[family-name:var(--font-heading)] text-lg uppercase tracking-wide text-zinc-900">
                {item.name}
              </h3>
              {item.description && (
                <p className="mt-1 flex-1 text-sm text-zinc-600">{item.description}</p>
              )}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-red-600">
                  ₱{Number(item.price).toFixed(2)}
                </span>
                <Link
                  href="/menu"
                  className="flex min-h-11 items-center rounded-full bg-red-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                >
                  Order Now
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
