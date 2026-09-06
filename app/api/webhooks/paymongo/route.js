import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "../../../../lib/paymongo.js";
import { markOrderPaid, markOrderPaymentFailed } from "../../../../lib/orderPayment.js";
import { sendAdminAlertEmail } from "../../../../lib/mailer.js";
import { prisma } from "../../../../lib/prisma.js";

// PayMongo webhook event shapes (from their docs — NOT yet verified against a
// real delivery in this project, since that needs a live webhook secret and
// an actual sandbox transaction; double-check these paths against a real
// payload — e.g. via the "send test webhook" button in the PayMongo
// dashboard — the first time this runs for real):
//
// {
//   "data": {
//     "id": "evt_...",
//     "type": "event",
//     "attributes": {
//       "type": "payment.paid" | "payment.failed" | ...,
//       "data": {
//         "id": "pay_...",
//         "type": "payment",
//         "attributes": {
//           "amount": 6500,
//           "payment_intent_id": "pi_...",
//           ...
//         }
//       }
//     }
//   }
// }
export async function POST(request) {
  // Must read the RAW body text for signature verification — re-serializing
  // a parsed object can change byte content (key order, spacing) and make a
  // genuinely valid signature look invalid.
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("paymongo-signature");

  let signatureValid;
  try {
    signatureValid = verifyWebhookSignature(rawBody, signatureHeader);
  } catch (error) {
    console.error("Webhook signature check failed:", error.message);
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  if (!signatureValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload?.data;
  const eventId = event?.id;
  const eventType = event?.attributes?.type;
  const resource = event?.attributes?.data;
  const paymentIntentId = resource?.attributes?.payment_intent_id ?? null;
  const paidAmountCentavos = resource?.attributes?.amount ?? null;

  if (!eventId || !eventType) {
    return NextResponse.json({ error: "Malformed event" }, { status: 400 });
  }

  // Idempotency: if we've already recorded this exact event id, this is a
  // redelivery — acknowledge it without doing anything a second time.
  const alreadyProcessed = await prisma.webhookEvent.findUnique({
    where: { provider_providerEventId: { provider: "paymongo", providerEventId: eventId } },
  });
  if (alreadyProcessed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (!paymentIntentId) {
    // Some event types (e.g. account-level events) won't carry a payment
    // intent id at all — record and ignore rather than erroring.
    await prisma.webhookEvent.create({
      data: { provider: "paymongo", providerEventId: eventId, type: eventType },
    });
    return NextResponse.json({ received: true, ignored: true });
  }

  const payment = await prisma.payment.findUnique({
    where: { paymongoPaymentIntentId: paymentIntentId },
  });

  if (!payment) {
    // A payment intent we have no record of — log it, but still 200 so
    // PayMongo doesn't keep retrying an event we're never going to match.
    console.error(`Webhook for unknown payment intent: ${paymentIntentId}`);
    await prisma.webhookEvent.create({
      data: { provider: "paymongo", providerEventId: eventId, type: eventType },
    });
    return NextResponse.json({ received: true, unmatched: true });
  }

  if (eventType === "payment.paid") {
    const expectedCentavos = Math.round(Number(payment.amount) * 100);
    if (paidAmountCentavos !== null && paidAmountCentavos !== expectedCentavos) {
      // Don't silently trust a mismatched amount — this needs a human to
      // look at it, so it's emailed to ADMIN_EMAIL on top of the log line.
      const detail = `Order ${payment.orderId}: expected ${expectedCentavos} centavos, PayMongo's webhook reported ${paidAmountCentavos}.\nPayment Intent: ${paymentIntentId}\nWebhook event: ${eventId}`;
      console.error(`Amount mismatch — ${detail}`);
      try {
        await sendAdminAlertEmail({
          subject: "Payment amount mismatch — order NOT marked paid",
          message: detail,
        });
      } catch (alertError) {
        console.error("Failed to send amount-mismatch alert email:", alertError.message);
      }
    } else {
      await markOrderPaid(payment.orderId);
    }
  } else if (eventType === "payment.failed") {
    await markOrderPaymentFailed(payment.orderId, "Payment failed");
  }
  // Other event types (e.g. payment.refunded) aren't handled yet — extend
  // this if/else chain when that's needed.

  await prisma.webhookEvent.create({
    data: { provider: "paymongo", providerEventId: eventId, type: eventType },
  });

  return NextResponse.json({ received: true });
}
