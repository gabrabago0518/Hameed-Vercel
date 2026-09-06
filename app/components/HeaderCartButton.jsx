"use client";

import { ShoppingCart } from "lucide-react";
import { useCartUI } from "./CartUIContext.jsx";

export default function HeaderCartButton({ count }) {
  const { open, setOpen } = useCartUI();

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-white/90 hover:text-white sm:text-lg"
    >
      {/* Icon-only on mobile, by request — "Cart (n)" as text took up too
          much room next to Home/Menu/Account. The count moves onto a small
          badge on the icon instead of disappearing, so it's still visible
          without the word "Cart" spelled out. */}
      <span className="relative">
        <ShoppingCart size={20} className="sm:h-6 sm:w-6" />
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold leading-none text-red-600 sm:hidden">
            {count}
          </span>
        )}
      </span>
      <span className="hidden sm:inline">
        Cart{count > 0 ? ` (${count})` : ""}
      </span>
    </button>
  );
}
