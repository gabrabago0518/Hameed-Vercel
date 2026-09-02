"use client";

import { useState } from "react";

export default function AddressField({ address, action }) {
  const [editing, setEditing] = useState(!address);

  if (!editing) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-zinc-900">{address.line1}</p>
          <p className="text-sm text-zinc-600">{address.city}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          Change address
        </button>
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        await action(formData);
        setEditing(false);
      }}
      className="flex flex-col gap-3"
    >
      <div>
        <label htmlFor="line1" className="text-sm font-medium text-zinc-700">
          Street address
        </label>
        <input
          id="line1"
          name="line1"
          type="text"
          required
          defaultValue={address?.line1 ?? ""}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="city" className="text-sm font-medium text-zinc-700">
          City
        </label>
        <input
          id="city"
          name="city"
          type="text"
          required
          defaultValue={address?.city ?? ""}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="self-start rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          Save address
        </button>
        {address && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="self-start rounded-full border border-zinc-300 px-5 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
