import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma.js";

// One-time migration for an *existing* live database (e.g. your real Neon
// data) that already has a restaurant seeded — /api/setup's own seed step
// skips re-seeding once a restaurant exists, so it never adds these new
// choices to menu items that were created before this feature existed.
// This does exactly that, safely: idempotent (skips an item that already
// has the group/addon in question, so calling this more than once never
// creates duplicates), and touches nothing except the specific items named
// below. Same SETUP_SECRET gate as /api/setup. DELETE THIS ROUTE once
// you've confirmed the choices show up on your live menu — it has no
// reason to stay in production.
const SPICE_LEVEL_ITEMS = ["Pastil", "Chicken Sisig"];
const COMBO_ADDON_ITEMS = [
  "Crispy Fried Chicken Meal",
  "Beef Tapa Meal",
  "Tapsilog",
  "Chicksilog",
  "Longsilog",
  "Hotsilog",
];
const COMBO_ADDON_PRICE = 35.0;

export async function GET(request) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const results = { spiceLevel: {}, comboAddon: {} };

  for (const name of SPICE_LEVEL_ITEMS) {
    const menuItem = await prisma.menuItem.findFirst({
      where: { name },
      include: { variantGroups: true },
    });
    if (!menuItem) {
      results.spiceLevel[name] = "skipped — no menu item with this name";
      continue;
    }
    if (menuItem.variantGroups.some((g) => g.name === "Spice Level")) {
      results.spiceLevel[name] = "skipped — already has a Spice Level group";
      continue;
    }
    await prisma.itemVariantGroup.create({
      data: {
        menuItemId: menuItem.id,
        name: "Spice Level",
        sortOrder: 0,
        options: {
          create: [
            { name: "Original (Not Spicy)", sortOrder: 0 },
            { name: "Spicy", sortOrder: 1 },
          ],
        },
      },
    });
    results.spiceLevel[name] = "added";
  }

  for (const name of COMBO_ADDON_ITEMS) {
    const menuItem = await prisma.menuItem.findFirst({
      where: { name },
      include: { addons: true },
    });
    if (!menuItem) {
      results.comboAddon[name] = "skipped — no menu item with this name";
      continue;
    }
    if (menuItem.addons.some((a) => a.name === "Make it a Combo (+ Iced Tea)")) {
      results.comboAddon[name] = "skipped — already has this addon";
      continue;
    }
    await prisma.itemAddon.create({
      data: {
        menuItemId: menuItem.id,
        name: "Make it a Combo (+ Iced Tea)",
        price: COMBO_ADDON_PRICE,
      },
    });
    results.comboAddon[name] = "added";
  }

  return NextResponse.json({ ok: true, results });
}
