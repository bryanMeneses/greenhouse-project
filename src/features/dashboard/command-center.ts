import type { ReturnAreaId } from "@/features/returns/shared/areas";
import { lowConfidenceAwaitingReview } from "@/features/returns/shared/review-queue";
import {
  isOpenItemActive,
  type Return,
} from "@/features/returns/shared/returns";
import {
  DUE_SOON_DAYS,
  isPressing,
  parseDeadline,
  rankDashboard,
  type RankedReturn,
} from "./ranking";

/**
 * The pooled "practice snapshot" behind the Firm Command Center (challenge 07).
 * Everything here is *derived* from the same seed Returns the roster reads — no new
 * data — so the stat tiles, the cross-Return action list, and the queue table can never
 * disagree with each other or with a Return's own surfaces.
 */

// ─── Shared deadline phrasing ──────────────────────────────────────────────

/**
 * A short, human deadline phrase from a whole-day countdown — the one place both
 * the action list and the queue table read, so "Due tomorrow" never means two things.
 */
export function deadlinePhrase(
  daysUntilDeadline: number,
  deadline: string,
): string {
  if (daysUntilDeadline < 0) {
    const late = Math.abs(daysUntilDeadline);
    return `Overdue by ${late} day${late === 1 ? "" : "s"}`;
  }
  if (daysUntilDeadline === 0) return "Due today";
  if (daysUntilDeadline === 1) return "Due tomorrow";
  if (daysUntilDeadline <= DUE_SOON_DAYS)
    return `Due in ${daysUntilDeadline} days`;
  return `Due ${parseDeadline(deadline).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
}

// ─── Stat tiles ────────────────────────────────────────────────────────────

/** The closed set of headline numbers the Command Center shows. */
export type DashboardStatId =
  "active" | "open-items" | "needs-review" | "requests";

/** One headline number on the Command Center, with a supporting hint. */
export type DashboardStat = {
  id: DashboardStatId;
  label: string;
  value: number;
  hint: string;
};

/** The active (not-yet-filed) Open Items a Return still carries, by owner. */
function activeOpenItems(taxReturn: Return) {
  return taxReturn.openItems.filter(isOpenItemActive);
}

/**
 * The four practice-wide numbers across every Return the Preparer owns: how much
 * is in flight, how much sits on the Preparer's own plate, how much the AI needs a
 * human to confirm, and how much is waiting on clients. The Open-items and Requests
 * tiles split active Open Items by owner — Preparer-owned vs. Client-owned — so the
 * two never overlap: a Request is an Open Item, and it's counted once, under Requests.
 */
export function dashboardStats(returns: Return[], now: Date): DashboardStat[] {
  const active = returns.filter((r) => r.stage !== "ready-to-file").length;

  let openItems = 0;
  let needsReview = 0;
  let requests = 0;
  for (const taxReturn of returns) {
    for (const item of activeOpenItems(taxReturn)) {
      if (item.owner === "client") requests += 1;
      else openItems += 1;
    }
    needsReview += lowConfidenceAwaitingReview(taxReturn).length;
  }

  const overdueReturns = rankDashboard(returns, now).filter(
    (ranked) => ranked.daysUntilDeadline < 0,
  ).length;

  return [
    {
      id: "active",
      label: "Active returns",
      value: active,
      hint: `${returns.length} total in your book`,
    },
    {
      id: "open-items",
      label: "Open items",
      value: openItems,
      hint:
        overdueReturns > 0
          ? `${overdueReturns} return${overdueReturns === 1 ? "" : "s"} overdue`
          : "on your plate",
    },
    {
      id: "needs-review",
      label: "Needs review",
      value: needsReview,
      hint: "low-confidence fields",
    },
    {
      id: "requests",
      label: "Requests",
      value: requests,
      hint: "open with clients",
    },
  ];
}

// ─── Cross-Return action list ──────────────────────────────────────────────

/**
 * One next action the Preparer owns, pulled out of a Return and onto the landing
 * page. The atom of the Preparer's day is the Open Item (or a batch of low-Confidence
 * review), not the Return — so the list ranks *these* across every Return, and each
 * carries the deep link back into the Area where the work actually happens (challenge
 * 04). A Request whose owner is the Client is *not* here: the next move is the
 * Client's, so it reads as waiting-on-them (see `rankDashboard`), not the Preparer's
 * work — the Requests stat tile and the queue table carry it instead.
 */
export type ActionItem = {
  id: string;
  /** review = confirm the AI's low-Confidence values; open-item = the Preparer's own outstanding action. */
  kind: "review" | "open-item";
  label: string;
  client: string;
  returnId: string;
  /**
   * The Area deep link this row opens — the Return's review workspace (Overview),
   * where the actual work happens. Preparer-owned Open Items land here too (not the
   * Requests Area, which surfaces Client-owned Requests), so a row never dead-ends.
   */
  area: ReturnAreaId;
  /** Shared deadline phrase (the Return's, since Open Items inherit its clock). */
  deadline: string;
  /** Whether it should read as pressing — drives the row's alert vs. neutral marker. */
  urgent: boolean;
};

/** Build one Return's action rows: a review batch first, then each Preparer-owned Open Item. */
function actionsForReturn(ranked: RankedReturn): ActionItem[] {
  const { return: taxReturn } = ranked;
  const deadline = deadlinePhrase(ranked.daysUntilDeadline, taxReturn.deadline);
  const returnIsUrgent = isPressing(ranked.urgency);
  const rows: ActionItem[] = [];

  if (ranked.lowConfidenceCount > 0) {
    rows.push({
      id: `${taxReturn.id}:review`,
      kind: "review",
      label: `Review ${ranked.lowConfidenceCount} low-confidence value${
        ranked.lowConfidenceCount === 1 ? "" : "s"
      }`,
      client: taxReturn.client,
      returnId: taxReturn.id,
      area: "overview",
      deadline,
      urgent: returnIsUrgent,
    });
  }

  for (const item of taxReturn.openItems) {
    if (!isOpenItemActive(item)) continue;
    // A Client-owned Open Item is a Request in the Client's court — waiting on
    // them, not the Preparer's next action — so it stays off this list.
    if (item.owner === "client") continue;
    rows.push({
      id: `${taxReturn.id}:${item.id}`,
      kind: "open-item",
      label: item.label,
      client: taxReturn.client,
      returnId: taxReturn.id,
      area: "overview",
      deadline,
      urgent: returnIsUrgent || item.urgency === "high",
    });
  }

  return rows;
}

/**
 * Every outstanding action the Preparer owns across the book. Pressing rows lead —
 * an urgent Open Item (or a review batch on an urgent Return) surfaces even when its
 * Return ranks low, so the most urgent work is never buried under routine items on a
 * higher-ranked Return. Within each tier the Return's rank holds (the same urgency
 * the queue sorts by), review batches ahead of loose items. The count is the honest
 * total; the caller decides how many to show.
 */
export function buildActionList(returns: Return[], now: Date): ActionItem[] {
  const ranked = rankDashboard(returns, now).flatMap(
    (rankedReturn, returnRank) =>
      actionsForReturn(rankedReturn).map((row, rowWithinReturn) => ({
        row,
        returnRank,
        rowWithinReturn,
      })),
  );

  ranked.sort((a, b) => {
    if (a.row.urgent !== b.row.urgent) return a.row.urgent ? -1 : 1;
    if (a.returnRank !== b.returnRank) return a.returnRank - b.returnRank;
    return a.rowWithinReturn - b.rowWithinReturn;
  });

  return ranked.map((entry) => entry.row);
}
