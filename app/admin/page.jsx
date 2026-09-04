import { prisma } from "../../lib/prisma.js";

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function getTodayStats() {
  const start = startOfDay(new Date());

  const [salesToday, ordersToday, pending, preparing, delivered] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "PAID", paidAt: { gte: start } },
      _sum: { amount: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: start } } }),
    // "Current status as of today" — an order's updatedAt only moves when its
    // status changes, and never changes at all while still PENDING, so this
    // one filter (updatedAt >= start of today) correctly captures "became
    // PENDING/PREPARING/DELIVERED today" for all three without three
    // different date fields.
    prisma.order.count({ where: { status: "PENDING", updatedAt: { gte: start } } }),
    prisma.order.count({ where: { status: "PREPARING", updatedAt: { gte: start } } }),
    prisma.order.count({ where: { status: "DELIVERED", updatedAt: { gte: start } } }),
  ]);

  return {
    salesToday: Number(salesToday._sum.amount ?? 0),
    ordersToday,
    pending,
    preparing,
    delivered,
  };
}

async function getSevenDaySales() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const day = startOfDay(new Date());
    day.setDate(day.getDate() - i);
    days.push(day);
  }

  const results = await Promise.all(
    days.map(async (day) => {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const sum = await prisma.payment.aggregate({
        where: { status: "PAID", paidAt: { gte: day, lt: nextDay } },
        _sum: { amount: true },
      });
      return { day, total: Number(sum._sum.amount ?? 0) };
    })
  );

  return results;
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-900">{value}</p>
    </div>
  );
}

export default async function AdminOverviewPage() {
  const [stats, sevenDay] = await Promise.all([getTodayStats(), getSevenDaySales()]);
  const maxDay = Math.max(1, ...sevenDay.map((d) => d.total));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <h1 className="text-2xl font-bold text-zinc-900">Overview</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Sales today" value={`₱${stats.salesToday.toFixed(2)}`} />
        <StatCard label="Orders today" value={stats.ordersToday} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Preparing" value={stats.preparing} />
        <StatCard label="Delivered today" value={stats.delivered} />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-700">Last 7 days — sales</h2>
        <div className="flex h-40 items-end gap-3">
          {sevenDay.map(({ day, total }) => (
            <div key={day.toISOString()} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t bg-red-500"
                style={{ height: `${Math.max(4, (total / maxDay) * 100)}%` }}
                title={`₱${total.toFixed(2)}`}
              />
              <span className="text-xs text-zinc-500">
                {day.toLocaleDateString([], { weekday: "short" })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
