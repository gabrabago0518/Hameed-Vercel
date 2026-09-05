"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { removeFromCartAction, updateCartQuantityAction } from "../cart/actions.js";
import { useCartUI } from "./CartUIContext.jsx";

// Formerly FloatingCart — the bottom-right floating trigger button is gone
// now that the header's cart button is the only way to open this (by
// request). Also no longer a modal: there's deliberately no full-page
// backdrop and no close-on-outside-click, so a customer can keep this panel
// open while clicking around the menu to add more items, and it only closes
// when they click the header cart button again (or the X here, or navigate
// to the full /checkout page).
export default function CartPanel({ items, total }) {
  const { open, setOpen } = useCartUI();

  if (!open) return null;

  return (
    // top-20 matches the header's own height (py-4 padding + its h-12 logo
    // = 5rem/80px) so this panel starts right below it instead of covering
    // it - update this if the header's height ever changes again.
    <div className="fixed top-20 right-0 bottom-0 z-40 flex w-full max-w-sm flex-col bg-white p-6 shadow-xl">
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-zinc-900">
          Your cart
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close cart"
          className="text-zinc-400 hover:text-zinc-700"
        >
          <X size={20} />
        </button>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-sm text-zinc-600">Your cart is empty.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <div key={item.lineId} className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{item.name}</p>
                  {item.variant && (
                    <p className="text-xs text-zinc-500">{item.variant.optionName}</p>
                  )}
                  {item.addons.map((addon) => (
                    <p key={addon.id} className="text-xs text-zinc-500">
                      + {addon.name}
                    </p>
                  ))}
                  <p className="text-xs text-zinc-500">₱{item.unitPrice.toFixed(2)} each</p>
                </div>

                <div className="flex items-center gap-2">
                  <form action={updateCartQuantityAction}>
                    <input type="hidden" name="lineId" value={item.lineId} />
                    <input type="hidden" name="quantity" value={item.quantity - 1} />
                    <button
                      type="submit"
                      className="h-6 w-6 rounded-full border border-zinc-300 text-xs text-zinc-600 hover:bg-zinc-50"
                    >
                      −
                    </button>
                  </form>

                  <span className="w-4 text-center text-sm font-medium text-zinc-900">
                    {item.quantity}
                  </span>

                  <form action={updateCartQuantityAction}>
                    <input type="hidden" name="lineId" value={item.lineId} />
                    <input type="hidden" name="quantity" value={item.quantity + 1} />
                    <button
                      type="submit"
                      className="h-6 w-6 rounded-full border border-zinc-300 text-xs text-zinc-600 hover:bg-zinc-50"
                    >
                      +
                    </button>
                  </form>

                  <span className="ml-1 w-14 text-right text-sm font-semibold text-zinc-900">
                    ₱{(item.unitPrice * item.quantity).toFixed(2)}
                  </span>

                  <form action={removeFromCartAction}>
                    <input type="hidden" name="lineId" value={item.lineId} />
                    <button
                      type="submit"
                      className="text-xs text-zinc-400 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-6 border-t border-zinc-200 pt-4">
          <div className="flex items-center justify-between text-sm font-semibold text-zinc-900">
            <span>Total</span>
            <span className="text-red-600">₱{total.toFixed(2)}</span>
          </div>
          <Link
            href="/checkout"
            onClick={() => setOpen(false)}
            className="mt-4 block rounded-full bg-red-600 px-6 py-2.5 text-center text-sm font-semibold text-white hover:bg-red-700"
          >
            Checkout
          </Link>
        </div>
      )}
    </div>
  );
}
