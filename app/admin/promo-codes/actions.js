"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../lib/roleGuard.js";
import { prisma } from "../../../lib/prisma.js";

export async function createPromoCodeAction(prevState, formData) {
  await requireAdmin();

  const code = formData.get("code")?.toString().trim().toUpperCase();
  const type = formData.get("type")?.toString();
  const rawValue = formData.get("value")?.toString();
  const rawExpiresAt = formData.get("expiresAt")?.toString();
  const rawMaxUses = formData.get("maxUses")?.toString();

  if (!code) {
    return { error: "Enter a code." };
  }
  if (!["PERCENT", "FIXED"].includes(type)) {
    return { error: "Choose a discount type." };
  }

  const value = rawValue ? Number.parseFloat(rawValue) : NaN;
  if (!rawValue || Number.isNaN(value) || value <= 0) {
    return { error: "Enter a valid discount value." };
  }
  if (type === "PERCENT" && value > 100) {
    return { error: "A percent discount can't be more than 100." };
  }

  const maxUses = rawMaxUses ? Number.parseInt(rawMaxUses, 10) : null;
  if (rawMaxUses && (Number.isNaN(maxUses) || maxUses <= 0)) {
    return { error: "Max uses must be a positive whole number, or left blank for unlimited." };
  }

  const expiresAt = rawExpiresAt ? new Date(rawExpiresAt) : null;
  if (rawExpiresAt && Number.isNaN(expiresAt?.getTime())) {
    return { error: "Enter a valid expiry date, or leave it blank." };
  }

  const existing = await prisma.promoCode.findUnique({ where: { code } });
  if (existing) {
    return { error: `Code "${code}" already exists.` };
  }

  await prisma.promoCode.create({
    data: { code, type, value, maxUses, expiresAt },
  });

  revalidatePath("/admin/promo-codes");
  return { error: null };
}

// Never deleted, same reasoning as menu items/riders elsewhere in this
// project — a code that's already been used on real orders (Order.promoCodeId)
// needs to stay around as a real historical record. Deactivating just stops
// it from validating for any new order.
export async function togglePromoCodeActiveAction(formData) {
  await requireAdmin();

  const promoCodeId = formData.get("promoCodeId")?.toString();
  if (!promoCodeId) return;

  const promoCode = await prisma.promoCode.findUnique({ where: { id: promoCodeId } });
  if (!promoCode) return;

  await prisma.promoCode.update({
    where: { id: promoCodeId },
    data: { isActive: !promoCode.isActive },
  });

  revalidatePath("/admin/promo-codes");
}
