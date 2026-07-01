// portal/src/components/NotificationBell.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotificationBell from "./NotificationBell.jsx";
import * as api from "../api.js";

function wrap(ui) { return <MemoryRouter>{ui}</MemoryRouter>; }

describe("NotificationBell", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("shows the unread badge from the API", async () => {
    vi.spyOn(api, "getNotifications").mockResolvedValue({
      items: [{ id: 1, type: "item_created", item_id: "9", title: "New item to source: Chairs", body: "b", read_at: null, created_at: new Date().toISOString() }],
      unread: 1,
    });
    render(wrap(<NotificationBell />));
    await waitFor(() => expect(screen.getByText("1")).toBeInTheDocument());
  });

  it("opens the panel and marks all read", async () => {
    vi.spyOn(api, "getNotifications").mockResolvedValue({
      items: [{ id: 1, type: "item_created", item_id: "9", title: "New item to source: Chairs", body: "b", read_at: null, created_at: new Date().toISOString() }],
      unread: 1,
    });
    const markSpy = vi.spyOn(api, "markNotificationsRead").mockResolvedValue({ ok: true });
    render(wrap(<NotificationBell />));
    await waitFor(() => expect(screen.getByText("1")).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText(/notifications/i));
    expect(await screen.findByText(/New item to source: Chairs/)).toBeInTheDocument();
    await waitFor(() => expect(markSpy).toHaveBeenCalledWith({ all: true }));
  });
});
