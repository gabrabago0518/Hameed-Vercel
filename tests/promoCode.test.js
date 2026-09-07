import { describe, expect, it } from "vitest";
import { computeDiscount } from "../lib/promoCode.js";

describe("computeDiscount", () => {
  it("computes a percent discount off the subtotal", () => {
    expect(computeDiscount({ type: "PERCENT", value: 10 }, 200)).toBe(20);
  });

  it("computes a fixed discount regardless of subtotal size", () => {
    expect(computeDiscount({ type: "FIXED", value: 50 }, 200)).toBe(50);
  });

  it("caps a fixed discount at the subtotal so an order can never go negative", () => {
    expect(computeDiscount({ type: "FIXED", value: 500 }, 200)).toBe(200);
  });

  it("caps a percent discount at the subtotal even in a rounding edge case", () => {
    expect(computeDiscount({ type: "PERCENT", value: 100 }, 150)).toBe(150);
  });

  it("never returns a negative discount", () => {
    expect(computeDiscount({ type: "FIXED", value: -10 }, 200)).toBe(0);
  });
});
