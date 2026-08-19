import * as React from "react";
import { ClipboardList, MessagesSquare, AlertTriangle } from "lucide-react";

import { formatShortDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RoleFamily } from "@/lib/roles";
import { roleConfig } from "@/lib/roles";
import type { OpenItem, Return } from "./returns";
import {
  openRequests,
  recentActivity,
  type Message,
  type Thread,
} from "./collaboration";
import { connectionsFor, type Connection } from "./connections";
import { ConnectionLink } from "./connection-link";
import { AreaSection } from "./area-section";

type RequestsActivityPanelProps = {
  taxReturn: Return;
  threads: Thread[];
  /** The viewer's Role family — filters activity to what they may see. */
  viewerFamily: RoleFamily;
  /** Jump to a thread when a recent-activity message is clicked. */
  onSelectThread?: (threadId: string) => void;
};

/**
 * The one aggregation surface per Return workspace (challenge 02, ADR-0008). It
 * leads with the Return's open Requests — Client-owned Open Items, ordered by
 * urgency, the outstanding actions someone owns — and then recent messages,
 * filtered to what the viewer's Role family may see. Organized around actions,
 * never a chronological dump, and scoped to this one Return: there is
 * deliberately no cross-client inbox.
 */
export function RequestsActivityPanel({
  taxReturn,
  threads,
  viewerFamily,
  onSelectThread,
}: RequestsActivityPanelProps) {
  const requests = openRequests(taxReturn.openItems);
  const activity = recentActivity(threads, viewerFamily);

  // Map a message back to its Thread's title, so activity reads with context.
  const threadTitle = React.useMemo(() => {
    const byId = new Map(threads.map((t) => [t.id, t.title]));
    return (message: Message) => byId.get(message.threadId) ?? "";
  }, [threads]);

  return (
    <AreaSection
      eyebrow="Open items and activity"
      icon={ClipboardList}
      title="Requests & Activity"
      description="Outstanding requests first, then recent messages — for this return."
    >

      {/* Open Requests — lead with the outstanding actions, by urgency. */}
      <div className="flex flex-col gap-2 px-5 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Open requests
        </h3>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open requests.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {requests.map((request) => {
              const thread = threads.find(
                (candidate) =>
                  candidate.subject.kind === "open-item" &&
                  candidate.subject.openItemId === request.id,
              );
              return (
                <RequestRow
                  key={request.id}
                  request={request}
                  threadId={thread?.id}
                  connections={connectionsFor(
                    { kind: "open-item", id: request.id },
                    taxReturn,
                    threads,
                    viewerFamily,
                  )}
                  onSelectThread={onSelectThread}
                />
              );
            })}
          </ul>
        )}
      </div>

      {/* Recent activity — messages, newest first, never a full dump. */}
      <div className="flex flex-col gap-2 border-t border-border px-5 py-4">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <MessagesSquare aria-hidden="true" className="size-3.5" />
          Recent activity
        </h3>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent messages.</p>
        ) : (
          <ul className="flex max-h-56 flex-col gap-2.5 overflow-y-auto">
            {activity.map((message) => (
              <ActivityRow
                key={message.id}
                message={message}
                threadTitle={threadTitle(message)}
                onSelect={
                  onSelectThread
                    ? () => onSelectThread(message.threadId)
                    : undefined
                }
              />
            ))}
          </ul>
        )}
      </div>
    </AreaSection>
  );
}

// ─── Rows ────────────────────────────────────────────────────────────────────

function RequestRow({
  request,
  threadId,
  connections,
  onSelectThread,
}: {
  request: OpenItem;
  threadId?: string;
  connections: Connection[];
  onSelectThread?: (threadId: string) => void;
}) {
  const isUrgent = request.urgency === "high";
  const hasConversation = Boolean(threadId);
  const content = (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm">{request.label}</span>
        <span className="text-xs text-muted-foreground">Waiting on client</span>
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-1">
        {isUrgent && (
          <Badge className="gap-1 border-warning/30 bg-warning/15 text-warning">
            <AlertTriangle aria-hidden="true" />
            Urgent
          </Badge>
        )}
        <Badge
          variant="outline"
          className={hasConversation ? "text-primary" : "text-muted-foreground"}
        >
          <MessagesSquare aria-hidden="true" />
          {hasConversation ? "In conversation" : "No conversation yet"}
        </Badge>
      </div>
    </>
  );

  const connectionList = connections.length > 0 && (
    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 px-3 text-xs">
      {connections.map((connection) => (
        <span key={connection.id}>
          <ConnectionLink connection={connection} />
        </span>
      ))}
    </div>
  );

  if (threadId && onSelectThread) {
    return (
      <li>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onSelectThread(threadId)}
          className="h-auto w-full min-w-0 items-start justify-start rounded-md border border-border bg-background px-3 py-2 text-left whitespace-normal hover:bg-accent"
        >
          {content}
        </Button>
        {connectionList}
      </li>
    );
  }

  return (
    <li className="rounded-md border border-border bg-background px-3 py-2">
      <div className="flex items-start justify-between gap-3">{content}</div>
      {connectionList}
    </li>
  );
}

function ActivityRow({
  message,
  threadTitle,
  onSelect,
}: {
  message: Message;
  threadTitle: string;
  /** When set, the whole row becomes a button that opens the message's thread. */
  onSelect?: () => void;
}) {
  const content = (
    <>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium">
          {message.authorName}
          <span className="font-normal text-muted-foreground">
            {" · "}
            {roleConfig(message.authorRole).label}
          </span>
        </span>
        <time
          dateTime={message.sentAt}
          className="shrink-0 text-xs text-muted-foreground tabular-nums"
        >
          {formatShortDate(message.sentAt)}
        </time>
      </div>
      <p className="truncate text-sm text-foreground">{message.body}</p>
      {threadTitle && (
        <p className="truncate text-xs text-muted-foreground">
          on: {threadTitle}
        </p>
      )}
    </>
  );

  if (!onSelect) {
    return <li className="flex flex-col gap-0.5">{content}</li>;
  }

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full flex-col gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {content}
      </button>
    </li>
  );
}
