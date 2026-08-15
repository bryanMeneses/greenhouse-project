import { getSourceDocument, sourceDocumentFile } from "@/mocks/documents";
import { collectSourceDocuments } from "@/features/returns/shared/connections";
import type { Return } from "@/features/returns/shared/returns";

/**
 * The firm-wide Documents pool (Issue #21). Every Source Document across every
 * Return, flattened into one row per *(Return, Document)* — the same "pool a
 * per-Return surface into a firm-wide table" move the Command Center made for
 * Returns. It is *derived*, never a new data model: each row reuses
 * `collectSourceDocuments` (which Fields a Document feeds, on that Return) plus the
 * Document facsimile (`getSourceDocument`) and its upload record (`sourceDocumentFile`).
 *
 * Why keyed by (Return, Document): the seed catalog is shared, so the same
 * `documentId` (e.g. a W-2) appears on many Returns. On the firm side each Return's
 * copy is its own row — the Reyes W-2 and the Nguyen W-2 are distinct uploads — so a
 * plain documentId can't identify a row. `rowId` carries both, which is also the
 * focus id a `?focus=…` deep link highlights — the row-shaped end of the same
 * URL-focus navigation machinery (ADR-0009); see the table's `data-return-focus`.
 */
export type PooledDocument = {
  /** `${returnId}:${documentId}` — unique per row, and the row's focus target id. */
  rowId: string;
  returnId: string;
  client: string;
  returnNumber: string;
  taxYear: number;
  documentId: string;
  /** The Document's display title, e.g. "W-2 (Acme Corp)". */
  title: string;
  /** The Document's kind, e.g. "W-2", "1099-INT". */
  kind: string;
  /** ISO upload date (YYYY-MM-DD) from the upload record; "" when unknown. */
  uploadedAt: string;
  /** The Fields this Document feeds *on this Return* (never cross-Return). */
  fieldLabels: string[];
};

/** Build the flattened firm-wide Document pool from the Return roster. */
export function collectFirmDocuments(returns: Return[]): PooledDocument[] {
  const rows: PooledDocument[] = [];
  for (const taxReturn of returns) {
    for (const [documentId, collected] of collectSourceDocuments(taxReturn)) {
      const doc = getSourceDocument(documentId);
      const file = sourceDocumentFile(documentId);
      rows.push({
        rowId: `${taxReturn.id}:${documentId}`,
        returnId: taxReturn.id,
        client: taxReturn.client,
        returnNumber: taxReturn.returnNumber,
        taxYear: taxReturn.taxYear,
        documentId,
        title: collected.title,
        kind: doc?.kind ?? "Document",
        uploadedAt: file?.uploadedAt ?? "",
        fieldLabels: collected.fieldLabels,
      });
    }
  }
  return rows;
}

/** The sortable columns of the pooled Documents table. */
export type DocumentSortKey =
  "client" | "document" | "kind" | "uploaded" | "fields";

export type SortDirection = "asc" | "desc";

export type DocumentSort = {
  key: DocumentSortKey;
  direction: SortDirection;
};

/** Client first, then most recently uploaded — a firm reads its book by client. */
export const DEFAULT_DOCUMENT_SORT: DocumentSort = {
  key: "client",
  direction: "asc",
};

/** The per-column primary comparison; ties always fall through to `rowId` for a stable order. */
function compareBy(
  key: DocumentSortKey,
  a: PooledDocument,
  b: PooledDocument,
): number {
  switch (key) {
    case "client":
      return a.client.localeCompare(b.client);
    case "document":
      return a.title.localeCompare(b.title);
    case "kind":
      return a.kind.localeCompare(b.kind);
    case "uploaded":
      // ISO dates sort lexicographically; a missing date is "" so it sorts first
      // ascending / last descending. (Every seed Document has one, so this is a
      // just-in-case ordering, not a case the current data hits.)
      return a.uploadedAt.localeCompare(b.uploadedAt);
    case "fields":
      return a.fieldLabels.length - b.fieldLabels.length;
  }
}

/**
 * Sort a copy of the pool by one column. The comparison is total: after the column
 * key it always tiebreaks on `rowId`, so the order is deterministic (no rows ever
 * "swap places" on re-sort) and tests stay stable.
 */
export function sortPooledDocuments(
  rows: PooledDocument[],
  sort: DocumentSort,
): PooledDocument[] {
  const factor = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const primary = compareBy(sort.key, a, b);
    if (primary !== 0) return primary * factor;
    return a.rowId.localeCompare(b.rowId);
  });
}
