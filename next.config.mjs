// The ngrok tunnel used for local PayMongo webhook testing. Free ngrok gives
// a new random hostname every time the tunnel restarts — when that happens,
// update this value (and the webhook URL registered in the PayMongo
// dashboard) or Server Actions and hot-reload will silently break again for
// anyone browsing through the tunnel.
const NGROK_HOST = "freebee-shrouded-overnight.ngrok-free.dev";

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
};

export default nextConfig;
