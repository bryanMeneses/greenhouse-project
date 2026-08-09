import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";

import { ConfidenceBand } from "./confidence-band";

describe("ConfidenceBand", () => {
  it("shows the band label for the confidence value", () => {
    render(<ConfidenceBand confidence={0.58} />);
    expect(screen.getByText(/Low Confidence/)).toBeInTheDocument();
  });

  it("keeps the exact percentage available to screen readers without hover", () => {
    render(<ConfidenceBand confidence={0.586} />);

    // Exact % rides along in an sr-only label, so it never depends on hover.
    expect(screen.getByText(/59%/)).toBeInTheDocument();
    // The band is the visible headline; the % is not printed inline.
    expect(screen.queryByText(/· 59%/)).not.toBeInTheDocument();
  });

  it("reveals the exact percentage in a tooltip on hover (hover mode)", async () => {
    const user = userEvent.setup();
    render(<ConfidenceBand confidence={0.586} />);

    // No tooltip until the Preparer hovers the band.
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    await user.hover(screen.getByText(/Low Confidence/));

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("59% Confidence");
  });

  it("prints the exact percentage inline, without a tooltip (inline mode)", () => {
    render(<ConfidenceBand confidence={0.586} percentDisplay="inline" />);

    expect(screen.getByText(/· 59%/)).toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("bands High/Medium/Low by the value", () => {
    const { rerender } = render(<ConfidenceBand confidence={0.95} />);
    expect(screen.getByText(/High Confidence/)).toBeInTheDocument();

    rerender(<ConfidenceBand confidence={0.8} />);
    expect(screen.getByText(/Medium Confidence/)).toBeInTheDocument();

    rerender(<ConfidenceBand confidence={0.5} />);
    expect(screen.getByText(/Low Confidence/)).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ConfidenceBand confidence={0.72} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
