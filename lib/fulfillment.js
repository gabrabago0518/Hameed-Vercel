import { cookies } from "next/headers";

const COOKIE_NAME = "fulfillment";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 1 day — this only needs to survive one checkout

// Stores the customer's choice for this order: { method: "DELIVERY", branchId,
// addressId } (delivered to the chosen saved address, prepared by that
// branch) or { method: "PICKUP", branchId } (picked up at that branch, no
// address needed). Every order needs a branch either way — Order.branchId in
// the schema is required. addressId is which of the customer's *multiple*
// saved addresses this particular order goes to — not necessarily their
// account-wide default, since the checkout picker lets them pick a different
// one just for this order.
export async function getFulfillment() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (
      (parsed?.method === "DELIVERY" || parsed?.method === "PICKUP") &&
      typeof parsed.branchId === "string"
    ) {
      return {
        method: parsed.method,
        branchId: parsed.branchId,
        addressId: typeof parsed.addressId === "string" ? parsed.addressId : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function setFulfillment(value) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, JSON.stringify(value), {
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearFulfillment() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
