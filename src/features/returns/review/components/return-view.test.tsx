import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { axe } from "vitest-axe";

import { ReturnView } from "./return-view";
import { getReturn } from "@/mocks/returns";
import {
  FIELD_STATES,
  FIELD_STATE_CONFIG,
  type FieldState,
} from "@/features/returns/shared/field-state";

const taxReturn = getReturn("rtn-reyes-2024")!;

/** ReturnView always lives under the AppShell's h1; mirror that so a11y checks are honest. */
function renderInPage(ui: React.ReactNode) {
  return render(
    <main>
      <h1>Return</h1>
      {ui}
    </main>,
  );
}

describe("ReturnView", () => {
  it("groups Fields into sections", () => {
    renderInPage(<ReturnView return={taxReturn} />);

    for (const section of taxReturn.sections) {
      expect(
        screen.getByRole("heading", { level: 2, name: section.title }),
      ).toBeInTheDocument();
    }
  });

  it("renders every seeded Field", () => {
    renderInPage(<ReturnView return={taxReturn} />);

    const allFields = taxReturn.sections.flatMap((s) => s.fields);
    for (const field of allFields) {
      expect(screen.getByText(field.label)).toBeInTheDocument();
    }
  });

  it("represents all five Field States, each visibly distinct", () => {
    renderInPage(<ReturnView return={taxReturn} />);

    const seededStates = new Set<FieldState>(
      taxReturn.sections.flatMap((s) => s.fields).map((f) => f.state),
    );
    // The seed data must exercise the whole vocabulary.
    for (const state of FIELD_STATES) {
      expect(seededStates.has(state)).toBe(true);
      // ...and each state's treatment must be on screen at least once.
      expect(
        screen.getAllByText(FIELD_STATE_CONFIG[state].label).length,
      ).toBeGreaterThan(0);
    }
  });

  it("explains why locked Fields can't be changed", () => {
    renderInPage(<ReturnView return={taxReturn} />);

    const lockedFields = taxReturn.sections
      .flatMap((s) => s.fields)
      .filter((f) => f.state === "locked");

    expect(lockedFields.length).toBeGreaterThan(0);
    for (const field of lockedFields) {
      expect(screen.getByText(field.lockedReason!)).toBeInTheDocument();
    }
  });

  it("makes editable Fields editable and other Fields inspectable", () => {
    renderInPage(<ReturnView return={taxReturn} />);

    // Editable Fields expose a real input (labelled by the Field label).
    expect(
      screen.getByRole("textbox", { name: "State & local taxes" }),
    ).toBeInTheDocument();

    // Inspectable Fields expose a button, not an editable input.
    expect(
      screen.getByRole("button", { name: /Review Taxable interest/ }),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderInPage(<ReturnView return={taxReturn} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("FieldRow (via ReturnView)", () => {
  it("shows each Field's source document", () => {
    renderInPage(<ReturnView return={taxReturn} />);
    const wages = taxReturn.sections[0].fields[0];
    // Wages and Federal withholding share a Source Document, so expect at least one.
    expect(
      within(document.body).getAllByText(wages.sourceDocument).length,
    ).toBeGreaterThan(0);
  });
});
