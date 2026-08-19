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
    // The open Return is a labelled group now; its default Overview Area is the
    // current destination.
    expect(
      within(
        screen.getByRole("navigation", { name: "Reyes Household · 2024 Areas" }),
      ).getByRole(
        "link",
        { name: "Overview" },
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

  it("renders the firm-wide Documents pool at /documents", () => {
    renderAt("/documents");

    expect(
      screen.getByRole("heading", { level: 1, name: "Documents" }),
    ).toBeInTheDocument();
    // A sortable table pooling Source Documents across every Return, with clients named.
    const table = screen.getByRole("table");
    expect(
      within(table).getByRole("columnheader", { name: /Client \/ Return/i }),
    ).toBeInTheDocument();
    // Each row deep-links into its Return, so the page (client A→Z) shows client links.
    expect(within(table).getAllByRole("link").length).toBeGreaterThan(0);
    // The pool runs past one page, so a pager is offered.
    expect(
      screen.getByRole("navigation", { name: /pagination/i }),
    ).toBeInTheDocument();
  });

  it("pages the Documents pool", async () => {
    const user = userEvent.setup();
    renderAt("/documents");

    // Default page shows the first slice; Reyes (client R) isn't on page 1.
    expect(
      screen.queryByRole("link", { name: /Reyes Household/i }),
    ).not.toBeInTheDocument();

    // Advancing pages reveals later clients.
    await user.click(screen.getByRole("link", { name: /Go to page 3/i }));
    expect(
      screen.getAllByRole("link", { name: /Reyes Household/i }).length,
    ).toBeGreaterThan(0);
  });

  it("sorts the Documents pool when a column header is clicked", async () => {
    const user = userEvent.setup();
    renderAt("/documents");

    const clientHeader = screen.getByRole("button", {
      name: /Client \/ Return/i,
    });
    // Default is client ascending; one click flips it to descending.
    await user.click(clientHeader);
    expect(
      screen.getByRole("columnheader", { name: /Client \/ Return/i }),
    ).toHaveAttribute("aria-sort", "descending");
  });

  it("renders the firm-wide Messages pool at /messages", () => {
    renderAt("/messages");

    expect(
      screen.getByRole("heading", { level: 1, name: "Messages" }),
    ).toBeInTheDocument();
    // A sortable table pooling Threads across every Return, with clients named.
    const table = screen.getByRole("table");
    expect(
      within(table).getByRole("columnheader", { name: /Client \/ Return/i }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: /Next action/i }),
    ).toBeInTheDocument();
    // The Thread noun is the column label, never the banned "conversation".
    expect(
      within(table).getByRole("columnheader", { name: "Thread" }),
    ).toBeInTheDocument();
    expect(within(table).getAllByRole("link").length).toBeGreaterThan(0);
    // A Thread carrying both audiences reads "Mixed", not a collapsed
    // "Client-visible": 3 seeded mixed Threads, 1 all-Internal (Okafor).
    expect(within(table).getAllByText("Mixed")).toHaveLength(3);
    expect(within(table).getAllByText("Internal")).toHaveLength(1);
  });

  it("sorts the Messages pool when a column header is clicked", async () => {
    const user = userEvent.setup();
    renderAt("/messages");

    const updatedHeader = screen.getByRole("button", {
      name: /Last activity/i,
    });
    // Default is most-recent-activity-first (descending); already active.
    expect(
      screen.getByRole("columnheader", { name: /Last activity/i }),
    ).toHaveAttribute("aria-sort", "descending");
    await user.click(updatedHeader);
    expect(
      screen.getByRole("columnheader", { name: /Last activity/i }),
    ).toHaveAttribute("aria-sort", "ascending");
  });

  it("bounces a Client off /messages — a Client reads Messages on their own Return, not a firm-wide pool", () => {
    actingAs({ userId: "user-jordan", role: "individual-taxpayer" });
    renderAt("/messages");

    expect(
      screen.getByRole("heading", { level: 1, name: "Your return" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 1, name: "Messages" }),
    ).not.toBeInTheDocument();
  });

  it("bounces a Client off /documents — there is no firm-wide pool for one Return", () => {
    actingAs({ userId: "user-jordan", role: "individual-taxpayer" });
    renderAt("/documents");

    // Same redirect shape as the /returns roster: a Client lands on their home.
    expect(
      screen.getByRole("heading", { level: 1, name: "Your return" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 1, name: "Documents" }),
    ).not.toBeInTheDocument();
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
