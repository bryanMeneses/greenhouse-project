/**
 * The Preparer's time-of-day greeting shown on the top-level firm surfaces
 * (Command center, Returns roster, Documents pool). Two parts vary by the wall
 * clock: a salutation ("Good morning") and a friendlier one-line message. Both are
 * pure functions of a `Date` so a caller can inject a fixed time in tests; the live
 * surfaces pass the real `new Date()`, so the greeting actually tracks the hour.
 */

export type TimeOfDay = "morning" | "afternoon" | "evening" | "late-night";

/** Which part of the day an hour falls in. Late-night wraps past midnight (22:00–04:59). */
export function timeOfDay(now: Date): TimeOfDay {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "late-night";
}

type GreetingCopy = {
  /** Read with ", {name}." appended — keep each phrase grammatical that way. */
  salutations: string[];
  messages: string[];
};

const GREETINGS: Record<TimeOfDay, GreetingCopy> = {
  morning: {
    salutations: ["Good morning"],
    messages: [
      "Fresh cup, fresh queue — let's get after it.",
      "A new day on the book. Here's where things stand.",
      "The early return catches the refund.",
      "Morning. Nothing's on fire — let's keep it that way.",
    ],
  },
  afternoon: {
    salutations: ["Good afternoon"],
    messages: [
      "Hope the day's treating you well.",
      "Halfway through — here's the state of play.",
      "Post-lunch focus mode: engaged.",
      "Steady progress. Here's what's still on your plate.",
    ],
  },
  evening: {
    salutations: ["Good evening"],
    messages: [
      "Winding down — a look at where things landed.",
      "Good time to tie off a few loose ends.",
      "The book, as the day wraps up.",
      "Almost there. Here's what's still open.",
    ],
  },
  "late-night": {
    salutations: ["Burning the midnight oil", "Still up", "Working late"],
    messages: [
      "The returns will still be here tomorrow, you know.",
      "Nothing files itself — but rest counts as productivity too.",
      "Quiet hours. Just you, the queue, and questionable snack choices.",
      "The deadlines admire your dedication. Maybe get some sleep?",
      "It's late. Future-you would love a good night's rest.",
    ],
  },
};

/**
 * Deterministically pick one item for a given minute, so the greeting stays stable
 * within a minute (no flicker on re-render) yet rotates through the options over
 * time. Salutations and messages are offset so they don't lock-step.
 */
function pick(items: string[], now: Date, offset = 0): string {
  const minutes = now.getHours() * 60 + now.getMinutes();
  return items[(minutes + offset) % items.length];
}

/** The salutation for the hour — e.g. "Good morning", or a quirky late-night one. */
export function greetingSalutation(now: Date): string {
  return pick(GREETINGS[timeOfDay(now)].salutations, now);
}

/** A friendly (quirky when it's very late) one-liner for the hour. */
export function greetingMessage(now: Date): string {
  return pick(GREETINGS[timeOfDay(now)].messages, now, 1);
}
