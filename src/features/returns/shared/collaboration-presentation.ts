import {
  ClipboardList,
  Eye,
  FileText,
  Lock,
  MessagesSquare,
} from "lucide-react";

import type { MessageAudience, SubjectKind } from "./collaboration";

/**
 * Shared presentation of a Thread's Subject and a Message's audience — the labels,
 * icons, and tints both the per-Return inbox (`thread.tsx`) and the firm-wide pooled
 * Messages inbox (`messages-table.tsx`) read from, so a Subject and the anti-leak
 * audience boundary (ADR-0008) read identically everywhere they're shown. Split out
 * from `thread.tsx` (a component file) so it can be exported without breaking React
 * Fast Refresh, mirroring `@/features/dashboard/return-presentation`.
 */

/** How each Subject kind reads — the label + icon for the "Linked to" line. */
export const SUBJECT_KIND_CONFIG: Record<
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
export const AUDIENCE_CONFIG: Record<
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

/**
 * The badge treatment for a Thread carrying *both* audiences — the case
 * `threadAudience` collapses to Client-visible but the pooled Messages inbox
 * still surfaces, so the boundary stays unmistakable even when a firm-internal
 * note lives inside a client-visible Thread. Badge-only: a mixed Thread has no
 * single compose audience.
 */
export const MIXED_AUDIENCE_CONFIG: {
  label: string;
  icon: typeof MessagesSquare;
  badgeClassName: string;
} = {
  label: "Mixed",
  icon: MessagesSquare,
  badgeClassName: "bg-muted text-muted-foreground border-border",
};
