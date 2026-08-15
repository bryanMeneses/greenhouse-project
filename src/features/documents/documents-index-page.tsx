import * as React from "react";
import { Navigate } from "react-router";
import { Upload } from "lucide-react";

import { GreetingHeader } from "@/components/layout/greeting-header";
import { InternalLayout } from "@/components/layout/internal-layout";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { DocumentsTable } from "@/features/documents/components/documents-table";
import {
  collectFirmDocuments,
  sortPooledDocuments,
  DEFAULT_DOCUMENT_SORT,
  type DocumentSort,
  type DocumentSortKey,
} from "@/features/documents/pooled-documents";
import { useReturnView } from "@/hooks/use-return-view";
import { useRole } from "@/hooks/use-role";
import { RETURNS } from "@/mocks/returns";

/** Rows per page — the pool runs to a few dozen, so one screenful reads best. */
const PAGE_SIZE = 10;

/** Uploaded-newest and most-connected read best leading; names read best A→Z. */
function defaultDirectionFor(key: DocumentSortKey): DocumentSort["direction"] {
  return key === "uploaded" || key === "fields" ? "desc" : "asc";
}

/**
 * The firm-wide Documents pool (`/documents`, Issue #21) — every Source Document
 * across every Return in one sortable, paginated table, the pooled counterpart to a
 * Return's per-Return Documents Area. Firm-only: a Client has exactly one Return and
 * no firm pool, so this bounces them home (like the `/returns` roster). Rows are
 * focus targets, so `?focus=source-document:<returnId>:<documentId>` highlights the
 * row — and the view pages straight to whichever page holds it, so a deep link never
 * lands on a hidden row.
 */
export function DocumentsIndexPage() {
  const { roleConfig, user } = useRole();
  const { focus } = useReturnView();
  const [sort, setSort] = React.useState<DocumentSort>(DEFAULT_DOCUMENT_SORT);
  const [page, setPage] = React.useState(1);
  const [pagedForFocus, setPagedForFocus] = React.useState<string | null>(null);

  const rows = React.useMemo(
    () => sortPooledDocuments(collectFirmDocuments(RETURNS), sort),
    [sort],
  );

  const focusedRowId =
    focus && focus.kind === "source-document" ? focus.id : null;

  // A `?focus=…` deep link must land on the page that actually shows its row. When a
  // new focus arrives, jump to its page during render (React's adjust-state-on-input
  // pattern — no effect), then leave paging to the user until the focus changes again.
  if (focusedRowId !== pagedForFocus) {
    setPagedForFocus(focusedRowId);
    if (focusedRowId) {
      const index = rows.findIndex((row) => row.rowId === focusedRowId);
      if (index >= 0) setPage(Math.floor(index / PAGE_SIZE) + 1);
    }
  }

  if (roleConfig.family !== "firm") {
    return <Navigate to="/" replace />;
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = rows.slice(start, start + PAGE_SIZE);

  const toggleSort = (key: DocumentSortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: defaultDirectionFor(key) },
    );
    setPage(1);
  };

  const goToPage = (next: number) =>
    setPage(Math.min(Math.max(next, 1), totalPages));

  return (
    <InternalLayout title="Documents">
      <div className="flex flex-col gap-6">
        <GreetingHeader
          name={user.name.split(" ")[0]}
          action={
            <Button type="button" size="sm">
              <Upload aria-hidden="true" />
              Upload document
            </Button>
          }
        />

        {/* The page h1 ("Documents") lives in the shell header; this is the lead-in. */}
        <p className="text-sm text-muted-foreground">
          {rows.length} Source Document{rows.length === 1 ? "" : "s"} across
          your book, pooled from every Return. Open one to see it in its Return.
        </p>

        {rows.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <DocumentsTable
              rows={pageRows}
              sort={sort}
              onSort={toggleSort}
              focusedRowId={focusedRowId}
            />
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 sm:px-6">
                <p className="text-xs text-muted-foreground tabular-nums">
                  Showing {start + 1}–{start + pageRows.length} of {rows.length}
                </p>
                <Pagination className="mx-0 w-auto justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        aria-disabled={currentPage === 1}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : undefined
                        }
                        onClick={(event) => {
                          event.preventDefault();
                          goToPage(currentPage - 1);
                        }}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (pageNumber) => (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            href="#"
                            isActive={pageNumber === currentPage}
                            aria-label={`Go to page ${pageNumber}`}
                            onClick={(event) => {
                              event.preventDefault();
                              goToPage(pageNumber);
                            }}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        aria-disabled={currentPage === totalPages}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : undefined
                        }
                        onClick={(event) => {
                          event.preventDefault();
                          goToPage(currentPage + 1);
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground shadow-sm">
            No Source Documents uploaded across your book yet.
          </div>
        )}
      </div>
    </InternalLayout>
  );
}
