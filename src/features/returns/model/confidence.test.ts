import { describe, it, expect } from "vitest";

import { bandForConfidence, formatConfidence } from "./confidence";

describe("bandForConfidence", () => {
  it("is High at and above 0.90", () => {
    expect(bandForConfidence(0.9)).toBe("high");
    expect(bandForConfidence(0.97)).toBe("high");
    expect(bandForConfidence(1)).toBe("high");
  });

  it("is Medium from 0.70 up to (but not including) 0.90", () => {
    expect(bandForConfidence(0.7)).toBe("medium");
    expect(bandForConfidence(0.8)).toBe("medium");
    // Just below the High cutoff.
    expect(bandForConfidence(0.8999)).toBe("medium");
  });

  it("is Low below 0.70", () => {
    // Just below the Medium cutoff.
    expect(bandForConfidence(0.6999)).toBe("low");
    expect(bandForConfidence(0.5)).toBe("low");
    expect(bandForConfidence(0)).toBe("low");
  });
});

describe("formatConfidence", () => {
  it("renders the exact percentage, rounded to a whole number", () => {
    expect(formatConfidence(0.9)).toBe("90%");
    expect(formatConfidence(0.586)).toBe("59%");
    expect(formatConfidence(1)).toBe("100%");
  });
});
