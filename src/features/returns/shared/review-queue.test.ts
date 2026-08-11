import { describe, it, expect } from "vitest";

import { reviewQueue } from "./review-queue";
import { getReturn } from "@/mocks/returns";
import type { Return } from "./returns";

const taxReturn = getReturn("rtn-reyes-2024")!;

describe("reviewQueue", () => {
  it("lists exactly the low-Confidence Fields on the Return", () => {
    const queue = reviewQueue(taxReturn);

    // The two seed Fields below the Medium cutoff (0.64 and 0.58).
    expect(queue.map((f) => f.id)).toEqual(["dividends", "education-credit"]);
  });

  it("excludes High- and Medium-Confidence Fields", () => {
    const queuedIds = new Set(reviewQueue(taxReturn).map((f) => f.id));

    // Medium (0.86 / 0.79) and High (0.99 / 0.97 / 0.91) Fields never queue.
    expect(queuedIds.has("interest")).toBe(false);
    expect(queuedIds.has("capital-gains")).toBe(false);
    expect(queuedIds.has("wages")).toBe(false);
  });

  it("ignores Fields with no Confidence (preparer-entered, computed)", () => {
    const queuedIds = new Set(reviewQueue(taxReturn).map((f) => f.id));

    // `salt` is editable and `child-tax-credit` is locked — neither is AI-extracted.
    expect(queuedIds.has("salt")).toBe(false);
    expect(queuedIds.has("child-tax-credit")).toBe(false);
  });

  it("is empty for a Return with no low-Confidence Fields", () => {
    const allHigh: Return = {
      ...taxReturn,
      sections: [
        {
          id: "income",
          title: "Income",
          fields: [
            {
              id: "wages",
              label: "Wages",
              value: 100,
              state: "verified",
              sourceDocument: "W-2",
              confidence: 0.95,
            },
          ],
        },
      ],
    };

    expect(reviewQueue(allHigh)).toEqual([]);
  });
});
