import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../lib/session.js";
import { getCartDetails } from "../../../lib/cart.js";
import { getFulfillment } from "../../../lib/fulfillment.js";
import { prisma } from "../../../lib/prisma.js";
import { setFulfillmentAction } from "../actions.js";
import FulfillmentSelector from "../FulfillmentSelector.jsx";

const ERROR_MESSAGES = {
  no_fulfillment: "Please choose delivery or pickup first.",
};

export default async function CheckoutDeliveryPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { error } = await searchParams;

  const [{ items }, fulfillment, addresses, branches] = await Promise.all([
    getCartDetails(),
    getFulfillment(),
    prisma.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  if (items.length === 0) {
    redirect("/checkout?error=empty_cart");
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:px-6 sm:py-12">
      <Link href="/checkout" className="mb-4 inline-block text-sm font-medium text-zinc-600 hover:text-zinc-900">
        ← Back to order summary
      </Link>

      <h1 className="mb-8 font-[family-name:var(--font-heading)] text-xl font-bold text-zinc-900 sm:text-2xl">
        Delivery
      </h1>

      {error && ERROR_MESSAGES[error] && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {ERROR_MESSAGES[error]}
        </div>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-zinc-900">
          How would you like to get your order?
        </h2>

        <FulfillmentSelector
          branches={branches}
          addresses={addresses}
          fulfillment={fulfillment}
          action={setFulfillmentAction}
        />
      </section>
    </main>
  );
}
