import { AppShell } from "@/components/layout/app-shell/app-shell";
import { Dashboard } from "@/features/dashboard/components/dashboard/dashboard";
import { RETURNS, SEED_TODAY } from "@/features/returns/model/returns";

/**
 * The landing route (`/`): wires the seed roster and reference "today" into the
 * dashboard. The dashboard's rows link to `/returns/:id`, so navigation lives in
 * the feature; this route only supplies data and the shell around it.
 */
export function DashboardRoute() {
  return (
    <AppShell title="Dashboard">
      <Dashboard returns={RETURNS} now={SEED_TODAY} />
    </AppShell>
  );
}
