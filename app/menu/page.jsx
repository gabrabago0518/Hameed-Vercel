import { prisma } from "../../lib/prisma.js";
import { getCurrentUser } from "../../lib/session.js";
import MenuTabs from "./MenuTabs.jsx";

export default async function MenuPage() {
  const user = await getCurrentUser();
  const restaurant = await prisma.restaurant.findFirst({
    include: {
      menuCategories: {
        orderBy: { sortOrder: "asc" },
        include: {
          menuItems: {
            // Retired items (isRetired: true) are gone from the menu for
            // good — unlike isAvailable: false, which still shows an item
            // greyed out as "Out of Stock" since it might come back. See
            // MenuItem.isRetired in schema.prisma for why retiring exists
            // instead of deleting: real past orders can still reference a
            // retired item.
            where: { isRetired: false },
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

  // Prisma's Decimal values don't survive being passed as props from this
  // Server Component into MenuTabs (a Client Component) — converted to
  // plain numbers here. A category with zero remaining items (every item in
  // it retired) is dropped entirely rather than shown as an empty tab.
  const categories = restaurant.menuCategories
    .map((category) => ({
      id: category.id,
      name: category.name,
      items: category.menuItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        isAvailable: item.isAvailable,
        addons: item.addons.map((addon) => ({
          id: addon.id,
          name: addon.name,
          price: Number(addon.price),
        })),
        variantGroups: item.variantGroups.map((group) => ({
          id: group.id,
          name: group.name,
          required: group.required,
          options: group.options.map((option) => ({
            id: option.id,
            name: option.name,
            priceDelta: Number(option.priceDelta),
          })),
        })),
      })),
    }))
    .filter((category) => category.items.length > 0);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <header className="mb-10 text-center">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-zinc-900">
          {restaurant.name}
        </h1>
        {restaurant.description && (
          <p className="mt-2 text-zinc-600">{restaurant.description}</p>
        )}
      </header>

      <MenuTabs categories={categories} hasUser={Boolean(user)} />
    </main>
  );
}
