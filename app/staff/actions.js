"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "../../lib/roleGuard.js";
import { prisma } from "../../lib/prisma.js";
import { getNextOrderStatus } from "../../lib/orderStatus.js";

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

  revalidatePath("/staff");
  revalidatePath(`/orders/${orderId}`);
}
