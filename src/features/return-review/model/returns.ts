import type { FieldState } from "./field-state";

/** A single value on a Return, tied to the Source Document it was extracted from. */
export type Field = {
  id: string;
  /** What the value represents, e.g. "Wages, tips, other comp". */
  label: string;
  /** The extracted amount, in whole dollars. Formatted at the display edge. */
  value: number;
  state: FieldState;
  /** The Source Document this Field was extracted from, e.g. "W-2 (Acme Corp)". */
  sourceDocument: string;
  /** Why a locked Field can't be changed. Required when `state` is "locked". */
  lockedReason?: string;
};

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
        },
        {
          id: "interest",
          label: "Taxable interest",
          value: 1204,
          state: "ai-suggested",
          sourceDocument: "1099-INT (First National)",
        },
        {
          id: "dividends",
          label: "Ordinary dividends",
          value: 3410,
          state: "needs-approval",
          sourceDocument: "1099-DIV (Vanguard)",
        },
        {
          id: "capital-gains",
          label: "Capital gains",
          value: 6780,
          state: "ai-suggested",
          sourceDocument: "1099-B (Fidelity)",
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
