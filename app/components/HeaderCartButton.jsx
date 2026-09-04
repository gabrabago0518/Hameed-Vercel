"use client";

import { ShoppingCart } from "lucide-react";
import { useCartUI } from "./CartUIContext.jsx";

export default function HeaderCartButton({ count }) {
  const { setOpen } = useCartUI();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex items-center gap-2 text-lg font-medium text-white/90 hover:text-white"
    >
      <ShoppingCart size={24} />
      Cart{count > 0 ? ` (${count})` : ""}
    </button>
  );
}
