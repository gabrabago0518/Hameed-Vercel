import Image from "next/image";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { logoutAction } from "../logout/actions.js";
import HeaderCartButton from "./HeaderCartButton.jsx";

// user/cartCount come from the root layout now, rather than this component
// fetching its own — the layout already needs both (for the cart panel and
// the "hide the cart entirely when logged out" check below), so fetching
// them a second time here would just be a duplicate query.
export default function Header({ user, cartCount }) {
  return (
    <header className="sticky top-0 z-10 bg-red-600 shadow-md">
      {/* Every size here is mobile-first (smaller by default, sm: raises it
          back up to the original desktop sizing) — with 4 nav items (Home,
          Menu, Account, Cart) all at the old flat text-lg/gap-8, this
          overflowed/crowded badly on a real phone; customers reported the
          header text as "too big" right after Home was added. */}
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-3 py-3 sm:px-6 sm:py-4">
        {/* The full circular badge logo (public/branding/logo-stroke.webp)
            reads cleanly directly on this bar's red-600 background — unlike
            the original plain red logo (invisible on red, confirmed by
            compositing it before shipping a white-silhouette workaround),
            this version has its own white background + black stroke baked
            into the artwork, so it needs no separate badge/backdrop here. */}
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/branding/logo-stroke.webp"
            alt="Hameed the Love Recipe"
            width={48}
            height={48}
            className="h-9 w-9 sm:h-12 sm:w-12"
            priority
          />
        </Link>

        <nav className="flex items-center gap-2 sm:gap-8">
          {/* Explicit text link, by request — some customers didn't realize
              the logo itself already links home. */}
          <Link
            href="/"
            className="font-[family-name:var(--font-heading)] text-sm text-white/90 hover:text-white sm:text-lg"
          >
            Home
          </Link>
          <Link
            href="/menu"
            className="font-[family-name:var(--font-heading)] text-sm text-white/90 hover:text-white sm:text-lg"
          >
            Menu
          </Link>
          {user ? (
            <div className="group relative">
              <Link
                href="/account"
                className="flex items-center gap-1 font-[family-name:var(--font-heading)] text-sm text-white/90 hover:text-white sm:gap-2 sm:text-lg"
              >
                <UserRound size={20} className="sm:h-6 sm:w-6" />
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
                className="flex items-center gap-1 font-[family-name:var(--font-heading)] text-sm text-white/90 hover:text-white sm:gap-2 sm:text-lg"
              >
                <UserRound size={20} className="sm:h-6 sm:w-6" />
                Account
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 sm:px-5 sm:py-2 sm:text-lg"
              >
                Log in
              </Link>
            </>
          )}
          {/* No cart button at all for a logged-out visitor — they can't add
              anything to a cart anyway (addToCartAction redirects them to
              /login), so a cart button that can never show anything, or a
              panel that can only ever say "Your cart is empty," is just
              clutter. */}
          {user && <HeaderCartButton count={cartCount} />}
        </nav>
      </div>
    </header>
  );
}
