import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "../../../lib/session.js";
import { prisma } from "../../../lib/prisma.js";
import { buildOrderTracker } from "../../../lib/orderStatus.js";
import { getOrderItemLineTotal, getOrderItemChoiceLabels } from "../../../lib/orderItemDisplay.js";
import OrderStatusPoller from "../../components/OrderStatusPoller.jsx";
import OrderTracker from "../../components/OrderTracker.jsx";

function PaymentSection({ order }) {
  const payment = order.payment;
  if (!payment) return null;

  if (payment.method === "CASH_ON_DELIVERY") {
    if (order.status === "PENDING_CONFIRMATION") {
      return (
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-amber-800">
            Cash on Delivery
          </h2>
          <p className="mt-2 text-sm text-amber-700">
            Your order has been placed. Our store will call you shortly to
            confirm before we start preparing it.
          </p>
          <p className="mt-2 text-xs text-amber-600">
            Reference: {payment.transactionRef}
          </p>
        </section>
      );
    }

    if (order.status === "CANCELLED") {
      return (
        <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-red-800">
            Order cancelled
          </h2>
        </section>
      );
    }

    // Verified by an admin — same status any successful QR/GCash payment reaches.
    return (
      <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-emerald-800">
          Order confirmed
        </h2>
        <p className="mt-2 text-sm text-emerald-700">
          We're preparing your order now. Please have exact cash ready.
        </p>
      </section>
    );
  }

  if (payment.status === "PAID") {
    return (
      <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-emerald-800">
          Payment received
        </h2>
        <p className="mt-2 text-sm text-emerald-700">
          We're preparing your order now.
        </p>
      </section>
    );
  }

  if (payment.status === "FAILED" || payment.status === "EXPIRED") {
    // Whether it was declined or simply timed out, the customer just sees
    // "Failed" — we still keep FAILED vs EXPIRED distinct in the database
    // (Payment.status) since that's a useful difference to have on record.
    return (
      <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-red-800">
          Payment failed
        </h2>
        <p className="mt-2 text-sm text-red-700">
          This order was cancelled.
        </p>
        <Link
          href="/menu"
          className="mt-4 inline-block rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          Try another payment
        </Link>
      </section>
    );
  }

  // PENDING from here on.
  if (!payment.paymongoPaymentIntentId) {
    return (
      <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-amber-800">
          Payment setup failed
        </h2>
        <p className="mt-2 text-sm text-amber-700">
          Something went wrong starting your payment. Please contact us with your
          reference number below and we'll sort it out.
        </p>
        <p className="mt-2 text-xs text-amber-600">
          Reference: {payment.transactionRef}
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 text-center">
      <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-zinc-900">
        Pay via {payment.method === "GCASH" ? "GCash" : "QR code"}
      </h2>

      {payment.method === "GCASH" && payment.paymongoCheckoutUrl && (
        <>
          <a
            href={payment.paymongoCheckoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-full bg-red-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-red-700"
          >
            Continue to GCash
          </a>
          <p className="mt-3 text-xs text-zinc-500">
            Opens in a new tab. If anything goes wrong there, just close it and
            come back to this tab — it'll show the right result either way.
          </p>
        </>
      )}

      {payment.method === "QR_CODE" && payment.paymongoQrCodeData && (
        <div className="mx-auto mt-4 h-48 w-48 overflow-hidden rounded-xl border border-zinc-200">
          <Image
            src={payment.paymongoQrCodeData}
            alt="Scan to pay"
            width={192}
            height={192}
            className="h-full w-full object-contain"
            unoptimized
          />
        </div>
      )}

      <p className="mt-4 text-sm text-zinc-600">
        Pay ₱{Number(order.total).toFixed(2)} — this page will update itself once
        we receive your payment.
      </p>
      <p className="mt-1 text-xs text-zinc-400">Reference: {payment.transactionRef}</p>
    </section>
  );
}

export default async function OrderConfirmationPage({ params }) {
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
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order || order.userId !== user.id) {
    notFound();
  }

  const trackerStages = buildOrderTracker(order);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="mb-2 font-[family-name:var(--font-heading)] text-xl font-bold text-zinc-900 sm:text-2xl">
        Order placed!
      </h1>
      <p className="mb-8 text-sm text-zinc-600">
        Reference:{" "}
        <span className="font-semibold text-zinc-900">
          {order.payment?.transactionRef}
        </span>
      </p>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-zinc-900">
          Order summary
        </h2>
        <div className="mt-3 flex flex-col gap-2 text-sm">
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
        <div className="mt-3 flex justify-between border-t border-zinc-100 pt-3 text-sm font-semibold text-zinc-900">
          <span>Total</span>
          <span className="text-red-600">₱{Number(order.total).toFixed(2)}</span>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-zinc-900">
          {order.addressId ? "Delivery" : "Pickup"}
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          {order.addressId
            ? `${order.address.line1}, ${order.address.city} — from ${order.branch.name}`
            : `Pick up at ${order.branch.name}`}
        </p>
      </section>

      <PaymentSection order={order} />

      {trackerStages && (
        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-5 font-[family-name:var(--font-heading)] text-lg font-semibold text-zinc-900">
            Order status
          </h2>
          <OrderTracker stages={trackerStages} />
        </section>
      )}

      {order.payment && (
        <OrderStatusPoller
          orderId={order.id}
          paymentStatus={order.payment.status}
          orderStatus={order.status}
        />
      )}

      <Link
        href="/orders"
        className="mt-8 block rounded-full bg-red-600 px-8 py-3 text-center text-base font-semibold text-white transition-colors hover:bg-red-700"
      >
        View my orders
      </Link>
    </main>
  );
}
