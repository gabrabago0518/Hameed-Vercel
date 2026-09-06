"use client";

import { ShoppingCart } from "lucide-react";
import { useCartUI } from "./CartUIContext.jsx";

export default function HeaderCartButton({ count }) {
  const { open, setOpen } = useCartUI();

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-lg text-white/90 hover:text-white"
    >
      <ShoppingCart size={24} />
      Cart{count > 0 ? ` (${count})` : ""}
    </button>
  );
}
