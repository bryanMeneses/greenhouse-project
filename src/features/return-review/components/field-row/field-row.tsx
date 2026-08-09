import * as React from "react";
import { Lock } from "lucide-react";

import {
  FIELD_STATE_CONFIG,
  type FieldAffordance,
} from "@/features/return-review/model/field-state";
import type { Field } from "@/features/return-review/model/returns";
import { fieldSourceLabel } from "@/features/return-review/model/provenance";
import { cn, formatCurrency } from "@/lib/utils";
import { FieldStateBadge } from "@/features/return-review/components/field-state-badge/field-state-badge";

type FieldRowProps = {
  field: Field;
  /** Called when an inspectable Field's value is activated (→ provenance, challenge 01). */
  onInspect?: (fieldId: string) => void;
};

/**
 * One Field on a Return: its label, its value rendered with the affordance its
 * Field State allows, and the state badge. Locked Fields explain why they're read-only.
 */
export function FieldRow({ field, onInspect }: FieldRowProps) {
  const labelId = React.useId();
  const reasonId = React.useId();
  const { affordance } = FIELD_STATE_CONFIG[field.state];
  const formatted = formatCurrency(field.value);
  const isLocked = field.state === "locked";

  return (
    <div className="flex flex-col gap-1 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <span id={labelId} className="text-sm font-medium">
            {field.label}
          </span>
          <span className="block text-xs text-muted-foreground">
            {fieldSourceLabel(field)}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <FieldValue
            field={field}
            formatted={formatted}
            affordance={affordance}
            labelId={labelId}
            reasonId={isLocked ? reasonId : undefined}
            onInspect={onInspect}
          />
          <FieldStateBadge state={field.state} />
        </div>
      </div>

      {isLocked && field.lockedReason && (
        <p
          id={reasonId}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Lock aria-hidden="true" className="size-3 shrink-0" />
          {field.lockedReason}
        </p>
      )}
    </div>
  );
}

type FieldValueProps = {
  field: Field;
  formatted: string;
  affordance: FieldAffordance;
  labelId: string;
  reasonId?: string;
  onInspect?: (fieldId: string) => void;
};

function FieldValue({
  field,
  formatted,
  affordance,
  labelId,
  reasonId,
  onInspect,
}: FieldValueProps) {
  if (affordance === "edit") {
    return (
      <input
        type="text"
        defaultValue={formatted}
        aria-labelledby={labelId}
        className={cn(
          "w-32 rounded-md border border-input bg-card px-3 py-1.5 text-right text-sm tabular-nums shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      />
    );
  }

  if (affordance === "inspect") {
    return (
      <button
        type="button"
        onClick={() => onInspect?.(field.id)}
        aria-label={`Review ${field.label}, ${formatted}`}
        className={cn(
          "rounded-md px-3 py-1.5 text-right text-sm font-medium tabular-nums transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer",
        )}
      >
        {formatted}
      </button>
    );
  }

  // Locked: read-only, described by its reason.
  return (
    <span
      aria-describedby={reasonId}
      className="px-3 py-1.5 text-right text-sm tabular-nums text-muted-foreground"
    >
      {formatted}
    </span>
  );
}
