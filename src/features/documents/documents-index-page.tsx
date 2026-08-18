import * as React from "react";
import { Navigate } from "react-router";
import { Upload } from "lucide-react";

import { GreetingHeader } from "@/components/layout/greeting-header";
import { InternalLayout } from "@/components/layout/internal-layout";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DOCUMENTS_DEFAULT_SORTING,
  documentsColumns,
} from "@/features/documents/documents-columns";
import { collectFirmDocuments } from "@/features/documents/pooled-documents";
import { useRole } from "@/hooks/use-role";
import { RETURNS } from "@/mocks/returns";

/**
 * The firm-wide Documents pool (`/documents`, Issue #21) — every Source Document
 * across every Return in one sortable, paginated table, the pooled counterpart to
 * a Return's per-Return Documents Area. Firm-only: a Client has exactly one Return
 * and no firm pool, so this bounces them home (like the `/returns` roster).
 */
export function DocumentsIndexPage() {
  const { roleConfig, user } = useRole();
  const rows = React.useMemo(() => collectFirmDocuments(RETURNS), []);

  if (roleConfig.family !== "firm") {
    return <Navigate to="/" replace />;
  }

  return (
    <InternalLayout title="Documents">
      <div className="flex flex-col gap-6">
        <GreetingHeader
          name={user.name.split(" ")[0]}
          action={
            <Button type="button" size="sm">
              <Upload aria-hidden="true" />
              Upload document
            </Button>
          }
        />

        {/* The page h1 ("Documents") lives in the shell header; this is the lead-in. */}
        <p className="text-sm text-muted-foreground">
          {rows.length} Source Document{rows.length === 1 ? "" : "s"} across
          your book, pooled from every Return. Open one to see it in its Return.
        </p>

        {rows.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <DataTable
              columns={documentsColumns}
              data={rows}
              initialSorting={DOCUMENTS_DEFAULT_SORTING}
            />
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground shadow-sm">
            No Source Documents uploaded across your book yet.
          </div>
        )}
      </div>
    </InternalLayout>
  );
}
