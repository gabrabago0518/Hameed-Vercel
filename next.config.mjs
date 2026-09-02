/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Next.js rejects a Server Action request when it looks like it came
      // through a proxy (mismatched Host/X-Forwarded-Host) but has no Origin
      // header — a CSRF safeguard. Locally that false-positives whenever the
      // dev server is reached by something other than plain localhost (e.g.
      // the LAN address Next itself prints, or a proxy/tunnel in front of
      // it), so the addresses actually used to reach this app in dev need to
      // be listed here explicitly.
      allowedOrigins: ["localhost:3000", "127.0.0.1:3000", "192.168.1.39:3000"],
    },
  },
};

export default nextConfig;
