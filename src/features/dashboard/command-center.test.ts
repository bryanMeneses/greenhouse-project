import { describe, it, expect } from "vitest";

import { dashboardStats, buildActionList } from "./command-center";
import type {
  Field,
  OpenItem,
  Return,
} from "@/features/returns/shared/returns";

const NOW = new Date("2026-08-08T00:00:00");

function lowConfidenceField(id: string): Field {
  return {
    id,
    label: id,
    value: 100,
    state: "needs-approval",
    sourceDocument: "1099-DIV",
    confidence: 0.5,
  };
}

function makeReturn(
  id: string,
  opts: { deadline: string; openItems?: OpenItem[]; fields?: Field[] },
): Return {
  return {
    id,
    client: id,
    returnType: "Individual 1040",
    returnNumber: "RET-2024-001",
    ownerName: "Jordan Avery",
    taxYear: 2024,
    stage: "in-review",
    deadline: opts.deadline,
    openItems: opts.openItems ?? [],
    sections: [{ id: "income", title: "Income", fields: opts.fields ?? [] }],
  };
}

const returns: Return[] = [
  makeReturn("rtn-overdue", {
    deadline: "2026-08-01",
    fields: [lowConfidenceField("f1")],
    openItems: [{ id: "t1", label: "Reviewer handoff", owner: "preparer" }],
  }),
  makeReturn("rtn-blocked", {
    deadline: "2026-11-01",
    openItems: [{ id: "r1", label: "Waiting on client", owner: "client" }],
  }),
  makeReturn("rtn-calm", { deadline: "2026-11-01" }),
];

describe("dashboardStats", () => {
  it("derives the four practice-wide numbers from the seed Returns", () => {
    const byId = Object.fromEntries(
      dashboardStats(returns, NOW).map((stat) => [stat.id, stat.value]),
    );

    expect(byId.active).toBe(3); // none filed
    expect(byId["open-items"]).toBe(1); // Preparer-owned only; the client Request is counted under requests, not here
    expect(byId["needs-review"]).toBe(1); // one low-confidence field awaiting
    expect(byId.requests).toBe(1); // the one client-owned Open Item
  });

  it("flags overdue Returns in the Open items hint", () => {
    const openItems = dashboardStats(returns, NOW).find(
      (stat) => stat.id === "open-items",
    );
    expect(openItems?.hint).toMatch(/1 return overdue/);
  });
});

describe("buildActionList", () => {
  it("ranks the Preparer's own actions across Returns — review batch first, then Open Items", () => {
    const actionList = buildActionList(returns, NOW);

    // The overdue Return leads; its review batch precedes its Open Item. The
    // Client-owned Request on rtn-blocked is waiting on the Client, so it's absent.
    expect(actionList.map((item) => item.id)).toEqual([
      "rtn-overdue:review",
      "rtn-overdue:t1",
    ]);
  });

  it("leaves Client-owned Requests off — the next move is the Client's, not the Preparer's", () => {
    const ids = buildActionList(returns, NOW).map((item) => item.id);
    expect(ids).not.toContain("rtn-blocked:r1");
  });

  it("lifts a high-urgency Open Item above routine work on a calmer Return", () => {
    // Both Returns are in-progress (deadline far out) and unblocked, so they tie on
    // Return rank and fall to alphabetical client order — which would put routine
    // first. Only the item-level "high" urgency should float the escalated row up.
    const routine = makeReturn("rtn-a-routine", {
      deadline: "2026-12-01",
      openItems: [{ id: "x", label: "Routine follow-up", owner: "preparer" }],
    });
    const escalated = makeReturn("rtn-z-hot", {
      deadline: "2026-12-01",
      openItems: [
        { id: "x", label: "Escalated", owner: "preparer", urgency: "high" },
      ],
    });

    const ids = buildActionList([routine, escalated], NOW).map(
      (item) => item.id,
    );
    expect(ids).toEqual(["rtn-z-hot:x", "rtn-a-routine:x"]);
  });

  it("routes each row to the Area where the work happens", () => {
    const actionList = buildActionList(returns, NOW);
    const byId = Object.fromEntries(actionList.map((item) => [item.id, item]));

    expect(byId["rtn-overdue:review"].area).toBe("overview");
    expect(byId["rtn-overdue:review"].kind).toBe("review");
    // A Preparer-owned Open Item opens the review workspace too, not the
    // client-only Requests Area — so the row lands on real content.
    expect(byId["rtn-overdue:t1"].area).toBe("overview");
    expect(byId["rtn-overdue:t1"].kind).toBe("open-item");
  });
});
