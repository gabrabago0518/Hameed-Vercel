import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma.js";

// One-off, by request: bring Pares and Bulalo back onto the live menu after
// the earlier overhaul removed them.
//   - Pares was *retired* (not deleted) since it has a real order against
//     it, so this un-retires the same row rather than creating a new one —
//     also updates its price to ₱60, matching the real price on the
//     "Hameed Pure Beef Soup Menu" poster (was ₱99 before).
//   - Both Bulalo sizes were fully deleted (zero orders at the time), so
//     they're recreated fresh, into the "Also Available" category — which
//     still exists in the database (Pares' retired row keeps it alive),
//     just currently shows nothing since everything in it was hidden.
// Idempotent (checks before creating), same SETUP_SECRET gate and
// delete-when-done lifecycle as the other one-off setup routes.
export async function GET(request) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const results = {};

    const pares = await prisma.menuItem.findFirst({ where: { name: "Pares" } });
    if (!pares) {
      results.pares = "skipped — not found";
    } else {
      await prisma.menuItem.update({
        where: { id: pares.id },
        data: { isRetired: false, price: 60.0 },
      });
      results.pares = "un-retired, price set to ₱60";
    }

    const restaurant = await prisma.restaurant.findFirst();
    if (!restaurant) {
      throw new Error("No restaurant found.");
    }

    let category = await prisma.menuCategory.findFirst({
      where: { restaurantId: restaurant.id, name: "Also Available" },
    });
    if (!category) {
      category = await prisma.menuCategory.create({
        data: { restaurantId: restaurant.id, name: "Also Available", sortOrder: 5 },
      });
      results.category = "created";
    } else {
      results.category = "already present";
    }

    for (const item of [
      {
        name: "Bulalo (Regular)",
        description: "Beef bone marrow soup, regular size.",
        price: 149.0,
      },
      {
        name: "Bulalo (Special)",
        description: "Beef bone marrow soup, special size with extra meat.",
        price: 199.0,
      },
    ]) {
      const existing = await prisma.menuItem.findFirst({
        where: { categoryId: category.id, name: item.name },
      });
      if (existing) {
        results[item.name] = "already present";
      } else {
        await prisma.menuItem.create({
          data: { categoryId: category.id, ...item },
        });
        results[item.name] = "created";
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 409 });
  }
}
