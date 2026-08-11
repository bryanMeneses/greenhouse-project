import * as React from "react";

import type { Return } from "@/features/returns/shared/returns";
import { FieldRow } from "@/features/returns/review/components/field-row";

type ReturnViewProps = {
  return: Return;
  /** Forwarded to each Field for inspecting its value (→ provenance, challenge 01). */
  onInspectField?: (fieldId: string) => void;
};

/**
 * A Return laid out as sections of Fields, each Field marked with its Field State.
 * The single reading surface for challenge 08.
 */
export function ReturnView({
  return: taxReturn,
  onInspectField,
}: ReturnViewProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      {taxReturn.sections.map((section) => (
        <ReturnSection
          key={section.id}
          section={section}
          onInspectField={onInspectField}
        />
      ))}
    </div>
  );
}

function ReturnSection({
  section,
  onInspectField,
}: {
  section: Return["sections"][number];
  onInspectField?: (fieldId: string) => void;
}) {
  const headingId = React.useId();

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-lg border border-border bg-card shadow-sm"
    >
      <h2
        id={headingId}
        className="border-b border-border px-5 py-3 text-base font-semibold tracking-tight"
      >
        {section.title}
      </h2>
      <div className="divide-y divide-border px-5">
        {section.fields.map((field) => (
          <FieldRow key={field.id} field={field} onInspect={onInspectField} />
        ))}
      </div>
    </section>
  );
}
