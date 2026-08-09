import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { axe } from "vitest-axe";

import { DocumentPane } from "./document-pane";
import { getReturn } from "@/features/return-review/model/returns";

const taxReturn = getReturn("rtn-reyes-2024")!;
const fields = taxReturn.sections.flatMap((s) => s.fields);
const wagesSource = fields.find((f) => f.id === "wages")!.sources![0];

function renderInPage(ui: React.ReactNode) {
  return render(
    <main>
      <h1>Return</h1>
      {ui}
    </main>,
  );
}

describe("DocumentPane", () => {
  it("renders the document facsimile and highlights the source region", () => {
    renderInPage(<DocumentPane source={wagesSource} />);

    const page = screen.getByRole("region", {
      name: /W-2 \(Acme Corp\), page 1/,
    });
    expect(within(page).getByText(/Page 1 of 1/)).toBeInTheDocument();

    // The extracted line is marked current; a neighbouring line is not.
    const highlighted = within(page).getByText(/Box 1 — Wages/);
    expect(highlighted.closest("[aria-current]")).toHaveAttribute(
      "aria-current",
      "true",
    );
    const other = within(page).getByText(/Box 3 — Social security/);
    expect(other.closest("[aria-current]")).toBeNull();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderInPage(<DocumentPane source={wagesSource} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
