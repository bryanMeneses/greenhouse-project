import type { ReactNode } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { axe } from "vitest-axe";

import { AppShell } from "./app-shell";

/** The sidebar's nav uses router links, so the shell needs a router in scope. */
function renderAt(pathname: string, ui: ReactNode) {
  return render(<MemoryRouter initialEntries={[pathname]}>{ui}</MemoryRouter>);
}

describe("AppShell", () => {
  it("renders the primary navigation, the title, and its content", () => {
    renderAt(
      "/",
      <AppShell title="Dashboard">
        <p>Return list goes here</p>
      </AppShell>,
    );

    expect(
      screen.getByRole("navigation", { name: /primary/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Return list goes here")).toBeInTheDocument();
  });

  it("marks Dashboard as the current page on the landing route", () => {
    renderAt(
      "/",
      <AppShell title="Dashboard">
        <p>content</p>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("keeps Dashboard current while drilled into a Return's review", () => {
    renderAt(
      "/returns/rtn-reyes-2024",
      <AppShell title="Reyes Household · 2024 Return">
        <p>content</p>
      </AppShell>,
    );

    // The review is a drill-in from the dashboard, so Dashboard stays current.
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("shows Review Queue as a disabled hint, not a link", () => {
    renderAt(
      "/",
      <AppShell title="Dashboard">
        <p>content</p>
      </AppShell>,
    );

    // Not built as a global surface yet — present, but not navigable.
    expect(
      screen.queryByRole("link", { name: /Review Queue/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Review Queue").closest("[aria-disabled]"),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderAt(
      "/",
      <AppShell title="Dashboard">
        <p>content</p>
      </AppShell>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
