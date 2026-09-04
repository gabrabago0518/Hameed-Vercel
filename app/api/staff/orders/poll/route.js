import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/session.js";
import { prisma } from "../../../../../lib/prisma.js";
import { ACTIVE_ORDER_STATUSES } from "../../../../../lib/orderStatus.js";

// Cheap polling endpoint for StaffOrdersPoller — deliberately returns just a
// signature string, not the actual order data, so the client can tell "did
// anything change" without re-fetching/re-rendering data it's about to get
// again via router.refresh() anyway.
export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "EMPLOYEE")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [active, deliveredToday] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: ACTIVE_ORDER_STATUSES }, payment: { status: "PAID" } },
      select: { id: true, status: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.count({
      where: { status: "DELIVERED", updatedAt: { gte: startOfToday } },
    }),
  ]);

  const signature = `${active.map((o) => `${o.id}:${o.status}`).join(",")}|${deliveredToday}`;

  return NextResponse.json({ signature });
}
