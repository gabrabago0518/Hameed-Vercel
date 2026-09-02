"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma.js";
import { getCurrentUser } from "../../lib/session.js";

// Keeps things simple for now: one address per account, not a full address
// book. If the user already has an address, this updates it; otherwise it
// creates their first one.
export async function saveAddressAction(formData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const line1 = formData.get("line1")?.toString().trim();
  const city = formData.get("city")?.toString().trim();
  if (!line1 || !city) return;

  const existing = await prisma.address.findFirst({ where: { userId: user.id } });

  if (existing) {
    await prisma.address.update({
      where: { id: existing.id },
      data: { line1, city },
    });
  } else {
    await prisma.address.create({
      data: { userId: user.id, line1, city, isDefault: true },
    });
  }

  revalidatePath("/account");
}

export async function savePhoneAction(formData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const phone = formData.get("phone")?.toString().trim();
  if (!phone) return;

  await prisma.user.update({ where: { id: user.id }, data: { phone } });
  revalidatePath("/account");
}
