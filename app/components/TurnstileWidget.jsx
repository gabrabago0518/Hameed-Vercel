"use client";

import Script from "next/script";

// Renders Cloudflare's Turnstile challenge widget inside whatever <form>
// this is placed in — Cloudflare's script (loaded once, globally, via
// next/script) finds any element with class="cf-turnstile" on the page and
// auto-injects a hidden `cf-turnstile-response` <input> into its enclosing
// form once the visitor completes the challenge (usually invisibly, with no
// interaction needed). The server action reads that field itself — see
// lib/turnstile.js's verifyTurnstileToken.
//
// Renders nothing at all if NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't set yet —
// the widget can't exist without a real site key, and this project's
// verifyTurnstileToken() already fails open (skips the check) when its
// matching secret key is missing, so an absent widget is consistent with an
// absent check rather than silently breaking the form.
export default function TurnstileWidget() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" async defer />
      <div className="cf-turnstile" data-sitekey={siteKey} data-theme="light" />
    </>
  );
}
