import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
vi.mock("../useCommunications.js", () => ({
  useCommunications: () => ({
    status: "ready",
    data: { configured: true, itemAttention: "awaiting-our-reply",
      vendors: [{ quoteId: "q1", vendorName: "Walrus", attentionState: "awaiting-our-reply", daysSinceLastMessage: 1, messageCount: 1, messages: [{ id: "m1", direction: "inbound", subject: "Re: Quote", preview: "x", receivedAt: "2026-06-19T00:00:00Z", webLink: "https://o" }] }] },
  }),
}));
import ItemDetail from "./ItemDetail.jsx";

describe("ItemDetail comms", () => {
  it("shows item-level attention rollup", () => {
    const item = { id: "i1", name: "Queen Mattress", stage: "Submitted" };
    const quotes = [{ id: "q1", vendorName: "Walrus", totalLanded: 100, landedUnit: 10 }];
    const { container } = render(<ItemDetail item={item} quotes={quotes} reload={() => {}} />);
    // item-level rollup chip in the header meta block
    expect(container.querySelector(".meta-chip--attn")).toBeTruthy();
    expect(screen.getAllByText(/awaiting our reply/i).length).toBeGreaterThan(0);
  });
});
