import crypto from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { verifyWebhookSignature } from "../lib/paymongo.js";

const SECRET = "whsec_test_secret_value";

function sign(rawBody, timestamp, secret = SECRET) {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

describe("verifyWebhookSignature", () => {
  beforeEach(() => {
    process.env.PAYMONGO_WEBHOOK_SECRET = SECRET;
  });

  it("accepts a correctly-signed test-mode payload", () => {
    const rawBody = JSON.stringify({ data: { id: "evt_123" } });
    const timestamp = "1700000000";
    const signature = sign(rawBody, timestamp);
    const header = `t=${timestamp},te=${signature}`;

    expect(verifyWebhookSignature(rawBody, header)).toBe(true);
  });

  it("prefers the live signature over the test one when both are present", () => {
    const rawBody = JSON.stringify({ data: { id: "evt_123" } });
    const timestamp = "1700000000";
    const liveSignature = sign(rawBody, timestamp);
    const header = `t=${timestamp},te=deadbeef,li=${liveSignature}`;

    expect(verifyWebhookSignature(rawBody, header)).toBe(true);
  });

  it("rejects a payload that was tampered with after signing", () => {
    const timestamp = "1700000000";
    const signature = sign(JSON.stringify({ data: { id: "evt_123" } }), timestamp);
    const header = `t=${timestamp},te=${signature}`;
    const tamperedBody = JSON.stringify({ data: { id: "evt_456" } });

    expect(verifyWebhookSignature(tamperedBody, header)).toBe(false);
  });

  it("rejects a signature made with the wrong secret", () => {
    const rawBody = JSON.stringify({ data: { id: "evt_123" } });
    const timestamp = "1700000000";
    const signature = sign(rawBody, timestamp, "whsec_wrong_secret");
    const header = `t=${timestamp},te=${signature}`;

    expect(verifyWebhookSignature(rawBody, header)).toBe(false);
  });

  it("rejects a missing signature header", () => {
    expect(verifyWebhookSignature("{}", null)).toBe(false);
    expect(verifyWebhookSignature("{}", undefined)).toBe(false);
    expect(verifyWebhookSignature("{}", "")).toBe(false);
  });

  it("rejects a malformed header with no timestamp or signature", () => {
    expect(verifyWebhookSignature("{}", "garbage")).toBe(false);
  });

  it("throws if PAYMONGO_WEBHOOK_SECRET isn't configured", () => {
    delete process.env.PAYMONGO_WEBHOOK_SECRET;
    expect(() => verifyWebhookSignature("{}", "t=1,te=abc")).toThrow();
  });
});
