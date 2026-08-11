import * as React from "react";

import type { RoleFamily } from "@/lib/roles";
import { getThreadsForReturn } from "@/mocks/collaboration";
import { SEED_TODAY } from "@/mocks/returns";
import type { Return } from "./returns";
import type {
  Message,
  MessageAudience,
  Thread as ThreadModel,
  Viewer,
} from "./collaboration";
import { threadHasAudience } from "./collaboration";
import { ThreadList, ThreadDetail, EmptyConversation } from "./thread";
import { RequestsActivityPanel } from "./requests-activity-panel";

type CollaborationSectionProps = {
  taxReturn: Return;
  /** The viewer's Role family — decides audience filtering and the layout. */
  viewerFamily: RoleFamily;
  /** The viewer, for authoring optimistically-sent Messages. */
  viewer: Viewer;
};

/**
 * The collaboration slice mounted on a Return workspace (challenge 02), shared by
 * the Preparer review and the Client view via the 05 role switch. The firm sees a
 * master–detail inbox: Requests & Activity and a selectable thread list on the
 * left, the open conversation on the right. The client sees the same threads as a
 * single narrow column of chat, audience-filtered (no Internal notes) and without
 * the firm's panel or inbox. Optimistic sends live here so a message survives
 * switching between threads; they're stamped against SEED_TODAY, never the wall
 * clock, so ordering stays fixed.
 */
export function CollaborationSection({
  taxReturn,
  viewerFamily,
  viewer,
}: CollaborationSectionProps) {
  const seed = React.useMemo(
    () => getThreadsForReturn(taxReturn.id),
    [taxReturn.id],
  );
  const [threads, setThreads] = React.useState<ThreadModel[]>(seed);
  const [selectedThreadId, setSelectedThreadId] = React.useState(
    seed[0]?.id ?? "",
  );
  const localCount = React.useRef(0);

  const send = (threadId: string, body: string, audience: MessageAudience) => {
    localCount.current += 1;
    const message: Message = {
      id: `${threadId}-local-${localCount.current}`,
      threadId,
      authorRole: viewer.role,
      authorName: viewer.name,
      audience,
      body,
      // Stamped against SEED_TODAY (not `new Date()`) so ordering stays fixed.
      sentAt: SEED_TODAY.toISOString(),
    };
    setThreads((current) =>
      current.map((thread) =>
        thread.id === threadId
          ? { ...thread, messages: [...thread.messages, message] }
          : thread,
      ),
    );
  };

  const isFirm = viewerFamily === "firm";

  // The Client only sees threads that carry something they're allowed to read;
  // the Firm sees them all. Both drive the same master–detail inbox.
  const displayThreads = isFirm
    ? threads
    : threads.filter((t) => threadHasAudience(t, "client-visible"));

  // The Client shows nothing when there's no conversation to read; the Firm keeps
  // the box (with its empty state) so the workspace remains structurally stable.
  if (!isFirm && displayThreads.length === 0) return null;

  const selected =
    displayThreads.find((thread) => thread.id === selectedThreadId) ??
    displayThreads[0];

  return (
    <section aria-label="Collaboration" className="flex flex-col gap-4">
      {/* Inbox + open conversation share one box, the same for firm and client:
          side by side on wide screens, the inbox stacking on top when it collapses
          to a single column. On wide screens the box is a fixed frame, so the inbox
          and the conversation each scroll within it rather than growing the page. */}
      <div className="grid divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm lg:h-[36.5rem] lg:grid-cols-[22rem_minmax(0,1fr)] lg:divide-x lg:divide-y-0">
        <ThreadList
          embedded
          threads={displayThreads}
          openItems={taxReturn.openItems}
          viewerFamily={viewerFamily}
          selectedThreadId={selected?.id ?? ""}
          onSelect={setSelectedThreadId}
        />
        {selected ? (
          <ThreadDetail
            key={selected.id}
            embedded
            thread={selected}
            openItems={taxReturn.openItems}
            viewerFamily={viewerFamily}
            viewer={viewer}
            onSend={(body, audience) => send(selected.id, body, audience)}
          />
        ) : (
          <EmptyConversation />
        )}
      </div>

      {/* Requests & Activity is a firm aggregation surface — the client's own
          requests already surface in their return-status view. Clicking a recent
          message jumps to its thread in the box above. */}
      {isFirm && (
        <div className="lg:max-w-md">
          <RequestsActivityPanel
            taxReturn={taxReturn}
            threads={threads}
            viewerFamily={viewerFamily}
            onSelectThread={setSelectedThreadId}
          />
        </div>
      )}
    </section>
  );
}
