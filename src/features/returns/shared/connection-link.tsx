import type { MouseEvent } from "react";
import {
  CircleDot,
  FileText,
  ListFilter,
  MessageCircle,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router";

import type { Connection, ConnectionTargetKind } from "./connections";
import { cn } from "@/lib/utils";
import { focusToParam, useReturnView } from "@/hooks/use-return-view";

// The visible identity of a Connection's target — the same icon vocabulary as
// the Return map's kind badges, so a Source Document link never reads the same
// as a Thread or Request link.
const TARGET_KIND_CONFIG: Record<
  ConnectionTargetKind,
  { label: string; icon: LucideIcon }
> = {
  field: { label: "Field", icon: ListFilter },
  "source-document": { label: "Source Document", icon: FileText },
  thread: { label: "Thread", icon: MessageCircle },
  "open-item": { label: "Request", icon: CircleDot },
  return: { label: "Return", icon: MessagesSquare },
};

type ConnectionLinkProps = {
  connection: Connection;
  className?: string;
};

/**
 * A visible, in-Return Connection. Following one sets {area, focus} on the
 * current Return's URL — a history push, so the header's Back button retraces it.
 * The href is built from the live search params (same merge the handler
 * performs), so the link and its click never disagree about what stays in the
 * URL. The link opens with its target's kind named (icon + label), so traveling
 * to a document, a thread, or a request reads differently at a glance.
 */
export function ConnectionLink({ connection, className }: ConnectionLinkProps) {
  const { pathname, search } = useLocation();
  const { setView } = useReturnView();
  const params = new URLSearchParams(search);
  params.set("area", connection.area);
  params.set("focus", focusToParam(connection.target));
  const href = `${pathname}?${params.toString()}`;
  const kind = TARGET_KIND_CONFIG[connection.target.kind];
  const KindIcon = kind.icon;
  const linkClassName = cn(
    "inline-flex min-w-0 items-center gap-1.5 rounded-md text-primary transition-colors hover:underline",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    className,
  );
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setView({ area: connection.area, focus: connection.target });
  };

  return (
    <Link
      to={href}
      aria-label={`${connection.relationship}: ${connection.label}`}
      title={`${kind.label}: ${connection.label}`}
      onClick={handleClick}
      className={linkClassName}
    >
      <KindIcon aria-hidden="true" className="size-3.5 shrink-0 text-primary" />
      <span className="min-w-0 truncate">
        <span className="text-muted-foreground">{kind.label}</span>
        <span aria-hidden="true" className="mx-1 text-muted-foreground/60">
          ·
        </span>
        {connection.label}
      </span>
    </Link>
  );
}
