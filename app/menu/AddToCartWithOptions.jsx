"use client";

import { useState, useTransition } from "react";
import { addToCartAction } from "../cart/actions.js";
import { useToast } from "../components/ToastContext.jsx";
import { useCartUI } from "../components/CartUIContext.jsx";

// For a menu item with variant groups (pick exactly one, e.g. Spice Level)
// and/or addons (pick any number, e.g. Extra Rice) — the plain one-click
// AddToCartButton is used instead when an item has neither. Clicking "Add"
// here doesn't add anything yet; it reveals the choice picker in place
// (below the price, via the parent's flex-wrap), and only the picker's own
// "Add to Cart" button actually adds the item — so a customer can't
// accidentally add a required-choice item with no choice made.
export default function AddToCartWithOptions({ menuItemId, itemName, addons, variantGroups }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState(() => {
    // Default each required group to its first option — Original before
    // Spicy, per how the options are seeded/sorted — rather than forcing an
    // explicit click before Add is even usable.
    const defaults = {};
    for (const group of variantGroups) {
      if (group.required && group.options.length > 0) {
        defaults[group.id] = group.options[0].id;
      }
    }
    return defaults;
  });
  const [selectedAddonIds, setSelectedAddonIds] = useState(() => new Set());
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const { setOpen } = useCartUI();

  function toggleAddon(addonId) {
    setSelectedAddonIds((prev) => {
      const next = new Set(prev);
      if (next.has(addonId)) {
        next.delete(addonId);
      } else {
        next.add(addonId);
      }
      return next;
    });
  }

  const canAdd = variantGroups.every((group) => !group.required || selectedOptions[group.id]);

  function handleConfirm() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("menuItemId", menuItemId);
      for (const group of variantGroups) {
        const optionId = selectedOptions[group.id];
        if (optionId) formData.set("variantOptionId", optionId);
      }
      for (const addonId of selectedAddonIds) {
        formData.append("addonIds", addonId);
      }
      await addToCartAction(formData);
      showToast(`Added ${itemName} to cart`);
      setOpen(true);
      setExpanded(false);
      setSelectedAddonIds(new Set());
    });
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
      >
        Add
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      {variantGroups.map((group) => (
        <fieldset key={group.id} className="mb-3 last:mb-0">
          <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {group.name}
          </legend>
          <div className="flex flex-wrap gap-2">
            {group.options.map((option) => (
              <label
                key={option.id}
                className={`flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${
                  selectedOptions[group.id] === option.id
                    ? "border-red-600 bg-red-50 text-red-700"
                    : "border-zinc-300 bg-white text-zinc-700"
                }`}
              >
                <input
                  type="radio"
                  name={`variant-${group.id}`}
                  className="sr-only"
                  checked={selectedOptions[group.id] === option.id}
                  onChange={() => setSelectedOptions((prev) => ({ ...prev, [group.id]: option.id }))}
                />
                {option.name}
                {option.priceDelta > 0 && ` (+₱${option.priceDelta.toFixed(2)})`}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      {addons.length > 0 && (
        <fieldset className="mb-3 last:mb-0">
          <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Add-ons
          </legend>
          <div className="flex flex-col gap-1.5">
            {addons.map((addon) => (
              <label key={addon.id} className="flex min-h-9 cursor-pointer items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500"
                  checked={selectedAddonIds.has(addon.id)}
                  onChange={() => toggleAddon(addon.id)}
                />
                {addon.name} (+₱{addon.price.toFixed(2)})
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canAdd || isPending}
          className="min-h-9 flex-1 rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Adding..." : "Add to Cart"}
        </button>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          disabled={isPending}
          className="min-h-9 rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
