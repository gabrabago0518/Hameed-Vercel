"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addToCart, removeFromCart, setCartQuantity } from "../../lib/cart.js";
import { getCurrentUser } from "../../lib/session.js";
import { isProfileComplete } from "../../lib/profile.js";

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
