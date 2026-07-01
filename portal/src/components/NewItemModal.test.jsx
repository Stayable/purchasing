// portal/src/components/NewItemModal.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewItemModal from "./NewItemModal.jsx";
import * as api from "../api.js";

describe("NewItemModal", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("disables submit until required fields are filled", () => {
    render(<NewItemModal onClose={() => {}} onCreated={() => {}} />);
    expect(screen.getByRole("button", { name: /create item/i })).toBeDisabled();
  });

  it("submits mapped payload and calls onCreated", async () => {
    const spy = vi.spyOn(api, "createItem").mockResolvedValue({ ok: true, id: "123" });
    const onCreated = vi.fn();
    render(<NewItemModal onClose={() => {}} onCreated={onCreated} />);
    fireEvent.change(screen.getByLabelText(/item name/i), { target: { value: "Queen Mattress" } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: "FF&E" } });
    fireEvent.change(screen.getByLabelText(/property/i), { target: { value: "Lakeland (4645)" } });
    fireEvent.change(screen.getByLabelText(/target quantity/i), { target: { value: "120" } });
    fireEvent.change(screen.getByLabelText(/specs/i), { target: { value: "contract grade" } });
    fireEvent.click(screen.getByRole("button", { name: /create item/i }));
    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      name: "Queen Mattress", category: "FF&E", property: "Lakeland (4645)", targetQty: "120", description: "contract grade",
    }));
  });
});
