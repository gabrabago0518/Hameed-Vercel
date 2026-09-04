"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma.js";
import { getCurrentUser } from "../../lib/session.js";

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
