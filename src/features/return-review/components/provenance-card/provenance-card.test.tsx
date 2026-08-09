import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";

import { ProvenanceCard } from "./provenance-card";
import { getReturn } from "@/features/return-review/model/returns";

const taxReturn = getReturn("rtn-reyes-2024")!;
const fields = taxReturn.sections.flatMap((s) => s.fields);
const identityField = fields.find((f) => f.id === "wages")!;
const summedField = fields.find((f) => f.id === "interest")!;

/** The card always opens over the Return, which sits under the AppShell's h1. */
function renderInPage(ui: React.ReactNode) {
  return render(
    <main>
      <h1>Return</h1>
      {ui}
    </main>,
  );
}

describe("ProvenanceCard", () => {
  it("shows the Source Document, page/region, and snippet for an identity Field", () => {
    renderInPage(<ProvenanceCard field={identityField} onClose={vi.fn()} />);

    const dialog = screen.getByRole("dialog", {
      name: "Wages, tips, other comp",
    });
    expect(within(dialog).getByText("W-2 (Acme Corp)")).toBeInTheDocument();
    expect(within(dialog).getByText(/Page 1 · Box 1/)).toBeInTheDocument();
    expect(within(dialog).getByText(/84,250\.00/)).toBeInTheDocument();
  });

  it("lists each contribution and the calculation for a summed Field", () => {
    renderInPage(<ProvenanceCard field={summedField} onClose={vi.fn()} />);

    const dialog = screen.getByRole("dialog", { name: "Taxable interest" });
    expect(
      within(dialog).getByText("1099-INT (First National)"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("1099-INT (Second National)"),
    ).toBeInTheDocument();
    // The calculation is shown as each contribution joined.
    expect(within(dialog).getByText(/\$904 \+ \$300/)).toBeInTheDocument();
  });

  it("docks the Source Document beside the card without replacing it", async () => {
    const user = userEvent.setup();
    renderInPage(<ProvenanceCard field={summedField} onClose={vi.fn()} />);

    const dialog = screen.getByRole("dialog", { name: "Taxable interest" });
    // No document is shown until "View in document".
    expect(within(dialog).queryByRole("region")).not.toBeInTheDocument();

    await user.click(
      within(dialog).getAllByRole("button", { name: "View in document" })[0],
    );

    // The card content is still present...
    expect(
      within(dialog).getByText("1099-INT (Second National)"),
    ).toBeInTheDocument();
    // ...and the document is now docked in the same dialog, region highlighted.
    const docPane = within(dialog).getByRole("region", {
      name: /1099-INT \(First National\), page 1/,
    });
    const highlighted = within(docPane).getByText(/Box 1 — Interest income/);
    expect(highlighted.closest("[aria-current]")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("swaps the docked document when another contribution is chosen", async () => {
    const user = userEvent.setup();
    renderInPage(<ProvenanceCard field={summedField} onClose={vi.fn()} />);

    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getAllByRole("button", { name: "View in document" })[0],
    );
    expect(
      within(dialog).getByRole("region", { name: /First National/ }),
    ).toBeInTheDocument();

    // The remaining "View in document" button opens the second contribution.
    await user.click(
      within(dialog).getByRole("button", { name: "View in document" }),
    );
    expect(
      within(dialog).getByRole("region", { name: /Second National/ }),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("region", { name: /First National/ }),
    ).not.toBeInTheDocument();
  });

  it("hides the docked document when its toggle is pressed again", async () => {
    const user = userEvent.setup();
    renderInPage(<ProvenanceCard field={summedField} onClose={vi.fn()} />);

    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getAllByRole("button", { name: "View in document" })[0],
    );
    expect(
      within(dialog).getByRole("region", { name: /First National/ }),
    ).toBeInTheDocument();

    // The same contribution's button now hides the document.
    await user.click(
      within(dialog).getByRole("button", { name: "Hide document" }),
    );
    expect(within(dialog).queryByRole("region")).not.toBeInTheDocument();
  });

  it("closes on the close button and on Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderInPage(<ProvenanceCard field={identityField} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Close provenance" }));
    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("has no accessibility violations with the document docked", async () => {
    const user = userEvent.setup();
    const { container } = renderInPage(
      <ProvenanceCard field={summedField} onClose={vi.fn()} />,
    );

    await user.click(
      screen.getAllByRole("button", { name: "View in document" })[0],
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
