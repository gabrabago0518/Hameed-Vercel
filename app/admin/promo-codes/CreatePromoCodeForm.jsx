"use client";

import { useActionState } from "react";
import { createPromoCodeAction } from "./actions.js";

const initialState = { error: null };

export default function CreatePromoCodeForm() {
  const [state, formAction, pending] = useActionState(createPromoCodeAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-zinc-500">Code</label>
        <input
          name="code"
          required
          placeholder="WELCOME10"
          className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm uppercase"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500">Type</label>
        <select name="type" defaultValue="PERCENT" className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm">
          <option value="PERCENT">Percent off</option>
          <option value="FIXED">Fixed amount off</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500">Value</label>
        <input
          name="value"
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="10"
          className="mt-1 w-24 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500">Max uses (optional)</label>
        <input
          name="maxUses"
          type="number"
          step="1"
          min="1"
          placeholder="Unlimited"
          className="mt-1 w-28 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500">Expires (optional)</label>
        <input
          name="expiresAt"
          type="date"
          className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add code"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
