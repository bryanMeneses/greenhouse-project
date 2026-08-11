import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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

describe("ReturnReviewPage — header + tab shell", () => {
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
  });

  it("keeps the return status band above the tabs", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Return status" }),
    ).toBeInTheDocument();
  });

  it("defaults to the Overview tab and switches to Collaboration", async () => {
    const user = userEvent.setup();
    renderPage();

    const overview = screen.getByRole("tab", { name: /Overview/ });
    const collaboration = screen.getByRole("tab", { name: /Collaboration/ });
    expect(overview).toHaveAttribute("aria-selected", "true");
    expect(collaboration).toHaveAttribute("aria-selected", "false");

    await user.click(collaboration);

    expect(collaboration).toHaveAttribute("aria-selected", "true");
    expect(overview).toHaveAttribute("aria-selected", "false");
  });

  it("jumps to Collaboration from the header's Messages action", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /Messages/ }));

    expect(screen.getByRole("tab", { name: /Collaboration/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
