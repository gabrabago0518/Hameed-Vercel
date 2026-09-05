"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const POLL_INTERVAL_MS = 4000;

// Cash on Delivery orders land here at PENDING_CONFIRMATION — no payment has
// actually been taken yet, an admin still needs to call the customer and
// verify (see verifyCodPayment in lib/orderPayment.js). This polls the same
// /api/orders/[id]/poll route the order tracker already uses, and swaps from
// "waiting" to "placed" the moment that verification happens, without a full
// page reload. Every other payment method already reaches this page past
// PENDING_CONFIRMATION, so it renders the "placed" state immediately and
// never starts polling at all.
export default function ConfirmationStatus({ orderId, initialStatus, reference, total, exchangeFor }) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (status !== "PENDING_CONFIRMATION") return;
    let cancelled = false;

    async function poll() {
      try {
        const response = await fetch(`/api/orders/${orderId}/poll`);
        const data = await response.json();
        if (!cancelled && data.orderStatus && data.orderStatus !== "PENDING_CONFIRMATION") {
          setStatus(data.orderStatus);
        }
      } catch {
        // Network hiccup — the interval just tries again.
      }
    }

    poll();
    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [orderId, status]);

  if (status === "PENDING_CONFIRMATION") {
    return (
      <>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl text-amber-600">
          <span className="animate-pulse">⏳</span>
        </div>
        <h1 className="mt-6 font-[family-name:var(--font-heading)] text-2xl font-bold text-zinc-900">
          Waiting for confirmation
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          We&apos;re calling you to confirm your cash order. This page will update automatically
          once it&apos;s confirmed.
        </p>
        {exchangeFor != null && (
          <p className="mt-3 text-sm text-zinc-600">
            Exchange for: <span className="font-semibold text-zinc-900">₱{exchangeFor.toFixed(2)}</span>
          </p>
        )}
        <p className="mt-1 text-sm text-zinc-600">
          Reference: <span className="font-semibold text-zinc-900">{reference}</span>
        </p>
      </>
    );
  }

  return (
    <>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
        ✓
      </div>
      <h1 className="mt-6 font-[family-name:var(--font-heading)] text-2xl font-bold text-zinc-900">
        Your order has been placed!
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Reference: <span className="font-semibold text-zinc-900">{reference}</span>
      </p>
      <p className="mt-1 text-2xl font-bold text-red-600">₱{total.toFixed(2)}</p>

      <Link
        href={`/orders/${orderId}`}
        className="mt-8 flex min-h-11 w-full items-center justify-center rounded-full bg-red-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-red-700"
      >
        Track My Order
      </Link>
    </>
  );
}
