/**
 * The collaboration layer's domain model and pure logic (challenge 02, ADR-0008).
 * A Thread anchors to exactly one Subject on a Return and holds audience-tagged
 * Messages; a Request is not a new object here but a Client-owned Open Item read
 * through its lifecycle (see `@/features/returns/shared/returns`). All fake Thread
 * data lives in `@/mocks/collaboration`; the types and pure functions stay here so
 * they're unit-testable like `derive-status`.
 */
import type { RoleFamily, Role } from "@/lib/roles";
import type { OpenItem, OpenItemOwner } from "./returns";
import { isOpenItemActive } from "./returns";

// ─── Message audience ──────────────────────────────────────────────────────

/**
 * Who a Message is visible to. `client-visible` renders to Client Roles;
 * `internal` is firm-only and never crosses to a Client Role view. Set per
 * Message, so one Thread can carry both — the boundary the Preparer's compose
 * control must make unmistakable.
 */
export type MessageAudience = "internal" | "client-visible";

// ─── Subject ───────────────────────────────────────────────────────────────

/**
 * What a Thread anchors to — exactly one Subject on a Return. A discriminated
 * union of the three anchor kinds; never a Field (a question about a single value
 * rolls up to its Source Document or becomes an Open Item, per ADR-0008).
 */
export type Subject =
  | { kind: "return" }
  | { kind: "source-document"; documentId: string; title: string }
  | { kind: "open-item"; openItemId: string };

/** The Subject kinds, for switch exhaustiveness and labels. */
export type SubjectKind = Subject["kind"];

// ─── Message ───────────────────────────────────────────────────────────────

/** A single post within a Thread, authored by a User acting as a Role. */
export type Message = {
  id: string;
  /** The Thread this Message belongs to. */
  threadId: string;
  /** The Role the author was acting as when they posted. */
  authorRole: Role;
  /** The author's display name, e.g. "Jordan Avery". */
  authorName: string;
  audience: MessageAudience;
  /** The message text. */
  body: string;
  /** When it was sent, as an ISO timestamp (seeded against SEED_TODAY). */
  sentAt: string;
};

// ─── Thread ────────────────────────────────────────────────────────────────

/** A conversation anchored to exactly one Subject on a Return. */
export type Thread = {
  id: string;
  /** The Return this Thread lives on. */
  returnId: string;
  /** The one Subject this Thread anchors to. */
  subject: Subject;
  /** A short human title for the Thread, shown as its heading. */
  title: string;
  messages: Message[];
};

/**
 * The person composing on a collaboration surface — the active User's name and
 * the Role they're acting as (ADR-0005). Used to author optimistically-sent
 * Messages; the Role's family decides audience filtering and compose options.
 */
export type Viewer = { role: Role; name: string };

// ─── Audience visibility (pure) ────────────────────────────────────────────

/**
 * Whether a Message is visible to a viewer of the given Role family. Firm Roles
 * see everything; Client Roles see only Client-visible Messages. This one
 * predicate is the whole anti-leak boundary — every surface filters through it.
 */
export function isMessageVisibleTo(
  message: Message,
  family: RoleFamily,
): boolean {
  return family === "firm" || message.audience === "client-visible";
}

/** A Thread's Messages filtered to what the given Role family may see. */
export function visibleMessages(thread: Thread, family: RoleFamily): Message[] {
  return thread.messages.filter((m) => isMessageVisibleTo(m, family));
}

/**
 * The Threads a viewer of the given Role family may see at all — the thread-level
 * companion to `isMessageVisibleTo`. A firm sees every Thread; a Client sees only
 * Threads carrying at least one Client-visible Message. Callers filter their Thread
 * set through this before handing it to a Client surface or the (audience-neutral)
 * Connections resolver, so an internal-only Thread never reaches a Client Role.
 */
export function threadsVisibleTo(
  threads: Thread[],
  family: RoleFamily,
): Thread[] {
  return threads.filter(
    (thread) =>
      family === "firm" || threadHasAudience(thread, "client-visible"),
  );
}

/** Whether a Thread contains at least one Message for the given audience. */
export function threadHasAudience(
  thread: Thread,
  audience: MessageAudience,
): boolean {
  return thread.messages.some((message) => message.audience === audience);
}

/** A Thread is client-visible if any of its Messages cross the client boundary. */
export function threadAudience(thread: Thread): MessageAudience {
  return threadHasAudience(thread, "client-visible")
    ? "client-visible"
    : "internal";
}

/**
 * The compose audiences available to a Role family. The Preparer (firm) chooses
 * between Internal and Client-visible; a Client composes Client-visible only —
 * there is no toggle, because a client message is always visible to the firm.
 */
export function composableAudiences(family: RoleFamily): MessageAudience[] {
  return family === "firm"
    ? ["internal", "client-visible"]
    : ["client-visible"];
}

/**
 * The audience a Preparer's compose control defaults to for a Thread — the safer
 * choice, so a firm-internal note is never sent client-visible by accident. On a
 * client-visible Subject we still default to Internal: composing is opt-in to the
 * client boundary, never opt-out (ADR-0008 — the anti-leak affordance is graded).
 */
export function defaultComposeAudience(family: RoleFamily): MessageAudience {
  return family === "firm" ? "internal" : "client-visible";
}

// ─── Requests: an Open Item read through its audience (pure) ───────────────

/**
 * Whether an Open Item is a Request — i.e. owned by a Client Role. A Request is
 * not a separate object; it's an Open Item named for its audience (ADR-0008).
 * True regardless of resolution: a Closed Request was still a Request.
 */
export function isRequest(item: OpenItem): boolean {
  return item.owner === "client";
}

/** Urgency rank for ordering open Requests; higher sorts first. Absent = normal. */
const URGENCY_RANK: Record<NonNullable<OpenItem["urgency"]>, number> = {
  high: 0,
  normal: 1,
};

function urgencyRank(item: OpenItem): number {
  return URGENCY_RANK[item.urgency ?? "normal"];
}

/**
 * The Return's open Requests — Client-owned Open Items that aren't Closed —
 * ordered by urgency (high first), then by original order. This is what the
 * "Requests & Activity" panel leads with, and what 03's first-run next-action
 * list consumes.
 */
export function openRequests(items: OpenItem[]): OpenItem[] {
  return items
    .filter((item) => isRequest(item) && isOpenItemActive(item))
    .sort((a, b) => urgencyRank(a) - urgencyRank(b));
}

/**
 * Who owns the next action on an Open Item, or `null` once it's Closed (nothing
 * left to own). Answerable at every state — the guarantee ADR-0008 makes about a
 * Thread's "who owns next".
 */
export function nextActionOwner(item: OpenItem): OpenItemOwner | null {
  return isOpenItemActive(item) ? item.owner : null;
}

// ─── Request lifecycle transitions (pure) ──────────────────────────────────

/**
 * The client acted on a Request (uploaded / answered / signed): ownership flips
 * to the Preparer to verify. This never Closes the Request — there is no
 * auto-close on client action; the firm always verifies (ADR-0008). A no-op on
 * anything that isn't an open, client-owned Request.
 */
export function fulfillRequest(item: OpenItem): OpenItem {
  if (!isRequest(item) || !isOpenItemActive(item)) return item;
  return { ...item, owner: "preparer" };
}

/**
 * The Preparer verified a fulfilled Request and Closes it — the terminal state.
 * Only valid once ownership has flipped to the Preparer; a no-op otherwise (an
 * open, client-owned Request can't be closed without the client acting first).
 */
export function closeRequest(item: OpenItem): OpenItem {
  if (item.owner !== "preparer" || !isOpenItemActive(item)) return item;
  return { ...item, resolution: "closed" };
}

// ─── Recent activity (pure) ────────────────────────────────────────────────

/**
 * The most recent Messages across a Return's Threads, newest first, filtered to
 * the viewer's Role family. The "Activity" half of the panel — recent messages,
 * never a chronological dump of everything.
 */
export function recentActivity(
  threads: Thread[],
  family: RoleFamily,
  limit = 5,
): Message[] {
  return threads
    .flatMap((thread) => visibleMessages(thread, family))
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
    .slice(0, limit);
}
