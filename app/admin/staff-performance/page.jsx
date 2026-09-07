import Link from "next/link";
import { getStaffHandlingStats } from "../../../lib/staffPerformance.js";
import { getManilaDaysAgoStart, formatDuration } from "../../../lib/timezone.js";

const RANGES = {
  today: { label: "Today", since: () => getManilaDaysAgoStart(0) },
  week: { label: "Last 7 days", since: () => getManilaDaysAgoStart(6) },
  month: { label: "Last 30 days", since: () => getManilaDaysAgoStart(29) },
};

export default async function AdminStaffPerformancePage({ searchParams }) {
  const { range } = await searchParams;
  const rangeKey = range in RANGES ? range : "week";
  const since = RANGES[rangeKey].since();

  const stats = await getStaffHandlingStats({ since });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Staff performance</h1>
        <p className="mt-1 text-sm text-zinc-500">
          How long orders take to move through each stage, and who&apos;s handling them. Only
          completed (Delivered) orders count — one still in progress hasn&apos;t finished being
          handled yet.
        </p>
      </div>

      <div className="flex gap-2 text-xs">
        {Object.entries(RANGES).map(([key, { label }]) => (
          <Link
            key={key}
            href={`/admin/staff-performance?range=${key}`}
            className={`rounded-full px-3 py-1 font-semibold ${
              rangeKey === key ? "bg-red-600 text-white" : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <p className="text-sm text-zinc-500">Average total handling time per order</p>
        <p className="mt-1 text-2xl font-bold text-zinc-900">
          {formatDuration(stats.averageOrderMs)}
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          From Confirmed to Delivered, across {stats.orderCount} completed order
          {stats.orderCount === 1 ? "" : "s"} in this range.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-zinc-700">By staff member</h2>
        <p className="mb-4 text-xs text-zinc-400">
          Average time each person took to move an order to the next stage after clicking a
          status button (or verifying a Cash on Delivery order) — not the whole order, since
          different stages are often handled by different people.
        </p>

        {stats.staffBreakdown.length === 0 ? (
          <p className="text-sm text-zinc-500">No staff-driven status changes in this range yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="py-2">Staff</th>
                <th className="py-2">Status changes</th>
                <th className="py-2">Avg. time per change</th>
              </tr>
            </thead>
            <tbody>
              {stats.staffBreakdown.map((staff) => (
                <tr key={staff.userId} className="border-t border-zinc-100">
                  <td className="py-2 text-zinc-900">{staff.name}</td>
                  <td className="py-2 text-zinc-600">{staff.actionCount}</td>
                  <td className="py-2 font-medium text-zinc-900">
                    {formatDuration(staff.averageMs)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
