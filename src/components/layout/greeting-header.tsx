import * as React from "react";

import { greetingMessage, greetingSalutation } from "@/lib/greeting";

type GreetingHeaderProps = {
  /** The Preparer's first name; omitted in isolation/tests. */
  name?: string;
  /** The clock the greeting reads; defaults to now so it tracks the real hour. */
  now?: Date;
  /** A right-aligned action (e.g. "View all returns →" or an Upload button). */
  action?: React.ReactNode;
};

/**
 * The time-of-day greeting that leads every top-level firm surface (Command center,
 * Returns roster, Documents pool) — but not a single Return's workspace, which has
 * its own header. The page h1 lives in the shell header; this hero greeting is the
 * content's lead, so it's an h2 (one h1 per page). Salutation and message come from
 * the wall clock (`@/lib/greeting`), so the page reads differently morning vs. night.
 */
export function GreetingHeader({
  name,
  now = new Date(),
  action,
}: GreetingHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">
          {greetingSalutation(now)}
          {name ? `, ${name}.` : "."}
        </h2>
        <p className="text-sm text-muted-foreground">{greetingMessage(now)}</p>
      </div>
      {action}
    </header>
  );
}
