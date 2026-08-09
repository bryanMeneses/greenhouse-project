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

/**
 * Who a next action sits with. A Preparer-owned Open Item is the Preparer's to
 * clear; a Client-owned one means the Return is blocked waiting on the taxpayer —
 * the signal that lands a Return in "Waiting on others" on the dashboard (#6).
 */
export type OpenItemOwner = "preparer" | "client";

/**
 * An outstanding action on a Return, with a clear owner. CONTEXT.md's definition
 * also carries urgency; that isn't a per-item field yet — the dashboard derives a
 * Return's urgency from its deadline, blockers, and Review Queue (`rankDashboard`).
 */
export type OpenItem = {
  id: string;
  /** What needs doing, e.g. "Confirm dividend amount on corrected 1099-DIV". */
  label: string;
  owner: OpenItemOwner;
};

/** A tax return prepared for one Client for one tax year. */
export type Return = {
  id: string;
  client: string;
  taxYear: number;
  stage: Stage;
  /**
   * The filing deadline, as an ISO date (YYYY-MM-DD). Drives the dashboard's
   * overdue / near-deadline ranking (#6), measured against a reference "today".
   */
  deadline: string;
  /** Outstanding actions on the Return; Client-owned ones mean it's blocked. */
  openItems: OpenItem[];
  sections: Section[];
};

const REYES_2024: Return = {
  id: "rtn-reyes-2024",
  client: "Reyes Household",
  taxYear: 2024,
  stage: "in-review",
  deadline: "2026-09-15",
  openItems: [
    {
      id: "reyes-confirm-dividends",
      label: "Confirm ordinary dividends against the Vanguard 1099-DIV",
      owner: "preparer",
    },
    {
      id: "reyes-education-credit",
      label: "Re-check education-credit eligibility on the 1098-T",
      owner: "preparer",
    },
  ],
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

/**
 * The reference "today" the seed dashboard ranks against (#6). Fixed so the
 * grouped, deadline-driven ordering renders identically on every load instead of
 * drifting with the wall clock. `rankDashboard` still accepts any `now` for tests.
 */
export const SEED_TODAY = new Date("2026-08-08T00:00:00");

/**
 * A compact spec for a roster Return. REYES_2024 is the hand-authored showcase
 * (full Provenance, real corrections); the rest of the roster exists to give the
 * dashboard a realistic, legible volume of Returns to rank, so `makeReturn` builds
 * valid-but-lighter Returns from just the signals the ranking cares about.
 */
type ReturnSpec = {
  id: string;
  client: string;
  taxYear: number;
  stage: Stage;
  deadline: string;
  /** How many low-Confidence Fields are still awaiting review. */
  lowConfidence: number;
  /** Client-owned Open Items — each one makes the Return blocked on the Client. */
  clientBlockers?: string[];
  /** Preparer-owned Open Items — actions the Preparer still owns. */
  preparerItems?: string[];
};

/** Source Documents a generated low-Confidence Field can trace back to. */
const LOW_CONFIDENCE_POOL = [
  {
    label: "Ordinary dividends",
    title: "1099-DIV (Vanguard)",
    documentId: "doc-1099div-vanguard",
    region: "box-1a",
  },
  {
    label: "Taxable interest",
    title: "1099-INT (First National)",
    documentId: "doc-1099int-first",
    region: "box-1",
  },
  {
    label: "Capital gains",
    title: "1099-B (Fidelity)",
    documentId: "doc-1099b-fidelity",
    region: "proceeds",
  },
] as const;

function makeReturn(spec: ReturnSpec): Return {
  const openItems: OpenItem[] = [
    ...(spec.clientBlockers ?? []).map((label, i) => ({
      id: `${spec.id}-client-${i}`,
      label,
      owner: "client" as const,
    })),
    ...(spec.preparerItems ?? []).map((label, i) => ({
      id: `${spec.id}-prep-${i}`,
      label,
      owner: "preparer" as const,
    })),
  ];

  const wages: Field = {
    id: `${spec.id}-wages`,
    label: "Wages, tips, other comp",
    value: 72000,
    state: "verified",
    sourceDocument: "W-2 (Acme Corp)",
    confidence: 0.98,
    rationale: "Read straight from Box 1 of the W-2.",
    sources: [
      {
        documentId: "doc-w2-acme",
        page: 1,
        region: "box-1",
        snippet: "Box 1  Wages, tips, other comp .............. 72,000.00",
        amount: 72000,
      },
    ],
  };

  // Below the Medium cutoff (0.70) so each one lands in the Review Queue and
  // counts toward the Return's low-Confidence stat on the dashboard.
  const lowConfidenceFields: Field[] = Array.from(
    { length: spec.lowConfidence },
    (_, i): Field => {
      const source = LOW_CONFIDENCE_POOL[i % LOW_CONFIDENCE_POOL.length];
      const amount = 1200 + i * 400;
      return {
        id: `${spec.id}-lc-${i}`,
        label: source.label,
        value: amount,
        state: "needs-approval",
        sourceDocument: source.title,
        confidence: 0.55 + i * 0.04,
        rationale: "The scan was faint — worth confirming this amount.",
        sources: [
          {
            documentId: source.documentId,
            page: 1,
            region: source.region,
            snippet: `${source.label} ...... ${amount.toLocaleString("en-US")}.00`,
            amount,
          },
        ],
      };
    },
  );

  const charitable: Field = {
    id: `${spec.id}-charitable`,
    label: "Charitable contributions",
    value: 2500,
    state: "editable",
    sourceDocument: "Client-provided receipts",
  };

  return {
    id: spec.id,
    client: spec.client,
    taxYear: spec.taxYear,
    stage: spec.stage,
    deadline: spec.deadline,
    openItems,
    sections: [
      {
        id: "income",
        title: "Income",
        fields: [wages, ...lowConfidenceFields],
      },
      { id: "deductions", title: "Deductions", fields: [charitable] },
    ],
  };
}

/**
 * The rest of the roster, spread across deadlines, blockers, low-Confidence
 * counts, and Stages so the dashboard has a realistic volume to group and rank
 * (all relative to SEED_TODAY, 2026-08-08).
 */
const ROSTER: Return[] = [
  // Needs you now — overdue.
  makeReturn({
    id: "rtn-nguyen-2024",
    client: "Nguyen Family",
    taxYear: 2024,
    stage: "in-review",
    deadline: "2026-07-30",
    lowConfidence: 2,
    clientBlockers: ["Waiting on the client's corrected 1099-INT"],
    preparerItems: ["Reconcile interest across both 1099-INTs"],
  }),
  makeReturn({
    id: "rtn-okafor-2024",
    client: "Okafor LLC",
    taxYear: 2024,
    stage: "in-review",
    deadline: "2026-08-01",
    lowConfidence: 1,
    preparerItems: ["Confirm the S-corp officer wages"],
  }),
  // Needs you now — near deadline.
  makeReturn({
    id: "rtn-abbott-2024",
    client: "Abbott & Sons",
    taxYear: 2024,
    stage: "intake",
    deadline: "2026-08-08",
    lowConfidence: 0,
    preparerItems: ["Kick off intake review"],
  }),
  makeReturn({
    id: "rtn-delacruz-2024",
    client: "Dela Cruz Ventures",
    taxYear: 2024,
    stage: "in-review",
    deadline: "2026-08-11",
    lowConfidence: 1,
  }),
  // Needs you now — low-Confidence Fields awaiting review.
  makeReturn({
    id: "rtn-brenner-2024",
    client: "Brenner Consulting",
    taxYear: 2024,
    stage: "in-review",
    deadline: "2026-09-30",
    lowConfidence: 2,
  }),
  makeReturn({
    id: "rtn-castillo-2024",
    client: "Castillo Trust",
    taxYear: 2024,
    stage: "in-review",
    deadline: "2026-10-15",
    lowConfidence: 3,
  }),
  // Waiting on others — blocked on the Client.
  makeReturn({
    id: "rtn-owens-2024",
    client: "Owens Retail",
    taxYear: 2024,
    stage: "in-review",
    deadline: "2026-10-01",
    lowConfidence: 1,
    clientBlockers: ["Need signed engagement letter"],
  }),
  makeReturn({
    id: "rtn-silva-2024",
    client: "Silva Restaurant Group",
    taxYear: 2024,
    stage: "in-review",
    deadline: "2026-09-20",
    lowConfidence: 2,
    clientBlockers: ["Awaiting K-1s from two partnerships"],
  }),
  makeReturn({
    id: "rtn-park-2024",
    client: "Park Holdings",
    taxYear: 2024,
    stage: "intake",
    deadline: "2026-11-15",
    lowConfidence: 0,
    clientBlockers: [
      "Missing prior-year return",
      "Awaiting brokerage 1099 consolidated",
    ],
  }),
  // On track — in progress, nothing pressing.
  makeReturn({
    id: "rtn-vasquez-2024",
    client: "Vasquez & Co",
    taxYear: 2024,
    stage: "in-review",
    deadline: "2026-11-01",
    lowConfidence: 0,
    preparerItems: ["Final read-through before sign-off"],
  }),
  makeReturn({
    id: "rtn-underwood-2024",
    client: "Underwood Estate",
    taxYear: 2024,
    stage: "ready-to-file",
    deadline: "2026-10-30",
    lowConfidence: 0,
  }),
];

/** All seed Returns. The single source of truth for Field data. */
export const RETURNS: Return[] = [REYES_2024, ...ROSTER];

/** Look up a seed Return by id. */
export function getReturn(id: string): Return | undefined {
  return RETURNS.find((r) => r.id === id);
}
