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
