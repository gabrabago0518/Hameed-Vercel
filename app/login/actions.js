"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma.js";
import { createSession } from "../../lib/session.js";

export async function loginAction(prevState, formData) {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Always run bcrypt.compare, even for a nonexistent user, so a wrong email
  // and a wrong password both take the same amount of time to reject.
  const dummyHash = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8i8mNjNyOTsMSvKywDlhX3iBmc/PGm";
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? dummyHash);

  if (!user || !passwordMatches) {
    return { error: "Incorrect email or password." };
  }

  await createSession(user.id);
  redirect("/account");
}
