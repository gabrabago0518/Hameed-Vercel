"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma.js";
import { createSession } from "../../lib/session.js";

export async function signupAction(prevState, formData) {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const phone = formData.get("phone")?.toString().trim();
  const line1 = formData.get("line1")?.toString().trim();
  const city = formData.get("city")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!name || !email || !phone || !line1 || !city || !password) {
    return { error: "Please fill in all fields." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      addresses: {
        create: { line1, city, isDefault: true },
      },
    },
  });

  await createSession(user.id);
  redirect("/account");
}
