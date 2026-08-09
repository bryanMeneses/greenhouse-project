import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell/app-shell";
import { ReturnReview } from "@/features/return-review/components/return-review/return-review";
import { getReturn } from "@/features/returns/model/returns";
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

/**
 * A Return's review route (`/returns/:returnId`): reads the id from the URL, loads
 * the Return, and composes the review surface with a back link. A deep link to an
 * unknown Return falls back to a graceful not-found rather than crashing.
 */
export function ReturnReviewRoute() {
  const { returnId } = useParams();
  const taxReturn = returnId ? getReturn(returnId) : undefined;

  if (!taxReturn) {
    return (
      <AppShell title="Return not found">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <BackToDashboard />
          <p className="text-sm text-muted-foreground">
            We couldn't find that Return. It may have been removed, or the link
            may be wrong.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={`${taxReturn.client} · ${taxReturn.taxYear} Return`}>
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <BackToDashboard />
        {/* key resets the review's local state when switching Returns. */}
        <ReturnReview key={taxReturn.id} return={taxReturn} />
      </div>
    </AppShell>
  );
}
