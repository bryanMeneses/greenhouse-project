import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";

import { ProvenanceCard } from "./provenance-card";
import { getReturn } from "@/features/returns/model/returns";

const taxReturn = getReturn("rtn-reyes-2024")!;
const fields = taxReturn.sections.flatMap((s) => s.fields);
const identityField = fields.find((f) => f.id === "wages")!;
const summedField = fields.find((f) => f.id === "interest")!;
const lowConfidenceField = fields.find((f) => f.id === "education-credit")!;

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

    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("closes on a backdrop click", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderInPage(<ProvenanceCard field={identityField} onClose={onClose} />);

    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay).not.toBeNull();
    await user.click(overlay!);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("has no accessibility violations with the document docked", async () => {
    const user = userEvent.setup();
    renderInPage(<ProvenanceCard field={summedField} onClose={vi.fn()} />);

    await user.click(
      screen.getAllByRole("button", { name: "View in document" })[0],
    );

    // Radix portals the dialog to the body, outside the render container.
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("ProvenanceCard — trust & correction", () => {
  it("shows the Confidence band with the exact percentage and the AI's reasoning", () => {
    renderInPage(
      <ProvenanceCard field={lowConfidenceField} onClose={vi.fn()} />,
    );

    const dialog = screen.getByRole("dialog");
    // Band label plus the exact % (0.58 → 58%) printed inline on the card.
    expect(within(dialog).getByText(/Low Confidence/)).toBeInTheDocument();
    expect(within(dialog).getByText(/· 58%/)).toBeInTheDocument();
    // The AI's reasoning is summarised plainly.
    expect(
      within(dialog).getByText(/State University 1098-T/),
    ).toBeInTheDocument();
  });

  it("calls onAccept with the Field id", async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    renderInPage(
      <ProvenanceCard
        field={lowConfidenceField}
        onClose={vi.fn()}
        onAccept={onAccept}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Accept/ }));
    expect(onAccept).toHaveBeenCalledWith("education-credit");
  });

  it("calls onFlag with the Field id", async () => {
    const user = userEvent.setup();
    const onFlag = vi.fn();
    renderInPage(
      <ProvenanceCard
        field={lowConfidenceField}
        onClose={vi.fn()}
        onFlag={onFlag}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Flag/ }));
    expect(onFlag).toHaveBeenCalledWith("education-credit");
  });

  it("edits the value through an inline form, handing up the parsed amount", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    renderInPage(
      <ProvenanceCard
        field={lowConfidenceField}
        onClose={vi.fn()}
        onEdit={onEdit}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Edit/ }));

    const input = screen.getByLabelText("Correct the value");
    await user.clear(input);
    await user.type(input, "1250");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onEdit).toHaveBeenCalledWith("education-credit", 1250);
  });

  it("shows the AI's original value beside the correction", () => {
    // A Field the Preparer has already corrected: original $1,000 → $1,250.
    const correctedField = {
      ...lowConfidenceField,
      state: "verified" as const,
      correction: { value: 1250 },
    };
    renderInPage(<ProvenanceCard field={correctedField} onClose={vi.fn()} />);

    const dialog = screen.getByRole("dialog");
    // The note keeps the AI's original beside the Preparer's new value.
    const note = within(dialog).getByText(/AI said/);
    expect(note).toHaveTextContent("AI said $1,000 · you changed to $1,250");
    // The correction is the headline figure and also appears in the note.
    expect(within(dialog).getAllByText("$1,250")).toHaveLength(2);
  });

  it("has no accessibility violations with the correction actions present", async () => {
    renderInPage(
      <ProvenanceCard
        field={lowConfidenceField}
        onClose={vi.fn()}
        onAccept={vi.fn()}
        onEdit={vi.fn()}
        onFlag={vi.fn()}
      />,
    );

    // Radix portals the dialog to the body, outside the render container.
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
