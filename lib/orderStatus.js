// Shared order-status logic for the staff/admin backend. Kept separate from
// lib/orderPayment.js on purpose — that file governs the PENDING->CONFIRMED
// transition driven by payment events (webhook/poll), while this file governs
// the CONFIRMED->...->DELIVERED progression driven by staff clicking a button.
// Neither one touches the other's transitions.

export const STATUS_LABELS = {
  PENDING: "Pending payment",
  PENDING_CONFIRMATION: "Needs confirmation",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready for pickup",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const PAYMENT_METHOD_LABELS = {
  QR_CODE: "QR code",
  GCASH: "GCash",
  CASH_ON_DELIVERY: "Cash on Delivery",
};

// An online (QR/GCash) order whose 15-minute payment window has passed but
// hasn't actually been flipped to CANCELLED yet — that only happens once the
// customer reopens the order (the poll route notices immediately) or the
// scheduled sweep runs (app/api/cron/reconcile-payments, currently once a
// day on Vercel's Hobby plan — see vercel.json). Until one of those runs,
// the order sits in the database still saying PENDING even though it's
// already dead, which would otherwise make it look to an admin like a
// customer might still complete it any moment. This is a display-only
// check — it never writes anything, just relabels what's already known to
// be true from the payment's own expiresAt.
export function isPaymentWindowExpired(order) {
  return (
    order.status === "PENDING" &&
    order.payment?.status === "PENDING" &&
    Boolean(order.payment?.expiresAt) &&
    order.payment.expiresAt < new Date()
  );
}

// Orders staff are actively working: paid and not yet handed off/delivered.
export const ACTIVE_ORDER_STATUSES = [
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
];

// The schema's OrderStatus enum has one shared PREPARING step and separate
// READY_FOR_PICKUP/OUT_FOR_DELIVERY steps for pickup vs delivery orders, but
// no separate "picked up by customer" status — so for a pickup order,
// READY_FOR_PICKUP's "next" step is DELIVERED too (reused here to mean
// "handed off / completed", not literally "delivered to a door"). This is an
// assumption, not something the original schema spelled out explicitly.
export function getNextOrderStatus(order) {
  const isDelivery = Boolean(order.addressId);
  switch (order.status) {
    case "CONFIRMED":
      return "PREPARING";
    case "PREPARING":
      return isDelivery ? "OUT_FOR_DELIVERY" : "READY_FOR_PICKUP";
    case "OUT_FOR_DELIVERY":
    case "READY_FOR_PICKUP":
      return "DELIVERED";
    default:
      return null;
  }
}

export function getNextStatusButtonLabel(order) {
  const next = getNextOrderStatus(order);
  if (!next) return null;
  if (next === "DELIVERED") {
    return order.addressId ? "Mark delivered" : "Mark picked up";
  }
  return `Mark ${STATUS_LABELS[next].toLowerCase()}`;
}

// A "regular" transition is either a no-op, cancelling (always allowed
// directly — it's a distinct escape hatch, not a "skip"), or the single next
// step getNextOrderStatus would take. Anything else (a multi-stage jump, a
// backward move, or un-cancelling) needs the admin to explicitly confirm the
// override on /admin/orders/[id] — see setOrderStatusAction.
export function isRegularTransition(order, newStatus) {
  if (newStatus === order.status) return true;
  if (newStatus === "CANCELLED") return true;
  return getNextOrderStatus(order) === newStatus;
}

// Rank used only to place a status on the customer tracker below — not a
// substitute for getNextOrderStatus's role in the staff/admin advance logic.
const TRACKER_STATUS_RANK = {
  PENDING: 0,
  PENDING_CONFIRMATION: 0,
  CONFIRMED: 1,
  PREPARING: 2,
  READY_FOR_PICKUP: 3,
  OUT_FOR_DELIVERY: 3,
  DELIVERED: 4,
  CANCELLED: -1,
};

export const TRACKER_STAGE_LABELS = {
  CONFIRMED: "Order Confirmed",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for Delivery",
  READY_FOR_PICKUP: "Ready for Pickup",
  DELIVERED: "Delivered",
};

// The four stages shown on the customer tracker, in order — delivery and
// pickup orders share every stage except the third.
function getTrackerStatuses(order) {
  const isDelivery = Boolean(order.addressId);
  return ["CONFIRMED", "PREPARING", isDelivery ? "OUT_FOR_DELIVERY" : "READY_FOR_PICKUP", "DELIVERED"];
}

// Builds the customer-facing tracker's stage list — reached/current flags
// plus the timestamp each stage was first reached, read from
// OrderStatusHistory (order.statusHistory must be included in the query).
// Returns null before payment/confirmation (PENDING/PENDING_CONFIRMATION) or
// once CANCELLED — those get their own messaging (see PaymentSection)
// instead of a tracker with nothing meaningful to show.
// Uses rank rather than a strict array-index match so a manually-corrected
// order (e.g. an admin override that leaves it slightly off its own
// delivery/pickup branch) still places sensibly instead of looking broken.
export function buildOrderTracker(order) {
  const currentRank = TRACKER_STATUS_RANK[order.status];
  if (currentRank <= 0) return null;

  const stages = getTrackerStatuses(order);

  return stages.map((status) => {
    const historyEntry = order.statusHistory.find((h) => h.status === status);
    const stageRank = TRACKER_STATUS_RANK[status];
    return {
      status,
      label: TRACKER_STAGE_LABELS[status],
      reached: stageRank <= currentRank,
      current: stageRank === currentRank,
      timestamp: historyEntry?.createdAt ?? null,
    };
  });
}
