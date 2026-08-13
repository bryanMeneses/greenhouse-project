import { describe, expect, it } from "vitest";

import { connectionsFor, type ConnectionTargetKind } from "./connections";
import { getReturn } from "@/mocks/returns";
import { getThreadsForReturn } from "@/mocks/collaboration";
import { threadsVisibleTo, type Thread } from "./collaboration";

const taxReturn = getReturn("rtn-nguyen-2024")!;
const threads = getThreadsForReturn(taxReturn.id);

function ids(kind: ConnectionTargetKind, focus: string) {
  return { kind, id: focus };
}

describe("connectionsFor", () => {
  it("resolves Field to its Source Document and document Thread", () => {
    const connections = connectionsFor(
      ids("field", "rtn-nguyen-2024-wages"),
      taxReturn,
      threads,
    );

    expect(connections.map((connection) => connection.target)).toEqual([
      { kind: "source-document", id: "doc-w2-acme" },
      { kind: "thread", id: "thread-nguyen-w2" },
    ]);
  });

  it("resolves a Source Document to its Fields and Thread", () => {
    const connections = connectionsFor(
      ids("source-document", "doc-w2-acme"),
      taxReturn,
      threads,
    );

    expect(connections.map((connection) => connection.target.kind)).toEqual([
      "field",
      "thread",
    ]);
  });

  it("resolves a client-owned Request to its Thread (no fabricated document)", () => {
    // The 1098 Request and its Thread are real seed data; there is no real 1098
    // Source Document on this Return, so the resolver invents no document edge.
    const connections = connectionsFor(
      ids("open-item", "rtn-nguyen-2024-req-1098"),
      taxReturn,
      threads,
    );

    expect(connections.map((connection) => connection.target)).toEqual([
      { kind: "thread", id: "thread-nguyen-1098" },
    ]);
  });

  it("resolves a Request-anchored Thread back to its Request only", () => {
    const connections = connectionsFor(
      ids("thread", "thread-nguyen-1098"),
      taxReturn,
      threads,
    );

    expect(connections.map((connection) => connection.target)).toEqual([
      { kind: "open-item", id: "rtn-nguyen-2024-req-1098" },
    ]);
  });

  it("returns no edges for an unknown target", () => {
    expect(
      connectionsFor(ids("field", "does-not-exist"), taxReturn, threads),
    ).toEqual([]);
  });

  it("is audience-neutral — the caller owns the client boundary by passing threadsVisibleTo(...) results", () => {
    const w2Thread = threads.find((t) => t.id === "thread-nguyen-w2")!;
    // An internal-only Thread about a real Source Document.
    const internalThread: Thread = {
      ...w2Thread,
      id: "internal-only-w2",
      messages: w2Thread.messages.map((message) => ({
        ...message,
        audience: "internal" as const,
      })),
    };

    // Handed the Thread directly, the neutral resolver surfaces it...
    const neutral = connectionsFor(
      ids("source-document", "doc-w2-acme"),
      taxReturn,
      [internalThread],
    );
    expect(neutral.some((c) => c.target.id === "internal-only-w2")).toBe(true);

    // ...but a Client surface filters its Thread set first, so it never reaches one.
    const clientGated = connectionsFor(
      ids("source-document", "doc-w2-acme"),
      taxReturn,
      threadsVisibleTo([internalThread], "client"),
    );
    expect(clientGated.some((c) => c.target.kind === "thread")).toBe(false);
  });
});
