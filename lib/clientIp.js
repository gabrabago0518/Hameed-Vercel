import { headers } from "next/headers";

// x-forwarded-for is a comma-separated list that each hop APPENDS to as a
// request passes through proxies: "client, proxy1, proxy2" — the entry
// closest to our own infrastructure (the last one) is the one our trusted
// edge (Vercel) actually observed the connection coming from. The first
// entry is whatever the original client claimed, and a client can put
// anything it wants there (e.g. "x-forwarded-for: 1.2.3.4" with a fake
// address, hoping to spoof rate-limiting or IP-based checks) — trusting it
// would let an attacker pick a fresh "identity" on every request for free.
// Taking the last entry instead is the standard-practice-safe choice
// regardless of exactly how many hops sit in front of the app.
export async function getClientIp() {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    const entries = forwardedFor.split(",").map((entry) => entry.trim()).filter(Boolean);
    if (entries.length > 0) return entries[entries.length - 1];
  }
  return headersList.get("x-real-ip");
}
