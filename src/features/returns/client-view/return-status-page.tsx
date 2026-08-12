import * as React from "react";

import { ClientLayout } from "@/components/layout/client-layout";
import { ClientOnboarding } from "@/features/returns/client-view/components/client-onboarding";
import { ReturnStatus } from "@/features/returns/client-view/components/return-status";
import { fulfillRequest } from "@/features/returns/shared/collaboration";
import { CollaborationSection } from "@/features/returns/shared/collaboration-section";
import type { ClientOnboardingItem } from "@/features/returns/client-view/onboarding";
import { useRole } from "@/hooks/use-role";
import { getReturn } from "@/mocks/returns";
import { getClientOnboarding } from "@/mocks/onboarding";

/**
 * First-run completion is intentionally session-only so the prototype can be
 * replayed after a reload. The shared mock Return is never mutated.
 */
function useOnboardingComplete(): [boolean, () => void] {
  const [complete, setComplete] = React.useState(false);

  return [complete, () => setComplete(true)];
}

/**
 * The Client arm of `/` (ADR-0005): the client's own Return, in the client shell.
 * A thin page that loads this User's Return and drops the read-only status view
 * into the layout. Mirrors {@link import("@/features/dashboard/dashboard-page").DashboardPage}.
 */
export function ReturnStatusPage() {
  const { user, role, roleConfig } = useRole();
  const taxReturn = user.clientReturnId
    ? getReturn(user.clientReturnId)
    : undefined;
  const onboarding = taxReturn ? getClientOnboarding(taxReturn.id) : undefined;
  const [onboardingComplete, completeOnboarding] = useOnboardingComplete();
  const [fulfilledRequestIds, setFulfilledRequestIds] = React.useState<
    string[]
  >([]);
  // Request fulfillment is also session-only; the mock Preparer data is never mutated.
  const completedOnboardingRequestIds = new Set(
    onboardingComplete
      ? (onboarding?.items ?? [])
          .filter((item) => item.requestId)
          .map((item) => item.requestId!)
      : [],
  );
  const effectiveFulfilledRequestIds = new Set([
    ...completedOnboardingRequestIds,
    ...fulfilledRequestIds,
  ]);
  const displayReturn = taxReturn
    ? {
        ...taxReturn,
        openItems: taxReturn.openItems.map((item) =>
          effectiveFulfilledRequestIds.has(item.id)
            ? fulfillRequest(item)
            : item,
        ),
      }
    : undefined;
  const isFirstRun = Boolean(onboarding && !onboardingComplete);

  function handleActionComplete(item: ClientOnboardingItem) {
    if (item.requestId) {
      setFulfilledRequestIds((current) =>
        current.includes(item.requestId!)
          ? current
          : [...current, item.requestId!],
      );
    }
  }

  return (
    <ClientLayout title="Your return" firstRun={isFirstRun}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {isFirstRun && onboarding && (
          <ClientOnboarding
            seed={onboarding}
            onActionComplete={handleActionComplete}
            onComplete={completeOnboarding}
          />
        )}
        <ReturnStatus taxReturn={displayReturn} />
        {displayReturn && !isFirstRun && (
          <CollaborationSection
            taxReturn={displayReturn}
            viewerFamily={roleConfig.family}
            viewer={{ role, name: user.name }}
          />
        )}
      </div>
    </ClientLayout>
  );
}
