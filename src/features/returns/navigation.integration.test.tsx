import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";

import { routes } from "@/app/router";

describe("Firm Provenance back behavior", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Jordan acting as Preparer — the firm review workspace.
    localStorage.setItem(
      "greenhouse:active-role",
      JSON.stringify({ userId: "user-jordan", role: "preparer" }),
    );
  });

  it("closing the Provenance card replaces its history entry, so Back does not reopen it", async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(routes, {
      initialEntries: ["/returns/rtn-reyes-2024"],
    });
    render(<RouterProvider router={router} />);

    // Open a Field's Provenance card — a deep link (history push).
    await user.click(
      screen.getByRole("button", { name: "Review Ordinary dividends" }),
    );
    const card = screen.getByRole("dialog", { name: "Ordinary dividends" });
    expect(card).toBeInTheDocument();

    // Close it — this must replace the open entry, not push another one.
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Browser Back retraces to the pre-open entry — the card must NOT reappear.
    await router.navigate(-1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("Client connective navigation", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem(
      "greenhouse:active-role",
      JSON.stringify({ userId: "user-jordan", role: "individual-taxpayer" }),
    );
  });

  it("follows a Request to its Thread and back, with the Trail tracking each step", async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });
    render(<RouterProvider router={router} />);

    await user.click(screen.getByRole("button", { name: /Upload Form 1098/i }));
    await user.click(screen.getByRole("button", { name: "Upload document" }));
    await user.click(screen.getByRole("button", { name: /Confirm details/i }));
    await user.click(screen.getByRole("button", { name: "Save answers" }));
    await user.click(screen.getByRole("button", { name: /View your return/i }));

    // Tasks → follow the Request's Connection to its Thread (the Messages Area).
    await user.click(screen.getByRole("link", { name: "Tasks" }));
    await user.click(
      screen.getByRole("link", {
        name: /Thread: Requesting your Form 1098/i,
      }),
    );

    expect(
      screen.getByRole("heading", { name: /Requesting your Form 1098/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Trail" })).toHaveTextContent(
      /Messages.*Requesting your Form 1098/,
    );

    // The Thread links back to its Request — following it lands on the Tasks Area.
    await user.click(
      screen.getByRole("link", {
        name: /Request: 2024 Form 1098/i,
      }),
    );
    expect(screen.getByRole("navigation", { name: "Trail" })).toHaveTextContent(
      /Tasks.*2024 Form 1098/,
    );

    // The header's general Back retraces the step, restoring focus to the Thread
    // we came from.
    await user.click(screen.getByRole("button", { name: "Go back" }));
    expect(
      screen.getByRole("heading", { name: /Requesting your Form 1098/ }),
    ).toHaveFocus();
  });
});
