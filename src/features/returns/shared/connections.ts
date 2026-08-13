import type { Return } from "./returns";
import type { Thread } from "./collaboration";
import type { ReturnAreaId } from "./areas";
import type { RoleFamily } from "@/lib/roles";

export type ConnectionTargetKind =
  "field" | "source-document" | "thread" | "open-item" | "return";

export type ConnectionTarget = {
  kind: ConnectionTargetKind;
  id: string;
};

export type Connection = {
  id: string;
  label: string;
  relationship: string;
  target: ConnectionTarget;
  /** The Area the target lives in for this viewer; follow it via `target.id`. */
  area: ReturnAreaId;
};

export type CollectedSourceDocument = {
  id: string;
  title: string;
  fieldLabels: string[];
};

/** Collect the Source Documents represented by a Return's Field sources. */
export function collectSourceDocuments(
  taxReturn: Return,
): Map<string, CollectedSourceDocument> {
  const documents = new Map<string, CollectedSourceDocument>();
  for (const field of taxReturn.sections.flatMap((section) => section.fields)) {
    for (const source of field.sources ?? []) {
      const existing = documents.get(source.documentId);
      if (existing) {
        if (!existing.fieldLabels.includes(field.label)) {
          existing.fieldLabels.push(field.label);
        }
      } else {
        documents.set(source.documentId, {
          id: source.documentId,
          title: field.sourceDocument,
          fieldLabels: [field.label],
        });
      }
    }
  }
  return documents;
}

function allFields(taxReturn: Return) {
  return taxReturn.sections.flatMap((section) => section.fields);
}

/**
 * The one id → label resolver for Connection targets (and focused Return objects —
 * a focus is a Connection target). Shared by the resolver and the Trail, so the
 * two surfaces can never drift apart on how an object reads.
 */
export function targetLabel(
  target: ConnectionTarget,
  taxReturn: Return,
  threads: Thread[],
): string | undefined {
  switch (target.kind) {
    case "field":
      return allFields(taxReturn).find((field) => field.id === target.id)
        ?.label;
    case "source-document":
      return collectSourceDocuments(taxReturn).get(target.id)?.title;
    case "thread":
      return threads.find((thread) => thread.id === target.id)?.title;
    case "open-item":
      return taxReturn.openItems.find((item) => item.id === target.id)?.label;
    case "return":
      return taxReturn.client;
  }
}

function addConnection(
  result: Connection[],
  from: ConnectionTarget,
  target: ConnectionTarget,
  relationship: string,
  area: ReturnAreaId,
  taxReturn: Return,
  threads: Thread[],
) {
  const label = targetLabel(target, taxReturn, threads);
  if (!label) return;
  result.push({
    id: `${from.kind}:${from.id}->${target.kind}:${target.id}`,
    label,
    relationship,
    target,
    area,
  });
}

/**
 * Resolve the derived, navigable edges around one Return object. This is pure:
 * it reads only the Return and its Threads, never mutates either, and produces no
 * new domain object to persist. `family` only picks the local shell's Area id for
 * a target (the Client names its Requests surface "Tasks", the Firm "Requests").
 *
 * Audience is the caller's concern, not the resolver's: pass `threads` already
 * filtered through `threadsVisibleTo(...)`, and an internal-only Thread can never
 * surface to a Client Role. The resolver is audience-neutral by design.
 */
export function connectionsFor(
  target: ConnectionTarget,
  taxReturn: Return,
  threads: Thread[],
  family: RoleFamily = "firm",
): Connection[] {
  const result: Connection[] = [];
  const fields = allFields(taxReturn);
  const documents = collectSourceDocuments(taxReturn);
  // The one Area whose id differs by shell; every other kind maps the same.
  const openItemArea: ReturnAreaId = family === "client" ? "tasks" : "requests";

  switch (target.kind) {
    case "field": {
      const field = fields.find((candidate) => candidate.id === target.id);
      if (!field) return result;
      const documentIds = [
        ...new Set((field.sources ?? []).map((s) => s.documentId)),
      ];
      for (const documentId of documentIds) {
        addConnection(
          result,
          target,
          { kind: "source-document", id: documentId },
          "Source Document",
          "documents",
          taxReturn,
          threads,
        );
        for (const thread of threads) {
          if (
            thread.subject.kind === "source-document" &&
            thread.subject.documentId === documentId
          ) {
            addConnection(
              result,
              target,
              { kind: "thread", id: thread.id },
              "Thread about this Source Document",
              "messages",
              taxReturn,
              threads,
            );
          }
        }
      }
      return result;
    }
    case "source-document": {
      if (!documents.has(target.id)) return result;
      for (const field of fields) {
        if (
          (field.sources ?? []).some(
            (source) => source.documentId === target.id,
          )
        ) {
          addConnection(
            result,
            target,
            { kind: "field", id: field.id },
            "Field",
            "overview",
            taxReturn,
            threads,
          );
        }
      }
      for (const thread of threads) {
        if (
          thread.subject.kind === "source-document" &&
          thread.subject.documentId === target.id
        ) {
          addConnection(
            result,
            target,
            { kind: "thread", id: thread.id },
            "Thread",
            "messages",
            taxReturn,
            threads,
          );
        }
      }
      return result;
    }
    case "thread": {
      const thread = threads.find((candidate) => candidate.id === target.id);
      if (!thread) return result;
      if (thread.subject.kind === "source-document") {
        addConnection(
          result,
          target,
          { kind: "source-document", id: thread.subject.documentId },
          "Source Document",
          "documents",
          taxReturn,
          threads,
        );
      } else if (thread.subject.kind === "open-item") {
        addConnection(
          result,
          target,
          { kind: "open-item", id: thread.subject.openItemId },
          "Request",
          openItemArea,
          taxReturn,
          threads,
        );
      } else {
        addConnection(
          result,
          target,
          { kind: "return", id: taxReturn.id },
          "Return",
          "overview",
          taxReturn,
          threads,
        );
      }
      return result;
    }
    case "open-item": {
      const request = taxReturn.openItems.find((item) => item.id === target.id);
      if (!request) return result;
      for (const thread of threads) {
        if (
          thread.subject.kind === "open-item" &&
          thread.subject.openItemId === target.id
        ) {
          addConnection(
            result,
            target,
            { kind: "thread", id: thread.id },
            "Thread",
            "messages",
            taxReturn,
            threads,
          );
        }
      }
      return result;
    }
    case "return":
      return result;
  }
}
