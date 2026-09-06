"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import GCashLogo from "../../../components/GCashLogo.jsx";

const POLL_INTERVAL_MS = 4000;
const IS_COD = (method) => method === "CASH_ON_DELIVERY";

// While something is still processing, a fixed blurred backdrop sits behind
// the status card so the "in progress" state reads as clearly different from
// a resolved one at a glance — not just the pulsing icon. Fixed positioning
// covers the whole viewport (header included) regardless of where this ends
// up in the page.
function WithLoadingBackdrop({ children }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-white/70 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative z-50 flex flex-col items-center">{children}</div>
    </>
  );
}

// Right after checkout this polls the same /api/orders/[id]/poll route the
// full order tracker (/orders/[id]) uses, so the customer sees the outcome
// land here without needing to navigate away first:
// - QR_CODE/GCASH: "Waiting for payment" (QR image, or a Pay with GCash
//   button) while Payment.status is PENDING, swapping to "Payment Received"
//   once it's PAID (or "Payment failed" on FAILED/EXPIRED).
// - CASH_ON_DELIVERY: "Waiting for confirmation" while Order.status is
//   PENDING_CONFIRMATION, swapping to "Order Confirmed" once an admin
//   verifies it over the phone.
export default function ConfirmationStatus({
  orderId,
  initialOrderStatus,
  paymentMethod,
  initialPaymentStatus,
  reference,
  total,
  exchangeFor,
  checkoutUrl,
  qrCodeData,
}) {
  const [orderStatus, setOrderStatus] = useState(initialOrderStatus);
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus);
  const cod = IS_COD(paymentMethod);

  const stillWaiting = cod
    ? orderStatus === "PENDING_CONFIRMATION"
    : paymentStatus === "PENDING";

  useEffect(() => {
    if (!stillWaiting) return;
    let cancelled = false;

    async function poll() {
      try {
        const response = await fetch(`/api/orders/${orderId}/poll`);
        const data = await response.json();
        if (cancelled) return;
        if (data.orderStatus) setOrderStatus(data.orderStatus);
        if (data.paymentStatus) setPaymentStatus(data.paymentStatus);
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
  }, [orderId, stillWaiting]);

  const trackOrderButton = (
    <Link
      href={`/orders/${orderId}`}
      className="mt-8 flex min-h-11 w-full items-center justify-center rounded-full bg-red-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-red-700"
    >
      Track My Order
    </Link>
  );

  // --- Cash on Delivery ---------------------------------------------------
  if (cod) {
    if (orderStatus === "PENDING_CONFIRMATION") {
      return (
        <WithLoadingBackdrop>
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
        </WithLoadingBackdrop>
      );
    }

    if (orderStatus === "CANCELLED") {
      return (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl text-red-600">
            ✕
          </div>
          <h1 className="mt-6 font-[family-name:var(--font-heading)] text-2xl font-bold text-zinc-900">
            Order cancelled
          </h1>
        </>
      );
    }

    return (
      <>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
          ✓
        </div>
        <h1 className="mt-6 font-[family-name:var(--font-heading)] text-2xl font-bold text-zinc-900">
          Order Confirmed
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Reference: <span className="font-semibold text-zinc-900">{reference}</span>
        </p>
        <p className="mt-1 text-2xl font-bold text-red-600">₱{total.toFixed(2)}</p>
        {trackOrderButton}
      </>
    );
  }

  // --- QR_CODE / GCASH -----------------------------------------------------
  if (paymentStatus === "PAID") {
    return (
      <>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
          ✓
        </div>
        <h1 className="mt-6 font-[family-name:var(--font-heading)] text-2xl font-bold text-zinc-900">
          Payment Received
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Reference: <span className="font-semibold text-zinc-900">{reference}</span>
        </p>
        <p className="mt-1 text-2xl font-bold text-red-600">₱{total.toFixed(2)}</p>
        {trackOrderButton}
      </>
    );
  }

  if (paymentStatus === "FAILED" || paymentStatus === "EXPIRED") {
    return (
      <>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl text-red-600">
          ✕
        </div>
        <h1 className="mt-6 font-[family-name:var(--font-heading)] text-2xl font-bold text-zinc-900">
          Payment failed
        </h1>
        <p className="mt-2 text-sm text-zinc-600">This order was cancelled.</p>
        <Link
          href="/menu"
          className="mt-8 flex min-h-11 w-full items-center justify-center rounded-full bg-red-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-red-700"
        >
          Try another payment
        </Link>
      </>
    );
  }

  // PENDING from here — payment hasn't resolved yet.
  if (!checkoutUrl && !qrCodeData) {
    return (
      <>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl text-amber-600">
          !
        </div>
        <h1 className="mt-6 font-[family-name:var(--font-heading)] text-2xl font-bold text-zinc-900">
          Payment setup failed
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Something went wrong starting your payment. Please contact us with your reference
          number below and we&apos;ll sort it out.
        </p>
        <p className="mt-2 text-xs text-zinc-500">Reference: {reference}</p>
      </>
    );
  }

  return (
    <WithLoadingBackdrop>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl text-amber-600">
        <span className="animate-pulse">⏳</span>
      </div>
      <h1 className="mt-6 font-[family-name:var(--font-heading)] text-2xl font-bold text-zinc-900">
        Waiting for payment
      </h1>

      {/* Checked by whether PayMongo actually gave us a redirect link, not by
          our own paymentMethod value — "Pay via QR code" currently attaches
          a GCash payment method under the hood too (see lib/paymongo.js), so
          it gets this same button until real QRPh is wired up. */}
      {checkoutUrl && (
        <>
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-red-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-red-700"
          >
            <GCashLogo className="h-5 w-5 shrink-0" />
            Pay with GCash
          </a>
          <p className="mt-3 text-xs text-zinc-500">
            Opens in a new tab. If anything goes wrong there, just close it and come back to this
            tab — it&apos;ll show the right result either way.
          </p>
        </>
      )}

      {!checkoutUrl && qrCodeData && (
        <div className="mx-auto mt-6 h-48 w-48 overflow-hidden rounded-xl border border-zinc-200">
          <Image
            src={qrCodeData}
            alt="Scan to pay"
            width={192}
            height={192}
            className="h-full w-full object-contain"
            unoptimized
          />
        </div>
      )}

      <p className="mt-4 text-sm text-zinc-600">
        Pay ₱{total.toFixed(2)} — this page will update itself once we receive your payment.
      </p>
      <p className="mt-1 text-xs text-zinc-400">Reference: {reference}</p>
    </WithLoadingBackdrop>
  );
}
