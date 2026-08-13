import * as React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { axe } from "vitest-axe";

import { ReturnReview, returnReducer } from "./return-review";
import { getReturn } from "@/mocks/returns";

const taxReturn = getReturn("rtn-reyes-2024")!;

/** Owns the review working copy the way the real workspace does (#5), so edits stick. */
function ReviewHarness() {
  const [reviewed, dispatch] = React.useReducer(returnReducer, taxReturn);
  return (
    <main>
      <h1>Return</h1>
      <ReturnReview return={reviewed} onAction={dispatch} />
    </main>
  );
}

function renderInPage() {
  return render(
    <MemoryRouter>
      <ReviewHarness />
    </MemoryRouter>,
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

    // Escape returns to the Return: the card is gone and the Preparer's place —
    // the same Field row, still reviewable — is intact. Where keyboard focus lands
    // is left to the primitives (dialog focus-return vs. the URL-focus effect).
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(fieldButton).toBeInTheDocument();
  });

  it("has no accessibility violations while the Provenance card is open", async () => {
    const user = userEvent.setup();
    renderInPage();

    await user.click(
      screen.getByRole("button", { name: /Review Taxable interest/ }),
    );

    // Radix portals the dialog to the body, outside the render container.
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("ReturnReview — map browse vs. inspect", () => {
  it("selecting a Field in the Return map browses it in the pane — no Provenance dialog", async () => {
    const user = userEvent.setup();
    renderInPage();

    const map = screen.getByRole("region", { name: "Return map" });
    // The map opens on the first visible item (Wages).
    expect(
      within(map).getByRole("heading", { name: "Wages, tips, other comp" }),
    ).toBeInTheDocument();

    await user.click(
      within(map).getByRole("button", { name: /Taxable interest/ }),
    );

    // Browsing: the detail pane switches to the clicked Field, and the modal
    // never appears.
    expect(
      within(map).getByRole("heading", { name: "Taxable interest" }),
    ).toBeInTheDocument();
    expect(
      within(map).queryByRole("heading", { name: "Wages, tips, other comp" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the Provenance dialog from the map's explicit Open field evidence action", async () => {
    const user = userEvent.setup();
    renderInPage();

    const map = screen.getByRole("region", { name: "Return map" });
    await user.click(
      within(map).getByRole("button", { name: /Open field evidence/ }),
    );

    expect(
      screen.getByRole("dialog", { name: "Wages, tips, other comp" }),
    ).toBeInTheDocument();
  });

  it("closing Provenance returns the map to that Field, not the top of the list", async () => {
    const user = userEvent.setup();
    renderInPage();

    const map = screen.getByRole("region", { name: "Return map" });
    // Browse to a non-top Field, then inspect it explicitly.
    await user.click(
      within(map).getByRole("button", { name: /Taxable interest/ }),
    );
    await user.click(
      within(map).getByRole("button", { name: /Open field evidence/ }),
    );
    const card = screen.getByRole("dialog", { name: "Taxable interest" });
    expect(card).toBeInTheDocument();

    await user.click(within(card).getByRole("button", { name: "Close" }));

    // The pane still shows the inspected Field — no jump back to Wages.
    expect(
      within(map).getByRole("heading", { name: "Taxable interest" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
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
    await user.click(within(card).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const note = screen.getByText(/AI said/);
    expect(note).toHaveTextContent("AI said $1,000 · you changed to $1,250");
  });
});
