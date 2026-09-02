"use server";

import { redirect } from "next/navigation";
import { destroySession } from "../../lib/session.js";
import { clearCart } from "../../lib/cart.js";

export async function logoutAction() {
  await destroySession();
  await clearCart();
  redirect("/");
}
