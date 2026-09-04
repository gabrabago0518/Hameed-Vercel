import Link from "next/link";
import { requireAdmin } from "../../lib/roleGuard.js";
import { logoutAction } from "../logout/actions.js";

const NAV_LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/accounts", label: "Accounts" },
  { href: "/admin/sales", label: "Sales" },
];

export default async function AdminLayout({ children }) {
  const user = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/admin" className="text-lg font-bold text-zinc-900">
            Admin — Hameed the Love Recipe
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium text-zinc-600">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-red-600">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm text-zinc-600">
          <span>{user.name}</span>
          <form action={logoutAction}>
            <button type="submit" className="font-medium text-red-600 hover:underline">
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
