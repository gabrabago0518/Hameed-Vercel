import { describe, expect, it } from "vitest";
import { timingSafeEqual } from "../lib/timingSafeCompare.js";

describe("timingSafeEqual", () => {
  it("returns true for identical utf8 strings", () => {
    expect(timingSafeEqual("Bearer secret123", "Bearer secret123")).toBe(true);
  });

  it("returns false for different utf8 strings of the same length", () => {
    expect(timingSafeEqual("Bearer secret123", "Bearer secret456")).toBe(false);
  });

  it("returns false for strings of different lengths", () => {
    expect(timingSafeEqual("short", "a lot longer than short")).toBe(false);
  });

  it("returns true for identical hex-encoded strings", () => {
    const hex = "deadbeef".repeat(8); // 64 hex chars, matching a real HMAC-SHA256 digest
    expect(timingSafeEqual(hex, hex, "hex")).toBe(true);
  });

  it("returns false for different hex-encoded strings", () => {
    const a = "a".repeat(64);
    const b = "b".repeat(64);
    expect(timingSafeEqual(a, b, "hex")).toBe(false);
  });

  it("returns false rather than throwing for non-string input", () => {
    expect(timingSafeEqual(null, "abc")).toBe(false);
    expect(timingSafeEqual("abc", undefined)).toBe(false);
    expect(timingSafeEqual(123, "abc")).toBe(false);
  });

  it("returns false for an empty string compared to a non-empty one", () => {
    expect(timingSafeEqual("", "nonempty")).toBe(false);
  });
});
