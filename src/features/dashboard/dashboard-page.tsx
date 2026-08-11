import { InternalLayout } from "@/components/layout/internal-layout";
import { Dashboard } from "@/features/dashboard/components/dashboard";
import { RETURNS, SEED_TODAY } from "@/mocks/returns";

/**
 * The Firm arm of `/` (ADR-0005): the CPA dashboard, in the internal shell. Wires
 * the seed roster and reference "today" into the dashboard feature. Rows link to
 * `/returns/:id`, so navigation lives in the feature; this page only supplies data
 * and the layout around it.
 */
export function DashboardPage() {
  return (
    <InternalLayout title="Dashboard">
      <Dashboard returns={RETURNS} now={SEED_TODAY} />
    </InternalLayout>
  );
}
