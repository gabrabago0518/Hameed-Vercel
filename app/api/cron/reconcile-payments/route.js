import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma.js";
import { reconcilePendingPayment } from "../../../../lib/orderPayment.js";

// Scheduled sweep (see vercel.json's "crons" entry) for the one case nothing
// else in this project covers: an order the customer never looks at again
// after paying (or after giving up). The webhook is the fast path, and
// /api/orders/[id]/poll is the on-view fallback while someone's actually
// staring at the confirmation/order page — but neither of those runs at all
// if nobody's browser is open to trigger them. This runs on Vercel's own
// schedule regardless, checking every online payment still sitting PENDING.
//
// Vercel signs its own Cron requests with an Authorization header matching
// the CRON_SECRET environment variable — set that in Vercel's project
// settings (same idea as SETUP_SECRET for the one-off setup routes) so this
// endpoint can't be triggered by anyone who finds the URL. If CRON_SECRET
// isn't set, this deliberately refuses to run rather than silently allowing
// unauthenticated calls to hammer the PayMongo API on this order's behalf.
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET is not set — refusing to run the payment reconciliation sweep.");
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pendingPayments = await prisma.payment.findMany({
    where: { status: "PENDING", paymongoPaymentIntentId: { not: null } },
  });

  const results = { checked: pendingPayments.length, paid: 0, failed: 0, expired: 0, unchanged: 0, errors: 0 };

  for (const payment of pendingPayments) {
    try {
      const outcome = await reconcilePendingPayment(payment);
      if (outcome.result === "paid") results.paid++;
      else if (outcome.result === "failed") results.failed++;
      else if (outcome.result === "expired") results.expired++;
      else results.unchanged++;
    } catch (error) {
      console.error(`Cron: failed to reconcile payment ${payment.id}:`, error.message);
      results.errors++;
    }
  }

  return NextResponse.json(results);
}
