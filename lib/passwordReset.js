import crypto from "node:crypto";
import { prisma } from "./prisma.js";
import { sendPasswordResetEmail } from "./mailer.js";
import { resolveBaseUrl } from "./requestUrl.js";

// Shorter than email verification's 24h — a password-reset link is more
// sensitive (it grants account takeover, not just "confirm this is you"), so
// a tighter window is worth the inconvenience of occasionally needing a
// fresh one.
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute, same as email verification

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

async function issuePasswordResetEmail(user) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const baseUrl = await resolveBaseUrl();
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
}

// Looked up by email, not a userId — there's no session yet at this point
// (the whole reason someone is here is they can't log in). Mirrors
// app/check-email/actions.js's resendByEmailAction: always looks like it
// worked from the caller's point of view, whether or not the email actually
// belongs to an account, so this can never be used to test which emails are
// registered. Only a genuine rate-limit hit is distinguished, since that
// doesn't leak anything the caller doesn't already know.
export async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { status: "sent" };
  }
  return resendPasswordResetByUserId(user.id);
}

// Same rate-limit-and-send logic, entered from a known userId instead of an
// email — used both by requestPasswordReset above and by the "expired link"
// resend button on /reset-password, which already knows the userId from the
// (expired but genuine) token it just looked up.
export async function resendPasswordResetByUserId(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { status: "sent" };
  }

  const lastToken = await prisma.passwordResetToken.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (lastToken && Date.now() - lastToken.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    return { status: "rate_limited" };
  }

  await issuePasswordResetEmail(user);
  return { status: "sent" };
}

// Result shapes:
//   { status: "valid", userId }
//   { status: "expired", userId }
//   { status: "invalid" } — not found or already used; nothing safe to act on
export async function checkPasswordResetToken(token) {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.usedAt) {
    return { status: "invalid" };
  }
  if (record.expiresAt < new Date()) {
    return { status: "expired", userId: record.userId };
  }
  return { status: "valid", userId: record.userId };
}

// Re-validates the token itself (rather than trusting a valid check done
// moments earlier on the page render) before actually changing anything —
// the form submission is a separate request, and the token could have been
// used or expired in between. Caller hashes the new password before calling
// this; this function only ever deals with the hash, never a plaintext
// password.
export async function resetPassword(token, newPasswordHash) {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { status: "invalid" };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash: newPasswordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return { status: "reset" };
}
