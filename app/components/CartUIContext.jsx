"use client";

import { createContext, useContext, useState } from "react";

const CartUIContext = createContext(null);

// Shared open/closed state for the header's cart button and the cart panel
// it controls, since they're separate components. Defaults to open, by
// request — the cart panel shows on the right from the moment a page loads,
// and clicking the header cart button hides it (clicking it again shows it
// back).
export function CartUIProvider({ children }) {
  const [open, setOpen] = useState(true);
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
