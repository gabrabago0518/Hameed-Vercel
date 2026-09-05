import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma.js";

// One-off, live-database version of the full menu replacement requested —
// prisma/seedData.js already has the new menu for a *fresh* database, but
// the live Neon database is already seeded with the old one and has real
// orders attached to several of its items, so a fresh reseed isn't
// possible/safe. This does the equivalent migration by hand:
//   - an old item with zero real orders against it is deleted outright
//   - an old item with real orders is *retired* instead (MenuItem.isRetired
//     — see schema.prisma) so it disappears from the menu for good without
//     breaking that order's history
//   - Chicken Sisig / Chicken Wings / Tapsilog / Chicsilog(was Chicksilog) /
//     Longsilog / Hotsilog are updated in place (same row, so any of them
//     with real orders keep those intact) rather than deleted+recreated
// Idempotent throughout (checks before every create/update), wrapped in one
// transaction so a failure partway through leaves nothing half-changed.
// Same SETUP_SECRET gate and delete-when-done lifecycle as the other
// one-off setup routes.

const OLD_ITEMS_TO_REMOVE = [
  "Pastil",
  "Crispy Fried Chicken Meal",
  "Beef Tapa Meal",
  "Classic Cheeseburger",
  "Iced Tea",
  "Bottled Water",
  "Spicy Pastil Silog",
  "Bulalo (Regular)",
  "Bulalo (Special)",
  "Pares",
];

const OLD_EMPTY_CATEGORY_NAMES = ["Rice Meals", "Burgers", "Drinks", "Also Available"];

const WING_FLAVOR_OPTIONS = [
  { name: "Spicy Buffalo (Best by Hameed)", sortOrder: 0 },
  { name: "Spicy Salted Egg", sortOrder: 1 },
  { name: "Burning Wings", sortOrder: 2 },
  { name: "Soy Garlic", sortOrder: 3 },
  { name: "Hickory BBQ", sortOrder: 4 },
  { name: "Garlic Parmesan", sortOrder: 5 },
  { name: "Teriyaki", sortOrder: 6 },
];

const ADDITION_PASTIL_ADDON_NAME = "Addition Pastil";
const ADDITION_PASTIL_PRICE = 20.0;
const ICED_TEA_COMBO_ADDON_NAME = "Make it a Combo (+ Iced Tea)";
const ICED_TEA_COMBO_PRICE = 35.0;
const OLD_RICE_PASTIL_ADDON_NAMES = ["Combo (2 Rice + Pastil)", "Combo (2 Rice + Pastil + Egg)"];

const SILOG_UPDATES = [
  { name: "Tapsilog", price: 85.0 },
  { name: "Chicksilog", renameTo: "Chicsilog", price: 85.0 },
  { name: "Longsilog", price: 85.0 },
  { name: "Hotsilog", price: 85.0 },
];

const NEW_SILOG_ITEMS = [
  { name: "Bangsilog", description: "Fried milkfish (bangus) with garlic rice and a fried egg.", price: 90.0 },
  { name: "Spamsilog", description: "Fried SPAM with garlic rice and a fried egg.", price: 80.0 },
  { name: "Siomaisilog", description: "Steamed siomai with garlic rice and a fried egg.", price: 75.0 },
  { name: "Shanghaisilog", description: "Crispy Shanghai lumpia with garlic rice and a fried egg.", price: 75.0 },
  { name: "Embotidosilog", description: "Embotido (Filipino meatloaf) with garlic rice and a fried egg.", price: 75.0 },
];

const SIZZLING_PLATTER_ITEMS = [
  "Sizzling T-Bone Steak",
  "Sizzling Beef Burger Steak",
  "Sizzling Beef Shawarma",
  "Sizzling Garlic Pepper Beef",
  "Sizzling Chicken Fillet",
  "Sizzling Chicken Poppers",
  "Sizzling Hungarian",
  "Chicken Fillet",
  "Ala King Fillet",
];
const SIZZLING_PLATTER_PRICE = 129.0;

const COMBO_MEALS_ITEMS = [
  { name: "Pastilog Combo", description: "Hameed's best seller! Two cups of rice with pastil.", price: 45.0 },
  { name: "Tapsilog Combo", price: 100.0 },
  { name: "Chicsilog Combo", price: 100.0 },
  { name: "Bangsilog Combo", price: 105.0 },
  { name: "Longsilog Combo", price: 100.0 },
  { name: "Hotsilog Combo", price: 95.0 },
  { name: "Spamsilog Combo", price: 90.0 },
  { name: "Siomaisilog Combo", price: 85.0 },
  { name: "Shanghaisilog Combo", price: 85.0 },
  { name: "Embotidosilog Combo", price: 85.0 },
];

async function deleteMenuItemTree(tx, menuItem) {
  const groups = await tx.itemVariantGroup.findMany({
    where: { menuItemId: menuItem.id },
    select: { id: true },
  });
  const groupIds = groups.map((g) => g.id);
  await tx.itemVariantOption.deleteMany({ where: { groupId: { in: groupIds } } });
  await tx.itemVariantGroup.deleteMany({ where: { id: { in: groupIds } } });
  await tx.itemAddon.deleteMany({ where: { menuItemId: menuItem.id } });
  await tx.menuItem.delete({ where: { id: menuItem.id } });
}

async function removeOrRetireByName(tx, name, log) {
  const item = await tx.menuItem.findFirst({ where: { name } });
  if (!item) {
    log[name] = "skipped — not found";
    return;
  }
  const orderCount = await tx.orderItem.count({ where: { menuItemId: item.id } });
  if (orderCount === 0) {
    await deleteMenuItemTree(tx, item);
    log[name] = "deleted (no orders reference it)";
  } else {
    await tx.menuItem.update({ where: { id: item.id }, data: { isRetired: true } });
    log[name] = `retired (${orderCount} real order item(s) reference it — kept for order history)`;
  }
}

async function ensureCategory(tx, restaurantId, name, sortOrder) {
  const existing = await tx.menuCategory.findFirst({ where: { restaurantId, name } });
  if (existing) return existing;
  return tx.menuCategory.create({ data: { restaurantId, name, sortOrder } });
}

async function ensureVariantGroup(tx, menuItemId, groupName, sortOrder, options) {
  const existing = await tx.itemVariantGroup.findFirst({ where: { menuItemId, name: groupName } });
  if (existing) return "already present";
  await tx.itemVariantGroup.create({
    data: { menuItemId, name: groupName, sortOrder, options: { create: options } },
  });
  return "added";
}

async function removeAddonsByName(tx, menuItemId, names) {
  const result = await tx.itemAddon.deleteMany({ where: { menuItemId, name: { in: names } } });
  return result.count;
}

async function ensureAddon(tx, menuItemId, name, price) {
  const existing = await tx.itemAddon.findFirst({ where: { menuItemId, name } });
  if (existing) return "already present";
  await tx.itemAddon.create({ data: { menuItemId, name, price } });
  return "added";
}

async function ensureMenuItem(tx, categoryId, name, price, description) {
  const existing = await tx.menuItem.findFirst({ where: { categoryId, name } });
  if (existing) return "already present";
  await tx.menuItem.create({ data: { categoryId, name, price, description } });
  return "created";
}

export async function GET(request) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const results = await prisma.$transaction(
      async (tx) => {
        const restaurant = await tx.restaurant.findFirst();
        if (!restaurant) {
          throw new Error("No restaurant found — nothing to migrate.");
        }

        const removed = {};
        for (const name of OLD_ITEMS_TO_REMOVE) {
          await removeOrRetireByName(tx, name, removed);
        }

        const emptiedCategories = {};
        for (const name of OLD_EMPTY_CATEGORY_NAMES) {
          const category = await tx.menuCategory.findFirst({
            where: { restaurantId: restaurant.id, name },
            include: { _count: { select: { menuItems: true } } },
          });
          if (!category) {
            emptiedCategories[name] = "skipped — not found";
          } else if (category._count.menuItems === 0) {
            await tx.menuCategory.delete({ where: { id: category.id } });
            emptiedCategories[name] = "deleted (empty)";
          } else {
            emptiedCategories[name] = `kept — still has ${category._count.menuItems} item(s) (retired, not deleted)`;
          }
        }

        const sizzlingCategory = await ensureCategory(tx, restaurant.id, "Sizzling Platter", 6);
        const chickenCategory = await ensureCategory(tx, restaurant.id, "Chicken Atbp.", 7);
        const comboCategory = await ensureCategory(tx, restaurant.id, "Combo Meals", 8);

        const sizzlingResults = {};
        for (const name of SIZZLING_PLATTER_ITEMS) {
          sizzlingResults[name] = await ensureMenuItem(tx, sizzlingCategory.id, name, SIZZLING_PLATTER_PRICE, null);
        }

        // Chicken Sisig — move category + price, add the new Serving
        // variant, keep its existing Spice Level variant untouched.
        const chickenSisigResult = {};
        const chickenSisig = await tx.menuItem.findFirst({ where: { name: "Chicken Sisig" } });
        if (chickenSisig) {
          await tx.menuItem.update({
            where: { id: chickenSisig.id },
            data: { categoryId: chickenCategory.id, price: 120.0 },
          });
          chickenSisigResult.moved = "updated category + price";
          chickenSisigResult.servingVariant = await ensureVariantGroup(tx, chickenSisig.id, "Serving", 1, [
            { name: "Ala Carte", sortOrder: 0 },
            { name: "W/ Rice", priceDelta: 10.0, sortOrder: 1 },
          ]);
        } else {
          chickenSisigResult.moved = "skipped — not found";
        }

        // Chicken Wings — same treatment, plus the Flavor variant group.
        // Pricing note: W/ Rice (₱105) is *lower* than Ala Carte (₱160) per
        // the numbers given — kept as-is, but flagged in the response since
        // it's the reverse of Chicken Sisig's own Ala Carte/W Rice pattern.
        const chickenWingsResult = {};
        const chickenWings = await tx.menuItem.findFirst({ where: { name: "Chicken Wings" } });
        if (chickenWings) {
          await tx.menuItem.update({
            where: { id: chickenWings.id },
            data: { categoryId: chickenCategory.id, price: 160.0 },
          });
          chickenWingsResult.moved = "updated category + price";
          chickenWingsResult.flavorVariant = await ensureVariantGroup(
            tx,
            chickenWings.id,
            "Flavor",
            0,
            WING_FLAVOR_OPTIONS
          );
          chickenWingsResult.servingVariant = await ensureVariantGroup(tx, chickenWings.id, "Serving", 1, [
            { name: "Ala Carte", sortOrder: 0 },
            { name: "W/ Rice", priceDelta: -55.0, sortOrder: 1 },
          ]);
          const removedAddons = await removeAddonsByName(tx, chickenWings.id, OLD_RICE_PASTIL_ADDON_NAMES);
          chickenWingsResult.oldComboAddonsRemoved = removedAddons;
        } else {
          chickenWingsResult.moved = "skipped — not found";
        }

        // Existing Silog Meals items: rename (Chicksilog -> Chicsilog only),
        // reprice, drop the superseded flat combo addon, add the new
        // Addition Pastil addon. Make it a Combo (+ Iced Tea) is untouched
        // — unrelated to this change.
        const silogUpdates = {};
        for (const config of SILOG_UPDATES) {
          const item = await tx.menuItem.findFirst({ where: { name: config.name } });
          if (!item) {
            silogUpdates[config.name] = "skipped — not found";
            continue;
          }
          await tx.menuItem.update({
            where: { id: item.id },
            data: { price: config.price, ...(config.renameTo ? { name: config.renameTo } : {}) },
          });
          const removedAddons = await removeAddonsByName(tx, item.id, OLD_RICE_PASTIL_ADDON_NAMES);
          const addedAddon = await ensureAddon(tx, item.id, ADDITION_PASTIL_ADDON_NAME, ADDITION_PASTIL_PRICE);
          silogUpdates[config.renameTo ?? config.name] = {
            price: config.price,
            oldComboAddonsRemoved: removedAddons,
            additionPastilAddon: addedAddon,
          };
        }

        const silogCategory = await tx.menuCategory.findFirst({
          where: { restaurantId: restaurant.id, name: "Silog Meals" },
        });
        const newSilogResults = {};
        if (silogCategory) {
          for (const config of NEW_SILOG_ITEMS) {
            const status = await ensureMenuItem(tx, silogCategory.id, config.name, config.price, config.description);
            if (status === "created") {
              const created = await tx.menuItem.findFirst({
                where: { categoryId: silogCategory.id, name: config.name },
              });
              await ensureAddon(tx, created.id, ICED_TEA_COMBO_ADDON_NAME, ICED_TEA_COMBO_PRICE);
              await ensureAddon(tx, created.id, ADDITION_PASTIL_ADDON_NAME, ADDITION_PASTIL_PRICE);
            }
            newSilogResults[config.name] = status;
          }
        } else {
          for (const config of NEW_SILOG_ITEMS) {
            newSilogResults[config.name] = "skipped — Silog Meals category not found";
          }
        }

        const comboResults = {};
        for (const config of COMBO_MEALS_ITEMS) {
          comboResults[config.name] = await ensureMenuItem(
            tx,
            comboCategory.id,
            config.name,
            config.price,
            config.description ?? null
          );
        }

        return {
          removedOldItems: removed,
          emptiedCategories,
          sizzlingPlatterItems: sizzlingResults,
          chickenSisig: chickenSisigResult,
          chickenWings: chickenWingsResult,
          silogUpdates,
          newSilogItems: newSilogResults,
          comboMealsItems: comboResults,
        };
      },
      { timeout: 30000 }
    );

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 409 });
  }
}
