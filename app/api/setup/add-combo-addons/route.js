import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma.js";

// One-time migration for an *existing* live database that already has a
// restaurant seeded (same reasoning as the earlier add-item-choices route,
// already removed once its job was done) — adds two new combo add-ons by
// request:
//   - "Combo (2 Rice + Pastil + Egg)" on every Rice Meals item
//   - "Combo (2 Rice + Pastil)" on Pastil itself and on every Silog Meals
//     item (no egg needed there — a silog meal already comes with one)
// Idempotent: skips an item that already has the relevant addon, so running
// this more than once never creates duplicates. Same SETUP_SECRET gate and
// delete-when-done lifecycle as the other one-off setup routes.
//
// Prices (₱105 / ₱90) are a placeholder guess — extra rice (₱25, matching
// this app's existing "Extra Rice" addon) + a whole Pastil (₱65, matching
// its real menu price) + an egg (₱15, typical) for the Rice Meals version;
// same minus the egg for the Silog Meals / Pastil version. Confirm real
// pricing before this goes live.
const RICE_AND_EGG_ITEMS = ["Crispy Fried Chicken Meal", "Beef Tapa Meal"];
const RICE_ONLY_ITEMS = [
  "Pastil",
  "Tapsilog",
  "Chicksilog",
  "Longsilog",
  "Spicy Pastil Silog",
  "Hotsilog",
  "Chicken Wings",
];

const RICE_AND_EGG_ADDON = "Combo (2 Rice + Pastil + Egg)";
const RICE_ONLY_ADDON = "Combo (2 Rice + Pastil)";
const RICE_AND_EGG_PRICE = 105.0;
const RICE_ONLY_PRICE = 90.0;

async function addAddonIfMissing(itemName, addonName, price) {
  const menuItem = await prisma.menuItem.findFirst({
    where: { name: itemName },
    include: { addons: true },
  });
  if (!menuItem) {
    return "skipped — no menu item with this name";
  }
  if (menuItem.addons.some((addon) => addon.name === addonName)) {
    return "skipped — already has this addon";
  }
  await prisma.itemAddon.create({
    data: { menuItemId: menuItem.id, name: addonName, price },
  });
  return "added";
}

export async function GET(request) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const results = { riceAndEgg: {}, riceOnly: {} };

  for (const name of RICE_AND_EGG_ITEMS) {
    results.riceAndEgg[name] = await addAddonIfMissing(name, RICE_AND_EGG_ADDON, RICE_AND_EGG_PRICE);
  }

  for (const name of RICE_ONLY_ITEMS) {
    results.riceOnly[name] = await addAddonIfMissing(name, RICE_ONLY_ADDON, RICE_ONLY_PRICE);
  }

  return NextResponse.json({ ok: true, results });
}
