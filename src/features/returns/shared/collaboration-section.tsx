import * as React from "react";
import { MessageSquarePlus, MessagesSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { connectionsFor } from "./connections";
import { AreaSection } from "./area-section";
import { useReturnView } from "@/hooks/use-return-view";

type CollaborationSectionProps = {
  taxReturn: Return;
  /** The viewer's Role family — decides audience filtering and the layout. */
  viewerFamily: RoleFamily;
  /** The viewer, for authoring optimistically-sent Messages. */
  viewer: Viewer;
};

/**
 * The collaboration slice mounted on a Return workspace (challenge 02), shared by
 * the Preparer review and the Client view via the 05 role switch. Both see the
 * same master–detail inbox: a selectable thread list on the left, the open
 * conversation on the right. Requests & Activity is its own Area,
 * not bolted onto Messages here. Optimistic sends live here so a message survives
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
  const { focus, setFocus } = useReturnView();
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

  const focusedThread =
    focus?.kind === "thread"
      ? displayThreads.find((thread) => thread.id === focus.id)
      : undefined;
  const selected =
    focusedThread ??
    displayThreads.find((thread) => thread.id === selectedThreadId) ??
    displayThreads[0];
  const selectedConnections = selected
    ? connectionsFor(
        { kind: "thread", id: selected.id },
        taxReturn,
        displayThreads,
        viewerFamily,
      )
    : [];

  return (
    <AreaSection
      eyebrow="Collaboration"
      icon={MessagesSquare}
      title="Messages"
      description={
        isFirm
          ? "Questions and notes between you and your client, each attached to the work it belongs to."
          : "Questions and updates from your preparer about this return."
      }
      action={
        <Button type="button" size="sm">
          <MessageSquarePlus aria-hidden="true" />
          New conversation
        </Button>
      }
    >
      {/* Inbox + open conversation share one box, the same for firm and client:
          side by side on wide screens, the inbox stacking on top when it collapses
          to a single column. On wide screens the box is a fixed frame, so the inbox
          and the conversation each scroll within it rather than growing the page. */}
      <div className="grid divide-y divide-border lg:h-146 lg:grid-cols-[22rem_minmax(0,1fr)] lg:divide-x lg:divide-y-0">
        <ThreadList
          embedded
          threads={displayThreads}
          openItems={taxReturn.openItems}
          viewerFamily={viewerFamily}
          selectedThreadId={selected?.id ?? ""}
          onSelect={(threadId) => {
            setSelectedThreadId(threadId);
            setFocus({ kind: "thread", id: threadId });
          }}
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
            connections={selectedConnections}
          />
        ) : (
          <EmptyConversation />
        )}
      </div>
    </AreaSection>
  );
}
