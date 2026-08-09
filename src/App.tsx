import * as React from "react";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell/app-shell";
import { Dashboard } from "@/features/return-review/components/dashboard/dashboard";
import { ReturnReview } from "@/features/return-review/components/return-review/return-review";
import {
  RETURNS,
  SEED_TODAY,
  getReturn,
} from "@/features/return-review/model/returns";
import { cn } from "@/lib/utils";

/**
 * The Preparer's two surfaces, toggled by a selected Return (no router yet): the
 * ranked landing dashboard (challenge 07), and a single Return's review (challenges
 * 01 + 08 + 10). Clicking a dashboard row opens its review directly; a back control
 * returns to the dashboard.
 */
function App() {
  const [selectedReturnId, setSelectedReturnId] = React.useState<string | null>(
    null,
  );
  const selectedReturn = selectedReturnId
    ? getReturn(selectedReturnId)
    : undefined;

  if (selectedReturn) {
    return (
      <AppShell
        activeNav="Returns"
        title={`${selectedReturn.client} · ${selectedReturn.taxYear} Return`}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <button
            type="button"
            onClick={() => setSelectedReturnId(null)}
            className={cn(
              "inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors",
              "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer",
            )}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to dashboard
          </button>

          {/* key resets the review's local state when switching Returns. */}
          <ReturnReview key={selectedReturn.id} return={selectedReturn} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="Dashboard" title="Dashboard">
      <Dashboard
        returns={RETURNS}
        now={SEED_TODAY}
        onOpenReturn={setSelectedReturnId}
      />
    </AppShell>
  );
}

export default App;
