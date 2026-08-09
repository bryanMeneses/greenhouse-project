import * as React from "react";
import { Link } from "react-router";
import {
  AlertTriangle,
  ChevronRight,
  CircleDot,
  Clock,
  ListChecks,
  PauseCircle,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

import type { Return, Stage } from "@/features/returns/model/returns";
import {
  DASHBOARD_GROUP_CONFIG,
  DASHBOARD_GROUP_ORDER,
  DUE_SOON_DAYS,
  parseDeadline,
  rankDashboard,
  type RankedReturn,
  type ReturnUrgency,
} from "@/features/dashboard/model/dashboard";
import { cn } from "@/lib/utils";

type DashboardProps = {
  returns: Return[];
  /** Reference "today" the ranking measures deadlines against. */
  now: Date;
};

const STAGE_LABEL: Record<Stage, string> = {
  intake: "Intake",
  "in-review": "In review",
  "ready-to-file": "Ready to file",
};

/** Per-urgency chip treatment; the loudest tint on the signal that most needs a look. */
const URGENCY_CONFIG: Record<
  ReturnUrgency,
  { label: string; icon: LucideIcon; className: string; iconClassName: string }
> = {
  overdue: {
    label: "Overdue",
    icon: AlertTriangle,
    className: "bg-destructive/10 text-foreground",
    iconClassName: "text-destructive",
  },
  "due-soon": {
    label: "Due soon",
    icon: Clock,
    className: "bg-brand/15 text-foreground",
    iconClassName: "text-brand",
  },
  "needs-review": {
    label: "Needs review",
    icon: ShieldAlert,
    className: "bg-destructive/10 text-foreground",
    iconClassName: "text-destructive",
  },
  "blocked-on-client": {
    label: "Blocked on client",
    icon: PauseCircle,
    className: "bg-muted text-foreground",
    iconClassName: "text-muted-foreground",
  },
  "in-progress": {
    label: "In progress",
    icon: CircleDot,
    className: "bg-secondary text-secondary-foreground",
    iconClassName: "text-primary",
  },
};

/** A short, human deadline phrase plus whether it should read as urgent. */
function formatDeadline(ranked: RankedReturn): {
  text: string;
  tone: "overdue" | "soon" | "normal";
} {
  const days = ranked.daysUntilDeadline;
  if (days < 0) {
    const late = Math.abs(days);
    return {
      text: `Overdue by ${late} day${late === 1 ? "" : "s"}`,
      tone: "overdue",
    };
  }
  if (days === 0) return { text: "Due today", tone: "soon" };
  if (days === 1) return { text: "Due tomorrow", tone: "soon" };
  if (days <= DUE_SOON_DAYS)
    return { text: `Due in ${days} days`, tone: "soon" };

  const label = parseDeadline(ranked.return.deadline).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    },
  );
  return { text: `Due ${label}`, tone: "normal" };
}

/**
 * The landing dashboard (challenge 07): every Return the Preparer owns, ranked by
 * urgency and split into Needs you now / Waiting on others / On track so the answer
 * to "what should I work on right now?" is the first thing on screen. Each row
 * carries the Return's Stage, Open Item count, and low-Confidence Field count, and
 * opens straight into that Return's review.
 */
export function Dashboard({ returns, now }: DashboardProps) {
  const ranked = rankDashboard(returns, now);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <p className="text-sm text-muted-foreground">
        {ranked.length} Return{ranked.length === 1 ? "" : "s"} · sorted by what
        needs you first.
      </p>

      {DASHBOARD_GROUP_ORDER.map((group) => {
        const rows = ranked.filter((r) => r.group === group);
        if (rows.length === 0) return null;
        return <DashboardGroup key={group} group={group} rows={rows} />;
      })}
    </div>
  );
}

function DashboardGroup({
  group,
  rows,
}: {
  group: (typeof DASHBOARD_GROUP_ORDER)[number];
  rows: RankedReturn[];
}) {
  const headingId = React.useId();
  const { label, description } = DASHBOARD_GROUP_CONFIG[group];

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={headingId} className="text-base font-semibold tracking-tight">
          {label}
          <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">
            {rows.length}
          </span>
        </h2>
        <p className="hidden text-xs text-muted-foreground sm:block">
          {description}
        </p>
      </div>

      <ul className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        {rows.map((row) => (
          <li
            key={row.return.id}
            className="border-b border-border last:border-b-0"
          >
            <DashboardRow row={row} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function DashboardRow({ row }: { row: RankedReturn }) {
  const { return: taxReturn, openItemCount, lowConfidenceCount } = row;
  const urgency = URGENCY_CONFIG[row.urgency];
  const deadline = formatDeadline(row);

  const summary = `Open ${taxReturn.client}, ${taxReturn.taxYear} Return. ${STAGE_LABEL[taxReturn.stage]}. ${urgency.label}. ${deadline.text}. ${openItemCount} Open Item${openItemCount === 1 ? "" : "s"}, ${lowConfidenceCount} low-Confidence Field${lowConfidenceCount === 1 ? "" : "s"}.`;

  return (
    <Link
      to={`/returns/${taxReturn.id}`}
      aria-label={summary}
      className={cn(
        "flex w-full items-center gap-4 px-5 py-4 text-left transition-colors",
        "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset cursor-pointer",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-sm font-semibold">
            {taxReturn.client}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {taxReturn.taxYear}
          </span>
          <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {STAGE_LABEL[taxReturn.stage]}
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <Stat icon={ListChecks} count={openItemCount} noun="Open Item" />
          <Stat
            icon={ShieldAlert}
            count={lowConfidenceCount}
            noun="low-Confidence Field"
          />
          <span
            className={cn(
              "font-medium tabular-nums",
              deadline.tone === "overdue" && "text-destructive",
              deadline.tone === "soon" && "text-foreground",
            )}
          >
            {deadline.text}
          </span>
        </div>
      </div>

      <span
        aria-hidden="true"
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
          urgency.className,
        )}
      >
        <urgency.icon className={cn("size-3.5", urgency.iconClassName)} />
        {urgency.label}
      </span>

      <ChevronRight
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
      />
    </Link>
  );
}

/** One numeric row stat — icon, count, and a noun that pluralizes. Decorative; the
 * row's button carries the full spoken summary. */
function Stat({
  icon: Icon,
  count,
  noun,
}: {
  icon: LucideIcon;
  count: number;
  noun: string;
}) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center gap-1.5 tabular-nums"
    >
      <Icon className="size-3.5" />
      <span className="font-medium text-foreground">{count}</span>
      <span>
        {noun}
        {count === 1 ? "" : "s"}
      </span>
    </span>
  );
}
