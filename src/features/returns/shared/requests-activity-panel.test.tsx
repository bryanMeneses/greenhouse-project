import { describe, it, expect, vi } from "vitest";
import { render as baseRender, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

// The panel renders Connection links (useReturnView), so a Router is always in
// scope — the app provides one; here the tests do.
const render = ((
  ui: Parameters<typeof baseRender>[0],
  options?: Parameters<typeof baseRender>[1],
) =>
  baseRender(ui, { wrapper: MemoryRouter, ...options })) as typeof baseRender;
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";

import { RequestsActivityPanel } from "./requests-activity-panel";
import type { Thread } from "./collaboration";
import type { OpenItem, Return } from "./returns";

function makeReturn(openItems: OpenItem[]): Return {
  return {
    id: "rtn",
    client: "Nguyen Family",
    returnType: "Individual 1040",
    returnNumber: "RET-2024-011",
    ownerName: "Jordan Avery",
    taxYear: 2024,
    stage: "in-review",
    deadline: "2026-09-15",
    openItems,
    sections: [],
  };
}

const OPEN_ITEMS: OpenItem[] = [
  {
    id: "r-normal",
    label: "Confirm bank details",
    owner: "client",
    urgency: "normal",
  },
  { id: "r-high", label: "Upload your 1098", owner: "client", urgency: "high" },
  { id: "p-1", label: "Verify the 8879", owner: "preparer" },
  {
    id: "closed",
    label: "Corrected 1099-INT",
    owner: "preparer",
    resolution: "closed",
  },
];

const THREADS: Thread[] = [
  {
    id: "t1",
    returnId: "rtn",
    subject: { kind: "return" },
    title: "Your 2024 return",
    messages: [
      {
        id: "m-client",
        threadId: "t1",
        authorRole: "preparer",
        authorName: "Jordan Avery",
        audience: "client-visible",
        body: "Welcome — I've started your return.",
        sentAt: "2026-08-01T09:00:00.000Z",
      },
      {
        id: "m-internal",
        threadId: "t1",
        authorRole: "preparer",
        authorName: "Jordan Avery",
        audience: "internal",
        body: "Internal: flag the K-1 timing.",
        sentAt: "2026-08-02T09:00:00.000Z",
      },
    ],
  },
];

const REQUEST_THREAD: Thread = {
  ...THREADS[0],
  id: "t-request",
  subject: { kind: "open-item", openItemId: "r-high" },
};

describe("RequestsActivityPanel — On your plate / Open requests tabs", () => {
  it("defaults to your plate; client Requests sit behind the Open requests tab, urgent first", async () => {
    const user = userEvent.setup();
    render(
      <RequestsActivityPanel
        taxReturn={makeReturn(OPEN_ITEMS)}
        threads={THREADS}
        viewerFamily="firm"
      />,
    );

    // Plate is the default tab: the Preparer-owned active item shows; the Closed
    // one is done, so it appears nowhere.
    expect(screen.getByText("Verify the 8879")).toBeInTheDocument();
    expect(screen.queryByText("Corrected 1099-INT")).not.toBeInTheDocument();

    // The client Requests live behind the other tab, urgent first.
    await user.click(screen.getByRole("tab", { name: /Open requests/ }));
    const labels = screen
      .getAllByRole("listitem")
      .map((li) => li.textContent ?? "");
    const requestOrder = labels.filter(
      (t) => t.includes("1098") || t.includes("bank details"),
    );
    expect(requestOrder[0]).toContain("1098"); // high urgency first
    expect(requestOrder[1]).toContain("bank details");
  });

  it("labels rows by owner and makes each Open Item addressable for deep-linking", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RequestsActivityPanel
        taxReturn={makeReturn(OPEN_ITEMS)}
        threads={THREADS}
        viewerFamily="firm"
      />,
    );

    // Plate tab (default): the Preparer subtitle, and the challenge-04 focus hook
    // the dashboard action list deep-links to (`?area=requests&focus=open-item:p-1`).
    expect(screen.getByText("Needs your action")).toBeInTheDocument();
    expect(
      container.querySelector(
        '[data-return-focus="p-1"][data-return-focus-kind="open-item"]',
      ),
    ).not.toBeNull();

    // Client rows read "Waiting on client" — not the old hardcoded label everywhere.
    await user.click(screen.getByRole("tab", { name: /Open requests/ }));
    expect(screen.getAllByText("Waiting on client").length).toBeGreaterThan(0);
  });

  it("marks whether each request has a conversation and links existing ones", async () => {
    const user = userEvent.setup();
    const onSelectThread = vi.fn();
    render(
      <RequestsActivityPanel
        taxReturn={makeReturn(OPEN_ITEMS)}
        threads={[REQUEST_THREAD]}
        viewerFamily="firm"
        onSelectThread={onSelectThread}
      />,
    );

    await user.click(screen.getByRole("tab", { name: /Open requests/ }));
    expect(screen.getByText("In conversation")).toBeInTheDocument();
    expect(screen.getAllByText("No conversation yet").length).toBeGreaterThan(
      0,
    );

    await user.click(screen.getByRole("button", { name: /Upload your 1098/ }));
    expect(onSelectThread).toHaveBeenCalledWith("t-request");
  });

  it("lets you switch tabs freely even when a plate item is deep-linked", async () => {
    const user = userEvent.setup();
    // Arrive focused on a plate item (as the dashboard action deep-links).
    baseRender(
      <MemoryRouter initialEntries={["/?focus=open-item:p-1"]}>
        <RequestsActivityPanel
          taxReturn={makeReturn(OPEN_ITEMS)}
          threads={THREADS}
          viewerFamily="firm"
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("Verify the 8879")).toBeInTheDocument();

    // Peeking at Open requests must stick — the focus must not snap us back.
    await user.click(screen.getByRole("tab", { name: /Open requests/ }));
    expect(screen.getByText("Confirm bank details")).toBeInTheDocument();
    expect(screen.queryByText("Verify the 8879")).not.toBeInTheDocument();
  });

  it("shows an empty state under the Open requests tab when there are none", async () => {
    const user = userEvent.setup();
    render(
      <RequestsActivityPanel
        taxReturn={makeReturn([{ id: "p", label: "x", owner: "preparer" }])}
        threads={THREADS}
        viewerFamily="firm"
      />,
    );
    await user.click(screen.getByRole("tab", { name: /Open requests/ }));
    expect(screen.getByText("No open requests.")).toBeInTheDocument();
  });
});

describe("RequestsActivityPanel — activity respects the audience boundary", () => {
  it("shows the internal message to the firm", () => {
    render(
      <RequestsActivityPanel
        taxReturn={makeReturn(OPEN_ITEMS)}
        threads={THREADS}
        viewerFamily="firm"
      />,
    );
    expect(screen.getByText(/flag the K-1 timing/)).toBeInTheDocument();
  });

  it("hides the internal message from the client", () => {
    render(
      <RequestsActivityPanel
        taxReturn={makeReturn(OPEN_ITEMS)}
        threads={THREADS}
        viewerFamily="client"
      />,
    );
    expect(screen.queryByText(/flag the K-1 timing/)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Welcome — I've started your return/),
    ).toBeInTheDocument();
  });
});

describe("RequestsActivityPanel — accessibility", () => {
  it("has no violations", async () => {
    const { container } = render(
      <RequestsActivityPanel
        taxReturn={makeReturn(OPEN_ITEMS)}
        threads={THREADS}
        viewerFamily="firm"
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
