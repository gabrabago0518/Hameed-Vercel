"use client";

import { useActionState } from "react";
import { applyPromoCodeAction, removePromoCodeAction } from "./actions.js";

const initialState = { error: null };

// Two small forms depending on whether a code is currently applied — kept in
// one component since they're mutually exclusive views of the same state,
// not because they share much markup.
export default function PromoCodeForm({ appliedCode, appliedCodeInvalid }) {
  const [state, formAction, pending] = useActionState(applyPromoCodeAction, initialState);

  if (appliedCode && !appliedCodeInvalid) {
    return (
      <form action={removePromoCodeAction} className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm text-emerald-700">
          Code <span className="font-semibold">{appliedCode}</span> applied.
        </p>
        <button type="submit" className="text-sm font-medium text-zinc-500 hover:underline">
          Remove
        </button>
      </form>
    );
  }

  return (
    <div className="mt-3">
      {appliedCodeInvalid && (
        <p className="mb-2 text-sm text-amber-700">
          That promo code isn&apos;t valid anymore — removed.
        </p>
      )}
      <form action={formAction} className="flex gap-2">
        <input
          name="code"
          placeholder="Promo code"
          className="min-h-11 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm uppercase focus:border-red-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 shrink-0 rounded-lg border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
        >
          {pending ? "Applying..." : "Apply"}
        </button>
      </form>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
