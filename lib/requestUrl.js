import { headers } from "next/headers";

// Derives the site's own base URL from the incoming request's Host header,
// so links we generate (PayMongo return_url, email verification links, ...)
// always match wherever the customer is actually browsing from — localhost,
// an ngrok tunnel, or a real domain later — with nothing to keep in sync by
// hand. APP_BASE_URL is only a last-resort fallback if headers are missing.
export async function resolveBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  if (!host) return process.env.APP_BASE_URL || "http://localhost:3000";

  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}
