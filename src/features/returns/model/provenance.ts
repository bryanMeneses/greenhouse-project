import { formatCurrency } from "@/lib/utils";
import type { Field, FieldSource } from "./returns";

/**
 * The resolved Provenance of a Field: its value re-computed from its Source
 * contributions, plus the operation that produced it.
 * - `identity` — a single source passed through.
 * - `sum` — several sources added together.
 * - `transform` — sources combined with subtraction (e.g. proceeds − cost basis).
 */
export type Derivation = {
  value: number;
  operation: "identity" | "sum" | "transform";
  contributions: FieldSource[];
};

/** A contribution's signed amount — subtracted when its operator is "subtract". */
function signedAmount(source: FieldSource): number {
  return source.operator === "subtract" ? -source.amount : source.amount;
}

/**
 * Resolve a Field's value from its Source contributions, exposing the calculation.
 * The core traceability guarantee (challenge 01): for any sourced Field, the
 * returned value equals the sum/transform of its contributions. A Field with no
 * sources (preparer-entered or computed) resolves to an empty identity.
 */
export function deriveField(field: Field): Derivation {
  const contributions = field.sources ?? [];
  const value = contributions.reduce(
    (total, source) => total + signedAmount(source),
    0,
  );
  const operation = contributions.some((s) => s.operator === "subtract")
    ? "transform"
    : contributions.length > 1
      ? "sum"
      : "identity";
  return { value, operation, contributions };
}

/**
 * The calculation as a compact expression for the Provenance card. An identity
 * shows its single amount ("$84,250"); a sum or transform shows each contribution
 * joined by its operator ("$904 + $300", "$41,200 − $34,420"). The total is
 * presented separately as the Field value.
 */
export function formatCalculation(derivation: Derivation): string {
  if (derivation.operation === "identity") {
    return formatCurrency(derivation.value);
  }
  return derivation.contributions
    .map((source, index) => {
      const amount = formatCurrency(source.amount);
      if (index === 0) return amount;
      const operator = source.operator === "subtract" ? "−" : "+";
      return `${operator} ${amount}`;
    })
    .join(" ");
}

/**
 * The Source Document label for a Field's compact row: the single document's
 * name, or a count when the value draws on several distinct documents. Derived
 * from `sources` so the row and the Provenance card never disagree.
 */
export function fieldSourceLabel(field: Field): string {
  const documentIds = new Set((field.sources ?? []).map((s) => s.documentId));
  if (documentIds.size > 1) return `${documentIds.size} Source Documents`;
  return field.sourceDocument;
}
