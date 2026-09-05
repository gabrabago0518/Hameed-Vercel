import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma.js";

const COOKIE_NAME = "session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// Exported so proxy.js (the project-root Proxy/Middleware file — see
// https://nextjs.org/docs/app/api-reference/file-conventions/proxy) can read
// the cookie under the exact same name without hardcoding it a second time.
export const SESSION_COOKIE_NAME = COOKIE_NAME;

// Turns "userId.expiryTimestamp" into a signature nobody can fake without
// knowing SESSION_SECRET. This is what stops someone from editing their own
// cookie to pretend to be a different user.
function sign(payload) {
  return crypto
    .createHmac("sha256", process.env.SESSION_SECRET)
    .update(payload)
    .digest("hex");
}

export async function createSession(userId) {
  const expires = Date.now() + SESSION_DURATION_MS;
  const payload = `${userId}.${expires}`;
  const value = `${payload}.${sign(payload)}`;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Pure — no cookie-store/DB access, just "is this a genuine, unexpired
// cookie value, and if so whose." Split out of getCurrentUser() so proxy.js
// can verify a cookie it read straight off the NextRequest (via
// request.cookies, not the next/headers cookies() API this file otherwise
// uses) without duplicating the signature logic a second time.
export function getUserIdFromSessionCookie(value) {
  if (!value) return null;

  const [userId, expires, signature] = value.split(".");
  if (!userId || !expires || !signature) return null;

  const expectedSignature = sign(`${userId}.${expires}`);
  if (signature !== expectedSignature) return null;
  if (Date.now() > Number(expires)) return null;

  return userId;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  const userId = getUserIdFromSessionCookie(value);
  if (!userId) return null;

  return prisma.user.findUnique({ where: { id: userId } });
}
