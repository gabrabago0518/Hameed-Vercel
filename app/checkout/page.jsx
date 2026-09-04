import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/session.js";
import { getCartDetails } from "../../lib/cart.js";
import { getFulfillment } from "../../lib/fulfillment.js";
import { prisma } from "../../lib/prisma.js";
import { setFulfillmentAction, placeOrderAction } from "./actions.js";
import FulfillmentSelector from "./FulfillmentSelector.jsx";

const ERROR_MESSAGES = {
  empty_cart: "Your cart is empty.",
  no_fulfillment: "Please choose delivery or pickup first.",
  no_payment_method: "Please choose a payment method.",
};

export default async function CheckoutPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { error } = await searchParams;

  const [{ items, total }, fulfillment, addresses, branches] = await Promise.all([
    getCartDetails(),
    getFulfillment(),
    prisma.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  if (items.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-zinc-900">
          Checkout
        </h1>
        <p className="mt-2 text-zinc-600">Your cart is empty.</p>
        <Link
          href="/menu"
          className="mt-6 rounded-full bg-red-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-red-700"
        >
          Browse the menu
        </Link>
      </main>
    );
  }

  const selectedBranch = fulfillment
    ? branches.find((branch) => branch.id === fulfillment.branchId)
    : null;

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="mb-8 font-[family-name:var(--font-heading)] text-xl font-bold text-zinc-900 sm:text-2xl">
        Checkout
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
            <div key={item.id} className="flex justify-between">
              <span className="text-zinc-700">
                {item.quantity} × {item.name}
              </span>
              <span className="font-medium text-zinc-900">
                ₱{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between border-t border-zinc-100 pt-3 text-sm font-semibold text-zinc-900">
          <span>Total</span>
          <span className="text-red-600">₱{total.toFixed(2)}</span>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-zinc-900">
          How would you like to get your order?
        </h2>

        <FulfillmentSelector
          branches={branches}
          addresses={addresses}
          fulfillment={fulfillment}
          action={setFulfillmentAction}
        />

        {fulfillment && (
          <p className="mt-4 text-sm text-zinc-600">
            Selected:{" "}
            <span className="font-medium text-zinc-900">
              {fulfillment.method === "DELIVERY"
                ? `Delivery from ${selectedBranch?.name ?? "selected branch"}`
                : `Pickup at ${selectedBranch?.name ?? "selected branch"}`}
            </span>
          </p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-zinc-900">
          How would you like to pay?
        </h2>

        {fulfillment ? (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <form action={placeOrderAction}>
              <input type="hidden" name="paymentMethod" value="QR_CODE" />
              <button
                type="submit"
                className="w-full rounded-xl border border-zinc-200 p-4 text-left transition-colors hover:border-red-300"
              >
                <p className="font-semibold text-zinc-900">Pay via QR code</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Scan a QR code from any bank or e-wallet app.
                </p>
              </button>
            </form>

            <form action={placeOrderAction}>
              <input type="hidden" name="paymentMethod" value="GCASH" />
              <button
                type="submit"
                className="w-full rounded-xl border border-zinc-200 p-4 text-left transition-colors hover:border-red-300"
              >
                <p className="font-semibold text-zinc-900">Pay via GCash</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Pay using your GCash app.
                </p>
              </button>
            </form>

            <form action={placeOrderAction}>
              <input type="hidden" name="paymentMethod" value="CASH_ON_DELIVERY" />
              <button
                type="submit"
                className="w-full rounded-xl border border-zinc-200 p-4 text-left transition-colors hover:border-red-300"
              >
                <p className="font-semibold text-zinc-900">Pay with Cash</p>
                <p className="mt-1 text-sm text-zinc-600">
                  No online payment needed — pay when you receive your order.
                  We&apos;ll call to confirm first.
                </p>
              </button>
            </form>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">
            Choose delivery or pickup above first.
          </p>
        )}
      </section>
    </main>
  );
}
