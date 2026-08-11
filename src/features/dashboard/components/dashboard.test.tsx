import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { axe } from "vitest-axe";

import { Dashboard } from "./dashboard";
import type {
  Field,
  OpenItem,
  Return,
} from "@/features/returns/shared/returns";

const NOW = new Date("2026-08-08T00:00:00");

function lowConfidenceField(id: string): Field {
  return {
    id,
    label: id,
    value: 100,
    state: "needs-approval",
    sourceDocument: "1099-DIV",
    confidence: 0.5,
  };
}

function makeReturn(
  id: string,
  client: string,
  opts: {
    deadline: string;
    openItems?: OpenItem[];
    fields?: Field[];
  },
): Return {
  return {
    id,
    client,
    returnType: "Individual 1040",
    returnNumber: "RET-2024-001",
    ownerName: "Jordan Avery",
    taxYear: 2024,
    stage: "in-review",
    deadline: opts.deadline,
    openItems: opts.openItems ?? [],
    sections: [{ id: "income", title: "Income", fields: opts.fields ?? [] }],
  };
}

const returns: Return[] = [
  makeReturn("rtn-overdue", "Nguyen Family", {
    deadline: "2026-08-01",
    fields: [lowConfidenceField("f1")],
  }),
  makeReturn("rtn-blocked", "Owens Retail", {
    deadline: "2026-11-01",
    openItems: [{ id: "oi", label: "Waiting on client", owner: "client" }],
  }),
  makeReturn("rtn-calm", "Underwood Estate", { deadline: "2026-11-01" }),
];

/** Rows are router links, so the dashboard needs a router in scope. */
function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard returns={returns} now={NOW} />
    </MemoryRouter>,
  );
}

describe("Dashboard", () => {
  it("groups Returns into Needs you now / Waiting on others / On track", () => {
    renderDashboard();

    expect(
      screen.getByRole("heading", { name: /Needs you now/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Waiting on others/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /On track/i }),
    ).toBeInTheDocument();
  });

  it("renders a row per Return with Stage, Open Item, and low-Confidence stats", () => {
    renderDashboard();

    // Each row is a link whose accessible name summarizes its stats.
    const overdue = screen.getByRole("link", { name: /Nguyen Family/i });
    expect(overdue).toHaveAccessibleName(/In review/i);
    expect(overdue).toHaveAccessibleName(/Overdue/i);
    expect(overdue).toHaveAccessibleName(/1 low-Confidence Field/i);

    const blocked = screen.getByRole("link", { name: /Owens Retail/i });
    expect(blocked).toHaveAccessibleName(/1 Open Item/i);
  });

  it("links each row to the Return's review URL (deep-linkable)", () => {
    renderDashboard();

    expect(
      screen.getByRole("link", { name: /Nguyen Family/i }),
    ).toHaveAttribute("href", "/returns/rtn-overdue");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderDashboard();

    expect(await axe(container)).toHaveNoViolations();
  });
});
