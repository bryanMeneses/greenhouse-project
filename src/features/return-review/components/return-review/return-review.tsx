import * as React from "react";

import type { Return } from "@/features/return-review/model/returns";
import { ReturnView } from "@/features/return-review/components/return-view/return-view";
import { ProvenanceCard } from "@/features/return-review/components/provenance-card/provenance-card";

type ReturnReviewProps = {
  return: Return;
};

/**
 * The Return review surface: the Return plus its source-traceability flow
 * (challenge 01). Clicking a Field opens its Provenance card, which docks the
 * Source Document beside itself on demand. Closing returns focus — via the
 * Dialog — to the Field that was clicked, so tracing a number never costs the place.
 */
export function ReturnReview({ return: taxReturn }: ReturnReviewProps) {
  const [inspectedFieldId, setInspectedFieldId] = React.useState<string | null>(
    null,
  );

  const field =
    inspectedFieldId === null
      ? undefined
      : taxReturn.sections
          .flatMap((section) => section.fields)
          .find((f) => f.id === inspectedFieldId);

  return (
    <>
      <ReturnView return={taxReturn} onInspectField={setInspectedFieldId} />

      {field && (
        <ProvenanceCard
          field={field}
          onClose={() => setInspectedFieldId(null)}
        />
      )}
    </>
  );
}
