import { InternalLayout } from "@/components/layout/internal-layout";
import { Dashboard } from "@/features/dashboard/components/dashboard";
import { useRole } from "@/hooks/use-role";
import { RETURNS, SEED_TODAY } from "@/mocks/returns";

/**
 * The Firm arm of `/` (ADR-0005): the CPA Command Center, in the internal shell.
 * Wires the seed roster, reference "today", and the acting Preparer's name into the
 * dashboard. Rows and the action list deep-link into Returns, so navigation lives in the
 * feature; this page only supplies data and the layout around it.
 */
export function DashboardPage() {
  const { user } = useRole();
  const firstName = user.name.split(" ")[0];

  return (
    <InternalLayout title="Command center">
      <Dashboard returns={RETURNS} now={SEED_TODAY} greetingName={firstName} />
    </InternalLayout>
  );
}
