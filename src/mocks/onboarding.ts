/**
 * Simulated first-run Client data for Challenge 03. The two actionable items
 * point at Jordan Avery's personal Return (`rtn-avery-2024`) and its Client-owned
 * Open Items, so onboarding, status, and the Return's own Requests all describe the
 * same next actions — and the first-run experience belongs to the taxpayer whose
 * return it is (challenge 05), not to a client Jordan preps.
 */
import type { ClientOnboardingSeed } from "@/features/returns/client-view/onboarding";
import {
  AVERY_1098_REQUEST_ID,
  AVERY_BANK_REQUEST_ID,
} from "@/mocks/returns";

const AVERY_RETURN_ID = "rtn-avery-2024";

export const NEW_CLIENT_ONBOARDING: ClientOnboardingSeed = {
  returnId: AVERY_RETURN_ID,
  documents: [
    {
      id: "doc-w2-acme-nguyen",
      title: "W-2 from Acme Corp",
      state: "received",
    },
    {
      id: "doc-1098-needed",
      title: "2024 Form 1098 from your lender",
      state: "needed",
    },
  ],
  items: [
    {
      id: "onboarding-documents",
      kind: "document",
      title: "Add your tax documents",
      description:
        "Your W-2 is in. Add the Form 1098 so your preparer can finish your mortgage-interest deduction.",
      state: "in-progress",
      requestId: AVERY_1098_REQUEST_ID,
      urgency: "high",
      actionLabel: "Upload Form 1098",
    },
    {
      id: "onboarding-questions",
      kind: "questionnaire",
      title: "Confirm a few details",
      description:
        "Answer two quick questions about your filing and direct-deposit preferences.",
      state: "ready",
      requestId: AVERY_BANK_REQUEST_ID,
      urgency: "normal",
      actionLabel: "Confirm details",
    },
    {
      id: "onboarding-review",
      kind: "preparer-review",
      title: "Your preparer reviews the return",
      description:
        "Once your items are in, Dana will review everything and let you know if anything else is needed.",
      state: "waiting",
    },
  ],
};

/** Look up a first-run Client experience by Return id. */
export function getClientOnboarding(
  returnId: string,
): ClientOnboardingSeed | undefined {
  return returnId === NEW_CLIENT_ONBOARDING.returnId
    ? NEW_CLIENT_ONBOARDING
    : undefined;
}
