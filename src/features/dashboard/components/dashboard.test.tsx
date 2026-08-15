import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
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
    openItems: [
      { id: "t1", label: "Send reviewer handoff", owner: "preparer" },
    ],
  }),
  makeReturn("rtn-blocked", "Owens Retail", {
    deadline: "2026-11-01",
    openItems: [{ id: "r1", label: "Waiting on client", owner: "client" }],
  }),
  makeReturn("rtn-calm", "Underwood Estate", { deadline: "2026-11-01" }),
];

/** Rows and the action list are router links, so a router is in scope. */
function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard returns={returns} now={NOW} greetingName="Jordan" />
    </MemoryRouter>,
  );
}

describe("Dashboard", () => {
  it("greets the preparer and shows the four practice-wide stat tiles", () => {
    renderDashboard();

    // The greeting salutation tracks the wall clock (morning/afternoon/evening/
    // late-night), so assert it names the Preparer rather than a fixed time of day.
    expect(
      screen.getByRole("heading", { level: 2, name: /, Jordan\.$/ }),
    ).toBeInTheDocument();
    for (const label of [
      "Active returns",
      "Open items",
      "Needs review",
      "Requests",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("ranks the preparer's own work across every Return and deep-links each into its Area", () => {
    renderDashboard();

    expect(
      screen.getByRole("heading", { name: /Work that needs you/i }),
    ).toBeInTheDocument();

    // Both a low-confidence batch and a preparer Open Item open the review
    // workspace (Overview) — where the work actually happens, never a dead-end.
    expect(
      screen.getByRole("link", { name: /Review 1 low-confidence value/i }),
    ).toHaveAttribute("href", "/returns/rtn-overdue?area=overview");
    expect(
      screen.getByRole("link", { name: /Send reviewer handoff/i }),
    ).toHaveAttribute("href", "/returns/rtn-overdue?area=overview");

    // The Client-owned Request is waiting on the Client, so it's not framed as the
    // Preparer's work — it never appears in "Work that needs you".
    expect(
      screen.queryByRole("link", { name: /Waiting on client/i }),
    ).not.toBeInTheDocument();
  });

  it("lists returns in the queue table, each linking to its review", () => {
    renderDashboard();

    const queue = screen.getByRole("region", { name: /Return queue/i });
    expect(
      within(queue).getByRole("link", { name: /Nguyen Family/i }),
    ).toHaveAttribute("href", "/returns/rtn-overdue");
    expect(
      within(queue).getByRole("link", { name: /Underwood Estate/i }),
    ).toHaveAttribute("href", "/returns/rtn-calm");
  });

  it("surfaces the AI's review signals at the landing level", () => {
    renderDashboard();

    expect(
      screen.getByRole("heading", { name: /What the AI wants you to check/i }),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderDashboard();

    expect(await axe(container)).toHaveNoViolations();
  });
});
