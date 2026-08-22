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
  | { type: "flag"; fieldId: string }
  | { type: "set-value"; fieldId: string; value: number };

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
    // A directly-editable Field (challenge 08) the Preparer types into — its value
    // is their own, not an AI suggestion, so we update `value` in place and leave it
    // editable, rather than recording a `correction` (which would falsely read as
    // "AI said …"). The workspace owns this state, so the edit survives Area switches.
    case "set-value":
      return { ...field, value: action.value };
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
      {/* Overview leads with the decision, not the map (challenge 07 → #24): the
          Review Queue — the low-Confidence Fields the CPA must clear — is the "do
          this now" surface, so it comes first and full width. */}
      <ReviewQueuePanel
        fields={queue}
        onReview={(fieldId) =>
          setFocus({ kind: "field", id: fieldId }, "overview")
        }
      />

      {/* Then the return's own figures, section by section. */}
      <ReturnView
        return={taxReturn}
        onInspectField={(fieldId) =>
          setFocus({ kind: "field", id: fieldId }, "overview")
        }
        onEditField={(fieldId, value) =>
          onAction({ type: "set-value", fieldId, value })
        }
      />

      {/* The Return map sits below the queue: it's the orientation-and-scale tool
          (challenge 09) — search, filter, and hierarchy over the hundreds of work
          items — there when you need to explore, not the lead action. */}
      <ComplexityNavigator
        taxReturn={taxReturn}
        viewerFamily="firm"
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
