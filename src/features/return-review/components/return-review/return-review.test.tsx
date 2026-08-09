import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";

import { ReturnReview } from "./return-review";
import { getReturn } from "@/features/return-review/model/returns";

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
