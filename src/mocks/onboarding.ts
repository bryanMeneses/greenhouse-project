/**
 * Simulated first-run Client data for Challenge 03. The two actionable items
 * point at the existing Nguyen Return's Client-owned Open Items, so onboarding,
 * status, and collaboration all describe the same next actions.
 */
import type { ClientOnboardingSeed } from "@/features/returns/client-view/onboarding";
import { NGUYEN_1098_REQUEST_ID } from "@/mocks/returns";

const NGUYEN_RETURN_ID = "rtn-nguyen-2024";

export const NEW_CLIENT_ONBOARDING: ClientOnboardingSeed = {
  returnId: NGUYEN_RETURN_ID,
  documents: [
    {
      id: "doc-w2-acme",
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
      requestId: NGUYEN_1098_REQUEST_ID,
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
      requestId: "rtn-nguyen-2024-req-bank",
      urgency: "normal",
      actionLabel: "Confirm details",
    },
    {
      id: "onboarding-review",
      kind: "preparer-review",
      title: "Your preparer reviews the return",
      description:
        "Once your items are in, Jordan will review everything and let you know if anything else is needed.",
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
