import Link from "next/link";
import { prisma } from "../../lib/prisma.js";
import {
  ACTIVE_ORDER_STATUSES,
  STATUS_LABELS,
  getNextStatusButtonLabel,
} from "../../lib/orderStatus.js";
import { advanceOrderStatusAction } from "./actions.js";
import StaffOrdersPoller from "./StaffOrdersPoller.jsx";

function OrderCard({ order }) {
  const nextLabel = getNextStatusButtonLabel(order);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-900">
            {order.payment?.transactionRef ?? order.id}
          </p>
          <p className="text-xs text-zinc-500">
            {order.createdAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            {" · "}
            {order.user.name}
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-600">
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-1 text-sm text-zinc-700">
        {order.items.map((item) => (
          <span key={item.id}>
            {item.quantity} × {item.menuItem.name}
          </span>
        ))}
      </div>

      <p className="mt-3 text-sm text-zinc-600">
        {order.addressId
          ? `Deliver to: ${order.address.line1}, ${order.address.city}`
          : `Pickup at: ${order.branch.name}`}
      </p>

      {nextLabel && (
        <form action={advanceOrderStatusAction} className="mt-4">
          <input type="hidden" name="orderId" value={order.id} />
          <button
            type="submit"
            className="w-full rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            {nextLabel}
          </button>
        </form>
      )}
    </div>
  );
}

export default async function StaffPage({ searchParams }) {
  const { tab } = await searchParams;
  const activeTab = tab === "completed" ? "completed" : "current";

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const orderInclude = {
    items: { include: { menuItem: true } },
    branch: true,
    address: true,
    payment: true,
    user: true,
  };

  const [currentOrders, completedToday] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: ACTIVE_ORDER_STATUSES }, payment: { status: "PAID" } },
      orderBy: { createdAt: "asc" },
      include: orderInclude,
    }),
    prisma.order.findMany({
      where: { status: "DELIVERED", updatedAt: { gte: startOfToday } },
      orderBy: { updatedAt: "desc" },
      include: orderInclude,
    }),
  ]);

  const signature = `${currentOrders
    .map((o) => `${o.id}:${o.status}`)
    .join(",")}|${completedToday.length}`;

  const orders = activeTab === "completed" ? completedToday : currentOrders;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex gap-2">
        <Link
          href="/staff"
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            activeTab === "current"
              ? "bg-red-600 text-white"
              : "bg-white text-zinc-600 border border-zinc-200"
          }`}
        >
          Current orders ({currentOrders.length})
        </Link>
        <Link
          href="/staff?tab=completed"
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            activeTab === "completed"
              ? "bg-red-600 text-white"
              : "bg-white text-zinc-600 border border-zinc-200"
          }`}
        >
          Completed today ({completedToday.length})
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {activeTab === "completed" ? "Nothing delivered yet today." : "No active orders right now."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      <StaffOrdersPoller signature={signature} />
    </div>
  );
}
