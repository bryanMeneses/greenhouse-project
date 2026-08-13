import { describe, it, expect } from "vitest";
import { render as baseRender, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";

// These surfaces read within-Return view state through useReturnView, so a Router
// is always in scope — the app provides one; here the tests do.
const render = ((
  ui: Parameters<typeof baseRender>[0],
  options?: Parameters<typeof baseRender>[1],
) =>
  baseRender(ui, { wrapper: MemoryRouter, ...options })) as typeof baseRender;
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";

import { CollaborationSection } from "./collaboration-section";
import { getReturn } from "@/mocks/returns";

const NGUYEN = getReturn("rtn-nguyen-2024")!;
const PREPARER = { role: "preparer" as const, name: "Jordan Avery" };
const CLIENT = { role: "individual-taxpayer" as const, name: "Nguyen Family" };

describe("CollaborationSection — firm two-pane inbox", () => {
  it("shows the inbox and a detail pane, without the Requests & Activity panel", () => {
    render(
      <CollaborationSection
        taxReturn={NGUYEN}
        viewerFamily="firm"
        viewer={PREPARER}
      />,
    );

    // Requests & Activity is its own Area, not bolted onto Messages.
    expect(screen.queryByText(/Requests & Activity/)).toBeNull();
    expect(screen.getByRole("heading", { name: "Inbox" })).toBeInTheDocument();
    // The first thread opens by default in the detail pane.
    expect(
      screen.getByRole("heading", { name: /a quick check on Box 1/ }),
    ).toBeInTheDocument();
  });

  it("offers a primary New conversation action in the header", () => {
    render(
      <CollaborationSection
        taxReturn={NGUYEN}
        viewerFamily="firm"
        viewer={PREPARER}
      />,
    );

    expect(
      screen.getByRole("button", { name: "New conversation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Messages" }),
    ).toBeInTheDocument();
  });

  it("swaps the detail pane when another thread is selected", async () => {
    const user = userEvent.setup();
    render(
      <CollaborationSection
        taxReturn={NGUYEN}
        viewerFamily="firm"
        viewer={PREPARER}
      />,
    );

    // Scope the click to the inbox — the thread's messages also surface as
    // clickable rows in Requests & Activity.
    const inbox = screen.getByRole("region", { name: "Inbox" });
    await user.click(
      within(inbox).getByRole("button", { name: /Requesting your Form 1098/ }),
    );

    expect(
      screen.getByRole("heading", { name: /Requesting your Form 1098/ }),
    ).toBeInTheDocument();
  });

  it("stamps an optimistically-sent message against SEED_TODAY (shows Today)", async () => {
    const user = userEvent.setup();
    render(
      <CollaborationSection
        taxReturn={NGUYEN}
        viewerFamily="firm"
        viewer={PREPARER}
      />,
    );

    await user.type(
      screen.getByRole("textbox", { name: /write a message/i }),
      "Verified against the transcript.",
    );
    await user.click(screen.getByRole("button", { name: /send/i }));

    // Appears in the detail pane (and echoes into Requests & Activity).
    expect(
      screen.getAllByText("Verified against the transcript.").length,
    ).toBeGreaterThan(0);
    // Stamped against SEED_TODAY, not the wall clock → reads as "Today".
    expect(screen.getAllByText("Today").length).toBeGreaterThan(0);
  });

  it("has no accessibility violations", async () => {
    render(
      <CollaborationSection
        taxReturn={NGUYEN}
        viewerFamily="firm"
        viewer={PREPARER}
      />,
    );
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("CollaborationSection — client view", () => {
  it("uses the same inbox UI as the firm, minus the firm-only affordances", () => {
    render(
      <CollaborationSection
        taxReturn={NGUYEN}
        viewerFamily="client"
        viewer={CLIENT}
      />,
    );

    // Same master–detail inbox as the preparer…
    expect(screen.getByRole("heading", { name: "Inbox" })).toBeInTheDocument();
    // …but without the firm-only audience filter or Requests & Activity panel.
    expect(screen.queryByRole("radio", { name: "Internal" })).toBeNull();
    expect(screen.queryByText(/Requests & Activity/)).toBeNull();
    // The W-2 internal note never crosses the boundary.
    expect(
      screen.queryByText(/Cross-checked against the IRS wage transcript/),
    ).toBeNull();
    // But the client sees the client-visible messages.
    expect(
      screen.getByText(/Acme reissued it in February/),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    render(
      <CollaborationSection
        taxReturn={NGUYEN}
        viewerFamily="client"
        viewer={CLIENT}
      />,
    );
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
