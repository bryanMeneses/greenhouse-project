import * as React from "react";
import { Lock } from "lucide-react";

import {
  FIELD_STATE_CONFIG,
  type FieldAffordance,
} from "@/features/returns/shared/field-state";
import { currentValue, type Field } from "@/features/returns/shared/returns";
import { fieldSourceLabel } from "@/features/returns/shared/provenance";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FieldStateBadge } from "@/features/returns/review/components/field-state-badge";
import { ConfidenceBand } from "@/features/returns/review/components/confidence-band";
import { CorrectionNote } from "@/features/returns/review/components/correction-note";

type FieldRowProps = {
  field: Field;
  /** Called when an inspectable Field's value is activated (→ provenance, challenge 01). */
  onInspect?: (fieldId: string) => void;
  /** Commit a directly-editable Field's new value (challenge 08). */
  onEdit?: (fieldId: string, value: number) => void;
};

/**
 * One Field on a Return: its label, its value rendered with the affordance its
 * Field State allows, and the state badge. Locked Fields explain why they're read-only.
 */
export function FieldRow({ field, onInspect, onEdit }: FieldRowProps) {
  const labelId = React.useId();
  const reasonId = React.useId();
  const { affordance } = FIELD_STATE_CONFIG[field.state];
  const formatted = formatCurrency(currentValue(field));
  const isLocked = field.state === "locked";

  return (
    <div className="flex flex-col gap-1 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <span id={labelId} className="text-sm font-medium">
            {field.label}
          </span>
          <span className="block text-xs text-muted-foreground">
            {fieldSourceLabel(field)}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {field.confidence !== undefined && (
            <ConfidenceBand confidence={field.confidence} />
          )}
          <FieldValue
            field={field}
            formatted={formatted}
            affordance={affordance}
            labelId={labelId}
            reasonId={isLocked ? reasonId : undefined}
            onInspect={onInspect}
            onEdit={onEdit}
          />
          <FieldStateBadge state={field.state} />
        </div>
      </div>

      <CorrectionNote field={field} />

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
  onEdit?: (fieldId: string, value: number) => void;
};

function FieldValue({
  field,
  formatted,
  affordance,
  labelId,
  reasonId,
  onInspect,
  onEdit,
}: FieldValueProps) {
  if (affordance === "edit") {
    // Commit the typed value on blur or Enter: parse it back to a number, and if it
    // reads as a valid, changed amount, save it (challenge 08 — an editable Field
    // that actually persists). Anything unparseable snaps back to the last value, so
    // the input can never leave a bad number on screen.
    const commit = (input: HTMLInputElement) => {
      const parsed = Number(input.value.replace(/[^0-9.-]/g, ""));
      if (!Number.isFinite(parsed)) {
        input.value = formatCurrency(currentValue(field));
        return;
      }
      if (parsed !== currentValue(field)) onEdit?.(field.id, parsed);
      input.value = formatCurrency(parsed);
    };
    return (
      <input
        type="text"
        inputMode="numeric"
        defaultValue={formatted}
        aria-labelledby={labelId}
        onBlur={(event) => commit(event.currentTarget)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        className={cn(
          "w-32 rounded-md border border-input bg-card px-3 py-1.5 text-right text-sm tabular-nums shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      />
    );
  }

  if (affordance === "inspect") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onInspect?.(field.id)}
        aria-label={`Review ${field.label}, ${formatted}`}
        className="text-sm font-medium tabular-nums"
      >
        {formatted}
      </Button>
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
