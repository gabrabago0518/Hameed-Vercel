"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../lib/roleGuard.js";
import { prisma } from "../../../lib/prisma.js";

export async function createRiderAction(formData) {
  await requireAdmin();

  const name = formData.get("name")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim();
  const vehicle = formData.get("vehicle")?.toString().trim();
  if (!name || !phone) return;

  await prisma.rider.create({
    data: { name, phone, vehicle: vehicle || null },
  });

  revalidatePath("/admin/riders");
}

// Deactivating rather than deleting — a rider with past deliveries
// (OrderDelivery.riderId) needs to stay around as a real historical record,
// same reasoning as this project never hard-deletes a menu item once it's
// been ordered (see MenuItem.isRetired). An inactive rider just stops
// appearing in the "assign a rider" dropdown for new deliveries.
export async function toggleRiderActiveAction(formData) {
  await requireAdmin();

  const riderId = formData.get("riderId")?.toString();
  if (!riderId) return;

  const rider = await prisma.rider.findUnique({ where: { id: riderId } });
  if (!rider) return;

  await prisma.rider.update({ where: { id: riderId }, data: { isActive: !rider.isActive } });

  revalidatePath("/admin/riders");
}
