/**
 * Seed Thread data (simulated, ADR-0005 + ADR-0008). All fake collaboration data
 * lives here; the domain types and pure logic stay in
 * `@/features/returns/shared/collaboration`. Threads anchor to the existing Nguyen
 * Return — the one reachable behind both the Preparer review and the Client view
 * (via the 05 role switch) — so the audience boundary is demonstrable on one
 * Return. No new Return is seeded (#19).
 *
 * Messages are timestamped against SEED_TODAY, never the wall clock, so the
 * ordering renders identically on every load.
 */
import type { Message, Thread } from "@/features/returns/shared/collaboration";
import { NGUYEN_1098_REQUEST_ID, SEED_TODAY } from "@/mocks/returns";

const RETURN_ID = "rtn-nguyen-2024";

const PREPARER = { role: "preparer" as const, name: "Jordan Avery" };
const CLIENT = { role: "individual-taxpayer" as const, name: "Nguyen Family" };

/** An ISO timestamp `days` before SEED_TODAY at the given hour — keeps ordering fixed. */
function seedTime(days: number, hour = 9): string {
  const t = new Date(SEED_TODAY);
  t.setDate(t.getDate() - days);
  t.setHours(hour, 0, 0, 0);
  return t.toISOString();
}

/** Terse Message builder so the seed reads as a conversation, not boilerplate. */
function message(
  threadId: string,
  n: number,
  author: { role: Message["authorRole"]; name: string },
  audience: Message["audience"],
  body: string,
  sentAt: string,
): Message {
  return {
    id: `${threadId}-m${n}`,
    threadId,
    authorRole: author.role,
    authorName: author.name,
    audience,
    body,
    sentAt,
  };
}

// ─── Thread 1: a question on a Source Document (the W-2) ────────────────────
// Holds an Internal note *inside* a client-visible thread — the boundary test.

const T_W2 = "thread-nguyen-w2";
const w2Thread: Thread = {
  id: T_W2,
  returnId: RETURN_ID,
  subject: {
    kind: "source-document",
    documentId: "doc-w2-acme",
    title: "W-2 (Acme Corp)",
  },
  title: "W-2 wages — a quick check on Box 1",
  messages: [
    message(
      T_W2,
      1,
      PREPARER,
      "client-visible",
      "Quick question on your Acme Corp W-2 — Box 1 shows $72,000. Can you confirm this is your final W-2, not an earlier version?",
      seedTime(9),
    ),
    message(
      T_W2,
      2,
      CLIENT,
      "client-visible",
      "Yes, that's the final one — Acme reissued it in February. $72,000 is correct.",
      seedTime(8, 14),
    ),
    // Internal note living inside a client-visible thread — never shown to the client.
    message(
      T_W2,
      3,
      PREPARER,
      "internal",
      "Cross-checked against the IRS wage transcript — matches to the dollar. No further follow-up needed.",
      seedTime(8, 15),
    ),
  ],
};

// ─── Thread 2: an Open Item / Request (upload the 1098) ─────────────────────

const T_1098 = "thread-nguyen-1098";
const request1098Thread: Thread = {
  id: T_1098,
  returnId: RETURN_ID,
  subject: { kind: "open-item", openItemId: NGUYEN_1098_REQUEST_ID },
  title: "Requesting your Form 1098",
  messages: [
    message(
      T_1098,
      1,
      PREPARER,
      "client-visible",
      "To finish your mortgage-interest deduction we need your 2024 Form 1098 from your lender. You can upload it right here whenever it's handy.",
      seedTime(6),
    ),
    // Internal contingency note — firm-only, in the same thread as the ask above.
    message(
      T_1098,
      2,
      PREPARER,
      "internal",
      "If this isn't in by the deadline, file without the mortgage-interest deduction and amend later — don't hold the whole return on it.",
      seedTime(6, 10),
    ),
  ],
};

// ─── Thread 3: a Return-level conversation ──────────────────────────────────

const T_RETURN = "thread-nguyen-return";
const returnThread: Thread = {
  id: T_RETURN,
  returnId: RETURN_ID,
  subject: { kind: "return" },
  title: "Your 2024 return",
  messages: [
    message(
      T_RETURN,
      1,
      PREPARER,
      "client-visible",
      "Welcome! I've started on your 2024 return and will flag anything I need from you right here as we go.",
      seedTime(12),
    ),
    message(
      T_RETURN,
      2,
      CLIENT,
      "client-visible",
      "Thanks — just let me know what you need from my end.",
      seedTime(11, 16),
    ),
  ],
};

/** All seed Threads. The single source of truth for collaboration data. */
export const THREADS: Thread[] = [w2Thread, request1098Thread, returnThread];

/** The Threads that live on a given Return, in display order. */
export function getThreadsForReturn(returnId: string): Thread[] {
  return THREADS.filter((thread) => thread.returnId === returnId);
}
