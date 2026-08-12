import { describe, expect, it } from "vitest";

import {
  isClientActionItem,
  onboardingProgress,
  type ClientOnboardingItem,
} from "./onboarding";

const ITEMS: ClientOnboardingItem[] = [
  {
    id: "documents",
    kind: "document",
    title: "Add documents",
    description: "Upload the missing document.",
    state: "in-progress",
  },
  {
    id: "questions",
    kind: "questionnaire",
    title: "Answer questions",
    description: "Confirm a few details.",
    state: "ready",
  },
  {
    id: "review",
    kind: "preparer-review",
    title: "Preparer review",
    description: "The preparer takes it from here.",
    state: "waiting",
  },
];

describe("Challenge 03 onboarding logic", () => {
  it("treats documents and questions as Client actions, not preparer review", () => {
    expect(ITEMS.filter(isClientActionItem)).toHaveLength(2);
    expect(isClientActionItem(ITEMS[2])).toBe(false);
  });

  it("counts only completed Client actions toward the first-run finish line", () => {
    expect(onboardingProgress(ITEMS, new Set())).toEqual({
      completed: 0,
      total: 2,
      isReadyToFinish: false,
    });
    expect(onboardingProgress(ITEMS, new Set(["documents"]))).toEqual({
      completed: 1,
      total: 2,
      isReadyToFinish: false,
    });
    expect(
      onboardingProgress(ITEMS, new Set(["documents", "questions"])),
    ).toEqual({
      completed: 2,
      total: 2,
      isReadyToFinish: true,
    });
  });
});
