import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../lib/session.js";
import { prisma } from "../../../lib/prisma.js";
import { createAddressAction } from "../../account/addresses/actions.js";
import AddressForm from "../../components/AddressForm.jsx";

const ERROR_MESSAGES = {
  invalid: "Please fill in all fields with a valid city and barangay.",
  max_addresses: "You've reached the address limit.",
};

export default async function OnboardingAddressPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Staff accounts skip this entirely — they're not customers placing
  // delivery orders (same exemption isProfileComplete already makes).
  if (user.role !== "CUSTOMER") redirect(user.role === "ADMIN" ? "/admin" : "/staff/dashboard");

  const addressCount = await prisma.address.count({ where: { userId: user.id } });
  if (addressCount > 0) redirect("/");

  const { error } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold text-zinc-900 sm:text-2xl">
        Add your delivery address
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        We need at least one saved address before you can order — you can add
        more (like a separate office address) later from your account.
      </p>

      {error && ERROR_MESSAGES[error] && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {ERROR_MESSAGES[error]}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
        <AddressForm
          action={createAddressAction}
          showDefaultCheckbox={false}
          submitLabel="Save address & continue"
          redirectTo="/"
          errorRedirectTo="/onboarding/address"
        />
      </div>
    </main>
  );
}
