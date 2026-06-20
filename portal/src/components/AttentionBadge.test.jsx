import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AttentionBadge from "./AttentionBadge.jsx";

describe("AttentionBadge", () => {
  it("renders for awaiting-our-reply", () => {
    render(<AttentionBadge state="awaiting-our-reply" />);
    expect(screen.getByText(/awaiting reply/i)).toBeInTheDocument();
  });
  it("renders nothing for ok/none", () => {
    const { container } = render(<AttentionBadge state="ok" />);
    expect(container.firstChild).toBeNull();
  });
});
