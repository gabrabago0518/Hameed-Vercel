import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma.js";

const COOKIE_NAME = "cart";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Each cart line is now { lineId, menuItemId, quantity, addonIds, variantOptionId }
// rather than just { menuItemId, quantity } — a menu item can be ordered more
// than once with *different* choices (e.g. one Spicy Pastil, one Original
// Pastil), so the identity of a "line" is the combination of menuItemId +
// exact choices, not menuItemId alone. lineId is what quantity-change/remove
// target, since two lines can share a menuItemId. Doesn't need to be signed
// like the session cookie: the worst a visitor could do by editing it is put
// the wrong items/choices in their own cart, and prices always come fresh
// from the database when the cart is displayed, never from the cookie.
function normalizeLine(line) {
  if (!line || typeof line.menuItemId !== "string") return null;
  if (!Number.isInteger(line.quantity) || line.quantity <= 0) return null;

  const addonIds = Array.isArray(line.addonIds)
    ? [...new Set(line.addonIds.filter((id) => typeof id === "string"))].sort()
    : [];
  const variantOptionId = typeof line.variantOptionId === "string" ? line.variantOptionId : null;
  const lineId = typeof line.lineId === "string" && line.lineId ? line.lineId : crypto.randomUUID();

  return { lineId, menuItemId: line.menuItemId, quantity: line.quantity, addonIds, variantOptionId };
}

// Two lines are "the same line" (their quantities should merge) when they're
// the same menu item with the exact same choices — not just the same
// menuItemId.
function sameChoices(a, b) {
  if (a.menuItemId !== b.menuItemId) return false;
  if (a.variantOptionId !== b.variantOptionId) return false;
  if (a.addonIds.length !== b.addonIds.length) return false;
  return a.addonIds.every((id, index) => id === b.addonIds[index]);
}

async function readCart() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeLine).filter(Boolean);
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

export async function addToCart(menuItemId, quantity = 1, { addonIds = [], variantOptionId = null } = {}) {
  const lines = await readCart();
  const candidate = normalizeLine({ menuItemId, quantity, addonIds, variantOptionId });
  const existing = lines.find((line) => sameChoices(line, candidate));
  if (existing) {
    existing.quantity += quantity;
  } else {
    lines.push(candidate);
  }
  await writeCart(lines);
}

export async function setCartQuantity(lineId, quantity) {
  const lines = await readCart();
  if (quantity <= 0) {
    await writeCart(lines.filter((line) => line.lineId !== lineId));
    return;
  }
  const existing = lines.find((line) => line.lineId === lineId);
  if (existing) {
    existing.quantity = quantity;
    await writeCart(lines);
  }
}

export async function removeFromCart(lineId) {
  const lines = await readCart();
  await writeCart(lines.filter((line) => line.lineId !== lineId));
}

export async function clearCart() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Joins the cart cookie with live menu/addon/variant data (names/prices can
// change, the cart cookie only ever stores ids + quantity). Prices are
// converted to plain numbers here — Prisma's Decimal type doesn't survive
// being passed as props from a server component into a client component.
export async function getCartDetails() {
  const lines = await readCart();
  if (lines.length === 0) {
    return { items: [], total: 0 };
  }

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: lines.map((line) => line.menuItemId) } },
    include: {
      addons: true,
      variantGroups: { include: { options: true } },
    },
  });

  const items = lines
    .map((line) => {
      const menuItem = menuItems.find((item) => item.id === line.menuItemId);
      if (!menuItem) return null;

      const chosenAddons = menuItem.addons
        .filter((addon) => line.addonIds.includes(addon.id))
        .map((addon) => ({ id: addon.id, name: addon.name, price: Number(addon.price) }));

      let variant = null;
      for (const group of menuItem.variantGroups) {
        const option = group.options.find((o) => o.id === line.variantOptionId);
        if (option) {
          variant = {
            groupId: group.id,
            groupName: group.name,
            optionId: option.id,
            optionName: option.name,
            priceDelta: Number(option.priceDelta),
          };
          break;
        }
      }

      const unitPrice =
        Number(menuItem.price) +
        chosenAddons.reduce((sum, addon) => sum + addon.price, 0) +
        (variant?.priceDelta ?? 0);

      return {
        lineId: line.lineId,
        id: menuItem.id,
        name: menuItem.name,
        price: Number(menuItem.price),
        addons: chosenAddons,
        variant,
        quantity: line.quantity,
        unitPrice,
      };
    })
    .filter(Boolean);

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return { items, total };
}
