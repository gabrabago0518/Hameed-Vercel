import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/session.js";
import { prisma } from "../../../../../lib/prisma.js";
import { retrievePaymentIntent } from "../../../../../lib/paymongo.js";
import { clearCart } from "../../../../../lib/cart.js";
import { clearFulfillment } from "../../../../../lib/fulfillment.js";
import {
  markOrderPaid,
  markOrderPaymentExpired,
  markOrderPaymentFailed,
} from "../../../../../lib/orderPayment.js";

// Fallback for "the webhook never arrives": the confirmation page polls this
// while payment is still PENDING. If PayMongo says the intent has actually
// succeeded, we reconcile right here instead of waiting on the webhook — and
// if the payment window has simply run out, we expire it. This is a lazy,
// on-view check rather than a background job, since there's no
// cron/scheduler in this project; an order nobody ever looks at again just
// stays PENDING until someone does (a real production setup would want an
// actual scheduled sweep for that case).
export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { payment: true },
  });

  if (!order || order.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const payment = order.payment;

  if (payment && payment.status === "PENDING") {
    if (payment.expiresAt && payment.expiresAt < new Date()) {
      await markOrderPaymentExpired(order.id);
    } else if (payment.paymongoPaymentIntentId) {
      try {
        const intent = await retrievePaymentIntent(payment.paymongoPaymentIntentId);
        const status = intent.attributes.status;

        if (status === "succeeded") {
          await markOrderPaid(order.id);
        } else if (intent.attributes.last_payment_error || status === "awaiting_payment_method") {
          // Two different failure signals, because a declined payment and an
          // expired/abandoned Source don't necessarily look the same:
          // `last_payment_error` is populated for an active decline, but a
          // Source that just times out unattended may never set that field
          // at all — instead PayMongo resets the intent's status back to
          // "awaiting_payment_method" (ready to attach a new one). Since we
          // always attach a payment method immediately in
          // createAndAttachPaymentIntent, ever observing that status again on
          // a later poll can only mean the attempt we made has fallen
          // through — there's no other way to get back there in our flow.
          await markOrderPaymentFailed(
            order.id,
            intent.attributes.last_payment_error?.detail || "Payment failed"
          );
        }
      } catch (error) {
        console.error("Poll: failed to retrieve PayMongo intent:", error.message);
      }
    }
  }

  const fresh = await prisma.order.findUnique({
    where: { id },
    include: { payment: true },
  });

  // The cart/fulfillment cookies deliberately don't clear at checkout
  // anymore (see placeOrderAction) — they clear here instead, the first time
  // the customer's own browser observes this order as actually PAID. This is
  // the only place that *can* do it: a PayMongo webhook and a staff COD
  // verification both change Payment.status without ever touching the
  // customer's cookies, since neither one is a request from their browser.
  // Idempotent — clearing an already-empty cart is a harmless no-op, so
  // there's no need to track whether this is the first time it's fired.
  if (fresh.payment?.status === "PAID") {
    await clearCart();
    await clearFulfillment();
  }

  return NextResponse.json({
    orderStatus: fresh.status,
    paymentStatus: fresh.payment?.status ?? null,
  });
}
