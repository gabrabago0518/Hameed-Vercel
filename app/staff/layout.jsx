import Link from "next/link";
import { requireStaff } from "../../lib/roleGuard.js";
import { logoutAction } from "../logout/actions.js";

const NAV_LINKS = [
  { href: "/staff/dashboard", label: "Dashboard" },
  { href: "/staff/orders", label: "Orders" },
  { href: "/staff/menu", label: "Menu" },
];

export default async function StaffLayout({ children }) {
  const user = await requireStaff();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/staff/dashboard" className="text-base font-bold text-zinc-900 sm:text-lg">
            Staff — Hameed the Love Recipe
          </Link>
          <div className="flex items-center gap-4 text-sm text-zinc-600">
            <span className="hidden sm:inline">{user.name}</span>
            <form action={logoutAction}>
              <button type="submit" className="font-medium text-red-600 hover:underline">
                Log out
              </button>
            </form>
          </div>
        </div>

        <nav className="mt-4 flex gap-2 overflow-x-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 hover:border-red-200 hover:text-red-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
