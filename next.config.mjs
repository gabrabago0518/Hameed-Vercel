// The ngrok tunnel used for local PayMongo webhook testing. Free ngrok gives
// a new random hostname every time the tunnel restarts — when that happens,
// update this value (and the webhook URL registered in the PayMongo
// dashboard) or Server Actions and hot-reload will silently break again for
// anyone browsing through the tunnel.
const NGROK_HOST = "freebee-shrouded-overnight.ngrok-free.dev";

// Content-Security-Policy — locks down which origins the browser will ever
// load a script/style/image/etc. from, so even if an attacker manages to
// inject markup somewhere (stored XSS, a compromised dependency, etc.) the
// browser itself refuses to run/fetch whatever they planted.
//
// Two directives below are looser than a "perfect" CSP would be, and that's
// a deliberate, documented trade-off rather than an oversight:
//   - script-src needs 'unsafe-inline': Next.js's App Router streams React
//     Server Components to the browser via inline `<script>` tags it injects
//     itself (the `self.__next_f.push(...)` calls that hydrate the page) —
//     without 'unsafe-inline' (or a correctly-wired per-request nonce) the
//     site fails to hydrate at all. A nonce-based policy is the stricter
//     option, but verifying one didn't break hydration needs a real browser
//     to click through the site in, which isn't available in this sandbox —
//     shipping an unverified nonce setup risks silently breaking every page
//     in production. 'unsafe-inline' still blocks the most common/dangerous
//     XSS class (an attacker getting the browser to load *their own*
//     externally-hosted script via a src= URL), just not an inline snippet.
//   - style-src needs 'unsafe-inline': a few components (LogoSpinner, the
//     admin sales bar chart) use inline style={{...}} props for computed
//     values (rotation, bar height) that can't be expressed as a static
//     Tailwind class.
// img-src allows any https: source (plus data: for inline SVG/base64) because
// PayMongo's QR code image is served from a PayMongo-controlled CDN URL that
// varies per payment and isn't a fixed domain we can pin here.
// challenges.cloudflare.com is allowlisted in script-src/frame-src/connect-src
// for the Turnstile CAPTCHA widget (see lib/turnstile.js) — inert until real
// Cloudflare keys are configured, but the CSP allowance is harmless either way.
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
];

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP_DIRECTIVES.join("; ") },
  // Belt-and-suspenders alongside frame-ancestors above — older browsers that
  // don't understand CSP's frame-ancestors still respect this.
  { key: "X-Frame-Options", value: "DENY" },
  // Stops the browser from guessing ("sniffing") a file's type from its
  // content and running it as something more dangerous than its declared
  // Content-Type (e.g. treating an uploaded image as executable script).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Sends the full URL as a Referer header only to our own origin; other
  // sites we link out to (Google Maps, Facebook, Instagram) get just the
  // origin, not the full path (which could contain order IDs, etc.).
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // This site never needs camera/microphone/geolocation access — explicitly
  // disabling them means a future XSS or a malicious embedded ad/script
  // can't silently request them.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets Next's dev server accept HMR/asset requests when the site is loaded
  // through a host other than localhost (e.g. the ngrok tunnel) — without
  // this, hot-reload silently stops working for that origin.
  allowedDevOrigins: [NGROK_HOST],
  experimental: {
    serverActions: {
      // Next.js rejects a Server Action request when it looks like it came
      // through a proxy (mismatched Host/X-Forwarded-Host) but has no Origin
      // header — a CSRF safeguard. Locally that false-positives whenever the
      // dev server is reached by something other than plain localhost (e.g.
      // the LAN address Next itself prints, or a proxy/tunnel in front of
      // it), so the addresses actually used to reach this app in dev need to
      // be listed here explicitly.
      allowedOrigins: [
        "localhost:3000",
        "127.0.0.1:3000",
        "192.168.1.39:3000",
        NGROK_HOST,
      ],
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
