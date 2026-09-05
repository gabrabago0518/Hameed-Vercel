import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma.js";

// One-off cleanup for the double-seed bug diagnosed via /api/setup/diagnose:
// /api/setup's "skip if a restaurant already exists" check missed once,
// creating a second full restaurant/branches/menu-items tree. This merges
// the accidental duplicate back into the original, real one — real order
// data is never deleted, only ever *repointed* from a duplicate branch row
// to the equivalent original branch row, and only after every safety check
// below passes. Every step is inside one transaction: if any check fails,
// nothing is changed at all. Same SETUP_SECRET gate and delete-when-done
// lifecycle as the other one-off setup routes.
export async function GET(request) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const restaurants = await tx.restaurant.findMany({
        orderBy: { createdAt: "asc" },
      });

      if (restaurants.length === 1) {
        return { ok: true, action: "none — only one restaurant exists, nothing to clean up" };
      }
      if (restaurants.length !== 2) {
        throw new Error(
          `Expected exactly 1 or 2 restaurants, found ${restaurants.length} — aborting, this script only handles the known double-seed case.`
        );
      }

      const keep = restaurants[0];
      const dup = restaurants[1];

      // Every menu item that has any real order item must belong to the
      // restaurant we're keeping — otherwise this isn't the simple case this
      // script was built for, and deleting `dup` would destroy real order data.
      const dupMenuItemsWithOrders = await tx.menuItem.findFirst({
        where: {
          category: { restaurantId: dup.id },
          orderItems: { some: {} },
        },
      });
      if (dupMenuItemsWithOrders) {
        throw new Error(
          `Menu item "${dupMenuItemsWithOrders.name}" under the duplicate restaurant (${dup.id}) has real order items — aborting, this is not the simple case this script handles.`
        );
      }

      const keepBranches = await tx.branch.findMany({ where: { restaurantId: keep.id } });
      const dupBranches = await tx.branch.findMany({ where: { restaurantId: dup.id } });

      const branchMergeLog = [];
      for (const dupBranch of dupBranches) {
        const match = keepBranches.find((b) => b.name === dupBranch.name);
        if (!match) {
          throw new Error(
            `No branch named "${dupBranch.name}" found under the restaurant being kept — aborting, can't safely merge.`
          );
        }
        if (match.address !== dupBranch.address || match.city !== dupBranch.city) {
          throw new Error(
            `Branch "${dupBranch.name}" address/city differs between the two restaurants — aborting, these might not actually be the same physical branch.`
          );
        }

        // Repoint any real orders off the duplicate branch onto the
        // equivalent original branch before the duplicate branch is deleted.
        const reassigned = await tx.order.updateMany({
          where: { branchId: dupBranch.id },
          data: { branchId: match.id },
        });
        branchMergeLog.push({
          duplicateBranchId: dupBranch.id,
          keptBranchId: match.id,
          name: dupBranch.name,
          ordersReassigned: reassigned.count,
        });
      }

      // Everything under the duplicate restaurant should now be safe to
      // delete — re-verify right before doing it rather than trusting the
      // checks above blindly.
      const stillReferenced = await tx.order.count({
        where: { branchId: { in: dupBranches.map((b) => b.id) } },
      });
      if (stillReferenced > 0) {
        throw new Error("A duplicate branch still has orders after reassignment — aborting.");
      }

      const dupMenuItems = await tx.menuItem.findMany({
        where: { category: { restaurantId: dup.id } },
        select: { id: true },
      });
      const dupMenuItemIds = dupMenuItems.map((m) => m.id);

      const dupVariantGroups = await tx.itemVariantGroup.findMany({
        where: { menuItemId: { in: dupMenuItemIds } },
        select: { id: true },
      });
      const dupVariantGroupIds = dupVariantGroups.map((g) => g.id);

      const dupVariantOptions = await tx.itemVariantOption.findMany({
        where: { groupId: { in: dupVariantGroupIds } },
        select: { id: true },
      });
      const dupVariantOptionIds = dupVariantOptions.map((o) => o.id);

      const dupAddons = await tx.itemAddon.findMany({
        where: { menuItemId: { in: dupMenuItemIds } },
        select: { id: true },
      });
      const dupAddonIds = dupAddons.map((a) => a.id);

      const orderItemsUsingDupItems = await tx.orderItem.count({
        where: { menuItemId: { in: dupMenuItemIds } },
      });
      const orderAddonsUsingDupAddons = await tx.orderItemAddon.count({
        where: { addonId: { in: dupAddonIds } },
      });
      const orderVariantsUsingDupOptions = await tx.orderItemVariantSelection.count({
        where: { variantOptionId: { in: dupVariantOptionIds } },
      });
      if (orderItemsUsingDupItems > 0 || orderAddonsUsingDupAddons > 0 || orderVariantsUsingDupOptions > 0) {
        throw new Error(
          "A duplicate menu item/addon/variant option is still referenced by a real order — aborting."
        );
      }

      await tx.itemVariantOption.deleteMany({ where: { id: { in: dupVariantOptionIds } } });
      await tx.itemVariantGroup.deleteMany({ where: { id: { in: dupVariantGroupIds } } });
      await tx.itemAddon.deleteMany({ where: { id: { in: dupAddonIds } } });
      await tx.menuItem.deleteMany({ where: { id: { in: dupMenuItemIds } } });
      await tx.menuCategory.deleteMany({ where: { restaurantId: dup.id } });
      await tx.branch.deleteMany({ where: { restaurantId: dup.id } });
      await tx.restaurant.delete({ where: { id: dup.id } });

      return {
        ok: true,
        action: "merged and deleted duplicate restaurant",
        keptRestaurantId: keep.id,
        deletedRestaurantId: dup.id,
        branchMergeLog,
        deletedMenuItems: dupMenuItemIds.length,
        deletedAddons: dupAddonIds.length,
        deletedVariantGroups: dupVariantGroupIds.length,
        deletedVariantOptions: dupVariantOptionIds.length,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 409 });
  }
}
