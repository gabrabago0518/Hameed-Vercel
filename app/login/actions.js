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

  // Checked only after the password is confirmed correct — this way a wrong
  // password never reveals whether an account exists and is unverified, but
  // someone who genuinely owns the account gets a specific, actionable
  // message instead of being told their (correct) password is wrong.
  if (!user.isVerified) {
    return {
      error: "Please verify your email first — check your inbox for the link.",
    };
  }

  await createSession(user.id);

  // Staff don't need the customer account page at all — send them straight
  // to the section they actually use.
  if (user.role === "ADMIN") redirect("/admin");
  if (user.role === "STAFF") redirect("/staff/dashboard");

  // Every new signup now reaches login with zero addresses (signup no
  // longer collects one) — send them to onboarding before the main app.
  // An older account that already has one just goes straight to /account.
  const addressCount = await prisma.address.count({ where: { userId: user.id } });
  if (addressCount === 0) redirect("/onboarding/address");

  redirect("/account");
}
