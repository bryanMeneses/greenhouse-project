import { reviewQueue } from "@/features/returns/shared/review-queue";
import type { Field, Return } from "@/features/returns/shared/returns";

/**
 * The three buckets the landing dashboard sorts Returns into (#6):
 * - `needs-you-now` — the Preparer's move: overdue / near-deadline, or
 *   low-Confidence Fields awaiting review.
 * - `waiting-on-others` — blocked on the Client, nothing the Preparer can do yet.
 * - `on-track` — in progress with nothing pressing.
 */
export type DashboardGroup = "needs-you-now" | "waiting-on-others" | "on-track";

/**
 * Why a Return ranks where it does. Ordered most- to least-urgent; this is also
 * the priority the dashboard sorts by, matching the ticket's ranking signal:
 * overdue / near-deadline → blocked-on-client → low-Confidence awaiting review →
 * in-progress.
 */
export type ReturnUrgency =
  "overdue" | "due-soon" | "blocked-on-client" | "needs-review" | "in-progress";

/** A Return placed on the dashboard: its group, why, and the stats a row shows. */
export type RankedReturn = {
  return: Return;
  urgency: ReturnUrgency;
  group: DashboardGroup;
  /** Total Open Items on the Return (either owner). */
  openItemCount: number;
  /** Low-Confidence Fields still awaiting review. */
  lowConfidenceCount: number;
  /** Whole days from `now` to the deadline; negative once overdue. */
  daysUntilDeadline: number;
};

/** Display metadata for each group, so every surface names them the same way. */
export const DASHBOARD_GROUP_CONFIG: Record<
  DashboardGroup,
  { label: string; description: string }
> = {
  "needs-you-now": {
    label: "Needs you now",
    description: "Overdue, near deadline, or waiting on your review.",
  },
  "waiting-on-others": {
    label: "Waiting on others",
    description: "Blocked on the Client — nothing to do here yet.",
  },
  "on-track": {
    label: "On track",
    description: "In progress with nothing pressing.",
  },
};

/** The groups in the order the dashboard stacks them. */
export const DASHBOARD_GROUP_ORDER: DashboardGroup[] = [
  "needs-you-now",
  "waiting-on-others",
  "on-track",
];

/**
 * A deadline this many days out (or nearer) reads as near-deadline. Exported so
 * the dashboard's deadline copy ("Due soon") and this classification never drift.
 */
export const DUE_SOON_DAYS = 7;

const URGENCY_PRIORITY: Record<ReturnUrgency, number> = {
  overdue: 0,
  "due-soon": 1,
  "blocked-on-client": 2,
  "needs-review": 3,
  "in-progress": 4,
};

const GROUP_FOR_URGENCY: Record<ReturnUrgency, DashboardGroup> = {
  overdue: "needs-you-now",
  "due-soon": "needs-you-now",
  "needs-review": "needs-you-now",
  "blocked-on-client": "waiting-on-others",
  "in-progress": "on-track",
};

/** Parse a deadline (an ISO `YYYY-MM-DD` date) to a local Date at midnight. */
export function parseDeadline(deadline: string): Date {
  return new Date(`${deadline}T00:00:00`);
}

/** The calendar day a Date falls on, as a UTC-midnight timestamp for differencing. */
function calendarDay(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Calendar days from `now` to `deadline` (an ISO date), ignoring clock time. */
function daysUntilDeadline(deadline: string, now: Date): number {
  const diff = calendarDay(parseDeadline(deadline)) - calendarDay(now);
  return Math.round(diff / 86_400_000);
}

/** A Return is blocked on the Client when it has a Client-owned Open Item. */
function isBlockedOnClient(taxReturn: Return): boolean {
  return taxReturn.openItems.some((item) => item.owner === "client");
}

/**
 * The low-Confidence Fields still awaiting review: those in the Review Queue that
 * the Preparer hasn't resolved yet. A verified (or locked) low-Confidence Field is
 * done and no longer counts.
 */
function lowConfidenceAwaitingReview(taxReturn: Return): Field[] {
  return reviewQueue(taxReturn).filter(
    (field) => field.state !== "verified" && field.state !== "locked",
  );
}

/** First matching signal wins, following the ticket's priority order. */
function classifyUrgency(
  daysLeft: number,
  blocked: boolean,
  lowConfidenceCount: number,
): ReturnUrgency {
  if (daysLeft < 0) return "overdue";
  if (daysLeft <= DUE_SOON_DAYS) return "due-soon";
  if (blocked) return "blocked-on-client";
  if (lowConfidenceCount > 0) return "needs-review";
  return "in-progress";
}

/**
 * Rank a set of Returns for the landing dashboard (#6): classify each by its most
 * urgent signal, tag it with the group that signal belongs to, and return them in
 * priority order — most urgent first, ties broken by the nearest deadline. The UI
 * splits the flat list by `group`, which keeps each group in the same order.
 *
 * `now` is injected so the seed dashboard ranks against a fixed date (SEED_TODAY)
 * and tests stay deterministic; it defaults to the wall clock.
 */
export function rankDashboard(
  returns: Return[],
  now: Date = new Date(),
): RankedReturn[] {
  const ranked = returns.map((taxReturn): RankedReturn => {
    const daysLeft = daysUntilDeadline(taxReturn.deadline, now);
    const blocked = isBlockedOnClient(taxReturn);
    const lowConfidenceCount = lowConfidenceAwaitingReview(taxReturn).length;
    const urgency = classifyUrgency(daysLeft, blocked, lowConfidenceCount);

    return {
      return: taxReturn,
      urgency,
      group: GROUP_FOR_URGENCY[urgency],
      openItemCount: taxReturn.openItems.length,
      lowConfidenceCount,
      daysUntilDeadline: daysLeft,
    };
  });

  return ranked.sort((a, b) => {
    const byPriority =
      URGENCY_PRIORITY[a.urgency] - URGENCY_PRIORITY[b.urgency];
    if (byPriority !== 0) return byPriority;

    const byDeadline = a.daysUntilDeadline - b.daysUntilDeadline;
    if (byDeadline !== 0) return byDeadline;

    return a.return.client.localeCompare(b.return.client);
  });
}
