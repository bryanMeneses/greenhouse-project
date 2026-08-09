import { describe, it, expect } from "vitest";

import { deriveField, fieldSourceLabel, formatCalculation } from "./provenance";
import { getReturn, type Field } from "./returns";

const taxReturn = getReturn("rtn-reyes-2024")!;
const allFields = taxReturn.sections.flatMap((s) => s.fields);

function seedField(id: string): Field {
  const field = allFields.find((f) => f.id === id);
  if (!field) throw new Error(`No seed field ${id}`);
  return field;
}

describe("deriveField", () => {
  it("treats a single-source Field as an identity", () => {
    const wages = seedField("wages");
    const derivation = deriveField(wages);

    expect(derivation.operation).toBe("identity");
    expect(derivation.contributions).toHaveLength(1);
    expect(derivation.value).toBe(84250);
  });

  it("sums the contributions of a multi-source Field", () => {
    const interest = seedField("interest");
    const derivation = deriveField(interest);

    expect(derivation.operation).toBe("sum");
    expect(derivation.contributions.map((c) => c.amount)).toEqual([904, 300]);
    expect(derivation.value).toBe(1204);
  });

  it("subtracts for a transform Field (proceeds − cost basis)", () => {
    const gains = seedField("capital-gains");
    const derivation = deriveField(gains);

    expect(derivation.operation).toBe("transform");
    // 41,200 proceeds − 34,420 cost basis = 6,780 net gain.
    expect(derivation.value).toBe(6780);
  });

  it("produces a value equal to its Field's value for every sourced seed Field", () => {
    // The core invariant: a derived value equals the sum/transform of its sources.
    for (const field of allFields) {
      if (!field.sources) continue;
      expect(deriveField(field).value).toBe(field.value);
    }
  });

  it("is an empty identity for a Field with no sources", () => {
    const field: Field = {
      id: "x",
      label: "Preparer entry",
      value: 0,
      state: "editable",
      sourceDocument: "Preparer worksheet",
    };

    const derivation = deriveField(field);
    expect(derivation.operation).toBe("identity");
    expect(derivation.contributions).toEqual([]);
    expect(derivation.value).toBe(0);
  });
});

describe("formatCalculation", () => {
  it("shows a single amount for an identity", () => {
    expect(formatCalculation(deriveField(seedField("wages")))).toBe("$84,250");
  });

  it("shows each contribution joined for a sum", () => {
    expect(formatCalculation(deriveField(seedField("interest")))).toBe(
      "$904 + $300",
    );
  });

  it("shows a subtraction for a transform", () => {
    expect(formatCalculation(deriveField(seedField("capital-gains")))).toBe(
      "$41,200 − $34,420",
    );
  });
});

describe("fieldSourceLabel", () => {
  it("names the single document behind a Field", () => {
    // capital-gains draws two lines from one 1099-B — still one document.
    expect(fieldSourceLabel(seedField("wages"))).toBe("W-2 (Acme Corp)");
    expect(fieldSourceLabel(seedField("capital-gains"))).toBe(
      "1099-B (Fidelity)",
    );
  });

  it("counts documents when a Field spans several", () => {
    expect(fieldSourceLabel(seedField("interest"))).toBe("2 Source Documents");
  });
});
