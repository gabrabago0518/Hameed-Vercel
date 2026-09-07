"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "../../lib/roleGuard.js";
import { prisma } from "../../lib/prisma.js";
import { getNextOrderStatus } from "../../lib/orderStatus.js";
import { verifyCodPayment } from "../../lib/orderPayment.js";
import { notifyOrderStatusChange } from "../../lib/orderNotifications.js";

export async function advanceOrderStatusAction(formData) {
  const staffUser = await requireStaff();

  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;

  const next = getNextOrderStatus(order);
  if (!next) return;

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: next } }),
    prisma.orderStatusHistory.create({
      data: { orderId, status: next, note: "Updated by staff", changedByUserId: staffUser.id },
    }),
  ]);

  await notifyOrderStatusChange(orderId, next);

  revalidatePath("/staff/dashboard");
  revalidatePath("/staff/orders");
  revalidatePath(`/orders/${orderId}`);
}

// The staff-facing version of admin/orders/actions.js's verifyCodOrderAction —
// same underlying lib/orderPayment.js function, but reachable by STAFF too
// (not just ADMIN), since staff are the ones actually working the Order
// Management view and calling customers to confirm a Cash on Delivery order.
// The admin-only action stays admin-only and untouched; this is a separate,
// deliberately staff-accessible entry point into the same idempotent
// verifyCodPayment() logic.
export async function verifyCodOrderAction(formData) {
  const staffUser = await requireStaff();

  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return;

  await verifyCodPayment(orderId, staffUser.id);

  revalidatePath("/staff/dashboard");
  revalidatePath("/staff/orders");
  revalidatePath(`/orders/${orderId}`);
}
