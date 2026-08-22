/**
 * Seed Thread data (simulated, ADR-0005 + ADR-0008). All fake collaboration data
 * lives here; the domain types and pure logic stay in
 * `@/features/returns/shared/collaboration`. Two client relationships carry the
 * audience boundary: the Nguyen Return shows it from the *firm* side (Jordan, as
 * Preparer, sees internal notes beside client-visible ones), and Jordan's own
 * personal Return (`rtn-avery-2024`, prepared by Dana) shows it from the *client*
 * side (Jordan, as Individual Taxpayer, never sees the internal notes) — so the
 * 05 role switch demonstrates both halves of the boundary.
 *
 * A further handful of Threads (below) anchor to 3 other roster Returns, added for
 * the firm-wide pooled Messages inbox (#23) — a pool over a single Return's Threads
 * reads as "one client's conversations", not a firm-wide triage view, so the pool
 * needs Threads spread across clients to demonstrate its reason for existing.
 *
 * Messages are timestamped against SEED_TODAY, never the wall clock, so the
 * ordering renders identically on every load.
 */
import type { Message, Thread } from "@/features/returns/shared/collaboration";
import {
  AVERY_1098_REQUEST_ID,
  NGUYEN_1098_REQUEST_ID,
  SEED_TODAY,
} from "@/mocks/returns";

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
    documentId: "doc-w2-acme-nguyen",
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

// ─── Jordan's personal Return (client-side boundary showcase) ───────────────
// Dana Reyes preps it; Jordan Avery is the taxpayer. Mirrors the Nguyen Threads so
// the Client view (Jordan as Individual Taxpayer) has real conversations — and its
// internal notes prove the boundary from the client's side (Jordan never sees them).

const AVERY_RETURN_ID = "rtn-avery-2024";
const DANA = { role: "preparer" as const, name: "Dana Reyes" };
const JORDAN_CLIENT = {
  role: "individual-taxpayer" as const,
  name: "Jordan Avery",
};

// Thread A: a question on Jordan's own W-2 (Box 1 $72,000), with an internal note.
const T_AVERY_W2 = "thread-avery-w2";
const averyW2Thread: Thread = {
  id: T_AVERY_W2,
  returnId: AVERY_RETURN_ID,
  subject: {
    kind: "source-document",
    documentId: "doc-w2-acme-nguyen",
    title: "W-2 (Acme Corp)",
  },
  title: "W-2 wages — a quick check on Box 1",
  messages: [
    message(
      T_AVERY_W2,
      1,
      DANA,
      "client-visible",
      "Quick check on your Acme Corp W-2 — Box 1 shows $72,000. Can you confirm this is your final copy?",
      seedTime(9),
    ),
    message(
      T_AVERY_W2,
      2,
      JORDAN_CLIENT,
      "client-visible",
      "Confirmed — that's the final W-2.",
      seedTime(8, 14),
    ),
    // Firm-only note living inside a client-visible thread — never shown to Jordan
    // in the Client view. The client-side half of the audience boundary.
    message(
      T_AVERY_W2,
      3,
      DANA,
      "internal",
      "Ties out to the IRS wage transcript — no follow-up needed.",
      seedTime(8, 15),
    ),
  ],
};

// Thread B: the 1098 Request — the Open Item Jordan's onboarding asks them to upload.
const T_AVERY_1098 = "thread-avery-1098";
const averyRequest1098Thread: Thread = {
  id: T_AVERY_1098,
  returnId: AVERY_RETURN_ID,
  subject: { kind: "open-item", openItemId: AVERY_1098_REQUEST_ID },
  title: "Requesting your Form 1098",
  messages: [
    message(
      T_AVERY_1098,
      1,
      DANA,
      "client-visible",
      "To finish your mortgage-interest deduction I'll need your 2024 Form 1098 from your lender. You can upload it right here.",
      seedTime(6),
    ),
    message(
      T_AVERY_1098,
      2,
      DANA,
      "internal",
      "If it's not in by the deadline, file without the deduction and amend later.",
      seedTime(6, 10),
    ),
  ],
};

// Thread C: a return-level conversation.
const T_AVERY_RETURN = "thread-avery-return";
const averyReturnThread: Thread = {
  id: T_AVERY_RETURN,
  returnId: AVERY_RETURN_ID,
  subject: { kind: "return" },
  title: "Your 2024 return",
  messages: [
    message(
      T_AVERY_RETURN,
      1,
      DANA,
      "client-visible",
      "I've started on your 2024 return and will flag anything I need from you right here as we go.",
      seedTime(12),
    ),
    message(
      T_AVERY_RETURN,
      2,
      JORDAN_CLIENT,
      "client-visible",
      "Thanks Dana — just let me know what you need.",
      seedTime(11, 16),
    ),
  ],
};

// ─── Cross-Return Threads (#23) — spreading the pool across other clients ──

const CLIENT_REYES = {
  role: "individual-taxpayer" as const,
  name: "Reyes Household",
};
const CLIENT_OWENS = { role: "business-owner" as const, name: "Owens Retail" };

// Thread 4: a Return-level conversation on the Reyes Household Return.
const T_REYES_RETURN = "thread-reyes-return";
const reyesReturnThread: Thread = {
  id: T_REYES_RETURN,
  returnId: "rtn-reyes-2024",
  subject: { kind: "return" },
  title: "Kicking off your 2024 review",
  messages: [
    message(
      T_REYES_RETURN,
      1,
      PREPARER,
      "client-visible",
      "Started reviewing your 2024 return — I'll flag anything I need right here as we go.",
      seedTime(5),
    ),
    message(
      T_REYES_RETURN,
      2,
      CLIENT_REYES,
      "client-visible",
      "Sounds good, thank you!",
      seedTime(4, 10),
    ),
  ],
};

// Thread 5: a question on the Reyes W-2 — its own Acme facsimile (`doc-w2-acme`,
// Box 1 $84,250), distinct from the roster's `doc-w2-acme-nguyen` ($72,000).
const T_REYES_W2 = "thread-reyes-w2";
const reyesW2Thread: Thread = {
  id: T_REYES_W2,
  returnId: "rtn-reyes-2024",
  subject: {
    kind: "source-document",
    documentId: "doc-w2-acme",
    title: "W-2 (Acme Corp)",
  },
  title: "W-2 wages — confirming Box 1",
  messages: [
    message(
      T_REYES_W2,
      1,
      PREPARER,
      "client-visible",
      "Your Acme Corp W-2 shows $84,250 in Box 1 — can you confirm this is the final copy?",
      seedTime(7),
    ),
    message(
      T_REYES_W2,
      2,
      CLIENT_REYES,
      "client-visible",
      "Yes, that's the final one.",
      seedTime(6, 11),
    ),
  ],
};

// Thread 6: a Request (sign the engagement letter) on the Owens Retail Return —
// a Client-owned Open Item, so the pooled inbox shows a "Waiting on client" row.
const T_OWENS_ENGAGEMENT = "thread-owens-engagement";
const owensEngagementThread: Thread = {
  id: T_OWENS_ENGAGEMENT,
  returnId: "rtn-owens-2024",
  subject: { kind: "open-item", openItemId: "rtn-owens-2024-client-0" },
  title: "Engagement letter — quick signature needed",
  messages: [
    message(
      T_OWENS_ENGAGEMENT,
      1,
      PREPARER,
      "client-visible",
      "Before we can start your 2024 return we need your signed engagement letter — you can sign right here.",
      seedTime(3),
    ),
    message(
      T_OWENS_ENGAGEMENT,
      2,
      CLIENT_OWENS,
      "client-visible",
      "On it — pulling it up now.",
      seedTime(3, 10),
    ),
    // Internal contingency note, same as the Nguyen 1098 Thread's pattern. The
    // Client's reply above doesn't flip the Open Item's owner — only the Preparer
    // verifying a completed signature does that (ADR-0008: no auto-close on say-so).
    message(
      T_OWENS_ENGAGEMENT,
      3,
      PREPARER,
      "internal",
      "Flag if this isn't back within a week — hold off starting prep until then.",
      seedTime(3, 11),
    ),
  ],
};

// Thread 7: an entirely Internal note on the Okafor LLC Return — a Preparer-owned
// Open Item, so both its Messages and its "Next action" owner are firm-only.
const T_OKAFOR_WAGES = "thread-okafor-wages";
const okaforWagesThread: Thread = {
  id: T_OKAFOR_WAGES,
  returnId: "rtn-okafor-2024",
  subject: { kind: "open-item", openItemId: "rtn-okafor-2024-prep-0" },
  title: "S-corp officer wages — internal check",
  messages: [
    message(
      T_OKAFOR_WAGES,
      1,
      PREPARER,
      "internal",
      "Cross-checking officer wages against the K-1 before we finalize — will confirm with the client if the split looks off.",
      seedTime(2),
    ),
    message(
      T_OKAFOR_WAGES,
      2,
      PREPARER,
      "internal",
      "Numbers reconcile; no follow-up needed.",
      seedTime(1, 14),
    ),
  ],
};

/** All seed Threads. The single source of truth for collaboration data. */
export const THREADS: Thread[] = [
  w2Thread,
  request1098Thread,
  returnThread,
  averyW2Thread,
  averyRequest1098Thread,
  averyReturnThread,
  reyesReturnThread,
  reyesW2Thread,
  owensEngagementThread,
  okaforWagesThread,
];

/** The Threads that live on a given Return, in display order. */
export function getThreadsForReturn(returnId: string): Thread[] {
  return THREADS.filter((thread) => thread.returnId === returnId);
}
