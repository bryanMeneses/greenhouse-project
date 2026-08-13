import { describe, expect, it } from "vitest";
import { render as baseRender, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";

// ComplexityNavigator reads within-Return view state through useReturnView, so a
// Router is always in scope — the app provides one; here the tests do.
const render = ((
  ui: Parameters<typeof baseRender>[0],
  options?: Parameters<typeof baseRender>[1],
) =>
  baseRender(ui, { wrapper: MemoryRouter, ...options })) as typeof baseRender;
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";

import { ComplexityNavigator } from "./complexity-navigator";
import { getReturn } from "@/mocks/returns";
import { getComplexityItems } from "@/mocks/complexity";

const taxReturn = getReturn("rtn-reyes-2024")!;

describe("ComplexityNavigator", () => {
  it("gives the Firm a scalable map with hierarchy, search, and selected detail", async () => {
    const user = userEvent.setup();
    render(<ComplexityNavigator taxReturn={taxReturn} viewerFamily="firm" />);

    expect(
      screen.getByRole("heading", { name: "Return map" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/250 items|25[0-9] items/)).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Return work areas" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Wages, tips, other comp" }),
    ).toBeInTheDocument();

    const search = screen.getByRole("searchbox", {
      name: "Search this return",
    });
    await user.clear(search);
    await user.type(search, "1099-INT");

    expect(
      screen.getByRole("heading", { name: "Taxable interest" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/2 source contributions available/i),
    ).toBeInTheDocument();
  });

  it("keeps the active work area and opens source-level Field evidence", async () => {
    const user = userEvent.setup();
    render(<ComplexityNavigator taxReturn={taxReturn} viewerFamily="firm" />);

    const navigator = screen.getByRole("region", { name: "Return map" });
    const areas = within(navigator).getByRole("navigation", {
      name: "Return work areas",
    });
    await user.click(
      within(areas).getByRole("button", { name: /Supporting documents/ }),
    );

    expect(
      within(navigator).getByText(/Matching work|Start with a summary/),
    ).toBeInTheDocument();
    expect(
      within(navigator).getByText("Supporting documents"),
    ).toBeInTheDocument();

    // The work-area list must keep its sibling areas after one is picked, so you
    // can move directly between areas instead of returning to "All work" first.
    expect(within(areas).getAllByRole("button").length).toBeGreaterThan(2);

    // Clicking the active area again toggles it back off to "All work".
    const docsButton = within(areas).getByRole("button", {
      name: /Supporting documents/,
    });
    expect(docsButton).toHaveAttribute("aria-pressed", "true");
    await user.click(docsButton);
    expect(docsButton).toHaveAttribute("aria-pressed", "false");
  });

  it("adapts to the Client without exposing the Firm's generated review volume", async () => {
    const user = userEvent.setup();
    render(<ComplexityNavigator taxReturn={taxReturn} viewerFamily="client" />);

    expect(
      screen.getByRole("heading", { name: "Your return at a glance" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Bank statement 001/)).not.toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search your return"),
    ).toBeInTheDocument();

    const clientItems = getComplexityItems(taxReturn, "client");
    expect(screen.getByText(`${clientItems.length} items`)).toBeInTheDocument();

    await user.type(
      screen.getByRole("searchbox", { name: "Search this return" }),
      "W-2",
    );
    expect(screen.getAllByText(/Received from you/).length).toBeGreaterThan(0);
  });

  it("keeps the hierarchy counts honest — 'All work' follows the active search", async () => {
    const user = userEvent.setup();
    render(<ComplexityNavigator taxReturn={taxReturn} viewerFamily="firm" />);

    const areas = screen.getByRole("navigation", { name: "Return work areas" });
    const allWorkCount = () =>
      Number(
        within(areas)
          .getByRole("button", { name: /All work/ })
          .textContent?.replace(/\D/g, ""),
      );

    const before = allWorkCount();
    expect(before).toBeGreaterThan(200);

    await user.type(
      screen.getByRole("searchbox", { name: "Search this return" }),
      "Taxable interest",
    );

    // "All work" must reflect the matches, not keep showing the full total, so it
    // never contradicts the section rows beneath it.
    expect(allWorkCount()).toBeLessThan(before);
  });

  it("search reaches the strings the detail pane shows for generated items", async () => {
    const user = userEvent.setup();
    render(<ComplexityNavigator taxReturn={taxReturn} viewerFamily="firm" />);

    // A warning's suggested-resolution text is display-only; search must still find it.
    await user.type(
      screen.getByRole("searchbox", { name: "Search this return" }),
      "Resolving clears the warning",
    );
    expect(
      screen.getAllByRole("heading", { name: /Review warning/ }).length,
    ).toBeGreaterThan(0);
  });

  it("has no accessibility violations for both audience presentations", async () => {
    const { container, unmount } = render(
      <ComplexityNavigator taxReturn={taxReturn} viewerFamily="firm" />,
    );
    expect(await axe(container)).toHaveNoViolations();
    unmount();

    const client = render(
      <ComplexityNavigator taxReturn={taxReturn} viewerFamily="client" />,
    );
    expect(await axe(client.container)).toHaveNoViolations();
  });
});
