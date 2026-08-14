import * as React from "react";
import { useNavigate } from "react-router";

import { ClientLayout } from "@/components/layout/client-layout";
import { ClientOnboarding } from "@/features/returns/client-view/components/client-onboarding";
import {
  fulfillRequest,
  threadsVisibleTo,
} from "@/features/returns/shared/collaboration";
import { Trail } from "@/features/returns/shared/trail";
import { ReturnHeader } from "@/features/returns/review/components/return-header";
import type { ClientOnboardingItem } from "@/features/returns/client-view/onboarding";
import { CLIENT_AREAS } from "@/features/returns/shared/areas";
import { ReturnAreaBody } from "@/features/returns/shared/area-body";
import { useReturnView } from "@/hooks/use-return-view";
import { useRole } from "@/hooks/use-role";
import { getReturn } from "@/mocks/returns";
import { getClientOnboarding } from "@/mocks/onboarding";
import { getThreadsForReturn } from "@/mocks/collaboration";

function useOnboardingComplete(): [boolean, () => void] {
  const [complete, setComplete] = React.useState(false);
  return [complete, () => setComplete(true)];
}

/** The Client arm of `/`, with the same Return Areas and URL-owned Trail as Firm. */
export function ReturnStatusPage() {
  const navigate = useNavigate();
  const { user, role, roleConfig } = useRole();
  const taxReturn = user.clientReturnId
    ? getReturn(user.clientReturnId)
    : undefined;
  const onboarding = taxReturn ? getClientOnboarding(taxReturn.id) : undefined;
  const [onboardingComplete, completeOnboarding] = useOnboardingComplete();
  const [fulfilledRequestIds, setFulfilledRequestIds] = React.useState<
    string[]
  >([]);
  const { area, setView } = useReturnView({
    areas: CLIENT_AREAS.map((candidate) => candidate.id),
  });

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

  const openMessages = () => {
    setView({ area: "messages", focus: null });
  };

  // Filter to what this viewer's Role family may see before any Thread reaches a
  // surface or the audience-neutral Connections resolver — the client boundary.
  const threads = displayReturn
    ? threadsVisibleTo(getThreadsForReturn(displayReturn.id), roleConfig.family)
    : [];

  return (
    <ClientLayout title="Your return" firstRun={isFirstRun}>
      <div className="flex flex-col gap-6">
        {displayReturn && (
          <>
            <ReturnHeader
              taxReturn={displayReturn}
              messageCount={0}
              onOpenMessages={openMessages}
              onBack={() => navigate(-1)}
            />
            <Trail
              taxReturn={displayReturn}
              viewerFamily={roleConfig.family}
              threads={threads}
            />
          </>
        )}
        {isFirstRun && onboarding && (
          <ClientOnboarding
            seed={onboarding}
            onActionComplete={handleActionComplete}
            onComplete={completeOnboarding}
          />
        )}
        {/* The active Area's single composed surface. During first-run only
            Overview is shown (the full contextual tier is hidden until setup is
            done); after that every Area renders its body. */}
        {displayReturn && (area === "overview" || !isFirstRun) && (
          <ReturnAreaBody
            area={area}
            taxReturn={displayReturn}
            seedReturn={taxReturn}
            viewerFamily={roleConfig.family}
            threads={threads}
            viewer={{ role, name: user.name }}
            showComplexity={!isFirstRun}
          />
        )}
      </div>
    </ClientLayout>
  );
}
