import type { FieldState } from "./field-state";

/**
 * One contribution to a Field's value, traced back to a region of a Source
 * Document (challenge 01). One source is an identity; several combine as a sum,
 * or a transform when an `operator` subtracts. `deriveField` resolves the value.
 */
export type FieldSource = {
  /** id into SOURCE_DOCUMENTS. */
  documentId: string;
  /** 1-based page the value appears on. */
  page: number;
  /** Region key matching a SourceLine on that page — drives the viewer highlight. */
  region: string;
  /** Short excerpt from the Source Document, shown in the Provenance card. */
  snippet: string;
  /** This source's contribution to the Field value, in whole dollars. */
  amount: number;
  /** How the amount combines into the total. Defaults to "add"; "subtract" makes the Field a transform. */
  operator?: "add" | "subtract";
};

/**
 * A Preparer's correction to an AI-extracted Field (challenge 10). The AI's
 * original value stays in the Field's `value`; this records what the Preparer
 * changed it to, so both can be shown ("AI said $4,200 · you changed to $4,250").
 */
export type FieldCorrection = {
  /** The value the Preparer entered in place of the AI's. */
  value: number;
};

/** A single value on a Return, tied to the Source Document it was extracted from. */
export type Field = {
  id: string;
  /** What the value represents, e.g. "Wages, tips, other comp". */
  label: string;
  /** The AI-extracted amount, in whole dollars. Stays put even after a correction. */
  value: number;
  state: FieldState;
  /** The Source Document shown on the compact row, e.g. "W-2 (Acme Corp)". */
  sourceDocument: string;
  /**
   * The authoritative Provenance chain. Present on extracted Fields; absent on
   * preparer-entered (editable) and computed (locked) Fields. When present, the
   * Field value equals the sum of the contributions (see `deriveField`).
   */
  sources?: FieldSource[];
  /**
   * The AI's certainty in this extracted value, as a fraction in [0, 1]
   * (challenge 10). Present on AI-extracted Fields; absent on preparer-entered
   * and computed Fields. Banded for display by `bandForConfidence`.
   */
  confidence?: number;
  /** The AI's evidence/reasoning in plain language, shown on the Provenance card. */
  rationale?: string;
  /** The Preparer's correction, if any. When set, `currentValue` returns it. */
  correction?: FieldCorrection;
  /** Why a locked Field can't be changed. Required when `state` is "locked". */
  lockedReason?: string;
};

/**
 * The Field's current value: the Preparer's correction if one exists, otherwise
 * the AI's extracted value. Every display surface reads through this so a
 * corrected Field never shows its stale AI number as the live figure.
 */
export function currentValue(field: Field): number {
  return field.correction ? field.correction.value : field.value;
}

/** A group of related Fields on a Return, e.g. Income or Deductions. */
export type Section = {
  id: string;
  title: string;
  fields: Field[];
};

/** Where a Return sits in its lifecycle. */
export type Stage = "intake" | "in-review" | "ready-to-file";

/** A tax return prepared for one Client for one tax year. */
export type Return = {
  id: string;
  client: string;
  taxYear: number;
  stage: Stage;
  sections: Section[];
};

const REYES_2024: Return = {
  id: "rtn-reyes-2024",
  client: "Reyes Household",
  taxYear: 2024,
  stage: "in-review",
  sections: [
    {
      id: "income",
      title: "Income",
      fields: [
        {
          id: "wages",
          label: "Wages, tips, other comp",
          value: 84250,
          state: "verified",
          sourceDocument: "W-2 (Acme Corp)",
          confidence: 0.99,
          rationale: "Read straight from Box 1 of the Acme Corp W-2.",
          sources: [
            {
              documentId: "doc-w2-acme",
              page: 1,
              region: "box-1",
              snippet:
                "Box 1  Wages, tips, other comp .............. 84,250.00",
              amount: 84250,
            },
          ],
        },
        {
          // Combines two 1099-INTs — the seed's summed Field. The compact-row
          // label ("2 Source Documents") is derived from `sources`, not this string.
          id: "interest",
          label: "Taxable interest",
          value: 1204,
          state: "ai-suggested",
          sourceDocument: "1099-INT (First National)",
          confidence: 0.86,
          rationale: "Added the interest reported on both 1099-INT forms.",
          sources: [
            {
              documentId: "doc-1099int-first",
              page: 1,
              region: "box-1",
              snippet: "Box 1  Interest income ...................... 904.00",
              amount: 904,
            },
            {
              documentId: "doc-1099int-second",
              page: 1,
              region: "box-1",
              snippet: "Box 1  Interest income ...................... 300.00",
              amount: 300,
            },
          ],
        },
        {
          id: "dividends",
          label: "Ordinary dividends",
          value: 3410,
          state: "needs-approval",
          sourceDocument: "1099-DIV (Vanguard)",
          confidence: 0.64,
          rationale:
            "Taken from Box 1a of the Vanguard 1099-DIV, but the scan was faint — worth confirming the amount.",
          sources: [
            {
              documentId: "doc-1099div-vanguard",
              page: 1,
              region: "box-1a",
              snippet: "Box 1a  Total ordinary dividends ............ 3,410.00",
              amount: 3410,
            },
          ],
        },
        {
          // Net gain = proceeds − cost basis — the seed's derived (transform) Field.
          id: "capital-gains",
          label: "Capital gains",
          value: 6780,
          state: "ai-suggested",
          sourceDocument: "1099-B (Fidelity)",
          confidence: 0.79,
          rationale:
            "Net gain from the Fidelity 1099-B: proceeds minus cost basis.",
          sources: [
            {
              documentId: "doc-1099b-fidelity",
              page: 1,
              region: "proceeds",
              snippet:
                "Proceeds from broker transactions ........... 41,200.00",
              amount: 41200,
              operator: "add",
            },
            {
              documentId: "doc-1099b-fidelity",
              page: 1,
              region: "cost-basis",
              snippet:
                "Cost or other basis ......................... 34,420.00",
              amount: 34420,
              operator: "subtract",
            },
          ],
        },
      ],
    },
    {
      id: "deductions",
      title: "Deductions",
      fields: [
        {
          id: "salt",
          label: "State & local taxes",
          value: 10000,
          state: "editable",
          sourceDocument: "Preparer worksheet",
        },
        {
          id: "mortgage-interest",
          label: "Home mortgage interest",
          value: 12340,
          state: "verified",
          sourceDocument: "1098 (Wells Fargo)",
          confidence: 0.97,
          rationale: "Read from Box 1 of the Wells Fargo 1098.",
          sources: [
            {
              documentId: "doc-1098-wells",
              page: 1,
              region: "box-1",
              snippet:
                "Box 1  Mortgage interest received ........... 12,340.00",
              amount: 12340,
            },
          ],
        },
        {
          id: "charitable",
          label: "Charitable contributions",
          value: 2500,
          state: "editable",
          sourceDocument: "Client-provided receipts",
        },
      ],
    },
    {
      id: "credits",
      title: "Credits",
      fields: [
        {
          id: "child-tax-credit",
          label: "Child tax credit",
          value: 4000,
          state: "locked",
          sourceDocument: "Derived from dependents",
          lockedReason:
            "Set by filing status and dependents — edit the dependents section to change it.",
        },
        {
          id: "education-credit",
          label: "Education credit",
          value: 1000,
          state: "needs-approval",
          sourceDocument: "1098-T (State University)",
          confidence: 0.58,
          rationale:
            "Computed from the State University 1098-T; the eligibility rules make this one less certain.",
          sources: [
            {
              documentId: "doc-1098t-stateu",
              page: 1,
              region: "credit-basis",
              snippet: "American Opportunity Credit (computed) ...... 1,000.00",
              amount: 1000,
            },
          ],
        },
      ],
    },
    {
      id: "payments",
      title: "Payments & withholding",
      fields: [
        {
          id: "federal-withholding",
          label: "Federal income tax withheld",
          value: 14120,
          state: "verified",
          sourceDocument: "W-2 (Acme Corp)",
          confidence: 0.91,
          rationale: "Read from Box 2 of the Acme Corp W-2.",
          sources: [
            {
              documentId: "doc-w2-acme",
              page: 1,
              region: "box-2",
              snippet: "Box 2  Federal income tax withheld ......... 14,120.00",
              amount: 14120,
            },
          ],
        },
        {
          id: "estimated-payments",
          label: "Estimated tax payments",
          value: 4000,
          state: "locked",
          sourceDocument: "IRS account transcript",
          lockedReason:
            "Imported from the IRS account transcript — read-only in the platform.",
        },
      ],
    },
  ],
};

/** All seed Returns. The single source of truth for Field data. */
export const RETURNS: Return[] = [REYES_2024];

/** Look up a seed Return by id. */
export function getReturn(id: string): Return | undefined {
  return RETURNS.find((r) => r.id === id);
}
