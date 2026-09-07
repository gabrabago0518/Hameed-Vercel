import { describe, expect, it } from "vitest";
import { getManilaDayRange, getManilaDaysAgoStart, formatDuration } from "../lib/timezone.js";

describe("getManilaDaysAgoStart", () => {
  it("matches getManilaDayRange's start for 0 days ago", () => {
    const reference = new Date("2026-09-07T10:00:00Z");
    const { start } = getManilaDayRange(reference);
    expect(getManilaDaysAgoStart(0, reference).getTime()).toBe(start.getTime());
  });

  it("goes back exactly N whole days from Manila midnight", () => {
    const reference = new Date("2026-09-07T10:00:00Z");
    const { start } = getManilaDayRange(reference);
    const sevenDaysAgo = getManilaDaysAgoStart(7, reference);
    expect(start.getTime() - sevenDaysAgo.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe("formatDuration", () => {
  it("renders a sub-hour duration as just minutes", () => {
    expect(formatDuration(12 * 60 * 1000)).toBe("12m");
  });

  it("renders an hour-plus duration as hours and minutes", () => {
    expect(formatDuration(65 * 60 * 1000)).toBe("1h 5m");
  });

  it("rounds to the nearest minute", () => {
    expect(formatDuration(30 * 1000)).toBe("1m");
    expect(formatDuration(29 * 1000)).toBe("0m");
  });

  it("renders a placeholder for a missing duration", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(undefined)).toBe("—");
  });
});
