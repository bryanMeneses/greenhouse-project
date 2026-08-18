import * as React from "react";
import {
  useTable,
  type Column,
  type ColumnDef,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { features, type DataTableFeatures } from "./data-table-features";

type DataTableProps<TData extends RowData> = {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
  /** The initial sort, e.g. `[{ id: "updated", desc: true }]`. */
  initialSorting?: SortingState;
  /** Rows per page; defaults to 10. */
  pageSize?: number;
};

/**
 * The shared sortable, paginated table behind the firm-wide pooled surfaces
 * (`/documents`, `/messages`) — the shadcn data-table recipe over TanStack
 * Table v9. Sorting and pagination live here; the per-surface column
 * definitions own their cells, sort keys, and row links.
 */
export function DataTable<TData extends RowData>({
  columns,
  data,
  initialSorting = [],
  pageSize = 10,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);

  const table = useTable({
    features,
    data,
    columns,
    onSortingChange: setSorting,
    state: { sorting },
    initialState: { pagination: { pageIndex: 0, pageSize } },
  });

  const pageIndex = table.state.pagination.pageIndex;
  const pageCount = table.getPageCount();
  const pageRows = table.getRowModel().rows;
  const start = pageIndex * pageSize;

  return (
    <>
      <Table className="[&_td]:px-5 [&_td]:py-3.5 [&_th]:h-11 [&_th]:px-5 sm:[&_td]:px-6 sm:[&_th]:px-6">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  aria-sort={
                    header.column.getCanSort()
                      ? header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : header.column.getIsSorted() === "desc"
                          ? "descending"
                          : "none"
                      : undefined
                  }
                >
                  {header.isPlaceholder ? null : (
                    <table.FlexRender header={header} />
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {pageRows.length ? (
            pageRows.map((row) => (
              <TableRow key={row.id} className="group">
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {pageCount > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 sm:px-6">
          <p className="text-xs text-muted-foreground tabular-nums">
            Showing {start + 1}–{start + pageRows.length} of {data.length}
          </p>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={!table.getCanPreviousPage()}
                  className={
                    table.getCanPreviousPage()
                      ? undefined
                      : "pointer-events-none opacity-50"
                  }
                  onClick={(event) => {
                    event.preventDefault();
                    table.previousPage();
                  }}
                />
              </PaginationItem>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map(
                (pageNumber) => (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      isActive={pageNumber === pageIndex + 1}
                      aria-label={`Go to page ${pageNumber}`}
                      onClick={(event) => {
                        event.preventDefault();
                        table.setPageIndex(pageNumber - 1);
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
                  aria-disabled={!table.getCanNextPage()}
                  className={
                    table.getCanNextPage()
                      ? undefined
                      : "pointer-events-none opacity-50"
                  }
                  onClick={(event) => {
                    event.preventDefault();
                    table.nextPage();
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
}

type SortableHeaderProps<TData extends RowData, TValue> = {
  column: Column<DataTableFeatures, TData, TValue>;
  title: string;
  /** First click on an unsorted column sorts in this direction. */
  defaultDesc?: boolean;
  /** Right-align the control to mirror a right-aligned column. */
  align?: "left" | "right";
};

/**
 * A column header that sorts on click. Matches the old pooled-table behavior:
 * the first click uses the column's default direction, later clicks flip
 * asc ↔ desc, and a sort is never cleared.
 */
export function SortableHeader<TData extends RowData, TValue>({
  column,
  title,
  defaultDesc = false,
  align = "left",
}: SortableHeaderProps<TData, TValue>) {
  const sorted = column.getIsSorted();
  const SortIcon =
    sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ChevronsUpDown;

  return (
    <button
      type="button"
      onClick={() => {
        if (!sorted) column.toggleSorting(defaultDesc);
        else column.toggleSorting(sorted === "asc");
      }}
      className={cn(
        "-mx-1.5 inline-flex items-center gap-1.5 rounded-sm px-1.5 py-1 font-medium",
        "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        align === "right" && "flex-row-reverse",
        sorted ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {title}
      <SortIcon
        aria-hidden="true"
        className={cn(
          "size-3.5 shrink-0",
          sorted ? "text-primary" : "text-muted-foreground/60",
        )}
      />
    </button>
  );
}
