import Link from "next/link";
import { prisma } from "../../../lib/prisma.js";
import {
  STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  getNextStatusButtonLabel,
  EXCLUDE_ABANDONED_EXPIRED_ORDERS_WHERE,
} from "../../../lib/orderStatus.js";
import { formatManilaDate, formatManilaTime } from "../../../lib/timezone.js";
import { advanceOrderStatusAction, verifyCodOrderAction, markUnreachableAction } from "../actions.js";
import StaffOrdersPoller from "../StaffOrdersPoller.jsx";
import RefreshButton from "../RefreshButton.jsx";
import FormSpinner from "../../components/FormSpinner.jsx";
import { getOrderItemChoiceLabels } from "../../../lib/orderItemDisplay.js";

// The four filter tabs the staff asked for, plus "All" as the default —
// grouped from the real OrderStatus enum values (see lib/orderStatus.js).
// "Pending" means exactly one thing: PENDING_CONFIRMATION, a Cash on
// Delivery order still awaiting a confirmation call. Nothing else ever
// belongs here by design — a paid QR/GCash order skips CONFIRMED entirely
// and lands straight on PREPARING (see lib/orderPayment.js's markOrderPaid),
// same for a COD order once verifyCodPayment confirms it, so CONFIRMED never
// persists as a real, visible state in the normal flow. Plain PENDING (a
// QR/GCash order still mid-payment, or abandoned) is deliberately left out
// too — by request, since a customer who never finishes paying would
// otherwise clutter this tab with orders staff can't do anything about yet,
// and might never need to.
const FILTER_TABS = [
  { key: "all", label: "All", statuses: null },
  { key: "pending", label: "Pending", statuses: ["PENDING_CONFIRMATION"] },
  { key: "preparing", label: "Preparing", statuses: ["PREPARING"] },
  { key: "out_for_delivery", label: "Out for Delivery", statuses: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY"] },
  { key: "completed", label: "Completed", statuses: ["DELIVERED"] },
  { key: "refunded", label: "Refunded", statuses: ["REFUNDED"] },
];

const PAYMENT_STATUS_STYLES = {
  PENDING: "bg-zinc-100 text-zinc-600",
  PAID: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  EXPIRED: "bg-red-100 text-red-700",
  REFUNDED: "bg-zinc-100 text-zinc-600",
};

export default async function StaffOrdersPage({ searchParams }) {
  const { status } = await searchParams;
  const activeTab = FILTER_TABS.find((tab) => tab.key === status) ?? FILTER_TABS[0];

  const [orders, orderCount, latestChanged] = await Promise.all([
    prisma.order.findMany({
      where: {
        ...(activeTab.statuses ? { status: { in: activeTab.statuses } } : {}),
        ...EXCLUDE_ABANDONED_EXPIRED_ORDERS_WHERE,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: true,
        payment: true,
        items: {
          include: {
            menuItem: true,
            addons: { include: { addon: true } },
            variantSelections: { include: { variantOption: true } },
          },
        },
      },
    }),
    prisma.order.count(),
    prisma.order.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { id: true, status: true, updatedAt: true },
    }),
  ]);

  // Matches exactly what /api/staff/orders/poll computes — same basis, so the
  // poller's first check compares like-for-like instead of immediately
  // (and pointlessly) triggering a refresh because the two were built
  // differently.
  const signature = `${orderCount}|${latestChanged?.id ?? ""}|${latestChanged?.status ?? ""}|${latestChanged?.updatedAt?.getTime() ?? 0}`;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-zinc-900">
          Order Management
        </h1>
        <RefreshButton />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "all" ? "/staff/orders" : `/staff/orders?status=${tab.key}`}
            className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold flex items-center ${
              activeTab.key === tab.key
                ? "bg-red-600 text-white"
                : "border border-zinc-200 bg-white text-zinc-600"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-zinc-500">No orders in this view.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Placed</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const needsCodVerification =
                  order.payment?.method === "CASH_ON_DELIVERY" &&
                  order.status === "PENDING_CONFIRMATION";
                const nextLabel = getNextStatusButtonLabel(order);

                return (
                  <tr
                    key={order.id}
                    className={`border-b border-zinc-100 last:border-0 align-top ${
                      needsCodVerification ? "bg-amber-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {order.payment?.transactionRef ?? order.id}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      <p>{order.user.name}</p>
                      {needsCodVerification && (
                        <p className="mt-0.5 text-xs font-medium text-amber-700">
                          {order.user.phone ?? "No phone on file"}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      <ul className="space-y-0.5">
                        {order.items.map((item) => {
                          const choices = getOrderItemChoiceLabels(item);
                          return (
                            <li key={item.id}>
                              {item.quantity} × {item.menuItem.name}
                              {choices.length > 0 && (
                                <span className="text-zinc-500"> ({choices.join(", ")})</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      ₱{Number(order.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      <p>{PAYMENT_METHOD_LABELS[order.payment?.method] ?? "—"}</p>
                      {order.payment && (
                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                            PAYMENT_STATUS_STYLES[order.payment.status] ?? "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {order.payment.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {formatManilaDate(order.createdAt)} {formatManilaTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        {needsCodVerification && (
                          <>
                            <form action={verifyCodOrderAction}>
                              <FormSpinner />
                              <input type="hidden" name="orderId" value={order.id} />
                              <button
                                type="submit"
                                className="min-h-11 w-full rounded-full bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                              >
                                Verify Customer
                              </button>
                            </form>
                            <form action={markUnreachableAction}>
                              <FormSpinner />
                              <input type="hidden" name="orderId" value={order.id} />
                              <button
                                type="submit"
                                className="min-h-11 w-full rounded-full border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                              >
                                Unreachable ({order.payment.unreachableAttempts}/3)
                              </button>
                            </form>
                          </>
                        )}
                        {nextLabel && (
                          <form action={advanceOrderStatusAction}>
                            <FormSpinner />
                            <input type="hidden" name="orderId" value={order.id} />
                            <button
                              type="submit"
                              className="min-h-11 w-full rounded-full bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                            >
                              {nextLabel}
                            </button>
                          </form>
                        )}
                        {!needsCodVerification && !nextLabel && (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                        <Link
                          href={`/orders/${order.id}/receipt`}
                          target="_blank"
                          className="min-h-11 flex w-full items-center justify-center rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                        >
                          Print receipt
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <StaffOrdersPoller signature={signature} />
    </div>
  );
}
