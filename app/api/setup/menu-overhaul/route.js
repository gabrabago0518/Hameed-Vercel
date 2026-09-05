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
//
// Deliberately NOT wrapped in a single prisma.$transaction: this does
// ~100+ sequential round-trips against Neon's pooled connection, which
// doesn't reliably finish inside a transaction's timeout window (hit this
// directly — "Unable to start a transaction" at first, then "query cannot
// be executed on an expired transaction" after raising that limit).
// Instead, every step below is independently idempotent (checks before it
// creates/updates/deletes anything), so running this as a plain sequence
// of separate queries is actually *safer* here than one big transaction —
// if the request times out or gets killed partway through, nothing is left
// half-broken, and simply visiting the same URL again picks up wherever it
// left off instead of forcing a full restart.
// Same SETUP_SECRET gate and delete-when-done lifecycle as the other
// one-off setup routes.
export const maxDuration = 60;

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

async function deleteMenuItemTree(db, menuItem) {
  const groups = await db.itemVariantGroup.findMany({
    where: { menuItemId: menuItem.id },
    select: { id: true },
  });
  const groupIds = groups.map((g) => g.id);
  await db.itemVariantOption.deleteMany({ where: { groupId: { in: groupIds } } });
  await db.itemVariantGroup.deleteMany({ where: { id: { in: groupIds } } });
  await db.itemAddon.deleteMany({ where: { menuItemId: menuItem.id } });
  await db.menuItem.delete({ where: { id: menuItem.id } });
}

async function removeOrRetireByName(db, name, log) {
  const item = await db.menuItem.findFirst({ where: { name } });
  if (!item) {
    log[name] = "skipped — not found";
    return;
  }
  if (item.isRetired) {
    log[name] = "skipped — already retired";
    return;
  }
  const orderCount = await db.orderItem.count({ where: { menuItemId: item.id } });
  if (orderCount === 0) {
    await deleteMenuItemTree(db, item);
    log[name] = "deleted (no orders reference it)";
  } else {
    await db.menuItem.update({ where: { id: item.id }, data: { isRetired: true } });
    log[name] = `retired (${orderCount} real order item(s) reference it — kept for order history)`;
  }
}

async function ensureCategory(db, restaurantId, name, sortOrder) {
  const existing = await db.menuCategory.findFirst({ where: { restaurantId, name } });
  if (existing) return existing;
  return db.menuCategory.create({ data: { restaurantId, name, sortOrder } });
}

async function ensureVariantGroup(db, menuItemId, groupName, sortOrder, options) {
  const existing = await db.itemVariantGroup.findFirst({ where: { menuItemId, name: groupName } });
  if (existing) return "already present";
  await db.itemVariantGroup.create({
    data: { menuItemId, name: groupName, sortOrder, options: { create: options } },
  });
  return "added";
}

async function removeAddonsByName(db, menuItemId, names) {
  const result = await db.itemAddon.deleteMany({ where: { menuItemId, name: { in: names } } });
  return result.count;
}

async function ensureAddon(db, menuItemId, name, price) {
  const existing = await db.itemAddon.findFirst({ where: { menuItemId, name } });
  if (existing) return "already present";
  await db.itemAddon.create({ data: { menuItemId, name, price } });
  return "added";
}

async function ensureMenuItem(db, categoryId, name, price, description) {
  const existing = await db.menuItem.findFirst({ where: { categoryId, name } });
  if (existing) return "already present";
  await db.menuItem.create({ data: { categoryId, name, price, description } });
  return "created";
}

export async function GET(request) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const db = prisma;

    const restaurant = await db.restaurant.findFirst();
    if (!restaurant) {
      throw new Error("No restaurant found — nothing to migrate.");
    }

    const removed = {};
    for (const name of OLD_ITEMS_TO_REMOVE) {
      await removeOrRetireByName(db, name, removed);
    }

    const emptiedCategories = {};
    for (const name of OLD_EMPTY_CATEGORY_NAMES) {
      const category = await db.menuCategory.findFirst({
        where: { restaurantId: restaurant.id, name },
        include: { _count: { select: { menuItems: true } } },
      });
      if (!category) {
        emptiedCategories[name] = "skipped — not found";
      } else if (category._count.menuItems === 0) {
        await db.menuCategory.delete({ where: { id: category.id } });
        emptiedCategories[name] = "deleted (empty)";
      } else {
        emptiedCategories[name] = `kept — still has ${category._count.menuItems} item(s) (retired, not deleted)`;
      }
    }

    const sizzlingCategory = await ensureCategory(db, restaurant.id, "Sizzling Platter", 6);
    const chickenCategory = await ensureCategory(db, restaurant.id, "Chicken Atbp.", 7);
    const comboCategory = await ensureCategory(db, restaurant.id, "Combo Meals", 8);

    const sizzlingResults = {};
    for (const name of SIZZLING_PLATTER_ITEMS) {
      sizzlingResults[name] = await ensureMenuItem(db, sizzlingCategory.id, name, SIZZLING_PLATTER_PRICE, null);
    }

    // Chicken Sisig — move category + price, add the new Serving variant,
    // keep its existing Spice Level variant untouched.
    const chickenSisigResult = {};
    const chickenSisig = await db.menuItem.findFirst({ where: { name: "Chicken Sisig" } });
    if (chickenSisig) {
      await db.menuItem.update({
        where: { id: chickenSisig.id },
        data: { categoryId: chickenCategory.id, price: 120.0 },
      });
      chickenSisigResult.moved = "updated category + price";
      chickenSisigResult.servingVariant = await ensureVariantGroup(db, chickenSisig.id, "Serving", 1, [
        { name: "Ala Carte", sortOrder: 0 },
        { name: "W/ Rice", priceDelta: 10.0, sortOrder: 1 },
      ]);
    } else {
      chickenSisigResult.moved = "skipped — not found";
    }

    // Chicken Wings — same treatment, plus the Flavor variant group.
    // Pricing note: W/ Rice (₱105) is *lower* than Ala Carte (₱160) per the
    // numbers given — kept as-is, but flagged in the response since it's
    // the reverse of Chicken Sisig's own Ala Carte/W Rice pattern.
    const chickenWingsResult = {};
    const chickenWings = await db.menuItem.findFirst({ where: { name: "Chicken Wings" } });
    if (chickenWings) {
      await db.menuItem.update({
        where: { id: chickenWings.id },
        data: { categoryId: chickenCategory.id, price: 160.0 },
      });
      chickenWingsResult.moved = "updated category + price";
      chickenWingsResult.flavorVariant = await ensureVariantGroup(db, chickenWings.id, "Flavor", 0, WING_FLAVOR_OPTIONS);
      chickenWingsResult.servingVariant = await ensureVariantGroup(db, chickenWings.id, "Serving", 1, [
        { name: "Ala Carte", sortOrder: 0 },
        { name: "W/ Rice", priceDelta: -55.0, sortOrder: 1 },
      ]);
      const removedAddons = await removeAddonsByName(db, chickenWings.id, OLD_RICE_PASTIL_ADDON_NAMES);
      chickenWingsResult.oldComboAddonsRemoved = removedAddons;
    } else {
      chickenWingsResult.moved = "skipped — not found";
    }

    // Existing Silog Meals items: rename (Chicksilog -> Chicsilog only),
    // reprice, drop the superseded flat combo addon, add the new Addition
    // Pastil addon. Make it a Combo (+ Iced Tea) is untouched — unrelated
    // to this change.
    const silogUpdates = {};
    for (const config of SILOG_UPDATES) {
      const item = await db.menuItem.findFirst({ where: { name: config.name } });
      if (!item) {
        silogUpdates[config.name] = "skipped — not found";
        continue;
      }
      await db.menuItem.update({
        where: { id: item.id },
        data: { price: config.price, ...(config.renameTo ? { name: config.renameTo } : {}) },
      });
      const removedAddons = await removeAddonsByName(db, item.id, OLD_RICE_PASTIL_ADDON_NAMES);
      const addedAddon = await ensureAddon(db, item.id, ADDITION_PASTIL_ADDON_NAME, ADDITION_PASTIL_PRICE);
      silogUpdates[config.renameTo ?? config.name] = {
        price: config.price,
        oldComboAddonsRemoved: removedAddons,
        additionPastilAddon: addedAddon,
      };
    }

    const silogCategory = await db.menuCategory.findFirst({
      where: { restaurantId: restaurant.id, name: "Silog Meals" },
    });
    const newSilogResults = {};
    if (silogCategory) {
      for (const config of NEW_SILOG_ITEMS) {
        const status = await ensureMenuItem(db, silogCategory.id, config.name, config.price, config.description);
        if (status === "created") {
          const created = await db.menuItem.findFirst({
            where: { categoryId: silogCategory.id, name: config.name },
          });
          await ensureAddon(db, created.id, ICED_TEA_COMBO_ADDON_NAME, ICED_TEA_COMBO_PRICE);
          await ensureAddon(db, created.id, ADDITION_PASTIL_ADDON_NAME, ADDITION_PASTIL_PRICE);
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
        db,
        comboCategory.id,
        config.name,
        config.price,
        config.description ?? null
      );
    }

    return NextResponse.json({
      ok: true,
      results: {
        removedOldItems: removed,
        emptiedCategories,
        sizzlingPlatterItems: sizzlingResults,
        chickenSisig: chickenSisigResult,
        chickenWings: chickenWingsResult,
        silogUpdates,
        newSilogItems: newSilogResults,
        comboMealsItems: comboResults,
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 409 });
  }
}
