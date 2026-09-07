// Cloudflare Turnstile — the bot/CAPTCHA check on signup and login. Chosen
// over reCAPTCHA/hCaptcha because it's free and needs no extra npm package
// (this project's existing minimal-dependency bias): the client side is one
// <script> tag + a <div>, the server side is one fetch call.
//
// TURNSTILE_SECRET_KEY and NEXT_PUBLIC_TURNSTILE_SITE_KEY aren't set yet —
// only the user can create a real Cloudflare Turnstile site (dash.cloudflare.com
// -> Turnstile) and paste the two keys it gives into .env. Until then this
// deliberately fails OPEN (skips verification) rather than locking everyone
// out of signup/login — same precedent as this project's PayMongo keys being
// left blank until real ones are available. Once TURNSTILE_SECRET_KEY is set,
// verification becomes real and enforced.
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(token, remoteIp) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { success: true, skipped: true };
  }

  if (!token) {
    return { success: false, skipped: false };
  }

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);

    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = await response.json();
    return { success: data.success === true, skipped: false };
  } catch (error) {
    // A Cloudflare/network hiccup shouldn't be indistinguishable from "this
    // is a bot" — but it also shouldn't silently let every request through,
    // so this counts as a failed check, not a skip.
    console.error("Turnstile verification request failed:", error.message);
    return { success: false, skipped: false };
  }
}

export function isTurnstileConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}
