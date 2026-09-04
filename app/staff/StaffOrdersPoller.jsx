"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 5000;

// Same pattern as OrderPaymentStatusPoller (app/components) — no websockets,
// just a cheap periodic fetch that triggers a server-component refresh when
// something actually changed. Keeps /staff current without a manual reload
// when a new paid order comes in or another staff member updates a status.
export default function StaffOrdersPoller({ signature }) {
  const router = useRouter();
  const lastSignature = useRef(signature);

  useEffect(() => {
    lastSignature.current = signature;
  }, [signature]);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const response = await fetch("/api/staff/orders/poll");
        if (!response.ok) return;
        const data = await response.json();
        if (data.signature && data.signature !== lastSignature.current) {
          router.refresh();
        }
      } catch {
        // Network hiccup — next tick will just try again.
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [router]);

  return null;
}
