import { prisma } from "./prisma.js";
import { sendOrderStatusEmail, sendOrderRefundedEmail } from "./mailer.js";
import { resolveBaseUrl } from "./requestUrl.js";

// Every status actually worth emailing a customer about — PENDING and
// PENDING_CONFIRMATION are excluded since the customer is already looking at
// a "waiting for payment/confirmation" screen when an order reaches those,
// and doesn't need an email to tell them what they're already staring at.
const NOTIFIABLE_STATUSES = new Set([
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
]);

// Called after a status change has already been committed — never from
// inside the transaction that makes the change, since sending an email is
// slow, external I/O that has no business holding a database transaction
// open. Always wrapped in try/catch by design: a failed notification email
// must never make it look like the underlying status change itself failed,
// since the change already happened.
export async function notifyOrderStatusChange(orderId, status) {
  if (!NOTIFIABLE_STATUSES.has(status)) return;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, payment: true },
    });
    if (!order) return;

    const baseUrl = await resolveBaseUrl();
    await sendOrderStatusEmail({
      to: order.user.email,
      name: order.user.name,
      status,
      reference: order.payment?.transactionRef ?? order.id,
      orderUrl: `${baseUrl}/orders/${order.id}`,
    });
  } catch (error) {
    console.error(`Failed to send order status email for order ${orderId} (${status}):`, error.message);
  }
}

export async function notifyOrderRefunded(orderId) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, payment: true },
    });
    if (!order || !order.payment) return;

    const baseUrl = await resolveBaseUrl();
    await sendOrderRefundedEmail({
      to: order.user.email,
      name: order.user.name,
      amount: Number(order.payment.amount).toFixed(2),
      reference: order.payment.transactionRef ?? order.id,
      orderUrl: `${baseUrl}/orders/${order.id}`,
    });
  } catch (error) {
    console.error(`Failed to send refund email for order ${orderId}:`, error.message);
  }
}
