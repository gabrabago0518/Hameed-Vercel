import { prisma } from "../../../lib/prisma.js";
import { createRiderAction, toggleRiderActiveAction } from "./actions.js";

export default async function AdminRidersPage() {
  const riders = await prisma.rider.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-900">Riders</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Riders assigned to deliveries from an order&apos;s detail page. Deactivate a rider instead
        of removing them if they have past deliveries on record.
      </p>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Add a rider</h2>
        <form action={createRiderAction} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500">Name</label>
            <input
              name="name"
              required
              className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500">Phone</label>
            <input
              name="phone"
              required
              className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500">Vehicle (optional)</label>
            <input
              name="vehicle"
              placeholder="Motorcycle"
              className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Add rider
          </button>
        </form>
      </section>

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">All riders</h2>
        {riders.length === 0 ? (
          <p className="text-sm text-zinc-500">No riders yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-100">
            {riders.map((rider) => (
              <div key={rider.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {rider.name}
                    {!rider.isActive && (
                      <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold uppercase text-zinc-500">
                        Inactive
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {rider.phone}
                    {rider.vehicle ? ` · ${rider.vehicle}` : ""}
                  </p>
                </div>
                <form action={toggleRiderActiveAction}>
                  <input type="hidden" name="riderId" value={rider.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                  >
                    {rider.isActive ? "Deactivate" : "Activate"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
