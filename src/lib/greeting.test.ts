import { describe, it, expect } from "vitest";

import { timeOfDay, greetingSalutation, greetingMessage } from "./greeting";

/** A Date at a given hour (minutes fixed) on a stable day. */
function at(hour: number, minute = 0): Date {
  return new Date(2026, 7, 14, hour, minute);
}

describe("timeOfDay", () => {
  it("buckets the hour, wrapping late-night past midnight", () => {
    expect(timeOfDay(at(3))).toBe("late-night");
    expect(timeOfDay(at(5))).toBe("morning");
    expect(timeOfDay(at(11))).toBe("morning");
    expect(timeOfDay(at(12))).toBe("afternoon");
    expect(timeOfDay(at(16))).toBe("afternoon");
    expect(timeOfDay(at(17))).toBe("evening");
    expect(timeOfDay(at(21))).toBe("evening");
    expect(timeOfDay(at(22))).toBe("late-night");
    expect(timeOfDay(at(0))).toBe("late-night");
  });
});

describe("greetingSalutation", () => {
  it("names the part of the day", () => {
    expect(greetingSalutation(at(9))).toBe("Good morning");
    expect(greetingSalutation(at(14))).toBe("Good afternoon");
    expect(greetingSalutation(at(19))).toBe("Good evening");
  });

  it("uses a quirky salutation late at night", () => {
    expect(["Burning the midnight oil", "Still up", "Working late"]).toContain(
      greetingSalutation(at(2, 30)),
    );
  });

  it("is stable for a given minute (no re-render flicker)", () => {
    expect(greetingSalutation(at(2, 30))).toBe(greetingSalutation(at(2, 30)));
  });
});

describe("greetingMessage", () => {
  it("returns a non-empty friendly line for every hour of the day", () => {
    for (let hour = 0; hour < 24; hour++) {
      expect(greetingMessage(at(hour, 15)).length).toBeGreaterThan(0);
    }
  });
});
