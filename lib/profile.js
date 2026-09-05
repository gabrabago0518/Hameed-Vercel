import { prisma } from "./prisma.js";

// New signups always get a phone + address (both required on the signup
// form), but accounts created before that requirement existed can still be
// missing either one. This is the single source of truth for "is this
// account complete enough to place an order" — used to gate cart actions.
// ADMIN/STAFF accounts are exempt — they're not customers placing delivery
// orders, they're staff who need straight access to /admin or /staff, so
// there's no reason to make them fill in a phone/address first.
export async function isProfileComplete(user) {
  if (user.role !== "CUSTOMER") return true;
  if (!user.phone) return false;
  const address = await prisma.address.findFirst({ where: { userId: user.id } });
  return Boolean(address);
}
