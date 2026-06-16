import { describe, it, expect } from "vitest";
import { daysSince } from "./days.js";

const NOW = new Date("2026-06-16T12:00:00Z");

describe("daysSince", () => {
  it("counts whole days", () => { expect(daysSince("2026-06-09T12:00:00Z", NOW)).toBe(7); });
  it("same day = 0", () => { expect(daysSince("2026-06-16T08:00:00Z", NOW)).toBe(0); });
  it("null/invalid → null", () => {
    expect(daysSince(null, NOW)).toBe(null);
    expect(daysSince("nope", NOW)).toBe(null);
  });
});
