import * as React from "react";

import type { Field, Return } from "@/features/returns/shared/returns";
import { reviewQueue } from "@/features/returns/shared/review-queue";
import { PreparerStatusBand } from "@/features/returns/shared/preparer-status-band";
import { ReturnView } from "@/features/returns/review/components/return-view";
import { ProvenanceCard } from "@/features/returns/review/components/provenance-card";
import { ReviewQueuePanel } from "@/features/returns/review/components/review-queue-panel";

type ReturnReviewProps = {
  return: Return;
};

/**
 * A Preparer's verdict on an AI Field (challenge 10). `accept` takes the value
 * as-is; `edit` records a correction while the model keeps the AI's original;
 * `flag` sends it back for another look.
 */
type FieldAction =
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
function returnReducer(state: Return, action: FieldAction): Return {
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
 * The Return review surface (challenges 01 + 08 + 10). Fields carry their own
 * state here so the Preparer's corrections stick: clicking a Field opens its
 * Provenance card — the trust and correction surface — and the Review Queue
 * gathers the low-Confidence Fields to work through. The card and queue read from
 * the same live state, so a Field verified in the card updates everywhere at once.
 */
export function ReturnReview({ return: initialReturn }: ReturnReviewProps) {
  const [taxReturn, dispatch] = React.useReducer(returnReducer, initialReturn);
  const [inspectedFieldId, setInspectedFieldId] = React.useState<string | null>(
    null,
  );

  const field =
    inspectedFieldId === null
      ? undefined
      : taxReturn.sections
          .flatMap((section) => section.fields)
          .find((f) => f.id === inspectedFieldId);

  const queue = reviewQueue(taxReturn);

  return (
    <div className="flex w-full flex-col gap-6">
      <PreparerStatusBand taxReturn={taxReturn} />

      <ReviewQueuePanel fields={queue} onReview={setInspectedFieldId} />

      <ReturnView return={taxReturn} onInspectField={setInspectedFieldId} />

      {field && (
        <ProvenanceCard
          field={field}
          onClose={() => setInspectedFieldId(null)}
          onAccept={(id) => dispatch({ type: "accept", fieldId: id })}
          onEdit={(id, value) => dispatch({ type: "edit", fieldId: id, value })}
          onFlag={(id) => dispatch({ type: "flag", fieldId: id })}
        />
      )}
    </div>
  );
}
