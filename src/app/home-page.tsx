import { useRoleFamily } from "@/hooks/use-role";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { ReturnStatusPage } from "@/features/returns/client-view/return-status-page";

/**
 * The landing route (`/`), branched by Role (ADR-0005). One shared path: this is
 * only a switch — a Firm Role gets {@link DashboardPage} (CPA dashboard in the
 * internal shell), a Client Role gets {@link ReturnStatusPage} (their return in
 * the client shell). The active Role lives in context, not the URL, so the route
 * stays the same and only which arm — page + layout — renders here changes.
 */
export function HomePage() {
  const family = useRoleFamily();
  return family === "client" ? <ReturnStatusPage /> : <DashboardPage />;
}
