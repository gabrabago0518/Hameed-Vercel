import { prisma } from "./prisma.js";

// Discount is always computed live from the code's current rule and the
// cart's current subtotal — never frozen anywhere except onto the finished
// Order itself (Order.discountAmount), same reasoning as
// lib/deliveryZones.js. Capped so a FIXED code (or a PERCENT code, in the
// edge case of rounding) can never discount more than the subtotal itself —
// no promo code in this project can make an order's item total negative.
export function computeDiscount(promoCode, subtotal) {
  const value = Number(promoCode.value);
  const raw = promoCode.type === "PERCENT" ? subtotal * (value / 100) : value;
  return Math.min(Math.max(raw, 0), subtotal);
}

// Result shapes:
//   { valid: true, promoCode, discountAmount }
//   { valid: false, error }
// Codes are matched case-insensitively (stored and compared uppercase) so
// "welcome10" and "WELCOME10" are the same code from a customer's point of
// view — see the schema's own note on PromoCode.code.
export async function validatePromoCode(rawCode, subtotal) {
  const code = rawCode?.trim().toUpperCase();
  if (!code) {
    return { valid: false, error: "Enter a promo code." };
  }

  const promoCode = await prisma.promoCode.findUnique({ where: { code } });
  if (!promoCode || !promoCode.isActive) {
    return { valid: false, error: "That promo code isn't valid." };
  }
  if (promoCode.expiresAt && promoCode.expiresAt < new Date()) {
    return { valid: false, error: "That promo code has expired." };
  }
  if (promoCode.maxUses !== null && promoCode.usedCount >= promoCode.maxUses) {
    return { valid: false, error: "That promo code has already been fully redeemed." };
  }

  return { valid: true, promoCode, discountAmount: computeDiscount(promoCode, subtotal) };
}
