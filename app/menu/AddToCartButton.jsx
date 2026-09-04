"use client";

import { useTransition } from "react";
import { addToCartAction } from "../cart/actions.js";
import { useToast } from "../components/ToastContext.jsx";

export default function AddToCartButton({ menuItemId, itemName }) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleClick() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("menuItemId", menuItemId);
      await addToCartAction(formData);
      showToast(`Added ${itemName} to cart`);
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
