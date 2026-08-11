import * as React from "react";
import {
  FileText,
  MessagesSquare,
  ClipboardList,
  Lock,
  Eye,
  Send,
} from "lucide-react";

import { cn, formatShortDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Role, RoleFamily } from "@/lib/roles";
import { roleConfig } from "@/lib/roles";
import {
  isMessageVisibleTo,
  composableAudiences,
  defaultComposeAudience,
  type Message,
  type MessageAudience,
  type Subject,
  type SubjectKind,
  type Thread as ThreadModel,
} from "./collaboration";

// ─── Presentational config ─────────────────────────────────────────────────

/** How each Subject kind reads in the Thread header — what this conversation anchors to. */
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
 * (ADR-0008). Internal is neutral/locked; Client-visible is the boundary-crossing
 * choice, tinted with the primary token and spelled out in plain words.
 */
const AUDIENCE_CONFIG: Record<
  MessageAudience,
  {
    label: string;
    icon: typeof Lock;
    /** Plain-language statement of who will see it, shown at compose time. */
    composeHint: string;
    /** Tint for the selected compose state + the message's own audience chip. */
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

// ─── Thread ──────────────────────────────────────────────────────────────────

type ThreadProps = {
  thread: ThreadModel;
  /** The viewer's Role family — decides which Messages show and the compose control. */
  viewerFamily: RoleFamily;
  /** The viewer, for authoring optimistically-sent Messages. */
  viewer: { role: Role; name: string };
};

/**
 * A conversation anchored to one Subject (challenge 02, ADR-0008), shared by the
 * Preparer review and the Client view. It renders only the Messages the viewer's
 * Role family may see — a firm viewer sees Internal + Client-visible, a client
 * sees Client-visible only — so an Internal note never crosses the boundary. The
 * compose control adapts too: the Preparer picks the audience (defaulting to the
 * safer Internal), the Client composes Client-visible with no toggle. Sends are
 * optimistic and local (no messaging backend).
 */
export function Thread({ thread, viewerFamily, viewer }: ThreadProps) {
  const headingId = React.useId();
  const [messages, setMessages] = React.useState<Message[]>(thread.messages);
  const localCount = React.useRef(0);

  const visible = messages.filter((m) => isMessageVisibleTo(m, viewerFamily));

  const send = (body: string, audience: MessageAudience) => {
    localCount.current += 1;
    setMessages((current) => [
      ...current,
      {
        id: `${thread.id}-local-${localCount.current}`,
        threadId: thread.id,
        authorRole: viewer.role,
        authorName: viewer.name,
        audience,
        body,
        sentAt: new Date().toISOString(),
      },
    ]);
  };

  const kind = SUBJECT_KIND_CONFIG[thread.subject.kind];
  const KindIcon = kind.icon;

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col rounded-lg border border-border bg-card shadow-sm"
    >
      <div className="flex flex-col gap-1 border-b border-border px-4 py-3">
        <Badge variant="outline" className="gap-1 text-muted-foreground">
          <KindIcon aria-hidden="true" />
          {kind.label}
          <SubjectDetail subject={thread.subject} />
        </Badge>
        <h3 id={headingId} className="text-sm font-semibold tracking-tight">
          {thread.title}
        </h3>
      </div>

      <ul className="flex flex-col gap-3 px-4 py-4">
        {visible.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            showAudience={viewerFamily === "firm"}
            isOwn={message.authorRole === viewer.role}
          />
        ))}
      </ul>

      <ThreadCompose viewerFamily={viewerFamily} onSend={send} />
    </section>
  );
}

/** The concrete Subject beside the kind chip — the document title, when there is one. */
function SubjectDetail({ subject }: { subject: Subject }) {
  if (subject.kind === "source-document") {
    return <span className="font-normal">· {subject.title}</span>;
  }
  return null;
}

// ─── Message ─────────────────────────────────────────────────────────────────

function MessageItem({
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
    <li
      className={cn(
        "rounded-md border px-3 py-2",
        // Internal notes stand apart from the client-visible flow so the firm
        // never mistakes one for something the client can read.
        isInternal ? audience.accentClassName : "border-border bg-background",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
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
          className="ml-auto text-xs text-muted-foreground tabular-nums"
        >
          {formatShortDate(message.sentAt)}
        </time>
      </div>
      <p className="mt-1 text-sm text-foreground">{message.body}</p>
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
        "flex flex-col gap-2 border-t px-4 py-3",
        // The whole compose area picks up the selected audience's tint, so the
        // target is unmistakable even before reading the label.
        hasToggle ? config.accentClassName : "border-border",
      )}
    >
      {hasToggle && (
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-xs font-medium text-muted-foreground">
            Who can see this?
          </legend>
          <div className="inline-flex w-fit rounded-md border border-border bg-background p-0.5">
            {audiences.map((option) => {
              const optionConfig = AUDIENCE_CONFIG[option];
              const OptionIcon = optionConfig.icon;
              const selected = option === audience;
              return (
                <label
                  key={option}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
                    selected
                      ? "bg-secondary text-secondary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <input
                    type="radio"
                    name={`${textareaId}-audience`}
                    value={option}
                    checked={selected}
                    onChange={() => setAudience(option)}
                    className="sr-only"
                  />
                  <OptionIcon aria-hidden="true" className="size-3.5" />
                  {optionConfig.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <label htmlFor={textareaId} className="sr-only">
        Write a message
      </label>
      <textarea
        id={textareaId}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={2}
        placeholder="Write a message…"
        className={cn(
          "w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        )}
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
