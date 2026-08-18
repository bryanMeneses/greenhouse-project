import { createColumnHelper, type SortingState } from "@tanstack/react-table";
import { MessagesSquare } from "lucide-react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { SortableHeader } from "@/components/ui/data-table";
import type { DataTableFeatures } from "@/components/ui/data-table-features";
import {
  AUDIENCE_CONFIG,
  MIXED_AUDIENCE_CONFIG,
  SUBJECT_KIND_CONFIG,
} from "@/features/returns/shared/collaboration-presentation";
import { focusToParam } from "@/hooks/use-return-view";
import { cn, formatRelativeToSeed } from "@/lib/utils";
import { SEED_TODAY } from "@/mocks/returns";

import { threadOwnerRank, type PooledThread } from "./pooled-threads";

const columnHelper = createColumnHelper<DataTableFeatures, PooledThread>();

/** Most recently active first — a preparer triages an inbox by what's newest. */
export const MESSAGES_DEFAULT_SORTING: SortingState = [
  { id: "updated", desc: true },
];

/** Plain-language reading of who owns the next action, or "—" when nothing's owed. */
const OWNER_LABEL: Record<"client" | "preparer", string> = {
  client: "Waiting on client",
  preparer: "With your firm",
};

/** The pooled Messages table (Issue #23) as TanStack column definitions. */
export const messagesColumns = columnHelper.columns([
  columnHelper.accessor("client", {
    id: "client",
    header: ({ column }) => (
      <SortableHeader column={column} title="Client / Return" />
    ),
    sortFn: "text",
    cell: ({ row }) => (
      <Link
        to={`/returns/${row.original.returnId}?area=messages&focus=${focusToParam({
          kind: "thread",
          id: row.original.threadId,
        })}`}
        aria-label={`Open "${row.original.threadTitle}" on the ${row.original.client} Return (${row.original.returnNumber}, ${row.original.taxYear}).`}
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
  columnHelper.accessor((row) => row.subjectDetail, {
    id: "subject",
    header: ({ column }) => <SortableHeader column={column} title="Thread" />,
    sortFn: "text",
    cell: ({ row }) => {
      const SubjectIcon = SUBJECT_KIND_CONFIG[row.original.subjectKind].icon;
      return (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-medium">{row.original.threadTitle}</span>
          <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <SubjectIcon aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="truncate">Linked to {row.original.subjectDetail}</span>
          </span>
        </div>
      );
    },
  }),
  columnHelper.accessor("audience", {
    id: "audience",
    header: ({ column }) => <SortableHeader column={column} title="Audience" />,
    sortFn: "text",
    cell: ({ row }) => {
      const isMixed = row.original.hasInternal && row.original.hasClientVisible;
      const audience = isMixed
        ? MIXED_AUDIENCE_CONFIG
        : AUDIENCE_CONFIG[row.original.audience];
      const AudienceIcon = audience.icon;
      return (
        <Badge
          variant="outline"
          className={cn("gap-1", audience.badgeClassName)}
          title={isMixed ? "Internal + Client-visible messages" : undefined}
        >
          <AudienceIcon aria-hidden="true" />
          {audience.label}
        </Badge>
      );
    },
  }),
  columnHelper.accessor((row) => threadOwnerRank(row), {
    id: "owner",
    header: ({ column }) => (
      <div className="text-right">
        <SortableHeader column={column} title="Next action" align="right" />
      </div>
    ),
    sortFn: (a, b) => threadOwnerRank(a.original) - threadOwnerRank(b.original),
    cell: ({ row }) => (
      <div className="text-right text-sm whitespace-nowrap">
        {row.original.nextActionOwner ? (
          <span
            className={cn(
              row.original.nextActionOwner === "client"
                ? "text-warning"
                : "text-muted-foreground",
            )}
          >
            {OWNER_LABEL[row.original.nextActionOwner]}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
    ),
  }),
  columnHelper.accessor((row) => row.lastMessage.sentAt, {
    id: "updated",
    header: ({ column }) => (
      <div className="text-right">
        <SortableHeader
          column={column}
          title="Last activity"
          defaultDesc
          align="right"
        />
      </div>
    ),
    sortFn: "text",
    cell: ({ row }) => {
      const updated = formatRelativeToSeed(
        row.original.lastMessage.sentAt,
        SEED_TODAY,
      );
      return (
        <div className="text-right text-sm whitespace-nowrap text-muted-foreground tabular-nums">
          <span
            title={`${row.original.lastMessage.authorName}: ${row.original.lastMessage.body}`}
            className="inline-flex items-center gap-1.5"
          >
            <MessagesSquare aria-hidden="true" className="size-3.5" />
            {updated}
            <span className="text-xs text-muted-foreground/70">
              · {row.original.messageCount}
            </span>
          </span>
        </div>
      );
    },
  }),
]);
