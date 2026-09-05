import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../lib/session.js";
import { prisma } from "../../../lib/prisma.js";
import AddressForm from "../../components/AddressForm.jsx";
import {
  createAddressAction,
  updateAddressAction,
  setDefaultAddressAction,
  deleteAddressAction,
} from "./actions.js";
import { MAX_ADDRESSES_PER_USER } from "../../../lib/addressConfig.js";

const ERROR_MESSAGES = {
  invalid: "Please fill in all fields with a valid city and barangay.",
  max_addresses: `You've reached the ${MAX_ADDRESSES_PER_USER}-address limit — delete one to add another.`,
  address_in_use: "That address is linked to a past order and can't be deleted.",
};

function AddressCard({ address }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-zinc-900">{address.label ?? "Address"}</p>
        {address.isDefault && (
          <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
            Default
          </span>
        )}
      </div>

      <p className="text-sm text-zinc-600">
        {address.line1}
        {address.line2 ? `, ${address.line2}` : ""}
        <br />
        {address.barangay}, {address.city}
        {address.landmark && (
          <>
            <br />
            <span className="text-zinc-400">Landmark: {address.landmark}</span>
          </>
        )}
      </p>

      <div className="mt-1 flex flex-wrap gap-2">
        <Link
          href={`/account/addresses?edit=${address.id}`}
          className="flex min-h-11 items-center rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Edit
        </Link>
        {!address.isDefault && (
          <form action={setDefaultAddressAction}>
            <input type="hidden" name="addressId" value={address.id} />
            <button
              type="submit"
              className="flex min-h-11 items-center rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Set as Default
            </button>
          </form>
        )}
        <form action={deleteAddressAction}>
          <input type="hidden" name="addressId" value={address.id} />
          <button
            type="submit"
            className="flex min-h-11 items-center rounded-lg border border-red-200 px-3 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}

export default async function AddressesPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { error, add, edit, from } = await searchParams;
  const backTo = from === "checkout" ? "/checkout/delivery" : "/account/addresses";

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  const editingAddress = edit ? addresses.find((a) => a.id === edit) : null;
  const showForm = Boolean(add) || Boolean(editingAddress);
  const atLimit = addresses.length >= MAX_ADDRESSES_PER_USER;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold text-zinc-900 sm:text-2xl">
          Delivery addresses
        </h1>
        {!showForm && !atLimit && (
          <Link
            href="/account/addresses?add=1"
            className="flex min-h-11 items-center rounded-full bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700"
          >
            + Add New Address
          </Link>
        )}
      </div>

      {error && ERROR_MESSAGES[error] && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {ERROR_MESSAGES[error]}
        </div>
      )}

      {showForm ? (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">
              {editingAddress ? "Edit address" : "Add new address"}
            </h2>
            <Link href={backTo} className="text-sm text-zinc-500 hover:underline">
              Cancel
            </Link>
          </div>
          <AddressForm
            action={editingAddress ? updateAddressAction : createAddressAction}
            initialAddress={editingAddress}
            showDefaultCheckbox={editingAddress ? false : addresses.length > 0}
            submitLabel={editingAddress ? "Save changes" : "Save address"}
            redirectTo={!editingAddress && from === "checkout" ? "/checkout/delivery" : undefined}
            errorRedirectTo={`/account/addresses?add=1${from === "checkout" ? "&from=checkout" : ""}`}
          />
        </div>
      ) : addresses.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-600">
          No saved addresses yet — add one to place delivery orders.
        </p>
      ) : (
        <>
          {addresses.every((a) => !a.isDefault) && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              None of your addresses is set as default — pick one below.
            </div>
          )}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {addresses.map((address) => (
              <AddressCard key={address.id} address={address} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
