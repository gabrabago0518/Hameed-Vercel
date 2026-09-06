import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma.js";

// One-off correction to match lib/psgc-ncr.json dropping the PSA's "City of "
// prefix from its city names (e.g. "City of Manila" -> "Manila") by request.
// Any Address row saved before this change still has the old full name —
// left alone, editing one of those addresses would silently fail to
// pre-select a city in the dropdown (the <select> has no "City of Manila"
// option anymore), so existing rows need the same prefix stripped, not just
// the source data going forward. Same SETUP_SECRET gate and delete-when-done
// lifecycle as the other one-off setup routes.
export async function GET(request) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const addresses = await prisma.address.findMany({
    where: { city: { startsWith: "City of " } },
  });

  const results = [];
  for (const address of addresses) {
    const newCity = address.city.replace(/^City of /, "");
    await prisma.address.update({ where: { id: address.id }, data: { city: newCity } });
    results.push({ id: address.id, from: address.city, to: newCity });
  }

  return NextResponse.json({ ok: true, updated: results.length, results });
}
