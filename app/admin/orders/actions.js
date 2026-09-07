"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../lib/roleGuard.js";
import { verifyCodPayment, refundOrderPayment } from "../../../lib/orderPayment.js";
import { prisma } from "../../../lib/prisma.js";
import { STATUS_LABELS, isRegularTransition } from "../../../lib/orderStatus.js";
import { notifyOrderStatusChange } from "../../../lib/orderNotifications.js";

// Deliberately calls requireAdmin() here, not just relying on the /admin
// layout's own gate — this is the one action on this page that should never
// be reachable by anyone but an admin, even if /admin's access rules change
// later (e.g. if employees are ever given read access to the orders list).
export async function verifyCodOrderAction(formData) {
  const admin = await requireAdmin();

  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return;

  await verifyCodPayment(orderId, admin.id);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/staff/dashboard");
  revalidatePath("/staff/orders");
}

// Lets an admin manually set an order to any fulfillment status — including
// jumping ahead or reverting a mistake — separate from the payment-driven
// transitions in lib/orderPayment.js (this never touches Payment.status;
// payment truth still only ever changes via the webhook, the poll route, or
// verifyCodPayment above). A "regular" move (the single next step, cancelling,
// or re-selecting the current status) applies immediately; anything else
// requires the admin to tick the confirm checkbox first — not silently
// blocked, but not silently applied either.
export async function setOrderStatusAction(formData) {
  const admin = await requireAdmin();

  const orderId = formData.get("orderId")?.toString();
  const newStatus = formData.get("status")?.toString();
  const confirmed = formData.get("confirmOverride") === "on";
  if (!orderId || !newStatus || !(newStatus in STATUS_LABELS)) return;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;

  if (newStatus === order.status) {
    redirect(`/admin/orders/${orderId}`);
  }

  if (!isRegularTransition(order, newStatus) && !confirmed) {
    redirect(`/admin/orders/${orderId}?statusError=confirm_required`);
  }

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: newStatus } }),
    prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: newStatus,
        note: "Status set manually by admin",
        changedByUserId: admin.id,
      },
    }),
  ]);

  await notifyOrderStatusChange(orderId, newStatus);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/staff/dashboard");
  revalidatePath("/staff/orders");
  revalidatePath(`/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}`);
}

// Rider assignment/pickup/delivered are deliberately just logistics
// record-keeping on the existing (previously unused) OrderDelivery model —
// they never touch Order.status. Staff still drives the actual fulfillment
// status via their own "Mark [next status]" button; this is a parallel,
// informational trail of who's carrying an order and when it actually left/
// arrived, independent of that state machine.
export async function assignRiderAction(formData) {
  await requireAdmin();

  const orderId = formData.get("orderId")?.toString();
  const riderId = formData.get("riderId")?.toString() || null;
  if (!orderId) return;

  await prisma.orderDelivery.upsert({
    where: { orderId },
    create: { orderId, riderId },
    update: { riderId },
  });

  revalidatePath(`/admin/orders/${orderId}`);
}

export async function markPickedUpAction(formData) {
  await requireAdmin();

  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return;

  await prisma.orderDelivery.upsert({
    where: { orderId },
    create: { orderId, pickedUpAt: new Date() },
    update: { pickedUpAt: new Date() },
  });

  revalidatePath(`/admin/orders/${orderId}`);
}

export async function markDeliveredAction(formData) {
  await requireAdmin();

  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return;

  await prisma.orderDelivery.upsert({
    where: { orderId },
    create: { orderId, deliveredAt: new Date() },
    update: { deliveredAt: new Date() },
  });

  revalidatePath(`/admin/orders/${orderId}`);
}

// Admin-only, same requireAdmin() pattern as verifyCodOrderAction above —
// this moves real money (or at least records that it should have), so it's
// gated the same defense-in-depth way regardless of whatever /admin's own
// layout gate happens to allow later. Requires an explicit confirmation
// checkbox, same reasoning as setOrderStatusAction's override — a refund
// isn't something to fire off from a misclick.
export async function refundOrderAction(formData) {
  await requireAdmin();

  const orderId = formData.get("orderId")?.toString();
  const confirmed = formData.get("confirmRefund") === "on";
  if (!orderId) return;

  if (!confirmed) {
    redirect(`/admin/orders/${orderId}?refundError=confirm_required`);
  }

  const result = await refundOrderPayment(orderId);

  if (!result.changed) {
    const error = result.reason === "paymongo_error" ? "paymongo_failed" : "not_refundable";
    redirect(`/admin/orders/${orderId}?refundError=${error}`);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/staff/dashboard");
  revalidatePath("/staff/orders");
  revalidatePath(`/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}`);
}
