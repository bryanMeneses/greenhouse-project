import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
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
  localStorage.setItem("ledgerline:active-role", JSON.stringify(activeRole));
}

describe("router", () => {
  // The active Role persists to localStorage; reset it so each test starts fresh.
  beforeEach(() => localStorage.clear());

  it("renders the Command center at /", () => {
    renderAt("/");

    expect(
      screen.getByRole("heading", { level: 1, name: "Command center" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Work that needs you/i }),
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
    // Point 1 IA: the open Return — not Command center — is the current
    // destination once you've drilled in, and its Areas fill the contextual tier.
    // (The breadcrumb also carries a Command center crumb, so scope to the nav.)
    expect(
      within(screen.getByRole("navigation", { name: "Primary" })).getByRole(
        "link",
        { name: "Command center" },
      ),
    ).not.toHaveAttribute("aria-current", "page");
    // The sidebar's Return link is the current destination; the breadcrumb also
    // carries a matching "Reyes Household · 2024" crumb, so scope to the primary nav.
    expect(
      within(screen.getByRole("navigation", { name: "Primary" })).getByRole(
        "link",
        { name: "Reyes Household · 2024" },
      ),
    ).toHaveAttribute("aria-current", "page");
  });

  it("navigates from a Return queue row to that Return and back", async () => {
    const user = userEvent.setup();
    renderAt("/");

    // Click the top-ranked row in the Command center's Return queue glance
    // (scoped to the table, so the header's "View all returns" link isn't picked).
    const queue = screen.getByRole("region", { name: /Return queue/i });
    const table = within(queue).getByRole("table");
    await user.click(within(table).getAllByRole("link")[0]);

    expect(
      screen.getByRole("heading", { level: 1, name: /· 2024 Return$/ }),
    ).toBeInTheDocument();

    // The Return breadcrumb's top-most crumb is the way back to the Command center.
    await user.click(
      within(screen.getByRole("navigation", { name: "Trail" })).getByRole(
        "link",
        { name: "Command center" },
      ),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Command center" }),
    ).toBeInTheDocument();
  });

  it("shows a graceful not-found for an unknown Return id", () => {
    renderAt("/returns/does-not-exist");

    expect(
      screen.getByRole("heading", { level: 1, name: "Return not found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Go to home/i }),
    ).toBeInTheDocument();
  });

  it("renders the firm Return roster at /returns", () => {
    renderAt("/returns");

    expect(
      screen.getByRole("heading", { level: 1, name: "Returns" }),
    ).toBeInTheDocument();
    // The roster groups by the same urgency buckets the Command center ranks by.
    expect(
      screen.getByRole("heading", { name: /Needs you now/i }),
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
    // The client sees the shared tracker with audience-adapted labels.
    expect(
      screen.getByRole("navigation", { name: /Return progress/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Getting started")).toBeInTheDocument();
    expect(screen.getByText("In review")).toBeInTheDocument();
    expect(screen.getByText("Ready to file")).toBeInTheDocument();
    // A new Client lands on the focused first-run checklist before collaboration
    // is introduced; the shared status remains visible as orientation.
    expect(
      screen.getByRole("heading", { name: /Let's get your return started/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Upload Form 1098/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Requests & Activity/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Needs you now/i }),
    ).not.toBeInTheDocument();
    // Day-one navigation defers messaging: the sidebar hints at it as unlocking
    // after setup rather than presenting it as somewhere to go now.
    expect(screen.getByText(/After setup/i)).toBeInTheDocument();
  });

  it("reveals the full Client workspace after first-run actions are complete", async () => {
    const user = userEvent.setup();
    actingAs({ userId: "user-jordan", role: "individual-taxpayer" });
    const view = renderAt("/");

    await user.click(screen.getByRole("button", { name: /Upload Form 1098/i }));
    await user.click(screen.getByRole("button", { name: "Upload document" }));
    await user.click(screen.getByRole("button", { name: /Confirm details/i }));
    await user.click(screen.getByRole("button", { name: "Save answers" }));
    await user.click(screen.getByRole("button", { name: /View your return/i }));

    expect(
      screen.queryByRole("heading", {
        name: /Let's get your return started/i,
      }),
    ).not.toBeInTheDocument();
    // The contextual tier, hidden during first-run, is now revealed — Messages is
    // its own Area (not bolted onto Overview), and Overview shows the return map.
    expect(screen.getByRole("link", { name: "Messages" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Your return at a glance" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Nothing needs your attention right now/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Requests & Activity/)).not.toBeInTheDocument();
    // The first-run "after setup" nav hint drops away once setup is done.
    expect(screen.queryByText(/After setup/i)).not.toBeInTheDocument();
    // Onboarding completion is session-only so the prototype can be replayed;
    // only the existing active-role preference remains in localStorage.
    expect(
      localStorage.getItem(
        "ledgerline:client-onboarding-complete:user-jordan:rtn-nguyen-2024",
      ),
    ).toBeNull();
    expect(localStorage.getItem("ledgerline:active-role")).toBe(
      JSON.stringify({ userId: "user-jordan", role: "individual-taxpayer" }),
    );

    // A fresh mount (the browser-reload equivalent) starts onboarding again.
    view.unmount();
    renderAt("/");
    expect(
      screen.getByRole("heading", { name: /Let's get your return started/i }),
    ).toBeInTheDocument();
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
