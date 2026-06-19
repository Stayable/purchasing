import { describe, it, expect, vi } from "vitest";
import { buildAwardBody } from "./api.js";
import * as api from "./api.js";
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

describe("getCommunications", () => {
  it("calls /api/communications with itemId query", async () => {
    const spy = vi.spyOn(api.__http, "get").mockResolvedValue({ data: { configured: true } });
    await api.getCommunications("123");
    expect(spy).toHaveBeenCalledWith("/api/communications", { params: { itemId: "123" } });
    spy.mockRestore();
  });
  it("omits params when no itemId", async () => {
    const spy = vi.spyOn(api.__http, "get").mockResolvedValue({ data: {} });
    await api.getCommunications();
    expect(spy).toHaveBeenCalledWith("/api/communications", { params: {} });
    spy.mockRestore();
  });
});
