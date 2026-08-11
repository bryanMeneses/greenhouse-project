import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";

import { ClientLayout } from "@/components/layout/client-layout";
import { InternalLayout } from "@/components/layout/internal-layout";
import { ReturnReview } from "@/features/returns/review/components/return-review";
import { CollaborationSection } from "@/features/returns/shared/collaboration-section";
import { getReturn } from "@/mocks/returns";
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
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <BackToDashboard />
        {/* key resets the review's local state when switching Returns. */}
        <ReturnReview key={taxReturn.id} return={taxReturn} />
        <CollaborationSection
          key={`collab-${taxReturn.id}`}
          taxReturn={taxReturn}
          viewerFamily={roleConfig.family}
          viewer={{ role, name: user.name }}
        />
      </div>
    </InternalLayout>
  );
}
