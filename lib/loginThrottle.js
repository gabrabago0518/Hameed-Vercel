import { prisma } from "./prisma.js";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// Pure check against an already-fetched user — no DB call of its own, so
// callers that already have the user row (loginAction does) don't pay for a
// second query just to check the lock.
export function getActiveLock(user) {
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    return user.lockedUntil;
  }
  return null;
}

// Called after a confirmed-wrong password. Crossing the threshold sets a
// lockout AND resets the counter back to 0 in the same update, so the
// window right after a lock expires starts fresh at 0/5 rather than
// re-locking on the very next wrong attempt.
export async function recordFailedLogin(userId) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: { increment: 1 } },
  });

  if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + LOCKOUT_MS);
    await prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil },
    });
    return { lockedUntil };
  }

  return { lockedUntil: null };
}

export async function resetLoginAttempts(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
}

export function formatLockMessage(lockedUntil) {
  const minutes = Math.max(1, Math.ceil((lockedUntil.getTime() - Date.now()) / 60000));
  return `Too many failed attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
