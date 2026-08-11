import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";

import { routes } from "./router";
import type { ActiveRole } from "@/lib/roles";

/** Mount the real route tree at a starting URL, as a deep link would. */
function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

/** Boot the app as a given active Role by seeding the store RoleProvider reads. */
function actingAs(activeRole: ActiveRole) {
  localStorage.setItem("greenhouse:active-role", JSON.stringify(activeRole));
}

describe("router", () => {
  // The active Role persists to localStorage; reset it so each test starts fresh.
  beforeEach(() => localStorage.clear());

  it("renders the dashboard at /", () => {
    renderAt("/");

    expect(
      screen.getByRole("heading", { level: 1, name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Needs you now/i }),
    ).toBeInTheDocument();
  });

  it("deep-links straight to a Return's review at /returns/:id", () => {
    renderAt("/returns/rtn-reyes-2024");

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Reyes Household · 2024 Return/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Review Queue" }),
    ).toBeInTheDocument();
    // The sidebar keeps Dashboard current while drilled into a Return.
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("navigates from a dashboard row to that Return and back", async () => {
    const user = userEvent.setup();
    renderAt("/");

    await user.click(screen.getByRole("link", { name: /Reyes Household/i }));

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Reyes Household · 2024 Return/,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /Back to dashboard/i }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Dashboard" }),
    ).toBeInTheDocument();
  });

  it("shows a graceful not-found for an unknown Return id", () => {
    renderAt("/returns/does-not-exist");

    expect(
      screen.getByRole("heading", { level: 1, name: "Return not found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Back to dashboard/i }),
    ).toBeInTheDocument();
  });

  it("redirects the bare /returns path to the dashboard", async () => {
    renderAt("/returns");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Dashboard" }),
    ).toBeInTheDocument();
  });

  it("renders the client landing at / for a Client Role", () => {
    actingAs({ userId: "user-jordan", role: "individual-taxpayer" });
    renderAt("/");

    // Same URL, different active Role: the Client sees their return, not the CPA
    // dashboard.
    expect(
      screen.getByRole("heading", { level: 1, name: "Your return" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Your 2024 return/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Needs you now/i }),
    ).not.toBeInTheDocument();
  });

  it("gates the return review from a Client Role with an explicit state", () => {
    actingAs({ userId: "user-jordan", role: "individual-taxpayer" });
    renderAt("/returns/rtn-reyes-2024");

    // A Client deep-linking a Firm-only workspace gets a clear "not available"
    // state and a way home — not a bare 404 or a silent redirect.
    expect(
      screen.getByRole("heading", { level: 1, name: "Not available" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/preparer workspace/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Go to home/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Review Queue" }),
    ).not.toBeInTheDocument();
  });
});
