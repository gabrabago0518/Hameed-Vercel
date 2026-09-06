import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/session.js";
import { prisma } from "../../lib/prisma.js";
import { STATUS_LABELS } from "../../lib/orderStatus.js";

export default async function OrderHistoryPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { menuItem: true } }, payment: true },
  });

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="mb-8 font-[family-name:var(--font-heading)] text-xl font-bold text-zinc-900 sm:text-2xl">
        Your orders
      </h1>

      {orders.length === 0 ? (
        <p className="text-sm text-zinc-600">You haven't placed any orders yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-2xl border border-zinc-200 bg-white p-4 transition-colors hover:border-red-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-900">
                  {order.createdAt.toLocaleDateString()}{" "}
                  {order.createdAt.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-sm font-semibold text-red-600">
                  ₱{Number(order.total).toFixed(2)}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-600">
                {order.items.map((item) => item.menuItem.name).join(", ")}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium uppercase tracking-wide text-zinc-500">
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
                {order.payment && (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium uppercase tracking-wide text-zinc-500">
                    {order.payment.status === "EXPIRED" ? "FAILED" : order.payment.status}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
