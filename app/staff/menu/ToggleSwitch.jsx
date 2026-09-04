"use client";

import { useState, useTransition } from "react";
import { toggleMenuItemAvailabilityAction } from "./actions.js";

// A real switch, not a checkbox — flips instantly on click (optimistic UI)
// and calls the server action directly (useTransition, same pattern as
// app/menu/AddToCartButton.jsx) rather than a <form>, since there's no
// separate "save" step to submit. Rolls the optimistic flip back if the
// server call somehow fails.
export default function ToggleSwitch({ menuItemId, initialIsAvailable }) {
  const [isAvailable, setIsAvailable] = useState(initialIsAvailable);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !isAvailable;
    setIsAvailable(next);
    startTransition(async () => {
      try {
        await toggleMenuItemAvailabilityAction(menuItemId, next);
      } catch {
        setIsAvailable(!next);
      }
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isAvailable}
      onClick={handleToggle}
      disabled={isPending}
      className={`flex min-h-11 min-w-24 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
        isAvailable
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-zinc-300 bg-zinc-100 text-zinc-600"
      }`}
    >
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
          isAvailable ? "bg-green-500" : "bg-zinc-400"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
            isAvailable ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>
      {isAvailable ? "Available" : "Out of Stock"}
    </button>
  );
}
