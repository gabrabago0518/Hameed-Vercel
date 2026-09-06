import Image from "next/image";
import { prisma } from "../../lib/prisma.js";

// Branch name/address come straight from the database (same source
// checkout's pickup selector uses) rather than being hardcoded here, so
// this never goes stale if a branch is ever renamed or its address is
// corrected. Photo filenames are derived from the branch name itself
// (same slugify pattern as app/menu/MenuTabs.jsx) — confirmed the real
// names are "Lower Bicutan Branch" and "New Lower Bicutan Branch" once
// the actual photos were uploaded under those exact names, which settled
// the earlier "Lower Bicutan" vs. "Maharlika" naming mismatch.
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function StoreLocationsSection() {
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  if (branches.length === 0) return null;

  return (
    <section className="w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h2 className="text-center font-[family-name:var(--font-heading)] text-2xl uppercase tracking-wide text-zinc-900 sm:text-3xl">
        Visit Our Store
      </h2>
      <p className="mx-auto mt-2 max-w-md text-center text-sm text-zinc-600">
        Come say hello, or pick up your order in person — find us at either
        branch.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {branches.map((branch) => (
          <div
            key={branch.id}
            className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
          >
            <div className="relative aspect-video bg-zinc-100">
              <Image
                src={`/images/stores/${slugify(branch.name)}.webp`}
                alt={branch.name}
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold text-zinc-900">
                {branch.name}
              </h3>
              <p className="mt-1 text-sm text-zinc-600">
                {branch.address}, {branch.city}
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${branch.address}, ${branch.city}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-red-600 hover:underline"
              >
                Get Directions →
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
