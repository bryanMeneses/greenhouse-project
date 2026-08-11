import * as React from "react";
import {
  FileText,
  MessagesSquare,
  ClipboardList,
  Lock,
  Eye,
  Send,
  Link2,
  Plus,
  MessageSquarePlus,
} from "lucide-react";

import { cn, formatRelativeToSeed } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { RoleFamily } from "@/lib/roles";
import { roleConfig } from "@/lib/roles";
import type { OpenItem } from "./returns";
import {
  isMessageVisibleTo,
  composableAudiences,
  defaultComposeAudience,
  type Message,
  type MessageAudience,
  type Subject,
  type SubjectKind,
  type Thread as ThreadModel,
  type Viewer,
} from "./collaboration";

// ─── Presentational config ─────────────────────────────────────────────────

/** How each Subject kind reads — the label + icon for the "Linked to" line. */
const SUBJECT_KIND_CONFIG: Record<
  SubjectKind,
  { label: string; icon: typeof FileText }
> = {
  return: { label: "Return", icon: MessagesSquare },
  "source-document": { label: "Document", icon: FileText },
  "open-item": { label: "Request", icon: ClipboardList },
};

/**
 * The visible treatment for each Message audience — the anti-leak affordance
 * (ADR-0008). Internal is warning-tinted/locked; Client-visible is the
 * boundary-crossing choice, tinted with the primary token and spelled out plainly.
 */
const AUDIENCE_CONFIG: Record<
  MessageAudience,
  {
    label: string;
    icon: typeof Lock;
    /** Plain-language statement of who will see it, shown at compose time. */
    composeHint: string;
    /** Tint for the selected compose state + a Message's own bubble/chip. */
    accentClassName: string;
    badgeClassName: string;
  }
> = {
  internal: {
    label: "Internal",
    icon: Lock,
    composeHint: "Only your firm will see this.",
    accentClassName: "border-warning/50 bg-warning/5",
    badgeClassName: "bg-warning/15 text-warning border-warning/30",
  },
  "client-visible": {
    label: "Client-visible",
    icon: Eye,
    composeHint: "The client will see this.",
    accentClassName: "border-primary/50 bg-primary/5",
    badgeClassName: "bg-primary/10 text-primary border-primary/20",
  },
};

// ─── Subject + avatar helpers ────────────────────────────────────────────────

/**
 * How a Thread's Subject reads on screen — the kind label + the concrete thing it
 * links to. An open-item Subject resolves its label from the Return's Open Items,
 * so the "Linked to" line names the actual Request, not an opaque id.
 */
function describeSubject(subject: Subject, openItems: OpenItem[]) {
  const kind = SUBJECT_KIND_CONFIG[subject.kind];
  switch (subject.kind) {
    case "return":
      return { ...kind, detail: "This return" };
    case "source-document":
      return { ...kind, detail: subject.title };
    case "open-item": {
      const item = openItems.find((i) => i.id === subject.openItemId);
      return { ...kind, detail: item?.label ?? "Request" };
    }
  }
}

/** Two-letter initials from a display name, for the message avatar. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const letters = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return letters.toUpperCase() || "?";
}

/** A Thread's own audience: client-visible if any Message is, else internal. */
function threadAudience(thread: ThreadModel): MessageAudience {
  return thread.messages.some((m) => m.audience === "client-visible")
    ? "client-visible"
    : "internal";
}

// ─── Inbox list (firm) ───────────────────────────────────────────────────────

/** The audience filter over the inbox — narrows the list, firm-only. */
type InboxFilter = "all" | "client-visible" | "internal";

const INBOX_FILTERS: { value: InboxFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "client-visible", label: "Client-visible" },
  { value: "internal", label: "Internal" },
];

function matchesFilter(thread: ThreadModel, filter: InboxFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "client-visible":
      return thread.messages.some((m) => m.audience === "client-visible");
    case "internal":
      return thread.messages.some((m) => m.audience === "internal");
  }
}

type ThreadListProps = {
  threads: ThreadModel[];
  /** The Return's Open Items, to resolve open-item Subjects to their label. */
  openItems: OpenItem[];
  /** The viewer's Role family — gates the audience filter/badge and row previews. */
  viewerFamily: RoleFamily;
  selectedThreadId: string;
  onSelect: (threadId: string) => void;
  /** Start a new conversation (UI-only affordance for now). */
  onNewThread?: () => void;
  /** Drop the card chrome — this pane lives inside a shared master–detail box. */
  embedded?: boolean;
};

/**
 * The inbox: a list of selectable Thread rows, shared by the Preparer and the
 * Client. Each row leads with the conversation title, states what it's *linked to*
 * on its own line (never crammed inline), and closes with the latest author +
 * relative time. The firm also gets an audience filter and per-row audience badge;
 * the client sees neither (every message they can see is client-visible, so the
 * Internal marker is firm-only). Selecting a row swaps the detail pane beside it.
 * When `embedded`, it renders bare so the surrounding box provides the surface.
 */
export function ThreadList({
  threads,
  openItems,
  viewerFamily,
  selectedThreadId,
  onSelect,
  onNewThread,
  embedded = false,
}: ThreadListProps) {
  const [filter, setFilter] = React.useState<InboxFilter>("all");
  const labelId = React.useId();
  const isFirm = viewerFamily === "firm";
  const visible = threads.filter((t) => matchesFilter(t, filter));
  const emptyMessage =
    threads.length === 0
      ? "No conversations yet."
      : "No threads match this filter.";

  return (
    <section
      aria-labelledby={labelId}
      className={cn(
        "flex min-h-0 flex-col",
        !embedded && "rounded-lg border border-border bg-card shadow-sm",
      )}
    >
      <div className="flex flex-col gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h3
            id={labelId}
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Inbox
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-my-1 h-7 gap-1 px-2 text-xs"
            onClick={onNewThread}
          >
            <Plus aria-hidden="true" className="size-3.5" />
            New
          </Button>
        </div>
        {isFirm && (
          <ToggleGroup
            type="single"
            value={filter}
            onValueChange={(value) => value && setFilter(value as InboxFilter)}
            variant="outline"
            size="sm"
            aria-label="Filter threads by audience"
          >
            {INBOX_FILTERS.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                className="text-xs data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground"
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {visible.map((thread) => (
            <ThreadRow
              key={thread.id}
              thread={thread}
              openItems={openItems}
              viewerFamily={viewerFamily}
              isSelected={thread.id === selectedThreadId}
              onSelect={() => onSelect(thread.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ThreadRow({
  thread,
  openItems,
  viewerFamily,
  isSelected,
  onSelect,
}: {
  thread: ThreadModel;
  openItems: OpenItem[];
  viewerFamily: RoleFamily;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isFirm = viewerFamily === "firm";
  const subject = describeSubject(thread.subject, openItems);
  // Preview the latest message the viewer may actually see, so a client never
  // sees an internal note's author/time leak into the row.
  const visible = thread.messages.filter((m) =>
    isMessageVisibleTo(m, viewerFamily),
  );
  const latest = visible[visible.length - 1] ?? thread.messages[0];
  const audience = AUDIENCE_CONFIG[threadAudience(thread)];
  const AudienceIcon = audience.icon;

  return (
    <li className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onSelect}
        aria-current={isSelected ? "true" : undefined}
        className={cn(
          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
          "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          isSelected && "bg-accent",
        )}
      >
        <Avatar size="sm" className="mt-0.5">
          <AvatarFallback>{initials(latest.authorName)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-sm font-medium">{thread.title}</p>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Link2 aria-hidden="true" className="size-3 shrink-0" />
            <span className="truncate">Linked to {subject.detail}</span>
          </p>
          <div className="flex items-center gap-2">
            <span className="truncate text-xs text-muted-foreground">
              {latest.authorName} · {formatRelativeToSeed(latest.sentAt)}
            </span>
            {isFirm && (
              <Badge
                className={cn(
                  "ml-auto shrink-0 gap-1 text-[10px]",
                  audience.badgeClassName,
                )}
              >
                <AudienceIcon aria-hidden="true" />
                {audience.label}
              </Badge>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

// ─── Detail pane ─────────────────────────────────────────────────────────────

type ThreadDetailProps = {
  thread: ThreadModel;
  openItems: OpenItem[];
  /** The viewer's Role family — decides which Messages show and the compose control. */
  viewerFamily: RoleFamily;
  /** The viewer, for authoring optimistically-sent Messages. */
  viewer: Viewer;
  onSend: (body: string, audience: MessageAudience) => void;
  /** Drop the card chrome — this pane lives inside a shared master–detail box. */
  embedded?: boolean;
};

/**
 * One conversation opened up (challenge 02, ADR-0008): a serif title, the "Linked
 * to" subject line, a boundary notice, the Messages as chat bubbles, and the
 * audience-aware compose. Renders only the Messages the viewer's family may see —
 * a firm viewer sees Internal + Client-visible, a client sees Client-visible only —
 * so an Internal note never crosses the boundary. When `embedded`, it renders bare
 * so the surrounding box provides the shared surface.
 */
export function ThreadDetail({
  thread,
  openItems,
  viewerFamily,
  viewer,
  onSend,
  embedded = false,
}: ThreadDetailProps) {
  const headingId = React.useId();
  const subject = describeSubject(thread.subject, openItems);
  const KindIcon = subject.icon;
  const isFirm = viewerFamily === "firm";
  const visible = thread.messages.filter((m) =>
    isMessageVisibleTo(m, viewerFamily),
  );

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "flex min-h-0 min-w-0 flex-col",
        !embedded && "rounded-lg border border-border bg-card shadow-sm",
      )}
    >
      <div className="flex flex-col gap-1.5 border-b border-border px-5 py-4">
        <Badge variant="outline" className="w-fit gap-1 text-muted-foreground">
          <KindIcon aria-hidden="true" />
          {subject.label}
        </Badge>
        <h3
          id={headingId}
          className="font-serif text-lg font-semibold tracking-tight"
        >
          {thread.title}
        </h3>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link2 aria-hidden="true" className="size-3 shrink-0" />
          Linked to {subject.detail}
        </p>
      </div>

      <ThreadNotice isFirm={isFirm} />

      <ul className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
        {visible.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            showAudience={isFirm}
            isOwn={message.authorRole === viewer.role}
          />
        ))}
      </ul>

      <ThreadCompose viewerFamily={viewerFamily} onSend={onSend} />
    </section>
  );
}

/**
 * The detail pane's empty state — shown when a Return has no conversations yet.
 * Invites the Preparer to start the first thread (UI-only affordance for now).
 */
export function EmptyConversation({
  onNewThread,
}: {
  onNewThread?: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <MessageSquarePlus
        aria-hidden="true"
        className="size-8 text-muted-foreground/60"
      />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">No conversation selected</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Start a thread to ask the client a question or leave an internal note
          — every message stays attached to the work it belongs to.
        </p>
      </div>
      <Button type="button" size="sm" onClick={onNewThread}>
        <Plus aria-hidden="true" />
        New conversation
      </Button>
    </div>
  );
}

/**
 * The boundary notice atop the messages — the standing reminder of who can read
 * this conversation. For the firm it names the two audiences; for the client it
 * reassures that only shared messages appear.
 */
function ThreadNotice({ isFirm }: { isFirm: boolean }) {
  if (isFirm) {
    return (
      <div className="mx-5 mt-4 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
        <Eye
          aria-hidden="true"
          className="mt-0.5 size-3.5 shrink-0 text-primary"
        />
        <p>
          <span className="font-medium text-foreground">
            Client-visible thread.
          </span>{" "}
          The client sees messages you mark client-visible. Internal notes stay
          firm-only.
        </p>
      </div>
    );
  }
  return (
    <div className="mx-5 mt-4 flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <Eye aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      <p>You're seeing the messages your preparer has shared with you.</p>
    </div>
  );
}

// ─── Message bubble ──────────────────────────────────────────────────────────

function MessageBubble({
  message,
  showAudience,
  isOwn,
}: {
  message: Message;
  /** Whether to show the audience chip — only the firm needs the Internal marker. */
  showAudience: boolean;
  isOwn: boolean;
}) {
  const audience = AUDIENCE_CONFIG[message.audience];
  const AudienceIcon = audience.icon;
  const isInternal = message.audience === "internal";

  return (
    <li className={cn("flex min-w-0 gap-3", isOwn && "flex-row-reverse")}>
      <Avatar size="sm" className="mt-0.5">
        <AvatarFallback>{initials(message.authorName)}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "flex min-w-0 flex-col gap-1",
          isOwn ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-2 gap-y-1",
            isOwn && "flex-row-reverse",
          )}
        >
          <span className="text-sm font-medium">{message.authorName}</span>
          <span className="text-xs text-muted-foreground">
            {roleConfig(message.authorRole).label}
            {isOwn ? " · you" : ""}
          </span>
          {showAudience && (
            <Badge className={cn("gap-1", audience.badgeClassName)}>
              <AudienceIcon aria-hidden="true" />
              {audience.label}
            </Badge>
          )}
          <time
            dateTime={message.sentAt}
            className="text-xs text-muted-foreground tabular-nums"
          >
            {formatRelativeToSeed(message.sentAt)}
          </time>
        </div>
        <div
          className={cn(
            "max-w-[85%] border px-3 py-2 text-sm text-foreground",
            // The tail sits on the side the bubble hangs from — incoming left,
            // outgoing right — so the direction reads at a glance.
            isOwn ? "rounded-lg rounded-tr-sm" : "rounded-lg rounded-tl-sm",
            // Colour by meaning first, direction second: an internal note is always
            // amber (it must never read as client-facing), then your own messages
            // pick up the primary tint (outgoing), and everything incoming stays a
            // neutral grey.
            isInternal
              ? audience.accentClassName
              : isOwn
                ? "border-primary/25 bg-primary/10"
                : "border-border bg-muted",
          )}
        >
          {message.body}
        </div>
      </div>
    </li>
  );
}

// ─── Compose (audience-aware) ────────────────────────────────────────────────

type ThreadComposeProps = {
  viewerFamily: RoleFamily;
  onSend: (body: string, audience: MessageAudience) => void;
};

/**
 * The compose control. For the Preparer (firm) it carries an audience toggle
 * defaulting to Internal — the safer choice — and states in plain words who will
 * see the message before it's sent (the graded anti-leak affordance). For the
 * Client there is no toggle: a client message is always Client-visible.
 */
export function ThreadCompose({ viewerFamily, onSend }: ThreadComposeProps) {
  const audiences = composableAudiences(viewerFamily);
  const [audience, setAudience] = React.useState<MessageAudience>(() =>
    defaultComposeAudience(viewerFamily),
  );
  const [body, setBody] = React.useState("");
  const textareaId = React.useId();
  const hasToggle = audiences.length > 1;
  const config = AUDIENCE_CONFIG[audience];

  const trimmed = body.trim();
  const canSend = trimmed.length > 0;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSend) return;
    onSend(trimmed, audience);
    setBody("");
  };

  return (
    <form
      onSubmit={submit}
      className={cn(
        "flex flex-col gap-2 border-t px-5 py-4",
        // The whole compose area picks up the selected audience's tint, so the
        // target is unmistakable even before reading the label.
        hasToggle ? config.accentClassName : "border-border",
      )}
    >
      {hasToggle && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span
            id={`${textareaId}-audience-label`}
            className="text-xs font-medium text-muted-foreground"
          >
            Who can see this?
          </span>
          <ToggleGroup
            type="single"
            value={audience}
            onValueChange={(value) =>
              value && setAudience(value as MessageAudience)
            }
            variant="outline"
            size="sm"
            aria-labelledby={`${textareaId}-audience-label`}
          >
            {audiences.map((option) => {
              const optionConfig = AUDIENCE_CONFIG[option];
              const OptionIcon = optionConfig.icon;
              return (
                <ToggleGroupItem
                  key={option}
                  value={option}
                  aria-label={optionConfig.label}
                  className="gap-1.5 text-xs data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground"
                >
                  <OptionIcon aria-hidden="true" className="size-3.5" />
                  {optionConfig.label}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </div>
      )}

      <label htmlFor={textareaId} className="sr-only">
        Write a message
      </label>
      <Textarea
        id={textareaId}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={2}
        placeholder="Write a message…"
        className="bg-background focus-visible:ring-offset-card"
      />

      <div className="flex items-center justify-between gap-3">
        <p
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium",
            audience === "internal" ? "text-warning" : "text-primary",
          )}
        >
          <config.icon aria-hidden="true" className="size-3.5" />
          {config.composeHint}
        </p>
        <Button
          type="submit"
          size="sm"
          disabled={!canSend}
          className="focus-visible:ring-offset-card"
        >
          <Send aria-hidden="true" />
          Send
        </Button>
      </div>
    </form>
  );
}
