import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";

import { routes } from "./router";

/** Mount the real route tree at a starting URL, as a deep link would. */
function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

describe("router", () => {
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
});
