"use server";

import { prisma } from "../../lib/prisma.js";
import { resendVerificationEmail } from "../../lib/emailVerification.js";

// Deliberately returns the same message regardless of whether the email
// belongs to an account, is already verified, or genuinely got a new link —
// only the rate-limit case is distinguished, since knowing "you're being
// rate limited" doesn't reveal anything you don't already know by having
// just typed your own email in.
const GENERIC_MESSAGE =
  "If that email needs verifying, we've sent a new link. Check your inbox.";

export async function resendByEmailAction(prevState, formData) {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  if (!email) {
    return { message: null, error: "Enter your email address." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { message: GENERIC_MESSAGE, error: null };
  }

  const result = await resendVerificationEmail(user.id);
  if (result.status === "rate_limited") {
    return {
      message: null,
      error: "Please wait a minute before requesting another link.",
    };
  }

  return { message: GENERIC_MESSAGE, error: null };
}
