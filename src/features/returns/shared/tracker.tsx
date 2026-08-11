import { Check, Flag } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Stage } from "./returns";
import type { ReturnStatus, Step } from "./derive-status";
import { CLIENT_STAGE_LABEL, PREPARER_STAGE_LABEL } from "./derive-status";

// ─── Label configs ─────────────────────────────────────────────────────────

/**
 * Audience-adapted stage labels for the tracker. Same step positions;
 * different words.
 */
export type TrackerAudience = "preparer" | "client";

const STAGE_LABELS: Record<TrackerAudience, Record<Stage, string>> = {
  preparer: PREPARER_STAGE_LABEL,
  client: CLIENT_STAGE_LABEL,
};

const FILED_LABEL = "Filed";

// ─── Props ─────────────────────────────────────────────────────────────────

type TrackerProps = {
  status: ReturnStatus;
  audience: TrackerAudience;
};

// ─── Component ─────────────────────────────────────────────────────────────

/**
 * A horizontal stepper mirroring the three `Stage` values 1:1 plus a dimmed
 * always-upcoming "Filed" finish line. Same positions for both audiences; labels
 * adapt (Client: "Getting started" / Preparer: "Intake"). Hand-built from design
 * tokens — there's no shadcn stepper primitive (ADR-0002).
 */
export function Tracker({ status, audience }: TrackerProps) {
  const labels = STAGE_LABELS[audience];

  return (
    <nav aria-label={`Return progress: ${labels[status.stage]}`}>
      <ol
        className={cn(
          "flex items-start",
          // Each step gets equal space so the stepper fills the container.
          "[&>li]:flex-1",
        )}
      >
        {status.steps.map((step) => (
          <TrackerStep
            key={step.key}
            step={step}
            label={step.key === "filed" ? FILED_LABEL : labels[step.key]}
          />
        ))}
      </ol>
    </nav>
  );
}

// ─── Single step ───────────────────────────────────────────────────────────

function TrackerStep({ step, label }: { step: Step; label: string }) {
  // Filed is always dimmed and never shows a check.
  const isFiled = step.key === "filed";

  return (
    <li
      className={cn(
        "relative flex flex-col items-center gap-1.5 pt-1",
        // Connector line behind each step (except the first).
        "before:absolute before:top-3.25 before:right-1/2",
        "before:h-px before:w-full",
        // The first step has nothing to its left — hide its connector, not the last's.
        "first:before:hidden",
        // Color the connector to match the completed/upcoming state.
        step.completed ? "before:bg-primary" : "before:bg-border",
      )}
    >
      {/* Circle: checkmark for completed, solid for current, hollow for upcoming. */}
      <span
        aria-hidden="true"
        className={cn(
          "relative z-10 flex size-4.5 shrink-0 items-center justify-center rounded-full border-2 text-[10px]",
          step.completed && !isFiled
            ? "border-primary bg-primary text-primary-foreground"
            : step.current
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/30 bg-background text-transparent",
        )}
      >
        {step.completed && !isFiled ? (
          <Check className="size-2.5" strokeWidth={3} />
        ) : step.current ? (
          // Small filled dot for the current step.
          <span className="size-1.5 rounded-full bg-primary-foreground" />
        ) : null}
      </span>

      {/* Label */}
      <span
        className={cn(
          "text-center text-xs font-medium leading-tight",
          step.completed && !isFiled
            ? "text-foreground"
            : step.current
              ? "text-foreground"
              : isFiled
                ? "text-muted-foreground/50"
                : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </li>
  );
}

// ─── Blocking callout ──────────────────────────────────────────────────────

type BlockingCalloutProps = {
  /** Human-readable message describing who's blocking and why. */
  message: string;
  /** Optional list of blocking items to show. */
  items?: string[];
};

/**
 * An amber callout that sits beside (or below) the tracker when a Return is
 * blocked. Uses the `--warning` design token — amber is a *wait*, not an error
 * (red is reserved for overdue deadlines). Never drawn as a stepper step.
 */
export function BlockingCallout({ message, items }: BlockingCalloutProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col gap-1.5 rounded-md border border-warning/30 bg-warning/10 px-4 py-3",
      )}
    >
      <p className="flex items-start gap-2 text-sm font-medium text-warning">
        <Flag aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        {message}
      </p>
      {items && items.length > 0 && (
        <ul className="ml-5.5 flex list-disc flex-col gap-0.5 text-sm text-warning/80">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
