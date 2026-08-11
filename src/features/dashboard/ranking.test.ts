import { describe, it, expect } from "vitest";

import { rankDashboard } from "./ranking";
import type {
  Field,
  OpenItem,
  Return,
  Stage,
} from "@/features/returns/shared/returns";

const NOW = new Date("2026-08-08T00:00:00");

/** A low-Confidence (0.5) Field in the given state, for building fixtures. */
function lowConfidenceField(id: string, state: Field["state"]): Field {
  return {
    id,
    label: id,
    value: 100,
    state,
    sourceDocument: "1099-DIV",
    confidence: 0.5,
  };
}

/** A High-Confidence (0.95) verified Field — never queues for review. */
function highConfidenceField(id: string): Field {
  return {
    id,
    label: id,
    value: 100,
    state: "verified",
    sourceDocument: "W-2",
    confidence: 0.95,
  };
}

function makeReturn(
  id: string,
  opts: {
    deadline: string;
    stage?: Stage;
    openItems?: OpenItem[];
    fields?: Field[];
  },
): Return {
  return {
    id,
    client: id,
    taxYear: 2024,
    stage: opts.stage ?? "in-review",
    deadline: opts.deadline,
    openItems: opts.openItems ?? [],
    sections: [{ id: "income", title: "Income", fields: opts.fields ?? [] }],
  };
}

const clientItem: OpenItem = {
  id: "oi-client",
  label: "Waiting on client",
  owner: "client",
};
const preparerItem: OpenItem = {
  id: "oi-prep",
  label: "Preparer action",
  owner: "preparer",
};

describe("rankDashboard — group assignment", () => {
  it("puts an overdue Return in Needs you now", () => {
    const [ranked] = rankDashboard(
      [makeReturn("overdue", { deadline: "2026-08-01" })],
      NOW,
    );
    expect(ranked.urgency).toBe("overdue");
    expect(ranked.group).toBe("needs-you-now");
  });

  it("puts a near-deadline Return in Needs you now", () => {
    const [ranked] = rankDashboard(
      [makeReturn("soon", { deadline: "2026-08-12" })],
      NOW,
    );
    expect(ranked.urgency).toBe("due-soon");
    expect(ranked.group).toBe("needs-you-now");
  });

  it("puts a Client-blocked Return in Waiting on others", () => {
    const [ranked] = rankDashboard(
      [
        makeReturn("blocked", {
          deadline: "2026-11-01",
          openItems: [clientItem],
        }),
      ],
      NOW,
    );
    expect(ranked.urgency).toBe("blocked-on-client");
    expect(ranked.group).toBe("waiting-on-others");
  });

  it("puts a Return with low-Confidence Fields awaiting review in Needs you now", () => {
    const [ranked] = rankDashboard(
      [
        makeReturn("review", {
          deadline: "2026-11-01",
          fields: [lowConfidenceField("f1", "needs-approval")],
        }),
      ],
      NOW,
    );
    expect(ranked.urgency).toBe("needs-review");
    expect(ranked.group).toBe("needs-you-now");
  });

  it("puts a Return with nothing pressing in On track", () => {
    const [ranked] = rankDashboard(
      [
        makeReturn("calm", {
          deadline: "2026-11-01",
          fields: [highConfidenceField("f1")],
        }),
      ],
      NOW,
    );
    expect(ranked.urgency).toBe("in-progress");
    expect(ranked.group).toBe("on-track");
  });
});

describe("rankDashboard — priority", () => {
  it("ranks the more urgent Return first across the whole list", () => {
    const ranked = rankDashboard(
      [
        makeReturn("calm", { deadline: "2026-12-01" }),
        makeReturn("blocked", {
          deadline: "2026-12-01",
          openItems: [clientItem],
        }),
        makeReturn("overdue", { deadline: "2026-08-01" }),
        makeReturn("review", {
          deadline: "2026-12-01",
          fields: [lowConfidenceField("f", "needs-approval")],
        }),
        makeReturn("soon", { deadline: "2026-08-10" }),
      ],
      NOW,
    );

    expect(ranked.map((r) => r.return.id)).toEqual([
      "overdue",
      "soon",
      "blocked",
      "review",
      "calm",
    ]);
  });

  it("orders the most urgent Returns first within their group", () => {
    const ranked = rankDashboard(
      [
        makeReturn("soon-later", { deadline: "2026-08-14" }),
        makeReturn("overdue-recent", { deadline: "2026-08-05" }),
        makeReturn("overdue-older", { deadline: "2026-07-20" }),
        makeReturn("soon-sooner", { deadline: "2026-08-09" }),
      ],
      NOW,
    );

    // All in Needs you now; ordered by how close the deadline is (soonest first).
    expect(ranked.map((r) => r.return.id)).toEqual([
      "overdue-older",
      "overdue-recent",
      "soon-sooner",
      "soon-later",
    ]);
  });

  it("lets deadline pressure outrank a Client blocker", () => {
    const [ranked] = rankDashboard(
      [
        makeReturn("overdue-and-blocked", {
          deadline: "2026-08-01",
          openItems: [clientItem],
        }),
      ],
      NOW,
    );
    // Overdue wins: it surfaces to the Preparer even though the Client is blocking.
    expect(ranked.urgency).toBe("overdue");
    expect(ranked.group).toBe("needs-you-now");
  });
});

describe("rankDashboard — deadline boundary", () => {
  it("treats a deadline exactly at the near-deadline window as due-soon", () => {
    const [ranked] = rankDashboard(
      [makeReturn("edge", { deadline: "2026-08-15" })], // 7 days out
      NOW,
    );
    expect(ranked.daysUntilDeadline).toBe(7);
    expect(ranked.urgency).toBe("due-soon");
  });

  it("treats a deadline just past the window as not urgent on its own", () => {
    const [ranked] = rankDashboard(
      [makeReturn("edge", { deadline: "2026-08-16" })], // 8 days out
      NOW,
    );
    expect(ranked.daysUntilDeadline).toBe(8);
    expect(ranked.urgency).toBe("in-progress");
  });
});

describe("rankDashboard — row stats", () => {
  it("counts Open Items regardless of owner", () => {
    const [ranked] = rankDashboard(
      [
        makeReturn("r", {
          deadline: "2026-12-01",
          openItems: [clientItem, preparerItem],
        }),
      ],
      NOW,
    );
    expect(ranked.openItemCount).toBe(2);
  });

  it("counts only low-Confidence Fields still awaiting review", () => {
    const [ranked] = rankDashboard(
      [
        makeReturn("r", {
          deadline: "2026-12-01",
          fields: [
            lowConfidenceField("pending", "needs-approval"),
            lowConfidenceField("already-verified", "verified"),
            highConfidenceField("high"),
          ],
        }),
      ],
      NOW,
    );
    // The verified low-Confidence Field is done; the High-Confidence one never queues.
    expect(ranked.lowConfidenceCount).toBe(1);
  });
});

describe("rankDashboard — empty", () => {
  it("returns an empty list for no Returns", () => {
    expect(rankDashboard([], NOW)).toEqual([]);
  });
});
