import { describe, it, expect } from "vitest";

import { deriveReturnStatus, viewerIsBlocked, viewerIsWaiting } from "./derive-status";
import type { OpenItem, Return, Stage } from "./returns";

const NOW = new Date("2026-08-08T00:00:00"); // matches SEED_TODAY

const clientItem: OpenItem = {
  id: "oi-client",
  label: "Client needs to sign",
  owner: "client",
};
const preparerItem: OpenItem = {
  id: "oi-prep",
  label: "Preparer needs to review",
  owner: "preparer",
};

function makeReturn(opts: {
  stage?: Stage;
  deadline?: string;
  openItems?: OpenItem[];
}): Return {
  return {
    id: "test-return",
    client: "Test Client",
    taxYear: 2024,
    stage: opts.stage ?? "in-review",
    deadline: opts.deadline ?? "2026-09-15",
    openItems: opts.openItems ?? [],
    sections: [],
  };
}

describe("deriveReturnStatus — stepper positions", () => {
  it("marks intake as current and the rest upcoming for an intake Return", () => {
    const status = deriveReturnStatus(
      makeReturn({ stage: "intake" }),
      NOW,
    );
    expect(status.steps.map((s) => `${s.key}:${s.completed ? "c" : s.current ? ">" : "u"}`))
      .toEqual(["intake:>", "in-review:u", "ready-to-file:u", "filed:u"]);
  });

  it("marks intake completed, in-review current, rest upcoming", () => {
    const status = deriveReturnStatus(
      makeReturn({ stage: "in-review" }),
      NOW,
    );
    expect(status.steps.map((s) => `${s.key}:${s.completed ? "c" : s.current ? ">" : "u"}`))
      .toEqual(["intake:c", "in-review:>", "ready-to-file:u", "filed:u"]);
  });

  it("marks intake and in-review completed, ready-to-file current, filed upcoming", () => {
    const status = deriveReturnStatus(
      makeReturn({ stage: "ready-to-file" }),
      NOW,
    );
    expect(status.steps.map((s) => `${s.key}:${s.completed ? "c" : s.current ? ">" : "u"}`))
      .toEqual(["intake:c", "in-review:c", "ready-to-file:>", "filed:u"]);
  });

  it("always marks filed as upcoming (never completed or current)", () => {
    for (const stage of ["intake", "in-review", "ready-to-file"] as Stage[]) {
      const status = deriveReturnStatus(makeReturn({ stage }), NOW);
      const filed = status.steps.find((s) => s.key === "filed")!;
      expect(filed.completed).toBe(false);
      expect(filed.current).toBe(false);
      expect(filed.upcoming).toBe(true);
    }
  });
});

describe("deriveReturnStatus — blocked-by", () => {
  it("returns null when there are no open items", () => {
    const status = deriveReturnStatus(makeReturn({}), NOW);
    expect(status.blockedBy).toBeNull();
  });

  it("returns 'client' when only a client-owned item exists", () => {
    const status = deriveReturnStatus(
      makeReturn({ openItems: [clientItem] }),
      NOW,
    );
    expect(status.blockedBy).toBe("client");
  });

  it("returns 'preparer' when only a preparer-owned item exists", () => {
    const status = deriveReturnStatus(
      makeReturn({ openItems: [preparerItem] }),
      NOW,
    );
    expect(status.blockedBy).toBe("preparer");
  });

  it("returns 'client' when both exist (client takes priority)", () => {
    const status = deriveReturnStatus(
      makeReturn({ openItems: [preparerItem, clientItem] }),
      NOW,
    );
    expect(status.blockedBy).toBe("client");
  });
});

describe("deriveReturnStatus — open items grouped by owner", () => {
  it("groups items under their owner", () => {
    const status = deriveReturnStatus(
      makeReturn({ openItems: [clientItem, preparerItem] }),
      NOW,
    );
    expect(status.openItemsByOwner.client).toEqual([clientItem]);
    expect(status.openItemsByOwner.preparer).toEqual([preparerItem]);
  });

  it("returns empty arrays for owners with no items", () => {
    const status = deriveReturnStatus(makeReturn({}), NOW);
    expect(status.openItemsByOwner.client).toHaveLength(0);
    expect(status.openItemsByOwner.preparer).toHaveLength(0);
  });
});

describe("deriveReturnStatus — deadline state", () => {
  it("marks a past deadline as overdue", () => {
    const status = deriveReturnStatus(
      makeReturn({ deadline: "2026-08-01" }),
      NOW,
    );
    expect(status.deadline.isOverdue).toBe(true);
    expect(status.deadline.isNearDeadline).toBe(false);
  });

  it("marks a deadline today as near-deadline (not overdue)", () => {
    const status = deriveReturnStatus(
      makeReturn({ deadline: "2026-08-08" }),
      NOW,
    );
    expect(status.deadline.isOverdue).toBe(false);
    expect(status.deadline.isNearDeadline).toBe(true);
    expect(status.deadline.daysUntilDeadline).toBe(0);
  });

  it("marks a deadline 7 days out as near-deadline (inclusive)", () => {
    const status = deriveReturnStatus(
      makeReturn({ deadline: "2026-08-15" }),
      NOW,
    );
    expect(status.deadline.isOverdue).toBe(false);
    expect(status.deadline.isNearDeadline).toBe(true);
    expect(status.deadline.daysUntilDeadline).toBe(7);
  });

  it("marks a deadline 8 days out as clear", () => {
    const status = deriveReturnStatus(
      makeReturn({ deadline: "2026-08-16" }),
      NOW,
    );
    expect(status.deadline.isOverdue).toBe(false);
    expect(status.deadline.isNearDeadline).toBe(false);
    expect(status.deadline.daysUntilDeadline).toBe(8);
  });

  it("marks a far-future deadline as clear", () => {
    const status = deriveReturnStatus(
      makeReturn({ deadline: "2026-12-01" }),
      NOW,
    );
    expect(status.deadline.isOverdue).toBe(false);
    expect(status.deadline.isNearDeadline).toBe(false);
    expect(status.deadline.daysUntilDeadline).toBeGreaterThan(7);
  });
});

describe("deriveReturnStatus — stage reference", () => {
  it("exposes the current Stage", () => {
    const status = deriveReturnStatus(
      makeReturn({ stage: "ready-to-file" }),
      NOW,
    );
    expect(status.stage).toBe("ready-to-file");
  });
});

describe("audience-relative helpers", () => {
  it("viewerIsBlocked: true when blockedBy matches viewer owner", () => {
    const status = deriveReturnStatus(
      makeReturn({ openItems: [clientItem] }),
      NOW,
    );
    expect(viewerIsBlocked(status, "client")).toBe(true);
    expect(viewerIsBlocked(status, "preparer")).toBe(false);
  });

  it("viewerIsBlocked: false when blockedBy is null", () => {
    const status = deriveReturnStatus(makeReturn({}), NOW);
    expect(viewerIsBlocked(status, "client")).toBe(false);
    expect(viewerIsBlocked(status, "preparer")).toBe(false);
  });

  it("viewerIsWaiting: true when blockedBy is the other party", () => {
    const status = deriveReturnStatus(
      makeReturn({ openItems: [clientItem] }),
      NOW,
    );
    expect(viewerIsWaiting(status, "preparer")).toBe(true);
    expect(viewerIsWaiting(status, "client")).toBe(false);
  });

  it("viewerIsWaiting: false when blockedBy is null", () => {
    const status = deriveReturnStatus(makeReturn({}), NOW);
    expect(viewerIsWaiting(status, "preparer")).toBe(false);
    expect(viewerIsWaiting(status, "client")).toBe(false);
  });
});
