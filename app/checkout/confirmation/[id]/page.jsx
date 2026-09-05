import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "../../../../lib/session.js";
import { prisma } from "../../../../lib/prisma.js";

// Minimal acknowledgment screen shown right after checkout, before this
// specific payment method has necessarily been completed (a QR/GCash order
// still needs the customer to actually pay, which happens on /orders/[id]
// via "Track My Order" below — this page just confirms the order itself
// was successfully placed). Deliberately lightweight rather than repeating
// the full order summary/payment section/tracker that page already shows.
export default async function CheckoutConfirmationPage({ params }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { payment: true },
  });

  if (!order || order.userId !== user.id) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
        ✓
      </div>

      <h1 className="mt-6 font-[family-name:var(--font-heading)] text-2xl font-bold text-zinc-900">
        Your order has been placed!
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Reference:{" "}
        <span className="font-semibold text-zinc-900">{order.payment?.transactionRef}</span>
      </p>
      <p className="mt-1 text-2xl font-bold text-red-600">₱{Number(order.total).toFixed(2)}</p>

      <Link
        href={`/orders/${order.id}`}
        className="mt-8 flex min-h-11 w-full items-center justify-center rounded-full bg-red-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-red-700"
      >
        Track My Order
      </Link>
    </main>
  );
}
