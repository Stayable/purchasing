import { describe, it, expect } from "vitest";
import { buildAwardBody } from "./api.js";
describe("buildAwardBody", () => {
  it("award includes quoteId + note", () => {
    expect(buildAwardBody({ itemId: "1", action: "approve", quoteId: "9", note: "why" }))
      .toEqual({ itemId: "1", action: "approve", quoteId: "9", note: "why" });
  });
  it("decline omits quoteId", () => {
    expect(buildAwardBody({ itemId: "1", action: "decline", quoteId: "9", note: "no" }))
      .toEqual({ itemId: "1", action: "decline", note: "no" });
  });
});
