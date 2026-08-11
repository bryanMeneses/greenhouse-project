import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";

import { Thread } from "./thread";
import type { Thread as ThreadModel } from "./collaboration";

const PREPARER = { role: "preparer" as const, name: "Jordan Avery" };
const CLIENT = { role: "individual-taxpayer" as const, name: "Nguyen Family" };

function thread(): ThreadModel {
  return {
    id: "t1",
    returnId: "rtn",
    subject: {
      kind: "source-document",
      documentId: "doc-w2-acme",
      title: "W-2 (Acme Corp)",
    },
    title: "W-2 wages question",
    messages: [
      {
        id: "m1",
        threadId: "t1",
        authorRole: "preparer",
        authorName: "Jordan Avery",
        audience: "client-visible",
        body: "Can you confirm Box 1 is $72,000?",
        sentAt: "2026-07-30T09:00:00.000Z",
      },
      {
        id: "m2",
        threadId: "t1",
        authorRole: "individual-taxpayer",
        authorName: "Nguyen Family",
        audience: "client-visible",
        body: "Yes, that's correct.",
        sentAt: "2026-07-31T14:00:00.000Z",
      },
      {
        id: "m3",
        threadId: "t1",
        authorRole: "preparer",
        authorName: "Jordan Avery",
        audience: "internal",
        body: "Matches the IRS wage transcript.",
        sentAt: "2026-07-31T15:00:00.000Z",
      },
    ],
  };
}

describe("Thread — audience boundary", () => {
  it("shows the Preparer every message, including the Internal note", () => {
    render(<Thread thread={thread()} viewerFamily="firm" viewer={PREPARER} />);

    expect(screen.getByText(/Can you confirm Box 1/)).toBeInTheDocument();
    expect(screen.getByText(/Yes, that's correct/)).toBeInTheDocument();
    expect(
      screen.getByText(/Matches the IRS wage transcript/),
    ).toBeInTheDocument();
    // The firm sees the audience marker on the internal note (in the message list;
    // the compose toggle also carries an "Internal" label, hence the scope).
    const list = screen.getByRole("list");
    expect(within(list).getByText("Internal")).toBeInTheDocument();
  });

  it("hides the Internal note from the Client (the leak test)", () => {
    render(<Thread thread={thread()} viewerFamily="client" viewer={CLIENT} />);

    expect(screen.getByText(/Yes, that's correct/)).toBeInTheDocument();
    expect(
      screen.queryByText(/Matches the IRS wage transcript/),
    ).not.toBeInTheDocument();
    // The client never sees audience chips at all.
    expect(screen.queryByText("Internal")).not.toBeInTheDocument();
  });
});

describe("Thread — audience-aware compose", () => {
  it("gives the Preparer an audience toggle defaulting to the safer Internal", () => {
    render(<Thread thread={thread()} viewerFamily="firm" viewer={PREPARER} />);

    const internal = screen.getByRole("radio", { name: /internal/i });
    const clientVisible = screen.getByRole("radio", {
      name: /client-visible/i,
    });
    expect(internal).toBeChecked();
    expect(clientVisible).not.toBeChecked();
    expect(screen.getByText("Only your firm will see this.")).toBeInTheDocument();
  });

  it("switches the compose hint when the Preparer picks Client-visible", async () => {
    const user = userEvent.setup();
    render(<Thread thread={thread()} viewerFamily="firm" viewer={PREPARER} />);

    await user.click(screen.getByRole("radio", { name: /client-visible/i }));
    expect(screen.getByText("The client will see this.")).toBeInTheDocument();
  });

  it("gives the Client no toggle — always Client-visible", () => {
    render(<Thread thread={thread()} viewerFamily="client" viewer={CLIENT} />);

    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.getByText("The client will see this.")).toBeInTheDocument();
  });
});

describe("Thread — optimistic send", () => {
  it("appends a Preparer message with the chosen audience", async () => {
    const user = userEvent.setup();
    render(<Thread thread={thread()} viewerFamily="firm" viewer={PREPARER} />);

    await user.type(
      screen.getByRole("textbox", { name: /write a message/i }),
      "Following up on this.",
    );
    await user.click(screen.getByRole("button", { name: /send/i }));

    const list = screen.getByRole("list");
    expect(
      within(list).getByText("Following up on this."),
    ).toBeInTheDocument();
    // Sent as Internal (the default) — two Internal chips in the list now
    // (seed + new). The compose toggle's "Internal" label is outside the list.
    expect(within(list).getAllByText("Internal")).toHaveLength(2);
  });

  it("does not send an empty message", async () => {
    const user = userEvent.setup();
    render(<Thread thread={thread()} viewerFamily="client" viewer={CLIENT} />);

    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });
});

describe("Thread — accessibility", () => {
  it("has no violations in the Preparer view", async () => {
    const { container } = render(
      <Thread thread={thread()} viewerFamily="firm" viewer={PREPARER} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no violations in the Client view", async () => {
    const { container } = render(
      <Thread thread={thread()} viewerFamily="client" viewer={CLIENT} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
