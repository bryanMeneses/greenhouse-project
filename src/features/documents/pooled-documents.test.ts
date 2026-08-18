import { describe, it, expect } from "vitest";

import { collectFirmDocuments } from "./pooled-documents";
import type { Field, Return } from "@/features/returns/shared/returns";

/** A Field that traces to one Source Document (only the bits pooling reads). */
function fieldFrom(id: string, label: string, documentId: string): Field {
  return {
    id,
    label,
    value: 100,
    state: "verified",
    sourceDocument: `${documentId} title`,
    sources: [
      { documentId, page: 1, region: "box-1", snippet: "…", amount: 100 },
    ],
  };
}

function makeReturn(
  id: string,
  client: string,
  fields: Field[],
  overrides: Partial<Return> = {},
): Return {
  return {
    id,
    client,
    returnType: "Individual 1040",
    returnNumber: "RET-2024-001",
    ownerName: "Jordan Avery",
    taxYear: 2024,
    stage: "in-review",
    deadline: "2026-09-15",
    openItems: [],
    sections: [{ id: "income", title: "Income", fields }],
    ...overrides,
  };
}

describe("collectFirmDocuments", () => {
  it("pools one row per (Return, Document), so a shared documentId yields a row per Return", () => {
    const returns = [
      makeReturn("rtn-a", "Alpha", [fieldFrom("a-w2", "Wages", "doc-w2-acme")]),
      makeReturn("rtn-b", "Beta", [fieldFrom("b-w2", "Wages", "doc-w2-acme")]),
    ];

    const rows = collectFirmDocuments(returns);

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.rowId)).toEqual([
      "rtn-a:doc-w2-acme",
      "rtn-b:doc-w2-acme",
    ]);
    // Each row names its own Return — the pool is not de-duped across Returns.
    expect(rows.map((row) => row.client)).toEqual(["Alpha", "Beta"]);
  });

  it("collapses a Document that feeds several Fields on one Return into a single row", () => {
    const returns = [
      makeReturn("rtn-a", "Alpha", [
        fieldFrom("a-int1", "Taxable interest", "doc-1099int-first"),
        fieldFrom("a-int2", "Interest adj", "doc-1099int-first"),
      ]),
    ];

    const rows = collectFirmDocuments(returns);

    expect(rows).toHaveLength(1);
    expect(rows[0].fieldLabels).toEqual(["Taxable interest", "Interest adj"]);
  });

  it("reads kind and upload date from the Document facsimile, not the Return", () => {
    const rows = collectFirmDocuments([
      makeReturn("rtn-a", "Alpha", [fieldFrom("a-w2", "Wages", "doc-w2-acme")]),
    ]);

    expect(rows[0].kind).toBe("W-2");
    // Deterministic seed metadata — a real ISO date, not empty.
    expect(rows[0].uploadedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(rows[0].title).toBe("doc-w2-acme title");
  });

  it("falls back gracefully for an unknown documentId", () => {
    const rows = collectFirmDocuments([
      makeReturn("rtn-a", "Alpha", [fieldFrom("a-x", "Mystery", "doc-none")]),
    ]);

    expect(rows[0].kind).toBe("Document");
    expect(rows[0].uploadedAt).toBe("");
  });
});
