import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "../lib/safeRedirect.js";

describe("safeRedirectPath", () => {
  it("accepts a plain relative path", () => {
    expect(safeRedirectPath("/checkout/delivery", "/fallback")).toBe("/checkout/delivery");
  });

  it("accepts the bare root path", () => {
    expect(safeRedirectPath("/", "/fallback")).toBe("/");
  });

  it("falls back for an absolute URL", () => {
    expect(safeRedirectPath("https://evil.com", "/fallback")).toBe("/fallback");
    expect(safeRedirectPath("http://evil.com/x", "/fallback")).toBe("/fallback");
  });

  it("falls back for a protocol-relative URL", () => {
    expect(safeRedirectPath("//evil.com", "/fallback")).toBe("/fallback");
  });

  it("falls back for the backslash variant browsers normalize to protocol-relative", () => {
    expect(safeRedirectPath("/\\evil.com", "/fallback")).toBe("/fallback");
  });

  it("falls back for a path with no leading slash", () => {
    expect(safeRedirectPath("evil.com", "/fallback")).toBe("/fallback");
  });

  it("falls back for a non-string value", () => {
    expect(safeRedirectPath(null, "/fallback")).toBe("/fallback");
    expect(safeRedirectPath(undefined, "/fallback")).toBe("/fallback");
  });
});
