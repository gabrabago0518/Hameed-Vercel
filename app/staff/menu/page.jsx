import { prisma } from "../../../lib/prisma.js";
import ToggleSwitch from "./ToggleSwitch.jsx";

export default async function StaffMenuPage() {
  const categories = await prisma.menuCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: { menuItems: { orderBy: { name: "asc" } } },
  });

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-zinc-900">
        Menu Availability
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Toggle an item off if it&apos;s out of stock — it stays on the customer menu, greyed out
        with an &quot;Out of Stock&quot; label, and can&apos;t be added to cart. Changes save
        instantly.
      </p>

      {categories.map((category) => (
        <section key={category.id} className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">{category.name}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {category.menuItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
              >
                <div>
                  <p className="font-medium text-zinc-900">{item.name}</p>
                  <p className="text-sm text-zinc-500">₱{Number(item.price).toFixed(2)}</p>
                </div>
                <ToggleSwitch menuItemId={item.id} initialIsAvailable={item.isAvailable} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
