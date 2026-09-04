"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma.js";
import { getCurrentUser } from "../../../lib/session.js";
import { isValidCity, isValidBarangay } from "../../../lib/psgc.js";
import { MAX_ADDRESSES_PER_USER } from "../../../lib/addressConfig.js";

const LABEL_OPTIONS = ["Home", "Office", "Other"];

// Shared by create/update — pulls the address fields out of formData and
// validates the PSGC-constrained ones (city/barangay) against lib/psgc.js.
// line1/line2/landmark stay free text, per the spec (no dataset exists to
// validate street-level detail against).
function parseAddressInput(formData) {
  const labelChoice = formData.get("label")?.toString();
  const customLabel = formData.get("customLabel")?.toString().trim();
  const label =
    labelChoice === "Other" ? customLabel : LABEL_OPTIONS.includes(labelChoice) ? labelChoice : null;

  const city = formData.get("city")?.toString().trim();
  const barangay = formData.get("barangay")?.toString().trim();
  const line1 = formData.get("line1")?.toString().trim();
  const line2 = formData.get("line2")?.toString().trim() || null;
  const landmark = formData.get("landmark")?.toString().trim() || null;

  if (!label || !city || !barangay || !line1) return { error: "Please fill in all required fields." };
  if (!isValidCity(city)) return { error: "Please choose a valid city." };
  if (!isValidBarangay(city, barangay)) return { error: "Please choose a valid barangay for that city." };

  return { data: { label, city, barangay, line1, line2, landmark } };
}

export async function createAddressAction(formData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Onboarding and the checkout "Add New Address" flow both post here too —
  // their errors need to bounce back to wherever the form actually is, not
  // always /account/addresses.
  const errorPage = formData.get("errorRedirectTo")?.toString() || "/account/addresses";

  const existingCount = await prisma.address.count({ where: { userId: user.id } });
  if (existingCount >= MAX_ADDRESSES_PER_USER) {
    redirect(`${errorPage}?error=max_addresses`);
  }

  const { data, error } = parseAddressInput(formData);
  if (error) redirect(`${errorPage}?error=invalid`);

  // The very first address is always the default, regardless of the
  // checkbox — there's no other address for "default" to meaningfully mean
  // anything relative to yet.
  const makeDefault = existingCount === 0 || formData.get("isDefault") === "on";

  if (makeDefault && existingCount > 0) {
    await prisma.$transaction([
      prisma.address.updateMany({ where: { userId: user.id, isDefault: true }, data: { isDefault: false } }),
      prisma.address.create({ data: { ...data, userId: user.id, isDefault: true } }),
    ]);
  } else {
    await prisma.address.create({ data: { ...data, userId: user.id, isDefault: makeDefault } });
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");

  // Onboarding (adding the very first address) needs to continue into the
  // main app rather than land back on the addresses list — everywhere else
  // just stays on /account/addresses (the default when this isn't set).
  const redirectTo = formData.get("redirectTo")?.toString();
  if (redirectTo) redirect(redirectTo);
}

export async function updateAddressAction(formData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const addressId = formData.get("addressId")?.toString();
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== user.id) return;

  const { data, error } = parseAddressInput(formData);
  if (error) redirect(`/account/addresses?error=invalid`);

  await prisma.address.update({ where: { id: addressId }, data });

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}

export async function setDefaultAddressAction(formData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const addressId = formData.get("addressId")?.toString();
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== user.id) return;

  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId: user.id, isDefault: true }, data: { isDefault: false } }),
    prisma.address.update({ where: { id: addressId }, data: { isDefault: true } }),
  ]);

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}

export async function deleteAddressAction(formData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const addressId = formData.get("addressId")?.toString();
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== user.id) return;

  // Orders keep a real reference to the address they were delivered to (for
  // history), so — same reasoning as not letting an admin delete a user with
  // orders — an address that's actually been used on an order can't be
  // deleted out from under that history.
  const usedOnOrder = await prisma.order.count({ where: { addressId } });
  if (usedOnOrder > 0) {
    redirect("/account/addresses?error=address_in_use");
  }

  await prisma.address.delete({ where: { id: addressId } });

  // If that was the default and other addresses remain, don't silently pick
  // one — the remaining list will show no "Default" badge at all until the
  // customer explicitly clicks "Set as Default" on one of the cards.
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}
