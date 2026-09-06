import { prisma } from "./prisma.js";
import { retrievePaymentIntent } from "./paymongo.js";

// These three functions are the single source of truth for "what happens to
// an Order when its payment resolves." Both the webhook handler and the
// polling fallback call into these, so a payment can never be settled two
// different ways depending on which path noticed it first.
//
// Each one re-checks the payment's current status before doing anything —
// that's what makes them safe to call more than once for the same order
// (a redelivered webhook, or a webhook and a poll racing each other).

export async function markOrderPaid(orderId) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { orderId } });
    if (!payment || payment.status === "PAID") {
      return { changed: false };
    }

    await tx.payment.update({
      where: { orderId },
      data: { status: "PAID", paidAt: new Date() },
    });
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CONFIRMED" },
    });
    await tx.orderStatusHistory.create({
      data: { orderId, status: "CONFIRMED", note: "Payment received" },
    });

    return { changed: true };
  });
}

export async function markOrderPaymentFailed(orderId, note = "Payment failed") {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { orderId } });
    if (!payment || payment.status === "PAID" || payment.status === "FAILED") {
      return { changed: false };
    }

    await tx.payment.update({ where: { orderId }, data: { status: "FAILED" } });
    await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
    await tx.orderStatusHistory.create({
      data: { orderId, status: "CANCELLED", note },
    });

    return { changed: true };
  });
}

// The manual equivalent of markOrderPaid, for Cash on Delivery — triggered by
// an admin clicking "Verify" on /admin/orders after calling the customer,
// instead of a PayMongo webhook. Deliberately its own function rather than
// reusing markOrderPaid: COD has no PayMongo payment to have "succeeded," and
// this one records who verified it and when.
export async function verifyCodPayment(orderId, verifiedByUserId) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { orderId } });
    if (!payment || payment.method !== "CASH_ON_DELIVERY" || payment.status !== "PENDING") {
      return { changed: false };
    }

    await tx.payment.update({
      where: { orderId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        codVerifiedAt: new Date(),
        codVerifiedByUserId: verifiedByUserId,
      },
    });
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CONFIRMED" },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: "CONFIRMED",
        note: "Confirmed by staff — cash on delivery",
        changedByUserId: verifiedByUserId,
      },
    });

    return { changed: true };
  });
}

// Given a PENDING online payment (QR/GCash — COD never reaches here, it has
// no PayMongo intent to check), asks PayMongo directly what its real status
// is right now and settles it accordingly. This is the one place that logic
// lives — both the customer-facing poll route (/api/orders/[id]/poll, which
// checks just the one order someone's actively looking at) and the
// scheduled sweep (/api/cron/reconcile-payments, which checks every pending
// payment on a timer so an order nobody ever reopens doesn't sit PENDING
// forever) call this instead of duplicating the PayMongo-status logic twice.
export async function reconcilePendingPayment(payment) {
  if (payment.status !== "PENDING") {
    return { changed: false, result: "not_pending" };
  }

  if (payment.expiresAt && payment.expiresAt < new Date()) {
    const outcome = await markOrderPaymentExpired(payment.orderId);
    return { ...outcome, result: "expired" };
  }

  if (!payment.paymongoPaymentIntentId) {
    return { changed: false, result: "no_intent" };
  }

  const intent = await retrievePaymentIntent(payment.paymongoPaymentIntentId);
  const status = intent.attributes.status;

  if (status === "succeeded") {
    // Never trust "succeeded" alone — confirm it succeeded for the exact
    // amount this order was created for (subtotal + delivery fee). Same
    // guard the webhook applies; a GCash/QR Payment Intent's amount can't
    // actually be changed by the customer, so this should never trigger in
    // practice, but it costs nothing to check.
    const paidCentavos = intent.attributes.amount;
    const expectedCentavos = Math.round(Number(payment.amount) * 100);
    if (paidCentavos !== expectedCentavos) {
      console.error(
        `Amount mismatch for order ${payment.orderId}: expected ${expectedCentavos}, got ${paidCentavos}`
      );
      return { changed: false, result: "amount_mismatch" };
    }
    const outcome = await markOrderPaid(payment.orderId);
    return { ...outcome, result: "paid" };
  }

  if (intent.attributes.last_payment_error || status === "awaiting_payment_method") {
    // Two different failure signals — see the poll route's own comment
    // history for why: an active decline populates last_payment_error, but
    // an abandoned/expired Source instead resets the intent back to
    // "awaiting_payment_method" with no error object at all.
    const outcome = await markOrderPaymentFailed(
      payment.orderId,
      intent.attributes.last_payment_error?.detail || "Payment failed"
    );
    return { ...outcome, result: "failed" };
  }

  return { changed: false, result: "still_pending" };
}

export async function markOrderPaymentExpired(orderId) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { orderId } });
    // Only expire if still PENDING — never overwrite an already-PAID or
    // already-FAILED payment just because its window happened to pass too.
    if (!payment || payment.status !== "PENDING") {
      return { changed: false };
    }

    await tx.payment.update({ where: { orderId }, data: { status: "EXPIRED" } });
    await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
    await tx.orderStatusHistory.create({
      data: { orderId, status: "CANCELLED", note: "Payment window expired" },
    });

    return { changed: true };
  });
}
