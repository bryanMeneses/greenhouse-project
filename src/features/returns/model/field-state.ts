import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  Pencil,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/**
 * A Field's interaction status — what a Preparer can do to it.
 * Vocabulary is fixed by CONTEXT.md; do not add states here without an ADR.
 */
export type FieldState =
  "ai-suggested" | "verified" | "locked" | "editable" | "needs-approval";

/**
 * How a Field's value can be acted on. This is the "clickable vs. editable"
 * distinction (challenge 08): `inspect` opens the value for review (→ provenance,
 * challenge 01), `edit` lets the Preparer change it in place, `none` is read-only.
 */
export type FieldAffordance = "inspect" | "edit" | "none";

export type FieldStateConfig = {
  /** Human label shown on the badge. */
  label: string;
  /** Decorative icon; always paired with the label, never used alone. */
  icon: LucideIcon;
  /** What the Preparer can do to the value. */
  affordance: FieldAffordance;
  /** Badge background + text. Text stays dark for AA contrast; the tint carries the state. */
  badgeClassName: string;
  /** Icon tint. Icons are aria-hidden, so this is purely visual. */
  iconClassName: string;
};

/**
 * The single source of truth for Field-State visual treatment. Every surface that
 * renders a Field reads from here, so the visual language stays consistent
 * wherever Fields appear.
 */
export const FIELD_STATE_CONFIG: Record<FieldState, FieldStateConfig> = {
  "ai-suggested": {
    label: "AI suggested",
    icon: Sparkles,
    affordance: "inspect",
    badgeClassName: "bg-brand/15 text-foreground",
    iconClassName: "text-brand",
  },
  verified: {
    label: "Verified",
    icon: CheckCircle2,
    affordance: "inspect",
    badgeClassName: "bg-secondary text-secondary-foreground",
    iconClassName: "text-primary",
  },
  editable: {
    label: "Editable",
    icon: Pencil,
    affordance: "edit",
    // Outlined, not filled — mirrors the input affordance and separates it from
    // the filled green tints of `verified` and the grey of `locked`.
    badgeClassName: "border border-input bg-card text-foreground",
    iconClassName: "text-primary",
  },
  "needs-approval": {
    label: "Needs approval",
    icon: AlertTriangle,
    affordance: "inspect",
    badgeClassName: "bg-destructive/10 text-foreground",
    iconClassName: "text-destructive",
  },
  locked: {
    label: "Locked",
    icon: Lock,
    affordance: "none",
    badgeClassName: "bg-muted text-foreground",
    iconClassName: "text-muted-foreground",
  },
};

/** All Field States, in workflow order (AI-proposed → resolved → locked). */
export const FIELD_STATES = Object.keys(FIELD_STATE_CONFIG) as FieldState[];
