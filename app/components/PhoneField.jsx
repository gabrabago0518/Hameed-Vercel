"use client";

import { useState } from "react";

// A PH mobile number's local part always starts with 9, so stripping a
// leading "63" (country code) or a leading "0" (trunk prefix, if someone
// types the number the way it's normally said out loud) is unambiguous.
// Used both to pre-fill the edit input and to normalize older numbers
// saved before the +63-prefix convention started (this doesn't touch what's
// actually stored — only how it's displayed/edited).
function toLocalDigits(phone) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("63")) return digits.slice(2);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}

function formatPhoneDisplay(phone) {
  const local = toLocalDigits(phone);
  return local ? `+63 ${local}` : phone;
}

export default function PhoneField({ phone, action }) {
  const [editing, setEditing] = useState(!phone);

  if (!editing) {
    return (
      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">
        <div>
          <p className="text-sm text-zinc-500">Contact number</p>
          <p className="font-medium text-zinc-900">{formatPhoneDisplay(phone)}</p>
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
      <label htmlFor="phoneLocal" className="text-sm font-medium text-zinc-700">
        Contact number
      </label>
      <div className="mt-1 flex gap-2">
        <div className="flex min-w-0 flex-1">
          <span className="flex min-h-11 items-center rounded-l-lg border border-r-0 border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-600">
            +63
          </span>
          <input
            id="phoneLocal"
            name="phoneLocal"
            type="tel"
            inputMode="numeric"
            required
            defaultValue={toLocalDigits(phone)}
            placeholder="9171234567"
            className="w-full min-w-0 rounded-r-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
          />
        </div>
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
