import { parseDeadline, DUE_SOON_DAYS } from "@/features/dashboard/ranking";
import type { OpenItem, OpenItemOwner, Return, Stage } from "./returns";
import { isOpenItemActive } from "./returns";

// ─── Stage → step index ────────────────────────────────────────────────────

const STAGE_ORDER: Stage[] = ["intake", "in-review", "ready-to-file"];

// ─── Audience-agnostic facts ───────────────────────────────────────────────

/** Which owner (client or preparer) is blocking progress, if any. */
export type BlockedBy = OpenItemOwner | null;

/**
 * One step on the progress stepper: the three lifecycle Stages plus a dimmed
 * "Filed" finish line.
 */
export type Step = {
  /** The Stage this step represents, or "filed" for the finish line. */
  key: Stage | "filed";
  /** Whether this step happened in the past. */
  completed: boolean;
  /** Whether the Return is sitting at this step right now. */
  current: boolean;
  /** Whether this step hasn't happened yet. */
  upcoming: boolean;
};

/** Deadline state, using the same thresholds as the dashboard. */
export type DeadlineState = {
  /** Calendar days from `now` to the deadline (negative once overdue). */
  daysUntilDeadline: number;
  /** Past the deadline. */
  isOverdue: boolean;
  /** Within the `DUE_SOON_DAYS` window (inclusive), but not overdue. */
  isNearDeadline: boolean;
};

/** What the viewer should do next, if anything. */
export type NextAction = {
  /** The owner who must act next. */
  owner: OpenItemOwner;
  /** The items that owner needs to clear. */
  items: OpenItem[];
};

/**
 * The one canonical status model for a Return, derived from the existing schema.
 * Audience-agnostic: components layer on wording for Preparer vs Client. Produced
 * by `deriveReturnStatus(taxReturn, now)` — pure, deterministic, testable.
 */
export type ReturnStatus = {
  /** The Return's current Stage. */
  stage: Stage;

  /** The six stepper positions: three Stages + a dimmed "Filed" finish line. */
  steps: Step[];

  /**
   * Who owns the open items that are holding the Return back — "client",
   * "preparer", or null when nothing is blocked. Open items are grouped below;
   * this is the single flag that drives the blocking callout.
   */
  blockedBy: BlockedBy;

  /** Open items split by owner, for audience-relative display. */
  openItemsByOwner: Record<OpenItemOwner, OpenItem[]>;

  /** Deadline facts, using the dashboard's deadline helpers (no second threshold). */
  deadline: DeadlineState;
};

// ─── Derivation ────────────────────────────────────────────────────────────

/**
 * Derive audience-agnostic status facts from a Return and a reference date.
 * Pure — renders deterministically against the same inputs, designed for unit
 * testing like `ranking.ts`. Callers pass `SEED_TODAY` for the dashboard seed or
 * a test `now` for assertions; never `new Date()` at render time.
 */
export function deriveReturnStatus(taxReturn: Return, now: Date): ReturnStatus {
  const stageIndex = STAGE_ORDER.indexOf(taxReturn.stage);

  const steps: Step[] = STAGE_ORDER.map((key, i) => ({
    key,
    completed: i < stageIndex,
    current: i === stageIndex,
    upcoming: i > stageIndex,
  }));
  // Always-upcoming "Filed" finish line.
  steps.push({
    key: "filed",
    completed: false,
    current: false,
    upcoming: true,
  });

  // Open items grouped by owner. Closed Requests are resolved — they neither
  // group here nor block below (ADR-0008).
  const openItemsByOwner: Record<OpenItemOwner, OpenItem[]> = {
    preparer: [],
    client: [],
  };
  for (const item of taxReturn.openItems.filter(isOpenItemActive)) {
    openItemsByOwner[item.owner].push(item);
  }

  // Blocked-by: the first owner with open items (client blocks take priority
  // for the canonical fact — components then map to audience-relative).
  const blockedBy: BlockedBy =
    openItemsByOwner.client.length > 0
      ? "client"
      : openItemsByOwner.preparer.length > 0
        ? "preparer"
        : null;

  // Deadline — reuse dashboard helpers so thresholds never drift.
  const deadlineDate = parseDeadline(taxReturn.deadline);
  const daysUntilDeadline = calendarDayDiff(deadlineDate, now);

  const deadline: DeadlineState = {
    daysUntilDeadline,
    isOverdue: daysUntilDeadline < 0,
    isNearDeadline:
      daysUntilDeadline >= 0 && daysUntilDeadline <= DUE_SOON_DAYS,
  };

  return {
    stage: taxReturn.stage,
    steps,
    blockedBy,
    openItemsByOwner,
    deadline,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Calendar days from `now` to `deadline`, same math as ranking.ts. */
function calendarDay(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function calendarDayDiff(deadline: Date, now: Date): number {
  const diff = calendarDay(deadline) - calendarDay(now);
  return Math.round(diff / 86_400_000);
}

// ─── Audience-relative helpers (exported so surfaces stay consistent) ──────

/** Stage labels per audience — same step, different word. */
export const PREPARER_STAGE_LABEL: Record<Stage, string> = {
  intake: "Intake",
  "in-review": "In review",
  "ready-to-file": "Ready to file",
};

export const CLIENT_STAGE_LABEL: Record<Stage, string> = {
  intake: "Getting started",
  "in-review": "In review",
  "ready-to-file": "Ready to file",
};

/** Stage descriptions per audience. */
export const CLIENT_STAGE_DESCRIPTION: Record<Stage, string> = {
  intake: "We're gathering and organizing your documents.",
  "in-review": "Your preparer is reviewing your return.",
  "ready-to-file": "Your return is ready — just a few final steps.",
};

/**
 * Whether the viewer's next action is on them — i.e. the blocked-by owner
 * matches the viewer's owner role. For Client: blockedBy === "client" means the
 * viewer has work. For Preparer: blockedBy === "preparer" means they have work.
 */
export function viewerIsBlocked(
  status: ReturnStatus,
  viewerOwner: OpenItemOwner,
): boolean {
  return status.blockedBy === viewerOwner;
}

/**
 * Whether the viewer is waiting on the *other* party. For Client:
 * blockedBy === "preparer" means they're waiting. For Preparer:
 * blockedBy === "client" means they're waiting on the client.
 */
export function viewerIsWaiting(
  status: ReturnStatus,
  viewerOwner: OpenItemOwner,
): boolean {
  return status.blockedBy !== null && status.blockedBy !== viewerOwner;
}
