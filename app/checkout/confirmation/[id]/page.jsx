import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "../../../../lib/session.js";
import { prisma } from "../../../../lib/prisma.js";
import ConfirmationStatus from "./ConfirmationStatus.jsx";

// Minimal acknowledgment screen shown right after checkout. For most payment
// methods the order is simply placed (a QR/GCash order still needs the
// customer to actually pay, which happens on /orders/[id] via "Track My
// Order" below). For Cash on Delivery, the order starts at
// PENDING_CONFIRMATION instead — ConfirmationStatus (a client component)
// handles showing a "waiting for confirmation" state and polling until an
// admin verifies it, then swapping to this same "placed" messaging in place.
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
      <ConfirmationStatus
        orderId={order.id}
        initialStatus={order.status}
        reference={order.payment?.transactionRef}
        total={Number(order.total)}
        exchangeFor={
          order.payment?.codExchangeFor != null ? Number(order.payment.codExchangeFor) : null
        }
      />
    </main>
  );
}
