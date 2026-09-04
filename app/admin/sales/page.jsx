import Link from "next/link";
import { prisma } from "../../../lib/prisma.js";

function daysAgo(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

async function getPeriodTotal(since) {
  const [sum, count] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "PAID", paidAt: { gte: since } },
      _sum: { amount: true },
    }),
    prisma.payment.count({ where: { status: "PAID", paidAt: { gte: since } } }),
  ]);
  return { total: Number(sum._sum.amount ?? 0), count };
}

const RANGES = {
  week: { label: "Last 7 days", since: () => daysAgo(6) },
  month: { label: "Last 30 days", since: () => daysAgo(29) },
};

async function getBranchBreakdown(since) {
  const orders = await prisma.order.findMany({
    where: { payment: { status: "PAID", paidAt: { gte: since } } },
    include: { branch: true, payment: true },
  });

  const byBranch = new Map();
  for (const order of orders) {
    const key = order.branch.id;
    const entry = byBranch.get(key) ?? { name: order.branch.name, total: 0, count: 0 };
    entry.total += Number(order.payment.amount);
    entry.count += 1;
    byBranch.set(key, entry);
  }
  return [...byBranch.values()].sort((a, b) => b.total - a.total);
}

export default async function AdminSalesPage({ searchParams }) {
  const { range } = await searchParams;
  const rangeKey = range === "month" ? "month" : "week";
  const since = RANGES[rangeKey].since();

  const [today, thisWeek, thisMonth, byBranch] = await Promise.all([
    getPeriodTotal(daysAgo(0)),
    getPeriodTotal(daysAgo(6)),
    getPeriodTotal(daysAgo(29)),
    getBranchBreakdown(since),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <h1 className="text-2xl font-bold text-zinc-900">Sales</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Today", data: today },
          { label: "Last 7 days", data: thisWeek },
          { label: "Last 30 days", data: thisMonth },
        ].map(({ label, data }) => (
          <div key={label} className="rounded-2xl border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">₱{data.total.toFixed(2)}</p>
            <p className="text-xs text-zinc-400">{data.count} paid order{data.count === 1 ? "" : "s"}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700">Sales by branch</h2>
          <div className="flex gap-2 text-xs">
            {Object.entries(RANGES).map(([key, { label }]) => (
              <Link
                key={key}
                href={`/admin/sales?range=${key}`}
                className={`rounded-full px-3 py-1 font-semibold ${
                  rangeKey === key ? "bg-red-600 text-white" : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {byBranch.length === 0 ? (
          <p className="text-sm text-zinc-500">No paid orders in this range.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="py-2">Branch</th>
                <th className="py-2">Orders</th>
                <th className="py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {byBranch.map((branch) => (
                <tr key={branch.name} className="border-t border-zinc-100">
                  <td className="py-2 text-zinc-900">{branch.name}</td>
                  <td className="py-2 text-zinc-600">{branch.count}</td>
                  <td className="py-2 font-medium text-zinc-900">₱{branch.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
