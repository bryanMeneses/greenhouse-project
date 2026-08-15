import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Download,
  Eye,
  FileText,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatShortDate } from "@/lib/utils";
import { focusToParam } from "@/hooks/use-return-view";
import type {
  DocumentSort,
  DocumentSortKey,
  PooledDocument,
} from "@/features/documents/pooled-documents";

type DocumentsTableProps = {
  rows: PooledDocument[];
  sort: DocumentSort;
  onSort: (key: DocumentSortKey) => void;
  /** The focused row's id (`returnId:documentId`), highlighted + scrolled into view. */
  focusedRowId: string | null;
};

const COLUMNS: { key: DocumentSortKey; label: string; align?: "right" }[] = [
  { key: "client", label: "Client / Return" },
  { key: "document", label: "Document" },
  { key: "kind", label: "Kind" },
  { key: "uploaded", label: "Uploaded" },
  { key: "fields", label: "Connected Fields", align: "right" },
];

/**
 * The firm-wide Documents pool as a sortable table — the pooled counterpart to a
 * Return's list+detail Documents Area (kept for a single Return's ~5–10 files). Each
 * row is a focus target: it carries `data-return-focus` so a `?focus=…` deep link
 * scrolls to and highlights *the row* — the same URL-focus navigation machinery a
 * Field → Source Document Connection drives *inside* a Return (ADR-0009), reused here
 * on a firm-wide surface (so these rows aren't themselves Connections, which stay
 * Return-scoped — just the same focus mechanism aimed at a row instead of a card).
 * The row itself deep-links into that Document inside its own Return's Documents Area.
 */
export function DocumentsTable({
  rows,
  sort,
  onSort,
  focusedRowId,
}: DocumentsTableProps) {
  return (
    <Table className="[&_td]:px-5 [&_td]:py-3.5 [&_th]:h-11 [&_th]:px-5 sm:[&_td]:px-6 sm:[&_th]:px-6">
      <TableHeader>
        <TableRow>
          {COLUMNS.map((column) => (
            <SortableHead
              key={column.key}
              column={column}
              sort={sort}
              onSort={onSort}
            />
          ))}
          <TableHead className="w-12">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <DocumentRow
            key={row.rowId}
            row={row}
            isFocused={row.rowId === focusedRowId}
          />
        ))}
      </TableBody>
    </Table>
  );
}

function SortableHead({
  column,
  sort,
  onSort,
}: {
  column: (typeof COLUMNS)[number];
  sort: DocumentSort;
  onSort: (key: DocumentSortKey) => void;
}) {
  const isActive = sort.key === column.key;
  const ariaSort = isActive
    ? sort.direction === "asc"
      ? "ascending"
      : "descending"
    : "none";
  const SortIcon = !isActive
    ? ChevronsUpDown
    : sort.direction === "asc"
      ? ArrowUp
      : ArrowDown;

  return (
    <TableHead
      aria-sort={ariaSort}
      className={column.align === "right" ? "text-right" : undefined}
    >
      <button
        type="button"
        onClick={() => onSort(column.key)}
        className={cn(
          "-mx-1.5 inline-flex items-center gap-1.5 rounded-sm px-1.5 py-1 font-medium",
          "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          column.align === "right" && "flex-row-reverse",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {column.label}
        <SortIcon
          aria-hidden="true"
          className={cn(
            "size-3.5 shrink-0",
            isActive ? "text-primary" : "text-muted-foreground/60",
          )}
        />
      </button>
    </TableHead>
  );
}

function DocumentRow({
  row,
  isFocused,
}: {
  row: PooledDocument;
  isFocused: boolean;
}) {
  const uploaded = row.uploadedAt ? formatShortDate(row.uploadedAt) : "—";
  const fieldCount = row.fieldLabels.length;
  const connectedSummary =
    fieldCount === 0 ? "No connected Fields" : row.fieldLabels.join(", ");
  const summary = `Open ${row.title} on the ${row.client} Return (${row.returnNumber}, ${row.taxYear}).`;

  return (
    <TableRow
      tabIndex={-1}
      data-return-focus={row.rowId}
      data-return-focus-kind="source-document"
      data-state={isFocused ? "selected" : undefined}
      className={cn(
        "group scroll-mt-24 outline-none",
        isFocused && "ring-2 ring-ring ring-inset",
      )}
    >
      <TableCell>
        <Link
          to={`/returns/${row.returnId}?area=documents&focus=${focusToParam({
            kind: "source-document",
            id: row.documentId,
          })}`}
          aria-label={summary}
          className="flex flex-col rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="font-semibold group-hover:underline">
            {row.client}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {row.returnNumber} · {row.taxYear}
          </span>
        </Link>
      </TableCell>
      <TableCell>
        <span className="flex min-w-0 items-center gap-2">
          <FileText
            aria-hidden="true"
            className="size-4 shrink-0 text-primary"
          />
          <span className="truncate font-medium">{row.title}</span>
        </span>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{row.kind}</Badge>
      </TableCell>
      <TableCell className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
        {uploaded}
      </TableCell>
      <TableCell className="text-right">
        <span
          title={connectedSummary}
          className="inline-flex items-center gap-1.5 tabular-nums"
        >
          <span className="font-medium">{fieldCount}</span>
          <span className="text-xs text-muted-foreground">
            Field{fieldCount === 1 ? "" : "s"}
          </span>
        </span>
      </TableCell>
      <TableCell className="text-right">
        <RowActions title={row.title} />
      </TableCell>
    </TableRow>
  );
}

/**
 * The per-row document actions menu. These are presentational placeholders — a real
 * build would wire View/Download to the CDN file and Delete to a confirm flow; here
 * they're inert so the surface reads complete without inventing behavior.
 */
function RowActions({ title }: { title: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground data-[state=open]:bg-accent"
          aria-label={`Actions for ${title}`}
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem>
          <Eye aria-hidden="true" />
          View document
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Download aria-hidden="true" />
          Download
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2 aria-hidden="true" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
