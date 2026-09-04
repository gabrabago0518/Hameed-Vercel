"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function FulfillmentSelector({ branches, addresses, fulfillment, action }) {
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;

  const [method, setMethod] = useState(fulfillment?.method ?? "");
  const [branchId, setBranchId] = useState(fulfillment?.branchId ?? "");
  const [addressId, setAddressId] = useState(fulfillment?.addressId ?? defaultAddress?.id ?? "");
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  // `useState`'s initial value only applies on mount — it won't pick up a
  // freshly-confirmed selection when the server re-renders this page with a
  // new `fulfillment` prop after the form below submits. Without this, the
  // radio button appeared to "unselect itself" right after pressing Confirm.
  useEffect(() => {
    setMethod(fulfillment?.method ?? "");
    setBranchId(fulfillment?.branchId ?? "");
    setAddressId(fulfillment?.addressId ?? defaultAddress?.id ?? "");
  }, [fulfillment?.method, fulfillment?.branchId, fulfillment?.addressId, defaultAddress?.id]);

  const selectedAddress = addresses.find((a) => a.id === addressId) ?? null;
  const hasAddresses = addresses.length > 0;

  return (
    <form action={action} className="mt-4 flex flex-col gap-4">
      <label className="flex items-center gap-2 text-sm font-medium text-zinc-900">
        <input
          type="radio"
          name="method"
          value="DELIVERY"
          checked={method === "DELIVERY"}
          onChange={() => setMethod("DELIVERY")}
          disabled={!hasAddresses}
          className="h-4 w-4 accent-red-600"
        />
        Delivery
        {!hasAddresses && (
          <span className="text-xs font-normal text-zinc-500">
            (add a delivery address in your account first)
          </span>
        )}
      </label>

      {method === "DELIVERY" && hasAddresses && (
        <div className="ml-6 flex flex-col gap-3">
          <input type="hidden" name="addressId" value={addressId} />

          {selectedAddress && !showAddressPicker && (
            <div className="rounded-lg border border-zinc-200 p-3 text-sm">
              <p className="font-medium text-zinc-900">{selectedAddress.label ?? "Address"}</p>
              <p className="text-zinc-600">
                {selectedAddress.line1}, {selectedAddress.barangay}, {selectedAddress.city}
              </p>
              <button
                type="button"
                onClick={() => setShowAddressPicker(true)}
                className="mt-2 min-h-11 text-sm font-medium text-red-600 hover:underline"
              >
                Change Address
              </button>
            </div>
          )}

          {showAddressPicker && (
            <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3">
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm hover:bg-zinc-50"
                >
                  <input
                    type="radio"
                    checked={addressId === a.id}
                    onChange={() => {
                      setAddressId(a.id);
                      setShowAddressPicker(false);
                    }}
                    className="h-4 w-4 accent-red-600"
                  />
                  <span>
                    <span className="font-medium text-zinc-900">{a.label ?? "Address"}</span>{" "}
                    <span className="text-zinc-500">
                      — {a.line1}, {a.barangay}, {a.city}
                    </span>
                  </span>
                </label>
              ))}
              <Link
                href="/account/addresses?add=1&from=checkout"
                className="flex min-h-11 items-center px-2 text-sm font-medium text-red-600 hover:underline"
              >
                + Add New Address
              </Link>
            </div>
          )}

          <div>
            <label className="text-sm text-zinc-600" htmlFor="delivery-branch">
              Prepared by which branch?
            </label>
            <select
              id="delivery-branch"
              name="branchId"
              required
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
            >
              <option value="" disabled>
                Choose a branch
              </option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm font-medium text-zinc-900">
        <input
          type="radio"
          name="method"
          value="PICKUP"
          checked={method === "PICKUP"}
          onChange={() => setMethod("PICKUP")}
          className="h-4 w-4 accent-red-600"
        />
        Pickup
      </label>

      {method === "PICKUP" && (
        <div className="ml-6 flex flex-col gap-2">
          <label className="text-sm text-zinc-600" htmlFor="pickup-branch">
            Choose a branch to pick up from.
          </label>
          <select
            id="pickup-branch"
            name="branchId"
            required
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
          >
            <option value="" disabled>
              Choose a branch
            </option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {method && (
        <button
          type="submit"
          className="min-h-11 self-start rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          Confirm
        </button>
      )}
    </form>
  );
}
