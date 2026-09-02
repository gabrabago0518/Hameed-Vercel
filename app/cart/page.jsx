import Link from "next/link";
import { getCartDetails } from "../../lib/cart.js";
import { removeFromCartAction, updateCartQuantityAction } from "./actions.js";

export default async function CartPage() {
  const { items, total } = await getCartDetails();

  if (items.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-zinc-900">
          Your cart
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
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <h1 className="mb-8 font-[family-name:var(--font-heading)] text-2xl font-bold text-zinc-900">
        Your cart
      </h1>

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4"
          >
            <div>
              <h3 className="font-semibold text-zinc-900">{item.name}</h3>
              <p className="text-sm text-zinc-600">
                ₱{item.price.toFixed(2)} each
              </p>
            </div>

            <div className="flex items-center gap-3">
              <form action={updateCartQuantityAction}>
                <input type="hidden" name="menuItemId" value={item.id} />
                <input type="hidden" name="quantity" value={item.quantity - 1} />
                <button
                  type="submit"
                  className="h-7 w-7 rounded-full border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                >
                  −
                </button>
              </form>

              <span className="w-6 text-center font-medium text-zinc-900">
                {item.quantity}
              </span>

              <form action={updateCartQuantityAction}>
                <input type="hidden" name="menuItemId" value={item.id} />
                <input type="hidden" name="quantity" value={item.quantity + 1} />
                <button
                  type="submit"
                  className="h-7 w-7 rounded-full border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                >
                  +
                </button>
              </form>

              <span className="w-16 text-right font-semibold text-zinc-900">
                ₱{(item.price * item.quantity).toFixed(2)}
              </span>

              <form action={removeFromCartAction}>
                <input type="hidden" name="menuItemId" value={item.id} />
                <button
                  type="submit"
                  className="text-sm text-zinc-400 hover:text-red-600"
                >
                  Remove
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-zinc-200 pt-6">
        <span className="text-lg font-semibold text-zinc-900">Total</span>
        <span className="text-lg font-bold text-red-600">
          ₱{total.toFixed(2)}
        </span>
      </div>

      <button
        type="button"
        disabled
        className="mt-6 w-full cursor-not-allowed rounded-full bg-red-300 px-8 py-3 text-base font-semibold text-white"
      >
        Checkout (coming soon)
      </button>
    </main>
  );
}
