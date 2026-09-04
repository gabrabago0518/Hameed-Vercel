"use client";

import { useState } from "react";
import { getNcrCities, getBarangaysForCity } from "../../lib/psgc.js";

const LABEL_OPTIONS = ["Home", "Office", "Other"];
const CITIES = getNcrCities();

// Shared by /onboarding/address (first address) and /account/addresses
// (add/edit) — needs to be a client component because the barangay dropdown
// has to repopulate based on whichever city is picked, which a plain HTML
// form can't do on its own.
export default function AddressForm({
  action,
  initialAddress,
  showDefaultCheckbox,
  submitLabel,
  redirectTo,
  errorRedirectTo,
}) {
  const initialIsCustomLabel = Boolean(
    initialAddress?.label && !LABEL_OPTIONS.slice(0, 2).includes(initialAddress.label)
  );

  const [city, setCity] = useState(initialAddress?.city ?? "");
  const [labelChoice, setLabelChoice] = useState(
    initialIsCustomLabel ? "Other" : initialAddress?.label ?? "Home"
  );

  const barangays = city ? getBarangaysForCity(city) : [];

  return (
    <form action={action} className="flex flex-col gap-4">
      {initialAddress && <input type="hidden" name="addressId" value={initialAddress.id} />}
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      {errorRedirectTo && <input type="hidden" name="errorRedirectTo" value={errorRedirectTo} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="label" className="text-sm font-medium text-zinc-700">
            Label
          </label>
          <select
            id="label"
            name="label"
            value={labelChoice}
            onChange={(e) => setLabelChoice(e.target.value)}
            className="mt-1 h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm focus:border-red-500 focus:outline-none"
          >
            {LABEL_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {labelChoice === "Other" && (
          <div>
            <label htmlFor="customLabel" className="text-sm font-medium text-zinc-700">
              Custom label
            </label>
            <input
              id="customLabel"
              name="customLabel"
              type="text"
              required
              defaultValue={initialIsCustomLabel ? initialAddress.label : ""}
              placeholder="e.g. Mom's House"
              className="mt-1 h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm focus:border-red-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className="text-sm font-medium text-zinc-700">
            City / Municipality
          </label>
          <select
            id="city"
            name="city"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm focus:border-red-500 focus:outline-none"
          >
            <option value="" disabled>
              Select a city
            </option>
            {CITIES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-400">Metro Manila only, for now.</p>
        </div>

        <div>
          <label htmlFor="barangay" className="text-sm font-medium text-zinc-700">
            Barangay
          </label>
          <select
            id="barangay"
            name="barangay"
            required
            disabled={!city}
            defaultValue={initialAddress?.barangay ?? ""}
            className="mt-1 h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm focus:border-red-500 focus:outline-none disabled:bg-zinc-50 disabled:text-zinc-400"
          >
            <option value="" disabled>
              {city ? "Select a barangay" : "Select a city first"}
            </option>
            {barangays.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="line1" className="text-sm font-medium text-zinc-700">
          Street / House / Unit number
        </label>
        <input
          id="line1"
          name="line1"
          type="text"
          required
          defaultValue={initialAddress?.line1 ?? ""}
          placeholder="e.g. Blk 4 Lot 12, Sampaguita St."
          className="mt-1 h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm focus:border-red-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="landmark" className="text-sm font-medium text-zinc-700">
          Landmark <span className="font-normal text-zinc-400">(optional)</span>
        </label>
        <input
          id="landmark"
          name="landmark"
          type="text"
          defaultValue={initialAddress?.landmark ?? ""}
          placeholder="e.g. Near the church"
          className="mt-1 h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm focus:border-red-500 focus:outline-none"
        />
      </div>

      {showDefaultCheckbox && (
        <label className="flex min-h-11 items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="isDefault"
            defaultChecked={initialAddress?.isDefault ?? false}
            className="h-5 w-5"
          />
          Set as default address
        </label>
      )}

      <button
        type="submit"
        className="mt-2 min-h-11 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
