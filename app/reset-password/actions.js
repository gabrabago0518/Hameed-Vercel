"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { resetPassword, resendPasswordResetByUserId } from "../../lib/passwordReset.js";

export async function resetPasswordAction(prevState, formData) {
  const token = formData.get("token")?.toString();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();

  if (!token) {
    return { error: "Something went wrong. Please request a new reset link." };
  }
  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await resetPassword(token, passwordHash);

  if (result.status !== "reset") {
    // The token was valid when the page loaded but has since been used or
    // expired (e.g. the link was opened twice, or someone sat on the form
    // past the 1-hour window) — nothing to silently retry, just send them
    // back to request a fresh one.
    return { error: "This reset link is no longer valid. Please request a new one." };
  }

  redirect("/login?passwordReset=1");
}

// Only reachable from the "expired" branch of /reset-password, where the
// userId is already known from the (expired but genuine) token just looked
// up — same reasoning as verify-email's resendForExpiredTokenAction, not a
// public "resend to any account" endpoint.
export async function resendForExpiredResetTokenAction(formData) {
  const userId = formData.get("userId")?.toString();
  if (!userId) {
    return { error: "Something went wrong. Please start over from Forgot Password." };
  }

  const result = await resendPasswordResetByUserId(userId);
  if (result.status === "rate_limited") {
    return { error: "Please wait a minute before requesting another link." };
  }

  return { message: "A new reset link is on its way to your email." };
}
