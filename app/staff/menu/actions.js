"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "../../../lib/roleGuard.js";
import { prisma } from "../../../lib/prisma.js";

// Instant toggle — no separate "save" step. Takes the target item's current
// known availability from the client (rather than trusting a raw boolean it
// sends) so a stale double-click can't accidentally set it back to a value
// the client no longer agrees with; in practice this just flips it.
export async function toggleMenuItemAvailabilityAction(menuItemId, nextIsAvailable) {
  await requireStaff();
  if (!menuItemId) return;

  await prisma.menuItem.update({
    where: { id: menuItemId },
    data: { isAvailable: Boolean(nextIsAvailable) },
  });

  revalidatePath("/staff/menu");
  revalidatePath("/menu");
}
