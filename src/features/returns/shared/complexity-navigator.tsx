import * as React from "react";
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  FileText,
  Info,
  Layers3,
  ListFilter,
  MessageCircle,
  Search,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DocumentPane } from "@/features/returns/review/components/document-pane";
import { getComplexityItems } from "@/mocks/complexity";
import { getThreadsForReturn } from "@/mocks/collaboration";
import { threadsVisibleTo } from "./collaboration";
import { areasFor } from "./areas";
import { connectionsFor } from "./connections";
import { ConnectionLink } from "./connection-link";
import { useReturnView, type ReturnFocus } from "@/hooks/use-return-view";
import {
  ALL_SECTIONS,
  complexityStatusLabel,
  filterComplexityItems,
  summarizeComplexitySections,
  type ComplexityFilter,
  type ComplexityItem,
  type ComplexityItemKind,
  type ComplexityItemStatus,
} from "./complexity";
import type { Return } from "./returns";
import type { RoleFamily } from "@/lib/roles";
import { cn } from "@/lib/utils";

const KIND_CONFIG: Record<
  ComplexityItemKind,
  { label: string; icon: LucideIcon }
> = {
  field: { label: "Field", icon: ListFilter },
  "source-document": { label: "Source Document", icon: FileText },
  "open-item": { label: "Open Item", icon: CircleDot },
  thread: { label: "Thread", icon: MessageCircle },
  calculation: { label: "Calculation", icon: Calculator },
  warning: { label: "Warning", icon: AlertTriangle },
};

const STATUS_CLASS: Record<ComplexityItemStatus, string> = {
  "needs-review": "border-warning/30 bg-warning/10 text-warning",
  waiting: "border-border bg-muted text-muted-foreground",
  verified: "border-primary/20 bg-primary/5 text-primary",
  ready: "border-border bg-background text-muted-foreground",
};

// Rows rendered before the list asks the user to narrow, keeping large returns cheap.
const MAX_VISIBLE_ROWS = 50;

const STATUS_ORDER: ComplexityItemStatus[] = [
  "needs-review",
  "waiting",
  "verified",
  "ready",
];

// Built from the shared status vocabulary so the filter labels can't drift from
// the row labels, and every status stays reachable by the control.
const FILTERS: { value: ComplexityFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...STATUS_ORDER.map((status) => ({
    value: status,
    label: complexityStatusLabel(status),
  })),
];

/**
 * Whether a URL focus points at this item — matched by its real object identity
 * (a kind + id pair), never by guessing across id namespaces, so a field id can't
 * collide with a document or thread id and highlight the wrong row.
 */
function focusMatches(item: ComplexityItem, focus: ReturnFocus): boolean {
  if (item.connectionTarget) {
    return (
      item.connectionTarget.kind === focus.kind &&
      item.connectionTarget.id === focus.id
    );
  }
  return focus.kind === "field" && item.fieldId === focus.id;
}

type ComplexityNavigatorProps = {
  taxReturn: Return;
  viewerFamily: RoleFamily;
  /** Opens the existing Field Provenance workflow for a real Field item. */
  onInspectField?: (fieldId: string) => void;
};

/**
 * The scale layer for a Return (challenge 09). A summary, section hierarchy, and
 * filtered list keep the full work visible without rendering every detail at once;
 * the selected item is the only detail expanded. The same component adapts its
 * vocabulary and dataset for Firm and Client Roles, so the Client gets orientation
 * without inheriting the firm's hundreds of internal work items.
 */
export function ComplexityNavigator({
  taxReturn,
  viewerFamily,
  onInspectField,
}: ComplexityNavigatorProps) {
  const { focus, setFocus } = useReturnView({
    areas: areasFor(viewerFamily).map((area) => area.id),
  });
  // Browsing the map is local state. A synthetic item (calculation, warning,
  // generated volume) has no real object to address, and a Field row must not
  // write a field focus either — a field focus in the URL means "inspect this
  // Field's provenance" (the card), not "browse it in the pane".
  const [localFocusId, setLocalFocusId] = React.useState<string | null>(null);
  const items = React.useMemo(
    () => getComplexityItems(taxReturn, viewerFamily),
    [taxReturn, viewerFamily],
  );
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<ComplexityFilter>("all");
  const [sectionId, setSectionId] = React.useState(ALL_SECTIONS);

  // Everything search + status allow, before the section filter. This is the
  // universe the hierarchy rail describes, so its "All work" total and per-section
  // counts stay in agreement instead of a section row contradicting the total.
  const railItems = React.useMemo(
    () => filterComplexityItems(items, query, filter),
    [items, query, filter],
  );
  const visibleItems = React.useMemo(
    () => filterComplexityItems(items, query, filter, sectionId),
    [items, query, filter, sectionId],
  );
  // Summarize the rail from railItems, ignoring the section filter — otherwise
  // picking a section collapses the rail to that one entry and you can't move
  // between sections without first returning to "All work".
  const sections = React.useMemo(
    () => summarizeComplexitySections(railItems),
    [railItems],
  );
  const selectedItem =
    visibleItems.find((item) => focus !== null && focusMatches(item, focus)) ??
    visibleItems.find(
      (item) => localFocusId !== null && item.id === localFocusId,
    ) ??
    visibleItems[0];

  // Cap the rendered rows for scale, but always keep the selected row on screen so
  // the detail pane never describes an item with no visible, highlighted row.
  const head = visibleItems.slice(0, MAX_VISIBLE_ROWS);
  const renderedItems =
    selectedItem && !head.some((item) => item.id === selectedItem.id)
      ? [selectedItem, ...head.slice(0, MAX_VISIBLE_ROWS - 1)]
      : head;

  // Keep the detail pane useful as filters change, while retaining selection when
  // the selected item remains in the result set (persistent context). If a filter
  // hides it, the first visible result is shown without discarding the selection,
  // so returning to the broader view restores the preparer's place.

  const isClient = viewerFamily === "client";
  const eyebrow = "Browse the work";
  const title = isClient ? "Your return at a glance" : "Return map";
  const subtitle = isClient
    ? "Start with what matters to you. Firm review detail stays behind the scenes."
    : "A high-level map of the work, with source detail one step away.";
  const itemNoun = railItems.length === 1 ? "item" : "items";

  return (
    <section
      aria-labelledby="complexity-navigator-title"
      className="flex w-full flex-col gap-0 overflow-hidden rounded-lg border border-border bg-card shadow-sm"
    >
      <header className="flex flex-col gap-4 border-b border-border bg-card px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Layers3 aria-hidden="true" className="size-4" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {eyebrow}
            </p>
          </div>
          <h2
            id="complexity-navigator-title"
            className="font-serif text-xl font-semibold tracking-tight"
          >
            {title}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <Badge variant="outline" className="tabular-nums">
            {railItems.length} {itemNoun}
          </Badge>
          <Badge variant="secondary">{sections.length} work areas</Badge>
        </div>
      </header>

      <div className="grid min-w-0 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <nav
          aria-label="Return work areas"
          className="flex min-w-0 flex-col gap-2 border-b border-border bg-muted/20 p-3 lg:border-r lg:border-b-0"
        >
          <div className="flex items-center justify-between px-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Hierarchy
            </p>
            <span className="text-[10px] text-muted-foreground">
              {railItems.length}
            </span>
          </div>
          <Button
            type="button"
            aria-pressed={sectionId === ALL_SECTIONS}
            variant={sectionId === ALL_SECTIONS ? "secondary" : "ghost"}
            onClick={() => setSectionId(ALL_SECTIONS)}
            className="h-auto min-h-8 justify-between px-2 text-left text-xs"
          >
            <span>All work</span>
            <span className="tabular-nums text-muted-foreground">
              {railItems.length}
            </span>
          </Button>
          <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
            {sections.map((section) => (
              <Button
                key={section.id}
                type="button"
                aria-pressed={sectionId === section.id}
                variant={sectionId === section.id ? "secondary" : "ghost"}
                // Toggle: clicking the active area again clears back to "All work".
                onClick={() =>
                  setSectionId((current) =>
                    current === section.id ? ALL_SECTIONS : section.id,
                  )
                }
                className="h-auto min-h-8 justify-between gap-2 px-2 text-left text-xs"
              >
                <span className="min-w-0 truncate">{section.title}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {section.count}
                </span>
              </Button>
            ))}
          </div>
        </nav>

        <div className="flex min-w-0 flex-col">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label htmlFor="complexity-search" className="sr-only">
                Search this return
              </label>
              <div className="relative min-w-0 flex-1">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground"
                />
                <Input
                  id="complexity-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={
                    isClient
                      ? "Search your return"
                      : "Search fields, documents, warnings…"
                  }
                  className="pl-9"
                />
              </div>
              <Badge variant="outline" className="w-fit shrink-0 tabular-nums">
                {visibleItems.length} shown
              </Badge>
            </div>
            <ToggleGroup
              type="single"
              value={filter}
              onValueChange={(value) =>
                value && setFilter(value as ComplexityFilter)
              }
              variant="outline"
              size="sm"
              aria-label="Filter Return work"
              className="max-w-full overflow-x-auto"
            >
              {FILTERS.map((option) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  className="text-xs data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground"
                >
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="grid min-w-0 xl:grid-cols-[minmax(17rem,0.95fr)_minmax(15rem,1.05fr)]">
            <div className="flex min-w-0 flex-col border-b border-border xl:border-r xl:border-b-0">
              <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <p className="text-xs text-muted-foreground">
                  {query || filter !== "all" || sectionId !== "all"
                    ? "Matching work"
                    : "Start with a summary, then open the detail you need."}
                </p>
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {visibleItems.length} results
                </span>
              </div>
              {visibleItems.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-5 py-8 text-center">
                  <Search
                    aria-hidden="true"
                    className="size-6 text-muted-foreground/60"
                  />
                  <p className="text-sm font-medium">
                    No work matches that view
                  </p>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    Try a broader search or clear one of the filters.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setQuery("");
                      setFilter("all");
                      setSectionId(ALL_SECTIONS);
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <ul className="max-h-96 overflow-y-auto border-t border-border">
                  {renderedItems.map((item) => (
                    <ComplexityItemRow
                      key={item.id}
                      item={item}
                      selected={item.id === selectedItem?.id}
                      onSelect={() => {
                        // A Field row is a browse, not an inspection: select it in
                        // the detail pane and drop any object focus so the local
                        // selection wins. The Provenance dialog is opened by the
                        // explicit paths — "Open field evidence" in the pane, the
                        // Return's field rows, and the Review Queue.
                        const isField =
                          Boolean(item.fieldId) ||
                          item.connectionTarget?.kind === "field";
                        if (isField) {
                          setLocalFocusId(item.id);
                          setFocus(null);
                          return;
                        }
                        const target = item.connectionTarget ?? null;
                        setLocalFocusId(target ? null : item.id);
                        setFocus(target);
                      }}
                    />
                  ))}
                  {visibleItems.length > MAX_VISIBLE_ROWS && (
                    <li className="border-t border-border px-4 py-3 text-center text-xs text-muted-foreground">
                      Showing {renderedItems.length} of {visibleItems.length}.
                      Search or choose a work area to narrow the list.
                    </li>
                  )}
                </ul>
              )}
            </div>

            <ComplexityDetail
              item={selectedItem}
              taxReturn={taxReturn}
              viewerFamily={viewerFamily}
              onInspectField={onInspectField}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ComplexityItemRow({
  item,
  selected,
  onSelect,
}: {
  item: ComplexityItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const config = KIND_CONFIG[item.kind];
  const Icon = config.icon;

  return (
    <li className="border-b border-border last:border-b-0">
      <Button
        type="button"
        variant="ghost"
        aria-current={selected ? "true" : undefined}
        onClick={onSelect}
        className={cn(
          "h-auto w-full items-start justify-start gap-3 rounded-none px-4 py-3 text-left whitespace-normal sm:px-5",
          selected && "bg-accent",
        )}
      >
        <Icon
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-primary"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {item.title}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {item.summary}
          </span>
        </span>
        <Badge
          className={cn("shrink-0 text-[10px]", STATUS_CLASS[item.status])}
        >
          {complexityStatusLabel(item.status)}
        </Badge>
        <ChevronRight
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        />
      </Button>
    </li>
  );
}

function ComplexityDetail({
  item,
  taxReturn,
  viewerFamily,
  onInspectField,
}: {
  item?: ComplexityItem;
  taxReturn: Return;
  viewerFamily: RoleFamily;
  onInspectField?: (fieldId: string) => void;
}) {
  if (!item) {
    return (
      <aside className="flex min-h-48 flex-col items-center justify-center gap-2 px-5 py-8 text-center">
        <Layers3
          aria-hidden="true"
          className="size-6 text-muted-foreground/60"
        />
        <p className="text-sm font-medium">Choose a result to see more</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          The detail pane keeps the list and your place visible while you work.
        </p>
      </aside>
    );
  }

  const config = KIND_CONFIG[item.kind];
  const Icon = config.icon;
  // A Client navigator never surfaces a Connection to an internal-only Thread.
  const threads = threadsVisibleTo(
    getThreadsForReturn(taxReturn.id),
    viewerFamily,
  );
  const target = item.connectionTarget;
  // The heading's focus identity — what a Connection-follow would target. Only
  // real objects carry one; synthetic items get no focus attributes.
  const focusIdentity =
    target ??
    (item.fieldId ? ({ kind: "field", id: item.fieldId } as const) : null);
  const connections = target
    ? connectionsFor(target, taxReturn, threads, viewerFamily)
    : [];
  // A real Source Document renders its actual scanned page — the first Field
  // source that references it, so the extracted region comes up highlighted.
  const documentId = target?.kind === "source-document" ? target.id : undefined;
  const documentSource = documentId
    ? taxReturn.sections
        .flatMap((section) => section.fields)
        .flatMap((field) => field.sources ?? [])
        .find((source) => source.documentId === documentId)
    : undefined;
  const canOpenField =
    viewerFamily === "firm" && item.fieldId && onInspectField;

  return (
    <aside
      aria-label="Selected work detail"
      className="flex min-w-0 flex-col gap-4 bg-background px-5 py-5 sm:px-6"
    >
      <div className="flex items-start justify-between gap-3">
        <Badge variant="outline" className="gap-1">
          <Icon aria-hidden="true" />
          {config.label}
        </Badge>
        <Badge className={cn(STATUS_CLASS[item.status])}>
          {complexityStatusLabel(item.status)}
        </Badge>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">
          Return map <span aria-hidden="true">/</span> {item.sectionTitle}
        </p>
        <h3
          tabIndex={-1}
          data-return-focus={focusIdentity?.id}
          data-return-focus-kind={focusIdentity?.kind}
          className="font-serif text-lg font-semibold tracking-tight outline-none"
        >
          {item.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
      </div>
      {documentSource && (
        <DocumentPane
          key={`${documentSource.documentId}-${documentSource.page}-${documentSource.region}`}
          source={documentSource}
        />
      )}
      <div className="rounded-md border border-border bg-card px-3 py-3 text-sm leading-relaxed text-muted-foreground">
        {item.detail}
      </div>
      {item.sourceDocument && !documentSource && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <FileText
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0 text-primary"
          />
          <span>
            Source Document:{" "}
            <span className="font-medium text-foreground">
              {item.sourceDocument}
            </span>
          </span>
        </div>
      )}
      {item.connectedFields && item.connectedFields.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Connected Fields
          </p>
          <ul className="flex flex-col gap-1">
            {item.connectedFields.map((label) => (
              <li key={label} className="flex items-center gap-2 text-xs">
                <ListFilter
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-primary"
                />
                {label}
              </li>
            ))}
          </ul>
        </div>
      )}
      {connections.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Connected on this Return
          </p>
          <ul className="flex flex-col gap-1 text-xs">
            {connections.map((connection) => (
              <li key={connection.id}>
                <ConnectionLink connection={connection} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {item.suggestedResolution && (
        <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs text-warning">
          <p className="mb-1 flex items-center gap-1.5 font-medium">
            <AlertTriangle aria-hidden="true" className="size-3.5 shrink-0" />
            Suggested resolution
          </p>
          <p className="text-warning/90">{item.suggestedResolution}</p>
        </div>
      )}
      {canOpenField && (
        <Button
          type="button"
          size="sm"
          onClick={() => onInspectField(item.fieldId!)}
          className="w-fit"
        >
          Open field evidence
          <ChevronRight aria-hidden="true" />
        </Button>
      )}
      {item.kind === "source-document" &&
        !item.simulated &&
        !documentSource && (
          <p className="flex items-start gap-2 text-xs text-primary">
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 size-3.5 shrink-0"
            />
            Source-level context stays one click away from the review summary.
          </p>
        )}
      {item.simulated && (
        <p className="flex items-start gap-2 text-[11px] text-muted-foreground">
          <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          Simulated at volume — one of hundreds of generated items that keep the
          map realistic to search, filter, and navigate.
        </p>
      )}
    </aside>
  );
}
