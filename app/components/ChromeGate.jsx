"use client";

import { usePathname } from "next/navigation";

// Hides the customer-facing header/cart panel on the internal /admin and
// /staff sections — those have their own minimal chrome and a red delivery-app
// header + cart panel over a kitchen tablet screen doesn't belong there. The
// server components inside `children` still render (Header/CartPanel run
// their own cheap queries either way), this just decides whether to show
// the result — hiding here is simpler than duplicating the root layout.
//
// Also hides it on an order's /receipt page — that page is meant to be
// printed or saved as a PDF, and a red nav bar/cart button has no business
// showing up in a printed receipt (print CSS alone can't remove it, since
// it's a sibling of the receipt page, not inside it).
export default function ChromeGate({ children }) {
  const pathname = usePathname();
  if (
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/staff") ||
    /^\/orders\/[^/]+\/receipt$/.test(pathname ?? "")
  ) {
    return null;
  }
  return children;
}
