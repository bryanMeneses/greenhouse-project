import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";

import { ReturnReviewPage } from "./return-review-page";
import { RoleProvider } from "@/app/providers";

function renderPage() {
  return render(
    <RoleProvider>
      <MemoryRouter initialEntries={["/returns/rtn-nguyen-2024"]}>
        <Routes>
          <Route path="/returns/:returnId" element={<ReturnReviewPage />} />
        </Routes>
      </MemoryRouter>
    </RoleProvider>,
  );
}

describe("ReturnReviewPage — header + contextual Areas", () => {
  beforeEach(() => localStorage.clear());

  it("renders the return identity header", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Nguyen Family" }),
    ).toBeInTheDocument();
    expect(screen.getByText("RET-2024-011")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Individual 1040 · Tax year 2024 · Owned by Jordan Avery/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Return map" }),
    ).toBeInTheDocument();
  });

  it("shows the Return status band on Overview only", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Return status" }),
    ).toBeInTheDocument();

    // This Return's Documents Area (contextual tier), not the firm-wide pool nav.
    const areas = within(screen.getByRole("list", { name: /Areas$/i }));
    await user.click(areas.getByRole("link", { name: "Documents" }));

    expect(
      screen.queryByRole("heading", { name: "Return status" }),
    ).not.toBeInTheDocument();
  });

  it("defaults to Overview and switches to Messages from the contextual tier", async () => {
    const user = userEvent.setup();
    renderPage();

    const primary = () => screen.getByRole("navigation", { name: "Primary" });
    // This Return's Messages Area (contextual tier), not the firm-wide pool nav.
    const areas = () => within(screen.getByRole("list", { name: /Areas$/i }));
    expect(
      within(primary()).getByRole("link", { name: "Overview" }),
    ).toHaveAttribute("aria-current", "page");

    await user.click(areas().getByRole("link", { name: "Messages" }));

    expect(
      within(primary()).getByRole("link", { name: "Overview" }),
    ).not.toHaveAttribute("aria-current", "page");
    expect(areas().getByRole("link", { name: "Messages" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("lists the four firm Areas in the contextual tier, with the activity Area renamed", () => {
    renderPage();

    const primary = within(screen.getByRole("navigation", { name: "Primary" }));
    expect(primary.getByRole("link", { name: "Overview" })).toBeInTheDocument();
    // The contextual "Documents"/"Messages" Areas — scoped, since the global nav
    // now also has firm-wide "Documents" and "Messages" links.
    const areas = within(screen.getByRole("list", { name: /Areas$/i }));
    expect(areas.getByRole("link", { name: "Documents" })).toBeInTheDocument();
    expect(
      primary.getByRole("link", { name: "Requests & Activity" }),
    ).toBeInTheDocument();
    expect(areas.getByRole("link", { name: "Messages" })).toBeInTheDocument();
    // The old label is gone.
    expect(
      primary.queryByRole("link", { name: "Questions & Requests" }),
    ).not.toBeInTheDocument();
  });

  it("jumps to Messages from the header's Messages action", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /Messages/ }));

    // This Return's Messages Area (contextual tier), not the firm-wide pool nav.
    const areas = within(screen.getByRole("list", { name: /Areas$/i }));
    expect(areas.getByRole("link", { name: "Messages" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
