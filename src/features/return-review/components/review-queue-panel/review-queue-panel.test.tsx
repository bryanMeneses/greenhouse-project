import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";

import { ReviewQueuePanel } from "./review-queue-panel";
import type { Field } from "@/features/returns/model/returns";

const dividends: Field = {
  id: "dividends",
  label: "Ordinary dividends",
  value: 3410,
  state: "needs-approval",
  sourceDocument: "1099-DIV (Vanguard)",
  confidence: 0.64,
};

const educationCredit: Field = {
  id: "education-credit",
  label: "Education credit",
  value: 1000,
  state: "needs-approval",
  sourceDocument: "1098-T (State University)",
  confidence: 0.58,
};

describe("ReviewQueuePanel", () => {
  it("lists each queued Field with a Review action", () => {
    render(
      <ReviewQueuePanel
        fields={[dividends, educationCredit]}
        onReview={vi.fn()}
      />,
    );

    expect(screen.getByText("Ordinary dividends")).toBeInTheDocument();
    expect(screen.getByText("Education credit")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Review Ordinary dividends" }),
    ).toBeInTheDocument();
  });

  it("opens a Field for review with its id", async () => {
    const user = userEvent.setup();
    const onReview = vi.fn();
    render(
      <ReviewQueuePanel
        fields={[dividends, educationCredit]}
        onReview={onReview}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Review Education credit" }),
    );
    expect(onReview).toHaveBeenCalledWith("education-credit");
  });

  it("tracks progress and drops the Review action once a Field is verified", () => {
    render(
      <ReviewQueuePanel
        fields={[{ ...dividends, state: "verified" }, educationCredit]}
        onReview={vi.fn()}
      />,
    );

    expect(screen.getByText("1 of 2 reviewed")).toBeInTheDocument();
    // The verified Field shows its badge, not a Review button.
    expect(
      screen.queryByRole("button", { name: "Review Ordinary dividends" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Review Education credit" }),
    ).toBeInTheDocument();
  });

  it("renders nothing when the queue is empty", () => {
    const { container } = render(
      <ReviewQueuePanel fields={[]} onReview={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <ReviewQueuePanel
        fields={[dividends, educationCredit]}
        onReview={vi.fn()}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
