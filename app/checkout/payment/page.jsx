import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../lib/session.js";
import { getCartDetails } from "../../../lib/cart.js";
import { getFulfillment } from "../../../lib/fulfillment.js";
import { getDeliveryFee } from "../../../lib/deliveryZones.js";
import { prisma } from "../../../lib/prisma.js";
import { placeOrderAction } from "../actions.js";
import PaymentMethodSelector from "../PaymentMethodSelector.jsx";

const ERROR_MESSAGES = {
  no_payment_method: "Please choose a payment method.",
  invalid_exchange: "Please enter a valid exchange amount (at least the order total).",
};

export default async function CheckoutPaymentPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { error } = await searchParams;

  const [{ items, total }, fulfillment] = await Promise.all([getCartDetails(), getFulfillment()]);

  if (items.length === 0) {
    redirect("/checkout?error=empty_cart");
  }

  // Delivery/pickup has to be chosen first — this page has nothing to show
  // without it (a branch, an address) and placeOrderAction itself requires
  // it too.
  if (!fulfillment) {
    redirect("/checkout/delivery?error=no_fulfillment");
  }

  const [selectedBranch, selectedAddress] = await Promise.all([
    prisma.branch.findUnique({ where: { id: fulfillment.branchId } }),
    fulfillment.method === "DELIVERY" && fulfillment.addressId
      ? prisma.address.findUnique({ where: { id: fulfillment.addressId } })
      : null,
  ]);

  // Mirrors placeOrderAction's own calculation exactly, so what's shown here
  // is always what actually gets charged — see lib/deliveryZones.js.
  const deliveryFee = selectedAddress ? getDeliveryFee(selectedAddress.city) : 0;
  const orderTotal = total + deliveryFee;

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:px-6 sm:py-12">
      <Link
        href="/checkout/delivery"
        className="mb-4 inline-block text-sm font-medium text-zinc-600 hover:text-zinc-900"
      >
        ← Change delivery/pickup details
      </Link>

      <h1 className="mb-8 font-[family-name:var(--font-heading)] text-xl font-bold text-zinc-900 sm:text-2xl">
        Payment
      </h1>

      {error && ERROR_MESSAGES[error] && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {ERROR_MESSAGES[error]}
        </div>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-zinc-900">
          Order summary
        </h2>
        <div className="mt-3 flex flex-col gap-2 text-sm">
          {items.map((item) => (
            <div key={item.lineId} className="flex justify-between">
              <span className="text-zinc-700">
                {item.quantity} × {item.name}
                {item.variant && ` (${item.variant.optionName})`}
                {item.addons.length > 0 && ` + ${item.addons.map((a) => a.name).join(", ")}`}
              </span>
              <span className="font-medium text-zinc-900">
                ₱{(item.unitPrice * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-1 border-t border-zinc-100 pt-3 text-sm">
          <div className="flex justify-between text-zinc-600">
            <span>Subtotal</span>
            <span>₱{total.toFixed(2)}</span>
          </div>
          {fulfillment.method === "DELIVERY" && (
            <div className="flex justify-between text-zinc-600">
              <span>Delivery fee{selectedAddress ? ` (${selectedAddress.city})` : ""}</span>
              <span>₱{deliveryFee.toFixed(2)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-zinc-100 pt-2 font-semibold text-zinc-900">
            <span>Total</span>
            <span className="text-red-600">₱{orderTotal.toFixed(2)}</span>
          </div>
        </div>
        <p className="mt-3 border-t border-zinc-100 pt-3 text-sm text-zinc-600">
          {fulfillment.method === "DELIVERY"
            ? `Delivery from ${selectedBranch?.name ?? "selected branch"}`
            : `Pickup at ${selectedBranch?.name ?? "selected branch"}`}
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-zinc-900">
          How would you like to pay?
        </h2>

        <PaymentMethodSelector total={orderTotal} action={placeOrderAction} />
      </section>
    </main>
  );
}
