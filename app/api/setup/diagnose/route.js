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

  const branchRows = await prisma.branch.findMany({
    select: { id: true, name: true, restaurantId: true, createdAt: true },
    orderBy: { name: "asc" },
  });

  // Per-branch order count — this is what actually decides which duplicated
  // restaurant/branch set is "live" and which is safe to delete. A branch
  // with orders against it can never be deleted (Order.branchId has no
  // cascade), so this has to be checked before proposing any cleanup.
  const branches = await Promise.all(
    branchRows.map(async (branch) => ({
      ...branch,
      orderCount: await prisma.order.count({ where: { branchId: branch.id } }),
    }))
  );

  const menuItemsRaw = await prisma.menuItem.groupBy({
    by: ["name"],
    _count: { _all: true },
  });
  const duplicateMenuItemNames = menuItemsRaw.filter((row) => row._count._all > 1);

  // Same check for menu items — an OrderItem referencing a menu item also
  // blocks deleting it.
  const menuItemsWithOrders = await prisma.menuItem.findMany({
    where: { orderItems: { some: {} } },
    select: {
      id: true,
      name: true,
      category: { select: { restaurantId: true } },
      _count: { select: { orderItems: true } },
    },
  });

  const orderCount = await prisma.order.count();

  return NextResponse.json({
    restaurantCount: restaurants.length,
    restaurants,
    branchCount: branches.length,
    branches,
    duplicateMenuItemNames,
    menuItemsWithOrders: menuItemsWithOrders.map((item) => ({
      id: item.id,
      name: item.name,
      restaurantId: item.category.restaurantId,
      orderItemCount: item._count.orderItems,
    })),
    orderCount,
  });
}
