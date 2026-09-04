"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../lib/roleGuard.js";
import { verifyCodPayment } from "../../../lib/orderPayment.js";
import { prisma } from "../../../lib/prisma.js";
import { STATUS_LABELS, isRegularTransition } from "../../../lib/orderStatus.js";

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

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/staff/dashboard");
  revalidatePath("/staff/orders");
  revalidatePath(`/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}`);
}
