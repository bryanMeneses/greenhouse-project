import { describe, it, expect } from "vitest";

import {
  collectFirmThreads,
  threadOwnerRank,
} from "./pooled-threads";
import { THREADS } from "@/mocks/collaboration";
import { NGUYEN_1098_REQUEST_ID, RETURNS } from "@/mocks/returns";

// `collectFirmThreads` reads Threads via `getThreadsForReturn`, which is keyed off
// the real seed (`@/mocks/collaboration`) rather than an argument — unlike the
// pooled Documents test, which can build a synthetic Return + Fields, a pooled
// Threads test has to exercise the real seed RETURNS so its Thread ids resolve.

describe("collectFirmThreads", () => {
  const rows = collectFirmThreads(RETURNS);

  it("pools exactly one row per seeded Thread on a roster Return — and only roster Returns", () => {
    // The firm pool covers the firm's book (`RETURNS`). Jordan's personal Return
    // (`rtn-avery-2024`, prepared by Dana) sits outside that book, so its Threads —
    // Jordan's own client conversations — never surface in the firm-wide inbox.
    const rosterReturnIds = new Set(RETURNS.map((r) => r.id));
    const rosterThreads = THREADS.filter((t) =>
      rosterReturnIds.has(t.returnId),
    );
    expect(rows).toHaveLength(rosterThreads.length);
    expect(new Set(rows.map((r) => r.rowId)).size).toBe(rosterThreads.length);
    expect(rows.some((r) => r.returnId === "rtn-avery-2024")).toBe(false);
  });

  it("names each row's own client — not de-duped across Returns", () => {
    const nguyen = rows.filter((r) => r.returnId === "rtn-nguyen-2024");
    const reyes = rows.filter((r) => r.returnId === "rtn-reyes-2024");
    expect(nguyen.every((r) => r.client === "Nguyen Family")).toBe(true);
    expect(reyes.every((r) => r.client === "Reyes Household")).toBe(true);
  });

  it("resolves an open-item Subject's label from the Return's actual Open Items", () => {
    const owensRow = rows.find((r) => r.returnId === "rtn-owens-2024");
    expect(owensRow?.subjectDetail).toBe("Signed engagement letter");
  });

  it("resolves a return/document Subject's label without touching Open Items", () => {
    const reyesReturnRow = rows.find(
      (r) => r.returnId === "rtn-reyes-2024" && r.subjectKind === "return",
    );
    const reyesDocRow = rows.find(
      (r) =>
        r.returnId === "rtn-reyes-2024" && r.subjectKind === "source-document",
    );
    expect(reyesReturnRow?.subjectDetail).toBe("the Return");
    expect(reyesDocRow?.subjectDetail).toBe("W-2 (Acme Corp)");
  });

  it("resolves next-action owner only for an open-item Subject, tracking its actual Open Item", () => {
    const nguyen1098Row = rows.find(
      (r) => r.subjectKind === "open-item" && r.subjectDetail.includes("1098"),
    );
    const owensRow = rows.find((r) => r.returnId === "rtn-owens-2024");
    const okaforRow = rows.find((r) => r.returnId === "rtn-okafor-2024");
    const reyesReturnRow = rows.find(
      (r) => r.returnId === "rtn-reyes-2024" && r.subjectKind === "return",
    );

    expect(nguyen1098Row?.nextActionOwner).toBe("client");
    expect(owensRow?.nextActionOwner).toBe("client");
    expect(okaforRow?.nextActionOwner).toBe("preparer");
    // A return/document Subject has no Open Item to own — always null.
    expect(reyesReturnRow?.nextActionOwner).toBeNull();
  });

  it("reads audience via the shared threadAudience rule — mixed Internal + Client-visible reads client-visible", () => {
    const w2Row = rows.find((r) => r.threadId === "thread-nguyen-w2");
    const okaforRow = rows.find((r) => r.returnId === "rtn-okafor-2024");
    expect(w2Row?.audience).toBe("client-visible");
    // Every Message on this Thread is Internal — never crosses the boundary.
    expect(okaforRow?.audience).toBe("internal");
  });

  it("flags both audiences on a Thread that carries both, so the row can badge it 'Mixed'", () => {
    const w2Row = rows.find((r) => r.threadId === "thread-nguyen-w2");
    const owensRow = rows.find((r) => r.threadId === "thread-owens-engagement");
    const okaforRow = rows.find((r) => r.returnId === "rtn-okafor-2024");
    const reyesRow = rows.find(
      (r) => r.returnId === "rtn-reyes-2024" && r.subjectKind === "return",
    );

    // Internal note inside a client-visible Thread (both seed examples).
    expect(w2Row?.hasInternal).toBe(true);
    expect(w2Row?.hasClientVisible).toBe(true);
    expect(owensRow?.hasInternal).toBe(true);
    expect(owensRow?.hasClientVisible).toBe(true);
    // All-Internal and all-Client-visible Threads stay single-audience.
    expect(okaforRow?.hasInternal).toBe(true);
    expect(okaforRow?.hasClientVisible).toBe(false);
    expect(reyesRow?.hasInternal).toBe(false);
    expect(reyesRow?.hasClientVisible).toBe(true);
  });

  it("takes the most recent Message as lastMessage, by sentAt not array order", () => {
    const w2Row = rows.find((r) => r.threadId === "thread-nguyen-w2");
    // The seed's 3rd message (an internal note) is timestamped after its 2nd.
    expect(w2Row?.lastMessage.authorName).toBe("Jordan Avery");
    expect(w2Row?.lastMessage.body).toContain("Cross-checked");
    expect(w2Row?.messageCount).toBe(3);
  });

  it(`carries the Nguyen 1098 Request's known id (${NGUYEN_1098_REQUEST_ID})`, () => {
    const row = rows.find((r) => r.threadId === "thread-nguyen-1098");
    expect(row?.subjectDetail).toBe("2024 Form 1098 (mortgage interest)");
  });
});

describe("threadOwnerRank", () => {
  it("ranks a Client-owed action before the firm's, then nothing owed", () => {
    expect(threadOwnerRank({ nextActionOwner: "client" })).toBeLessThan(
      threadOwnerRank({ nextActionOwner: "preparer" }),
    );
    expect(threadOwnerRank({ nextActionOwner: "preparer" })).toBeLessThan(
      threadOwnerRank({ nextActionOwner: null }),
    );
  });
});
