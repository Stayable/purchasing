import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CommsPanel, { attentionLabel, buildEmailSrcdoc } from "./CommsPanel.jsx";

describe("attentionLabel", () => {
  it("maps states to human text", () => {
    expect(attentionLabel("awaiting-our-reply", 3)).toMatch(/awaiting our reply/i);
    expect(attentionLabel("stale", 9)).toMatch(/silent 9/i);
    expect(attentionLabel("none", null)).toMatch(/no email/i);
  });
});

describe("buildEmailSrcdoc", () => {
  it("wraps the body in a locked-down CSP sandbox document", () => {
    const doc = buildEmailSrcdoc("<p>Hello <b>quote</b></p>");
    expect(doc).toMatch(/Content-Security-Policy/);
    expect(doc).toMatch(/default-src 'none'/);
    expect(doc).toMatch(/img-src data:/);
    expect(doc).toMatch(/Hello <b>quote<\/b>/);
  });
});

describe("CommsPanel", () => {
  const vendor = {
    vendorName: "Walrus", attentionState: "awaiting-our-reply", daysSinceLastMessage: 1, messageCount: 2,
    messages: [
      { direction: "outbound", from: "purchasing@rentstayable.com", subject: "Quote?", preview: "p", receivedAt: "2026-06-16T00:00:00Z", webLink: "https://o1" },
      { direction: "inbound", from: "sales@walrus.com", subject: "Re: Quote?", preview: "q", receivedAt: "2026-06-19T00:00:00Z", webLink: "https://o2" },
    ],
  };
  it("renders messages and the email-only coverage note", () => {
    render(<CommsPanel vendor={vendor} />);
    expect(screen.getByText(/Re: Quote\?/)).toBeInTheDocument();
    expect(screen.getByText(/Email only/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link").length).toBe(2);
  });
  it("renders empty state with Alibaba hint when no messages", () => {
    render(<CommsPanel vendor={{ vendorName: "Mesa", attentionState: "none", messageCount: 0, messages: [] }} />);
    expect(screen.getByText(/communicating via Alibaba chat/i)).toBeInTheDocument();
  });
});
