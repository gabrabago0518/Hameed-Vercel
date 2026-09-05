import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/session.js";
import { getCartDetails } from "../../lib/cart.js";
import { getFulfillment } from "../../lib/fulfillment.js";
import { prisma } from "../../lib/prisma.js";
import { setFulfillmentAction } from "./actions.js";
import FulfillmentSelector from "./FulfillmentSelector.jsx";

const ERROR_MESSAGES = {
  empty_cart: "Your cart is empty.",
  no_fulfillment: "Please choose delivery or pickup first.",
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
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-600">
              Selected:{" "}
              <span className="font-medium text-zinc-900">
                {fulfillment.method === "DELIVERY"
                  ? `Delivery from ${selectedBranch?.name ?? "selected branch"}`
                  : `Pickup at ${selectedBranch?.name ?? "selected branch"}`}
              </span>
            </p>
            {/* Confirming the form above already redirects here on its own
                (see setFulfillmentAction) - this link only matters if
                someone lands back on this page (e.g. the browser's back
                button) with fulfillment already set and doesn't touch the
                form again. */}
            <Link
              href="/checkout/payment"
              className="min-h-11 rounded-full bg-red-600 px-6 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Continue to Payment
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
