import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CommsPanel, { attentionLabel, buildEmailSrcdoc, WINDOW_DAYS } from "./CommsPanel.jsx";

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
  it("shows no window control when the whole thread fits in the first window", () => {
    // fixture spans 3 days (06-16 → 06-19), inside the 7-day default window
    render(<CommsPanel vendor={vendor} />);
    expect(screen.queryByRole("button", { name: /more days/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/no older messages/i)).not.toBeInTheDocument();
  });
  it("opens on the latest 7 days, extends +7 per click, then shows the end marker", () => {
    // newest-first; offsets in days from the newest message (2026-06-20)
    const at = (d) => `2026-06-${String(20 - d).padStart(2, "0")}T00:00:00Z`;
    const messages = [
      { direction: "inbound",  subject: "Msg 0", preview: "p", receivedAt: at(0),  webLink: "https://o0" }, // 0d
      { direction: "outbound", subject: "Msg 1", preview: "p", receivedAt: at(5),  webLink: "https://o1" }, // 5d  (≤7)
      { direction: "inbound",  subject: "Msg 2", preview: "p", receivedAt: at(9),  webLink: "https://o2" }, // 9d  (≤14)
      { direction: "outbound", subject: "Msg 3", preview: "p", receivedAt: at(15), webLink: "https://o3" }, // 15d (≤21)
    ];
    render(<CommsPanel vendor={{ vendorName: "Walrus", attentionState: "ok", messageCount: 4, messages }} />);
    expect(WINDOW_DAYS).toBe(7);
    // window 1 (7d): only Msg 0 + Msg 1
    expect(screen.getByText("Msg 0")).toBeInTheDocument();
    expect(screen.getByText("Msg 1")).toBeInTheDocument();
    expect(screen.queryByText("Msg 2")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /show 7 more days/i })); // 14d → Msg 2 appears
    expect(screen.getByText("Msg 2")).toBeInTheDocument();
    expect(screen.queryByText("Msg 3")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /show 7 more days/i })); // 21d → Msg 3 appears, end
    expect(screen.getByText("Msg 3")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /more days/i })).not.toBeInTheDocument();
    expect(screen.getByText(/no older messages/i)).toBeInTheDocument();
  });
});
