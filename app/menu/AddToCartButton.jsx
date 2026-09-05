"use client";

import { useTransition } from "react";
import { addToCartAction } from "../cart/actions.js";
import { useToast } from "../components/ToastContext.jsx";
import { useCartUI } from "../components/CartUIContext.jsx";

export default function AddToCartButton({ menuItemId, itemName }) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const { setOpen } = useCartUI();

  function handleClick() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("menuItemId", menuItemId);
      // If addToCartAction redirects instead (no session, incomplete
      // profile), it throws Next's own redirect signal here and the lines
      // below never run — so the cart panel only opens when an item was
      // actually added.
      await addToCartAction(formData);
      showToast(`Added ${itemName} to cart`);
      // By request: the cart panel opens automatically on every Add click,
      // not just the first — it stays open until the customer explicitly
      // closes it (the header cart button, its own X, or checking out),
      // same as clicking the header cart button directly would do.
      setOpen(true);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
    >
      {isPending ? "Adding..." : "Add"}
    </button>
  );
}
