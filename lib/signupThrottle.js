import { prisma } from "./prisma.js";

const MAX_SIGNUPS_PER_WINDOW = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Signup has no existing account row to attach a counter to (unlike login),
// so this counts raw attempts by client IP over a sliding window instead.
// Records the attempt as part of the same check — every call to this either
// counts toward the limit or reports being over it, so a caller can't dodge
// the count by checking without recording.
export async function checkSignupRateLimit(ip) {
  // Can't rate-limit an identity we don't have — fails open rather than
  // blocking every real signup behind one shared "unknown" bucket.
  if (!ip) {
    return { limited: false };
  }

  const since = new Date(Date.now() - WINDOW_MS);
  const recentCount = await prisma.signupAttempt.count({
    where: { ip, createdAt: { gte: since } },
  });

  if (recentCount >= MAX_SIGNUPS_PER_WINDOW) {
    return { limited: true };
  }

  await prisma.signupAttempt.create({ data: { ip } });
  return { limited: false };
}
