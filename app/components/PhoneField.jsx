"use client";

import { useState } from "react";

export default function PhoneField({ phone, action }) {
  const [editing, setEditing] = useState(!phone);

  if (!editing) {
    return (
      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">
        <div>
          <p className="text-sm text-zinc-500">Contact number</p>
          <p className="font-medium text-zinc-900">{phone}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          Change number
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
      className="mt-4 border-t border-zinc-100 pt-4"
    >
      <label htmlFor="phone" className="text-sm font-medium text-zinc-700">
        Contact number
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          defaultValue={phone ?? ""}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          Save
        </button>
        {phone && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="shrink-0 rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
