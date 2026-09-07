import { cookies } from "next/headers";

const COOKIE_NAME = "promo";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 1 day — same as the fulfillment cookie, only needs to survive one checkout

// Just the code string — never the discount amount itself. The discount is
// always recomputed live from the code's current rule and the cart's
// current subtotal (lib/promoCode.js's computeDiscount), the same way
// lib/deliveryZones.js's fee is recomputed live rather than frozen into a
// cookie, so an admin changing or deactivating a code takes effect
// immediately rather than honoring whatever was true when it was applied.
export async function getAppliedPromoCode() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function setAppliedPromoCode(code) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, code, {
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearAppliedPromoCode() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
