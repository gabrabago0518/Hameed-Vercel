import Link from "next/link";
import { prisma } from "../../lib/prisma.js";
import { getCurrentUser } from "../../lib/session.js";
import AddToCartButton from "./AddToCartButton.jsx";

export default async function MenuPage() {
  const user = await getCurrentUser();
  const restaurant = await prisma.restaurant.findFirst({
    include: {
      menuCategories: {
        orderBy: { sortOrder: "asc" },
        include: {
          menuItems: {
            where: { isAvailable: true },
            include: { addons: true },
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
                className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <h3 className="font-semibold text-zinc-900">{item.name}</h3>
                  {item.description && (
                    <p className="mt-1 text-sm text-zinc-600">{item.description}</p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-semibold text-red-600">
                    ₱{Number(item.price).toFixed(2)}
                  </span>
                  {user ? (
                    <AddToCartButton menuItemId={item.id} itemName={item.name} />
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
