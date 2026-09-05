"use client";

import { usePathname } from "next/navigation";

// Hides the customer-facing header/cart panel on the internal /admin and
// /staff sections — those have their own minimal chrome and a red delivery-app
// header + cart panel over a kitchen tablet screen doesn't belong there. The
// server components inside `children` still render (Header/CartPanel run
// their own cheap queries either way), this just decides whether to show
// the result — hiding here is simpler than duplicating the root layout.
export default function ChromeGate({ children }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/staff")) {
    return null;
  }
  return children;
}
