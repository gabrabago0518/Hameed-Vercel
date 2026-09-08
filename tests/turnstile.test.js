import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstileToken, isTurnstileConfigured } from "../lib/turnstile.js";

const ORIGINAL_SECRET = process.env.TURNSTILE_SECRET_KEY;
const ORIGINAL_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

describe("verifyTurnstileToken", () => {
  afterEach(() => {
    process.env.TURNSTILE_SECRET_KEY = ORIGINAL_SECRET;
    vi.unstubAllGlobals();
  });

  it("fails open (skips verification) when TURNSTILE_SECRET_KEY isn't configured", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const result = await verifyTurnstileToken("any-token", "1.2.3.4");
    expect(result).toEqual({ success: true, skipped: true });
  });

  it("rejects a missing token once a secret key is configured", async () => {
    process.env.TURNSTILE_SECRET_KEY = "sk_test_123";
    const result = await verifyTurnstileToken(null, "1.2.3.4");
    expect(result.success).toBe(false);
  });

  it("accepts a token Cloudflare confirms as valid", async () => {
    process.env.TURNSTILE_SECRET_KEY = "sk_test_123";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: async () => ({ success: true }) })
    );
    const result = await verifyTurnstileToken("good-token", "1.2.3.4");
    expect(result.success).toBe(true);
  });

  it("rejects a token Cloudflare reports as invalid", async () => {
    process.env.TURNSTILE_SECRET_KEY = "sk_test_123";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: async () => ({ success: false, "error-codes": ["invalid-input-response"] }) })
    );
    const result = await verifyTurnstileToken("bad-token", "1.2.3.4");
    expect(result.success).toBe(false);
  });

  it("rejects rather than throwing when the Cloudflare request itself fails", async () => {
    process.env.TURNSTILE_SECRET_KEY = "sk_test_123";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const result = await verifyTurnstileToken("some-token", "1.2.3.4");
    expect(result.success).toBe(false);
  });
});

describe("isTurnstileConfigured", () => {
  afterEach(() => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = ORIGINAL_SITE_KEY;
  });

  it("is false when no site key is set", () => {
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    expect(isTurnstileConfigured()).toBe(false);
  });

  it("is true once a site key is set", () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "0x123";
    expect(isTurnstileConfigured()).toBe(true);
  });
});
