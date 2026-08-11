import { describe, it, expect } from "vitest";

import {
  isMessageVisibleTo,
  visibleMessages,
  composableAudiences,
  defaultComposeAudience,
  isRequest,
  openRequests,
  nextActionOwner,
  fulfillRequest,
  closeRequest,
  recentActivity,
  type Message,
  type Thread,
} from "./collaboration";
import type { OpenItem } from "./returns";

// ─── Fixtures ────────────────────────────────────────────────────────────────

function msg(overrides: Partial<Message> = {}): Message {
  return {
    id: "m",
    threadId: "t",
    authorRole: "preparer",
    authorName: "Jordan Avery",
    audience: "client-visible",
    body: "hello",
    sentAt: "2026-08-01T10:00:00.000Z",
    ...overrides,
  };
}

const internalNote = msg({ id: "m-internal", audience: "internal" });
const clientMsg = msg({ id: "m-client", audience: "client-visible" });

function thread(messages: Message[]): Thread {
  return {
    id: "t",
    returnId: "rtn",
    subject: { kind: "return" },
    title: "General",
    messages,
  };
}

const clientRequest: OpenItem = {
  id: "req-1098",
  label: "Upload your 1098",
  owner: "client",
};
const preparerItem: OpenItem = {
  id: "prep-1",
  label: "Reconcile interest",
  owner: "preparer",
};

// ─── Audience visibility ───────────────────────────────────────────────────

describe("isMessageVisibleTo", () => {
  it("shows firm Roles everything", () => {
    expect(isMessageVisibleTo(internalNote, "firm")).toBe(true);
    expect(isMessageVisibleTo(clientMsg, "firm")).toBe(true);
  });

  it("hides Internal messages from client Roles", () => {
    expect(isMessageVisibleTo(internalNote, "client")).toBe(false);
    expect(isMessageVisibleTo(clientMsg, "client")).toBe(true);
  });
});

describe("visibleMessages", () => {
  it("drops the Internal note for a client, even inside a client-visible thread", () => {
    const t = thread([clientMsg, internalNote]);
    const forClient = visibleMessages(t, "client");
    expect(forClient).toEqual([clientMsg]);
    expect(forClient).not.toContainEqual(internalNote);
  });

  it("keeps everything for the firm", () => {
    const t = thread([clientMsg, internalNote]);
    expect(visibleMessages(t, "firm")).toHaveLength(2);
  });
});

describe("compose controls", () => {
  it("gives the firm both audiences, the client only client-visible", () => {
    expect(composableAudiences("firm")).toEqual(["internal", "client-visible"]);
    expect(composableAudiences("client")).toEqual(["client-visible"]);
  });

  it("defaults the Preparer to the safer Internal audience", () => {
    expect(defaultComposeAudience("firm")).toBe("internal");
  });

  it("has the client compose client-visible (their only option)", () => {
    expect(defaultComposeAudience("client")).toBe("client-visible");
  });
});

// ─── Requests ──────────────────────────────────────────────────────────────

describe("isRequest", () => {
  it("is true for a client-owned Open Item, false for a preparer-owned one", () => {
    expect(isRequest(clientRequest)).toBe(true);
    expect(isRequest(preparerItem)).toBe(false);
  });

  it("stays true for a Closed (formerly client) Request", () => {
    expect(isRequest({ ...clientRequest, resolution: "closed" })).toBe(true);
  });
});

describe("openRequests", () => {
  it("keeps only open client-owned items", () => {
    const closed: OpenItem = {
      id: "c",
      label: "done",
      owner: "client",
      resolution: "closed",
    };
    const result = openRequests([clientRequest, preparerItem, closed]);
    expect(result).toEqual([clientRequest]);
  });

  it("orders high-urgency Requests ahead of normal ones", () => {
    const high: OpenItem = {
      id: "high",
      label: "sign now",
      owner: "client",
      urgency: "high",
    };
    const normal: OpenItem = {
      id: "normal",
      label: "later",
      owner: "client",
      urgency: "normal",
    };
    expect(openRequests([normal, high]).map((r) => r.id)).toEqual([
      "high",
      "normal",
    ]);
  });

  it("treats absent urgency as normal", () => {
    const high: OpenItem = { ...clientRequest, id: "h", urgency: "high" };
    const bare: OpenItem = { ...clientRequest, id: "b" };
    expect(openRequests([bare, high]).map((r) => r.id)).toEqual(["h", "b"]);
  });
});

describe("nextActionOwner", () => {
  it("returns the owner while open, null once Closed", () => {
    expect(nextActionOwner(clientRequest)).toBe("client");
    expect(nextActionOwner(preparerItem)).toBe("preparer");
    expect(
      nextActionOwner({ ...preparerItem, resolution: "closed" }),
    ).toBeNull();
  });
});

// ─── Lifecycle transitions ─────────────────────────────────────────────────

describe("fulfillRequest", () => {
  it("flips a client-owned Request to the Preparer", () => {
    expect(fulfillRequest(clientRequest).owner).toBe("preparer");
  });

  it("never auto-closes on client action", () => {
    expect(fulfillRequest(clientRequest).resolution).toBeUndefined();
  });

  it("is a no-op on a preparer-owned item", () => {
    expect(fulfillRequest(preparerItem)).toBe(preparerItem);
  });

  it("is a no-op on a Closed Request", () => {
    const closed: OpenItem = { ...clientRequest, resolution: "closed" };
    expect(fulfillRequest(closed)).toBe(closed);
  });
});

describe("closeRequest", () => {
  it("Closes a Request the client has fulfilled (now preparer-owned)", () => {
    const fulfilled = fulfillRequest(clientRequest);
    expect(closeRequest(fulfilled).resolution).toBe("closed");
  });

  it("won't close an open, client-owned Request (client must act first)", () => {
    expect(closeRequest(clientRequest)).toBe(clientRequest);
  });

  it("full lifecycle: open (client) → fulfilled (preparer) → closed", () => {
    const open = clientRequest;
    expect(nextActionOwner(open)).toBe("client");

    const fulfilled = fulfillRequest(open);
    expect(nextActionOwner(fulfilled)).toBe("preparer");

    const closed = closeRequest(fulfilled);
    expect(nextActionOwner(closed)).toBeNull();
    expect(closed.resolution).toBe("closed");
  });
});

// ─── Recent activity ────────────────────────────────────────────────────────

describe("recentActivity", () => {
  const t1 = thread([
    msg({ id: "a", sentAt: "2026-08-01T09:00:00.000Z" }),
    msg({ id: "b", sentAt: "2026-08-03T09:00:00.000Z", audience: "internal" }),
  ]);
  const t2: Thread = {
    ...thread([msg({ id: "c", sentAt: "2026-08-02T09:00:00.000Z" })]),
    id: "t2",
  };

  it("returns messages newest-first across threads", () => {
    expect(recentActivity([t1, t2], "firm").map((m) => m.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("filters to the viewer's Role family (client drops the internal note)", () => {
    expect(recentActivity([t1, t2], "client").map((m) => m.id)).toEqual([
      "c",
      "a",
    ]);
  });

  it("respects the limit", () => {
    expect(recentActivity([t1, t2], "firm", 1).map((m) => m.id)).toEqual(["b"]);
  });
});
