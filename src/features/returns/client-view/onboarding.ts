/**
 * Pure first-run logic for Challenge 03 ("Where to Start"). The onboarding view
 * deliberately works from the same client-owned Open Items (Requests) as the
 * return status and collaboration surfaces; it does not create a second task
 * system. The seeded presentation data lives in `@/mocks/onboarding`.
 */

import type { OpenItemUrgency } from "@/features/returns/shared/returns";

export type ClientOnboardingItemKind =
  "document" | "questionnaire" | "preparer-review";

export type ClientOnboardingItemState = "ready" | "in-progress" | "waiting";

export type ClientOnboardingItem = {
  id: string;
  kind: ClientOnboardingItemKind;
  title: string;
  description: string;
  state: ClientOnboardingItemState;
  /** An existing client-owned Open Item / Request, when the item has one. */
  requestId?: string;
  /** Mirrors the referenced Request's urgency, so first-run flags what's pressing. */
  urgency?: OpenItemUrgency;
  actionLabel?: string;
};

export type ClientDocumentState = "received" | "needed";

export type ClientOnboardingDocument = {
  id: string;
  title: string;
  state: ClientDocumentState;
};

export type ClientOnboardingSeed = {
  returnId: string;
  documents: ClientOnboardingDocument[];
  items: ClientOnboardingItem[];
};

/** The two kinds of items the Client can finish during first run. */
export function isClientActionItem(item: ClientOnboardingItem): boolean {
  return item.kind === "document" || item.kind === "questionnaire";
}

/**
 * Count only Client-owned first-run actions. The preparer-review item is useful
 * orientation, but is deliberately not presented as work the Client can do.
 */
export function onboardingProgress(
  items: ClientOnboardingItem[],
  completedIds: ReadonlySet<string>,
): { completed: number; total: number; isReadyToFinish: boolean } {
  const actionItems = items.filter(isClientActionItem);
  const completed = actionItems.filter((item) =>
    completedIds.has(item.id),
  ).length;

  return {
    completed,
    total: actionItems.length,
    isReadyToFinish: completed === actionItems.length,
  };
}
