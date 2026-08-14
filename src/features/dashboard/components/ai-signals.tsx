import { Link } from "react-router";
import { Sparkles } from "lucide-react";

import type { Return } from "@/features/returns/shared/returns";
import {
  reviewQueue,
  lowConfidenceAwaitingReview,
} from "@/features/returns/shared/review-queue";

/**
 * The AI's read on the book, surfaced at the landing level (challenge 10). Small,
 * derived checks — how much extraction still needs a human eye, how much has been
 * cleared — so the AI layer is visible from the first screen without pulling anyone
 * into a single Return. Reads the same Review Queue the Return surfaces do.
 */
function signals(returns: Return[]) {
  let awaiting = 0;
  let cleared = 0;
  for (const taxReturn of returns) {
    // Only Returns the AI actually flagged count here; a Return with no
    // low-Confidence Fields was never in the Review Queue to clear.
    if (reviewQueue(taxReturn).length === 0) continue;
    const pending = lowConfidenceAwaitingReview(taxReturn).length;
    awaiting += pending;
    if (pending === 0) cleared += 1;
  }
  return { awaiting, cleared };
}

export function AiSignals({ returns }: { returns: Return[] }) {
  const { awaiting, cleared } = signals(returns);

  return (
    <section
      aria-labelledby="ai-signals-title"
      className="flex flex-col gap-4 rounded-lg bg-primary p-5 text-primary-foreground shadow-sm sm:p-6"
    >
      <div className="flex items-center gap-2">
        <Sparkles aria-hidden="true" className="size-4" />
        <p className="text-xs font-semibold tracking-wide uppercase opacity-80">
          Review signals
        </p>
      </div>
      <h2 id="ai-signals-title" className="font-serif text-lg font-semibold">
        What the AI wants you to check
      </h2>

      <ul className="flex flex-col gap-3 text-sm">
        <li className="flex gap-2">
          <span
            aria-hidden="true"
            className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary-foreground/70"
          />
          <span>
            <span className="font-semibold tabular-nums">{awaiting}</span>{" "}
            extracted value{awaiting === 1 ? "" : "s"} sit below the confidence
            line and need your check.
          </span>
        </li>
        <li className="flex gap-2">
          <span
            aria-hidden="true"
            className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary-foreground/70"
          />
          <span>
            <span className="font-semibold tabular-nums">{cleared}</span> return
            {cleared === 1 ? "" : "s"} the AI flagged{" "}
            {cleared === 1 ? "is" : "are"} fully verified — every low-confidence
            value checked.
          </span>
        </li>
      </ul>

      <Link
        to="/returns"
        className="mt-auto w-fit text-sm font-medium underline-offset-4 hover:underline"
      >
        View all returns →
      </Link>
    </section>
  );
}
