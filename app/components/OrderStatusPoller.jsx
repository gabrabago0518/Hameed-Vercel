"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 4000;
const TERMINAL_ORDER_STATUSES = ["DELIVERED", "CANCELLED"];

// Renders nothing. Formerly OrderPaymentStatusPoller — broadened to also
// watch fulfillment status (Preparing/Out for delivery/Delivered, set by
// staff/admin), not just payment status (set by the PayMongo webhook/poll or
// a COD verify). Either can change independently of the other, and the order
// tracker on this page needs to reflect both without a manual refresh.
// Checks once immediately on mount (catches a fast PayMongo redirect, or the
// customer reopening the page after staff already updated something while it
// was closed), then keeps polling every 4s until the order reaches a
// terminal status. Runs for every payment method, including Cash on Delivery
// — the underlying poll route already no-ops its PayMongo-specific check
// when there's no payment intent to look up.
export default function OrderStatusPoller({ orderId, paymentStatus, orderStatus }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const response = await fetch(`/api/orders/${orderId}/poll`);
        const data = await response.json();
        if (
          !cancelled &&
          ((data.paymentStatus && data.paymentStatus !== paymentStatus) ||
            (data.orderStatus && data.orderStatus !== orderStatus))
        ) {
          router.refresh();
        }
      } catch {
        // Network hiccup — the interval (if running) will just try again.
      }
    }

    poll();

    if (TERMINAL_ORDER_STATUSES.includes(orderStatus)) return;
    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [orderId, paymentStatus, orderStatus, router]);

  return null;
}
