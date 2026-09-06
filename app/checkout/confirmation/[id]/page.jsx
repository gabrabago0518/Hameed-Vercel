import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "../../../../lib/session.js";
import { prisma } from "../../../../lib/prisma.js";
import ConfirmationStatus from "./ConfirmationStatus.jsx";

// Acknowledgment + live payment-status screen shown right after checkout.
// ConfirmationStatus (a client component) branches by payment method: QR/
// GCash show a "Waiting for payment" state (QR image or a Pay with GCash
// button) that polls until PayMongo confirms, then swaps to "Payment
// Received"; Cash on Delivery shows "Waiting for confirmation" and polls
// until an admin verifies it, then swaps to "Order Confirmed". Either way,
// "Track My Order" leads to the full /orders/[id] tracker.
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
        initialOrderStatus={order.status}
        paymentMethod={order.payment?.method}
        initialPaymentStatus={order.payment?.status}
        reference={order.payment?.transactionRef}
        total={Number(order.total)}
        exchangeFor={
          order.payment?.codExchangeFor != null ? Number(order.payment.codExchangeFor) : null
        }
        checkoutUrl={order.payment?.paymongoCheckoutUrl ?? null}
        qrCodeData={order.payment?.paymongoQrCodeData ?? null}
      />
    </main>
  );
}
