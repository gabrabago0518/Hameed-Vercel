import Link from "next/link";
import { requireStaff } from "../../lib/roleGuard.js";
import { logoutAction } from "../logout/actions.js";

export default async function StaffLayout({ children }) {
  const user = await requireStaff();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <Link href="/staff" className="text-lg font-bold text-zinc-900">
          Staff — Hameed the Love Recipe
        </Link>
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
