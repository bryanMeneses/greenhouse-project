import { Link } from "react-router";

import { rankDashboard, type RankedReturn } from "@/features/dashboard/ranking";
import { deadlinePhrase } from "@/features/dashboard/command-center";
import {
  STAGE_LABEL,
  STAGE_PROGRESS,
  URGENCY_CONFIG,
} from "@/features/dashboard/return-presentation";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type ReturnsTableProps = {
  returns: Parameters<typeof rankDashboard>[0];
  now: Date;
  /** Cap the rows shown (the dashboard glance passes 6; the roster shows all). */
  limit?: number;
};

/**
 * The Return roster as a table, ordered by the same ranking the dashboard sorts by
 * (`rankDashboard`). Shared by the Command Center's "Return queue" glance and the
 * full `/returns` index — one rendering, so the two never drift. Each row deep-links
 * into that Return's review.
 */
export function ReturnsTable({ returns, now, limit }: ReturnsTableProps) {
  const ranked = rankDashboard(returns, now);
  const rows = limit ? ranked.slice(0, limit) : ranked;

  return (
    <Table className="[&_td]:px-5 [&_td]:py-3.5 [&_th]:h-11 [&_th]:px-5 sm:[&_td]:px-6 sm:[&_th]:px-6">
      <TableHeader>
        <TableRow>
          <TableHead>Client / Return</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-40">Progress</TableHead>
          <TableHead className="text-right">Open</TableHead>
          <TableHead className="text-right">Due</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <ReturnRow key={row.return.id} row={row} />
        ))}
      </TableBody>
    </Table>
  );
}

function ReturnRow({ row }: { row: RankedReturn }) {
  const { return: taxReturn, urgency: urgencyKey, openItemCount } = row;
  const urgency = URGENCY_CONFIG[urgencyKey];
  const deadline = deadlinePhrase(row.daysUntilDeadline, taxReturn.deadline);
  const tone =
    row.daysUntilDeadline < 0
      ? "overdue"
      : row.daysUntilDeadline <= 1
        ? "soon"
        : "normal";

  const summary = `Open ${taxReturn.client}, ${taxReturn.taxYear} Return. ${STAGE_LABEL[taxReturn.stage]}. ${urgency.label}. ${deadline}. ${openItemCount} Open Item${openItemCount === 1 ? "" : "s"}.`;

  return (
    <TableRow className="group">
      <TableCell>
        <Link
          to={`/returns/${taxReturn.id}`}
          aria-label={summary}
          className="flex flex-col rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="font-semibold group-hover:underline">
            {taxReturn.client}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {taxReturn.returnNumber} · {taxReturn.taxYear}
          </span>
        </Link>
      </TableCell>
      <TableCell>
        <Badge aria-hidden="true" className={urgency.className}>
          <urgency.icon className={urgency.iconClassName} />
          {urgency.label}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Progress
            value={STAGE_PROGRESS[taxReturn.stage]}
            aria-hidden="true"
            className="h-1.5"
          />
          <span className="w-20 shrink-0 text-xs text-muted-foreground">
            {STAGE_LABEL[taxReturn.stage]}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums">{openItemCount}</TableCell>
      <TableCell
        className={cn(
          "text-right text-sm tabular-nums whitespace-nowrap",
          tone === "overdue" && "font-medium text-destructive",
          tone === "soon" && "font-medium text-foreground",
          tone === "normal" && "text-muted-foreground",
        )}
      >
        {deadline}
      </TableCell>
    </TableRow>
  );
}
