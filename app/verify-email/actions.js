"use server";

import { resendVerificationEmail } from "../../lib/emailVerification.js";

// Only reachable from the "expired" branch of /verify-email, where we
// already know the userId from the (expired but genuine) token that was
// just looked up — this isn't a public "resend to any account" endpoint.
export async function resendForExpiredTokenAction(formData) {
  const userId = formData.get("userId")?.toString();
  if (!userId) {
    return { error: "Something went wrong. Please try signing up again." };
  }

  const result = await resendVerificationEmail(userId);
  if (result.status === "rate_limited") {
    return { error: "Please wait a minute before requesting another link." };
  }

  return { message: "A new verification link is on its way to your email." };
}
