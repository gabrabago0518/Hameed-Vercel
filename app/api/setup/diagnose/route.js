import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma.js";

// Read-only diagnostic — reports counts/duplicates without changing
// anything, so a fix can be built based on what's actually there instead of
// guessing. Same SETUP_SECRET gate as the other one-off setup routes.
// DELETE THIS ROUTE once it's done its job.
export async function GET(request) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, name: true, createdAt: true },
  });

  const branches = await prisma.branch.findMany({
    select: { id: true, name: true, restaurantId: true, createdAt: true },
    orderBy: { name: "asc" },
  });

  const menuItemsRaw = await prisma.menuItem.groupBy({
    by: ["name"],
    _count: { _all: true },
  });
  const duplicateMenuItemNames = menuItemsRaw.filter((row) => row._count._all > 1);

  const orderCount = await prisma.order.count();

  return NextResponse.json({
    restaurantCount: restaurants.length,
    restaurants,
    branchCount: branches.length,
    branches,
    duplicateMenuItemNames,
    orderCount,
  });
}
