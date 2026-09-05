import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma.js";

// One-off correction against real photos of the in-store menu boards
// (Chicken Atbp./Sizzling Java Rice Menu, Silog Meals/Combo Meals) —
// several prices/items/categories that were placeholder guesses before
// didn't match what's actually posted in the store. Corrects:
//   - Sizzling Platter: real per-item prices (T-Bone ₱205, everything else
//     ₱139, not a flat ₱129) + two missing items (Sipo Egg, Sweet & Sour) +
//     a name fix (Sizzling Hungarian -> Sizzling Hungarian Sausage)
//   - Chicken Fillet / Ala King Fillet moved out of Sizzling Platter into a
//     new "Special Fillet Series" category (₱139), renamed to "Ala King" to
//     match the board, plus a new "Cheesy Fillet" (₱139)
//   - Silog Meals' "Addition Pastil" addon: ₱20 -> ₱35
//   - Combo Meals' Spamsilog Combo: ₱90 -> ₱95
//   - "Also Available" renamed to "Soup" to match the real board; Pares
//     renamed to "Beef Pares"; the two Bulalo sizes consolidated into one
//     "Beef Bulalo" at ₱150 (the real board has no size split)
// Idempotent throughout (checks before creating/renaming), no transaction
// wrapper for the same reason as the earlier menu-overhaul route — plain
// sequential steps are safer here than one big transaction that can't
// reliably finish in time. Same SETUP_SECRET gate and delete-when-done
// lifecycle as the other one-off setup routes.
export const maxDuration = 60;

async function ensureMenuItem(name, categoryId, price, description = null) {
  const existing = await prisma.menuItem.findFirst({ where: { categoryId, name } });
  if (existing) return "already present";
  await prisma.menuItem.create({ data: { categoryId, name, price, description } });
  return "created";
}

async function updatePriceByName(name, price, extra = {}) {
  const item = await prisma.menuItem.findFirst({ where: { name } });
  if (!item) return "skipped — not found";
  await prisma.menuItem.update({ where: { id: item.id }, data: { price, ...extra } });
  return "updated";
}

export async function GET(request) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const results = {};

    const restaurant = await prisma.restaurant.findFirst();
    if (!restaurant) throw new Error("No restaurant found.");

    // --- Sizzling Platter price/name corrections ---
    results.sizzlingPlatter = {
      "Sizzling T-Bone Steak": await updatePriceByName("Sizzling T-Bone Steak", 205.0),
      "Sizzling Beef Burger Steak": await updatePriceByName("Sizzling Beef Burger Steak", 139.0),
      "Sizzling Beef Shawarma": await updatePriceByName("Sizzling Beef Shawarma", 139.0),
      "Sizzling Garlic Pepper Beef": await updatePriceByName("Sizzling Garlic Pepper Beef", 139.0),
      "Sizzling Chicken Fillet": await updatePriceByName("Sizzling Chicken Fillet", 139.0),
      "Sizzling Chicken Poppers": await updatePriceByName("Sizzling Chicken Poppers", 139.0),
      "Sizzling Hungarian -> Sizzling Hungarian Sausage": await updatePriceByName(
        "Sizzling Hungarian",
        139.0,
        { name: "Sizzling Hungarian Sausage" }
      ),
    };

    const sizzlingCategory = await prisma.menuCategory.findFirst({
      where: { restaurantId: restaurant.id, name: "Sizzling Platter" },
    });
    if (sizzlingCategory) {
      results.sizzlingPlatter["Sipo Egg"] = await ensureMenuItem("Sipo Egg", sizzlingCategory.id, 139.0);
      results.sizzlingPlatter["Sweet & Sour"] = await ensureMenuItem("Sweet & Sour", sizzlingCategory.id, 139.0);
    } else {
      results.sizzlingPlatter["Sipo Egg"] = "skipped — Sizzling Platter category not found";
      results.sizzlingPlatter["Sweet & Sour"] = "skipped — Sizzling Platter category not found";
    }

    // --- New Special Fillet Series category ---
    let filletCategory = await prisma.menuCategory.findFirst({
      where: { restaurantId: restaurant.id, name: "Special Fillet Series" },
    });
    if (!filletCategory) {
      const maxSortOrder = await prisma.menuCategory.aggregate({
        where: { restaurantId: restaurant.id },
        _max: { sortOrder: true },
      });
      filletCategory = await prisma.menuCategory.create({
        data: {
          restaurantId: restaurant.id,
          name: "Special Fillet Series",
          sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1,
        },
      });
      results.specialFilletSeriesCategory = "created";
    } else {
      results.specialFilletSeriesCategory = "already present";
    }

    const filletResults = {};
    const chickenFillet = await prisma.menuItem.findFirst({ where: { name: "Chicken Fillet" } });
    if (chickenFillet) {
      await prisma.menuItem.update({
        where: { id: chickenFillet.id },
        data: { categoryId: filletCategory.id, price: 139.0 },
      });
      filletResults["Chicken Fillet"] = "moved into Special Fillet Series, price set to ₱139";
    } else {
      filletResults["Chicken Fillet"] = "skipped — not found";
    }

    const alaKing = await prisma.menuItem.findFirst({ where: { name: "Ala King Fillet" } });
    if (alaKing) {
      await prisma.menuItem.update({
        where: { id: alaKing.id },
        data: { categoryId: filletCategory.id, price: 139.0, name: "Ala King" },
      });
      filletResults["Ala King Fillet -> Ala King"] = "moved into Special Fillet Series, price set to ₱139";
    } else {
      filletResults["Ala King Fillet -> Ala King"] = "skipped — not found";
    }

    filletResults["Cheesy Fillet"] = await ensureMenuItem("Cheesy Fillet", filletCategory.id, 139.0);
    results.specialFilletSeries = filletResults;

    // --- Silog Meals: Addition Pastil addon price correction ---
    const additionPastilUpdate = await prisma.itemAddon.updateMany({
      where: { name: "Addition Pastil" },
      data: { price: 35.0 },
    });
    results.additionPastilAddonsUpdated = additionPastilUpdate.count;

    // --- Combo Meals: Spamsilog Combo price correction ---
    results.spamsilogCombo = await updatePriceByName("Spamsilog Combo", 95.0);

    // --- Also Available -> Soup, Pares -> Beef Pares, Bulalo consolidation ---
    const alsoAvailable = await prisma.menuCategory.findFirst({
      where: { restaurantId: restaurant.id, name: "Also Available" },
    });
    let soupCategory = alsoAvailable;
    if (alsoAvailable) {
      soupCategory = await prisma.menuCategory.update({
        where: { id: alsoAvailable.id },
        data: { name: "Soup" },
      });
      results.soupCategory = "renamed from Also Available";
    } else {
      soupCategory = await prisma.menuCategory.findFirst({
        where: { restaurantId: restaurant.id, name: "Soup" },
      });
      if (!soupCategory) {
        const maxSortOrder = await prisma.menuCategory.aggregate({
          where: { restaurantId: restaurant.id },
          _max: { sortOrder: true },
        });
        soupCategory = await prisma.menuCategory.create({
          data: {
            restaurantId: restaurant.id,
            name: "Soup",
            sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1,
          },
        });
        results.soupCategory = "created (neither Also Available nor Soup existed)";
      } else {
        results.soupCategory = "already present";
      }
    }

    results.beefPares = await updatePriceByName("Pares", 60.0, { name: "Beef Pares" });

    // Bulalo: consolidate whichever of the two sizes actually exist into one
    // "Beef Bulalo" row. Whichever one has real orders (if any) is kept and
    // renamed/repriced in place; the other is deleted only if it has zero
    // orders, otherwise it's left alone and flagged for manual attention
    // (would mean both sizes have real order history, which the real board
    // gives no guidance on how to merge safely).
    const regular = await prisma.menuItem.findFirst({ where: { name: "Bulalo (Regular)" } });
    const special = await prisma.menuItem.findFirst({ where: { name: "Bulalo (Special)" } });
    const bulaloLog = {};

    if (!regular && !special) {
      bulaloLog.status = await ensureMenuItem("Beef Bulalo", soupCategory.id, 150.0);
    } else {
      const regularOrders = regular ? await prisma.orderItem.count({ where: { menuItemId: regular.id } }) : 0;
      const specialOrders = special ? await prisma.orderItem.count({ where: { menuItemId: special.id } }) : 0;

      const keep = regularOrders > 0 ? regular : special || regular;
      const other = keep === regular ? special : regular;
      const otherOrders = other === special ? specialOrders : regularOrders;

      await prisma.menuItem.update({
        where: { id: keep.id },
        data: { name: "Beef Bulalo", price: 150.0, categoryId: soupCategory.id, description: "Beef bone marrow soup." },
      });
      bulaloLog.kept = `${keep.name === "Beef Bulalo" ? "(already renamed)" : keep.id} -> Beef Bulalo, ₱150`;

      if (other) {
        if (otherOrders === 0) {
          await prisma.itemAddon.deleteMany({ where: { menuItemId: other.id } });
          await prisma.menuItem.delete({ where: { id: other.id } });
          bulaloLog.other = "deleted (no orders reference it)";
        } else {
          bulaloLog.other = `NOT deleted - ${otherOrders} real order item(s) reference it. Both Bulalo sizes have order history; manual attention needed to fully consolidate.`;
        }
      }
    }
    results.bulalo = bulaloLog;

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 409 });
  }
}
