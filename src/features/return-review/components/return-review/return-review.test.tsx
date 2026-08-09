import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";

import { ReturnReview } from "./return-review";
import { getReturn } from "@/features/returns/model/returns";

const taxReturn = getReturn("rtn-reyes-2024")!;

function renderInPage() {
  return render(
    <main>
      <h1>Return</h1>
      <ReturnReview return={taxReturn} />
    </main>,
  );
}

describe("ReturnReview — source traceability", () => {
  it("opens a Provenance card showing source and calculation when a Field is clicked", async () => {
    const user = userEvent.setup();
    renderInPage();

    // No provenance is shown until a Field is clicked.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Review Taxable interest/ }),
    );

    const card = screen.getByRole("dialog", { name: "Taxable interest" });
    // Source Documents behind the value...
    expect(
      within(card).getByText("1099-INT (First National)"),
    ).toBeInTheDocument();
    expect(
      within(card).getByText("1099-INT (Second National)"),
    ).toBeInTheDocument();
    // ...and the calculation that combined them.
    expect(within(card).getByText(/\$904 \+ \$300/)).toBeInTheDocument();
  });

  it("docks the document beside the card, then closing preserves the Preparer's place", async () => {
    const user = userEvent.setup();
    renderInPage();

    const fieldButton = screen.getByRole("button", {
      name: /Review Taxable interest/,
    });
    await user.click(fieldButton);

    const card = screen.getByRole("dialog");
    await user.click(
      within(card).getAllByRole("button", { name: "View in document" })[0],
    );

    // The document is docked in the same dialog — the card did not go away.
    expect(within(card).getByText(/\$904 \+ \$300/)).toBeInTheDocument();
    expect(
      within(card).getByRole("region", {
        name: /1099-INT \(First National\), page 1/,
      }),
    ).toBeInTheDocument();

    // Escape returns to the Return: no dialog, focus back on the Field clicked.
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(fieldButton).toHaveFocus();
  });

  it("has no accessibility violations while the Provenance card is open", async () => {
    const user = userEvent.setup();
    const { container } = renderInPage();

    await user.click(
      screen.getByRole("button", { name: /Review Taxable interest/ }),
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("ReturnReview — trust & correction", () => {
  it("gathers exactly the low-Confidence Fields into the Review Queue", () => {
    renderInPage();

    const queue = screen.getByRole("region", { name: "Review Queue" });
    expect(within(queue).getByText("Ordinary dividends")).toBeInTheDocument();
    expect(within(queue).getByText("Education credit")).toBeInTheDocument();
    // A High-Confidence Field is not in the queue.
    expect(within(queue).queryByText("Wages, tips, other comp")).toBeNull();
    expect(within(queue).getByText("0 of 2 reviewed")).toBeInTheDocument();
  });

  it("works a Field through the queue: accepting it advances progress", async () => {
    const user = userEvent.setup();
    renderInPage();

    const queue = screen.getByRole("region", { name: "Review Queue" });
    await user.click(
      within(queue).getByRole("button", { name: "Review Ordinary dividends" }),
    );

    // The Provenance card opens on that Field; accept it.
    const card = screen.getByRole("dialog", { name: "Ordinary dividends" });
    await user.click(within(card).getByRole("button", { name: /Accept/ }));

    // Progress advances and the Field is now verified in the queue.
    expect(within(queue).getByText("1 of 2 reviewed")).toBeInTheDocument();
    expect(
      within(queue).queryByRole("button", {
        name: "Review Ordinary dividends",
      }),
    ).not.toBeInTheDocument();
  });

  it("edits a Field's value and keeps the AI's original visible on the Return", async () => {
    const user = userEvent.setup();
    renderInPage();

    const queue = screen.getByRole("region", { name: "Review Queue" });
    await user.click(
      within(queue).getByRole("button", { name: "Review Education credit" }),
    );
    const card = screen.getByRole("dialog", { name: "Education credit" });

    await user.click(within(card).getByRole("button", { name: /Edit/ }));
    const input = within(card).getByLabelText("Correct the value");
    await user.clear(input);
    await user.type(input, "1250");
    await user.click(within(card).getByRole("button", { name: "Save" }));

    // Close the card and read the Return: both values are shown on the row.
    await user.click(
      within(card).getByRole("button", { name: "Close provenance" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const note = screen.getByText(/AI said/);
    expect(note).toHaveTextContent("AI said $1,000 · you changed to $1,250");
  });
});
