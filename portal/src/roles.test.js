// portal/src/roles.test.js
import { describe, it, expect } from "vitest";
import { canCreateItems } from "./roles.js";

describe("canCreateItems", () => {
  it("allows Rob and admin", () => {
    expect(canCreateItems("rb@rise8companies.com")).toBe(true);
    expect(canCreateItems("ADMIN@rentstayable.com")).toBe(true);
  });
  it("denies Jefferson and unknown", () => {
    expect(canCreateItems("jefferson@rentstayable.com")).toBe(false);
    expect(canCreateItems("")).toBe(false);
    expect(canCreateItems(null)).toBe(false);
  });
});
