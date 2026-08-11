import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";

import { RequestsActivityPanel } from "./requests-activity-panel";
import type { Thread } from "./collaboration";
import type { OpenItem, Return } from "./returns";

function makeReturn(openItems: OpenItem[]): Return {
  return {
    id: "rtn",
    client: "Nguyen Family",
    taxYear: 2024,
    stage: "in-review",
    deadline: "2026-09-15",
    openItems,
    sections: [],
  };
}

const OPEN_ITEMS: OpenItem[] = [
  { id: "r-normal", label: "Confirm bank details", owner: "client", urgency: "normal" },
  { id: "r-high", label: "Upload your 1098", owner: "client", urgency: "high" },
  { id: "p-1", label: "Verify the 8879", owner: "preparer" },
  { id: "closed", label: "Corrected 1099-INT", owner: "preparer", resolution: "closed" },
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

describe("RequestsActivityPanel — requests lead, by urgency", () => {
  it("lists only open client Requests, urgent first", () => {
    render(
      <RequestsActivityPanel
        taxReturn={makeReturn(OPEN_ITEMS)}
        threads={THREADS}
        viewerFamily="firm"
      />,
    );

    // Preparer-owned + closed items are not Requests and don't appear here.
    expect(screen.queryByText("Verify the 8879")).not.toBeInTheDocument();
    expect(screen.queryByText("Corrected 1099-INT")).not.toBeInTheDocument();

    const labels = screen
      .getAllByRole("listitem")
      .map((li) => li.textContent ?? "");
    const requestOrder = labels.filter(
      (t) => t.includes("1098") || t.includes("bank details"),
    );
    expect(requestOrder[0]).toContain("1098"); // high urgency first
    expect(requestOrder[1]).toContain("bank details");
  });

  it("shows an empty state when there are no open requests", () => {
    render(
      <RequestsActivityPanel
        taxReturn={makeReturn([{ id: "p", label: "x", owner: "preparer" }])}
        threads={THREADS}
        viewerFamily="firm"
      />,
    );
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
