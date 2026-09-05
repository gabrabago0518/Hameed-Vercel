import Link from "next/link";
import { prisma } from "../../../lib/prisma.js";
import { getManilaDayRange } from "../../../lib/timezone.js";

// Groups the raw OrderStatus enum into the handful of buckets staff actually
// care about at a glance — READY_FOR_PICKUP and OUT_FOR_DELIVERY both mean
// "waiting to go out the door," just for different fulfillment methods.
const BREAKDOWN_BUCKETS = [
  { label: "Pending", statuses: ["PENDING", "PENDING_CONFIRMATION"] },
  { label: "Confirmed", statuses: ["CONFIRMED"] },
  { label: "Preparing", statuses: ["PREPARING"] },
  { label: "Waiting for Rider / Pickup", statuses: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY"] },
  { label: "Completed", statuses: ["DELIVERED"] },
  { label: "Cancelled", statuses: ["CANCELLED"] },
];

export default async function StaffDashboardPage() {
  // "Today" here means today in Asia/Manila, not the server's own timezone —
  // see lib/timezone.js for why that distinction matters on a server that
  // may run in UTC.
  const { start, end } = getManilaDayRange();

  const todaysOrders = await prisma.order.groupBy({
    by: ["status"],
    where: { createdAt: { gte: start, lt: end } },
    _count: { _all: true },
  });

  const countByStatus = Object.fromEntries(todaysOrders.map((row) => [row.status, row._count._all]));
  const totalToday = todaysOrders.reduce((sum, row) => sum + row._count._all, 0);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-zinc-900 sm:text-3xl">
        Orders Today: {totalToday}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Based on orders placed today (Philippine time) — resets at midnight, Asia/Manila.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {BREAKDOWN_BUCKETS.map((bucket) => {
          const count = bucket.statuses.reduce((sum, status) => sum + (countByStatus[status] ?? 0), 0);
          return (
            <div key={bucket.label} className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-2xl font-bold text-zinc-900">{count}</p>
              <p className="mt-1 text-xs font-medium text-zinc-500">{bucket.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/staff/orders"
          className="min-h-11 rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-red-200"
        >
          <p className="text-base font-semibold text-zinc-900">Order Management →</p>
          <p className="mt-1 text-sm text-zinc-500">
            Review incoming orders, update statuses, and verify Cash on Delivery orders.
          </p>
        </Link>
        <Link
          href="/staff/menu"
          className="min-h-11 rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-red-200"
        >
          <p className="text-base font-semibold text-zinc-900">Menu Availability →</p>
          <p className="mt-1 text-sm text-zinc-500">
            Mark items available or out of stock — changes save instantly.
          </p>
        </Link>
      </div>
    </div>
  );
}
