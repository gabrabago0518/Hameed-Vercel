import { prisma } from "./prisma.js";
import { retrievePaymentIntent, createRefund } from "./paymongo.js";
import { sendAdminAlertEmail } from "./mailer.js";
import { notifyOrderStatusChange, notifyOrderRefunded } from "./orderNotifications.js";

// These three functions are the single source of truth for "what happens to
// an Order when its payment resolves." Both the webhook handler and the
// polling fallback call into these, so a payment can never be settled two
// different ways depending on which path noticed it first.
//
// Each one re-checks the payment's current status before doing anything —
// that's what makes them safe to call more than once for the same order
// (a redelivered webhook, or a webhook and a poll racing each other).

// paymongoPaymentId is optional — the webhook has it directly on the event
// payload (the `pay_...` resource id), a poll/sweep reconciliation has to
// pull it from the succeeded intent's own `payments` array instead, and
// verifyCodPayment below never has one at all (COD has no PayMongo payment).
// Stored here (rather than backfilled later) since this is the one moment
// it's known — a refund attempted afterward has to work with whatever got
// captured here.
export async function markOrderPaid(orderId, paymongoPaymentId = null) {
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { orderId } });
    if (!payment || payment.status === "PAID") {
      return { changed: false };
    }

    await tx.payment.update({
      where: { orderId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        ...(paymongoPaymentId ? { paymongoPaymentId } : {}),
      },
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

  // Notified outside the transaction — sending an email is slow external I/O
  // that has no business holding a database transaction open, and a
  // redundant call here (payment already PAID) correctly sends nothing.
  if (result.changed) {
    await notifyOrderStatusChange(orderId, "CONFIRMED");
  }
  return result;
}

export async function markOrderPaymentFailed(orderId, note = "Payment failed") {
  const result = await prisma.$transaction(async (tx) => {
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

  if (result.changed) {
    await notifyOrderStatusChange(orderId, "CANCELLED");
  }
  return result;
}

// The manual equivalent of markOrderPaid, for Cash on Delivery — triggered by
// an admin clicking "Verify" on /admin/orders after calling the customer,
// instead of a PayMongo webhook. Deliberately its own function rather than
// reusing markOrderPaid: COD has no PayMongo payment to have "succeeded," and
// this one records who verified it and when.
export async function verifyCodPayment(orderId, verifiedByUserId) {
  const result = await prisma.$transaction(async (tx) => {
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

  if (result.changed) {
    await notifyOrderStatusChange(orderId, "CONFIRMED");
  }
  return result;
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
      const detail = `Order ${payment.orderId}: expected ${expectedCentavos} centavos, PayMongo reported ${paidCentavos}.\nPayment Intent: ${payment.paymongoPaymentIntentId}`;
      console.error(`Amount mismatch — ${detail}`);
      try {
        await sendAdminAlertEmail({
          subject: "Payment amount mismatch — order NOT marked paid",
          message: detail,
        });
      } catch (alertError) {
        console.error("Failed to send amount-mismatch alert email:", alertError.message);
      }
      return { changed: false, result: "amount_mismatch" };
    }
    // Not yet verified against a real PayMongo payload which array shape a
    // succeeded intent's `payments` field actually returns — optional
    // chaining throughout so a missing/differently-shaped field just means
    // no paymongoPaymentId gets captured here, not a crash.
    const paymongoPaymentId = intent.attributes.payments?.[0]?.id ?? null;
    const outcome = await markOrderPaid(payment.orderId, paymongoPaymentId);
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
  const result = await prisma.$transaction(async (tx) => {
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

  if (result.changed) {
    await notifyOrderStatusChange(orderId, "CANCELLED");
  }
  return result;
}

// Triggered by an admin's "Refund" button (app/admin/orders/actions.js's
// refundOrderAction) — this project has no self-service refund request from
// the customer side. Deliberately doesn't touch Order.status: whether a
// refund should also cancel the order depends on where it is in its
// lifecycle (a refund before preparation probably should; a refund on an
// already-DELIVERED order for a complaint shouldn't retroactively say it was
// never delivered), and that's a judgment call for whoever's issuing the
// refund to make separately via the existing status dropdown — this
// function only ever changes payment truth, matching the same separation
// setOrderStatusAction already keeps from the payment-driven functions above.
export async function refundOrderPayment(orderId) {
  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment || payment.status !== "PAID") {
    return { changed: false, reason: "not_paid" };
  }

  let paymongoRefundId = null;
  // COD, or an online payment with no stored paymongoPaymentId (e.g. one
  // verified/paid before this field existed) — nothing to call PayMongo's
  // API about. Refunding still records the fact locally; the money itself
  // has to move by whatever manual means makes sense (cash back, bank
  // transfer, etc.) since there's no PayMongo transaction backing it.
  if (payment.paymongoPaymentId) {
    try {
      const refund = await createRefund({
        paymentId: payment.paymongoPaymentId,
        amountCentavos: Math.round(Number(payment.amount) * 100),
      });
      paymongoRefundId = refund.refundId;
    } catch (error) {
      console.error(`Refund failed for order ${orderId}:`, error.message);
      return { changed: false, reason: "paymongo_error", error: error.message };
    }
  }

  await prisma.payment.update({
    where: { orderId },
    data: { status: "REFUNDED", refundedAt: new Date(), paymongoRefundId },
  });

  await notifyOrderRefunded(orderId);

  return { changed: true, refundedViaPaymongo: Boolean(paymongoRefundId) };
}

// Reconciliation-only counterpart to refundOrderPayment above — called from
// the webhook when PayMongo itself reports a payment.refunded event, never
// to *initiate* a refund (that's always refundOrderPayment, which is the
// only thing that actually calls PayMongo's refund API). This just confirms
// what already happened and is a no-op if the payment is already marked
// REFUNDED, so it's safe however many times a redelivered webhook fires it.
export async function markOrderPaymentRefunded(orderId, paymongoRefundId = null) {
  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment || payment.status === "REFUNDED") {
    return { changed: false };
  }

  await prisma.payment.update({
    where: { orderId },
    data: {
      status: "REFUNDED",
      refundedAt: new Date(),
      ...(paymongoRefundId ? { paymongoRefundId } : {}),
    },
  });

  await notifyOrderRefunded(orderId);
  return { changed: true };
}
