import {
  AlertTriangle,
  CircleDot,
  Clock,
  PauseCircle,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

import type { Stage } from "@/features/returns/shared/returns";
import type { ReturnUrgency } from "@/features/dashboard/ranking";

/**
 * Shared presentation of a Return's Stage and urgency — the labels, tints, and
 * progress reading the Command Center's queue, the `/returns` roster, and ⌘K search
 * all read from, so the same Return never looks like two different things.
 */

export const STAGE_LABEL: Record<Stage, string> = {
  intake: "Intake",
  "in-review": "In review",
  "ready-to-file": "Ready to file",
};

/** A stage-based progress reading for the roster at a glance — deliberately not the
 * full challenge-06 stepper, just where the Return sits along its three Stages. */
export const STAGE_PROGRESS: Record<Stage, number> = {
  intake: 25,
  "in-review": 60,
  "ready-to-file": 90,
};

/** Per-urgency badge treatment; the loudest tint on the signal that most needs a look. */
export const URGENCY_CONFIG: Record<
  ReturnUrgency,
  { label: string; icon: LucideIcon; className: string; iconClassName: string }
> = {
  overdue: {
    label: "Overdue",
    icon: AlertTriangle,
    className: "bg-destructive/10 text-foreground",
    iconClassName: "text-destructive",
  },
  "due-soon": {
    label: "Due soon",
    icon: Clock,
    className: "bg-brand/15 text-foreground",
    iconClassName: "text-brand",
  },
  "needs-review": {
    label: "Needs review",
    icon: ShieldAlert,
    className: "bg-destructive/10 text-foreground",
    iconClassName: "text-destructive",
  },
  "blocked-on-client": {
    label: "Blocked on client",
    icon: PauseCircle,
    className: "bg-muted text-foreground",
    iconClassName: "text-muted-foreground",
  },
  "in-progress": {
    label: "In progress",
    icon: CircleDot,
    className: "bg-secondary text-secondary-foreground",
    iconClassName: "text-primary",
  },
};
