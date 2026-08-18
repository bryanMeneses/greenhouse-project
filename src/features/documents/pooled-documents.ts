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
 * plain documentId can't identify a row; `rowId` carries both.
 */
export type PooledDocument = {
  /** `${returnId}:${documentId}` — unique per row (the React key + sort tiebreak). */
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
