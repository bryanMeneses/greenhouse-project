import { createColumnHelper, type SortingState } from "@tanstack/react-table";
import { Download, Eye, FileText, MoreHorizontal, Trash2 } from "lucide-react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SortableHeader } from "@/components/ui/data-table";
import type { DataTableFeatures } from "@/components/ui/data-table-features";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { focusToParam } from "@/hooks/use-return-view";
import { formatShortDate } from "@/lib/utils";

import type { PooledDocument } from "./pooled-documents";

const columnHelper = createColumnHelper<DataTableFeatures, PooledDocument>();

/** Client first, then most recently uploaded — a firm reads its book by client. */
export const DOCUMENTS_DEFAULT_SORTING: SortingState = [
  { id: "client", desc: false },
];

/** The pooled Documents table (Issue #21) as TanStack column definitions. */
export const documentsColumns = columnHelper.columns([
  columnHelper.accessor("client", {
    id: "client",
    header: ({ column }) => (
      <SortableHeader column={column} title="Client / Return" />
    ),
    sortFn: "text",
    cell: ({ row }) => (
      <Link
        to={`/returns/${row.original.returnId}?area=documents&focus=${focusToParam({
          kind: "source-document",
          id: row.original.documentId,
        })}`}
        aria-label={`Open ${row.original.title} on the ${row.original.client} Return (${row.original.returnNumber}, ${row.original.taxYear}).`}
        className="flex flex-col rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="font-semibold group-hover:underline">
          {row.original.client}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {row.original.returnNumber} · {row.original.taxYear}
        </span>
      </Link>
    ),
  }),
  columnHelper.accessor("title", {
    id: "document",
    header: ({ column }) => (
      <SortableHeader column={column} title="Document" />
    ),
    sortFn: "text",
    cell: ({ row }) => (
      <span className="flex min-w-0 items-center gap-2">
        <FileText
          aria-hidden="true"
          className="size-4 shrink-0 text-primary"
        />
        <span className="truncate font-medium">{row.original.title}</span>
      </span>
    ),
  }),
  columnHelper.accessor("kind", {
    id: "kind",
    header: ({ column }) => <SortableHeader column={column} title="Kind" />,
    sortFn: "text",
    cell: ({ row }) => <Badge variant="outline">{row.original.kind}</Badge>,
  }),
  columnHelper.accessor((row) => row.uploadedAt, {
    id: "uploaded",
    header: ({ column }) => (
      <SortableHeader column={column} title="Uploaded" defaultDesc />
    ),
    sortFn: "text",
    cell: ({ row }) => (
      <span className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
        {row.original.uploadedAt
          ? formatShortDate(row.original.uploadedAt)
          : "—"}
      </span>
    ),
  }),
  columnHelper.accessor((row) => row.fieldLabels.length, {
    id: "fields",
    header: ({ column }) => (
      <div className="text-right">
        <SortableHeader
          column={column}
          title="Connected Fields"
          defaultDesc
          align="right"
        />
      </div>
    ),
    sortFn: (a, b) => a.original.fieldLabels.length - b.original.fieldLabels.length,
    cell: ({ row }) => {
      const fieldCount = row.original.fieldLabels.length;
      return (
        <div className="text-right">
          <span
            title={
              fieldCount === 0
                ? "No connected Fields"
                : row.original.fieldLabels.join(", ")
            }
            className="inline-flex items-center gap-1.5 tabular-nums"
          >
            <span className="font-medium">{fieldCount}</span>
            <span className="text-xs text-muted-foreground">
              Field{fieldCount === 1 ? "" : "s"}
            </span>
          </span>
        </div>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    // Presentational placeholders: a real build would wire View/Download to the
    // CDN file and Delete to a confirm flow; here they're inert so the surface
    // reads complete without inventing behavior.
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground data-[state=open]:bg-accent"
            aria-label={`Actions for ${row.original.title}`}
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
    ),
  }),
]);
