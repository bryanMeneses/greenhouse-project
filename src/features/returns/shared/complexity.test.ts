import { describe, expect, it } from "vitest";

import {
  filterComplexityItems,
  summarizeComplexitySections,
  type ComplexityItem,
} from "./complexity";
import { getReturn } from "@/mocks/returns";
import {
  buildFirmComplexityItems,
  getComplexityItems,
} from "@/mocks/complexity";

const taxReturn = getReturn("rtn-reyes-2024")!;

describe("Challenge 09 complexity model", () => {
  it("keeps real Return objects connected while generating a large review map", () => {
    const items = buildFirmComplexityItems(taxReturn);

    expect(items.length).toBeGreaterThanOrEqual(250);
    expect(items.some((item) => item.fieldId === "interest")).toBe(true);
    expect(
      items.some((item) => item.sourceDocument === "1099-DIV (Vanguard)"),
    ).toBe(true);
    expect(items.some((item) => item.kind === "warning")).toBe(true);
    expect(items.some((item) => item.kind === "calculation")).toBe(true);
  });

  it("searches across titles, sections, source documents, and hidden tags", () => {
    const items = getComplexityItems(taxReturn, "firm");

    expect(
      filterComplexityItems(items, "1099-int").map((item) => item.title),
    ).toEqual(expect.arrayContaining(["Taxable interest"]));
    expect(
      filterComplexityItems(items, "warning", "all", "warnings").every(
        (item) => item.sectionId === "warnings",
      ),
    ).toBe(true);
  });

  it("combines status and hierarchy filters without mutating item order", () => {
    const items: ComplexityItem[] = [
      {
        id: "a",
        kind: "field",
        title: "A",
        summary: "Needs work",
        detail: "A detail",
        sectionId: "income",
        sectionTitle: "Income",
        status: "needs-review",
        tags: [],
        audience: "firm",
      },
      {
        id: "b",
        kind: "field",
        title: "B",
        summary: "Waiting",
        detail: "B detail",
        sectionId: "income",
        sectionTitle: "Income",
        status: "waiting",
        tags: [],
        audience: "firm",
      },
      {
        id: "c",
        kind: "warning",
        title: "C",
        summary: "Needs work",
        detail: "C detail",
        sectionId: "warnings",
        sectionTitle: "Warnings",
        status: "needs-review",
        tags: [],
        audience: "firm",
      },
    ];

    expect(
      filterComplexityItems(items, "", "needs-review", "income").map(
        (i) => i.id,
      ),
    ).toEqual(["a"]);
    expect(items.map((item) => item.id)).toEqual(["a", "b", "c"]);
    expect(summarizeComplexitySections(items)).toEqual([
      { id: "income", title: "Income", count: 2 },
      { id: "warnings", title: "Warnings", count: 1 },
    ]);
  });

  it("gives the Client a smaller audience-safe projection", () => {
    const firmItems = getComplexityItems(taxReturn, "firm");
    const clientItems = getComplexityItems(taxReturn, "client");

    expect(clientItems.length).toBeLessThan(firmItems.length);
    expect(clientItems.every((item) => item.audience === "client")).toBe(true);
    expect(
      clientItems.some((item) => item.title.includes("Bank statement")),
    ).toBe(false);
  });
});
