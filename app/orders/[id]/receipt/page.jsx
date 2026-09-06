import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "../../../../lib/session.js";
import { prisma } from "../../../../lib/prisma.js";
import { getOrderItemLineTotal, getOrderItemChoiceLabels } from "../../../../lib/orderItemDisplay.js";
import { PAYMENT_METHOD_LABELS } from "../../../../lib/orderStatus.js";
import PrintButton from "./PrintButton.jsx";

// A standalone, print-friendly view of one order — deliberately separate
// from /orders/[id] (which has live status tracking, polling, and site
// chrome none of that belongs on something meant to be printed or saved as
// a PDF). ChromeGate hides the header/cart panel here the same way it does
// for /admin and /staff, and the "Back"/Print controls are hidden via
// Tailwind's print: variant so they never show up in the printed/PDF output.
export default async function OrderReceiptPage({ params }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

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
      payment: true,
    },
  });

  if (!order || order.userId !== user.id) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-10 print:max-w-none print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={`/orders/${order.id}`} className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          ← Back to order
        </Link>
        <PrintButton />
      </div>

      <div className="rounded-2xl border border-zinc-200 p-6 print:border-0 print:p-0">
        <div className="text-center">
          <p className="font-[family-name:var(--font-heading)] text-lg font-bold text-zinc-900">
            Hameed the Love Recipe
          </p>
          <p className="mt-1 text-xs text-zinc-500">{order.branch.name}</p>
          <p className="text-xs text-zinc-500">
            {order.branch.address}, {order.branch.city}
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-1 border-t border-dashed border-zinc-300 pt-3 text-xs text-zinc-600">
          <div className="flex justify-between">
            <span>Reference</span>
            <span className="font-semibold text-zinc-900">
              {order.payment?.transactionRef ?? order.id}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Date</span>
            <span>
              {order.createdAt.toLocaleDateString()}{" "}
              {order.createdAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Customer</span>
            <span>{user.name}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-dashed border-zinc-300 pt-3 text-sm">
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

        <div className="mt-3 flex flex-col gap-1 border-t border-dashed border-zinc-300 pt-3 text-sm">
          <div className="flex justify-between text-zinc-600">
            <span>Subtotal</span>
            <span>₱{Number(order.subtotal).toFixed(2)}</span>
          </div>
          {Number(order.deliveryFee) > 0 && (
            <div className="flex justify-between text-zinc-600">
              <span>Delivery fee</span>
              <span>₱{Number(order.deliveryFee).toFixed(2)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-zinc-200 pt-2 font-semibold text-zinc-900">
            <span>Total</span>
            <span>₱{Number(order.total).toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-1 border-t border-dashed border-zinc-300 pt-3 text-xs text-zinc-600">
          <div className="flex justify-between gap-4">
            <span className="shrink-0">{order.addressId ? "Delivery to" : "Pickup at"}</span>
            <span className="text-right text-zinc-900">
              {order.addressId
                ? `${order.address.line1}, ${order.address.city}`
                : order.branch.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Payment method</span>
            <span className="text-zinc-900">
              {PAYMENT_METHOD_LABELS[order.payment?.method] ?? "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Payment status</span>
            <span className="text-zinc-900">{order.payment?.status ?? "—"}</span>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Thank you for ordering with Hameed the Love Recipe!
        </p>
      </div>
    </main>
  );
}
