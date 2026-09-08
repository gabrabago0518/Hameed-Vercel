import { describe, expect, it } from "vitest";
import { isValidName, isValidPhilippineMobile } from "../lib/signupValidation.js";

describe("isValidName", () => {
  it("accepts a plain real name", () => {
    expect(isValidName("Maria")).toBe(true);
    expect(isValidName("Dela Cruz")).toBe(true);
  });

  it("accepts names with hyphens, apostrophes, periods, and accents", () => {
    expect(isValidName("Mary-Jane")).toBe(true);
    expect(isValidName("D'Angelo")).toBe(true);
    expect(isValidName("Jr.")).toBe(true);
    expect(isValidName("Peña")).toBe(true);
  });

  it("rejects names containing digits or symbols", () => {
    expect(isValidName("John123")).toBe(false);
    expect(isValidName("J@ne")).toBe(false);
  });

  it("rejects empty or whitespace-only input", () => {
    expect(isValidName("")).toBe(false);
    expect(isValidName("   ")).toBe(false);
  });

  it("rejects a single repeated character", () => {
    expect(isValidName("aaaa")).toBe(false);
    expect(isValidName("zzzz")).toBe(false);
  });

  it("rejects common placeholder values", () => {
    expect(isValidName("test")).toBe(false);
    expect(isValidName("Test")).toBe(false);
    expect(isValidName("asdf")).toBe(false);
    expect(isValidName("n/a")).toBe(false);
  });

  it("rejects a single character (too short to be plausible)", () => {
    expect(isValidName("A")).toBe(false);
  });
});

describe("isValidPhilippineMobile", () => {
  it("accepts a well-formed 10-digit PH mobile number", () => {
    expect(isValidPhilippineMobile("9171234567")).toBe(true);
  });

  it("rejects a number not starting with 9", () => {
    expect(isValidPhilippineMobile("8171234567")).toBe(false);
  });

  it("rejects a number with the wrong length", () => {
    expect(isValidPhilippineMobile("917123456")).toBe(false);
    expect(isValidPhilippineMobile("91712345678")).toBe(false);
  });

  it("rejects an all-repeated-digit placeholder number", () => {
    expect(isValidPhilippineMobile("9111111111")).toBe(false);
    expect(isValidPhilippineMobile("9000000000")).toBe(false);
    expect(isValidPhilippineMobile("9999999999")).toBe(false);
  });

  it("rejects empty input", () => {
    expect(isValidPhilippineMobile("")).toBe(false);
    expect(isValidPhilippineMobile(undefined)).toBe(false);
  });
});
