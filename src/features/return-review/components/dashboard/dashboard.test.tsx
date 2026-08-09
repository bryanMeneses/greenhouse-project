import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";

import { Dashboard } from "./dashboard";
import type {
  Field,
  OpenItem,
  Return,
} from "@/features/return-review/model/returns";

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

describe("Dashboard", () => {
  it("groups Returns into Needs you now / Waiting on others / On track", () => {
    render(<Dashboard returns={returns} now={NOW} onOpenReturn={vi.fn()} />);

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
    render(<Dashboard returns={returns} now={NOW} onOpenReturn={vi.fn()} />);

    // Each row is a button whose accessible name summarizes its stats.
    const overdue = screen.getByRole("button", { name: /Nguyen Family/i });
    expect(overdue).toHaveAccessibleName(/In review/i);
    expect(overdue).toHaveAccessibleName(/Overdue/i);
    expect(overdue).toHaveAccessibleName(/1 low-Confidence Field/i);

    const blocked = screen.getByRole("button", { name: /Owens Retail/i });
    expect(blocked).toHaveAccessibleName(/1 Open Item/i);
  });

  it("opens the Return's review when its row is clicked", async () => {
    const onOpenReturn = vi.fn();
    render(
      <Dashboard returns={returns} now={NOW} onOpenReturn={onOpenReturn} />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Nguyen Family/i }),
    );

    expect(onOpenReturn).toHaveBeenCalledWith("rtn-overdue");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Dashboard returns={returns} now={NOW} onOpenReturn={vi.fn()} />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
