/**
 * Seed Source Document facsimiles (simulated). The document data plus the
 * accessors over it live here; the domain types stay in
 * `@/features/returns/shared/source-documents`.
 */
import type {
  SourceDocument,
  SourceLine,
} from "@/features/returns/shared/source-documents";

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
  // The lighter roster Returns (and Nguyen, the collaboration showcase) share one
  // generic Acme W-2 facsimile — distinct from Reyes's `doc-w2-acme` above, which
  // is its own upload at a different Box 1. Same shared-catalog move the pooled
  // Documents table documents: one facsimile stands in for each Return's own W-2,
  // and its printed amounts must match the Fields that trace to it ($72,000).
  "doc-w2-acme-nguyen": {
    id: "doc-w2-acme-nguyen",
    kind: "W-2",
    title: "W-2 (Acme Corp)",
    pages: [
      {
        page: 1,
        lines: [
          {
            region: "box-1",
            label: "Box 1 — Wages, tips, other comp",
            amount: "72,000.00",
          },
          {
            region: "box-2",
            label: "Box 2 — Federal income tax withheld",
            amount: "11,880.00",
          },
          {
            region: "box-3",
            label: "Box 3 — Social security wages",
            amount: "72,000.00",
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

/**
 * The uploaded-file view of a Source Document (challenge 04 Documents Area). No
 * real files or storage exist — these fields are what a CDN-backed upload record
 * would carry, derived deterministically from the document id so the seed stays
 * stable. `cdnUrl` is the shape a real integration would serve the page from.
 */
export type SourceDocumentFile = {
  fileName: string;
  mimeType: string;
  sizeLabel: string;
  uploadedAt: string;
  cdnUrl: string;
  pageCount: number;
};

/** Deterministic fake upload metadata for a Source Document. */
export function sourceDocumentFile(id: string): SourceDocumentFile | undefined {
  const doc = SOURCE_DOCUMENTS[id];
  if (!doc) return undefined;

  // A stable hash of the id drives size and upload date, so the same document
  // always reads the same way without a hand-maintained metadata table.
  const hash = [...id].reduce(
    (acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0,
    7,
  );
  const sizeKb = 40 + (hash % 460);
  const day = (hash % 27) + 1;
  const pageCount = doc.pages.length;

  return {
    fileName: `${doc.title}.pdf`,
    mimeType: "application/pdf",
    sizeLabel: `${sizeKb} KB`,
    uploadedAt: `2024-02-${String(day).padStart(2, "0")}`,
    cdnUrl: `https://cdn.ledgerline.example/documents/${id}.pdf`,
    pageCount,
  };
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
