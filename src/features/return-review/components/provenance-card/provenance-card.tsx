import * as React from "react";
import { FileText } from "lucide-react";

import { Dialog, DialogCloseButton } from "@/components/ui/dialog";
import { cn, formatCurrency } from "@/lib/utils";
import type {
  Field,
  FieldSource,
} from "@/features/return-review/model/returns";
import {
  deriveField,
  formatCalculation,
} from "@/features/return-review/model/provenance";
import {
  sourceDocumentTitle,
  sourceLineLabel,
} from "@/features/return-review/model/source-documents";
import { DocumentPane } from "@/features/return-review/components/document-pane/document-pane";

type ProvenanceCardProps = {
  field: Field;
  onClose: () => void;
};

/** Whether two contributions refer to the same document region. */
function sameSource(a: FieldSource, b: FieldSource): boolean {
  return a.documentId === b.documentId && a.region === b.region;
}

/**
 * The Provenance card (challenge 01): where a Field's number came from, shown
 * without leaving the Return. Lists each Source contribution — document,
 * page/region, snippet — and the calculation that combined them. "View in
 * document" grows the dialog to dock the Source Document beside the card, region
 * highlighted, so the card never disappears; picking another contribution just
 * swaps which document shows.
 */
export function ProvenanceCard({ field, onClose }: ProvenanceCardProps) {
  const titleId = React.useId();
  const derivation = deriveField(field);
  const isDerived = derivation.operation !== "identity";
  const documentCount = new Set(
    derivation.contributions.map((c) => c.documentId),
  ).size;

  const [activeSource, setActiveSource] = React.useState<FieldSource | null>(
    null,
  );
  const isDocumentOpen = activeSource !== null;

  return (
    <Dialog
      labelledBy={titleId}
      onClose={onClose}
      className={cn(
        "transition-[max-width] ease-out [transition-duration:300ms]",
        isDocumentOpen ? "max-w-3xl" : "max-w-md",
      )}
    >
      <DialogCloseButton onClose={onClose} label="Close provenance" />

      <div className="flex flex-col md:flex-row md:items-stretch">
        <div
          className={cn(
            "flex flex-col",
            // Pinned width only while the document is docked, so the growth is
            // the document appearing — not the card reflowing. Full width otherwise.
            isDocumentOpen ? "md:w-96 md:shrink-0" : "w-full",
          )}
        >
          <div className="border-b border-border p-5 pr-12">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Provenance
            </p>
            <h2
              id={titleId}
              className="mt-1 text-lg font-semibold tracking-tight"
            >
              {field.label}
            </h2>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums">
                {formatCurrency(field.value)}
              </span>
              {isDerived && (
                <span className="text-sm text-muted-foreground tabular-nums">
                  = {formatCalculation(derivation)}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-col gap-3 p-5">
            <p className="text-xs font-medium text-muted-foreground">
              {isDerived
                ? `Combined from ${documentCount} Source Document${documentCount > 1 ? "s" : ""}`
                : "Traced to 1 Source Document"}
            </p>

            {derivation.contributions.map((source, index) => (
              <ContributionRow
                key={`${source.documentId}-${source.region}-${index}`}
                source={source}
                isViewing={
                  activeSource !== null && sameSource(activeSource, source)
                }
                onToggle={() =>
                  setActiveSource((current) =>
                    current && sameSource(current, source) ? null : source,
                  )
                }
              />
            ))}
          </div>
        </div>

        {activeSource && (
          <div className="min-w-0 flex-1 border-t border-border md:border-l md:border-t-0">
            <DocumentPane
              key={`${activeSource.documentId}-${activeSource.region}`}
              source={activeSource}
            />
          </div>
        )}
      </div>
    </Dialog>
  );
}

function ContributionRow({
  source,
  isViewing,
  onToggle,
}: {
  source: FieldSource;
  isViewing: boolean;
  onToggle: () => void;
}) {
  const title = sourceDocumentTitle(source.documentId);
  const regionLabel = sourceLineLabel(
    source.documentId,
    source.page,
    source.region,
  );

  return (
    <div
      className={cn(
        "rounded-md border bg-background p-3 transition-colors",
        isViewing ? "border-brand ring-1 ring-brand" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <FileText
              aria-hidden="true"
              className="size-4 shrink-0 text-primary"
            />
            {title}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Page {source.page} · {regionLabel}
          </p>
        </div>
        <span className="shrink-0 text-sm font-medium tabular-nums">
          {formatCurrency(source.amount)}
        </span>
      </div>

      <p className="mt-2 truncate rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
        {source.snippet}
      </p>

      <button
        type="button"
        onClick={onToggle}
        aria-pressed={isViewing}
        className={cn(
          "mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors",
          "hover:underline",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer rounded",
        )}
      >
        {isViewing ? "Hide document" : "View in document"}
      </button>
    </div>
  );
}
