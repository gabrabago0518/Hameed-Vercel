import Link from "next/link";
import { ShoppingCart, UserRound } from "lucide-react";
import { getCurrentUser } from "../../lib/session.js";
import { getCartCount } from "../../lib/cart.js";
import { logoutAction } from "../logout/actions.js";

export default async function Header() {
  const [user, cartCount] = await Promise.all([getCurrentUser(), getCartCount()]);

  return (
    <header className="sticky top-0 z-10 bg-red-600">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-heading)] text-2xl font-bold text-white"
        >
          Hameed the Love Recipe
        </Link>

        <nav className="flex items-center gap-8">
          <Link
            href="/menu"
            className="text-lg font-medium text-white/90 hover:text-white"
          >
            Menu
          </Link>
          <Link
            href="/cart"
            className="flex items-center gap-2 text-lg font-medium text-white/90 hover:text-white"
          >
            <ShoppingCart size={24} />
            Cart{cartCount > 0 ? ` (${cartCount})` : ""}
          </Link>
          <Link
            href="/account"
            className="flex items-center gap-2 text-lg font-medium text-white/90 hover:text-white"
          >
            <UserRound size={24} />
            {user ? user.name.split(" ")[0] : "Account"}
          </Link>
          {user ? (
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-lg font-medium text-white/70 hover:text-white"
              >
                Log out
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-white px-5 py-2 text-lg font-semibold text-red-600 hover:bg-red-50"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
