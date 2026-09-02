import { cookies } from "next/headers";
import { prisma } from "./prisma.js";

const COOKIE_NAME = "cart";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// The cart cookie just stores [{ menuItemId, quantity }, ...]. It doesn't need
// to be signed like the session cookie: the worst a visitor could do by
// editing it is put the wrong items in their own cart, and prices always come
// fresh from the database when the cart is displayed, never from the cookie.
async function readCart() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line) =>
        line &&
        typeof line.menuItemId === "string" &&
        Number.isInteger(line.quantity) &&
        line.quantity > 0
    );
  } catch {
    return [];
  }
}

async function writeCart(lines) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, JSON.stringify(lines), {
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function getCart() {
  return readCart();
}

export async function getCartCount() {
  const lines = await readCart();
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export async function addToCart(menuItemId, quantity = 1) {
  const lines = await readCart();
  const existing = lines.find((line) => line.menuItemId === menuItemId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    lines.push({ menuItemId, quantity });
  }
  await writeCart(lines);
}

export async function setCartQuantity(menuItemId, quantity) {
  const lines = await readCart();
  if (quantity <= 0) {
    await writeCart(lines.filter((line) => line.menuItemId !== menuItemId));
    return;
  }
  const existing = lines.find((line) => line.menuItemId === menuItemId);
  if (existing) {
    existing.quantity = quantity;
  } else {
    lines.push({ menuItemId, quantity });
  }
  await writeCart(lines);
}

export async function removeFromCart(menuItemId) {
  const lines = await readCart();
  await writeCart(lines.filter((line) => line.menuItemId !== menuItemId));
}

export async function clearCart() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Joins the cart cookie with live menu data (name/price can change, the cart
// cookie only ever stores an id + quantity). Prices are converted to plain
// numbers here — Prisma's Decimal type doesn't survive being passed as props
// from a server component into a client component.
export async function getCartDetails() {
  const lines = await readCart();
  if (lines.length === 0) {
    return { items: [], total: 0 };
  }

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: lines.map((line) => line.menuItemId) } },
  });

  const items = lines
    .map((line) => {
      const menuItem = menuItems.find((item) => item.id === line.menuItemId);
      if (!menuItem) return null;
      return {
        id: menuItem.id,
        name: menuItem.name,
        price: Number(menuItem.price),
        quantity: line.quantity,
      };
    })
    .filter(Boolean);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return { items, total };
}
