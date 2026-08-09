import type { FieldSource } from "@/features/return-review/model/returns";
import {
  getSourceDocument,
  sourceDocumentTitle,
} from "@/features/return-review/model/source-documents";
import { cn } from "@/lib/utils";

type DocumentPaneProps = {
  /** The contribution being scrutinized — its document/page shows with the region highlighted. */
  source: FieldSource;
};

/**
 * A facsimile of one Source Document page with the extracted region highlighted
 * (challenge 01). Docks beside the Provenance card so the Preparer sees the
 * original evidence next to what was pulled from it, without leaving the card.
 */
export function DocumentPane({ source }: DocumentPaneProps) {
  const doc = getSourceDocument(source.documentId);
  const page = doc?.pages.find((p) => p.page === source.page);
  const title = sourceDocumentTitle(source.documentId);
  const totalPages = doc?.pages.length ?? 1;

  return (
    <section
      aria-label={`${title}, page ${source.page}`}
      className="flex flex-col bg-background p-5 animate-in fade-in-0 slide-in-from-right-4 [animation-duration:300ms]"
    >
      {/* pr-9 keeps "Page x of n" clear of the dialog's absolute close button. */}
      <header className="mb-3 flex items-center justify-between gap-4 pr-9">
        <span className="truncate font-mono text-xs uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          Page {source.page} of {totalPages}
        </span>
      </header>

      <div className="rounded-md border border-border bg-card p-4 font-mono text-sm">
        {(page?.lines ?? []).map((line) => {
          const isActive = line.region === source.region;
          return (
            <div
              key={line.region}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "flex items-center justify-between gap-4 rounded px-2 py-1.5",
                isActive && "bg-brand/15 ring-1 ring-brand",
              )}
            >
              <span
                className={cn(
                  isActive ? "font-medium" : "text-muted-foreground",
                )}
              >
                {line.label}
                {isActive && (
                  <span className="sr-only"> (extracted value)</span>
                )}
              </span>
              <span className="tabular-nums">{line.amount}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
