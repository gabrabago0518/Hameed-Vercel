"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addToCart, removeFromCart, setCartQuantity } from "../../lib/cart.js";
import { getCurrentUser } from "../../lib/session.js";
import { isProfileComplete } from "../../lib/profile.js";
import { prisma } from "../../lib/prisma.js";

export async function addToCartAction(formData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!(await isProfileComplete(user))) {
    redirect("/account");
  }

  const menuItemId = formData.get("menuItemId")?.toString();
  if (!menuItemId) return;

  // The menu page already disables the Add button for an out-of-stock item,
  // but that's UI only — enforce it here too so a direct request can't add
  // one anyway (same "don't just hide it in the UI" rule this app already
  // follows for login/profile gating above).
  const menuItem = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    include: { addons: true, variantGroups: { include: { options: true } } },
  });
  if (!menuItem || !menuItem.isAvailable) return;

  // Same reasoning: the menu's choice picker already only lets a customer
  // submit addon ids that belong to this item and a variant option that
  // belongs to one of its groups, but a direct request could send anything —
  // validate against the item's own live addons/variantGroups rather than
  // trusting the submitted ids.
  const validAddonIds = new Set(menuItem.addons.map((addon) => addon.id));
  const addonIds = formData.getAll("addonIds").map(String).filter((id) => validAddonIds.has(id));

  const requestedVariantOptionId = formData.get("variantOptionId")?.toString() || null;
  let variantOptionId = null;
  for (const group of menuItem.variantGroups) {
    const option = group.options.find((o) => o.id === requestedVariantOptionId);
    if (option) {
      variantOptionId = option.id;
      break;
    }
    // A required group with no valid option chosen means this submission is
    // incomplete (e.g. tampered with, or a genuine UI bug) — refuse the add
    // rather than silently adding the item without the choice it requires.
    if (group.required) return;
  }

  await addToCart(menuItemId, 1, { addonIds, variantOptionId });
  revalidatePath("/cart");
  revalidatePath("/menu");
}

export async function updateCartQuantityAction(formData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const lineId = formData.get("lineId")?.toString();
  const quantity = Number(formData.get("quantity"));
  if (!lineId || Number.isNaN(quantity)) return;

  await setCartQuantity(lineId, quantity);
  revalidatePath("/cart");
}

export async function removeFromCartAction(formData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const lineId = formData.get("lineId")?.toString();
  if (!lineId) return;

  await removeFromCart(lineId);
  revalidatePath("/cart");
}
