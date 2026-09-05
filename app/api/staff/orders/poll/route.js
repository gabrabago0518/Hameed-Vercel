import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/session.js";
import { prisma } from "../../../../../lib/prisma.js";

// Cheap polling endpoint for StaffOrdersPoller — deliberately returns just a
// signature string, not the actual order data, so the client can tell "did
// anything change" without re-fetching/re-rendering data it's about to get
// again via router.refresh() anyway. Covers both a brand new order coming in
// (bumps the count/latest createdAt) and an existing order's status changing
// (bumps its updatedAt) — either one is a reason for /staff/dashboard or
// /staff/orders to refresh.
export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [count, latest] = await Promise.all([
    prisma.order.count(),
    prisma.order.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { id: true, status: true, updatedAt: true },
    }),
  ]);

  const signature = `${count}|${latest?.id ?? ""}|${latest?.status ?? ""}|${latest?.updatedAt?.getTime() ?? 0}`;

  return NextResponse.json({ signature });
}
