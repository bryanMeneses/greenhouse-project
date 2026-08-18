import { getThreadsForReturn } from "@/mocks/collaboration";
import {
  threadsVisibleTo,
  threadAudience,
  threadHasAudience,
  subjectLabel,
  nextActionOwner,
  type MessageAudience,
  type Subject,
  type SubjectKind,
  type Thread,
} from "@/features/returns/shared/collaboration";
import type { OpenItemOwner, Return } from "@/features/returns/shared/returns";

/**
 * The firm-wide Messages pool (Issue #23) — every Thread across every Return,
 * flattened into one row per *(Return, Thread)*, the Messages sibling to the
 * pooled Documents table (#21). It is *derived*, never a new channel: each row
 * reuses `getThreadsForReturn` plus the collaboration layer's existing pure
 * functions (`threadsVisibleTo`, `threadAudience`, `threadHasAudience`,
 * `subjectLabel`, `nextActionOwner`) — the same anti-leak boundary and "who owns
 * next" logic the per-Return inbox reads through. The pool is Firm-only (a Client
 * has one Return and reads Messages there directly), so `threadsVisibleTo` here
 * documents the boundary rather than narrowing anything.
 */
export type PooledThread = {
  /** `${returnId}:${threadId}` — unique per row (the React key + sort tiebreak). */
  rowId: string;
  returnId: string;
  client: string;
  returnNumber: string;
  taxYear: number;
  threadId: string;
  /** The Thread's own title, e.g. "W-2 wages — a quick check on Box 1". */
  threadTitle: string;
  subjectKind: SubjectKind;
  /** The concrete thing the Subject names, e.g. "W-2 (Acme Corp)" or "the Return". */
  subjectDetail: string;
  /**
   * The collapsed `threadAudience` — Client-visible when any Message crosses the
   * boundary, otherwise Internal. Sorting groups by this; the per-audience flags
   * below carry the "Mixed" detail a collapsed value can't.
   */
  audience: MessageAudience;
  /** Whether the Thread carries at least one Internal Message. */
  hasInternal: boolean;
  /** Whether the Thread carries at least one Client-visible Message. */
  hasClientVisible: boolean;
  messageCount: number;
  /** The Thread's most recent Message. Every seed Thread has at least one. */
  lastMessage: { authorName: string; body: string; sentAt: string };
  /**
   * Who owns the next action, when the Subject is an open Request — `null` for a
   * Return/Document Subject, or once the Request is Closed (nothing left to own).
   */
  nextActionOwner: OpenItemOwner | null;
};

/** The Thread's most recent Message by `sentAt` — every seed Thread has ≥1 Message. */
function latestMessage(thread: Thread): Thread["messages"][number] {
  return [...thread.messages].sort((a, b) =>
    b.sentAt.localeCompare(a.sentAt),
  )[0];
}

/** Who owns the next action for a Thread's Subject, resolved against its Return. */
function ownerFor(subject: Subject, taxReturn: Return): OpenItemOwner | null {
  if (subject.kind !== "open-item") return null;
  const item = taxReturn.openItems.find((i) => i.id === subject.openItemId);
  return item ? nextActionOwner(item) : null;
}

/**
 * Rank for the "Next action" column: a Client-owed action leads, then the firm's,
 * then nothing owed. Used by the column's sortFn.
 */
export function threadOwnerRank(
  row: Pick<PooledThread, "nextActionOwner">,
): number {
  switch (row.nextActionOwner) {
    case "client":
      return 0;
    case "preparer":
      return 1;
    default:
      return 2;
  }
}

/** Build the flattened firm-wide Thread pool from the Return roster. */
export function collectFirmThreads(returns: Return[]): PooledThread[] {
  const rows: PooledThread[] = [];
  for (const taxReturn of returns) {
    const threads = threadsVisibleTo(getThreadsForReturn(taxReturn.id), "firm");
    for (const thread of threads) {
      const latest = latestMessage(thread);
      rows.push({
        rowId: `${taxReturn.id}:${thread.id}`,
        returnId: taxReturn.id,
        client: taxReturn.client,
        returnNumber: taxReturn.returnNumber,
        taxYear: taxReturn.taxYear,
        threadId: thread.id,
        threadTitle: thread.title,
        subjectKind: thread.subject.kind,
        subjectDetail: subjectLabel(thread.subject, taxReturn.openItems),
        audience: threadAudience(thread),
        hasInternal: threadHasAudience(thread, "internal"),
        hasClientVisible: threadHasAudience(thread, "client-visible"),
        messageCount: thread.messages.length,
        lastMessage: {
          authorName: latest.authorName,
          body: latest.body,
          sentAt: latest.sentAt,
        },
        nextActionOwner: ownerFor(thread.subject, taxReturn),
      });
    }
  }
  return rows;
}
