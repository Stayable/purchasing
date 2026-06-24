import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Shell from "./Shell.jsx";

const data = {
  viewer: "admin@rentstayable.com",
  items: [{ id: "i1", name: "Bath Towels", stage: "Bid", property: "Portfolio-wide", spend: 15000 }],
  quotes: [],
  counts: { Submitted: 0 },
  spend: { pendingSubmitted: 0, approvedTotal: 0, overHundredK: 0 },
};

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Shell data={data} reload={() => {}} />
    </MemoryRouter>
  );
}

describe("Shell routing", () => {
  it("renders Home at /", () => {
    renderAt("/");
    expect(screen.getByRole("heading", { name: "Stayable Procurement" })).toBeInTheDocument();
  });
  it("renders Tracker at /tracker", () => {
    renderAt("/tracker");
    expect(screen.getByRole("heading", { name: /Tracker/ })).toBeInTheDocument();
    expect(screen.getByText("Bath Towels")).toBeInTheDocument();
  });
  it("renders How it works at /how-it-works", () => {
    renderAt("/how-it-works");
    expect(screen.getByText(/Operating model/i)).toBeInTheDocument();
  });
  it("renders Architecture at /architecture", () => {
    renderAt("/architecture");
    expect(screen.getByText(/Three modules in Zoho/i)).toBeInTheDocument();
  });
  it("redirects unknown routes home", () => {
    renderAt("/nope");
    expect(screen.getByRole("heading", { name: "Stayable Procurement" })).toBeInTheDocument();
  });
});
