/**
 * Simulated Source Documents — the uploaded evidence (W-2, 1099-INT, …) behind
 * the Fields on a Return. No real OCR or files; these are hardcoded facsimiles
 * rendered by the document viewer (challenge 01). A Field's `sources` reference a
 * document by id and a `region` that matches a line here, which drives the
 * highlight in the viewer.
 */

/** One printed line on a Source Document page, e.g. a box on a W-2. */
export type SourceLine = {
  /** Stable key a Field source points at to highlight this line. */
  region: string;
  /** What the line reads on paper, e.g. "Box 1 — Wages, tips, other comp". */
  label: string;
  /** The amount printed on the document, formatted as on paper (e.g. "84,250.00"). */
  amount: string;
};

/** A single page of a Source Document. */
export type SourceDocumentPage = {
  /** 1-based page number. */
  page: number;
  lines: SourceLine[];
};

/** An uploaded document that serves as the evidence behind values on a Return. */
export type SourceDocument = {
  id: string;
  /** Short form type, e.g. "W-2", "1099-INT". */
  kind: string;
  /** Display title, e.g. "W-2 (Acme Corp)". */
  title: string;
  pages: SourceDocumentPage[];
};

/** The single source of truth for Source Document facsimiles. */
export const SOURCE_DOCUMENTS: Record<string, SourceDocument> = {
  "doc-w2-acme": {
    id: "doc-w2-acme",
    kind: "W-2",
    title: "W-2 (Acme Corp)",
    pages: [
      {
        page: 1,
        lines: [
          {
            region: "box-1",
            label: "Box 1 — Wages, tips, other comp",
            amount: "84,250.00",
          },
          {
            region: "box-2",
            label: "Box 2 — Federal income tax withheld",
            amount: "14,120.00",
          },
          {
            region: "box-3",
            label: "Box 3 — Social security wages",
            amount: "84,250.00",
          },
        ],
      },
    ],
  },
  "doc-1099int-first": {
    id: "doc-1099int-first",
    kind: "1099-INT",
    title: "1099-INT (First National)",
    pages: [
      {
        page: 1,
        lines: [
          {
            region: "box-1",
            label: "Box 1 — Interest income",
            amount: "904.00",
          },
          {
            region: "box-4",
            label: "Box 4 — Federal income tax withheld",
            amount: "0.00",
          },
        ],
      },
    ],
  },
  "doc-1099int-second": {
    id: "doc-1099int-second",
    kind: "1099-INT",
    title: "1099-INT (Second National)",
    pages: [
      {
        page: 1,
        lines: [
          {
            region: "box-1",
            label: "Box 1 — Interest income",
            amount: "300.00",
          },
          {
            region: "box-4",
            label: "Box 4 — Federal income tax withheld",
            amount: "0.00",
          },
        ],
      },
    ],
  },
  "doc-1099div-vanguard": {
    id: "doc-1099div-vanguard",
    kind: "1099-DIV",
    title: "1099-DIV (Vanguard)",
    pages: [
      {
        page: 1,
        lines: [
          {
            region: "box-1a",
            label: "Box 1a — Total ordinary dividends",
            amount: "3,410.00",
          },
          {
            region: "box-1b",
            label: "Box 1b — Qualified dividends",
            amount: "2,980.00",
          },
        ],
      },
    ],
  },
  "doc-1099b-fidelity": {
    id: "doc-1099b-fidelity",
    kind: "1099-B",
    title: "1099-B (Fidelity)",
    pages: [
      {
        page: 1,
        lines: [
          {
            region: "proceeds",
            label: "Proceeds from broker transactions",
            amount: "41,200.00",
          },
          {
            region: "cost-basis",
            label: "Cost or other basis",
            amount: "34,420.00",
          },
        ],
      },
      {
        page: 2,
        lines: [
          {
            region: "realized-gain",
            label: "Realized gain (net short + long)",
            amount: "6,780.00",
          },
        ],
      },
    ],
  },
  "doc-1098-wells": {
    id: "doc-1098-wells",
    kind: "1098",
    title: "1098 (Wells Fargo)",
    pages: [
      {
        page: 1,
        lines: [
          {
            region: "box-1",
            label: "Box 1 — Mortgage interest received",
            amount: "12,340.00",
          },
          {
            region: "box-2",
            label: "Box 2 — Outstanding mortgage principal",
            amount: "412,000.00",
          },
        ],
      },
    ],
  },
  "doc-1098t-stateu": {
    id: "doc-1098t-stateu",
    kind: "1098-T",
    title: "1098-T (State University)",
    pages: [
      {
        page: 1,
        lines: [
          {
            region: "box-1",
            label: "Box 1 — Payments for qualified tuition",
            amount: "5,000.00",
          },
          {
            region: "credit-basis",
            label: "American Opportunity Credit (computed)",
            amount: "1,000.00",
          },
        ],
      },
    ],
  },
};

/** Look up a Source Document by id. */
export function getSourceDocument(id: string): SourceDocument | undefined {
  return SOURCE_DOCUMENTS[id];
}

/** Resolve the printed line a Field source points at, for its label/amount and highlighting. */
export function getSourceLine(
  documentId: string,
  page: number,
  region: string,
): SourceLine | undefined {
  const doc = getSourceDocument(documentId);
  const pageEntry = doc?.pages.find((p) => p.page === page);
  return pageEntry?.lines.find((line) => line.region === region);
}

/** A Source Document's display title, falling back to its id if unknown. */
export function sourceDocumentTitle(documentId: string): string {
  return getSourceDocument(documentId)?.title ?? documentId;
}

/** A source line's human label (e.g. "Box 1 — …"), falling back to the region key. */
export function sourceLineLabel(
  documentId: string,
  page: number,
  region: string,
): string {
  return getSourceLine(documentId, page, region)?.label ?? region;
}
