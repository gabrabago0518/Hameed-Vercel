"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma.js";
import { createSession } from "../../lib/session.js";
import {
  getActiveLock,
  recordFailedLogin,
  resetLoginAttempts,
  formatLockMessage,
} from "../../lib/loginThrottle.js";

export async function loginAction(prevState, formData) {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Checked before even touching the password — a locked account should
  // reject every attempt uniformly while locked, not just the ones that
  // happen to guess wrong again.
  const activeLock = getActiveLock(user);
  if (activeLock) {
    return { error: formatLockMessage(activeLock) };
  }

  // Always run bcrypt.compare, even for a nonexistent user, so a wrong email
  // and a wrong password both take the same amount of time to reject.
  const dummyHash = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8i8mNjNyOTsMSvKywDlhX3iBmc/PGm";
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? dummyHash);

  if (!user || !passwordMatches) {
    // Only a real account's counter can increment — a wrong email for a
    // nonexistent account has nothing to lock, and counting it would let
    // someone lock out an account they don't even know exists yet.
    if (user) {
      const { lockedUntil } = await recordFailedLogin(user.id);
      if (lockedUntil) {
        return { error: formatLockMessage(lockedUntil) };
      }
    }
    return { error: "Incorrect email or password." };
  }

  await resetLoginAttempts(user.id);

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
  // An older account that already has one just goes straight to the
  // homepage, same as any other customer login.
  const addressCount = await prisma.address.count({ where: { userId: user.id } });
  if (addressCount === 0) redirect("/onboarding/address");

  redirect("/");
}
