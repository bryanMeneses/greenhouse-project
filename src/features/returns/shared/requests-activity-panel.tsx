import * as React from "react";
import { ClipboardList, MessagesSquare, AlertTriangle } from "lucide-react";

import { cn, formatShortDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReturnView } from "@/hooks/use-return-view";
import type { RoleFamily } from "@/lib/roles";
import { roleConfig } from "@/lib/roles";
import type { OpenItem, Return } from "./returns";
import {
  openRequests,
  preparerOpenItems,
  recentActivity,
  type Message,
  type Thread,
} from "./collaboration";
import { connectionsFor, type Connection } from "./connections";
import { ConnectionLink } from "./connection-link";
import { AreaSection } from "./area-section";

/** The two owner-split work groups, shown one at a time as tabs. */
type WorkTab = "plate" | "requests";

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
 * leads with the Return's open Open Items, split by whose court the next move is
 * in — "On your plate" (Preparer-owned) first, then "Open requests" (Client-owned)
 * — each ordered by urgency, and then recent messages filtered to what the viewer's
 * Role family may see. The Preparer-owned rows are the addressable home the Command
 * Center's action list deep-links into (challenge 07 → 04). Organized around
 * actions, never a chronological dump, and scoped to this one Return: there is
 * deliberately no cross-client inbox.
 */
export function RequestsActivityPanel({
  taxReturn,
  threads,
  viewerFamily,
  onSelectThread,
}: RequestsActivityPanelProps) {
  const plateItems = preparerOpenItems(taxReturn.openItems);
  const requests = openRequests(taxReturn.openItems);
  const activity = recentActivity(threads, viewerFamily);

  // The two work groups share one column as tabs. A deep link (challenge 07 → 04)
  // focuses a specific Open Item, so open the tab that actually holds it — otherwise
  // the focused row would sit in a hidden tab and the arrival would land on nothing.
  // With no deep link, lead with your own plate (fall back to requests if it's empty).
  const { focus } = useReturnView();
  const requestIds = React.useMemo(
    () => new Set(requests.map((request) => request.id)),
    [requests],
  );
  const focusedItemId = focus?.kind === "open-item" ? focus.id : null;
  const tabForItem = (itemId: string): WorkTab =>
    requestIds.has(itemId) ? "requests" : "plate";
  const [workTab, setWorkTab] = React.useState<WorkTab>(
    focusedItemId
      ? tabForItem(focusedItemId)
      : plateItems.length > 0
        ? "plate"
        : "requests",
  );
  // When a *new* deep link focuses an item, reveal the tab that holds it so the
  // arrival lands — but only on that change, never fighting the user's own tab
  // clicks on later renders. A layout effect (not passive) so the tab is mounted
  // before useReturnView's focus effect queries the DOM for the target.
  const lastFocusedItemId = React.useRef(focusedItemId);
  React.useLayoutEffect(() => {
    if (focusedItemId && focusedItemId !== lastFocusedItemId.current) {
      setWorkTab(tabForItem(focusedItemId));
    }
    lastFocusedItemId.current = focusedItemId;
  });

  // A row's thread + Connections resolve the same way whoever owns the item, so
  // both groups render through the same OpenItemRow.
  const renderRow = (item: OpenItem) => {
    const thread = threads.find(
      (candidate) =>
        candidate.subject.kind === "open-item" &&
        candidate.subject.openItemId === item.id,
    );
    return (
      <OpenItemRow
        key={item.id}
        item={item}
        threadId={thread?.id}
        connections={connectionsFor(
          { kind: "open-item", id: item.id },
          taxReturn,
          threads,
          viewerFamily,
        )}
        onSelectThread={onSelectThread}
      />
    );
  };

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
      description="Your open items on the left, the client conversation on the right — for this return."
    >
      {/* Work and conversation sit side by side, so neither buries the other:
          the left column is what to do, the right column is what's been said. */}
      <div className="grid md:grid-cols-2">
        {/* LEFT — the actionable work. The Firm splits it two ways (their own plate
            vs. the client's court) as tabs; a Client has no "preparer's plate", so
            they just see their own outstanding requests. */}
        {viewerFamily === "firm" ? (
          <Tabs
            value={workTab}
            onValueChange={(value) => setWorkTab(value as WorkTab)}
            className="px-5 py-4"
          >
            <TabsList className="w-full">
              <TabsTrigger value="plate">
                On your plate
                <TabCount count={plateItems.length} />
              </TabsTrigger>
              <TabsTrigger value="requests">
                Open requests
                <TabCount count={requests.length} />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="plate" className="mt-3">
              {plateItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing on your plate.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {plateItems.map(renderRow)}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="requests" className="mt-3">
              {requests.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No open requests.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {requests.map(renderRow)}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col gap-2 px-5 py-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Open requests
            </h3>
            {requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open requests.</p>
            ) : (
              <ul className="flex flex-col gap-2">{requests.map(renderRow)}</ul>
            )}
          </div>
        )}

        {/* RIGHT — the conversation, kept beside the work rather than stacked under it. */}
        <div className="flex flex-col gap-2 border-t border-border px-5 py-4 md:border-t-0 md:border-l">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <MessagesSquare aria-hidden="true" className="size-3.5" />
            Recent activity
          </h3>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent messages.</p>
          ) : (
            <ul className="flex max-h-72 flex-col gap-2.5 overflow-y-auto">
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
      </div>
    </AreaSection>
  );
}

/** A muted count beside a tab label, so each group's size reads at a glance. */
function TabCount({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-foreground/10 px-1.5 text-xs tabular-nums text-muted-foreground">
      {count}
    </span>
  );
}

// ─── Rows ────────────────────────────────────────────────────────────────────

function OpenItemRow({
  item,
  threadId,
  connections,
  onSelectThread,
}: {
  item: OpenItem;
  threadId?: string;
  connections: Connection[];
  onSelectThread?: (threadId: string) => void;
}) {
  const isUrgent = item.urgency === "high";
  const hasConversation = Boolean(threadId);
  // Owner-aware — a Client-owned Request waits on them; a Preparer-owned item is
  // the viewer's own next move (and the dashboard deep-links straight to it).
  const ownerLabel =
    item.owner === "client" ? "Waiting on client" : "Needs your action";
  const content = (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm">{item.label}</span>
        <span className="text-xs text-muted-foreground">{ownerLabel}</span>
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

  // The card is the deep-link arrival target: when the dashboard's action list
  // focuses it (challenge 07 → 04), a primary ring + tint makes the item you
  // landed on unmistakable — the click doesn't just dump you on a generic panel.
  const arrival =
    "outline-none transition-colors focus:border-primary focus:bg-primary/5 focus:ring-2 focus:ring-primary/50";

  if (threadId && onSelectThread) {
    return (
      <li>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onSelectThread(threadId)}
          data-return-focus={item.id}
          data-return-focus-kind="open-item"
          className={cn(
            "h-auto w-full min-w-0 items-start justify-start rounded-md border border-border bg-background px-3 py-2 text-left whitespace-normal hover:bg-accent",
            arrival,
          )}
        >
          {content}
        </Button>
        {connectionList}
      </li>
    );
  }

  return (
    <li>
      <div
        tabIndex={-1}
        data-return-focus={item.id}
        data-return-focus-kind="open-item"
        className={cn(
          "rounded-md border border-border bg-background px-3 py-2",
          arrival,
        )}
      >
        <div className="flex items-start justify-between gap-3">{content}</div>
      </div>
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
