import type { Field, Return } from "@/features/returns/shared/returns";
import { reviewQueue } from "@/features/returns/shared/review-queue";
import { ReturnView } from "@/features/returns/review/components/return-view";
import { ProvenanceCard } from "@/features/returns/review/components/provenance-card";
import { ReviewQueuePanel } from "@/features/returns/review/components/review-queue-panel";
import { ComplexityNavigator } from "@/features/returns/shared/complexity-navigator";
import { useReturnView } from "@/hooks/use-return-view";
import { FIRM_AREAS } from "@/features/returns/shared/areas";
import { getThreadsForReturn } from "@/mocks/collaboration";
import { connectionsFor } from "@/features/returns/shared/connections";

type ReturnReviewProps = {
  return: Return;
  /** Review edits are owned by the workspace so they survive an Area switch (#5). */
  onAction: (action: FieldAction) => void;
};

/**
 * A Preparer's verdict on an AI Field (challenge 10). `accept` takes the value
 * as-is; `edit` records a correction while the model keeps the AI's original;
 * `flag` sends it back for another look.
 */
export type FieldAction =
  | { type: "accept"; fieldId: string }
  | { type: "edit"; fieldId: string; value: number }
  | { type: "flag"; fieldId: string };

function applyAction(field: Field, action: FieldAction): Field {
  switch (action.type) {
    case "accept":
      return { ...field, state: "verified" };
    case "edit":
      return {
        ...field,
        state: "verified",
        correction: { value: action.value },
      };
    case "flag":
      return { ...field, state: "needs-approval" };
  }
}

/** Apply a Preparer's action to the one Field it targets, leaving the rest intact. */
// eslint-disable-next-line react-refresh/only-export-components
export function returnReducer(state: Return, action: FieldAction): Return {
  return {
    ...state,
    sections: state.sections.map((section) => ({
      ...section,
      fields: section.fields.map((field) =>
        field.id === action.fieldId ? applyAction(field, action) : field,
      ),
    })),
  };
}

/**
 * The Overview tab's body (challenges 01 + 08 + 10) — the review work itself,
 * under the persistent status band that now lives at the page level. Fields carry
 * their own state here so the Preparer's corrections stick: clicking a Field opens
 * its Provenance card — the trust and correction surface — and the Review Queue
 * gathers the low-Confidence Fields to work through. The card and queue read from
 * the same live state, so a Field verified in the card updates everywhere at once.
 * Income and the Review Queue sit side by side on wide screens, stacking on narrow.
 */
export function ReturnReview({
  return: taxReturn,
  onAction,
}: ReturnReviewProps) {
  const { focus, setFocus } = useReturnView({
    areas: FIRM_AREAS.map((area) => area.id),
  });
  const field =
    focus === null || focus.kind !== "field"
      ? undefined
      : taxReturn.sections
          .flatMap((section) => section.fields)
          .find((candidate) => candidate.id === focus.id);

  const queue = reviewQueue(taxReturn);
  const fieldConnections = field
    ? connectionsFor(
        { kind: "field", id: field.id },
        taxReturn,
        getThreadsForReturn(taxReturn.id),
      )
    : [];

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Challenge 09 leads with orientation and scale: the map keeps hundreds of
          work items searchable while the existing queue remains the action surface. */}
      <ComplexityNavigator
        taxReturn={taxReturn}
        viewerFamily="firm"
        onInspectField={(fieldId) =>
          setFocus({ kind: "field", id: fieldId }, "overview")
        }
      />

      {/* The Review Queue stays full width and emphasized — the CPA's primary
          job on the return. Income & Deductions share the space below it. */}
      <ReviewQueuePanel
        fields={queue}
        onReview={(fieldId) =>
          setFocus({ kind: "field", id: fieldId }, "overview")
        }
      />

      <ReturnView
        return={taxReturn}
        onInspectField={(fieldId) =>
          setFocus({ kind: "field", id: fieldId }, "overview")
        }
      />

      {field && (
        <ProvenanceCard
          field={field}
          // Opening the card is a deep link (a push, so Back closes it); closing
          // must replace that entry instead of pushing, or Back would replay the
          // open→close toggle forever.
          onClose={() => setFocus(null, undefined, { replace: true })}
          onAccept={(id) => onAction({ type: "accept", fieldId: id })}
          onEdit={(id, value) => onAction({ type: "edit", fieldId: id, value })}
          onFlag={(id) => onAction({ type: "flag", fieldId: id })}
          connections={fieldConnections}
        />
      )}
    </div>
  );
}
