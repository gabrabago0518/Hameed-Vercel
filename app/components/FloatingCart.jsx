"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, X } from "lucide-react";
import { removeFromCartAction } from "../cart/actions.js";

export default function FloatingCart({ items, total }) {
  const [open, setOpen] = useState(false);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open cart"
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-red-700"
      >
        <ShoppingCart size={24} />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-red-600 shadow">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-black/30"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex h-full w-full max-w-sm flex-col bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
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
                    <div key={item.id} className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">{item.name}</p>
                        <p className="text-xs text-zinc-500">
                          {item.quantity} × ₱{item.price.toFixed(2)}
                        </p>
                      </div>
                      <form action={removeFromCartAction}>
                        <input type="hidden" name="menuItemId" value={item.id} />
                        <button
                          type="submit"
                          className="text-xs text-zinc-400 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </form>
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
                  href="/cart"
                  onClick={() => setOpen(false)}
                  className="mt-4 block rounded-full bg-red-600 px-6 py-2.5 text-center text-sm font-semibold text-white hover:bg-red-700"
                >
                  View full cart
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
