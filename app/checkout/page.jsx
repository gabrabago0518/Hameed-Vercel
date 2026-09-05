import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/session.js";
import { getCartDetails } from "../../lib/cart.js";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { items, total } = await getCartDetails();

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

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="mb-8 font-[family-name:var(--font-heading)] text-xl font-bold text-zinc-900 sm:text-2xl">
        Checkout
      </h1>

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

      <Link
        href="/checkout/delivery"
        className="mt-6 flex min-h-11 w-full items-center justify-center rounded-full bg-red-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-red-700"
      >
        Confirm
      </Link>
    </main>
  );
}
