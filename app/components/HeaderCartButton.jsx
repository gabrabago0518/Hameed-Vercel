"use client";

import { ShoppingCart } from "lucide-react";
import { useCartUI } from "./CartUIContext.jsx";

export default function HeaderCartButton({ count }) {
  const { open, setOpen } = useCartUI();

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="flex items-center gap-1 font-[family-name:var(--font-heading)] text-sm text-white/90 hover:text-white sm:gap-2 sm:text-lg"
    >
      <ShoppingCart size={20} className="sm:h-6 sm:w-6" />
      Cart{count > 0 ? ` (${count})` : ""}
    </button>
  );
}
