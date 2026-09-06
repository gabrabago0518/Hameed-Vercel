import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/session.js";
import { prisma } from "../../../../../lib/prisma.js";
import { reconcilePendingPayment } from "../../../../../lib/orderPayment.js";

// Fallback for "the webhook never arrives": the confirmation page polls this
// while payment is still PENDING, and reconcilePendingPayment (lib/
// orderPayment.js) does the actual work of asking PayMongo for the real
// status and settling it. This is an on-view check — it only ever runs for
// the one order someone's actively looking at. /api/cron/reconcile-payments
// covers the case this can't: an order nobody ever reopens.
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

  if (order.payment && order.payment.status === "PENDING") {
    try {
      await reconcilePendingPayment(order.payment);
    } catch (error) {
      console.error("Poll: failed to reconcile payment:", error.message);
    }
  }

  const fresh = await prisma.order.findUnique({
    where: { id },
    include: { payment: true },
  });

  return NextResponse.json({
    orderStatus: fresh.status,
    paymentStatus: fresh.payment?.status ?? null,
  });
}
