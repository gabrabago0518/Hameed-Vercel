"use server";

import { redirect } from "next/navigation";
import { requestPasswordReset } from "../../lib/passwordReset.js";

export async function requestPasswordResetAction(prevState, formData) {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  if (!email) {
    return { error: "Please enter your email address." };
  }

  const result = await requestPasswordReset(email);
  if (result.status === "rate_limited") {
    return { error: "Please wait a minute before requesting another link." };
  }

  redirect(`/forgot-password/sent?email=${encodeURIComponent(email)}`);
}
