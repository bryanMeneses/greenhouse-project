import * as React from "react";
import { Navigate } from "react-router";

import { GreetingHeader } from "@/components/layout/greeting-header";
import { InternalLayout } from "@/components/layout/internal-layout";
import { DataTable } from "@/components/ui/data-table";
import {
  MESSAGES_DEFAULT_SORTING,
  messagesColumns,
} from "@/features/messages/messages-columns";
import { collectFirmThreads } from "@/features/messages/pooled-threads";
import { useRole } from "@/hooks/use-role";
import { RETURNS } from "@/mocks/returns";

/**
 * The firm-wide Messages pool (`/messages`, Issue #23) — every Thread across every
 * Return in one sortable, paginated table, the pooled counterpart to a Return's
 * per-Return Messages Area. Firm-only: a Client has exactly one Return and reads
 * Messages there directly, so this bounces them home (like `/returns` and
 * `/documents`).
 */
export function MessagesIndexPage() {
  const { roleConfig, user } = useRole();
  const rows = React.useMemo(() => collectFirmThreads(RETURNS), []);

  if (roleConfig.family !== "firm") {
    return <Navigate to="/" replace />;
  }

  return (
    <InternalLayout title="Messages">
      <div className="flex flex-col gap-6">
        <GreetingHeader name={user.name.split(" ")[0]} />

        {/* The page h1 ("Messages") lives in the shell header; this is the lead-in. */}
        <p className="text-sm text-muted-foreground">
          {rows.length} Thread{rows.length === 1 ? "" : "s"} across your book,
          pooled from every Return. Open one to see it in its Return.
        </p>

        {rows.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <DataTable
              columns={messagesColumns}
              data={rows}
              initialSorting={MESSAGES_DEFAULT_SORTING}
            />
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground shadow-sm">
            No Threads across your book yet.
          </div>
        )}
      </div>
    </InternalLayout>
  );
}
