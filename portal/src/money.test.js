import { describe, it, expect } from "vitest";
import { formatUSD } from "./money.js";
describe("formatUSD", () => {
  it("formats whole dollars", () => { expect(formatUSD(49600)).toBe("$49,600"); });
  it("handles null", () => { expect(formatUSD(null)).toBe("—"); });
});
