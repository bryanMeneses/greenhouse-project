import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";

import { ThreadDetail, ThreadList } from "./thread";
import type { OpenItem } from "./returns";
import type { Thread as ThreadModel } from "./collaboration";

const PREPARER = { role: "preparer" as const, name: "Jordan Avery" };
const CLIENT = { role: "individual-taxpayer" as const, name: "Nguyen Family" };

const OPEN_ITEMS: OpenItem[] = [
  { id: "req-1098", label: "Upload your 2024 Form 1098", owner: "client" },
];

function w2Thread(): ThreadModel {
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

/** A second thread with no internal note — for the audience filter. */
function returnThread(): ThreadModel {
  return {
    id: "t2",
    returnId: "rtn",
    subject: { kind: "return" },
    title: "Your 2024 return",
    messages: [
      {
        id: "t2-m1",
        threadId: "t2",
        authorRole: "preparer",
        authorName: "Jordan Avery",
        audience: "client-visible",
        body: "Welcome! I've started on your return.",
        sentAt: "2026-07-27T09:00:00.000Z",
      },
    ],
  };
}

function renderDetail(family: "firm" | "client") {
  const viewer = family === "firm" ? PREPARER : CLIENT;
  return render(
    <ThreadDetail
      thread={w2Thread()}
      openItems={OPEN_ITEMS}
      viewerFamily={family}
      viewer={viewer}
      onSend={vi.fn()}
    />,
  );
}

function StatefulDetail({ family }: { family: "firm" | "client" }) {
  const viewer = family === "firm" ? PREPARER : CLIENT;
  const [thread, setThread] = React.useState(w2Thread);

  return (
    <ThreadDetail
      thread={thread}
      openItems={OPEN_ITEMS}
      viewerFamily={family}
      viewer={viewer}
      onSend={(body, audience) =>
        setThread((current) => ({
          ...current,
          messages: [
            ...current.messages,
            {
              id: "m-new",
              threadId: current.id,
              authorRole: viewer.role,
              authorName: viewer.name,
              audience,
              body,
              sentAt: "2026-08-08T00:00:00.000Z",
            },
          ],
        }))
      }
    />
  );
}

describe("ThreadDetail — audience boundary", () => {
  it("shows the Preparer every message, including the Internal note", () => {
    renderDetail("firm");

    expect(screen.getByText(/Can you confirm Box 1/)).toBeInTheDocument();
    expect(screen.getByText(/Yes, that's correct/)).toBeInTheDocument();
    expect(
      screen.getByText(/Matches the IRS wage transcript/),
    ).toBeInTheDocument();
    // The firm sees the audience marker on the internal note (in the message list).
    const list = screen.getByRole("list");
    expect(within(list).getByText("Internal")).toBeInTheDocument();
  });

  it("hides the Internal note from the Client (the leak test)", () => {
    renderDetail("client");

    expect(screen.getByText(/Yes, that's correct/)).toBeInTheDocument();
    expect(
      screen.queryByText(/Matches the IRS wage transcript/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Internal")).not.toBeInTheDocument();
  });
});

describe("ThreadDetail — boundary notice + subject link", () => {
  it("shows the firm the client-visible boundary notice", () => {
    renderDetail("firm");
    expect(screen.getByText(/Client-visible thread\./)).toBeInTheDocument();
  });

  it("labels an internal-only thread without implying client visibility", () => {
    const internalOnly = w2Thread();
    internalOnly.messages = [internalOnly.messages[2]];

    render(
      <ThreadDetail
        thread={internalOnly}
        openItems={OPEN_ITEMS}
        viewerFamily="firm"
        viewer={PREPARER}
        onSend={vi.fn()}
      />,
    );

    expect(screen.getByText(/Internal thread\./)).toBeInTheDocument();
    expect(
      screen.queryByText(/Client-visible thread\./),
    ).not.toBeInTheDocument();
  });

  it("reassures the client that they see only shared messages", () => {
    renderDetail("client");
    expect(
      screen.getByText(/messages your preparer has shared with you/i),
    ).toBeInTheDocument();
  });

  it("links the thread to its Subject on its own line", () => {
    renderDetail("firm");
    expect(screen.getByText(/Linked to W-2 \(Acme Corp\)/)).toBeInTheDocument();
  });
});

describe("ThreadDetail — message scrolling", () => {
  it.each(["firm", "client"] as const)(
    "scrolls to the newest message for the %s view",
    async (family) => {
      const user = userEvent.setup();
      render(<StatefulDetail family={family} />);
      const messageList = screen.getByRole("list");
      Object.defineProperty(messageList, "scrollHeight", {
        configurable: true,
        value: 640,
      });

      await user.type(
        screen.getByRole("textbox", { name: /write a message/i }),
        "A new message.",
      );
      await user.click(screen.getByRole("button", { name: /send/i }));

      expect(messageList.scrollTop).toBe(640);
    },
  );
});

describe("ThreadDetail — audience-aware compose", () => {
  it("gives the Preparer an audience toggle defaulting to the safer Internal", () => {
    renderDetail("firm");

    const internal = screen.getByRole("radio", { name: /internal/i });
    const clientVisible = screen.getByRole("radio", {
      name: /client-visible/i,
    });
    expect(internal).toBeChecked();
    expect(clientVisible).not.toBeChecked();
    expect(
      screen.getByText("Only your firm will see this."),
    ).toBeInTheDocument();
  });

  it("switches the compose hint when the Preparer picks Client-visible", async () => {
    const user = userEvent.setup();
    renderDetail("firm");

    await user.click(screen.getByRole("radio", { name: /client-visible/i }));
    expect(screen.getByText("The client will see this.")).toBeInTheDocument();
  });

  it("gives the Client no toggle — always Client-visible", () => {
    renderDetail("client");

    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.getByText("The client will see this.")).toBeInTheDocument();
  });

  it("sends the trimmed body with the chosen audience", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(
      <ThreadDetail
        thread={w2Thread()}
        openItems={OPEN_ITEMS}
        viewerFamily="firm"
        viewer={PREPARER}
        onSend={onSend}
      />,
    );

    await user.type(
      screen.getByRole("textbox", { name: /write a message/i }),
      "Following up on this.",
    );
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(onSend).toHaveBeenCalledWith("Following up on this.", "internal");
  });

  it("does not send an empty message", () => {
    renderDetail("client");
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });
});

describe("ThreadList — inbox", () => {
  it("lists the threads as selectable rows", () => {
    render(
      <ThreadList
        threads={[w2Thread(), returnThread()]}
        openItems={OPEN_ITEMS}
        viewerFamily="firm"
        selectedThreadId="t1"
        onSelect={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /W-2 wages question/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Your 2024 return/ }),
    ).toBeInTheDocument();
  });

  it("narrows the list to threads with internal notes when filtered", async () => {
    const user = userEvent.setup();
    render(
      <ThreadList
        threads={[w2Thread(), returnThread()]}
        openItems={OPEN_ITEMS}
        viewerFamily="firm"
        selectedThreadId="t1"
        onSelect={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "Internal" }));

    // Only the W-2 thread carries an internal note.
    expect(
      screen.getByRole("button", { name: /W-2 wages question/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Your 2024 return/ }),
    ).not.toBeInTheDocument();
  });

  it("calls onSelect with the clicked thread", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ThreadList
        threads={[w2Thread(), returnThread()]}
        openItems={OPEN_ITEMS}
        viewerFamily="firm"
        selectedThreadId="t1"
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Your 2024 return/ }));
    expect(onSelect).toHaveBeenCalledWith("t2");
  });
});

describe("ThreadDetail — accessibility", () => {
  it("has no violations in the Preparer view", async () => {
    const { container } = renderDetail("firm");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no violations in the Client view", async () => {
    const { container } = renderDetail("client");
    expect(await axe(container)).toHaveNoViolations();
  });
});
