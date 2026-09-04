import { NextResponse } from "next/server";
import { prisma } from "./lib/prisma.js";
import { getUserIdFromSessionCookie, SESSION_COOKIE_NAME } from "./lib/session.js";

// Protects every /staff/* route (see the matcher below) — this is what the
// project calls "middleware," Next.js's renamed-to-"Proxy" file convention
// as of this pinned Next.js version (16). Proxy defaults to the Node.js
// runtime here (not Edge), which is what makes this actually able to do a
// real Prisma query for the user's role — an Edge-runtime version of this
// file couldn't (no node:crypto, no Postgres/TCP access), which is also why
// getUserIdFromSessionCookie takes a raw cookie *value* rather than this
// file importing the next/headers-based getCurrentUser() directly — Proxy
// runs before the request has an App Router rendering context, so it reads
// the cookie off the NextRequest itself (request.cookies), not next/headers.
//
// A logged-out or expired-session visitor is sent to /login; a logged-in
// CUSTOMER is sent to "/" — neither ever sees a /staff page render.
export async function proxy(request) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const userId = getUserIdFromSessionCookie(cookieValue);

  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });

  if (!user || (user.role !== "STAFF" && user.role !== "ADMIN")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/staff/:path*"],
};
