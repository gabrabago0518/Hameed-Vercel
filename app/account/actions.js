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

  // Same +63-prefix convention as signup — the field only collects the
  // local part, a leading 0 is stripped so a number typed the way it's
  // normally said out loud (e.g. "09171234567") doesn't get double-prefixed.
  const phoneLocalRaw = formData.get("phoneLocal")?.toString().trim();
  const phoneDigits = phoneLocalRaw?.replace(/\D/g, "").replace(/^0+/, "");
  if (!phoneDigits) return;
  const phone = `+63${phoneDigits}`;

  await prisma.user.update({ where: { id: user.id }, data: { phone } });
  revalidatePath("/account");
}
