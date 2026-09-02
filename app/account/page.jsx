import Link from "next/link";
import { getCurrentUser } from "../../lib/session.js";
import { logoutAction } from "../logout/actions.js";
import { saveAddressAction, savePhoneAction } from "./actions.js";
import { prisma } from "../../lib/prisma.js";
import PhoneField from "../components/PhoneField.jsx";
import AddressField from "../components/AddressField.jsx";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-zinc-900">
          Account
        </h1>
        <p className="mt-2 text-zinc-600">Log in to see your account.</p>
        <Link
          href="/login"
          className="mt-6 rounded-full bg-red-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-red-700"
        >
          Log in
        </Link>
      </main>
    );
  }

  const [address, orders] = await Promise.all([
    prisma.address.findFirst({ where: { userId: user.id } }),
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: { include: { menuItem: true } } },
    }),
  ]);

  const missingPhone = !user.phone;
  const missingAddress = !address;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-6 py-16">
      <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-zinc-900">
        Hi, {user.name}
      </h1>

      {(missingPhone || missingAddress) && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Add your {missingPhone && missingAddress
            ? "contact number and delivery address"
            : missingPhone
              ? "contact number"
              : "delivery address"}{" "}
          below before you can place an order.
        </div>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-zinc-900">
          Account details
        </h2>
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Name</dt>
            <dd className="font-medium text-zinc-900">{user.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Email</dt>
            <dd className="font-medium text-zinc-900">{user.email}</dd>
          </div>
          {user.role === "ADMIN" && (
            <div className="flex justify-between">
              <dt className="text-zinc-500">Role</dt>
              <dd className="font-medium text-zinc-900">Admin</dd>
            </div>
          )}
        </dl>

        <PhoneField phone={user.phone} action={savePhoneAction} />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-zinc-900">
          Delivery address
        </h2>
        <div className="mt-3">
          <AddressField address={address} action={saveAddressAction} />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-zinc-900">
          Recent transactions
        </h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">No orders yet.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl border border-zinc-100 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-900">
                    {order.createdAt.toLocaleDateString()}
                  </span>
                  <span className="font-semibold text-red-600">
                    ₱{Number(order.total).toFixed(2)}
                  </span>
                </div>
                <p className="mt-1 text-zinc-600">
                  {order.items.map((item) => item.menuItem.name).join(", ")}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
                  {order.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <form action={logoutAction}>
        <button
          type="submit"
          className="w-full rounded-full border border-zinc-300 px-6 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Log out
        </button>
      </form>
    </main>
  );
}
