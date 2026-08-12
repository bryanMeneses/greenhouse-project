import * as React from "react";
import { FileText, Check, Pencil, Flag, Sparkles } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDialogReturnFocus } from "@/hooks/use-dialog-return-focus";
import { cn, formatCurrency } from "@/lib/utils";
import {
  currentValue,
  type Field,
  type FieldSource,
} from "@/features/returns/shared/returns";
import {
  deriveField,
  formatCalculation,
} from "@/features/returns/shared/provenance";
import { sourceDocumentTitle, sourceLineLabel } from "@/mocks/documents";
import { DocumentPane } from "@/features/returns/review/components/document-pane";
import { ConfidenceBand } from "@/features/returns/review/components/confidence-band";
import { FieldStateBadge } from "@/features/returns/review/components/field-state-badge";
import { CorrectionNote } from "@/features/returns/review/components/correction-note";

type ProvenanceCardProps = {
  field: Field;
  onClose: () => void;
  /** Accept the AI value as-is (→ verified). */
  onAccept?: (fieldId: string) => void;
  /** Replace the AI value with the Preparer's, preserving the original. */
  onEdit?: (fieldId: string, value: number) => void;
  /** Flag the Field for another look (→ needs approval). */
  onFlag?: (fieldId: string) => void;
};

/** Whether two contributions refer to the same document region. */
function sameSource(a: FieldSource, b: FieldSource): boolean {
  return a.documentId === b.documentId && a.region === b.region;
}

/** Parse a Preparer's typed amount ("$4,250" / "4250") to whole dollars, or null. */
function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? Math.round(value) : null;
}

/**
 * The Provenance card (challenges 01 + 10): where a Field's number came from and
 * how honest the AI is being about it. Shows the Confidence band (exact % on
 * hover), the AI's reasoning in plain language, and each Source contribution with
 * the calculation that combined them. It's also the correction surface — Accept,
 * Edit, or Flag — and an edit keeps the AI's original value visible beside the new
 * one. "View in document" docks the Source Document beside the card, region
 * highlighted, so the card never disappears.
 */
export function ProvenanceCard({
  field,
  onClose,
  onAccept,
  onEdit,
  onFlag,
}: ProvenanceCardProps) {
  const derivation = deriveField(field);
  const isDerived = derivation.operation !== "identity";
  const documentCount = new Set(
    derivation.contributions.map((c) => c.documentId),
  ).size;

  const value = currentValue(field);
  const isCorrected = field.correction !== undefined;

  const [activeSource, setActiveSource] = React.useState<FieldSource | null>(
    null,
  );
  const isDocumentOpen = activeSource !== null;

  // Opened imperatively — from a Field row or the Review Queue — so there is no
  // <DialogTrigger> for Radix to return focus to; the shared hook restores it.
  const returnFocus = useDialogReturnFocus();

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        {...returnFocus}
        className={cn(
          // overflow-y-auto alone makes the browser compute overflow-x as `auto`
          // too (CSS spec: a non-visible axis forces the other to auto), so any
          // sub-pixel horizontal overflow shows a phantom scrollbar. Pin x hidden.
          "max-h-[90vh] gap-0 overflow-y-auto overflow-x-hidden border-border bg-card p-0 text-card-foreground",
          // The panel grows only where the document actually docks beside the
          // card (md+); below that it stacks, so the narrow width still fits.
          "transition-[max-width] ease-out duration-300 sm:max-w-md",
          isDocumentOpen && "md:max-w-3xl",
        )}
      >
        <div className="flex min-w-0 flex-col md:flex-row md:items-stretch">
          <div
            className={cn(
              "flex min-w-0 flex-col",
              // Pinned width only while the document is docked, so the growth is
              // the document appearing — not the card reflowing. Full width otherwise.
              isDocumentOpen ? "md:w-96 md:shrink-0" : "w-full",
            )}
          >
            <div className="border-b border-border p-5 pr-12">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Provenance
              </p>
              <DialogTitle className="mt-1 text-lg font-semibold tracking-tight">
                {field.label}
              </DialogTitle>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums">
                  {formatCurrency(value)}
                </span>
                {isDerived && !isCorrected && (
                  <span className="text-sm text-muted-foreground tabular-nums">
                    = {formatCalculation(derivation)}
                  </span>
                )}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {field.confidence !== undefined && (
                  <ConfidenceBand
                    confidence={field.confidence}
                    percentDisplay="inline"
                  />
                )}
                <FieldStateBadge state={field.state} />
              </div>

              <CorrectionNote
                field={field}
                className="mt-3 rounded-md bg-muted px-3 py-2"
              />

              {field.rationale && (
                <p className="mt-3 flex gap-1.5 text-xs text-muted-foreground">
                  <Sparkles
                    aria-hidden="true"
                    className="mt-0.5 size-3.5 shrink-0 text-brand"
                  />
                  <span>{field.rationale}</span>
                </p>
              )}
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

            <CorrectionActions
              field={field}
              currentAmount={value}
              onAccept={onAccept}
              onEdit={onEdit}
              onFlag={onFlag}
            />
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
      </DialogContent>
    </Dialog>
  );
}

/**
 * The Accept / Edit / Flag controls at the foot of the card — the Preparer's
 * verdict on the AI's Field. Editing swaps the row for an inline amount input;
 * saving hands the new value up and the AI's original is preserved by the model.
 * Rendered only when at least one handler is wired.
 */
function CorrectionActions({
  field,
  currentAmount,
  onAccept,
  onEdit,
  onFlag,
}: {
  field: Field;
  currentAmount: number;
  onAccept?: (fieldId: string) => void;
  onEdit?: (fieldId: string, value: number) => void;
  onFlag?: (fieldId: string) => void;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(String(currentAmount));
  const inputId = React.useId();

  if (!onAccept && !onEdit && !onFlag) return null;

  if (isEditing && onEdit) {
    const parsed = parseAmount(draft);
    const canSave = parsed !== null;

    return (
      <form
        className="flex flex-col gap-2 border-t border-border p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (parsed === null) return;
          onEdit(field.id, parsed);
          setIsEditing(false);
        }}
      >
        <label htmlFor={inputId} className="text-xs font-medium">
          Correct the value
        </label>
        <div className="flex items-center gap-2">
          <input
            id={inputId}
            type="text"
            inputMode="numeric"
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className={cn(
              "w-36 rounded-md border border-input bg-card px-3 py-1.5 text-right text-sm tabular-nums shadow-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          />
          <Button
            type="submit"
            disabled={!canSave}
            className="focus-visible:ring-offset-card"
          >
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setDraft(String(currentAmount));
              setIsEditing(false);
            }}
            className="text-muted-foreground focus-visible:ring-offset-card"
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 border-t border-border p-5">
      {onAccept && (
        <ActionButton onClick={() => onAccept(field.id)} icon={Check}>
          Accept
        </ActionButton>
      )}
      {onEdit && (
        <ActionButton
          onClick={() => {
            setDraft(String(currentAmount));
            setIsEditing(true);
          }}
          icon={Pencil}
          variant="outline"
        >
          Edit
        </ActionButton>
      )}
      {onFlag && (
        <ActionButton
          onClick={() => onFlag(field.id)}
          icon={Flag}
          variant="outline"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          Flag
        </ActionButton>
      )}
    </div>
  );
}

function ActionButton({
  onClick,
  icon: Icon,
  variant,
  className,
  children,
}: {
  onClick: () => void;
  icon: typeof Check;
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={variant}
      onClick={onClick}
      className={cn("focus-visible:ring-offset-card", className)}
    >
      <Icon aria-hidden="true" />
      {children}
    </Button>
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
