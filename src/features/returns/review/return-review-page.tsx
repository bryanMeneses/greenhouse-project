import * as React from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";

import { ClientLayout } from "@/components/layout/client-layout";
import { InternalLayout } from "@/components/layout/internal-layout";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReturnReview } from "@/features/returns/review/components/return-review";
import { ReturnHeader } from "@/features/returns/review/components/return-header";
import { CollaborationSection } from "@/features/returns/shared/collaboration-section";
import { PreparerStatusBand } from "@/features/returns/shared/preparer-status-band";
import type { Return } from "@/features/returns/shared/returns";
import type { Viewer } from "@/features/returns/shared/collaboration";
import type { RoleFamily } from "@/lib/roles";
import { getReturn } from "@/mocks/returns";
import { getThreadsForReturn } from "@/mocks/collaboration";
import { useRole } from "@/hooks/use-role";
import { cn } from "@/lib/utils";

/** The "Back to dashboard" control, shared by the review and not-found states. */
function BackToDashboard() {
  return (
    <Link
      to="/"
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      Back to dashboard
    </Link>
  );
}

/** A link home, for states that shouldn't assume the visitor has a dashboard. */
function GoHome() {
  return (
    <Link
      to="/"
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      Go to home
    </Link>
  );
}

/**
 * A Return's review page (`/returns/:returnId`): reads the id from the URL, loads
 * the Return, and composes the review surface with a back link. A deep link to an
 * unknown Return falls back to a graceful not-found rather than crashing.
 *
 * The review is a Firm-only workspace (ADR-0005). A Client Role reaching it (e.g.
 * via a deep link) gets an explicit role-aware "not available" state in the client
 * shell — not a silent redirect or a bare 404 — so the permission boundary reads
 * clearly.
 */
export function ReturnReviewPage() {
  const { returnId } = useParams();
  const { user, role, roleConfig } = useRole();

  if (roleConfig.family !== "firm") {
    return (
      <ClientLayout title="Not available">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <GoHome />
          <p className="text-sm text-muted-foreground">
            The return review is a preparer workspace, so it isn't available for
            your {roleConfig.label} role.
          </p>
        </div>
      </ClientLayout>
    );
  }

  const taxReturn = returnId ? getReturn(returnId) : undefined;

  if (!taxReturn) {
    return (
      <InternalLayout title="Return not found">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <BackToDashboard />
          <p className="text-sm text-muted-foreground">
            We couldn't find that Return. It may have been removed, or the link
            may be wrong.
          </p>
        </div>
      </InternalLayout>
    );
  }

  return (
    <InternalLayout title={`${taxReturn.client} · ${taxReturn.taxYear} Return`}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <BackToDashboard />
        {/* key resets the page's tab + local state when switching Returns. */}
        <ReturnWorkspace
          key={taxReturn.id}
          taxReturn={taxReturn}
          viewerFamily={roleConfig.family}
          viewer={{ role, name: user.name }}
        />
      </div>
    </InternalLayout>
  );
}

/**
 * The firm review workspace: the Return's identity header, the persistent Shared
 * Return Status band, and a tab shell (#19). The status band stays on screen
 * across tabs — challenge 06's shared mental model is always visible — while the
 * Overview (review queue + income) and Collaboration (the inbox) swap below it.
 * The tab is controlled so the header's Messages action can jump to Collaboration;
 * both panels are force-mounted so review progress and drafts survive a tab switch.
 */
function ReturnWorkspace({
  taxReturn,
  viewerFamily,
  viewer,
}: {
  taxReturn: Return;
  viewerFamily: RoleFamily;
  viewer: Viewer;
}) {
  const [tab, setTab] = React.useState("overview");
  const collabCount = getThreadsForReturn(taxReturn.id).length;

  return (
    <>
      <ReturnHeader
        taxReturn={taxReturn}
        messageCount={collabCount}
        onOpenMessages={() => setTab("collaboration")}
      />

      <PreparerStatusBand
        taxReturn={taxReturn}
        title="Return status"
        subtitle="Where this return stands right now — the same view your client sees."
      />

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="collaboration">
            Collaboration
            {collabCount > 0 && (
              <Badge className="ml-1 min-w-5 justify-center px-1 tabular-nums">
                {collabCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          <ReturnReview return={taxReturn} />
        </TabsContent>

        <TabsContent
          value="collaboration"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          <CollaborationSection
            taxReturn={taxReturn}
            viewerFamily={viewerFamily}
            viewer={viewer}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
