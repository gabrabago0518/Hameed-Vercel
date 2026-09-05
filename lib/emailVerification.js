import crypto from "node:crypto";
import { prisma } from "./prisma.js";
import { sendVerificationEmail } from "./mailer.js";
import { resolveBaseUrl } from "./requestUrl.js";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Creates a fresh token for this user and emails it to them. Used both right
// after signup and by the "resend verification email" action below.
export async function issueVerificationEmail(user) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.emailVerificationToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const baseUrl = await resolveBaseUrl();
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

  await sendVerificationEmail({ to: user.email, name: user.name, verifyUrl });
}

// Result shapes:
//   { status: "verified" }
//   { status: "already_verified" }
//   { status: "expired", userId }
//   { status: "invalid" }
// "invalid" deliberately carries nothing else — the token wasn't found (or
// was tampered with), so there's nothing safe to reveal about whether some
// account was involved.
export async function consumeVerificationToken(token) {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record || record.usedAt) {
    return { status: "invalid" };
  }

  if (record.user.isVerified) {
    return { status: "already_verified" };
  }

  if (record.expiresAt < new Date()) {
    return { status: "expired", userId: record.userId };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { isVerified: true } }),
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { status: "verified" };
}

// Rate limit: at most one resend per minute per account. Checked against the
// most recently issued token's createdAt rather than a separate table —
// there's already exactly the row we need to check.
export async function resendVerificationEmail(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.isVerified) {
    return { status: "noop" };
  }

  const lastToken = await prisma.emailVerificationToken.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (lastToken && Date.now() - lastToken.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    return { status: "rate_limited" };
  }

  await issueVerificationEmail(user);
  return { status: "sent" };
}
