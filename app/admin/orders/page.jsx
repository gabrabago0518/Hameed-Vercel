import Link from "next/link";
import { prisma } from "../../../lib/prisma.js";
import { STATUS_LABELS, isPaymentWindowExpired } from "../../../lib/orderStatus.js";
import { verifyCodOrderAction } from "./actions.js";

const STATUS_OPTIONS = Object.keys(STATUS_LABELS);
const PAGE_SIZE = 25;

function buildPageHref(page, { status, search }) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (search) params.set("q", search);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

export default async function AdminOrdersPage({ searchParams }) {
  const { status, q, page: rawPage } = await searchParams;
  const search = q?.toString().trim();

  const requestedPage = rawPage ? Number.parseInt(rawPage.toString(), 10) : 1;
  const page = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;

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

  const totalCount = await prisma.order.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
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
        Showing {orders.length} of {totalCount} order{totalCount === 1 ? "" : "s"}
        {totalPages > 1 ? ` (page ${currentPage} of ${totalPages})` : ""}
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
              const expiredPending = isPaymentWindowExpired(order);

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
                        needsConfirmation
                          ? "bg-amber-200 text-amber-800"
                          : expiredPending
                            ? "bg-zinc-100 text-zinc-400"
                            : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {expiredPending ? "Payment window expired" : STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {order.createdAt.toLocaleDateString()}{" "}
                    {order.createdAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
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
                      <Link
                        href={`/orders/${order.id}/receipt`}
                        target="_blank"
                        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-center text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                      >
                        Print receipt
                      </Link>
                    </div>
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

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          {currentPage > 1 ? (
            <Link
              href={buildPageHref(currentPage - 1, { status, search })}
              className="rounded-lg border border-zinc-300 px-4 py-2 font-medium text-zinc-600 hover:bg-zinc-50"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-zinc-500">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages ? (
            <Link
              href={buildPageHref(currentPage + 1, { status, search })}
              className="rounded-lg border border-zinc-300 px-4 py-2 font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
