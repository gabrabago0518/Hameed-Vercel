import { describe, expect, it } from "vitest";
import {
  isPaymentWindowExpired,
  getNextOrderStatus,
  isRegularTransition,
} from "../lib/orderStatus.js";

describe("isPaymentWindowExpired", () => {
  it("is false for a paid order", () => {
    const order = {
      status: "PENDING",
      payment: { status: "PAID", expiresAt: new Date(Date.now() - 60_000) },
    };
    expect(isPaymentWindowExpired(order)).toBe(false);
  });

  it("is false while the payment window hasn't passed yet", () => {
    const order = {
      status: "PENDING",
      payment: { status: "PENDING", expiresAt: new Date(Date.now() + 60_000) },
    };
    expect(isPaymentWindowExpired(order)).toBe(false);
  });

  it("is true once the payment window has passed and nothing has reconciled it yet", () => {
    const order = {
      status: "PENDING",
      payment: { status: "PENDING", expiresAt: new Date(Date.now() - 60_000) },
    };
    expect(isPaymentWindowExpired(order)).toBe(true);
  });

  it("is false for a cash-on-delivery order (no expiresAt at all)", () => {
    const order = {
      status: "PENDING_CONFIRMATION",
      payment: { status: "PENDING", expiresAt: null },
    };
    expect(isPaymentWindowExpired(order)).toBe(false);
  });
});

describe("getNextOrderStatus", () => {
  it("moves a delivery order from CONFIRMED to PREPARING", () => {
    expect(getNextOrderStatus({ status: "CONFIRMED", addressId: "addr_1" })).toBe("PREPARING");
  });

  it("moves a delivery order from PREPARING to OUT_FOR_DELIVERY", () => {
    expect(getNextOrderStatus({ status: "PREPARING", addressId: "addr_1" })).toBe(
      "OUT_FOR_DELIVERY"
    );
  });

  it("moves a pickup order from PREPARING to READY_FOR_PICKUP", () => {
    expect(getNextOrderStatus({ status: "PREPARING", addressId: null })).toBe(
      "READY_FOR_PICKUP"
    );
  });

  it("moves either fulfillment method's final stage to DELIVERED", () => {
    expect(getNextOrderStatus({ status: "OUT_FOR_DELIVERY", addressId: "addr_1" })).toBe(
      "DELIVERED"
    );
    expect(getNextOrderStatus({ status: "READY_FOR_PICKUP", addressId: null })).toBe(
      "DELIVERED"
    );
  });

  it("returns null once there is no next step", () => {
    expect(getNextOrderStatus({ status: "DELIVERED", addressId: null })).toBeNull();
    expect(getNextOrderStatus({ status: "CANCELLED", addressId: null })).toBeNull();
  });
});

describe("isRegularTransition", () => {
  it("allows re-picking the current status (a no-op)", () => {
    expect(isRegularTransition({ status: "PREPARING", addressId: null }, "PREPARING")).toBe(true);
  });

  it("always allows cancelling", () => {
    expect(isRegularTransition({ status: "CONFIRMED", addressId: null }, "CANCELLED")).toBe(true);
  });

  it("allows exactly the next step", () => {
    expect(isRegularTransition({ status: "CONFIRMED", addressId: "addr_1" }, "PREPARING")).toBe(
      true
    );
  });

  it("rejects a multi-stage jump", () => {
    expect(isRegularTransition({ status: "CONFIRMED", addressId: null }, "DELIVERED")).toBe(
      false
    );
  });

  it("rejects a backward move", () => {
    expect(isRegularTransition({ status: "PREPARING", addressId: null }, "CONFIRMED")).toBe(
      false
    );
  });
});
