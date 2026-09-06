"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma.js";
import { issueVerificationEmail } from "../../lib/emailVerification.js";

export async function signupAction(prevState, formData) {
  const firstName = formData.get("firstName")?.toString().trim();
  const lastName = formData.get("lastName")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();

  // The +63 prefix is fixed in the UI (see signup/page.jsx) — the customer
  // only types the local part. A leading 0 is stripped in case they type
  // the number the way it's normally written out loud (e.g. "09171234567"),
  // so it doesn't end up double-prefixed as "+630917...".
  const phoneLocalRaw = formData.get("phoneLocal")?.toString().trim();
  const phoneDigits = phoneLocalRaw?.replace(/\D/g, "").replace(/^0+/, "");
  const phone = phoneDigits ? `+63${phoneDigits}` : "";

  if (!firstName || !lastName || !email || !phone || !password) {
    return { error: "Please fill in all fields." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  // No separate firstName/lastName columns on User — combined into the
  // existing single `name` field rather than a schema migration, so
  // everywhere else that reads user.name (the header greeting, admin
  // accounts list, order history, etc.) keeps working unchanged.
  const name = `${firstName} ${lastName}`;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  // No address collected here anymore — every new customer adds their first,
  // PSGC-validated address during onboarding (/onboarding/address) right
  // after verifying their email, instead of via signup's old free-text
  // line1+city fields.
  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, isVerified: false },
  });

  // Deliberately no createSession() here — the account exists but can't log
  // in until the email link is clicked (see login/actions.js's isVerified
  // check).
  try {
    await issueVerificationEmail(user);
  } catch (error) {
    // The account was already created — don't lose it over an email
    // hiccup. Flag it so /check-email can offer an immediate resend instead
    // of leaving the customer stuck with no way to get a working link.
    console.error("Failed to send verification email:", error.message);
    redirect(`/check-email?email=${encodeURIComponent(user.email)}&emailFailed=1`);
  }

  redirect(`/check-email?email=${encodeURIComponent(user.email)}`);
}
