import Link from "next/link";
import { UserRound } from "lucide-react";
import { getCurrentUser } from "../../lib/session.js";
import { getCartCount } from "../../lib/cart.js";
import { logoutAction } from "../logout/actions.js";
import HeaderCartButton from "./HeaderCartButton.jsx";

export default async function Header() {
  const [user, cartCount] = await Promise.all([getCurrentUser(), getCartCount()]);

  return (
    <header className="sticky top-0 z-10 bg-red-600 shadow-md">
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
          {user ? (
            <div className="group relative">
              <Link
                href="/account"
                className="flex items-center gap-2 text-lg font-medium text-white/90 hover:text-white"
              >
                <UserRound size={24} />
                {user.name.split(" ")[0]}
              </Link>
              <div className="invisible absolute right-0 top-full pt-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
                <div className="w-40 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">
                  <Link
                    href="/account"
                    className="block rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Account details
                  </Link>
                  <Link
                    href="/orders"
                    className="block rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    View my orders
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="block rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      Admin dashboard
                    </Link>
                  )}
                  {user.role === "STAFF" && (
                    <Link
                      href="/staff/dashboard"
                      className="block rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      Staff dashboard
                    </Link>
                  )}
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      Log out
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <>
              <Link
                href="/account"
                className="flex items-center gap-2 text-lg font-medium text-white/90 hover:text-white"
              >
                <UserRound size={24} />
                Account
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-white px-5 py-2 text-lg font-semibold text-red-600 hover:bg-red-50"
              >
                Log in
              </Link>
            </>
          )}
          <HeaderCartButton count={cartCount} />
        </nav>
      </div>
    </header>
  );
}
