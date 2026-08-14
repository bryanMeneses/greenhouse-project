import { Navigate } from "react-router";

import { InternalLayout } from "@/components/layout/internal-layout";
import { ReturnsTable } from "@/features/dashboard/components/returns-table";
import {
  DASHBOARD_GROUP_CONFIG,
  DASHBOARD_GROUP_ORDER,
  rankDashboard,
} from "@/features/dashboard/ranking";
import { useRole } from "@/hooks/use-role";
import { RETURNS, SEED_TODAY } from "@/mocks/returns";

/**
 * The full Return roster (`/returns`) — the firm-wide list the Command Center's
 * "View all returns" links defer to. Grouped into the same three urgency buckets the
 * dashboard ranks by, so the two read as one system. A Client has exactly one Return
 * and no roster, so this bounces them home.
 */
export function ReturnsIndexPage() {
  const { roleConfig } = useRole();

  if (roleConfig.family !== "firm") {
    return <Navigate to="/" replace />;
  }

  const ranked = rankDashboard(RETURNS, SEED_TODAY);

  return (
    <InternalLayout title="Returns">
      <div className="flex flex-col gap-8">
        {/* The page h1 ("Returns") lives in the shell header; this is the lead-in. */}
        <p className="text-sm text-muted-foreground">
          {RETURNS.length} return{RETURNS.length === 1 ? "" : "s"} in your book,
          grouped by what needs you first.
        </p>

        {DASHBOARD_GROUP_ORDER.map((group) => {
          const groupReturns = ranked
            .filter((row) => row.group === group)
            .map((row) => row.return);
          if (groupReturns.length === 0) return null;
          const { label, description } = DASHBOARD_GROUP_CONFIG[group];

          return (
            <section key={group} className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-semibold tracking-tight">
                  {label}
                  <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">
                    {groupReturns.length}
                  </span>
                </h2>
                <p className="hidden text-xs text-muted-foreground sm:block">
                  {description}
                </p>
              </div>
              <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <ReturnsTable returns={groupReturns} now={SEED_TODAY} />
              </div>
            </section>
          );
        })}
      </div>
    </InternalLayout>
  );
}
