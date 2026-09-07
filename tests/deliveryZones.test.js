import { describe, expect, it } from "vitest";
import { getDeliveryFee } from "../lib/deliveryZones.js";

describe("getDeliveryFee", () => {
  it("returns the tier-1 fee for a nearby city", () => {
    expect(getDeliveryFee("Taguig")).toBe(49);
  });

  it("returns the tier-2 fee for a mid-distance city", () => {
    expect(getDeliveryFee("Mandaluyong")).toBe(79);
  });

  it("returns the tier-3 fee for a far city", () => {
    expect(getDeliveryFee("Quezon City")).toBe(129);
  });

  it("falls back to the farthest tier's fee for an unrecognized city", () => {
    // Every city a customer can actually pick is validated against
    // lib/psgc.js's NCR list, so this should never really happen — but the
    // fallback should still fail safe toward the highest fee, not undefined
    // or a free delivery.
    expect(getDeliveryFee("Nonexistent City")).toBe(129);
  });
});
