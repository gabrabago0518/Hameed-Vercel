import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/prisma.js";
import { STATUS_LABELS, PAYMENT_METHOD_LABELS } from "../../../../lib/orderStatus.js";
import { getOrderItemLineTotal, getOrderItemChoiceLabels } from "../../../../lib/orderItemDisplay.js";
import { verifyCodOrderAction, setOrderStatusAction } from "../actions.js";

const STATUS_OPTIONS = Object.keys(STATUS_LABELS);

export default async function AdminOrderDetailPage({ params, searchParams }) {
  const { id } = await params;
  const { statusError } = await searchParams;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          menuItem: true,
          addons: { include: { addon: true } },
          variantSelections: { include: { variantOption: true } },
        },
      },
      branch: true,
      address: true,
      payment: { include: { codVerifiedBy: true } },
      user: true,
      statusHistory: { orderBy: { createdAt: "asc" }, include: { changedBy: true } },
    },
  });

  if (!order) notFound();

  const needsConfirmation =
    order.payment?.method === "CASH_ON_DELIVERY" && order.status === "PENDING_CONFIRMATION";

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link href="/admin/orders" className="text-sm text-zinc-500 hover:underline">
        &larr; Back to orders
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">
          {order.payment?.transactionRef ?? order.id}
        </h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            needsConfirmation ? "bg-amber-200 text-amber-800" : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      {needsConfirmation && (
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            Cash on Delivery — call the customer to confirm this order before
            it moves to preparation.
          </p>
          <form action={verifyCodOrderAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Verify
            </button>
          </form>
        </div>
      )}

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Customer</h2>
        <p className="text-sm text-zinc-900">{order.user.name}</p>
        <p className="text-sm text-zinc-500">{order.user.email}</p>
        {order.user.phone && <p className="text-sm text-zinc-500">{order.user.phone}</p>}
      </section>

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">
          {order.addressId ? "Delivery address" : "Pickup branch"}
        </h2>
        <p className="text-sm text-zinc-900">
          {order.addressId
            ? `${order.address.line1}${order.address.line2 ? `, ${order.address.line2}` : ""}, ${order.address.city}`
            : order.branch.name}
        </p>
        {order.addressId && (
          <p className="text-sm text-zinc-500">Fulfilled from {order.branch.name}</p>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Items</h2>
        <div className="flex flex-col gap-2 text-sm">
          {order.items.map((item) => {
            const choices = getOrderItemChoiceLabels(item);
            return (
              <div key={item.id} className="flex justify-between">
                <span className="text-zinc-700">
                  {item.quantity} × {item.menuItem.name}
                  {choices.length > 0 && (
                    <span className="text-zinc-400"> ({choices.join(", ")})</span>
                  )}
                </span>
                <span className="font-medium text-zinc-900">
                  ₱{getOrderItemLineTotal(item).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex justify-between border-t border-zinc-100 pt-3 text-sm font-semibold">
          <span>Total</span>
          <span className="text-red-600">₱{Number(order.total).toFixed(2)}</span>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Payment</h2>
        {order.payment ? (
          <div className="text-sm text-zinc-700">
            <p>Method: {PAYMENT_METHOD_LABELS[order.payment.method] ?? order.payment.method}</p>
            <p>Status: {order.payment.status}</p>
            <p>Reference: {order.payment.transactionRef ?? "—"}</p>
            {order.payment.paidAt && (
              <p>Paid at: {order.payment.paidAt.toLocaleString()}</p>
            )}
            {order.payment.codVerifiedAt && (
              <p>
                Verified by {order.payment.codVerifiedBy?.name ?? "—"} at{" "}
                {order.payment.codVerifiedAt.toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No payment record.</p>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Change status</h2>

        {statusError === "confirm_required" && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            That skips or reverts stages rather than moving to the next one.
            Check the box below to confirm this is intentional, then try again.
          </div>
        )}

        <form action={setOrderStatusAction} className="flex flex-col gap-3">
          <input type="hidden" name="orderId" value={order.id} />
          <select
            name="status"
            defaultValue={order.status}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <label className="flex items-start gap-2 text-xs text-zinc-500">
            <input type="checkbox" name="confirmOverride" className="mt-0.5" />
            <span>
              This skips ahead or reverts a stage (only needed if the status
              you picked isn't the normal next step) — check to confirm that's
              intentional.
            </span>
          </label>
          <button
            type="submit"
            className="self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Update status
          </button>
        </form>
      </section>

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Status history</h2>
        <div className="flex flex-col gap-2 text-sm">
          {order.statusHistory.map((entry) => (
            <div key={entry.id} className="flex justify-between text-zinc-600">
              <span>
                {STATUS_LABELS[entry.status]}
                {entry.note ? ` — ${entry.note}` : ""}
                {entry.changedBy ? ` (by ${entry.changedBy.name})` : ""}
              </span>
              <span className="text-zinc-400">{entry.createdAt.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
