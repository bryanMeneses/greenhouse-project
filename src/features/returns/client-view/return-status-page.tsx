import { ClientLayout } from "@/components/layout/client-layout";
import { ReturnStatus } from "@/features/returns/client-view/components/return-status";
import { useRole } from "@/hooks/use-role";
import { getReturn } from "@/mocks/returns";

/**
 * The Client arm of `/` (ADR-0005): the client's own Return, in the client shell.
 * A thin page that loads this User's Return and drops the read-only status view
 * into the layout. Mirrors {@link import("@/features/dashboard/dashboard-page").DashboardPage}.
 */
export function ReturnStatusPage() {
  const { user } = useRole();
  const taxReturn = user.clientReturnId
    ? getReturn(user.clientReturnId)
    : undefined;

  return (
    <ClientLayout title="Your return">
      <ReturnStatus taxReturn={taxReturn} />
    </ClientLayout>
  );
}
