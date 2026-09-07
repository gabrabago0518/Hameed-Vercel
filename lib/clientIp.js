import { headers } from "next/headers";

// Vercel (and most proxies) set x-forwarded-for as a comma-separated list —
// the client's own address is the first entry, the rest are intermediate
// proxies. Falls back to x-real-ip, then null (never fabricates an address —
// callers that can't identify a client should fail open, not rate-limit
// everyone under one fake shared IP).
export async function getClientIp() {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return headersList.get("x-real-ip");
}
