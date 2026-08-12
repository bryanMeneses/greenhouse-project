import type { RoleFamily } from "@/lib/roles";

/** The kinds of work a Return can contain in the navigable review map. */
export type ComplexityItemKind =
  | "field"
  | "source-document"
  | "open-item"
  | "thread"
  | "calculation"
  | "warning";

/** A deliberately small state vocabulary shared by firm and client summaries. */
export type ComplexityItemStatus =
  "needs-review" | "waiting" | "verified" | "ready";

/** One searchable item in the Return's generated review map. */
export type ComplexityItem = {
  id: string;
  kind: ComplexityItemKind;
  title: string;
  summary: string;
  detail: string;
  sectionId: string;
  sectionTitle: string;
  status: ComplexityItemStatus;
  /** A real Field id opens the existing Provenance workflow. */
  fieldId?: string;
  /** A real Source Document title keeps source-level detail concrete. */
  sourceDocument?: string;
  /** For a Source Document: the Field labels it feeds, shown in the detail pane. */
  connectedFields?: string[];
  /** For a Warning: the next action that would clear it. */
  suggestedResolution?: string;
  /** True for the generated volume items, so the UI can label them honestly. */
  simulated?: boolean;
  /** Search terms that are not necessarily displayed. */
  tags: string[];
  /** Firm-only items never cross into a Client Role view. */
  audience: RoleFamily | "shared";
};

/** The filter controls shown above the item list. */
export type ComplexityFilter = "all" | ComplexityItemStatus;

/** The hierarchy rail's "no section chosen" sentinel, named so it isn't a bare "all". */
export const ALL_SECTIONS = "all";

/** A stable, human-readable section summary for the hierarchy rail. */
export type ComplexitySection = {
  id: string;
  title: string;
  count: number;
};

/**
 * Filter a generated review map without changing its order. Search is intentionally
 * broad: a Preparer can search by label, document, section, warning, or hidden tags.
 */
export function filterComplexityItems(
  items: ComplexityItem[],
  query: string,
  filter: ComplexityFilter = "all",
  sectionId: string = ALL_SECTIONS,
): ComplexityItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return items.filter((item) => {
    const matchesSection =
      sectionId === ALL_SECTIONS || item.sectionId === sectionId;
    const matchesFilter = filter === "all" || item.status === filter;
    if (!matchesSection || !matchesFilter) return false;
    if (!normalizedQuery) return true;

    const searchable = [
      item.title,
      item.summary,
      item.detail,
      item.sectionTitle,
      item.sourceDocument ?? "",
      ...item.tags,
    ]
      .join(" ")
      .toLocaleLowerCase();

    return searchable.includes(normalizedQuery);
  });
}

/** Group the currently visible items into the section rail, preserving item order. */
export function summarizeComplexitySections(
  items: ComplexityItem[],
): ComplexitySection[] {
  const counts = new Map<string, ComplexitySection>();
  for (const item of items) {
    const existing = counts.get(item.sectionId);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(item.sectionId, {
        id: item.sectionId,
        title: item.sectionTitle,
        count: 1,
      });
    }
  }
  return [...counts.values()];
}

/** The status label used by both audience presentations. */
export function complexityStatusLabel(status: ComplexityItemStatus): string {
  switch (status) {
    case "needs-review":
      return "Needs review";
    case "waiting":
      return "Waiting";
    case "verified":
      return "Verified";
    case "ready":
      return "Ready";
  }
}
