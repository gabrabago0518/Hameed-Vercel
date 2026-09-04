import Link from "next/link";
import { prisma } from "../../../lib/prisma.js";
import { STATUS_LABELS } from "../../../lib/orderStatus.js";
import { verifyCodOrderAction } from "./actions.js";

const STATUS_OPTIONS = Object.keys(STATUS_LABELS);

export default async function AdminOrdersPage({ searchParams }) {
  const { status, q } = await searchParams;
  const search = q?.toString().trim();

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { payment: { transactionRef: { contains: search, mode: "insensitive" } } },
            { user: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: true, payment: true, branch: true },
  });

  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Orders</h1>

      <form className="mb-6 flex flex-wrap gap-3" method="get">
        <input
          type="text"
          name="q"
          defaultValue={search ?? ""}
          placeholder="Search by reference or customer name"
          className="w-72 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Filter
        </button>
        {(status || search) && (
          <Link
            href="/admin/orders"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Clear
          </Link>
        )}
      </form>

      <p className="mb-3 text-xs text-zinc-500">
        Showing {orders.length} order{orders.length === 1 ? "" : "s"}
        {orders.length === 100 ? " (most recent 100)" : ""}
      </p>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Placed</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const needsConfirmation =
                order.payment?.method === "CASH_ON_DELIVERY" &&
                order.status === "PENDING_CONFIRMATION";

              return (
                <tr
                  key={order.id}
                  className={`border-b border-zinc-100 last:border-0 ${
                    needsConfirmation ? "bg-amber-50 hover:bg-amber-100" : "hover:bg-zinc-50"
                  }`}
                >
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium text-red-600 hover:underline">
                      {order.payment?.transactionRef ?? order.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{order.user.name}</td>
                  <td className="px-4 py-3 text-zinc-700">{order.branch.name}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    ₱{Number(order.total).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                        needsConfirmation ? "bg-amber-200 text-amber-800" : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {order.createdAt.toLocaleDateString()}{" "}
                    {order.createdAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    {needsConfirmation && (
                      <form action={verifyCodOrderAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <button
                          type="submit"
                          className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                        >
                          Verify
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                  No orders match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
