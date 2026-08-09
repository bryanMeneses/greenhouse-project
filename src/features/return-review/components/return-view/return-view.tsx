import * as React from "react";

import type { Return, Stage } from "@/features/returns/model/returns";
import { FieldRow } from "@/features/return-review/components/field-row/field-row";

const STAGE_LABEL: Record<Stage, string> = {
  intake: "Intake",
  "in-review": "In review",
  "ready-to-file": "Ready to file",
};

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
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        {taxReturn.client} · {taxReturn.taxYear} ·{" "}
        {STAGE_LABEL[taxReturn.stage]}
      </p>

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
