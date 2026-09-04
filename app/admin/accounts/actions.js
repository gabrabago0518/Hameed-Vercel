"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../lib/roleGuard.js";
import { prisma } from "../../../lib/prisma.js";

const VALID_ROLES = ["CUSTOMER", "EMPLOYEE", "ADMIN"];

export async function changeUserRoleAction(formData) {
  const admin = await requireAdmin();

  const userId = formData.get("userId")?.toString();
  const newRole = formData.get("role")?.toString();
  if (!userId || !VALID_ROLES.includes(newRole)) return;

  // An admin can't change their own role through this form — otherwise a
  // single misclick could lock the only admin account out of /admin with no
  // one left who can undo it.
  if (userId === admin.id) return;

  await prisma.user.update({ where: { id: userId }, data: { role: newRole } });
  revalidatePath("/admin/accounts");
}

// Only ever deletes an account that has zero orders — Order.userId is a
// required relation, so an account with real order history can't be deleted
// without either destroying that history or leaving orphaned rows, and this
// app has been careful to preserve order history everywhere else (price
// snapshots, status history, etc.). The page itself only renders a Delete
// button for zero-order accounts; this check is the backstop in case that
// ever gets out of sync.
export async function deleteUserAction(formData) {
  const admin = await requireAdmin();

  const userId = formData.get("userId")?.toString();
  if (!userId || userId === admin.id) return;

  const orderCount = await prisma.order.count({ where: { userId } });
  if (orderCount > 0) return;

  await prisma.address.deleteMany({ where: { userId } });
  await prisma.emailVerificationToken.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/admin/accounts");
}
