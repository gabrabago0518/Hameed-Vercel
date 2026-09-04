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
  const menuItem = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
  if (!menuItem || !menuItem.isAvailable) return;

  await addToCart(menuItemId, 1);
  revalidatePath("/cart");
  revalidatePath("/menu");
}

export async function updateCartQuantityAction(formData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const menuItemId = formData.get("menuItemId")?.toString();
  const quantity = Number(formData.get("quantity"));
  if (!menuItemId || Number.isNaN(quantity)) return;

  await setCartQuantity(menuItemId, quantity);
  revalidatePath("/cart");
}

export async function removeFromCartAction(formData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const menuItemId = formData.get("menuItemId")?.toString();
  if (!menuItemId) return;

  await removeFromCart(menuItemId);
  revalidatePath("/cart");
}
