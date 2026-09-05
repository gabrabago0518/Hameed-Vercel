"use client";

import { createContext, useContext, useState } from "react";
import { usePathname } from "next/navigation";

const CartUIContext = createContext(null);

// Shared open/closed state for the header's cart button and the cart panel
// it controls, since they're separate components. Defaults to open, by
// request — the cart panel shows on the right from the moment a page loads,
// and clicking the header cart button hides it (clicking it again shows it
// back).
//
// This context lives in the root layout, which Next's App Router does not
// remount on client-side navigation — so closing the cart on, say, /menu and
// then clicking through to the homepage kept it closed there too, instead of
// showing it by default. The check below re-opens it specifically on
// arrival at "/", matching the "default open on the homepage" request,
// without touching how it behaves on other pages (still stays however the
// customer last left it there). This adjusts state during render (React's
// recommended pattern for "reset state when a prop changes") rather than in
// an effect, so it doesn't cost an extra render pass.
export function CartUIProvider({ children }) {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (pathname === "/" && !open) {
      setOpen(true);
    }
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
