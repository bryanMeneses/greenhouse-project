import * as React from "react";
import { ListChecks } from "lucide-react";

import { currentValue, type Field } from "@/features/returns/shared/returns";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfidenceBand } from "@/features/returns/review/components/confidence-band";
import { FieldStateBadge } from "@/features/returns/review/components/field-state-badge";

type ReviewQueuePanelProps = {
  /** The low-Confidence Fields to work through (from `reviewQueue`). */
  fields: Field[];
  /** Open a Field's Provenance card to accept, edit, or flag it. */
  onReview: (fieldId: string) => void;
};

/** A queued Field counts as reviewed once the Preparer has verified it. */
function isReviewed(field: Field): boolean {
  return field.state === "verified";
}

/**
 * The Review Queue (challenge 10): the low-Confidence Fields gathered in one
 * place so the Preparer can work down what the AI was least sure of, Field by
 * Field, and nothing slips through. Each row opens the Field's Provenance card —
 * the correction surface — and shows a live count of what's been verified.
 */
export function ReviewQueuePanel({ fields, onReview }: ReviewQueuePanelProps) {
  const headingId = React.useId();
  if (fields.length === 0) return null;

  const reviewedCount = fields.filter(isReviewed).length;
  const allReviewed = reviewedCount === fields.length;

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-lg border border-border bg-card shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <h2
          id={headingId}
          className="flex items-center gap-2 text-base font-semibold tracking-tight"
        >
          <ListChecks aria-hidden="true" className="size-4 text-primary" />
          Review Queue
        </h2>
        <p
          className={cn(
            "text-xs font-medium",
            allReviewed ? "text-primary" : "text-muted-foreground",
          )}
        >
          {reviewedCount} of {fields.length} reviewed
        </p>
      </div>

      <p className="px-5 pt-3 text-xs text-muted-foreground">
        The Fields the AI was least sure of. Work through each one.
      </p>

      <ul className="divide-y divide-border px-5">
        {fields.map((field) => (
          <li
            key={field.id}
            className="flex items-center justify-between gap-4 py-3"
          >
            <div className="min-w-0">
              <span className="text-sm font-medium">{field.label}</span>
              <span className="block text-xs text-muted-foreground tabular-nums">
                {formatCurrency(currentValue(field))}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {field.confidence !== undefined && (
                <ConfidenceBand confidence={field.confidence} />
              )}
              {isReviewed(field) ? (
                <FieldStateBadge state={field.state} />
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onReview(field.id)}
                  aria-label={`Review ${field.label}`}
                  className="focus-visible:ring-offset-card"
                >
                  Review
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p
        aria-live="polite"
        className="px-5 pb-4 pt-1 text-xs font-medium text-primary empty:pb-0"
      >
        {allReviewed
          ? "All caught up — every low-Confidence Field is reviewed."
          : null}
      </p>
    </section>
  );
}
