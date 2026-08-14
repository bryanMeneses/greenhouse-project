import { bandForConfidence } from "./confidence";
import type { Field, Return } from "./returns";

/**
 * The Review Queue (challenge 10): exactly the low-Confidence Fields on a Return,
 * in reading order, so the Preparer can work down what the AI was least sure of
 * and nothing slips through. Fields without a Confidence (preparer-entered,
 * computed) are not AI claims and never queue.
 */
export function reviewQueue(taxReturn: Return): Field[] {
  return taxReturn.sections
    .flatMap((section) => section.fields)
    .filter(
      (field) =>
        field.confidence !== undefined &&
        bandForConfidence(field.confidence) === "low",
    );
}

/**
 * The low-Confidence Fields on a Return the Preparer still has to act on: those in
 * the Review Queue not yet verified or locked (a verified or locked Field is done).
 * The single definition the dashboard ranking, the Command Center stats, and the AI
 * review signals all read, so a Return's "needs review" count never means two things.
 */
export function lowConfidenceAwaitingReview(taxReturn: Return): Field[] {
  return reviewQueue(taxReturn).filter(
    (field) => field.state !== "verified" && field.state !== "locked",
  );
}
