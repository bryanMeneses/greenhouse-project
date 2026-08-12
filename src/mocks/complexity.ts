import type { RoleFamily } from "@/lib/roles";
import { getThreadsForReturn } from "@/mocks/collaboration";
import { sourceDocumentTitle } from "@/mocks/documents";
import type {
  ComplexityItem,
  ComplexityItemStatus,
} from "@/features/returns/shared/complexity";
import type { Field, Return } from "@/features/returns/shared/returns";
import { isOpenItemActive } from "@/features/returns/shared/returns";

const SYNTHETIC_SECTIONS = [
  {
    id: "supporting-documents",
    title: "Supporting documents",
    kind: "source-document" as const,
    count: 164,
    prefix: "Bank statement",
    status: "verified" as ComplexityItemStatus,
    detail: "A supporting document staged for source-level review.",
  },
  {
    id: "calculations",
    title: "Calculations",
    kind: "calculation" as const,
    count: 42,
    prefix: "Schedule calculation",
    status: "needs-review" as ComplexityItemStatus,
    detail: "A calculated value with inputs available in the source trail.",
  },
  {
    id: "warnings",
    title: "Warnings",
    kind: "warning" as const,
    count: 28,
    prefix: "Review warning",
    status: "waiting" as ComplexityItemStatus,
    detail: "A simulated warning that may need a preparer's decision.",
    resolution:
      "Compare the flagged value to its source document, then accept it or enter a correction. Resolving clears the warning from the return.",
  },
] as const;

function fieldStatus(field: Field): ComplexityItemStatus {
  if (field.state === "verified" || field.state === "locked") return "verified";
  if (field.state === "needs-approval" || field.state === "ai-suggested") {
    return "needs-review";
  }
  return "ready";
}

function fieldDetail(field: Field): string {
  if (field.sources?.length) {
    return `${field.sources.length} source contribution${field.sources.length === 1 ? "" : "s"} available. Open the field review to see the calculation and highlighted document region.`;
  }
  if (field.lockedReason) return field.lockedReason;
  return "Entered directly by the firm and ready for review.";
}

function realFieldItems(taxReturn: Return): ComplexityItem[] {
  return taxReturn.sections.flatMap((section) =>
    section.fields.map((field) => ({
      id: `field-${field.id}`,
      kind: "field" as const,
      title: field.label,
      summary: field.sourceDocument,
      detail: fieldDetail(field),
      sectionId: section.id,
      sectionTitle: section.title,
      status: fieldStatus(field),
      fieldId: field.id,
      sourceDocument: field.sourceDocument,
      tags: [
        field.label,
        field.sourceDocument,
        field.state,
        ...(field.sources ?? []).map((source) =>
          sourceDocumentTitle(source.documentId),
        ),
      ],
      audience: "firm" as const,
    })),
  );
}

/** Map each Source Document to its title and the Field labels it feeds. */
function collectSourceDocuments(
  taxReturn: Return,
): Map<string, { title: string; fieldLabels: string[] }> {
  const documents = new Map<string, { title: string; fieldLabels: string[] }>();
  for (const field of taxReturn.sections.flatMap((section) => section.fields)) {
    for (const source of field.sources ?? []) {
      const existing = documents.get(source.documentId);
      if (existing) existing.fieldLabels.push(field.label);
      else
        documents.set(source.documentId, {
          title: sourceDocumentTitle(source.documentId),
          fieldLabels: [field.label],
        });
    }
  }
  return documents;
}

function sourceDocumentItems(taxReturn: Return): ComplexityItem[] {
  return [...collectSourceDocuments(taxReturn).entries()].map(([documentId, document]) => ({
    id: `document-${documentId}`,
    kind: "source-document" as const,
    title: document.title,
    summary: `${document.fieldLabels.length} connected Field${document.fieldLabels.length === 1 ? "" : "s"}`,
    detail:
      "Source-level detail is available without leaving the Return. Choose a connected Field to inspect the highlighted page region.",
    sectionId: "supporting-documents",
    sectionTitle: "Supporting documents",
    status: "verified" as const,
    sourceDocument: document.title,
    connectedFields: document.fieldLabels,
    tags: [document.title, documentId, ...document.fieldLabels],
    audience: "firm" as const,
  }));
}

function openItemItems(taxReturn: Return): ComplexityItem[] {
  return taxReturn.openItems.filter(isOpenItemActive).map((item) => ({
    id: `open-item-${item.id}`,
    kind: "open-item" as const,
    title: item.label,
    summary: item.owner === "client" ? "Waiting on client" : "Your action",
    detail:
      item.owner === "client"
        ? "This Open Item is a Request owned by the Client. It is the next action holding the Return here."
        : "This Open Item is owned by the Preparer and can be cleared from the Return workspace.",
    sectionId: "questions",
    sectionTitle: "Questions & messages",
    status: item.owner === "client" ? "waiting" : "needs-review",
    tags: [item.label, item.owner, "open item", "request"],
    audience: "firm" as const,
  }));
}

function messageItems(taxReturn: Return): ComplexityItem[] {
  return getThreadsForReturn(taxReturn.id).map((thread) => ({
    id: `thread-${thread.id}`,
    kind: "thread" as const,
    title: thread.title,
    summary: `${thread.messages.length} message${thread.messages.length === 1 ? "" : "s"}`,
    detail:
      "This Thread stays attached to its Return Subject. Open Collaboration when the conversation needs a full read.",
    sectionId: "questions",
    sectionTitle: "Questions & messages",
    status: "ready" as const,
    tags: [thread.title, "message", "thread"],
    audience: "firm" as const,
  }));
}

function syntheticItems(): ComplexityItem[] {
  return SYNTHETIC_SECTIONS.flatMap((section) =>
    Array.from({ length: section.count }, (_, index) => {
      // Documents show which Fields they feed; warnings show how to clear them.
      const connectedFields =
        section.kind === "source-document"
          ? index % 2 === 0
            ? ["Interest income (1099-INT)", "Account holder identity"]
            : ["Itemized deductions", "Account holder identity"]
          : undefined;
      const suggestedResolution =
        section.kind === "warning" ? section.resolution : undefined;

      return {
        id: `${section.id}-${index + 1}`,
        kind: section.kind,
        title: `${section.prefix} ${String(index + 1).padStart(3, "0")}`,
        summary:
          section.kind === "source-document"
            ? `Page ${(index % 4) + 1} · linked to ${index % 2 === 0 ? "Income" : "Deductions"}`
            : `Generated review item ${index + 1} of ${section.count}`,
        detail: section.detail,
        sectionId: section.id,
        sectionTitle: section.title,
        // Keep the large seed varied so the controls have meaningful results.
        status:
          index % 11 === 0
            ? "needs-review"
            : index % 7 === 0
              ? "waiting"
              : section.status,
        // Fold the displayed strings into tags so search reaches them at volume.
        tags: [
          section.title,
          section.kind,
          index % 2 === 0 ? "client data" : "firm review",
          `page ${(index % 4) + 1}`,
          ...(connectedFields ?? []),
          ...(suggestedResolution ? [suggestedResolution] : []),
        ],
        connectedFields,
        suggestedResolution,
        // The generated volume is labeled honestly rather than posing as live data.
        simulated: true,
        audience: "firm" as const,
      };
    }),
  );
}

/**
 * Build the firm-side map. It deliberately contains hundreds of deterministic
 * items, while real Fields/Documents/Open Items remain connected to the existing
 * Return so the large view is not a disconnected mock screen.
 */
export function buildFirmComplexityItems(taxReturn: Return): ComplexityItem[] {
  return [
    ...realFieldItems(taxReturn),
    ...sourceDocumentItems(taxReturn),
    ...openItemItems(taxReturn),
    ...messageItems(taxReturn),
    ...syntheticItems(),
  ];
}

function buildClientComplexityItems(taxReturn: Return): ComplexityItem[] {
  const documentItems: ComplexityItem[] = [
    ...collectSourceDocuments(taxReturn).entries(),
  ].map(
    ([documentId, { title }]) => ({
      id: `client-document-${documentId}`,
      kind: "source-document" as const,
      title: title.replace(/\s*\([^)]*\)/, ""),
      summary: "Received from you",
      detail:
        "Your preparer can use this document as evidence for your Return.",
      sectionId: "your-documents",
      sectionTitle: "Your documents",
      status: "verified" as const,
      sourceDocument: title,
      tags: [title, documentId, "document", "received"],
      audience: "client" as const,
    }),
  );

  const requestItems: ComplexityItem[] = taxReturn.openItems
    .filter((item) => item.owner === "client" && isOpenItemActive(item))
    .map((item) => ({
      id: `client-request-${item.id}`,
      kind: "open-item" as const,
      title: item.label,
      summary: "Needs your attention",
      detail:
        "Completing this item helps your preparer keep the Return moving.",
      sectionId: "your-next-steps",
      sectionTitle: "Your next steps",
      status: "waiting" as const,
      tags: [item.label, "your next step", "request"],
      audience: "client" as const,
    }));

  return [
    ...requestItems,
    ...documentItems,
    {
      id: "client-review-progress",
      kind: "thread" as const,
      title: "Your preparer is reviewing your Return",
      summary: "In progress",
      detail: "We will let you know here if anything else is needed from you.",
      sectionId: "your-next-steps",
      sectionTitle: "Your next steps",
      status: "ready" as const,
      tags: ["preparer", "review", "progress"],
      audience: "client" as const,
    },
  ];
}

/** Return the audience-appropriate review map for the same Return. */
export function getComplexityItems(
  taxReturn: Return,
  family: RoleFamily,
): ComplexityItem[] {
  return family === "firm"
    ? buildFirmComplexityItems(taxReturn)
    : buildClientComplexityItems(taxReturn);
}
