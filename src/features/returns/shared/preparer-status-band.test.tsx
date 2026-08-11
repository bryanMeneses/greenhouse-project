import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";

import { PreparerStatusBand } from "./preparer-status-band";
import type { OpenItem, Return } from "./returns";

function makeReturn(opts: {
  stage?: Return["stage"];
  deadline?: string;
  openItems?: OpenItem[];
}): Return {
  return {
    id: "test-return",
    client: "Test Client",
    taxYear: 2024,
    stage: opts.stage ?? "in-review",
    deadline: opts.deadline ?? "2026-09-15",
    openItems: opts.openItems ?? [],
    sections: [],
  };
}

describe("PreparerStatusBand", () => {
  it("shows the stepper with preparer-adapted labels", () => {
    render(<PreparerStatusBand taxReturn={makeReturn({ stage: "in-review" })} />);

    expect(screen.getByText("Intake")).toBeInTheDocument();
    expect(screen.getByText("In review")).toBeInTheDocument();
    expect(screen.getByText("Ready to file")).toBeInTheDocument();
    expect(screen.getByText("Filed")).toBeInTheDocument();
  });

  it("shows a blocking callout when client-owned items exist", () => {
    render(
      <PreparerStatusBand
        taxReturn={makeReturn({
          openItems: [
            { id: "oi", label: "Sign the engagement letter", owner: "client" },
          ],
        })}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Waiting on this client")).toBeInTheDocument();
  });

  it("shows preparer-owned open items", () => {
    render(
      <PreparerStatusBand
        taxReturn={makeReturn({
          openItems: [
            { id: "oi", label: "Reconcile interest", owner: "preparer" },
          ],
        })}
      />,
    );

    expect(screen.getByText("Your open items")).toBeInTheDocument();
    expect(screen.getByText("Reconcile interest")).toBeInTheDocument();
  });

  it("shows overdue deadline in destructive red", () => {
    render(
      <PreparerStatusBand
        taxReturn={makeReturn({
          deadline: "2026-08-01",
        })}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Overdue/i)).toBeInTheDocument();
  });

  it("shows near-deadline warning", () => {
    render(
      <PreparerStatusBand
        taxReturn={makeReturn({
          deadline: "2026-08-12",
        })}
      />,
    );

    expect(screen.getByText(/Due Aug 12/i)).toBeInTheDocument();
  });

  it("has no accessibility violations with blockers", async () => {
    const { container } = render(
      <PreparerStatusBand
        taxReturn={makeReturn({
          deadline: "2026-08-01",
          openItems: [
            { id: "oi-1", label: "Sign the engagement letter", owner: "client" },
            { id: "oi-2", label: "Reconcile interest", owner: "preparer" },
          ],
        })}
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations in clean state", async () => {
    const { container } = render(
      <PreparerStatusBand
        taxReturn={makeReturn({ deadline: "2026-10-15" })}
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
