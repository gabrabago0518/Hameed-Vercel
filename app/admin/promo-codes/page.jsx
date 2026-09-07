import { prisma } from "../../../lib/prisma.js";
import { togglePromoCodeActiveAction } from "./actions.js";
import CreatePromoCodeForm from "./CreatePromoCodeForm.jsx";

function formatDiscount(promoCode) {
  const value = Number(promoCode.value);
  return promoCode.type === "PERCENT" ? `${value}% off` : `₱${value.toFixed(2)} off`;
}

export default async function AdminPromoCodesPage() {
  const promoCodes = await prisma.promoCode.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  const now = new Date();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="text-2xl font-bold text-zinc-900">Promo codes</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Codes customers can apply at checkout for a discount. Deactivate a code instead of trying
        to remove it if it&apos;s already been used on real orders.
      </p>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Add a promo code</h2>
        <CreatePromoCodeForm />
      </section>

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">All codes</h2>
        {promoCodes.length === 0 ? (
          <p className="text-sm text-zinc-500">No promo codes yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-100">
            {promoCodes.map((promoCode) => {
              const isExpired = promoCode.expiresAt && promoCode.expiresAt < now;
              const isExhausted =
                promoCode.maxUses !== null && promoCode.usedCount >= promoCode.maxUses;

              return (
                <div key={promoCode.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {promoCode.code}
                      {!promoCode.isActive && (
                        <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold uppercase text-zinc-500">
                          Inactive
                        </span>
                      )}
                      {promoCode.isActive && isExpired && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase text-amber-700">
                          Expired
                        </span>
                      )}
                      {promoCode.isActive && !isExpired && isExhausted && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase text-amber-700">
                          Fully redeemed
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDiscount(promoCode)} · used {promoCode.usedCount}
                      {promoCode.maxUses !== null ? ` / ${promoCode.maxUses}` : ""} time
                      {promoCode.usedCount === 1 ? "" : "s"}
                      {promoCode.expiresAt
                        ? ` · expires ${promoCode.expiresAt.toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <form action={togglePromoCodeActiveAction}>
                    <input type="hidden" name="promoCodeId" value={promoCode.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                    >
                      {promoCode.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
