import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma.js";

// One-off correction — real addresses provided for both branches, replacing
// the earlier placeholder addresses (Branch.address only had "Maharlika
// Village" / "New Lower Bicutan" before, both flagged as guesses inferred
// from the branch names, never confirmed exact). Split across the existing
// address/city fields at the natural comma boundary so displaying them as
// `${address}, ${city}` (see StoreLocationsSection.jsx) reproduces the full
// given address with no duplication — no schema change needed. Same
// SETUP_SECRET gate and delete-when-done lifecycle as the other one-off
// setup routes.
// `names` lists both the old and new name for the first branch, since this
// route may run before or after the separate /api/setup/rename-branch
// (the rename PR may not be merged/run yet) — matches whichever is current.
const UPDATES = [
  {
    names: ["Lower Bicutan Branch", "Maharlika Branch"],
    address: "18 Barrameda, Lower Bicutan",
    city: "Taguig, 1632 Metro Manila",
  },
  {
    names: ["New Lower Bicutan Branch"],
    address: "44 M. L. Quezon Ave, New Lower Bicutan",
    city: "Taguig, 1632 Metro Manila",
  },
];

export async function GET(request) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const results = {};
  for (const { names, address, city } of UPDATES) {
    const branch = await prisma.branch.findFirst({ where: { name: { in: names } } });
    if (!branch) {
      results[names[0]] = "not found";
      continue;
    }
    await prisma.branch.update({ where: { id: branch.id }, data: { address, city } });
    results[branch.name] = "address updated";
  }

  return NextResponse.json({ ok: true, results });
}
