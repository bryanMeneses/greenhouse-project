import type { ReactNode } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { axe } from "vitest-axe";

import { InternalLayout } from "./internal-layout";
import { ClientLayout } from "./client-layout";
import { RoleProvider } from "@/app/providers";

/**
 * The layouts render router state (nav links) and the header role switcher, so a
 * router and a RoleProvider are in scope. Which nav shows is decided by the layout
 * (the audience fork) — not by the active Role — so these tests don't pin one.
 */
function renderAt(pathname: string, ui: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <RoleProvider>{ui}</RoleProvider>
    </MemoryRouter>,
  );
}

describe("InternalLayout", () => {
  it("renders the primary navigation, the title, and its content", () => {
    renderAt(
      "/",
      <InternalLayout title="Dashboard">
        <p>Return list goes here</p>
      </InternalLayout>,
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
      <InternalLayout title="Dashboard">
        <p>content</p>
      </InternalLayout>,
    );

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("keeps Dashboard current while drilled into a Return's review", () => {
    renderAt(
      "/returns/rtn-reyes-2024",
      <InternalLayout title="Reyes Household · 2024 Return">
        <p>content</p>
      </InternalLayout>,
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
      <InternalLayout title="Dashboard">
        <p>content</p>
      </InternalLayout>,
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
      <InternalLayout title="Dashboard">
        <p>content</p>
      </InternalLayout>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("ClientLayout", () => {
  it("shows the client nav — not the firm Dashboard or Review Queue", () => {
    renderAt(
      "/",
      <ClientLayout title="Your return">
        <p>content</p>
      </ClientLayout>,
    );

    // A Client sees their own single entry — not the firm's Dashboard or the
    // firm-only Review Queue hint.
    expect(screen.getByRole("link", { name: "My Return" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Dashboard" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Review Queue")).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderAt(
      "/",
      <ClientLayout title="Your return">
        <p>content</p>
      </ClientLayout>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
