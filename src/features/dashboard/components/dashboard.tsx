import { Link } from "react-router";

import type { Return } from "@/features/returns/shared/returns";
import {
  dashboardStats,
  buildActionList,
} from "@/features/dashboard/command-center";
import { StatTiles } from "./stat-tiles";
import { ActionList } from "./action-list";
import { AiSignals } from "./ai-signals";
import { ReturnsTable } from "./returns-table";

type DashboardProps = {
  returns: Return[];
  /** Reference "today" the ranking and deadlines measure against. */
  now: Date;
  /** The Preparer's first name for the greeting; omitted in isolation/tests. */
  greetingName?: string;
};

function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** How many rows the landing surfaces show before deferring to the full roster. */
const QUEUE_GLANCE = 6;

/**
 * The Firm Command Center (challenge 07): a snapshot of the whole book, not a bare
 * list of Returns. A practice-wide stat row, the cross-Return action list that answers
 * "what should I work on right now?", the AI's review signals, and a glance at the
 * ranked queue — each a launch pad into the Return where the work happens. The full
 * roster lives at `/returns`.
 */
export function Dashboard({ returns, now, greetingName }: DashboardProps) {
  const stats = dashboardStats(returns, now);
  const actionList = buildActionList(returns, now);
  const queueShown = Math.min(QUEUE_GLANCE, returns.length);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          {/* The page h1 lives in the shell header ("Command center"); this hero
              greeting is the content's lead, so it's an h2 — one h1 per page. */}
          <h2 className="font-serif text-2xl font-semibold tracking-tight">
            {greeting(now)}
            {greetingName ? `, ${greetingName}.` : "."}
          </h2>
          <p className="text-sm text-muted-foreground">
            Here's the work that needs you today.
          </p>
        </div>
        <Link
          to="/returns"
          className="text-sm font-medium text-primary hover:underline"
        >
          View all returns →
        </Link>
      </header>

      <StatTiles stats={stats} />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <ActionList items={actionList} />
        <AiSignals returns={returns} />
      </div>

      <section
        aria-labelledby="queue-title"
        className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm"
      >
        <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-0.5">
            <h2
              id="queue-title"
              className="font-serif text-lg font-semibold tracking-tight"
            >
              Return queue
            </h2>
            <p className="text-sm text-muted-foreground">
              Your highest-priority returns, at a glance.
            </p>
          </div>
          <Link
            to="/returns"
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            View all returns →
          </Link>
        </header>
        <ReturnsTable returns={returns} now={now} limit={QUEUE_GLANCE} />
        {returns.length > queueShown && (
          <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground sm:px-6">
            Showing {queueShown} of {returns.length} returns
          </p>
        )}
      </section>
    </div>
  );
}
