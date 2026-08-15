import { Link } from "react-router";

import type { Return } from "@/features/returns/shared/returns";
import {
  dashboardStats,
  buildActionList,
} from "@/features/dashboard/command-center";
import { GreetingHeader } from "@/components/layout/greeting-header";
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
      <GreetingHeader
        name={greetingName}
        action={
          <Link
            to="/returns"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all returns →
          </Link>
        }
      />

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
