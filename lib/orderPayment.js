import { prisma } from "./prisma.js";

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
