"use client";

import { createContext, useContext, useState } from "react";

const CartUIContext = createContext(null);

// Shared open/closed state for the header's cart button and the cart panel
// it controls, since they're separate components.
export function CartUIProvider({ children }) {
  const [open, setOpen] = useState(false);
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
