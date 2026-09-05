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
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        {/* A white silhouette of the logo (public/branding/logo-white.webp,
            generated from the original's alpha channel) reads cleanly
            directly on this bar's red-600 background — the original red
            version didn't (confirmed by compositing it before shipping
            that version), which is why a white badge was here briefly. */}
        <Link href="/" className="flex items-center">
          <Image
            src="/branding/logo-white.webp"
            alt="Hameed the Love Recipe"
            width={48}
            height={48}
            className="h-12 w-12"
            priority
          />
        </Link>

        <nav className="flex items-center gap-8">
          <Link
            href="/menu"
            className="font-[family-name:var(--font-heading)] text-lg text-white/90 hover:text-white"
          >
            Menu
          </Link>
          {user ? (
            <div className="group relative">
              <Link
                href="/account"
                className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-lg text-white/90 hover:text-white"
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
                className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-lg text-white/90 hover:text-white"
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
