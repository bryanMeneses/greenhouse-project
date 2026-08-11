import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";

import { ReturnStatus } from "./return-status";
import type { OpenItem, Return } from "@/features/returns/shared/returns";

function makeReturn(opts: {
  stage?: Return["stage"];
  deadline?: string;
  openItems?: OpenItem[];
}): Return {
  return {
    id: "test-return",
    client: "Test Client",
    returnType: "Individual 1040",
    returnNumber: "RET-2024-001",
    ownerName: "Jordan Avery",
    taxYear: 2024,
    stage: opts.stage ?? "in-review",
    deadline: opts.deadline ?? "2026-09-15",
    openItems: opts.openItems ?? [],
    sections: [],
  };
}

describe("ReturnStatus (client)", () => {
  it("shows the stepper with audience-adapted labels", () => {
    render(<ReturnStatus taxReturn={makeReturn({ stage: "in-review" })} />);

    expect(screen.getByText("Getting started")).toBeInTheDocument();
    expect(screen.getByText("In review")).toBeInTheDocument();
    expect(screen.getByText("Ready to file")).toBeInTheDocument();
    expect(screen.getByText("Filed")).toBeInTheDocument();
  });

  it("shows reassurance when nothing is on the client", () => {
    render(<ReturnStatus taxReturn={makeReturn({})} />);

    expect(
      screen.getByText(/Nothing needs your attention right now/i),
    ).toBeInTheDocument();
  });

  it("shows a blocking callout when client-owned items exist", () => {
    render(
      <ReturnStatus
        taxReturn={makeReturn({
          openItems: [
            { id: "oi", label: "Sign the engagement letter", owner: "client" },
          ],
        })}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/We need this from you/i)).toBeInTheDocument();
    // The action appears once, in the blocking callout (the single primary next
    // action) — not duplicated in a separate list.
    expect(screen.getAllByText("Sign the engagement letter")).toHaveLength(1);
  });

  it("never leaks the preparer's internal open items to the client", () => {
    render(
      <ReturnStatus
        taxReturn={makeReturn({
          openItems: [
            {
              id: "p",
              label: "Reconcile interest across both 1099-INTs",
              owner: "preparer",
            },
          ],
        })}
      />,
    );

    // Firm-internal task labels must not cross the client boundary (challenge 06:
    // don't expose unnecessary internal complexity to the client).
    expect(screen.queryByText(/Reconcile interest/i)).not.toBeInTheDocument();
  });

  it("shows the blocking callout as primary next action when client has open items", () => {
    render(
      <ReturnStatus
        taxReturn={makeReturn({
          openItems: [{ id: "oi", label: "Upload your W-2", owner: "client" }],
        })}
      />,
    );

    // The blocking callout is the primary "what's next" for the client.
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/We need this from you/i)).toBeInTheDocument();
  });

  it("shows the empty state when no return exists", () => {
    render(<ReturnStatus taxReturn={undefined} />);

    expect(
      screen.getByText(/don't have a return in progress yet/i),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <ReturnStatus
        taxReturn={makeReturn({
          stage: "in-review",
          openItems: [
            {
              id: "oi-1",
              label: "Sign the engagement letter",
              owner: "client",
            },
            {
              id: "oi-2",
              label: "Review the dividend amount",
              owner: "preparer",
            },
          ],
        })}
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations in the empty state", async () => {
    const { container } = render(<ReturnStatus taxReturn={undefined} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
