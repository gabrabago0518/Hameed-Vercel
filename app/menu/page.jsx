import Link from "next/link";
import { prisma } from "../../lib/prisma.js";
import { getCurrentUser } from "../../lib/session.js";
import AddToCartButton from "./AddToCartButton.jsx";
import AddToCartWithOptions from "./AddToCartWithOptions.jsx";

export default async function MenuPage() {
  const user = await getCurrentUser();
  const restaurant = await prisma.restaurant.findFirst({
    include: {
      menuCategories: {
        orderBy: { sortOrder: "asc" },
        include: {
          menuItems: {
            // Out-of-stock items stay visible (greyed out, "Out of Stock"
            // label, no Add button below) rather than being filtered out
            // here — customers can see the item exists, just can't order it
            // right now. Staff toggle isAvailable from /staff/menu.
            include: {
              addons: true,
              variantGroups: { orderBy: { sortOrder: "asc" }, include: { options: { orderBy: { sortOrder: "asc" } } } },
            },
          },
        },
      },
    },
  });

  if (!restaurant) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24 text-center text-zinc-600">
        No restaurant set up yet. Run{" "}
        <code className="mx-1 rounded bg-zinc-100 px-1.5 py-0.5">npm run db:seed</code>{" "}
        to add sample menu data.
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <header className="mb-10 text-center">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-zinc-900">
          {restaurant.name}
        </h1>
        {restaurant.description && (
          <p className="mt-2 text-zinc-600">{restaurant.description}</p>
        )}
      </header>

      {restaurant.menuCategories.map((category) => (
        <section key={category.id} className="mb-10">
          <h2 className="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold text-zinc-900">
            {category.name}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {category.menuItems.map((item) => (
              <article
                key={item.id}
                className={`flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm ${
                  item.isAvailable ? "" : "opacity-60 grayscale"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-zinc-900">{item.name}</h3>
                    {!item.isAvailable && (
                      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                        Out of Stock
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-1 text-sm text-zinc-600">{item.description}</p>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-y-3">
                  <span className="font-semibold text-red-600">
                    ₱{Number(item.price).toFixed(2)}
                  </span>
                  {!item.isAvailable ? (
                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-full bg-zinc-300 px-4 py-1.5 text-sm font-semibold text-zinc-500"
                    >
                      Add
                    </button>
                  ) : user ? (
                    item.addons.length > 0 || item.variantGroups.length > 0 ? (
                      <AddToCartWithOptions
                        menuItemId={item.id}
                        itemName={item.name}
                        addons={item.addons.map((addon) => ({
                          id: addon.id,
                          name: addon.name,
                          price: Number(addon.price),
                        }))}
                        variantGroups={item.variantGroups.map((group) => ({
                          id: group.id,
                          name: group.name,
                          required: group.required,
                          options: group.options.map((option) => ({
                            id: option.id,
                            name: option.name,
                            priceDelta: Number(option.priceDelta),
                          })),
                        }))}
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
              </article>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
