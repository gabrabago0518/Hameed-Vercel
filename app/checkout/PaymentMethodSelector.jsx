"use client";

import { useState } from "react";

const METHODS = [
  {
    value: "QR_CODE",
    title: "Pay via QR code",
    description: "Scan a QR code from any bank or e-wallet app.",
  },
  {
    value: "GCASH",
    title: "Pay via GCash",
    description: "Pay using your GCash app.",
  },
  {
    value: "CASH_ON_DELIVERY",
    title: "Pay with Cash",
    description:
      "No online payment needed — pay when you receive your order. We'll call to confirm first.",
  },
];

// A radio-button *behavior* (pick exactly one, then Confirm) without an
// actual visible radio circle — selection is shown purely by highlighting
// the chosen card, per request. The "Exchange for" field only appears once
// Cash is the selected method, and there's one shared Confirm button at the
// bottom instead of each method having its own submit.
export default function PaymentMethodSelector({ total, action }) {
  const [method, setMethod] = useState("");

  return (
    <form action={action} className="mt-4 flex flex-col gap-4">
      <input type="hidden" name="paymentMethod" value={method} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {METHODS.map((option) => {
          const selected = method === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setMethod(option.value)}
              aria-pressed={selected}
              className={`min-h-11 w-full rounded-xl border p-4 text-left transition-colors ${
                selected
                  ? "border-red-500 bg-red-50"
                  : "border-zinc-200 hover:border-red-300"
              }`}
            >
              <p className="font-semibold text-zinc-900">{option.title}</p>
              <p className="mt-1 text-sm text-zinc-600">{option.description}</p>
            </button>
          );
        })}
      </div>

      {method === "CASH_ON_DELIVERY" && (
        <div className="rounded-xl border border-zinc-200 p-4">
          <label htmlFor="exchangeFor" className="text-sm font-medium text-zinc-900">
            Exchange for:
          </label>
          <input
            id="exchangeFor"
            name="exchangeFor"
            type="number"
            inputMode="decimal"
            step="0.01"
            min={total}
            required
            placeholder={`e.g. ${(Math.ceil(total / 100) * 100).toFixed(2)}`}
            className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-zinc-500">
            How much cash will you hand over? So we can prepare your exact change.
          </p>
        </div>
      )}

      {method && (
        <button
          type="submit"
          className="min-h-11 self-start rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          Confirm
        </button>
      )}
    </form>
  );
}
