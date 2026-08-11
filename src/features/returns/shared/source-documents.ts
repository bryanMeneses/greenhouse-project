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
