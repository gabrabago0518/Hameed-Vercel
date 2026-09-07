import { prisma } from "./prisma.js";

// "Handling time" is measured two ways, both from OrderStatusHistory
// (order.statusHistory must be included, oldest first):
//
// 1. Per-order total: CONFIRMED -> DELIVERED elapsed time, averaged across
//    delivered orders in the period. Answers "how long does it take us to
//    fulfill an order, start to finish" — not attributed to any one staff
//    member, since a single order can pass through several people's hands.
//
// 2. Per-staff: for every history row that has a changedByUserId (a
//    deliberate staff/admin action — see the schema's own comment on that
//    column), the time between it and the row immediately before it is "how
//    long that stage sat before this person moved it forward." Averaging
//    these per changedByUserId is what actually answers "how fast is each
//    staff member" — a courier who always closes out fast but never
//    prepares anything doesn't get penalized for the kitchen's prep time.
//
// Only DELIVERED orders are considered — an order still in progress hasn't
// finished being "handled" yet, and a CANCELLED/REFUNDED order was never
// completed at all, so neither belongs in either average.
export async function getStaffHandlingStats({ since } = {}) {
  const orders = await prisma.order.findMany({
    where: {
      status: "DELIVERED",
      ...(since ? { updatedAt: { gte: since } } : {}),
    },
    select: {
      id: true,
      statusHistory: {
        orderBy: { createdAt: "asc" },
        select: { status: true, createdAt: true, changedByUserId: true, changedBy: { select: { name: true } } },
      },
    },
  });

  let orderCount = 0;
  let totalOrderMs = 0;
  const perStaff = new Map();

  for (const order of orders) {
    const history = order.statusHistory;

    const confirmedEntry = history.find((h) => h.status === "CONFIRMED");
    const deliveredEntry = [...history].reverse().find((h) => h.status === "DELIVERED");
    if (confirmedEntry && deliveredEntry) {
      const durationMs = deliveredEntry.createdAt - confirmedEntry.createdAt;
      if (durationMs >= 0) {
        orderCount += 1;
        totalOrderMs += durationMs;
      }
    }

    for (let i = 1; i < history.length; i++) {
      const entry = history[i];
      if (!entry.changedByUserId) continue;

      const durationMs = entry.createdAt - history[i - 1].createdAt;
      if (durationMs < 0) continue;

      const existing = perStaff.get(entry.changedByUserId) ?? {
        name: entry.changedBy?.name ?? "Unknown",
        actionCount: 0,
        totalMs: 0,
      };
      existing.actionCount += 1;
      existing.totalMs += durationMs;
      perStaff.set(entry.changedByUserId, existing);
    }
  }

  const staffBreakdown = [...perStaff.entries()]
    .map(([userId, data]) => ({
      userId,
      name: data.name,
      actionCount: data.actionCount,
      averageMs: data.totalMs / data.actionCount,
    }))
    .sort((a, b) => a.averageMs - b.averageMs);

  return {
    orderCount,
    averageOrderMs: orderCount > 0 ? totalOrderMs / orderCount : null,
    staffBreakdown,
  };
}
