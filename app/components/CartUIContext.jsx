"use client";

import { createContext, useContext, useState } from "react";
import { usePathname } from "next/navigation";

const CartUIContext = createContext(null);

// Shared open/closed state for the header's cart button and the cart panel
// it controls, since they're separate components. Closed by default
// everywhere except /menu, which defaults to open, by request — so logging
// in (or landing on any other page) doesn't show the cart panel, but
// arriving at the menu does.
//
// This context lives in the root layout, which Next's App Router does not
// remount on client-side navigation, so the open/closed state would
// otherwise just carry over unchanged from whatever page the customer was
// on before. The check below re-applies the per-page default on every
// navigation instead (open on /menu, closed everywhere else) — the
// customer's own toggle (the header cart button, or the panel's own X)
// still works normally within a page, it just resets to the default again
// on the next navigation. This adjusts state during render (React's
// recommended pattern for "reset state when a prop changes") rather than in
// an effect, so it doesn't cost an extra render pass.
export function CartUIProvider({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => pathname === "/menu");
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(pathname === "/menu");
  }

  return (
    <CartUIContext.Provider value={{ open, setOpen }}>
      {children}
    </CartUIContext.Provider>
  );
}

export function useCartUI() {
  const context = useContext(CartUIContext);
  if (!context) {
    throw new Error("useCartUI must be used within a CartUIProvider");
  }
  return context;
}
