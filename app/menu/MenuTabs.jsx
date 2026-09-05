"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "./AddToCartButton.jsx";
import AddToCartWithOptions from "./AddToCartWithOptions.jsx";

// Turns a menu item's name into the filename its photo is expected at, e.g.
// "Chicken Sisig" -> "chicken-sisig", so a real photo just needs to be
// dropped in as public/images/menu/<slug>.webp with no code change. Falls
// back to a plain grey placeholder square (via Next Image's onError isn't
// available server-side, so this is handled by the browser just showing a
// broken image) until a real photo exists for that item.
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// A horizontal, KFC-style category switcher — one category's items shown at
// a time instead of every category stacked in one long scroll. Needs client
// state for "which tab is active," which a plain Server Component can't
// hold, so the parent page fetches and shapes the data, then hands it here.
export default function MenuTabs({ categories, hasUser }) {
  const [activeId, setActiveId] = useState(categories[0]?.id);
  const active = categories.find((category) => category.id === activeId) ?? categories[0];

  if (!active) return null;

  return (
    <div>
      {/* Not sticky — the site header is already `sticky top-0`, and a
          second sticky-top-0 element here would land on top of it once
          scrolled, covering the header's cart button/nav and making them
          untappable. A plain (non-sticky) horizontally-scrollable row
          avoids that entirely. */}
      <div className="-mx-6 overflow-x-auto bg-white px-6 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-6 border-b border-zinc-200 sm:gap-8">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveId(category.id)}
              className={`min-h-11 whitespace-nowrap border-b-2 px-1 text-sm font-semibold uppercase tracking-wide transition-colors ${
                category.id === active.id
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {active.items.map((item) => (
          <article
            key={item.id}
            className={`flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm ${
              item.isAvailable ? "" : "opacity-60 grayscale"
            }`}
          >
            <div className="relative aspect-[4/3] w-full bg-zinc-100">
              <Image
                src={`/images/menu/${slugify(item.name)}.webp`}
                alt={item.name}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </div>

            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-900">{item.name}</h3>
                {!item.isAvailable && (
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                    Out of Stock
                  </span>
                )}
              </div>
              {item.description && (
                <p className="mt-1 flex-1 text-sm text-zinc-600">{item.description}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-y-3">
                <span className="font-semibold text-red-600">₱{item.price.toFixed(2)}</span>
                {!item.isAvailable ? (
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-full bg-zinc-300 px-4 py-1.5 text-sm font-semibold text-zinc-500"
                  >
                    Add
                  </button>
                ) : hasUser ? (
                  item.addons.length > 0 || item.variantGroups.length > 0 ? (
                    <AddToCartWithOptions
                      menuItemId={item.id}
                      itemName={item.name}
                      addons={item.addons}
                      variantGroups={item.variantGroups}
                    />
                  ) : (
                    <AddToCartButton menuItemId={item.id} itemName={item.name} />
                  )
                ) : (
                  <Link
                    href="/login"
                    className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                  >
                    Add
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
